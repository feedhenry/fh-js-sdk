var actAPI = require("./api_act");
var cloudAPI = require("./api_cloud");
var CryptoJS = require("../../libs/generated/crypto");
var Lawnchair = require('../../libs/generated/lawnchair');

var self = {

  // CONFIG
  defaults: {
    "sync_frequency": 10,
    // How often to synchronise data with the cloud in seconds.
    "auto_sync_local_updates": true,
    // Should local chages be syned to the cloud immediately, or should they wait for the next sync interval
    "notify_client_storage_failed": true,
    // Should a notification event be triggered when loading/saving to client storage fails
    "notify_sync_started": true,
    // Should a notification event be triggered when a sync cycle with the server has been started
    "notify_sync_complete": true,
    // Should a notification event be triggered when a sync cycle with the server has been completed
    "notify_offline_update": true,
    // Should a notification event be triggered when an attempt was made to update a record while offline
    "notify_collision_detected": true,
    // Should a notification event be triggered when an update failed due to data collision
    "notify_remote_update_failed": true,
    // Should a notification event be triggered when an update failed for a reason other than data collision
    "notify_local_update_applied": true,
    // Should a notification event be triggered when an update was applied to the local data store
    "notify_remote_update_applied": true,
    // Should a notification event be triggered when an update was applied to the remote data store
    "notify_delta_received": true,
    // Should a notification event be triggered when a delta was received from the remote data store for the dataset 
    "notify_record_delta_received": true,
    // Should a notification event be triggered when a delta was received from the remote data store for a record
    "notify_sync_failed": true,
    // Should a notification event be triggered when the sync loop failed to complete
    "do_console_log": false,
    // Should log statements be written to console.log
    "crashed_count_wait" : 10,
    // How many syncs should we check for updates on crashed in flight updates before we give up searching
    "resend_crashed_updates" : true,
    // If we have reached the crashed_count_wait limit, should we re-try sending the crashed in flight pending record
    "sync_active" : true,
    // Is the background sync with the cloud currently active
    "storage_strategy" : "html5-filesystem",
    // Storage strategy to use for Lawnchair - supported strategies are 'html5-filesystem' and 'dom'
    "file_system_quota" : 50 * 1024 * 1204,
    // Amount of space to request from the HTML5 filesystem API when running in browser
    "has_custom_sync" : null,
    //If the app has custom cloud sync function, it should be set to true. If set to false, the default mbaas sync implementation will be used. When set to null or undefined, 
    //a check will be performed to determine which implementation to use
    "icloud_backup" : false //ios only. If set to true, the file will be backed by icloud
  },

  notifications: {
    "CLIENT_STORAGE_FAILED": "client_storage_failed",
    // loading/saving to client storage failed
    "SYNC_STARTED": "sync_started",
    // A sync cycle with the server has been started
    "SYNC_COMPLETE": "sync_complete",
    // A sync cycle with the server has been completed
    "OFFLINE_UPDATE": "offline_update",
    // An attempt was made to update a record while offline
    "COLLISION_DETECTED": "collision_detected",
    //Update Failed due to data collision
    "REMOTE_UPDATE_FAILED": "remote_update_failed",
    // Update Failed for a reason other than data collision
    "REMOTE_UPDATE_APPLIED": "remote_update_applied",
    // An update was applied to the remote data store
    "LOCAL_UPDATE_APPLIED": "local_update_applied",
    // An update was applied to the local data store
    "DELTA_RECEIVED": "delta_received",
    // A delta was received from the remote data store for the dataset 
    "RECORD_DELTA_RECEIVED": "record_delta_received",
    // A delta was received from the remote data store for the record 
    "SYNC_FAILED": "sync_failed"
    // Sync loop failed to complete
  },

  datasets: {},

  // Initialise config to default values;
  config: undefined,

  //TODO: deprecate this
  notify_callback: undefined,

  notify_callback_map : {},

  init_is_called: false,

  change_history_size: 5,

  //this is used to map the temp data uid (created on client) to the real uid (created in the cloud)
  uid_map: {},

  // PUBLIC FUNCTION IMPLEMENTATIONS
  init: function(options) {
    self.consoleLog('sync - init called');

    self.config = JSON.parse(JSON.stringify(self.defaults));
    for (var i in options) {
      self.config[i] = options[i];
    }

    //prevent multiple monitors from created if init is called multiple times
    if(!self.init_is_called){
      self.init_is_called = true;
      self.datasetMonitor();
    }
  },

  notify: function(datasetId, callback) {
    if(arguments.length === 1 && typeof datasetId === 'function'){
      self.notify_callback = datasetId;
    } else {
      self.notify_callback_map[datasetId] = callback;
    }
  },

  manage: function(dataset_id, opts, query_params, meta_data, cb) {
    self.consoleLog('manage - START');

    var options = opts || {};

    var doManage = function(dataset) {
      self.consoleLog('doManage dataset :: initialised = ' + dataset.initialised + " :: " + dataset_id + ' :: ' + JSON.stringify(options));

      var datasetConfig = self.setOptions(options);

      dataset.query_params = query_params || dataset.query_params || {};
      dataset.meta_data = meta_data || dataset.meta_data || {};
      dataset.config = datasetConfig;
      dataset.syncRunning = false;
      dataset.syncPending = true;
      dataset.initialised = true;
      if(typeof dataset.meta === "undefined"){
        dataset.meta = {};
      }

      self.saveDataSet(dataset_id, function() {

        if( cb ) {
          cb();
        }
      });
    };

    // Check if the dataset is already loaded
    self.getDataSet(dataset_id, function(dataset) {
      self.consoleLog('manage - dataset already loaded');
      doManage(dataset);
    }, function(err) {
      self.consoleLog('manage - dataset not loaded... trying to load');

      // Not already loaded, try to load from local storage
      self.loadDataSet(dataset_id, function(dataset) {
          self.consoleLog('manage - dataset loaded from local storage');

          // Loading from local storage worked

          // Fire the local update event to indicate that dataset was loaded from local storage
          self.doNotify(dataset_id, null, self.notifications.LOCAL_UPDATE_APPLIED, "load");

          // Put the dataet under the management of the sync service
          doManage(dataset);
        },
        function(err) {
          // No dataset in memory or local storage - create a new one and put it in memory
          self.consoleLog('manage - Creating new dataset for id ' + dataset_id);
          var dataset = {};
          dataset.data = {};
          dataset.pending = {};
          dataset.meta = {};
          self.datasets[dataset_id] = dataset;
          doManage(dataset);
        });
    });
  },

  setOptions: function(options) {
    // Make sure config is initialised
    if( ! self.config ) {
      self.config = JSON.parse(JSON.stringify(self.defaults));
    }

    var datasetConfig = JSON.parse(JSON.stringify(self.config));
    var optionsIn = JSON.parse(JSON.stringify(options));
    for (var k in optionsIn) {
      datasetConfig[k] = optionsIn[k];
    }

    return datasetConfig;
  },

  list: function(dataset_id, success, failure) {
    self.getDataSet(dataset_id, function(dataset) {
      if (dataset && dataset.data) {
        // Return a copy of the dataset so updates will not automatically make it back into the dataset
        var res = JSON.parse(JSON.stringify(dataset.data));
        success(res);
      } else {
        if(failure) {
          failure('no_data');
        }
      }
    }, function(code, msg) {
      if(failure) {
        failure(code, msg);
      }
    });
  },

  getUID: function(oldOrNewUid){
    var uid = self.uid_map[oldOrNewUid];
    if(uid){
      return uid;
    } else {
      return oldOrNewUid;
    }
  },

  create: function(dataset_id, data, success, failure) {
    if(data == null){
      if(failure){
        return failure("null_data");
      }
    }
    self.addPendingObj(dataset_id, null, data, "create", success, failure);
  },

  read: function(dataset_id, uid, success, failure) {
    self.getDataSet(dataset_id, function(dataset) {
      uid = self.getUID(uid);
      var rec = dataset.data[uid];
      if (!rec) {
        failure("unknown_uid");
      } else {
        // Return a copy of the record so updates will not automatically make it back into the dataset
        var res = JSON.parse(JSON.stringify(rec));
        success(res);
      }
    }, function(code, msg) {
      if(failure) {
        failure(code, msg);
      }
    });
  },

  update: function(dataset_id, uid, data, success, failure) {
    uid = self.getUID(uid);
    self.addPendingObj(dataset_id, uid, data, "update", success, failure);
  },

  'delete': function(dataset_id, uid, success, failure) {
    uid = self.getUID(uid);
    self.addPendingObj(dataset_id, uid, null, "delete", success, failure);
  },

  getPending: function(dataset_id, cb) {
    self.getDataSet(dataset_id, function(dataset) {
      var res;
      if( dataset ) {
        res = dataset.pending;
      }
      cb(res);
    }, function(err, datatset_id) {
        self.consoleLog(err);
    });
  },

  clearPending: function(dataset_id, cb) {
    self.getDataSet(dataset_id, function(dataset) {
      dataset.pending = {};
      self.saveDataSet(dataset_id, cb);
    });
  },

  listCollisions : function(dataset_id, success, failure){
    self.getDataSet(dataset_id, function(dataset) {
      self.doCloudCall({
        "dataset_id": dataset_id,
        "req": {
          "fn": "listCollisions",
          "meta_data" : dataset.meta_data
        }
      }, success, failure);
    }, failure);
  },

  removeCollision: function(dataset_id, colissionHash, success, failure) {
    self.getDataSet(dataset_id, function(dataset) {
      self.doCloudCall({
        "dataset_id" : dataset_id,
        "req": {
          "fn": "removeCollision",
          "hash": colissionHash,
          meta_data: dataset.meta_data
        }
      }, success, failure);
    });
  },


  // PRIVATE FUNCTIONS
  isOnline: function(callback) {
    var online = true;

    // first, check if navigator.online is available
    if(typeof navigator.onLine !== "undefined"){
      online = navigator.onLine;
    }

    // second, check if Phonegap is available and has online info
    if(online){
      //use phonegap to determin if the network is available
      if(typeof navigator.network !== "undefined" && typeof navigator.network.connection !== "undefined"){
        var networkType = navigator.network.connection.type;
        if(networkType === "none" || networkType === null) {
          online = false;
        }
      }
    }

    return callback(online);
  },

  doNotify: function(dataset_id, uid, code, message) {

    if( self.notify_callback || self.notify_callback_map[dataset_id]) {
      var notifyFunc = self.notify_callback_map[dataset_id] || self.notify_callback;
      if ( self.config['notify_' + code] ) {
        var notification = {
          "dataset_id" : dataset_id,
          "uid" : uid,
          "code" : code,
          "message" : message
        };
        // make sure user doesn't block
        setTimeout(function () {
          notifyFunc(notification);
        }, 0);
      }
    }
  },

  getDataSet: function(dataset_id, success, failure) {
    var dataset = self.datasets[dataset_id];

    if (dataset) {
      success(dataset);
    } else {
      if(failure){
        failure('unknown_dataset ' + dataset_id, dataset_id);
      }
    }
  },

  getQueryParams: function(dataset_id, success, failure) {
    var dataset = self.datasets[dataset_id];

    if (dataset) {
      success(dataset.query_params);
    } else {
      if(failure){
        failure('unknown_dataset ' + dataset_id, dataset_id);
      }
    }
  },

  setQueryParams: function(dataset_id, queryParams, success, failure) {
    var dataset = self.datasets[dataset_id];

    if (dataset) {
      dataset.query_params = queryParams;
      self.saveDataSet(dataset_id);
      if( success ) {
        success(dataset.query_params);
      }
    } else {
      if ( failure ) {
        failure('unknown_dataset ' + dataset_id, dataset_id);
      }
    }
  },

  getMetaData: function(dataset_id, success, failure) {
    var dataset = self.datasets[dataset_id];

    if (dataset) {
      success(dataset.meta_data);
    } else {
      if(failure){
        failure('unknown_dataset ' + dataset_id, dataset_id);
      }
    }
  },

  setMetaData: function(dataset_id, metaData, success, failure) {
    var dataset = self.datasets[dataset_id];

    if (dataset) {
      dataset.meta_data = metaData;
      self.saveDataSet(dataset_id);
      if( success ) {
        success(dataset.meta_data);
      }
    } else {
      if( failure ) {
        failure('unknown_dataset ' + dataset_id, dataset_id);
      }
    }
  },

  getConfig: function(dataset_id, success, failure) {
    var dataset = self.datasets[dataset_id];

    if (dataset) {
      success(dataset.config);
    } else {
      if(failure){
        failure('unknown_dataset ' + dataset_id, dataset_id);
      }
    }
  },

  setConfig: function(dataset_id, config, success, failure) {
    var dataset = self.datasets[dataset_id];

    if (dataset) {
      var fullConfig = self.setOptions(config);
      dataset.config = fullConfig;
      self.saveDataSet(dataset_id);
      if( success ) {
        success(dataset.config);
      }
    } else {
      if( failure ) {
        failure('unknown_dataset ' + dataset_id, dataset_id);
      }
    }
  },

  stopSync: function(dataset_id, success, failure) {
    self.setConfig(dataset_id, {"sync_active" : false}, function() {
      if( success ) {
        success();
      }
    }, failure);
  },

  startSync: function(dataset_id, success, failure) {
    self.setConfig(dataset_id, {"sync_active" : true}, function() {
      if( success ) {
        success();
      }
    }, failure);
  },

  doSync: function(dataset_id, success, failure) {
    var dataset = self.datasets[dataset_id];

    if (dataset) {
      dataset.syncPending = true;
      self.saveDataSet(dataset_id);
      if( success ) {
        success();
      }
    } else {
      if( failure ) {
        failure('unknown_dataset ' + dataset_id, dataset_id);
      }
    }
  },

  forceSync: function(dataset_id, success, failure) {
    var dataset = self.datasets[dataset_id];

    if (dataset) {
      dataset.syncForced = true;
      self.saveDataSet(dataset_id);
      if( success ) {
        success();
      }
    } else {
      if( failure ) {
        failure('unknown_dataset ' + dataset_id, dataset_id);
      }
    }
  },

  sortObject : function(object) {
    if (typeof object !== "object" || object === null) {
      return object;
    }

    var result = [];

    Object.keys(object).sort().forEach(function(key) {
      result.push({
        key: key,
        value: self.sortObject(object[key])
      });
    });

    return result;
  },

  sortedStringify : function(obj) {

    var str = '';

    try {
      str = JSON.stringify(self.sortObject(obj));
    } catch (e) {
      console.error('Error stringifying sorted object:' + e);
    }

    return str;
  },

  generateHash: function(object) {
    var hash = CryptoJS.SHA1(self.sortedStringify(object));
    return hash.toString();
  },

  addPendingObj: function(dataset_id, uid, data, action, success, failure) {
    self.isOnline(function (online) {
      if (!online) {
        self.doNotify(dataset_id, uid, self.notifications.OFFLINE_UPDATE, action);
      }
    });

    function storePendingObject(obj) {
      obj.hash = obj.hash || self.generateHash(obj);

      self.getDataSet(dataset_id, function(dataset) {

        dataset.pending[obj.hash] = obj;

        self.updateDatasetFromLocal(dataset, obj);

        if(self.config.auto_sync_local_updates) {
          dataset.syncPending = true;
        }
        self.saveDataSet(dataset_id);
        self.doNotify(dataset_id, uid, self.notifications.LOCAL_UPDATE_APPLIED, action);

        success(obj);
      }, function(code, msg) {
        if(failure) {
          failure(code, msg);
        }
      });
    }

    var pendingObj = {};
    pendingObj.inFlight = false;
    pendingObj.action = action;
    pendingObj.post = JSON.parse(JSON.stringify(data));
    pendingObj.postHash = self.generateHash(pendingObj.post);
    pendingObj.timestamp = new Date().getTime();
    if( "create" === action ) {
      //this hash value will be returned later on when the cloud returns updates. We can then link the old uid
      //with new uid
      pendingObj.hash = self.generateHash(pendingObj);
      pendingObj.uid = pendingObj.hash;
      storePendingObject(pendingObj);
    } else {
      self.read(dataset_id, uid, function(rec) {
        pendingObj.uid = uid;
        pendingObj.pre = rec.data;
        pendingObj.preHash = self.generateHash(rec.data);
        storePendingObject(pendingObj);
      }, function(code, msg) {
        if(failure){
          failure(code, msg);
        }
      });
    }
  },

  updateChangeHistory: function(dataset, pending){
    if(pending.action === 'update'){
      dataset.changeHistory = dataset.changeHistory || {};
      dataset.changeHistory[pending.uid] = dataset.changeHistory[pending.uid] || [];
      if(dataset.changeHistory[pending.uid].indexOf(pending.preHash) === -1){
        dataset.changeHistory[pending.uid].push(pending.preHash);
        if(dataset.changeHistory[pending.uid].length > self.change_history_size){
          dataset.changeHistory[pending.uid].shift();
        }
      }
    }
  },

  syncLoop: function(dataset_id) {
    self.getDataSet(dataset_id, function(dataSet) {
    
      // The sync loop is currently active
      dataSet.syncPending = false;
      dataSet.syncRunning = true;
      dataSet.syncLoopStart = new Date().getTime();
      self.doNotify(dataset_id, null, self.notifications.SYNC_STARTED, null);

      self.isOnline(function(online) {
        if (!online) {
          self.syncComplete(dataset_id, "offline", self.notifications.SYNC_FAILED);
        } else {
          self.checkHasCustomSync(dataset_id, function() {

            var syncLoopParams = {};
            syncLoopParams.fn = 'sync';
            syncLoopParams.dataset_id = dataset_id;
            syncLoopParams.query_params = dataSet.query_params;
            syncLoopParams.config = dataSet.config;
            syncLoopParams.meta_data = dataSet.meta_data;
            //var datasetHash = self.generateLocalDatasetHash(dataSet);
            syncLoopParams.dataset_hash = dataSet.hash;
            syncLoopParams.acknowledgements = dataSet.acknowledgements || [];

            var pending = dataSet.pending;
            var pendingArray = [];
            for(var i in pending ) {
              self.updateChangeHistory(dataSet, pending[i]);
              // Mark the pending records we are about to submit as inflight and add them to the array for submission
              // Don't re-add previous inFlight pending records who whave crashed - i.e. who's current state is unknown
              // Don't add delayed records
              if( !pending[i].inFlight && !pending[i].crashed && !pending[i].delayed) {
                pending[i].inFlight = true;
                pending[i].inFlightDate = new Date().getTime();
                pendingArray.push(pending[i]);
              }
            }
            syncLoopParams.pending = pendingArray;

            if( pendingArray.length > 0 ) {
              self.consoleLog('Starting sync loop - global hash = ' + dataSet.hash + ' :: params = ' + JSON.stringify(syncLoopParams, null, 2));
            }
            try {
              self.doCloudCall({
                'dataset_id': dataset_id,
                'req': syncLoopParams
              }, function(res) {
                var rec;

                function processUpdates(updates, notification, acknowledgements) {
                  if( updates ) {
                    for (var up in updates) {
                      rec = updates[up];
                      acknowledgements.push(rec);
                      if( dataSet.pending[up] && dataSet.pending[up].inFlight && !dataSet.pending[up].crashed ) {
                        delete dataSet.pending[up];
                        self.doNotify(dataset_id, rec.uid, notification, rec);
                      }
                    }
                  }
                }

                // Check to see if any new pending records need to be updated to reflect the current state of play.
                self.updatePendingFromNewData(dataset_id, dataSet, res);

                // Check to see if any previously crashed inflight records can now be resolved
                self.updateCrashedInFlightFromNewData(dataset_id, dataSet, res);

                //Check to see if any delayed pending records can now be set to ready
                self.updateDelayedFromNewData(dataset_id, dataSet, res);

                //Check meta data as well to make sure it contains the correct info
                self.updateMetaFromNewData(dataset_id, dataSet, res);

                // Update the new dataset with details of any inflight updates which we have not received a response on
                self.updateNewDataFromInFlight(dataset_id, dataSet, res);

                // Update the new dataset with details of any pending updates
                self.updateNewDataFromPending(dataset_id, dataSet, res);



                if (res.records) {
                  // Full Dataset returned
                  dataSet.data = res.records;
                  dataSet.hash = res.hash;

                  self.doNotify(dataset_id, res.hash, self.notifications.DELTA_RECEIVED, 'full dataset');
                }

                if (res.updates) {
                  var acknowledgements = [];
                  self.checkUidChanges(dataSet, res.updates.applied);
                  processUpdates(res.updates.applied, self.notifications.REMOTE_UPDATE_APPLIED, acknowledgements);
                  processUpdates(res.updates.failed, self.notifications.REMOTE_UPDATE_FAILED, acknowledgements);
                  processUpdates(res.updates.collisions, self.notifications.COLLISION_DETECTED, acknowledgements);
                  dataSet.acknowledgements = acknowledgements;
                }

                if (!res.records && res.hash && res.hash !== dataSet.hash) {
                  self.consoleLog("Local dataset stale - syncing records :: local hash= " + dataSet.hash + " - remoteHash=" + res.hash);
                  // Different hash value returned - Sync individual records
                  self.syncRecords(dataset_id);
                } else {
                  self.consoleLog("Local dataset up to date");
                  self.syncComplete(dataset_id,  "online", self.notifications.SYNC_COMPLETE);
                }
              }, function(msg, err) {
                // The AJAX call failed to complete succesfully, so the state of the current pending updates is unknown
                // Mark them as "crashed". The next time a syncLoop completets successfully, we will review the crashed
                // records to see if we can determine their current state.
                self.markInFlightAsCrashed(dataSet);
                self.consoleLog("syncLoop failed : msg=" + msg + " :: err = " + err);
                self.syncComplete(dataset_id, msg, self.notifications.SYNC_FAILED);
              });
            }
            catch (e) {
              self.consoleLog('Error performing sync - ' + e);
              self.syncComplete(dataset_id, e, self.notifications.SYNC_FAILED);
            }
          });
        }
      });
    });
  },

  syncRecords: function(dataset_id) {

    self.getDataSet(dataset_id, function(dataSet) {

      var localDataSet = dataSet.data || {};

      var clientRecs = {};
      for (var i in localDataSet) {
        var uid = i;
        var hash = localDataSet[i].hash;
        clientRecs[uid] = hash;
      }

      var syncRecParams = {};

      syncRecParams.fn = 'syncRecords';
      syncRecParams.dataset_id = dataset_id;
      syncRecParams.query_params = dataSet.query_params;
      syncRecParams.clientRecs = clientRecs;

      self.consoleLog("syncRecParams :: " + JSON.stringify(syncRecParams));

      self.doCloudCall({
        'dataset_id': dataset_id,
        'req': syncRecParams
      }, function(res) {
        var i;

        if (res.create) {
          for (i in res.create) {
            localDataSet[i] = {"hash" : res.create[i].hash, "data" : res.create[i].data};
            self.doNotify(dataset_id, i, self.notifications.RECORD_DELTA_RECEIVED, "create");
          }
        }
        var existingPendingPreHashes = self.existingPendingPreHashMap(dataSet);
        if (res.update) {
          for (i in res.update) {
            if(existingPendingPreHashes[i] && existingPendingPreHashes[i].indexOf(res.update[i].hash) > -1){
              //the returned update data has been updated locally, so it should keep local copy
              self.consoleLog("skip update from remote for uid :: " + i + " :: hash = " + res.update[i].hash + ' :: data = ' + JSON.stringify(res.update[i].data));
            } else {
              localDataSet[i].hash = res.update[i].hash;
              localDataSet[i].data = res.update[i].data;
              self.doNotify(dataset_id, i, self.notifications.RECORD_DELTA_RECEIVED, "update");
            }
          }
        }
        if (res['delete']) {
          for (i in res['delete']) {
            delete localDataSet[i];
            self.doNotify(dataset_id, i, self.notifications.RECORD_DELTA_RECEIVED, "delete");
          }
        }

        self.doNotify(dataset_id, res.hash, self.notifications.DELTA_RECEIVED, 'partial dataset');

        dataSet.data = localDataSet;
        if(res.hash) {
          dataSet.hash = res.hash;
        }
        self.syncComplete(dataset_id, "online", self.notifications.SYNC_COMPLETE);
      }, function(msg, err) {
        self.consoleLog("syncRecords failed : msg=" + msg + " :: err=" + err);
        self.syncComplete(dataset_id, msg, self.notifications.SYNC_FAILED);
      });
    });
  },

  syncComplete: function(dataset_id, status, notification) {

    self.getDataSet(dataset_id, function(dataset) {
      dataset.syncRunning = false;
      dataset.syncLoopEnd = new Date().getTime();
      self.saveDataSet(dataset_id);
      self.doNotify(dataset_id, dataset.hash, notification, status);
    });
  },

  checkUidChanges: function(dataset, appliedUpdates){
    if(appliedUpdates){
      var new_uids = {};
      var changeUidsCount = 0;
      for(var update in appliedUpdates){
        if(appliedUpdates.hasOwnProperty(update)){
          var applied_update = appliedUpdates[update];
          var action = applied_update.action;
          if(action && action === 'create'){
            //we are receving the results of creations, at this point, we will have the old uid(the hash) and the real uid generated by the cloud
            var newUid = applied_update.uid;
            var oldUid = applied_update.hash;
            changeUidsCount++;
            //remember the mapping
            self.uid_map[oldUid] = newUid;
            new_uids[oldUid] = newUid;
            //update the data uid in the dataset
            var record = dataset.data[oldUid];
            if(record){
              dataset.data[newUid] = record;
              delete dataset.data[oldUid];
            }

            //update the old uid in meta data
            var metaData = dataset.meta[oldUid];
            if(metaData) {
              dataset.meta[newUid] = metaData;
              delete dataset.meta[oldUid];
            }
          }
        }
      }
      if(changeUidsCount > 0){
        //we need to check all existing pendingRecords and update their UIDs if they are still the old values
        for(var pending in dataset.pending){
          if(dataset.pending.hasOwnProperty(pending)){
            var pendingObj = dataset.pending[pending];
            var pendingRecordUid = pendingObj.uid;
            if(new_uids[pendingRecordUid]){
              pendingObj.uid = new_uids[pendingRecordUid];
            }
          }
        }
      }
    }
  },

  existingPendingPreHashMap: function(dataset){
    var pendingPreHashes = dataset.changeHistory || {};
    return pendingPreHashes;
  },

  checkDatasets: function() {
    for( var dataset_id in self.datasets ) {
      if( self.datasets.hasOwnProperty(dataset_id) ) {
        var dataset = self.datasets[dataset_id];
        if(dataset && !dataset.syncRunning && (dataset.config.sync_active || dataset.syncForced)) {
          // Check to see if it is time for the sync loop to run again
          var lastSyncStart = dataset.syncLoopStart;
          var lastSyncCmp = dataset.syncLoopEnd;
          if(dataset.syncForced){
            dataset.syncPending = true;
          } else if( lastSyncStart == null ) {
            self.consoleLog(dataset_id +' - Performing initial sync');
            // Dataset has never been synced before - do initial sync
            dataset.syncPending = true;
          } else if (lastSyncCmp != null) {
            var timeSinceLastSync = new Date().getTime() - lastSyncCmp;
            var syncFrequency = dataset.config.sync_frequency * 1000;
            if( timeSinceLastSync > syncFrequency ) {
              // Time between sync loops has passed - do another sync
              dataset.syncPending = true;
            }
          }

          if( dataset.syncPending ) {
            // Reset syncForced in case it was what caused the sync cycle to run.
            dataset.syncForced = false;

            // If the dataset requres syncing, run the sync loop. This may be because the sync interval has passed
            // or because the sync_frequency has been changed or because a change was made to the dataset and the
            // immediate_sync flag set to true
            self.syncLoop(dataset_id);
          }
        }
      }
    }
  },

  checkHasCustomSync : function(dataset_id, cb) {
    var dataset = self.datasets[dataset_id];
    if(dataset && dataset.config){
      self.consoleLog("dataset.config.has_custom_sync = " + dataset.config.has_custom_sync);
      if(dataset.config.has_custom_sync != null) {
        return cb();
      }
      self.consoleLog('starting check has custom sync');

      actAPI({
        'act' : dataset_id,
        'req': {
          'fn': 'sync'
        }
      }, function(res) {
        //if the custom sync is defined in the cloud, this call should success.
        //if failed, we think this the custom sync is not defined
        self.consoleLog('check has_custom_sync - success - ', res);
        dataset.config.has_custom_sync = true;
        return cb();
      }, function(msg,err) {
        self.consoleLog('check has_custom_sync - failure - ', err);
        if(err.status && err.status === 500){
          //if we receive 500, it could be that there is an error occured due to missing parameters or similar,
          //but the endpoint is defined.
          self.consoleLog('check has_custom_sync - failed with 500, endpoint does exists');
          dataset.config.has_custom_sync = true;
        } else {
          dataset.config.has_custom_sync = false;
        }
        return cb();
      });
    } else {
      return cb();
    }
  },

  doCloudCall: function(params, success, failure) {
    var hasCustomSync = false;
    var dataset = self.datasets[params.dataset_id];
    if(dataset && dataset.config){
      hasCustomSync = dataset.config.has_custom_sync;
    }
    if( hasCustomSync === true ) {
      actAPI({
        'act' : params.dataset_id,
        'req' : params.req
      }, function(res) {
        success(res);
      }, function(msg, err) {
        failure(msg, err);
      });      
    } else {
      cloudAPI({
        'path' : '/mbaas/sync/' + params.dataset_id,
        'method' : 'post',
        'data' : params.req
      }, function(res) {
        success(res);
      }, function(msg, err) {
        failure(msg, err);
      });
    }
  },

  datasetMonitor: function() {
    self.checkDatasets();

    // Re-execute datasetMonitor every 500ms so we keep invoking checkDatasets();
    setTimeout(function() {
      self.datasetMonitor();
    }, 500);
  },

  getStorageAdapter: function(dataset_id, isSave, cb){
    var onFail = function(msg, err){
      var errMsg = (isSave?'save to': 'load from' ) + ' local storage failed msg: ' + msg + ' err: ' + err;
      self.doNotify(dataset_id, null, self.notifications.CLIENT_STORAGE_FAILED, errMsg);
      self.consoleLog(errMsg);
    };
    Lawnchair({fail:onFail, adapter: self.config.storage_strategy, size:self.config.file_system_quota, backup: self.config.icloud_backup}, function(){
      return cb(null, this);
    });
  },

  saveDataSet: function (dataset_id, cb) {
    self.getDataSet(dataset_id, function(dataset) {
      self.getStorageAdapter(dataset_id, true, function(err, storage){
        storage.save({key:"dataset_" + dataset_id, val:dataset}, function(){
          //save success
          if(cb) {
            return cb();
          }
        });
      });
    });
  },

  loadDataSet: function (dataset_id, success, failure) {
    self.getStorageAdapter(dataset_id, false, function(err, storage){
      storage.get( "dataset_" + dataset_id, function (data){
        if (data && data.val) {
          var dataset = data.val;
          if(typeof dataset === "string"){
            dataset = JSON.parse(dataset);
          }
          // Datasets should not be auto initialised when loaded - the mange function should be called for each dataset
          // the user wants sync
          dataset.initialised = false;
          self.datasets[dataset_id] = dataset; // TODO: do we need to handle binary data?
          self.consoleLog('load from local storage success for dataset_id :' + dataset_id);
          if(success) {
            return success(dataset);
          }
        } else {
          // no data yet, probably first time. failure calback should handle this
          if(failure) {
            return failure();
          }
        }
      });
    });
  },

  clearCache: function(dataset_id, cb){
    delete self.datasets[dataset_id];
    self.notify_callback_map[dataset_id] = null;
    self.getStorageAdapter(dataset_id, true, function(err, storage){
      storage.remove("dataset_" + dataset_id, function(){
        self.consoleLog('local cache is cleared for dataset : ' + dataset_id);
        if(cb){
          return cb();
        }
      });
    });
  },

  updateDatasetFromLocal: function(dataset, pendingRec) {
    var pending = dataset.pending;
    var previousPendingUid;
    var previousPending;

    var uid = pendingRec.uid;
    self.consoleLog('updating local dataset for uid ' + uid + ' - action = ' + pendingRec.action);

    dataset.meta[uid] = dataset.meta[uid] || {};

    // Creating a new record
    if( pendingRec.action === "create" ) {
      if( dataset.data[uid] ) {
        self.consoleLog('dataset already exists for uid in create :: ' + JSON.stringify(dataset.data[uid]));

        // We are trying to do a create using a uid which already exists
        if (dataset.meta[uid].fromPending) {
          // We are trying to create on top of an existing pending record
          // Remove the previous pending record and use this one instead
          previousPendingUid = dataset.meta[uid].pendingUid;
          delete pending[previousPendingUid];
        }
      }
      dataset.data[uid] = {};
    }

    if( pendingRec.action === "update" ) {
      if( dataset.data[uid] ) {
        if (dataset.meta[uid].fromPending) {
          self.consoleLog('updating an existing pending record for dataset :: ' + JSON.stringify(dataset.data[uid]));
          // We are trying to update an existing pending record
          previousPendingUid = dataset.meta[uid].pendingUid;
          dataset.meta[uid].previousPendingUid = previousPendingUid;
          previousPending = pending[previousPendingUid];
          if(previousPending) {
            if(!previousPending.inFlight){
              self.consoleLog('existing pre-flight pending record = ' + JSON.stringify(previousPending));
              // We are trying to perform an update on an existing pending record
              // modify the original record to have the latest value and delete the pending update
              previousPending.post = pendingRec.post;
              previousPending.postHash = pendingRec.postHash;
              delete pending[pendingRec.hash];
              // Update the pending record to have the hash of the previous record as this is what is now being
              // maintained in the pending array & is what we want in the meta record
              pendingRec.hash = previousPendingUid;
            } else {
              //we are performing changes to a pending record which is inFlight. Until the status of this pending record is resolved,
              //we should not submit this pending record to the cloud. Mark it as delayed.
              self.consoleLog('existing in-inflight pending record = ' + JSON.stringify(previousPending));
              pendingRec.delayed = true;
              pendingRec.waiting = previousPending.hash;
            }
          }
        }
      }
    }

    if( pendingRec.action === "delete" ) {
      if( dataset.data[uid] ) {
        if (dataset.meta[uid].fromPending) {
          self.consoleLog('Deleting an existing pending record for dataset :: ' + JSON.stringify(dataset.data[uid]));
          // We are trying to delete an existing pending record
          previousPendingUid = dataset.meta[uid].pendingUid;
          dataset.meta[uid].previousPendingUid = previousPendingUid;
          previousPending = pending[previousPendingUid];
          if( previousPending ) {
            if(!previousPending.inFlight){
              self.consoleLog('existing pending record = ' + JSON.stringify(previousPending));
              if( previousPending.action === "create" ) {
                // We are trying to perform a delete on an existing pending create
                // These cancel each other out so remove them both
                delete pending[pendingRec.hash];
                delete pending[previousPendingUid];
              }
              if( previousPending.action === "update" ) {
                // We are trying to perform a delete on an existing pending update
                // Use the pre value from the pending update for the delete and
                // get rid of the pending update
                pendingRec.pre = previousPending.pre;
                pendingRec.preHash = previousPending.preHash;
                pendingRec.inFlight = false;
                delete pending[previousPendingUid];
              }
            } else {
              self.consoleLog('existing in-inflight pending record = ' + JSON.stringify(previousPending));
              pendingRec.delayed = true;
              pendingRec.waiting = previousPending.hash;
            }
          }
        }
        delete dataset.data[uid];
      }
    }

    if( dataset.data[uid] ) {
      dataset.data[uid].data = pendingRec.post;
      dataset.data[uid].hash = pendingRec.postHash;
      dataset.meta[uid].fromPending = true;
      dataset.meta[uid].pendingUid = pendingRec.hash;
    }
  },

  updatePendingFromNewData: function(dataset_id, dataset, newData) {
    var pending = dataset.pending;
    var newRec;

    if( pending && newData.records) {
      for( var pendingHash in pending ) {
        if( pending.hasOwnProperty(pendingHash) ) {
          var pendingRec = pending[pendingHash];

          dataset.meta[pendingRec.uid] = dataset.meta[pendingRec.uid] || {};

          if( pendingRec.inFlight === false ) {
            // Pending record that has not been submitted
            self.consoleLog('updatePendingFromNewData - Found Non inFlight record -> action=' + pendingRec.action +' :: uid=' + pendingRec.uid  + ' :: hash=' + pendingRec.hash);
            if( pendingRec.action === "update" || pendingRec.action === "delete") {
              // Update the pre value of pending record to reflect the latest data returned from sync.
              // This will prevent a collision being reported when the pending record is sent.
              newRec = newData.records[pendingRec.uid];
              if( newRec ) {
                self.consoleLog('updatePendingFromNewData - Updating pre values for existing pending record ' + pendingRec.uid);
                pendingRec.pre = newRec.data;
                pendingRec.preHash = newRec.hash;
              }
              else {
                // The update/delete may be for a newly created record in which case the uid will have changed.
                var previousPendingUid = dataset.meta[pendingRec.uid].previousPendingUid;
                var previousPending = pending[previousPendingUid];
                if( previousPending ) {
                  if( newData && newData.updates &&  newData.updates.applied && newData.updates.applied[previousPending.hash] ) {
                    // There is an update in from a previous pending action
                    var newUid = newData.updates.applied[previousPending.hash].uid;
                    newRec = newData.records[newUid];
                    if( newRec ) {
                      self.consoleLog('updatePendingFromNewData - Updating pre values for existing pending record which was previously a create ' + pendingRec.uid + ' ==> ' + newUid);
                      pendingRec.pre = newRec.data;
                      pendingRec.preHash = newRec.hash;
                      pendingRec.uid = newUid;
                    }
                  }
                }
              }
            }

            if( pendingRec.action === "create" ) {
              if( newData && newData.updates &&  newData.updates.applied && newData.updates.applied[pendingHash] ) {
                self.consoleLog('updatePendingFromNewData - Found an update for a pending create ' + JSON.stringify(newData.updates.applied[pendingHash]));
                newRec = newData.records[newData.updates.applied[pendingHash].uid];
                if( newRec ) {
                  self.consoleLog('updatePendingFromNewData - Changing pending create to an update based on new record  ' + JSON.stringify(newRec));

                  // Set up the pending create as an update
                  pendingRec.action = "update";
                  pendingRec.pre = newRec.data;
                  pendingRec.preHash = newRec.hash;
                  pendingRec.uid = newData.updates.applied[pendingHash].uid;
                }
              }
            }
          }
        }
      }
    }
  },

  updateNewDataFromInFlight: function(dataset_id, dataset, newData) {
    var pending = dataset.pending;

    if( pending && newData.records) {
      for( var pendingHash in pending ) {
        if( pending.hasOwnProperty(pendingHash) ) {
          var pendingRec = pending[pendingHash];

          if( pendingRec.inFlight ) {
            var updateReceivedForPending = (newData && newData.updates &&  newData.updates.hashes && newData.updates.hashes[pendingHash]) ? true : false;

            self.consoleLog('updateNewDataFromInFlight - Found inflight pending Record - action = ' + pendingRec.action + ' :: hash = ' + pendingHash + ' :: updateReceivedForPending=' + updateReceivedForPending);

            if( ! updateReceivedForPending ) {
              var newRec = newData.records[pendingRec.uid];

              if( pendingRec.action === "update" && newRec) {
                // Modify the new Record to have the updates from the pending record so the local dataset is consistent
                newRec.data = pendingRec.post;
                newRec.hash = pendingRec.postHash;
              }
              else if( pendingRec.action === "delete" && newRec) {
                // Remove the record from the new dataset so the local dataset is consistent
                delete newData.records[pendingRec.uid];
              }
              else if( pendingRec.action === "create" ) {
                // Add the pending create into the new dataset so it is not lost from the UI
                self.consoleLog('updateNewDataFromInFlight - re adding pending create to incomming dataset');
                var newPendingCreate = {
                  data: pendingRec.post,
                  hash: pendingRec.postHash
                };
                newData.records[pendingRec.uid] = newPendingCreate;
              }
            }
          }
        }
      }
    }
  },

  updateNewDataFromPending: function(dataset_id, dataset, newData) {
    var pending = dataset.pending;

    if( pending && newData.records) {
      for( var pendingHash in pending ) {
        if( pending.hasOwnProperty(pendingHash) ) {
          var pendingRec = pending[pendingHash];

          if( pendingRec.inFlight === false ) {
            self.consoleLog('updateNewDataFromPending - Found Non inFlight record -> action=' + pendingRec.action +' :: uid=' + pendingRec.uid  + ' :: hash=' + pendingRec.hash);
            var newRec = newData.records[pendingRec.uid];
            if( pendingRec.action === "update" && newRec) {
              // Modify the new Record to have the updates from the pending record so the local dataset is consistent
              newRec.data = pendingRec.post;
              newRec.hash = pendingRec.postHash;
            }
            else if( pendingRec.action === "delete" && newRec) {
              // Remove the record from the new dataset so the local dataset is consistent
              delete newData.records[pendingRec.uid];
            }
            else if( pendingRec.action === "create" ) {
              // Add the pending create into the new dataset so it is not lost from the UI
              self.consoleLog('updateNewDataFromPending - re adding pending create to incomming dataset');
              var newPendingCreate = {
                data: pendingRec.post,
                hash: pendingRec.postHash
              };
              newData.records[pendingRec.uid] = newPendingCreate;
            }
          }
        }
      }
    }
  },

  updateCrashedInFlightFromNewData: function(dataset_id, dataset, newData) {
    var updateNotifications = {
      applied: self.notifications.REMOTE_UPDATE_APPLIED,
      failed: self.notifications.REMOTE_UPDATE_FAILED,
      collisions: self.notifications.COLLISION_DETECTED
    };

    var pending = dataset.pending;
    var resolvedCrashes = {};
    var pendingHash;
    var pendingRec;


    if( pending ) {
      for( pendingHash in pending ) {
        if( pending.hasOwnProperty(pendingHash) ) {
          pendingRec = pending[pendingHash];

          if( pendingRec.inFlight && pendingRec.crashed) {
            self.consoleLog('updateCrashedInFlightFromNewData - Found crashed inFlight pending record uid=' + pendingRec.uid + ' :: hash=' + pendingRec.hash );
            if( newData && newData.updates && newData.updates.hashes) {

              // Check if the updates received contain any info about the crashed in flight update
              var crashedUpdate = newData.updates.hashes[pendingHash];
              if( crashedUpdate ) {
                // We have found an update on one of our in flight crashed records

                resolvedCrashes[crashedUpdate.uid] = crashedUpdate;

                self.consoleLog('updateCrashedInFlightFromNewData - Resolving status for crashed inflight pending record ' + JSON.stringify(crashedUpdate));

                if( crashedUpdate.type === 'failed' ) {
                  // Crashed update failed - revert local dataset
                  if( crashedUpdate.action === 'create' ) {
                    self.consoleLog('updateCrashedInFlightFromNewData - Deleting failed create from dataset');
                    delete dataset.data[crashedUpdate.uid];
                  }
                  else if ( crashedUpdate.action === 'update' || crashedUpdate.action === 'delete' ) {
                    self.consoleLog('updateCrashedInFlightFromNewData - Reverting failed ' + crashedUpdate.action + ' in dataset');
                    dataset.data[crashedUpdate.uid] = {
                      data : pendingRec.pre,
                      hash : pendingRec.preHash
                    };
                  }
                }

                delete pending[pendingHash];
                self.doNotify(dataset_id, crashedUpdate.uid, updateNotifications[crashedUpdate.type], crashedUpdate);
              }
              else {
                // No word on our crashed update - increment a counter to reflect another sync that did not give us
                // any update on our crashed record.
                if( pendingRec.crashedCount ) {
                  pendingRec.crashedCount++;
                }
                else {
                  pendingRec.crashedCount = 1;
                }
              }
            }
            else {
              // No word on our crashed update - increment a counter to reflect another sync that did not give us
              // any update on our crashed record.
              if( pendingRec.crashedCount ) {
                pendingRec.crashedCount++;
              }
              else {
                pendingRec.crashedCount = 1;
              }
            }
          }
        }
      }

      for( pendingHash in pending ) {
        if( pending.hasOwnProperty(pendingHash) ) {
          pendingRec = pending[pendingHash];

          if( pendingRec.inFlight && pendingRec.crashed) {
            if( pendingRec.crashedCount > dataset.config.crashed_count_wait ) {
              self.consoleLog('updateCrashedInFlightFromNewData - Crashed inflight pending record has reached crashed_count_wait limit : ' + JSON.stringify(pendingRec));
              if( dataset.config.resend_crashed_updates ) {
                self.consoleLog('updateCrashedInFlightFromNewData - Retryig crashed inflight pending record');
                pendingRec.crashed = false;
                pendingRec.inFlight = false;
              }
              else {
                self.consoleLog('updateCrashedInFlightFromNewData - Deleting crashed inflight pending record');
                delete pending[pendingHash];
              }
            }
          }
        }
      }
    }
  },

  updateDelayedFromNewData: function(dataset_id, dataset, newData){
    var pending = dataset.pending;
    var pendingHash;
    var pendingRec;
    if(pending){
      for( pendingHash in pending ){
        if( pending.hasOwnProperty(pendingHash) ){
          pendingRec = pending[pendingHash];
          if( pendingRec.delayed && pendingRec.waiting ){
            self.consoleLog('updateDelayedFromNewData - Found delayed pending record uid=' + pendingRec.uid + ' :: hash=' + pendingRec.hash + ' :: waiting=' + pendingRec.waiting);
            if( newData && newData.updates && newData.updates.hashes ){
              var waitingRec = newData.updates.hashes[pendingRec.waiting];
              if(waitingRec){
                self.consoleLog('updateDelayedFromNewData - Waiting pending record is resolved rec=' + JSON.stringify(waitingRec));
                pendingRec.delayed = false;
                pendingRec.waiting = undefined;
              }
            }
          }
        }
      }
    }
  },

  updateMetaFromNewData: function(dataset_id, dataset, newData){
    var meta = dataset.meta;
    if(meta && newData && newData.updates && newData.updates.hashes){
      for(var uid in meta){
        if(meta.hasOwnProperty(uid)){
          var metadata = meta[uid];
          var pendingHash = metadata.pendingUid;
          var previousPendingHash = metadata.previousPendingUid;
          self.consoleLog("updateMetaFromNewData - Found metadata with uid = " + uid + " :: pendingHash = " + pendingHash + " :: previousPendingHash =" + previousPendingHash);
          var previousPendingResolved = true;
          var pendingResolved = true;
          if(previousPendingHash){
            //we have previous pending in meta data, see if it's resolved
            previousPendingResolved = false;
            var resolved = newData.updates.hashes[previousPendingHash];
            if(resolved){
              self.consoleLog("updateMetaFromNewData - Found previousPendingUid in meta data resolved - resolved = " + JSON.stringify(resolved));
              //the previous pending is resolved in the cloud
              metadata.previousPendingUid = undefined;
              previousPendingResolved = true;
            }
          }
          if(pendingHash){
            //we have current pending in meta data, see if it's resolved
            pendingResolved = false;
            var hashresolved = newData.updates.hashes[pendingHash];
            if(hashresolved){
              self.consoleLog("updateMetaFromNewData - Found pendingUid in meta data resolved - resolved = " + JSON.stringify(hashresolved));
              //the current pending is resolved in the cloud
              metadata.pendingUid = undefined;
              pendingResolved = true;
            }
          }

          if(previousPendingResolved && pendingResolved){
            self.consoleLog("updateMetaFromNewData - both previous and current pendings are resolved for meta data with uid " + uid + ". Delete it.");
            //all pendings are resolved, the entry can be removed from meta data
            delete meta[uid];
          }
        }
      }
    }
  },


  markInFlightAsCrashed : function(dataset) {
    var pending = dataset.pending;
    var pendingHash;
    var pendingRec;

    if( pending ) {
      var crashedRecords = {};
      for( pendingHash in pending ) {
        if( pending.hasOwnProperty(pendingHash) ) {
          pendingRec = pending[pendingHash];

          if( pendingRec.inFlight ) {
            self.consoleLog('Marking in flight pending record as crashed : ' + pendingHash);
            pendingRec.crashed = true;
            crashedRecords[pendingRec.uid] = pendingRec;
          }
        }
      }
    }
  },

  consoleLog: function(msg) {
    if( self.config.do_console_log ) {
      console.log(msg);
    }
  }
};

(function() {
  self.config = self.defaults;
  //Initialse the sync service with default config
  //self.init({});
})();

module.exports = {
  init: self.init,
  manage: self.manage,
  notify: self.notify,
  doList: self.list,
  doCreate: self.create,
  doRead: self.read,
  doUpdate: self.update,
  doDelete: self['delete'],
  listCollisions: self.listCollisions,
  removeCollision: self.removeCollision,
  getPending : self.getPending,
  clearPending : self.clearPending,
  getDataset : self.getDataSet,
  getQueryParams: self.getQueryParams,
  setQueryParams: self.setQueryParams,
  getMetaData: self.getMetaData,
  setMetaData: self.setMetaData,
  getConfig: self.getConfig,
  setConfig: self.setConfig,
  startSync: self.startSync,
  stopSync: self.stopSync,
  doSync: self.doSync,
  forceSync: self.forceSync,
  generateHash: self.generateHash,
  loadDataSet: self.loadDataSet,
  checkHasCustomSync: self.checkHasCustomSync,
  clearCache: self.clearCache
};
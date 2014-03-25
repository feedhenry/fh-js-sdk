var JSON = require("JSON");
var actFunc = require("./api_act");
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
    // Should a notification event be triggered when a delta was received from the remote data store (dataset or record - depending on whether uid is set)
    "notify_sync_failed": true,
    // Should a notification event be triggered when the sync loop failed to complete
    "do_console_log": false,
    // Should log statements be written to console.log
    "crashed_count_wait" : 10,
    // How many syncs should we check for updates on crashed in flight updates before we give up searching
    "resend_crashed_updates" : true
    // If we have reached the crashed_count_wait limit, should we re-try sending the crashed in flight pending record
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
    // A delta was received from the remote data store (dataset or record - depending on whether uid is set)
    "SYNC_FAILED": "sync_failed"
    // Sync loop failed to complete
  },

  datasets: {},

  // Initialise config to default values;
  config: undefined,

  notify_callback: undefined,

  // PUBLIC FUNCTION IMPLEMENTATIONS
  init: function(options) {
    self.consoleLog('sync - init called');
    self.config = JSON.parse(JSON.stringify(self.defaults));
    for (var i in options) {
      self.config[i] = options[i];
    }
    self.datasetMonitor();
  },

  notify: function(callback) {
    self.notify_callback = callback;
  },

  manage: function(dataset_id, options, query_params) {
    var doManage = function(dataset) {
      self.consoleLog('doManage dataset :: initialised = ' + dataset.initialised + " :: " + dataset_id + ' :: ' + JSON.stringify(options));

      // Make sure config is initialised
      if( ! self.config ) {
        self.config = JSON.parse(JSON.stringify(self.defaults));
      }

      var datasetConfig = JSON.parse(JSON.stringify(self.config));
      for (var k in options) {
        datasetConfig[k] = options[k];
      }

      dataset.query_params = query_params || {};
      dataset.config = datasetConfig;
      dataset.syncRunning = false;
      dataset.syncPending = true;
      dataset.initialised = true;
      dataset.meta = {};
      self.saveDataSet(dataset_id);
    };

    // Check if the dataset is already loaded
    self.getDataSet(dataset_id, function(dataset) {
      doManage(dataset);
    }, function(err) {

      // Not already loaded, try to load from local storage
      self.loadDataSet(dataset_id, function(dataset) {
          // Loading from local storage worked

          // Fire the local update event to indicate that dataset was loaded from local storage
          self.doNotify(dataset_id, null, self.notifications.LOCAL_UPDATE_APPLIED, "load");

          // Put the dataet under the management of the sync service
          doManage(dataset);
        },
        function(err) {
          // No dataset in memory or local storage - create a new one and put it in memory
          self.consoleLog('Creating new dataset for id ' + dataset_id);
          var dataset = {};
          dataset.pending = {};
          self.datasets[dataset_id] = dataset;
          doManage(dataset);
        });
    });
  },

  list: function(dataset_id, success, failure) {
    self.getDataSet(dataset_id, function(dataset) {
      if (dataset) {
        // Return a copy of the dataset so updates will not automatically make it back into the dataset
        var res = JSON.parse(JSON.stringify(dataset.data));
        success(res);
      }
    }, function(code, msg) {
      failure(code, msg);
    });
  },

  create: function(dataset_id, data, success, failure) {
    self.addPendingObj(dataset_id, null, data, "create", success, failure);
  },

  read: function(dataset_id, uid, success, failure) {
      self.getDataSet(dataset_id, function(dataset) {
      var rec = dataset.data[uid];
      if (!rec) {
        failure("unknown_uid");
      } else {
        // Return a copy of the record so updates will not automatically make it back into the dataset
        var res = JSON.parse(JSON.stringify(rec));
        success(res);
      }
    }, function(code, msg) {
      failure(code, msg);
    });
  },

  update: function(dataset_id, uid, data, success, failure) {
    self.addPendingObj(dataset_id, uid, data, "update", success, failure);
  },

  'delete': function(dataset_id, uid, success, failure) {
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
        self.ConsoleLog(err);
    });
  },

  clearPending: function(dataset_id, cb) {
    self.getDataSet(dataset_id, function(dataset) {
      dataset.pending = {};
      self.saveDataSet(dataset_id, cb);
    });
  },

  listCollisions : function(dataset_id, success, failure){
    actFunc({
      "act": dataset_id,
      "req": {
        "fn": "listCollisions"
      }
    }, success, failure);
  },

  removeCollision: function(dataset_id, colissionHash, success, failure) {
    actFunc({
      "act": dataset_id,
      "req": {
        "fn": "removeCollision",
        "hash": colissionHash
      }
    }, success, failure);
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

    if( self.notify_callback ) {
      if ( self.config['notify_' + code] ) {
        var notification = {
          "dataset_id" : dataset_id,
          "uid" : uid,
          "code" : code,
          "message" : message
        };
        // make sure user doesn't block
        setTimeout(function () {
          self.notify_callback(notification);
        }, 0);
      }
    }
  },

  getDataSet: function(dataset_id, success, failure) {
    var dataset = self.datasets[dataset_id];

    if (dataset) {
      success(dataset);
    } else {
      failure('unknown_dataset' + dataset_id, dataset_id);
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
      obj.hash = self.generateHash(obj);

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
        failure(code, msg);
      });
    }

    var pendingObj = {};
    pendingObj.inFlight = false;
    pendingObj.action = action;
    pendingObj.post = data;
    pendingObj.postHash = self.generateHash(pendingObj.post);
    pendingObj.timestamp = new Date().getTime();
    if( "create" === action ) {
      pendingObj.uid = pendingObj.postHash;
      storePendingObject(pendingObj);
    } else {
      self.read(dataset_id, uid, function(rec) {
        pendingObj.uid = uid;
        pendingObj.pre = rec.data;
        pendingObj.preHash = self.generateHash(rec.data);
        storePendingObject(pendingObj);
      }, function(code, msg) {
        failure(code, msg);
      });
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
          self.syncComplete(dataset_id, "offline");
        } else {
          var syncLoopParams = {};
          syncLoopParams.fn = 'sync';
          syncLoopParams.dataset_id = dataset_id;
          syncLoopParams.query_params = dataSet.query_params;
          //var datasetHash = self.generateLocalDatasetHash(dataSet);
          syncLoopParams.dataset_hash = dataSet.hash;
          syncLoopParams.acknowledgements = dataSet.acknowledgements || [];

          var pending = dataSet.pending;
          var pendingArray = [];
          for(var i in pending ) {
            // Mark the pending records we are about to submit as inflight and add them to the array for submission
            // Don't re-add previous inFlight pending records who whave crashed - i.e. who's current state is unknown
            if( !pending[i].inFlight && !pending[i].crashed ) {
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
            actFunc({
              'act': dataset_id,
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
                processUpdates(res.updates.applied, self.notifications.REMOTE_UPDATE_APPLIED, acknowledgements);
                processUpdates(res.updates.failed, self.notifications.REMOTE_UPDATE_FAILED, acknowledgements);
                processUpdates(res.updates.collisions, self.notifications.COLLISION_DETECTED, acknowledgements);
                dataSet.acknowledgements = acknowledgements;
              }

              else if (res.hash && res.hash !== dataSet.hash) {
                self.consoleLog("Local dataset stale - syncing records :: local hash= " + dataSet.hash + " - remoteHash=" + res.hash);
                // Different hash value returned - Sync individual records
                self.syncRecords(dataset_id);
              } else {
                self.consoleLog("Local dataset up to date");
              }
              self.syncComplete(dataset_id,  "online");
            }, function(msg, err) {
              // The AJAX call failed to complete succesfully, so the state of the current pending updates is unknown
              // Mark them as "crashed". The next time a syncLoop completets successfully, we will review the crashed
              // records to see if we can determine their current state.
              self.markInFlightAsCrashed(dataSet);
              self.consoleLog("syncLoop failed : msg=" + msg + " :: err = " + err);
              self.doNotify(dataset_id, null, self.notifications.SYNC_FAILED, msg);
              self.syncComplete(dataset_id,  msg);
            });
          }
          catch (e) {
            self.consoleLog('Error performing sync - ' + e);
            self.syncComplete(dataset_id, e);
          }
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

      actFunc({
        'act': dataset_id,
        'req': syncRecParams
      }, function(res) {
        var i;

        if (res.create) {
          for (i in res.create) {
            localDataSet[i] = {"hash" : res.create[i].hash, "data" : res.create[i].data};
            self.doNotify(dataset_id, i, self.notifications.DELTA_RECEIVED, "create");
          }
        }
        if (res.update) {
          for (i in res.update) {
            localDataSet[i].hash = res.update[i].hash;
            localDataSet[i].data = res.update[i].data;
            self.doNotify(dataset_id, i, self.notifications.DELTA_RECEIVED, "update");
          }
        }
        if (res['delete']) {
          for (i in res['delete']) {
            delete localDataSet[i];
            self.doNotify(dataset_id, i, self.notifications.DELTA_RECEIVED, "delete");
          }
        }

        dataSet.data = localDataSet;
        if(res.hash) {
          dataSet.hash = res.hash;
        }
        self.syncComplete(dataset_id, "online");
      }, function(msg, err) {
        self.consoleLog("syncRecords failed : msg=" + msg + " :: err=" + err);
        self.syncComplete(dataset_id, msg);
      });
    });
  },

  syncComplete: function(dataset_id, status) {

    self.getDataSet(dataset_id, function(dataset) {
      dataset.syncRunning = false;
      dataset.syncLoopEnd = new Date().getTime();
      self.saveDataSet(dataset_id);
      self.doNotify(dataset_id, dataset.hash, self.notifications.SYNC_COMPLETE, status);
    });
  },

  checkDatasets: function() {
    for( var dataset_id in self.datasets ) {
      if( self.datasets.hasOwnProperty(dataset_id) ) {
        var dataset = self.datasets[dataset_id];

        if( !dataset.syncRunning ) {
          // Check to see if it is time for the sync loop to run again
          var lastSyncStart = dataset.syncLoopStart;
          var lastSyncCmp = dataset.syncLoopEnd;
          if( lastSyncStart == null ) {
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
            // If the dataset requres syncing, run the sync loop. This may be because the sync interval has passed
            // or because the sync_frequency has been changed or because a change was made to the dataset and the
            // immediate_sync flag set to true
           self.syncLoop(dataset_id);
          }
        }
      }
    }
  },

  datasetMonitor: function() {
    self.checkDatasets();

    // Re-execute datasetMonitor every 500ms so we keep invoking checkDatasets();
    setTimeout(function() {
      self.datasetMonitor();
    }, 500);
  },

  saveDataSet: function (dataset_id, cb) {
    var onFail =  function(msg, err) {
      // save failed
      var errMsg = 'save to local storage failed  msg:' + msg + ' err:' + err;
      self.doNotify(dataset_id, null, self.notifications.CLIENT_STORAGE_FAILED, errMsg);
      self.consoleLog(errMsg);
    };
    self.getDataSet(dataset_id, function(dataset) {
      // save dataset to local storage
      // the order of adapter wasn't specified previously, in this case, Lawnchair will check adapters using LIFO.
      // If we don't specify the order of adapters here, the order of when an adapter is added to Lawnchair in grunt file or during app runing could break backward compatibility.
      Lawnchair({fail:onFail, adapter: ["webkit-sqlite", "dom", "localFileStorage", "window-name"]}, function (){
           this.save({key:"dataset_" + dataset_id,val:JSON.stringify(dataset)}, function(){
             //save success
             if( cb ) {
               cb();
             }
           });
      });
    });
  },

  loadDataSet: function (dataset_id, success, failure) {
    // load dataset from local storage
    var onFail = function(msg, err) {
      // load failed
      var errMsg = 'load from local storage failed  msg:' + msg;
      self.doNotify(dataset_id, null, self.notifications.CLIENT_STORAGE_FAILED, errMsg);
      self.consoleLog(errMsg);
    };

    Lawnchair({fail:onFail, adapter: ["webkit-sqlite", "dom", "localFileStorage", "window-name"]},function (){
       this.get( "dataset_" + dataset_id, function (data){
         if (data && data.val !== null) {
            var dataset = JSON.parse(data.val);
            // Datasets should not be auto initialised when loaded - the mange function should be called for each dataset
            // the user wants sync
            dataset.initialised = false;
            self.datasets[dataset_id] = dataset; // TODO: do we need to handle binary data?
            self.consoleLog('load from local storage success for dataset_id :' + dataset_id);
            return success(dataset);
          } else {
              // no data yet, probably first time. failure calback should handle this
              return failure();
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
          if( previousPending && !previousPending.inFlight) {
            self.consoleLog('existing pre-flight pending record = ' + JSON.stringify(previousPending));
            // We are trying to perform an update on an existing pending record
            // modify the original record to have the latest value and delete the pending update
            previousPending.post = pendingRec.post;
            previousPending.postHash = pendingRec.postHash;
            delete pending[pendingRec.hash];
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
          if( previousPending && !previousPending.inFlight ) {
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
          else if (!pendingRec.inFlight && pendingRec.crashed ) {
            self.consoleLog('updateCrashedInFlightFromNewData - Trying to resolve issues with crashed non in flight record - uid = ' + pendingRec.uid);
            // Stalled pending record because a previous pending update on the same record crashed
            var crashedRef = resolvedCrashes[pendingRec.uid];
            if( crashedRef ) {
              self.consoleLog('updateCrashedInFlightFromNewData - Found a stalled pending record backed up behind a resolved crash uid=' + pendingRec.uid + ' :: hash=' + pendingRec.hash);
              pendingRec.crashed = false;
            }
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

      // Check for any pending updates that would be modifying a crashed record. These can not go out until the
      // status of the crashed record is determined
      for( pendingHash in pending ) {
        if( pending.hasOwnProperty(pendingHash) ) {
          pendingRec = pending[pendingHash];

          if( ! pendingRec.inFlight ) {
            var crashedRef = crashedRecords[pendingRec.uid];
            if( crashedRef ) {
              pendingRec.crashed = true;
            }
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
  getDataset : self.getDataSet
};



$fh = $fh || {};
$fh.sync = (function() {

  var self = {

    // CONFIG
    defaults: {
      "sync_frequency": 10,
      // How often to synchronise data with the cloud in seconds.
      "auto_sync_local_updates": true,
      // Should local chages be syned to the cloud immediately, or should they wait for the next sync interval
      "notify_client_storage_failed": false,
      // Should a notification event be triggered when loading/saving to client storage fails
      "notify_sync_started": false,
      // Should a notification event be triggered when a sync cycle with the server has been started
      "notify_sync_complete": true,
      // Should a notification event be triggered when a sync cycle with the server has been completed
      "notify_offline_update": false,
      // Should a notification event be triggered when an attempt was made to update a record while offline
      "notify_collision_detected": false,
      // Should a notification event be triggered when an update failed due to data collision
      "notify_remote_update_failed": false,
      // Should a notification event be triggered when an update failed for a reason other than data collision
      "notify_local_update_applied": false,
      // Should a notification event be triggered when an update was applied to the local data store
      "notify_remote_update_applied": false,
      // Should a notification event be triggered when an update was applied to the remote data store
      "notify_delta_received": false,
      // Should a notification event be triggered when a delta was received from the remote data store (dataset or record - depending on whether uid is set)
      "notify_sync_failed": false,
      // Should a notification event be triggered when the sync loop failed to complete
      "do_console_log": false
      // Should log statements be written to console.log
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
      self.config = JSON.parse(JSON.stringify(self.defaults));
      for (var i in options) {
        self.config[i] = options[i];
      }
    },

    notify: function(callback) {
      self.notify_callback = callback;
    },

    manage: function(dataset_id, options, query_params) {

      var doManage = function(dataset) {
        self.consoleLog('doManage dataset :: initialised = ', dataset.initialised, " :: ", dataset_id, ' :: ', options);

        var datasetConfig = JSON.parse(JSON.stringify(options));
        for (var i in options) {
          datasetConfig[i] = options[i];
        }

        // Make sure config is initialised
        if( ! self.config ) {
          self.config = self.defaults;
        }

        datasetConfig = JSON.parse(JSON.stringify(self.config));
        for (var idx in options) {
          datasetConfig[idx] = options[idx];
        }

        dataset.query_params = query_params || {};
        dataset.config = datasetConfig;

        if( dataset.initialised !== true) {
          dataset.initialised = true;
          self.saveDataSet(dataset_id);
          self.syncLoop(dataset_id);
        } else {
          if( dataset.timeoutInterval ) {
            self.consoleLog('Clearing timeout for dataset sync loop');
            clearTimeout(dataset.timeoutInterval);
            self.syncLoop(dataset_id);
          }
        }
      };

      // Check if the dataset is already loaded
      self.getDataSet(dataset_id, function(dataset) {
        doManage(dataset);
      }, function(err) {
        // Not already loaded, try to load from local storage
        self.loadDataSet(dataset_id, function(dataset) {
            // Loading from local storage worked
            doManage(dataset);
          },
          function(err) {
            // No dataset in memory or local storage - create a new one and put it in memory
            self.consoleLog('manage -> getDataSet : ', arguments);
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



    // PRIVATE FUNCTIONS
    isOnline: function(callback) {
      var online = true;

      // TODO HACK FOR LOCAL DEV - DELETE
      //return callback(online);

      // first, check if navigator.online is available
      if(typeof navigator.onLine !== "undefined"){
        online = navigator.onLine;
      }

      // second, check if Phonegap is available and has online info
      if(online){
        //use phonegap to determin if the network is available
        if(typeof navigator.network !== "undefined" && typeof navigator.network.connection !== "undefined"){
          var networkType = navigator.network.connection.type;
          if(networkType === "none" || networkType == null) {
            online = false;
          }
        }
      }

      return callback(online);

//      // third, ping app cloud
//      if (online) {
//        // ajax call to app ping endpoint
//        $fh.__ajax({
//          url:"/sys/info/ping",
//          type: "GET",
//          timeout: 2000, // 2 second timeout
//          success: function () {
//            self.consoleLog('ONLINE CHECK OK');
//            callback(true);
//          },
//          error: function () {
//            self.consoleLog('ONLINE CHECK NOT OK');
//            callback(false);
//          }
//        });
//      } else {
//        callback(false);
//      }
    },

    doNotify: function(dataset_id, uid, code, message) {
      //self.consoleLog('doNotify', dataset_id, uid, code, message);

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
        failure('unknown_dataset', dataset_id);
      }
    },

    generateHash: function(string) {
      var hash = CryptoJS.SHA1(string);
      return hash.toString();
    },

    addPendingObj: function(dataset_id, uid, data, action, success, failure) {
      self.isOnline(function (online) {
        if (!online) {
          self.doNotify(dataset_id, uid, self.notifications.OFFLINE_UPDATE, action);
        }
      });

      function storePendingObject(obj) {
        obj.action = action;
        obj.hash = self.generateHash(JSON.stringify(pendingObj));
        obj.timestamp = new Date().getTime();

        self.consoleLog("storePendingObj :: " + JSON.stringify( obj ));

        self.getDataSet(dataset_id, function(dataset) {
          if( "update" === action ) {
            dataset.data[uid].data = obj.post;
            dataset.data[uid].hash = self.generateHash(JSON.stringify(obj.data));
          } else if( "delete" === action ) {
            delete dataset.data[uid];
          }

          dataset.pending[obj.hash] = obj;

          self.saveDataSet(dataset_id);
          self.doNotify(dataset_id, uid, self.notifications.LOCAL_UPDATE_APPLIED, action);
          if(self.config.auto_sync_local_updates) {
            if( dataset.timeoutInterval ) {
              self.consoleLog('auto_sync_local_updates - clearing timeout for dataset sync loop');
              clearTimeout(dataset.timeoutInterval);
              self.syncLoop(dataset_id);
            }
          }
          success(obj);
        }, function(code, msg) {
          failure(code, msg);
        });
      }

      if( "create" === action ) {
        var pendingObj = {};
        pendingObj.uid = null;
        pendingObj.pre = null;
        pendingObj.post = data;
        storePendingObject(pendingObj);
      } else {
        self.read(dataset_id, uid, function(rec) {
          var pendingObj = {};
          pendingObj.uid = uid;
          pendingObj.pre = rec.data;
          pendingObj.post = data;
          storePendingObject(pendingObj);
        }, function(code, msg) {
          failure(code, msg);
        });
      }
    },


    syncLoop: function(dataset_id) {
      self.doNotify(dataset_id, null, self.notifications.SYNC_STARTED, null);
      self.isOnline(function(online) {
        if (!online) {
          self.syncComplete(dataset_id, "offline");
        } else {
          self.getDataSet(dataset_id, function(dataSet) {
            var syncLoopParams = {};
            syncLoopParams.fn = 'sync';
            syncLoopParams.dataset_id = dataset_id;
            syncLoopParams.query_params = dataSet.query_params;
            syncLoopParams.dataset_hash = dataSet.hash;

            var pending = dataSet.pending;
            var pendingArray = [];
            for(var i in pending ) {
              pendingArray.push(pending[i]);
            }
            syncLoopParams.pending = pendingArray;

            self.consoleLog('Starting sync loop - global hash = ', dataSet.hash, ' :: pending = ', JSON.stringify(pendingArray));

            $fh.act({
              'act': dataset_id,
              'req': syncLoopParams
            }, function(res) {
              self.consoleLog("Back from Sync Loop : full Dataset = " + (res.records ? " Y" : "N"));
              var i, rec;

              function processUpdates(updates, notification) {
                if( updates ) {
                  for (var idx in updates) {
                    rec = updates[idx];
                    delete dataSet.pending[idx];
                    self.doNotify(dataset_id, rec.uid, notification, rec);
                  }
                }
              }

              if (res.updates) {
                processUpdates(res.updates.applied, self.notifications.REMOTE_UPDATE_APPLIED);
                processUpdates(res.updates.failed, self.notifications.REMOTE_UPDATE_FAILED);
                processUpdates(res.updates.collisions, self.notifications.COLLISION_DETECTED);
              }

              if (res.records) {
                // Full Dataset returned
                dataSet.data = res.records;
                dataSet.hash = res.hash;
                self.doNotify(dataset_id, res.hash, self.notifications.DELTA_RECEIVED, 'full dataset');
                self.consoleLog("Full Dataset returned");
                self.syncComplete(dataset_id,  "online");

              }
              else if (res.hash && res.hash !== dataSet.hash) {
                self.consoleLog("Local dataset stale - syncing records :: local hash= ", dataSet.hash, " - remoteHash=", res.hash);
                // Different hash value returned - Sync individual records
                self.syncRecords(dataset_id);
              } else {
                self.consoleLog("Local dataset up to date");
                self.syncComplete(dataset_id,  "online");
              }
            }, function(msg, err) {
              self.consoleLog("syncLoop failed : ", arguments);
              self.doNotify(dataset_id, null, self.notifications.SYNC_FAILED, msg);
              self.syncComplete(dataset_id,  msg);
            });
          });
        }
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

        self.consoleLog("syncRecParams :: ", syncRecParams);

        $fh.act({
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
          self.consoleLog("syncRecords failed : ", arguments);
          self.syncComplete(dataset_id, msg);
        });
      });
    },

    syncComplete: function(dataset_id, status) {
      //self.consoleLog('syncComplete');
      self.saveDataSet(dataset_id);

      self.getDataSet(dataset_id, function(dataset) {
        //self.consoleLog("dataset.config.sync_frequency :: " + dataset.config.sync_frequency);
        // set timeout for next sync loop execution
        dataset.timeoutInterval = setTimeout(function() {
          self.syncLoop(dataset_id);
        }, dataset.config.sync_frequency * 1000);
        self.doNotify(dataset_id, dataset.hash, self.notifications.SYNC_COMPLETE, status);

      });
    },

    saveDataSet: function (dataset_id) {
      self.getDataSet(dataset_id, function(dataset) {
        // save dataset to local storage
        $fh.data({
          act: "save",
          key: "dataset_" + dataset_id,
          val: JSON.stringify(dataset)
        }, function() {
          //save success
          //self.consoleLog('save to local storage success');
        }, function(msg, err) {
          // save failed
          var errMsg = 'save to local storage failed  msg:' + msg + ' err:' + err;
          self.doNotify(dataset_id, null, self.notifications.CLIENT_STORAGE_FAILED, errMsg);
          self.consoleLog(errMsg);
        });
      });
    },

    loadDataSet: function (dataset_id, success, failure) {
      // load dataset from local storage
      $fh.data({
        act: "load",
        key: "dataset_" + dataset_id
      }, function(res) {
        //load success

        // may be null if first time
        if (res.val !== null) {
          var dataset = JSON.parse(res.val);
          // Datasets should not be auto initialised when loaded - the mange function should be called for each dataset
          // the user wants sync
          dataset.initialised = false;
          self.datasets[dataset_id] = dataset; // TODO: do we need to handle binary data?
          self.consoleLog('load from local storage success dataset:', dataset);
          return success(dataset);
        } else {
          // no data yet, probably first time. failure calback should handle this
          return failure();
        }
      }, function(msg, err) {
        // load failed
        var errMsg = 'load from local storage failed  msg:' + msg + ' err:' + err;
        self.doNotify(dataset_id, null, self.notifications.CLIENT_STORAGE_FAILED, errMsg);
        self.consoleLog(errMsg);
      });
    },

    consoleLog: function() {
    if( self.config.do_console_log ) {
      console.log(arguments);
    }
  }
  };

  (function() {
    self.config = self.defaults;
  })();

  return {
    init: self.init,
    manage: self.manage,
    notify: self.notify,
    list: self.list,
    create: self.create,
    read: self.read,
    update: self.update,
    'delete': self['delete']
  };
})();
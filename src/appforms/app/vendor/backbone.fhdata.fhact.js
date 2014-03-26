/**
 * @fileOverview This is an adaptation of Backbone.localStorage, edited to work
 *     with the asynchronous FeedHenry local data storage API,
 *     with optional fh.act enpdoints for listing & reading from cloud
 * @version 0.3
 * @author gareth.cpm@gmail.com (Gareth Murphy), david.martin@feedhenry.com
 */

/* Monkey Patch for $fh.data to use File backed storage */
var overridden = false;
function overrideFHData() {

  if(!overridden) {
    overridden = true;
    /* Monkey Patch for $fh.data to use File backed storage
     *
     *              .-"""-.
     *            _/-=-.   \
     *           (_|a a/   |_
     *            / "  \   ,_)
     *       _    \`=' /__/
     *      / \_  .;--'  `-.
     *      \___)//      ,  \
     *       \ \/;        \  \
     *        \_.|         | |
     *         .-\ '     _/_/
     *       .'  _;.    (_  \
     *      /  .'   `\   \\_/
     *     |_ /       |  |\\
     *    /  _)       /  / ||
     *   /  /       _/  /  //
     *   \_/       ( `-/  ||
     *             /  /   \\ .-.
     *             \_/     \'-'/
     *                      `"`
     */

    if (typeof(window.requestFileSystem) !== 'undefined') {

      // Redefine $fh.data
      $fh.data = function(options, success, failure) {
        function fail(msg) {
          console.log('fail: msg= ' + msg);
          if (typeof failure !== 'undefined') {
            return failure(msg, {});
          } else {
            console.log('failure: ' + msg);
          }
        }

        function filenameForKey(key, cb) {
          key = $fh.app_props.appid + key;
          console.log('filenameForKey: ' + key);
          $fh.hash({
            algorithm: "MD5",
            text: key
          }, function(result) {
            var filename = result.hashvalue + '.txt';
            if (typeof navigator.externalstorage !== "undefined") {
              navigator.externalstorage.enable(function handleSuccess(res){
                var path = filename;
                if(res.path ) {
                  path = res.path;
                  if(!path.match(/\/$/)) {
                    path += '/';
                  }
                  path += filename;
                }
                filename = path;
                console.log('filenameForKey key=' + key+ ' , Filename: ' + filename);
                return cb(filename);
              },function handleError(err){
                console.warn('filenameForKey ignoring error=' + JSON.stringify(err));
                console.log('filenameForKey key=' + key+ ' , Filename: ' + filename);
                return cb(filename);
              })
            } else {
              console.log('filenameForKey key=' + key+ ' , Filename: ' + filename);
              return cb(filename);
            }

          });
        }

        function save(key, value) {
          filenameForKey(key, function(hash) {
            window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function gotFS(fileSystem) {
              fileSystem.root.getFile(hash, {
                create: true
              }, function gotFileEntry(fileEntry) {
                fileEntry.createWriter(function gotFileWriter(writer) {
                  console.log('save: ' + key + ', ' + JSON.stringify(value).substring(0,50) + '. Filename: ' + hash);
                  writer.onwrite = function(evt) {
                    return success({
                      key: key,
                      val: value
                    });
                  };
                  writer.write(value);
                }, function() {
                  fail('[save] Failed to create file writer');
                });
              }, function() {
                fail('[save] Failed to getFile');
              });
            }, function() {
              fail('[save] Failed to requestFileSystem');
            });
          });
        }

        function remove(key) {
          filenameForKey(key, function(hash) {
            console.log('remove: ' + key + '. Filename: ' + hash);

            window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function gotFS(fileSystem) {
              fileSystem.root.getFile(hash, {}, function gotFileEntry(fileEntry) {
                console.log('remove: ' + key +  '. Filename: ' + hash);
                fileEntry.remove(function() {
                  return success({
                    key: key,
                    val: null
                  });
                }, function() {
                  fail('[remove] Failed to remove file');
                });
              }, function() {
                fail('[remove] Failed to getFile');
              });
            }, function() {
              fail('[remove] Failed to get fileSystem');
            });
          });
        }

        function load(key) {
          filenameForKey(key, function(hash) {
            window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function gotFS(fileSystem) {
              fileSystem.root.getFile(hash, {}, function gotFileEntry(fileEntry) {
                fileEntry.file(function gotFile(file) {
                  var reader = new FileReader();
                  reader.onloadend = function (evt) {
                    var text = evt.target.result;
                    // Check for URLencoded
                    // PG 2.2 bug in readAsText()
                    try {
                      text = decodeURIComponent(text);
                    } catch (e) {
                      // Swallow exception if not URLencoded
                      // Just use the result
                    }
                    console.log('load: ' + key +  '. Filename: ' + hash + " value:" + evt.target.result);
                    return success({
                      key: key,
                      val: text
                    });
                  };
                  reader.readAsText(file);
                }, function() {
                  fail('[load] Failed to getFile');
                });
              }, function() {
                // Success callback on key load failure
                success({
                  key: key,
                  val: null
                });
              });
            }, function() {
              fail('[load] Failed to get fileSystem');
            });
          });
        }
        if (typeof options.act === 'undefined') {
          return load(options.key);
        } else if (options.act === 'save') {
          return save(options.key, options.val);
        } else if (options.act === 'remove') {
          return remove(options.key);
        } else if (options.act === 'load') {
          return load(options.key);
        } else {
          if (typeof failure !== 'undefined') {
            return failure("Action [" + options.act + "] is not defined", {});
          }
        }
      };
    }
  }
}

$fh.ready({},overrideFHData);


// Generate four random hex digits (for GUIDs).

function S4() {
  return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
}

// Generate a pseudo-GUID by concatenating random hexadecimal.

function guid() {
  return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
}

// Our Store is represented by a single JS object in FeedHenry's data store.
// Create it with a meaningful name, like the name you'd give a table.
var FHBackboneDataActSync = function(name, actList, actRead, idField, versionField) {
  this.localStoreVersion = '0.3'; // versioning to force a nuke of local store DANGER!!!
  this.name = name;
  this.data = null;
  this.actList = actList;
  this.actRead = actRead;
  this.idField = idField;
  this.versionField = versionField;
  this.forceReload =false;
  _.bindAll(this);
};

_.extend(FHBackboneDataActSync.prototype, Backbone.Events);

_.extend(FHBackboneDataActSync.prototype, {
  key: function() {
    return _.compact(_.toArray(arguments)).join("/");
  },
  force: function() {
    this.forceReload = true;
  },
  init: function(model, cb) {
    var self = this;

    this.data = {};

    $fh.ready({},function() {
      $fh.logger.debug('FHBackboneDataActSync  :: init data for:"'+self.name+ '"');
      $fh.data({
        key: self.key(self.name , self.localStoreVersion)
      }, function(res) {
        try {
          if (res.val && res.val !== '') {
            self.data = JSON.parse(res.val);
            $fh.logger.info('FHBackboneDataActSync  :: found data in local storage for "' + self.name + '"');
          }
        } catch (e) {
          // leave data as default
        }
        var dataEmpty = _.isEmpty(self.data);

        // get data from server if act endpoint defined
        if (self.actList != null) {

          Utils.isOnline(function(online) {
            if (online) {
              $fh.act({
                act: self.actList
              }, function(res) {
                if (res && res.error) {
                  if (dataEmpty) {
                    return cb(res.error);
                  } else {
                    return self.trigger('error', res.error);
                  }
                }

                // res.config are the incoming default values
                // if force_cloud_config_updates is set to true
                //    then delete all the current values and set current to defaults
                // if force_cloud_config_updates is set to field name(s)
                //    then delete those fields and update to defaults
                // otherwise just update defaults
                if (res && res.config) {
                  var defaults = _.extend({}, res.config);
                  var force = defaults.force_cloud_config_updates;
                  delete defaults.force_cloud_config_updates;

                  // new res.config are the incoming defaults
                  var merged = _.extend({}, App.config.attributes);

                  if(force === true || _.isArray(force) || _.isString(force) ) {
                    // silent stops the events being fired
                    if(force === true) {
                      App.config.clear({silent:true});
                      merged = _.extend({}, defaults);
                    } else {
                      // clear the listed attributes
                      var toClear = _.flatten([force]);
                      var updates = _.pick(defaults, toClear);
                      merged = _.extend({}, App.config.attributes, updates);
                    }
                  }
                  merged.defaults = _.extend({}, defaults);
                  $fh.logger.debug('FHBackboneDataActSync :: updating config merged =' + JSON.stringify(merged));
                  App.config.set(merged);
                }
                // update data if there is any
                var dataUpdated = false;
                if (res && res.data) {
                  var dataObj = {};
                  _(res.data).forEach(function(item, index) {
                    var currentData = self.data[item[self.idField]];
                    // update data if data doesn't exist already, or if version is different, otherwise no change to data
                    if (currentData == null || (currentData[self.versionField] !== item[self.versionField])) {
                      $fh.logger.debug('updating data for:"', self.name, '"');
                      dataUpdated = true;
                      self.data[item[self.idField]] = item;
                      // don't update version field to force update of full details
                      if (currentData && currentData[self.versionField]) {
                        self.data[item[self.idField]][self.versionField] = currentData[self.versionField];
                      }
                    }
                  });
                }
                if (dataEmpty) {
                  // data inited for first time. save to local storage and callback straight away (no need to wait for save)
                  self.save(function() {
                    $fh.logger.debug('inited data for "', self.name, '" saved to local storage');
                  });
                  cb(null);
                } else {
                  if (dataUpdated) {
                    // data already initialised from local storage, need to update the data and let subsequent events on models
                    // take care of updating views i.e. don't call cb
                    self.save(function() {
                      $fh.logger.debug('updated data for "', self.name, '" saved to local storage');
                    });
                  }
                }
              }, function(msg, err) {
                if (dataEmpty) {
                  cb(msg + '::' + err);
                }
              });
            } else {
              var errMsg = 'Not connected to internet.';
              if (dataEmpty) {
                cb(errMsg);
              } else {
                self.trigger('error', errMsg);
              }
            }
          });
        }

        // if we have data already, or no act endpoint defined, cb now, otherwise cb will happen when act returns
        if (!dataEmpty || self.actList == null) {
          cb(null);
        }

      }, function(msg, err) {
        cb(msg + '::' + err);
      });
    });
  },

  // Save the current state of the Store to the FeedHenry local this.data store.
  save: function(cb) {
    var self = this;
    $fh.data({
      act: 'save',
      key: this.key(this.name , this.localStoreVersion),
      val: JSON.stringify(this.data)
    }, function() {
      cb(null);
    }, function(msg, err) {
      var errMsg = 'ERROR saving data :: msg:' + msg + ' err:' + err;
      self.trigger('error', errMsg);
      $fh.logger.error(errMsg);
      cb(err);
    });
  },

  /* Add a model, giving it a (hopefully) unique GUID, if it doesn't already
   have an id of it's own. */
  create: function(model, cb) {
    if (!model.id) model.set(model.idAttribute, guid());
    this.data[model.id] = model;
    this.save(function(err) {
      return cb(err, model);
    });
  },

  // Update a model by replacing its copy in`this.data`.
  update: function(model, cb) {
    this.data[model.id] = model;
    this.save(function(err) {
      return cb(err, model);
    });
  },

  // Retrieve a model from `this.this.this.data` by id.
  find: function(modelToFind, cb) {
    var self = this;
    var modelData = this.data[modelToFind.id];
    var dataLoaded = modelData.fh_full_data_loaded;

    // kick off act call to get/update full data if act endpoint defined
    if (self.actRead != null) {
      var actParams = {
        act: self.actRead,
        req: {
          id: modelData[self.idField]
        }
      };
      // send current version of full data, if we have full
      if (dataLoaded) {
        actParams.req.version = modelData[self.versionField];
      }
      Utils.isOnline(function(online) {
        if (online) {
          // TODO : currently this is only called for the form meta data.
          // this meta data at present can only be saved in a single file
          // i.e. not indexed

          $fh.act(actParams, function(res) {
            if (res && res.error) {
              if (!dataLoaded) {
                return cb(res.error);
              } else {
                return self.trigger('error', res.error);
              }
            }
            // update data if there is any
            var dataUpdated = false;
            // only update data if we have full data for first time, or if version fields are different on what we have vs
            // what we got
            if (res && res.data && (!dataLoaded || (res.data[self.versionField] !== self.data[modelToFind.id][self.versionField]))) {
              dataUpdated = true;
              $fh.logger.debug('updating data for:"', self.name, '" id:"', modelData[self.idField], '"');
              self.data[modelToFind.id] = res.data;
              self.data[modelToFind.id].fh_full_data_loaded = true;
            }
            if (!dataLoaded || dataUpdated) {
              // save data to local storage
              self.save(function() {
                $fh.logger.debug('updated data for:"', self.name, '" id:"', modelToFind.id, '" saved to local storage');
              });
              // and either:
              // - callback straight away if data never loaded before (no need to wait til save finished)
              // - reset collection with updated data
              if (!dataLoaded) {
                return cb(null, self.data[modelToFind.id]);
              } else {
                var collection = modelToFind.collection;
                collection.reset(_.values(self.data), {
                  noFetch: true
                });
              }
            }
          }, function(msg, err) {
            var errMsg = 'msg:' + msg + ' err:' + err;
            if (!dataLoaded) {
              cb(errMsg);
            } else {
              self.trigger('error', errMsg);
            }
          });
        } else {
          var errMsg = 'Not connected to internet';
          if (!dataLoaded) {
            cb(errMsg);
          } else {
            self.trigger('error', errMsg);
          }
        }
      });
    }

    // if data already fully loaded or we have no act enpdoint to call, callback straight away instead of waiting for fhact response
    if (dataLoaded || self.actRead == null) {
      return cb(null, modelData);
    }
  },

  // Return the array of all models currently in storage as we're working with a collection
  findAll: function(cb) {
    return cb(null, _.values(this.data));
  },

  // Delete a model from `this.data`, returning it.
  destroy: function(model, cb) {
    delete this.data[model.id];
    this.save(function(err) {
      return cb(err, model);
    });
  }
});

FHBackboneDataActSyncFn = function(method, model, options) {
  if (!model.store && !model.collection) {
    $fh.logger.debug("Trying to destroy a model that's not part of a store, returning.");
    return;
  }

  var store = model.store || model.collection.store;

  if(store.name == "drafts") {
    console.log("FHBackboneDataActSyncFn drafts");
  }
  function storeCb(err, resp) {
    if (err || resp == null) return options.error("Record not found");
    return options.success(resp);
  }

  function routeMethod() {
    switch (method) {
      case "read":
        return model.id ? store.find(model, storeCb) : store.findAll(storeCb);
      case "create":
        return store.create(model, storeCb);
      case "update":
        return store.update(model, storeCb);
      case "delete":
        return store.destroy(model, storeCb);
    }
  }

  // if we don't have data yet, initialise it before routing the method
  if (store.forceReload || store.data == null ) {
    store.init(model, function(err) {
      store.forceReload  = false;
      if (err) return options.error(err);

      return routeMethod();
    });
    return;
  }
  return routeMethod();
};



var FHBackboneIndexedDataActSync = function(name, actList, actRead, idField, versionField) {
  if(actList) {
    throw "TODO FIXME";
  }
  FHBackboneDataActSync.call(this,name, actList, actRead, idField, versionField);
  _.bindAll(this);
  console.log("FHBackboneIndexedDataActSync", this);
};

_.extend(FHBackboneIndexedDataActSync.prototype,FHBackboneDataActSync.prototype);
_.extend(FHBackboneIndexedDataActSync.prototype,{

  /* Add a model, giving it a (hopefully) unique GUID, if it doesn't already
   have an id of it's own. */

  // low level CRUD
  _read: function(id,cb) {
    var self = this;
    $fh.data({
      key: self.key(self.name, self.localStoreVersion, id)
    }, function(res) {
      var data;
      try {
        if (res.val && res.val !== '') {
          data = JSON.parse(res.val);
        }
      } catch (e) {
        // leave data as default
      }
      cb(null,data);
    }, function(msg, err) {
      var errMsg = 'ERROR saving data :: msg:' + msg + ' err:' + err;
      self.trigger('error', errMsg);
      $fh.logger.error(errMsg);
      cb(err);
    });
  },

  _delete: function(name,cb) {
    var self = this;
    $fh.data({
      act: 'remove',
      key: name
    }, function() {
      cb(null);
    }, function(msg, err) {
      var errMsg = 'ERROR saving data :: msg:' + msg + ' err:' + err;
      self.trigger('error', errMsg);
      $fh.logger.error(errMsg);
      cb(err);
    });
  },

  _write: function(name,data,cb) {
    var self = this;
    $fh.data({
      act: 'save',
      key: name,
      val: JSON.stringify(data)
    }, function() {
      cb(null);
    }, function(msg, err) {
      var errMsg = 'ERROR saving data :: msg:' + msg + ' err:' + err;
      self.trigger('error', errMsg);
      $fh.logger.error(errMsg);
      cb(err);
    });
  },
  // compound method to save object and the update the index
  copy: function(model) {
    var id = model.id;
    var attrs = _.clone(model.attributes);
    delete attrs.Pages;
    delete attrs.Rules;
    return new model.collection.model(attrs);
  },

  // compound method to save object and the update the index
  _saveModelAndIndex: function(model, cb) {
    var id = model.id;
    var cpy = this.copy(model);
    cpy.set("flyweight", true);
    this.data[id] = cpy;
    var self = this;

    this._write(self.key(this.name, this.localStoreVersion, id),model,function (err){
      if(err) {return cb(err, model);}
      self._write(self.key(self.name , self.localStoreVersion),self.data,function(err) {
        return cb(err, model);
      });
    });
  },

  create: function(model, cb) {
    if (!model.id) {
      model.set(model.idAttribute, guid());
    } else {
      $fh.logger.debug("WARNING backbond create called with object with id!!");
      alert("WARNING backbond create called with object with id!!");
    }
    this._saveModelAndIndex(model, cb);
  },

  // Update a model by replacing its copy in`this.data`.
  update: function(model, cb) {
    this._saveModelAndIndex(model, cb);
  },

  // Delete a model from `this.data`, returning it.
  destroy: function(model, cb) {
    delete this.data[model.id];

    var self = this;
    this._delete(self.key(this.name, this.localStoreVersion, model.id),function (err){
      if(err) {return cb(err, model);}
      self._write(self.key(self.name , self.localStoreVersion),self.data,function(err) {
        return cb(err, model);
      });
    });
  }

});

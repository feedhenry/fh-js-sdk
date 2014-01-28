/**
 * Local storage stores a model's json definition persistently.
 */
appForm.stores = function (module) {
  //implementation
  var utils = appForm.utils;
  var fileSystem = utils.fileSystem;
  var _fileSystemAvailable = function () {
  };
  //placeholder
  function LocalStorage() {
    appForm.stores.Store.call(this, 'LocalStorage');
  }
  appForm.utils.extend(LocalStorage, appForm.stores.Store);
  //store a model to local storage
  LocalStorage.prototype.create = function (model, cb) {
    var key = utils.localId(model);
    model.setLocalId(key);
    this.update(model, cb);
  };
  //read a model from local storage
  LocalStorage.prototype.read = function (model, cb) {
    var key = model.getLocalId();
    if (key != null) {
      _fhData({
        'act': 'load',
        'key': key.toString()
      }, cb, cb);
    } else {
      //model does not exist in local storage if key is null.
      cb(null, null);
    }
  };
  //update a model
  LocalStorage.prototype.update = function (model, cb) {
    var key = model.getLocalId();
    var data = model.getProps();
    var dataStr = JSON.stringify(data);
    _fhData({
      'act': 'save',
      'key': key.toString(),
      'val': dataStr
    }, cb, cb);
  };
  //delete a model
  LocalStorage.prototype["delete"] = function (model, cb) {
    var key = model.getLocalId();
    _fhData({
      'act': 'remove',
      'key': key.toString()
    }, cb, cb);
  };
  LocalStorage.prototype.upsert = function (model, cb) {
    var key = model.getLocalId();
    if (key == null) {
      this.create(model, cb);
    } else {
      this.update(model, cb);
    }
  };
  LocalStorage.prototype.switchFileSystem = function (isOn) {
    _fileSystemAvailable = function () {
      return isOn;
    };
  };
  LocalStorage.prototype.defaultStorage = function () {
    _fileSystemAvailable = function () {
      return fileSystem.isFileSystemAvailable();
    };
  };
  _fileSystemAvailable = function () {
    return fileSystem.isFileSystemAvailable();
  };
  //use different local storage model according to environment
  function _fhData() {
    if (_fileSystemAvailable()) {
      _fhFileData.apply({}, arguments);
    } else {
      _fhLSData.apply({}, arguments);
    }
  }
  //use $fh data
  function _fhLSData(options, success, failure) {
    // console.log(options);
    $fh.data(options, function (res) {
      if (typeof res == 'undefined') {
        res = {
          key: options.key,
          val: options.val
        };
      }
      //unify the interfaces
      if (options.act.toLowerCase() == 'remove') {
        success(null, null);
      }
      success(null, res.val ? res.val : null);
    }, failure);
  }
  //use file system
  function _fhFileData(options, success, failure) {
    function fail(msg) {
      // console.log('fail: msg= ' + msg);
      if (typeof failure !== 'undefined') {
        return failure(msg, {});
      } else {
      }
    }
    function filenameForKey(key, cb) {
      var appid = $fh && $fh.app_props ? $fh.app_props.appid : '';
      key = key + appid;
      utils.md5(key, function (err, hash) {
        if (err) {
          hash = key;
        }
        var filename = hash + '.txt';
        if (typeof navigator.externalstorage !== 'undefined') {
          navigator.externalstorage.enable(function handleSuccess(res) {
            var path = filename;
            if (res.path) {
              path = res.path;
              if (!path.match(/\/$/)) {
                path += '/';
              }
              path += filename;
            }
            filename = path;
            return cb(filename);
          }, function handleError(err) {
            return cb(filename);
          });
        } else {
          return cb(filename);
        }
      });
    }
    function save(key, value) {
      filenameForKey(key, function (hash) {
        fileSystem.save(hash, value, function (err, res) {
          if (err) {
            fail(err);
          } else {
            success(null, value);
          }
        });
      });
    }
    function remove(key) {
      filenameForKey(key, function (hash) {
        // console.log('remove: ' + key + '. Filename: ' + hash);
        fileSystem.remove(hash, function (err) {
          if (err) {
            if (err.name == 'NotFoundError' || err.code == 1) {
              //same respons of $fh.data if key not found.
              success(null, null);
            } else {
              fail(err);
            }
          } else {
            success(null, null);
          }
        });
      });
    }
    function load(key) {
      filenameForKey(key, function (hash) {
        fileSystem.readAsText(hash, function (err, text) {
          if (err) {
            if (err.name == 'NotFoundError' || err.code == 1) {
              //same respons of $fh.data if key not found.
              success(null, null);
            } else {
              fail(err);
            }
          } else {
            success(null, text);
          }
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
        return failure('Action [' + options.act + '] is not defined', {});
      }
    }
  }
  module.localStorage = new LocalStorage();
  return module;
}(appForm.stores || {});
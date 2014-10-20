/**
 * Local storage stores a model's json definition persistently.
 */

var config = require("./config");
var utils = require("./utils");
var fileSystem = require("./fileSystem");
var Store = require("./store");

var _fileSystemAvailable = function() {};
//placeholder
function LocalStorage() {
    Store.call(this, 'LocalStorage');
};

utils.extend(LocalStorage, Store);

//store a model to local storage
LocalStorage.prototype.create = function(model, cb) {
    var key = utils.localId(model);
    model.setLocalId(key);
    this.update(model, cb);
};
//read a model from local storage
LocalStorage.prototype.read = function(model, cb) {
    if (typeof(model) === "object") {
        if (model.get("_type") === "offlineTest") {
            return cb(null, {});
        }
    }

    var key = _getKey(model);
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
LocalStorage.prototype.update = function(model, cb) {
    var key = _getKey(model);
    var data = model.getProps();
    var dataStr = JSON.stringify(data);
    _fhData({
        'act': 'save',
        'key': key.toString(),
        'val': dataStr
    }, cb, cb);
};
//delete a model
LocalStorage.prototype.removeEntry = function(model, cb) {
    var key = _getKey(model);
    _fhData({
        'act': 'remove',
        'key': key.toString()
    }, cb, cb);
};
LocalStorage.prototype.upsert = function(model, cb) {
    var key = _getKey(model);
    if (key === null) {
        this.create(model, cb);
    } else {
        this.update(model, cb);
    }
};
LocalStorage.prototype.switchFileSystem = function(isOn) {
    _fileSystemAvailable = function() {
        return isOn;
    };
};
LocalStorage.prototype.defaultStorage = function() {
    _fileSystemAvailable = function() {
        return fileSystem.isFileSystemAvailable();
    };
};
LocalStorage.prototype.saveFile = function(fileName, fileToSave, cb) {
    if (!_fileSystemAvailable()) {
        return cb("File system not available");
    }

    _fhData({
        'act': 'save',
        'key': fileName,
        'val': fileToSave
    }, cb, cb);
};
LocalStorage.prototype.updateTextFile = function(key, dataStr, cb) {
    _fhData({
        'act': 'save',
        'key': key,
        'val': dataStr
    }, cb, cb);
};
LocalStorage.prototype.readFile = function(fileName, cb) {
    _fhData({
        'act': 'loadFile',
        'key': fileName
    }, cb, cb);
};
LocalStorage.prototype.readFileText = function(fileName, cb) {
    _fhData({
        'act': 'load',
        'key': fileName
    }, cb, cb);
};
_fileSystemAvailable = function() {
    return fileSystem.isFileSystemAvailable();
};

function _getKey(key) {
    return typeof(key.getLocalId) === "function" ? key.getLocalId() : key;
}
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
    //allow for no $fh api in studio
    if (!$fh || !$fh.data) {
        return success();
    }

    $fh.data(options, function(res) {
        if (typeof res === 'undefined') {
            res = {
                key: options.key,
                val: options.val
            };
        }
        //unify the interfaces
        if (options.act.toLowerCase() === 'remove') {
            return success(null, null);
        }
        success(null, res.val ? res.val : null);
    }, failure);
}
//use file system
function _fhFileData(options, success, failure) {
    function fail(msg) {
        if (typeof failure !== 'undefined') {
            return failure(msg, {});
        } else {}
    }

    function filenameForKey(key, cb) {
        var appid = config.get("appId", "unknownAppId");
        key = key + appid;
        utils.md5(key, function(err, hash) {
            if (err) {
                hash = key;
            }

            var filename = hash;

            if (key.indexOf("filePlaceHolder") === -1) {
                filename += ".txt";
            }

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
        filenameForKey(key, function(hash) {
            fileSystem.save(hash, value, function(err, res) {
                if (err) {
                    fail(err);
                } else {
                    success(null, value);
                }
            });
        });
    }

    function remove(key) {
        filenameForKey(key, function(hash) {
            fileSystem.remove(hash, function(err) {
                if (err) {
                    if (err.name === 'NotFoundError' || err.code === 1) {
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
        filenameForKey(key, function(hash) {
            fileSystem.readAsText(hash, function(err, text) {
                if (err) {
                    if (err.name === 'NotFoundError' || err.code === 1) {
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

    function loadFile(key) {
        filenameForKey(key, function(hash) {
            fileSystem.readAsFile(hash, function(err, file) {
                if (err) {
                    if (err.name === 'NotFoundError' || err.code === 1) {
                        //same respons of $fh.data if key not found.
                        success(null, null);
                    } else {
                        fail(err);
                    }
                } else {
                    success(null, file);
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
    } else if (options.act === 'loadFile') {
        return loadFile(options.key);
    } else {
        if (typeof failure !== 'undefined') {
            return failure('Action [' + options.act + '] is not defined', {});
        }
    }
}

module.exports = LocalStorage;
appForm.utils = (function(module) {
    module.fileSystem = {
        isFileSystemAvailable: isFileSystemAvailable,
        save: save,
        remove: remove,
        readAsText: readAsText,
        readAsBlob: readAsBlob,
        readAsBase64Encoded: readAsBase64Encoded,
        readAsFile: readAsFile,
        fileToBase64: fileToBase64
    };

    var fileSystemAvailable = false;
    var _requestFileSystem = function() {}; //placeholder
    var PERSISTENT = 1; //placeholder
    function isFileSystemAvailable() {
        return fileSystemAvailable;
    }
    //convert a file object to base64 encoded.
    function fileToBase64(file, cb) {
        if (!file instanceof File) {
            throw ("Only file object can be used for converting");
        }
        var fileReader = new FileReader();
        fileReader.onloadend = function(evt) {
            var text = evt.target.result;
            return cb(null, text);
        }
        fileReader.readAsDataURL(file);
    }
    /**
     * Save a content to file system into a file
     * @param  {[type]} fileName file name to be stored.
     * @param  {[type]} content  json object / string /  file object / blob object
     * @param  {[type]} cb  (err, result)
     * @return {[type]}          [description]
     */
    function save(fileName, content, cb) {
        var saveObj = null;
        var size = 0;
        if (typeof content == "object") {
            if (content instanceof File) { //File object
                saveObj = content;
                size = saveObj.size;
            } else if (content instanceof Blob) {
                saveObj = content;
                size = b.size;
            } else { //JSON object
                var stringify = JSON.stringify(content);
                var size = stringify.length;
                saveObj = new Blob(stringify, {
                    type: "text/plain"
                });
            }
        } else if (typeof content == "string") {
            size = content.length;
            saveObj = new Blob([content], {
                type: "text/plain"
            });
        }
        _getFileEntry(fileName, size, {
            create: true
        }, function(err, fileEntry) {
            if (err) {
                console.error(err);
                cb(err);
            } else {
                fileEntry.createWriter(function(writer) {
                    function _onFinished(evt) {
                        return cb(null, evt);
                    }

                    function _onTruncated() {
                        writer.onwrite = _onFinished;
                        writer.write(saveObj); //write method can take a blob or file object according to html5 standard.
                    }
                    writer.onwrite = _onTruncated;
                    //truncate the file first.
                    writer.truncate(0);
                }, function(e) {
                    cb("Failed to create file write:" + e);
                });
            }
        });
    }
    /**
     * Remove a file from file system
     * @param  {[type]}   fileName file name of file to be removed
     * @param  {Function} cb
     * @return {[type]}            [description]
     */
    function remove(fileName, cb) {
        _getFileEntry(fileName, 0, {}, function(err, fileEntry) {
            if (err) {
                console.error(err);
                cb(err);
            } else {
                fileEntry.remove(function() {
                    cb(null, null);
                }, function(e) {
                    // console.error(e);
                    cb("Failed to remove file" + e);
                });
            }
        });
    }
    /**
     * Read a file as text
     * @param  {[type]}   fileName [description]
     * @param  {Function} cb       (err,text)
     * @return {[type]}            [description]
     */
    function readAsText(fileName, cb) {
        _getFile(fileName, function(err, file) {
            if (err) {
                cb(err);
            } else {
                var reader = new FileReader();
                reader.onloadend = function(evt) {
                    var text = evt.target.result;
                    // Check for URLencoded
                    // PG 2.2 bug in readAsText()
                    try {
                        text = decodeURIComponent(text);
                    } catch (e) {
                        // Swallow exception if not URLencoded
                        // Just use the result
                    }
                    // console.log('load: ' + key + '. Filename: ' + hash + " value:" + evt.target.result);
                    return cb(null, text);
                }
                reader.readAsText(file);
            }
        });
    }

    /**
     * Read a file and return base64 encoded data
     * @param  {[type]}   fileName [description]
     * @param  {Function} cb       (err,base64Encoded)
     * @return {[type]}            [description]
     */
    function readAsBase64Encoded(fileName, cb) {
        _getFile(fileName, function(err, file) {
            if (err) {
                return cb(err);
            }
            var reader = new FileReader();
            reader.onloadend = function(evt) {
                var text = evt.target.result;
                return cb(null, text);
            }
            reader.readAsDataURL(file);
        });
    }
    /**
     * Read a file return blob object (which can be used for XHR uploading binary)
     * @param  {[type]}   fileName [description]
     * @param  {Function} cb       (err, blob)
     * @return {[type]}            [description]
     */
    function readAsBlob(fileName, cb) {
        _getFile(fileName, function(err, file) {
            if (err) {
                return cb(err);
            } else {
                var type = file.type;
                var reader = new FileReader();
                reader.onloadend = function(evt) {
                    var arrayBuffer = evt.target.result;
                    var blob = new Blob([arrayBuffer], {
                        "type": type
                    });
                    cb(null, blob);
                }
                reader.readAsArrayBuffer(file);
            }
        });
    }

    function readAsFile(fileName, cb) {
        _getFile(fileName, cb);
    }
    /**
     * Retrieve a file object
     * @param  {[type]}   fileName [description]
     * @param  {Function} cb     (err,file)
     * @return {[type]}            [description]
     */
    function _getFile(fileName, cb) {
        _getFileEntry(fileName, 0, {}, function(err, fe) {
            if (err) {
                return cb(err);
            }
            fe.file(function(file) {
                cb(null, file);
            }, function(e) {
                console.error("Failed to get file:" + e);
                cb(e);
            });
        });
    }

    function _getFileEntry(fileName, size, params, cb) {
        _requestFileSystem(PERSISTENT, size, function gotFS(fileSystem) {
            fileSystem.root.getFile(fileName, params, function gotFileEntry(fileEntry) {
                cb(null, fileEntry);
            }, function(err) {
                if (err.name == "QuotaExceededError" || err.code == 10) { //this happens only on browser. request for 1 gb storage
                    //TODO configurable from cloud
                    var bigSize = 1024 * 1024 * 1024;
                    _requestQuote(bigSize, function(err, bigSize) {
                        _getFileEntry(fileName, size, params, cb);
                    });
                } else {
                    // console.error('Failed to get file entry:' + err.message)
                    cb(err);
                }

            });
        }, function() {
            cb('Failed to requestFileSystem');
        });
    }

    function _requestQuote(size, cb) {
        if (navigator.webkitPersistentStorage) { //webkit browser
            navigator.webkitPersistentStorage.requestQuota(size, function(size) {
                cb(null, size);
            }, function(err) {
                cb(err, 0);
            });
        } else {
            //PhoneGap does not need to do this.return directly.
            cb(null, size);
        }
    }


    function _checkEnv() {
        // debugger;
        if (window.requestFileSystem) {
            _requestFileSystem = window.requestFileSystem;
            fileSystemAvailable = true;
        } else if (window.webkitRequestFileSystem) {
            _requestFileSystem = window.webkitRequestFileSystem;
            fileSystemAvailable = true;
        } else {
            fileSystemAvailable = false;
            // console.error("No filesystem available. Fallback use $fh.data for storage");
        }
        if (window.LocalFileSystem) {
            PERSISTENT = window.LocalFileSystem.PERSISTENT;
        } else if (window.PERSISTENT) {
            PERSISTENT = window.PERSISTENT;
        }
    }
    // debugger;
    _checkEnv();
    return module;
})(appForm.utils || {});
appForm.utils = function(module) {
    module.fileSystem = {
        isFileSystemAvailable: isFileSystemAvailable,
        save: save,
        remove: remove,
        readAsText: readAsText,
        readAsBlob: readAsBlob,
        readAsBase64Encoded: readAsBase64Encoded,
        readAsFile: readAsFile,
        fileToBase64: fileToBase64,
        getBasePath: getBasePath,
        clearFileSystem: clearFileSystem
    };
    var fileSystemAvailable = false;
    var _requestFileSystem = function() {
        console.error("No file system available");
    };
    //placeholder
    var PERSISTENT = 1;
    //placeholder
    function isFileSystemAvailable() {
        _checkEnv();
        return fileSystemAvailable;
    }
    //convert a file object to base64 encoded.
    function fileToBase64(file, cb) {
        if (!file instanceof File) {
            return cb('Only file object can be used for converting');
        }
        var fileReader = new FileReader();
        fileReader.onloadend = function(evt) {
            var text = evt.target.result;
            return cb(null, text);
        };
        fileReader.readAsDataURL(file);
    }

    function _createBlobOrString(contentstr) {
        var retVal;
        if (appForm.utils.isPhoneGap()) { // phonegap filewriter works with strings, later versions also ork with binary arrays, and if passed a blob will just convert to binary array anyway
            retVal = contentstr;
        } else {
            var targetContentType = 'text/plain';
            try {
                retVal = new Blob([contentstr], {
                    type: targetContentType
                }); // Blob doesn't exist on all androids
            } catch (e) {
                // TypeError old chrome and FF
                var blobBuilder = window.BlobBuilder ||
                    window.WebKitBlobBuilder ||
                    window.MozBlobBuilder ||
                    window.MSBlobBuilder;
                if (e.name === 'TypeError' && blobBuilder) {
                    var bb = new blobBuilder();
                    bb.append([contentstr.buffer]);
                    retVal = bb.getBlob(targetContentType);
                } else {
                    // We can't make a Blob, so just return the stringified content
                    retVal = contentstr;
                }
            }
        }
        return retVal;
    }


    function getBasePath(cb) {
        save("dummy.txt", "TestContnet", function(err, fileEntry) {
            if (err) {
                return cb(err);
            }

            _getFileEntry("dummy.txt",0, {}, function(err, fileEntry){
              var sPath = fileEntry.localURL.replace("dummy.txt", "");
              fileEntry.remove();
              return cb(null, sPath);
            });
        });
    }

    function _getSaveObject(content){
      var saveObj = null;
      if (typeof content === 'object' && content !== null) {
        if (content instanceof File || content instanceof Blob) {
          //File object
          saveObj = content;
        } else {
          //JSON object
          var contentstr = JSON.stringify(content);
          saveObj = _createBlobOrString(contentstr);
        }
      } else if (typeof content === 'string') {
        saveObj = _createBlobOrString(content);
      }

      return saveObj;
    }

    /**
     * Save a content to file system into a file
     *
     * In the case where the content is a File and PhoneGap is available, the function will attempt to use the "copyTo" function instead of writing the file.
     * This is because windows phone does not allow writing binary files with PhoneGap.
     * @param  {[type]} fileName file name to be stored.
     * @param  {[type]} content  json object / string /  file object / blob object
     * @param  {[type]} cb  (err, result)
     * @return {[type]}          [description]
     */
    function save(fileName, content, cb) {
      var self = this;
      var saveObj = _getSaveObject(content);
      if(saveObj === null){
        return cb("Invalid content type. Object was null");
      }
      var size = saveObj.size || saveObj.length;

      _getFileEntry(fileName, size, {
          create: true
      }, function(err, fileEntry) {
          if (err) {
              cb(err);
          } else {
            if(appForm.utils.isPhoneGap() && saveObj instanceof File){
              //Writing binary files is not possible in windows phone.
              //So if the thing to save is a file, and it is in phonegap, use the copyTo functions instead.
              fileEntry.getParent(function(parentDir){
                //Get the file entry for the file input
                _resolveFile(saveObj.localURL, function(err, fileToCopy){
                  if(err){
                    return cb(err);
                  }
                  fileName = fileEntry.name;

                  fileEntry.remove(function(){
                    fileToCopy.copyTo(parentDir, fileName, function(copiedFile){
                      return cb(null, copiedFile);
                    }, function(err){
                      return cb(err);
                    });
                  }, function(err){
                    return cb(err);
                  });
                }, function(err){
                  return cb(err);
                });
              }, function(err){
                return cb(err);
              });
            }  else {
              //Otherwise, just write text
              fileEntry.createWriter(function(writer) {
                function _onFinished(evt) {
                  return cb(null, evt);
                }

                function _onTruncated() {
                  writer.onwriteend = _onFinished;
                  writer.write(saveObj); //write method can take a blob or file object according to html5 standard.
                }
                writer.onwriteend = _onTruncated;
                //truncate the file first.
                writer.truncate(0);
              }, function(e) {
                cb('Failed to create file write:' + e);
              });
            }

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
                if (!(err.name === 'NotFoundError' || err.code === 1)) {
                    return cb(err);
                } else {
                    return cb(null, null);
                }
            }
            fileEntry.remove(function() {
                cb(null, null);
            }, function(e) {
                cb('Failed to remove file' + e);
            });
        });
    }


    /**
     * clearFileSystem - Clearing All Of The Files In the file system.
     *
     * @param  {type} cb       description
     * @return {type}          description
     */
    function clearFileSystem(cb){
      function gotFS(fileSystem) {
          var reader = fileSystem.root.createReader();
          reader.readEntries(gotList, cb);
      }

      function gotList(entries) {
          async.forEachSeries(entries, function(entry, cb){
            if(entry.isDirectory){
              entry.removeRecursively(cb, cb);
            } else {
              entry.remove(cb, cb);
            }
          }, cb);
      }

      _requestFileSystem(PERSISTENT, 0, gotFS, cb);
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
                    if (typeof text === "object") {
                      text = JSON.stringify(text);
                    }
                    // Check for URLencoded
                    // PG 2.2 bug in readAsText()
                    try {
                        text = decodeURIComponent(text);
                    } catch (e) {

                    }
                    return cb(null, text);
                };
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
            };
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
                        'type': type
                    });
                    cb(null, blob);
                };
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
                //issue CB-9403 on file plugin of windows missing fullPath on File, copying it here from FileEntry
                if (window.device && window.device.platform === "windows" && typeof (file.localURL) === "undefined") {
                    file.localURL = fe.nativeURL;
                }
                cb(null, file);
            }, function(e) {
                cb(e);
            });
        });
    }

    function _resolveFile(fileName, cb){
      //This is necessary to get the correct uri for apple. The URI in a file object for iphone does not have the file:// prefix.
      //This gives invalid uri errors when trying to resolve.
      if(fileName.indexOf("file://") === -1 && window.device.platform !== "Win32NT" && window.device.platform !== "windows"){
        fileName = "file://" + fileName;
      }
      window.resolveLocalFileSystemURL(fileName, function(fileEntry){
        return cb(null, fileEntry);
      }, function(err){
        return cb(err);
      });
    }

    function _getFileEntry(fileName, size, params, cb) {
      var self = this;
      _checkEnv();
      if(typeof(fileName) === "string"){
        _requestFileSystem(PERSISTENT, size, function gotFS(fileSystem) {
          fileSystem.root.getFile(fileName, params, function gotFileEntry(fileEntry) {
            cb(null, fileEntry);
          }, function(err) {
            if (err.name === 'QuotaExceededError' || err.code === 10) {
              //this happens only on browser. request for 1 gb storage
              //TODO configurable from cloud
              var bigSize = 1024 * 1024 * 1024;
              _requestQuote(bigSize, function(err, bigSize) {
                _getFileEntry(fileName, size, params, cb);
              });
            } else {
              if(!appForm.utils.isPhoneGap()){
                return cb(err);
              } else {
                _resolveFile(fileName, cb);
              }
            }
          });
        }, function() {
          cb('Failed to requestFileSystem');
        });
      } else {
        if(typeof(cb) === "function"){
          cb("Expected file name to be a string but was " + fileName);
        }
      }
    }

    function _requestQuote(size, cb) {
        if (navigator.webkitPersistentStorage) {
            //webkit browser
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
        if (window.requestFileSystem) {
            _requestFileSystem = window.requestFileSystem;
            fileSystemAvailable = true;
        } else if (window.webkitRequestFileSystem) {
            _requestFileSystem = window.webkitRequestFileSystem;
            fileSystemAvailable = true;
        } else {
            fileSystemAvailable = false;
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
}(appForm.utils || {});

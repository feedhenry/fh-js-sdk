/**
 * FeedHenry License
 */
;
if (typeof window =="undefined"){
    var window={};
}
//this is a partial js file which defines the start of appform SDK closure
(function(_scope){
    //start module

var appForm=(function(module){
    module.init=init;

    function init(params, cb){
        if (typeof cb =="undefined"){
            cb=params;
        }
        var config=params.config || {};
        appForm.config=appForm.models.config;
        appForm.config.init(config,function(){
            cb();
        });
    }
    
    // $fh.ready({}, function() {
    //     appForms.init({},function(){
    //         console.log("appForm is inited");
    //     });
    // });
    return module;
})(appForm || {});


appForm.utils = (function(module) {
    module.extend = extend;
    module.localId = localId;
    module.md5 = md5;
    module.getTime = getTime;
    module.isPhoneGap=isPhoneGap;
    function extend(child, parent) {
        if (parent.constructor && parent.constructor == Function) {
            for (var key in parent.prototype) {
                child.prototype[key] = parent.prototype[key];
            }
        } else {
            for (var key in parent) {
                child.prototype[key] = parent[key];
            }
        }
    }

    function getTime(timezoneOffset) {
        var now = new Date();
        if (timezoneOffset) {
            return now.getTimezoneOffset();
        } else {
            return now;
        }
    }

    function localId(model) {
        var props = model.getProps();
        var _id = props._id;
        var _type = props._type;
        var ts = getTime().getTime();
        if (_id && _type) {
            return _id + "_" + _type + "_" + ts;
        } else if (_id) {
            return _id + "_" + ts;
        } else if (_type) {
            return _type + "_" + ts;
        } else {
            return ts;
        }
    }
    /**
     * md5 hash a string
     * @param  {[type]}   str [description]
     * @param  {Function} cb  (err,md5str)
     * @return {[type]}       [description]
     */
    function md5(str, cb) {
        if (typeof $fh != "undefined" && $fh.hash) {
            $fh.hash({
                algorithm: "MD5",
                text: str
            }, function(result) {
                if (result && result.hashvalue) {
                    cb(null, result.hashvalue);
                } else {
                    cb("Crypto failed.");
                }

            });
        } else {
            cb("Crypto not found");
        }
    }

    function isPhoneGap() {
        //http://stackoverflow.com/questions/10347539/detect-between-a-mobile-browser-or-a-phonegap-application
        //may break.
        var app = document.URL.indexOf('http://') === -1 && document.URL.indexOf('https://') === -1;
        if (app) {
            return true;
        } else {
            return false;
        }
    }

    return module;
})(appForm.utils || {});
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
                    console.error(e);
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
                    console.error('Failed to get file entry:' + err.message)
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
appForm.utils = (function(module) {
    module.takePhoto = takePhoto;
    module.isPhoneGapCamAvailable = isPhoneGapAvailable;
    module.isHtml5CamAvailable= isHtml5CamAvailable;
    module.initHtml5Camera = initHtml5Camera;
    module.cancelHtml5Camera=cancelHtml5Camera;
    var isPhoneGap = false;
    var isHtml5 = false;
    var video = null;
    var canvas = null;
    var ctx = null;
    var localMediaStream = null;
    function isHtml5CamAvailable(){
        return isHtml5;
    }
    function isPhoneGapAvailable() {
        return isPhoneGap;
    }

    function initHtml5Camera(params, cb) {
        _html5Camera(params, cb);
    }
    function cancelHtml5Camera(){
        if (localMediaStream){
            localMediaStream.stop()
            localMediaStream=null;
        }
    }
    function takePhoto(params, cb) {
        var width = params.width;
        var height = params.height;
        if (isPhoneGap) {
            navigator.camera.getPicture(_phoneGapSuccess(cb), cb, {
                quality: 100,
                targetWidth: width,
                targetHeight: height,
                saveToPhotoAlbum: false,
                destinationType: Camera.DestinationType.DATA_URL, //TODO use file_uri to avoid memory overflow
                encodingType: Camera.EncodingType.PNG
            });
        } else if (isHtml5) {
            snapshot(params,cb);
        } else {
            cb("Your device does not support camera.");
        }
    }

    function _phoneGapSuccess(cb) {
        return function(imageData) {
            var base64Img = "data:image/png;base64," + imageData;
            cb(null, base64Img);
        }
    }

    function _html5Camera(params, cb) {
        var width = params.width;
        var height = params.height;
        video.width = 1024; //TODO configuration-webcam resolution
        video.height = 768;
        canvas.width = width;
        canvas.height = height;
        if (!localMediaStream) {
            navigator.getUserMedia({
                video: true
            }, function(stream) {
                video.src = window.URL.createObjectURL(stream);
                localMediaStream = stream;
                cb(null,video);
            }, cb);
        }else{
            console.error("Media device was not released.");
            cb("Media device occupied.");
        }

    }


    function checkEnv() {
        if (navigator.camera && navigator.camera.getPicture) { // PhoneGap
            isPhoneGap = true;
        } else if (_browserWebSupport()) {
            isHtml5 = true;
            video = document.createElement("video");
            video.autoplay="autoplay";
            canvas = document.createElement('canvas');
            ctx = canvas.getContext('2d');
        }else{
            console.error("Cannot detect usable media API. Camera will not run properly on this device.");
        }
    }


    function _browserWebSupport() {
        if (navigator.getUserMedia) {
            return true;
        }
        if (navigator.webkitGetUserMedia) {
            navigator.getUserMedia = navigator.webkitGetUserMedia;
            return true;
        }
        if (navigator.mozGetUserMedia) {
            navigator.getUserMedia = navigator.mozGetUserMedia;
            return true;
        }
        if (navigator.msGetUserMedia) {
            navigator.getUserMedia = navigator.msGetUserMedia;
            return true;
        }
        return false;
    }
    checkEnv();

    function snapshot(params,cb) {
        if (localMediaStream) {
            ctx.drawImage(video, 0, 0, params.width, params.height);
            // "image/webp" works in Chrome.
            // Other browsers will fall back to image/png.
            var base64=canvas.toDataURL('image/webp');
            cancelHtml5Camera()
            cb(null,base64);
        }else{
            console.error("Media resource is not available");
            cb("Resource not available");
        }
    }


    return module;
})(appForm.utils || {});
appForm.web = (function(module) {


    return module;
})(appForm.web || {});
appForm.web.ajax = (function(module) {
    module=typeof $fh!="undefined" && $fh.__ajax?$fh.__ajax:_myAjax;
    module.get = get;       
    module.post = post;

    var _ajax=module;
    function _myAjax(){
        //TODO my ajax deifinition.
    }
    function get(url,cb){
        _ajax({
            "url":url,
            "type":"GET",
            "success":function(data,text){
                cb(null,data);
            },
            "error":function(xhr,status,err){
                cb(xhr);
            }
        })
    }
    function post(url,body,cb){
        var file=false;
        var formData;
        if (typeof body == "object"){
            if (body instanceof File ){
                file=true;
                formData=new FormData();
                var name=body.name;
                formData.append(name,body);
                body=formData;
            }else{
                body=JSON.stringify(body);
            }
            
        }
        var param={
            "url":url,
            "type":"POST",
            "data":body,
            "dataType":"json",
            "success":function(data,text){
                cb(null,data);
            },
            "error":function(xhr,status,err){
                cb(xhr);
            }
        };
        if (file==false){
            param.contentType="application/json";
        }
        _ajax(param);
    }
    // function createXMLHttpRequest() {
    //     try {
    //         return new XMLHttpRequest();
    //     } catch (e) {}
    //     try {
    //         return new ActiveXObject("Msxml2.XMLHTTP");
    //     } catch (e) {}
    //     return null;
    // }

    // function get(url, cb) {
    //     var xhReq = createXMLHttpRequest();
    //     if (!xhReq) {
    //         cb({
    //             error: 'XMLHttpRequest is not supported',
    //             status: 'not ok'
    //         }, null);
    //     }

    //     xhReq.open("get", url, true);
    //     xhReq.send(null);

    //     var requestTimer = setTimeout(function() {
    //         xhReq.abort();
    //     }, appForm.config.get("timeoutTime"));

    //     xhReq.onreadystatechange = function() {
    //         if (xhReq.readyState !== 4) {
    //             return;
    //         }
    //         //Clear the timer. Request was succesful.
    //         clearTimeout(requestTimer);
    //         var serverResponse = xhReq.responseText;
    //         if (xhReq.status !== 200) {
    //             return cb({
    //                 error: 'Status not 200!',
    //                 status: 'not ok',
    //                 statusCode: xhReq.status,
    //                 body: serverResponse
    //             }, null);
    //         }
    //         return cb(null, {
    //             status: 'ok',
    //             statusCode: xhReq.status,
    //             response: serverResponse
    //         });
    //     };
    // }

    // function post(url, body, cb) {
    //     var xhReq = createXMLHttpRequest();
    //     if (!xhReq) {
    //         cb({
    //             error: 'XMLHttpRequest is not supported',
    //             status: 'not ok'
    //         }, null);
    //     }

    //     xhReq.open("POST", url, true);
    //     //Send the header information along with the request
    //     xhReq.setRequestHeader("Content-type", "application/json");
    //     xhReq.setRequestHeader("Connection", "close");
    //     xhReq.send(body);

    //     var requestTimer = setTimeout(function() {
    //         xhReq.abort();
    //     }, appForm.config.get("timeoutTime"));

    //     xhReq.onreadystatechange = function() {
    //         if (xhReq.readyState !== 4) {
    //             return;
    //         }
    //         //Clear the timer. Request was succesful.
    //         clearTimeout(requestTimer);
    //         var serverResponse = xhReq.responseText;
    //         if (xhReq.status !== 200) {
    //             return cb({
    //                 error: 'Status not 200!',
    //                 status: 'not ok',
    //                 statusCode: xhReq.status,
    //                 body: serverResponse
    //             }, null);
    //         }
    //         return cb(null, {
    //             status: 'ok',
    //             statusCode: xhReq.status,
    //             response: serverResponse
    //         });
    //     };
    // }

    return module;
})(appForm.web.ajax || {});
appForm.stores=(function(module){
    module.Store=Store;

    function Store(name){
        this.name=name
    };

    Store.prototype.create=function(model,cb){throw("Create not implemented:"+this.name);}
    /**
     * Read a model data from store
     * @param  {[type]} model          [description]
     * @param  {[type]} cb(error, data);
     */
    Store.prototype.read=function(model,cb){throw("Read not implemented:"+this.name);}
    Store.prototype.update=function(model,cb){throw("Update not implemented:"+this.name);}
    Store.prototype.delete=function(model,cb){throw("Delete not implemented:"+this.name);}
    Store.prototype.upsert=function(model,cb){throw("Upsert not implemented:"+this.name);}
    return module;
})(appForm.stores || {});

/**
 * Local storage stores a model's json definition persistently.
 */

appForm.stores = (function(module) {

    //implementation
    var utils = appForm.utils;
    var fileSystem = utils.fileSystem;
    var _fileSystemAvailable = function() {}; //placeholder
    function LocalStorage() {

        appForm.stores.Store.call(this, "LocalStorage");
    };
    appForm.utils.extend(LocalStorage, appForm.stores.Store);
    //store a model to local storage
    LocalStorage.prototype.create = function(model, cb) {
        var key = utils.localId(model);
        model.setLocalId(key);
        this.update(model, cb);

    }
    //read a model from local storage
    LocalStorage.prototype.read = function(model, cb) {
        var key = model.getLocalId();
        if (key != null) {
            _fhData({
                "act": "load",
                "key": key.toString()
            }, cb, cb);
        } else { //model does not exist in local storage if key is null.
            cb(null, null);
        }

    }
    //update a model
    LocalStorage.prototype.update = function(model, cb) {
        var key = model.getLocalId();
        var data = model.getProps();
        var dataStr = JSON.stringify(data);
        _fhData({
            "act": "save",
            "key": key.toString(),
            "val": dataStr
        }, cb, cb);
    }
    //delete a model
    LocalStorage.prototype.delete = function(model, cb) {
        var key = model.getLocalId();
        _fhData({
            "act": "remove",
            "key": key.toString()
        }, cb, cb);
    }
    LocalStorage.prototype.upsert = function(model, cb) {
        var key = model.getLocalId();
        if (key == null) {
            this.create(model, cb);
        } else {
            this.update(model, cb);
        }
    }
    LocalStorage.prototype.switchFileSystem = function(isOn) {
        _fileSystemAvailable = function() {
            return isOn;
        }
    }
    LocalStorage.prototype.defaultStorage = function() {
        _fileSystemAvailable = function() {
            return fileSystem.isFileSystemAvailable();
        }
    }

    _fileSystemAvailable = function() {
        return fileSystem.isFileSystemAvailable();
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
        // console.log(options);
        $fh.data(options, function(res) {
            if (typeof res == "undefined") {
                res = {
                    key: options.key,
                    val: options.val
                }
            }
            //unify the interfaces
            if (options.act.toLowerCase() == "remove") {
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
                // console.log('failure: ' + msg);
            }
        }

        function filenameForKey(key, cb) {
            key = key + $fh.app_props.appid;
            utils.md5(key, function(err, hash) {
                if (err) {
                    hash = key;
                }
                var filename = hash + ".txt";
                if (typeof navigator.externalstorage !== "undefined") {
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
                    })
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
                // console.log('remove: ' + key + '. Filename: ' + hash);
                fileSystem.remove(hash, function(err) {
                    if (err) {
                        if (err.name == "NotFoundError" || err.code == 1) { //same respons of $fh.data if key not found.
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
                        if (err.name == "NotFoundError" || err.code == 1) { //same respons of $fh.data if key not found.
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
                return failure("Action [" + options.act + "] is not defined", {});
            }
        }
    }



    module.localStorage = new LocalStorage();
    return module;
})(appForm.stores || {});
appForm.stores=(function(module){
    var Store=appForm.stores.Store;
    
    module.mBaaS=new MBaaS();
    
    function MBaaS(){
        Store.call(this,"MBaaS");
    }
    appForm.utils.extend(MBaaS,Store);
    MBaaS.prototype.create=function(model,cb){
        var url=_getUrl(model);
        appForm.web.ajax.post(url,model.getProps(),cb);

    }
    MBaaS.prototype.read=function(model,cb){
        var url=_getUrl(model);
        appForm.web.ajax.get(url,cb);
    }
    MBaaS.prototype.update=function(model,cb){
        
    }
    MBaaS.prototype.delete=function(model,cb){ // No delete method associated with mabaas calls -- > only send and read...
        
    }

    MBaaS.prototype.completeSubmission = function(submissionToComplete, cb){
      var url = _getUrl(submissionToComplete);
      appForm.web.ajax.post(url,{},cb);
    }

    MBaaS.prototype.submissionStatus = function(submission, cb){
      var url = _getUrl(submission);

      appForm.web.ajax.get(url, cb);
    }
    
    function _getUrl(model){
        var type=model.get("_type");
        var host=appForm.config.get("cloudHost");
        var mBaaSBaseUrl=appForm.config.get("mbaasBaseUrl");
        var formUrls=appForm.config.get("formUrls");
        if (formUrls[type]){
            var relativeUrl=formUrls[type];    
        }else{
            throw("type not found to get url:"+type);
        }   
        
        var url= host+mBaaSBaseUrl+relativeUrl;
        var props={};


        //Theme and forms do not require any parameters that are not in _fh
        switch (type){
            case "form":
                props.formId=model.get("_id");
                break;
            case "formSubmission":
                props.formId=model.getFormId();
                break;
            case "fileSubmission":
                props.submissionId=model.getSubmissionId();
                props.hashName=model.getHashName();
                props.fieldId=model.getFieldId();
            case "submissionStatus":
                props.submissionId = model.get("submissionId");
            case "completeSubmission":
                props.submissionId = model.get("submissionId");
            break
        }
        for (var key in props){
            url=url.replace(":"+key,props[key]);
        }
        return url;
    }
    

    return module;
})(appForm.stores || {});
appForm.stores = (function(module) {
    var Store = appForm.stores.Store;
    //DataAgent is read only store
    module.DataAgent = DataAgent;
    module.dataAgent=new DataAgent(appForm.stores.mBaaS,appForm.stores.localStorage); //default data agent uses mbaas as remote store, localstorage as local store

    

    function DataAgent(remoteStore, localStore) {
        Store.call(this, "DataAgent");
        this.remoteStore = remoteStore;
        this.localStore = localStore;
    }
    appForm.utils.extend(DataAgent, Store);
    /**
     * Read from local store first, if not exists, read from remote store and store locally
     * @param  {[type]}   model [description]
     * @param  {Function} cb    (err,res,isFromRemote)
     * @return {[type]}         [description]
     */
    DataAgent.prototype.read = function(model, cb) {
        var that = this;
        this.localStore.read(model, function(err, locRes) {
            if (err || !locRes) { //local loading failed
                if (err) {
                    console.error(err);
                }
                that.refreshRead(model, cb);
            } else { //local loading succeed
                cb(null,locRes,false);
            }
        });
    }
    /**
     * Read from remote store and store the content locally.
     * @param  {[type]}   model [description]
     * @param  {Function} cb    [description]
     * @return {[type]}         [description]
     */
    DataAgent.prototype.refreshRead = function(model, cb) {
        var that=this;
        this.remoteStore.read(model, function(err, res) {
            if (err) {
                console.error(err);
                cb(err);
            } else {
                //update model from remote response
                model.fromJSON(res);
                //update local storage for the model
                that.localStore.upsert(model,function(){
                    var args=Array.prototype.slice.call(arguments,0);
                    args.push(true);
                    cb.apply({},args);
                });
            }
        });
    }


    return module;
})(appForm.stores || {});
appForm.models = (function(module) {
    function Model(opt) {
        this.props = {
            "_id": null, // model id
            "_type": null, // model type
            "_ludid": null //local unique id
        };
        this.utils=appForm.utils;
        this.events={};
        if (typeof opt != "undefined") {
            for (var key in opt) {
                this.props[key] = opt[key];
            }
        }
        this.touch();
    }
    Model.prototype.on=function(name,func){
        if (!this.events[name]){
            this.events[name]=[]
        }
        if (this.events[name].indexOf(func)<0){
            this.events[name].push(func);
        }
    }
    Model.prototype.off=function(name,func){
        if (this.events[name]){
            if (this.events[name].indexOf(func)>=0){
                this.events[name].splice(this.events[name].indexOf(func),1);
            }
        }
    }
    Model.prototype.emit=function(){
        var args=Array.prototype.slice.call(arguments,0);
        var e=args.shift();
        var funcs=this.events[e];
        if (funcs && funcs.length>0){
            for (var i=0;i<funcs.length;i++){
                var func=funcs[i];
                func.apply(this,args);
            }
        }
    }
    Model.prototype.getProps = function() {
        return this.props;
    }

    Model.prototype.get = function(key,def) {
        return typeof this.props[key]=="undefined"?def:this.props[key];
    }

    Model.prototype.set = function(key, val) {
        this.props[key] = val;
    }

    Model.prototype.setLocalId = function(localId) {
        this.set("_ludid", localId);
    }
    Model.prototype.getLocalId = function() {
        return this.get("_ludid");
    }
    Model.prototype.fromJSON = function(json) {
        if (typeof json == "string") {
            this.fromJSONStr(json);
        } else {
            for (var key in json) {
                this.set(key, json[key]);
            }
        }
        this.touch();

    }
    Model.prototype.fromJSONStr = function(jsonStr) {
        try {
            var json = JSON.parse(jsonStr);
            this.fromJSON(json);
        } catch (e) {
            console.error(e);
        }
    }
    // not working properly for nested model data.
    // Model.prototype.equalTo = function(model) {
    //     var props = model.getProps();
    //     for (var key in this.props) {
    //         if (key=="_localLastUpdate"){
    //             continue;
    //         }
    //         if (this.props[key] != props[key]) {
    //             return false;
    //         }
    //     }
    //     for (var key in props) {
    //         if (key=="_localLastUpdate"){
    //             continue;
    //         }
    //         if (this.props[key] != props[key]) {
    //             return false;
    //         }
    //     }
    //     return true;
    // }
    Model.prototype.touch=function(){
        this.set("_localLastUpdate", appForm.utils.getTime());
    }
    Model.prototype.getLocalUpdateTimeStamp=function(){
        return this.get("_localLastUpdate");
    }
    Model.prototype.genLocalId=function(){
        return appForm.utils.localId(this);
    }
    /**
     * retrieve model from local or remote with data agent store.
     * @param {boolean} fromRemote optional true--force from remote
     * @param  {Function} cb (err,currentModel)
     * @return {[type]}      [description]
     */
    Model.prototype.refresh=function(fromRemote,cb){
        var dataAgent=this.getDataAgent();
        var that=this;
        if (typeof cb=="undefined"){
            cb=fromRemote;
            fromRemote=false;
        }
        if (fromRemote){
            dataAgent.refreshRead(this,_handler);
        }else{
            dataAgent.read(this,_handler);
        }

        function _handler(err,res){
            if (!err && res){
                that.fromJSON(res);
                cb(null,that);
            }else{
                cb(err,that);
            }
        }

    }
    /**
     * Retrieve model from local storage store
     * @param  {Function} cb (err, curModel)
     * @return {[type]}      [description]
     */
    Model.prototype.loadLocal=function(cb){
        var localStorage=appForm.stores.localStorage;
        var that=this;
        localStorage.read(this,function(err,res){
            if (err){
                cb(err);
            }else{
                if (res){
                    that.fromJSON(res);    
                }
                cb(err,that);
            }
        });
    }
    /**
     * save current model to local storage store
     * @param  {Function} cb [description]
     * @return {[type]}      [description]
     */
    Model.prototype.saveLocal=function(cb){
        var localStorage=appForm.stores.localStorage;
        localStorage.upsert(this,cb);
    }
    /**
     * Remove current model from local storage store
     * @param  {Function} cb [description]
     * @return {[type]}      [description]
     */
    Model.prototype.clearLocal=function(cb){
        var localStorage=appForm.stores.localStorage;
        localStorage.delete(this,cb);
    }
    Model.prototype.getDataAgent=function(){
        if (!this.dataAgent){
            this.setDataAgent(appForm.stores.dataAgent);
        }
        return this.dataAgent;
    }
    Model.prototype.setDataAgent=function(dataAgent){
        this.dataAgent=dataAgent;
    }
    module.Model = Model;

    return module;
    
})(appForm.models || {});
appForm.models=(function(module){
    var Model=appForm.models.Model;
    

    function Config(){
        Model.call(this,{
            "_type":"config"
        });
    }
    appForm.utils.extend(Config,Model);
    //call in appForm.init
    Config.prototype.init=function(config,cb){
        this.set("appId",$fh.app_props.appid);
        this.set("env",$fh.app_props.mode?$fh.app_props.mode:"dev");
        this.set("timeoutTime",30000);
        this._initMBaaS();
        this.fromJSON(config);
        cb();
    }

    Config.prototype._initMBaaS=function(){
        var cloud_props=$fh.cloud_props;
        var app_props=$fh.app_props;
        var cloudUrl=app_props.host;
        var mode=app_props.mode?app_props.mode:"dev";
        if (cloud_props && cloud_props.hosts){
            if (mode.indexOf("dev")>-1){ //dev mode
                cloudUrl=cloud_props.hosts.debugCloudUrl;
            }else{ //live mode
                cloudUrl=cloud_props.hosts.releaseCloudUrl;
            }
        }
        this.set("cloudHost",cloudUrl);

        this.set("mbaasBaseUrl","/mbaas");
        var appId=this.get("appId");
        //ebaas url definition https://docs.google.com/a/feedhenry.com/document/d/1_bd4kZMm7q6C1htNJBTSA2X4zi1EKx0hp_4aiJ-N5Zg/edit#
        this.set("formUrls",{
            "forms":"/forms",
            "form":"/forms/:formId",
            "theme":"/forms/theme",
            "formSubmission":"/forms/:formId/submitFormData",
            "fileSubmission":"/forms/:submissionId/:fieldId/:hashName/submitFormFile",
            "submissionStatus": "/forms/:submissionId/status",
            "completeSubmission": "/forms/:submissionId/completeSubmission"
        })
    }
    module.config=new Config();

    return module;
})(appForm.models ||{});
appForm.models=(function(module){
    var Model=appForm.models.Model;
    

    function Forms(){
        Model.call(this,{
            "_type":"forms",
            "_ludid":"forms_list",
            "loaded":false
        });
    }
    appForm.utils.extend(Forms,Model);
    /**
     * remove all local forms stored.
     * @param  {Function} cb [description]
     * @return {[type]}      [description]
     */
    Forms.prototype.clearAllForms=function(cb){

    }
    Forms.prototype.isFormUpdated=function(formModel){
        var id=formModel.get("_id");
        var formLastUpdate=formModel.getLastUpdate();
        var formMeta=this.getFormMetaById(id);
        if (formMeta){
            return formLastUpdate==formMeta.lastUpdatedTimestamp;
        }else{ //could have been deleted. leave it for now
            return false;
        }
    }

    Forms.prototype.getFormMetaById=function(formId){
        var forms=this.get("forms");
        for (var i=0;i<forms.length;i++){
            var form=forms[i];
            if (form._id == formId){
                return form;
            }
        }
        return null;
    }
    Forms.prototype.size=function(){
        return this.get("forms").length;
    }
    Forms.prototype.setLocalId=function(){
        throw("forms id cannot be set programmly");
    }
    Forms.prototype.getFormsList=function(){
        return this.get("forms");
    }
    Forms.prototype.getFormIdByIndex=function(index){
        return this.getFormsList()[index]._id;
    }
    
    module.forms=new Forms();

    return module;
})(appForm.models ||{});


appForm.models = (function(module) {
    var Model = appForm.models.Model;
    module.Form = Form;

    var _forms = {}; //cache of all forms. single instance for 1 formid
    /**
     * [Form description]
     * @param {[type]}   params  {formId: string, fromRemote:boolean(false), rawMode:false, rawData:JSON}
     * @param {Function} cb         [description]
     */
    function Form(params, cb) {
        var rawMode = params.rawMode;
        var rawData = params.rawData;
        var formId = params.formId;
        if (!formId) {
            throw ("Cannot initialise a form object without an id. id:" + formId);
        }
        Model.call(this, {
            "_id": formId,
            "_type": "form"
        });
        if (_forms[formId]) { //found form object in mem return it.
            cb(null, _forms[formId]);
            return _forms[formId];
        }
        if (rawMode === true) {
            this.fromJSON(rawData);
            try {
                this.initialise();
            } catch (e) {
                console.error("Failed to initialise form.");
                console.error(e);
                //TODO throw the error if in dev mode.
            }
            _forms[formId] = this;
            cb(null, this);
        } else {
            var fromRemote = params.fromRemote;
            if (typeof fromRemote == "function" || typeof cb == "function") {
                if (typeof fromRemote == "function") {
                    var cb = fromRemote;
                    fromRemote = false;
                }
                var that = this;
                this.refresh(fromRemote, function(err, obj) {

                    try {
                        that.initialise();
                    } catch (e) {
                        console.error("Failed to initialise form.");
                        console.error(e);
                        //TODO throw the error if in dev mode.
                    }
                    _forms[formId] = obj;
                    cb(err, obj);
                });
            } else {
                throw ("a callback function is required for initialising form data. new Form (formId, [isFromRemote], cb)");
            }
        }
    }
    appForm.utils.extend(Form, Model);
    Form.prototype.getLastUpdate = function() {
        return this.get("lastUpdatedTimestamp");
    }
    /**
     * Initiliase form json to objects
     * @return {[type]} [description]
     */
    Form.prototype.initialise = function() {
        this.initialisePage();
        this.initialiseFields();
        this.initialiseRules();
    }
    Form.prototype.initialiseFields = function() {
        var fieldsRef = this.getFieldRef();
        this.fields = {};
        for (var fieldId in fieldsRef) {
            var fieldRef = fieldsRef[fieldId];
            var pageIndex = fieldRef["page"];
            var fieldIndex = fieldRef["field"];
            if (pageIndex == undefined || fieldIndex == undefined) {
                throw ("Corruptted field reference");
            }
            var fieldDef = this.getFieldDefByIndex(pageIndex, fieldIndex);
            if (fieldDef) {
                var fieldObj = new appForm.models.Field(fieldDef, this);
                this.fields[fieldId] = fieldObj;
            } else {
                throw ("Field def is not found.");
            }
        }
    }
    Form.prototype.initialiseRules = function() {
        this.rules = {};
        var pageRules = this.getPageRules();
        var fieldRules = this.getFieldRules();
        var constructors = [];
        for (var i = 0, pageRule; pageRule = pageRules[i]; i++) {
            constructors.push({
                "type": "page",
                "definition": pageRule
            });
        }
        for (var i = 0, fieldRule; fieldRule = fieldRules[i]; i++) {
            constructors.push({
                "type": "field",
                "definition": fieldRule
            });
        }
        for (var i = 0, constructor; constructor = constructors[i]; i++) {
            var ruleObj = new appForm.models.Rule(constructor);
            var fieldIds = ruleObj.getRelatedFieldId();
            for (var j = 0, fieldId; fieldId = fieldIds[j]; j++) {
                if (!this.rules[fieldId]) {
                    this.rules[fieldId] = [];
                }
                this.rules[fieldId].push(ruleObj);
            }
        }
    }
    Form.prototype.getRulesByFieldId = function(fieldId) {
        return this.rules[fieldId];
    }
    Form.prototype.initialisePage = function() {
        var pages = this.getPagesDef();
        this.pages = [];
        for (var i = 0; i < pages.length; i++) {
            var pageDef = pages[i];
            var pageModel = new appForm.models.Page(pageDef, this);
            this.pages.push(pageModel);
        }
    }
    Form.prototype.getPageModelList = function() {
        return this.pages;
    }
    Form.prototype.getName = function() {
        return this.get("name", "");
    }
    Form.prototype.getDescription = function() {
        return this.get("description", "");
    }
    Form.prototype.getPageRules = function() {
        return this.get("pageRules", []);
    }
    Form.prototype.getFieldRules = function() {
        return this.get("fieldRules", []);
    }
    Form.prototype.getFieldRef = function() {
        return this.get("fieldRef", {});
    }
    Form.prototype.getPagesDef = function() {
        return this.get("pages", []);
    }
    Form.prototype.getPageRef = function() {
        return this.get("pageRef", {});
    }
    Form.prototype.getFieldModelById = function(fieldId) {
        return this.fields[fieldId];
    }
    Form.prototype.getFieldDefByIndex = function(pageIndex, fieldIndex) {
        var pages = this.getPagesDef();
        var page = pages[pageIndex];
        if (page) {
            var fields = page["fields"] ? page["fields"] : [];
            var field = fields[fieldIndex];
            if (field) {
                return field;
            }
        }
        return null;
    }

    Form.prototype.getPageModelById = function(pageId) {
        var index = this.getPageRef()[pageId];
        if (typeof index == "undefined") {
            throw ("page id is not found");
        } else {
            return this.pages[index];
        }
    }

    Form.prototype.newSubmission = function() {
        return appForm.models.submission.newInstance(this);
    }
    Form.prototype.getFormId = function() {
        return this.get("_id");
    }
    Form.prototype.removeFromCache = function() {
        if (_forms[this.getFormId()]) {
            delete _forms[this.getFormId()];
        }
    }
    Form.prototype.getFileFieldsId=function(){
        var fieldsId=[]
        for (var fieldId in this.fields){
            var field=this.fields[fieldId];
            if (field.getType()=="file" || field.getType()=="photo" || field.getType()=="signature"  ){
                fieldsId.push(fieldId);
            }
        }
        return fieldsId;
    }
    // Form.prototype.getImageFieldsId=function(){
    //     var fieldsId=[]
    //     for (var fieldId in this.fields){
    //         var field=this.fields[fieldId];
    //         if (field.getType()=="photo" || field.getType()=="signature"  ){
    //             fieldsId.push(fieldId);
    //         }
    //     }
    //     return fieldsId;
    // }
    Form.prototype.getRuleEngine = function() {
        if (this.rulesEngine) {
            return this.rulesEngine;
        } else {
            var formDefinition = this.getProps();
            this.rulesEngine = new appForm.RulesEngine(formDefinition);
            //DEBUG ONLY  BY PASS VALIDATE FORM
            
            this.rulesEngine.validateForm=function(a,cb){
                cb(null,{
                    validation:{
                        valid:true    
                    }
                    
                });
            }
            //END OF DEBUG

            return this.rulesEngine;
        }
    }

    return module;
})(appForm.models || {});
appForm.models=(function(module){
    var Model=appForm.models.Model;
    module.FileSubmission=FileSubmission;

    function FileSubmission(fileData){
        Model.call(this,{
            "_type":"fileSubmission",
            "data":fileData
        });

    }
    appForm.utils.extend(FileSubmission,Model);
    FileSubmission.prototype.loadFile=function(cb){
        var fileName=this.getHashName();
        var that=this;
        appForm.utils.fileSystem.readAsFile(fileName,function(err,file){
            if (err){
                console.error(err);
                cb(err);
            }else{
                that.fileObj=file;
                cb(null);
            }
        });
    }
    FileSubmission.prototype.getProps=function(){
        return this.fileObj;
    }
    FileSubmission.prototype.setSubmissionId=function(submissionId){
        this.set("submissionId",submissionId);
    }
    FileSubmission.prototype.getSubmissionId=function(){
        return this.get("submissionId");
    }
    FileSubmission.prototype.getHashName=function(){
        return this.get("data")['hashName'];
    }
    FileSubmission.prototype.getFieldId=function(){
        return this.get("data")["fieldId"];
    }

    return module;
})(appForm.models || {});
appForm.models=(function(module){
    var Model=appForm.models.Model;
    module.FormSubmission=FormSubmission;

    function FormSubmission(submissionJSON){
        Model.call(this,{
            "_type":"formSubmission",
            "data":submissionJSON
        });

    }
    appForm.utils.extend(FormSubmission,Model);

    FormSubmission.prototype.getProps=function(){
        return this.get("data");
    }
    FormSubmission.prototype.getFormId=function(){
        return this.get("data")['formId'];
    }

    return module;
})(appForm.models || {});
appForm.models=(function(module){
  var Model=appForm.models.Model;
  module.FormSubmissionComplete=FormSubmissionComplete;

  function FormSubmissionComplete(submissionTask){
    Model.call(this,{
      "_type":"completeSubmission",
      "submissionId": submissionTask.get("submissionId"),
      "localSubmissionId" : submissionTask.get("localSubmissionId")
    });
  }

  appForm.utils.extend(FormSubmissionComplete,Model);

  return module;
})(appForm.models || {});
appForm.models=(function(module){
  var Model=appForm.models.Model;
  module.FormSubmissionStatus=FormSubmissionStatus;

  function FormSubmissionStatus(submissionTask){
    Model.call(this,{
      "_type":"submissionStatus",
      "submissionId": submissionTask.get("submissionId"),
      "localSubmissionId" : submissionTask.get("localSubmissionId")
    });
  }

  appForm.utils.extend(FormSubmissionStatus,Model);

  return module;
})(appForm.models || {});
appForm.models = (function(module) {
    var Model = appForm.models.Model;


    function Submissions() {
        Model.call(this, {
            "_type": "submissions",
            "_ludid": "submissions_list",
            "submissions": []
        });
    }
    appForm.utils.extend(Submissions, Model);

    Submissions.prototype.setLocalId = function() {
        throw ("It is not allowed to set local id programmly for submissions model.");
    }
    /**
     * save a submission to list and store it immediately
     * @param  {[type]}   submission [description]
     * @param  {Function} cb         [description]
     * @return {[type]}              [description]
     */
    Submissions.prototype.saveSubmission = function(submission, cb) {
        this.updateSubmissionWithoutSaving(submission);
        this.saveLocal(cb);
    }
    Submissions.prototype.updateSubmissionWithoutSaving = function(submission) {
        var pruneData = this.pruneSubmission(submission);
        var localId = pruneData['_ludid'];
        if (localId) {
            var meta = this.findMetaByLocalId(localId);
            var submissions = this.get("submissions");
            if (meta) { //existed, remove the old meta and save the new one.
                submissions.splice(submissions.indexOf(meta), 1);
                submissions.push(pruneData);
            } else { // not existed, insert to the tail.
                submissions.push(pruneData);
            }
            
        } else { // invalid local id.
            console.error("Invalid submission:" + JSON.stringify(submission));
        }
    }
    Submissions.prototype.findByFormId = function(formId) {
        var rtn = [];
        var submissions = this.get("submissions");
        for (var i = 0; i < submissions.length; i++) {
            var obj = submissions[i];
            if (submissions[i]['formId'] == formId) {
                rtn.push(obj);
            }
        }
        return rtn;
    }
    Submissions.prototype.getSubmissions = function() {
        return this.get("submissions");
    }
    Submissions.prototype.getSubmissionMetaList = Submissions.prototype.getSubmissions; //function alias
    Submissions.prototype.findMetaByLocalId = function(localId) {
        var submissions = this.get("submissions");
        for (var i = 0; i < submissions.length; i++) {
            var obj = submissions[i];
            if (submissions[i]['_ludid'] == localId) {
                return obj;
            }
        }
        return null;
    }
    Submissions.prototype.pruneSubmission=function(submission){
        var fields=["_id", "_ludid","status","formName","formId","_localLastUpdate","createDate","submitDate","deviceFormTimestamp", "errorMessage", "submissionStartedTimestamp", "submitDate"];
        var data=submission.getProps();

        var rtn = {};
        for (var i = 0; i < fields.length; i++) {
            var key = fields[i];
            rtn[key] = data[key];
        }
        return rtn;
    }
    /**
     * Validate current submission before submit
     * 1. Input Value
     * 2. Field
     * 3. Rules
     * @return {[type]} [description]
     */
    Submissions.prototype.validateBeforeSubmission = function() {
        //TODO add validation
        return true;
    }
    Submissions.prototype.clear = function(cb) {
        var that = this;
        this.clearLocal(function(err) {
            if (err) {
                console.error(err);
                cb(err);
            } else {
                that.set("submissions", []);
                cb(null, null);
            }
        });
    }
    Submissions.prototype.getDrafts = function() {
        return this.findByStatus("draft");
    }
    Submissions.prototype.getPending = function() {
        return this.findByStatus("pending");
    }
    Submissions.prototype.getSubmitted = function() {
        return this.findByStatus("submitted");
    }
    Submissions.prototype.getError = function() {
        return this.findByStatus("error");
    }
    Submissions.prototype.getInProgress = function() {
        return this.findByStatus("inprogress");
    }
    Submissions.prototype.findByStatus = function(status) {
        var submissions = this.get("submissions");
        var rtn = [];
        for (var i = 0; i < submissions.length; i++) {
            if (submissions[i].status == status) {
                rtn.push(submissions[i]);
            }
        }
        return rtn;
    }
    /**
     * return a submission model object by the meta data passed in.
     * @param  {[type]}   meta [description]
     * @param  {Function} cb   [description]
     * @return {[type]}        [description]
     */
    Submissions.prototype.getSubmissionByMeta = function(meta, cb) {
        var localId = meta["_ludid"];
        if (localId) {
            appForm.models.submission.fromLocal(localId, cb);
        } else {
            throw ("local id not found for retrieving submission.")
        }
    }

    Submissions.prototype.removeSubmission = function(localId, cb) {
        var index = this.indexOf(localId);
        if (index > -1) {
            this.get("submissions").splice(index, 1);
        }
        this.saveLocal(cb);
    }
    Submissions.prototype.indexOf = function(localId, cb) {
        var submissions = this.get("submissions");
        for (var i = 0; i < submissions.length; i++) {
            var obj = submissions[i];
            if (submissions[i]['_ludid'] == localId) {
                return i;
            }
        }
        return -1;
    }
    module.submissions = new Submissions();

    return module;
})(appForm.models || {});
appForm.models = (function(module) {

    module.submission = {
        newInstance: newInstance,
        fromLocal: fromLocal
    };

    //implmenetation
    var _submissions = {}; //cache in mem for single reference usage.
    var Model = appForm.models.Model;
    var statusMachine = {
        "new": ["draft", "pending"],
        "draft": ["pending", "draft"],
        "pending": ["inprogress"],
        "inprogress": ["submitted", "pending", "error", "inprogress"],
        "submitted": [],
        "error": []
    };

    function newInstance(form) {
        return new Submission(form);
    }

    function fromLocal(localId, cb) {
        if (_submissions[localId]) { //already loaded
            cb(null, _submissions[localId]);
        } else { //load from storage
            var obj = new Submission();
            obj.setLocalId(localId);
            obj.loadLocal(function(err, submission) {
                if (err) {
                    cb(err);
                } else {
                    submission.reloadForm(function(err, res) {
                        if (err) {
                            cb(err);
                        } else {
                            _submissions[localId] = submission;
                            cb(null, submission);
                        }
                    });
                }
            });
        }

    }

    function Submission(form) {
        Model.call(this, {
            "_type": "submission"
        });
        if (typeof form != "undefined" && form) {
            this.set("formName", form.get("name"));
            this.set("formId", form.get("_id"));

            this.set("deviceFormTimestamp", form.getLastUpdate());
            this.form = form;
            //TODO may contain whole form definition in props.
        }
        this.set("status", "new");
        this.set("createDate", appForm.utils.getTime());
        this.set("timezoneOffset", appForm.utils.getTime(true));
        this.set("appId", appForm.config.get("appId"));
        this.set("appEnvironment", appForm.config.get("env"));
        this.set("appCloudName", ""); //TODO check with eng
        this.set("comments", []);
        this.set("formFields", []);
        this.set("saveDate", null);
        this.set("submitDate", null);
        this.set("uploadStartDate", null);
        this.set("submittedDate", null);
        this.transactionMode = false;
        this.genLocalId();
        var localId = this.getLocalId();
        _submissions[localId] = this;
    }
    appForm.utils.extend(Submission, Model);
    /**
     * save current submission as draft
     * @return {[type]} [description]
     */
    Submission.prototype.saveDraft = function(cb) {
        var targetStatus = "draft";
        var that=this;
        this.set("timezoneOffset", appForm.utils.getTime(true));
        this.set("saveDate", appForm.utils.getTime());
        this.changeStatus(targetStatus, function(err) {
            if (err) {
                return cb(err);
            } else {
                that.emit("savedraft");
                cb(null, null);
            }
        });
    }
    Submission.prototype.validateField = function(fieldId, cb) {
        var that = this;
        this.getForm(function(err, form) {
            if (err) {
                cb(err);
            } else {
                var submissionData = that.getProps();
                var ruleEngine = form.getRuleEngine();
                ruleEngine.validateField(fieldId, submissionData, cb);
            }
        });
    }
    Submission.prototype.checkRules = function(cb) {
        var self = this;
        this.getForm(function(err, form) {
            if (err) {
                cb(err);
            } else {
                var submission = self.getProps();
                var ruleEngine = form.getRuleEngine();
                ruleEngine.checkRules(submission, cb);
            }
        });
    }
    /**
     * submit current submission to remote
     * @param  {Function} cb [description]
     * @return {[type]}      [description]
     */
    Submission.prototype.submit = function(cb) {
        var targetStatus = "pending";
        var validateResult = true;
        var that = this;
        this.set("timezoneOffset", appForm.utils.getTime(true));
        this.getForm(function(err, form) {
            var ruleEngine = form.getRuleEngine();
            var submission = that.getProps();
            ruleEngine.validateForm(submission, function(err, res) {
                if (err) {
                    cb(err);
                } else {
                    var validation = res.validation;
                    if (validation.valid) {
                        that.set("submitDate", new Date());
                        that.changeStatus(targetStatus, function(error) {
                            if (error) {
                                cb(error);
                            } else {
                                that.emit("submit");
                                cb(null, null);
                            }
                        });
                    } else {
                        cb("Validation error");
                        that.emit("validationerror", validation);
                    }
                }
            });
        });
    }

    Submission.prototype.getUploadTask = function(cb) {
        var taskId = this.getUploadTaskId();
        if (taskId) {
            appForm.models.uploadManager.getTaskById(taskId, cb);
        } else {
            cb(null, null);
        }
    }
    Submission.prototype.cancelUploadTask = function(cb) {
        var targetStatus = "submit";
        var that = this;
        appForm.models.uploadManager.cancelSubmission(this, function(err) {
            if (err) {
                console.error(err);
            }
            that.changeStatus(targetStatus, cb);
        });
    }
    Submission.prototype.getUploadTaskId = function() {
        return this.get("uploadTaskId");
    }
    Submission.prototype.setUploadTaskId = function(utId) {
        this.set("uploadTaskId", utId);
    }
    Submission.prototype.submitted = function(cb) {
        var targetStatus = "submitted";
        var that = this;
        this.set("submittedDate", appForm.utils.getTime());
        this.changeStatus(targetStatus, function(err) {
            if (err) {
                cb(err);
            } else {
                that.emit("submitted");
                cb(null, null);
            }
        });



    }
    //joint form id and submissions timestamp.
    Submission.prototype.genLocalId = function() {
        var lid = appForm.utils.localId(this);
        var formId = this.get("formId") || Math.ceil(Math.random() * 100000);
        this.setLocalId(formId + "_" + lid);
    }
    /**
     * change status and save the submission locally and register to submissions list.
     * @param {[type]} status [description]
     */
    Submission.prototype.changeStatus = function(status, cb) {
        if (this.isStatusValid(status)) {
            var that = this;
            this.set("status", status);

            this.saveLocal(function(err, res) {
                that.saveToList(function() {
                    cb(err, res);
                });
            });
        } else {
            throw ("Target status is not valid: " + status);
        }
    }
    Submission.prototype.upload = function(cb) {
        var targetStatus = "inprogress";
        var that = this;
        if (this.isStatusValid(targetStatus)) {
            this.set("status", targetStatus);
            this.set("uploadStartDate", appForm.utils.getTime());
            appForm.models.submissions.updateSubmissionWithoutSaving(this);
            appForm.models.uploadManager.queueSubmission(this, function(err, ut) {
                if (err) {
                    cb(err);
                } else {
                    that.emit("inprogress", ut);
                    cb(null, ut);
                }
            });

        } else {
          return cb("Invalid Status to upload a form submission.");
        }
    }
    Submission.prototype.saveToList = function(cb) {
        appForm.models.submissions.saveSubmission(this, cb);
    }
    Submission.prototype.error = function(errorMsg, cb) {
        this.set("errorMessage", errorMsg);
        var targetStatus = "error";
        this.changeStatus(targetStatus, cb);
        this.emit("submitted", errorMsg);
    }
    Submission.prototype.getStatus = function() {
        return this.get("status");
    }
    /**
     * check if a target status is valid
     * @param  {[type]}  targetStatus [description]
     * @return {Boolean}              [description]
     */
    Submission.prototype.isStatusValid = function(targetStatus) {
        var status = this.get("status").toLowerCase();
        var nextStatus = statusMachine[status];
        if (nextStatus.indexOf(targetStatus) > -1) {
            return true;
        } else {
            return false;
        }
    }

    Submission.prototype.addComment = function(msg, user) {
        var now = appForm.utils.getTime()
        var ts = now.getTime();
        var newComment = {
            "madeBy": typeof user == "undefined" ? "" : user.toString(),
            "madeOn": now,
            "value": msg,
            "timeStamp": ts
        };
        this.getComments().push(newComment);
        return ts;
    }
    Submission.prototype.getComments = function() {
        return this.get("comments");
    }
    Submission.prototype.removeComment = function(timeStamp) {
        var comments = this.getComments();
        for (var i = 0; i < comments.length; i++) {
            var comment = comments[i];
            if (comment.timeStamp == timeStamp) {
                comments.splice(i, 1);
                return;
            }
        }
    }
    /**
     * Add a value to submission.
     * This will not cause the field been validated.
     * Validation should happen:
     * 1. onblur (field value)
     * 2. onsubmit (whole submission json)
     *
     * @param {[type]} params   {"fieldId","value","index":optional}
     * @param {} cb(err,res) callback function when finished
     * @return true / error message
     */
    Submission.prototype.addInputValue = function(params, cb) {
        var that = this;
        var fieldId=params.fieldId;
        var inputValue=params.value;
        var index=params.index===undefined? -1:params.index;
        this.getForm(function(err, form) {
            var fieldModel = form.getFieldModelById(fieldId);
            if (that.transactionMode) {
                if (!that.tmpFields[fieldId]) {
                    that.tmpFields[fieldId] = [];
                }
                fieldModel.processInput(params, function(err, result) {
                    if (err) {
                        cb(err);
                    } else {
                        if (index>-1){
                            that.tmpFields[fieldId][index]=result;    
                        }else{
                            that.tmpFields[fieldId].push(result);
                        }
                        
                        cb(null, result);
                    }
                });
            } else {
                var target = that.getInputValueObjectById(fieldId);
                fieldModel.processInput(params, function(err, result) {
                    if (err) {
                        cb(err);
                    } else {
                        if (index>-1){
                            target.fieldValues[index]=result;    
                        }else{
                            target.fieldValues.push(result);
                        }
                        
                        cb(null, result);
                    }
                });
            }
        });

    }
    Submission.prototype.getInputValueByFieldId = function(fieldId, cb) {
        var values = this.getInputValueObjectById(fieldId).fieldValues;
        this.getForm(function(err, form) {
            var fieldModel = form.getFieldModelById(fieldId);
            fieldModel.convertSubmission(values, cb);
        });

    }
    /**
     * Reset submission
     * @return {[type]} [description]
     */
    Submission.prototype.reset = function() {
        this.set("formFields", []);
        //TODO need to clear local storage like files etc.
    }
    Submission.prototype.startInputTransaction = function() {
        this.transactionMode = true;
        this.tmpFields = {};
    }
    Submission.prototype.endInputTransaction = function(succeed) {
        this.transactionMode = false;
        if (succeed) {
            var targetArr = this.get("formFields");
            var tmpFields = this.tmpFields;
            for (var fieldId in tmpFields) {
                var target = this.getInputValueObjectById(fieldId);
                var valArr = tmpFields[fieldId];
                for (var i = 0; i < valArr.length; i++) {
                    var val = valArr[i];
                    target.fieldValues.push(val);
                }
            }
            this.tmpFields = {};
        } else {
            this.tmpFields = {};
        }
    }
    /**
     * remove an input value from submission
     * @param  {[type]} fieldId field id
     * @param  {[type]} index (optional) the position of the value will be removed if it is repeated field.
     * @return {[type]}         [description]
     */
    Submission.prototype.removeFieldValue = function(fieldId, index) {
        var targetArr = [];
        if (this.transactionMode) {
            targetArr = this.tmpFields["fieldId"];
        } else {
            targetArr = this.getInputValueObjectById(fieldId)["fieldId"];
        }
        if (typeof index == "undefined") {
            targetArr.splice(0, targetArr.length);
        } else {
            if (targetArr.length > index) {
                targetArr.splice(index, 1);
            }
        }

    }
    Submission.prototype.getInputValueObjectById = function(fieldId) {
        var formFields = this.get("formFields", []);
        for (var i = 0; i < formFields.length; i++) {
            var formField = formFields[i];
            if (formField.fieldId == fieldId) {
                return formField;
            }
        }
        var newField = {
            "fieldId": fieldId,
            "fieldValues": []
        }
        formFields.push(newField);
        return newField;
    }
    /**
     * get form model related to this submission.
     * @return {[type]} [description]
     */
    Submission.prototype.getForm = function(cb) {
        var Form = appForm.models.Form;
        var formId = this.get("formId");
        new Form({
            "formId": formId
        }, cb);

    }
    Submission.prototype.reloadForm = function(cb) {
        var Form = appForm.models.Form;
        var formId = this.get("formId");
        this.form = new Form({
            formId: formId
        }, cb);
    }
    /**
     * Retrieve all file fields related value
     * @return {[type]} [description]
     */
    Submission.prototype.getFileInputValues = function() {
        var fileFieldIds = this.form.getFileFieldsId();
        return this.getInputValueArray(fileFieldIds);
    }

    // /**
    //  * Retrieve all image fields related value
    //  * @return {[type]} [description]
    //  */
    // Submission.prototype.getImageInputValues = function() {
    //     var imageFieldIds = this.form.getImageFieldsId();
    //     return this.getInputValueArray(imageFieldIds);
    // }

    Submission.prototype.getInputValueArray=function(fieldIds){
        var rtn=[]
        for (var i=0, fieldId;fieldId=fieldIds[i];i++){
            var inputValue=this.getInputValueObjectById(fieldId);
            for (var j=0;j<inputValue.fieldValues.length;j++){
                var tmpObj=inputValue.fieldValues[j];
                if (tmpObj){
                    tmpObj.fieldId=fieldId;
                    rtn.push(tmpObj);    
                }
            }            
        }
        return rtn;
    }

    Submission.prototype.clearLocal = function(cb) {
        var self = this;
        Model.prototype.clearLocal.call(this, function(err) {
            if (err) {
                return cb(err);
            }
            //remove from submission list
            appForm.models.submissions.removeSubmission(self.getLocalId(), function(err) {
                if (err) {
                    return cb(err);
                }
                //remove from uploading list
                appForm.models.uploadManager.cancelSubmission(self, cb);
                //TODO reset submission
            });
        });
    }

    return module;
})(appForm.models || {});
/**
 * Field model for form
 * @param  {[type]} module [description]
 * @return {[type]}        [description]
 */
appForm.models = (function(module) {

    var Model = appForm.models.Model;

    function Field(opt,form) {
        Model.call(this, {
            "_type": "field"
        });
        if (opt) {
            this.fromJSON(opt);
            this.genLocalId();
        }
        if (form){
            this.form=form;
        }
    }
    appForm.utils.extend(Field, Model);

    Field.prototype.isRequired = function() {
        return this.get("required");
    }
    Field.prototype.getFieldValidation = function() {
        return this.getFieldOptions()['validation'] || {};
    }
    Field.prototype.getFieldDefinition = function() {
        return this.getFieldOptions()['definition'] || {};
    }
    Field.prototype.getMinRepeat=function(){
        var def=this.getFieldDefinition();
        return def["minRepeat"] || 1;
    }
    Field.prototype.getMaxRepeat=function(){
        var def=this.getFieldDefinition();
        return def["maxRepeat"] || 1;
    }
    Field.prototype.getFieldOptions = function() {
        return this.get("fieldOptions", {
            "validation": {},
            "definition": {}
        });
    }
    Field.prototype.isRepeating = function() {
        return this.get("repeating", false);
    }
    /**
     * retrieve field type.
     * @return {[type]} [description]
     */
    Field.prototype.getType = function() {
        return this.get("type", "text");
    }
    Field.prototype.getFieldId = function() {
        return this.get("_id", "");
    }
    Field.prototype.getName = function() {
        return this.get("name", "unknown name");
    }
    Field.prototype.getHelpText = function() {
        return this.get("helpText", "");
    }
    /**
     * Process an input value. convert to submission format. run field.validate before this
     * @param  {[type]} params {"value", "isStore":optional} 
     * @param {cb} cb(err,res)
     * @return {[type]}           submission json used for fieldValues for the field
     */
    Field.prototype.processInput = function(params, cb) {
        var type = this.getType();
        var processorName = "process_" + type;
        var inputValue=params.value;
        if (typeof inputValue ==="undefined" || inputValue ===null){ //if user input is empty, keep going.
            return cb(null,inputValue);
        }
        // try to find specified processor
        if (this[processorName] && typeof this[processorName] == "function") {
            this[processorName](params,cb);
        } else {
            cb(null,inputValue);
        }
    }
    /**
     * Convert the submission value back to input value.
     * @param  {[type]} submissionValue [description]
     * @param { function} cb callback
     * @return {[type]}                 [description]
     */
    Field.prototype.convertSubmission=function(submissionValue, cb){
        var type = this.getType();
        var processorName = "convert_" + type;
        // try to find specified processor
        if (this[processorName] && typeof this[processorName] == "function") {
            this[processorName](submissionValue,cb);
        } else {
            cb(null,submissionValue);
        }
    }
    /**
     * validate a input with this field.
     * @param  {[type]} inputValue [description]
     * @return true / error message
     */
    Field.prototype.validate=function(inputValue,cb){
        this.form.getRuleEngine().validateFieldValue(this.getFieldId(),inputValue,cb);
    }
    /**
     * return rule array attached to this field.
     * @return {[type]} [description]
     */
    Field.prototype.getRules=function(){
        var id=this.getFieldId();
        return this.form.getRulesByFieldId(id);
    }

    Field.prototype.setVisible=function(isVisible){
        this.set("visible",isVisible);
        if (isVisible){
            this.emit("visible");
        }else{
            this.emit("hidden");
        }
    }
    module.Field = Field;
    return module;
})(appForm.models || {});
/**
 * extension of Field class to support checkbox field
 */

appForm.models.Field = (function(module) {
    module.prototype.getCheckBoxOptions = function() {
        var def = this.getFieldDefinition();
        if (def["checkboxChoices"]) {
            return def["checkboxChoices"];
        } else {
            throw ("checkbox choice definition is not found in field definition");
        }
    }
    module.prototype.process_checkboxes = function(params, cb) {
        var inputValue=params.value;
        if (!(inputValue instanceof Array)) {
            cb("the input value for processing checkbox field should be like [val1,val2]");
        } else {
            var obj = {
                "selections": inputValue
            };
            cb(null,obj);
        }
    }
    module.prototype.convert_checkboxes = function(value, cb) {
        var rtn = [];
        for (var i = 0; i < value.length; i++) {
            rtn.push(value[i].selections);
        }
        cb(null,rtn);
    }

    return module;
})(appForm.models.Field || {});
/**
 * extension of Field class to support file field
 */

appForm.models.Field = (function(module) {
    function checkFileObj(obj) {
        return obj.fileName && obj.fileType && obj.hashName;
    }
    module.prototype.process_file = function(params, cb) {
        var inputValue = params.value;
        var isStore = params.isStore === undefined ? true : params.isStore;
        if (typeof inputValue == "undefined" || inputValue == null) {
            return cb(null, null);
        }
        if (typeof inputValue != "object" || (!inputValue instanceof HTMLInputElement && !inputValue instanceof File && !checkFileObj(inputValue))) {
            throw ("the input value for file field should be a html file input element or a File object");
        }
        if (checkFileObj(inputValue)) {
            return cb(null, inputValue);
        }
        var file = inputValue;
        if (inputValue instanceof HTMLInputElement) {
            file = inputValue.files[0]; // 1st file only, not support many files yet.
        }
        var rtnJSON = {
            "fileName": file.name,
            "fileSize": file.size,
            "fileType": file.type,
            "fileUpdateTime": file.lastModifiedDate,
            "hashName": "",
            "contentType":"binary"
        };
        var name = file.name + new Date().getTime() + Math.ceil(Math.random() * 100000);
        appForm.utils.md5(name, function(err, res) {
            var hashName = res;
            if (err) {
                hashName = name;
            }
            rtnJSON.hashName = hashName;
            if (isStore) {
                appForm.utils.fileSystem.save(hashName, file, function(err, res) {
                    if (err) {
                        console.error(err);
                        cb(err);
                    } else {
                        cb(null, rtnJSON);
                    }
                });
            }else{
                cb(null,rtnJSON);
            }

        });
    }
    return module;
})(appForm.models.Field || {});

/**
 * extension of Field class to support latitude longitude field
 */

appForm.models.Field = (function(module) {
    /**
     * Format: [{lat: number, long: number}]
     * @param  {[type]} inputValues [description]
     * @return {[type]}             [description]
     */
    module.prototype.process_location = function(params, cb) {
        var inputValue=params.value;
        var def = this.getFieldDefinition();
        switch (def.locationUnit) {
            case "latLong":
                if (!inputValue["lat"] || !inputValue["long"]) {
                    cb("the input values for latlong field is {lat: number, long: number}");
                } else {
                    var obj = {
                        "lat": inputValue.lat,
                        "long": inputValue.long
                    }
                    cb(null, obj);
                }
                break;
            case "northEast":
                if (!inputValue["zone"] || !inputValue["eastings"] || !inputValue["northings"]) {
                    cb("the input values for northeast field is {zone: text, eastings: text, northings:text}");
                } else {
                    var obj = {
                        "zone": inputValue.zone,
                        "eastings": inputValue.eastings,
                        "northings": inputValue.northings
                    }
                    cb(null, obj);
                }
                break;
        }

    }
    return module;
})(appForm.models.Field || {});
/**
 * extension of Field class to support matrix field
 */

appForm.models.Field=(function(module){
    module.prototype.getMatrixRows=function(){
        var def=this.getFieldDefinition();
        if (def["rows"]){
            return def["rows"];
        }else{
            throw ("matrix rows definition is not found in field definition");
        }
    }
    module.prototype.getMatrixCols=function(){
        var def=this.getFieldDefinition();
        if (def["columns"]){
            return def["columns"];
        }else{
            throw ("matrix columns definition is not found in field definition");
        }
    }
    return module;
})(appForm.models.Field ||{});


/**
 * extension of Field class to support radio field
 */

appForm.models.Field=(function(module){
    module.prototype.getRadioOption=function(){
        var def=this.getFieldDefinition();
        if (def["options"]){
            return def["options"];
        }else{
            throw ("Radio options definition is not found in field definition");
        }
    }
    return module;
})(appForm.models.Field ||{});

/**
 * extension of Field class to support file field
 */

appForm.models.Field = (function(module) {
    function checkFileObj(obj) {
        return obj.fileName && obj.fileType && obj.hashName;
    }

    function imageProcess(params, cb) {
        var inputValue = params.value;
        var isStore = params.isStore === undefined ? true : params.isStore;
        if (inputValue == "") {
            return cb(null, null);
        }
        var imgName = "";
        var dataArr = inputValue.split(";base64,");
        var imgType = dataArr[0].split(":")[1];
        var size = inputValue.length;
        genImageName(function(err, n) {
            imgName = n;
            var meta = {
                "fileName":imgName,
                "hashName": imgName,
                "contentType":"base64",
                "fileSize": size,
                "fileType": imgType,
                "imgHeader": "data:" + imgType + ";base64,"
            }
            if (isStore) {
                appForm.utils.fileSystem.save(imgName, dataArr[1], function(err, res) {
                    if (err) {
                        console.error(err);
                        cb(err);
                    } else {
                        cb(null, meta);
                    }
                });
            }else{
                cb(null,meta);
            }

        });

    }

    function genImageName(cb) {
        var name = new Date().getTime() + "" + Math.ceil(Math.random() * 100000);
        appForm.utils.md5(name, cb);
    }

    function covertImage(value, cb) {

        if (value.length == 0) {
            cb(null, value);
        } else {
            var count = value.length;
            for (var i = 0; i < value.length; i++) {
                var meta = value[i];
                _loadImage(meta, function() {
                    count--;
                    if (count == 0) {
                        cb(null, value);
                    }
                });
            }
        }

    }

    function _loadImage(meta, cb) {
        if (meta) {
            var name = meta.hashName;
            appForm.utils.fileSystem.readAsText(name, function(err, text) {
                if (err) {
                    console.error(err);
                }
                meta.data = text;
                cb(err, meta);
            });
        } else {
            cb(null, meta);
        }

    }
    module.prototype.process_signature = imageProcess;
    module.prototype.convert_signature = covertImage;
    module.prototype.process_photo = imageProcess;
    module.prototype.convert_photo = covertImage;
    return module;
})(appForm.models.Field || {});
/**
 * One form contains multiple pages
 */
appForm.models=(function(module){
    var Model=appForm.models.Model;

    function Page(opt,parentForm){
        if (typeof opt =="undefined" || typeof parentForm == "undefined"){
            throw("Page initialise failed: new Page(pageDefinitionJSON, parentFormModel)");
        }
        Model.call(this,{
            "_type":"page"
        });
        this.fromJSON(opt);
        this.form=parentForm;
        this.initialise();
    }
    appForm.utils.extend(Page, Model);
    Page.prototype.initialise=function(){
        var fieldsDef=this.getFieldDef();
        this.fieldsIds=[];
        for (var i=0;i<fieldsDef.length;i++){
            this.fieldsIds.push(fieldsDef[i]._id);
        }
    }   
    Page.prototype.setVisible=function(isVisible){
        this.set("visible",isVisible);
        if (isVisible){
            this.emit("visible");
        }else{
            this.emit("hidden");
        }
    }
    Page.prototype.getName=function(){
        return this.get("name","");
    }
    Page.prototype.getDescription=function(){
        return this.get("description","");
    }
    Page.prototype.getFieldDef=function(){
        return this.get("fields",[]);
    }
    Page.prototype.getFieldModelList=function(){
        var list=[];
        for (var i=0;i<this.fieldsIds.length;i++){
            list.push(this.form.getFieldModelById(this.fieldsIds[i]));
        }
        return list;
    }
    Page.prototype.getFieldModelById=function(fieldId){
        return this.form.getFieldModelById(fieldId);
    }
    Page.prototype.getPageId=function(){
        return this.get("_id","");
    }
    module.Page=Page;

    return module;
})(appForm.models || {});
/**
 * Validate field value
 * extend this module to add more validations
 */
appForm.models=(function(module){
    var Model=appForm.models.Model;
    function FieldValidate(){
        Model.call(this,{
            "_type":"fieldvalidate"
        });

    }
    appForm.utils.extend(FieldValidate,Model);
    /**
     * Validate input value with field model input constraints  (not definitions)
     * @param  {[type]} fieldModel [description]
     * @return {[type]}            [description]
     */
    FieldValidate.prototype.validate=function(inputValue, fieldModel){
        var isRequired=fieldModel.isRequired();
        var validation=fieldModel.getFieldValidation();
        for (var act in validation){
            if (!this[act] || typeof this[act]!="function"){
                console.error("Validation method is not found:"+act);
            }else{
                var res=this[act](inputValue,validation[act]);
                if (res === true){
                    continue;
                }else{
                    return res;
                }
            }
        }
        return true;
    }

    FieldValidate.prototype.min=function(inputValue, targetVal){
        if (inputValue>=targetVal){
            return true;
        }else{
            return "Min value is "+targetVal+" while input value is "+inputValue;
        }
    }
    FieldValidate.prototype.max=function(inputValue, targetVal){
        if (inputValue<=targetVal){
            return true;
        }else{
            return "Max value is "+targetVal+" while input value is "+inputValue;
        }
    }

    FieldValidate.prototype.minSelected=function(inputValue, targetVal){
        if (typeof inputValue =="array" && inputValue.length>=targetVal){
            return true;
        }else{
            return "Min selected number is "+targetVal;
        }
    }
    FieldValidate.prototype.maxSelected=function(inputValue, targetVal){
        if (typeof inputValue =="array" && inputValue.length<=targetVal){
            return true;
        }else{
            return "Max selected number is "+targetVal;
        }
    }

    module.fieldValidate=new FieldValidate();

    return module;
})(appForm.models || {});
/**
 * Manages submission uploading tasks
 */

appForm.models = (function(module) {
    var Model = appForm.models.Model;

    function UploadManager() {
        Model.call(this, {
            "_type": "uploadManager"
        });
        this.set("taskQueue", []);
        this.timeOut = 60; //60 seconds. TODO: defin in config
        this.sending = false;
        this.timerInterval = 200;
        this.sendingStart = appForm.utils.getTime();
    }
    appForm.utils.extend(UploadManager, Model);
    /**
     * Queue a submission to uploading tasks queue
     * @param  {[type]} submissionModel [description]
     * @param {Function} cb callback once finished
     * @return {[type]}                 [description]
     */
    UploadManager.prototype.queueSubmission = function(submissionModel, cb) {
        var utId;
        var uploadTask = null;
        var self = this;
        if (submissionModel.getUploadTaskId()) {
            utId = submissionModel.getUploadTaskId();
        } else {
            uploadTask = appForm.models.uploadTask.newInstance(submissionModel);
            utId = uploadTask.getLocalId();
        }
        this.push(utId);
        if (!this.timer){
            this.start();
        }
        if (uploadTask) {
            uploadTask.saveLocal(function(err) {
                if (err) {
                    console.error(err);
                }
                self.saveLocal(function(err) {
                    if (err) {
                        console.error(err);
                    }
                    submissionModel.setUploadTaskId(utId);
                    cb(null, uploadTask);
                });
            });
        }else{
            self.getTaskById(utId,cb);
        }
    }
    /**
     * cancel a submission uploading
     * @param  {[type]}   submissionsModel [description]
     * @param  {Function} cb               [description]
     * @return {[type]}                    [description]
     */
    UploadManager.prototype.cancelSubmission = function(submissionsModel, cb) {
        var uploadTId = submissionsModel.getUploadTaskId();
        var queue = this.get("taskQueue");
        if (uploadTId) {
            var index = queue.indexOf(uploadTId);
            if (index > -1) {
                queue.splice(index, 1);
            }
            this.getTaskById(uploadTId, function(err, task) {
                if (err) {
                    console.error(err);
                    cb(task);
                } else {
                    if (task) {
                        task.clearLocal(cb);
                    } else {
                        cb(null, null);
                    }
                }
            });
        } else {
            cb(null, null);
        }
    }
    // /**
    //  * Queue all pending submission
    //  * @param  {Function} cb [description]
    //  * @return {[type]}      [description]
    //  */
    // UploadManager.prototype.queueAllPending=function(cb){
    //     var submissionsModel=appForm.models.submissions;
    //     var submissionMetaList=submissionsModel.getPending();
    //     var self=this;
    //     for (var i=0,subMeta;subMeta=submissionMetaList[i];i++){
    //         submissionsModel.getSubmissionByMeta(subMeta,function(err,submission){
    //             if(err){
    //                 console.error(err);
    //             }else{
    //                 self.queueSubmission(submission)
    //             }
    //         });
    //     }
    // }
    UploadManager.prototype.getTaskQueue = function() {
        return this.get("taskQueue", []);
    }
    /**
     * start a timer
     * @param  {} interval ms
     * @return {[type]}      [description]
     */
    UploadManager.prototype.start = function() {
        var that = this;
        this.stop();
        this.timer = setInterval(function() {
            that.tick();
        }, this.timerInterval);
    }
    /**
     * stop uploadgin
     * @return {[type]} [description]
     */
    UploadManager.prototype.stop = function() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }

    }
    UploadManager.prototype.push = function(uploadTaskId) {
        this.get("taskQueue").push(uploadTaskId);
    }
    UploadManager.prototype.shift = function() {
        return this.get("taskQueue").shift();
    }
    UploadManager.prototype.rollTask = function() {
        this.push(this.shift());
    }
    UploadManager.prototype.tick = function() {
        if (this.sending) {
            var now = appForm.utils.getTime();
            var timePassed = now.getTime() - this.sendingStart.getTime();
            if (timePassed > this.timeOut * 1000) { //time expired. roll current task to the end of queue
                console.error("Uploading content timeout. it will try to reupload.");
                this.sending = false;
                this.rollTask();
            }
        } else {

            if (this.hasTask()) {
                this.sending = true;
                this.sendingStart = appForm.utils.getTime();
                var that = this;
                this.getCurrentTask(function(err, task) {
                    if (err || !task) {
                        console.error(err);
                        that.sending = false;
                    } else {
                        if (task.isCompleted()) { //current task uploaded. shift it from queue
                            that.shift();
                            that.sending = false;
                            that.saveLocal(function() {});
                        } else {
                            task.uploadTick(function(err) { //file or form uploaded. ready for next upload command
                                if (err) {
                                    console.error(err);
                                }
                                that.sending = false;
                            });
                        }
                    }
                });
            } else { //no task . stop timer.
                this.stop();
            }

        }
    }
    UploadManager.prototype.hasTask = function() {
        return this.get("taskQueue").length > 0;
    }
    UploadManager.prototype.getCurrentTask = function(cb) {
        var taskId = this.getTaskQueue()[0];
        if (taskId) {
            this.getTaskById(taskId, cb);
        } else {
            cb(null, null);
        }
    }
    UploadManager.prototype.getTaskById = function(taskId, cb) {
        appForm.models.uploadTask.fromLocal(taskId, cb);
    }
    module.uploadManager = new UploadManager();
    return module;
})(appForm.models || {});
appForm.models=(function(module){
    var Model=appForm.models.Model;
    /**
     * Describe rules associated to one field.
     * @param {[type]} param {"type":"page | field", "definition":defJson}
     */
    function Rule(param){
        Model.call(this,{
            "_type":"rule"
        });
        this.fromJSON(param);
    }
    appForm.utils.extend(Rule,Model);
    /**
     * Return source fields id required from input value for this rule
     * @return [fieldid1, fieldid2...] [description]
     */
    Rule.prototype.getRelatedFieldId=function(){
        var def=this.getDefinition();
        var statements=def.ruleConditionalStatements;
        var rtn=[];
        for (var i=0, statement; statement=statements[i];i++){
            rtn.push(statement.sourceField);
        }
        return rtn;
    }
    /**
     * test if input value meet the condition
     * @param  {[type]} param {fieldId:value, fieldId2:value2}
     * @return {[type]}       true - meet rule  / false -  not meet rule
     */
    Rule.prototype.test=function(param){
        var fields=this.getRelatedFieldId();
        var logic=this.getLogic();
        var res=logic=="or"?false:true;
        for (var i=0, fieldId; fieldId=fields[i];i++){
            var val=param[fieldId];
            if (val){
                
                var tmpRes=this.testField(fieldId,val);
                if (logic=="or"){
                    res = res || tmpRes;
                    if (res == true){ //break directly
                        return true;
                    }
                }else{
                    res = res && tmpRes;
                    if (res == false){ //break directly
                        return false;
                    }
                }
            }else{
                if (logic=="or"){
                    res=res || false;
                }else{
                    return false;
                }
            }
        }
        return res;
    }
    /**
     * test a field if the value meets its conditon
     * @param  {[type]} fieldId [description]
     * @param  {[type]} val     [description]
     * @return {[type]}         [description]
     */
    Rule.prototype.testField=function(fieldId,val){
        var statement=this.getRuleConditionStatement(fieldId);
        var condition=statement.restriction;
        var expectVal=statement.sourceValue;
        return appForm.models.checkRule(condition,expectVal,val);
    }
    Rule.prototype.getRuleConditionStatement=function(fieldId){
        var statements=this.getDefinition()["ruleConditionalStatements"];
        for (var i=0, statement; statement=statements[i];i++){
            if (statement.sourceField==fieldId){
                return statement;
            }
        }
        return null;
    }
    Rule.prototype.getLogic=function(){
        var def=this.getDefinition();
        return def.ruleConditionalOperator.toLowerCase();
    }
    Rule.prototype.getDefinition=function(){
        return this.get("definition");
    }
    Rule.prototype.getAction=function(){
        var def=this.getDefinition();
        var target={
            "action":def.type,
            "targetId":this.get("type")=="page"?def.targetPage:def.targetField,
            "targetType":this.get("type")
        }
        return target;
    }

    module.Rule=Rule;

    return module;
})(appForm.models || {});

appForm.models=(function(module){

    module.checkRule=checkRule;
    /**
     * check if an input value meet the expected val in certain condition.
     * @param  {[type]} condition [description]
     * @param  {[type]} expectVal [description]
     * @param  {[type]} InputVal  [description]
     * @return {[type]}           [description]
     */
    function checkRule(condition,expectVal,inputVal){
        var funcName=condition.toLowerCase().replace(/\s/g,"_");
        var func=rules[funcName];
        if (func){
            return func(expectVal,inputVal);
        }else{
            console.error("Rule func not found:"+funcName);
            return false;    
        }
        
    }

    var rules={
        "is_not":function(expectVal,inputVal){
            return expectVal!=inputVal;
        },
        "is_equal_to":function(expectVal,inputVal){
            return expectVal==inputVal;
        },
        "is_greater_than":function(expectVal,inputVal){
            return expectVal<inputVal;
        },
        "is_less_than":function(expectVal,inputVal){
            return expectVal>inputVal;
        },
        "is_on":function(expectVal,inputVal){
            try{
                 return new Date(expectVal).getTime() == new Date(inputVal).getTime();     
            }catch(e){
                console.error(e);
                return false;
            }
        },
        "is_before":function(expectVal,inputVal){
            try{
                 return new Date(expectVal).getTime() > new Date(inputVal).getTime();     
            }catch(e){
                console.error(e);
                return false;
            }
        },
        "is_after":function(expectVal,inputVal){
            try{
                 return new Date(expectVal).getTime() < new Date(inputVal).getTime();     
            }catch(e){
                console.error(e);
                return false;
            }   
        },
        "is":function(expectVal,inputVal){
            return expectVal==inputVal;
        },
        "contains":function(expectVal,inputVal){
            return inputVal.toString().indexOf(expectVal.toString())>-1;
        },
        "does_not_contain":function(expectVal,inputVal){
            return inputVal.toString().indexOf(expectVal.toString())==-1;   
        },
        "begins_with":function(expectVal,inputVal){
            return inputVal.toString().indexOf(expectVal.toString())==0;
        },
        "ends_with":function(expectVal,inputVal){
            return inputVal.toString().length == (inputVal.toString().indexOf(expectVal.toString())+expectVal.toString().length);
        }
    }

    return module;
})(appForm.models || {});
/**
 * Uploading task for each submission
 */

appForm.models = (function(module) {
    module.uploadTask={
        "newInstance":newInstance,
        "fromLocal":fromLocal
    }
    var _uploadTasks={}; //mem cache for singleton.
    var Model = appForm.models.Model;
    function newInstance(submissionModel){
        var utObj=new UploadTask();
        utObj.init(submissionModel);
        _uploadTasks[utObj.getLocalId()]=utObj;
        return utObj;
    }

    function fromLocal(localId,cb){
        if (_uploadTasks[localId]){
            return cb(null,_uploadTasks[localId]);
        }
        var utObj=new UploadTask();
        utObj.setLocalId(localId);
        _uploadTasks[localId]=utObj;
        utObj.loadLocal(cb);
    }

    function UploadTask() {
        Model.call(this, {
            "_type": "uploadTask"
        });
    }
    appForm.utils.extend(UploadTask, Model);
    UploadTask.prototype.init = function(submissionModel) {
        var json = submissionModel.getProps();
        var files = submissionModel.getFileInputValues();
        var submissionLocalId = submissionModel.getLocalId();
        this.setLocalId(submissionLocalId + "_" + "uploadTask");
        this.set("submissionLocalId", submissionLocalId);
        this.set("jsonTask", json);
        this.set("fileTasks", []);
        this.set("currentTask", null);
        this.set("completed", false);
        this.set("formId", submissionModel.get("formId"));
        for (var i = 0, file; file = files[i]; i++) {
            this.addFileTask(file);
        }

    }
    UploadTask.prototype.getTotalSize = function() {
        var jsonSize = JSON.stringify(this.get("jsonTask")).length;
        var fileTasks = this.get("fileTasks");
        var fileSize = 0;
        for (var i = 0, fileTask; fileTask = fileTasks[i]; i++) {
            fileSize += fileTask.fileSize;
        }
        return jsonSize + fileSize;
    }
    UploadTask.prototype.getUploadedSize = function() {
        var currentTask = this.getCurrentTask();
        if (currentTask === null) {
            return 0;
        } else {
            var jsonSize = JSON.stringify(this.get("jsonTask")).length;
            var fileTasks = this.get("fileTasks");
            var fileSize = 0;
            for (var i = 0, fileTask; (fileTask = fileTasks[i]) && (i<currentTask); i++) {
                fileSize += fileTask.fileSize;
            }
            return jsonSize+fileSize;
        }
    }
    UploadTask.prototype.getRemoteStore = function() {
        return appForm.stores.mBaaS;
    }
    UploadTask.prototype.addFileTask = function(fileDef) {
        this.get("fileTasks").push(fileDef);
    }
    /**
     * get current uploading task
     * @return {[type]} [description]
     */
    UploadTask.prototype.getCurrentTask = function() {
        return this.get("currentTask");
    }

    UploadTask.prototype.isStarted = function() {
        return this.get("currentTask", null) == null ? false : true;
    }
    /**
     * upload form submission
     * @param  {Function} cb [description]
     * @return {[type]}      [description]
     */
    UploadTask.prototype.uploadForm = function(cb) {
        var formSub = this.get("jsonTask");
        var that = this;
        var formSubmissionModel = new appForm.models.FormSubmission(formSub);
          this.getRemoteStore().create(formSubmissionModel, function(err, res) {
            if (err) {
              that.completed(err, function(_err){
                if(_err){
                  console.log("uploadForm Err: ",_err);
                }

                return cb(err);
              });
            } else {
                var submissionId = res.submissionId;
                var updatedFormDefinition = res.updatedFormDefinition;
                if (updatedFormDefinition) { // remote form definition is updated
                    that.refreshForm(function() { //refresh related form definition
                      var err = "Form definition is out of date.";
                      that.completed(err, function(_err){
                        if(_err){
                          console.log("uploadForm Err: ",_err);
                        }

                        return cb(err);
                      });
                    });
                } else { // form data submitted successfully.
                    formSub.lastUpdate = appForm.utils.getTime();
                    that.set("submissionId", submissionId);
                    that.set("currentTask", 0);
                    that.emit("progress", that.getProgress());
                    return cb(null);
                }
            }
        });
    }

    /**
     * Handles the case where a call to completeSubmission returns a status other than "completed".
     * Will only ever get to this function when a call is made to the completeSubmission server.
     *
     *
     * @param err (String) Error message associated with the error returned
     * @param res {"status" : <pending/error>, "pendingFiles" : [<any pending files not yet uploaded>]}
     * @param cb Function callback
     */
    UploadTask.prototype.handleCompletionError = function(err, res, cb){
      var errorMessage = err;

      if(res.status === "pending"){
        //The submission is not yet complete, there are files waiting to upload. This is an unexpected state as all of the files should have been uploaded.
        return this.handleIncompleteSubmission(cb);
      } else if(res.status === "error"){
        //There was an error completing the submission.
        errorMessage = "Error completing submission";
      } else {
        errorMessage = "Invalid return type from complete submission";
      }

      this.submissionModel(function(_err,model){
        model.error(errorMessage, function(){
          return cb(errorMessage);
        });
      });
    }


  /**
   * Handles the case where the current submission status is required from the server.
   * Based on the files waiting to be uploaded, the upload task is re-built with pendingFiles from the server.
   *
   * @param cb
   */
    UploadTask.prototype.handleIncompleteSubmission = function(cb){

      var remoteStore = this.getRemoteStore();

      var submissionStatus = new appForm.models.FormSubmissionStatus(this);

      var that = this;
      remoteStore.submissionStatus(submissionStatus, function(err, res){
        if(err){
          that.completed(err, function(_err){
            if(err) console.error("Submission Status Error: ", _err);
            return cb(err);
          });
        } else if(res.status === "error"){//The server had an error submitting the form, finish with an error
          var errMessage = "Error submitting form.";
          that.completed(errMessage, function(_err){
            if(err) console.error("Submission Status Error: ", _err);
            return cb(errMessage);
          });
        } else if(res.status === "complete"){ //Submission is complete, call complete to finish the submission
          that.completed(null, function(err){
            if(err) console.error("Submission Status Error: ", err);
            return cb(err);
          });
        } else if(res.status === "pending"){ //Submission is still pending, check for files not uploaded yet.
          var pendingFiles = res.pendingFiles || [];

          if(pendingFiles.length > 0){ //No files pending on the server, call completeFormSubmission to finish the submission
            that.resetUploadTask(pendingFiles, cb);
          } else {
            that.completed(null, cb);
          }
        } else { //Should not get to this point. Only valid status responses are error, pending and complete.
          var errMessage = "Invalid submission status response.";
          that.completed(errMessage, function(err){
            if(err) console.error("Submission Status Error: ", err);
            return cb(errMessage);
          });
        }
      });
    }

    /**
     * Resetting the upload task based on the response from getSubmissionStatus
     * @param pendingFiles -- Array of files still waiting to upload
     * @param cb
     */
    UploadTask.prototype.resetUploadTask = function(pendingFiles, cb){
      var filesToUpload = this.get("fileTasks");

      var resetFilesToUpload = [];

      //Adding the already completed files to the reset array.
      for(var fileIndex = 0; fileIndex < filesToUpload.length; fileIndex++){
        if(pendingFiles.indexOf(filesToUpload[fileIndex].hashName) < 0){
          resetFilesToUpload.push(filesToUpload[fileIndex]);
        }
      }

      //Adding the pending files to the end of the array.
      for(var fileIndex = 0; fileIndex < filesToUpload.length; fileIndex++){
        if(pendingFiles.indexOf(filesToUpload[fileIndex].hashName) > -1){
          resetFilesToUpload.push(filesToUpload[fileIndex]);
        }
      }

      var resetFileIndex = filesToUpload.length - pendingFiles.length - 1;
      var resetCurrentTask = 0;

      if(resetFileIndex > 0){
        resetCurrentTask = resetFileIndex;
      }

      //Reset current task
      this.set("currentTask", resetCurrentTask);
      this.set("fileTasks", resetFilesToUpload);
      this.saveLocal(cb); //Saving the reset files list to local
    }

    UploadTask.prototype.uploadFile = function(cb) {
        var that = this;
        var submissionId = this.get("submissionId");

        if (submissionId) {
            var progress = this.get("currentTask");
            if (progress == null) {
                progress = 0;
                that.set("currentTask", progress);
            }
            var fileTask = this.get("fileTasks", [])[progress];
            if (!fileTask) {
                return cb("cannot find file task");
            }
            var fileSubmissionModel = new appForm.models.FileSubmission(fileTask);
            fileSubmissionModel.setSubmissionId(submissionId);

            fileSubmissionModel.loadFile(function(err) {
                if (err) {
                  that.completed(err, function(_err){
                    return cb(err);
                  });
                } else {
                    that.getRemoteStore().create(fileSubmissionModel, function(err, res) {
                        if (err) {
                            cb(err);
                        } else {
                            if (res.status == "ok") {
                                fileTask.updateDate = appForm.utils.getTime();

                                var curTask = progress;
                                curTask++;
                                that.set("currentTask", curTask);
                                that.emit("progress", that.getProgress());
                                if (that.get("fileTasks").length <= curTask) {
                                    that.completed(null, function(err){
                                      return cb(err);
                                    });
                                } else {
                                  return cb(null); //File uploaded, not finished all of the files yet for this task.
                                }
                            } else {


                              var errorMessage = "File upload failed for file: " + fileTask.fileName;
                              that.handleIncompleteSubmission(function(err){
                                if(err) console.error(err);
                                return cb(errorMessage);
                              });
                            }
                        }
                    });
                }
            });
        } else {
            this.completed("Failed to upload file. Submission Id not found.", function(err){
              if(err){
                console.error("uploadFile Completed Err: ", err);
              }
              return cb("Failed to upload file. Submission Id not found.");
            });
        }
    }
    UploadTask.prototype.uploadTick = function(cb) {
      var currentTask = this.get("currentTask", null);
      if (this.isCompleted()) { //Already completed, nothing to do.
        return cb(null, null);
      } else if(currentTask === null){ // No current task, send the form json
        this.uploadForm(cb);
      } else {
        if (this.get("fileTasks").length == 0) { //No files to upload, just call complete.
          this.completed(null, function(err){
            return cb(err);
          });
        } else {
          this.uploadFile(cb);
        }
      }
    }
    /**
     * the upload task is completed -- Verify that the submission has completed by calling mbaas completeSubmission.
     * @return {[type]} [description]
     */
    UploadTask.prototype.completed = function(err, cb) {
      var that = this;
      this.set("completed", true);
      if(err){
        this.set("error", err);
        this.submissionModel(function(_err,model){
          model.error(err, cb);
        });

        return; // No need to go any further, return from this function.
      }

      var submissionId = this.get("submissionId", null);

      if(submissionId === null){
        return this.completed("Failed to complete submission. Submission Id not found.", cb);
      }

      var remoteStore = this.getRemoteStore();


      var completeSubmission = new appForm.models.FormSubmissionComplete(this);
      remoteStore.completeSubmission(completeSubmission, function(err, res){
        //if status is not "completed", then handle the completion err

        if(res.status !== "complete"){
          return that.handleCompletionError(err, res, cb);
        }

        //Completion is now completed sucessfully.. set to complete and update the model..
        that.submissionModel(function(_err,model){
          model.submitted(cb);
        });
      });
    }
    UploadTask.prototype.isCompleted = function() {
        return this.get("completed", false);
    }
    UploadTask.prototype.getProgress = function() {
        var rtn = {
            "formJSON": false,
            "currentFileIndex": 0,
            "totalFiles": this.get("fileTasks").length,
            "totalSize":this.getTotalSize(),
            "uploaded":this.getUploadedSize()
        };
        var progress = this.get("currentTask");
        if (progress === null) {
            return rtn;
        } else {
            rtn.formJSON = true;
            rtn.currentFileIndex = progress;
        }
        return rtn;
    }

    /**
     * Refresh related form definition.
     * @param  {Function} cb [description]
     * @return {[type]}      [description]
     */
    UploadTask.prototype.refreshForm = function(cb) {
        var formId = this.get("formId");
        new appForm.models.Form({
            "formId": formId
        }, function(err, form) {
            if (err) {
                console.error(err);
            }
            form.refresh(true, function(err) {
                if (err) {
                    console.error(err);
                }
                cb();
            });
        });
    }

    UploadTask.prototype.submissionModel = function(cb) {
        appForm.models.submission.fromLocal(this.get("submissionLocalId"), function(err, submission) {
            if (err) {
                console.error(err);
            }
            cb(err, submission);
        });
    }
    return module;
})(appForm.models || {});
appForm.models=(function(module){
  var Model=appForm.models.Model;

  function Theme(){
    Model.call(this,{
      "_type":"theme"
    });
  }

  appForm.utils.extend(Theme, Model);

  module.theme = new Theme();
  return module;
})(appForm.models||{});
/**
 * FeedHenry License
 */
appForm.api = (function(module) {
    module.getForms=getForms;
    module.getForm=getForm;
    module.getTheme=getTheme;
//    module.saveDraft=saveDraft;
    module.submitForm=submitForm;
//    module.getPending=getPending;
    module.getSubmissions=getSubmissions;
//    module.getSubmissionData=getSubmissionData;
//    module.getFailed=getFailed;
//    module.getDrafts=getDrafts;
    module.init=appForm.init;
    module.config=appForm.models.config;
    

    var _submissions = null;

    /**
     * Retrieve forms model. It contains forms list. check forms model usage
     * @param  {[type]}   params {fromRemote:boolean}
     * @param  {Function} cb    (err, formsModel)
     * @return {[type]}          [description]
     */
    function getForms(params, cb) {
      var fromRemote = params.fromRemote;
      if (fromRemote == undefined) {
        fromRemote = false;
      }
      appForm.models.forms.refresh(fromRemote, cb);
    }

    /**
     * Retrieve form model with specified form id.
     * @param  {[type]}   params {formId: string, fromRemote:boolean}
     * @param  {Function} cb     (err, formModel)
     * @return {[type]}          [description]
     */
    function getForm(params, cb) {
        new appForm.models.Form(params, cb);
    }

    /**
     * Find a theme definition for this app.
     * @param params {fromRemote:boolean(false)}
     * @param {Function} cb {err, themeData} . themeData = {"json" : {<theme json definition>}, "css" : "css" : "<css style definition for this app>"}
     */
    function getTheme(params,cb){
      var theme = appForm.models.theme;

      if(!params.fromRemote){
        params.fromRemote = false;
      }

      theme.refresh(params.fromRemote, function(err, updatedTheme){
        if(err) return cb(err);

        if(updatedTheme === null){
          return cb(new Error("No theme defined for this app"));
        }

        return cb(null, updatedTheme);
      });
    }

  /**
   * Get submissions that are in draft mode. I.e. saved but not submitted
   * @param params {}
   * @param {Function} cb     (err, draftsArray)
   */
//    function getDrafts(params, cb){
//      //Only getting draft details -- not draft data
//      var submissions = appForm.models.submissions;
//      var drafts = submissions.getDrafts();
//      var returnDrafts = [];
//      if(drafts){
//        drafts.forEach(function(draft){
//          draft.localSubmissionId = draft._ludid;
//          returnDrafts.push(draft);
//        });
//      }
//      return cb(null, returnDrafts);
//    }

    /**
     * Get submissions that are pending. I.e. submitted but not complete.
     * Pending can be either "pending" or "inprogress"
     * @param params {}
     * @param {Function} cb     (err, pendingArray)
     */
//    function getPending(params, cb){
//      var submissions = appForm.models.submissions;
//
//      var pending = submissions.getPending();
//      var inProgress = submissions.getInProgress();
//      var returnPending = [];
//
//      if(pending){
//        pending.forEach(function(pendingSubmission){
//          pendingSubmission.localSubmissionId = pendingSubmission._ludid;
//          pendingSubmission.dateSubmissionStarted = new Date(pendingSubmission.submissionStartedTimestamp);
//          returnPending.push(pendingSubmission);
//        });
//      }
//
//      if(inProgress){
//        inProgress.forEach(function())
//      }
//
//      return cb(null, returnPending);
//    }

    /**
     * Get submissions that are submitted. I.e. submitted and complete.
     * @param params {}
     * @param {Function} cb     (err, submittedArray)
     */
    function getSubmissions(params, cb){
      //Getting submissions that have been completed.
      var submissions = appForm.models.submissions;

      if (_submissions==null){
        appForm.models.submissions.loadLocal(function(err){
          if (err){
            console.error(err);
            cb(err);
          }else{
            _submissions=appForm.models.submissions;
            cb(null,_submissions);
          }
        });
      }else{
        setTimeout(function(){
          cb(null,_submissions);
        },0);
      }
    }

      /**
      * Get submission object from that are submitted. I.e. submitted and complete.
      * @param params {localSubmissionId : <localIdOfSubmission>}
      * @param {Function} cb     (err, submittedArray)
      */
//      function getSubmissionData(params, cb){
//        if(!params || !params.localSubmissionId){
//         return cb(new Error("Invalid params to getSubmissionData: localSubmission must be a parameter"));
//        }
//
//        var submission = appForm.models.submission;
//
//        submission.fromLocal(params.localSubmissionId, cb);
//      }

    /**
     * Get submissions that have failed. I.e. submitted and and error occurred.
     * @param params {}
     * @param {Function} cb     (err, failedArray)
     */
//    function getFailed(params, cb){
//      var submissions = appForm.models.submissions;
//
//      var failedSubmissions = submissions.getError();
//      var returnFailedSubmissions = [];
//
//      if(failedSubmissions){
//        failedSubmissions.forEach(function(failedSubmission){
//          failedSubmission.localSubmissionId = failedSubmission._ludid;
//          failedSubmission.dateSubmissionStarted = new Date(failedSubmission.submissionStartedTimestamp);
//          returnFailedSubmissions.push(failedSubmission);
//        });
//      }
//
//      return cb(null, returnFailedSubmissions);
//    }

    function submitForm(submission, cb){

      if(submission){
        submission.submit(function(err){
          if(err) return cb(err);

          //Submission finished and validated. Now upload the form
          submission.upload(cb);
        });
      } else {
        return cb("Invalid submission object.");
      }
    }

//    function saveDraft(submission, cb){
//      if(submission.get("_type") !== "submission"){
//        return cb(new Error("Expected submission parameter to be of type Submission"));
//      }
//
//      submission.saveDraft(cb);
//    }
    

    return module;
})(appForm.api || {});
//mockup $fh apis for Addons.
if (typeof $fh == "undefined"){
    $fh={};
}
if ($fh.forms==undefined){
    $fh.forms=appForm.api;
}


appForm.RulesEngine=rulesEngine;


/*! fh-forms - v0.2.3 -  */
/*! async - v0.2.9 -  */
/*! 2013-12-11 */
/* This is the prefix file */
function rulesEngine (formDef) {
  var define = {};
  var module = {exports:{}}; // create a module.exports - async will load into it

/* End of prefix file */
/*global setImmediate: false, setTimeout: false, console: false */
(function () {

    var async = {};

    // global on the server, window in the browser
    var root, previous_async;

    root = this;
    if (root != null) {
      previous_async = root.async;
    }

    async.noConflict = function () {
        root.async = previous_async;
        return async;
    };

    function only_once(fn) {
        var called = false;
        return function() {
            if (called) throw new Error("Callback was already called.");
            called = true;
            fn.apply(root, arguments);
        }
    }

    //// cross-browser compatiblity functions ////

    var _each = function (arr, iterator) {
        if (arr.forEach) {
            return arr.forEach(iterator);
        }
        for (var i = 0; i < arr.length; i += 1) {
            iterator(arr[i], i, arr);
        }
    };

    var _map = function (arr, iterator) {
        if (arr.map) {
            return arr.map(iterator);
        }
        var results = [];
        _each(arr, function (x, i, a) {
            results.push(iterator(x, i, a));
        });
        return results;
    };

    var _reduce = function (arr, iterator, memo) {
        if (arr.reduce) {
            return arr.reduce(iterator, memo);
        }
        _each(arr, function (x, i, a) {
            memo = iterator(memo, x, i, a);
        });
        return memo;
    };

    var _keys = function (obj) {
        if (Object.keys) {
            return Object.keys(obj);
        }
        var keys = [];
        for (var k in obj) {
            if (obj.hasOwnProperty(k)) {
                keys.push(k);
            }
        }
        return keys;
    };

    //// exported async module functions ////

    //// nextTick implementation with browser-compatible fallback ////
    if (typeof process === 'undefined' || !(process.nextTick)) {
        if (typeof setImmediate === 'function') {
            async.nextTick = function (fn) {
                // not a direct alias for IE10 compatibility
                setImmediate(fn);
            };
            async.setImmediate = async.nextTick;
        }
        else {
            async.nextTick = function (fn) {
                setTimeout(fn, 0);
            };
            async.setImmediate = async.nextTick;
        }
    }
    else {
        async.nextTick = process.nextTick;
        if (typeof setImmediate !== 'undefined') {
            async.setImmediate = setImmediate;
        }
        else {
            async.setImmediate = async.nextTick;
        }
    }

    async.each = function (arr, iterator, callback) {
        callback = callback || function () {};
        if (!arr.length) {
            return callback();
        }
        var completed = 0;
        _each(arr, function (x) {
            iterator(x, only_once(function (err) {
                if (err) {
                    callback(err);
                    callback = function () {};
                }
                else {
                    completed += 1;
                    if (completed >= arr.length) {
                        callback(null);
                    }
                }
            }));
        });
    };
    async.forEach = async.each;

    async.eachSeries = function (arr, iterator, callback) {
        callback = callback || function () {};
        if (!arr.length) {
            return callback();
        }
        var completed = 0;
        var iterate = function () {
            iterator(arr[completed], function (err) {
                if (err) {
                    callback(err);
                    callback = function () {};
                }
                else {
                    completed += 1;
                    if (completed >= arr.length) {
                        callback(null);
                    }
                    else {
                        iterate();
                    }
                }
            });
        };
        iterate();
    };
    async.forEachSeries = async.eachSeries;

    async.eachLimit = function (arr, limit, iterator, callback) {
        var fn = _eachLimit(limit);
        fn.apply(null, [arr, iterator, callback]);
    };
    async.forEachLimit = async.eachLimit;

    var _eachLimit = function (limit) {

        return function (arr, iterator, callback) {
            callback = callback || function () {};
            if (!arr.length || limit <= 0) {
                return callback();
            }
            var completed = 0;
            var started = 0;
            var running = 0;

            (function replenish () {
                if (completed >= arr.length) {
                    return callback();
                }

                while (running < limit && started < arr.length) {
                    started += 1;
                    running += 1;
                    iterator(arr[started - 1], function (err) {
                        if (err) {
                            callback(err);
                            callback = function () {};
                        }
                        else {
                            completed += 1;
                            running -= 1;
                            if (completed >= arr.length) {
                                callback();
                            }
                            else {
                                replenish();
                            }
                        }
                    });
                }
            })();
        };
    };


    var doParallel = function (fn) {
        return function () {
            var args = Array.prototype.slice.call(arguments);
            return fn.apply(null, [async.each].concat(args));
        };
    };
    var doParallelLimit = function(limit, fn) {
        return function () {
            var args = Array.prototype.slice.call(arguments);
            return fn.apply(null, [_eachLimit(limit)].concat(args));
        };
    };
    var doSeries = function (fn) {
        return function () {
            var args = Array.prototype.slice.call(arguments);
            return fn.apply(null, [async.eachSeries].concat(args));
        };
    };


    var _asyncMap = function (eachfn, arr, iterator, callback) {
        var results = [];
        arr = _map(arr, function (x, i) {
            return {index: i, value: x};
        });
        eachfn(arr, function (x, callback) {
            iterator(x.value, function (err, v) {
                results[x.index] = v;
                callback(err);
            });
        }, function (err) {
            callback(err, results);
        });
    };
    async.map = doParallel(_asyncMap);
    async.mapSeries = doSeries(_asyncMap);
    async.mapLimit = function (arr, limit, iterator, callback) {
        return _mapLimit(limit)(arr, iterator, callback);
    };

    var _mapLimit = function(limit) {
        return doParallelLimit(limit, _asyncMap);
    };

    // reduce only has a series version, as doing reduce in parallel won't
    // work in many situations.
    async.reduce = function (arr, memo, iterator, callback) {
        async.eachSeries(arr, function (x, callback) {
            iterator(memo, x, function (err, v) {
                memo = v;
                callback(err);
            });
        }, function (err) {
            callback(err, memo);
        });
    };
    // inject alias
    async.inject = async.reduce;
    // foldl alias
    async.foldl = async.reduce;

    async.reduceRight = function (arr, memo, iterator, callback) {
        var reversed = _map(arr, function (x) {
            return x;
        }).reverse();
        async.reduce(reversed, memo, iterator, callback);
    };
    // foldr alias
    async.foldr = async.reduceRight;

    var _filter = function (eachfn, arr, iterator, callback) {
        var results = [];
        arr = _map(arr, function (x, i) {
            return {index: i, value: x};
        });
        eachfn(arr, function (x, callback) {
            iterator(x.value, function (v) {
                if (v) {
                    results.push(x);
                }
                callback();
            });
        }, function (err) {
            callback(_map(results.sort(function (a, b) {
                return a.index - b.index;
            }), function (x) {
                return x.value;
            }));
        });
    };
    async.filter = doParallel(_filter);
    async.filterSeries = doSeries(_filter);
    // select alias
    async.select = async.filter;
    async.selectSeries = async.filterSeries;

    var _reject = function (eachfn, arr, iterator, callback) {
        var results = [];
        arr = _map(arr, function (x, i) {
            return {index: i, value: x};
        });
        eachfn(arr, function (x, callback) {
            iterator(x.value, function (v) {
                if (!v) {
                    results.push(x);
                }
                callback();
            });
        }, function (err) {
            callback(_map(results.sort(function (a, b) {
                return a.index - b.index;
            }), function (x) {
                return x.value;
            }));
        });
    };
    async.reject = doParallel(_reject);
    async.rejectSeries = doSeries(_reject);

    var _detect = function (eachfn, arr, iterator, main_callback) {
        eachfn(arr, function (x, callback) {
            iterator(x, function (result) {
                if (result) {
                    main_callback(x);
                    main_callback = function () {};
                }
                else {
                    callback();
                }
            });
        }, function (err) {
            main_callback();
        });
    };
    async.detect = doParallel(_detect);
    async.detectSeries = doSeries(_detect);

    async.some = function (arr, iterator, main_callback) {
        async.each(arr, function (x, callback) {
            iterator(x, function (v) {
                if (v) {
                    main_callback(true);
                    main_callback = function () {};
                }
                callback();
            });
        }, function (err) {
            main_callback(false);
        });
    };
    // any alias
    async.any = async.some;

    async.every = function (arr, iterator, main_callback) {
        async.each(arr, function (x, callback) {
            iterator(x, function (v) {
                if (!v) {
                    main_callback(false);
                    main_callback = function () {};
                }
                callback();
            });
        }, function (err) {
            main_callback(true);
        });
    };
    // all alias
    async.all = async.every;

    async.sortBy = function (arr, iterator, callback) {
        async.map(arr, function (x, callback) {
            iterator(x, function (err, criteria) {
                if (err) {
                    callback(err);
                }
                else {
                    callback(null, {value: x, criteria: criteria});
                }
            });
        }, function (err, results) {
            if (err) {
                return callback(err);
            }
            else {
                var fn = function (left, right) {
                    var a = left.criteria, b = right.criteria;
                    return a < b ? -1 : a > b ? 1 : 0;
                };
                callback(null, _map(results.sort(fn), function (x) {
                    return x.value;
                }));
            }
        });
    };

    async.auto = function (tasks, callback) {
        callback = callback || function () {};
        var keys = _keys(tasks);
        if (!keys.length) {
            return callback(null);
        }

        var results = {};

        var listeners = [];
        var addListener = function (fn) {
            listeners.unshift(fn);
        };
        var removeListener = function (fn) {
            for (var i = 0; i < listeners.length; i += 1) {
                if (listeners[i] === fn) {
                    listeners.splice(i, 1);
                    return;
                }
            }
        };
        var taskComplete = function () {
            _each(listeners.slice(0), function (fn) {
                fn();
            });
        };

        addListener(function () {
            if (_keys(results).length === keys.length) {
                callback(null, results);
                callback = function () {};
            }
        });

        _each(keys, function (k) {
            var task = (tasks[k] instanceof Function) ? [tasks[k]]: tasks[k];
            var taskCallback = function (err) {
                var args = Array.prototype.slice.call(arguments, 1);
                if (args.length <= 1) {
                    args = args[0];
                }
                if (err) {
                    var safeResults = {};
                    _each(_keys(results), function(rkey) {
                        safeResults[rkey] = results[rkey];
                    });
                    safeResults[k] = args;
                    callback(err, safeResults);
                    // stop subsequent errors hitting callback multiple times
                    callback = function () {};
                }
                else {
                    results[k] = args;
                    async.setImmediate(taskComplete);
                }
            };
            var requires = task.slice(0, Math.abs(task.length - 1)) || [];
            var ready = function () {
                return _reduce(requires, function (a, x) {
                    return (a && results.hasOwnProperty(x));
                }, true) && !results.hasOwnProperty(k);
            };
            if (ready()) {
                task[task.length - 1](taskCallback, results);
            }
            else {
                var listener = function () {
                    if (ready()) {
                        removeListener(listener);
                        task[task.length - 1](taskCallback, results);
                    }
                };
                addListener(listener);
            }
        });
    };

    async.waterfall = function (tasks, callback) {
        callback = callback || function () {};
        if (tasks.constructor !== Array) {
          var err = new Error('First argument to waterfall must be an array of functions');
          return callback(err);
        }
        if (!tasks.length) {
            return callback();
        }
        var wrapIterator = function (iterator) {
            return function (err) {
                if (err) {
                    callback.apply(null, arguments);
                    callback = function () {};
                }
                else {
                    var args = Array.prototype.slice.call(arguments, 1);
                    var next = iterator.next();
                    if (next) {
                        args.push(wrapIterator(next));
                    }
                    else {
                        args.push(callback);
                    }
                    async.setImmediate(function () {
                        iterator.apply(null, args);
                    });
                }
            };
        };
        wrapIterator(async.iterator(tasks))();
    };

    var _parallel = function(eachfn, tasks, callback) {
        callback = callback || function () {};
        if (tasks.constructor === Array) {
            eachfn.map(tasks, function (fn, callback) {
                if (fn) {
                    fn(function (err) {
                        var args = Array.prototype.slice.call(arguments, 1);
                        if (args.length <= 1) {
                            args = args[0];
                        }
                        callback.call(null, err, args);
                    });
                }
            }, callback);
        }
        else {
            var results = {};
            eachfn.each(_keys(tasks), function (k, callback) {
                tasks[k](function (err) {
                    var args = Array.prototype.slice.call(arguments, 1);
                    if (args.length <= 1) {
                        args = args[0];
                    }
                    results[k] = args;
                    callback(err);
                });
            }, function (err) {
                callback(err, results);
            });
        }
    };

    async.parallel = function (tasks, callback) {
        _parallel({ map: async.map, each: async.each }, tasks, callback);
    };

    async.parallelLimit = function(tasks, limit, callback) {
        _parallel({ map: _mapLimit(limit), each: _eachLimit(limit) }, tasks, callback);
    };

    async.series = function (tasks, callback) {
        callback = callback || function () {};
        if (tasks.constructor === Array) {
            async.mapSeries(tasks, function (fn, callback) {
                if (fn) {
                    fn(function (err) {
                        var args = Array.prototype.slice.call(arguments, 1);
                        if (args.length <= 1) {
                            args = args[0];
                        }
                        callback.call(null, err, args);
                    });
                }
            }, callback);
        }
        else {
            var results = {};
            async.eachSeries(_keys(tasks), function (k, callback) {
                tasks[k](function (err) {
                    var args = Array.prototype.slice.call(arguments, 1);
                    if (args.length <= 1) {
                        args = args[0];
                    }
                    results[k] = args;
                    callback(err);
                });
            }, function (err) {
                callback(err, results);
            });
        }
    };

    async.iterator = function (tasks) {
        var makeCallback = function (index) {
            var fn = function () {
                if (tasks.length) {
                    tasks[index].apply(null, arguments);
                }
                return fn.next();
            };
            fn.next = function () {
                return (index < tasks.length - 1) ? makeCallback(index + 1): null;
            };
            return fn;
        };
        return makeCallback(0);
    };

    async.apply = function (fn) {
        var args = Array.prototype.slice.call(arguments, 1);
        return function () {
            return fn.apply(
                null, args.concat(Array.prototype.slice.call(arguments))
            );
        };
    };

    var _concat = function (eachfn, arr, fn, callback) {
        var r = [];
        eachfn(arr, function (x, cb) {
            fn(x, function (err, y) {
                r = r.concat(y || []);
                cb(err);
            });
        }, function (err) {
            callback(err, r);
        });
    };
    async.concat = doParallel(_concat);
    async.concatSeries = doSeries(_concat);

    async.whilst = function (test, iterator, callback) {
        if (test()) {
            iterator(function (err) {
                if (err) {
                    return callback(err);
                }
                async.whilst(test, iterator, callback);
            });
        }
        else {
            callback();
        }
    };

    async.doWhilst = function (iterator, test, callback) {
        iterator(function (err) {
            if (err) {
                return callback(err);
            }
            if (test()) {
                async.doWhilst(iterator, test, callback);
            }
            else {
                callback();
            }
        });
    };

    async.until = function (test, iterator, callback) {
        if (!test()) {
            iterator(function (err) {
                if (err) {
                    return callback(err);
                }
                async.until(test, iterator, callback);
            });
        }
        else {
            callback();
        }
    };

    async.doUntil = function (iterator, test, callback) {
        iterator(function (err) {
            if (err) {
                return callback(err);
            }
            if (!test()) {
                async.doUntil(iterator, test, callback);
            }
            else {
                callback();
            }
        });
    };

    async.queue = function (worker, concurrency) {
        if (concurrency === undefined) {
            concurrency = 1;
        }
        function _insert(q, data, pos, callback) {
          if(data.constructor !== Array) {
              data = [data];
          }
          _each(data, function(task) {
              var item = {
                  data: task,
                  callback: typeof callback === 'function' ? callback : null
              };

              if (pos) {
                q.tasks.unshift(item);
              } else {
                q.tasks.push(item);
              }

              if (q.saturated && q.tasks.length === concurrency) {
                  q.saturated();
              }
              async.setImmediate(q.process);
          });
        }

        var workers = 0;
        var q = {
            tasks: [],
            concurrency: concurrency,
            saturated: null,
            empty: null,
            drain: null,
            push: function (data, callback) {
              _insert(q, data, false, callback);
            },
            unshift: function (data, callback) {
              _insert(q, data, true, callback);
            },
            process: function () {
                if (workers < q.concurrency && q.tasks.length) {
                    var task = q.tasks.shift();
                    if (q.empty && q.tasks.length === 0) {
                        q.empty();
                    }
                    workers += 1;
                    var next = function () {
                        workers -= 1;
                        if (task.callback) {
                            task.callback.apply(task, arguments);
                        }
                        if (q.drain && q.tasks.length + workers === 0) {
                            q.drain();
                        }
                        q.process();
                    };
                    var cb = only_once(next);
                    worker(task.data, cb);
                }
            },
            length: function () {
                return q.tasks.length;
            },
            running: function () {
                return workers;
            }
        };
        return q;
    };

    async.cargo = function (worker, payload) {
        var working     = false,
            tasks       = [];

        var cargo = {
            tasks: tasks,
            payload: payload,
            saturated: null,
            empty: null,
            drain: null,
            push: function (data, callback) {
                if(data.constructor !== Array) {
                    data = [data];
                }
                _each(data, function(task) {
                    tasks.push({
                        data: task,
                        callback: typeof callback === 'function' ? callback : null
                    });
                    if (cargo.saturated && tasks.length === payload) {
                        cargo.saturated();
                    }
                });
                async.setImmediate(cargo.process);
            },
            process: function process() {
                if (working) return;
                if (tasks.length === 0) {
                    if(cargo.drain) cargo.drain();
                    return;
                }

                var ts = typeof payload === 'number'
                            ? tasks.splice(0, payload)
                            : tasks.splice(0);

                var ds = _map(ts, function (task) {
                    return task.data;
                });

                if(cargo.empty) cargo.empty();
                working = true;
                worker(ds, function () {
                    working = false;

                    var args = arguments;
                    _each(ts, function (data) {
                        if (data.callback) {
                            data.callback.apply(null, args);
                        }
                    });

                    process();
                });
            },
            length: function () {
                return tasks.length;
            },
            running: function () {
                return working;
            }
        };
        return cargo;
    };

    var _console_fn = function (name) {
        return function (fn) {
            var args = Array.prototype.slice.call(arguments, 1);
            fn.apply(null, args.concat([function (err) {
                var args = Array.prototype.slice.call(arguments, 1);
                if (typeof console !== 'undefined') {
                    if (err) {
                        if (console.error) {
                            console.error(err);
                        }
                    }
                    else if (console[name]) {
                        _each(args, function (x) {
                            console[name](x);
                        });
                    }
                }
            }]));
        };
    };
    async.log = _console_fn('log');
    async.dir = _console_fn('dir');
    /*async.info = _console_fn('info');
    async.warn = _console_fn('warn');
    async.error = _console_fn('error');*/

    async.memoize = function (fn, hasher) {
        var memo = {};
        var queues = {};
        hasher = hasher || function (x) {
            return x;
        };
        var memoized = function () {
            var args = Array.prototype.slice.call(arguments);
            var callback = args.pop();
            var key = hasher.apply(null, args);
            if (key in memo) {
                callback.apply(null, memo[key]);
            }
            else if (key in queues) {
                queues[key].push(callback);
            }
            else {
                queues[key] = [callback];
                fn.apply(null, args.concat([function () {
                    memo[key] = arguments;
                    var q = queues[key];
                    delete queues[key];
                    for (var i = 0, l = q.length; i < l; i++) {
                      q[i].apply(null, arguments);
                    }
                }]));
            }
        };
        memoized.memo = memo;
        memoized.unmemoized = fn;
        return memoized;
    };

    async.unmemoize = function (fn) {
      return function () {
        return (fn.unmemoized || fn).apply(null, arguments);
      };
    };

    async.times = function (count, iterator, callback) {
        var counter = [];
        for (var i = 0; i < count; i++) {
            counter.push(i);
        }
        return async.map(counter, iterator, callback);
    };

    async.timesSeries = function (count, iterator, callback) {
        var counter = [];
        for (var i = 0; i < count; i++) {
            counter.push(i);
        }
        return async.mapSeries(counter, iterator, callback);
    };

    async.compose = function (/* functions... */) {
        var fns = Array.prototype.reverse.call(arguments);
        return function () {
            var that = this;
            var args = Array.prototype.slice.call(arguments);
            var callback = args.pop();
            async.reduce(fns, args, function (newargs, fn, cb) {
                fn.apply(that, newargs.concat([function () {
                    var err = arguments[0];
                    var nextargs = Array.prototype.slice.call(arguments, 1);
                    cb(err, nextargs);
                }]))
            },
            function (err, results) {
                callback.apply(that, [err].concat(results));
            });
        };
    };

    var _applyEach = function (eachfn, fns /*args...*/) {
        var go = function () {
            var that = this;
            var args = Array.prototype.slice.call(arguments);
            var callback = args.pop();
            return eachfn(fns, function (fn, cb) {
                fn.apply(that, args.concat([cb]));
            },
            callback);
        };
        if (arguments.length > 2) {
            var args = Array.prototype.slice.call(arguments, 2);
            return go.apply(this, args);
        }
        else {
            return go;
        }
    };
    async.applyEach = doParallel(_applyEach);
    async.applyEachSeries = doSeries(_applyEach);

    async.forever = function (fn, callback) {
        function next(err) {
            if (err) {
                if (callback) {
                    return callback(err);
                }
                throw err;
            }
            fn(next);
        }
        next();
    };

    // AMD / RequireJS
    if (typeof define !== 'undefined' && define.amd) {
        define([], function () {
            return async;
        });
    }
    // Node.js
    else if (typeof module !== 'undefined' && module.exports) {
        module.exports = async;
    }
    // included directly via <script> tag
    else {
        root.async = async;
    }

}());

/* This is the infix file */    

  var asyncLoader = module.exports;  // async has updated this, now save in our var, to that it can be returned from our dummy require
  function require() {
    return asyncLoader;
  }

/* End of infix file */
(function () {

var async=require('async');

/*
 * Sample Usage 
 * 
 * var engine = formsRulesEngine(form-definition);
 * 
 * engine.validateForms(form-submission, function(err, res) {});
 *      res:
 *      {
 *          "validation": {
 *              "fieldId": {
 *                  "fieldId": "",
 *                  "valid": true,
 *                  "errorMessages": [
 *                      "length should be 3 to 5",
 *                      "should not contain dammit",
 *                      "should repeat at least 2 times"
 *                  ]
 *              },
 *              "fieldId1": {
 *      
 *              }
 *          }
 *      }
 * 
 * 
 * engine.validateField(fieldId, submissionJSON, function(err,res) {});
 *      // validate only field values on validation (no rules, no repeat checking)
 *      res:
 *      "validation":{
 *              "fieldId":{
 *                  "fieldId":"",
 *                  "valid":true,
 *                  "errorMessages":[
 *                      "length should be 3 to 5",
 *                      "should not contain dammit"
 *                  ]
 *              }
 *          }
 *      
 * engine.checkRules(submissionJSON, unction(err, res) {})
 *      // check all rules actions
 *      res:
 *      {
 *          "actions": {
 *              "pages": {
 *                  "targetId": {
 *                      "targetId": "",
 *                      "action": "show|hide"
 *                  }
 *              },
 *              "fields": {
 *      
 *              }
 *          }
 *      }
 * 
 */

var FIELD_TYPE_CHECKBOX = "checkboxes";
var FIELD_TYPE_DATETIME = "dateTime";
var FIELD_TYPE_DATETIME_DATETIMEUNIT_DATEONLY = "date";
var FIELD_TYPE_DATETIME_DATETIMEUNIT_TIMEONLY = "time";
var FIELD_TYPE_DATETIME_DATETIMEUNIT_DATETIME = "dateTime";

var formsRulesEngine = function(formDef) {
  var initialised;

  var definition = formDef;
  var submission;

  var fieldMap = {};
  var requiredFieldMap = {};
  var submissionRequiredFieldsMap = {}; // map to hold the status of the required fields per submission
  var fieldRulePredicateMap = {};
  var fieldRuleSubjectMap = {};
  var pageRulePredicateMap = {};
  var pageRuleSubjectMap = {};
  var submissionFieldsMap = {};
  var validatorsMap = {
    "text":         validatorString,
    "textarea":     validatorString,
    "number":       validatorNumber, 
    "emailAddress": validatorEmail, 
    "dropdown":     validatorDropDown, 
    "radio":        validatorRadio, 
    "checkboxes":   validatorCheckboxes, 
    "location":     validatorLocation, 
    "locationMap":  validatorLocation, 
    "photo":        validatorFile,
    "signature":    validatorFile, 
    "file":         validatorFile, 
    "dateTime":     validatorDateTime, 
    "sectionBreak": validatorSection
  };

  var isFieldRuleSubject = function(fieldId) {
    return !!fieldRuleSubjectMap[fieldId];
  };

  var isPageRuleSubject = function(pageId) {
    return !!pageRuleSubjectMap[pageId];
  };

  function buildFieldMap(cb) {
    // Iterate over all fields in form definition & build fieldMap
    async.each(definition.pages, function(page, cbPages) {
      async.each(page.fields, function(field, cbFields) {
        field.pageId = page._id;
        fieldMap[field._id] = field;
        if (field.required) {
          requiredFieldMap[field._id] = {field: field, submitted: false, validated: false};
        }
        return cbFields();
      }, function (err) {
        return cbPages();
      });
    }, cb);
  }

  function buildFieldRuleMaps(cb) {
    // Iterate over all rules in form definition & build ruleSubjectMap 
    async.each(definition.fieldRules, function(rule, cbRules) {
      async.each(rule.ruleConditionalStatements, function(ruleConditionalStatement, cbRuleConditionalStatements) {
        var fieldId = ruleConditionalStatement.sourceField;
        fieldRulePredicateMap[fieldId] = fieldRulePredicateMap[fieldId] || [];
        fieldRulePredicateMap[fieldId].push(rule);
        return cbRuleConditionalStatements();
      }, function (err) {
        fieldRuleSubjectMap[rule.targetField] = fieldRuleSubjectMap[rule.targetField] || [];
        fieldRuleSubjectMap[rule.targetField].push(rule);
        return cbRules();
      });
    }, cb);  
  }

  function buildPageRuleMap(cb) {
    // Iterate over all rules in form definition & build ruleSubjectMap 
    async.each(definition.pageRules, function(rule, cbRules) {
      var rulesId = rule._id;
      async.each(rule.ruleConditionalStatements, function(ruleConditionalStatement, cbRulePredicates) {
        var fieldId = ruleConditionalStatement.sourceField;
        pageRulePredicateMap[fieldId] = pageRulePredicateMap[fieldId] || [];
        pageRulePredicateMap[fieldId].push(rule);
        return cbRulePredicates();
      }, function (err) {
        pageRuleSubjectMap[rule.targetPage] = pageRuleSubjectMap[rule.targetPage] || [];
        pageRuleSubjectMap[rule.targetPage].push(rule);
        return cbRules();
      });
    }, cb);
  }

  function buildSubmissionFieldsMap(cb) {
    submissionRequiredFieldsMap = JSON.parse(JSON.stringify(requiredFieldMap)); // clone the map for use with this submission
    submissionFieldsMap = {}; // start with empty map, rulesEngine can be called with multiple submissions

    // iterate over all the fields in the submissions and build a map for easier lookup
    async.each(submission.formFields, function(formField, cb) {
      if (!formField.fieldId) return cb(new Error("No fieldId in this submission entry: " + util.inspect(formField)));

      submissionFieldsMap[formField.fieldId] = formField;
      return cb();
    }, cb);
  }

  function init(cb) {
    if(initialised) return cb();
    async.parallel([
      buildFieldMap,
      buildFieldRuleMaps,
      buildPageRuleMap
    ], function(err) {
      if (err) return cb(err);
      initialised = true;
      return cb();
    });
  }

  function initSubmission(formSubmission, cb) {
    init(function(err){
      if (err) return cb(err);

      submission = formSubmission;
      buildSubmissionFieldsMap(cb);
    });
  }

  function getPreviousFieldValues(submittedField, previousSubmission, cb) {
    if(previousSubmission && previousSubmission.formFields) {
      async.filter(previousSubmission.formFields, function (formField, cb) {
        return cb(formField.fieldId.toString() == submittedField.fieldId.toString());
      }, function (results) {
        var previousFieldValues = null;
        if (results && results[0] && results[0].fieldValues) {
          previousFieldValues = results[0].fieldValues;
        }
        return cb(undefined, previousFieldValues);
      });
    } else {
      return cb();
    }
  }

  function validateForm(submission, previousSubmission, cb) {
    if ("function" === typeof previousSubmission) {
      cb = previousSubmission;
      previousSubmission = null;
    }
    init(function(err){
      if (err) return cb(err);

      initSubmission(submission, function (err) {
        if (err) return cb(err);

        async.waterfall([
          function (cb) {
            return cb(undefined, {validation:{valid: true}});  // any invalid fields will set this to false
          },
          function (res, cb) {
            validateSubmittedFields(res, previousSubmission, cb);            
          },
          checkIfRequiredFieldsNotSubmitted,
        ], function (err, results) {
          if (err) return cb(err);

          return cb(undefined, results);
        });
      });
    });
  }

  function validateSubmittedFields(res, previousSubmission, cb) {
    // for each field, call validateField
    async.each(submission.formFields, function(submittedField, callback) {
      var fieldID = submittedField.fieldId;
      var fieldDef = fieldMap[fieldID];

      getPreviousFieldValues(submittedField, previousSubmission, function (err, previousFieldValues) {
        if(err) return callback(err);
        getFieldValidationStatus(submittedField, fieldDef, previousFieldValues, function(err, fieldRes) {
          if(err) return callback(err);

          if (!fieldRes.valid) {
            res.validation.valid = false;        // indicate invalid form if any fields invalid
            res.validation[fieldID] = fieldRes;  // add invalid field info to validate form result
          }

          return callback();
        });

      });
    }, function(err) {
      if( err ) {
        return cb(err);
      }
      return cb(undefined, res);
    });
  }

  function checkIfRequiredFieldsNotSubmitted(res, cb) {
    async.each(Object.keys(submissionRequiredFieldsMap), function (requiredFieldId, cb) {
      var resField = {};
      if (!submissionRequiredFieldsMap[requiredFieldId].submitted) {
        isFieldVisible(requiredFieldId, true, function (err, visible) {
          if (err) return cb(err);
          if (visible) {  // we only care about required fields if they are visible
            resField.fieldId = requiredFieldId;
            resField.valid = false;
            resField.errorMessages = ["Required Field Not Submitted"];
            res.validation[requiredFieldId] = resField;
            res.validation.valid = false;                    
          }
          return cb();                  
        });
      } else { // was included in submission
        return cb();
      }
    }, function (err) {
      if (err) return cb(err);
      return cb(undefined, res);
    });
  }

 /*
  * validate only field values on validation (no rules, no repeat checking)
  *     res:
  *     "validation":{
  *             "fieldId":{
  *                 "fieldId":"",
  *                 "valid":true,
  *                 "errorMessages":[
  *                     "length should be 3 to 5",
  *                     "should not contain dammit"
  *                 ]
  *             }
  *         }
  */
 function validateField(fieldId, submission, cb) {
   init(function(err){
      if (err) return cb(err);

      initSubmission(submission, function (err) {
        if (err) return cb(err);

        var submissionField = submissionFieldsMap[fieldId];
        var fieldDef = fieldMap[fieldId];
        getFieldValidationStatus(submissionField, fieldDef, null, function (err, res) {
          if (err) return cb(err);
          var ret = {validation: {}};
          ret.validation[fieldId] = res;
          return cb(undefined, ret);
        });
      });
    });
  }

/*
 * validate only single field value (no rules, no repeat checking)
 * cb(err, result)
 * example of result:
 * "validation":{
 *         "fieldId":{
 *             "fieldId":"",
 *             "valid":true,
 *             "errorMessages":[
 *                 "length should be 3 to 5",
 *                 "should not contain dammit"
 *             ]
 *         }
 *     }
 */
  function validateFieldValue(fieldId, inputValue, cb) {
    init(function(err){
      if (err) return cb(err);
      var fieldDefinition = fieldMap[fieldId];

      getValidatorFunction(fieldDefinition.type, function (err, validator) {       
        if (err) return cb(err);

        validator(inputValue, fieldDefinition, undefined, function (err) {
          var messages = {errorMessages: []}
          if(err) {
            messages.errorMessages.push(err.message);
          }
          return createValidatorResponse(fieldId, messages, function (err, res) {
            if (err) return cb(err);
            var ret = {validation: {}};
            ret.validation[fieldId] = res;
            return cb(undefined, ret);
          });
        });
      });
    });
  }


 function createValidatorResponse(fieldId, messages, cb) {
    // intentionally not checking err here, used further down to get validation errors
    var res = {};
    res.fieldId = fieldId;
    res.errorMessages = messages.errorMessages || [];
    res.fieldErrorMessage = messages.fieldErrorMessage || [];
    async.some(res.errorMessages, function (item, cb) {
      return cb(item !== null);
    }, function (someErrors) {
      res.valid = !someErrors && (res.fieldErrorMessage.length < 1);

      return cb(undefined, res);      
    });
  }

  function getFieldValidationStatus(submittedField, fieldDef, previousFieldValues, cb) {  
    validateFieldInternal(submittedField, fieldDef, previousFieldValues, function (err, messages) {
      if(err) return cb(err);
      createValidatorResponse(submittedField.fieldId, messages, cb);
    });
  }


  function getValidatorFunction(fieldType, cb) {
    var validator = validatorsMap[fieldType];
    if (!validator) {
      return cb(new Error("Invalid Field Type " + fieldType));
    }

    return cb(undefined, validator);
  }

  function validateFieldInternal(submittedField, fieldDef, previousFieldValues, cb) {
    if ("function" === typeof previousFieldValues) {
      cb = previousFieldValues;
      previousFieldValues = null;
    }

    countSubmittedValues(submittedField, function(err, numSubmittedValues) {
      if(err) return cb(err);
      async.series({
        valuesSubmitted:
          async.apply(checkValueSubmitted, submittedField, fieldDef),
        repeats:
          async.apply(checkRepeat, numSubmittedValues, fieldDef),
        values:
          async.apply(checkValues, submittedField, fieldDef, previousFieldValues)
      }, function (err, results) {
        if(err) return cb(err);

        var fieldErrorMessages = [];
        if(results.valuesSubmitted) {
          fieldErrorMessages.push(results.valuesSubmitted);
        }
        if(results.repeats) {
          fieldErrorMessages.push(results.repeats);
        }
        return cb(undefined, {fieldErrorMessage: fieldErrorMessages, errorMessages: results.values});
      });
    });

    return;  // just functions below this

    function checkValueSubmitted(submittedField, fieldDefinition, cb) {
      var valueSubmitted = submittedField && submittedField.fieldValues && (submittedField.fieldValues.length > 0);
      if (!valueSubmitted) {
        return cb(undefined, "No value submitted for field " + fieldDefinition.name);
      }
      return cb(undefined, null);
    }

    function countSubmittedValues(submittedField, cb) {
      var numSubmittedValues = 0;
      if(submittedField && submittedField.fieldValues && submittedField.fieldValues.length > 0) {
        for(var i=0; i<submittedField.fieldValues.length; i += 1) {
          if(submittedField.fieldValues[i]) {
            numSubmittedValues += 1;
          }
        }
      }
      return cb(undefined, numSubmittedValues);
    }

    function checkRepeat(numSubmittedValues, fieldDefinition, cb) {
    
      if(fieldDefinition.repeating && fieldDefinition.fieldOptions.definition){
        if(fieldDefinition.fieldOptions.definition.minRepeat){
          if(numSubmittedValues < fieldDefinition.fieldOptions.definition.minRepeat){
            return cb(undefined, "Expected min of " + fieldDefinition.fieldOptions.definition.minRepeat + " values for field " + fieldDefinition.name + " but got " + numSubmittedValues);
          }
        }

        if (fieldDefinition.fieldOptions.definition.maxRepeat){
          if(numSubmittedValues > fieldDefinition.fieldOptions.definition.maxRepeat){
            return cb(undefined, "Expected max of " + fieldDefinition.fieldOptions.definition.maxRepeat + " values for field " + fieldDefinition.name + " but got " + numSubmittedValues);
          }
        }
      } else {
        if(numSubmittedValues > 1) {
          return cb(undefined, "Should not have multiple values for non-repeating field");
        }
      }

      return cb(undefined, null);
    }

    function checkValues(submittedField, fieldDefinition, previousFieldValues, cb) {
      getValidatorFunction(fieldDefinition.type, function (err, validator) {       

        async.map(submittedField.fieldValues, function(fieldValue, cb){
          if('undefined' === typeof fieldValue || null === fieldValue) {
            return cb(undefined, null);
          } else {
            validator(fieldValue, fieldDefinition, previousFieldValues, function(validationError) {
              var errorMessage;
              if(validationError) {
                errorMessage = validationError.message || "Error during validation of field";
              } else {
                errorMessage = null;
              }

              if (submissionRequiredFieldsMap[fieldDefinition._id]) {   // set to true if at least one value
                submissionRequiredFieldsMap[fieldDefinition._id].submitted = true;
              }

              return cb(undefined, errorMessage);
            });
          }
        }, function (err, results) {
          if (err) return cb(err);

          return cb(undefined, results);
        });
      });
    }

  }

  function validatorString (fieldValue, fieldDefinition, previousFieldValues, cb) {
    if(typeof fieldValue !== "string"){
      return cb(new Error("Expected string but got" + typeof(fieldValue)));
    }

    if(fieldDefinition.fieldOptions && fieldDefinition.fieldOptions.validation && fieldDefinition.fieldOptions.validation.min){
      if(fieldValue.length < fieldDefinition.fieldOptions.validation.min){
        return cb(new Error("Expected minimum string length of " + fieldDefinition.fieldOptions.validation.min + " but submission is " + fieldValue.length + ". Submitted val: " + fieldValue));
      }
    }

    if(fieldDefinition.fieldOptions && fieldDefinition.fieldOptions.validation && fieldDefinition.fieldOptions.validation.max){
      if(fieldValue.length > fieldDefinition.fieldOptions.validation.max){
        return cb(new Error("Expected maximum string length of " + fieldDefinition.fieldOptions.validation.max + " but submission is " + fieldValue.length + ". Submitted val: " + fieldValue));
      }
    }

    return cb();
  }

  function validatorNumber (fieldValue, fieldDefinition, previousFieldValues, cb) {
    if(typeof fieldValue !== "number"){
      return cb(new Error("Expected number but got " + typeof(fieldValue)));
    }

    if(fieldDefinition.fieldOptions && fieldDefinition.fieldOptions.validation && fieldDefinition.fieldOptions.validation.min){
      if(fieldValue < fieldDefinition.fieldOptions.validation.min){
        return cb(new Error("Expected minimum Number " + fieldDefinition.fieldOptions.validation.min + " but submission is " + fieldValue + ". Submitted number: " + fieldValue));
      }
    }

    if (fieldDefinition.fieldOptions.validation.max){
      if(fieldValue > fieldDefinition.fieldOptions.validation.max){
        return cb(new Error("Expected maximum Number " + fieldDefinition.fieldOptions.validation.max + " but submission is " + fieldValue + ". Submitted number: " + fieldValue));
      }
    }

    return cb();
  }

  function validatorEmail (fieldValue, fieldDefinition, previousFieldValues, cb) {
    if(typeof(fieldValue) !== "string"){
      return cb(new Error("Expected string but got" + typeof(fieldValue)));
    }

    if(fieldValue.match(/[-0-9a-zA-Z.+_]+@[-0-9a-zA-Z.+_]+\.[a-zA-Z]{2,4}/g) === null){
      return cb(new Error("Invalid email address format: " + fieldValue));
    } else {
      return cb();
    }
  }

  function validatorDropDown (fieldValue, fieldDefinition, previousFieldValues, cb) {
    if(typeof(fieldValue) !== "string"){
      return cb(new Error("Expected dropdown submission to be string but got " + typeof(fieldValue)));
    }

    //Check value exists in the field definition
    if(!fieldDefinition.fieldOptions.definition.options){
      return cb(new Error("No dropdown options exist for field " + fieldDefinition.name));
    }

    var matchingOptions = fieldDefinition.fieldOptions.definition.options.filter(function(dropdownOption){
      return dropdownOption.label === fieldValue;
    });

    if(matchingOptions.length !== 1){
      return cb(new Error("Invalid number of dropdown options found: " + matchingOptions.length));
    }

    return cb();
  }

  function validatorRadio (fieldValue, fieldDefinition, previousFieldValues, cb) {
    if(typeof(fieldValue) !== "string"){
      return cb(new Error("Expected radio submission to be string but got " + typeof(fieldValue)));
    }

    //Check value exists in the field definition
    if(!fieldDefinition.fieldOptions.definition.options){
      return cb(new Error("No radio options exist for field " + fieldDefinition.name));
    }

    var matchingOptions = fieldDefinition.fieldOptions.definition.options.filter(function(radioOption){
      return radioOption.label === fieldValue;
    });

    if(matchingOptions.length !== 1){
      return cb(new Error("Invalid number of radio options found: " + matchingOptions.length));
    }

    return cb();
  }

  function validatorCheckboxes (fieldValue, fieldDefinition, previousFieldValues, cb) {
    var minVal;
    if (fieldDefinition && fieldDefinition.fieldOptions && fieldDefinition.fieldOptions.validation) {
      minVal = fieldDefinition.fieldOptions.validation.min;
    }
    var maxVal;
    if (fieldDefinition && fieldDefinition.fieldOptions && fieldDefinition.fieldOptions.validation) {
      maxVal = fieldDefinition.fieldOptions.validation.max;
    }

    if (minVal) {
      if(fieldValue.selections === null || fieldValue.selections === undefined || fieldValue.selections.length < minVal){
        var len;
        if(fieldValue.selections) {
          len = fieldValue.selections.length;
        }
        return cb(new Error("Expected a minimum number of selections " + minVal + " but got " + len));
      }
    }

    if(maxVal){
      if(fieldValue.selections){
        if(fieldValue.selections.length > maxVal){
          return cb(new Error("Expected a maximum number of selections " + maxVal + " but got " + fieldValue.selections.length));
        }
      }
    }

    var optionsInCheckbox = [];

    async.eachSeries(fieldDefinition.fieldOptions.definition.checkboxChoices, function(choice, cb){
      for(var choiceName in choice){
        optionsInCheckbox.push(choiceName);
      }
      return cb();
    }, function(err){
      async.eachSeries(fieldValue.selections, function(selection, cb){
        if(typeof(selection) !== "string"){
          return cb(new Error("Expected checkbox submission to be string but got " + typeof(selection)));
        }

        if(optionsInCheckbox.indexOf(selection) === -1){
          return cb(new Error("Checkbox Option " + selection + " does not exist in the field."));
        }

        return cb();
      }, cb);
    });
  }

  function validatorLocation (fieldValue, fieldDefinition, previousFieldValues, cb) {
    if(fieldDefinition.fieldOptions.definition.locationUnit === "latLong"){
      if(fieldValue.lat && fieldValue.long){
        if(isNaN(parseFloat(fieldValue.lat)) || isNaN(parseFloat(fieldValue.lat))){
          return cb(new Error("Invalid latitude and longitude values"));
        } else {
          return cb();
        }
      } else {
        return cb(new Error("Invalid object for latitude longitude submission"));
      }
    } else {
      if(fieldValue.zone && fieldValue.eastings && fieldValue.northings){
        //Zone must be 3 characters, eastings 6 and northings 9
        return validateNorthingsEastings(fieldValue, cb);
      } else {
        return cb(new Error("Invalid object for northings easting submission. Zone, Eastings and Northings elemets are required"));
      }
    }

    function validateNorthingsEastings(fieldValue, cb){
      if(typeof(fieldValue.zone) !== "string" || fieldValue.zone.length !== 3){
        return cb(new Error("Invalid zone definition for northings and eastings location. " + fieldValue.zone));
      }

      if(typeof(fieldValue.eastings) !== "string" || fieldValue.eastings.length !== 6){
        return cb(new Error("Invalid eastings definition for northings and eastings location. " + fieldValue.eastings));
      }

      if(typeof(fieldValue.northings) !== "string" || fieldValue.northings.length !== 7){
        return cb(new Error("Invalid northings definition for northings and eastings location. " + fieldValue.northings));
      }

      return cb();
    }
  }

  function validatorFile (fieldValue, fieldDefinition, previousFieldValues, cb) {
    if(typeof(fieldValue) !== "string"){
      return cb(new Error("Expected string but got" + typeof(fieldValue)));
    }

    if(fieldValue.indexOf("filePlaceHolder") > -1){ //TODO abstract out to config
      return cb();
    } else if (previousFieldValues && previousFieldValues.indexOf(fieldValue) > -1){
      return cb();
    } else {
      return cb(new Error("Invalid file placeholder text" + fieldValue));
    }
  }

  function validatorDateTime  (fieldValue, fieldDefinition, previousFieldValues, cb) {
    var testDate;

    if(typeof(fieldValue) !== "string"){
      return cb(new Error("Expected string but got" + typeof(fieldValue)));
    }

    switch (fieldDefinition.fieldOptions.definition.dateTimeUnit)
      {
      case FIELD_TYPE_DATETIME_DATETIMEUNIT_DATEONLY:
        try{
          testDate = new Date(fieldValue);
          valid = (testDate.toString() !== "Invalid Date");
        }catch(e){
          valid = false;
        }
        if (valid) {
          return cb();
        } else {
          return cb(new Error("Invalid date value " + fieldValue));
        }
        break;
      case FIELD_TYPE_DATETIME_DATETIMEUNIT_TIMEONLY:
        var parts = fieldValue.split(':');
        valid = (parts.length === 2) || (parts.length === 3);
        if (valid) {
          valid = isNumberBetween(parts[0], 0, 23);
        }
        if (valid) {
          valid = isNumberBetween(parts[1], 0, 59);
        }
        if (valid && (parts.length === 3)) {
          valid = isNumberBetween(parts[2], 0, 59);
        }
        if (valid) {
          return cb();
        } else {
          return cb(new Error("Invalid date value " + fieldValue));
        }
        break;
      case FIELD_TYPE_DATETIME_DATETIMEUNIT_DATETIME:
        try{
          testDate = new Date(fieldValue);

          if(testDate.toString() === "Invalid Date"){
            return cb(new Error("Invalid dateTime string " + fieldValue));
          } else {
            return cb();
          }
        }catch(e){
          return cb(new Error("Invalid dateTime string " + fieldValue));
        }
        break;
      default:
        return cb(new Error("Invalid dateTime fieldtype " + fieldOptions.definition.dateTimeUnit));
      }
  }

  function validatorSection (value, fieldDefinition, previousFieldValues, cb) {
    return cb(new Error("Should not submit section field: " + fieldDefinition.name));
  }

  function rulesResult(rules, cb) {
    var visible = true;

    // Itterate over each rule that this field is a predicate of
    async.each(rules, function(rule, cbRule) {
      // For each rule, itterate over the predicate fields and evaluate the rule
      var predicateMapQueries = [];
      var predicateMapPassed = [];
      async.each(rule.ruleConditionalStatements, function(ruleConditionalStatement, cbPredicates) {
        var field = fieldMap[ruleConditionalStatement.sourceField];
        var passed = false;
        var submissionValues = [];
        if (submissionFieldsMap[ruleConditionalStatement.sourceField] && submissionFieldsMap[ruleConditionalStatement.sourceField].fieldValues) {
          submissionValues = submissionFieldsMap[ruleConditionalStatement.sourceField].fieldValues;
          var condition = ruleConditionalStatement.restriction;
          var testValue = ruleConditionalStatement.sourceValue;

          // Validate rule predictes on the first entry only.
          passed = isConditionActive(field, submissionValues[0], testValue, condition);
        }
        predicateMapQueries.push({"field": field, 
                                  "submissionValues": submissionValues, 
                                  "condition": condition,
                                  "testValue": testValue,
                                  "passed" : passed
                                });

        if( passed ) {
          predicateMapPassed.push(field);
        }
        return cbPredicates();
      }, function(err) {
        if(err) cbRule(err);

        function rulesPassed (condition, passed, queries) {
          return ( (condition === "and" ) && (( passed.length == queries.length ))) ||  // "and" condition - all rules must pass
           ( (condition === "or" )  && (( passed.length > 0 )));                        // "or" condition - only one rule must pass
        }

        if (rulesPassed(rule.ruleConditionalOperator, predicateMapPassed, predicateMapQueries)) {
          visible = (rule.type === "show");
        } else {
          visible = (rule.type !== "show");
        }
        return cbRule();
      });
    }, function(err) {
      if (err) return cb(err);

      return cb(undefined, visible);
    });
  }

  function isPageVisible(pageId, cb) {
    init(function(err){
      if (err) return cb(err);

      if (isPageRuleSubject(pageId)) {  // if the page is the target of a rule
        return rulesResult(pageRuleSubjectMap[pageId], cb);  // execute page rules
      } else {
        return cb(undefined, true);  // if page is not subject of any rule then must be visible
      }
    });
  }

  function isFieldVisible(fieldId, checkContainingPage, cb) {
    /*
     * fieldId = Id of field to check for reule predeciate references 
     * checkContainingPage = if true check page containing field, and return false if the page is hidden
     */
    init(function(err){
      if (err) return cb(err);

      // Fields are visable by default
      var visible = true;

      var field = fieldMap[fieldId];
      if (!fieldId) return cb(new Error("Field does not exist in form"));

      async.waterfall([
        function testPage(cb) {
          if (checkContainingPage) {
            isPageVisible(field.pageId, cb);
          } else {
            return cb(undefined, true);
          }
        },
        function testField(pageVisible, cb) {
          if (!pageVisible) {  // if page containing field is not visible then don't need to check field
            return cb(undefined, false);
          }

          if (isFieldRuleSubject(fieldId) ) { // If the field is the subject of a rule it may have been hidden
            return rulesResult(fieldRuleSubjectMap[fieldId], cb);  // execute field rules
          } else {
            return cb(undefined, true); // if not subject of field rules then can't be hidden 
          }
        }
      ], cb);
    });
  }

  /*
   * check all rules actions
   *      res:
   *      {
   *          "actions": {
   *              "pages": {
   *                  "targetId": {
   *                      "targetId": "",
   *                      "action": "show|hide"
   *                  }
   *              },
   *              "fields": {
   *              }
   *          }
   *      }
   */
  function checkRules(submissionJSON, cb) {
    init(function(err){
      if (err) return cb(err);

      initSubmission(submissionJSON, function (err) {
        if(err) return cb(err);
        var actions = {};

        async.parallel([
          function (cb) {
            actions.fields = {};
            async.eachSeries(Object.keys(fieldRuleSubjectMap), function (fieldId, cb) {
              isFieldVisible(fieldId, false, function (err, fieldVisible) {
                if (err) return cb(err);
                actions.fields[fieldId] = {targetId: fieldId, action: (fieldVisible?"show":"hide")};
                return cb();
              });
            }, cb);
          },
          function (cb) {
            actions.pages = {};
            async.eachSeries(Object.keys(pageRuleSubjectMap), function (pageId, cb) {
              isPageVisible(pageId, function (err, pageVisible) {
                if (err) return cb(err);
                actions.pages[pageId] = {targetId: pageId, action: (pageVisible?"show":"hide")};
                return cb();
              });
            }, cb);
          }
        ], function (err) {
          if(err) return cb(err);

          return cb(undefined, {actions: actions});
        });
      });
    });
  }

  return {
    validateForm: validateForm,
    validateField: validateField,
    validateFieldValue: validateFieldValue,
    checkRules: checkRules,

    // The following are used internally, but exposed for tests
    validateFieldInternal: validateFieldInternal,
    initSubmission: initSubmission,
    isFieldVisible: isFieldVisible,
    isConditionActive: isConditionActive
  };
};

function isNumberBetween(num, min, max) {
  var numVal = parseInt(num,10);
  return (!isNaN(numVal) && (numVal >= min) && (numVal <= max));
}

function cvtTimeToSeconds(fieldValue) {
  var seconds = 0;
  if (typeof fieldValue === "string") {
    var parts = fieldValue.split(':');
    valid = (parts.length === 2) || (parts.length === 3);
    if (valid) {
      valid = isNumberBetween(parts[0], 0, 23);
      seconds += (parseInt(parts[0], 10) * 60 * 60);
    }
    if (valid) {
      valid = isNumberBetween(parts[1], 0, 59);
      seconds += (parseInt(parts[1], 10) * 60);
    }
    if (valid && (parts.length === 3)) {
      valid = isNumberBetween(parts[2], 0, 59);
      seconds += parseInt(parts[2], 10);
    }
  }
  return seconds;
}

function isConditionActive(field, fieldValue, testValue, condition) {

  var fieldType = field.type;
  var fieldOptions = field.fieldOptions;

  var valid = true;
  if( "is equal to" === condition) {
    valid = fieldValue === testValue;
  }
  else if( "is greater than" === condition) {
    // TODO - do numeric checking
    valid = fieldValue > testValue;
  }
  else if( "is less than" === condition) {
    // TODO - do numeric checking
    valid = fieldValue < testValue;
  }
  else if( "is at" === condition) {
    valid = false;
    if( fieldType === FIELD_TYPE_DATETIME ) {
      switch (fieldOptions.definition.dateTimeUnit)
      {
      case FIELD_TYPE_DATETIME_DATETIMEUNIT_DATEONLY:
        try{
          valid = (new Date(new Date(fieldValue).toDateString()).getTime() == new Date(new Date(testValue).toDateString()).getTime()); 
        }catch(e){
          valid = false;
        }
        break;
      case FIELD_TYPE_DATETIME_DATETIMEUNIT_TIMEONLY:
        valid = cvtTimeToSeconds(fieldValue) === cvtTimeToSeconds(testValue);
        break;
      case FIELD_TYPE_DATETIME_DATETIMEUNIT_DATETIME:
        try{
          valid = (new Date(fieldValue).getTime() == new Date(testValue).getTime()); 
        }catch(e){
          valid = false;
        }
        break;
      default:
        valid = false;  // TODO should raise error here?
        break;
      }
    }
  }
  else if( "is before" === condition) {
    valid = false;
    if( fieldType === FIELD_TYPE_DATETIME ) {
     switch (fieldOptions.definition.dateTimeUnit)
      {
      case FIELD_TYPE_DATETIME_DATETIMEUNIT_DATEONLY:
        try{
          valid = (new Date(new Date(fieldValue).toDateString()).getTime() < new Date(new Date(testValue).toDateString()).getTime()); 
        }catch(e){
          valid = false;
        }
        break;
      case FIELD_TYPE_DATETIME_DATETIMEUNIT_TIMEONLY:
        valid = cvtTimeToSeconds(fieldValue) < cvtTimeToSeconds(testValue);
        break;
      case FIELD_TYPE_DATETIME_DATETIMEUNIT_DATETIME:
        try{
          valid = (new Date(fieldValue).getTime() < new Date(testValue).getTime()); 
        }catch(e){
          valid = false;
        }
        break;
      default:
        valid = false;  // TODO should raise error here?
        break;
      }
    }
  }
  else if( "is after" === condition) {
    valid = false;
    if( fieldType === FIELD_TYPE_DATETIME ) {
     switch (fieldOptions.definition.dateTimeUnit)
      {
      case FIELD_TYPE_DATETIME_DATETIMEUNIT_DATEONLY:
        try{
          valid = (new Date(new Date(fieldValue).toDateString()).getTime() > new Date(new Date(testValue).toDateString()).getTime()); 
        }catch(e){
          valid = false;
        }
        break;
      case FIELD_TYPE_DATETIME_DATETIMEUNIT_TIMEONLY:
        valid = cvtTimeToSeconds(fieldValue) > cvtTimeToSeconds(testValue);
        break;
      case FIELD_TYPE_DATETIME_DATETIMEUNIT_DATETIME:
        try{
          valid = (new Date(fieldValue).getTime() > new Date(testValue).getTime());
        }catch(e){
          valid = false;
        } 
        break;
      default:
        valid = false;  // TODO should raise error here?
        break;
      }
    }
  }
  else if( "is" === condition) {
    if (fieldType === FIELD_TYPE_CHECKBOX) {
      valid = fieldValue && fieldValue.selections && fieldValue.selections.indexOf(testValue) !== -1;
    } else {
      valid = fieldValue === testValue;
    }
  }
  else if( "is not" === condition) {
    if (fieldType === FIELD_TYPE_CHECKBOX) {
      valid = fieldValue && fieldValue.selections && fieldValue.selections.indexOf(testValue) === -1;
    } else {
      valid = fieldValue !== testValue;
    }
  }
  else if( "contains" === condition) {
    valid = fieldValue.indexOf(testValue) !== -1;
  }
  else if( "does not contain" === condition) {
      valid = fieldValue.indexOf(testValue) === -1;
  }
  else if( "begins with" === condition) {
    valid = fieldValue.substring(0, testValue.length) === testValue;
  }
  else if( "ends with" === condition) {
    valid = fieldValue.substring(Math.max(0, (fieldValue.length - testValue.length)), fieldValue.length) === testValue;
  }
  else {
    valid = false;
  }

  return valid;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = formsRulesEngine;
}

}());

/* This is the suffix file */
  return module.exports(formDef);
};

/* End of suffix file */

//end  module;

//this is partial file which define the end of closure
})(window || module.exports);


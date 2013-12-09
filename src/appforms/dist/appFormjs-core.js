/**
 * FeedHenry License
 */

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

    function localId(model) {
        var props = model.getProps();
        var _id = props._id;
        var _type = props._type;
        var ts = (new Date()).getTime();
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
                if (result && result.hashvalue){
                    cb(null,result.hashvalue);
                }else{
                    cb("Crypto failed.");
                }

            });
        }else{
            cb("Crypto not found");
        }
    }

    return module;
})(appForm.utils || {});
appForm.utils = (function(module) {
    module.fileSystem = {
        isFileSystemAvailable: isFileSystemAvailable,
        save:save,
        remove:remove,
        readAsText:readAsText,
        readAsBlob:readAsBlob,
        readAsBase64Encoded:readAsBase64Encoded,
        readAsFile:readAsFile
    };

    var fileSystemAvailable = false;
    var _requestFileSystem = function() {}; //placeholder
    var PERSISTENT = 1; //placeholder
    function isFileSystemAvailable() {
        return fileSystemAvailable;
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
            }else if (content instanceof Blob){
                saveObj=content;
                size=b.size;
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
    function readAsBlob(fileName,cb){
        _getFile(fileName,function(err,file){
            if (err){
                return cb(err);
            }else{
                var type=file.type;
                var reader=new FileReader();
                reader.onloadend=function(evt){
                    var arrayBuffer=evt.target.result;
                    var blob=new Blob([arrayBuffer],{
                        "type":type
                    });
                    cb(null,blob);
                }
                reader.readAsArrayBuffer(file);
            }
        });
    }
    function readAsFile(fileName,cb){
        _getFile(fileName,cb);
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
    module.isPhoneGapAvailable = isPhoneGapAvailable;
    module.initHtml5Camera = initHtml5Camera;
    var isPhoneGap = false;
    var isHtml5 = false;
    var video = null;
    var canvas = null;
    var ctx = null;
    var localMediaStream = null;

    function isPhoneGapAvailable() {
        return isPhoneGap;
    }

    function initHtml5Camera(params, cb) {
        _html5Camera(params, cb);
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
                destinationType: Camera.DestinationType.DATA_URL,
                encodingType: Camera.EncodingType.PNG
            });
        } else if (isHtml5) {
            
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
        video.width = width;
        video.height = height;
        canvas.width = width;
        canvas.height = height;
        if (!localMediaStream) {
            navigator.getUserMedia({
                video: true
            }, function(stream) {
                video.src = window.URL.createObjectURL(stream);
                localMediaStream = stream;
                cb(null);
            }, cb);
        }

    }


    function checkEnv() {
        if (navigator.camera && navigator.camera.getPicture) { // PhoneGap
            isPhoneGap = true;
        } else if (_browserWebSupport()) {
            isHtml5 = true;
            video = document.createElement("video");
            canvas = document.createElement('canvas');
            ctx = canvas.getContext('2d');
        }
    }


    function _browserWebSupport() {
        if (navigator.getUserMedia) {
            return true;
        }
        if (navigator.webkitGetUserMedia) {
            navigator.getUserMedia = navigator.webkitGetUserMedia;
            return true
        }
        if (navigator.mozGetUserMedia) {
            navigator.getUserMedia = navigator.mozGetUserMedia;
            return true
        }
        if (navigator.msGetUserMedia) {
            navigator.getUserMedia = navigator.msGetUserMedia;
            return true
        }
        return false;
    }
    //checkEnv();

    function snapshot() {
        if (localMediaStream) {
            ctx.drawImage(video, 0, 0, 800, 600);
            // "image/webp" works in Chrome.
            // Other browsers will fall back to image/png.
            img.src = canvas.toDataURL('image/webp');
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
    MBaaS.prototype.delete=function(model,cb){
        
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
    module.Model = Model;
    
    
    function Model(opt) {
        this.props = {
            "_id": null, // model id
            "_type": null, // model type
            "_ludid": null //local unique id
        };
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
        this.set("_localLastUpdate",(new Date()).getTime());
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
            "forms":"/forms/"+appId,
            "form":"/forms/"+appId+"/:formId",
            "theme":"/forms/"+appId+"/theme",
            "formSubmission":"/forms/:formId/submitFormData",
            "fileSubmission":"/:submissionId/:fieldId/:hashName/submitFormFile"
            //TODO complete the list. 
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
            if (field.getType()=="file"){
                fieldsId.push(fieldId);
            }
        }
        return fieldsId;
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
    Submissions.prototype.pruneSubmission = function(submission) {
        var fields = ["_id", "_ludid", "status", "formName", "formId", "_localLastUpdate", "createDate", "submitDate", "deviceFormTimestamp"];
        var data = submission.getProps();

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
                            _submissions[localId]=submission;
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
        this.set("createDate", new Date());
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
        this.set("timezoneOffset", new Date().getTimezoneOffset());
        this.set("saveDate", new Date());
        this.changeStatus(targetStatus, function(err) {
            if (err) {
                return cb(err);
            } else {
                that.emit("savedraft");
                cb(null, null);
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
        this.set("timezoneOffset", new Date().getTimezoneOffset());
        //TODO overall validate here

        if (validateResult === true) {
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
            return "This should not happen!!";
        }
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
        var that=this;
        appForm.models.uploadManager.cancelSubmission(this, function(err) {
            if (err) {
                console.error(err);
            }
            that.changeStatus(targetStatus,cb);
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
        var that=this;
        this.set("submittedDate", new Date());
        this.changeStatus(targetStatus, function(err){
            if (err){
                cb(err);
            }else{
                that.emit("submitted");        
                cb(null,null);
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
            this.set("uploadStartDate",new Date());
            appForm.models.submissions.updateSubmissionWithoutSaving(this);
            appForm.models.uploadManager.queueSubmission(this, function(err, ut) {
                if (err) {
                    cb(err);
                } else {
                    that.emit("inprogress",ut);
                    cb(null, ut);
                }
            });

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
        var now = new Date();
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
     * This will cause the value been validated
     *
     * @param {[type]} fieldId    [description]
     * @param {[type]} inputValue [description]
     * @param {} cb(err,res) callback function when finished
     * @return true / error message
     */
    Submission.prototype.addInputValue = function(fieldId, inputValue, cb) {
        var that = this;
        this.getForm(function(err, form) {
            var fieldModel = form.getFieldModelById(fieldId);
            var validateRes = fieldModel.validate(inputValue);
            if (validateRes === true) {
                if (that.transactionMode) {
                    if (!that.tmpFields[fieldId]) {
                        that.tmpFields[fieldId] = [];
                    }
                    fieldModel.processInput(inputValue, function(err, result) {
                        if (err) {
                            cb(err);
                        } else {
                            if (result) {
                                that.tmpFields[fieldId].push(result);
                            }
                            cb(null, result);
                        }
                    });
                } else {
                    var target = that.getInputValueObjectById(fieldId);
                    fieldModel.processInput(inputValue, function(err, result) {
                        if (err) {
                            cb(err);
                        } else {
                            if (result) {
                                target.fieldValues.push(result);
                            }
                            cb(null, result);
                        }
                    });
                }
            } else {
                cb(validateRes);
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
        var rtn = [];
        var fileFieldIds = this.form.getFileFieldsId();
        for (var i = 0, fieldId; fieldId = fileFieldIds[i]; i++) {
            var inputValue = this.getInputValueObjectById(fieldId);
            var tmp;
            for (var j = 0, tmp; tmp = inputValue.fieldValues[j]; j++) {
                tmp.fieldId = fieldId;
                rtn.push(tmp);
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
     * @param  {[type]} inputValue 
     * @param {cb} cb(err,res)
     * @return {[type]}           submission json used for fieldValues for the field
     */
    Field.prototype.processInput = function(inputValue, cb) {
        var type = this.getType();
        var processorName = "process_" + type;
        // try to find specified processor
        if (this[processorName] && typeof this[processorName] == "function") {
            this[processorName](inputValue,cb);
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
    Field.prototype.validate=function(inputValue){
        return true;
        //return appForm.models.fieldValidate.validate(inputValue,this);
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
    module.prototype.process_checkboxes = function(inputValue, cb) {
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
    function checkFileObj(obj){
        return obj.fileName && obj.fileType && obj.hashName;
    }
    module.prototype.process_file = function(inputValue, cb) {
        if (typeof inputValue =="undefined" || inputValue==null ){
            return cb(null,null);
        }
        if (typeof inputValue != "object" || ( !inputValue instanceof HTMLInputElement && !inputValue instanceof File && !checkFileObj(inputValue))) {
            throw ("the input value for file field should be a html file input element or a File object");
        }
        if (checkFileObj(inputValue)){
            return cb(null,inputValue);
        }
        var file=inputValue;
        if (inputValue instanceof HTMLInputElement){
            file=inputValue.files[0]; // 1st file only, not support many files yet.
        }
        var rtnJSON={
            "fileName":file.name,
            "fileSize":file.size,
            "fileType":file.type,
            "fileUpdateTime":file.lastModifiedDate,
            "hashName":""
        };
        var name=file.name+Math.ceil(Math.random()*100000);
        appForm.utils.md5(name,function(err,res){
            var hashName=res;
            if (err){
                hashName=name;
            }
            rtnJSON.hashName=hashName;
            appForm.utils.fileSystem.save(hashName, file,function(err,res){
                if (err){
                    console.error(err);
                    cb(err);
                }else{
                    cb(null,rtnJSON);
                }
            });
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
    module.prototype.process_locationLatLong = function(inputValue, cb) {
        if (!inputValue["lat"] || !inputValue["long"]) {
            cb("the input values for latlong field is {lat: number, long: number}");
        } else {
            var obj = {
                "lat": inputValue.lat,
                "long": inputValue.long
            }
            cb(null,obj);
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
 * extension of Field class to support north east field
 */

appForm.models.Field = (function(module) {
    /**
     * Format: 
     *  [{
         "zone": "11U",
         "eastings": "594934",
         "northings": "5636174"
      }, {
         "zone": "12U",
         "eastings": "594934",
         "northings": "5636174"
      }]
     * @param  {[type]} inputValues [description]
     * @return {[type]}             [description]
     */
    module.prototype.process_locationNorthEast = function(inputValue, cb) {
        if (!inputValue["zone"] || !inputValue["eastings"] || !inputValue["northings"]) {
            cb("the input values for northeast field is {zone: text, eastings: text, northings:text}");
        } else {
            var obj = {
                "zone": inputValue.zone,
                "eastings": inputValue.eastings,
                "northings": inputValue.northings
            }
            cb(null,obj);
        }
    }
    return module;
})(appForm.models.Field || {});
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
        this.sendingStart = new Date();
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
            var now = new Date();
            var timePassed = now.getTime() - this.sendingStart.getTime();
            if (timePassed > this.timeOut * 1000) { //time expired. roll current task to the end of queue
                console.error("Uploading content timeout. it will try to reupload.");
                this.sending = false;
                this.rollTask();
            }
        } else {

            if (this.hasTask()) {
                this.sending = true;
                this.sendingStart = new Date();
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
        var files = submissionModel.getFileInputValues();
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
        return this.get("currentTask")
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
                console.error(err);
                cb(err);
            } else {
                var submissionId = res.submissionId;
                var updatedFormDefinition = res.updatedFormDefinition;
                if (updatedFormDefinition) { // remote form definition is updated 
                    that.refreshForm(function() { //refresh related form definition
                        that.submissionModel(function(err, submission) {
                            if (submission) {
                                var err = "Form definition is out of date.";
                                that.completed(err);
                                cb(err);
                            }
                        });
                    });
                } else { // form data submitted successfully.
                    formSub.lastUpdate = new Date();
                    that.set("submissionId", submissionId);
                    that.set("currentTask", 0);
                    that.emit("progress", that.getProgress());
                    cb(null);
                }
            }

        });
    }
    UploadTask.prototype.uploadFile = function(cb) {
        if (this.get("fileTasks").length == 0) {
            this.completed();
            return cb(null, null);
        }
        var submissionId = this.get("submissionId");
        var that = this;
        if (submissionId) {
            var progress = this.get("currentTask");
            if (progress == null) {
                progress = 0;
            }
            var fileTask = this.get("fileTasks", [])[progress];
            if (!fileTask) {
                return cb("cannot find file task");
            }
            var fileSubmissionModel = new appForm.models.FileSubmission(fileTask);
            fileSubmissionModel.setSubmissionId(submissionId);

            fileSubmissionModel.loadFile(function(err) {
                if (err) {
                    cb(err);
                } else {
                    that.getRemoteStore().create(fileSubmissionModel, function(err, res) {
                        if (err) {
                            cb(err);
                        } else {
                            if (res.status == "ok") {
                                var curTask = that.get("currentTask");
                                fileTask.updateDate = new Date();

                                curTask++;
                                that.set("currentTask", curTask);
                                that.emit("progress", that.getProgress());
                                if (that.get("fileTasks").length <= curTask) {
                                    that.completed();
                                }
                                cb(null);
                            } else {
                                cb("File uploading failed.");
                            }
                        }
                    });
                }
            });
        } else {
            this.completed("Failed to upload file. Submission Id not found.");
            cb("Failed to upload file. Submission Id not found.");
        }
    }
    UploadTask.prototype.uploadTick = function(cb) {
        if (this.isCompleted()) {
            return cb(null, null);
        }
        var currentTask = this.get("currentTask", null);
        if (currentTask === null) { //not started yet
            // console.log("upload form data");
            this.uploadForm(cb);
        } else { //upload file
            // console.log("upload file data");
            this.uploadFile(cb);
        }
    }
    /**
     * the upload task is completed
     * @return {[type]} [description]
     */
    UploadTask.prototype.completed = function(err) {
        this.set("completed", true);
        if (err) {
            this.set("error", err);
        }
        this.submissionModel(function(_err,model){
            if (err){
                model.error(err,function(){});
            }else{
                model.submitted(function(){});    
            }
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
/**
 * FeedHenry License
 */

appForm.api = (function(module) {
    module.getForms = getForms;
    module.getForm = getForm;
    module.getSubmissions = getSubmissions;

    var _submissions=null;
    /**
     * Retrieve forms model. It contains forms list. check forms model usage
     * @param  {[type]}   params {fromRemote:boolean(false)}
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
     * @param  {[type]}   params {formId: string, fromRemote:boolean(false)}
     * @param  {Function} cb     (err, formModel)
     * @return {[type]}          [description]
     */
    function getForm(params, cb) {
        new appForm.models.Form(params, cb);
    }
    /**
     * Retrieve submissions list model from local storage
     * @param  {[type]}   params {}
     * @param  {Function} cb     (err,submissionsModel)
     * @return {[type]}          [description]
     */
    function getSubmissions(params, cb) {
        // if (_submissions==null){}
        // appForm.models.submissions.loadLocal(cb);
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


    //mockup $fh apis for Addons.
    if (typeof $fh == "undefined") {
        $fh = {};
    }
        $fh.forms = module;
        $fh.forms.config=appForm.models.config;
        $fh.forms.init=appForm.init;


    return module;
})(appForm.api || {});

//end  module;

//this is partial file which define the end of closure
})(window || module.exports);
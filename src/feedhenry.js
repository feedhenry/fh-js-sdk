(function(root) {
  var $fh = root.$fh || {};
  $fh.fh_timeout = 20000;
  $fh.boxprefix = '/box/srv/1.1/';
  $fh.sdk_version = 'BUILD_VERSION';

  /** PRIVATE METHODS - BEGIN **/

  //if we are running inside a browser, we generate a random device identifier and save it using cookie
  //cookie read/write only used internally, make it private
  var _mock_uuid_cookie_name = "mock_uuid";
  var __readCookieValue  = function (cookie_name) {
    var name_str = cookie_name + "=";
    var cookies = document.cookie.split(";");
    for (var i = 0; i < cookies.length; i++) {
      var c = cookies[i];
      while (c.charAt(0) === ' ') {
        c = c.substring(1, c.length);
      }
      if (c.indexOf(name_str) === 0) {
        return c.substring(name_str.length, c.length);
      }
    }
    return null;
  };
  var __createUUID = function () {
    //from http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript
    //based on RFC 4122, section 4.4 (Algorithms for creating UUID from truely random pr pseudo-random number)
    var s = [];
    var hexDigitals = "0123456789ABCDEF";
    for (var i = 0; i < 32; i++) {
      s[i] = hexDigitals.substr(Math.floor(Math.random() * 0x10), 1);
    }
    s[12] = "4";
    s[16] = hexDigitals.substr((s[16] & 0x3) | 0x8, 1);
    var uuid = s.join("");
    return uuid;
  };
  var __createCookie = function (cookie_name, cookie_value) {
    var date = new Date();
    date.setTime(date.getTime() + 36500 * 24 * 60 * 60 * 1000); //100 years
    var expires = "; expires=" + date.toGMTString();
    document.cookie = cookie_name + "=" + cookie_value + expires + "; path = /";
  };

  //try to get the unique device identifier
  var getDeviceId = function(){
    //check for cordova/phonegap first
    if(typeof window.fhdevice !== "undefined" && typeof window.fhdevice.uuid !== "undefined"){
      return window.fhdevice.uuid;
    } else if(typeof window.device !== "undefined" && typeof window.device.uuid !== "undefined"){
      return window.device.uuid;
    }  else if(typeof navigator.device !== "undefined" && typeof navigator.device.uuid !== "undefined"){
      return navigator.device.uuid;
    } else {
      var uuid = __readCookieValue(_mock_uuid_cookie_name);
      if(null == uuid){
          uuid = __createUUID();
          __createCookie(_mock_uuid_cookie_name, uuid);
      }
      return uuid;
    }
  };

  //this is for fixing analytics issues when upgrading from io6 to ios7. Probably can be deprecated now
  var getCuidMap = function() {
    if(typeof window.fhdevice !== "undefined" && typeof window.fhdevice.cuidMap !== "undefined"){
      return window.fhdevice.cuidMap;
    } else if(typeof window.device !== "undefined" && typeof window.device.cuidMap !== "undefined"){
      return window.device.cuidMap;
    }  else if(typeof navigator.device !== "undefined" && typeof navigator.device.cuidMap !== "undefined"){
      return navigator.device.cuidMap;
    }

    return null;
  };

  var __isSmartMobile = /Android|webOS|iPhone|iPad|iPad|Blackberry|Windows Phone/i.test(navigator.userAgent);
  var __isLocalFile = window.location.protocol.indexOf("file") > -1;

  //determine if the request is the same origin
  var isSameOrigin = function(url) {
    var loc = window.location;
    // http://blog.stevenlevithan.com/archives/parseuri-split-url
    var uriParts = new RegExp("^(?:([^:/?#.]+):)?(?://)?(([^:/?#]*)(?::(\\d*))?)((/(?:[^?#](?![^?#/]*\\.[^?#/.]+(?:[\\?#]|$)))*/?)?([^?#/]*))?(?:\\?([^#]*))?(?:#(.*))?");

    var locParts = uriParts.exec(loc);
    var urlParts = uriParts.exec(url);

    return ((urlParts[1] == null || urlParts[1] === '') && // no protocol }
            (urlParts[3] == null || urlParts[3] === '') && // no domain   } - > relative url
            (urlParts[4] == null || urlParts[4] === ''))|| // no port       }
            (locParts[1] === urlParts[1] && // protocol matches }
            locParts[3] === urlParts[3] && // domain matches   }-> absolute url
            locParts[4] === urlParts[4]); // port matches      }
  };


  // ** millicore/src/main/webapp/box/static/apps/libs/feedhenry/feedhenry-core.js **
  //IE 8/9 use XDomainRequest for cors requests
  var XDomainRequestWrapper = function(xdr){
    this.xdr = xdr;
    this.isWrapper = true;
    this.readyState = 0;
    this.onreadystatechange = null;
    this.status = 0;
    this.statusText = "";
    this.responseText = "";
    var self = this;
    this.xdr.onload = function(){
        self.readyState = 4;
        self.status = 200;
        self.statusText = "";
        self.responseText = self.xdr.responseText;
        if(self.onreadystatechange){
            self.onreadystatechange();
        }
    };
    this.xdr.onerror = function(){
        if(self.onerror){
            self.onerror();
        }
        self.readyState = 4;
        self.status = 0;
        self.statusText = "";
        if(self.onreadystatechange){
            self.onreadystatechange();
        }
    };
    this.xdr.ontimeout = function(){
        self.readyState = 4;
        self.status = 408;
        self.statusText = "timeout";
        if(self.onreadystatechange){
            self.onreadystatechange();
        }
    };
  };

  XDomainRequestWrapper.prototype.open = function(method, url, asyn){
    this.xdr.open(method, url);
  };

  XDomainRequestWrapper.prototype.send = function(data){
    this.xdr.send(data);
  };

  XDomainRequestWrapper.prototype.abort = function(){
    this.xdr.abort();
  };

  XDomainRequestWrapper.prototype.setRequestHeader = function(n, v){
    //not supported by xdr
    //Good doc on limitations of XDomainRequest http://blogs.msdn.com/b/ieinternals/archive/2010/05/13/xdomainrequest-restrictions-limitations-and-workarounds.aspx
    //XDomainRequest doesn't allow setting custom request headers. But it is the only available option to do CORS requests in IE8 & 9. In IE10, they finally start to use standard XMLHttpRequest.
    //To support FH auth tokens in IE8&9, we have to find a different way of doing it.
  };

  XDomainRequestWrapper.prototype.getResponseHeader = function(n){
    //not supported by xdr
  };


  //first, check if cors if supported by the browser
  /* The following code is used to detect if the browser is supporting CORS.
    Most of the browsers implement CORS support using XMLHttpRequest2 object.
    The "withCredentials" property is unique in XMLHttpRequest2 object so it is the easiest way to tell if the browser support CORS. Again, IE uses XDomainRequest.
    A very good article covering this can be found here: http://www.html5rocks.com/en/tutorials/cors/.*/
  var __cors_supported = false;
  if(window.XMLHttpRequest){
    var rq = new XMLHttpRequest();
    if('withCredentials' in rq){
        __cors_supported = true;
    }
    if(!__cors_supported){
        if(typeof XDomainRequest !== "undefined"){
            __cors_supported = true;
        }
    }
  }

  //create a normal ajax request object
  var __xhr = function () {
    var xhr = null;
    if(window.XMLHttpRequest){
        xhr = new XMLHttpRequest();
    } else if(window.ActiveXObject){
        xhr = new window.ActiveXObject("Microsoft.XMLHTTP");
    }
    return xhr;
  };

  //create a CORS reqeust
  var __cor = function () {
    var cor = null;
    if(window.XMLHttpRequest){
        var rq = new XMLHttpRequest();
        if('withCredentials' in rq){
            cor = rq;
        }
    }
    if(null == cor){
        if(typeof XDomainRequest !== "undefined"){
            cor = new XDomainRequestWrapper(new XDomainRequest());
        }
    }
    return cor;
  };

  var __cb_counts = 0;

  //load a script by injecting a script tag
  var __load_script = function (url, callback) {
    var script;
    var head = document.head || document.getElementsByTagName("head")[0] || document.documentElement;
    script = document.createElement("script");
    script.async = "async";
    script.src = url;
    script.type = "text/javascript";
    script.onload = script.onreadystatechange = function () {
      if (!script.readyState || /loaded|complete/.test(script.readyState)) {
        script.onload = script.onreadystatechange = null;
        if (head && script.parentNode) {
          head.removeChild(script);
        }
        script = undefined;
        if (callback && typeof callback === "function") {
          callback();
        }
      }
    };
    head.insertBefore(script, head.firstChild);
  };

  var defaultFail = function(err){
    if(console){
      console.log(err);
    }
  };

  //handle ajax errors
  var _handleError = function(fail, req, resStatus){
    var errraw;
    if(req){
      try{
        var res = JSON.parse(req.responseText);
        errraw = res.error || res.msg;
        if (errraw instanceof Array) {
          errraw = errraw.join('\n');
        }
      } catch(e){
        errraw = req.responseText;
      }
    }
    if(fail){
      fail('error_ajaxfail', {
        status: req.status,
        message: resStatus,
        error: errraw
      });
    }
  };

  //convert query strings into a json object
  var _getQueryMap = function(url) {
    var qmap;
    var i = url.split("?");
    if (i.length === 2) {
      var queryString = i[1];
      var pairs = queryString.split("&");
      qmap = {};
      for (var p = 0; p < pairs.length; p++) {
        var q = pairs[p];
        var qp = q.split("=");
        qmap[qp[0]] = qp[1];
      }
    }
    return qmap;
  };

  //call back function for $fh.auth
  var _checkAuthResponse = function(url) {
    if (/\_fhAuthCallback/.test(url)) {
      var qmap = _getQueryMap(url);
      if (qmap) {
        var fhCallback = qmap["_fhAuthCallback"];
        if (fhCallback) {
          if (qmap['result'] && qmap['result'] === 'success') {
            var sucRes = {'sessionToken': qmap['fh_auth_session'], 'authResponse' : JSON.parse(decodeURIComponent(decodeURIComponent(qmap['authResponse'])))};
            window[fhCallback](null, sucRes);
          } else {
            window[fhCallback]({'message':qmap['message']});
          }
        }
      }
    }
  };

  //This is mainly for using $fh.auth inside browsers. If the authentication method is OAuth, at the end of the process, the user will be re-directed to
  //a url that we specified for checking if the auth is successful. So we always check the url to see if we are on the re-directed page.
  if (window.addEventListener) {
    window.addEventListener('load', function(){
      _checkAuthResponse(window.location.href);
    }, false); //W3C
  } else {
    window.attachEvent('onload', function(){
      _checkAuthResponse(window.location.href);
    }); //IE
  }


  var _getDestination = function() {
    var destination = null;
    var platformsToTest = [
      {
          "destination" :"ipad",
          "test": ["iPad"]
      },
      {
        "destination" :"iphone",
        "test": ["iPhone"]
      },
      {
        "destination" :"android",
        "test": ["Android"]
      },
      {
        "destination" :"blackberry",
        "test": ["BlackBerry", "BB10", "RIM Tablet OS"]//Blackberry 10 does not contain "Blackberry"
      },
      {
        "destination" :"windowsphone",
        "test": ["Windows Phone 8"]
      },
      {
        "destination" :"windowsphone7",
        "test": ["Windows Phone OS 7"]
      }
    ];//TODO -- config this.


    var userAgent = navigator.userAgent;

    if (typeof fh_destination_code !== 'undefined') {
      destination = fh_destination_code;
    } else {
      platformsToTest.forEach(function(testDestination){
        testDestination.test.forEach(function(destinationTest){
          if(userAgent.indexOf(destinationTest) > -1){
            destination = testDestination.destination;
          }
        });
      });
    }

    if(destination == null){ //No user agents were found, set to default web
      destination = "web";
    }

    return destination;
  };

  //construct the default parameters for EVERY request. Mainly for analytics.
  var _fhParams = null;
  var _getFhParams = function() {
    if(_fhParams){
      return _fhParams;
    } else {
      _fhParams = {};
      _fhParams.cuid = getDeviceId();
      _fhParams.cuidMap = getCuidMap();
      _fhParams.appid = $fh.app_props.appid;
      _fhParams.appkey = $fh.app_props.appkey;
      _fhParams.projectid = $fh.app_props.projectid;
      _fhParams.analyticsTag =  $fh.app_props.analyticsTag;
      _fhParams.init = $fh.app_props.init;
      _fhParams.destination = _getDestination();
      _fhParams.connectiontag = $fh.app_props.connectiontag;
      if(window.device || navigator.device){
        _fhParams.device = window.device || navigator.device;
      }

      //backward compatible
      if (typeof fh_app_version !== 'undefined'){
        _fhParams.app_version = fh_app_version;
      }
      if (typeof fh_project_version !== 'undefined'){
        _fhParams.project_version = fh_project_version;
      }
      if (typeof fh_project_app_version !== 'undefined'){
        _fhParams.project_app_version = fh_project_app_version;
      }
      _fhParams.sdk_version = _getSdkVersion();
      return _fhParams;
    }
  };

  //add the default params to the request params
  var _addFhParams = function(params) {
    params = params || {};
    params.__fh = _getFhParams();
    return params;
  };

  //get the sdk version number
  var _getSdkVersion = function() {
    var type = "FH_JS_SDK";
    if (typeof fh_destination_code !== 'undefined') {
      type = "FH_HYBRID_SDK";
    } else if(window.PhoneGap || window.cordova) {
      type = "FH_PHONEGAP_SDK";
    }
    return type + "/" + $fh.sdk_version;
  };

  //create custom events
  var _createEvent = function(type, data) {
    var event = document.createEvent('Events');
    event.initEvent(type, false, false);
    if (data) {
        for (var i in data) {
            if (data.hasOwnProperty(i)) {
                event[i] = data[i];
            }
        }
    }
    return event;
  };

  //emit a custom event
  var _fireEvent = function(type, data){
    var event = _createEvent(type, data);
    document.dispatchEvent(event);
  };

  //flag for indicatiing if $fh is initialised
  var _is_initializing = false;
  //flag for indicating if init is failed
  var _init_failed = false;
  //store listener functions that should be invoked when $fh is initialised
  var _cloud_ready_listeners = [];

  var _findFHPath = function(){
    var path = null;
    var scripts = document.getElementsByTagName('script');
    var term = /(feedhenry.*?\.js)/;
    for (var n = scripts.length-1; n>-1; n--) {
        //trim query parameters
        var src = scripts[n].src.replace(/\?.*$/, '');
        //find feedhenry*.js file
        var matches = src.match(term);
        if(matches && matches.length === 2){
          var fhjs = matches[1];
          if (src.indexOf(fhjs) === (src.length - fhjs.length)) {
            path = src.substring(0, src.length - fhjs.length);
            break;
          }
        }
    }
    return path;
  };

  //This function will handle the app init automatically.
  var _intialise = function(conf_path, success, fail){
    if(typeof $fh.app_props === "undefined"){
      console.log("start to load app_props");
      if ((typeof define === 'function' && define.amd)) {
        console.log("load fhconfig using requirejs");
        require(["./fhconfig"], function(data){
          $fh.app_props = data;
          _loadCloudProps(success, fail);
        });
      } else if (typeof module !== 'undefined' && module.exports) {
        console.log("load fhconfig using commonjs");
        $fh.app_props = require("./fhconfig");
        _loadCloudProps(success, fail);
      } else {
        console.log("load fhconfig using script tag");
        //first, load the app config via ajax. Didn't use script injection here because it requires scope for the app config
        /*$fh.__ajax({
          url: conf_path,
          dataType: "script",
          success: function(app_conf){
            console.log("ajax response is " + app_conf);
            $fh.app_props = root.fhconfig;
            console.log("app_props = " + JSON.stringify($fh.app_props));
            _loadCloudProps(success, fail);
          },
          error: function(req, status, err){
            console.error("Failed to load app configs: status = " + status);
            if(fail && typeof fail === "function"){
              fail("can not read app config file");
            }
          }
        });*/
        var fhjsPath = _findFHPath();
        console.log("find fhjs at " + fhjsPath);
        if(null === fhjsPath){
          if(console && console.warn){
            console.warn("Can not find feedhenry.js script tag. Try load fhconfig from the root");
          }
          fhjsPath = "";
        }
        __load_script(fhjsPath + conf_path, function(){
          $fh.app_props = root.fhconfig;
          console.log("app_props = " + JSON.stringify($fh.app_props));
          _loadCloudProps(success, fail);
        });
      }
    } else {
      _loadCloudProps(success, fail);
    }
  };

  var _loadCloudProps = function(success, fail){
    if($fh.cloud_props){
      if(success && typeof success === "function"){
        return success($fh.cloud_props);
      } else {
        return;
      }
    }

    if(!fail){
      fail = defaultFail;
    }

    //dom adapter doens't work on windows phone, so don't specify the adapter if the dom one failed
    var lcConf = {
      name: "fh_init_storage",
      adapter: "dom",
      fail: function(msg, err) {
        var error_message = 'read/save from/to local storage failed  msg:' + msg + ' err:' + err;
        return fail(error_message, {});
      }
    };

    var storage = null;
    try {
      storage = new Lawnchair(lcConf, function() {});
    } catch(e){
      //when dom adapter failed, Lawnchair throws an error
      lcConf.adapter = undefined;
      storage = new Lawnchair(lcConf, function() {});
    }


    storage.get('fh_init', function(storage_res) {
      var savedHost = null;
      if (storage_res && storage_res.value !== null) {
        if(storage_res.value.init){
          $fh.app_props.init = storage_res.value.init;
        } else {
          //keep it backward compatible.
          $fh.app_props.init = storage_res.value;
        }
        if(storage_res.value.hosts){
          savedHost = storage_res.value;
        }
      }
      console.log("saved host = " + JSON.stringify(savedHost));
      var path = $fh.app_props.host + $fh.boxprefix + "app/init";
      var data = _getFhParams();
      $fh.__ajax({
        "url": path,
        "type": "POST",
        "contentType": "application/json",
        "data": JSON.stringify(data),
        "timeout": $fh.app_props.timeout || $fh.fh_timeout,
        "success": function(data) {
          $fh.cloud_props = data;
          storage.save({
            key: "fh_init",
            value: data
          }, function() {
            if (success) {
              success(data);
            }
          });
        },
        "error": function(req, statusText, error) {
          //use the cached host if we have a copy
          if(savedHost){
            $fh.cloud_props = savedHost;
            if(success){
              success(savedHost);
            }
          } else {
            _handleError(fail, req, statusText);
          }
        }
      });
    });
  };

  var _init_attempt = 0;
  var _tryInitialise = function(conf_path, retry, cb){
    _init_attempt++;
    _intialise(conf_path, function(){
      return cb(null, $fh.cloud_props);
    }, function(err){
      if(retry && _init_attempt <= retry){
        setTimeout(function(){
          _tryInitialise(conf_path, retry, cb);
        }, 200);
      } else {
        return cb(err);
      }
    });
  };

  var _waitForCloudReady = function(cb, retry){
    //if we have $fh.cloud_props, then cloud is ready
    if($fh.cloud_props && typeof($fh.cloud_props) === "object"){
      return cb(null, $fh.cloud_props);
    } else {
      if(_is_initializing){
        _cloud_ready_listeners.push(cb);
      } else {
        _is_initializing = true;
        _init_attempt = 0;
        _tryInitialise("fhconfig.js", retry, function(err, data){
          _is_initializing = false;
          if(typeof(cb) === "function"){
            cb(err, data);
          }
          _cloudReady(null === err);
        });
      }
    }
  };

  //fire cloud ready event, process any callback in the queue
  var _cloudReady = function(success){
    if(success){
      _fireEvent("cloudready", {host: _extractHost()});
    }
    try{
      while(_cloud_ready_listeners[0]){
        var cb = _cloud_ready_listeners.shift();
        if(success){
          return cb(null, null);
        } else {
          return cb("cloud is not ready", null);
        }
      }
    } finally {

    }
  };

  var _extractHost = function(){
    var url = $fh.cloud_props.hosts.url;

    if (typeof url === 'undefined') {
      // resolve url the old way i.e. depending on
      // -burnt in app mode
      // -returned dev or live url
      // -returned dev or live type (node or fh(rhino or proxying))
      var cloud_host = $fh.cloud_props.hosts.releaseCloudUrl;
      var app_type = $fh.cloud_props.hosts.releaseCloudType;

      if($fh.app_props.mode && $fh.app_props.mode.indexOf("dev") > -1){
        cloud_host = $fh.cloud_props.hosts.debugCloudUrl;
        app_type = $fh.cloud_props.hosts.debugCloudType;
      }
      url = cloud_host;
      if(app_type === "fh"){
        url = cloud_host + $fh.boxprefix + "act/" + $fh.cloud_props.domain + "/"+ $fh.app_props.appid + "/" + opts.act + "/" + $fh.app_props.appid;
      }
    }

    return url;
  };


  /** PRIVATE METHODS - END **/

  /** PUBLIC METHODS - BEGIN **/

  /** All the methods begin with _ should only be used by internally **/

  $fh._getDeviceId = getDeviceId;
  $fh._getCuidMap = getCuidMap;
  $fh.__load_script = __load_script;

  //call remote host either using standard ajax objects or jsonp.
  //NOTE: if the request is executed using jsonp, unless it's timed out, we have no way to tell what is the status code of the request, so it will always return 200.
  $fh.__ajax = function (options) {
    var o = options ? options : {};
    var sameOrigin = isSameOrigin(options.url);
    if(!sameOrigin){
        if(typeof window.Phonegap !== "undefined" || typeof window.cordova !== "undefined"){
            //found phonegap, it should be a hyrbid mobile app, consider as same origin
            sameOrigin = true;
        }
    }
    if(!sameOrigin){
        if(__isSmartMobile && __isLocalFile){
            //we can't find phonegap, but we are loading the page use file protocol and the device is a smart phone,
            //it should be a mobile hyrid app
            sameOrigin = true;
        }
    }

    var datatype = null;
    if (sameOrigin || ((!sameOrigin) && __cors_supported) ) {
      datatype = 'json';
    } else {
      datatype = "jsonp";
    }
    var req;
    var url = o.url;
    var method = o.type || 'GET';
    var data = o.data || null;
    var timeoutTimer;
    var rurl = /\?/;
    if(!o.dataType){
      o.dataType = "json";
    }

    //prevent cache
    //url += (rurl.test(url) ? "&" : "?") + "fhts=" + (new Date()).getTime();

    var done = function (status, statusText, responseText) {
      var issuccess = false;
      var error;
      var res;
      if (status >= 200 && status <= 300 || status === 304) {
        if (status === 304) {
          statusText = "notmodified";
          issuccess = true;
        } else {
          if (o.dataType && o.dataType.indexOf('json') !== -1) {
            try {
              if (typeof responseText === "string") {
                res = JSON.parse(responseText);
              } else {
                res = responseText;
              }
              issuccess = true;
            } catch (e) {
              issuccess = false;
              statusText = "parseerror";
              error = e;
            }
          } else {
            res = responseText;
            issuccess = true;
          }
        }
      } else {
        error = statusText;
        if (!statusText || status) {
          statusText = "error";
          if (status < 0) {
            status = 0;
          }
        }
      }
      if (issuccess) {
        req = undefined;
        if (o.success && typeof o.success === 'function') {
          o.success(res);
        }
      } else {
        if (o.error && typeof o.error === 'function') {
          o.error(req, statusText, error);
        }
      }
    };

    var types = {
      'json': function () {
        console.log("url = " + url + " sameOrigin = " + sameOrigin);
        if(sameOrigin){
          req = __xhr();
        } else {
          req = __cor();
        }
        // if IE8 XrequestWrapper then change
        // method to get and add json encoded params
        if(req.isWrapper){
          req.open("GET", url + "?params=" + encodeURIComponent(data), true);
        } else {
          req.open(method, url, true);
        }
        if (o.contentType) {
          req.setRequestHeader('Content-Type', o.contentType);
        }
        req.setRequestHeader('X-Request-With', 'XMLHttpRequest');
        var handler = function () {
          if (req.readyState === 4) {
            if (req.status === 0 && !sameOrigin && !req.isAborted) {
              console.log("try get " + url + " use jsonp");
              // If the XHR/cors was aborted because of a timeout, don't re-try using jsonp. This will cause the request
              // to be re-fired and can cause replay issues - e.g. creates getting applied multiple times.
              return types['jsonp']();
            }
            else {
              if (timeoutTimer) {
                clearTimeout(timeoutTimer);
              }
            }
            var statusText;
            try {
              statusText = req.statusText;
            } catch (e) {
              statusText = "";
            }
            if( ! req.isAborted ) {
              done(req.status, req.statusText, req.responseText);
            }
          }
        };

        req.onreadystatechange = handler;

        req.send(data);
      },

      'jsonp': function () {
        var callbackId = 'fhcb' + __cb_counts++;
        window[callbackId] = function (response) {
          if (timeoutTimer) {
            clearTimeout(timeoutTimer);
          }
          done(200, "", response);
          window[callbackId] = undefined;
          try {
            delete window[callbackId];
          } catch(e) {
          }
        };
        url += (rurl.test(url) ? "&" : "?") + "_callback=" + callbackId;
        if(o.data){
          var d = o.data;
          if(typeof d === "string"){
            url += "&_jsonpdata=" + encodeURIComponent(o.data);
          } else {
            url += "&_jsonpdata=" + encodeURIComponent(JSON.stringify(o.data));
          }
        }
        __load_script(url);
      }
    };

    if (o.timeout > 0) {
      timeoutTimer = setTimeout(function () {
        if (req) {
          req.isAborted = true;
          req.abort();
        }
        done(0, 'timeout');
      }, o.timeout);
    }

    types[datatype]();
  };

  $fh.init = function(opts, success, fail) {
    if(console && console.warn){
      console.warn("$fh.init has been deprecated.");
    }
    if(opts && typeof opts === "object"){
      $fh.app_props = opts;
    }
    if(typeof success === "function"){
      success();
    }
  };

  $fh.act = function(opts, success, fail) {
    if(!fail){
      fail = defaultFail;
    }
    if (!opts.act) {
      return fail('act_no_action', {});
    }

    function doActCall(){
      var url = $fh.cloud_props.hosts.url;

      if (typeof url !== 'undefined') {
        url = url + "/cloud/" + opts.act;
      } else {
        // resolve url the old way i.e. depending on
        // -burnt in app mode
        // -returned dev or live url
        // -returned dev or live type (node or fh(rhino or proxying))
        cloud_host = $fh.cloud_props.hosts.releaseCloudUrl;
        var app_type = $fh.cloud_props.hosts.releaseCloudType;

        if($fh.app_props.mode && $fh.app_props.mode.indexOf("dev") > -1){
          cloud_host = $fh.cloud_props.hosts.debugCloudUrl;
          app_type = $fh.cloud_props.hosts.debugCloudType;
        }
        url = cloud_host + "/cloud/" + opts.act;
        if(app_type === "fh"){
          url = cloud_host + $fh.boxprefix + "act/" + $fh.cloud_props.domain + "/"+ $fh.app_props.appid + "/" + opts.act + "/" + $fh.app_props.appid;
        }
      }

      var params = opts.req || {};
      params = _addFhParams(params);

      return $fh.__ajax({
        "url": url,
        "type": "POST",
        "data": JSON.stringify(params),
        "contentType": "application/json",
        "timeout" : opts.timeout || $fh.app_props.timeout || $fh.fh_timeout,
        success: function(res) {
          if(success){
            return success(res);
          }
        },
        error: function(req, statusText, error) {
          _handleError(fail, req, statusText);
        }
      });
    }

    _waitForCloudReady(function(err, data){
      console.log("Calling fhact now");
      console.log("cloud_props = " + JSON.stringify($fh.cloud_props));
      if(err){
        return fail(err);
      } else {
        doActCall();
      }
    });
  };


  $fh.auth = function (opts, success, fail) {
    if(!fail){
      fail = defaultFail;
    }
    if (!opts.policyId) {
      return fail('auth_no_policyId', {});
    }
    if (!opts.clientToken) {
      return fail('auth_no_clientToken', {});
    }

    _waitForCloudReady(function(err, data){
      if(err){
        return fail(err);
      } else {
        var req = {};
        req.policyId = opts.policyId;
        req.clientToken = opts.clientToken;
        if (opts.endRedirectUrl) {
          req.endRedirectUrl = opts.endRedirectUrl;
          if (opts.authCallback) {
            req.endRedirectUrl += (/\?/.test(req.endRedirectUrl) ? "&" : "?") + "_fhAuthCallback=" + opts.authCallback;
          }
        }
        req.params = {};
        if (opts.params) {
          req.params = opts.params;
        }
        var endurl = opts.endRedirectUrl || "status=complete";
        req.device = getDeviceId();
        var path = $fh.app_props.host + $fh.boxprefix + "admin/authpolicy/auth";
        req = _addFhParams(req);

        $fh.__ajax({
          "url": path,
          "type": "POST",
          "data": JSON.stringify(req),
          "contentType": "application/json",
          "timeout" : opts.timeout || $fh.app_props.timeout || $fh.fh_timeout,
          success: function(res) {
            $fh._handleFhAuthResponse(endurl, res, success, fail);
          },
          error: function(req, statusText, error) {
            _handleError(fail, req, statusText);
          }
        });
      }
    });
  };

  //figure out if $fh.auth is successful.
  $fh._handleFhAuthResponse = function(endurl, res, success, fail){
    if(res.status && res.status === "ok"){
      //for OAuth, a url will be returned which means the user should be directed to that url to authenticate.
      //we try to use the ChildBrower plugin if it can be found. Otherwise send the url to the success function to allow developer to handle it.
      if(res.url){
        if(window.PhoneGap || window.cordova){
          if(window.plugins && window.plugins.childBrowser){
            //found childbrowser plugin,add the event listener and load it
            //we need to know when the OAuth process is finished by checking for the presence of endurl. If the endurl is found, it means the authentication finished and we should find if it's successful.
            if(typeof window.plugins.childBrowser.showWebPage === "function"){
              window.plugins.childBrowser.onLocationChange = function(new_url){
                if(new_url.indexOf(endurl) > -1){
                  window.plugins.childBrowser.close();
                  var qmap = _getQueryMap(new_url);
                  if(qmap) {
                    if(qmap['result'] && qmap['result'] === 'success'){
                      var sucRes = {'sessionToken': qmap['fh_auth_session'], 'authResponse' : JSON.parse(decodeURIComponent(decodeURIComponent(qmap['authResponse'])))};
                      success(sucRes);
                    } else {
                      if(fail){
                        fail("auth_failed", {'message':qmap['message']});
                      }
                    }
                  } else {
                    if(fail){
                        fail("auth_failed", {'message':qmap['message']});
                    }
                  }
                }
              };
              window.plugins.childBrowser.showWebPage(res.url);
            }
          } else {
            console.log("ChildBrowser plugin is not intalled.");
            success(res);
          }
        } else {
         document.location.href = res.url;
        }
      } else {
        success(res);
      }
    } else {
      if(fail){
        fail("auth_failed", res);
      }
    }
  };

  //try to load cloud props now
  _waitForCloudReady(function(){
    if(console && console.log){
      console.log("$fh is ready");
    }
  }, 2);

  root.$fh = $fh;

  /** PUBLIC METHODS - END **/
})(this);

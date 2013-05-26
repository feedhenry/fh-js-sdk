(function(root) {
  root.$fh = root.$fh || {};
  var $fh = root.$fh;
  $fh.fh_timeout = 20000;
  $fh.boxprefix = '/box/srv/1.1/';
  $fh.sdk_version = '1.0.5';
  
  var _is_initializing = false;
  var _init_failed = false;
  var _cloud_ready_listeners = [];

  var _cloudReady = function(success){
    try{
      while(_cloud_ready_listeners[0]){
        var act_fun = _cloud_ready_listeners.shift();
        if(act_fun.type === "init"){
          if(success){
            act_fun.success($fh.cloud_props);
          } else {
            if(act_fun.fail){
              act_fun.fail("fh_init_failed", {});
            }
          }
        }
        if(act_fun.type === "act"){
          if(success){
            $fh.act(act_fun.opts, act_fun.success, act_fun.fail);
          } else {
            if(act_fun.fail){
              act_fun.fail("fh_init_failed", {});
            }
          }
        }
      }
    } finally {

    }
  };

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

  var getDeviceId = function(){
    //check for cordova/phonegap first
    if(typeof window.device !== "undefined" && typeof window.device.uuid !== "undefined"){
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
  
  $fh._getDeviceId = getDeviceId;
  var __isSmartMobile = /Android|webOS|iPhone|iPad|iPad|Blackberry|Windows Phone/i.test(navigator.userAgent);
  var __isLocalFile = window.location.protocol.indexOf("file") > -1;

  function isSameOrigin(url) {
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
  }


  // ** millicore/src/main/webapp/box/static/apps/libs/feedhenry/feedhenry-core.js **
  //IE 8/9 use XDomainRequest for cors requests
  function XDomainRequestWrapper(xdr){
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
  }

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
  $fh.__load_script = __load_script; //for interval usage

  var defaultFail = function(err){
    if(console){
      console.log(err);
    }
  };

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

    if (sameOrigin || ((!sameOrigin) && __cors_supported) ) {
      o.dataType = 'json';
    } else {
      o.dataType = "jsonp";
    }

    var req;
    var url = o.url;
    var method = o.type || 'GET';
    var data = o.data || null;
    var timeoutTimer;
    var rurl = /\?/;
    var datatype = o.dataType === "jsonp" ? "jsonp" : "json";

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
            //the status code will be 0 if there is a network level error, including server rejecting the cors request
            if (req.status === 0 && !sameOrigin) {
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

  _handleError = function(fail, req, resStatus){
    var errraw;
    if(req){
      try{
        var res = JSON.parse(req.responseText);
        errraw = res.error;
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

  _getQueryMap = function(url) {
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

  _checkAuthResponse = function(url) {
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

  _getFhParams = function() {
    var fhParams = {};
    fhParams.cuid = getDeviceId();
    fhParams.appid = $fh.app_props.appid;
    fhParams.appkey = $fh.app_props.appkey;

    if (typeof fh_destination_code !== 'undefined'){
      fhParams.destination = fh_destination_code;
    } else {
      fhParams.destination = "web";
    }
    if (typeof fh_app_version !== 'undefined'){
      fhParams.app_version = fh_app_version;
    }
    fhParams.sdk_version = _getSdkVersion();
    return fhParams;
  };

  _addFhParams = function(params) {
    params = params || {};
    params.__fh = _getFhParams();
    return params;
  };

  _getSdkVersion = function() {
    var type = "FH_JS_SDK";
    if (typeof fh_destination_code !== 'undefined') {
      type = "FH_HYBRID_SDK";
    } else if(window.PhoneGap || window.cordova) {
      type = "FH_PHONEGAP_SDK";
    }
    return type + "/" + $fh.sdk_version;
  };

  if (window.addEventListener) {
    window.addEventListener('load', function(){
      _checkAuthResponse(window.location.href);
    }, false); //W3C
  } else {
    window.attachEvent('onload', function(){
      _checkAuthResponse(window.location.href);
    }); //IE
  }

  $fh._handleAuthResponse = function(endurl, res, success, fail){
    if(res.status && res.status === "ok"){
      if(res.url){
        if(window.PhoneGap || window.cordova){
          if(window.plugins && window.plugins.childBrowser){
            //found childbrowser plugin,add the event listener and load it
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

  $fh.init = function(opts, success, fail) {
    if($fh.cloud_props){
      return success($fh.cloud_props);
    } 
    if(!_is_initializing){
      _is_initializing = true;
      if(!fail){
        fail = defaultFail;
      }
      if (!opts.host) {
        return fail('init_no_host', {});
      }
      if (!opts.appid) {
        return fail('init_no_appid', {});
      }
      if (!opts.appkey) {
        return fail('init_no_appkey', {});
      }
      $fh.app_props = opts;
      var path = opts.host + $fh.boxprefix + "app/init";
      var data = _getFhParams();
      $fh.__ajax({
        "url": path,
        "type": "POST",
        "contentType": "application/json",
        "data": JSON.stringify(data),
        "timeout" : opts.timeout || $fh.app_props.timeout || $fh.fh_timeout,
        "success": function(res){
          $fh.cloud_props = res;
          if(success){
            success(res);
          }
          _cloudReady(true);
        },
        "error": function(req, statusText, error){
          _init_failed = true;
          _is_initializing = false;
          _handleError(fail, req, statusText);
          _cloudReady(false);
        }
      });
    } else {
      _cloud_ready_listeners.push({type:'init', success: success, fail: fail});
    }
    
  };

  $fh.act = function(opts, success, fail) {
    if(!fail){
      fail = defaultFail;
    }
    if (!opts.act) {
      return fail('act_no_action', {});
    }
    // if the initial init failed try and re init then retry the act call
    if(_init_failed){
      $fh.init($fh.app_props , function (suc){
        _init_failed = false;
        doActCall();
      }, function (err){
        _handleError(fail,{"status":0,"responseText":"Init Failed"},"failed to call init. Check network status");
      });
    }
    else if (null == $fh.cloud_props && _is_initializing){
      _cloud_ready_listeners.push({
        "type": "act",
        "opts": opts,
        "success": success,
        "fail": fail
      });
      return;
    }
    else{
      doActCall();
    }

    function doActCall(){
      var cloud_host = $fh.cloud_props.hosts.releaseCloudUrl;
      var app_type = $fh.cloud_props.hosts.releaseCloudType;

      if($fh.app_props.mode && $fh.app_props.mode.indexOf("dev") > -1){
        cloud_host = $fh.cloud_props.hosts.debugCloudUrl;
        app_type = $fh.cloud_props.hosts.debugCloudType;
      }
      var url = cloud_host + "/cloud/" + opts.act;
      if(app_type === "fh"){
        url = cloud_host + $fh.boxprefix + "act/" + $fh.cloud_props.domain + "/"+ $fh.app_props.appid + "/" + opts.act + "/" + $fh.app_props.appid;
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
  };


  $fh.auth = function (opts, success, fail) {
    if(!fail){
      fail = defaultFail;
    }
    if (null == $fh.cloud_props) {
      return fail('fh_not_ready', {});
    }
    var req = {};
    if (!opts.policyId) {
      return fail('auth_no_policyId', {});
    }
    if (!opts.clientToken) {
      return fail('auth_no_clientToken', {});
    }
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
        $fh._handleAuthResponse(endurl, res, success, fail);
      },
      error: function(req, statusText, error) {
        _handleError(fail, req, statusText);
      }
    });

  };
})(this);

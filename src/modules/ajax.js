var XDomainRequestWrapper = require("./XDomainRequestWrapper");
var loadScript = require("./loadScript");
var so = require("./sameOrigin");
var console = require("console");
var JSON = require("JSON");

//first, check if cors if supported by the browser
/* The following code is used to detect if the browser is supporting CORS.
  Most of the browsers implement CORS support using XMLHttpRequest2 object.
  The "withCredentials" property is unique in XMLHttpRequest2 object so it is the easiest way to tell if the browser support CORS. Again, IE uses XDomainRequest.
  A very good article covering this can be found here: http://www.html5rocks.com/en/tutorials/cors/.*/
var cors_supported = false;
if(window.XMLHttpRequest){
  var rq = new XMLHttpRequest();
  if('withCredentials' in rq){
    cors_supported = true;
  }
  if(!cors_supported){
    if(typeof XDomainRequest !== "undefined"){
      cors_supported = true;
    }
  }
}

//create a normal ajax request object
var xhr = function () {
  var xhr = null;
  if(window.XMLHttpRequest){
    xhr = new XMLHttpRequest();
  } else if(window.ActiveXObject){
    xhr = new window.ActiveXObject("Microsoft.XMLHTTP");
  }
  return xhr;
};

//create a CORS reqeust
var cor = function () {
  var cor = null;
  if(window.XMLHttpRequest){
    console.log("use XMLHttpRequest for cors");
    var rq = new XMLHttpRequest();
    if('withCredentials' in rq){
      cor = rq;
    }
  }
  if(null == cor){
    if(typeof XDomainRequest !== "undefined"){
      console.log("use XDomainRequestWrapper for cors");
      cor = new XDomainRequestWrapper(new XDomainRequest());
    }
  }
  return cor;
};

console.log("cors supported = " + cors_supported);
console.log("typeof XMLHttpRequest = " + typeof (window.XMLHttpRequest) );
console.log("typeof XMLHttpRequest = " + typeof (window.XMLHttpRequest) );

var isSmartMobile = /Android|webOS|iPhone|iPad|iPad|Blackberry|Windows Phone/i.test(navigator.userAgent);
var isLocalFile = window.location.protocol.indexOf("file") > -1;

var cb_counts = 0;

function ajax(options) {
  var o = options ? options : {};
  var sameOrigin = so(options.url);
  if(!sameOrigin){
      if(typeof window.Phonegap !== "undefined" || typeof window.cordova !== "undefined"){
          //found phonegap, it should be a hyrbid mobile app, consider as same origin
          sameOrigin = true;
      }
  }
  if(!sameOrigin){
      if(isSmartMobile && isLocalFile){
          //we can't find phonegap, but we are loading the page use file protocol and the device is a smart phone,
          //it should be a mobile hyrid app
          sameOrigin = true;
      }
  }

  var datatype = null;
  var nojsonp = (true === options.nojsonp);
  if (sameOrigin || ((!sameOrigin) && cors_supported) || nojsonp) {
    datatype = 'json';
  } else {
    datatype = "jsonp";
  }
  console.log("request will use " + datatype);
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
        req = xhr();
      } else {
        req = cor();
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
          if (req.status === 0 && !sameOrigin && !req.isAborted && !nojsonp) {
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
      var callbackId = 'fhcb' + cb_counts++;
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
      loadScript(url);
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

module.exports = ajax;

    /*
    json2.js
    2011-10-19

    Public Domain.

    NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.

    See http://www.JSON.org/js.html


    This code should be minified before deployment.
    See http://javascript.crockford.com/jsmin.html

    USE YOUR OWN COPY. IT IS EXTREMELY UNWISE TO LOAD CODE FROM SERVERS YOU DO
    NOT CONTROL.


    This file creates a global JSON object containing two methods: stringify
    and parse.

        JSON.stringify(value, replacer, space)
            value       any JavaScript value, usually an object or array.

            replacer    an optional parameter that determines how object
                        values are stringified for objects. It can be a
                        function or an array of strings.

            space       an optional parameter that specifies the indentation
                        of nested structures. If it is omitted, the text will
                        be packed without extra whitespace. If it is a number,
                        it will specify the number of spaces to indent at each
                        level. If it is a string (such as '\t' or '&nbsp;'),
                        it contains the characters used to indent at each level.

            This method produces a JSON text from a JavaScript value.

            When an object value is found, if the object contains a toJSON
            method, its toJSON method will be called and the result will be
            stringified. A toJSON method does not serialize: it returns the
            value represented by the name/value pair that should be serialized,
            or undefined if nothing should be serialized. The toJSON method
            will be passed the key associated with the value, and this will be
            bound to the value

            For example, this would serialize Dates as ISO strings.

                Date.prototype.toJSON = function (key) {
                    function f(n) {
                        // Format integers to have at least two digits.
                        return n < 10 ? '0' + n : n;
                    }

                    return this.getUTCFullYear()   + '-' +
                         f(this.getUTCMonth() + 1) + '-' +
                         f(this.getUTCDate())      + 'T' +
                         f(this.getUTCHours())     + ':' +
                         f(this.getUTCMinutes())   + ':' +
                         f(this.getUTCSeconds())   + 'Z';
                };

            You can provide an optional replacer method. It will be passed the
            key and value of each member, with this bound to the containing
            object. The value that is returned from your method will be
            serialized. If your method returns undefined, then the member will
            be excluded from the serialization.

            If the replacer parameter is an array of strings, then it will be
            used to select the members to be serialized. It filters the results
            such that only members with keys listed in the replacer array are
            stringified.

            Values that do not have JSON representations, such as undefined or
            functions, will not be serialized. Such values in objects will be
            dropped; in arrays they will be replaced with null. You can use
            a replacer function to replace those with JSON values.
            JSON.stringify(undefined) returns undefined.

            The optional space parameter produces a stringification of the
            value that is filled with line breaks and indentation to make it
            easier to read.

            If the space parameter is a non-empty string, then that string will
            be used for indentation. If the space parameter is a number, then
            the indentation will be that many spaces.

            Example:

            text = JSON.stringify(['e', {pluribus: 'unum'}]);
            // text is '["e",{"pluribus":"unum"}]'


            text = JSON.stringify(['e', {pluribus: 'unum'}], null, '\t');
            // text is '[\n\t"e",\n\t{\n\t\t"pluribus": "unum"\n\t}\n]'

            text = JSON.stringify([new Date()], function (key, value) {
                return this[key] instanceof Date ?
                    'Date(' + this[key] + ')' : value;
            });
            // text is '["Date(---current time---)"]'


        JSON.parse(text, reviver)
            This method parses a JSON text to produce an object or array.
            It can throw a SyntaxError exception.

            The optional reviver parameter is a function that can filter and
            transform the results. It receives each of the keys and values,
            and its return value is used instead of the original value.
            If it returns what it received, then the structure is not modified.
            If it returns undefined then the member is deleted.

            Example:

            // Parse the text. Values that look like ISO date strings will
            // be converted to Date objects.

            myData = JSON.parse(text, function (key, value) {
                var a;
                if (typeof value === 'string') {
                    a =
/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/.exec(value);
                    if (a) {
                        return new Date(Date.UTC(+a[1], +a[2] - 1, +a[3], +a[4],
                            +a[5], +a[6]));
                    }
                }
                return value;
            });

            myData = JSON.parse('["Date(09/09/2001)"]', function (key, value) {
                var d;
                if (typeof value === 'string' &&
                        value.slice(0, 5) === 'Date(' &&
                        value.slice(-1) === ')') {
                    d = new Date(value.slice(5, -1));
                    if (d) {
                        return d;
                    }
                }
                return value;
            });


    This is a reference implementation. You are free to copy, modify, or
    redistribute.
*/

/*jslint evil: true, regexp: true */

/*members "", "\b", "\t", "\n", "\f", "\r", "\"", JSON, "\\", apply,
    call, charCodeAt, getUTCDate, getUTCFullYear, getUTCHours,
    getUTCMinutes, getUTCMonth, getUTCSeconds, hasOwnProperty, join,
    lastIndex, length, parse, prototype, push, replace, slice, stringify,
    test, toJSON, toString, valueOf
*/


// Create a JSON object only if one does not already exist. We create the
// methods in a closure to avoid creating global variables.

var JSON;
if (!JSON) {
    JSON = {};
}

(function () {
    'use strict';

    function f(n) {
        // Format integers to have at least two digits.
        return n < 10 ? '0' + n : n;
    }

    if (typeof Date.prototype.toJSON !== 'function') {

        Date.prototype.toJSON = function (key) {

            return isFinite(this.valueOf())
                ? this.getUTCFullYear()     + '-' +
                    f(this.getUTCMonth() + 1) + '-' +
                    f(this.getUTCDate())      + 'T' +
                    f(this.getUTCHours())     + ':' +
                    f(this.getUTCMinutes())   + ':' +
                    f(this.getUTCSeconds())   + 'Z'
                : null;
        };

        String.prototype.toJSON      =
            Number.prototype.toJSON  =
            Boolean.prototype.toJSON = function (key) {
                return this.valueOf();
            };
    }

    var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        gap,
        indent,
        meta = {    // table of character substitutions
            '\b': '\\b',
            '\t': '\\t',
            '\n': '\\n',
            '\f': '\\f',
            '\r': '\\r',
            '"' : '\\"',
            '\\': '\\\\'
        },
        rep;


    function quote(string) {

// If the string contains no control characters, no quote characters, and no
// backslash characters, then we can safely slap some quotes around it.
// Otherwise we must also replace the offending characters with safe escape
// sequences.

        escapable.lastIndex = 0;
        return escapable.test(string) ? '"' + string.replace(escapable, function (a) {
            var c = meta[a];
            return typeof c === 'string'
                ? c
                : '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
        }) + '"' : '"' + string + '"';
    }


    function str(key, holder) {

// Produce a string from holder[key].

        var i,          // The loop counter.
            k,          // The member key.
            v,          // The member value.
            length,
            mind = gap,
            partial,
            value = holder[key];

// If the value has a toJSON method, call it to obtain a replacement value.

        if (value && typeof value === 'object' &&
                typeof value.toJSON === 'function') {
            value = value.toJSON(key);
        }

// If we were called with a replacer function, then call the replacer to
// obtain a replacement value.

        if (typeof rep === 'function') {
            value = rep.call(holder, key, value);
        }

// What happens next depends on the value's type.

        switch (typeof value) {
        case 'string':
            return quote(value);

        case 'number':

// JSON numbers must be finite. Encode non-finite numbers as null.

            return isFinite(value) ? String(value) : 'null';

        case 'boolean':
        case 'null':

// If the value is a boolean or null, convert it to a string. Note:
// typeof null does not produce 'null'. The case is included here in
// the remote chance that this gets fixed someday.

            return String(value);

// If the type is 'object', we might be dealing with an object or an array or
// null.

        case 'object':

// Due to a specification blunder in ECMAScript, typeof null is 'object',
// so watch out for that case.

            if (!value) {
                return 'null';
            }

// Make an array to hold the partial results of stringifying this object value.

            gap += indent;
            partial = [];

// Is the value an array?

            if (Object.prototype.toString.apply(value) === '[object Array]') {

// The value is an array. Stringify every element. Use null as a placeholder
// for non-JSON values.

                length = value.length;
                for (i = 0; i < length; i += 1) {
                    partial[i] = str(i, value) || 'null';
                }

// Join all of the elements together, separated with commas, and wrap them in
// brackets.

                v = partial.length === 0
                    ? '[]'
                    : gap
                    ? '[\n' + gap + partial.join(',\n' + gap) + '\n' + mind + ']'
                    : '[' + partial.join(',') + ']';
                gap = mind;
                return v;
            }

// If the replacer is an array, use it to select the members to be stringified.

            if (rep && typeof rep === 'object') {
                length = rep.length;
                for (i = 0; i < length; i += 1) {
                    if (typeof rep[i] === 'string') {
                        k = rep[i];
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            } else {

// Otherwise, iterate through all of the keys in the object.

                for (k in value) {
                    if (Object.prototype.hasOwnProperty.call(value, k)) {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            }

// Join all of the member texts together, separated with commas,
// and wrap them in braces.

            v = partial.length === 0
                ? '{}'
                : gap
                ? '{\n' + gap + partial.join(',\n' + gap) + '\n' + mind + '}'
                : '{' + partial.join(',') + '}';
            gap = mind;
            return v;
        }
    }

// If the JSON object does not yet have a stringify method, give it one.

    if (typeof JSON.stringify !== 'function') {
        JSON.stringify = function (value, replacer, space) {

// The stringify method takes a value and an optional replacer, and an optional
// space parameter, and returns a JSON text. The replacer can be a function
// that can replace values, or an array of strings that will select the keys.
// A default replacer method can be provided. Use of the space parameter can
// produce text that is more easily readable.

            var i;
            gap = '';
            indent = '';

// If the space parameter is a number, make an indent string containing that
// many spaces.

            if (typeof space === 'number') {
                for (i = 0; i < space; i += 1) {
                    indent += ' ';
                }

// If the space parameter is a string, it will be used as the indent string.

            } else if (typeof space === 'string') {
                indent = space;
            }

// If there is a replacer, it must be a function or an array.
// Otherwise, throw an error.

            rep = replacer;
            if (replacer && typeof replacer !== 'function' &&
                    (typeof replacer !== 'object' ||
                    typeof replacer.length !== 'number')) {
                throw new Error('JSON.stringify');
            }

// Make a fake root object containing our value under the key of ''.
// Return the result of stringifying the value.

            return str('', {'': value});
        };
    }


// If the JSON object does not yet have a parse method, give it one.

    if (typeof JSON.parse !== 'function') {
        JSON.parse = function (text, reviver) {

// The parse method takes a text and an optional reviver function, and returns
// a JavaScript value if the text is a valid JSON text.

            var j;

            function walk(holder, key) {

// The walk method is used to recursively walk the resulting structure so
// that modifications can be made.

                var k, v, value = holder[key];
                if (value && typeof value === 'object') {
                    for (k in value) {
                        if (Object.prototype.hasOwnProperty.call(value, k)) {
                            v = walk(value, k);
                            if (v !== undefined) {
                                value[k] = v;
                            } else {
                                delete value[k];
                            }
                        }
                    }
                }
                return reviver.call(holder, key, value);
            }


// Parsing happens in four stages. In the first stage, we replace certain
// Unicode characters with escape sequences. JavaScript handles many characters
// incorrectly, either silently deleting them, or treating them as line endings.

            text = String(text);
            cx.lastIndex = 0;
            if (cx.test(text)) {
                text = text.replace(cx, function (a) {
                    return '\\u' +
                        ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
                });
            }

// In the second stage, we run the text against regular expressions that look
// for non-JSON patterns. We are especially concerned with '()' and 'new'
// because they can cause invocation, and '=' because it can cause mutation.
// But just to be safe, we want to reject all unexpected forms.

// We split the second stage into 4 regexp operations in order to work around
// crippling inefficiencies in IE's and Safari's regexp engines. First we
// replace the JSON backslash pairs with '@' (a non-JSON character). Second, we
// replace all simple value tokens with ']' characters. Third, we delete all
// open brackets that follow a colon or comma or that begin the text. Finally,
// we look to see that the remaining characters are only whitespace or ']' or
// ',' or ':' or '{' or '}'. If that is so, then the text is safe for eval.

            if (/^[\],:{}\s]*$/
                    .test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@')
                        .replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']')
                        .replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {

// In the third stage we use the eval function to compile the text into a
// JavaScript structure. The '{' operator is subject to a syntactic ambiguity
// in JavaScript: it can begin a block or an object literal. We wrap the text
// in parens to eliminate the ambiguity.

                j = eval('(' + text + ')');

// In the optional fourth stage, we recursively walk the new structure, passing
// each name/value pair to a reviver function for possible transformation.

                return typeof reviver === 'function'
                    ? walk({'': j}, '')
                    : j;
            }

// If the text is not JSON parseable, then a SyntaxError is thrown.

            throw new SyntaxError('JSON.parse');
        };
    }
}());

(function(root) {
  root.$fh = root.$fh || {};
  var $fh = root.$fh;
  $fh.fh_timeout = 20000;
  $fh.boxprefix = '/box/srv/1.1/';
  $fh.sdk_version = '1.0.5';
  
  var _is_initializing = false;
  var _cloud_ready_listeners = [];

  var _cloudReady = function(success){
    try{
      while(_cloud_ready_listeners[0]){
        var act_fun = _cloud_ready_listeners.shift();
        if(act_fun.type === "init"){
          success? act_fun.success($fh.cloud_props):(act_fun.fail?act_fun.fail("fh_init_failed", {}): function(){});
        }
        if(act_fun.type === "act"){
          success?$fh.act(act_fun.opts, act_fun.success, act_fun.fail):(act_fun.fail?act_fun.fail("fh_init_failed", {}):function(){});
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
      while (c.charAt(0) == ' ') {
        c = c.substring(1, c.length);
      }
      if (c.indexOf(name_str) == 0) {
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
    if(typeof navigator.device !== "undefined" && typeof navigator.device.uuid !== "undefined"){
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
            (urlParts[4] == null || urlParts[4] === '')) // no port       }
            || (locParts[1] === urlParts[1] && // protocol matches }
            locParts[3] === urlParts[3] && // domain matches   }-> absolute url
            locParts[4] === urlParts[4]); // port matches      }
  }


  // ** millicore/src/main/webapp/box/static/apps/libs/feedhenry/feedhenry-core.js **
  //IE 8/9 use XDomainRequest for cors requests
  function XDomainRequestWrapper(xdr){
    this.xdr = xdr;
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
    }
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
    }
    this.xdr.ontimeout = function(){
        self.readyState = 4;
        self.status = 408;
        self.statusText = "timeout";
        if(self.onreadystatechange){
            self.onreadystatechange();
        }
    }
  }

  XDomainRequestWrapper.prototype.open = function(method, url, asyn){
    this.xdr.open(method, url);
  }

  XDomainRequestWrapper.prototype.send = function(data){
    this.xdr.send(data);
  }

  XDomainRequestWrapper.prototype.abort = function(){
    this.xdr.abort();
  }

  XDomainRequestWrapper.prototype.setRequestHeader = function(n, v){
    //not supported by xdr
    //Good doc on limitations of XDomainRequest http://blogs.msdn.com/b/ieinternals/archive/2010/05/13/xdomainrequest-restrictions-limitations-and-workarounds.aspx
    //XDomainRequest doesn't allow setting custom request headers. But it is the only available option to do CORS requests in IE8 & 9. In IE10, they finally start to use standard XMLHttpRequest.
    //To support FH auth tokens in IE8&9, we have to find a different way of doing it.
  }

  XDomainRequestWrapper.prototype.getResponseHeader = function(n){
    //not supported by xdr
  }


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
  }
  
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
      if (status >= 200 && status <= 300 || status == 304) {
        if (status == 304) {
          statusText = "notmodified";
          issuccess = true;
        } else {
          if (o.dataType && o.dataType.indexOf('json') != -1) {
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
        req.open(method, url, true);
        if (o.contentType) {
          req.setRequestHeader('Content-Type', o.contentType);
        }
        req.setRequestHeader('X-Request-With', 'XMLHttpRequest');
        var handler = function () {
          if (req.readyState == 4) {
            if (timeoutTimer) {
              clearTimeout(timeoutTimer);
            }
            //the status code will be 0 if there is a network level error, including server rejecting the cors request
            if(req.status === 0){
                if(!sameOrigin){
                    return types['jsonp']();
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
            delete window[callbackId]
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
      })
    }
  };

  _getQueryMap = function(url) {
    var qmap;
    var i = url.split("?");
    if (i.length == 2) {
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

    if (typeof fh_destination_code != 'undefined'){
      fhParams.destination = fh_destination_code;
    } else {
      fhParams.destination = "web";
    }
    if (typeof fh_app_version != 'undefined'){
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
    if (typeof fh_destination_code != 'undefined') {
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
    if (null == $fh.cloud_props && _is_initializing){
      _cloud_ready_listeners.push({
        "type": "act",
        "opts": opts,
        "success": success,
        "fail": fail
      });
      return;
    }

    if (!opts.act) {
      return fail('act_no_action', {});
    }
    
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
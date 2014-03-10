!function(e){if("object"==typeof exports)module.exports=e();else if("function"==typeof define&&define.amd)define(e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.$fh=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"rfnvHI":[function(_dereq_,module,exports){
(function (global){
(function browserifyShim(module, exports, define, browserify_shim__define__module__export__) {
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
; browserify_shim__define__module__export__(typeof JSON != "undefined" ? JSON : window.JSON);

}).call(global, undefined, undefined, undefined, function defineExport(ex) { module.exports = ex; });

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],"JSON":[function(_dereq_,module,exports){
module.exports=_dereq_('rfnvHI');
},{}],"Z3sPFr":[function(_dereq_,module,exports){
(function (global){
(function browserifyShim(module, exports, define, browserify_shim__define__module__export__) {
/**
 * Lawnchair!
 * ---
 * clientside json store
 *
 */
var Lawnchair = function (options, callback) {
  // ensure Lawnchair was called as a constructor
  if (!(this instanceof Lawnchair)) return new Lawnchair(options, callback);

  // lawnchair requires json
  if (!JSON) throw 'JSON unavailable! Include http://www.json.org/json2.js to fix.'
  // options are optional; callback is not
  if (arguments.length <= 2 && arguments.length > 0) {
    callback = (typeof arguments[0] === 'function') ? arguments[0] : arguments[1];
    options  = (typeof arguments[0] === 'function') ? {} : arguments[0];
  } else {
    throw 'Incorrect # of ctor args!'
  }
  // TODO perhaps allow for pub/sub instead?
  if (typeof callback !== 'function') throw 'No callback was provided';

  // default configuration
  this.record = options.record || 'record'  // default for records
  this.name   = options.name   || 'records' // default name for underlying store

  // mixin first valid  adapter
  var adapter
  // if the adapter is passed in we try to load that only
  if (options.adapter) {

    // the argument passed should be an array of prefered adapters
    // if it is not, we convert it
    if(typeof(options.adapter) === 'string'){
      options.adapter = [options.adapter];
    }

    // iterates over the array of passed adapters
    for(var j = 0, k = options.adapter.length; j < k; j++){

      // itirates over the array of available adapters
      for (var i = Lawnchair.adapters.length-1; i >= 0; i--) {
        if (Lawnchair.adapters[i].adapter === options.adapter[j]) {
          adapter = Lawnchair.adapters[i].valid() ? Lawnchair.adapters[i] : undefined;
          if (adapter) break
        }
      }
      if (adapter) break
    }

    // otherwise find the first valid adapter for this env
  }
  else {
    for (var i = 0, l = Lawnchair.adapters.length; i < l; i++) {
      adapter = Lawnchair.adapters[i].valid() ? Lawnchair.adapters[i] : undefined
      if (adapter) break
    }
  }

  // we have failed
  if (!adapter) throw 'No valid adapter.'

  // yay! mixin the adapter
  for (var j in adapter)
    this[j] = adapter[j]

  // call init for each mixed in plugin
  for (var i = 0, l = Lawnchair.plugins.length; i < l; i++)
    Lawnchair.plugins[i].call(this)

  // init the adapter
  this.init(options, callback)
}

Lawnchair.adapters = []

/**
 * queues an adapter for mixin
 * ===
 * - ensures an adapter conforms to a specific interface
 *
 */
Lawnchair.adapter = function (id, obj) {
  // add the adapter id to the adapter obj
  // ugly here for a  cleaner dsl for implementing adapters
  obj['adapter'] = id
  // methods required to implement a lawnchair adapter
  var implementing = 'adapter valid init keys save batch get exists all remove nuke'.split(' ')
    ,   indexOf = this.prototype.indexOf
  // mix in the adapter
  for (var i in obj) {
    if (indexOf(implementing, i) === -1) throw 'Invalid adapter! Nonstandard method: ' + i
  }
  // if we made it this far the adapter interface is valid
  // insert the new adapter as the preferred adapter
  Lawnchair.adapters.splice(0,0,obj)
}

Lawnchair.plugins = []

/**
 * generic shallow extension for plugins
 * ===
 * - if an init method is found it registers it to be called when the lawnchair is inited
 * - yes we could use hasOwnProp but nobody here is an asshole
 */
Lawnchair.plugin = function (obj) {
  for (var i in obj)
    i === 'init' ? Lawnchair.plugins.push(obj[i]) : this.prototype[i] = obj[i]
}

/**
 * helpers
 *
 */
Lawnchair.prototype = {

  isArray: Array.isArray || function(o) { return Object.prototype.toString.call(o) === '[object Array]' },

  /**
   * this code exists for ie8... for more background see:
   * http://www.flickr.com/photos/westcoastlogic/5955365742/in/photostream
   */
  indexOf: function(ary, item, i, l) {
    if (ary.indexOf) return ary.indexOf(item)
    for (i = 0, l = ary.length; i < l; i++) if (ary[i] === item) return i
    return -1
  },

  // awesome shorthand callbacks as strings. this is shameless theft from dojo.
  lambda: function (callback) {
    return this.fn(this.record, callback)
  },

  // first stab at named parameters for terse callbacks; dojo: first != best // ;D
  fn: function (name, callback) {
    return typeof callback == 'string' ? new Function(name, callback) : callback
  },

  // returns a unique identifier (by way of Backbone.localStorage.js)
  // TODO investigate smaller UUIDs to cut on storage cost
  uuid: function () {
    var S4 = function () {
      return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
    }
    return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
  },

  // a classic iterator
  each: function (callback) {
    var cb = this.lambda(callback)
    // iterate from chain
    if (this.__results) {
      for (var i = 0, l = this.__results.length; i < l; i++) cb.call(this, this.__results[i], i)
    }
    // otherwise iterate the entire collection
    else {
      this.all(function(r) {
        for (var i = 0, l = r.length; i < l; i++) cb.call(this, r[i], i)
      })
    }
    return this
  }
// --
};

Lawnchair.adapter('indexed-db', (function(){

  function fail(e, i) {
    if(console) { console.log('error in indexed-db adapter!' + e.message, e, i); debugger;}
  } ;

  function getIDB(){
    return window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.oIndexedDB || window.msIndexedDB;
  };



  return {

    valid: function() { return !!getIDB(); },

    init:function(options, callback) {
      this.idb = getIDB();
      this.waiting = [];
      var request = this.idb.open(this.name, "2.0");
      var self = this;
      var cb = self.fn(self.name, callback);
      var win = function(){ return cb.call(self, self); }
      //FEEDHENRY CHANGE TO ALLOW ERROR CALLBACK
      if(options && 'function' === typeof options.fail) fail = options.fail
      //END CHANGE
      request.onupgradeneeded = function(event){
        self.store = request.result.createObjectStore("teststore", { autoIncrement: true} );
        for (var i = 0; i < self.waiting.length; i++) {
          self.waiting[i].call(self);
        }
        self.waiting = [];
        win();
      }

      request.onsuccess = function(event) {
        self.db = request.result;


        if(self.db.version != "2.0") {
          if(typeof self.db.setVersion == 'function'){

            var setVrequest = self.db.setVersion("2.0");
            // onsuccess is the only place we can create Object Stores
            setVrequest.onsuccess = function(e) {
              self.store = self.db.createObjectStore("teststore", { autoIncrement: true} );
              for (var i = 0; i < self.waiting.length; i++) {
                self.waiting[i].call(self);
              }
              self.waiting = [];
              win();
            };
            setVrequest.onerror = function(e) {
             // console.log("Failed to create objectstore " + e);
              fail(e);
            }

          }
        } else {
          self.store = {};
          for (var i = 0; i < self.waiting.length; i++) {
            self.waiting[i].call(self);
          }
          self.waiting = [];
          win();
        }
      }
      request.onerror = fail;
    },

    save:function(obj, callback) {
      if(!this.store) {
        this.waiting.push(function() {
          this.save(obj, callback);
        });
        return;
      }

      var self = this;
      var win  = function (e) { if (callback) { obj.key = e.target.result; self.lambda(callback).call(self, obj) }};
      var accessType = "readwrite";
      var trans = this.db.transaction(["teststore"],accessType);
      var store = trans.objectStore("teststore");
      var request = obj.key ? store.put(obj, obj.key) : store.put(obj);

      request.onsuccess = win;
      request.onerror = fail;

      return this;
    },

    // FIXME this should be a batch insert / just getting the test to pass...
    batch: function (objs, cb) {

      var results = []
        ,   done = false
        ,   self = this

      var updateProgress = function(obj) {
        results.push(obj)
        done = results.length === objs.length
      }

      var checkProgress = setInterval(function() {
        if (done) {
          if (cb) self.lambda(cb).call(self, results)
          clearInterval(checkProgress)
        }
      }, 200)

      for (var i = 0, l = objs.length; i < l; i++)
        this.save(objs[i], updateProgress)

      return this
    },


    get:function(key, callback) {
      if(!this.store) {
        this.waiting.push(function() {
          this.get(key, callback);
        });
        return;
      }


      var self = this;
      var win  = function (e) { if (callback) { self.lambda(callback).call(self, e.target.result) }};


      if (!this.isArray(key)){
        var req = this.db.transaction("teststore").objectStore("teststore").get(key);

        req.onsuccess = win;
        req.onerror = function(event) {
          //console.log("Failed to find " + key);
          fail(event);
        };

        // FIXME: again the setInterval solution to async callbacks..
      } else {

        // note: these are hosted.
        var results = []
          ,   done = false
          ,   keys = key

        var updateProgress = function(obj) {
          results.push(obj)
          done = results.length === keys.length
        }

        var checkProgress = setInterval(function() {
          if (done) {
            if (callback) self.lambda(callback).call(self, results)
            clearInterval(checkProgress)
          }
        }, 200)

        for (var i = 0, l = keys.length; i < l; i++)
          this.get(keys[i], updateProgress)

      }

      return this;
    },

    all:function(callback) {
      if(!this.store) {
        this.waiting.push(function() {
          this.all(callback);
        });
        return;
      }
      var cb = this.fn(this.name, callback) || undefined;
      var self = this;
      var objectStore = this.db.transaction("teststore").objectStore("teststore");
      var toReturn = [];
      objectStore.openCursor().onsuccess = function(event) {
        var cursor = event.target.result;
        if (cursor) {
          toReturn.push(cursor.value);
          cursor.continue();
        }
        else {
          if (cb) cb.call(self, toReturn);
        }
      };
      return this;
    },

    remove:function(keyOrObj, callback) {
      if(!this.store) {
        this.waiting.push(function() {
          this.remove(keyOrObj, callback);
        });
        return;
      }
      if (typeof keyOrObj == "object") {
        keyOrObj = keyOrObj.key;
      }
      var self = this;
      var win  = function () { if (callback) self.lambda(callback).call(self) };

      var request = this.db.transaction(["teststore"], "readwrite").objectStore("teststore").delete(keyOrObj);
      request.onsuccess = win;
      request.onerror = fail;
      return this;
    },

    nuke:function(callback) {
      if(!this.store) {
        this.waiting.push(function() {
          this.nuke(callback);
        });
        return;
      }

      var self = this
        ,   win  = callback ? function() { self.lambda(callback).call(self) } : function(){};

      try {
        this.db
          .transaction(["teststore"], "readwrite")
          .objectStore("teststore").clear().onsuccess = win;

      } catch(e) {
        fail();
      }
      return this;
    }

  };

})());

Lawnchair.adapter('localFileStorage', (function () {
  // private methods

  function doLog(mess){
    if(console){
      console.log(mess);
    }
  }

  var fail = function (e, i) {
    if(console) console.log('error in file system adapter !', e, i);
    else throw e;
  };


  function filenameForKey(key, cb) {
    key = $fh.app_props.appid + key;

    $fh.hash({
      algorithm: "MD5",
      text: key
    }, function(result) {
      var filename = result.hashvalue + '.txt';
      if (typeof navigator.externalstorage !== "undefined") {
        navigator.externalstorage.enable(function handleSuccess(res){
          var path = filename;
          if(res.path ) {
            path = res.path;
            if(!path.match(/\/$/)) {
              path += '/';
            }
            path += filename;
          }
          filename = path;
          return cb(filename);
        },function handleError(err){
          return cb(filename);
        })
      } else {
        doLog('filenameForKey key=' + key+ ' , Filename: ' + filename);
        return cb(filename);
      }
    });
  }

  return {

    valid: function () { return !!(window.requestFileSystem) },

    init : function (options, callback){
      //calls the parent function fn and applies this scope
      if(options && 'function' === typeof options.fail ) fail = options.fail;
      if (callback) this.fn(this.name, callback).call(this, this);
    },

    keys: function (callback){
      throw "Currently not supported";
    },

    save : function (obj, callback){
      var key = obj.key;
      var value = obj.val||obj.value;
      filenameForKey(key, function(hash) {
        window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function gotFS(fileSystem) {

          fileSystem.root.getFile(hash, {
            create: true
          }, function gotFileEntry(fileEntry) {
            fileEntry.createWriter(function gotFileWriter(writer) {
              writer.onwrite = function() {
                return callback({
                  key: key,
                  val: value
                });
              };
              writer.write(value);
            }, function() {
              fail('[save] Failed to create file writer');
            });
          }, function() {
            fail('[save] Failed to getFile');
          });
        }, function() {
          fail('[save] Failed to requestFileSystem');
        });
      });
    },

    batch : function (records, callback){
      throw "Currently not supported";
    },

    get : function (key, callback){
      filenameForKey(key, function(hash) {
        window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function gotFS(fileSystem) {
          fileSystem.root.getFile(hash, {}, function gotFileEntry(fileEntry) {
            fileEntry.file(function gotFile(file) {
              var reader = new FileReader();
              reader.onloadend = function (evt) {
                var text = evt.target.result;
                // Check for URLencoded
                // PG 2.2 bug in readAsText()
                try {
                  text = decodeURIComponent(text);
                } catch (e) {
                  // Swallow exception if not URLencoded
                  // Just use the result
                }
                return callback({
                  key: key,
                  val: text
                });
              };
              reader.readAsText(file);
            }, function() {
              fail('[load] Failed to getFile');
            });
          }, function() {
            // Success callback on key load failure
            callback({
              key: key,
              val: null
            });
          });
        }, function() {
          fail('[load] Failed to get fileSystem');
        });
      });
    },

    exists : function (key, callback){
      filenameForKey(key,function (hash){
        window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function gotFS(fileSystem) {
          fileSystem.root.getFile(hash, {},
            function gotFileEntry(fileEntry) {
              return callback(true);
            }, function (err){
              return callback(false);
            });
        });
      });
    },

    all : function (callback){
      throw "Currently not supported";
    },

    remove : function (key, callback){
      filenameForKey(key, function(hash) {

        window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function gotFS(fileSystem) {
          fileSystem.root.getFile(hash, {}, function gotFileEntry(fileEntry) {

            fileEntry.remove(function() {
              return callback({
                key: key,
                val: null
              });
            }, function() {
              fail('[remove] Failed to remove file');
            });
          }, function() {
            fail('[remove] Failed to getFile');
          });
        }, function() {
          fail('[remove] Failed to get fileSystem');
        });
      });
    },

    nuke : function (callback){
      throw "Currently not supported";
    }


  };

}()));

/**
 * dom storage adapter
 * ===
 * - originally authored by Joseph Pecoraro
 *
 */
//
// TODO does it make sense to be chainable all over the place?
// chainable: nuke, remove, all, get, save, all    
// not chainable: valid, keys
//
Lawnchair.adapter('dom', (function() {
  var storage = window.localStorage
  // the indexer is an encapsulation of the helpers needed to keep an ordered index of the keys
  var indexer = function(name) {
    return {
      // the key
      key: name + '._index_',
      // returns the index
      all: function() {
        var a  = storage.getItem(this.key)
        if (a) {
          a = JSON.parse(a)
        }
        if (a === null) storage.setItem(this.key, JSON.stringify([])) // lazy init
        return JSON.parse(storage.getItem(this.key))
      },
      // adds a key to the index
      add: function (key) {
        var a = this.all()
        a.push(key)
        storage.setItem(this.key, JSON.stringify(a))
      },
      // deletes a key from the index
      del: function (key) {
        var a = this.all(), r = []
        // FIXME this is crazy inefficient but I'm in a strata meeting and half concentrating
        for (var i = 0, l = a.length; i < l; i++) {
          if (a[i] != key) r.push(a[i])
        }
        storage.setItem(this.key, JSON.stringify(r))
      },
      // returns index for a key
      find: function (key) {
        var a = this.all()
        for (var i = 0, l = a.length; i < l; i++) {
          if (key === a[i]) return i
        }
        return false
      }
    }
  }

  // adapter api
  return {

    // ensure we are in an env with localStorage
    valid: function () {
      return !!storage && function() {
        // in mobile safari if safe browsing is enabled, window.storage
        // is defined but setItem calls throw exceptions.
        var success = true
        var value = Math.random()
        try {
          storage.setItem(value, value)
        } catch (e) {
          success = false
        }
        storage.removeItem(value)
        return success
      }()
    },

    init: function (options, callback) {
      this.indexer = indexer(this.name)
      if (callback) this.fn(this.name, callback).call(this, this)
    },

    save: function (obj, callback) {
      var key = obj.key ? this.name + '.' + obj.key : this.name + '.' + this.uuid()
      // now we kil the key and use it in the store colleciton
      delete obj.key;
      storage.setItem(key, JSON.stringify(obj))
      // if the key is not in the index push it on
      if (this.indexer.find(key) === false) this.indexer.add(key)
      obj.key = key.slice(this.name.length + 1)
      if (callback) {
        this.lambda(callback).call(this, obj)
      }
      return this
    },

    batch: function (ary, callback) {
      var saved = []
      // not particularily efficient but this is more for sqlite situations
      for (var i = 0, l = ary.length; i < l; i++) {
        this.save(ary[i], function(r){
          saved.push(r)
        })
      }
      if (callback) this.lambda(callback).call(this, saved)
      return this
    },

    // accepts [options], callback
    keys: function(callback) {
      if (callback) {
        var name = this.name
        var indices = this.indexer.all();
        var keys = [];
        //Checking for the support of map.
        if(Array.prototype.map) {
          keys = indices.map(function(r){ return r.replace(name + '.', '') })
        } else {
          for (var key in indices) {
            keys.push(key.replace(name + '.', ''));
          }
        }
        this.fn('keys', callback).call(this, keys)
      }
      return this // TODO options for limit/offset, return promise
    },

    get: function (key, callback) {
      if (this.isArray(key)) {
        var r = []
        for (var i = 0, l = key.length; i < l; i++) {
          var k = this.name + '.' + key[i]
          var obj = storage.getItem(k)
          if (obj) {
            obj = JSON.parse(obj)
            obj.key = key[i]
          }
          r.push(obj)
        }
        if (callback) this.lambda(callback).call(this, r)
      } else {
        var k = this.name + '.' + key
        var  obj = storage.getItem(k)
        if (obj) {
          obj = JSON.parse(obj)
          obj.key = key
        }
        if (callback) this.lambda(callback).call(this, obj)
      }
      return this
    },

    exists: function (key, cb) {
      var exists = this.indexer.find(this.name+'.'+key) === false ? false : true ;
      this.lambda(cb).call(this, exists);
      return this;
    },
    // NOTE adapters cannot set this.__results but plugins do
    // this probably should be reviewed
    all: function (callback) {
      var idx = this.indexer.all()
        ,   r   = []
        ,   o
        ,   k
      for (var i = 0, l = idx.length; i < l; i++) {
        k     = idx[i] //v
        o     = JSON.parse(storage.getItem(k))
        o.key = k.replace(this.name + '.', '')
        r.push(o)
      }
      if (callback) this.fn(this.name, callback).call(this, r)
      return this
    },

    remove: function (keyOrArray, callback) {
      var self = this;
      if (this.isArray(keyOrArray)) {
        // batch remove
        var i, done = keyOrArray.length;
        var removeOne = function(i) {
          self.remove(keyOrArray[i], function() {
            if ((--done) > 0) { return; }
            if (callback) {
              self.lambda(callback).call(self);
            }
          });
        };
        for (i=0; i < keyOrArray.length; i++)
          removeOne(i);
        return this;
      }
      var key = this.name + '.' +
        ((keyOrArray.key) ? keyOrArray.key : keyOrArray)
      this.indexer.del(key)
      storage.removeItem(key)
      if (callback) this.lambda(callback).call(this)
      return this
    },

    nuke: function (callback) {
      this.all(function(r) {
        for (var i = 0, l = r.length; i < l; i++) {
          this.remove(r[i]);
        }
        if (callback) this.lambda(callback).call(this)
      })
      return this
    }
  }})());

  Lawnchair.adapter('webkit-sqlite', (function() {
  // private methods
  var fail = function(e, i) {
    if (console) {
      console.log('error in sqlite adaptor!', e, i)
    }
  }, now = function() {
      return new Date()
    } // FIXME need to use better date fn
    // not entirely sure if this is needed...
  if (!Function.prototype.bind) {
    Function.prototype.bind = function(obj) {
      var slice = [].slice,
        args = slice.call(arguments, 1),
        self = this,
        nop = function() {}, bound = function() {
          return self.apply(this instanceof nop ? this : (obj || {}), args.concat(slice.call(arguments)))
        }
      nop.prototype = self.prototype
      bound.prototype = new nop()
      return bound
    }
  }

  // public methods
  return {

    valid: function() {
      return !!(window.openDatabase)
    },

    init: function(options, callback) {
      var that = this,
        cb = that.fn(that.name, callback),
        create = "CREATE TABLE IF NOT EXISTS " + this.record + " (id NVARCHAR(32) UNIQUE PRIMARY KEY, value TEXT, timestamp REAL)",
        win = function() {
          return cb.call(that, that);
        }
        // open a connection and create the db if it doesn't exist
        //FEEDHENRY CHANGE TO ALLOW ERROR CALLBACK
      if (options && 'function' === typeof options.fail) fail = options.fail
        //END CHANGE
      this.db = openDatabase(this.name, '1.0.0', this.name, 65536)
      this.db.transaction(function(t) {
        t.executeSql(create, [], win, fail)
      })
    },

    keys: function(callback) {
      var cb = this.lambda(callback),
        that = this,
        keys = "SELECT id FROM " + this.record + " ORDER BY timestamp DESC"

      this.db.readTransaction(function(t) {
        var win = function(xxx, results) {
          if (results.rows.length == 0) {
            cb.call(that, [])
          } else {
            var r = [];
            for (var i = 0, l = results.rows.length; i < l; i++) {
              r.push(results.rows.item(i).id);
            }
            cb.call(that, r)
          }
        }
        t.executeSql(keys, [], win, fail)
      })
      return this
    },
    // you think thats air you're breathing now?
    save: function(obj, callback, error) {
      var that = this
      objs = (this.isArray(obj) ? obj : [obj]).map(function(o) {
        if (!o.key) {
          o.key = that.uuid()
        }
        return o
      }),
        ins = "INSERT OR REPLACE INTO " + this.record + " (value, timestamp, id) VALUES (?,?,?)",
        win = function() {
          if (callback) {
            that.lambda(callback).call(that, that.isArray(obj) ? objs : objs[0])
          }
        }, error = error || function() {}, insvals = [],
        ts = now()

        try {
          for (var i = 0, l = objs.length; i < l; i++) {
            insvals[i] = [JSON.stringify(objs[i]), ts, objs[i].key];
          }
        } catch (e) {
          fail(e)
          throw e;
        }

      that.db.transaction(function(t) {
        for (var i = 0, l = objs.length; i < l; i++)
          t.executeSql(ins, insvals[i])
      }, function(e, i) {
        fail(e, i)
      }, win)

      return this
    },


    batch: function(objs, callback) {
      return this.save(objs, callback)
    },

    get: function(keyOrArray, cb) {
      var that = this,
        sql = '',
        args = this.isArray(keyOrArray) ? keyOrArray : [keyOrArray];
      // batch selects support
      sql = 'SELECT id, value FROM ' + this.record + " WHERE id IN (" +
        args.map(function() {
        return '?'
      }).join(",") + ")"
      // FIXME
      // will always loop the results but cleans it up if not a batch return at the end..
      // in other words, this could be faster
      var win = function(xxx, results) {
        var o, r, lookup = {}
          // map from results to keys
        for (var i = 0, l = results.rows.length; i < l; i++) {
          o = JSON.parse(results.rows.item(i).value)
          o.key = results.rows.item(i).id
          lookup[o.key] = o;
        }
        r = args.map(function(key) {
          return lookup[key];
        });
        if (!that.isArray(keyOrArray)) r = r.length ? r[0] : null
        if (cb) that.lambda(cb).call(that, r)
      }
      this.db.readTransaction(function(t) {
        t.executeSql(sql, args, win, fail)
      })
      return this
    },

    exists: function(key, cb) {
      var is = "SELECT * FROM " + this.record + " WHERE id = ?",
        that = this,
        win = function(xxx, results) {
          if (cb) that.fn('exists', cb).call(that, (results.rows.length > 0))
        }
      this.db.readTransaction(function(t) {
        t.executeSql(is, [key], win, fail)
      })
      return this
    },

    all: function(callback) {
      var that = this,
        all = "SELECT * FROM " + this.record,
        r = [],
        cb = this.fn(this.name, callback) || undefined,
        win = function(xxx, results) {
          if (results.rows.length != 0) {
            for (var i = 0, l = results.rows.length; i < l; i++) {
              var obj = JSON.parse(results.rows.item(i).value)
              obj.key = results.rows.item(i).id
              r.push(obj)
            }
          }
          if (cb) cb.call(that, r)
        }

      this.db.readTransaction(function(t) {
        t.executeSql(all, [], win, fail)
      })
      return this
    },

    remove: function(keyOrArray, cb) {
      var that = this,
        args, sql = "DELETE FROM " + this.record + " WHERE id ",
        win = function() {
          if (cb) that.lambda(cb).call(that)
        }
      if (!this.isArray(keyOrArray)) {
        sql += '= ?';
        args = [keyOrArray];
      } else {
        args = keyOrArray;
        sql += "IN (" +
          args.map(function() {
          return '?'
        }).join(',') +
          ")";
      }
      args = args.map(function(obj) {
        return obj.key ? obj.key : obj;
      });

      this.db.transaction(function(t) {
        t.executeSql(sql, args, win, fail);
      });

      return this;
    },

    nuke: function(cb) {
      var nuke = "DELETE FROM " + this.record,
        that = this,
        win = cb ? function() {
        that.lambda(cb).call(that)
      } : function() {}
      this.db.transaction(function(t) {
        t.executeSql(nuke, [], win, fail)
      })
      return this
    }
  }
})());

// window.name code courtesy Remy Sharp: http://24ways.org/2009/breaking-out-the-edges-of-the-browser
Lawnchair.adapter('window-name', (function() {
  if (typeof window==='undefined') {
    window = { top: { } }; // node/optimizer compatibility
  }

  // edited from the original here by elsigh
  // Some sites store JSON data in window.top.name, but some folks (twitter on iPad)
  // put simple strings in there - we should make sure not to cause a SyntaxError.
  var data = {}
  try {
    data = JSON.parse(window.top.name)
  } catch (e) {}


  return {

    valid: function () {
      return typeof window.top.name != 'undefined'
    },

    init: function (options, callback) {
      data[this.name] = data[this.name] || {index:[],store:{}}
      this.index = data[this.name].index
      this.store = data[this.name].store
      this.fn(this.name, callback).call(this, this)
      return this
    },

    keys: function (callback) {
      this.fn('keys', callback).call(this, this.index)
      return this
    },

    save: function (obj, cb) {
      // data[key] = value + ''; // force to string
      // window.top.name = JSON.stringify(data);
      var key = obj.key || this.uuid()
      this.exists(key, function(exists) {
        if (!exists) {
          if (obj.key) delete obj.key
          this.index.push(key)
        }
        this.store[key] = obj

        try {
          window.top.name = JSON.stringify(data) // TODO wow, this is the only diff from the memory adapter
        } catch(e) {
          // restore index/store to previous value before JSON exception
          if (!exists) {
            this.index.pop();
            delete this.store[key];
          }
          throw e;
        }

        if (cb) {
          obj.key = key
          this.lambda(cb).call(this, obj)
        }
      })
      return this
    },

    batch: function (objs, cb) {
      var r = []
      for (var i = 0, l = objs.length; i < l; i++) {
        this.save(objs[i], function(record) {
          r.push(record)
        })
      }
      if (cb) this.lambda(cb).call(this, r)
      return this
    },

    get: function (keyOrArray, cb) {
      var r;
      if (this.isArray(keyOrArray)) {
        r = []
        for (var i = 0, l = keyOrArray.length; i < l; i++) {
          r.push(this.store[keyOrArray[i]])
        }
      } else {
        r = this.store[keyOrArray]
        if (r) r.key = keyOrArray
      }
      if (cb) this.lambda(cb).call(this, r)
      return this
    },

    exists: function (key, cb) {
      this.lambda(cb).call(this, !!(this.store[key]))
      return this
    },

    all: function (cb) {
      var r = []
      for (var i = 0, l = this.index.length; i < l; i++) {
        var obj = this.store[this.index[i]]
        obj.key = this.index[i]
        r.push(obj)
      }
      this.fn(this.name, cb).call(this, r)
      return this
    },

    remove: function (keyOrArray, cb) {
      var del = this.isArray(keyOrArray) ? keyOrArray : [keyOrArray]
      for (var i = 0, l = del.length; i < l; i++) {
        var key = del[i].key ? del[i].key : del[i]
        var where = this.indexOf(this.index, key)
        if (where < 0) continue /* key not present */
        delete this.store[key]
        this.index.splice(where, 1)
      }
      window.top.name = JSON.stringify(data)
      if (cb) this.lambda(cb).call(this)
      return this
    },

    nuke: function (cb) {
      this.store = data[this.name].store = {}
      this.index = data[this.name].index = []
      window.top.name = JSON.stringify(data)
      if (cb) this.lambda(cb).call(this)
      return this
    }
  }
/////
})())
; browserify_shim__define__module__export__(typeof Lawnchair != "undefined" ? Lawnchair : window.Lawnchair);

}).call(global, undefined, undefined, undefined, function defineExport(ex) { module.exports = ex; });

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],"Lawnchair":[function(_dereq_,module,exports){
module.exports=_dereq_('Z3sPFr');
},{}],5:[function(_dereq_,module,exports){
// http://wiki.commonjs.org/wiki/Unit_Testing/1.0
//
// THIS IS NOT TESTED NOR LIKELY TO WORK OUTSIDE V8!
//
// Originally from narwhal.js (http://narwhaljs.org)
// Copyright (c) 2009 Thomas Robinson <280north.com>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the 'Software'), to
// deal in the Software without restriction, including without limitation the
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
// sell copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
// ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

// when used in node, this will actually load the util module we depend on
// versus loading the builtin util module as happens otherwise
// this is a bug in node module loading as far as I am concerned
var util = _dereq_('util/');

var pSlice = Array.prototype.slice;
var hasOwn = Object.prototype.hasOwnProperty;

// 1. The assert module provides functions that throw
// AssertionError's when particular conditions are not met. The
// assert module must conform to the following interface.

var assert = module.exports = ok;

// 2. The AssertionError is defined in assert.
// new assert.AssertionError({ message: message,
//                             actual: actual,
//                             expected: expected })

assert.AssertionError = function AssertionError(options) {
  this.name = 'AssertionError';
  this.actual = options.actual;
  this.expected = options.expected;
  this.operator = options.operator;
  if (options.message) {
    this.message = options.message;
    this.generatedMessage = false;
  } else {
    this.message = getMessage(this);
    this.generatedMessage = true;
  }
  var stackStartFunction = options.stackStartFunction || fail;

  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, stackStartFunction);
  }
  else {
    // non v8 browsers so we can have a stacktrace
    var err = new Error();
    if (err.stack) {
      var out = err.stack;

      // try to strip useless frames
      var fn_name = stackStartFunction.name;
      var idx = out.indexOf('\n' + fn_name);
      if (idx >= 0) {
        // once we have located the function frame
        // we need to strip out everything before it (and its line)
        var next_line = out.indexOf('\n', idx + 1);
        out = out.substring(next_line + 1);
      }

      this.stack = out;
    }
  }
};

// assert.AssertionError instanceof Error
util.inherits(assert.AssertionError, Error);

function replacer(key, value) {
  if (util.isUndefined(value)) {
    return '' + value;
  }
  if (util.isNumber(value) && (isNaN(value) || !isFinite(value))) {
    return value.toString();
  }
  if (util.isFunction(value) || util.isRegExp(value)) {
    return value.toString();
  }
  return value;
}

function truncate(s, n) {
  if (util.isString(s)) {
    return s.length < n ? s : s.slice(0, n);
  } else {
    return s;
  }
}

function getMessage(self) {
  return truncate(JSON.stringify(self.actual, replacer), 128) + ' ' +
         self.operator + ' ' +
         truncate(JSON.stringify(self.expected, replacer), 128);
}

// At present only the three keys mentioned above are used and
// understood by the spec. Implementations or sub modules can pass
// other keys to the AssertionError's constructor - they will be
// ignored.

// 3. All of the following functions must throw an AssertionError
// when a corresponding condition is not met, with a message that
// may be undefined if not provided.  All assertion methods provide
// both the actual and expected values to the assertion error for
// display purposes.

function fail(actual, expected, message, operator, stackStartFunction) {
  throw new assert.AssertionError({
    message: message,
    actual: actual,
    expected: expected,
    operator: operator,
    stackStartFunction: stackStartFunction
  });
}

// EXTENSION! allows for well behaved errors defined elsewhere.
assert.fail = fail;

// 4. Pure assertion tests whether a value is truthy, as determined
// by !!guard.
// assert.ok(guard, message_opt);
// This statement is equivalent to assert.equal(true, !!guard,
// message_opt);. To test strictly for the value true, use
// assert.strictEqual(true, guard, message_opt);.

function ok(value, message) {
  if (!value) fail(value, true, message, '==', assert.ok);
}
assert.ok = ok;

// 5. The equality assertion tests shallow, coercive equality with
// ==.
// assert.equal(actual, expected, message_opt);

assert.equal = function equal(actual, expected, message) {
  if (actual != expected) fail(actual, expected, message, '==', assert.equal);
};

// 6. The non-equality assertion tests for whether two objects are not equal
// with != assert.notEqual(actual, expected, message_opt);

assert.notEqual = function notEqual(actual, expected, message) {
  if (actual == expected) {
    fail(actual, expected, message, '!=', assert.notEqual);
  }
};

// 7. The equivalence assertion tests a deep equality relation.
// assert.deepEqual(actual, expected, message_opt);

assert.deepEqual = function deepEqual(actual, expected, message) {
  if (!_deepEqual(actual, expected)) {
    fail(actual, expected, message, 'deepEqual', assert.deepEqual);
  }
};

function _deepEqual(actual, expected) {
  // 7.1. All identical values are equivalent, as determined by ===.
  if (actual === expected) {
    return true;

  } else if (util.isBuffer(actual) && util.isBuffer(expected)) {
    if (actual.length != expected.length) return false;

    for (var i = 0; i < actual.length; i++) {
      if (actual[i] !== expected[i]) return false;
    }

    return true;

  // 7.2. If the expected value is a Date object, the actual value is
  // equivalent if it is also a Date object that refers to the same time.
  } else if (util.isDate(actual) && util.isDate(expected)) {
    return actual.getTime() === expected.getTime();

  // 7.3 If the expected value is a RegExp object, the actual value is
  // equivalent if it is also a RegExp object with the same source and
  // properties (`global`, `multiline`, `lastIndex`, `ignoreCase`).
  } else if (util.isRegExp(actual) && util.isRegExp(expected)) {
    return actual.source === expected.source &&
           actual.global === expected.global &&
           actual.multiline === expected.multiline &&
           actual.lastIndex === expected.lastIndex &&
           actual.ignoreCase === expected.ignoreCase;

  // 7.4. Other pairs that do not both pass typeof value == 'object',
  // equivalence is determined by ==.
  } else if (!util.isObject(actual) && !util.isObject(expected)) {
    return actual == expected;

  // 7.5 For all other Object pairs, including Array objects, equivalence is
  // determined by having the same number of owned properties (as verified
  // with Object.prototype.hasOwnProperty.call), the same set of keys
  // (although not necessarily the same order), equivalent values for every
  // corresponding key, and an identical 'prototype' property. Note: this
  // accounts for both named and indexed properties on Arrays.
  } else {
    return objEquiv(actual, expected);
  }
}

function isArguments(object) {
  return Object.prototype.toString.call(object) == '[object Arguments]';
}

function objEquiv(a, b) {
  if (util.isNullOrUndefined(a) || util.isNullOrUndefined(b))
    return false;
  // an identical 'prototype' property.
  if (a.prototype !== b.prototype) return false;
  //~~~I've managed to break Object.keys through screwy arguments passing.
  //   Converting to array solves the problem.
  if (isArguments(a)) {
    if (!isArguments(b)) {
      return false;
    }
    a = pSlice.call(a);
    b = pSlice.call(b);
    return _deepEqual(a, b);
  }
  try {
    var ka = objectKeys(a),
        kb = objectKeys(b),
        key, i;
  } catch (e) {//happens when one is a string literal and the other isn't
    return false;
  }
  // having the same number of owned properties (keys incorporates
  // hasOwnProperty)
  if (ka.length != kb.length)
    return false;
  //the same set of keys (although not necessarily the same order),
  ka.sort();
  kb.sort();
  //~~~cheap key test
  for (i = ka.length - 1; i >= 0; i--) {
    if (ka[i] != kb[i])
      return false;
  }
  //equivalent values for every corresponding key, and
  //~~~possibly expensive deep test
  for (i = ka.length - 1; i >= 0; i--) {
    key = ka[i];
    if (!_deepEqual(a[key], b[key])) return false;
  }
  return true;
}

// 8. The non-equivalence assertion tests for any deep inequality.
// assert.notDeepEqual(actual, expected, message_opt);

assert.notDeepEqual = function notDeepEqual(actual, expected, message) {
  if (_deepEqual(actual, expected)) {
    fail(actual, expected, message, 'notDeepEqual', assert.notDeepEqual);
  }
};

// 9. The strict equality assertion tests strict equality, as determined by ===.
// assert.strictEqual(actual, expected, message_opt);

assert.strictEqual = function strictEqual(actual, expected, message) {
  if (actual !== expected) {
    fail(actual, expected, message, '===', assert.strictEqual);
  }
};

// 10. The strict non-equality assertion tests for strict inequality, as
// determined by !==.  assert.notStrictEqual(actual, expected, message_opt);

assert.notStrictEqual = function notStrictEqual(actual, expected, message) {
  if (actual === expected) {
    fail(actual, expected, message, '!==', assert.notStrictEqual);
  }
};

function expectedException(actual, expected) {
  if (!actual || !expected) {
    return false;
  }

  if (Object.prototype.toString.call(expected) == '[object RegExp]') {
    return expected.test(actual);
  } else if (actual instanceof expected) {
    return true;
  } else if (expected.call({}, actual) === true) {
    return true;
  }

  return false;
}

function _throws(shouldThrow, block, expected, message) {
  var actual;

  if (util.isString(expected)) {
    message = expected;
    expected = null;
  }

  try {
    block();
  } catch (e) {
    actual = e;
  }

  message = (expected && expected.name ? ' (' + expected.name + ').' : '.') +
            (message ? ' ' + message : '.');

  if (shouldThrow && !actual) {
    fail(actual, expected, 'Missing expected exception' + message);
  }

  if (!shouldThrow && expectedException(actual, expected)) {
    fail(actual, expected, 'Got unwanted exception' + message);
  }

  if ((shouldThrow && actual && expected &&
      !expectedException(actual, expected)) || (!shouldThrow && actual)) {
    throw actual;
  }
}

// 11. Expected to throw an error:
// assert.throws(block, Error_opt, message_opt);

assert.throws = function(block, /*optional*/error, /*optional*/message) {
  _throws.apply(this, [true].concat(pSlice.call(arguments)));
};

// EXTENSION! This is annoying to write outside this module.
assert.doesNotThrow = function(block, /*optional*/message) {
  _throws.apply(this, [false].concat(pSlice.call(arguments)));
};

assert.ifError = function(err) { if (err) {throw err;}};

var objectKeys = Object.keys || function (obj) {
  var keys = [];
  for (var key in obj) {
    if (hasOwn.call(obj, key)) keys.push(key);
  }
  return keys;
};

},{"util/":7}],6:[function(_dereq_,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],7:[function(_dereq_,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = _dereq_('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = _dereq_('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,_dereq_("/Users/weili/work/fh-sdks/fh-js-sdk/node_modules/grunt-browserify/node_modules/browserify/node_modules/insert-module-globals/node_modules/process/browser.js"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./support/isBuffer":6,"/Users/weili/work/fh-sdks/fh-js-sdk/node_modules/grunt-browserify/node_modules/browserify/node_modules/insert-module-globals/node_modules/process/browser.js":10,"inherits":9}],8:[function(_dereq_,module,exports){
(function (global){
/*global window, global*/
var util = _dereq_("util")
var assert = _dereq_("assert")

var slice = Array.prototype.slice
var console
var times = {}

if (typeof global !== "undefined" && global.console) {
    console = global.console
} else if (typeof window !== "undefined" && window.console) {
    console = window.console
} else {
    console = {}
}

var functions = [
    [log, "log"]
    , [info, "info"]
    , [warn, "warn"]
    , [error, "error"]
    , [time, "time"]
    , [timeEnd, "timeEnd"]
    , [trace, "trace"]
    , [dir, "dir"]
    , [assert, "assert"]
]

for (var i = 0; i < functions.length; i++) {
    var tuple = functions[i]
    var f = tuple[0]
    var name = tuple[1]

    if (!console[name]) {
        console[name] = f
    }
}

module.exports = console

function log() {}

function info() {
    console.log.apply(console, arguments)
}

function warn() {
    console.log.apply(console, arguments)
}

function error() {
    console.warn.apply(console, arguments)
}

function time(label) {
    times[label] = Date.now()
}

function timeEnd(label) {
    var time = times[label]
    if (!time) {
        throw new Error("No such label: " + label)
    }

    var duration = Date.now() - time
    console.log(label + ": " + duration + "ms")
}

function trace() {
    var err = new Error()
    err.name = "Trace"
    err.message = util.format.apply(null, arguments)
    console.error(err.stack)
}

function dir(object) {
    console.log(util.inspect(object) + "\n")
}

function assert(expression) {
    if (!expression) {
        var arr = slice.call(arguments, 1)
        assert.ok(false, util.format.apply(null, arr))
    }
}

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"assert":5,"util":12}],9:[function(_dereq_,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],10:[function(_dereq_,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],11:[function(_dereq_,module,exports){
module.exports=_dereq_(6)
},{}],12:[function(_dereq_,module,exports){
module.exports=_dereq_(7)
},{"./support/isBuffer":11,"/Users/weili/work/fh-sdks/fh-js-sdk/node_modules/grunt-browserify/node_modules/browserify/node_modules/insert-module-globals/node_modules/process/browser.js":10,"inherits":9}],13:[function(_dereq_,module,exports){
var constants = _dereq_("./modules/constants");
var console = _dereq_("console");
var cloud = _dereq_("./modules/waitForCloud");
var api_act = _dereq_("./modules/api_act");
var api_auth = _dereq_("./modules/api_auth");

var defaultFail = function(msg, error){
  console.log(msg + ":" + JSON.stringify(error));
}

var init = function(opts, success, fail){
  console.warn("$fh.init has been deprecated.");
  cloud.wait(function(){
    if(typeof success === "function"){
      success(cloud.getCloudHostUrl());
    }
  });
}

var act = api_act;
var auth = api_auth;

var cloudFunc = function(act_name, params, cb){
  var funcName = act_name;
  var data = params;
  var callback = cb;
  if(typeof params === "function"){
    data = {};
    callback = params;
  }
  var reqParams = {act: funcName, req: data};
  act(reqParams, function(res){
    return callback(null, res);
  }, function(msg, error){
    return callback(error);
  });
}

var $fh = window.$fh || {};
$fh.init = init;
$fh.act = act;
$fh.auth = auth;
$fh.cloud = cloudFunc;

module.exports = $fh;







},{"./modules/api_act":16,"./modules/api_auth":17,"./modules/constants":19,"./modules/waitForCloud":34,"console":8}],14:[function(_dereq_,module,exports){
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

module.exports = XDomainRequestWrapper;

},{}],15:[function(_dereq_,module,exports){
var XDomainRequestWrapper = _dereq_("./XDomainRequestWrapper");
var loadScript = _dereq_("./loadScript");
var so = _dereq_("./sameOrigin");
var console = _dereq_("console");
var JSON = _dereq_("JSON");

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
  if (sameOrigin || ((!sameOrigin) && cors_supported) ) {
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

},{"./XDomainRequestWrapper":14,"./loadScript":28,"./sameOrigin":31,"JSON":"rfnvHI","console":8}],16:[function(_dereq_,module,exports){
var console =_dereq_("console");
var cloud = _dereq_("./waitForCloud");
var fhparams = _dereq_("./fhparams");
var ajax = _dereq_("./ajax");
var JSON = _dereq_("JSON");
var handleError = _dereq_("./handleError");

function doActCall(opts, success, fail){
  var cloud_host = cloud.getCloudHost();
  var app_props = cloud.getAppProps();
  var url = cloud_host.getActUrl(app_props, opts.act);
  var params = opts.req || {};
  params = fhparams.addDefaultParams(app_props, params);
  return ajax({
    "url": url,
    "type": "POST",
    "data": JSON.stringify(params),
    "contentType": "application/json",
    "timeout": opts.timeout,
    "success": function(res){
      if(success){
        return success(res);
      }
    },
    "error": function(req, statusText, error){
      handleError(fail, req, statusText);
    }
  })
}

module.exports = function(opts, success, fail){
  if(!fail){
    fail = function(msg, error){
      console.log(msg + ":" + JSON.stringify(error));
    };
  }

  if(!opts.act){
    return fail('act_no_action', {});
  }

  cloud.wait(function(err, cloudHost){
    console.log("Calling fhact now");
    if(err){
      return fail(err.message, err);
    } else {
      doActCall(opts, success, fail);
    }
  })
}
},{"./ajax":15,"./fhparams":23,"./handleError":25,"./waitForCloud":34,"JSON":"rfnvHI","console":8}],17:[function(_dereq_,module,exports){
var console =_dereq_("console");
var cloud = _dereq_("./waitForCloud");
var fhparams = _dereq_("./fhparams");
var ajax = _dereq_("./ajax");
var JSON = _dereq_("JSON");
var handleError = _dereq_("./handleError");
var device = _dereq_("./device");
var constants = _dereq_("./constants");
var checkAuth = _dereq_("./checkAuth");

module.exports = function(opts, success, fail){
  if(!fail){
    fail = function(msg, error){
      console.log(msg + ":" + JSON.stringify(error));
    };
  }
  if (!opts.policyId) {
    return fail('auth_no_policyId', {});
  }
  if (!opts.clientToken) {
    return fail('auth_no_clientToken', {});
  }

  cloud.wait(function(err, data){
    if(err){
      return fail(err.message, err);
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
      req.device = device.getDeviceId();
      var app_props = cloud.getAppProps();
      var path = app_props.host + constants.boxprefix + "admin/authpolicy/auth";
      req = fhparams.addDefaultParams(app_props, req);

      ajax({
        "url": path,
        "type": "POST",
        "data": JSON.stringify(req),
        "contentType": "application/json",
        "timeout" : opts.timeout || app_props.timeout || constants.fh_timeout,
        success: function(res) {
          checkAuth.handleAuthResponse(endurl, res, success, fail);
        },
        error: function(req, statusText, error) {
          handleError(fail, req, statusText);
        }
      });
    }
  });
}
},{"./ajax":15,"./checkAuth":18,"./constants":19,"./device":21,"./fhparams":23,"./handleError":25,"./waitForCloud":34,"JSON":"rfnvHI","console":8}],18:[function(_dereq_,module,exports){
var console = _dereq_("console");
var queryMap = _dereq_("./queryMap");
var JSON = _dereq_("JSON");

var checkAuth = function(url) {
  if (/\_fhAuthCallback/.test(url)) {
    var qmap = queryMap(url);
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

var handleAuthResponse = function(endurl, res, success, fail){
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

//This is mainly for using $fh.auth inside browsers. If the authentication method is OAuth, at the end of the process, the user will be re-directed to
//a url that we specified for checking if the auth is successful. So we always check the url to see if we are on the re-directed page.
if (window.addEventListener) {
  window.addEventListener('load', function(){
    checkAuth(window.location.href);
  }, false); //W3C
} else {
  window.attachEvent('onload', function(){
    checkAuth(window.location.href);
  }); //IE
}

module.exports = {
  "handleAuthResponse": handleAuthResponse
};

},{"./queryMap":30,"JSON":"rfnvHI","console":8}],19:[function(_dereq_,module,exports){
module.exports = {
  "fh_timeout": 20000,
  "boxprefix": "/box/srv/1.1/",
  "sdk_version": "BUILD_VERSION",
  "config_js":"fhconfig.js"
}
},{}],20:[function(_dereq_,module,exports){
var console = _dereq_("console");
module.exports = {
  readCookieValue  : function (cookie_name) {
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
  },

  createCookie : function (cookie_name, cookie_value) {
    var date = new Date();
    date.setTime(date.getTime() + 36500 * 24 * 60 * 60 * 1000); //100 years
    var expires = "; expires=" + date.toGMTString();
    document.cookie = cookie_name + "=" + cookie_value + expires + "; path = /";
  }
};

},{"console":8}],21:[function(_dereq_,module,exports){
var cookies = _dereq_("./cookies");
var uuidModule = _dereq_("./uuid");
var console = _dereq_("console");

module.exports = {
  //try to get the unique device identifier
  "getDeviceId": function(){
    //check for cordova/phonegap first
    if(typeof window.fhdevice !== "undefined" && typeof window.fhdevice.uuid !== "undefined"){
      return window.fhdevice.uuid;
    } else if(typeof window.device !== "undefined" && typeof window.device.uuid !== "undefined"){
      return window.device.uuid;
    }  else if(typeof navigator.device !== "undefined" && typeof navigator.device.uuid !== "undefined"){
      return navigator.device.uuid;
    } else {
      var _mock_uuid_cookie_name = "mock_uuid";
      var uuid = cookies.readCookieValue(_mock_uuid_cookie_name);
      if(null == uuid){
          uuid = uuidModule.createUUID();
          cookies.createCookie(_mock_uuid_cookie_name, uuid);
      }
      return uuid;
    }
  },

  //this is for fixing analytics issues when upgrading from io6 to ios7. Probably can be deprecated now
  "getCuidMap": function(){
    if(typeof window.fhdevice !== "undefined" && typeof window.fhdevice.cuidMap !== "undefined"){
      return window.fhdevice.cuidMap;
    } else if(typeof window.device !== "undefined" && typeof window.device.cuidMap !== "undefined"){
      return window.device.cuidMap;
    }  else if(typeof navigator.device !== "undefined" && typeof navigator.device.cuidMap !== "undefined"){
      return navigator.device.cuidMap;
    }

    return null;
  },

  "getDestination": function(){
    var destination = null;
    var platformsToTest = _dereq_("./platformsMap");


    var userAgent = navigator.userAgent;

    if (typeof window.fh_destination_code !== 'undefined') {
      destination = window.fh_destination_code;
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
  }
}

},{"./cookies":20,"./platformsMap":29,"./uuid":33,"console":8}],22:[function(_dereq_,module,exports){
var createEvent = function(type, data) {
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

var fireEvent = function(type, data){
  var event = createEvent(type, data);
  document.dispatchEvent(event);
};

module.exports = {
  "createEvent": createEvent,
  "fireEvent": fireEvent
}
},{}],23:[function(_dereq_,module,exports){
var device = _dereq_("./device");
var sdkversion = _dereq_("./sdkversion");

var defaultParams = null;
//TODO: review these options, we probably only needs all of them for init calls, but we shouldn't need all of them for act calls
var buildParams = function(app_props){
  if(defaultParams){
    return defaultParams;
  }
  var fhparams = {};
  fhparams.cuid = device.getDeviceId();
  fhparams.cuidMap = device.getCuidMap();
  fhparams.appid = app_props.appid;
  fhparams.appkey = app_props.appkey;
  fhparams.projectid = app_props.projectid;
  fhparams.analyticsTag =  app_props.analyticsTag;
  fhparams.init = app_props.init;
  fhparams.destination = device.getDestination();
  fhparams.connectiontag = app_props.connectiontag;
  if(window.device || navigator.device){
    fhparams.device = window.device || navigator.device;
  }

  //backward compatible
  if (typeof window.fh_app_version !== 'undefined'){
    fhparams.app_version = fh_app_version;
  }
  if (typeof window.fh_project_version !== 'undefined'){
    fhparams.project_version = fh_project_version;
  }
  if (typeof window.fh_project_app_version !== 'undefined'){
    fhparams.project_app_version = fh_project_app_version;
  }
  fhparams.sdk_version = sdkversion();
  defaultParams = fhparams;
  return fhparams;
}

var addDefaultParams = function(app_props, params){
  var params = params || {};
  params.__fh = buildParams(app_props);
  return params;
}

module.exports = {
  "buildParams": buildParams,
  "addDefaultParams": addDefaultParams
}

},{"./device":21,"./sdkversion":32}],24:[function(_dereq_,module,exports){
module.exports = function(){
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

},{}],25:[function(_dereq_,module,exports){
var JSON = _dereq_("JSON");

module.exports = function(fail, req, resStatus){
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

},{"JSON":"rfnvHI"}],26:[function(_dereq_,module,exports){
var constants = _dereq_("./constants");

function CloudHost(cloud_props){
  this.cloud_props = cloud_props;
  this.cloud_host = undefined;
  this.isLegacy = false;
}

CloudHost.prototype.getHost = function(appType){
  if(this.cloud_host){
    return this.cloud_host;
  } else {
    var url;
    var app_type;
    if(this.cloud_props && this.cloud_props.hosts){
      url = this.cloud_props.hosts.url;

      if (typeof url === 'undefined') {
        // resolve url the old way i.e. depending on
        // -burnt in app mode
        // -returned dev or live url
        // -returned dev or live type (node or fh(rhino or proxying))
        var cloud_host = this.cloud_props.hosts.releaseCloudUrl;
        app_type = this.cloud_props.hosts.releaseCloudType;

        if(typeof appType !== "undefined" && appType.indexOf("dev") > -1){
          cloud_host = this.cloud_props.hosts.debugCloudUrl;
          app_type = this.cloud_props.hosts.debugCloudType;
        }
        url = cloud_host;
      }
    }
    this.cloud_host = url;
    if(app_type === "fh"){
      this.isLegacy = true;
    }
    return url;
  }
}

CloudHost.prototype.getActUrl = function(appProps, act){
  if(typeof this.cloud_host === "undefined"){
    this.getHost(appProps.mode);
  }
  if(this.isLegacy){
    return this.cloud_host + constants.boxprefix + "act/" + this.cloud_props.domain + "/" + appProps.appid + "/" + act + "/" + appProps.appid;
  } else {
    return this.cloud_host + "/cloud/" + act;
  }
}

module.exports = CloudHost;
},{"./constants":19}],27:[function(_dereq_,module,exports){
var findFHPath = _dereq_("./findFHPath");
var loadScript = _dereq_("./loadScript");
var Lawnchair = _dereq_('Lawnchair');
var consts = _dereq_("./constants");
var fhparams = _dereq_("./fhparams");
var ajax = _dereq_("./ajax");
var handleError = _dereq_("./handleError");
var console = _dereq_("console");
var JSON = _dereq_("JSON");

var init = function(conf_path, callback){
  console.log("start to load app_props");
  ajax({url: consts.config_js, contentType:"script", success: function(data){
    console.log("fhconfig = " + JSON.stringify(data));
    loadCloudProps(data, callback);
  }, error: function(req, statusText, error){
    console.error("failed to load fhconfig");
    callback(error);
  }});
}

var loadCloudProps = function(app_props, callback){
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

  var path = app_props.host + consts.boxprefix + "app/init";
  
  storage.get('fh_init', function(storage_res) {
    var savedHost = null;
    if (storage_res && storage_res.value !== null) {
      if(storage_res.value.init){
        app_props.init = storage_res.value.init;
      } else {
        //keep it backward compatible.
        app_props.init = storage_res.value;
      }
      if(storage_res.value.hosts){
        savedHost = storage_res.value;
      }
    }
    console.log("saved host = " + JSON.stringify(savedHost));
    var data = fhparams.buildParams(app_props, consts.sdk_version);
    ajax(
      {
        "url": path,
        "type": "POST",
        "contentType": "application/json",
        "data": JSON.stringify(data),
        "timeout": app_props.timeout || consts.fh_timeout,
        "success": function(initRes) {
          storage.save({
            key: "fh_init",
            value: initRes
          }, function() {
            if (callback) {
              callback(null, {app:app_props, cloud: initRes});
            }
          });
        },
        "error": function(req, statusText, error) {
          //use the cached host if we have a copy
          if(savedHost){
            if(callback){
              callback(null, {app: app_props, cloud: savedHost});
            }
          } else {
            handleError(function(msg, err){
              if(callback){
                callback({error: err, message: msg});
            }
          }, req, statusText);
        }
      }
    });
  });
};

module.exports = {
  "init": init,
  "loadCloudProps": loadCloudProps
}
},{"./ajax":15,"./constants":19,"./fhparams":23,"./findFHPath":24,"./handleError":25,"./loadScript":28,"JSON":"rfnvHI","Lawnchair":"Z3sPFr","console":8}],28:[function(_dereq_,module,exports){
module.exports = function (url, callback) {
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

},{}],29:[function(_dereq_,module,exports){
module.exports = [
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
];

},{}],30:[function(_dereq_,module,exports){
module.exports = function(url) {
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

},{}],31:[function(_dereq_,module,exports){
module.exports = function(url) {
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

},{}],32:[function(_dereq_,module,exports){
var constants = _dereq_("./constants");

module.exports = function() {
  var type = "FH_JS_SDK";
  if (typeof window.fh_destination_code !== 'undefined') {
    type = "FH_HYBRID_SDK";
  } else if(window.PhoneGap || window.cordova) {
    type = "FH_PHONEGAP_SDK";
  }
  return type + "/" + constants.sdk_version;
};

},{"./constants":19}],33:[function(_dereq_,module,exports){
module.exports = {
  createUUID : function () {
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
  }
};

},{}],34:[function(_dereq_,module,exports){
var initializer = _dereq_("./initializer");
var events = _dereq_("./events");
var CloudHost = _dereq_("./hosts");
var constants = _dereq_("./constants");

var init_attempt = 0;
//the app configurations
var app_props;
//the cloud configurations
var cloud_host;

//flag for indicating if it has initialised
var is_initializing = false;
//flag for indicating if init has failed
var init_failed = false;
//hold listeners
var cloud_ready_listeners = [];


var tryInitialise = function(conf_path, retry, cb){
  init_attempt++;
  initializer.init(conf_path, function(error, initRes){
    if(error){
      if(retry && init_attempt <= retry){
        setTimeout(function(){
          tryInitialise(conf_path, retry, cb);
        }, 200);
      } else {
        return cb(error);
      }
    } else {
      app_props = initRes.app;
      cloud_host = new CloudHost(initRes.cloud);
      return cb(null, cloud_host);
    }
  });
}

var waitForCloudReady = function(cb, retry){
  //if we have cloud_host, then cloud is ready
  if(cloud_host){
    return cb(null, cloud_host);
  } else {
    if(is_initializing){
      cloud_ready_listeners.push(cb);
    } else {
      is_initializing = true;
      init_attempt = 0;
      tryInitialise(constants.config_js, retry, function(err, data){
        is_initializing = false;
        if(typeof(cb) === "function"){
          cb(err, data);
        }
        cloudReady(null === err);
      });
    }
  }
}

var cloudReady = function(success){
  if(success){
    events.fireEvent("cloudready", {host: getCloudHostUrl()});
  }
  try{
    while(cloud_ready_listeners[0]){
      var cb = cloud_ready_listeners.shift();
      if(success){
        return cb(null, null);
      } else {
        return cb("cloud is not ready", null);
      }
    }
  } finally {

  }
}

var getAppProps = function(){
  return app_props;
}

var getCloudHost = function(){
  return cloud_host;
}

var getCloudHostUrl = function(){
  return cloud_host.getHost(app_props.mode)
}

waitForCloudReady(function(){
  console.log("fh cloud is ready");
}, 2);

module.exports = {
  wait: waitForCloudReady,
  getAppProps: getAppProps,
  getCloudHost: getCloudHost,
  getCloudHostUrl: getCloudHostUrl
}
},{"./constants":19,"./events":22,"./hosts":26,"./initializer":27}]},{},[13])
(13)
});
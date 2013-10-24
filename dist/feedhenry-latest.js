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
/*
 CryptoJS v3.1.2
 core.js
 code.google.com/p/crypto-js
 (c) 2009-2013 by Jeff Mott. All rights reserved.
 code.google.com/p/crypto-js/wiki/License
 */
/**
 * CryptoJS core components.
 */
var CryptoJS = CryptoJS || (function (Math, undefined) {
  /**
   * CryptoJS namespace.
   */
  var C = {};

  /**
   * Library namespace.
   */
  var C_lib = C.lib = {};

  /**
   * Base object for prototypal inheritance.
   */
  var Base = C_lib.Base = (function () {
    function F() {}

    return {
      /**
       * Creates a new object that inherits from this object.
       *
       * @param {Object} overrides Properties to copy into the new object.
       *
       * @return {Object} The new object.
       *
       * @static
       *
       * @example
       *
       *     var MyType = CryptoJS.lib.Base.extend({
             *         field: 'value',
             *
             *         method: function () {
             *         }
             *     });
       */
      extend: function (overrides) {
        // Spawn
        F.prototype = this;
        var subtype = new F();

        // Augment
        if (overrides) {
          subtype.mixIn(overrides);
        }

        // Create default initializer
        if (!subtype.hasOwnProperty('init')) {
          subtype.init = function () {
            subtype.$super.init.apply(this, arguments);
          };
        }

        // Initializer's prototype is the subtype object
        subtype.init.prototype = subtype;

        // Reference supertype
        subtype.$super = this;

        return subtype;
      },

      /**
       * Extends this object and runs the init method.
       * Arguments to create() will be passed to init().
       *
       * @return {Object} The new object.
       *
       * @static
       *
       * @example
       *
       *     var instance = MyType.create();
       */
      create: function () {
        var instance = this.extend();
        instance.init.apply(instance, arguments);

        return instance;
      },

      /**
       * Initializes a newly created object.
       * Override this method to add some logic when your objects are created.
       *
       * @example
       *
       *     var MyType = CryptoJS.lib.Base.extend({
             *         init: function () {
             *             // ...
             *         }
             *     });
       */
      init: function () {
      },

      /**
       * Copies properties into this object.
       *
       * @param {Object} properties The properties to mix in.
       *
       * @example
       *
       *     MyType.mixIn({
             *         field: 'value'
             *     });
       */
      mixIn: function (properties) {
        for (var propertyName in properties) {
          if (properties.hasOwnProperty(propertyName)) {
            this[propertyName] = properties[propertyName];
          }
        }

        // IE won't copy toString using the loop above
        if (properties.hasOwnProperty('toString')) {
          this.toString = properties.toString;
        }
      },

      /**
       * Creates a copy of this object.
       *
       * @return {Object} The clone.
       *
       * @example
       *
       *     var clone = instance.clone();
       */
      clone: function () {
        return this.init.prototype.extend(this);
      }
    };
  }());

  /**
   * An array of 32-bit words.
   *
   * @property {Array} words The array of 32-bit words.
   * @property {number} sigBytes The number of significant bytes in this word array.
   */
  var WordArray = C_lib.WordArray = Base.extend({
    /**
     * Initializes a newly created word array.
     *
     * @param {Array} words (Optional) An array of 32-bit words.
     * @param {number} sigBytes (Optional) The number of significant bytes in the words.
     *
     * @example
     *
     *     var wordArray = CryptoJS.lib.WordArray.create();
     *     var wordArray = CryptoJS.lib.WordArray.create([0x00010203, 0x04050607]);
     *     var wordArray = CryptoJS.lib.WordArray.create([0x00010203, 0x04050607], 6);
     */
    init: function (words, sigBytes) {
      words = this.words = words || [];

      if (sigBytes != undefined) {
        this.sigBytes = sigBytes;
      } else {
        this.sigBytes = words.length * 4;
      }
    },

    /**
     * Converts this word array to a string.
     *
     * @param {Encoder} encoder (Optional) The encoding strategy to use. Default: CryptoJS.enc.Hex
     *
     * @return {string} The stringified word array.
     *
     * @example
     *
     *     var string = wordArray + '';
     *     var string = wordArray.toString();
     *     var string = wordArray.toString(CryptoJS.enc.Utf8);
     */
    toString: function (encoder) {
      return (encoder || Hex).stringify(this);
    },

    /**
     * Concatenates a word array to this word array.
     *
     * @param {WordArray} wordArray The word array to append.
     *
     * @return {WordArray} This word array.
     *
     * @example
     *
     *     wordArray1.concat(wordArray2);
     */
    concat: function (wordArray) {
      // Shortcuts
      var thisWords = this.words;
      var thatWords = wordArray.words;
      var thisSigBytes = this.sigBytes;
      var thatSigBytes = wordArray.sigBytes;

      // Clamp excess bits
      this.clamp();

      // Concat
      if (thisSigBytes % 4) {
        // Copy one byte at a time
        for (var i = 0; i < thatSigBytes; i++) {
          var thatByte = (thatWords[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
          thisWords[(thisSigBytes + i) >>> 2] |= thatByte << (24 - ((thisSigBytes + i) % 4) * 8);
        }
      } else if (thatWords.length > 0xffff) {
        // Copy one word at a time
        for (var i = 0; i < thatSigBytes; i += 4) {
          thisWords[(thisSigBytes + i) >>> 2] = thatWords[i >>> 2];
        }
      } else {
        // Copy all words at once
        thisWords.push.apply(thisWords, thatWords);
      }
      this.sigBytes += thatSigBytes;

      // Chainable
      return this;
    },

    /**
     * Removes insignificant bits.
     *
     * @example
     *
     *     wordArray.clamp();
     */
    clamp: function () {
      // Shortcuts
      var words = this.words;
      var sigBytes = this.sigBytes;

      // Clamp
      words[sigBytes >>> 2] &= 0xffffffff << (32 - (sigBytes % 4) * 8);
      words.length = Math.ceil(sigBytes / 4);
    },

    /**
     * Creates a copy of this word array.
     *
     * @return {WordArray} The clone.
     *
     * @example
     *
     *     var clone = wordArray.clone();
     */
    clone: function () {
      var clone = Base.clone.call(this);
      clone.words = this.words.slice(0);

      return clone;
    },

    /**
     * Creates a word array filled with random bytes.
     *
     * @param {number} nBytes The number of random bytes to generate.
     *
     * @return {WordArray} The random word array.
     *
     * @static
     *
     * @example
     *
     *     var wordArray = CryptoJS.lib.WordArray.random(16);
     */
    random: function (nBytes) {
      var words = [];
      for (var i = 0; i < nBytes; i += 4) {
        words.push((Math.random() * 0x100000000) | 0);
      }

      return new WordArray.init(words, nBytes);
    }
  });

  /**
   * Encoder namespace.
   */
  var C_enc = C.enc = {};

  /**
   * Hex encoding strategy.
   */
  var Hex = C_enc.Hex = {
    /**
     * Converts a word array to a hex string.
     *
     * @param {WordArray} wordArray The word array.
     *
     * @return {string} The hex string.
     *
     * @static
     *
     * @example
     *
     *     var hexString = CryptoJS.enc.Hex.stringify(wordArray);
     */
    stringify: function (wordArray) {
      // Shortcuts
      var words = wordArray.words;
      var sigBytes = wordArray.sigBytes;

      // Convert
      var hexChars = [];
      for (var i = 0; i < sigBytes; i++) {
        var bite = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
        hexChars.push((bite >>> 4).toString(16));
        hexChars.push((bite & 0x0f).toString(16));
      }

      return hexChars.join('');
    },

    /**
     * Converts a hex string to a word array.
     *
     * @param {string} hexStr The hex string.
     *
     * @return {WordArray} The word array.
     *
     * @static
     *
     * @example
     *
     *     var wordArray = CryptoJS.enc.Hex.parse(hexString);
     */
    parse: function (hexStr) {
      // Shortcut
      var hexStrLength = hexStr.length;

      // Convert
      var words = [];
      for (var i = 0; i < hexStrLength; i += 2) {
        words[i >>> 3] |= parseInt(hexStr.substr(i, 2), 16) << (24 - (i % 8) * 4);
      }

      return new WordArray.init(words, hexStrLength / 2);
    }
  };

  /**
   * Latin1 encoding strategy.
   */
  var Latin1 = C_enc.Latin1 = {
    /**
     * Converts a word array to a Latin1 string.
     *
     * @param {WordArray} wordArray The word array.
     *
     * @return {string} The Latin1 string.
     *
     * @static
     *
     * @example
     *
     *     var latin1String = CryptoJS.enc.Latin1.stringify(wordArray);
     */
    stringify: function (wordArray) {
      // Shortcuts
      var words = wordArray.words;
      var sigBytes = wordArray.sigBytes;

      // Convert
      var latin1Chars = [];
      for (var i = 0; i < sigBytes; i++) {
        var bite = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
        latin1Chars.push(String.fromCharCode(bite));
      }

      return latin1Chars.join('');
    },

    /**
     * Converts a Latin1 string to a word array.
     *
     * @param {string} latin1Str The Latin1 string.
     *
     * @return {WordArray} The word array.
     *
     * @static
     *
     * @example
     *
     *     var wordArray = CryptoJS.enc.Latin1.parse(latin1String);
     */
    parse: function (latin1Str) {
      // Shortcut
      var latin1StrLength = latin1Str.length;

      // Convert
      var words = [];
      for (var i = 0; i < latin1StrLength; i++) {
        words[i >>> 2] |= (latin1Str.charCodeAt(i) & 0xff) << (24 - (i % 4) * 8);
      }

      return new WordArray.init(words, latin1StrLength);
    }
  };

  /**
   * UTF-8 encoding strategy.
   */
  var Utf8 = C_enc.Utf8 = {
    /**
     * Converts a word array to a UTF-8 string.
     *
     * @param {WordArray} wordArray The word array.
     *
     * @return {string} The UTF-8 string.
     *
     * @static
     *
     * @example
     *
     *     var utf8String = CryptoJS.enc.Utf8.stringify(wordArray);
     */
    stringify: function (wordArray) {
      try {
        return decodeURIComponent(escape(Latin1.stringify(wordArray)));
      } catch (e) {
        throw new Error('Malformed UTF-8 data');
      }
    },

    /**
     * Converts a UTF-8 string to a word array.
     *
     * @param {string} utf8Str The UTF-8 string.
     *
     * @return {WordArray} The word array.
     *
     * @static
     *
     * @example
     *
     *     var wordArray = CryptoJS.enc.Utf8.parse(utf8String);
     */
    parse: function (utf8Str) {
      return Latin1.parse(unescape(encodeURIComponent(utf8Str)));
    }
  };

  /**
   * Abstract buffered block algorithm template.
   *
   * The property blockSize must be implemented in a concrete subtype.
   *
   * @property {number} _minBufferSize The number of blocks that should be kept unprocessed in the buffer. Default: 0
   */
  var BufferedBlockAlgorithm = C_lib.BufferedBlockAlgorithm = Base.extend({
    /**
     * Resets this block algorithm's data buffer to its initial state.
     *
     * @example
     *
     *     bufferedBlockAlgorithm.reset();
     */
    reset: function () {
      // Initial values
      this._data = new WordArray.init();
      this._nDataBytes = 0;
    },

    /**
     * Adds new data to this block algorithm's buffer.
     *
     * @param {WordArray|string} data The data to append. Strings are converted to a WordArray using UTF-8.
     *
     * @example
     *
     *     bufferedBlockAlgorithm._append('data');
     *     bufferedBlockAlgorithm._append(wordArray);
     */
    _append: function (data) {
      // Convert string to WordArray, else assume WordArray already
      if (typeof data == 'string') {
        data = Utf8.parse(data);
      }

      // Append
      this._data.concat(data);
      this._nDataBytes += data.sigBytes;
    },

    /**
     * Processes available data blocks.
     *
     * This method invokes _doProcessBlock(offset), which must be implemented by a concrete subtype.
     *
     * @param {boolean} doFlush Whether all blocks and partial blocks should be processed.
     *
     * @return {WordArray} The processed data.
     *
     * @example
     *
     *     var processedData = bufferedBlockAlgorithm._process();
     *     var processedData = bufferedBlockAlgorithm._process(!!'flush');
     */
    _process: function (doFlush) {
      // Shortcuts
      var data = this._data;
      var dataWords = data.words;
      var dataSigBytes = data.sigBytes;
      var blockSize = this.blockSize;
      var blockSizeBytes = blockSize * 4;

      // Count blocks ready
      var nBlocksReady = dataSigBytes / blockSizeBytes;
      if (doFlush) {
        // Round up to include partial blocks
        nBlocksReady = Math.ceil(nBlocksReady);
      } else {
        // Round down to include only full blocks,
        // less the number of blocks that must remain in the buffer
        nBlocksReady = Math.max((nBlocksReady | 0) - this._minBufferSize, 0);
      }

      // Count words ready
      var nWordsReady = nBlocksReady * blockSize;

      // Count bytes ready
      var nBytesReady = Math.min(nWordsReady * 4, dataSigBytes);

      // Process blocks
      if (nWordsReady) {
        for (var offset = 0; offset < nWordsReady; offset += blockSize) {
          // Perform concrete-algorithm logic
          this._doProcessBlock(dataWords, offset);
        }

        // Remove processed words
        var processedWords = dataWords.splice(0, nWordsReady);
        data.sigBytes -= nBytesReady;
      }

      // Return processed words
      return new WordArray.init(processedWords, nBytesReady);
    },

    /**
     * Creates a copy of this object.
     *
     * @return {Object} The clone.
     *
     * @example
     *
     *     var clone = bufferedBlockAlgorithm.clone();
     */
    clone: function () {
      var clone = Base.clone.call(this);
      clone._data = this._data.clone();

      return clone;
    },

    _minBufferSize: 0
  });

  /**
   * Abstract hasher template.
   *
   * @property {number} blockSize The number of 32-bit words this hasher operates on. Default: 16 (512 bits)
   */
  var Hasher = C_lib.Hasher = BufferedBlockAlgorithm.extend({
    /**
     * Configuration options.
     */
    cfg: Base.extend(),

    /**
     * Initializes a newly created hasher.
     *
     * @param {Object} cfg (Optional) The configuration options to use for this hash computation.
     *
     * @example
     *
     *     var hasher = CryptoJS.algo.SHA256.create();
     */
    init: function (cfg) {
      // Apply config defaults
      this.cfg = this.cfg.extend(cfg);

      // Set initial values
      this.reset();
    },

    /**
     * Resets this hasher to its initial state.
     *
     * @example
     *
     *     hasher.reset();
     */
    reset: function () {
      // Reset data buffer
      BufferedBlockAlgorithm.reset.call(this);

      // Perform concrete-hasher logic
      this._doReset();
    },

    /**
     * Updates this hasher with a message.
     *
     * @param {WordArray|string} messageUpdate The message to append.
     *
     * @return {Hasher} This hasher.
     *
     * @example
     *
     *     hasher.update('message');
     *     hasher.update(wordArray);
     */
    update: function (messageUpdate) {
      // Append
      this._append(messageUpdate);

      // Update the hash
      this._process();

      // Chainable
      return this;
    },

    /**
     * Finalizes the hash computation.
     * Note that the finalize operation is effectively a destructive, read-once operation.
     *
     * @param {WordArray|string} messageUpdate (Optional) A final message update.
     *
     * @return {WordArray} The hash.
     *
     * @example
     *
     *     var hash = hasher.finalize();
     *     var hash = hasher.finalize('message');
     *     var hash = hasher.finalize(wordArray);
     */
    finalize: function (messageUpdate) {
      // Final message update
      if (messageUpdate) {
        this._append(messageUpdate);
      }

      // Perform concrete-hasher logic
      var hash = this._doFinalize();

      return hash;
    },

    blockSize: 512/32,

    /**
     * Creates a shortcut function to a hasher's object interface.
     *
     * @param {Hasher} hasher The hasher to create a helper for.
     *
     * @return {Function} The shortcut function.
     *
     * @static
     *
     * @example
     *
     *     var SHA256 = CryptoJS.lib.Hasher._createHelper(CryptoJS.algo.SHA256);
     */
    _createHelper: function (hasher) {
      return function (message, cfg) {
        return new hasher.init(cfg).finalize(message);
      };
    },

    /**
     * Creates a shortcut function to the HMAC's object interface.
     *
     * @param {Hasher} hasher The hasher to use in this HMAC helper.
     *
     * @return {Function} The shortcut function.
     *
     * @static
     *
     * @example
     *
     *     var HmacSHA256 = CryptoJS.lib.Hasher._createHmacHelper(CryptoJS.algo.SHA256);
     */
    _createHmacHelper: function (hasher) {
      return function (message, key) {
        return new C_algo.HMAC.init(hasher, key).finalize(message);
      };
    }
  });

  /**
   * Algorithm namespace.
   */
  var C_algo = C.algo = {};

  return C;
}(Math));
/*
 CryptoJS v3.1.2
 enc-base64.js
 code.google.com/p/crypto-js
 (c) 2009-2013 by Jeff Mott. All rights reserved.
 code.google.com/p/crypto-js/wiki/License
 */
(function () {
  // Shortcuts
  var C = CryptoJS;
  var C_lib = C.lib;
  var WordArray = C_lib.WordArray;
  var C_enc = C.enc;

  /**
   * Base64 encoding strategy.
   */
  var Base64 = C_enc.Base64 = {
    /**
     * Converts a word array to a Base64 string.
     *
     * @param {WordArray} wordArray The word array.
     *
     * @return {string} The Base64 string.
     *
     * @static
     *
     * @example
     *
     *     var base64String = CryptoJS.enc.Base64.stringify(wordArray);
     */
    stringify: function (wordArray) {
      // Shortcuts
      var words = wordArray.words;
      var sigBytes = wordArray.sigBytes;
      var map = this._map;

      // Clamp excess bits
      wordArray.clamp();

      // Convert
      var base64Chars = [];
      for (var i = 0; i < sigBytes; i += 3) {
        var byte1 = (words[i >>> 2]       >>> (24 - (i % 4) * 8))       & 0xff;
        var byte2 = (words[(i + 1) >>> 2] >>> (24 - ((i + 1) % 4) * 8)) & 0xff;
        var byte3 = (words[(i + 2) >>> 2] >>> (24 - ((i + 2) % 4) * 8)) & 0xff;

        var triplet = (byte1 << 16) | (byte2 << 8) | byte3;

        for (var j = 0; (j < 4) && (i + j * 0.75 < sigBytes); j++) {
          base64Chars.push(map.charAt((triplet >>> (6 * (3 - j))) & 0x3f));
        }
      }

      // Add padding
      var paddingChar = map.charAt(64);
      if (paddingChar) {
        while (base64Chars.length % 4) {
          base64Chars.push(paddingChar);
        }
      }

      return base64Chars.join('');
    },

    /**
     * Converts a Base64 string to a word array.
     *
     * @param {string} base64Str The Base64 string.
     *
     * @return {WordArray} The word array.
     *
     * @static
     *
     * @example
     *
     *     var wordArray = CryptoJS.enc.Base64.parse(base64String);
     */
    parse: function (base64Str) {
      // Shortcuts
      var base64StrLength = base64Str.length;
      var map = this._map;

      // Ignore padding
      var paddingChar = map.charAt(64);
      if (paddingChar) {
        var paddingIndex = base64Str.indexOf(paddingChar);
        if (paddingIndex != -1) {
          base64StrLength = paddingIndex;
        }
      }

      // Convert
      var words = [];
      var nBytes = 0;
      for (var i = 0; i < base64StrLength; i++) {
        if (i % 4) {
          var bits1 = map.indexOf(base64Str.charAt(i - 1)) << ((i % 4) * 2);
          var bits2 = map.indexOf(base64Str.charAt(i)) >>> (6 - (i % 4) * 2);
          words[nBytes >>> 2] |= (bits1 | bits2) << (24 - (nBytes % 4) * 8);
          nBytes++;
        }
      }

      return WordArray.create(words, nBytes);
    },

    _map: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='
  };
}());
/*
 CryptoJS v3.1.2
 cipher-core
 code.google.com/p/crypto-js
 (c) 2009-2013 by Jeff Mott. All rights reserved.
 code.google.com/p/crypto-js/wiki/License
 */
/**
 * Cipher core components.
 */
CryptoJS.lib.Cipher || (function (undefined) {
  // Shortcuts
  var C = CryptoJS;
  var C_lib = C.lib;
  var Base = C_lib.Base;
  var WordArray = C_lib.WordArray;
  var BufferedBlockAlgorithm = C_lib.BufferedBlockAlgorithm;
  var C_enc = C.enc;
  var Utf8 = C_enc.Utf8;
  var Base64 = C_enc.Base64;
  var C_algo = C.algo;
  var EvpKDF = C_algo.EvpKDF;

  /**
   * Abstract base cipher template.
   *
   * @property {number} keySize This cipher's key size. Default: 4 (128 bits)
   * @property {number} ivSize This cipher's IV size. Default: 4 (128 bits)
   * @property {number} _ENC_XFORM_MODE A constant representing encryption mode.
   * @property {number} _DEC_XFORM_MODE A constant representing decryption mode.
   */
  var Cipher = C_lib.Cipher = BufferedBlockAlgorithm.extend({
    /**
     * Configuration options.
     *
     * @property {WordArray} iv The IV to use for this operation.
     */
    cfg: Base.extend(),

    /**
     * Creates this cipher in encryption mode.
     *
     * @param {WordArray} key The key.
     * @param {Object} cfg (Optional) The configuration options to use for this operation.
     *
     * @return {Cipher} A cipher instance.
     *
     * @static
     *
     * @example
     *
     *     var cipher = CryptoJS.algo.AES.createEncryptor(keyWordArray, { iv: ivWordArray });
     */
    createEncryptor: function (key, cfg) {
      return this.create(this._ENC_XFORM_MODE, key, cfg);
    },

    /**
     * Creates this cipher in decryption mode.
     *
     * @param {WordArray} key The key.
     * @param {Object} cfg (Optional) The configuration options to use for this operation.
     *
     * @return {Cipher} A cipher instance.
     *
     * @static
     *
     * @example
     *
     *     var cipher = CryptoJS.algo.AES.createDecryptor(keyWordArray, { iv: ivWordArray });
     */
    createDecryptor: function (key, cfg) {
      return this.create(this._DEC_XFORM_MODE, key, cfg);
    },

    /**
     * Initializes a newly created cipher.
     *
     * @param {number} xformMode Either the encryption or decryption transormation mode constant.
     * @param {WordArray} key The key.
     * @param {Object} cfg (Optional) The configuration options to use for this operation.
     *
     * @example
     *
     *     var cipher = CryptoJS.algo.AES.create(CryptoJS.algo.AES._ENC_XFORM_MODE, keyWordArray, { iv: ivWordArray });
     */
    init: function (xformMode, key, cfg) {
      // Apply config defaults
      this.cfg = this.cfg.extend(cfg);

      // Store transform mode and key
      this._xformMode = xformMode;
      this._key = key;

      // Set initial values
      this.reset();
    },

    /**
     * Resets this cipher to its initial state.
     *
     * @example
     *
     *     cipher.reset();
     */
    reset: function () {
      // Reset data buffer
      BufferedBlockAlgorithm.reset.call(this);

      // Perform concrete-cipher logic
      this._doReset();
    },

    /**
     * Adds data to be encrypted or decrypted.
     *
     * @param {WordArray|string} dataUpdate The data to encrypt or decrypt.
     *
     * @return {WordArray} The data after processing.
     *
     * @example
     *
     *     var encrypted = cipher.process('data');
     *     var encrypted = cipher.process(wordArray);
     */
    process: function (dataUpdate) {
      // Append
      this._append(dataUpdate);

      // Process available blocks
      return this._process();
    },

    /**
     * Finalizes the encryption or decryption process.
     * Note that the finalize operation is effectively a destructive, read-once operation.
     *
     * @param {WordArray|string} dataUpdate The final data to encrypt or decrypt.
     *
     * @return {WordArray} The data after final processing.
     *
     * @example
     *
     *     var encrypted = cipher.finalize();
     *     var encrypted = cipher.finalize('data');
     *     var encrypted = cipher.finalize(wordArray);
     */
    finalize: function (dataUpdate) {
      // Final data update
      if (dataUpdate) {
        this._append(dataUpdate);
      }

      // Perform concrete-cipher logic
      var finalProcessedData = this._doFinalize();

      return finalProcessedData;
    },

    keySize: 128/32,

    ivSize: 128/32,

    _ENC_XFORM_MODE: 1,

    _DEC_XFORM_MODE: 2,

    /**
     * Creates shortcut functions to a cipher's object interface.
     *
     * @param {Cipher} cipher The cipher to create a helper for.
     *
     * @return {Object} An object with encrypt and decrypt shortcut functions.
     *
     * @static
     *
     * @example
     *
     *     var AES = CryptoJS.lib.Cipher._createHelper(CryptoJS.algo.AES);
     */
    _createHelper: (function () {
      function selectCipherStrategy(key) {
        if (typeof key == 'string') {
          return PasswordBasedCipher;
        } else {
          return SerializableCipher;
        }
      }

      return function (cipher) {
        return {
          encrypt: function (message, key, cfg) {
            return selectCipherStrategy(key).encrypt(cipher, message, key, cfg);
          },

          decrypt: function (ciphertext, key, cfg) {
            return selectCipherStrategy(key).decrypt(cipher, ciphertext, key, cfg);
          }
        };
      };
    }())
  });

  /**
   * Abstract base stream cipher template.
   *
   * @property {number} blockSize The number of 32-bit words this cipher operates on. Default: 1 (32 bits)
   */
  var StreamCipher = C_lib.StreamCipher = Cipher.extend({
    _doFinalize: function () {
      // Process partial blocks
      var finalProcessedBlocks = this._process(!!'flush');

      return finalProcessedBlocks;
    },

    blockSize: 1
  });

  /**
   * Mode namespace.
   */
  var C_mode = C.mode = {};

  /**
   * Abstract base block cipher mode template.
   */
  var BlockCipherMode = C_lib.BlockCipherMode = Base.extend({
    /**
     * Creates this mode for encryption.
     *
     * @param {Cipher} cipher A block cipher instance.
     * @param {Array} iv The IV words.
     *
     * @static
     *
     * @example
     *
     *     var mode = CryptoJS.mode.CBC.createEncryptor(cipher, iv.words);
     */
    createEncryptor: function (cipher, iv) {
      return this.Encryptor.create(cipher, iv);
    },

    /**
     * Creates this mode for decryption.
     *
     * @param {Cipher} cipher A block cipher instance.
     * @param {Array} iv The IV words.
     *
     * @static
     *
     * @example
     *
     *     var mode = CryptoJS.mode.CBC.createDecryptor(cipher, iv.words);
     */
    createDecryptor: function (cipher, iv) {
      return this.Decryptor.create(cipher, iv);
    },

    /**
     * Initializes a newly created mode.
     *
     * @param {Cipher} cipher A block cipher instance.
     * @param {Array} iv The IV words.
     *
     * @example
     *
     *     var mode = CryptoJS.mode.CBC.Encryptor.create(cipher, iv.words);
     */
    init: function (cipher, iv) {
      this._cipher = cipher;
      this._iv = iv;
    }
  });

  /**
   * Cipher Block Chaining mode.
   */
  var CBC = C_mode.CBC = (function () {
    /**
     * Abstract base CBC mode.
     */
    var CBC = BlockCipherMode.extend();

    /**
     * CBC encryptor.
     */
    CBC.Encryptor = CBC.extend({
      /**
       * Processes the data block at offset.
       *
       * @param {Array} words The data words to operate on.
       * @param {number} offset The offset where the block starts.
       *
       * @example
       *
       *     mode.processBlock(data.words, offset);
       */
      processBlock: function (words, offset) {
        // Shortcuts
        var cipher = this._cipher;
        var blockSize = cipher.blockSize;

        // XOR and encrypt
        xorBlock.call(this, words, offset, blockSize);
        cipher.encryptBlock(words, offset);

        // Remember this block to use with next block
        this._prevBlock = words.slice(offset, offset + blockSize);
      }
    });

    /**
     * CBC decryptor.
     */
    CBC.Decryptor = CBC.extend({
      /**
       * Processes the data block at offset.
       *
       * @param {Array} words The data words to operate on.
       * @param {number} offset The offset where the block starts.
       *
       * @example
       *
       *     mode.processBlock(data.words, offset);
       */
      processBlock: function (words, offset) {
        // Shortcuts
        var cipher = this._cipher;
        var blockSize = cipher.blockSize;

        // Remember this block to use with next block
        var thisBlock = words.slice(offset, offset + blockSize);

        // Decrypt and XOR
        cipher.decryptBlock(words, offset);
        xorBlock.call(this, words, offset, blockSize);

        // This block becomes the previous block
        this._prevBlock = thisBlock;
      }
    });

    function xorBlock(words, offset, blockSize) {
      // Shortcut
      var iv = this._iv;

      // Choose mixing block
      if (iv) {
        var block = iv;

        // Remove IV for subsequent blocks
        this._iv = undefined;
      } else {
        var block = this._prevBlock;
      }

      // XOR blocks
      for (var i = 0; i < blockSize; i++) {
        words[offset + i] ^= block[i];
      }
    }

    return CBC;
  }());

  /**
   * Padding namespace.
   */
  var C_pad = C.pad = {};

  /**
   * PKCS #5/7 padding strategy.
   */
  var Pkcs7 = C_pad.Pkcs7 = {
    /**
     * Pads data using the algorithm defined in PKCS #5/7.
     *
     * @param {WordArray} data The data to pad.
     * @param {number} blockSize The multiple that the data should be padded to.
     *
     * @static
     *
     * @example
     *
     *     CryptoJS.pad.Pkcs7.pad(wordArray, 4);
     */
    pad: function (data, blockSize) {
      // Shortcut
      var blockSizeBytes = blockSize * 4;

      // Count padding bytes
      var nPaddingBytes = blockSizeBytes - data.sigBytes % blockSizeBytes;

      // Create padding word
      var paddingWord = (nPaddingBytes << 24) | (nPaddingBytes << 16) | (nPaddingBytes << 8) | nPaddingBytes;

      // Create padding
      var paddingWords = [];
      for (var i = 0; i < nPaddingBytes; i += 4) {
        paddingWords.push(paddingWord);
      }
      var padding = WordArray.create(paddingWords, nPaddingBytes);

      // Add padding
      data.concat(padding);
    },

    /**
     * Unpads data that had been padded using the algorithm defined in PKCS #5/7.
     *
     * @param {WordArray} data The data to unpad.
     *
     * @static
     *
     * @example
     *
     *     CryptoJS.pad.Pkcs7.unpad(wordArray);
     */
    unpad: function (data) {
      // Get number of padding bytes from last byte
      var nPaddingBytes = data.words[(data.sigBytes - 1) >>> 2] & 0xff;

      // Remove padding
      data.sigBytes -= nPaddingBytes;
    }
  };

  /**
   * Abstract base block cipher template.
   *
   * @property {number} blockSize The number of 32-bit words this cipher operates on. Default: 4 (128 bits)
   */
  var BlockCipher = C_lib.BlockCipher = Cipher.extend({
    /**
     * Configuration options.
     *
     * @property {Mode} mode The block mode to use. Default: CBC
     * @property {Padding} padding The padding strategy to use. Default: Pkcs7
     */
    cfg: Cipher.cfg.extend({
      mode: CBC,
      padding: Pkcs7
    }),

    reset: function () {
      // Reset cipher
      Cipher.reset.call(this);

      // Shortcuts
      var cfg = this.cfg;
      var iv = cfg.iv;
      var mode = cfg.mode;

      // Reset block mode
      if (this._xformMode == this._ENC_XFORM_MODE) {
        var modeCreator = mode.createEncryptor;
      } else /* if (this._xformMode == this._DEC_XFORM_MODE) */ {
        var modeCreator = mode.createDecryptor;

        // Keep at least one block in the buffer for unpadding
        this._minBufferSize = 1;
      }
      this._mode = modeCreator.call(mode, this, iv && iv.words);
    },

    _doProcessBlock: function (words, offset) {
      this._mode.processBlock(words, offset);
    },

    _doFinalize: function () {
      // Shortcut
      var padding = this.cfg.padding;

      // Finalize
      if (this._xformMode == this._ENC_XFORM_MODE) {
        // Pad data
        padding.pad(this._data, this.blockSize);

        // Process final blocks
        var finalProcessedBlocks = this._process(!!'flush');
      } else /* if (this._xformMode == this._DEC_XFORM_MODE) */ {
        // Process final blocks
        var finalProcessedBlocks = this._process(!!'flush');

        // Unpad data
        padding.unpad(finalProcessedBlocks);
      }

      return finalProcessedBlocks;
    },

    blockSize: 128/32
  });

  /**
   * A collection of cipher parameters.
   *
   * @property {WordArray} ciphertext The raw ciphertext.
   * @property {WordArray} key The key to this ciphertext.
   * @property {WordArray} iv The IV used in the ciphering operation.
   * @property {WordArray} salt The salt used with a key derivation function.
   * @property {Cipher} algorithm The cipher algorithm.
   * @property {Mode} mode The block mode used in the ciphering operation.
   * @property {Padding} padding The padding scheme used in the ciphering operation.
   * @property {number} blockSize The block size of the cipher.
   * @property {Format} formatter The default formatting strategy to convert this cipher params object to a string.
   */
  var CipherParams = C_lib.CipherParams = Base.extend({
    /**
     * Initializes a newly created cipher params object.
     *
     * @param {Object} cipherParams An object with any of the possible cipher parameters.
     *
     * @example
     *
     *     var cipherParams = CryptoJS.lib.CipherParams.create({
         *         ciphertext: ciphertextWordArray,
         *         key: keyWordArray,
         *         iv: ivWordArray,
         *         salt: saltWordArray,
         *         algorithm: CryptoJS.algo.AES,
         *         mode: CryptoJS.mode.CBC,
         *         padding: CryptoJS.pad.PKCS7,
         *         blockSize: 4,
         *         formatter: CryptoJS.format.OpenSSL
         *     });
     */
    init: function (cipherParams) {
      this.mixIn(cipherParams);
    },

    /**
     * Converts this cipher params object to a string.
     *
     * @param {Format} formatter (Optional) The formatting strategy to use.
     *
     * @return {string} The stringified cipher params.
     *
     * @throws Error If neither the formatter nor the default formatter is set.
     *
     * @example
     *
     *     var string = cipherParams + '';
     *     var string = cipherParams.toString();
     *     var string = cipherParams.toString(CryptoJS.format.OpenSSL);
     */
    toString: function (formatter) {
      return (formatter || this.formatter).stringify(this);
    }
  });

  /**
   * Format namespace.
   */
  var C_format = C.format = {};

  /**
   * OpenSSL formatting strategy.
   */
  var OpenSSLFormatter = C_format.OpenSSL = {
    /**
     * Converts a cipher params object to an OpenSSL-compatible string.
     *
     * @param {CipherParams} cipherParams The cipher params object.
     *
     * @return {string} The OpenSSL-compatible string.
     *
     * @static
     *
     * @example
     *
     *     var openSSLString = CryptoJS.format.OpenSSL.stringify(cipherParams);
     */
    stringify: function (cipherParams) {
      // Shortcuts
      var ciphertext = cipherParams.ciphertext;
      var salt = cipherParams.salt;

      // Format
      if (salt) {
        var wordArray = WordArray.create([0x53616c74, 0x65645f5f]).concat(salt).concat(ciphertext);
      } else {
        var wordArray = ciphertext;
      }

      return wordArray.toString(Base64);
    },

    /**
     * Converts an OpenSSL-compatible string to a cipher params object.
     *
     * @param {string} openSSLStr The OpenSSL-compatible string.
     *
     * @return {CipherParams} The cipher params object.
     *
     * @static
     *
     * @example
     *
     *     var cipherParams = CryptoJS.format.OpenSSL.parse(openSSLString);
     */
    parse: function (openSSLStr) {
      // Parse base64
      var ciphertext = Base64.parse(openSSLStr);

      // Shortcut
      var ciphertextWords = ciphertext.words;

      // Test for salt
      if (ciphertextWords[0] == 0x53616c74 && ciphertextWords[1] == 0x65645f5f) {
        // Extract salt
        var salt = WordArray.create(ciphertextWords.slice(2, 4));

        // Remove salt from ciphertext
        ciphertextWords.splice(0, 4);
        ciphertext.sigBytes -= 16;
      }

      return CipherParams.create({ ciphertext: ciphertext, salt: salt });
    }
  };

  /**
   * A cipher wrapper that returns ciphertext as a serializable cipher params object.
   */
  var SerializableCipher = C_lib.SerializableCipher = Base.extend({
    /**
     * Configuration options.
     *
     * @property {Formatter} format The formatting strategy to convert cipher param objects to and from a string. Default: OpenSSL
     */
    cfg: Base.extend({
      format: OpenSSLFormatter
    }),

    /**
     * Encrypts a message.
     *
     * @param {Cipher} cipher The cipher algorithm to use.
     * @param {WordArray|string} message The message to encrypt.
     * @param {WordArray} key The key.
     * @param {Object} cfg (Optional) The configuration options to use for this operation.
     *
     * @return {CipherParams} A cipher params object.
     *
     * @static
     *
     * @example
     *
     *     var ciphertextParams = CryptoJS.lib.SerializableCipher.encrypt(CryptoJS.algo.AES, message, key);
     *     var ciphertextParams = CryptoJS.lib.SerializableCipher.encrypt(CryptoJS.algo.AES, message, key, { iv: iv });
     *     var ciphertextParams = CryptoJS.lib.SerializableCipher.encrypt(CryptoJS.algo.AES, message, key, { iv: iv, format: CryptoJS.format.OpenSSL });
     */
    encrypt: function (cipher, message, key, cfg) {
      // Apply config defaults
      cfg = this.cfg.extend(cfg);

      // Encrypt
      var encryptor = cipher.createEncryptor(key, cfg);
      var ciphertext = encryptor.finalize(message);

      // Shortcut
      var cipherCfg = encryptor.cfg;

      // Create and return serializable cipher params
      return CipherParams.create({
        ciphertext: ciphertext,
        key: key,
        iv: cipherCfg.iv,
        algorithm: cipher,
        mode: cipherCfg.mode,
        padding: cipherCfg.padding,
        blockSize: cipher.blockSize,
        formatter: cfg.format
      });
    },

    /**
     * Decrypts serialized ciphertext.
     *
     * @param {Cipher} cipher The cipher algorithm to use.
     * @param {CipherParams|string} ciphertext The ciphertext to decrypt.
     * @param {WordArray} key The key.
     * @param {Object} cfg (Optional) The configuration options to use for this operation.
     *
     * @return {WordArray} The plaintext.
     *
     * @static
     *
     * @example
     *
     *     var plaintext = CryptoJS.lib.SerializableCipher.decrypt(CryptoJS.algo.AES, formattedCiphertext, key, { iv: iv, format: CryptoJS.format.OpenSSL });
     *     var plaintext = CryptoJS.lib.SerializableCipher.decrypt(CryptoJS.algo.AES, ciphertextParams, key, { iv: iv, format: CryptoJS.format.OpenSSL });
     */
    decrypt: function (cipher, ciphertext, key, cfg) {
      // Apply config defaults
      cfg = this.cfg.extend(cfg);

      // Convert string to CipherParams
      ciphertext = this._parse(ciphertext, cfg.format);

      // Decrypt
      var plaintext = cipher.createDecryptor(key, cfg).finalize(ciphertext.ciphertext);

      return plaintext;
    },

    /**
     * Converts serialized ciphertext to CipherParams,
     * else assumed CipherParams already and returns ciphertext unchanged.
     *
     * @param {CipherParams|string} ciphertext The ciphertext.
     * @param {Formatter} format The formatting strategy to use to parse serialized ciphertext.
     *
     * @return {CipherParams} The unserialized ciphertext.
     *
     * @static
     *
     * @example
     *
     *     var ciphertextParams = CryptoJS.lib.SerializableCipher._parse(ciphertextStringOrParams, format);
     */
    _parse: function (ciphertext, format) {
      if (typeof ciphertext == 'string') {
        return format.parse(ciphertext, this);
      } else {
        return ciphertext;
      }
    }
  });

  /**
   * Key derivation function namespace.
   */
  var C_kdf = C.kdf = {};

  /**
   * OpenSSL key derivation function.
   */
  var OpenSSLKdf = C_kdf.OpenSSL = {
    /**
     * Derives a key and IV from a password.
     *
     * @param {string} password The password to derive from.
     * @param {number} keySize The size in words of the key to generate.
     * @param {number} ivSize The size in words of the IV to generate.
     * @param {WordArray|string} salt (Optional) A 64-bit salt to use. If omitted, a salt will be generated randomly.
     *
     * @return {CipherParams} A cipher params object with the key, IV, and salt.
     *
     * @static
     *
     * @example
     *
     *     var derivedParams = CryptoJS.kdf.OpenSSL.execute('Password', 256/32, 128/32);
     *     var derivedParams = CryptoJS.kdf.OpenSSL.execute('Password', 256/32, 128/32, 'saltsalt');
     */
    execute: function (password, keySize, ivSize, salt) {
      // Generate random salt
      if (!salt) {
        salt = WordArray.random(64/8);
      }

      // Derive key and IV
      var key = EvpKDF.create({ keySize: keySize + ivSize }).compute(password, salt);

      // Separate key and IV
      var iv = WordArray.create(key.words.slice(keySize), ivSize * 4);
      key.sigBytes = keySize * 4;

      // Return params
      return CipherParams.create({ key: key, iv: iv, salt: salt });
    }
  };

  /**
   * A serializable cipher wrapper that derives the key from a password,
   * and returns ciphertext as a serializable cipher params object.
   */
  var PasswordBasedCipher = C_lib.PasswordBasedCipher = SerializableCipher.extend({
    /**
     * Configuration options.
     *
     * @property {KDF} kdf The key derivation function to use to generate a key and IV from a password. Default: OpenSSL
     */
    cfg: SerializableCipher.cfg.extend({
      kdf: OpenSSLKdf
    }),

    /**
     * Encrypts a message using a password.
     *
     * @param {Cipher} cipher The cipher algorithm to use.
     * @param {WordArray|string} message The message to encrypt.
     * @param {string} password The password.
     * @param {Object} cfg (Optional) The configuration options to use for this operation.
     *
     * @return {CipherParams} A cipher params object.
     *
     * @static
     *
     * @example
     *
     *     var ciphertextParams = CryptoJS.lib.PasswordBasedCipher.encrypt(CryptoJS.algo.AES, message, 'password');
     *     var ciphertextParams = CryptoJS.lib.PasswordBasedCipher.encrypt(CryptoJS.algo.AES, message, 'password', { format: CryptoJS.format.OpenSSL });
     */
    encrypt: function (cipher, message, password, cfg) {
      // Apply config defaults
      cfg = this.cfg.extend(cfg);

      // Derive key and other params
      var derivedParams = cfg.kdf.execute(password, cipher.keySize, cipher.ivSize);

      // Add IV to config
      cfg.iv = derivedParams.iv;

      // Encrypt
      var ciphertext = SerializableCipher.encrypt.call(this, cipher, message, derivedParams.key, cfg);

      // Mix in derived params
      ciphertext.mixIn(derivedParams);

      return ciphertext;
    },

    /**
     * Decrypts serialized ciphertext using a password.
     *
     * @param {Cipher} cipher The cipher algorithm to use.
     * @param {CipherParams|string} ciphertext The ciphertext to decrypt.
     * @param {string} password The password.
     * @param {Object} cfg (Optional) The configuration options to use for this operation.
     *
     * @return {WordArray} The plaintext.
     *
     * @static
     *
     * @example
     *
     *     var plaintext = CryptoJS.lib.PasswordBasedCipher.decrypt(CryptoJS.algo.AES, formattedCiphertext, 'password', { format: CryptoJS.format.OpenSSL });
     *     var plaintext = CryptoJS.lib.PasswordBasedCipher.decrypt(CryptoJS.algo.AES, ciphertextParams, 'password', { format: CryptoJS.format.OpenSSL });
     */
    decrypt: function (cipher, ciphertext, password, cfg) {
      // Apply config defaults
      cfg = this.cfg.extend(cfg);

      // Convert string to CipherParams
      ciphertext = this._parse(ciphertext, cfg.format);

      // Derive key and other params
      var derivedParams = cfg.kdf.execute(password, cipher.keySize, cipher.ivSize, ciphertext.salt);

      // Add IV to config
      cfg.iv = derivedParams.iv;

      // Decrypt
      var plaintext = SerializableCipher.decrypt.call(this, cipher, ciphertext, derivedParams.key, cfg);

      return plaintext;
    }
  });
}());
/*
 CryptoJS v3.1.2
 aes.js
 code.google.com/p/crypto-js
 (c) 2009-2013 by Jeff Mott. All rights reserved.
 code.google.com/p/crypto-js/wiki/License
 */
(function () {
  // Shortcuts
  var C = CryptoJS;
  var C_lib = C.lib;
  var BlockCipher = C_lib.BlockCipher;
  var C_algo = C.algo;

  // Lookup tables
  var SBOX = [];
  var INV_SBOX = [];
  var SUB_MIX_0 = [];
  var SUB_MIX_1 = [];
  var SUB_MIX_2 = [];
  var SUB_MIX_3 = [];
  var INV_SUB_MIX_0 = [];
  var INV_SUB_MIX_1 = [];
  var INV_SUB_MIX_2 = [];
  var INV_SUB_MIX_3 = [];

  // Compute lookup tables
  (function () {
    // Compute double table
    var d = [];
    for (var i = 0; i < 256; i++) {
      if (i < 128) {
        d[i] = i << 1;
      } else {
        d[i] = (i << 1) ^ 0x11b;
      }
    }

    // Walk GF(2^8)
    var x = 0;
    var xi = 0;
    for (var i = 0; i < 256; i++) {
      // Compute sbox
      var sx = xi ^ (xi << 1) ^ (xi << 2) ^ (xi << 3) ^ (xi << 4);
      sx = (sx >>> 8) ^ (sx & 0xff) ^ 0x63;
      SBOX[x] = sx;
      INV_SBOX[sx] = x;

      // Compute multiplication
      var x2 = d[x];
      var x4 = d[x2];
      var x8 = d[x4];

      // Compute sub bytes, mix columns tables
      var t = (d[sx] * 0x101) ^ (sx * 0x1010100);
      SUB_MIX_0[x] = (t << 24) | (t >>> 8);
      SUB_MIX_1[x] = (t << 16) | (t >>> 16);
      SUB_MIX_2[x] = (t << 8)  | (t >>> 24);
      SUB_MIX_3[x] = t;

      // Compute inv sub bytes, inv mix columns tables
      var t = (x8 * 0x1010101) ^ (x4 * 0x10001) ^ (x2 * 0x101) ^ (x * 0x1010100);
      INV_SUB_MIX_0[sx] = (t << 24) | (t >>> 8);
      INV_SUB_MIX_1[sx] = (t << 16) | (t >>> 16);
      INV_SUB_MIX_2[sx] = (t << 8)  | (t >>> 24);
      INV_SUB_MIX_3[sx] = t;

      // Compute next counter
      if (!x) {
        x = xi = 1;
      } else {
        x = x2 ^ d[d[d[x8 ^ x2]]];
        xi ^= d[d[xi]];
      }
    }
  }());

  // Precomputed Rcon lookup
  var RCON = [0x00, 0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80, 0x1b, 0x36];

  /**
   * AES block cipher algorithm.
   */
  var AES = C_algo.AES = BlockCipher.extend({
    _doReset: function () {
      // Shortcuts
      var key = this._key;
      var keyWords = key.words;
      var keySize = key.sigBytes / 4;

      // Compute number of rounds
      var nRounds = this._nRounds = keySize + 6

      // Compute number of key schedule rows
      var ksRows = (nRounds + 1) * 4;

      // Compute key schedule
      var keySchedule = this._keySchedule = [];
      for (var ksRow = 0; ksRow < ksRows; ksRow++) {
        if (ksRow < keySize) {
          keySchedule[ksRow] = keyWords[ksRow];
        } else {
          var t = keySchedule[ksRow - 1];

          if (!(ksRow % keySize)) {
            // Rot word
            t = (t << 8) | (t >>> 24);

            // Sub word
            t = (SBOX[t >>> 24] << 24) | (SBOX[(t >>> 16) & 0xff] << 16) | (SBOX[(t >>> 8) & 0xff] << 8) | SBOX[t & 0xff];

            // Mix Rcon
            t ^= RCON[(ksRow / keySize) | 0] << 24;
          } else if (keySize > 6 && ksRow % keySize == 4) {
            // Sub word
            t = (SBOX[t >>> 24] << 24) | (SBOX[(t >>> 16) & 0xff] << 16) | (SBOX[(t >>> 8) & 0xff] << 8) | SBOX[t & 0xff];
          }

          keySchedule[ksRow] = keySchedule[ksRow - keySize] ^ t;
        }
      }

      // Compute inv key schedule
      var invKeySchedule = this._invKeySchedule = [];
      for (var invKsRow = 0; invKsRow < ksRows; invKsRow++) {
        var ksRow = ksRows - invKsRow;

        if (invKsRow % 4) {
          var t = keySchedule[ksRow];
        } else {
          var t = keySchedule[ksRow - 4];
        }

        if (invKsRow < 4 || ksRow <= 4) {
          invKeySchedule[invKsRow] = t;
        } else {
          invKeySchedule[invKsRow] = INV_SUB_MIX_0[SBOX[t >>> 24]] ^ INV_SUB_MIX_1[SBOX[(t >>> 16) & 0xff]] ^
              INV_SUB_MIX_2[SBOX[(t >>> 8) & 0xff]] ^ INV_SUB_MIX_3[SBOX[t & 0xff]];
        }
      }
    },

    encryptBlock: function (M, offset) {
      this._doCryptBlock(M, offset, this._keySchedule, SUB_MIX_0, SUB_MIX_1, SUB_MIX_2, SUB_MIX_3, SBOX);
    },

    decryptBlock: function (M, offset) {
      // Swap 2nd and 4th rows
      var t = M[offset + 1];
      M[offset + 1] = M[offset + 3];
      M[offset + 3] = t;

      this._doCryptBlock(M, offset, this._invKeySchedule, INV_SUB_MIX_0, INV_SUB_MIX_1, INV_SUB_MIX_2, INV_SUB_MIX_3, INV_SBOX);

      // Inv swap 2nd and 4th rows
      var t = M[offset + 1];
      M[offset + 1] = M[offset + 3];
      M[offset + 3] = t;
    },

    _doCryptBlock: function (M, offset, keySchedule, SUB_MIX_0, SUB_MIX_1, SUB_MIX_2, SUB_MIX_3, SBOX) {
      // Shortcut
      var nRounds = this._nRounds;

      // Get input, add round key
      var s0 = M[offset]     ^ keySchedule[0];
      var s1 = M[offset + 1] ^ keySchedule[1];
      var s2 = M[offset + 2] ^ keySchedule[2];
      var s3 = M[offset + 3] ^ keySchedule[3];

      // Key schedule row counter
      var ksRow = 4;

      // Rounds
      for (var round = 1; round < nRounds; round++) {
        // Shift rows, sub bytes, mix columns, add round key
        var t0 = SUB_MIX_0[s0 >>> 24] ^ SUB_MIX_1[(s1 >>> 16) & 0xff] ^ SUB_MIX_2[(s2 >>> 8) & 0xff] ^ SUB_MIX_3[s3 & 0xff] ^ keySchedule[ksRow++];
        var t1 = SUB_MIX_0[s1 >>> 24] ^ SUB_MIX_1[(s2 >>> 16) & 0xff] ^ SUB_MIX_2[(s3 >>> 8) & 0xff] ^ SUB_MIX_3[s0 & 0xff] ^ keySchedule[ksRow++];
        var t2 = SUB_MIX_0[s2 >>> 24] ^ SUB_MIX_1[(s3 >>> 16) & 0xff] ^ SUB_MIX_2[(s0 >>> 8) & 0xff] ^ SUB_MIX_3[s1 & 0xff] ^ keySchedule[ksRow++];
        var t3 = SUB_MIX_0[s3 >>> 24] ^ SUB_MIX_1[(s0 >>> 16) & 0xff] ^ SUB_MIX_2[(s1 >>> 8) & 0xff] ^ SUB_MIX_3[s2 & 0xff] ^ keySchedule[ksRow++];

        // Update state
        s0 = t0;
        s1 = t1;
        s2 = t2;
        s3 = t3;
      }

      // Shift rows, sub bytes, add round key
      var t0 = ((SBOX[s0 >>> 24] << 24) | (SBOX[(s1 >>> 16) & 0xff] << 16) | (SBOX[(s2 >>> 8) & 0xff] << 8) | SBOX[s3 & 0xff]) ^ keySchedule[ksRow++];
      var t1 = ((SBOX[s1 >>> 24] << 24) | (SBOX[(s2 >>> 16) & 0xff] << 16) | (SBOX[(s3 >>> 8) & 0xff] << 8) | SBOX[s0 & 0xff]) ^ keySchedule[ksRow++];
      var t2 = ((SBOX[s2 >>> 24] << 24) | (SBOX[(s3 >>> 16) & 0xff] << 16) | (SBOX[(s0 >>> 8) & 0xff] << 8) | SBOX[s1 & 0xff]) ^ keySchedule[ksRow++];
      var t3 = ((SBOX[s3 >>> 24] << 24) | (SBOX[(s0 >>> 16) & 0xff] << 16) | (SBOX[(s1 >>> 8) & 0xff] << 8) | SBOX[s2 & 0xff]) ^ keySchedule[ksRow++];

      // Set output
      M[offset]     = t0;
      M[offset + 1] = t1;
      M[offset + 2] = t2;
      M[offset + 3] = t3;
    },

    keySize: 256/32
  });

  /**
   * Shortcut functions to the cipher's object interface.
   *
   * @example
   *
   *     var ciphertext = CryptoJS.AES.encrypt(message, key, cfg);
   *     var plaintext  = CryptoJS.AES.decrypt(ciphertext, key, cfg);
   */
  C.AES = BlockCipher._createHelper(AES);
}());
/*
 CryptoJS v3.1.2
 md5.js
 code.google.com/p/crypto-js
 (c) 2009-2013 by Jeff Mott. All rights reserved.
 code.google.com/p/crypto-js/wiki/License
 */
(function (Math) {
  // Shortcuts
  var C = CryptoJS;
  var C_lib = C.lib;
  var WordArray = C_lib.WordArray;
  var Hasher = C_lib.Hasher;
  var C_algo = C.algo;

  // Constants table
  var T = [];

  // Compute constants
  (function () {
    for (var i = 0; i < 64; i++) {
      T[i] = (Math.abs(Math.sin(i + 1)) * 0x100000000) | 0;
    }
  }());

  /**
   * MD5 hash algorithm.
   */
  var MD5 = C_algo.MD5 = Hasher.extend({
    _doReset: function () {
      this._hash = new WordArray.init([
        0x67452301, 0xefcdab89,
        0x98badcfe, 0x10325476
      ]);
    },

    _doProcessBlock: function (M, offset) {
      // Swap endian
      for (var i = 0; i < 16; i++) {
        // Shortcuts
        var offset_i = offset + i;
        var M_offset_i = M[offset_i];

        M[offset_i] = (
            (((M_offset_i << 8)  | (M_offset_i >>> 24)) & 0x00ff00ff) |
                (((M_offset_i << 24) | (M_offset_i >>> 8))  & 0xff00ff00)
            );
      }

      // Shortcuts
      var H = this._hash.words;

      var M_offset_0  = M[offset + 0];
      var M_offset_1  = M[offset + 1];
      var M_offset_2  = M[offset + 2];
      var M_offset_3  = M[offset + 3];
      var M_offset_4  = M[offset + 4];
      var M_offset_5  = M[offset + 5];
      var M_offset_6  = M[offset + 6];
      var M_offset_7  = M[offset + 7];
      var M_offset_8  = M[offset + 8];
      var M_offset_9  = M[offset + 9];
      var M_offset_10 = M[offset + 10];
      var M_offset_11 = M[offset + 11];
      var M_offset_12 = M[offset + 12];
      var M_offset_13 = M[offset + 13];
      var M_offset_14 = M[offset + 14];
      var M_offset_15 = M[offset + 15];

      // Working varialbes
      var a = H[0];
      var b = H[1];
      var c = H[2];
      var d = H[3];

      // Computation
      a = FF(a, b, c, d, M_offset_0,  7,  T[0]);
      d = FF(d, a, b, c, M_offset_1,  12, T[1]);
      c = FF(c, d, a, b, M_offset_2,  17, T[2]);
      b = FF(b, c, d, a, M_offset_3,  22, T[3]);
      a = FF(a, b, c, d, M_offset_4,  7,  T[4]);
      d = FF(d, a, b, c, M_offset_5,  12, T[5]);
      c = FF(c, d, a, b, M_offset_6,  17, T[6]);
      b = FF(b, c, d, a, M_offset_7,  22, T[7]);
      a = FF(a, b, c, d, M_offset_8,  7,  T[8]);
      d = FF(d, a, b, c, M_offset_9,  12, T[9]);
      c = FF(c, d, a, b, M_offset_10, 17, T[10]);
      b = FF(b, c, d, a, M_offset_11, 22, T[11]);
      a = FF(a, b, c, d, M_offset_12, 7,  T[12]);
      d = FF(d, a, b, c, M_offset_13, 12, T[13]);
      c = FF(c, d, a, b, M_offset_14, 17, T[14]);
      b = FF(b, c, d, a, M_offset_15, 22, T[15]);

      a = GG(a, b, c, d, M_offset_1,  5,  T[16]);
      d = GG(d, a, b, c, M_offset_6,  9,  T[17]);
      c = GG(c, d, a, b, M_offset_11, 14, T[18]);
      b = GG(b, c, d, a, M_offset_0,  20, T[19]);
      a = GG(a, b, c, d, M_offset_5,  5,  T[20]);
      d = GG(d, a, b, c, M_offset_10, 9,  T[21]);
      c = GG(c, d, a, b, M_offset_15, 14, T[22]);
      b = GG(b, c, d, a, M_offset_4,  20, T[23]);
      a = GG(a, b, c, d, M_offset_9,  5,  T[24]);
      d = GG(d, a, b, c, M_offset_14, 9,  T[25]);
      c = GG(c, d, a, b, M_offset_3,  14, T[26]);
      b = GG(b, c, d, a, M_offset_8,  20, T[27]);
      a = GG(a, b, c, d, M_offset_13, 5,  T[28]);
      d = GG(d, a, b, c, M_offset_2,  9,  T[29]);
      c = GG(c, d, a, b, M_offset_7,  14, T[30]);
      b = GG(b, c, d, a, M_offset_12, 20, T[31]);

      a = HH(a, b, c, d, M_offset_5,  4,  T[32]);
      d = HH(d, a, b, c, M_offset_8,  11, T[33]);
      c = HH(c, d, a, b, M_offset_11, 16, T[34]);
      b = HH(b, c, d, a, M_offset_14, 23, T[35]);
      a = HH(a, b, c, d, M_offset_1,  4,  T[36]);
      d = HH(d, a, b, c, M_offset_4,  11, T[37]);
      c = HH(c, d, a, b, M_offset_7,  16, T[38]);
      b = HH(b, c, d, a, M_offset_10, 23, T[39]);
      a = HH(a, b, c, d, M_offset_13, 4,  T[40]);
      d = HH(d, a, b, c, M_offset_0,  11, T[41]);
      c = HH(c, d, a, b, M_offset_3,  16, T[42]);
      b = HH(b, c, d, a, M_offset_6,  23, T[43]);
      a = HH(a, b, c, d, M_offset_9,  4,  T[44]);
      d = HH(d, a, b, c, M_offset_12, 11, T[45]);
      c = HH(c, d, a, b, M_offset_15, 16, T[46]);
      b = HH(b, c, d, a, M_offset_2,  23, T[47]);

      a = II(a, b, c, d, M_offset_0,  6,  T[48]);
      d = II(d, a, b, c, M_offset_7,  10, T[49]);
      c = II(c, d, a, b, M_offset_14, 15, T[50]);
      b = II(b, c, d, a, M_offset_5,  21, T[51]);
      a = II(a, b, c, d, M_offset_12, 6,  T[52]);
      d = II(d, a, b, c, M_offset_3,  10, T[53]);
      c = II(c, d, a, b, M_offset_10, 15, T[54]);
      b = II(b, c, d, a, M_offset_1,  21, T[55]);
      a = II(a, b, c, d, M_offset_8,  6,  T[56]);
      d = II(d, a, b, c, M_offset_15, 10, T[57]);
      c = II(c, d, a, b, M_offset_6,  15, T[58]);
      b = II(b, c, d, a, M_offset_13, 21, T[59]);
      a = II(a, b, c, d, M_offset_4,  6,  T[60]);
      d = II(d, a, b, c, M_offset_11, 10, T[61]);
      c = II(c, d, a, b, M_offset_2,  15, T[62]);
      b = II(b, c, d, a, M_offset_9,  21, T[63]);

      // Intermediate hash value
      H[0] = (H[0] + a) | 0;
      H[1] = (H[1] + b) | 0;
      H[2] = (H[2] + c) | 0;
      H[3] = (H[3] + d) | 0;
    },

    _doFinalize: function () {
      // Shortcuts
      var data = this._data;
      var dataWords = data.words;

      var nBitsTotal = this._nDataBytes * 8;
      var nBitsLeft = data.sigBytes * 8;

      // Add padding
      dataWords[nBitsLeft >>> 5] |= 0x80 << (24 - nBitsLeft % 32);

      var nBitsTotalH = Math.floor(nBitsTotal / 0x100000000);
      var nBitsTotalL = nBitsTotal;
      dataWords[(((nBitsLeft + 64) >>> 9) << 4) + 15] = (
          (((nBitsTotalH << 8)  | (nBitsTotalH >>> 24)) & 0x00ff00ff) |
              (((nBitsTotalH << 24) | (nBitsTotalH >>> 8))  & 0xff00ff00)
          );
      dataWords[(((nBitsLeft + 64) >>> 9) << 4) + 14] = (
          (((nBitsTotalL << 8)  | (nBitsTotalL >>> 24)) & 0x00ff00ff) |
              (((nBitsTotalL << 24) | (nBitsTotalL >>> 8))  & 0xff00ff00)
          );

      data.sigBytes = (dataWords.length + 1) * 4;

      // Hash final blocks
      this._process();

      // Shortcuts
      var hash = this._hash;
      var H = hash.words;

      // Swap endian
      for (var i = 0; i < 4; i++) {
        // Shortcut
        var H_i = H[i];

        H[i] = (((H_i << 8)  | (H_i >>> 24)) & 0x00ff00ff) |
            (((H_i << 24) | (H_i >>> 8))  & 0xff00ff00);
      }

      // Return final computed hash
      return hash;
    },

    clone: function () {
      var clone = Hasher.clone.call(this);
      clone._hash = this._hash.clone();

      return clone;
    }
  });

  function FF(a, b, c, d, x, s, t) {
    var n = a + ((b & c) | (~b & d)) + x + t;
    return ((n << s) | (n >>> (32 - s))) + b;
  }

  function GG(a, b, c, d, x, s, t) {
    var n = a + ((b & d) | (c & ~d)) + x + t;
    return ((n << s) | (n >>> (32 - s))) + b;
  }

  function HH(a, b, c, d, x, s, t) {
    var n = a + (b ^ c ^ d) + x + t;
    return ((n << s) | (n >>> (32 - s))) + b;
  }

  function II(a, b, c, d, x, s, t) {
    var n = a + (c ^ (b | ~d)) + x + t;
    return ((n << s) | (n >>> (32 - s))) + b;
  }

  /**
   * Shortcut function to the hasher's object interface.
   *
   * @param {WordArray|string} message The message to hash.
   *
   * @return {WordArray} The hash.
   *
   * @static
   *
   * @example
   *
   *     var hash = CryptoJS.MD5('message');
   *     var hash = CryptoJS.MD5(wordArray);
   */
  C.MD5 = Hasher._createHelper(MD5);

  /**
   * Shortcut function to the HMAC's object interface.
   *
   * @param {WordArray|string} message The message to hash.
   * @param {WordArray|string} key The secret key.
   *
   * @return {WordArray} The HMAC.
   *
   * @static
   *
   * @example
   *
   *     var hmac = CryptoJS.HmacMD5(message, key);
   */
  C.HmacMD5 = Hasher._createHmacHelper(MD5);
}(Math));
/*
 CryptoJS v3.1.2
 sha1.js
 code.google.com/p/crypto-js
 (c) 2009-2013 by Jeff Mott. All rights reserved.
 code.google.com/p/crypto-js/wiki/License
 */
(function () {
  // Shortcuts
  var C = CryptoJS;
  var C_lib = C.lib;
  var WordArray = C_lib.WordArray;
  var Hasher = C_lib.Hasher;
  var C_algo = C.algo;

  // Reusable object
  var W = [];

  /**
   * SHA-1 hash algorithm.
   */
  var SHA1 = C_algo.SHA1 = Hasher.extend({
    _doReset: function () {
      this._hash = new WordArray.init([
        0x67452301, 0xefcdab89,
        0x98badcfe, 0x10325476,
        0xc3d2e1f0
      ]);
    },

    _doProcessBlock: function (M, offset) {
      // Shortcut
      var H = this._hash.words;

      // Working variables
      var a = H[0];
      var b = H[1];
      var c = H[2];
      var d = H[3];
      var e = H[4];

      // Computation
      for (var i = 0; i < 80; i++) {
        if (i < 16) {
          W[i] = M[offset + i] | 0;
        } else {
          var n = W[i - 3] ^ W[i - 8] ^ W[i - 14] ^ W[i - 16];
          W[i] = (n << 1) | (n >>> 31);
        }

        var t = ((a << 5) | (a >>> 27)) + e + W[i];
        if (i < 20) {
          t += ((b & c) | (~b & d)) + 0x5a827999;
        } else if (i < 40) {
          t += (b ^ c ^ d) + 0x6ed9eba1;
        } else if (i < 60) {
          t += ((b & c) | (b & d) | (c & d)) - 0x70e44324;
        } else /* if (i < 80) */ {
          t += (b ^ c ^ d) - 0x359d3e2a;
        }

        e = d;
        d = c;
        c = (b << 30) | (b >>> 2);
        b = a;
        a = t;
      }

      // Intermediate hash value
      H[0] = (H[0] + a) | 0;
      H[1] = (H[1] + b) | 0;
      H[2] = (H[2] + c) | 0;
      H[3] = (H[3] + d) | 0;
      H[4] = (H[4] + e) | 0;
    },

    _doFinalize: function () {
      // Shortcuts
      var data = this._data;
      var dataWords = data.words;

      var nBitsTotal = this._nDataBytes * 8;
      var nBitsLeft = data.sigBytes * 8;

      // Add padding
      dataWords[nBitsLeft >>> 5] |= 0x80 << (24 - nBitsLeft % 32);
      dataWords[(((nBitsLeft + 64) >>> 9) << 4) + 14] = Math.floor(nBitsTotal / 0x100000000);
      dataWords[(((nBitsLeft + 64) >>> 9) << 4) + 15] = nBitsTotal;
      data.sigBytes = dataWords.length * 4;

      // Hash final blocks
      this._process();

      // Return final computed hash
      return this._hash;
    },

    clone: function () {
      var clone = Hasher.clone.call(this);
      clone._hash = this._hash.clone();

      return clone;
    }
  });

  /**
   * Shortcut function to the hasher's object interface.
   *
   * @param {WordArray|string} message The message to hash.
   *
   * @return {WordArray} The hash.
   *
   * @static
   *
   * @example
   *
   *     var hash = CryptoJS.SHA1('message');
   *     var hash = CryptoJS.SHA1(wordArray);
   */
  C.SHA1 = Hasher._createHelper(SHA1);

  /**
   * Shortcut function to the HMAC's object interface.
   *
   * @param {WordArray|string} message The message to hash.
   * @param {WordArray|string} key The secret key.
   *
   * @return {WordArray} The HMAC.
   *
   * @static
   *
   * @example
   *
   *     var hmac = CryptoJS.HmacSHA1(message, key);
   */
  C.HmacSHA1 = Hasher._createHmacHelper(SHA1);
}());
/*
 CryptoJS v3.1.2
 x64-core.js
 code.google.com/p/crypto-js
 (c) 2009-2013 by Jeff Mott. All rights reserved.
 code.google.com/p/crypto-js/wiki/License
 */
(function (undefined) {
  // Shortcuts
  var C = CryptoJS;
  var C_lib = C.lib;
  var Base = C_lib.Base;
  var X32WordArray = C_lib.WordArray;

  /**
   * x64 namespace.
   */
  var C_x64 = C.x64 = {};

  /**
   * A 64-bit word.
   */
  var X64Word = C_x64.Word = Base.extend({
    /**
     * Initializes a newly created 64-bit word.
     *
     * @param {number} high The high 32 bits.
     * @param {number} low The low 32 bits.
     *
     * @example
     *
     *     var x64Word = CryptoJS.x64.Word.create(0x00010203, 0x04050607);
     */
    init: function (high, low) {
      this.high = high;
      this.low = low;
    }

    /**
     * Bitwise NOTs this word.
     *
     * @return {X64Word} A new x64-Word object after negating.
     *
     * @example
     *
     *     var negated = x64Word.not();
     */
    // not: function () {
    // var high = ~this.high;
    // var low = ~this.low;

    // return X64Word.create(high, low);
    // },

    /**
     * Bitwise ANDs this word with the passed word.
     *
     * @param {X64Word} word The x64-Word to AND with this word.
     *
     * @return {X64Word} A new x64-Word object after ANDing.
     *
     * @example
     *
     *     var anded = x64Word.and(anotherX64Word);
     */
    // and: function (word) {
    // var high = this.high & word.high;
    // var low = this.low & word.low;

    // return X64Word.create(high, low);
    // },

    /**
     * Bitwise ORs this word with the passed word.
     *
     * @param {X64Word} word The x64-Word to OR with this word.
     *
     * @return {X64Word} A new x64-Word object after ORing.
     *
     * @example
     *
     *     var ored = x64Word.or(anotherX64Word);
     */
    // or: function (word) {
    // var high = this.high | word.high;
    // var low = this.low | word.low;

    // return X64Word.create(high, low);
    // },

    /**
     * Bitwise XORs this word with the passed word.
     *
     * @param {X64Word} word The x64-Word to XOR with this word.
     *
     * @return {X64Word} A new x64-Word object after XORing.
     *
     * @example
     *
     *     var xored = x64Word.xor(anotherX64Word);
     */
    // xor: function (word) {
    // var high = this.high ^ word.high;
    // var low = this.low ^ word.low;

    // return X64Word.create(high, low);
    // },

    /**
     * Shifts this word n bits to the left.
     *
     * @param {number} n The number of bits to shift.
     *
     * @return {X64Word} A new x64-Word object after shifting.
     *
     * @example
     *
     *     var shifted = x64Word.shiftL(25);
     */
    // shiftL: function (n) {
    // if (n < 32) {
    // var high = (this.high << n) | (this.low >>> (32 - n));
    // var low = this.low << n;
    // } else {
    // var high = this.low << (n - 32);
    // var low = 0;
    // }

    // return X64Word.create(high, low);
    // },

    /**
     * Shifts this word n bits to the right.
     *
     * @param {number} n The number of bits to shift.
     *
     * @return {X64Word} A new x64-Word object after shifting.
     *
     * @example
     *
     *     var shifted = x64Word.shiftR(7);
     */
    // shiftR: function (n) {
    // if (n < 32) {
    // var low = (this.low >>> n) | (this.high << (32 - n));
    // var high = this.high >>> n;
    // } else {
    // var low = this.high >>> (n - 32);
    // var high = 0;
    // }

    // return X64Word.create(high, low);
    // },

    /**
     * Rotates this word n bits to the left.
     *
     * @param {number} n The number of bits to rotate.
     *
     * @return {X64Word} A new x64-Word object after rotating.
     *
     * @example
     *
     *     var rotated = x64Word.rotL(25);
     */
    // rotL: function (n) {
    // return this.shiftL(n).or(this.shiftR(64 - n));
    // },

    /**
     * Rotates this word n bits to the right.
     *
     * @param {number} n The number of bits to rotate.
     *
     * @return {X64Word} A new x64-Word object after rotating.
     *
     * @example
     *
     *     var rotated = x64Word.rotR(7);
     */
    // rotR: function (n) {
    // return this.shiftR(n).or(this.shiftL(64 - n));
    // },

    /**
     * Adds this word with the passed word.
     *
     * @param {X64Word} word The x64-Word to add with this word.
     *
     * @return {X64Word} A new x64-Word object after adding.
     *
     * @example
     *
     *     var added = x64Word.add(anotherX64Word);
     */
    // add: function (word) {
    // var low = (this.low + word.low) | 0;
    // var carry = (low >>> 0) < (this.low >>> 0) ? 1 : 0;
    // var high = (this.high + word.high + carry) | 0;

    // return X64Word.create(high, low);
    // }
  });

  /**
   * An array of 64-bit words.
   *
   * @property {Array} words The array of CryptoJS.x64.Word objects.
   * @property {number} sigBytes The number of significant bytes in this word array.
   */
  var X64WordArray = C_x64.WordArray = Base.extend({
    /**
     * Initializes a newly created word array.
     *
     * @param {Array} words (Optional) An array of CryptoJS.x64.Word objects.
     * @param {number} sigBytes (Optional) The number of significant bytes in the words.
     *
     * @example
     *
     *     var wordArray = CryptoJS.x64.WordArray.create();
     *
     *     var wordArray = CryptoJS.x64.WordArray.create([
     *         CryptoJS.x64.Word.create(0x00010203, 0x04050607),
     *         CryptoJS.x64.Word.create(0x18191a1b, 0x1c1d1e1f)
     *     ]);
     *
     *     var wordArray = CryptoJS.x64.WordArray.create([
     *         CryptoJS.x64.Word.create(0x00010203, 0x04050607),
     *         CryptoJS.x64.Word.create(0x18191a1b, 0x1c1d1e1f)
     *     ], 10);
     */
    init: function (words, sigBytes) {
      words = this.words = words || [];

      if (sigBytes != undefined) {
        this.sigBytes = sigBytes;
      } else {
        this.sigBytes = words.length * 8;
      }
    },

    /**
     * Converts this 64-bit word array to a 32-bit word array.
     *
     * @return {CryptoJS.lib.WordArray} This word array's data as a 32-bit word array.
     *
     * @example
     *
     *     var x32WordArray = x64WordArray.toX32();
     */
    toX32: function () {
      // Shortcuts
      var x64Words = this.words;
      var x64WordsLength = x64Words.length;

      // Convert
      var x32Words = [];
      for (var i = 0; i < x64WordsLength; i++) {
        var x64Word = x64Words[i];
        x32Words.push(x64Word.high);
        x32Words.push(x64Word.low);
      }

      return X32WordArray.create(x32Words, this.sigBytes);
    },

    /**
     * Creates a copy of this word array.
     *
     * @return {X64WordArray} The clone.
     *
     * @example
     *
     *     var clone = x64WordArray.clone();
     */
    clone: function () {
      var clone = Base.clone.call(this);

      // Clone "words" array
      var words = clone.words = this.words.slice(0);

      // Clone each X64Word object
      var wordsLength = words.length;
      for (var i = 0; i < wordsLength; i++) {
        words[i] = words[i].clone();
      }

      return clone;
    }
  });
}());
/*
 CryptoJS v3.1.2
 sha256.js
 code.google.com/p/crypto-js
 (c) 2009-2013 by Jeff Mott. All rights reserved.
 code.google.com/p/crypto-js/wiki/License
 */
(function (Math) {
  // Shortcuts
  var C = CryptoJS;
  var C_lib = C.lib;
  var WordArray = C_lib.WordArray;
  var Hasher = C_lib.Hasher;
  var C_algo = C.algo;

  // Initialization and round constants tables
  var H = [];
  var K = [];

  // Compute constants
  (function () {
    function isPrime(n) {
      var sqrtN = Math.sqrt(n);
      for (var factor = 2; factor <= sqrtN; factor++) {
        if (!(n % factor)) {
          return false;
        }
      }

      return true;
    }

    function getFractionalBits(n) {
      return ((n - (n | 0)) * 0x100000000) | 0;
    }

    var n = 2;
    var nPrime = 0;
    while (nPrime < 64) {
      if (isPrime(n)) {
        if (nPrime < 8) {
          H[nPrime] = getFractionalBits(Math.pow(n, 1 / 2));
        }
        K[nPrime] = getFractionalBits(Math.pow(n, 1 / 3));

        nPrime++;
      }

      n++;
    }
  }());

  // Reusable object
  var W = [];

  /**
   * SHA-256 hash algorithm.
   */
  var SHA256 = C_algo.SHA256 = Hasher.extend({
    _doReset: function () {
      this._hash = new WordArray.init(H.slice(0));
    },

    _doProcessBlock: function (M, offset) {
      // Shortcut
      var H = this._hash.words;

      // Working variables
      var a = H[0];
      var b = H[1];
      var c = H[2];
      var d = H[3];
      var e = H[4];
      var f = H[5];
      var g = H[6];
      var h = H[7];

      // Computation
      for (var i = 0; i < 64; i++) {
        if (i < 16) {
          W[i] = M[offset + i] | 0;
        } else {
          var gamma0x = W[i - 15];
          var gamma0  = ((gamma0x << 25) | (gamma0x >>> 7))  ^
              ((gamma0x << 14) | (gamma0x >>> 18)) ^
              (gamma0x >>> 3);

          var gamma1x = W[i - 2];
          var gamma1  = ((gamma1x << 15) | (gamma1x >>> 17)) ^
              ((gamma1x << 13) | (gamma1x >>> 19)) ^
              (gamma1x >>> 10);

          W[i] = gamma0 + W[i - 7] + gamma1 + W[i - 16];
        }

        var ch  = (e & f) ^ (~e & g);
        var maj = (a & b) ^ (a & c) ^ (b & c);

        var sigma0 = ((a << 30) | (a >>> 2)) ^ ((a << 19) | (a >>> 13)) ^ ((a << 10) | (a >>> 22));
        var sigma1 = ((e << 26) | (e >>> 6)) ^ ((e << 21) | (e >>> 11)) ^ ((e << 7)  | (e >>> 25));

        var t1 = h + sigma1 + ch + K[i] + W[i];
        var t2 = sigma0 + maj;

        h = g;
        g = f;
        f = e;
        e = (d + t1) | 0;
        d = c;
        c = b;
        b = a;
        a = (t1 + t2) | 0;
      }

      // Intermediate hash value
      H[0] = (H[0] + a) | 0;
      H[1] = (H[1] + b) | 0;
      H[2] = (H[2] + c) | 0;
      H[3] = (H[3] + d) | 0;
      H[4] = (H[4] + e) | 0;
      H[5] = (H[5] + f) | 0;
      H[6] = (H[6] + g) | 0;
      H[7] = (H[7] + h) | 0;
    },

    _doFinalize: function () {
      // Shortcuts
      var data = this._data;
      var dataWords = data.words;

      var nBitsTotal = this._nDataBytes * 8;
      var nBitsLeft = data.sigBytes * 8;

      // Add padding
      dataWords[nBitsLeft >>> 5] |= 0x80 << (24 - nBitsLeft % 32);
      dataWords[(((nBitsLeft + 64) >>> 9) << 4) + 14] = Math.floor(nBitsTotal / 0x100000000);
      dataWords[(((nBitsLeft + 64) >>> 9) << 4) + 15] = nBitsTotal;
      data.sigBytes = dataWords.length * 4;

      // Hash final blocks
      this._process();

      // Return final computed hash
      return this._hash;
    },

    clone: function () {
      var clone = Hasher.clone.call(this);
      clone._hash = this._hash.clone();

      return clone;
    }
  });

  /**
   * Shortcut function to the hasher's object interface.
   *
   * @param {WordArray|string} message The message to hash.
   *
   * @return {WordArray} The hash.
   *
   * @static
   *
   * @example
   *
   *     var hash = CryptoJS.SHA256('message');
   *     var hash = CryptoJS.SHA256(wordArray);
   */
  C.SHA256 = Hasher._createHelper(SHA256);

  /**
   * Shortcut function to the HMAC's object interface.
   *
   * @param {WordArray|string} message The message to hash.
   * @param {WordArray|string} key The secret key.
   *
   * @return {WordArray} The HMAC.
   *
   * @static
   *
   * @example
   *
   *     var hmac = CryptoJS.HmacSHA256(message, key);
   */
  C.HmacSHA256 = Hasher._createHmacHelper(SHA256);
}(Math));
/*
 CryptoJS v3.1.2
 sha512.js
 code.google.com/p/crypto-js
 (c) 2009-2013 by Jeff Mott. All rights reserved.
 code.google.com/p/crypto-js/wiki/License
 */
(function () {
  // Shortcuts
  var C = CryptoJS;
  var C_lib = C.lib;
  var Hasher = C_lib.Hasher;
  var C_x64 = C.x64;
  var X64Word = C_x64.Word;
  var X64WordArray = C_x64.WordArray;
  var C_algo = C.algo;

  function X64Word_create() {
    return X64Word.create.apply(X64Word, arguments);
  }

  // Constants
  var K = [
    X64Word_create(0x428a2f98, 0xd728ae22), X64Word_create(0x71374491, 0x23ef65cd),
    X64Word_create(0xb5c0fbcf, 0xec4d3b2f), X64Word_create(0xe9b5dba5, 0x8189dbbc),
    X64Word_create(0x3956c25b, 0xf348b538), X64Word_create(0x59f111f1, 0xb605d019),
    X64Word_create(0x923f82a4, 0xaf194f9b), X64Word_create(0xab1c5ed5, 0xda6d8118),
    X64Word_create(0xd807aa98, 0xa3030242), X64Word_create(0x12835b01, 0x45706fbe),
    X64Word_create(0x243185be, 0x4ee4b28c), X64Word_create(0x550c7dc3, 0xd5ffb4e2),
    X64Word_create(0x72be5d74, 0xf27b896f), X64Word_create(0x80deb1fe, 0x3b1696b1),
    X64Word_create(0x9bdc06a7, 0x25c71235), X64Word_create(0xc19bf174, 0xcf692694),
    X64Word_create(0xe49b69c1, 0x9ef14ad2), X64Word_create(0xefbe4786, 0x384f25e3),
    X64Word_create(0x0fc19dc6, 0x8b8cd5b5), X64Word_create(0x240ca1cc, 0x77ac9c65),
    X64Word_create(0x2de92c6f, 0x592b0275), X64Word_create(0x4a7484aa, 0x6ea6e483),
    X64Word_create(0x5cb0a9dc, 0xbd41fbd4), X64Word_create(0x76f988da, 0x831153b5),
    X64Word_create(0x983e5152, 0xee66dfab), X64Word_create(0xa831c66d, 0x2db43210),
    X64Word_create(0xb00327c8, 0x98fb213f), X64Word_create(0xbf597fc7, 0xbeef0ee4),
    X64Word_create(0xc6e00bf3, 0x3da88fc2), X64Word_create(0xd5a79147, 0x930aa725),
    X64Word_create(0x06ca6351, 0xe003826f), X64Word_create(0x14292967, 0x0a0e6e70),
    X64Word_create(0x27b70a85, 0x46d22ffc), X64Word_create(0x2e1b2138, 0x5c26c926),
    X64Word_create(0x4d2c6dfc, 0x5ac42aed), X64Word_create(0x53380d13, 0x9d95b3df),
    X64Word_create(0x650a7354, 0x8baf63de), X64Word_create(0x766a0abb, 0x3c77b2a8),
    X64Word_create(0x81c2c92e, 0x47edaee6), X64Word_create(0x92722c85, 0x1482353b),
    X64Word_create(0xa2bfe8a1, 0x4cf10364), X64Word_create(0xa81a664b, 0xbc423001),
    X64Word_create(0xc24b8b70, 0xd0f89791), X64Word_create(0xc76c51a3, 0x0654be30),
    X64Word_create(0xd192e819, 0xd6ef5218), X64Word_create(0xd6990624, 0x5565a910),
    X64Word_create(0xf40e3585, 0x5771202a), X64Word_create(0x106aa070, 0x32bbd1b8),
    X64Word_create(0x19a4c116, 0xb8d2d0c8), X64Word_create(0x1e376c08, 0x5141ab53),
    X64Word_create(0x2748774c, 0xdf8eeb99), X64Word_create(0x34b0bcb5, 0xe19b48a8),
    X64Word_create(0x391c0cb3, 0xc5c95a63), X64Word_create(0x4ed8aa4a, 0xe3418acb),
    X64Word_create(0x5b9cca4f, 0x7763e373), X64Word_create(0x682e6ff3, 0xd6b2b8a3),
    X64Word_create(0x748f82ee, 0x5defb2fc), X64Word_create(0x78a5636f, 0x43172f60),
    X64Word_create(0x84c87814, 0xa1f0ab72), X64Word_create(0x8cc70208, 0x1a6439ec),
    X64Word_create(0x90befffa, 0x23631e28), X64Word_create(0xa4506ceb, 0xde82bde9),
    X64Word_create(0xbef9a3f7, 0xb2c67915), X64Word_create(0xc67178f2, 0xe372532b),
    X64Word_create(0xca273ece, 0xea26619c), X64Word_create(0xd186b8c7, 0x21c0c207),
    X64Word_create(0xeada7dd6, 0xcde0eb1e), X64Word_create(0xf57d4f7f, 0xee6ed178),
    X64Word_create(0x06f067aa, 0x72176fba), X64Word_create(0x0a637dc5, 0xa2c898a6),
    X64Word_create(0x113f9804, 0xbef90dae), X64Word_create(0x1b710b35, 0x131c471b),
    X64Word_create(0x28db77f5, 0x23047d84), X64Word_create(0x32caab7b, 0x40c72493),
    X64Word_create(0x3c9ebe0a, 0x15c9bebc), X64Word_create(0x431d67c4, 0x9c100d4c),
    X64Word_create(0x4cc5d4be, 0xcb3e42b6), X64Word_create(0x597f299c, 0xfc657e2a),
    X64Word_create(0x5fcb6fab, 0x3ad6faec), X64Word_create(0x6c44198c, 0x4a475817)
  ];

  // Reusable objects
  var W = [];
  (function () {
    for (var i = 0; i < 80; i++) {
      W[i] = X64Word_create();
    }
  }());

  /**
   * SHA-512 hash algorithm.
   */
  var SHA512 = C_algo.SHA512 = Hasher.extend({
    _doReset: function () {
      this._hash = new X64WordArray.init([
        new X64Word.init(0x6a09e667, 0xf3bcc908), new X64Word.init(0xbb67ae85, 0x84caa73b),
        new X64Word.init(0x3c6ef372, 0xfe94f82b), new X64Word.init(0xa54ff53a, 0x5f1d36f1),
        new X64Word.init(0x510e527f, 0xade682d1), new X64Word.init(0x9b05688c, 0x2b3e6c1f),
        new X64Word.init(0x1f83d9ab, 0xfb41bd6b), new X64Word.init(0x5be0cd19, 0x137e2179)
      ]);
    },

    _doProcessBlock: function (M, offset) {
      // Shortcuts
      var H = this._hash.words;

      var H0 = H[0];
      var H1 = H[1];
      var H2 = H[2];
      var H3 = H[3];
      var H4 = H[4];
      var H5 = H[5];
      var H6 = H[6];
      var H7 = H[7];

      var H0h = H0.high;
      var H0l = H0.low;
      var H1h = H1.high;
      var H1l = H1.low;
      var H2h = H2.high;
      var H2l = H2.low;
      var H3h = H3.high;
      var H3l = H3.low;
      var H4h = H4.high;
      var H4l = H4.low;
      var H5h = H5.high;
      var H5l = H5.low;
      var H6h = H6.high;
      var H6l = H6.low;
      var H7h = H7.high;
      var H7l = H7.low;

      // Working variables
      var ah = H0h;
      var al = H0l;
      var bh = H1h;
      var bl = H1l;
      var ch = H2h;
      var cl = H2l;
      var dh = H3h;
      var dl = H3l;
      var eh = H4h;
      var el = H4l;
      var fh = H5h;
      var fl = H5l;
      var gh = H6h;
      var gl = H6l;
      var hh = H7h;
      var hl = H7l;

      // Rounds
      for (var i = 0; i < 80; i++) {
        // Shortcut
        var Wi = W[i];

        // Extend message
        if (i < 16) {
          var Wih = Wi.high = M[offset + i * 2]     | 0;
          var Wil = Wi.low  = M[offset + i * 2 + 1] | 0;
        } else {
          // Gamma0
          var gamma0x  = W[i - 15];
          var gamma0xh = gamma0x.high;
          var gamma0xl = gamma0x.low;
          var gamma0h  = ((gamma0xh >>> 1) | (gamma0xl << 31)) ^ ((gamma0xh >>> 8) | (gamma0xl << 24)) ^ (gamma0xh >>> 7);
          var gamma0l  = ((gamma0xl >>> 1) | (gamma0xh << 31)) ^ ((gamma0xl >>> 8) | (gamma0xh << 24)) ^ ((gamma0xl >>> 7) | (gamma0xh << 25));

          // Gamma1
          var gamma1x  = W[i - 2];
          var gamma1xh = gamma1x.high;
          var gamma1xl = gamma1x.low;
          var gamma1h  = ((gamma1xh >>> 19) | (gamma1xl << 13)) ^ ((gamma1xh << 3) | (gamma1xl >>> 29)) ^ (gamma1xh >>> 6);
          var gamma1l  = ((gamma1xl >>> 19) | (gamma1xh << 13)) ^ ((gamma1xl << 3) | (gamma1xh >>> 29)) ^ ((gamma1xl >>> 6) | (gamma1xh << 26));

          // W[i] = gamma0 + W[i - 7] + gamma1 + W[i - 16]
          var Wi7  = W[i - 7];
          var Wi7h = Wi7.high;
          var Wi7l = Wi7.low;

          var Wi16  = W[i - 16];
          var Wi16h = Wi16.high;
          var Wi16l = Wi16.low;

          var Wil = gamma0l + Wi7l;
          var Wih = gamma0h + Wi7h + ((Wil >>> 0) < (gamma0l >>> 0) ? 1 : 0);
          var Wil = Wil + gamma1l;
          var Wih = Wih + gamma1h + ((Wil >>> 0) < (gamma1l >>> 0) ? 1 : 0);
          var Wil = Wil + Wi16l;
          var Wih = Wih + Wi16h + ((Wil >>> 0) < (Wi16l >>> 0) ? 1 : 0);

          Wi.high = Wih;
          Wi.low  = Wil;
        }

        var chh  = (eh & fh) ^ (~eh & gh);
        var chl  = (el & fl) ^ (~el & gl);
        var majh = (ah & bh) ^ (ah & ch) ^ (bh & ch);
        var majl = (al & bl) ^ (al & cl) ^ (bl & cl);

        var sigma0h = ((ah >>> 28) | (al << 4))  ^ ((ah << 30)  | (al >>> 2)) ^ ((ah << 25) | (al >>> 7));
        var sigma0l = ((al >>> 28) | (ah << 4))  ^ ((al << 30)  | (ah >>> 2)) ^ ((al << 25) | (ah >>> 7));
        var sigma1h = ((eh >>> 14) | (el << 18)) ^ ((eh >>> 18) | (el << 14)) ^ ((eh << 23) | (el >>> 9));
        var sigma1l = ((el >>> 14) | (eh << 18)) ^ ((el >>> 18) | (eh << 14)) ^ ((el << 23) | (eh >>> 9));

        // t1 = h + sigma1 + ch + K[i] + W[i]
        var Ki  = K[i];
        var Kih = Ki.high;
        var Kil = Ki.low;

        var t1l = hl + sigma1l;
        var t1h = hh + sigma1h + ((t1l >>> 0) < (hl >>> 0) ? 1 : 0);
        var t1l = t1l + chl;
        var t1h = t1h + chh + ((t1l >>> 0) < (chl >>> 0) ? 1 : 0);
        var t1l = t1l + Kil;
        var t1h = t1h + Kih + ((t1l >>> 0) < (Kil >>> 0) ? 1 : 0);
        var t1l = t1l + Wil;
        var t1h = t1h + Wih + ((t1l >>> 0) < (Wil >>> 0) ? 1 : 0);

        // t2 = sigma0 + maj
        var t2l = sigma0l + majl;
        var t2h = sigma0h + majh + ((t2l >>> 0) < (sigma0l >>> 0) ? 1 : 0);

        // Update working variables
        hh = gh;
        hl = gl;
        gh = fh;
        gl = fl;
        fh = eh;
        fl = el;
        el = (dl + t1l) | 0;
        eh = (dh + t1h + ((el >>> 0) < (dl >>> 0) ? 1 : 0)) | 0;
        dh = ch;
        dl = cl;
        ch = bh;
        cl = bl;
        bh = ah;
        bl = al;
        al = (t1l + t2l) | 0;
        ah = (t1h + t2h + ((al >>> 0) < (t1l >>> 0) ? 1 : 0)) | 0;
      }

      // Intermediate hash value
      H0l = H0.low  = (H0l + al);
      H0.high = (H0h + ah + ((H0l >>> 0) < (al >>> 0) ? 1 : 0));
      H1l = H1.low  = (H1l + bl);
      H1.high = (H1h + bh + ((H1l >>> 0) < (bl >>> 0) ? 1 : 0));
      H2l = H2.low  = (H2l + cl);
      H2.high = (H2h + ch + ((H2l >>> 0) < (cl >>> 0) ? 1 : 0));
      H3l = H3.low  = (H3l + dl);
      H3.high = (H3h + dh + ((H3l >>> 0) < (dl >>> 0) ? 1 : 0));
      H4l = H4.low  = (H4l + el);
      H4.high = (H4h + eh + ((H4l >>> 0) < (el >>> 0) ? 1 : 0));
      H5l = H5.low  = (H5l + fl);
      H5.high = (H5h + fh + ((H5l >>> 0) < (fl >>> 0) ? 1 : 0));
      H6l = H6.low  = (H6l + gl);
      H6.high = (H6h + gh + ((H6l >>> 0) < (gl >>> 0) ? 1 : 0));
      H7l = H7.low  = (H7l + hl);
      H7.high = (H7h + hh + ((H7l >>> 0) < (hl >>> 0) ? 1 : 0));
    },

    _doFinalize: function () {
      // Shortcuts
      var data = this._data;
      var dataWords = data.words;

      var nBitsTotal = this._nDataBytes * 8;
      var nBitsLeft = data.sigBytes * 8;

      // Add padding
      dataWords[nBitsLeft >>> 5] |= 0x80 << (24 - nBitsLeft % 32);
      dataWords[(((nBitsLeft + 128) >>> 10) << 5) + 30] = Math.floor(nBitsTotal / 0x100000000);
      dataWords[(((nBitsLeft + 128) >>> 10) << 5) + 31] = nBitsTotal;
      data.sigBytes = dataWords.length * 4;

      // Hash final blocks
      this._process();

      // Convert hash to 32-bit word array before returning
      var hash = this._hash.toX32();

      // Return final computed hash
      return hash;
    },

    clone: function () {
      var clone = Hasher.clone.call(this);
      clone._hash = this._hash.clone();

      return clone;
    },

    blockSize: 1024/32
  });

  /**
   * Shortcut function to the hasher's object interface.
   *
   * @param {WordArray|string} message The message to hash.
   *
   * @return {WordArray} The hash.
   *
   * @static
   *
   * @example
   *
   *     var hash = CryptoJS.SHA512('message');
   *     var hash = CryptoJS.SHA512(wordArray);
   */
  C.SHA512 = Hasher._createHelper(SHA512);

  /**
   * Shortcut function to the HMAC's object interface.
   *
   * @param {WordArray|string} message The message to hash.
   * @param {WordArray|string} key The secret key.
   *
   * @return {WordArray} The HMAC.
   *
   * @static
   *
   * @example
   *
   *     var hmac = CryptoJS.HmacSHA512(message, key);
   */
  C.HmacSHA512 = Hasher._createHmacHelper(SHA512);
}());
/*
 CryptoJS v3.1.2
 sha3.js
 code.google.com/p/crypto-js
 (c) 2009-2013 by Jeff Mott. All rights reserved.
 code.google.com/p/crypto-js/wiki/License
 */
(function (Math) {
  // Shortcuts
  var C = CryptoJS;
  var C_lib = C.lib;
  var WordArray = C_lib.WordArray;
  var Hasher = C_lib.Hasher;
  var C_x64 = C.x64;
  var X64Word = C_x64.Word;
  var C_algo = C.algo;

  // Constants tables
  var RHO_OFFSETS = [];
  var PI_INDEXES  = [];
  var ROUND_CONSTANTS = [];

  // Compute Constants
  (function () {
    // Compute rho offset constants
    var x = 1, y = 0;
    for (var t = 0; t < 24; t++) {
      RHO_OFFSETS[x + 5 * y] = ((t + 1) * (t + 2) / 2) % 64;

      var newX = y % 5;
      var newY = (2 * x + 3 * y) % 5;
      x = newX;
      y = newY;
    }

    // Compute pi index constants
    for (var x = 0; x < 5; x++) {
      for (var y = 0; y < 5; y++) {
        PI_INDEXES[x + 5 * y] = y + ((2 * x + 3 * y) % 5) * 5;
      }
    }

    // Compute round constants
    var LFSR = 0x01;
    for (var i = 0; i < 24; i++) {
      var roundConstantMsw = 0;
      var roundConstantLsw = 0;

      for (var j = 0; j < 7; j++) {
        if (LFSR & 0x01) {
          var bitPosition = (1 << j) - 1;
          if (bitPosition < 32) {
            roundConstantLsw ^= 1 << bitPosition;
          } else /* if (bitPosition >= 32) */ {
            roundConstantMsw ^= 1 << (bitPosition - 32);
          }
        }

        // Compute next LFSR
        if (LFSR & 0x80) {
          // Primitive polynomial over GF(2): x^8 + x^6 + x^5 + x^4 + 1
          LFSR = (LFSR << 1) ^ 0x71;
        } else {
          LFSR <<= 1;
        }
      }

      ROUND_CONSTANTS[i] = X64Word.create(roundConstantMsw, roundConstantLsw);
    }
  }());

  // Reusable objects for temporary values
  var T = [];
  (function () {
    for (var i = 0; i < 25; i++) {
      T[i] = X64Word.create();
    }
  }());

  /**
   * SHA-3 hash algorithm.
   */
  var SHA3 = C_algo.SHA3 = Hasher.extend({
    /**
     * Configuration options.
     *
     * @property {number} outputLength
     *   The desired number of bits in the output hash.
     *   Only values permitted are: 224, 256, 384, 512.
     *   Default: 512
     */
    cfg: Hasher.cfg.extend({
      outputLength: 512
    }),

    _doReset: function () {
      var state = this._state = []
      for (var i = 0; i < 25; i++) {
        state[i] = new X64Word.init();
      }

      this.blockSize = (1600 - 2 * this.cfg.outputLength) / 32;
    },

    _doProcessBlock: function (M, offset) {
      // Shortcuts
      var state = this._state;
      var nBlockSizeLanes = this.blockSize / 2;

      // Absorb
      for (var i = 0; i < nBlockSizeLanes; i++) {
        // Shortcuts
        var M2i  = M[offset + 2 * i];
        var M2i1 = M[offset + 2 * i + 1];

        // Swap endian
        M2i = (
            (((M2i << 8)  | (M2i >>> 24)) & 0x00ff00ff) |
                (((M2i << 24) | (M2i >>> 8))  & 0xff00ff00)
            );
        M2i1 = (
            (((M2i1 << 8)  | (M2i1 >>> 24)) & 0x00ff00ff) |
                (((M2i1 << 24) | (M2i1 >>> 8))  & 0xff00ff00)
            );

        // Absorb message into state
        var lane = state[i];
        lane.high ^= M2i1;
        lane.low  ^= M2i;
      }

      // Rounds
      for (var round = 0; round < 24; round++) {
        // Theta
        for (var x = 0; x < 5; x++) {
          // Mix column lanes
          var tMsw = 0, tLsw = 0;
          for (var y = 0; y < 5; y++) {
            var lane = state[x + 5 * y];
            tMsw ^= lane.high;
            tLsw ^= lane.low;
          }

          // Temporary values
          var Tx = T[x];
          Tx.high = tMsw;
          Tx.low  = tLsw;
        }
        for (var x = 0; x < 5; x++) {
          // Shortcuts
          var Tx4 = T[(x + 4) % 5];
          var Tx1 = T[(x + 1) % 5];
          var Tx1Msw = Tx1.high;
          var Tx1Lsw = Tx1.low;

          // Mix surrounding columns
          var tMsw = Tx4.high ^ ((Tx1Msw << 1) | (Tx1Lsw >>> 31));
          var tLsw = Tx4.low  ^ ((Tx1Lsw << 1) | (Tx1Msw >>> 31));
          for (var y = 0; y < 5; y++) {
            var lane = state[x + 5 * y];
            lane.high ^= tMsw;
            lane.low  ^= tLsw;
          }
        }

        // Rho Pi
        for (var laneIndex = 1; laneIndex < 25; laneIndex++) {
          // Shortcuts
          var lane = state[laneIndex];
          var laneMsw = lane.high;
          var laneLsw = lane.low;
          var rhoOffset = RHO_OFFSETS[laneIndex];

          // Rotate lanes
          if (rhoOffset < 32) {
            var tMsw = (laneMsw << rhoOffset) | (laneLsw >>> (32 - rhoOffset));
            var tLsw = (laneLsw << rhoOffset) | (laneMsw >>> (32 - rhoOffset));
          } else /* if (rhoOffset >= 32) */ {
            var tMsw = (laneLsw << (rhoOffset - 32)) | (laneMsw >>> (64 - rhoOffset));
            var tLsw = (laneMsw << (rhoOffset - 32)) | (laneLsw >>> (64 - rhoOffset));
          }

          // Transpose lanes
          var TPiLane = T[PI_INDEXES[laneIndex]];
          TPiLane.high = tMsw;
          TPiLane.low  = tLsw;
        }

        // Rho pi at x = y = 0
        var T0 = T[0];
        var state0 = state[0];
        T0.high = state0.high;
        T0.low  = state0.low;

        // Chi
        for (var x = 0; x < 5; x++) {
          for (var y = 0; y < 5; y++) {
            // Shortcuts
            var laneIndex = x + 5 * y;
            var lane = state[laneIndex];
            var TLane = T[laneIndex];
            var Tx1Lane = T[((x + 1) % 5) + 5 * y];
            var Tx2Lane = T[((x + 2) % 5) + 5 * y];

            // Mix rows
            lane.high = TLane.high ^ (~Tx1Lane.high & Tx2Lane.high);
            lane.low  = TLane.low  ^ (~Tx1Lane.low  & Tx2Lane.low);
          }
        }

        // Iota
        var lane = state[0];
        var roundConstant = ROUND_CONSTANTS[round];
        lane.high ^= roundConstant.high;
        lane.low  ^= roundConstant.low;;
      }
    },

    _doFinalize: function () {
      // Shortcuts
      var data = this._data;
      var dataWords = data.words;
      var nBitsTotal = this._nDataBytes * 8;
      var nBitsLeft = data.sigBytes * 8;
      var blockSizeBits = this.blockSize * 32;

      // Add padding
      dataWords[nBitsLeft >>> 5] |= 0x1 << (24 - nBitsLeft % 32);
      dataWords[((Math.ceil((nBitsLeft + 1) / blockSizeBits) * blockSizeBits) >>> 5) - 1] |= 0x80;
      data.sigBytes = dataWords.length * 4;

      // Hash final blocks
      this._process();

      // Shortcuts
      var state = this._state;
      var outputLengthBytes = this.cfg.outputLength / 8;
      var outputLengthLanes = outputLengthBytes / 8;

      // Squeeze
      var hashWords = [];
      for (var i = 0; i < outputLengthLanes; i++) {
        // Shortcuts
        var lane = state[i];
        var laneMsw = lane.high;
        var laneLsw = lane.low;

        // Swap endian
        laneMsw = (
            (((laneMsw << 8)  | (laneMsw >>> 24)) & 0x00ff00ff) |
                (((laneMsw << 24) | (laneMsw >>> 8))  & 0xff00ff00)
            );
        laneLsw = (
            (((laneLsw << 8)  | (laneLsw >>> 24)) & 0x00ff00ff) |
                (((laneLsw << 24) | (laneLsw >>> 8))  & 0xff00ff00)
            );

        // Squeeze state to retrieve hash
        hashWords.push(laneLsw);
        hashWords.push(laneMsw);
      }

      // Return final computed hash
      return new WordArray.init(hashWords, outputLengthBytes);
    },

    clone: function () {
      var clone = Hasher.clone.call(this);

      var state = clone._state = this._state.slice(0);
      for (var i = 0; i < 25; i++) {
        state[i] = state[i].clone();
      }

      return clone;
    }
  });

  /**
   * Shortcut function to the hasher's object interface.
   *
   * @param {WordArray|string} message The message to hash.
   *
   * @return {WordArray} The hash.
   *
   * @static
   *
   * @example
   *
   *     var hash = CryptoJS.SHA3('message');
   *     var hash = CryptoJS.SHA3(wordArray);
   */
  C.SHA3 = Hasher._createHelper(SHA3);

  /**
   * Shortcut function to the HMAC's object interface.
   *
   * @param {WordArray|string} message The message to hash.
   * @param {WordArray|string} key The secret key.
   *
   * @return {WordArray} The HMAC.
   *
   * @static
   *
   * @example
   *
   *     var hmac = CryptoJS.HmacSHA3(message, key);
   */
  C.HmacSHA3 = Hasher._createHmacHelper(SHA3);
}(Math));

// Copyright (c) 2005  Tom Wu
// All Rights Reserved.
// See "LICENSE" for details.

// Basic JavaScript BN library - subset useful for RSA encryption.

// Bits per digit
var dbits;

// JavaScript engine analysis
var canary = 0xdeadbeefcafe;
var j_lm = ((canary&0xffffff)==0xefcafe);

// (public) Constructor
function BigInteger(a,b,c) {
  if(a != null)
    if("number" == typeof a) this.fromNumber(a,b,c);
    else if(b == null && "string" != typeof a) this.fromString(a,256);
    else this.fromString(a,b);
}

// return new, unset BigInteger
function nbi() { return new BigInteger(null); }

// am: Compute w_j += (x*this_i), propagate carries,
// c is initial carry, returns final carry.
// c < 3*dvalue, x < 2*dvalue, this_i < dvalue
// We need to select the fastest one that works in this environment.

// am1: use a single mult and divide to get the high bits,
// max digit bits should be 26 because
// max internal value = 2*dvalue^2-2*dvalue (< 2^53)
function am1(i,x,w,j,c,n) {
  while(--n >= 0) {
    var v = x*this[i++]+w[j]+c;
    c = Math.floor(v/0x4000000);
    w[j++] = v&0x3ffffff;
  }
  return c;
}
// am2 avoids a big mult-and-extract completely.
// Max digit bits should be <= 30 because we do bitwise ops
// on values up to 2*hdvalue^2-hdvalue-1 (< 2^31)
function am2(i,x,w,j,c,n) {
  var xl = x&0x7fff, xh = x>>15;
  while(--n >= 0) {
    var l = this[i]&0x7fff;
    var h = this[i++]>>15;
    var m = xh*l+h*xl;
    l = xl*l+((m&0x7fff)<<15)+w[j]+(c&0x3fffffff);
    c = (l>>>30)+(m>>>15)+xh*h+(c>>>30);
    w[j++] = l&0x3fffffff;
  }
  return c;
}
// Alternately, set max digit bits to 28 since some
// browsers slow down when dealing with 32-bit numbers.
function am3(i,x,w,j,c,n) {
  var xl = x&0x3fff, xh = x>>14;
  while(--n >= 0) {
    var l = this[i]&0x3fff;
    var h = this[i++]>>14;
    var m = xh*l+h*xl;
    l = xl*l+((m&0x3fff)<<14)+w[j]+c;
    c = (l>>28)+(m>>14)+xh*h;
    w[j++] = l&0xfffffff;
  }
  return c;
}
if(j_lm && (navigator.appName == "Microsoft Internet Explorer")) {
  BigInteger.prototype.am = am2;
  dbits = 30;
}
else if(j_lm && (navigator.appName != "Netscape")) {
  BigInteger.prototype.am = am1;
  dbits = 26;
}
else { // Mozilla/Netscape seems to prefer am3
  BigInteger.prototype.am = am3;
  dbits = 28;
}

BigInteger.prototype.DB = dbits;
BigInteger.prototype.DM = ((1<<dbits)-1);
BigInteger.prototype.DV = (1<<dbits);

var BI_FP = 52;
BigInteger.prototype.FV = Math.pow(2,BI_FP);
BigInteger.prototype.F1 = BI_FP-dbits;
BigInteger.prototype.F2 = 2*dbits-BI_FP;

// Digit conversions
var BI_RM = "0123456789abcdefghijklmnopqrstuvwxyz";
var BI_RC = new Array();
var rr,vv;
rr = "0".charCodeAt(0);
for(vv = 0; vv <= 9; ++vv) BI_RC[rr++] = vv;
rr = "a".charCodeAt(0);
for(vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;
rr = "A".charCodeAt(0);
for(vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;

function int2char(n) { return BI_RM.charAt(n); }
function intAt(s,i) {
  var c = BI_RC[s.charCodeAt(i)];
  return (c==null)?-1:c;
}

// (protected) copy this to r
function bnpCopyTo(r) {
  for(var i = this.t-1; i >= 0; --i) r[i] = this[i];
  r.t = this.t;
  r.s = this.s;
}

// (protected) set from integer value x, -DV <= x < DV
function bnpFromInt(x) {
  this.t = 1;
  this.s = (x<0)?-1:0;
  if(x > 0) this[0] = x;
  else if(x < -1) this[0] = x+DV;
  else this.t = 0;
}

// return bigint initialized to value
function nbv(i) { var r = nbi(); r.fromInt(i); return r; }

// (protected) set from string and radix
function bnpFromString(s,b) {
  var k;
  if(b == 16) k = 4;
  else if(b == 8) k = 3;
  else if(b == 256) k = 8; // byte array
  else if(b == 2) k = 1;
  else if(b == 32) k = 5;
  else if(b == 4) k = 2;
  else { this.fromRadix(s,b); return; }
  this.t = 0;
  this.s = 0;
  var i = s.length, mi = false, sh = 0;
  while(--i >= 0) {
    var x = (k==8)?s[i]&0xff:intAt(s,i);
    if(x < 0) {
      if(s.charAt(i) == "-") mi = true;
      continue;
    }
    mi = false;
    if(sh == 0)
      this[this.t++] = x;
    else if(sh+k > this.DB) {
      this[this.t-1] |= (x&((1<<(this.DB-sh))-1))<<sh;
      this[this.t++] = (x>>(this.DB-sh));
    }
    else
      this[this.t-1] |= x<<sh;
    sh += k;
    if(sh >= this.DB) sh -= this.DB;
  }
  if(k == 8 && (s[0]&0x80) != 0) {
    this.s = -1;
    if(sh > 0) this[this.t-1] |= ((1<<(this.DB-sh))-1)<<sh;
  }
  this.clamp();
  if(mi) BigInteger.ZERO.subTo(this,this);
}

// (protected) clamp off excess high words
function bnpClamp() {
  var c = this.s&this.DM;
  while(this.t > 0 && this[this.t-1] == c) --this.t;
}

// (public) return string representation in given radix
function bnToString(b) {
  if(this.s < 0) return "-"+this.negate().toString(b);
  var k;
  if(b == 16) k = 4;
  else if(b == 8) k = 3;
  else if(b == 2) k = 1;
  else if(b == 32) k = 5;
  else if(b == 4) k = 2;
  else return this.toRadix(b);
  var km = (1<<k)-1, d, m = false, r = "", i = this.t;
  var p = this.DB-(i*this.DB)%k;
  if(i-- > 0) {
    if(p < this.DB && (d = this[i]>>p) > 0) { m = true; r = int2char(d); }
    while(i >= 0) {
      if(p < k) {
        d = (this[i]&((1<<p)-1))<<(k-p);
        d |= this[--i]>>(p+=this.DB-k);
      }
      else {
        d = (this[i]>>(p-=k))&km;
        if(p <= 0) { p += this.DB; --i; }
      }
      if(d > 0) m = true;
      if(m) r += int2char(d);
    }
  }
  return m?r:"0";
}

// (public) -this
function bnNegate() { var r = nbi(); BigInteger.ZERO.subTo(this,r); return r; }

// (public) |this|
function bnAbs() { return (this.s<0)?this.negate():this; }

// (public) return + if this > a, - if this < a, 0 if equal
function bnCompareTo(a) {
  var r = this.s-a.s;
  if(r != 0) return r;
  var i = this.t;
  r = i-a.t;
  if(r != 0) return (this.s<0)?-r:r;
  while(--i >= 0) if((r=this[i]-a[i]) != 0) return r;
  return 0;
}

// returns bit length of the integer x
function nbits(x) {
  var r = 1, t;
  if((t=x>>>16) != 0) { x = t; r += 16; }
  if((t=x>>8) != 0) { x = t; r += 8; }
  if((t=x>>4) != 0) { x = t; r += 4; }
  if((t=x>>2) != 0) { x = t; r += 2; }
  if((t=x>>1) != 0) { x = t; r += 1; }
  return r;
}

// (public) return the number of bits in "this"
function bnBitLength() {
  if(this.t <= 0) return 0;
  return this.DB*(this.t-1)+nbits(this[this.t-1]^(this.s&this.DM));
}

// (protected) r = this << n*DB
function bnpDLShiftTo(n,r) {
  var i;
  for(i = this.t-1; i >= 0; --i) r[i+n] = this[i];
  for(i = n-1; i >= 0; --i) r[i] = 0;
  r.t = this.t+n;
  r.s = this.s;
}

// (protected) r = this >> n*DB
function bnpDRShiftTo(n,r) {
  for(var i = n; i < this.t; ++i) r[i-n] = this[i];
  r.t = Math.max(this.t-n,0);
  r.s = this.s;
}

// (protected) r = this << n
function bnpLShiftTo(n,r) {
  var bs = n%this.DB;
  var cbs = this.DB-bs;
  var bm = (1<<cbs)-1;
  var ds = Math.floor(n/this.DB), c = (this.s<<bs)&this.DM, i;
  for(i = this.t-1; i >= 0; --i) {
    r[i+ds+1] = (this[i]>>cbs)|c;
    c = (this[i]&bm)<<bs;
  }
  for(i = ds-1; i >= 0; --i) r[i] = 0;
  r[ds] = c;
  r.t = this.t+ds+1;
  r.s = this.s;
  r.clamp();
}

// (protected) r = this >> n
function bnpRShiftTo(n,r) {
  r.s = this.s;
  var ds = Math.floor(n/this.DB);
  if(ds >= this.t) { r.t = 0; return; }
  var bs = n%this.DB;
  var cbs = this.DB-bs;
  var bm = (1<<bs)-1;
  r[0] = this[ds]>>bs;
  for(var i = ds+1; i < this.t; ++i) {
    r[i-ds-1] |= (this[i]&bm)<<cbs;
    r[i-ds] = this[i]>>bs;
  }
  if(bs > 0) r[this.t-ds-1] |= (this.s&bm)<<cbs;
  r.t = this.t-ds;
  r.clamp();
}

// (protected) r = this - a
function bnpSubTo(a,r) {
  var i = 0, c = 0, m = Math.min(a.t,this.t);
  while(i < m) {
    c += this[i]-a[i];
    r[i++] = c&this.DM;
    c >>= this.DB;
  }
  if(a.t < this.t) {
    c -= a.s;
    while(i < this.t) {
      c += this[i];
      r[i++] = c&this.DM;
      c >>= this.DB;
    }
    c += this.s;
  }
  else {
    c += this.s;
    while(i < a.t) {
      c -= a[i];
      r[i++] = c&this.DM;
      c >>= this.DB;
    }
    c -= a.s;
  }
  r.s = (c<0)?-1:0;
  if(c < -1) r[i++] = this.DV+c;
  else if(c > 0) r[i++] = c;
  r.t = i;
  r.clamp();
}

// (protected) r = this * a, r != this,a (HAC 14.12)
// "this" should be the larger one if appropriate.
function bnpMultiplyTo(a,r) {
  var x = this.abs(), y = a.abs();
  var i = x.t;
  r.t = i+y.t;
  while(--i >= 0) r[i] = 0;
  for(i = 0; i < y.t; ++i) r[i+x.t] = x.am(0,y[i],r,i,0,x.t);
  r.s = 0;
  r.clamp();
  if(this.s != a.s) BigInteger.ZERO.subTo(r,r);
}

// (protected) r = this^2, r != this (HAC 14.16)
function bnpSquareTo(r) {
  var x = this.abs();
  var i = r.t = 2*x.t;
  while(--i >= 0) r[i] = 0;
  for(i = 0; i < x.t-1; ++i) {
    var c = x.am(i,x[i],r,2*i,0,1);
    if((r[i+x.t]+=x.am(i+1,2*x[i],r,2*i+1,c,x.t-i-1)) >= x.DV) {
      r[i+x.t] -= x.DV;
      r[i+x.t+1] = 1;
    }
  }
  if(r.t > 0) r[r.t-1] += x.am(i,x[i],r,2*i,0,1);
  r.s = 0;
  r.clamp();
}

// (protected) divide this by m, quotient and remainder to q, r (HAC 14.20)
// r != q, this != m.  q or r may be null.
function bnpDivRemTo(m,q,r) {
  var pm = m.abs();
  if(pm.t <= 0) return;
  var pt = this.abs();
  if(pt.t < pm.t) {
    if(q != null) q.fromInt(0);
    if(r != null) this.copyTo(r);
    return;
  }
  if(r == null) r = nbi();
  var y = nbi(), ts = this.s, ms = m.s;
  var nsh = this.DB-nbits(pm[pm.t-1]);  // normalize modulus
  if(nsh > 0) { pm.lShiftTo(nsh,y); pt.lShiftTo(nsh,r); }
  else { pm.copyTo(y); pt.copyTo(r); }
  var ys = y.t;
  var y0 = y[ys-1];
  if(y0 == 0) return;
  var yt = y0*(1<<this.F1)+((ys>1)?y[ys-2]>>this.F2:0);
  var d1 = this.FV/yt, d2 = (1<<this.F1)/yt, e = 1<<this.F2;
  var i = r.t, j = i-ys, t = (q==null)?nbi():q;
  y.dlShiftTo(j,t);
  if(r.compareTo(t) >= 0) {
    r[r.t++] = 1;
    r.subTo(t,r);
  }
  BigInteger.ONE.dlShiftTo(ys,t);
  t.subTo(y,y); // "negative" y so we can replace sub with am later
  while(y.t < ys) y[y.t++] = 0;
  while(--j >= 0) {
    // Estimate quotient digit
    var qd = (r[--i]==y0)?this.DM:Math.floor(r[i]*d1+(r[i-1]+e)*d2);
    if((r[i]+=y.am(0,qd,r,j,0,ys)) < qd) {  // Try it out
      y.dlShiftTo(j,t);
      r.subTo(t,r);
      while(r[i] < --qd) r.subTo(t,r);
    }
  }
  if(q != null) {
    r.drShiftTo(ys,q);
    if(ts != ms) BigInteger.ZERO.subTo(q,q);
  }
  r.t = ys;
  r.clamp();
  if(nsh > 0) r.rShiftTo(nsh,r);  // Denormalize remainder
  if(ts < 0) BigInteger.ZERO.subTo(r,r);
}

// (public) this mod a
function bnMod(a) {
  var r = nbi();
  this.abs().divRemTo(a,null,r);
  if(this.s < 0 && r.compareTo(BigInteger.ZERO) > 0) a.subTo(r,r);
  return r;
}

// Modular reduction using "classic" algorithm
function Classic(m) { this.m = m; }
function cConvert(x) {
  if(x.s < 0 || x.compareTo(this.m) >= 0) return x.mod(this.m);
  else return x;
}
function cRevert(x) { return x; }
function cReduce(x) { x.divRemTo(this.m,null,x); }
function cMulTo(x,y,r) { x.multiplyTo(y,r); this.reduce(r); }
function cSqrTo(x,r) { x.squareTo(r); this.reduce(r); }

Classic.prototype.convert = cConvert;
Classic.prototype.revert = cRevert;
Classic.prototype.reduce = cReduce;
Classic.prototype.mulTo = cMulTo;
Classic.prototype.sqrTo = cSqrTo;

// (protected) return "-1/this % 2^DB"; useful for Mont. reduction
// justification:
//         xy == 1 (mod m)
//         xy =  1+km
//   xy(2-xy) = (1+km)(1-km)
// x[y(2-xy)] = 1-k^2m^2
// x[y(2-xy)] == 1 (mod m^2)
// if y is 1/x mod m, then y(2-xy) is 1/x mod m^2
// should reduce x and y(2-xy) by m^2 at each step to keep size bounded.
// JS multiply "overflows" differently from C/C++, so care is needed here.
function bnpInvDigit() {
  if(this.t < 1) return 0;
  var x = this[0];
  if((x&1) == 0) return 0;
  var y = x&3;    // y == 1/x mod 2^2
  y = (y*(2-(x&0xf)*y))&0xf;  // y == 1/x mod 2^4
  y = (y*(2-(x&0xff)*y))&0xff;  // y == 1/x mod 2^8
  y = (y*(2-(((x&0xffff)*y)&0xffff)))&0xffff; // y == 1/x mod 2^16
  // last step - calculate inverse mod DV directly;
  // assumes 16 < DB <= 32 and assumes ability to handle 48-bit ints
  y = (y*(2-x*y%this.DV))%this.DV;    // y == 1/x mod 2^dbits
  // we really want the negative inverse, and -DV < y < DV
  return (y>0)?this.DV-y:-y;
}

// Montgomery reduction
function Montgomery(m) {
  this.m = m;
  this.mp = m.invDigit();
  this.mpl = this.mp&0x7fff;
  this.mph = this.mp>>15;
  this.um = (1<<(m.DB-15))-1;
  this.mt2 = 2*m.t;
}

// xR mod m
function montConvert(x) {
  var r = nbi();
  x.abs().dlShiftTo(this.m.t,r);
  r.divRemTo(this.m,null,r);
  if(x.s < 0 && r.compareTo(BigInteger.ZERO) > 0) this.m.subTo(r,r);
  return r;
}

// x/R mod m
function montRevert(x) {
  var r = nbi();
  x.copyTo(r);
  this.reduce(r);
  return r;
}

// x = x/R mod m (HAC 14.32)
function montReduce(x) {
  while(x.t <= this.mt2)  // pad x so am has enough room later
    x[x.t++] = 0;
  for(var i = 0; i < this.m.t; ++i) {
    // faster way of calculating u0 = x[i]*mp mod DV
    var j = x[i]&0x7fff;
    var u0 = (j*this.mpl+(((j*this.mph+(x[i]>>15)*this.mpl)&this.um)<<15))&x.DM;
    // use am to combine the multiply-shift-add into one call
    j = i+this.m.t;
    x[j] += this.m.am(0,u0,x,i,0,this.m.t);
    // propagate carry
    while(x[j] >= x.DV) { x[j] -= x.DV; x[++j]++; }
  }
  x.clamp();
  x.drShiftTo(this.m.t,x);
  if(x.compareTo(this.m) >= 0) x.subTo(this.m,x);
}

// r = "x^2/R mod m"; x != r
function montSqrTo(x,r) { x.squareTo(r); this.reduce(r); }

// r = "xy/R mod m"; x,y != r
function montMulTo(x,y,r) { x.multiplyTo(y,r); this.reduce(r); }

Montgomery.prototype.convert = montConvert;
Montgomery.prototype.revert = montRevert;
Montgomery.prototype.reduce = montReduce;
Montgomery.prototype.mulTo = montMulTo;
Montgomery.prototype.sqrTo = montSqrTo;

// (protected) true iff this is even
function bnpIsEven() { return ((this.t>0)?(this[0]&1):this.s) == 0; }

// (protected) this^e, e < 2^32, doing sqr and mul with "r" (HAC 14.79)
function bnpExp(e,z) {
  if(e > 0xffffffff || e < 1) return BigInteger.ONE;
  var r = nbi(), r2 = nbi(), g = z.convert(this), i = nbits(e)-1;
  g.copyTo(r);
  while(--i >= 0) {
    z.sqrTo(r,r2);
    if((e&(1<<i)) > 0) z.mulTo(r2,g,r);
    else { var t = r; r = r2; r2 = t; }
  }
  return z.revert(r);
}

// (public) this^e % m, 0 <= e < 2^32
function bnModPowInt(e,m) {
  var z;
  if(e < 256 || m.isEven()) z = new Classic(m); else z = new Montgomery(m);
  return this.exp(e,z);
}

// protected
BigInteger.prototype.copyTo = bnpCopyTo;
BigInteger.prototype.fromInt = bnpFromInt;
BigInteger.prototype.fromString = bnpFromString;
BigInteger.prototype.clamp = bnpClamp;
BigInteger.prototype.dlShiftTo = bnpDLShiftTo;
BigInteger.prototype.drShiftTo = bnpDRShiftTo;
BigInteger.prototype.lShiftTo = bnpLShiftTo;
BigInteger.prototype.rShiftTo = bnpRShiftTo;
BigInteger.prototype.subTo = bnpSubTo;
BigInteger.prototype.multiplyTo = bnpMultiplyTo;
BigInteger.prototype.squareTo = bnpSquareTo;
BigInteger.prototype.divRemTo = bnpDivRemTo;
BigInteger.prototype.invDigit = bnpInvDigit;
BigInteger.prototype.isEven = bnpIsEven;
BigInteger.prototype.exp = bnpExp;

// public
BigInteger.prototype.toString = bnToString;
BigInteger.prototype.negate = bnNegate;
BigInteger.prototype.abs = bnAbs;
BigInteger.prototype.compareTo = bnCompareTo;
BigInteger.prototype.bitLength = bnBitLength;
BigInteger.prototype.mod = bnMod;
BigInteger.prototype.modPowInt = bnModPowInt;

// "constants"
BigInteger.ZERO = nbv(0);
BigInteger.ONE = nbv(1);

// prng4.js - uses Arcfour as a PRNG

function Arcfour() {
  this.i = 0;
  this.j = 0;
  this.S = new Array();
}

// Initialize arcfour context from key, an array of ints, each from [0..255]
function ARC4init(key) {
  var i, j, t;
  for(i = 0; i < 256; ++i)
    this.S[i] = i;
  j = 0;
  for(i = 0; i < 256; ++i) {
    j = (j + this.S[i] + key[i % key.length]) & 255;
    t = this.S[i];
    this.S[i] = this.S[j];
    this.S[j] = t;
  }
  this.i = 0;
  this.j = 0;
}

function ARC4next() {
  var t;
  this.i = (this.i + 1) & 255;
  this.j = (this.j + this.S[this.i]) & 255;
  t = this.S[this.i];
  this.S[this.i] = this.S[this.j];
  this.S[this.j] = t;
  return this.S[(t + this.S[this.i]) & 255];
}

Arcfour.prototype.init = ARC4init;
Arcfour.prototype.next = ARC4next;

// Plug in your RNG constructor here
function prng_newstate() {
  return new Arcfour();
}

// Pool size must be a multiple of 4 and greater than 32.
// An array of bytes the size of the pool will be passed to init()
var rng_psize = 256;
// Random number generator - requires a PRNG backend, e.g. prng4.js

// For best results, put code like
// <body onClick='rng_seed_time();' onKeyPress='rng_seed_time();'>
// in your main HTML document.

var rng_state;
var rng_pool;
var rng_pptr;

// Mix in a 32-bit integer into the pool
function rng_seed_int(x) {
  rng_pool[rng_pptr++] ^= x & 255;
  rng_pool[rng_pptr++] ^= (x >> 8) & 255;
  rng_pool[rng_pptr++] ^= (x >> 16) & 255;
  rng_pool[rng_pptr++] ^= (x >> 24) & 255;
  if(rng_pptr >= rng_psize) rng_pptr -= rng_psize;
}

// Mix in the current time (w/milliseconds) into the pool
function rng_seed_time() {
  rng_seed_int(new Date().getTime());
}

// Initialize the pool with junk if needed.
if(rng_pool == null) {
  rng_pool = new Array();
  rng_pptr = 0;
  var t;
  if(navigator.appName == "Netscape" && navigator.appVersion < "5" && window.crypto) {
    // Extract entropy (256 bits) from NS4 RNG if available
    var z = window.crypto.random(32);
    for(t = 0; t < z.length; ++t)
      rng_pool[rng_pptr++] = z.charCodeAt(t) & 255;
  }
  while(rng_pptr < rng_psize) {  // extract some randomness from Math.random()
    t = Math.floor(65536 * Math.random());
    rng_pool[rng_pptr++] = t >>> 8;
    rng_pool[rng_pptr++] = t & 255;
  }
  rng_pptr = 0;
  rng_seed_time();
  //rng_seed_int(window.screenX);
  //rng_seed_int(window.screenY);
}

function rng_get_byte() {
  if(rng_state == null) {
    rng_seed_time();
    rng_state = prng_newstate();
    rng_state.init(rng_pool);
    for(rng_pptr = 0; rng_pptr < rng_pool.length; ++rng_pptr)
      rng_pool[rng_pptr] = 0;
    rng_pptr = 0;
    //rng_pool = null;
  }
  // TODO: allow reseeding after first request
  return rng_state.next();
}

function rng_get_bytes(ba) {
  var i;
  for(i = 0; i < ba.length; ++i) ba[i] = rng_get_byte();
}

function SecureRandom() {}

SecureRandom.prototype.nextBytes = rng_get_bytes;

//Depends on jsbn.js and rng.js

//Version 1.1: support utf-8 encoding in pkcs1pad2

//convert a (hex) string to a bignum object
function parseBigInt(str,r) {
  return new BigInteger(str,r);
}

function linebrk(s,n) {
  var ret = "";
  var i = 0;
  while(i + n < s.length) {
    ret += s.substring(i,i+n) + "\n";
    i += n;
  }
  return ret + s.substring(i,s.length);
}

function byte2Hex(b) {
  if(b < 0x10)
    return "0" + b.toString(16);
  else
    return b.toString(16);
}

//PKCS#1 (type 2, random) pad input string s to n bytes, and return a bigint
function pkcs1pad2(s,n) {
  if(n < s.length + 11) { // TODO: fix for utf-8
    alert("Message too long for RSA");
    return null;
  }
  var ba = new Array();
  var i = s.length - 1;
  while(i >= 0 && n > 0) {
    var c = s.charCodeAt(i--);
    if(c < 128) { // encode using utf-8
      ba[--n] = c;
    }
    else if((c > 127) && (c < 2048)) {
      ba[--n] = (c & 63) | 128;
      ba[--n] = (c >> 6) | 192;
    }
    else {
      ba[--n] = (c & 63) | 128;
      ba[--n] = ((c >> 6) & 63) | 128;
      ba[--n] = (c >> 12) | 224;
    }
  }
  ba[--n] = 0;
  var rng = new SecureRandom();
  var x = new Array();
  while(n > 2) { // random non-zero pad
    x[0] = 0;
    while(x[0] == 0) rng.nextBytes(x);
    ba[--n] = x[0];
  }
  ba[--n] = 2;
  ba[--n] = 0;
  return new BigInteger(ba);
}

//"empty" RSA key constructor
function RSAKey() {
  this.n = null;
  this.e = 0;
  this.d = null;
  this.p = null;
  this.q = null;
  this.dmp1 = null;
  this.dmq1 = null;
  this.coeff = null;
}

//Set the public key fields N and e from hex strings
function RSASetPublic(N,E) {
  if(N != null && E != null && N.length > 0 && E.length > 0) {
    this.n = parseBigInt(N,16);
    this.e = parseInt(E,16);
  }
  else
    alert("Invalid RSA public key");
}

//Perform raw public operation on "x": return x^e (mod n)
function RSADoPublic(x) {
  return x.modPowInt(this.e, this.n);
}

//Return the PKCS#1 RSA encryption of "text" as an even-length hex string
function RSAEncrypt(text) {
  var m = pkcs1pad2(text,(this.n.bitLength()+7)>>3);
  if(m == null) return null;
  var c = this.doPublic(m);
  if(c == null) return null;
  var h = c.toString(16);
  if((h.length & 1) == 0) return h; else return "0" + h;
}

//Return the PKCS#1 RSA encryption of "text" as a Base64-encoded string
//function RSAEncryptB64(text) {
//var h = this.encrypt(text);
//if(h) return hex2b64(h); else return null;
//}

//protected
RSAKey.prototype.doPublic = RSADoPublic;

//public
RSAKey.prototype.setPublic = RSASetPublic;
RSAKey.prototype.encrypt = RSAEncrypt;
//RSAKey.prototype.encrypt_b64 = RSAEncryptB64;
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
      filenameForKey(key, function(hash) {
        window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function gotFS(fileSystem) {

          fileSystem.root.getFile(hash, {
            create: true
          }, function gotFileEntry(fileEntry) {
            fileEntry.createWriter(function gotFileWriter(writer) {
              writer.onwrite = function() {
                return callback({
                  key: key,
                  val: obj.val
                });
              };
              writer.write(obj.val);
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

(function(root) {
  root.$fh = root.$fh || {};
  var $fh = root.$fh;
  $fh.fh_timeout = 20000;
  $fh.boxprefix = '/box/srv/1.1/';
  $fh.sdk_version = '1.1.1';
  
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

  var getCuidMap = function() {
    if(typeof window.device !== "undefined" && typeof window.device.cuidMap !== "undefined"){
      return window.device.cuidMap;
    }  else if(typeof navigator.device !== "undefined" && typeof navigator.device.cuidMap !== "undefined"){
      return navigator.device.cuidMap;
    }

    return null;
  };
  
  $fh._getDeviceId = getDeviceId;
  $fh._getCuidMap = getCuidMap;
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
            if (req.status === 0 && !sameOrigin && !req.isAborted) {
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
    fhParams.cuidMap = getCuidMap();
    fhParams.appid = $fh.app_props.appid;
    fhParams.appkey = $fh.app_props.appkey;
    fhParams.analyticsTag =  $fh.app_props.analyticsTag;
    fhParams.init = $fh.app_props.init;

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

      var storage = new Lawnchair({
        name: "fh_init_storage",
        adapter: "dom",
        fail: function(msg, err) {
          var error_message = 'read/save from/to local storage failed  msg:' + msg + ' err:' + err;
          return fail(error_message, {});
        }
      }, function() {});

      storage.get('fh_init', function(storage_res) {
        if (storage_res && storage_res.value !== null) {
          $fh.app_props.init = storage_res.value;
        }

        var path = opts.host + $fh.boxprefix + "app/init";
        var data = _getFhParams();
        $fh.__ajax({
          "url": path,
          "type": "POST",
          "contentType": "application/json",
          "data": JSON.stringify(data),
          "timeout": opts.timeout || $fh.app_props.timeout || $fh.fh_timeout,
          "success": function(data) {
            $fh.cloud_props = data;

            storage.save({
              key: "fh_init",
              value: data.init
            }, function() {
              if (success) {
                success(data);
              }
              _cloudReady(true);
            });
          },
          "error": function(req, statusText, error) {
            _init_failed = true;
            _is_initializing = false;
            _handleError(fail, req, statusText);
            _cloudReady(false);
          }
        });
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

$fh = $fh || {};
$fh.sync = (function() {

  var self = {

    // CONFIG
    defaults: {
      "sync_frequency": 10,
      // How often to synchronise data with the cloud in seconds.
      "auto_sync_local_updates": true,
      // Should local chages be syned to the cloud immediately, or should they wait for the next sync interval
      "notify_client_storage_failed": true,
      // Should a notification event be triggered when loading/saving to client storage fails
      "notify_sync_started": true,
      // Should a notification event be triggered when a sync cycle with the server has been started
      "notify_sync_complete": true,
      // Should a notification event be triggered when a sync cycle with the server has been completed
      "notify_offline_update": true,
      // Should a notification event be triggered when an attempt was made to update a record while offline
      "notify_collision_detected": true,
      // Should a notification event be triggered when an update failed due to data collision
      "notify_remote_update_failed": true,
      // Should a notification event be triggered when an update failed for a reason other than data collision
      "notify_local_update_applied": true,
      // Should a notification event be triggered when an update was applied to the local data store
      "notify_remote_update_applied": true,
      // Should a notification event be triggered when an update was applied to the remote data store
      "notify_delta_received": true,
      // Should a notification event be triggered when a delta was received from the remote data store (dataset or record - depending on whether uid is set)
      "notify_sync_failed": true,
      // Should a notification event be triggered when the sync loop failed to complete
      "do_console_log": false,
      // Should log statements be written to console.log
      "crashed_count_wait" : 10,
      // How many syncs should we check for updates on crashed in flight updates before we give up searching
      "resend_crashed_updates" : true
      // If we have reached the crashed_count_wait limit, should we re-try sending the crashed in flight pending record
    },

    notifications: {
      "CLIENT_STORAGE_FAILED": "client_storage_failed",
      // loading/saving to client storage failed
      "SYNC_STARTED": "sync_started",
      // A sync cycle with the server has been started
      "SYNC_COMPLETE": "sync_complete",
      // A sync cycle with the server has been completed
      "OFFLINE_UPDATE": "offline_update",
      // An attempt was made to update a record while offline
      "COLLISION_DETECTED": "collision_detected",
      //Update Failed due to data collision
      "REMOTE_UPDATE_FAILED": "remote_update_failed",
      // Update Failed for a reason other than data collision
      "REMOTE_UPDATE_APPLIED": "remote_update_applied",
      // An update was applied to the remote data store
      "LOCAL_UPDATE_APPLIED": "local_update_applied",
      // An update was applied to the local data store
      "DELTA_RECEIVED": "delta_received",
      // A delta was received from the remote data store (dataset or record - depending on whether uid is set)
      "SYNC_FAILED": "sync_failed"
      // Sync loop failed to complete
    },

    datasets: {},

    // Initialise config to default values;
    config: undefined,

    notify_callback: undefined,

    // PUBLIC FUNCTION IMPLEMENTATIONS
    init: function(options) {
      self.consoleLog('sync - init called');
      self.config = JSON.parse(JSON.stringify(self.defaults));
      for (var i in options) {
        self.config[i] = options[i];
      }
      self.datasetMonitor();
    },

    notify: function(callback) {
      self.notify_callback = callback;
    },

    manage: function(dataset_id, options, query_params) {
      var doManage = function(dataset) {
        self.consoleLog('doManage dataset :: initialised = ' + dataset.initialised + " :: " + dataset_id + ' :: ' + JSON.stringify(options));

        // Make sure config is initialised
        if( ! self.config ) {
          self.config = JSON.parse(JSON.stringify(self.defaults));
        }

        var datasetConfig = JSON.parse(JSON.stringify(self.config));
        for (var k in options) {
          datasetConfig[k] = options[k];
        }

        dataset.query_params = query_params || {};
        dataset.config = datasetConfig;
        dataset.syncRunning = false;
        dataset.syncPending = true;
        dataset.initialised = true;
        dataset.meta = {};
        self.saveDataSet(dataset_id);
      };

      // Check if the dataset is already loaded
      self.getDataSet(dataset_id, function(dataset) {
        doManage(dataset);
      }, function(err) {

        // Not already loaded, try to load from local storage
        self.loadDataSet(dataset_id, function(dataset) {
            // Loading from local storage worked

            // Fire the local update event to indicate that dataset was loaded from local storage
            self.doNotify(dataset_id, null, self.notifications.LOCAL_UPDATE_APPLIED, "load");

            // Put the dataet under the management of the sync service
            doManage(dataset);
          },
          function(err) {
            // No dataset in memory or local storage - create a new one and put it in memory
            self.consoleLog('Creating new dataset for id ' + dataset_id);
            var dataset = {};
            dataset.pending = {};
            self.datasets[dataset_id] = dataset;
            doManage(dataset);
          });
      });
    },

    list: function(dataset_id, success, failure) {
      self.getDataSet(dataset_id, function(dataset) {
        if (dataset) {
          // Return a copy of the dataset so updates will not automatically make it back into the dataset
          var res = JSON.parse(JSON.stringify(dataset.data));
          success(res);
        }
      }, function(code, msg) {
        failure(code, msg);
      });
    },

    create: function(dataset_id, data, success, failure) {
      self.addPendingObj(dataset_id, null, data, "create", success, failure);
    },

    read: function(dataset_id, uid, success, failure) {
        self.getDataSet(dataset_id, function(dataset) {
        var rec = dataset.data[uid];
        if (!rec) {
          failure("unknown_uid");
        } else {
          // Return a copy of the record so updates will not automatically make it back into the dataset
          var res = JSON.parse(JSON.stringify(rec));
          success(res);
        }
      }, function(code, msg) {
        failure(code, msg);
      });
    },

    update: function(dataset_id, uid, data, success, failure) {
      self.addPendingObj(dataset_id, uid, data, "update", success, failure);
    },

    'delete': function(dataset_id, uid, success, failure) {
      self.addPendingObj(dataset_id, uid, null, "delete", success, failure);
    },

    getPending: function(dataset_id, cb) {
      self.getDataSet(dataset_id, function(dataset) {
        var res;
        if( dataset ) {
          res = dataset.pending;
        }
        cb(res);
      }, function(err, datatset_id) {
          self.ConsoleLog(err);
      });
    },

    clearPending: function(dataset_id, cb) {
      self.getDataSet(dataset_id, function(dataset) {
        dataset.pending = {};
        self.saveDataSet(dataset_id, cb);
      });
    },

    listCollisions : function(dataset_id, success, failure){
      $fh.act({
        "act": dataset_id,
        "req": {
          "fn": "listCollisions"
        }
      }, success, failure);
    },

    removeCollision: function(dataset_id, colissionHash, success, failure) {
      $fh.act({
        "act": dataset_id,
        "req": {
          "fn": "removeCollision",
          "hash": colissionHash
        }
      }, success, failure);
    },


    // PRIVATE FUNCTIONS
    isOnline: function(callback) {
      var online = true;

      // first, check if navigator.online is available
      if(typeof navigator.onLine !== "undefined"){
        online = navigator.onLine;
      }

      // second, check if Phonegap is available and has online info
      if(online){
        //use phonegap to determin if the network is available
        if(typeof navigator.network !== "undefined" && typeof navigator.network.connection !== "undefined"){
          var networkType = navigator.network.connection.type;
          if(networkType === "none" || networkType === null) {
            online = false;
          }
        }
      }

      return callback(online);
    },

    doNotify: function(dataset_id, uid, code, message) {

      if( self.notify_callback ) {
        if ( self.config['notify_' + code] ) {
          var notification = {
            "dataset_id" : dataset_id,
            "uid" : uid,
            "code" : code,
            "message" : message
          };
          // make sure user doesn't block
          setTimeout(function () {
            self.notify_callback(notification);
          }, 0);
        }
      }
    },

    getDataSet: function(dataset_id, success, failure) {
      var dataset = self.datasets[dataset_id];

      if (dataset) {
        success(dataset);
      } else {
        failure('unknown_dataset' + dataset_id, dataset_id);
      }
    },

    sortObject : function(object) {
      if (typeof object !== "object" || object === null) {
        return object;
      }

      var result = [];

      Object.keys(object).sort().forEach(function(key) {
        result.push({
          key: key,
          value: self.sortObject(object[key])
        });
      });

      return result;
    },

    sortedStringify : function(obj) {

      var str = '';

      try {
        str = JSON.stringify(self.sortObject(obj));
      } catch (e) {
        console.error('Error stringifying sorted object:' + e);
      }

      return str;
    },

    generateHash: function(object) {
      var hash = CryptoJS.SHA1(self.sortedStringify(object));
      return hash.toString();
    },

    addPendingObj: function(dataset_id, uid, data, action, success, failure) {
      self.isOnline(function (online) {
        if (!online) {
          self.doNotify(dataset_id, uid, self.notifications.OFFLINE_UPDATE, action);
        }
      });

      function storePendingObject(obj) {
        obj.hash = self.generateHash(obj);

        self.getDataSet(dataset_id, function(dataset) {

          dataset.pending[obj.hash] = obj;

          self.updateDatasetFromLocal(dataset, obj);

          if(self.config.auto_sync_local_updates) {
            dataset.syncPending = true;
          }
          self.saveDataSet(dataset_id);
          self.doNotify(dataset_id, uid, self.notifications.LOCAL_UPDATE_APPLIED, action);

          success(obj);
        }, function(code, msg) {
          failure(code, msg);
        });
      }

      var pendingObj = {};
      pendingObj.inFlight = false;
      pendingObj.action = action;
      pendingObj.post = data;
      pendingObj.postHash = self.generateHash(pendingObj.post);
      pendingObj.timestamp = new Date().getTime();
      if( "create" === action ) {
        pendingObj.uid = pendingObj.postHash;
        storePendingObject(pendingObj);
      } else {
        self.read(dataset_id, uid, function(rec) {
          pendingObj.uid = uid;
          pendingObj.pre = rec.data;
          pendingObj.preHash = self.generateHash(rec.data);
          storePendingObject(pendingObj);
        }, function(code, msg) {
          failure(code, msg);
        });
      }
    },

    syncLoop: function(dataset_id) {
      self.getDataSet(dataset_id, function(dataSet) {
        // The sync loop is currently active
        dataSet.syncPending = false;
        dataSet.syncRunning = true;
        dataSet.syncLoopStart = new Date().getTime();
        self.doNotify(dataset_id, null, self.notifications.SYNC_STARTED, null);

        self.isOnline(function(online) {
          if (!online) {
            self.syncComplete(dataset_id, "offline");
          } else {
            var syncLoopParams = {};
            syncLoopParams.fn = 'sync';
            syncLoopParams.dataset_id = dataset_id;
            syncLoopParams.query_params = dataSet.query_params;
            //var datasetHash = self.generateLocalDatasetHash(dataSet);
            syncLoopParams.dataset_hash = dataSet.hash;
            syncLoopParams.acknowledgements = dataSet.acknowledgements || [];

            var pending = dataSet.pending;
            var pendingArray = [];
            for(var i in pending ) {
              // Mark the pending records we are about to submit as inflight and add them to the array for submission
              // Don't re-add previous inFlight pending records who whave crashed - i.e. who's current state is unknown
              if( !pending[i].inFlight && !pending[i].crashed ) {
                pending[i].inFlight = true;
                pending[i].inFlightDate = new Date().getTime();
                pendingArray.push(pending[i]);
              }
            }
            syncLoopParams.pending = pendingArray;

            if( pendingArray.length > 0 ) {
              self.consoleLog('Starting sync loop - global hash = ' + dataSet.hash + ' :: params = ' + JSON.stringify(syncLoopParams, null, 2));
            }
            try {
              $fh.act({
                'act': dataset_id,
                'req': syncLoopParams
              }, function(res) {
                var rec;

                function processUpdates(updates, notification, acknowledgements) {
                  if( updates ) {
                    for (var up in updates) {
                      rec = updates[up];
                      acknowledgements.push(rec);
                      if( dataSet.pending[up] && dataSet.pending[up].inFlight && !dataSet.pending[up].crashed ) {
                        delete dataSet.pending[up];
                        self.doNotify(dataset_id, rec.uid, notification, rec);
                      }
                    }
                  }
                }

                // Check to see if any new pending records need to be updated to reflect the current state of play.
                self.updatePendingFromNewData(dataset_id, dataSet, res);

                // Check to see if any previously crashed inflight records can now be resolved
                self.updateCrashedInFlightFromNewData(dataset_id, dataSet, res);

                // Update the new dataset with details of any inflight updates which we have not received a response on
                self.updateNewDataFromInFlight(dataset_id, dataSet, res);

                // Update the new dataset with details of any pending updates
                self.updateNewDataFromPending(dataset_id, dataSet, res);

                if (res.records) {
                  // Full Dataset returned
                  dataSet.data = res.records;
                  dataSet.hash = res.hash;

                  self.doNotify(dataset_id, res.hash, self.notifications.DELTA_RECEIVED, 'full dataset');
                }

                if (res.updates) {
                  var acknowledgements = [];
                  processUpdates(res.updates.applied, self.notifications.REMOTE_UPDATE_APPLIED, acknowledgements);
                  processUpdates(res.updates.failed, self.notifications.REMOTE_UPDATE_FAILED, acknowledgements);
                  processUpdates(res.updates.collisions, self.notifications.COLLISION_DETECTED, acknowledgements);
                  dataSet.acknowledgements = acknowledgements;
                }

                else if (res.hash && res.hash !== dataSet.hash) {
                  self.consoleLog("Local dataset stale - syncing records :: local hash= " + dataSet.hash + " - remoteHash=" + res.hash);
                  // Different hash value returned - Sync individual records
                  self.syncRecords(dataset_id);
                } else {
                  self.consoleLog("Local dataset up to date");
                }
                self.syncComplete(dataset_id,  "online");
              }, function(msg, err) {
                // The AJAX call failed to complete succesfully, so the state of the current pending updates is unknown
                // Mark them as "crashed". The next time a syncLoop completets successfully, we will review the crashed
                // records to see if we can determine their current state.
                self.markInFlightAsCrashed(dataSet);
                self.consoleLog("syncLoop failed : msg=" + msg + " :: err = " + err);
                self.doNotify(dataset_id, null, self.notifications.SYNC_FAILED, msg);
                self.syncComplete(dataset_id,  msg);
              });
            }
            catch (e) {
              self.consoleLog('Error performing sync - ' + e);
              self.syncComplete(dataset_id, e);
            }
          }
        });
      });
    },

    syncRecords: function(dataset_id) {

      self.getDataSet(dataset_id, function(dataSet) {

        var localDataSet = dataSet.data || {};

        var clientRecs = {};
        for (var i in localDataSet) {
          var uid = i;
          var hash = localDataSet[i].hash;
          clientRecs[uid] = hash;
        }

        var syncRecParams = {};

        syncRecParams.fn = 'syncRecords';
        syncRecParams.dataset_id = dataset_id;
        syncRecParams.query_params = dataSet.query_params;
        syncRecParams.clientRecs = clientRecs;

        self.consoleLog("syncRecParams :: " + JSON.stringify(syncRecParams));

        $fh.act({
          'act': dataset_id,
          'req': syncRecParams
        }, function(res) {
          var i;

          if (res.create) {
            for (i in res.create) {
              localDataSet[i] = {"hash" : res.create[i].hash, "data" : res.create[i].data};
              self.doNotify(dataset_id, i, self.notifications.DELTA_RECEIVED, "create");
            }
          }
          if (res.update) {
            for (i in res.update) {
              localDataSet[i].hash = res.update[i].hash;
              localDataSet[i].data = res.update[i].data;
              self.doNotify(dataset_id, i, self.notifications.DELTA_RECEIVED, "update");
            }
          }
          if (res['delete']) {
            for (i in res['delete']) {
              delete localDataSet[i];
              self.doNotify(dataset_id, i, self.notifications.DELTA_RECEIVED, "delete");
            }
          }

          dataSet.data = localDataSet;
          if(res.hash) {
            dataSet.hash = res.hash;
          }
          self.syncComplete(dataset_id, "online");
        }, function(msg, err) {
          self.consoleLog("syncRecords failed : msg=" + msg + " :: err=" + err);
          self.syncComplete(dataset_id, msg);
        });
      });
    },

    syncComplete: function(dataset_id, status) {

      self.getDataSet(dataset_id, function(dataset) {
        dataset.syncRunning = false;
        dataset.syncLoopEnd = new Date().getTime();
        self.saveDataSet(dataset_id);
        self.doNotify(dataset_id, dataset.hash, self.notifications.SYNC_COMPLETE, status);
      });
    },

    checkDatasets: function() {
      for( var dataset_id in self.datasets ) {
        if( self.datasets.hasOwnProperty(dataset_id) ) {
          var dataset = self.datasets[dataset_id];

          if( !dataset.syncRunning ) {
            // Check to see if it is time for the sync loop to run again
            var lastSyncStart = dataset.syncLoopStart;
            var lastSyncCmp = dataset.syncLoopEnd;
            if( lastSyncStart == null ) {
              self.consoleLog(dataset_id +' - Performing initial sync');
              // Dataset has never been synced before - do initial sync
              dataset.syncPending = true;
            } else if (lastSyncCmp != null) {
              var timeSinceLastSync = new Date().getTime() - lastSyncCmp;
              var syncFrequency = dataset.config.sync_frequency * 1000;
              if( timeSinceLastSync > syncFrequency ) {
                // Time between sync loops has passed - do another sync
                dataset.syncPending = true;
              }
            }

            if( dataset.syncPending ) {
              // If the dataset requres syncing, run the sync loop. This may be because the sync interval has passed
              // or because the sync_frequency has been changed or because a change was made to the dataset and the
              // immediate_sync flag set to true
             self.syncLoop(dataset_id);
            }
          }
        }
      }
    },

    datasetMonitor: function() {
      self.checkDatasets();

      // Re-execute datasetMonitor every 500ms so we keep invoking checkDatasets();
      setTimeout(function() {
        self.datasetMonitor();
      }, 500);
    },

    saveDataSet: function (dataset_id, cb) {
      var onFail =  function(msg, err) {
        // save failed
        var errMsg = 'save to local storage failed  msg:' + msg + ' err:' + err;
        self.doNotify(dataset_id, null, self.notifications.CLIENT_STORAGE_FAILED, errMsg);
        self.consoleLog(errMsg);
      };
      self.getDataSet(dataset_id, function(dataset) {
        // save dataset to local storage
        Lawnchair({fail:onFail}, function (){
             this.save({key:"dataset_" + dataset_id,val:JSON.stringify(dataset)}, function(){
               //save success
               if( cb ) {
                 cb();
               }
             });
        });
      });
    },

    loadDataSet: function (dataset_id, success, failure) {
      // load dataset from local storage
      var onFail = function(msg, err) {
        // load failed
        var errMsg = 'load from local storage failed  msg:' + msg;
        self.doNotify(dataset_id, null, self.notifications.CLIENT_STORAGE_FAILED, errMsg);
        self.consoleLog(errMsg);
      };

      Lawnchair({fail:onFail},function (){
         this.get( "dataset_" + dataset_id, function (data){
           if (data && data.val !== null) {
              var dataset = JSON.parse(data.val);
              // Datasets should not be auto initialised when loaded - the mange function should be called for each dataset
              // the user wants sync
              dataset.initialised = false;
              self.datasets[dataset_id] = dataset; // TODO: do we need to handle binary data?
              self.consoleLog('load from local storage success for dataset_id :' + dataset_id);
              return success(dataset);
            } else {
                // no data yet, probably first time. failure calback should handle this
                return failure();
            }
         });
      });
    },


    updateDatasetFromLocal: function(dataset, pendingRec) {
      var pending = dataset.pending;
      var previousPendingUid;
      var previousPending;

      var uid = pendingRec.uid;
      self.consoleLog('updating local dataset for uid ' + uid + ' - action = ' + pendingRec.action);

      dataset.meta[uid] = dataset.meta[uid] || {};

      // Creating a new record
      if( pendingRec.action === "create" ) {
        if( dataset.data[uid] ) {
          self.consoleLog('dataset already exists for uid in create :: ' + JSON.stringify(dataset.data[uid]));

          // We are trying to do a create using a uid which already exists
          if (dataset.meta[uid].fromPending) {
            // We are trying to create on top of an existing pending record
            // Remove the previous pending record and use this one instead
            previousPendingUid = dataset.meta[uid].pendingUid;
            delete pending[previousPendingUid];
          }
        }
        dataset.data[uid] = {};
      }

      if( pendingRec.action === "update" ) {
        if( dataset.data[uid] ) {
          if (dataset.meta[uid].fromPending) {
            self.consoleLog('updating an existing pending record for dataset :: ' + JSON.stringify(dataset.data[uid]));
            // We are trying to update an existing pending record
            previousPendingUid = dataset.meta[uid].pendingUid;
            dataset.meta[uid].previousPendingUid = previousPendingUid;
            previousPending = pending[previousPendingUid];
            if( previousPending && !previousPending.inFlight) {
              self.consoleLog('existing pre-flight pending record = ' + JSON.stringify(previousPending));
              // We are trying to perform an update on an existing pending record
              // modify the original record to have the latest value and delete the pending update
              previousPending.post = pendingRec.post;
              previousPending.postHash = pendingRec.postHash;
              delete pending[pendingRec.hash];
            }
          }
        }
      }

      if( pendingRec.action === "delete" ) {
        if( dataset.data[uid] ) {
          if (dataset.meta[uid].fromPending) {
            self.consoleLog('Deleting an existing pending record for dataset :: ' + JSON.stringify(dataset.data[uid]));
            // We are trying to delete an existing pending record
            previousPendingUid = dataset.meta[uid].pendingUid;
            dataset.meta[uid].previousPendingUid = previousPendingUid;
            previousPending = pending[previousPendingUid];
            if( previousPending && !previousPending.inFlight ) {
              self.consoleLog('existing pending record = ' + JSON.stringify(previousPending));
              if( previousPending.action === "create" ) {
                // We are trying to perform a delete on an existing pending create
                // These cancel each other out so remove them both
                delete pending[pendingRec.hash];
                delete pending[previousPendingUid];
              }
              if( previousPending.action === "update" ) {
                // We are trying to perform a delete on an existing pending update
                // Use the pre value from the pending update for the delete and
                // get rid of the pending update
                pendingRec.pre = previousPending.pre;
                pendingRec.preHash = previousPending.preHash;
                pendingRec.inFlight = false;
                delete pending[previousPendingUid];
              }
            }
          }
          delete dataset.data[uid];
        }
      }

      if( dataset.data[uid] ) {
        dataset.data[uid].data = pendingRec.post;
        dataset.data[uid].hash = pendingRec.postHash;
        dataset.meta[uid].fromPending = true;
        dataset.meta[uid].pendingUid = pendingRec.hash;
      }
    },

    updatePendingFromNewData: function(dataset_id, dataset, newData) {
      var pending = dataset.pending;
      var newRec;

      if( pending && newData.records) {
        for( var pendingHash in pending ) {
          if( pending.hasOwnProperty(pendingHash) ) {
            var pendingRec = pending[pendingHash];

            dataset.meta[pendingRec.uid] = dataset.meta[pendingRec.uid] || {};

            if( pendingRec.inFlight === false ) {
              // Pending record that has not been submitted
              self.consoleLog('updatePendingFromNewData - Found Non inFlight record -> action=' + pendingRec.action +' :: uid=' + pendingRec.uid  + ' :: hash=' + pendingRec.hash);
              if( pendingRec.action === "update" || pendingRec.action === "delete") {
                // Update the pre value of pending record to reflect the latest data returned from sync.
                // This will prevent a collision being reported when the pending record is sent.
                newRec = newData.records[pendingRec.uid];
                if( newRec ) {
                  self.consoleLog('updatePendingFromNewData - Updating pre values for existing pending record ' + pendingRec.uid);
                  pendingRec.pre = newRec.data;
                  pendingRec.preHash = newRec.hash;
                }
                else {
                  // The update/delete may be for a newly created record in which case the uid will have changed.
                  var previousPendingUid = dataset.meta[pendingRec.uid].previousPendingUid;
                  var previousPending = pending[previousPendingUid];
                  if( previousPending ) {
                    if( newData && newData.updates &&  newData.updates.applied && newData.updates.applied[previousPending.hash] ) {
                      // There is an update in from a previous pending action
                      var newUid = newData.updates.applied[previousPending.hash].uid;
                      newRec = newData.records[newUid];
                      if( newRec ) {
                        self.consoleLog('updatePendingFromNewData - Updating pre values for existing pending record which was previously a create ' + pendingRec.uid + ' ==> ' + newUid);
                        pendingRec.pre = newRec.data;
                        pendingRec.preHash = newRec.hash;
                        pendingRec.uid = newUid;
                      }
                    }
                  }
                }
              }

              if( pendingRec.action === "create" ) {
                if( newData && newData.updates &&  newData.updates.applied && newData.updates.applied[pendingHash] ) {
                  self.consoleLog('updatePendingFromNewData - Found an update for a pending create ' + JSON.stringify(newData.updates.applied[pendingHash]));
                  newRec = newData.records[newData.updates.applied[pendingHash].uid];
                  if( newRec ) {
                    self.consoleLog('updatePendingFromNewData - Changing pending create to an update based on new record  ' + JSON.stringify(newRec));

                    // Set up the pending create as an update
                    pendingRec.action = "update";
                    pendingRec.pre = newRec.data;
                    pendingRec.preHash = newRec.hash;
                    pendingRec.uid = newData.updates.applied[pendingHash].uid;
                  }
                }
              }
            }
          }
        }
      }
    },

    updateNewDataFromInFlight: function(dataset_id, dataset, newData) {
      var pending = dataset.pending;

      if( pending && newData.records) {
        for( var pendingHash in pending ) {
          if( pending.hasOwnProperty(pendingHash) ) {
            var pendingRec = pending[pendingHash];

            if( pendingRec.inFlight ) {
              var updateReceivedForPending = (newData && newData.updates &&  newData.updates.hashes && newData.updates.hashes[pendingHash]) ? true : false;

              self.consoleLog('updateNewDataFromInFlight - Found inflight pending Record - action = ' + pendingRec.action + ' :: hash = ' + pendingHash + ' :: updateReceivedForPending=' + updateReceivedForPending);

              if( ! updateReceivedForPending ) {
                var newRec = newData.records[pendingRec.uid];

                if( pendingRec.action === "update" && newRec) {
                  // Modify the new Record to have the updates from the pending record so the local dataset is consistent
                  newRec.data = pendingRec.post;
                  newRec.hash = pendingRec.postHash;
                }
                else if( pendingRec.action === "delete" && newRec) {
                  // Remove the record from the new dataset so the local dataset is consistent
                  delete newData.records[pendingRec.uid];
                }
                else if( pendingRec.action === "create" ) {
                  // Add the pending create into the new dataset so it is not lost from the UI
                  self.consoleLog('updateNewDataFromInFlight - re adding pending create to incomming dataset');
                  var newPendingCreate = {
                    data: pendingRec.post,
                    hash: pendingRec.postHash
                  };
                  newData.records[pendingRec.uid] = newPendingCreate;
                }
              }
            }
          }
        }
      }
    },

    updateNewDataFromPending: function(dataset_id, dataset, newData) {
      var pending = dataset.pending;

      if( pending && newData.records) {
        for( var pendingHash in pending ) {
          if( pending.hasOwnProperty(pendingHash) ) {
            var pendingRec = pending[pendingHash];

            if( pendingRec.inFlight === false ) {
              self.consoleLog('updateNewDataFromPending - Found Non inFlight record -> action=' + pendingRec.action +' :: uid=' + pendingRec.uid  + ' :: hash=' + pendingRec.hash);
              var newRec = newData.records[pendingRec.uid];
              if( pendingRec.action === "update" && newRec) {
                // Modify the new Record to have the updates from the pending record so the local dataset is consistent
                newRec.data = pendingRec.post;
                newRec.hash = pendingRec.postHash;
              }
              else if( pendingRec.action === "delete" && newRec) {
                // Remove the record from the new dataset so the local dataset is consistent
                delete newData.records[pendingRec.uid];
              }
              else if( pendingRec.action === "create" ) {
                // Add the pending create into the new dataset so it is not lost from the UI
                self.consoleLog('updateNewDataFromPending - re adding pending create to incomming dataset');
                var newPendingCreate = {
                  data: pendingRec.post,
                  hash: pendingRec.postHash
                };
                newData.records[pendingRec.uid] = newPendingCreate;
              }
            }
          }
        }
      }
    },

    updateCrashedInFlightFromNewData: function(dataset_id, dataset, newData) {
      var updateNotifications = {
        applied: self.notifications.REMOTE_UPDATE_APPLIED,
        failed: self.notifications.REMOTE_UPDATE_FAILED,
        collisions: self.notifications.COLLISION_DETECTED
      };

      var pending = dataset.pending;
      var resolvedCrashes = {};
      var pendingHash;
      var pendingRec;


      if( pending ) {
        for( pendingHash in pending ) {
          if( pending.hasOwnProperty(pendingHash) ) {
            pendingRec = pending[pendingHash];

            if( pendingRec.inFlight && pendingRec.crashed) {
              self.consoleLog('updateCrashedInFlightFromNewData - Found crashed inFlight pending record uid=' + pendingRec.uid + ' :: hash=' + pendingRec.hash );
              if( newData && newData.updates && newData.updates.hashes) {

                // Check if the updates received contain any info about the crashed in flight update
                var crashedUpdate = newData.updates.hashes[pendingHash];
                if( crashedUpdate ) {
                  // We have found an update on one of our in flight crashed records

                  resolvedCrashes[crashedUpdate.uid] = crashedUpdate;

                  self.consoleLog('updateCrashedInFlightFromNewData - Resolving status for crashed inflight pending record ' + JSON.stringify(crashedUpdate));

                  if( crashedUpdate.type === 'failed' ) {
                    // Crashed update failed - revert local dataset
                    if( crashedUpdate.action === 'create' ) {
                      self.consoleLog('updateCrashedInFlightFromNewData - Deleting failed create from dataset');
                      delete dataset.data[crashedUpdate.uid];
                    }
                    else if ( crashedUpdate.action === 'update' || crashedUpdate.action === 'delete' ) {
                      self.consoleLog('updateCrashedInFlightFromNewData - Reverting failed ' + crashedUpdate.action + ' in dataset');
                      dataset.data[crashedUpdate.uid] = {
                        data : pendingRec.pre,
                        hash : pendingRec.preHash
                      };
                    }
                  }

                  delete pending[pendingHash];
                  self.doNotify(dataset_id, crashedUpdate.uid, updateNotifications[crashedUpdate.type], crashedUpdate);
                }
                else {
                  // No word on our crashed update - increment a counter to reflect another sync that did not give us
                  // any update on our crashed record.
                  if( pendingRec.crashedCount ) {
                    pendingRec.crashedCount++;
                  }
                  else {
                    pendingRec.crashedCount = 1;
                  }
                }
              }
              else {
                // No word on our crashed update - increment a counter to reflect another sync that did not give us
                // any update on our crashed record.
                if( pendingRec.crashedCount ) {
                  pendingRec.crashedCount++;
                }
                else {
                  pendingRec.crashedCount = 1;
                }
              }
            }
          }
        }

        for( pendingHash in pending ) {
          if( pending.hasOwnProperty(pendingHash) ) {
            pendingRec = pending[pendingHash];

            if( pendingRec.inFlight && pendingRec.crashed) {
              if( pendingRec.crashedCount > dataset.config.crashed_count_wait ) {
                self.consoleLog('updateCrashedInFlightFromNewData - Crashed inflight pending record has reached crashed_count_wait limit : ' + JSON.stringify(pendingRec));
                if( dataset.config.resend_crashed_updates ) {
                  self.consoleLog('updateCrashedInFlightFromNewData - Retryig crashed inflight pending record');
                  pendingRec.crashed = false;
                  pendingRec.inFlight = false;
                }
                else {
                  self.consoleLog('updateCrashedInFlightFromNewData - Deleting crashed inflight pending record');
                  delete pending[pendingHash];
                }
              }
            }
            else if (!pendingRec.inFlight && pendingRec.crashed ) {
              self.consoleLog('updateCrashedInFlightFromNewData - Trying to resolve issues with crashed non in flight record - uid = ' + pendingRec.uid);
              // Stalled pending record because a previous pending update on the same record crashed
              var crashedRef = resolvedCrashes[pendingRec.uid];
              if( crashedRef ) {
                self.consoleLog('updateCrashedInFlightFromNewData - Found a stalled pending record backed up behind a resolved crash uid=' + pendingRec.uid + ' :: hash=' + pendingRec.hash);
                pendingRec.crashed = false;
              }
            }
          }
        }
      }
    },


    markInFlightAsCrashed : function(dataset) {
      var pending = dataset.pending;
      var pendingHash;
      var pendingRec;

      if( pending ) {
        var crashedRecords = {};
        for( pendingHash in pending ) {
          if( pending.hasOwnProperty(pendingHash) ) {
            pendingRec = pending[pendingHash];

            if( pendingRec.inFlight ) {
              self.consoleLog('Marking in flight pending record as crashed : ' + pendingHash);
              pendingRec.crashed = true;
              crashedRecords[pendingRec.uid] = pendingRec;
            }
          }
        }

        // Check for any pending updates that would be modifying a crashed record. These can not go out until the
        // status of the crashed record is determined
        for( pendingHash in pending ) {
          if( pending.hasOwnProperty(pendingHash) ) {
            pendingRec = pending[pendingHash];

            if( ! pendingRec.inFlight ) {
              var crashedRef = crashedRecords[pendingRec.uid];
              if( crashedRef ) {
                pendingRec.crashed = true;
              }
            }
          }
        }
      }
    },

    consoleLog: function(msg) {
      if( self.config.do_console_log ) {
        console.log(msg);
      }
    }
  };

  (function() {
    self.config = self.defaults;
  })();

  return {
    init: self.init,
    manage: self.manage,
    notify: self.notify,
    doList: self.list,
    doCreate: self.create,
    doRead: self.read,
    doUpdate: self.update,
    doDelete: self['delete'],
    listCollisions: self.listCollisions,
    removeCollision: self.removeCollision,
    getPending : self.getPending,
    clearPending : self.clearPending,
    getDataset : self.getDataSet
  };
})();
(function(root){
  root.$fh = root.$fh || {};
  var $fh = root.$fh;
  $fh.sec = function(p, s, f){
    if (!p.act) {
      f('bad_act', {}, p);
      return;
    }
    if (!p.params) {
      f('no_params', {}, p);
      return;
    }
    if (!p.params.algorithm) {
      f('no_params_algorithm', {}, p);
      return;
    }
    var isNodeApp = function(){
      if($fh && $fh.cloud_props && $fh.cloud_props.hosts && $fh.app_props){
        var appType = $fh.cloud_props.hosts.releaseCloudType;
        if($fh.app_props.mode && $fh.app_props.mode.indexOf("dev") > -1){
          appType = $fh.cloud_props.hosts.debugCloudType;
        }
        if(appType === "fh"){
          return false;
        }
      }
      return true;
    };

    var load_security_module = function(cb){
      if(typeof __Crypto !== "undefined"){
        //__Crypto only exists in the legacy security library. If it exists, it's alreay loaded
        return cb();
      } else {
        $fh.__load_script('fhext/js/security.js', cb);
      }
    };

    var acts = {
      'keygen': function () {
        if (!p.params.keysize) {
          f('no_params_keysize', {}, p);
          return;
        }
        if (p.params.algorithm.toLowerCase() !== "aes") {
          f('keygen_bad_algorithm', {}, p);
          return;
        }
        var keysize = parseInt(p.params.keysize, 10);
        //keysize is in bit, need to convert to bytes to generate random key
        //but the legacy code has a bug, it doesn't do the convert, so if the keysize is less than 100, don't convert
        if(keysize > 100){
          keysize = keysize/8;
        }
        if(typeof SecureRandom === "undefined"){
          return f("security library is not loaded.");
        }
        var generateRandomKey = function(keysize){
          var r = new SecureRandom();
          var key = new Array(keysize);
          r.nextBytes(key);
          var result = "";
          for(var i=0;i<key.length;i++){
            result += byte2Hex(key[i]);
          }
          return result;
        };

        if(isNodeApp()){
          return s({
            'algorithm': 'AES',
            'secretkey': generateRandomKey(keysize),
            'iv': generateRandomKey(keysize)
          });
        } else {
          return s({
            'algorithm':'AES',
            'secretkey': generateRandomKey(keysize)
          });
        }
      },

      'encrypt': function () {
        var found_err = false;
        var fields = {
          'aes': ['key', 'plaintext'],
          'rsa': ['modulu', 'plaintext']
        };
        if(!isNodeApp()){
          fields.rsa.push('keysize');
          fields.rsa.push('key');
        } else {
          fields.aes.push('iv');
        }
        var required = fields[p.params.algorithm.toLowerCase()];
        if (!required) {
          f('encrypt_bad_algorithm', {}, p);
          return;
        }
        for (var i = 0; i < required; i++) {
          var field = required[i];
          if (!p.params[field]) {
            found_err = true;
            f('no_params_' + field, {}, p);
            break;
          }
        }
        if (found_err) {
          return;
        }
        var rsa_encrypt, aes_encrypt;
        if(isNodeApp()){
          rsa_encrypt = function(p, s, f){
            if(typeof RSAKey === "undefined"){
              return f("security library is missing.Error: can not find RSAKey.");
            }
            var key = new RSAKey();
            key.setPublic(p.params.modulu, "10001");
            var ori_text = p.params.plaintext;
            cipher_text = key.encrypt(ori_text);
            s({ciphertext:cipher_text});
          };
          aes_encrypt = function(p, s, f){
            if(typeof CryptoJS === "undefined"){
              return f("security library is missing.Error: can not find CryptoJS.");
            }
            var encrypted = CryptoJS.AES.encrypt(p.params.plaintext, CryptoJS.enc.Hex.parse(p.params.key), {iv: CryptoJS.enc.Hex.parse(p.params.iv)});
            cipher_text = CryptoJS.enc.Hex.stringify(encrypted.ciphertext);
            s({ciphertext: cipher_text});
          };
        } else {
          rsa_encrypt = function(p, s, f){
            load_security_module(function(){
              if(typeof RSAKeyPair === "undefined"){
                return f('legacy security library is missing. Error: can not find RSAKeyPair.');
              }
              var key_size = parseInt(p.params.keysize, 10);
              var max = parseInt(key_size * 2 / 16 + 2, 10);
              setMaxDigits(max);
              var key = new RSAKeyPair(p.params.key, p.params.key, p.params.modulu);
              var ori_text = p.params.plaintext;
              var input = '';
              for (var i = ori_text.length - 1; i >= 0; i--) {
                input += ori_text.charAt(i);
              }
              cipher_text = encryptedString(key, input);
              s({ciphertext: cipher_text});
            });
          };
          aes_encrypt = function(p, s, f){
            load_security_module(function(){
              if(typeof __Crypto === "undefined"){
                return f("legacy security library is missing. Error: can not find __Crypto.");
              }
              if (typeof $fh.Cipher === "undefined") {
                $fh.Cipher = __Crypto.__import(__Crypto, "titaniumcore.crypto.Cipher");
              }
              var data = __Crypto.str2utf8(p.params.plaintext);
              var key = __Crypto.base16_decode(p.params.key);
              var cipher = $fh.Cipher.create($fh.Cipher.RIJNDAEL, $fh.Cipher.ENCRYPT, $fh.Cipher.ECB, $fh.Cipher.ISO10126);
              cipher_text = __Crypto.base16_encode(cipher.execute(key, data));
              s({ciphertext: cipher_text});
            });
          };
        }

        if (p.params.algorithm.toLowerCase() === "rsa") {
          return rsa_encrypt(p, s, f);
        } else if (p.params.algorithm.toLowerCase() === "aes") {
          return aes_encrypt(p, s, f);
        } else {
          f('encrypt_bad_algorithm', {}, p);
          return;
        }
      },

      'decrypt': function () {
        var found_err = false;
        var fields = {
          'aes': ['key', 'ciphertext']
        };
        if(isNodeApp()){
          fields.aes.push('iv');
        }
        var required = fields[p.params.algorithm.toLowerCase()];
        if (!required) {
          f('decrypt_bad_algorithm', {}, p);
          return;
        }
        for (var i = 0; i < required; i++) {
          var field = required[i];
          if (!p.params[field]) {
            found_err = true;
            f('no_params_' + field, {}, p);
            break;
          }
        }
        if (found_err) {
          return;
        }
        var aes_decrypt;
        if(isNodeApp()){
          aes_decrypt = function(p, s, f){
            if(typeof CryptoJS === "undefined"){
              return f("security library is missing.Error: can not find CryptoJS.");
            }
            var data = CryptoJS.enc.Hex.parse(p.params.ciphertext);
            var encodeData = CryptoJS.enc.Base64.stringify(data);
            var decrypted = CryptoJS.AES.decrypt(encodeData, CryptoJS.enc.Hex.parse(p.params.key), {iv: CryptoJS.enc.Hex.parse(p.params.iv)});
            plain_text = decrypted.toString(CryptoJS.enc.Utf8);
            s({plaintext:plain_text});
          };
        } else {
          aes_decrypt = function(p, s, f){
            load_security_module(function(){
              if(typeof __Crypto === "undefined"){
                return f("legacy security library is missing. Error: can not find __Crypto.");
              }
              if (typeof $fh.Cipher === "undefined") {
                $fh.Cipher = __Crypto.__import(__Crypto, "titaniumcore.crypto.Cipher");
              }
              var data = __Crypto.base16_decode(p.params.ciphertext);
              var key = __Crypto.base16_decode(p.params.key);
              var cipher = $fh.Cipher.create($fh.Cipher.RIJNDAEL, $fh.Cipher.DECRYPT, $fh.Cipher.ECB, $fh.Cipher.ISO10126);
              plain_text = __Crypto.utf82str(cipher.execute(key, data));
              s({plaintext:plain_text});
            });
          };
        }

        if (p.params.algorithm.toLowerCase() === "aes") {
          aes_decrypt(p, s, f);
        } else {
          f('decrypt_bad_algorithm', {}, p);
          return;
        }
      },

      'hash': function () {
        if (!p.params.text) {
          f('hash_no_text', {}, p);
          return;
        }
        if(typeof CryptoJS === "undefined"){
          return f("security library is missing.Error: can not find CryptoJS.");
        }
        var hashValue;
        if (p.params.algorithm.toLowerCase() === "md5") {
          hashValue = CryptoJS.MD5(p.params.text).toString(CryptoJS.enc.Hex);
        } else if(p.params.algorithm.toLowerCase() === "sha1"){
          hashValue = CryptoJS.SHA1(p.params.text).toString(CryptoJS.enc.Hex);
        } else if(p.params.algorithm.toLowerCase() === "sha256"){
          hashValue = CryptoJS.SHA256(p.params.text).toString(CryptoJS.enc.Hex);
        } else if(p.params.algorithm.toLowerCase() === "sha512"){
          hashValue = CryptoJS.SHA512(p.params.text).toString(CryptoJS.enc.Hex);
        } else {
          return f("hash_unsupported_algorithm: " + p.params.algorithm);
        }
        s({"hashvalue": hashValue});
      }
    };

    if(acts[p.act]){
      acts[p.act]();
    } else {
      f('data_badact', p);
    }
  };

  $fh.hash = function(p, s, f){
    var params = {};
    if(typeof p.algorithm === "undefined"){
      p.algorithm = "MD5";
    }
    params.act = "hash";
    params.params = p;
    $fh.sec(params, s, f);
  };
})(this);

(function(root){
  /*jshint curly: true, eqeqeq: true, eqnull: true, sub: true, loopfunc: true */
  /* globals { browser: true } */

  root.$fh = root.$fh || {};
  var $fh = root.$fh;

  var EMPTY_CMS = {
    cms: {
      sections: []
    }
  };

  var CMS_API_GETALL     = "/mbaas/cms/sections";  // "/mbaas/cms/getAll";
  var CMS_API_GETSECTION = "/cloud/getSection";  // "/mbaas/cms/section/get";
  var CMS_API_GETFIELD   = "/cloud/getField?fieldid=";   // "/mbaas/cms/field/";

  var CMS_FIELD_TYPES_TEXT = ['string', 'paragraph'];
  var CMS_FIELD_TYPES_FILE = ['image', 'file'];

  var _cmsAvailable = false;
  var _cmsInitialising = false;
  var _cmsData;
  var _cmsReadyListeners = [];
  var _cmsUpdateInProgress = false;
  var _cmsFileSystem;
  var _cmsFileSystemEnabled = false;

  //Object initialised, need to initialise the cms

  var handleError = function(err, failCallback){
    if(!(failCallback && typeof(failCallback) === "function")){
      failCallback = defaultFail;
    }

    return failCallback(err);
  };

  //When the CMS is ready, process the action queue.
  var _cmsReady = function(success){

    while(_cmsReadyListeners[0]){
      var cms_fun = _cmsReadyListeners.shift();

      if(success){
        $fh.cms(cms_fun.callParameters, cms_fun.success, cms_fun.fail);
      } else {
        handleError("CMS Resume Failed.", cms_fun.fail);
      }
    }
  };

  var cmsInitSuccess = function(cmsData, success){
    _cmsData = JSON.parse(JSON.stringify(cmsData));
    _cmsInitialising = false;
    _cmsReady(true);
    success();
  };

  var cmsInitFailure = function(err, failureCallback){
    _cmsInitialising = false;
    _cmsReady(false); //CMS was not able to initialise so no calls to CMS should execute. Fail all calls.
    return handleError(err, failureCallback);
  };

  var initialiseCMSFileSystem = function(cb){
    // request the persistent file system
    window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fileSystem){
      _cmsFileSystem = fileSystem;
      return cb();
    }, function(failEvent){
      return cb("Failed to initialise file system" + failEvent.target.error.code);
    });
  };

  var initialiseCMS = function (success, failure) {
    console.log("initialiseCMS() begin");
    _cmsInitialising = true;
    if(isCordovaOrPhonegapWindow()){
      _csmFileSystemEnabled = true;
    }

    console.log("initialiseCMS() _cmsFileSystemEnabled:", _cmsFileSystemEnabled);
    if (_cmsFileSystemEnabled) {
      async.waterfall([
        initialiseCMSFileSystem,
        cmsJSONFileAvailable,
        function(exists, cb) {
          if(exists){
            readCMSJSON(cb);
          } else {
            async.waterfall([
              appCMSZipAvailable,
              function (exists, cb) {
                if (exists) {
                  unzipCMSData(cb);
                } else {
                  return cb("No CMS Data Available.", failure);
                }
              }
            ], function (err, cmsData) {
              return cb(err, cmsData);
            });
          }
        }
      ], function (err, cmsData) {
        if(err) {
          return cmsInitFailure(err, failure);
        } else {
          return cmsInitSuccess(cmsData, success);
        }
      });  
    } else {  // no data persisted on filesystem, so will do full refresh
      console.log("initialiseCMS() about to call cmsInitSuccess()");
      return cmsInitSuccess(EMPTY_CMS, success);
    }
  };

  var isCordovaOrPhonegapWindow = function(){
    return (typeof window.Phonegap !== "undefined" || typeof window.cordova !== "undefined");
  };

  //TODO move "." to config to allow for splitting using different character
  var splitPathString = function(pathString){
    return pathString.split(".");
  };

  //Parsing a section is always the second last element of the path array. section.section2.field
  var parseSection = function(sectionPathArray){
    return sectionPathArray[sectionPathArray.length - 2]; //indexing from 0 and second last.
  };

  var parseField = function(sectionPathArray){
    return sectionPathArray[sectionPathArray.length - 1]; //indexing from 0 and last.
  };

  var defaultFail = function(err){
    if(console){
      console.log(err);
    }
  };

  var constructGetFieldURL = function (fieldid) {
    return getCloudUrlPrefix() + CMS_API_GETFIELD + fieldid;
  };

  //TODO this will change with file handling
  var getFieldValue = function(field, fieldOptions, cb){
    var retErr;
    var retVal;
    if (fieldOptions.list) {
      findCMSFieldList(field, fieldOptions, cb);
      return;
    } else {
      if (CMS_FIELD_TYPES_TEXT.indexOf(field.type) >=0 ) {
        retVal = field.value;
      } else if (CMS_FIELD_TYPES_FILE.indexOf(field.type) >= 0) {
        retVal = constructGetFieldURL(field.binaryURL);
      } else {
        retErr = "Invalid field type: " + field.type;
      }
    }
    return cb(retErr, retVal);
  };

  //TODO Needs some optimisation to avoid constantly traversing the cms structure. SectionName possibly not unique so change to hash
  var findCMSSection = function(sectionName, options, cb){

    if(options.findAllSections){// Just want all of the sections
      return cb(undefined, _cmsData.cms.sections);
    }

    console.log('findCMSSection() - sections: ', _cmsData.cms.sections);
    var foundSectionArray = _cmsData.cms.sections.filter(function(sectionEntry){
      return sectionEntry.name === sectionName;
    });

    console.log('findCMSSection() - foundSectionArray: ', foundSectionArray);

    if(foundSectionArray.length === 1){//TODO duplication here, abstract
      return cb(undefined, foundSectionArray[0]);
    } else if(foundSectionArray.length === 0){
      return cb("No section matching " + sectionName + " found.");
    } else {
      return cb("Unexpected number of sections matching " + sectionName + " found.");
    }
  };

  var findCMSField = function(section, fieldName, fieldOptions, cb){
    console.log("findCMSField() - fields: ", section.fields);
    var foundFieldArray = section.fields.filter(function(fieldEntry){
      return fieldEntry.name === fieldName;
    });

    console.log("findCMSField() - foundFieldArray: ", foundFieldArray);

    if(foundFieldArray.length === 0) {
      return cb("No field matching " + fieldName + " found.");
    } else if (foundFieldArray.length > 1) {
      return cb("Unexpected number of fields matching " + fieldName + " found. " + foundFieldArray.length);
    }  else {  // (foundFieldArray.length === 1)
      return cb(undefined, foundFieldArray[0]);
    }
  };

  var findCMSFieldList = function (field, fieldOptions, cb) {
    console.log('findCMSFieldList() - field: ', field);
    console.log('findCMSFieldList() - fieldOptions: ', fieldOptions);

    if(field.type !== "list"){
      return cb("The field " + fieldName + " is not a list.");
    } else {
      // do list stuff
      if (fieldOptions.size) {
        return cb(undefined, field.data.length);
      } else if (fieldOptions.wholeList) {
        return cb(undefined, field.data);
      } else {
        if(fieldOptions.index >= field.data.length){
          return cb("Index " + fieldOptions.index + " out of bounds.");
        }
        //Have a list index and fieldName needed,
        //Get the listOptions --> Find the field in the fieldTypes
        var foundListFieldTypeArray = field.fields.filter(function(listFieldTypeEntry){
          console.log('checking: ', listFieldTypeEntry, ", against: ", fieldOptions);
          return listFieldTypeEntry.name === fieldOptions.fieldName;
        });

        if(foundListFieldTypeArray.length === 1){
          //Found the list
          var listFieldType = foundListFieldTypeArray[0].type;

          return cb(undefined, field.data[fieldOptions.index][fieldOptions.fieldName]);

        } else if(foundListFieldTypeArray.length === 0){
          return cb("No list field matches the name: " + fieldOptions.fieldName);
        } else if(foundListFieldTypeArray.length > 1) {
          return cb("More than one list field matches the name: " + fieldOptions.fieldName);
        }
      }         
    }
  };

  var searchForFieldValue = function(params, options, s, f){
    //Correct Params are there, split the path string
    var pathString = params.path;
    var pathArray = splitPathString(pathString); //Paths are . separated section names. TODO Move "." to config to allow for different separators

    var findCMSFieldOptions = {};

    if(options.list){
      findCMSFieldOptions.list = options.list;
    }

    if (options.size) {
      findCMSFieldOptions.size = options.size;
    } else if (options.wholeList) {
      findCMSFieldOptions.wholeList = options.wholeList;
    } else {
      findCMSFieldOptions.index = params.index;
      findCMSFieldOptions.fieldName = params.fieldName; // The field within a list entry that user is interested in.
    }

    //As sections are stored flat, only interested in the last entry of the array. section.section2.field
    var sectionOfInterestName = parseSection(pathArray);
    var fieldOfInterestName = parseField(pathArray);

    //Now have the section name and field name of interest, search the cms sections for requested fields
    findCMSSection(sectionOfInterestName, {}, function(err, foundSection){
      if(err) {
        return handleError(err, f);
      }

      console.log("searchForFieldValue() - found section: ", foundSection);

      //Have the section, now find the field in the section
      findCMSField(foundSection, fieldOfInterestName, findCMSFieldOptions, function(err, foundField){
        if (err) {
          return handleError(err, f);
        }

        //Have the field, now want the value of the field.
        getFieldValue(foundField, findCMSFieldOptions, function(err, fieldValue){
          if (err) {
            return handleError(err, f);
          }

          return returnCMSValue(fieldValue, s);
        });
      });
    });
  };

  //TODO This may change with file handling.
  var returnCMSValue = function(value, successCallback){
    if(successCallback && typeof(successCallback) === "function"){
      successCallback(value);
    } else {
      return value;
    }
  };

  function isString(str) {
    return "string" === typeof str;
  }

  function isNumber(str) {
    return "number" === typeof str;
  }

  var sanityCheckParams = function(params, options, cb){
    console.log('sanityCheckParams(): params: ', params, "options: ", options);
    if(options.path){
      if(!params.path){
        return cb("No path specified");
      }
      if(!(isString(params.path) && params.path.length > 3 && params.path.indexOf(".") !== -1)){ //Must exist, be at least 3 characters long and contain at least a single . TODO: REPLACE ". with constant"
        return cb("Incorrect format for path");
      }
    }

    if(options.index){
      if("undefined" === typeof params.index){
        return cb("No index specified.");
      }
      if(!(isNumber(params.index))){
        return cb("Index must be a number.");
      }
    }

    if(options.fieldName){
      if(!params.fieldName){
        return cb("No list field name specified.");
      }
      if(!(isString(params.fieldName) && params.fieldName.length > 0)){
        return cb("List field name empty.");
      }
    }

    //If it reaches this point, all is good with the params
    cb();
  };

  var buildCMSHashList = function(options, cb){
    //Building a JSON object to send to /mbaas

    console.log('in buildCMSHashList: ');
    var cmsUpdateHashList = {};

    if(options.singleSection){
      findCMSSection(options.sectionName, {}, function(err, foundSection){
        if(err) {
          return cb(err);
        }
        cmsUpdateHashList[foundSection.name] = foundSection.hash;
        return cb(undefined, cmsUpdateHashList);
      });
    } else if(options.allSections) {
      findCMSSection(undefined, {"findAllSections": true}, function(err, foundSections){
        var i, l;
        var sectionEntry;

        for(i = 0, l = foundSections.length; i < l; i += 1){
          sectionEntry = foundSections[i]; 
          cmsUpdateHashList[sectionEntry.name] = sectionEntry.hash;
        }
        return cb(undefined, cmsUpdateHashList);
      });

    } else {
      return cb("Invalid update option " + JSON.toString(options));
    }
  };

  function getCloudUrlPrefix() {
    var cloud_host = $fh.cloud_props.hosts.releaseCloudUrl;

    if($fh.app_props.mode && $fh.app_props.mode.indexOf("dev") > -1){
      cloud_host = $fh.cloud_props.hosts.debugCloudUrl;
    }

    return cloud_host;
  }

  var sendUpdateRequest = function(options, cmsSectionHashes, cb){
    //Now, need to send the hashes to the /cms/mbaas to check for updates

    if ("function" === typeof cmsSectionHashes) {
      cb = cmsSectionHashes;
      cmsSectionHashes = {};
    }

    var payload = JSON.stringify(cmsSectionHashes);

    var path = getCloudUrlPrefix();

    if(options.singleSection){
      path += CMS_API_GETSECTION;
    } else if(options.allSections){
      path += CMS_API_GETALL;
    } else {
      return cb("Should either be updating a single or all sections.");
    }

    $fh.__ajax({
      "url": path,
      "type": "GET",
      "contentType": "application/json",
//TODO      "data": JSON.stringify(payload),
      "timeout": $fh.app_props.timeout || $fh.fh_timeout,
      "success": function(data) {
        console.log(typeof data);
        console.log(data);
        return cb(undefined, data);
      },
      "error": function(req, statusText, error) {
        return cb(error);
      }
    });
  };

  var sanityCheckUpdateResponse = function(jsonResponse, cb) {
    var updatedSectionArray = jsonResponse.cms;

    if(!(updatedSectionArray && Array.isArray(updatedSectionArray))){
      return cb("Invalid update response. Aborting");
    }

    async.each(updatedSectionArray, function (updatedSectionEntry, cb) {
      if(!(updatedSectionEntry.updateFlag && isString(updatedSectionEntry.updateFlag) && updatedSectionEntry.name && isString(updatedSectionEntry.name))) {
        console.log("updatedSectionEntry", updatedSectionEntry);
        return cb("Invalid update response fields. Aborting.");
      }

      //Check sections changed or deleted actually exist.
      if(updatedSectionEntry.updateFlag === "changed" || updatedSectionEntry.updateFlag === "deleted"){
        findCMSSection(updatedSectionEntry.name, {}, cb);
      } else if(updatedSectionEntry.updateFlag === "added"){
        findCMSSection(updatedSectionEntry.name, {}, function(err, section){
          console.log("after find - err: ", err);
          // should be a not found error from "find" so if no error, or if error not "no section found" then callback with error
          if(!err){
            return cb("Section " + updatedSectionEntry.name + " expected to be added. Should not exist. But it does.");
          } else if(err.indexOf("No section matching") === -1){
            return cb(err);
          }
          return cb();
        });
      } else {
        return cb("Invalid Update Flag For Section " + updatedSectionEntry.name);
      }
    }, function (err) {
      return cb(err);
    });
  };

  var scanSectionForFiles = function(sectionToScan, cb){
    //Need to find any file references in the section fields.
    //for each field -- check type. If file or image then get fileHash

    var sectionFiles = {};
    sectionFiles[sectionToScan.hash] = [];
    for(var field in sectionToScan.fields){
      var fieldPath = sectionToScan.path + "." + field.name; //Field path === sectionPath.fieldName. (e.g. section1.section2.field1) TODO Abstract out.
      if(field.type === "file" || field.type === "image"){
        var fileEntry = {};
        fileEntry[field.value] = fieldPath; //fileHash : fieldPath.
        sectionFiles[sectionToScan.hash].push(fileEntry);
      } else if(field.type === "list"){

        //Go through each of the fields, check if any are files/images, then go through each of the entries and add to the list
        var listFileEntries = [];
        for(var listField in field.fields){
          if(listField.type === "file" || listField.type === "image"){
            listFileEntries.push(listField.name);
          }
        }

        if(listFileEntries > 0){
          for(var listFileEntry in listFileEntries){
            for(var i = 0; i < field.data.length ; i++){
              var listFieldPath = sectionToScan.path + "." + field.name + "." + String.toString(i) + "." + listFileEntry; //list entry paths are a combination of sectionPath.listName.index.fieldName. TODO Abstract
              var listFile = {};
              listFile[field.data[i][listFileEntry].value] = listFieldPath;
              sectionFiles[sectionToScan.hash].push(listFile);
            }
          }
        } else {
          // None of the list entries are files -- DO nothing
        }
      } else {
        //Not a file or image, do nothing
      }
    }

    //blocking for loop no callbacks-- can return at end
    cb(undefined, sectionFiles);
  };

  var processAddedSection = function(addedSection, cb){
    //A new section will contain the entire field list of the section
    //Insert new section
    //Scan section for files
    //Return file changes
    insertCMSSection(addedSection, function(err){
      if (err) {
        return cb(err);
      }

      scanSectionForFiles(addedSection, cb);
    });
  };

  var processDeletedSection = function(deletedSection, cb){
    //A deleted section must be scanned for files before it is to be deleted.
    //Return list of files to be deleted.

    findCMSSection(deletedSection.name, {}, function(err, foundSection){
      if (err) {
        return cb(err);
      }

      scanSectionForFiles(foundSection, function(err, fileChanges){
        if (err) {
          return cb(err);
        }

        deleteCMSSection(deletedSection, function(err){
          return cb(err, fileChanges);
        });
      });
    });
  };

  var insertCMSSection = function(sectionToInsert, cb){
    _cmsData.cms.sections.push(sectionToInsert);
    return cb();
  };

  //Handy search feature for section Array.
  Array.prototype.indexOfSection = function(sectionName){
    for(var i = 0; i < this.length; i++){
      if(this[i].name === sectionName){
        return i;
      }
    }
    return -1;
  };

  var deleteCMSSection = function(sectionToDelete, cb){
    var indexOfSection = _cmsData.cms.sections.indexOfSection(sectionToDelete.name);

    if(indexOfSection > -1){
      //Found the index of the section
      _cmsData.cms.sections.splice(indexOfSection, 1); // Just want to delete one object
      return cb();
    } else {
      return cb("Section " + sectionToDelete.name + " does not exist");
    }
  };

  var processCMSUpdateResponse = function(jsonResponse, cb){
    //Right, response object contains a array of sections response.cms.iterate ---
    var updatedSectionArray = jsonResponse.sections; // TODO  .cms;
    var fileChanges = {"added": [], "deleted": []};

    var processors = {
      "changed": function (entry, cb) {
        processDeletedSection(entry, function (err, delFileChanges) {
          if (err) {
            return cb(err);
          }
          processAddedSection(entry, function (err, addFileChanges) {
            if(err) {
              return cb(err);
            }
            fileChanges.added.push(addFileChanges);
            fileChanges.deleted.push(delFileChanges);
            return cb();
          });
        });
      },
      "added": function (entry, cb) {
        processAddedSection(entry, function (err, addFileChanges) {
          if (err) {
            return cb(err);
          }
          fileChanges.added.push(addFileChanges);
          return cb();
        });
      },
      "deleted": function (entry, cb) {
        processDeletedSection(entry, function (err, delFileChanges) {
          if (err) {
            return cb(err);
          }
          fileChanges.deleted.push(delFileChanges);
          return cb();
        });
      }
    };

    console.log("processCMSUpdateResponse() - processing response: ", updatedSectionArray);
    async.series([
      //TODO async.apply(sanityCheckUpdateResponse, jsonResponse),
      async.apply(async.eachSeries, updatedSectionArray,
        function(updatedSectionEntry, cb) {
          console.log("processCMSUpdateResponse() - processing: ", updatedSectionEntry);
          if (processors[updatedSectionEntry.updateFlag]) {
            processors[updatedSectionEntry.updateFlag](updatedSectionEntry, cb);
          } else {
            processors["added"](updatedSectionEntry, cb);   // TODO remove this when updateAll ith hashes implementer in server
            //TODO return cb(new Error("Invalid updateFlag"));
          }
        }
      )
    ], function (err) {
        //No errors, update worked
        console.log('avoid handling updated files, err: ', err);
        return cb(err);
        return cmsFilesUpdate(fileChanges, cb);//Finished update for file structure, now need to update the file storage.
    });
  };

  var cmsUpdateError = function(err, failCallback){ //TODO Similar to cmsInitFail, can integrate.
    _cmsUpdateInProgress = false;
    return handleError(err, failCallback);
  };

  var updateCMS = function(options, successCallback, failCallback){
    //To update the cms, build hash list needed -- single section or all
    //Make call to /mbaas/cms/getAll or /mbaas/cms/section/get depending on options
    //process cmsUpdateResponse

    _cmsUpdateInProgress = true; //queueing calls until data is updated.
    async.waterfall([
      function (cb) {  // TODO not currently sending the hash list for updates, initialising instead
        // when server-side updated replane with:    async.apply(buildCMSHashList, options),
        initialiseCMS(function() {
          return cb(undefined, {});
        }, function () {
          return cb("failure initialising");
        });
      },
      async.apply(sendUpdateRequest, options),
      processCMSUpdateResponse
    ], function (err) {
      if (err) {
        return cmsUpdateError(err, failCallback);
      } else {
        _cmsReady(true);
        _cmsUpdateInProgress = false;
        successCallback();
      }
    });
  };

  function doNothing() {
    // this is the default callback function
  }

  $fh.cms = {
    /*
     * Initialise CMS
     *   s - success callback - funciton () {}
     *   f - failure callback - function (error) {}
     */
    init: function (s, f) {
      _cmsInitialising = true; //Immediately set the cms to initialising to block other calls
      console.log('Initialising mCMS');
      if (!f) {
        f = doNothing;
      }
      if (!s) {
        s = doNothing;
      }
      return initialiseCMS(s, f);
    },

    /*
     * Update CMS from server
     *   s - success callback - funciton () {}
     *   f - failure callback - function (error) {}
     */    
    updateAll: function (s, f) {
      if (!f) {
        f = doNothing;
      }
      if (!s) {
        s = doNothing;
      }
      return updateCMS({"allSections": true}, s, f);
    },

    /*     
     * get CMS Field value
     *   p - params - {"path": dot.seperated.path.section.field.name}
     *   s - success callback - funciton (value) {}
     *   f - failure callback - function (error) {}
     *
     * Function: $fh.cms.getField(params)

     * Params:
     *   path - dot separated name of section & field to return
     * Response: 
     *   Non Blocking. Returns requested field from CMS content as response
     * Errors: 
     *   No CMS
     */           
    getField: function(params, s, f){
      if (!f) {
        f = doNothing;
      }
      if (!s) {
        s = doNothing;
      }
      console.log("getField() called with params: ", params);
      sanityCheckParams(params, {"path": true}, function(err){
        if(err){
          return handleError(err, f);
        }

        return searchForFieldValue(params, {}, s, f);
      });
    },

    getList: function(params, s, f){
      sanityCheckParams(params, {"path": true}, function(err){
        if(err){
          return handleError(err, f);
        }
        return searchForFieldValue(params, {"list": true, "wholeList": true}, s, f);
      });
    },

    getListSize: function(params, s, f){
      sanityCheckParams(params, {"path": true}, function(err){
        if(err){
          return handleError(err, f);
        }

        return searchForFieldValue(params, {"list": true, "size": true}, s, f);
      });
    },

    getListField: function(params, s, f){
      sanityCheckParams(params, {"path": true, "index": true, "fieldName": true}, function(err){
        if(err){
          return handleError(err, f);
        }

        return searchForFieldValue(params, {"list": true}, s, f);
      });
    }
  };

  $fh.cms2 = function(p, s, f){//Parameters, success, failure
    //TODO This init logic should be its own function
    //TODO Success and fail for init should be their own functions.
    if(!_cmsAvailable && !_cmsInitialising){ //CMS Not Available and not initialising, try and init cms
      _cmsInitialising = true; //Immediately set the cms to initialising to block other calls
      initialiseCMS(function(s, f){
        return doCMSAct(p,s,f);
      }, function(err){
        return handleError(err);
      });
    } else if(!_cmsAvailable && _cmsInitialising){ //CMS Initialising -- Add the request to a queue
      return _cmsReadyListeners.push({"callParameters" : p, "success": s, "fail": f});
    } else if(_cmsAvailable && !_cmsInitialising){ //cms is available and not initialising, process request
      return doCMSAct(p,s,f);
    } else { //Any other state is illegal.
      return handleError("CMS Initialisation Illegal State", f);
    }

    if(_cmsUpdateInProgress){
      return _cmsReadyListeners.push({"callParameters" : p, "success": s, "fail": f});
    }

    var acts = {
      "getField": function(){
        //Check getFieldParams
        //getFieldValue
        //If Exists --> Return Value
        //If Not --> Failure
        var params = p.params;
        sanityCheckParams(params, {"path": true}, function(err){
          if(err){
            return handleError(err, f);
          }

          return searchForFieldValue(params, {}, s, f);
        });
      },
      "getListSize": function(){
        var params = p.params;
        sanityCheckParams(params, {"path": true}, function(err){
          if(err){
            return handleError(err, f);
          }

          return searchForFieldValue(params, {"list": true, "size": true}, s, f);
        });
      },
      "getListField": function(){
        var params = p.params;
        sanityCheckParams(params, {"path": true, "index": true, "fieldName": true}, function(err){
          if(err){
            return handleError(err, f);
          }

          return searchForFieldValue(params, {"list": true}, s, f);
        });
      },
      "updateSection": function(){
        var params = p.params;
        sanityCheckParams(params, {"path": true}, function(err){
          if(err){
            return handleError(err, f);
          }

          var sectionPathArray = splitPathString(params.path);
          var sectionName = parseSection(sectionPathArray);
          return updateCMS({"singleSection": true, "sectionName": sectionName}, s, f);
        });
      },
      "updateAll": function(){
        var params = p.params;
        sanityCheckParams(params, {}, function(err){
          if(err){
            return handleError(err, f);
          }

          return updateCMS({"allSections": true}, s, f);
        });
      }
    };

    //Function To do The actual processing --> Can assume the CMS is available at this point
    var doCMSAct = function(p, s, f){
      sanityCheckParams(p, s, f, function(err){
        if(err){
          return handleError(err, f);
        } else {

          if(acts[p.act]){
            return acts[p.act]();
          } else {
            return handleError("Invalid CMS Action Call", f);
          }
        }
      });
    };
  };

  var cmsJSONFileAvailable = function(cb){
    $fh.__cmsFileManager({"act": "fileExists", "params": {"fileName": "fh-cms.js"}}, cb);//TODO fh-cms.js should be constant or config
  };

  var appCMSZipAvailable = function(cb){
    $fh.__cmsFileManager({"act": "cmsZipExists"}, cb);
  };

  var unzipCMSData = function(cb){
    $fh.__cmsFileManager({"act": "unzipCMS"}, cb);
  };

  var writeCMSDataToFile = function(cb){
    $fh.__cmsFileManager({"act": "writeFile", "params": {"fileName": "fh-cms.js"}}, cb);
  };

  //TODO FileData Should not all reside in RAM -- optimise
  var readCMSJSON = function(cb){
    $fh.__cmsFileManager({"act": "readFile", "params": {"fileName": "fh-cms.js"}}, function(err, cmsJSONString){
      if (err) {
        return cb(err);
      }
      if (!fileData) {
        return cb("No Data Read");
      }

      var cmsJSON = JSON.parse(cmsJSONString); //Parsing CMS Data.
      cb(undefined, cmsJSON);
    });//TODO fh-cms.js should be constant or config
  };

  var cmsFilesUpdate = function(fileChanges, cb){
    //Need to process any changes to files made by updating the cms.
    //Files are either added or deleted.
    var filesNotInFileSystem = []; //Array of file hashes not in storage
    var sectionChanges;
    var deletedFileChanges = fileChanges.deleted;
    var addedFileChanges = fileChanges.added;
    var fileChange;
    var fileHash;
    var sectionHash;
    var fileEntryIndex;
    var fileHashes;
    var filesCheckedSuccess;

    for(sectionHash in addedFileChanges){
      sectionChanges = addedFileChanges[sectionHash];
      for(fileChange in sectionChanges){
        for(fileHash in fileChange){ //fileChange[fileHash] is the path of the file.
          if(_cmsData.fileStorage[fileHash]){
            _cmsData.fileStorage[fileHash].push(fileChange[fileHash]);
          } else { //File does not exist in file system. Need to download it.
            _cmsData.fileStorage[fileHash] = [];
            _cmsData.fileStorage[fileHash].push(fileChange[fileHash]);
            filesNotInFileSystem.push(fileHash);
          }

        }
      }
    }

    for (sectionHash in deletedFileChanges){ //TODO duplicated, can make a function out of this.
      sectionChanges = deletedFileChanges[sectionHash];
      for (fileChange in sectionChanges){
        for (fileHash in fileChange){
          fileEntryIndex = _cmsData.fileStorage[fileHash].indexOf(fileChange[fileHash]); // Just an array of string so I can compare.
          _cmsData.fileStorage[fileHash].splice(fileEntryIndex, 1);
        }
      }
    }

    //All changes to file storage complete. Need to check if any files have no more references.
    fileHashes = _cmsData.fileStorage;
    filesCheckedSuccess = {};
    for(fileHash in fileHashes){
      if(fileHashes[fileHash].length === 0){
        $fh.__cmsFileManager({"act": "delete", "params": {"fileHash": fileHash}}, function (err) {
          if (!err) {
            filesCheckedSuccess = true;
          } else {
            filesCheckedSuccess[fileHash] = err;
          }
        });
      }
    }

    var filesCheckedInterval = setInterval(function(){
      var fileCheckHash;
      if(filesCheckedSuccess.length === fileHashes.length){
        //Finished -- check for success
        for(fileCheckHash in filesCheckedSuccess){
          if(filesCheckedSuccess[fileCheckHash] !== true){
            clearInterval(filesCheckedInterval);
            return cb(filesCheckedSuccess[fileCheckHash]);// Error, return the error
          }
        }

        //All good, now download any files needed
        clearInterval(filesCheckedInterval);
        downloadMissingFiles(filesNotInFileSystem, cb);
      }
    }, 500); //TODO Set interval as config option.
  };

  var downloadMissingFiles = function(missingFilesHashes, cb){
    var missingFilesCompleted = {};
    var missingFileHash;

    for(missingFileHash in missingFilesHashes){
      $fh.__cmsFileManager({"act" : "download", "params": {"hash" : missingFileHash}}, function(err){
        if (!err) {
          missingFilesCompleted[missingFileHash] = true;
        } else {
          missingFilesCompleted[missingFileHash] = err;
        }
      });
    }

    var downloadedFilesInterval = setInterval(function(){
      if(missingFilesCompleted.length === missingFilesHashes.length){
        for(var downloadResult in missingFilesCompleted){
          if(missingFilesCompleted[downloadResult] !== true){
            clearInterval(downloadedFilesInterval);
            return cb(missingFilesCompleted[downloadResult]);
          }
        }

        //No errors,
        clearInterval(downloadedFilesInterval);
        return cb(undefined);
      }

    }, 500);

  };

  /*
   * __cmsFileManager (params, cb)
   * 
   *  params:
   *      {
   *         act: actionName (delete|download|fileExists|cmsZipExists|unzipCMS|writeFile|readFile)
   *         params:
   *             action specific params
   *             delete: {"fileHash": fileHash}
   *             download: {"hash" : missingFileHash}}
   *             fileExists: {"fileName": "fh-cms.js"}
   *             cmsZipExists: none
   *             unzipCMS: none
   *             writeFile: {"fileName": "fh-cms.js"}
   *             readFile: {"fileName": "fh-cms.js"}
   *      }
   *
   */
  $fh.__cmsFileManager = function(p, s, f){

    var cmsRootFolder = "FHCMSData"; //Setting the folder for the cms files on device.

    if(!_cmsAvailable){
      return handleError("CMS Not Available", f);
    }

    var acts = {
      "download": function(){

      },
      "delete": function(){

      },
      "clean": function(){

      },
      "fileExists": function(){
        _cmsFileSystem.root.getDirectory(cmsRootFolder, {"create": true}, function(parent){
          parent.getFile(p.fileName, {"create" : false}, function(fileFound){
            s();
          }, function(err){
            //File Not Found
            f();
          });
        }, function(err){
          return handleError(err, f);
        });
      },
      "cmsZipExists": function(){
        //TODO WHERE WILL THE ZIP RESIDE IN THE BINARY?
      },
      "unzipCMS": function(){

      },
      "readFile": function(){

      }
    };

    if(acts[p.act]){
      return acts[p.act]();
    } else {
      return handleError("Invalid CMS File Manager Action Call", f);
    }

  };


})(this);
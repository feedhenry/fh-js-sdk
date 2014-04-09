require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global){
;__browserify_shim_require__=require;(function browserifyShim(module, exports, require, define, browserify_shim__define__module__export__) {
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

; browserify_shim__define__module__export__(typeof CryptoJS != "undefined" ? CryptoJS : window.CryptoJS);

}).call(global, undefined, undefined, undefined, undefined, function defineExport(ex) { module.exports = ex; });

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],2:[function(require,module,exports){
(function (global){
;__browserify_shim_require__=require;(function browserifyShim(module, exports, require, define, browserify_shim__define__module__export__) {
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
Lawnchair.adapter('html5-filesystem', (function(global){

  var FileError = global.FileError;

  var fail = function( e ) {
    var msg;
    var show = true;
    switch (e.code) {
      case FileError.QUOTA_EXCEEDED_ERR:
        msg = 'QUOTA_EXCEEDED_ERR';
        break;
      case FileError.NOT_FOUND_ERR:
        msg = 'NOT_FOUND_ERR';
        show = false;
        break;
      case FileError.SECURITY_ERR:
        msg = 'SECURITY_ERR';
        break;
      case FileError.INVALID_MODIFICATION_ERR:
        msg = 'INVALID_MODIFICATION_ERR';
        break;
      case FileError.INVALID_STATE_ERR:
        msg = 'INVALID_STATE_ERR';
        break;
      default:
        msg = 'Unknown Error';
        break;
    };
    if ( console && show ) console.error( e, msg );
  };

  var ls = function( reader, callback, entries ) {
    var result = entries || [];
    reader.readEntries(function( results ) {
      if ( !results.length ) {
        if ( callback ) callback( result.map(function(entry) { return entry.name; }) );
      } else {
        ls( reader, callback, result.concat( Array.prototype.slice.call( results ) ) );
      }
    }, fail );
  };

  var filesystems = {};

  var root = function( store, callback ) {
    var directory = filesystems[store.name];
    if ( directory ) {
      callback( directory );
    } else {
      setTimeout(function() {
        root( store, callback );
      }, 10 );
    }
  };

  var isPhoneGap = function() {
    //http://stackoverflow.com/questions/10347539/detect-between-a-mobile-browser-or-a-phonegap-application
    //may break.
    var app = document.URL.indexOf('http://') === -1 && document.URL.indexOf('https://') === -1;
    if (app) {
      return true;
    } else {
      return false;
    }
  }

  var createBlobOrString = function(contentstr) {
    var retVal;
    if (isPhoneGap()) {  // phonegap filewriter works with strings, later versions also work with binary arrays, and if passed a blob will just convert to binary array anyway
      retVal = contentstr;
    } else {
      var targetContentType = 'application/json';
      try {
        retVal = new Blob( [contentstr], { type: targetContentType });  // Blob doesn't exist on all androids
      }
      catch (e){
        // TypeError old chrome and FF
        var blobBuilder = window.BlobBuilder ||
          window.WebKitBlobBuilder ||
          window.MozBlobBuilder ||
          window.MSBlobBuilder;
        if (e.name == 'TypeError' && blobBuilder) {
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

  return {
    // boolean; true if the adapter is valid for the current environment
    valid: function() {
      var fs = global.requestFileSystem || global.webkitRequestFileSystem || global.moz_requestFileSystem;
      return !!fs;
    },

    // constructor call and callback. 'name' is the most common option
    init: function( options, callback ) {
      var me = this;
      var error = function(e) { fail(e); if ( callback ) me.fn( me.name, callback ).call( me, me ); };
      var size = options.size || 100*1024*1024;
      var name = this.name;

      function requestFileSystem(amount) {
//        console.log('in requestFileSystem');
        var fs = global.requestFileSystem || global.webkitRequestFileSystem || global.moz_requestFileSystem;
        var mode = window.PERSISTENT;
        if(typeof LocalFileSystem !== "undefined" && typeof LocalFileSystem.PERSISTENT !== "undefined"){
          mode = LocalFileSystem.PERSISTENT;
        }      
        fs(mode, amount, function(fs) {
//          console.log('got FS ', fs);
          fs.root.getDirectory( name, {create:true}, function( directory ) {
//            console.log('got DIR ', directory);
            filesystems[name] = directory;
            if ( callback ) me.fn( me.name, callback ).call( me, me );
          }, function( e ) {
//            console.log('error getting dir :: ', e);
            error(e);
          });
        }, function( e ) {
//          console.log('error getting FS :: ', e);
          error(e);
        });
      };

      // When in the browser we need to use the html5 file system rather than
      // the one cordova supplies, but it needs to request a quota first.
      if (typeof navigator.webkitPersistentStorage !== 'undefined') {
        navigator.webkitPersistentStorage.requestQuota(size, requestFileSystem, function() {
          logger.warn('User declined file storage');
          error('User declined file storage');
        });
      } else {
        // Amount is 0 because we pretty much have free reign over the
        // amount of storage we use on an android device.
        requestFileSystem(0);
      }
    },

    // returns all the keys in the store
    keys: function( callback ) {
      var me = this;
      root( this, function( store ) {
        ls( store.createReader(), function( entries ) {
          if ( callback ) me.fn( 'keys', callback ).call( me, entries );
        });
      });
      return this;
    },

    // save an object
    save: function( obj, callback ) {
      var me = this;
      var key = obj.key || this.uuid();
      obj.key = key;
      var error = function(e) { fail(e); if ( callback ) me.lambda( callback ).call( me ); };
      root( this, function( store ) {
        store.getFile( key, {create:true}, function( file ) {
          file.createWriter(function( writer ) {
            writer.onerror = error;
            writer.onwriteend = function() {
              // Clear the onWriteEnd handler so the truncate does not call it and cause an infinite loop
              this.onwriteend = null;
              // Truncate the file at the end of the written contents. This ensures that if we are updating 
              // a file which was previously longer, we will not be left with old contents beyond the end of 
              // the current buffer.
              this.truncate(this.position);
              if ( callback ) me.lambda( callback ).call( me, obj );
            };
            var contentStr = JSON.stringify(obj);

            var writerContent = createBlobOrString(contentStr);
            writer.write(writerContent);
          }, error );
        }, error );
      });
      return this;
    },

    // batch save array of objs
    batch: function( objs, callback ) {
      var me = this;
      var saved = [];
      for ( var i = 0, il = objs.length; i < il; i++ ) {
        me.save( objs[i], function( obj ) {
          saved.push( obj );
          if ( saved.length === il && callback ) {
            me.lambda( callback ).call( me, saved );
          }
        });
      }
      return this;
    },

    // retrieve obj (or array of objs) and apply callback to each
    get: function( key /* or array */, callback ) {
      var me = this;
      if ( this.isArray( key ) ) {
        var values = [];
        for ( var i = 0, il = key.length; i < il; i++ ) {
          me.get( key[i], function( result ) {
            if ( result ) values.push( result );
            if ( values.length === il && callback ) {
              me.lambda( callback ).call( me, values );
            }
          });
        }
      } else {
        var error = function(e) {
          fail( e );
          if ( callback ) {
            me.lambda( callback ).call( me );
          }
        };
        root( this, function( store ) {
          store.getFile( key, {create:false}, function( entry ) {
            entry.file(function( file ) {
              var reader = new FileReader();

              reader.onerror = error;

              reader.onload = function(e) {
                var res = {};
                try {
                  res = JSON.parse( e.target.result);
                  res.key = key;
                } catch (e) {
                  res = {key:key};
                }
                if ( callback ) me.lambda( callback ).call( me, res );
              };

              reader.readAsText( file );
            }, error );
          }, error );
        });
      }
      return this;
    },

    // check if an obj exists in the collection
    exists: function( key, callback ) {
      var me = this;
      root( this, function( store ) {
        store.getFile( key, {create:false}, function() {
          if ( callback ) me.lambda( callback ).call( me, true );
        }, function() {
          if ( callback ) me.lambda( callback ).call( me, false );
        });
      });
      return this;
    },

    // returns all the objs to the callback as an array
    all: function( callback ) {
      var me = this;
      if ( callback ) {
        this.keys(function( keys ) {
          if ( !keys.length ) {
            me.fn( me.name, callback ).call( me, [] );
          } else {
            me.get( keys, function( values ) {
              me.fn( me.name, callback ).call( me, values );
            });
          }
        });
      }
      return this;
    },

    // remove a doc or collection of em
    remove: function( key /* or object */, callback ) {
      var me = this;
      var error = function(e) { fail( e ); if ( callback ) me.lambda( callback ).call( me ); };
      root( this, function( store ) {
        store.getFile( (typeof key === 'string' ? key : key.key ), {create:false}, function( file ) {
          file.remove(function() {
            if ( callback ) me.lambda( callback ).call( me );
          }, error );
        }, error );
      });
      return this;
    },

    // destroy everything
    nuke: function( callback ) {
      var me = this;
      var count = 0;
      this.keys(function( keys ) {
        if ( !keys.length ) {
          if ( callback ) me.lambda( callback ).call( me );
        } else {
          for ( var i = 0, il = keys.length; i < il; i++ ) {
            me.remove( keys[i], function() {
              count++;
              if ( count === il && callback ) {
                me.lambda( callback ).call( me );
              }
            });
          }
        }
      });
      return this;
    }
  };
}(this)));
Lawnchair.adapter('memory', (function(){

    var data = {}

    return {
        valid: function() { return true },

        init: function (options, callback) {
            data[this.name] = data[this.name] || {index:[],store:{}}
            this.index = data[this.name].index
            this.store = data[this.name].store
            var cb = this.fn(this.name, callback)
            if (cb) cb.call(this, this)
            return this
        },

        keys: function (callback) {
            this.fn('keys', callback).call(this, this.index)
            return this
        },

        save: function(obj, cb) {
            var key = obj.key || this.uuid()
            
            this.exists(key, function(exists) {
                if (!exists) {
                    if (obj.key) delete obj.key
                    this.index.push(key)
                }

                this.store[key] = obj
                
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
            if (cb) this.lambda(cb).call(this)
            return this
        },

        nuke: function (cb) {
            this.store = data[this.name].store = {}
            this.index = data[this.name].index = []
            if (cb) this.lambda(cb).call(this)
            return this
        }
    }
/////
})());
; browserify_shim__define__module__export__(typeof Lawnchair != "undefined" ? Lawnchair : window.Lawnchair);

}).call(global, undefined, undefined, undefined, undefined, function defineExport(ex) { module.exports = ex; });

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],3:[function(require,module,exports){
(function (global){
;__browserify_shim_require__=require;(function browserifyShim(module, exports, require, define, browserify_shim__define__module__export__) {
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

}).call(global, undefined, undefined, undefined, undefined, function defineExport(ex) { module.exports = ex; });

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],4:[function(require,module,exports){
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

module.exports = {
  SecureRandom: SecureRandom,
  byte2Hex: byte2Hex,
  RSAKey: RSAKey
}
},{}],5:[function(require,module,exports){
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
var util = require('util/');

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

},{"util/":7}],6:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],7:[function(require,module,exports){
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

exports.isBuffer = require('./support/isBuffer');

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
exports.inherits = require('inherits');

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

}).call(this,require("/Users/weili/work/fh-sdks/fh-js-sdk/node_modules/grunt-browserify/node_modules/browserify/node_modules/insert-module-globals/node_modules/process/browser.js"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./support/isBuffer":6,"/Users/weili/work/fh-sdks/fh-js-sdk/node_modules/grunt-browserify/node_modules/browserify/node_modules/insert-module-globals/node_modules/process/browser.js":11,"inherits":10}],8:[function(require,module,exports){
(function (global){
/*global window, global*/
var util = require("util")
var assert = require("assert")

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
},{"assert":5,"util":13}],9:[function(require,module,exports){
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

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      } else {
        throw TypeError('Uncaught, unspecified "error" event.');
      }
      return false;
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        len = arguments.length;
        args = new Array(len - 1);
        for (i = 1; i < len; i++)
          args[i - 1] = arguments[i];
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    len = arguments.length;
    args = new Array(len - 1);
    for (i = 1; i < len; i++)
      args[i - 1] = arguments[i];

    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    var m;
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      console.trace();
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.listenerCount = function(emitter, type) {
  var ret;
  if (!emitter._events || !emitter._events[type])
    ret = 0;
  else if (isFunction(emitter._events[type]))
    ret = 1;
  else
    ret = emitter._events[type].length;
  return ret;
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],10:[function(require,module,exports){
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

},{}],11:[function(require,module,exports){
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

},{}],12:[function(require,module,exports){
module.exports=require(6)
},{}],13:[function(require,module,exports){
module.exports=require(7)
},{"./support/isBuffer":12,"/Users/weili/work/fh-sdks/fh-js-sdk/node_modules/grunt-browserify/node_modules/browserify/node_modules/insert-module-globals/node_modules/process/browser.js":11,"inherits":10}],14:[function(require,module,exports){
/*
 * loglevel - https://github.com/pimterry/loglevel
 *
 * Copyright (c) 2013 Tim Perry
 * Licensed under the MIT license.
 */

;(function (undefined) {
    var undefinedType = "undefined";

    (function (name, definition) {
        if (typeof module !== 'undefined') {
            module.exports = definition();
        } else if (typeof define === 'function' && typeof define.amd === 'object') {
            define(definition);
        } else {
            this[name] = definition();
        }
    }('log', function () {
        var self = {};
        var noop = function() {};

        function realMethod(methodName) {
            if (typeof console === undefinedType) {
                return noop;
            } else if (console[methodName] === undefined) {
                if (console.log !== undefined) {
                    return boundToConsole(console, 'log');
                } else {
                    return noop;
                }
            } else {
                return boundToConsole(console, methodName);
            }
        }

        function boundToConsole(console, methodName) {
            var method = console[methodName];
            if (method.bind === undefined) {
                if (Function.prototype.bind === undefined) {
                    return functionBindingWrapper(method, console);
                } else {
                    try {
                        return Function.prototype.bind.call(console[methodName], console);
                    } catch (e) {
                        // In IE8 + Modernizr, the bind shim will reject the above, so we fall back to wrapping
                        return functionBindingWrapper(method, console);
                    }
                }
            } else {
                return console[methodName].bind(console);
            }
        }

        function functionBindingWrapper(f, context) {
            return function() {
                Function.prototype.apply.apply(f, [context, arguments]);
            };
        }

        var logMethods = [
            "trace",
            "debug",
            "info",
            "warn",
            "error"
        ];

        function replaceLoggingMethods(methodFactory) {
            for (var ii = 0; ii < logMethods.length; ii++) {
                self[logMethods[ii]] = methodFactory(logMethods[ii]);
            }
        }

        function cookiesAvailable() {
            return (typeof window !== undefinedType &&
                    window.document !== undefined &&
                    window.document.cookie !== undefined);
        }

        function localStorageAvailable() {
            try {
                return (typeof window !== undefinedType &&
                        window.localStorage !== undefined);
            } catch (e) {
                return false;
            }
        }

        function persistLevelIfPossible(levelNum) {
            var localStorageFail = false,
                levelName;

            for (var key in self.levels) {
                if (self.levels.hasOwnProperty(key) && self.levels[key] === levelNum) {
                    levelName = key;
                    break;
                }
            }

            if (localStorageAvailable()) {
                /*
                 * Setting localStorage can create a DOM 22 Exception if running in Private mode
                 * in Safari, so even if it is available we need to catch any errors when trying
                 * to write to it
                 */
                try {
                    window.localStorage['loglevel'] = levelName;
                } catch (e) {
                    localStorageFail = true;
                }
            } else {
                localStorageFail = true;
            }

            if (localStorageFail && cookiesAvailable()) {
                window.document.cookie = "loglevel=" + levelName + ";";
            }
        }

        var cookieRegex = /loglevel=([^;]+)/;

        function loadPersistedLevel() {
            var storedLevel;

            if (localStorageAvailable()) {
                storedLevel = window.localStorage['loglevel'];
            }

            if (storedLevel === undefined && cookiesAvailable()) {
                var cookieMatch = cookieRegex.exec(window.document.cookie) || [];
                storedLevel = cookieMatch[1];
            }
            
            if (self.levels[storedLevel] === undefined) {
                storedLevel = "WARN";
            }

            self.setLevel(self.levels[storedLevel]);
        }

        /*
         *
         * Public API
         *
         */

        self.levels = { "TRACE": 0, "DEBUG": 1, "INFO": 2, "WARN": 3,
            "ERROR": 4, "SILENT": 5};

        self.setLevel = function (level) {
            if (typeof level === "number" && level >= 0 && level <= self.levels.SILENT) {
                persistLevelIfPossible(level);

                if (level === self.levels.SILENT) {
                    replaceLoggingMethods(function () {
                        return noop;
                    });
                    return;
                } else if (typeof console === undefinedType) {
                    replaceLoggingMethods(function (methodName) {
                        return function () {
                            if (typeof console !== undefinedType) {
                                self.setLevel(level);
                                self[methodName].apply(self, arguments);
                            }
                        };
                    });
                    return "No console available for logging";
                } else {
                    replaceLoggingMethods(function (methodName) {
                        if (level <= self.levels[methodName.toUpperCase()]) {
                            return realMethod(methodName);
                        } else {
                            return noop;
                        }
                    });
                }
            } else if (typeof level === "string" && self.levels[level.toUpperCase()] !== undefined) {
                self.setLevel(self.levels[level.toUpperCase()]);
            } else {
                throw "log.setLevel() called with invalid level: " + level;
            }
        };

        self.enableAll = function() {
            self.setLevel(self.levels.TRACE);
        };

        self.disableAll = function() {
            self.setLevel(self.levels.SILENT);
        };

        loadPersistedLevel();
        return self;
    }));
})();

},{}],15:[function(require,module,exports){
var toString = Object.prototype.toString

module.exports = function(val){
  switch (toString.call(val)) {
    case '[object Function]': return 'function'
    case '[object Date]': return 'date'
    case '[object RegExp]': return 'regexp'
    case '[object Arguments]': return 'arguments'
    case '[object Array]': return 'array'
    case '[object String]': return 'string'
  }

  if (typeof val == 'object' && val && typeof val.length == 'number') {
    try {
      if (typeof val.callee == 'function') return 'arguments';
    } catch (ex) {
      if (ex instanceof TypeError) {
        return 'arguments';
      }
    }
  }

  if (val === null) return 'null'
  if (val === undefined) return 'undefined'
  if (val && val.nodeType === 1) return 'element'
  if (val === Object(val)) return 'object'

  return typeof val
}

},{}],"/Users/weili/work/fh-sdks/fh-js-sdk/src-cov/feedhenry.js":[function(require,module,exports){
module.exports=require('f312fA');
},{}],"f312fA":[function(require,module,exports){
/* automatically generated by JSCoverage - do not edit */
if (typeof _$jscoverage === 'undefined') _$jscoverage = {};
if (! _$jscoverage['feedhenry.js']) {
  _$jscoverage['feedhenry.js'] = [];
  _$jscoverage['feedhenry.js'][1] = 0;
  _$jscoverage['feedhenry.js'][2] = 0;
  _$jscoverage['feedhenry.js'][3] = 0;
  _$jscoverage['feedhenry.js'][4] = 0;
  _$jscoverage['feedhenry.js'][5] = 0;
  _$jscoverage['feedhenry.js'][6] = 0;
  _$jscoverage['feedhenry.js'][7] = 0;
  _$jscoverage['feedhenry.js'][8] = 0;
  _$jscoverage['feedhenry.js'][9] = 0;
  _$jscoverage['feedhenry.js'][10] = 0;
  _$jscoverage['feedhenry.js'][11] = 0;
  _$jscoverage['feedhenry.js'][12] = 0;
  _$jscoverage['feedhenry.js'][13] = 0;
  _$jscoverage['feedhenry.js'][14] = 0;
  _$jscoverage['feedhenry.js'][15] = 0;
  _$jscoverage['feedhenry.js'][17] = 0;
  _$jscoverage['feedhenry.js'][18] = 0;
  _$jscoverage['feedhenry.js'][21] = 0;
  _$jscoverage['feedhenry.js'][22] = 0;
  _$jscoverage['feedhenry.js'][23] = 0;
  _$jscoverage['feedhenry.js'][25] = 0;
  _$jscoverage['feedhenry.js'][26] = 0;
  _$jscoverage['feedhenry.js'][27] = 0;
  _$jscoverage['feedhenry.js'][28] = 0;
  _$jscoverage['feedhenry.js'][33] = 0;
  _$jscoverage['feedhenry.js'][34] = 0;
  _$jscoverage['feedhenry.js'][35] = 0;
  _$jscoverage['feedhenry.js'][36] = 0;
  _$jscoverage['feedhenry.js'][37] = 0;
  _$jscoverage['feedhenry.js'][39] = 0;
  _$jscoverage['feedhenry.js'][44] = 0;
  _$jscoverage['feedhenry.js'][45] = 0;
  _$jscoverage['feedhenry.js'][46] = 0;
  _$jscoverage['feedhenry.js'][47] = 0;
  _$jscoverage['feedhenry.js'][48] = 0;
  _$jscoverage['feedhenry.js'][49] = 0;
  _$jscoverage['feedhenry.js'][52] = 0;
  _$jscoverage['feedhenry.js'][53] = 0;
  _$jscoverage['feedhenry.js'][59] = 0;
  _$jscoverage['feedhenry.js'][60] = 0;
  _$jscoverage['feedhenry.js'][61] = 0;
  _$jscoverage['feedhenry.js'][62] = 0;
  _$jscoverage['feedhenry.js'][63] = 0;
  _$jscoverage['feedhenry.js'][64] = 0;
  _$jscoverage['feedhenry.js'][65] = 0;
  _$jscoverage['feedhenry.js'][66] = 0;
  _$jscoverage['feedhenry.js'][67] = 0;
  _$jscoverage['feedhenry.js'][68] = 0;
  _$jscoverage['feedhenry.js'][69] = 0;
  _$jscoverage['feedhenry.js'][71] = 0;
  _$jscoverage['feedhenry.js'][72] = 0;
  _$jscoverage['feedhenry.js'][75] = 0;
  _$jscoverage['feedhenry.js'][76] = 0;
  _$jscoverage['feedhenry.js'][80] = 0;
  _$jscoverage['feedhenry.js'][81] = 0;
  _$jscoverage['feedhenry.js'][82] = 0;
  _$jscoverage['feedhenry.js'][83] = 0;
  _$jscoverage['feedhenry.js'][84] = 0;
  _$jscoverage['feedhenry.js'][85] = 0;
  _$jscoverage['feedhenry.js'][89] = 0;
  _$jscoverage['feedhenry.js'][90] = 0;
  _$jscoverage['feedhenry.js'][91] = 0;
  _$jscoverage['feedhenry.js'][92] = 0;
  _$jscoverage['feedhenry.js'][94] = 0;
  _$jscoverage['feedhenry.js'][95] = 0;
  _$jscoverage['feedhenry.js'][100] = 0;
  _$jscoverage['feedhenry.js'][103] = 0;
  _$jscoverage['feedhenry.js'][104] = 0;
}
_$jscoverage['feedhenry.js'][1]++;
var constants = require("./modules/constants");
_$jscoverage['feedhenry.js'][2]++;
var logger = require("./modules/logger");
_$jscoverage['feedhenry.js'][3]++;
var ajax = require("./modules/ajax");
_$jscoverage['feedhenry.js'][4]++;
var events = require("./modules/events");
_$jscoverage['feedhenry.js'][5]++;
var cloud = require("./modules/waitForCloud");
_$jscoverage['feedhenry.js'][6]++;
var api_act = require("./modules/api_act");
_$jscoverage['feedhenry.js'][7]++;
var api_auth = require("./modules/api_auth");
_$jscoverage['feedhenry.js'][8]++;
var api_sec = require("./modules/api_sec");
_$jscoverage['feedhenry.js'][9]++;
var api_hash = require("./modules/api_hash");
_$jscoverage['feedhenry.js'][10]++;
var api_sync = require("./modules/sync-cli");
_$jscoverage['feedhenry.js'][11]++;
var api_mbaas = require("./modules/api_mbaas");
_$jscoverage['feedhenry.js'][12]++;
var api_cloud = require("./modules/api_cloud");
_$jscoverage['feedhenry.js'][13]++;
var fhparams = require("./modules/fhparams");
_$jscoverage['feedhenry.js'][14]++;
var appProps = require("./modules/appProps");
_$jscoverage['feedhenry.js'][15]++;
var device = require("./modules/device");
_$jscoverage['feedhenry.js'][17]++;
var defaultFail = (function (msg, error) {
  _$jscoverage['feedhenry.js'][18]++;
  logger.error(msg + ":" + JSON.stringify(error));
});
_$jscoverage['feedhenry.js'][21]++;
var addListener = (function (type, listener) {
  _$jscoverage['feedhenry.js'][22]++;
  events.addListener(type, listener);
  _$jscoverage['feedhenry.js'][23]++;
  if (type === constants.INIT_EVENT) {
    _$jscoverage['feedhenry.js'][25]++;
    if (cloud.isReady()) {
      _$jscoverage['feedhenry.js'][26]++;
      listener(null, {host: cloud.getCloudHostUrl()});
    }
    else {
      _$jscoverage['feedhenry.js'][27]++;
      if (cloud.getInitError()) {
        _$jscoverage['feedhenry.js'][28]++;
        listener(cloud.getInitError());
      }
    }
  }
});
_$jscoverage['feedhenry.js'][33]++;
var once = (function (type, listener) {
  _$jscoverage['feedhenry.js'][34]++;
  if (type === constants.INIT_EVENT && cloud.isReady()) {
    _$jscoverage['feedhenry.js'][35]++;
    listener(null, {host: cloud.getCloudHostUrl()});
  }
  else {
    _$jscoverage['feedhenry.js'][36]++;
    if (type === constants.INIT_EVENT && cloud.getInitError()) {
      _$jscoverage['feedhenry.js'][37]++;
      listener(cloud.getInitError());
    }
    else {
      _$jscoverage['feedhenry.js'][39]++;
      events.once(type, listener);
    }
  }
});
_$jscoverage['feedhenry.js'][44]++;
var init = (function (opts, success, fail) {
  _$jscoverage['feedhenry.js'][45]++;
  logger.warn("$fh.init will be deprecated soon");
  _$jscoverage['feedhenry.js'][46]++;
  cloud.ready((function (err, host) {
  _$jscoverage['feedhenry.js'][47]++;
  if (err) {
    _$jscoverage['feedhenry.js'][48]++;
    if (typeof fail === "function") {
      _$jscoverage['feedhenry.js'][49]++;
      return fail(err);
    }
  }
  else {
    _$jscoverage['feedhenry.js'][52]++;
    if (typeof success === "function") {
      _$jscoverage['feedhenry.js'][53]++;
      success(host.host);
    }
  }
}));
});
_$jscoverage['feedhenry.js'][59]++;
var fh = window.$fh || {};
_$jscoverage['feedhenry.js'][60]++;
fh.init = init;
_$jscoverage['feedhenry.js'][61]++;
fh.act = api_act;
_$jscoverage['feedhenry.js'][62]++;
fh.auth = api_auth;
_$jscoverage['feedhenry.js'][63]++;
fh.cloud = api_cloud;
_$jscoverage['feedhenry.js'][64]++;
fh.sec = api_sec;
_$jscoverage['feedhenry.js'][65]++;
fh.hash = api_hash;
_$jscoverage['feedhenry.js'][66]++;
fh.sync = api_sync;
_$jscoverage['feedhenry.js'][67]++;
fh.ajax = fh.__ajax = ajax;
_$jscoverage['feedhenry.js'][68]++;
fh.mbaas = api_mbaas;
_$jscoverage['feedhenry.js'][69]++;
fh._getDeviceId = device.getDeviceId;
_$jscoverage['feedhenry.js'][71]++;
fh.getCloudURL = (function () {
  _$jscoverage['feedhenry.js'][72]++;
  return cloud.getCloudHostUrl();
});
_$jscoverage['feedhenry.js'][75]++;
fh.getFHParams = (function () {
  _$jscoverage['feedhenry.js'][76]++;
  return fhparams.buildFHParams();
});
_$jscoverage['feedhenry.js'][80]++;
fh.addListener = addListener;
_$jscoverage['feedhenry.js'][81]++;
fh.on = addListener;
_$jscoverage['feedhenry.js'][82]++;
fh.once = once;
_$jscoverage['feedhenry.js'][83]++;
var methods = ["removeListener", "removeAllListeners", "setMaxListeners", "listeners", "emit"];
_$jscoverage['feedhenry.js'][84]++;
for (var i = 0; i < methods.length; i++) {
  _$jscoverage['feedhenry.js'][85]++;
  fh[methods[i]] = events[methods[i]];
}
_$jscoverage['feedhenry.js'][89]++;
fh.on(constants.INIT_EVENT, (function (err, host) {
  _$jscoverage['feedhenry.js'][90]++;
  if (err) {
    _$jscoverage['feedhenry.js'][91]++;
    fh.cloud_props = {};
    _$jscoverage['feedhenry.js'][92]++;
    fh.app_props = {};
  }
  else {
    _$jscoverage['feedhenry.js'][94]++;
    fh.cloud_props = {hosts: {url: host.host}};
    _$jscoverage['feedhenry.js'][95]++;
    fh.app_props = appProps.getAppProps();
  }
}));
_$jscoverage['feedhenry.js'][100]++;
fh.reset = cloud.reset;
_$jscoverage['feedhenry.js'][103]++;
window.$fh = fh;
_$jscoverage['feedhenry.js'][104]++;
module.exports = fh;
_$jscoverage['feedhenry.js'].source = ["var constants = require(\"./modules/constants\");","var logger = require(\"./modules/logger\");","var ajax = require(\"./modules/ajax\");","var events = require(\"./modules/events\");","var cloud = require(\"./modules/waitForCloud\");","var api_act = require(\"./modules/api_act\");","var api_auth = require(\"./modules/api_auth\");","var api_sec = require(\"./modules/api_sec\");","var api_hash = require(\"./modules/api_hash\");","var api_sync = require(\"./modules/sync-cli\");","var api_mbaas = require(\"./modules/api_mbaas\");","var api_cloud = require(\"./modules/api_cloud\");","var fhparams = require(\"./modules/fhparams\");","var appProps = require(\"./modules/appProps\");","var device = require(\"./modules/device\");","","var defaultFail = function(msg, error){","  logger.error(msg + \":\" + JSON.stringify(error));","};","","var addListener = function(type, listener){","  events.addListener(type, listener);","  if(type === constants.INIT_EVENT){","    //for fhinit event, need to check the status of cloud and may need to fire the listener immediately.","    if(cloud.isReady()){","      listener(null, {host: cloud.getCloudHostUrl()});","    } else if(cloud.getInitError()){","      listener(cloud.getInitError());","    }","  } ","};","","var once = function(type, listener){","  if(type === constants.INIT_EVENT &amp;&amp; cloud.isReady()){","    listener(null, {host: cloud.getCloudHostUrl()});","  } else if(type === constants.INIT_EVENT &amp;&amp; cloud.getInitError()){","    listener(cloud.getInitError());","  } else {","    events.once(type, listener);","  }","};","","//Legacy shim. Init hapens based on fhconfig.json or, for v2, global var called fh_app_props which is injected as part of the index.html wrapper","var init = function(opts, success, fail){","  logger.warn(\"$fh.init will be deprecated soon\");","  cloud.ready(function(err, host){","    if(err){","      if(typeof fail === \"function\"){","        return fail(err);","      }","    } else {","      if(typeof success === \"function\"){","        success(host.host);","      }","    }","  });","};","","var fh = window.$fh || {};","fh.init = init;","fh.act = api_act;","fh.auth = api_auth;","fh.cloud = api_cloud;","fh.sec = api_sec;","fh.hash = api_hash;","fh.sync = api_sync;","fh.ajax = fh.__ajax = ajax;","fh.mbaas = api_mbaas;","fh._getDeviceId = device.getDeviceId;","","fh.getCloudURL = function(){","  return cloud.getCloudHostUrl();","};","","fh.getFHParams = function(){","  return fhparams.buildFHParams();","};","","//events","fh.addListener = addListener;","fh.on = addListener;","fh.once = once;","var methods = [\"removeListener\", \"removeAllListeners\", \"setMaxListeners\", \"listeners\", \"emit\"];","for(var i=0;i&lt;methods.length;i++){","  fh[methods[i]] = events[methods[i]];","}","","//keep backward compatibility","fh.on(constants.INIT_EVENT, function(err, host){","  if(err){","    fh.cloud_props = {};","    fh.app_props = {};","  } else {","    fh.cloud_props = {hosts: {url: host.host}};","    fh.app_props = appProps.getAppProps();","  }","});","","//for test","fh.reset = cloud.reset;","//we should really stop polluting global name space. Ideally we should ask browserify to use \"$fh\" when umd-fy the module. However, \"$\" is not allowed as the standard module name.","//So, we assign $fh to the window name space directly here. (otherwise, we have to fork the grunt browserify plugin, then fork browerify and the dependent umd module, really not worthing the effort).","window.$fh = fh;","module.exports = fh;","","","","",""];

},{"./modules/ajax":19,"./modules/api_act":20,"./modules/api_auth":21,"./modules/api_cloud":22,"./modules/api_hash":23,"./modules/api_mbaas":24,"./modules/api_sec":25,"./modules/appProps":26,"./modules/constants":28,"./modules/device":30,"./modules/events":31,"./modules/fhparams":32,"./modules/logger":38,"./modules/sync-cli":46,"./modules/waitForCloud":48}],18:[function(require,module,exports){
/* automatically generated by JSCoverage - do not edit */
if (typeof _$jscoverage === 'undefined') _$jscoverage = {};
if (! _$jscoverage['modules/XDomainRequestWrapper.js']) {
  _$jscoverage['modules/XDomainRequestWrapper.js'] = [];
  _$jscoverage['modules/XDomainRequestWrapper.js'][1] = 0;
  _$jscoverage['modules/XDomainRequestWrapper.js'][2] = 0;
  _$jscoverage['modules/XDomainRequestWrapper.js'][3] = 0;
  _$jscoverage['modules/XDomainRequestWrapper.js'][4] = 0;
  _$jscoverage['modules/XDomainRequestWrapper.js'][5] = 0;
  _$jscoverage['modules/XDomainRequestWrapper.js'][6] = 0;
  _$jscoverage['modules/XDomainRequestWrapper.js'][7] = 0;
  _$jscoverage['modules/XDomainRequestWrapper.js'][8] = 0;
  _$jscoverage['modules/XDomainRequestWrapper.js'][9] = 0;
  _$jscoverage['modules/XDomainRequestWrapper.js'][10] = 0;
  _$jscoverage['modules/XDomainRequestWrapper.js'][11] = 0;
  _$jscoverage['modules/XDomainRequestWrapper.js'][12] = 0;
  _$jscoverage['modules/XDomainRequestWrapper.js'][13] = 0;
  _$jscoverage['modules/XDomainRequestWrapper.js'][14] = 0;
  _$jscoverage['modules/XDomainRequestWrapper.js'][15] = 0;
  _$jscoverage['modules/XDomainRequestWrapper.js'][16] = 0;
  _$jscoverage['modules/XDomainRequestWrapper.js'][19] = 0;
  _$jscoverage['modules/XDomainRequestWrapper.js'][20] = 0;
  _$jscoverage['modules/XDomainRequestWrapper.js'][21] = 0;
  _$jscoverage['modules/XDomainRequestWrapper.js'][23] = 0;
  _$jscoverage['modules/XDomainRequestWrapper.js'][24] = 0;
  _$jscoverage['modules/XDomainRequestWrapper.js'][25] = 0;
  _$jscoverage['modules/XDomainRequestWrapper.js'][26] = 0;
  _$jscoverage['modules/XDomainRequestWrapper.js'][27] = 0;
  _$jscoverage['modules/XDomainRequestWrapper.js'][30] = 0;
  _$jscoverage['modules/XDomainRequestWrapper.js'][31] = 0;
  _$jscoverage['modules/XDomainRequestWrapper.js'][32] = 0;
  _$jscoverage['modules/XDomainRequestWrapper.js'][33] = 0;
  _$jscoverage['modules/XDomainRequestWrapper.js'][34] = 0;
  _$jscoverage['modules/XDomainRequestWrapper.js'][35] = 0;
  _$jscoverage['modules/XDomainRequestWrapper.js'][40] = 0;
  _$jscoverage['modules/XDomainRequestWrapper.js'][41] = 0;
  _$jscoverage['modules/XDomainRequestWrapper.js'][44] = 0;
  _$jscoverage['modules/XDomainRequestWrapper.js'][45] = 0;
  _$jscoverage['modules/XDomainRequestWrapper.js'][48] = 0;
  _$jscoverage['modules/XDomainRequestWrapper.js'][49] = 0;
  _$jscoverage['modules/XDomainRequestWrapper.js'][52] = 0;
  _$jscoverage['modules/XDomainRequestWrapper.js'][59] = 0;
  _$jscoverage['modules/XDomainRequestWrapper.js'][63] = 0;
}
_$jscoverage['modules/XDomainRequestWrapper.js'][1]++;
var XDomainRequestWrapper = (function (xdr) {
  _$jscoverage['modules/XDomainRequestWrapper.js'][2]++;
  this.xdr = xdr;
  _$jscoverage['modules/XDomainRequestWrapper.js'][3]++;
  this.isWrapper = true;
  _$jscoverage['modules/XDomainRequestWrapper.js'][4]++;
  this.readyState = 0;
  _$jscoverage['modules/XDomainRequestWrapper.js'][5]++;
  this.onreadystatechange = null;
  _$jscoverage['modules/XDomainRequestWrapper.js'][6]++;
  this.status = 0;
  _$jscoverage['modules/XDomainRequestWrapper.js'][7]++;
  this.statusText = "";
  _$jscoverage['modules/XDomainRequestWrapper.js'][8]++;
  this.responseText = "";
  _$jscoverage['modules/XDomainRequestWrapper.js'][9]++;
  var self = this;
  _$jscoverage['modules/XDomainRequestWrapper.js'][10]++;
  this.xdr.onload = (function () {
  _$jscoverage['modules/XDomainRequestWrapper.js'][11]++;
  self.readyState = 4;
  _$jscoverage['modules/XDomainRequestWrapper.js'][12]++;
  self.status = 200;
  _$jscoverage['modules/XDomainRequestWrapper.js'][13]++;
  self.statusText = "";
  _$jscoverage['modules/XDomainRequestWrapper.js'][14]++;
  self.responseText = self.xdr.responseText;
  _$jscoverage['modules/XDomainRequestWrapper.js'][15]++;
  if (self.onreadystatechange) {
    _$jscoverage['modules/XDomainRequestWrapper.js'][16]++;
    self.onreadystatechange();
  }
});
  _$jscoverage['modules/XDomainRequestWrapper.js'][19]++;
  this.xdr.onerror = (function () {
  _$jscoverage['modules/XDomainRequestWrapper.js'][20]++;
  if (self.onerror) {
    _$jscoverage['modules/XDomainRequestWrapper.js'][21]++;
    self.onerror();
  }
  _$jscoverage['modules/XDomainRequestWrapper.js'][23]++;
  self.readyState = 4;
  _$jscoverage['modules/XDomainRequestWrapper.js'][24]++;
  self.status = 0;
  _$jscoverage['modules/XDomainRequestWrapper.js'][25]++;
  self.statusText = "";
  _$jscoverage['modules/XDomainRequestWrapper.js'][26]++;
  if (self.onreadystatechange) {
    _$jscoverage['modules/XDomainRequestWrapper.js'][27]++;
    self.onreadystatechange();
  }
});
  _$jscoverage['modules/XDomainRequestWrapper.js'][30]++;
  this.xdr.ontimeout = (function () {
  _$jscoverage['modules/XDomainRequestWrapper.js'][31]++;
  self.readyState = 4;
  _$jscoverage['modules/XDomainRequestWrapper.js'][32]++;
  self.status = 408;
  _$jscoverage['modules/XDomainRequestWrapper.js'][33]++;
  self.statusText = "timeout";
  _$jscoverage['modules/XDomainRequestWrapper.js'][34]++;
  if (self.onreadystatechange) {
    _$jscoverage['modules/XDomainRequestWrapper.js'][35]++;
    self.onreadystatechange();
  }
});
});
_$jscoverage['modules/XDomainRequestWrapper.js'][40]++;
XDomainRequestWrapper.prototype.open = (function (method, url, asyn) {
  _$jscoverage['modules/XDomainRequestWrapper.js'][41]++;
  this.xdr.open(method, url);
});
_$jscoverage['modules/XDomainRequestWrapper.js'][44]++;
XDomainRequestWrapper.prototype.send = (function (data) {
  _$jscoverage['modules/XDomainRequestWrapper.js'][45]++;
  this.xdr.send(data);
});
_$jscoverage['modules/XDomainRequestWrapper.js'][48]++;
XDomainRequestWrapper.prototype.abort = (function () {
  _$jscoverage['modules/XDomainRequestWrapper.js'][49]++;
  this.xdr.abort();
});
_$jscoverage['modules/XDomainRequestWrapper.js'][52]++;
XDomainRequestWrapper.prototype.setRequestHeader = (function (n, v) {
});
_$jscoverage['modules/XDomainRequestWrapper.js'][59]++;
XDomainRequestWrapper.prototype.getResponseHeader = (function (n) {
});
_$jscoverage['modules/XDomainRequestWrapper.js'][63]++;
module.exports = XDomainRequestWrapper;
_$jscoverage['modules/XDomainRequestWrapper.js'].source = ["var XDomainRequestWrapper = function(xdr){","  this.xdr = xdr;","  this.isWrapper = true;","  this.readyState = 0;","  this.onreadystatechange = null;","  this.status = 0;","  this.statusText = \"\";","  this.responseText = \"\";","  var self = this;","  this.xdr.onload = function(){","      self.readyState = 4;","      self.status = 200;","      self.statusText = \"\";","      self.responseText = self.xdr.responseText;","      if(self.onreadystatechange){","          self.onreadystatechange();","      }","  };","  this.xdr.onerror = function(){","      if(self.onerror){","          self.onerror();","      }","      self.readyState = 4;","      self.status = 0;","      self.statusText = \"\";","      if(self.onreadystatechange){","          self.onreadystatechange();","      }","  };","  this.xdr.ontimeout = function(){","      self.readyState = 4;","      self.status = 408;","      self.statusText = \"timeout\";","      if(self.onreadystatechange){","          self.onreadystatechange();","      }","  };","};","","XDomainRequestWrapper.prototype.open = function(method, url, asyn){","  this.xdr.open(method, url);","};","","XDomainRequestWrapper.prototype.send = function(data){","  this.xdr.send(data);","};","","XDomainRequestWrapper.prototype.abort = function(){","  this.xdr.abort();","};","","XDomainRequestWrapper.prototype.setRequestHeader = function(n, v){","  //not supported by xdr","  //Good doc on limitations of XDomainRequest http://blogs.msdn.com/b/ieinternals/archive/2010/05/13/xdomainrequest-restrictions-limitations-and-workarounds.aspx","  //XDomainRequest doesn't allow setting custom request headers. But it is the only available option to do CORS requests in IE8 &amp; 9. In IE10, they finally start to use standard XMLHttpRequest.","  //To support FH auth tokens in IE8&amp;9, we have to find a different way of doing it.","};","","XDomainRequestWrapper.prototype.getResponseHeader = function(n){","  //not supported by xdr","};","","module.exports = XDomainRequestWrapper;"];

},{}],19:[function(require,module,exports){
/* automatically generated by JSCoverage - do not edit */
if (typeof _$jscoverage === 'undefined') _$jscoverage = {};
if (! _$jscoverage['modules/ajax.js']) {
  _$jscoverage['modules/ajax.js'] = [];
  _$jscoverage['modules/ajax.js'][11] = 0;
  _$jscoverage['modules/ajax.js'][12] = 0;
  _$jscoverage['modules/ajax.js'][13] = 0;
  _$jscoverage['modules/ajax.js'][14] = 0;
  _$jscoverage['modules/ajax.js'][16] = 0;
  _$jscoverage['modules/ajax.js'][17] = 0;
  _$jscoverage['modules/ajax.js'][18] = 0;
  _$jscoverage['modules/ajax.js'][21] = 0;
  _$jscoverage['modules/ajax.js'][22] = 0;
  _$jscoverage['modules/ajax.js'][25] = 0;
  _$jscoverage['modules/ajax.js'][36] = 0;
  _$jscoverage['modules/ajax.js'][37] = 0;
  _$jscoverage['modules/ajax.js'][38] = 0;
  _$jscoverage['modules/ajax.js'][39] = 0;
  _$jscoverage['modules/ajax.js'][41] = 0;
  _$jscoverage['modules/ajax.js'][43] = 0;
  _$jscoverage['modules/ajax.js'][46] = 0;
  _$jscoverage['modules/ajax.js'][48] = 0;
  _$jscoverage['modules/ajax.js'][49] = 0;
  _$jscoverage['modules/ajax.js'][50] = 0;
  _$jscoverage['modules/ajax.js'][52] = 0;
  _$jscoverage['modules/ajax.js'][55] = 0;
  _$jscoverage['modules/ajax.js'][56] = 0;
  _$jscoverage['modules/ajax.js'][58] = 0;
  _$jscoverage['modules/ajax.js'][64] = 0;
  _$jscoverage['modules/ajax.js'][65] = 0;
  _$jscoverage['modules/ajax.js'][66] = 0;
  _$jscoverage['modules/ajax.js'][67] = 0;
  _$jscoverage['modules/ajax.js'][68] = 0;
  _$jscoverage['modules/ajax.js'][70] = 0;
  _$jscoverage['modules/ajax.js'][71] = 0;
  _$jscoverage['modules/ajax.js'][72] = 0;
  _$jscoverage['modules/ajax.js'][74] = 0;
  _$jscoverage['modules/ajax.js'][75] = 0;
  _$jscoverage['modules/ajax.js'][76] = 0;
  _$jscoverage['modules/ajax.js'][77] = 0;
  _$jscoverage['modules/ajax.js'][78] = 0;
  _$jscoverage['modules/ajax.js'][80] = 0;
  _$jscoverage['modules/ajax.js'][81] = 0;
  _$jscoverage['modules/ajax.js'][82] = 0;
  _$jscoverage['modules/ajax.js'][83] = 0;
  _$jscoverage['modules/ajax.js'][84] = 0;
  _$jscoverage['modules/ajax.js'][85] = 0;
  _$jscoverage['modules/ajax.js'][88] = 0;
  _$jscoverage['modules/ajax.js'][89] = 0;
  _$jscoverage['modules/ajax.js'][90] = 0;
  _$jscoverage['modules/ajax.js'][91] = 0;
  _$jscoverage['modules/ajax.js'][93] = 0;
  _$jscoverage['modules/ajax.js'][94] = 0;
  _$jscoverage['modules/ajax.js'][95] = 0;
  _$jscoverage['modules/ajax.js'][96] = 0;
  _$jscoverage['modules/ajax.js'][98] = 0;
  _$jscoverage['modules/ajax.js'][101] = 0;
  _$jscoverage['modules/ajax.js'][102] = 0;
  _$jscoverage['modules/ajax.js'][103] = 0;
  _$jscoverage['modules/ajax.js'][105] = 0;
  _$jscoverage['modules/ajax.js'][107] = 0;
  _$jscoverage['modules/ajax.js'][112] = 0;
  _$jscoverage['modules/ajax.js'][113] = 0;
  _$jscoverage['modules/ajax.js'][114] = 0;
  _$jscoverage['modules/ajax.js'][116] = 0;
  _$jscoverage['modules/ajax.js'][118] = 0;
  _$jscoverage['modules/ajax.js'][119] = 0;
  _$jscoverage['modules/ajax.js'][120] = 0;
  _$jscoverage['modules/ajax.js'][121] = 0;
  _$jscoverage['modules/ajax.js'][124] = 0;
  _$jscoverage['modules/ajax.js'][125] = 0;
  _$jscoverage['modules/ajax.js'][126] = 0;
  _$jscoverage['modules/ajax.js'][127] = 0;
  _$jscoverage['modules/ajax.js'][128] = 0;
  _$jscoverage['modules/ajax.js'][129] = 0;
  _$jscoverage['modules/ajax.js'][133] = 0;
  _$jscoverage['modules/ajax.js'][134] = 0;
  _$jscoverage['modules/ajax.js'][139] = 0;
  _$jscoverage['modules/ajax.js'][140] = 0;
  _$jscoverage['modules/ajax.js'][141] = 0;
  _$jscoverage['modules/ajax.js'][145] = 0;
  _$jscoverage['modules/ajax.js'][146] = 0;
  _$jscoverage['modules/ajax.js'][150] = 0;
  _$jscoverage['modules/ajax.js'][152] = 0;
  _$jscoverage['modules/ajax.js'][153] = 0;
  _$jscoverage['modules/ajax.js'][156] = 0;
  _$jscoverage['modules/ajax.js'][157] = 0;
  _$jscoverage['modules/ajax.js'][161] = 0;
  _$jscoverage['modules/ajax.js'][162] = 0;
  _$jscoverage['modules/ajax.js'][163] = 0;
  _$jscoverage['modules/ajax.js'][164] = 0;
  _$jscoverage['modules/ajax.js'][166] = 0;
  _$jscoverage['modules/ajax.js'][169] = 0;
  _$jscoverage['modules/ajax.js'][170] = 0;
  _$jscoverage['modules/ajax.js'][172] = 0;
  _$jscoverage['modules/ajax.js'][173] = 0;
  _$jscoverage['modules/ajax.js'][174] = 0;
  _$jscoverage['modules/ajax.js'][177] = 0;
  _$jscoverage['modules/ajax.js'][178] = 0;
  _$jscoverage['modules/ajax.js'][179] = 0;
  _$jscoverage['modules/ajax.js'][180] = 0;
  _$jscoverage['modules/ajax.js'][181] = 0;
  _$jscoverage['modules/ajax.js'][184] = 0;
  _$jscoverage['modules/ajax.js'][185] = 0;
  _$jscoverage['modules/ajax.js'][186] = 0;
  _$jscoverage['modules/ajax.js'][187] = 0;
  _$jscoverage['modules/ajax.js'][188] = 0;
  _$jscoverage['modules/ajax.js'][192] = 0;
  _$jscoverage['modules/ajax.js'][194] = 0;
  _$jscoverage['modules/ajax.js'][195] = 0;
  _$jscoverage['modules/ajax.js'][197] = 0;
  _$jscoverage['modules/ajax.js'][202] = 0;
  _$jscoverage['modules/ajax.js'][203] = 0;
  _$jscoverage['modules/ajax.js'][210] = 0;
  _$jscoverage['modules/ajax.js'][211] = 0;
  _$jscoverage['modules/ajax.js'][212] = 0;
  _$jscoverage['modules/ajax.js'][215] = 0;
  _$jscoverage['modules/ajax.js'][216] = 0;
  _$jscoverage['modules/ajax.js'][219] = 0;
  _$jscoverage['modules/ajax.js'][220] = 0;
  _$jscoverage['modules/ajax.js'][223] = 0;
  _$jscoverage['modules/ajax.js'][224] = 0;
  _$jscoverage['modules/ajax.js'][228] = 0;
  _$jscoverage['modules/ajax.js'][230] = 0;
  _$jscoverage['modules/ajax.js'][231] = 0;
  _$jscoverage['modules/ajax.js'][232] = 0;
  _$jscoverage['modules/ajax.js'][235] = 0;
  _$jscoverage['modules/ajax.js'][238] = 0;
  _$jscoverage['modules/ajax.js'][239] = 0;
  _$jscoverage['modules/ajax.js'][240] = 0;
  _$jscoverage['modules/ajax.js'][241] = 0;
  _$jscoverage['modules/ajax.js'][243] = 0;
  _$jscoverage['modules/ajax.js'][246] = 0;
  _$jscoverage['modules/ajax.js'][247] = 0;
  _$jscoverage['modules/ajax.js'][249] = 0;
  _$jscoverage['modules/ajax.js'][250] = 0;
  _$jscoverage['modules/ajax.js'][253] = 0;
  _$jscoverage['modules/ajax.js'][254] = 0;
  _$jscoverage['modules/ajax.js'][256] = 0;
  _$jscoverage['modules/ajax.js'][259] = 0;
  _$jscoverage['modules/ajax.js'][290] = 0;
  _$jscoverage['modules/ajax.js'][291] = 0;
  _$jscoverage['modules/ajax.js'][297] = 0;
  _$jscoverage['modules/ajax.js'][298] = 0;
  _$jscoverage['modules/ajax.js'][302] = 0;
  _$jscoverage['modules/ajax.js'][303] = 0;
  _$jscoverage['modules/ajax.js'][304] = 0;
  _$jscoverage['modules/ajax.js'][306] = 0;
  _$jscoverage['modules/ajax.js'][308] = 0;
  _$jscoverage['modules/ajax.js'][311] = 0;
  _$jscoverage['modules/ajax.js'][312] = 0;
  _$jscoverage['modules/ajax.js'][315] = 0;
  _$jscoverage['modules/ajax.js'][316] = 0;
  _$jscoverage['modules/ajax.js'][322] = 0;
  _$jscoverage['modules/ajax.js'][323] = 0;
  _$jscoverage['modules/ajax.js'][324] = 0;
  _$jscoverage['modules/ajax.js'][333] = 0;
  _$jscoverage['modules/ajax.js'][334] = 0;
  _$jscoverage['modules/ajax.js'][341] = 0;
  _$jscoverage['modules/ajax.js'][343] = 0;
  _$jscoverage['modules/ajax.js'][344] = 0;
  _$jscoverage['modules/ajax.js'][345] = 0;
  _$jscoverage['modules/ajax.js'][346] = 0;
  _$jscoverage['modules/ajax.js'][348] = 0;
  _$jscoverage['modules/ajax.js'][350] = 0;
  _$jscoverage['modules/ajax.js'][352] = 0;
  _$jscoverage['modules/ajax.js'][353] = 0;
  _$jscoverage['modules/ajax.js'][354] = 0;
  _$jscoverage['modules/ajax.js'][358] = 0;
  _$jscoverage['modules/ajax.js'][359] = 0;
  _$jscoverage['modules/ajax.js'][360] = 0;
  _$jscoverage['modules/ajax.js'][361] = 0;
  _$jscoverage['modules/ajax.js'][363] = 0;
  _$jscoverage['modules/ajax.js'][364] = 0;
  _$jscoverage['modules/ajax.js'][367] = 0;
  _$jscoverage['modules/ajax.js'][368] = 0;
  _$jscoverage['modules/ajax.js'][369] = 0;
  _$jscoverage['modules/ajax.js'][370] = 0;
  _$jscoverage['modules/ajax.js'][371] = 0;
  _$jscoverage['modules/ajax.js'][372] = 0;
  _$jscoverage['modules/ajax.js'][374] = 0;
}
_$jscoverage['modules/ajax.js'][11]++;
var eventsHandler = require("./events");
_$jscoverage['modules/ajax.js'][12]++;
var XDomainRequestWrapper = require("./XDomainRequestWrapper");
_$jscoverage['modules/ajax.js'][13]++;
var consts = require("./constants");
_$jscoverage['modules/ajax.js'][14]++;
var logger = require("./logger");
_$jscoverage['modules/ajax.js'][16]++;
var type;
_$jscoverage['modules/ajax.js'][17]++;
try {
  _$jscoverage['modules/ajax.js'][18]++;
  type = require("type-of");
}
catch (ex) {
  _$jscoverage['modules/ajax.js'][21]++;
  var r = require;
  _$jscoverage['modules/ajax.js'][22]++;
  type = r("type");
}
_$jscoverage['modules/ajax.js'][25]++;
var jsonpID = 0, document = window.document, key, name, rscript = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, scriptTypeRE = /^(?:text|application)\/javascript/i, xmlTypeRE = /^(?:text|application)\/xml/i, jsonType = "application/json", htmlType = "text/html", blankRE = /^\s*$/;
_$jscoverage['modules/ajax.js'][36]++;
var ajax = module.exports = (function (options) {
  _$jscoverage['modules/ajax.js'][37]++;
  var settings = extend({}, options || {});
  _$jscoverage['modules/ajax.js'][38]++;
  for (key in ajax.settings) {
    _$jscoverage['modules/ajax.js'][39]++;
    if (settings[key] === undefined) {
      _$jscoverage['modules/ajax.js'][39]++;
      settings[key] = ajax.settings[key];
    }
}
  _$jscoverage['modules/ajax.js'][41]++;
  ajaxStart(settings);
  _$jscoverage['modules/ajax.js'][43]++;
  if (! settings.crossDomain) {
    _$jscoverage['modules/ajax.js'][43]++;
    settings.crossDomain = /^([\w-]+:)?\/\/([^\/]+)/.test(settings.url) && RegExp.$2 != window.location.host;
  }
  _$jscoverage['modules/ajax.js'][46]++;
  var dataType = settings.dataType, hasPlaceholder = /=\?/.test(settings.url);
  _$jscoverage['modules/ajax.js'][48]++;
  if (dataType == "jsonp" || hasPlaceholder) {
    _$jscoverage['modules/ajax.js'][49]++;
    if (! hasPlaceholder) {
      _$jscoverage['modules/ajax.js'][50]++;
      settings.url = appendQuery(settings.url, (settings.jsonp? settings.jsonp: "_callback") + "=?");
    }
    _$jscoverage['modules/ajax.js'][52]++;
    return ajax.JSONP(settings);
  }
  _$jscoverage['modules/ajax.js'][55]++;
  if (! settings.url) {
    _$jscoverage['modules/ajax.js'][55]++;
    settings.url = window.location.toString();
  }
  _$jscoverage['modules/ajax.js'][56]++;
  serializeData(settings);
  _$jscoverage['modules/ajax.js'][58]++;
  var mime = settings.accepts[dataType], baseHeaders = {}, protocol = /^([\w-]+:)\/\//.test(settings.url)? RegExp.$1: window.location.protocol, xhr = settings.xhr(settings.crossDomain), abortTimeout;
  _$jscoverage['modules/ajax.js'][64]++;
  if (! settings.crossDomain) {
    _$jscoverage['modules/ajax.js'][64]++;
    baseHeaders["X-Requested-With"] = "XMLHttpRequest";
  }
  _$jscoverage['modules/ajax.js'][65]++;
  if (mime) {
    _$jscoverage['modules/ajax.js'][66]++;
    baseHeaders.Accept = mime;
    _$jscoverage['modules/ajax.js'][67]++;
    if (mime.indexOf(",") > -1) {
      _$jscoverage['modules/ajax.js'][67]++;
      mime = mime.split(",", 2)[0];
    }
    _$jscoverage['modules/ajax.js'][68]++;
    xhr.overrideMimeType && xhr.overrideMimeType(mime);
  }
  _$jscoverage['modules/ajax.js'][70]++;
  if (settings.contentType || (settings.data && ! settings.formdata && settings.type.toUpperCase() != "GET")) {
    _$jscoverage['modules/ajax.js'][71]++;
    baseHeaders["Content-Type"] = (settings.contentType || "application/x-www-form-urlencoded");
  }
  _$jscoverage['modules/ajax.js'][72]++;
  settings.headers = extend(baseHeaders, settings.headers || {});
  _$jscoverage['modules/ajax.js'][74]++;
  xhr.onreadystatechange = (function () {
  _$jscoverage['modules/ajax.js'][75]++;
  if (xhr.readyState == 4) {
    _$jscoverage['modules/ajax.js'][76]++;
    clearTimeout(abortTimeout);
    _$jscoverage['modules/ajax.js'][77]++;
    var result, error = false;
    _$jscoverage['modules/ajax.js'][78]++;
    if (settings.tryJSONP) {
      _$jscoverage['modules/ajax.js'][80]++;
      if (xhr.status === 0 && settings.crossDomain && ! xhr.isTimeout && protocol != "file:") {
        _$jscoverage['modules/ajax.js'][81]++;
        logger.debug("retry ajax call with jsonp");
        _$jscoverage['modules/ajax.js'][82]++;
        settings.type = "GET";
        _$jscoverage['modules/ajax.js'][83]++;
        settings.dataType = "jsonp";
        _$jscoverage['modules/ajax.js'][84]++;
        settings.data = "_jsonpdata=" + settings.data;
        _$jscoverage['modules/ajax.js'][85]++;
        return ajax(settings);
      }
    }
    _$jscoverage['modules/ajax.js'][88]++;
    if ((xhr.status >= 200 && xhr.status < 300) || xhr.status == 304 || (xhr.status == 0 && protocol == "file:")) {
      _$jscoverage['modules/ajax.js'][89]++;
      dataType = dataType || mimeToDataType(xhr.getResponseHeader("content-type"));
      _$jscoverage['modules/ajax.js'][90]++;
      result = xhr.responseText;
      _$jscoverage['modules/ajax.js'][91]++;
      logger.debug("ajax response :: status = " + xhr.status + " :: body = " + result);
      _$jscoverage['modules/ajax.js'][93]++;
      try {
        _$jscoverage['modules/ajax.js'][94]++;
        if (dataType == "script") {
          _$jscoverage['modules/ajax.js'][94]++;
          (1, eval)(result);
        }
        else {
          _$jscoverage['modules/ajax.js'][95]++;
          if (dataType == "xml") {
            _$jscoverage['modules/ajax.js'][95]++;
            result = xhr.responseXML;
          }
          else {
            _$jscoverage['modules/ajax.js'][96]++;
            if (dataType == "json") {
              _$jscoverage['modules/ajax.js'][96]++;
              result = blankRE.test(result)? null: JSON.parse(result);
            }
          }
        }
      }
      catch (e) {
        _$jscoverage['modules/ajax.js'][98]++;
        error = e;
      }
      _$jscoverage['modules/ajax.js'][101]++;
      if (error) {
        _$jscoverage['modules/ajax.js'][102]++;
        logger.debug("ajax error", error);
        _$jscoverage['modules/ajax.js'][103]++;
        ajaxError(error, "parsererror", xhr, settings);
      }
      else {
        _$jscoverage['modules/ajax.js'][105]++;
        ajaxSuccess(result, xhr, settings);
      }
    }
    else {
      _$jscoverage['modules/ajax.js'][107]++;
      ajaxError(null, "error", xhr, settings);
    }
  }
});
  _$jscoverage['modules/ajax.js'][112]++;
  var async = "async" in settings? settings.async: true;
  _$jscoverage['modules/ajax.js'][113]++;
  logger.debug("ajax call settings", settings);
  _$jscoverage['modules/ajax.js'][114]++;
  xhr.open(settings.type, settings.url, async);
  _$jscoverage['modules/ajax.js'][116]++;
  for (name in settings.headers) {
    _$jscoverage['modules/ajax.js'][116]++;
    xhr.setRequestHeader(name, settings.headers[name]);
}
  _$jscoverage['modules/ajax.js'][118]++;
  if (ajaxBeforeSend(xhr, settings) === false) {
    _$jscoverage['modules/ajax.js'][119]++;
    logger.debug("ajax call is aborted due to ajaxBeforeSend");
    _$jscoverage['modules/ajax.js'][120]++;
    xhr.abort();
    _$jscoverage['modules/ajax.js'][121]++;
    return false;
  }
  _$jscoverage['modules/ajax.js'][124]++;
  if (settings.timeout > 0) {
    _$jscoverage['modules/ajax.js'][124]++;
    abortTimeout = setTimeout((function () {
  _$jscoverage['modules/ajax.js'][125]++;
  logger.debug("ajax call timed out");
  _$jscoverage['modules/ajax.js'][126]++;
  xhr.onreadystatechange = empty;
  _$jscoverage['modules/ajax.js'][127]++;
  xhr.abort();
  _$jscoverage['modules/ajax.js'][128]++;
  xhr.isTimeout = true;
  _$jscoverage['modules/ajax.js'][129]++;
  ajaxError(null, "timeout", xhr, settings);
}), settings.timeout);
  }
  _$jscoverage['modules/ajax.js'][133]++;
  xhr.send(settings.data? settings.data: null);
  _$jscoverage['modules/ajax.js'][134]++;
  return xhr;
});
_$jscoverage['modules/ajax.js'][139]++;
function triggerAndReturn(context, eventName, data) {
  _$jscoverage['modules/ajax.js'][140]++;
  eventsHandler.emit(eventName, data);
  _$jscoverage['modules/ajax.js'][141]++;
  return true;
}
_$jscoverage['modules/ajax.js'][145]++;
function triggerGlobal(settings, context, eventName, data) {
  _$jscoverage['modules/ajax.js'][146]++;
  if (settings.global) {
    _$jscoverage['modules/ajax.js'][146]++;
    return triggerAndReturn(context || document, eventName, data);
  }
}
_$jscoverage['modules/ajax.js'][150]++;
ajax.active = 0;
_$jscoverage['modules/ajax.js'][152]++;
function ajaxStart(settings) {
  _$jscoverage['modules/ajax.js'][153]++;
  if (settings.global && ajax.active++ === 0) {
    _$jscoverage['modules/ajax.js'][153]++;
    triggerGlobal(settings, null, "ajaxStart");
  }
}
_$jscoverage['modules/ajax.js'][156]++;
function ajaxStop(settings) {
  _$jscoverage['modules/ajax.js'][157]++;
  if (settings.global && ! (--ajax.active)) {
    _$jscoverage['modules/ajax.js'][157]++;
    triggerGlobal(settings, null, "ajaxStop");
  }
}
_$jscoverage['modules/ajax.js'][161]++;
function ajaxBeforeSend(xhr, settings) {
  _$jscoverage['modules/ajax.js'][162]++;
  var context = settings.context;
  _$jscoverage['modules/ajax.js'][163]++;
  if (settings.beforeSend.call(context, xhr, settings) === false) {
    _$jscoverage['modules/ajax.js'][164]++;
    return false;
  }
  _$jscoverage['modules/ajax.js'][166]++;
  triggerGlobal(settings, context, "ajaxSend", [xhr, settings]);
}
_$jscoverage['modules/ajax.js'][169]++;
function ajaxSuccess(data, xhr, settings) {
  _$jscoverage['modules/ajax.js'][170]++;
  var context = settings.context, status = "success";
  _$jscoverage['modules/ajax.js'][172]++;
  settings.success.call(context, data, status, xhr);
  _$jscoverage['modules/ajax.js'][173]++;
  triggerGlobal(settings, context, "ajaxSuccess", [xhr, settings, data]);
  _$jscoverage['modules/ajax.js'][174]++;
  ajaxComplete(status, xhr, settings);
}
_$jscoverage['modules/ajax.js'][177]++;
function ajaxError(error, type, xhr, settings) {
  _$jscoverage['modules/ajax.js'][178]++;
  var context = settings.context;
  _$jscoverage['modules/ajax.js'][179]++;
  settings.error.call(context, xhr, type, error);
  _$jscoverage['modules/ajax.js'][180]++;
  triggerGlobal(settings, context, "ajaxError", [xhr, settings, error]);
  _$jscoverage['modules/ajax.js'][181]++;
  ajaxComplete(type, xhr, settings);
}
_$jscoverage['modules/ajax.js'][184]++;
function ajaxComplete(status, xhr, settings) {
  _$jscoverage['modules/ajax.js'][185]++;
  var context = settings.context;
  _$jscoverage['modules/ajax.js'][186]++;
  settings.complete.call(context, xhr, status);
  _$jscoverage['modules/ajax.js'][187]++;
  triggerGlobal(settings, context, "ajaxComplete", [xhr, settings]);
  _$jscoverage['modules/ajax.js'][188]++;
  ajaxStop(settings);
}
_$jscoverage['modules/ajax.js'][192]++;
function empty() {
}
_$jscoverage['modules/ajax.js'][194]++;
ajax.JSONP = (function (options) {
  _$jscoverage['modules/ajax.js'][195]++;
  if (! ("type" in options)) {
    _$jscoverage['modules/ajax.js'][195]++;
    return ajax(options);
  }
  _$jscoverage['modules/ajax.js'][197]++;
  var callbackName = "jsonp" + (++jsonpID), script = document.createElement("script"), abort = (function () {
  _$jscoverage['modules/ajax.js'][202]++;
  if (callbackName in window) {
    _$jscoverage['modules/ajax.js'][202]++;
    window[callbackName] = empty;
  }
  _$jscoverage['modules/ajax.js'][203]++;
  ajaxComplete("abort", xhr, options);
}), xhr = {abort: abort}, abortTimeout, head = document.getElementsByTagName("head")[0] || document.documentElement;
  _$jscoverage['modules/ajax.js'][210]++;
  if (options.error) {
    _$jscoverage['modules/ajax.js'][210]++;
    script.onerror = (function () {
  _$jscoverage['modules/ajax.js'][211]++;
  xhr.abort();
  _$jscoverage['modules/ajax.js'][212]++;
  options.error();
});
  }
  _$jscoverage['modules/ajax.js'][215]++;
  window[callbackName] = (function (data) {
  _$jscoverage['modules/ajax.js'][216]++;
  clearTimeout(abortTimeout);
  _$jscoverage['modules/ajax.js'][219]++;
  delete window[callbackName];
  _$jscoverage['modules/ajax.js'][220]++;
  ajaxSuccess(data, xhr, options);
});
  _$jscoverage['modules/ajax.js'][223]++;
  serializeData(options);
  _$jscoverage['modules/ajax.js'][224]++;
  script.src = options.url.replace(/=\?/, "=" + callbackName);
  _$jscoverage['modules/ajax.js'][228]++;
  head.insertBefore(script, head.firstChild);
  _$jscoverage['modules/ajax.js'][230]++;
  if (options.timeout > 0) {
    _$jscoverage['modules/ajax.js'][230]++;
    abortTimeout = setTimeout((function () {
  _$jscoverage['modules/ajax.js'][231]++;
  xhr.abort();
  _$jscoverage['modules/ajax.js'][232]++;
  ajaxComplete("timeout", xhr, options);
}), options.timeout);
  }
  _$jscoverage['modules/ajax.js'][235]++;
  return xhr;
});
_$jscoverage['modules/ajax.js'][238]++;
function isIE() {
  _$jscoverage['modules/ajax.js'][239]++;
  var ie = false;
  _$jscoverage['modules/ajax.js'][240]++;
  if (navigator.userAgent && navigator.userAgent.indexOf("MSIE") >= 0) {
    _$jscoverage['modules/ajax.js'][241]++;
    ie = true;
  }
  _$jscoverage['modules/ajax.js'][243]++;
  return ie;
}
_$jscoverage['modules/ajax.js'][246]++;
function getXhr(crossDomain) {
  _$jscoverage['modules/ajax.js'][247]++;
  var xhr = null;
  _$jscoverage['modules/ajax.js'][249]++;
  if (window.XMLHttpRequest) {
    _$jscoverage['modules/ajax.js'][250]++;
    xhr = new XMLHttpRequest();
  }
  _$jscoverage['modules/ajax.js'][253]++;
  if (isIE() && (crossDomain === true) && typeof window.XDomainRequest !== "undefined") {
    _$jscoverage['modules/ajax.js'][254]++;
    xhr = new XDomainRequestWrapper(new XDomainRequest());
  }
  _$jscoverage['modules/ajax.js'][256]++;
  return xhr;
}
_$jscoverage['modules/ajax.js'][259]++;
ajax.settings = {type: "GET", beforeSend: empty, success: empty, error: empty, complete: empty, context: null, global: true, xhr: getXhr, accepts: {script: "text/javascript, application/javascript", json: jsonType, xml: "application/xml, text/xml", html: htmlType, text: "text/plain"}, crossDomain: false, timeout: consts.fh_timeout};
_$jscoverage['modules/ajax.js'][290]++;
function mimeToDataType(mime) {
  _$jscoverage['modules/ajax.js'][291]++;
  return mime && (mime == htmlType? "html": mime == jsonType? "json": scriptTypeRE.test(mime)? "script": xmlTypeRE.test(mime) && "xml") || "text";
}
_$jscoverage['modules/ajax.js'][297]++;
function appendQuery(url, query) {
  _$jscoverage['modules/ajax.js'][298]++;
  return (url + "&" + query).replace(/[&?]{1,2}/, "?");
}
_$jscoverage['modules/ajax.js'][302]++;
function serializeData(options) {
  _$jscoverage['modules/ajax.js'][303]++;
  if (type(options.data) === "object") {
    _$jscoverage['modules/ajax.js'][304]++;
    if (typeof options.data.append === "function") {
      _$jscoverage['modules/ajax.js'][306]++;
      options.formdata = true;
    }
    else {
      _$jscoverage['modules/ajax.js'][308]++;
      options.data = param(options.data);
    }
  }
  _$jscoverage['modules/ajax.js'][311]++;
  if (options.data && (! options.type || options.type.toUpperCase() == "GET")) {
    _$jscoverage['modules/ajax.js'][312]++;
    options.url = appendQuery(options.url, options.data);
  }
}
_$jscoverage['modules/ajax.js'][315]++;
ajax.get = (function (url, success) {
  _$jscoverage['modules/ajax.js'][316]++;
  return ajax({url: url, success: success});
});
_$jscoverage['modules/ajax.js'][322]++;
ajax.post = (function (url, data, success, dataType) {
  _$jscoverage['modules/ajax.js'][323]++;
  if (type(data) === "function") {
    _$jscoverage['modules/ajax.js'][323]++;
    dataType = dataType || success, success = data, data = null;
  }
  _$jscoverage['modules/ajax.js'][324]++;
  return ajax({type: "POST", url: url, data: data, success: success, dataType: dataType});
});
_$jscoverage['modules/ajax.js'][333]++;
ajax.getJSON = (function (url, success) {
  _$jscoverage['modules/ajax.js'][334]++;
  return ajax({url: url, success: success, dataType: "json"});
});
_$jscoverage['modules/ajax.js'][341]++;
var escape = encodeURIComponent;
_$jscoverage['modules/ajax.js'][343]++;
function serialize(params, obj, traditional, scope) {
  _$jscoverage['modules/ajax.js'][344]++;
  var array = type(obj) === "array";
  _$jscoverage['modules/ajax.js'][345]++;
  for (var key in obj) {
    _$jscoverage['modules/ajax.js'][346]++;
    var value = obj[key];
    _$jscoverage['modules/ajax.js'][348]++;
    if (scope) {
      _$jscoverage['modules/ajax.js'][348]++;
      key = traditional? scope: scope + "[" + (array? "": key) + "]";
    }
    _$jscoverage['modules/ajax.js'][350]++;
    if (! scope && array) {
      _$jscoverage['modules/ajax.js'][350]++;
      params.add(value.name, value.value);
    }
    else {
      _$jscoverage['modules/ajax.js'][352]++;
      if (traditional? (type(value) === "array"): (type(value) === "object")) {
        _$jscoverage['modules/ajax.js'][353]++;
        serialize(params, value, traditional, key);
      }
      else {
        _$jscoverage['modules/ajax.js'][354]++;
        params.add(key, value);
      }
    }
}
}
_$jscoverage['modules/ajax.js'][358]++;
function param(obj, traditional) {
  _$jscoverage['modules/ajax.js'][359]++;
  var params = [];
  _$jscoverage['modules/ajax.js'][360]++;
  params.add = (function (k, v) {
  _$jscoverage['modules/ajax.js'][361]++;
  this.push(escape(k) + "=" + escape(v));
});
  _$jscoverage['modules/ajax.js'][363]++;
  serialize(params, obj, traditional);
  _$jscoverage['modules/ajax.js'][364]++;
  return params.join("&").replace("%20", "+");
}
_$jscoverage['modules/ajax.js'][367]++;
function extend(target) {
  _$jscoverage['modules/ajax.js'][368]++;
  var slice = Array.prototype.slice;
  _$jscoverage['modules/ajax.js'][369]++;
  slice.call(arguments, 1).forEach((function (source) {
  _$jscoverage['modules/ajax.js'][370]++;
  for (key in source) {
    _$jscoverage['modules/ajax.js'][371]++;
    if (source[key] !== undefined) {
      _$jscoverage['modules/ajax.js'][372]++;
      target[key] = source[key];
    }
}
}));
  _$jscoverage['modules/ajax.js'][374]++;
  return target;
}
_$jscoverage['modules/ajax.js'].source = ["//a shameless copy from https://github.com/ForbesLindesay/ajax/blob/master/index.js. ","//it has the same methods and config options as jQuery/zeptojs but very light weight. see http://api.jquery.com/jQuery.ajax/","//a few small changes are made for supporting IE 8 and other features:","//1. use getXhr function to replace the default XMLHttpRequest implementation for supporting IE8","//2. Integrate with events emitter. So to subscribe ajax events, you can do $fh.on(\"ajaxStart\", handler). See http://api.jquery.com/Ajax_Events/ for full list of events","//3. allow passing xhr factory method through options: e.g. $fh.ajax({xhr: function(){/*own implementation of xhr*/}}); ","//4. Use fh_timeout value as the default timeout","//5. an extra option called \"tryJSONP\" to allow try the same call with JSONP if normal CORS failed - should only be used internally","//6. for jsonp, allow to specify the callback query param name using the \"jsonp\" option","","var eventsHandler = require(\"./events\");","var XDomainRequestWrapper = require(\"./XDomainRequestWrapper\");","var consts = require(\"./constants\");","var logger = require(\"./logger\");","","var type","try {","  type = require('type-of')","} catch (ex) {","  //hide from browserify","  var r = require","  type = r('type')","}","","var jsonpID = 0,","  document = window.document,","  key,","  name,","  rscript = /&lt;script\\b[^&lt;]*(?:(?!&lt;\\/script&gt;)&lt;[^&lt;]*)*&lt;\\/script&gt;/gi,","  scriptTypeRE = /^(?:text|application)\\/javascript/i,","  xmlTypeRE = /^(?:text|application)\\/xml/i,","  jsonType = 'application/json',","  htmlType = 'text/html',","  blankRE = /^\\s*$/;","","var ajax = module.exports = function (options) {","  var settings = extend({}, options || {})","  for (key in ajax.settings)","    if (settings[key] === undefined) settings[key] = ajax.settings[key]","","  ajaxStart(settings)","","  if (!settings.crossDomain) settings.crossDomain = /^([\\w-]+:)?\\/\\/([^\\/]+)/.test(settings.url) &amp;&amp;","    RegExp.$2 != window.location.host","","  var dataType = settings.dataType,","    hasPlaceholder = /=\\?/.test(settings.url)","    if (dataType == 'jsonp' || hasPlaceholder) {","      if (!hasPlaceholder) {","        settings.url = appendQuery(settings.url, (settings.jsonp? settings.jsonp: '_callback') + '=?');","      }","      return ajax.JSONP(settings)","    }","","  if (!settings.url) settings.url = window.location.toString()","  serializeData(settings)","","  var mime = settings.accepts[dataType],","    baseHeaders = {},","    protocol = /^([\\w-]+:)\\/\\//.test(settings.url) ? RegExp.$1 : window.location.protocol,","    xhr = settings.xhr(settings.crossDomain),","    abortTimeout","","  if (!settings.crossDomain) baseHeaders['X-Requested-With'] = 'XMLHttpRequest'","  if (mime) {","    baseHeaders['Accept'] = mime","    if (mime.indexOf(',') &gt; -1) mime = mime.split(',', 2)[0]","    xhr.overrideMimeType &amp;&amp; xhr.overrideMimeType(mime)","  }","  if (settings.contentType || (settings.data &amp;&amp; !settings.formdata &amp;&amp; settings.type.toUpperCase() != 'GET'))","    baseHeaders['Content-Type'] = (settings.contentType || 'application/x-www-form-urlencoded')","  settings.headers = extend(baseHeaders, settings.headers || {})","","  xhr.onreadystatechange = function () {","    if (xhr.readyState == 4) {","      clearTimeout(abortTimeout)","      var result, error = false","      if(settings.tryJSONP){","        //check if the request has fail. In some cases, we may want to try jsonp as well. Again, FH only...","        if(xhr.status === 0 &amp;&amp; settings.crossDomain &amp;&amp; !xhr.isTimeout &amp;&amp;  protocol != 'file:'){","          logger.debug(\"retry ajax call with jsonp\")","          settings.type = \"GET\";","          settings.dataType = \"jsonp\";","          settings.data = \"_jsonpdata=\" + settings.data;","          return ajax(settings);","        }","      }","      if ((xhr.status &gt;= 200 &amp;&amp; xhr.status &lt; 300) || xhr.status == 304 || (xhr.status == 0 &amp;&amp; protocol == 'file:')) {","        dataType = dataType || mimeToDataType(xhr.getResponseHeader('content-type'))","        result = xhr.responseText","        logger.debug(\"ajax response :: status = \" + xhr.status + \" :: body = \" + result)","","        try {","          if (dataType == 'script')(1, eval)(result)","          else if (dataType == 'xml') result = xhr.responseXML","          else if (dataType == 'json') result = blankRE.test(result) ? null : JSON.parse(result)","        } catch (e) {","          error = e","        }","","        if (error) {","          logger.debug(\"ajax error\", error);","          ajaxError(error, 'parsererror', xhr, settings)","        }","        else ajaxSuccess(result, xhr, settings)","      } else {","        ajaxError(null, 'error', xhr, settings)","      }","    }","  }","","  var async = 'async' in settings ? settings.async : true","  logger.debug(\"ajax call settings\", settings)","  xhr.open(settings.type, settings.url, async)","","  for (name in settings.headers) xhr.setRequestHeader(name, settings.headers[name])","","  if (ajaxBeforeSend(xhr, settings) === false) {","    logger.debug(\"ajax call is aborted due to ajaxBeforeSend\")","    xhr.abort()","    return false","  }","","  if (settings.timeout &gt; 0) abortTimeout = setTimeout(function () {","    logger.debug(\"ajax call timed out\")","    xhr.onreadystatechange = empty","    xhr.abort()","    xhr.isTimeout = true","    ajaxError(null, 'timeout', xhr, settings)","  }, settings.timeout)","","  // avoid sending empty string (#319)","  xhr.send(settings.data ? settings.data : null)","  return xhr","}","","","// trigger a custom event and return true","function triggerAndReturn(context, eventName, data) {","  eventsHandler.emit(eventName, data);","  return true;","}","","// trigger an Ajax \"global\" event","function triggerGlobal(settings, context, eventName, data) {","  if (settings.global) return triggerAndReturn(context || document, eventName, data)","}","","// Number of active Ajax requests","ajax.active = 0","","function ajaxStart(settings) {","  if (settings.global &amp;&amp; ajax.active++ === 0) triggerGlobal(settings, null, 'ajaxStart')","}","","function ajaxStop(settings) {","  if (settings.global &amp;&amp; !(--ajax.active)) triggerGlobal(settings, null, 'ajaxStop')","}","","// triggers an extra global event \"ajaxBeforeSend\" that's like \"ajaxSend\" but cancelable","function ajaxBeforeSend(xhr, settings) {","  var context = settings.context","  if (settings.beforeSend.call(context, xhr, settings) === false)","    return false","","  triggerGlobal(settings, context, 'ajaxSend', [xhr, settings])","}","","function ajaxSuccess(data, xhr, settings) {","  var context = settings.context,","    status = 'success'","  settings.success.call(context, data, status, xhr)","  triggerGlobal(settings, context, 'ajaxSuccess', [xhr, settings, data])","  ajaxComplete(status, xhr, settings)","}","// type: \"timeout\", \"error\", \"abort\", \"parsererror\"","function ajaxError(error, type, xhr, settings) {","  var context = settings.context","  settings.error.call(context, xhr, type, error)","  triggerGlobal(settings, context, 'ajaxError', [xhr, settings, error])","  ajaxComplete(type, xhr, settings)","}","// status: \"success\", \"notmodified\", \"error\", \"timeout\", \"abort\", \"parsererror\"","function ajaxComplete(status, xhr, settings) {","  var context = settings.context","  settings.complete.call(context, xhr, status)","  triggerGlobal(settings, context, 'ajaxComplete', [xhr, settings])","  ajaxStop(settings)","}","","// Empty function, used as default callback","function empty() {}","","ajax.JSONP = function (options) {","  if (!('type' in options)) return ajax(options)","","  var callbackName = 'jsonp' + (++jsonpID),","    script = document.createElement('script'),","    abort = function () {","      //todo: remove script","      //$(script).remove()","      if (callbackName in window) window[callbackName] = empty","      ajaxComplete('abort', xhr, options)","    },","    xhr = {","      abort: abort","    }, abortTimeout,","    head = document.getElementsByTagName(\"head\")[0] || document.documentElement","","  if (options.error) script.onerror = function () {","    xhr.abort()","    options.error()","  }","","  window[callbackName] = function (data) {","    clearTimeout(abortTimeout)","    //todo: remove script","    //$(script).remove()","    delete window[callbackName]","    ajaxSuccess(data, xhr, options)","  }","","  serializeData(options)","  script.src = options.url.replace(/=\\?/, '=' + callbackName)","","  // Use insertBefore instead of appendChild to circumvent an IE6 bug.","  // This arises when a base node is used (see jQuery bugs #2709 and #4378).","  head.insertBefore(script, head.firstChild);","","  if (options.timeout &gt; 0) abortTimeout = setTimeout(function () {","    xhr.abort()","    ajaxComplete('timeout', xhr, options)","  }, options.timeout)","","  return xhr","}","","function isIE(){","  var ie = false;","  if(navigator.userAgent &amp;&amp; navigator.userAgent.indexOf(\"MSIE\") &gt;=0 ){","    ie = true;","  }","  return ie;","}","","function getXhr(crossDomain){","  var xhr = null;","  //always use XMLHttpRequest if available","  if(window.XMLHttpRequest){","    xhr = new XMLHttpRequest();","  }","  //for IE8","  if(isIE() &amp;&amp; (crossDomain === true) &amp;&amp; typeof window.XDomainRequest !== \"undefined\"){","    xhr = new XDomainRequestWrapper(new XDomainRequest());","  }","  return xhr;","}","","ajax.settings = {","  // Default type of request","  type: 'GET',","  // Callback that is executed before request","  beforeSend: empty,","  // Callback that is executed if the request succeeds","  success: empty,","  // Callback that is executed the the server drops error","  error: empty,","  // Callback that is executed on request complete (both: error and success)","  complete: empty,","  // The context for the callbacks","  context: null,","  // Whether to trigger \"global\" Ajax events","  global: true,","  // Transport","  xhr: getXhr,","  // MIME types mapping","  accepts: {","    script: 'text/javascript, application/javascript',","    json: jsonType,","    xml: 'application/xml, text/xml',","    html: htmlType,","    text: 'text/plain'","  },","  // Whether the request is to another domain","  crossDomain: false,","  // Default timeout","  timeout: consts.fh_timeout","}","","function mimeToDataType(mime) {","  return mime &amp;&amp; (mime == htmlType ? 'html' :","    mime == jsonType ? 'json' :","    scriptTypeRE.test(mime) ? 'script' :","    xmlTypeRE.test(mime) &amp;&amp; 'xml') || 'text'","}","","function appendQuery(url, query) {","  return (url + '&amp;' + query).replace(/[&amp;?]{1,2}/, '?')","}","","// serialize payload and append it to the URL for GET requests","function serializeData(options) {","  if (type(options.data) === 'object') {","    if(typeof options.data.append === \"function\"){","      //we are dealing with FormData, do not serialize","      options.formdata = true;","    } else {","      options.data = param(options.data)","    }","  }","  if (options.data &amp;&amp; (!options.type || options.type.toUpperCase() == 'GET'))","    options.url = appendQuery(options.url, options.data)","}","","ajax.get = function (url, success) {","  return ajax({","    url: url,","    success: success","  })","}","","ajax.post = function (url, data, success, dataType) {","  if (type(data) === 'function') dataType = dataType || success, success = data, data = null","  return ajax({","    type: 'POST',","    url: url,","    data: data,","    success: success,","    dataType: dataType","  })","}","","ajax.getJSON = function (url, success) {","  return ajax({","    url: url,","    success: success,","    dataType: 'json'","  })","}","","var escape = encodeURIComponent;","","function serialize(params, obj, traditional, scope) {","  var array = type(obj) === 'array';","  for (var key in obj) {","    var value = obj[key];","","    if (scope) key = traditional ? scope : scope + '[' + (array ? '' : key) + ']'","    // handle data in serializeArray() format","    if (!scope &amp;&amp; array) params.add(value.name, value.value)","    // recurse into nested objects","    else if (traditional ? (type(value) === 'array') : (type(value) === 'object'))","      serialize(params, value, traditional, key)","    else params.add(key, value)","  }","}","","function param(obj, traditional) {","  var params = []","  params.add = function (k, v) {","    this.push(escape(k) + '=' + escape(v))","  }","  serialize(params, obj, traditional)","  return params.join('&amp;').replace('%20', '+')","}","","function extend(target) {","  var slice = Array.prototype.slice;","  slice.call(arguments, 1).forEach(function (source) {","    for (key in source)","      if (source[key] !== undefined)","        target[key] = source[key]","  })","  return target","}"];

},{"./XDomainRequestWrapper":18,"./constants":28,"./events":31,"./logger":38,"type-of":15}],20:[function(require,module,exports){
/* automatically generated by JSCoverage - do not edit */
if (typeof _$jscoverage === 'undefined') _$jscoverage = {};
if (! _$jscoverage['modules/api_act.js']) {
  _$jscoverage['modules/api_act.js'] = [];
  _$jscoverage['modules/api_act.js'][1] = 0;
  _$jscoverage['modules/api_act.js'][2] = 0;
  _$jscoverage['modules/api_act.js'][3] = 0;
  _$jscoverage['modules/api_act.js'][4] = 0;
  _$jscoverage['modules/api_act.js'][5] = 0;
  _$jscoverage['modules/api_act.js'][6] = 0;
  _$jscoverage['modules/api_act.js'][8] = 0;
  _$jscoverage['modules/api_act.js'][9] = 0;
  _$jscoverage['modules/api_act.js'][10] = 0;
  _$jscoverage['modules/api_act.js'][11] = 0;
  _$jscoverage['modules/api_act.js'][12] = 0;
  _$jscoverage['modules/api_act.js'][13] = 0;
  _$jscoverage['modules/api_act.js'][23] = 0;
  _$jscoverage['modules/api_act.js'][28] = 0;
  _$jscoverage['modules/api_act.js'][29] = 0;
  _$jscoverage['modules/api_act.js'][30] = 0;
  _$jscoverage['modules/api_act.js'][31] = 0;
  _$jscoverage['modules/api_act.js'][32] = 0;
  _$jscoverage['modules/api_act.js'][36] = 0;
  _$jscoverage['modules/api_act.js'][37] = 0;
  _$jscoverage['modules/api_act.js'][40] = 0;
  _$jscoverage['modules/api_act.js'][41] = 0;
  _$jscoverage['modules/api_act.js'][42] = 0;
  _$jscoverage['modules/api_act.js'][43] = 0;
  _$jscoverage['modules/api_act.js'][45] = 0;
}
_$jscoverage['modules/api_act.js'][1]++;
var logger = require("./logger");
_$jscoverage['modules/api_act.js'][2]++;
var cloud = require("./waitForCloud");
_$jscoverage['modules/api_act.js'][3]++;
var fhparams = require("./fhparams");
_$jscoverage['modules/api_act.js'][4]++;
var ajax = require("./ajax");
_$jscoverage['modules/api_act.js'][5]++;
var JSON = require("JSON");
_$jscoverage['modules/api_act.js'][6]++;
var handleError = require("./handleError");
_$jscoverage['modules/api_act.js'][8]++;
function doActCall(opts, success, fail) {
  _$jscoverage['modules/api_act.js'][9]++;
  var cloud_host = cloud.getCloudHost();
  _$jscoverage['modules/api_act.js'][10]++;
  var url = cloud_host.getActUrl(opts.act);
  _$jscoverage['modules/api_act.js'][11]++;
  var params = opts.req || {};
  _$jscoverage['modules/api_act.js'][12]++;
  params = fhparams.addFHParams(params);
  _$jscoverage['modules/api_act.js'][13]++;
  return ajax({"url": url, "tryJSONP": true, "type": "POST", "dataType": "json", "data": JSON.stringify(params), "contentType": "application/json", "timeout": opts.timeout, "success": success, "error": (function (req, statusText, error) {
  _$jscoverage['modules/api_act.js'][23]++;
  return handleError(fail, req, statusText, error);
})});
}
_$jscoverage['modules/api_act.js'][28]++;
module.exports = (function (opts, success, fail) {
  _$jscoverage['modules/api_act.js'][29]++;
  logger.debug("act is called");
  _$jscoverage['modules/api_act.js'][30]++;
  if (! fail) {
    _$jscoverage['modules/api_act.js'][31]++;
    fail = (function (msg, error) {
  _$jscoverage['modules/api_act.js'][32]++;
  logger.debug(msg + ":" + JSON.stringify(error));
});
  }
  _$jscoverage['modules/api_act.js'][36]++;
  if (! opts.act) {
    _$jscoverage['modules/api_act.js'][37]++;
    return fail("act_no_action", {});
  }
  _$jscoverage['modules/api_act.js'][40]++;
  cloud.ready((function (err, cloudHost) {
  _$jscoverage['modules/api_act.js'][41]++;
  logger.debug("Calling fhact now");
  _$jscoverage['modules/api_act.js'][42]++;
  if (err) {
    _$jscoverage['modules/api_act.js'][43]++;
    return fail(err.message, err);
  }
  else {
    _$jscoverage['modules/api_act.js'][45]++;
    doActCall(opts, success, fail);
  }
}));
});
_$jscoverage['modules/api_act.js'].source = ["var logger =require(\"./logger\");","var cloud = require(\"./waitForCloud\");","var fhparams = require(\"./fhparams\");","var ajax = require(\"./ajax\");","var JSON = require(\"JSON\");","var handleError = require(\"./handleError\");","","function doActCall(opts, success, fail){","  var cloud_host = cloud.getCloudHost();","  var url = cloud_host.getActUrl(opts.act);","  var params = opts.req || {};","  params = fhparams.addFHParams(params);","  return ajax({","    \"url\": url,","    \"tryJSONP\": true,","    \"type\": \"POST\",","    \"dataType\": \"json\",","    \"data\": JSON.stringify(params),","    \"contentType\": \"application/json\",","    \"timeout\": opts.timeout,","    \"success\": success,","    \"error\": function(req, statusText, error){","      return handleError(fail, req, statusText, error);","    }","  })","}","","module.exports = function(opts, success, fail){","  logger.debug(\"act is called\");","  if(!fail){","    fail = function(msg, error){","      logger.debug(msg + \":\" + JSON.stringify(error));","    };","  }","","  if(!opts.act){","    return fail('act_no_action', {});","  }","","  cloud.ready(function(err, cloudHost){","    logger.debug(\"Calling fhact now\");","    if(err){","      return fail(err.message, err);","    } else {","      doActCall(opts, success, fail);","    }","  })","}"];

},{"./ajax":19,"./fhparams":32,"./handleError":33,"./logger":38,"./waitForCloud":48,"JSON":3}],21:[function(require,module,exports){
/* automatically generated by JSCoverage - do not edit */
if (typeof _$jscoverage === 'undefined') _$jscoverage = {};
if (! _$jscoverage['modules/api_auth.js']) {
  _$jscoverage['modules/api_auth.js'] = [];
  _$jscoverage['modules/api_auth.js'][1] = 0;
  _$jscoverage['modules/api_auth.js'][2] = 0;
  _$jscoverage['modules/api_auth.js'][3] = 0;
  _$jscoverage['modules/api_auth.js'][4] = 0;
  _$jscoverage['modules/api_auth.js'][5] = 0;
  _$jscoverage['modules/api_auth.js'][6] = 0;
  _$jscoverage['modules/api_auth.js'][7] = 0;
  _$jscoverage['modules/api_auth.js'][8] = 0;
  _$jscoverage['modules/api_auth.js'][9] = 0;
  _$jscoverage['modules/api_auth.js'][10] = 0;
  _$jscoverage['modules/api_auth.js'][12] = 0;
  _$jscoverage['modules/api_auth.js'][13] = 0;
  _$jscoverage['modules/api_auth.js'][14] = 0;
  _$jscoverage['modules/api_auth.js'][15] = 0;
  _$jscoverage['modules/api_auth.js'][18] = 0;
  _$jscoverage['modules/api_auth.js'][19] = 0;
  _$jscoverage['modules/api_auth.js'][21] = 0;
  _$jscoverage['modules/api_auth.js'][22] = 0;
  _$jscoverage['modules/api_auth.js'][25] = 0;
  _$jscoverage['modules/api_auth.js'][26] = 0;
  _$jscoverage['modules/api_auth.js'][27] = 0;
  _$jscoverage['modules/api_auth.js'][29] = 0;
  _$jscoverage['modules/api_auth.js'][30] = 0;
  _$jscoverage['modules/api_auth.js'][31] = 0;
  _$jscoverage['modules/api_auth.js'][32] = 0;
  _$jscoverage['modules/api_auth.js'][33] = 0;
  _$jscoverage['modules/api_auth.js'][34] = 0;
  _$jscoverage['modules/api_auth.js'][35] = 0;
  _$jscoverage['modules/api_auth.js'][38] = 0;
  _$jscoverage['modules/api_auth.js'][39] = 0;
  _$jscoverage['modules/api_auth.js'][40] = 0;
  _$jscoverage['modules/api_auth.js'][42] = 0;
  _$jscoverage['modules/api_auth.js'][43] = 0;
  _$jscoverage['modules/api_auth.js'][44] = 0;
  _$jscoverage['modules/api_auth.js'][45] = 0;
  _$jscoverage['modules/api_auth.js'][46] = 0;
  _$jscoverage['modules/api_auth.js'][48] = 0;
  _$jscoverage['modules/api_auth.js'][57] = 0;
  _$jscoverage['modules/api_auth.js'][60] = 0;
}
_$jscoverage['modules/api_auth.js'][1]++;
var logger = require("./logger");
_$jscoverage['modules/api_auth.js'][2]++;
var cloud = require("./waitForCloud");
_$jscoverage['modules/api_auth.js'][3]++;
var fhparams = require("./fhparams");
_$jscoverage['modules/api_auth.js'][4]++;
var ajax = require("./ajax");
_$jscoverage['modules/api_auth.js'][5]++;
var JSON = require("JSON");
_$jscoverage['modules/api_auth.js'][6]++;
var handleError = require("./handleError");
_$jscoverage['modules/api_auth.js'][7]++;
var device = require("./device");
_$jscoverage['modules/api_auth.js'][8]++;
var constants = require("./constants");
_$jscoverage['modules/api_auth.js'][9]++;
var checkAuth = require("./checkAuth");
_$jscoverage['modules/api_auth.js'][10]++;
var appProps = require("./appProps");
_$jscoverage['modules/api_auth.js'][12]++;
module.exports = (function (opts, success, fail) {
  _$jscoverage['modules/api_auth.js'][13]++;
  if (! fail) {
    _$jscoverage['modules/api_auth.js'][14]++;
    fail = (function (msg, error) {
  _$jscoverage['modules/api_auth.js'][15]++;
  logger.debug(msg + ":" + JSON.stringify(error));
});
  }
  _$jscoverage['modules/api_auth.js'][18]++;
  if (! opts.policyId) {
    _$jscoverage['modules/api_auth.js'][19]++;
    return fail("auth_no_policyId", {});
  }
  _$jscoverage['modules/api_auth.js'][21]++;
  if (! opts.clientToken) {
    _$jscoverage['modules/api_auth.js'][22]++;
    return fail("auth_no_clientToken", {});
  }
  _$jscoverage['modules/api_auth.js'][25]++;
  cloud.ready((function (err, data) {
  _$jscoverage['modules/api_auth.js'][26]++;
  if (err) {
    _$jscoverage['modules/api_auth.js'][27]++;
    return fail(err.message, err);
  }
  else {
    _$jscoverage['modules/api_auth.js'][29]++;
    var req = {};
    _$jscoverage['modules/api_auth.js'][30]++;
    req.policyId = opts.policyId;
    _$jscoverage['modules/api_auth.js'][31]++;
    req.clientToken = opts.clientToken;
    _$jscoverage['modules/api_auth.js'][32]++;
    if (opts.endRedirectUrl) {
      _$jscoverage['modules/api_auth.js'][33]++;
      req.endRedirectUrl = opts.endRedirectUrl;
      _$jscoverage['modules/api_auth.js'][34]++;
      if (opts.authCallback) {
        _$jscoverage['modules/api_auth.js'][35]++;
        req.endRedirectUrl += (/\?/.test(req.endRedirectUrl)? "&": "?") + "_fhAuthCallback=" + opts.authCallback;
      }
    }
    _$jscoverage['modules/api_auth.js'][38]++;
    req.params = {};
    _$jscoverage['modules/api_auth.js'][39]++;
    if (opts.params) {
      _$jscoverage['modules/api_auth.js'][40]++;
      req.params = opts.params;
    }
    _$jscoverage['modules/api_auth.js'][42]++;
    var endurl = opts.endRedirectUrl || "status=complete";
    _$jscoverage['modules/api_auth.js'][43]++;
    req.device = device.getDeviceId();
    _$jscoverage['modules/api_auth.js'][44]++;
    var app_props = appProps.getAppProps();
    _$jscoverage['modules/api_auth.js'][45]++;
    var path = app_props.host + constants.boxprefix + "admin/authpolicy/auth";
    _$jscoverage['modules/api_auth.js'][46]++;
    req = fhparams.addFHParams(req);
    _$jscoverage['modules/api_auth.js'][48]++;
    ajax({"url": path, "type": "POST", "tryJSONP": true, "data": JSON.stringify(req), "dataType": "json", "contentType": "application/json", "timeout": opts.timeout || app_props.timeout || constants.fh_timeout, success: (function (res) {
  _$jscoverage['modules/api_auth.js'][57]++;
  checkAuth.handleAuthResponse(endurl, res, success, fail);
}), error: (function (req, statusText, error) {
  _$jscoverage['modules/api_auth.js'][60]++;
  handleError(fail, req, statusText, error);
})});
  }
}));
});
_$jscoverage['modules/api_auth.js'].source = ["var logger =require(\"./logger\");","var cloud = require(\"./waitForCloud\");","var fhparams = require(\"./fhparams\");","var ajax = require(\"./ajax\");","var JSON = require(\"JSON\");","var handleError = require(\"./handleError\");","var device = require(\"./device\");","var constants = require(\"./constants\");","var checkAuth = require(\"./checkAuth\");","var appProps = require(\"./appProps\");","","module.exports = function(opts, success, fail){","  if(!fail){","    fail = function(msg, error){","      logger.debug(msg + \":\" + JSON.stringify(error));","    };","  }","  if (!opts.policyId) {","    return fail('auth_no_policyId', {});","  }","  if (!opts.clientToken) {","    return fail('auth_no_clientToken', {});","  }","","  cloud.ready(function(err, data){","    if(err){","      return fail(err.message, err);","    } else {","      var req = {};","      req.policyId = opts.policyId;","      req.clientToken = opts.clientToken;","      if (opts.endRedirectUrl) {","        req.endRedirectUrl = opts.endRedirectUrl;","        if (opts.authCallback) {","          req.endRedirectUrl += (/\\?/.test(req.endRedirectUrl) ? \"&amp;\" : \"?\") + \"_fhAuthCallback=\" + opts.authCallback;","        }","      }","      req.params = {};","      if (opts.params) {","        req.params = opts.params;","      }","      var endurl = opts.endRedirectUrl || \"status=complete\";","      req.device = device.getDeviceId();","      var app_props = appProps.getAppProps();","      var path = app_props.host + constants.boxprefix + \"admin/authpolicy/auth\";","      req = fhparams.addFHParams(req);","","      ajax({","        \"url\": path,","        \"type\": \"POST\",","        \"tryJSONP\": true,","        \"data\": JSON.stringify(req),","        \"dataType\": \"json\",","        \"contentType\": \"application/json\",","        \"timeout\" : opts.timeout || app_props.timeout || constants.fh_timeout,","        success: function(res) {","          checkAuth.handleAuthResponse(endurl, res, success, fail);","        },","        error: function(req, statusText, error) {","          handleError(fail, req, statusText, error);","        }","      });","    }","  });","}"];

},{"./ajax":19,"./appProps":26,"./checkAuth":27,"./constants":28,"./device":30,"./fhparams":32,"./handleError":33,"./logger":38,"./waitForCloud":48,"JSON":3}],22:[function(require,module,exports){
/* automatically generated by JSCoverage - do not edit */
if (typeof _$jscoverage === 'undefined') _$jscoverage = {};
if (! _$jscoverage['modules/api_cloud.js']) {
  _$jscoverage['modules/api_cloud.js'] = [];
  _$jscoverage['modules/api_cloud.js'][1] = 0;
  _$jscoverage['modules/api_cloud.js'][2] = 0;
  _$jscoverage['modules/api_cloud.js'][3] = 0;
  _$jscoverage['modules/api_cloud.js'][4] = 0;
  _$jscoverage['modules/api_cloud.js'][5] = 0;
  _$jscoverage['modules/api_cloud.js'][6] = 0;
  _$jscoverage['modules/api_cloud.js'][8] = 0;
  _$jscoverage['modules/api_cloud.js'][9] = 0;
  _$jscoverage['modules/api_cloud.js'][10] = 0;
  _$jscoverage['modules/api_cloud.js'][11] = 0;
  _$jscoverage['modules/api_cloud.js'][12] = 0;
  _$jscoverage['modules/api_cloud.js'][13] = 0;
  _$jscoverage['modules/api_cloud.js'][22] = 0;
  _$jscoverage['modules/api_cloud.js'][27] = 0;
  _$jscoverage['modules/api_cloud.js'][28] = 0;
  _$jscoverage['modules/api_cloud.js'][29] = 0;
  _$jscoverage['modules/api_cloud.js'][30] = 0;
  _$jscoverage['modules/api_cloud.js'][31] = 0;
  _$jscoverage['modules/api_cloud.js'][35] = 0;
  _$jscoverage['modules/api_cloud.js'][36] = 0;
  _$jscoverage['modules/api_cloud.js'][37] = 0;
  _$jscoverage['modules/api_cloud.js'][38] = 0;
  _$jscoverage['modules/api_cloud.js'][40] = 0;
}
_$jscoverage['modules/api_cloud.js'][1]++;
var logger = require("./logger");
_$jscoverage['modules/api_cloud.js'][2]++;
var cloud = require("./waitForCloud");
_$jscoverage['modules/api_cloud.js'][3]++;
var fhparams = require("./fhparams");
_$jscoverage['modules/api_cloud.js'][4]++;
var ajax = require("./ajax");
_$jscoverage['modules/api_cloud.js'][5]++;
var JSON = require("JSON");
_$jscoverage['modules/api_cloud.js'][6]++;
var handleError = require("./handleError");
_$jscoverage['modules/api_cloud.js'][8]++;
function doCloudCall(opts, success, fail) {
  _$jscoverage['modules/api_cloud.js'][9]++;
  var cloud_host = cloud.getCloudHost();
  _$jscoverage['modules/api_cloud.js'][10]++;
  var url = cloud_host.getCloudUrl(opts.path);
  _$jscoverage['modules/api_cloud.js'][11]++;
  var params = opts.data || {};
  _$jscoverage['modules/api_cloud.js'][12]++;
  params = fhparams.addFHParams(params);
  _$jscoverage['modules/api_cloud.js'][13]++;
  return ajax({"url": url, "type": opts.method || "POST", "dataType": opts.dataType || "json", "data": JSON.stringify(params), "contentType": opts.contentType || "application/json", "timeout": opts.timeout, "success": success, "error": (function (req, statusText, error) {
  _$jscoverage['modules/api_cloud.js'][22]++;
  return handleError(fail, req, statusText, error);
})});
}
_$jscoverage['modules/api_cloud.js'][27]++;
module.exports = (function (opts, success, fail) {
  _$jscoverage['modules/api_cloud.js'][28]++;
  logger.debug("cloud is called");
  _$jscoverage['modules/api_cloud.js'][29]++;
  if (! fail) {
    _$jscoverage['modules/api_cloud.js'][30]++;
    fail = (function (msg, error) {
  _$jscoverage['modules/api_cloud.js'][31]++;
  logger.debug(msg + ":" + JSON.stringify(error));
});
  }
  _$jscoverage['modules/api_cloud.js'][35]++;
  cloud.ready((function (err, cloudHost) {
  _$jscoverage['modules/api_cloud.js'][36]++;
  logger.debug("Calling fhact now");
  _$jscoverage['modules/api_cloud.js'][37]++;
  if (err) {
    _$jscoverage['modules/api_cloud.js'][38]++;
    return fail(err.message, err);
  }
  else {
    _$jscoverage['modules/api_cloud.js'][40]++;
    doCloudCall(opts, success, fail);
  }
}));
});
_$jscoverage['modules/api_cloud.js'].source = ["var logger =require(\"./logger\");","var cloud = require(\"./waitForCloud\");","var fhparams = require(\"./fhparams\");","var ajax = require(\"./ajax\");","var JSON = require(\"JSON\");","var handleError = require(\"./handleError\");","","function doCloudCall(opts, success, fail){","  var cloud_host = cloud.getCloudHost();","  var url = cloud_host.getCloudUrl(opts.path);","  var params = opts.data || {};","  params = fhparams.addFHParams(params);","  return ajax({","    \"url\": url,","    \"type\": opts.method || \"POST\",","    \"dataType\": opts.dataType || \"json\",","    \"data\": JSON.stringify(params),","    \"contentType\": opts.contentType || \"application/json\",","    \"timeout\": opts.timeout,","    \"success\": success,","    \"error\": function(req, statusText, error){","      return handleError(fail, req, statusText, error);","    }","  })","}","","module.exports = function(opts, success, fail){","  logger.debug(\"cloud is called\");","  if(!fail){","    fail = function(msg, error){","      logger.debug(msg + \":\" + JSON.stringify(error));","    };","  }","","  cloud.ready(function(err, cloudHost){","    logger.debug(\"Calling fhact now\");","    if(err){","      return fail(err.message, err);","    } else {","      doCloudCall(opts, success, fail);","    }","  })","}"];

},{"./ajax":19,"./fhparams":32,"./handleError":33,"./logger":38,"./waitForCloud":48,"JSON":3}],23:[function(require,module,exports){
/* automatically generated by JSCoverage - do not edit */
if (typeof _$jscoverage === 'undefined') _$jscoverage = {};
if (! _$jscoverage['modules/api_hash.js']) {
  _$jscoverage['modules/api_hash.js'] = [];
  _$jscoverage['modules/api_hash.js'][1] = 0;
  _$jscoverage['modules/api_hash.js'][3] = 0;
  _$jscoverage['modules/api_hash.js'][4] = 0;
  _$jscoverage['modules/api_hash.js'][5] = 0;
  _$jscoverage['modules/api_hash.js'][6] = 0;
  _$jscoverage['modules/api_hash.js'][8] = 0;
  _$jscoverage['modules/api_hash.js'][9] = 0;
  _$jscoverage['modules/api_hash.js'][10] = 0;
}
_$jscoverage['modules/api_hash.js'][1]++;
var hashImpl = require("./security/hash");
_$jscoverage['modules/api_hash.js'][3]++;
module.exports = (function (p, s, f) {
  _$jscoverage['modules/api_hash.js'][4]++;
  var params = {};
  _$jscoverage['modules/api_hash.js'][5]++;
  if (typeof p.algorithm === "undefined") {
    _$jscoverage['modules/api_hash.js'][6]++;
    p.algorithm = "MD5";
  }
  _$jscoverage['modules/api_hash.js'][8]++;
  params.act = "hash";
  _$jscoverage['modules/api_hash.js'][9]++;
  params.params = p;
  _$jscoverage['modules/api_hash.js'][10]++;
  hashImpl(params, s, f);
});
_$jscoverage['modules/api_hash.js'].source = ["var hashImpl = require(\"./security/hash\");","","module.exports = function(p, s, f){","  var params = {};","  if(typeof p.algorithm === \"undefined\"){","    p.algorithm = \"MD5\";","  }","  params.act = \"hash\";","  params.params = p;","  hashImpl(params, s, f);","};"];

},{"./security/hash":44}],24:[function(require,module,exports){
/* automatically generated by JSCoverage - do not edit */
if (typeof _$jscoverage === 'undefined') _$jscoverage = {};
if (! _$jscoverage['modules/api_mbaas.js']) {
  _$jscoverage['modules/api_mbaas.js'] = [];
  _$jscoverage['modules/api_mbaas.js'][1] = 0;
  _$jscoverage['modules/api_mbaas.js'][2] = 0;
  _$jscoverage['modules/api_mbaas.js'][3] = 0;
  _$jscoverage['modules/api_mbaas.js'][4] = 0;
  _$jscoverage['modules/api_mbaas.js'][5] = 0;
  _$jscoverage['modules/api_mbaas.js'][6] = 0;
  _$jscoverage['modules/api_mbaas.js'][7] = 0;
  _$jscoverage['modules/api_mbaas.js'][10] = 0;
  _$jscoverage['modules/api_mbaas.js'][11] = 0;
  _$jscoverage['modules/api_mbaas.js'][12] = 0;
  _$jscoverage['modules/api_mbaas.js'][13] = 0;
  _$jscoverage['modules/api_mbaas.js'][14] = 0;
  _$jscoverage['modules/api_mbaas.js'][18] = 0;
  _$jscoverage['modules/api_mbaas.js'][19] = 0;
  _$jscoverage['modules/api_mbaas.js'][21] = 0;
  _$jscoverage['modules/api_mbaas.js'][22] = 0;
  _$jscoverage['modules/api_mbaas.js'][23] = 0;
  _$jscoverage['modules/api_mbaas.js'][24] = 0;
  _$jscoverage['modules/api_mbaas.js'][26] = 0;
  _$jscoverage['modules/api_mbaas.js'][27] = 0;
  _$jscoverage['modules/api_mbaas.js'][28] = 0;
  _$jscoverage['modules/api_mbaas.js'][29] = 0;
  _$jscoverage['modules/api_mbaas.js'][39] = 0;
}
_$jscoverage['modules/api_mbaas.js'][1]++;
var logger = require("./logger");
_$jscoverage['modules/api_mbaas.js'][2]++;
var cloud = require("./waitForCloud");
_$jscoverage['modules/api_mbaas.js'][3]++;
var fhparams = require("./fhparams");
_$jscoverage['modules/api_mbaas.js'][4]++;
var ajax = require("./ajax");
_$jscoverage['modules/api_mbaas.js'][5]++;
var JSON = require("JSON");
_$jscoverage['modules/api_mbaas.js'][6]++;
var handleError = require("./handleError");
_$jscoverage['modules/api_mbaas.js'][7]++;
var consts = require("./constants");
_$jscoverage['modules/api_mbaas.js'][10]++;
module.exports = (function (opts, success, fail) {
  _$jscoverage['modules/api_mbaas.js'][11]++;
  logger.debug("mbaas is called.");
  _$jscoverage['modules/api_mbaas.js'][12]++;
  if (! fail) {
    _$jscoverage['modules/api_mbaas.js'][13]++;
    fail = (function (msg, error) {
  _$jscoverage['modules/api_mbaas.js'][14]++;
  console.debug(msg + ":" + JSON.stringify(error));
});
  }
  _$jscoverage['modules/api_mbaas.js'][18]++;
  var mbaas = opts.service;
  _$jscoverage['modules/api_mbaas.js'][19]++;
  var params = opts.params;
  _$jscoverage['modules/api_mbaas.js'][21]++;
  cloud.ready((function (err, cloudHost) {
  _$jscoverage['modules/api_mbaas.js'][22]++;
  logger.debug("Calling mbaas now");
  _$jscoverage['modules/api_mbaas.js'][23]++;
  if (err) {
    _$jscoverage['modules/api_mbaas.js'][24]++;
    return fail(err.message, err);
  }
  else {
    _$jscoverage['modules/api_mbaas.js'][26]++;
    var cloud_host = cloud.getCloudHost();
    _$jscoverage['modules/api_mbaas.js'][27]++;
    var url = cloud_host.getMBAASUrl(mbaas);
    _$jscoverage['modules/api_mbaas.js'][28]++;
    params = fhparams.addFHParams(params);
    _$jscoverage['modules/api_mbaas.js'][29]++;
    return ajax({"url": url, "tryJSONP": true, "type": "POST", "dataType": "json", "data": JSON.stringify(params), "contentType": "application/json", "timeout": opts.timeout || consts.fh_timeout, "success": success, "error": (function (req, statusText, error) {
  _$jscoverage['modules/api_mbaas.js'][39]++;
  return handleError(fail, req, statusText, error);
})});
  }
}));
});
_$jscoverage['modules/api_mbaas.js'].source = ["var logger =require(\"./logger\");","var cloud = require(\"./waitForCloud\");","var fhparams = require(\"./fhparams\");","var ajax = require(\"./ajax\");","var JSON = require(\"JSON\");","var handleError = require(\"./handleError\");","var consts = require(\"./constants\");","","","module.exports = function(opts, success, fail){","  logger.debug(\"mbaas is called.\");","  if(!fail){","    fail = function(msg, error){","      console.debug(msg + \":\" + JSON.stringify(error));","    };","  }","","  var mbaas = opts.service;","  var params = opts.params;","","  cloud.ready(function(err, cloudHost){","    logger.debug(\"Calling mbaas now\");","    if(err){","      return fail(err.message, err);","    } else {","      var cloud_host = cloud.getCloudHost();","      var url = cloud_host.getMBAASUrl(mbaas);","      params = fhparams.addFHParams(params);","      return ajax({","        \"url\": url,","        \"tryJSONP\": true,","        \"type\": \"POST\",","        \"dataType\": \"json\",","        \"data\": JSON.stringify(params),","        \"contentType\": \"application/json\",","        \"timeout\": opts.timeout || consts.fh_timeout,","        \"success\": success,","        \"error\": function(req, statusText, error){","          return handleError(fail, req, statusText, error);","        }","      });","    }","  });","} "];

},{"./ajax":19,"./constants":28,"./fhparams":32,"./handleError":33,"./logger":38,"./waitForCloud":48,"JSON":3}],25:[function(require,module,exports){
/* automatically generated by JSCoverage - do not edit */
if (typeof _$jscoverage === 'undefined') _$jscoverage = {};
if (! _$jscoverage['modules/api_sec.js']) {
  _$jscoverage['modules/api_sec.js'] = [];
  _$jscoverage['modules/api_sec.js'][1] = 0;
  _$jscoverage['modules/api_sec.js'][2] = 0;
  _$jscoverage['modules/api_sec.js'][3] = 0;
  _$jscoverage['modules/api_sec.js'][4] = 0;
  _$jscoverage['modules/api_sec.js'][6] = 0;
  _$jscoverage['modules/api_sec.js'][7] = 0;
  _$jscoverage['modules/api_sec.js'][8] = 0;
  _$jscoverage['modules/api_sec.js'][9] = 0;
  _$jscoverage['modules/api_sec.js'][11] = 0;
  _$jscoverage['modules/api_sec.js'][12] = 0;
  _$jscoverage['modules/api_sec.js'][13] = 0;
  _$jscoverage['modules/api_sec.js'][15] = 0;
  _$jscoverage['modules/api_sec.js'][16] = 0;
  _$jscoverage['modules/api_sec.js'][17] = 0;
  _$jscoverage['modules/api_sec.js'][19] = 0;
  _$jscoverage['modules/api_sec.js'][20] = 0;
  _$jscoverage['modules/api_sec.js'][21] = 0;
  _$jscoverage['modules/api_sec.js'][22] = 0;
  _$jscoverage['modules/api_sec.js'][23] = 0;
  _$jscoverage['modules/api_sec.js'][24] = 0;
  _$jscoverage['modules/api_sec.js'][25] = 0;
  _$jscoverage['modules/api_sec.js'][26] = 0;
  _$jscoverage['modules/api_sec.js'][28] = 0;
  _$jscoverage['modules/api_sec.js'][30] = 0;
  _$jscoverage['modules/api_sec.js'][31] = 0;
  _$jscoverage['modules/api_sec.js'][32] = 0;
  _$jscoverage['modules/api_sec.js'][34] = 0;
  _$jscoverage['modules/api_sec.js'][36] = 0;
  _$jscoverage['modules/api_sec.js'][37] = 0;
  _$jscoverage['modules/api_sec.js'][38] = 0;
  _$jscoverage['modules/api_sec.js'][40] = 0;
}
_$jscoverage['modules/api_sec.js'][1]++;
var keygen = require("./security/aes-keygen");
_$jscoverage['modules/api_sec.js'][2]++;
var aes = require("./security/aes-node");
_$jscoverage['modules/api_sec.js'][3]++;
var rsa = require("./security/rsa-node");
_$jscoverage['modules/api_sec.js'][4]++;
var hash = require("./security/hash");
_$jscoverage['modules/api_sec.js'][6]++;
module.exports = (function (p, s, f) {
  _$jscoverage['modules/api_sec.js'][7]++;
  if (! p.act) {
    _$jscoverage['modules/api_sec.js'][8]++;
    f("bad_act", {}, p);
    _$jscoverage['modules/api_sec.js'][9]++;
    return;
  }
  _$jscoverage['modules/api_sec.js'][11]++;
  if (! p.params) {
    _$jscoverage['modules/api_sec.js'][12]++;
    f("no_params", {}, p);
    _$jscoverage['modules/api_sec.js'][13]++;
    return;
  }
  _$jscoverage['modules/api_sec.js'][15]++;
  if (! p.params.algorithm) {
    _$jscoverage['modules/api_sec.js'][16]++;
    f("no_params_algorithm", {}, p);
    _$jscoverage['modules/api_sec.js'][17]++;
    return;
  }
  _$jscoverage['modules/api_sec.js'][19]++;
  p.params.algorithm = p.params.algorithm.toLowerCase();
  _$jscoverage['modules/api_sec.js'][20]++;
  if (p.act === "hash") {
    _$jscoverage['modules/api_sec.js'][21]++;
    return hash(p, s, f);
  }
  else {
    _$jscoverage['modules/api_sec.js'][22]++;
    if (p.act === "encrypt") {
      _$jscoverage['modules/api_sec.js'][23]++;
      if (p.params.algorithm === "aes") {
        _$jscoverage['modules/api_sec.js'][24]++;
        return aes.encrypt(p, s, f);
      }
      else {
        _$jscoverage['modules/api_sec.js'][25]++;
        if (p.params.algorithm === "rsa") {
          _$jscoverage['modules/api_sec.js'][26]++;
          return rsa.encrypt(p, s, f);
        }
        else {
          _$jscoverage['modules/api_sec.js'][28]++;
          return f("encrypt_bad_algorithm:" + p.params.algorithm, {}, p);
        }
      }
    }
    else {
      _$jscoverage['modules/api_sec.js'][30]++;
      if (p.act === "decrypt") {
        _$jscoverage['modules/api_sec.js'][31]++;
        if (p.params.algorithm === "aes") {
          _$jscoverage['modules/api_sec.js'][32]++;
          return aes.decrypt(p, s, f);
        }
        else {
          _$jscoverage['modules/api_sec.js'][34]++;
          return f("decrypt_bad_algorithm:" + p.params.algorithm, {}, p);
        }
      }
      else {
        _$jscoverage['modules/api_sec.js'][36]++;
        if (p.act === "keygen") {
          _$jscoverage['modules/api_sec.js'][37]++;
          if (p.params.algorithm === "aes") {
            _$jscoverage['modules/api_sec.js'][38]++;
            return keygen(p, s, f);
          }
          else {
            _$jscoverage['modules/api_sec.js'][40]++;
            return f("keygen_bad_algorithm:" + p.params.algorithm, {}, p);
          }
        }
      }
    }
  }
});
_$jscoverage['modules/api_sec.js'].source = ["var keygen = require(\"./security/aes-keygen\");","var aes = require(\"./security/aes-node\");","var rsa = require(\"./security/rsa-node\");","var hash = require(\"./security/hash\");","","module.exports = function(p, s, f){","  if (!p.act) {","    f('bad_act', {}, p);","    return;","  }","  if (!p.params) {","    f('no_params', {}, p);","    return;","  }","  if (!p.params.algorithm) {","    f('no_params_algorithm', {}, p);","    return;","  }","  p.params.algorithm = p.params.algorithm.toLowerCase();","  if(p.act === \"hash\"){","    return hash(p, s, f);","  } else if(p.act === \"encrypt\"){","    if(p.params.algorithm === \"aes\"){","      return aes.encrypt(p, s, f);","    } else if(p.params.algorithm === \"rsa\"){","      return rsa.encrypt(p, s, f);","    } else {","      return f('encrypt_bad_algorithm:' + p.params.algorithm, {}, p);","    }","  } else if(p.act === \"decrypt\"){","    if(p.params.algorithm === \"aes\"){","      return aes.decrypt(p, s, f);","    } else {","      return f('decrypt_bad_algorithm:' + p.params.algorithm, {}, p);","    }","  } else if(p.act === \"keygen\"){","    if(p.params.algorithm === \"aes\"){","      return keygen(p, s, f);","    } else {","      return f('keygen_bad_algorithm:' + p.params.algorithm, {}, p);","    }","  }","}"];

},{"./security/aes-keygen":42,"./security/aes-node":43,"./security/hash":44,"./security/rsa-node":45}],26:[function(require,module,exports){
/* automatically generated by JSCoverage - do not edit */
if (typeof _$jscoverage === 'undefined') _$jscoverage = {};
if (! _$jscoverage['modules/appProps.js']) {
  _$jscoverage['modules/appProps.js'] = [];
  _$jscoverage['modules/appProps.js'][1] = 0;
  _$jscoverage['modules/appProps.js'][2] = 0;
  _$jscoverage['modules/appProps.js'][3] = 0;
  _$jscoverage['modules/appProps.js'][4] = 0;
  _$jscoverage['modules/appProps.js'][6] = 0;
  _$jscoverage['modules/appProps.js'][8] = 0;
  _$jscoverage['modules/appProps.js'][9] = 0;
  _$jscoverage['modules/appProps.js'][10] = 0;
  _$jscoverage['modules/appProps.js'][11] = 0;
  _$jscoverage['modules/appProps.js'][14] = 0;
  _$jscoverage['modules/appProps.js'][15] = 0;
  _$jscoverage['modules/appProps.js'][16] = 0;
  _$jscoverage['modules/appProps.js'][17] = 0;
  _$jscoverage['modules/appProps.js'][18] = 0;
  _$jscoverage['modules/appProps.js'][19] = 0;
  _$jscoverage['modules/appProps.js'][20] = 0;
  _$jscoverage['modules/appProps.js'][21] = 0;
  _$jscoverage['modules/appProps.js'][22] = 0;
  _$jscoverage['modules/appProps.js'][23] = 0;
  _$jscoverage['modules/appProps.js'][26] = 0;
  _$jscoverage['modules/appProps.js'][27] = 0;
  _$jscoverage['modules/appProps.js'][31] = 0;
  _$jscoverage['modules/appProps.js'][33] = 0;
  _$jscoverage['modules/appProps.js'][34] = 0;
  _$jscoverage['modules/appProps.js'][36] = 0;
  _$jscoverage['modules/appProps.js'][38] = 0;
  _$jscoverage['modules/appProps.js'][43] = 0;
  _$jscoverage['modules/appProps.js'][44] = 0;
  _$jscoverage['modules/appProps.js'][46] = 0;
  _$jscoverage['modules/appProps.js'][47] = 0;
  _$jscoverage['modules/appProps.js'][52] = 0;
  _$jscoverage['modules/appProps.js'][53] = 0;
  _$jscoverage['modules/appProps.js'][56] = 0;
  _$jscoverage['modules/appProps.js'][57] = 0;
  _$jscoverage['modules/appProps.js'][60] = 0;
}
_$jscoverage['modules/appProps.js'][1]++;
var consts = require("./constants");
_$jscoverage['modules/appProps.js'][2]++;
var ajax = require("./ajax");
_$jscoverage['modules/appProps.js'][3]++;
var logger = require("./logger");
_$jscoverage['modules/appProps.js'][4]++;
var qs = require("./queryMap");
_$jscoverage['modules/appProps.js'][6]++;
var app_props = null;
_$jscoverage['modules/appProps.js'][8]++;
var load = (function (cb) {
  _$jscoverage['modules/appProps.js'][9]++;
  var doc_url = document.location.href;
  _$jscoverage['modules/appProps.js'][10]++;
  var url_params = qs(doc_url);
  _$jscoverage['modules/appProps.js'][11]++;
  var local = (typeof url_params.url !== "undefined");
  _$jscoverage['modules/appProps.js'][14]++;
  if (local) {
    _$jscoverage['modules/appProps.js'][15]++;
    app_props = {};
    _$jscoverage['modules/appProps.js'][16]++;
    app_props.local = true;
    _$jscoverage['modules/appProps.js'][17]++;
    app_props.host = url_params.url;
    _$jscoverage['modules/appProps.js'][18]++;
    app_props.appid = "000000000000000000000000";
    _$jscoverage['modules/appProps.js'][19]++;
    app_props.appkey = "0000000000000000000000000000000000000000";
    _$jscoverage['modules/appProps.js'][20]++;
    app_props.projectid = "000000000000000000000000";
    _$jscoverage['modules/appProps.js'][21]++;
    app_props.connectiontag = "0.0.1";
    _$jscoverage['modules/appProps.js'][22]++;
    app_props.loglevel = url_params.loglevel;
    _$jscoverage['modules/appProps.js'][23]++;
    return cb(null, app_props);
  }
  _$jscoverage['modules/appProps.js'][26]++;
  var config_url = url_params.fhconfig || consts.config_js;
  _$jscoverage['modules/appProps.js'][27]++;
  ajax({url: config_url, dataType: "json", success: (function (data) {
  _$jscoverage['modules/appProps.js'][31]++;
  logger.debug("fhconfig = " + JSON.stringify(data));
  _$jscoverage['modules/appProps.js'][33]++;
  if (null === data) {
    _$jscoverage['modules/appProps.js'][34]++;
    return cb(new Error("app_config_missing"));
  }
  else {
    _$jscoverage['modules/appProps.js'][36]++;
    app_props = data;
    _$jscoverage['modules/appProps.js'][38]++;
    cb(null, app_props);
  }
}), error: (function (req, statusText, error) {
  _$jscoverage['modules/appProps.js'][43]++;
  if (window.fh_app_props) {
    _$jscoverage['modules/appProps.js'][44]++;
    return cb(null, window.fh_app_props);
  }
  _$jscoverage['modules/appProps.js'][46]++;
  logger.error(consts.config_js + " Not Found");
  _$jscoverage['modules/appProps.js'][47]++;
  cb(new Error("app_config_missing"));
})});
});
_$jscoverage['modules/appProps.js'][52]++;
var setAppProps = (function (props) {
  _$jscoverage['modules/appProps.js'][53]++;
  app_props = props;
});
_$jscoverage['modules/appProps.js'][56]++;
var getAppProps = (function () {
  _$jscoverage['modules/appProps.js'][57]++;
  return app_props;
});
_$jscoverage['modules/appProps.js'][60]++;
module.exports = {load: load, getAppProps: getAppProps, setAppProps: setAppProps};
_$jscoverage['modules/appProps.js'].source = ["var consts = require(\"./constants\");","var ajax = require(\"./ajax\");","var logger = require(\"./logger\");","var qs = require(\"./queryMap\");","","var app_props = null;","","var load = function(cb) {","  var doc_url = document.location.href;","  var url_params = qs(doc_url);","  var local = (typeof url_params.url !== 'undefined');","","  // For local environments, no init needed","  if (local) {","    app_props = {};","    app_props.local = true;","    app_props.host = url_params.url;","    app_props.appid = \"000000000000000000000000\";","    app_props.appkey = \"0000000000000000000000000000000000000000\";","    app_props.projectid = \"000000000000000000000000\";","    app_props.connectiontag = \"0.0.1\";","    app_props.loglevel = url_params.loglevel;","    return cb(null, app_props);","  }","","  var config_url = url_params.fhconfig || consts.config_js;","  ajax({","    url: config_url,","    dataType: \"json\",","    success: function(data) {","      logger.debug(\"fhconfig = \" + JSON.stringify(data));","      //when load the config file on device, because file:// protocol is used, it will never call fail call back. The success callback will be called but the data value will be null.","      if (null === data) {","        return cb(new Error(\"app_config_missing\"));","      } else {","        app_props = data;","","        cb(null, app_props);","      }","    },","    error: function(req, statusText, error) {","      //fh v2 only","      if(window.fh_app_props){","        return cb(null, window.fh_app_props);","      }","      logger.error(consts.config_js + \" Not Found\");","      cb(new Error(\"app_config_missing\"));","    }","  });","};","","var setAppProps = function(props) {","  app_props = props;","};","","var getAppProps = function() {","  return app_props;","};","","module.exports = {","  load: load,","  getAppProps: getAppProps,","  setAppProps: setAppProps","};"];

},{"./ajax":19,"./constants":28,"./logger":38,"./queryMap":40}],27:[function(require,module,exports){
/* automatically generated by JSCoverage - do not edit */
if (typeof _$jscoverage === 'undefined') _$jscoverage = {};
if (! _$jscoverage['modules/checkAuth.js']) {
  _$jscoverage['modules/checkAuth.js'] = [];
  _$jscoverage['modules/checkAuth.js'][1] = 0;
  _$jscoverage['modules/checkAuth.js'][2] = 0;
  _$jscoverage['modules/checkAuth.js'][3] = 0;
  _$jscoverage['modules/checkAuth.js'][4] = 0;
  _$jscoverage['modules/checkAuth.js'][6] = 0;
  _$jscoverage['modules/checkAuth.js'][7] = 0;
  _$jscoverage['modules/checkAuth.js'][8] = 0;
  _$jscoverage['modules/checkAuth.js'][9] = 0;
  _$jscoverage['modules/checkAuth.js'][10] = 0;
  _$jscoverage['modules/checkAuth.js'][11] = 0;
  _$jscoverage['modules/checkAuth.js'][12] = 0;
  _$jscoverage['modules/checkAuth.js'][13] = 0;
  _$jscoverage['modules/checkAuth.js'][14] = 0;
  _$jscoverage['modules/checkAuth.js'][15] = 0;
  _$jscoverage['modules/checkAuth.js'][17] = 0;
  _$jscoverage['modules/checkAuth.js'][24] = 0;
  _$jscoverage['modules/checkAuth.js'][25] = 0;
  _$jscoverage['modules/checkAuth.js'][27] = 0;
  _$jscoverage['modules/checkAuth.js'][28] = 0;
  _$jscoverage['modules/checkAuth.js'][29] = 0;
  _$jscoverage['modules/checkAuth.js'][31] = 0;
  _$jscoverage['modules/checkAuth.js'][35] = 0;
  _$jscoverage['modules/checkAuth.js'][36] = 0;
  _$jscoverage['modules/checkAuth.js'][37] = 0;
  _$jscoverage['modules/checkAuth.js'][38] = 0;
  _$jscoverage['modules/checkAuth.js'][39] = 0;
  _$jscoverage['modules/checkAuth.js'][40] = 0;
  _$jscoverage['modules/checkAuth.js'][42] = 0;
  _$jscoverage['modules/checkAuth.js'][43] = 0;
  _$jscoverage['modules/checkAuth.js'][44] = 0;
  _$jscoverage['modules/checkAuth.js'][45] = 0;
  _$jscoverage['modules/checkAuth.js'][46] = 0;
  _$jscoverage['modules/checkAuth.js'][48] = 0;
  _$jscoverage['modules/checkAuth.js'][49] = 0;
  _$jscoverage['modules/checkAuth.js'][53] = 0;
  _$jscoverage['modules/checkAuth.js'][54] = 0;
  _$jscoverage['modules/checkAuth.js'][59] = 0;
  _$jscoverage['modules/checkAuth.js'][60] = 0;
  _$jscoverage['modules/checkAuth.js'][63] = 0;
  _$jscoverage['modules/checkAuth.js'][64] = 0;
  _$jscoverage['modules/checkAuth.js'][65] = 0;
  _$jscoverage['modules/checkAuth.js'][66] = 0;
  _$jscoverage['modules/checkAuth.js'][69] = 0;
  _$jscoverage['modules/checkAuth.js'][70] = 0;
  _$jscoverage['modules/checkAuth.js'][71] = 0;
  _$jscoverage['modules/checkAuth.js'][72] = 0;
  _$jscoverage['modules/checkAuth.js'][75] = 0;
  _$jscoverage['modules/checkAuth.js'][76] = 0;
  _$jscoverage['modules/checkAuth.js'][80] = 0;
  _$jscoverage['modules/checkAuth.js'][83] = 0;
  _$jscoverage['modules/checkAuth.js'][86] = 0;
  _$jscoverage['modules/checkAuth.js'][87] = 0;
  _$jscoverage['modules/checkAuth.js'][94] = 0;
  _$jscoverage['modules/checkAuth.js'][95] = 0;
  _$jscoverage['modules/checkAuth.js'][96] = 0;
  _$jscoverage['modules/checkAuth.js'][99] = 0;
  _$jscoverage['modules/checkAuth.js'][100] = 0;
  _$jscoverage['modules/checkAuth.js'][104] = 0;
}
_$jscoverage['modules/checkAuth.js'][1]++;
var logger = require("./logger");
_$jscoverage['modules/checkAuth.js'][2]++;
var queryMap = require("./queryMap");
_$jscoverage['modules/checkAuth.js'][3]++;
var JSON = require("JSON");
_$jscoverage['modules/checkAuth.js'][4]++;
var fhparams = require("./fhparams");
_$jscoverage['modules/checkAuth.js'][6]++;
var checkAuth = (function (url) {
  _$jscoverage['modules/checkAuth.js'][7]++;
  if (/\_fhAuthCallback/.test(url)) {
    _$jscoverage['modules/checkAuth.js'][8]++;
    var qmap = queryMap(url);
    _$jscoverage['modules/checkAuth.js'][9]++;
    if (qmap) {
      _$jscoverage['modules/checkAuth.js'][10]++;
      var fhCallback = qmap._fhAuthCallback;
      _$jscoverage['modules/checkAuth.js'][11]++;
      if (fhCallback) {
        _$jscoverage['modules/checkAuth.js'][12]++;
        if (qmap.result && qmap.result === "success") {
          _$jscoverage['modules/checkAuth.js'][13]++;
          var sucRes = {"sessionToken": qmap.fh_auth_session, "authResponse": JSON.parse(decodeURIComponent(decodeURIComponent(qmap.authResponse)))};
          _$jscoverage['modules/checkAuth.js'][14]++;
          fhparams.setAuthSessionToken(qmap.fh_auth_session);
          _$jscoverage['modules/checkAuth.js'][15]++;
          window[fhCallback](null, sucRes);
        }
        else {
          _$jscoverage['modules/checkAuth.js'][17]++;
          window[fhCallback]({"message": qmap.message});
        }
      }
    }
  }
});
_$jscoverage['modules/checkAuth.js'][24]++;
var handleAuthResponse = (function (endurl, res, success, fail) {
  _$jscoverage['modules/checkAuth.js'][25]++;
  if (res.status && res.status === "ok") {
    _$jscoverage['modules/checkAuth.js'][27]++;
    var onComplete = (function (res) {
  _$jscoverage['modules/checkAuth.js'][28]++;
  if (res.sessionToken) {
    _$jscoverage['modules/checkAuth.js'][29]++;
    fhparams.setAuthSessionToken(res.sessionToken);
  }
  _$jscoverage['modules/checkAuth.js'][31]++;
  success(res);
});
    _$jscoverage['modules/checkAuth.js'][35]++;
    if (res.url) {
      _$jscoverage['modules/checkAuth.js'][36]++;
      var inappBrowserWindow = null;
      _$jscoverage['modules/checkAuth.js'][37]++;
      var locationChange = (function (new_url) {
  _$jscoverage['modules/checkAuth.js'][38]++;
  if (new_url.indexOf(endurl) > -1) {
    _$jscoverage['modules/checkAuth.js'][39]++;
    if (inappBrowserWindow) {
      _$jscoverage['modules/checkAuth.js'][40]++;
      inappBrowserWindow.close();
    }
    _$jscoverage['modules/checkAuth.js'][42]++;
    var qmap = queryMap(new_url);
    _$jscoverage['modules/checkAuth.js'][43]++;
    if (qmap) {
      _$jscoverage['modules/checkAuth.js'][44]++;
      if (qmap.result && qmap.result === "success") {
        _$jscoverage['modules/checkAuth.js'][45]++;
        var sucRes = {"sessionToken": qmap.fh_auth_session, "authResponse": JSON.parse(decodeURIComponent(decodeURIComponent(qmap.authResponse)))};
        _$jscoverage['modules/checkAuth.js'][46]++;
        onComplete(sucRes);
      }
      else {
        _$jscoverage['modules/checkAuth.js'][48]++;
        if (fail) {
          _$jscoverage['modules/checkAuth.js'][49]++;
          fail("auth_failed", {"message": qmap.message});
        }
      }
    }
    else {
      _$jscoverage['modules/checkAuth.js'][53]++;
      if (fail) {
        _$jscoverage['modules/checkAuth.js'][54]++;
        fail("auth_failed", {"message": qmap.message});
      }
    }
  }
});
      _$jscoverage['modules/checkAuth.js'][59]++;
      if (window.PhoneGap || window.cordova) {
        _$jscoverage['modules/checkAuth.js'][60]++;
        if (window.plugins && window.plugins.childBrowser) {
          _$jscoverage['modules/checkAuth.js'][63]++;
          if (typeof window.plugins.childBrowser.showWebPage === "function") {
            _$jscoverage['modules/checkAuth.js'][64]++;
            window.plugins.childBrowser.onLocationChange = locationChange;
            _$jscoverage['modules/checkAuth.js'][65]++;
            window.plugins.childBrowser.showWebPage(res.url);
            _$jscoverage['modules/checkAuth.js'][66]++;
            inappBrowserWindow = window.plugins.childBrowser;
          }
        }
        else {
          _$jscoverage['modules/checkAuth.js'][69]++;
          try {
            _$jscoverage['modules/checkAuth.js'][70]++;
            inappBrowserWindow = window.open(res.url, "_blank", "location=yes");
            _$jscoverage['modules/checkAuth.js'][71]++;
            inappBrowserWindow.addEventListener("loadstart", (function (ev) {
  _$jscoverage['modules/checkAuth.js'][72]++;
  locationChange(ev.url);
}));
          }
          catch (e) {
            _$jscoverage['modules/checkAuth.js'][75]++;
            logger.info("InAppBrowser plugin is not intalled.");
            _$jscoverage['modules/checkAuth.js'][76]++;
            onComplete(res);
          }
        }
      }
      else {
        _$jscoverage['modules/checkAuth.js'][80]++;
        document.location.href = res.url;
      }
    }
    else {
      _$jscoverage['modules/checkAuth.js'][83]++;
      onComplete(res);
    }
  }
  else {
    _$jscoverage['modules/checkAuth.js'][86]++;
    if (fail) {
      _$jscoverage['modules/checkAuth.js'][87]++;
      fail("auth_failed", res);
    }
  }
});
_$jscoverage['modules/checkAuth.js'][94]++;
if (window.addEventListener) {
  _$jscoverage['modules/checkAuth.js'][95]++;
  window.addEventListener("load", (function () {
  _$jscoverage['modules/checkAuth.js'][96]++;
  checkAuth(window.location.href);
}), false);
}
else {
  _$jscoverage['modules/checkAuth.js'][99]++;
  window.attachEvent("onload", (function () {
  _$jscoverage['modules/checkAuth.js'][100]++;
  checkAuth(window.location.href);
}));
}
_$jscoverage['modules/checkAuth.js'][104]++;
module.exports = {"handleAuthResponse": handleAuthResponse};
_$jscoverage['modules/checkAuth.js'].source = ["var logger = require(\"./logger\");","var queryMap = require(\"./queryMap\");","var JSON = require(\"JSON\");","var fhparams = require(\"./fhparams\");","","var checkAuth = function(url) {","  if (/\\_fhAuthCallback/.test(url)) {","    var qmap = queryMap(url);","    if (qmap) {","      var fhCallback = qmap[\"_fhAuthCallback\"];","      if (fhCallback) {","        if (qmap['result'] &amp;&amp; qmap['result'] === 'success') {","          var sucRes = {'sessionToken': qmap['fh_auth_session'], 'authResponse' : JSON.parse(decodeURIComponent(decodeURIComponent(qmap['authResponse'])))};","          fhparams.setAuthSessionToken(qmap['fh_auth_session']);","          window[fhCallback](null, sucRes);","        } else {","          window[fhCallback]({'message':qmap['message']});","        }","      }","    }","  }","};","","var handleAuthResponse = function(endurl, res, success, fail){","  if(res.status &amp;&amp; res.status === \"ok\"){","","    var onComplete = function(res){","      if(res.sessionToken){","        fhparams.setAuthSessionToken(res.sessionToken);","      }","      success(res);","    };","    //for OAuth, a url will be returned which means the user should be directed to that url to authenticate.","    //we try to use the ChildBrower plugin if it can be found. Otherwise send the url to the success function to allow developer to handle it.","    if(res.url){","      var inappBrowserWindow = null;","      var locationChange = function(new_url){","        if(new_url.indexOf(endurl) &gt; -1){","          if(inappBrowserWindow){","            inappBrowserWindow.close();","          }","          var qmap = queryMap(new_url);","          if(qmap) {","            if(qmap['result'] &amp;&amp; qmap['result'] === 'success'){","              var sucRes = {'sessionToken': qmap['fh_auth_session'], 'authResponse' : JSON.parse(decodeURIComponent(decodeURIComponent(qmap['authResponse'])))};","              onComplete(sucRes);","            } else {","              if(fail){","                fail(\"auth_failed\", {'message':qmap['message']});","              }","            }","          } else {","            if(fail){","                fail(\"auth_failed\", {'message':qmap['message']});","            }","          }","        }","      };","      if(window.PhoneGap || window.cordova){","        if(window.plugins &amp;&amp; window.plugins.childBrowser){","          //found childbrowser plugin,add the event listener and load it","          //we need to know when the OAuth process is finished by checking for the presence of endurl. If the endurl is found, it means the authentication finished and we should find if it's successful.","          if(typeof window.plugins.childBrowser.showWebPage === \"function\"){","            window.plugins.childBrowser.onLocationChange = locationChange;","            window.plugins.childBrowser.showWebPage(res.url);","            inappBrowserWindow = window.plugins.childBrowser;","          }","        } else {","          try {","            inappBrowserWindow = window.open(res.url, \"_blank\", 'location=yes');","            inappBrowserWindow.addEventListener(\"loadstart\", function(ev){","              locationChange(ev.url);","            });","          } catch(e){","            logger.info(\"InAppBrowser plugin is not intalled.\");","            onComplete(res);","          }","        }","      } else {","       document.location.href = res.url;","      }","    } else {","      onComplete(res);","    }","  } else {","    if(fail){","      fail(\"auth_failed\", res);","    }","  }","};","","//This is mainly for using $fh.auth inside browsers. If the authentication method is OAuth, at the end of the process, the user will be re-directed to","//a url that we specified for checking if the auth is successful. So we always check the url to see if we are on the re-directed page.","if (window.addEventListener) {","  window.addEventListener('load', function(){","    checkAuth(window.location.href);","  }, false); //W3C","} else {","  window.attachEvent('onload', function(){","    checkAuth(window.location.href);","  }); //IE","}","","module.exports = {","  \"handleAuthResponse\": handleAuthResponse","};"];

},{"./fhparams":32,"./logger":38,"./queryMap":40,"JSON":3}],28:[function(require,module,exports){
/* automatically generated by JSCoverage - do not edit */
if (typeof _$jscoverage === 'undefined') _$jscoverage = {};
if (! _$jscoverage['modules/constants.js']) {
  _$jscoverage['modules/constants.js'] = [];
  _$jscoverage['modules/constants.js'][1] = 0;
}
_$jscoverage['modules/constants.js'][1]++;
module.exports = {"fh_timeout": 20000, "boxprefix": "/box/srv/1.1/", "sdk_version": "BUILD_VERSION", "config_js": "fhconfig.json", "INIT_EVENT": "fhinit"};
_$jscoverage['modules/constants.js'].source = ["module.exports = {","  \"fh_timeout\": 20000,","  \"boxprefix\": \"/box/srv/1.1/\",","  \"sdk_version\": \"BUILD_VERSION\",","  \"config_js\": \"fhconfig.json\",","  \"INIT_EVENT\": \"fhinit\"","};"];

},{}],29:[function(require,module,exports){
/* automatically generated by JSCoverage - do not edit */
if (typeof _$jscoverage === 'undefined') _$jscoverage = {};
if (! _$jscoverage['modules/cookies.js']) {
  _$jscoverage['modules/cookies.js'] = [];
  _$jscoverage['modules/cookies.js'][1] = 0;
  _$jscoverage['modules/cookies.js'][3] = 0;
  _$jscoverage['modules/cookies.js'][4] = 0;
  _$jscoverage['modules/cookies.js'][5] = 0;
  _$jscoverage['modules/cookies.js'][6] = 0;
  _$jscoverage['modules/cookies.js'][7] = 0;
  _$jscoverage['modules/cookies.js'][8] = 0;
  _$jscoverage['modules/cookies.js'][10] = 0;
  _$jscoverage['modules/cookies.js'][11] = 0;
  _$jscoverage['modules/cookies.js'][14] = 0;
  _$jscoverage['modules/cookies.js'][18] = 0;
  _$jscoverage['modules/cookies.js'][19] = 0;
  _$jscoverage['modules/cookies.js'][20] = 0;
  _$jscoverage['modules/cookies.js'][21] = 0;
}
_$jscoverage['modules/cookies.js'][1]++;
module.exports = {readCookieValue: (function (cookie_name) {
  _$jscoverage['modules/cookies.js'][3]++;
  var name_str = cookie_name + "=";
  _$jscoverage['modules/cookies.js'][4]++;
  var cookies = document.cookie.split(";");
  _$jscoverage['modules/cookies.js'][5]++;
  for (var i = 0; i < cookies.length; i++) {
    _$jscoverage['modules/cookies.js'][6]++;
    var c = cookies[i];
    _$jscoverage['modules/cookies.js'][7]++;
    while (c.charAt(0) === " ") {
      _$jscoverage['modules/cookies.js'][8]++;
      c = c.substring(1, c.length);
}
    _$jscoverage['modules/cookies.js'][10]++;
    if (c.indexOf(name_str) === 0) {
      _$jscoverage['modules/cookies.js'][11]++;
      return c.substring(name_str.length, c.length);
    }
}
  _$jscoverage['modules/cookies.js'][14]++;
  return null;
}), createCookie: (function (cookie_name, cookie_value) {
  _$jscoverage['modules/cookies.js'][18]++;
  var date = new Date();
  _$jscoverage['modules/cookies.js'][19]++;
  date.setTime(date.getTime() + 3153600000000);
  _$jscoverage['modules/cookies.js'][20]++;
  var expires = "; expires=" + date.toGMTString();
  _$jscoverage['modules/cookies.js'][21]++;
  document.cookie = cookie_name + "=" + cookie_value + expires + "; path = /";
})};
_$jscoverage['modules/cookies.js'].source = ["module.exports = {","  readCookieValue  : function (cookie_name) {","    var name_str = cookie_name + \"=\";","    var cookies = document.cookie.split(\";\");","    for (var i = 0; i &lt; cookies.length; i++) {","      var c = cookies[i];","      while (c.charAt(0) === ' ') {","        c = c.substring(1, c.length);","      }","      if (c.indexOf(name_str) === 0) {","        return c.substring(name_str.length, c.length);","      }","    }","    return null;","  },","","  createCookie : function (cookie_name, cookie_value) {","    var date = new Date();","    date.setTime(date.getTime() + 36500 * 24 * 60 * 60 * 1000); //100 years","    var expires = \"; expires=\" + date.toGMTString();","    document.cookie = cookie_name + \"=\" + cookie_value + expires + \"; path = /\";","  }","};"];

},{}],30:[function(require,module,exports){
/* automatically generated by JSCoverage - do not edit */
if (typeof _$jscoverage === 'undefined') _$jscoverage = {};
if (! _$jscoverage['modules/device.js']) {
  _$jscoverage['modules/device.js'] = [];
  _$jscoverage['modules/device.js'][1] = 0;
  _$jscoverage['modules/device.js'][2] = 0;
  _$jscoverage['modules/device.js'][3] = 0;
  _$jscoverage['modules/device.js'][5] = 0;
  _$jscoverage['modules/device.js'][9] = 0;
  _$jscoverage['modules/device.js'][10] = 0;
  _$jscoverage['modules/device.js'][11] = 0;
  _$jscoverage['modules/device.js'][12] = 0;
  _$jscoverage['modules/device.js'][13] = 0;
  _$jscoverage['modules/device.js'][14] = 0;
  _$jscoverage['modules/device.js'][16] = 0;
  _$jscoverage['modules/device.js'][17] = 0;
  _$jscoverage['modules/device.js'][18] = 0;
  _$jscoverage['modules/device.js'][19] = 0;
  _$jscoverage['modules/device.js'][20] = 0;
  _$jscoverage['modules/device.js'][22] = 0;
  _$jscoverage['modules/device.js'][28] = 0;
  _$jscoverage['modules/device.js'][29] = 0;
  _$jscoverage['modules/device.js'][30] = 0;
  _$jscoverage['modules/device.js'][31] = 0;
  _$jscoverage['modules/device.js'][32] = 0;
  _$jscoverage['modules/device.js'][33] = 0;
  _$jscoverage['modules/device.js'][36] = 0;
  _$jscoverage['modules/device.js'][40] = 0;
  _$jscoverage['modules/device.js'][41] = 0;
  _$jscoverage['modules/device.js'][44] = 0;
  _$jscoverage['modules/device.js'][46] = 0;
  _$jscoverage['modules/device.js'][47] = 0;
  _$jscoverage['modules/device.js'][48] = 0;
  _$jscoverage['modules/device.js'][49] = 0;
  _$jscoverage['modules/device.js'][50] = 0;
  _$jscoverage['modules/device.js'][52] = 0;
  _$jscoverage['modules/device.js'][53] = 0;
  _$jscoverage['modules/device.js'][54] = 0;
  _$jscoverage['modules/device.js'][55] = 0;
  _$jscoverage['modules/device.js'][61] = 0;
  _$jscoverage['modules/device.js'][62] = 0;
  _$jscoverage['modules/device.js'][65] = 0;
  _$jscoverage['modules/device.js'][67] = 0;
}
_$jscoverage['modules/device.js'][1]++;
var cookies = require("./cookies");
_$jscoverage['modules/device.js'][2]++;
var uuidModule = require("./uuid");
_$jscoverage['modules/device.js'][3]++;
var logger = require("./logger");
_$jscoverage['modules/device.js'][5]++;
module.exports = {"getDeviceId": (function () {
  _$jscoverage['modules/device.js'][9]++;
  if (typeof window.fhdevice !== "undefined" && typeof window.fhdevice.uuid !== "undefined") {
    _$jscoverage['modules/device.js'][10]++;
    return window.fhdevice.uuid;
  }
  else {
    _$jscoverage['modules/device.js'][11]++;
    if (typeof window.device !== "undefined" && typeof window.device.uuid !== "undefined") {
      _$jscoverage['modules/device.js'][12]++;
      return window.device.uuid;
    }
    else {
      _$jscoverage['modules/device.js'][13]++;
      if (typeof navigator.device !== "undefined" && typeof navigator.device.uuid !== "undefined") {
        _$jscoverage['modules/device.js'][14]++;
        return navigator.device.uuid;
      }
      else {
        _$jscoverage['modules/device.js'][16]++;
        var _mock_uuid_cookie_name = "mock_uuid";
        _$jscoverage['modules/device.js'][17]++;
        var uuid = cookies.readCookieValue(_mock_uuid_cookie_name);
        _$jscoverage['modules/device.js'][18]++;
        if (null == uuid) {
          _$jscoverage['modules/device.js'][19]++;
          uuid = uuidModule.createUUID();
          _$jscoverage['modules/device.js'][20]++;
          cookies.createCookie(_mock_uuid_cookie_name, uuid);
        }
        _$jscoverage['modules/device.js'][22]++;
        return uuid;
      }
    }
  }
}), "getCuidMap": (function () {
  _$jscoverage['modules/device.js'][28]++;
  if (typeof window.fhdevice !== "undefined" && typeof window.fhdevice.cuidMap !== "undefined") {
    _$jscoverage['modules/device.js'][29]++;
    return window.fhdevice.cuidMap;
  }
  else {
    _$jscoverage['modules/device.js'][30]++;
    if (typeof window.device !== "undefined" && typeof window.device.cuidMap !== "undefined") {
      _$jscoverage['modules/device.js'][31]++;
      return window.device.cuidMap;
    }
    else {
      _$jscoverage['modules/device.js'][32]++;
      if (typeof navigator.device !== "undefined" && typeof navigator.device.cuidMap !== "undefined") {
        _$jscoverage['modules/device.js'][33]++;
        return navigator.device.cuidMap;
      }
    }
  }
  _$jscoverage['modules/device.js'][36]++;
  return null;
}), "getDestination": (function () {
  _$jscoverage['modules/device.js'][40]++;
  var destination = null;
  _$jscoverage['modules/device.js'][41]++;
  var platformsToTest = require("./platformsMap");
  _$jscoverage['modules/device.js'][44]++;
  var userAgent = navigator.userAgent;
  _$jscoverage['modules/device.js'][46]++;
  var dest_override = document.location.search.split("fh_destination_code=");
  _$jscoverage['modules/device.js'][47]++;
  if (dest_override.length > 1) {
    _$jscoverage['modules/device.js'][48]++;
    destination = dest_override[1];
  }
  else {
    _$jscoverage['modules/device.js'][49]++;
    if (typeof window.fh_destination_code !== "undefined") {
      _$jscoverage['modules/device.js'][50]++;
      destination = window.fh_destination_code;
    }
    else {
      _$jscoverage['modules/device.js'][52]++;
      platformsToTest.forEach((function (testDestination) {
  _$jscoverage['modules/device.js'][53]++;
  testDestination.test.forEach((function (destinationTest) {
  _$jscoverage['modules/device.js'][54]++;
  if (userAgent.indexOf(destinationTest) > -1) {
    _$jscoverage['modules/device.js'][55]++;
    destination = testDestination.destination;
  }
}));
}));
    }
  }
  _$jscoverage['modules/device.js'][61]++;
  if (destination == null) {
    _$jscoverage['modules/device.js'][62]++;
    destination = "web";
  }
  _$jscoverage['modules/device.js'][65]++;
  logger.debug("destination = " + destination);
  _$jscoverage['modules/device.js'][67]++;
  return destination;
})};
_$jscoverage['modules/device.js'].source = ["var cookies = require(\"./cookies\");","var uuidModule = require(\"./uuid\");","var logger = require(\"./logger\");","","module.exports = {","  //try to get the unique device identifier","  \"getDeviceId\": function(){","    //check for cordova/phonegap first","    if(typeof window.fhdevice !== \"undefined\" &amp;&amp; typeof window.fhdevice.uuid !== \"undefined\"){","      return window.fhdevice.uuid;","    } else if(typeof window.device !== \"undefined\" &amp;&amp; typeof window.device.uuid !== \"undefined\"){","      return window.device.uuid;","    }  else if(typeof navigator.device !== \"undefined\" &amp;&amp; typeof navigator.device.uuid !== \"undefined\"){","      return navigator.device.uuid;","    } else {","      var _mock_uuid_cookie_name = \"mock_uuid\";","      var uuid = cookies.readCookieValue(_mock_uuid_cookie_name);","      if(null == uuid){","          uuid = uuidModule.createUUID();","          cookies.createCookie(_mock_uuid_cookie_name, uuid);","      }","      return uuid;","    }","  },","","  //this is for fixing analytics issues when upgrading from io6 to ios7. Probably can be deprecated now","  \"getCuidMap\": function(){","    if(typeof window.fhdevice !== \"undefined\" &amp;&amp; typeof window.fhdevice.cuidMap !== \"undefined\"){","      return window.fhdevice.cuidMap;","    } else if(typeof window.device !== \"undefined\" &amp;&amp; typeof window.device.cuidMap !== \"undefined\"){","      return window.device.cuidMap;","    }  else if(typeof navigator.device !== \"undefined\" &amp;&amp; typeof navigator.device.cuidMap !== \"undefined\"){","      return navigator.device.cuidMap;","    }","","    return null;","  },","","  \"getDestination\": function(){","    var destination = null;","    var platformsToTest = require(\"./platformsMap\");","","","    var userAgent = navigator.userAgent;","","    var dest_override = document.location.search.split(\"fh_destination_code=\");","    if (dest_override.length &gt; 1) {","     destination = dest_override[1];","    } else if (typeof window.fh_destination_code !== 'undefined') {","      destination = window.fh_destination_code;","    } else {","      platformsToTest.forEach(function(testDestination){","        testDestination.test.forEach(function(destinationTest){","          if(userAgent.indexOf(destinationTest) &gt; -1){","            destination = testDestination.destination;","          }","        });","      });","    }","","    if(destination == null){ //No user agents were found, set to default web","      destination = \"web\";","    }","","    logger.debug(\"destination = \" + destination);","","    return destination;","  }","}"];

},{"./cookies":29,"./logger":38,"./platformsMap":39,"./uuid":47}],31:[function(require,module,exports){
/* automatically generated by JSCoverage - do not edit */
if (typeof _$jscoverage === 'undefined') _$jscoverage = {};
if (! _$jscoverage['modules/events.js']) {
  _$jscoverage['modules/events.js'] = [];
  _$jscoverage['modules/events.js'][1] = 0;
  _$jscoverage['modules/events.js'][3] = 0;
  _$jscoverage['modules/events.js'][4] = 0;
  _$jscoverage['modules/events.js'][6] = 0;
}
_$jscoverage['modules/events.js'][1]++;
var EventEmitter = require("events").EventEmitter;
_$jscoverage['modules/events.js'][3]++;
var emitter = new EventEmitter();
_$jscoverage['modules/events.js'][4]++;
emitter.setMaxListeners(0);
_$jscoverage['modules/events.js'][6]++;
module.exports = emitter;
_$jscoverage['modules/events.js'].source = ["var EventEmitter = require('events').EventEmitter;","","var emitter = new EventEmitter();","emitter.setMaxListeners(0);","","module.exports = emitter;"];

},{"events":9}],32:[function(require,module,exports){
/* automatically generated by JSCoverage - do not edit */
if (typeof _$jscoverage === 'undefined') _$jscoverage = {};
if (! _$jscoverage['modules/fhparams.js']) {
  _$jscoverage['modules/fhparams.js'] = [];
  _$jscoverage['modules/fhparams.js'][1] = 0;
  _$jscoverage['modules/fhparams.js'][2] = 0;
  _$jscoverage['modules/fhparams.js'][3] = 0;
  _$jscoverage['modules/fhparams.js'][4] = 0;
  _$jscoverage['modules/fhparams.js'][6] = 0;
  _$jscoverage['modules/fhparams.js'][7] = 0;
  _$jscoverage['modules/fhparams.js'][9] = 0;
  _$jscoverage['modules/fhparams.js'][10] = 0;
  _$jscoverage['modules/fhparams.js'][11] = 0;
  _$jscoverage['modules/fhparams.js'][13] = 0;
  _$jscoverage['modules/fhparams.js'][14] = 0;
  _$jscoverage['modules/fhparams.js'][15] = 0;
  _$jscoverage['modules/fhparams.js'][16] = 0;
  _$jscoverage['modules/fhparams.js'][18] = 0;
  _$jscoverage['modules/fhparams.js'][19] = 0;
  _$jscoverage['modules/fhparams.js'][23] = 0;
  _$jscoverage['modules/fhparams.js'][24] = 0;
  _$jscoverage['modules/fhparams.js'][26] = 0;
  _$jscoverage['modules/fhparams.js'][27] = 0;
  _$jscoverage['modules/fhparams.js'][29] = 0;
  _$jscoverage['modules/fhparams.js'][30] = 0;
  _$jscoverage['modules/fhparams.js'][32] = 0;
  _$jscoverage['modules/fhparams.js'][33] = 0;
  _$jscoverage['modules/fhparams.js'][34] = 0;
  _$jscoverage['modules/fhparams.js'][37] = 0;
  _$jscoverage['modules/fhparams.js'][38] = 0;
  _$jscoverage['modules/fhparams.js'][39] = 0;
  _$jscoverage['modules/fhparams.js'][40] = 0;
  _$jscoverage['modules/fhparams.js'][41] = 0;
  _$jscoverage['modules/fhparams.js'][42] = 0;
  _$jscoverage['modules/fhparams.js'][43] = 0;
  _$jscoverage['modules/fhparams.js'][44] = 0;
  _$jscoverage['modules/fhparams.js'][45] = 0;
  _$jscoverage['modules/fhparams.js'][49] = 0;
  _$jscoverage['modules/fhparams.js'][50] = 0;
  _$jscoverage['modules/fhparams.js'][51] = 0;
  _$jscoverage['modules/fhparams.js'][54] = 0;
  _$jscoverage['modules/fhparams.js'][55] = 0;
  _$jscoverage['modules/fhparams.js'][56] = 0;
  _$jscoverage['modules/fhparams.js'][57] = 0;
  _$jscoverage['modules/fhparams.js'][60] = 0;
  _$jscoverage['modules/fhparams.js'][61] = 0;
  _$jscoverage['modules/fhparams.js'][64] = 0;
}
_$jscoverage['modules/fhparams.js'][1]++;
var device = require("./device");
_$jscoverage['modules/fhparams.js'][2]++;
var sdkversion = require("./sdkversion");
_$jscoverage['modules/fhparams.js'][3]++;
var appProps = require("./appProps");
_$jscoverage['modules/fhparams.js'][4]++;
var logger = require("./logger");
_$jscoverage['modules/fhparams.js'][6]++;
var defaultParams = null;
_$jscoverage['modules/fhparams.js'][7]++;
var authSessionToken = null;
_$jscoverage['modules/fhparams.js'][9]++;
var buildFHParams = (function () {
  _$jscoverage['modules/fhparams.js'][10]++;
  if (defaultParams) {
    _$jscoverage['modules/fhparams.js'][11]++;
    return defaultParams;
  }
  _$jscoverage['modules/fhparams.js'][13]++;
  var fhparams = {};
  _$jscoverage['modules/fhparams.js'][14]++;
  fhparams.cuid = device.getDeviceId();
  _$jscoverage['modules/fhparams.js'][15]++;
  fhparams.cuidMap = device.getCuidMap();
  _$jscoverage['modules/fhparams.js'][16]++;
  fhparams.destination = device.getDestination();
  _$jscoverage['modules/fhparams.js'][18]++;
  if (window.device || navigator.device) {
    _$jscoverage['modules/fhparams.js'][19]++;
    fhparams.device = window.device || navigator.device;
  }
  _$jscoverage['modules/fhparams.js'][23]++;
  if (typeof window.fh_app_version !== "undefined") {
    _$jscoverage['modules/fhparams.js'][24]++;
    fhparams.app_version = fh_app_version;
  }
  _$jscoverage['modules/fhparams.js'][26]++;
  if (typeof window.fh_project_version !== "undefined") {
    _$jscoverage['modules/fhparams.js'][27]++;
    fhparams.project_version = fh_project_version;
  }
  _$jscoverage['modules/fhparams.js'][29]++;
  if (typeof window.fh_project_app_version !== "undefined") {
    _$jscoverage['modules/fhparams.js'][30]++;
    fhparams.project_app_version = fh_project_app_version;
  }
  _$jscoverage['modules/fhparams.js'][32]++;
  fhparams.sdk_version = sdkversion();
  _$jscoverage['modules/fhparams.js'][33]++;
  if (authSessionToken) {
    _$jscoverage['modules/fhparams.js'][34]++;
    fhparams.sessionToken = authSessionToken;
  }
  _$jscoverage['modules/fhparams.js'][37]++;
  var app_props = appProps.getAppProps();
  _$jscoverage['modules/fhparams.js'][38]++;
  if (app_props) {
    _$jscoverage['modules/fhparams.js'][39]++;
    fhparams.appid = app_props.appid;
    _$jscoverage['modules/fhparams.js'][40]++;
    fhparams.appkey = app_props.appkey;
    _$jscoverage['modules/fhparams.js'][41]++;
    fhparams.projectid = app_props.projectid;
    _$jscoverage['modules/fhparams.js'][42]++;
    fhparams.analyticsTag = app_props.analyticsTag;
    _$jscoverage['modules/fhparams.js'][43]++;
    fhparams.connectiontag = app_props.connectiontag;
    _$jscoverage['modules/fhparams.js'][44]++;
    if (app_props.init) {
      _$jscoverage['modules/fhparams.js'][45]++;
      fhparams.init = typeof app_props.init === "string"? JSON.parse(app_props.init): app_props.init;
    }
  }
  _$jscoverage['modules/fhparams.js'][49]++;
  defaultParams = fhparams;
  _$jscoverage['modules/fhparams.js'][50]++;
  logger.debug("fhparams = ", defaultParams);
  _$jscoverage['modules/fhparams.js'][51]++;
  return fhparams;
});
_$jscoverage['modules/fhparams.js'][54]++;
var addFHParams = (function (params) {
  _$jscoverage['modules/fhparams.js'][55]++;
  var params = params || {};
  _$jscoverage['modules/fhparams.js'][56]++;
  params.__fh = buildFHParams();
  _$jscoverage['modules/fhparams.js'][57]++;
  return params;
});
_$jscoverage['modules/fhparams.js'][60]++;
var setAuthSessionToken = (function (sessionToken) {
  _$jscoverage['modules/fhparams.js'][61]++;
  authSessionToken = sessionToken;
});
_$jscoverage['modules/fhparams.js'][64]++;
module.exports = {"buildFHParams": buildFHParams, "addFHParams": addFHParams, "setAuthSessionToken": setAuthSessionToken};
_$jscoverage['modules/fhparams.js'].source = ["var device = require(\"./device\");","var sdkversion = require(\"./sdkversion\");","var appProps = require(\"./appProps\");","var logger = require(\"./logger\");","","var defaultParams = null;","var authSessionToken = null;","//TODO: review these options, we probably only needs all of them for init calls, but we shouldn't need all of them for act calls","var buildFHParams = function(){","  if(defaultParams){","    return defaultParams;","  }","  var fhparams = {};","  fhparams.cuid = device.getDeviceId();","  fhparams.cuidMap = device.getCuidMap();","  fhparams.destination = device.getDestination();","  ","  if(window.device || navigator.device){","    fhparams.device = window.device || navigator.device;","  }","","  //backward compatible","  if (typeof window.fh_app_version !== 'undefined'){","    fhparams.app_version = fh_app_version;","  }","  if (typeof window.fh_project_version !== 'undefined'){","    fhparams.project_version = fh_project_version;","  }","  if (typeof window.fh_project_app_version !== 'undefined'){","    fhparams.project_app_version = fh_project_app_version;","  }","  fhparams.sdk_version = sdkversion();","  if(authSessionToken){","    fhparams.sessionToken = authSessionToken;","  }","","  var app_props = appProps.getAppProps();","  if(app_props){","    fhparams.appid = app_props.appid;","    fhparams.appkey = app_props.appkey;","    fhparams.projectid = app_props.projectid;","    fhparams.analyticsTag =  app_props.analyticsTag;","    fhparams.connectiontag = app_props.connectiontag;","    if(app_props.init){","      fhparams.init = typeof(app_props.init) === \"string\" ? JSON.parse(app_props.init) : app_props.init;","    }","  }","  ","  defaultParams = fhparams;","  logger.debug(\"fhparams = \", defaultParams);","  return fhparams;","}","","var addFHParams = function(params){","  var params = params || {};","  params.__fh = buildFHParams();","  return params;","}","","var setAuthSessionToken = function(sessionToken){","  authSessionToken = sessionToken;","}","","module.exports = {","  \"buildFHParams\": buildFHParams,","  \"addFHParams\": addFHParams,","  \"setAuthSessionToken\":setAuthSessionToken","}"];

},{"./appProps":26,"./device":30,"./logger":38,"./sdkversion":41}],33:[function(require,module,exports){
/* automatically generated by JSCoverage - do not edit */
if (typeof _$jscoverage === 'undefined') _$jscoverage = {};
if (! _$jscoverage['modules/handleError.js']) {
  _$jscoverage['modules/handleError.js'] = [];
  _$jscoverage['modules/handleError.js'][1] = 0;
  _$jscoverage['modules/handleError.js'][3] = 0;
  _$jscoverage['modules/handleError.js'][4] = 0;
  _$jscoverage['modules/handleError.js'][5] = 0;
  _$jscoverage['modules/handleError.js'][6] = 0;
  _$jscoverage['modules/handleError.js'][7] = 0;
  _$jscoverage['modules/handleError.js'][8] = 0;
  _$jscoverage['modules/handleError.js'][9] = 0;
  _$jscoverage['modules/handleError.js'][10] = 0;
  _$jscoverage['modules/handleError.js'][11] = 0;
  _$jscoverage['modules/handleError.js'][12] = 0;
  _$jscoverage['modules/handleError.js'][15] = 0;
  _$jscoverage['modules/handleError.js'][18] = 0;
  _$jscoverage['modules/handleError.js'][19] = 0;
}
_$jscoverage['modules/handleError.js'][1]++;
var JSON = require("JSON");
_$jscoverage['modules/handleError.js'][3]++;
module.exports = (function (fail, req, resStatus, error) {
  _$jscoverage['modules/handleError.js'][4]++;
  var errraw;
  _$jscoverage['modules/handleError.js'][5]++;
  var statusCode = 0;
  _$jscoverage['modules/handleError.js'][6]++;
  if (req) {
    _$jscoverage['modules/handleError.js'][7]++;
    try {
      _$jscoverage['modules/handleError.js'][8]++;
      statusCode = req.status;
      _$jscoverage['modules/handleError.js'][9]++;
      var res = JSON.parse(req.responseText);
      _$jscoverage['modules/handleError.js'][10]++;
      errraw = res.error || res.msg;
      _$jscoverage['modules/handleError.js'][11]++;
      if (errraw instanceof Array) {
        _$jscoverage['modules/handleError.js'][12]++;
        errraw = errraw.join("\n");
      }
    }
    catch (e) {
      _$jscoverage['modules/handleError.js'][15]++;
      errraw = req.responseText;
    }
  }
  _$jscoverage['modules/handleError.js'][18]++;
  if (fail) {
    _$jscoverage['modules/handleError.js'][19]++;
    fail(errraw, {status: statusCode, message: resStatus, error: error});
  }
});
_$jscoverage['modules/handleError.js'].source = ["var JSON = require(\"JSON\");","","module.exports = function(fail, req, resStatus, error){","  var errraw;","  var statusCode = 0;","  if(req){","    try{","      statusCode = req.status;","      var res = JSON.parse(req.responseText);","      errraw = res.error || res.msg;","      if (errraw instanceof Array) {","        errraw = errraw.join('\\n');","      }","    } catch(e){","      errraw = req.responseText;","    }","  }","  if(fail){","    fail(errraw, {","      status: statusCode,","      message: resStatus,","      error: error","    });","  }","};"];

},{"JSON":3}],34:[function(require,module,exports){
/* automatically generated by JSCoverage - do not edit */
if (typeof _$jscoverage === 'undefined') _$jscoverage = {};
if (! _$jscoverage['modules/hosts.js']) {
  _$jscoverage['modules/hosts.js'] = [];
  _$jscoverage['modules/hosts.js'][1] = 0;
  _$jscoverage['modules/hosts.js'][2] = 0;
  _$jscoverage['modules/hosts.js'][4] = 0;
  _$jscoverage['modules/hosts.js'][5] = 0;
  _$jscoverage['modules/hosts.js'][6] = 0;
  _$jscoverage['modules/hosts.js'][7] = 0;
  _$jscoverage['modules/hosts.js'][9] = 0;
  _$jscoverage['modules/hosts.js'][12] = 0;
  _$jscoverage['modules/hosts.js'][13] = 0;
  _$jscoverage['modules/hosts.js'][14] = 0;
  _$jscoverage['modules/hosts.js'][15] = 0;
  _$jscoverage['modules/hosts.js'][17] = 0;
  _$jscoverage['modules/hosts.js'][20] = 0;
  _$jscoverage['modules/hosts.js'][21] = 0;
  _$jscoverage['modules/hosts.js'][22] = 0;
  _$jscoverage['modules/hosts.js'][23] = 0;
  _$jscoverage['modules/hosts.js'][26] = 0;
  _$jscoverage['modules/hosts.js'][27] = 0;
  _$jscoverage['modules/hosts.js'][28] = 0;
  _$jscoverage['modules/hosts.js'][30] = 0;
  _$jscoverage['modules/hosts.js'][31] = 0;
  _$jscoverage['modules/hosts.js'][32] = 0;
  _$jscoverage['modules/hosts.js'][33] = 0;
  _$jscoverage['modules/hosts.js'][35] = 0;
  _$jscoverage['modules/hosts.js'][40] = 0;
  _$jscoverage['modules/hosts.js'][41] = 0;
  _$jscoverage['modules/hosts.js'][43] = 0;
  _$jscoverage['modules/hosts.js'][44] = 0;
  _$jscoverage['modules/hosts.js'][45] = 0;
  _$jscoverage['modules/hosts.js'][47] = 0;
  _$jscoverage['modules/hosts.js'][50] = 0;
  _$jscoverage['modules/hosts.js'][51] = 0;
  _$jscoverage['modules/hosts.js'][52] = 0;
  _$jscoverage['modules/hosts.js'][53] = 0;
  _$jscoverage['modules/hosts.js'][55] = 0;
  _$jscoverage['modules/hosts.js'][59] = 0;
  _$jscoverage['modules/hosts.js'][60] = 0;
  _$jscoverage['modules/hosts.js'][61] = 0;
  _$jscoverage['modules/hosts.js'][62] = 0;
  _$jscoverage['modules/hosts.js'][64] = 0;
  _$jscoverage['modules/hosts.js'][65] = 0;
  _$jscoverage['modules/hosts.js'][67] = 0;
  _$jscoverage['modules/hosts.js'][71] = 0;
  _$jscoverage['modules/hosts.js'][72] = 0;
  _$jscoverage['modules/hosts.js'][73] = 0;
  _$jscoverage['modules/hosts.js'][74] = 0;
  _$jscoverage['modules/hosts.js'][76] = 0;
  _$jscoverage['modules/hosts.js'][79] = 0;
  _$jscoverage['modules/hosts.js'][80] = 0;
  _$jscoverage['modules/hosts.js'][81] = 0;
  _$jscoverage['modules/hosts.js'][82] = 0;
  _$jscoverage['modules/hosts.js'][84] = 0;
  _$jscoverage['modules/hosts.js'][89] = 0;
}
_$jscoverage['modules/hosts.js'][1]++;
var constants = require("./constants");
_$jscoverage['modules/hosts.js'][2]++;
var appProps = require("./appProps");
_$jscoverage['modules/hosts.js'][4]++;
function removeEndSlash(input) {
  _$jscoverage['modules/hosts.js'][5]++;
  var ret = input;
  _$jscoverage['modules/hosts.js'][6]++;
  if (ret.charAt(ret.length - 1) === "/") {
    _$jscoverage['modules/hosts.js'][7]++;
    ret = ret.substring(0, ret.length - 1);
  }
  _$jscoverage['modules/hosts.js'][9]++;
  return ret;
}
_$jscoverage['modules/hosts.js'][12]++;
function removeStartSlash(input) {
  _$jscoverage['modules/hosts.js'][13]++;
  var ret = input;
  _$jscoverage['modules/hosts.js'][14]++;
  if (ret.length > 1 && ret.charAt(0) === "/") {
    _$jscoverage['modules/hosts.js'][15]++;
    ret = ret.substring(1, ret.length);
  }
  _$jscoverage['modules/hosts.js'][17]++;
  return ret;
}
_$jscoverage['modules/hosts.js'][20]++;
function CloudHost(cloud_props) {
  _$jscoverage['modules/hosts.js'][21]++;
  this.cloud_props = cloud_props;
  _$jscoverage['modules/hosts.js'][22]++;
  this.cloud_host = undefined;
  _$jscoverage['modules/hosts.js'][23]++;
  this.isLegacy = false;
}
_$jscoverage['modules/hosts.js'][26]++;
CloudHost.prototype.getHost = (function (appType) {
  _$jscoverage['modules/hosts.js'][27]++;
  if (this.cloud_host) {
    _$jscoverage['modules/hosts.js'][28]++;
    return this.cloud_host;
  }
  else {
    _$jscoverage['modules/hosts.js'][30]++;
    var url;
    _$jscoverage['modules/hosts.js'][31]++;
    var app_type;
    _$jscoverage['modules/hosts.js'][32]++;
    if (this.cloud_props && this.cloud_props.hosts) {
      _$jscoverage['modules/hosts.js'][33]++;
      url = this.cloud_props.hosts.url;
      _$jscoverage['modules/hosts.js'][35]++;
      if (typeof url === "undefined") {
        _$jscoverage['modules/hosts.js'][40]++;
        var cloud_host = this.cloud_props.hosts.releaseCloudUrl;
        _$jscoverage['modules/hosts.js'][41]++;
        app_type = this.cloud_props.hosts.releaseCloudType;
        _$jscoverage['modules/hosts.js'][43]++;
        if (typeof appType !== "undefined" && appType.indexOf("dev") > -1) {
          _$jscoverage['modules/hosts.js'][44]++;
          cloud_host = this.cloud_props.hosts.debugCloudUrl;
          _$jscoverage['modules/hosts.js'][45]++;
          app_type = this.cloud_props.hosts.debugCloudType;
        }
        _$jscoverage['modules/hosts.js'][47]++;
        url = cloud_host;
      }
    }
    _$jscoverage['modules/hosts.js'][50]++;
    url = removeEndSlash(url);
    _$jscoverage['modules/hosts.js'][51]++;
    this.cloud_host = url;
    _$jscoverage['modules/hosts.js'][52]++;
    if (app_type === "fh") {
      _$jscoverage['modules/hosts.js'][53]++;
      this.isLegacy = true;
    }
    _$jscoverage['modules/hosts.js'][55]++;
    return url;
  }
});
_$jscoverage['modules/hosts.js'][59]++;
CloudHost.prototype.getActUrl = (function (act) {
  _$jscoverage['modules/hosts.js'][60]++;
  var app_props = appProps.getAppProps() || {};
  _$jscoverage['modules/hosts.js'][61]++;
  if (typeof this.cloud_host === "undefined") {
    _$jscoverage['modules/hosts.js'][62]++;
    this.getHost(app_props.mode);
  }
  _$jscoverage['modules/hosts.js'][64]++;
  if (this.isLegacy) {
    _$jscoverage['modules/hosts.js'][65]++;
    return this.cloud_host + constants.boxprefix + "act/" + this.cloud_props.domain + "/" + app_props.appid + "/" + act + "/" + app_props.appid;
  }
  else {
    _$jscoverage['modules/hosts.js'][67]++;
    return this.cloud_host + "/cloud/" + act;
  }
});
_$jscoverage['modules/hosts.js'][71]++;
CloudHost.prototype.getMBAASUrl = (function (service) {
  _$jscoverage['modules/hosts.js'][72]++;
  var app_props = appProps.getAppProps() || {};
  _$jscoverage['modules/hosts.js'][73]++;
  if (typeof this.cloud_host === "undefined") {
    _$jscoverage['modules/hosts.js'][74]++;
    this.getHost(app_props.mode);
  }
  _$jscoverage['modules/hosts.js'][76]++;
  return this.cloud_host + "/mbaas/" + service;
});
_$jscoverage['modules/hosts.js'][79]++;
CloudHost.prototype.getCloudUrl = (function (path) {
  _$jscoverage['modules/hosts.js'][80]++;
  var app_props = appProps.getAppProps() || {};
  _$jscoverage['modules/hosts.js'][81]++;
  if (typeof this.cloud_host === "undefined") {
    _$jscoverage['modules/hosts.js'][82]++;
    this.getHost(app_props.mode);
  }
  _$jscoverage['modules/hosts.js'][84]++;
  return this.cloud_host + "/" + removeStartSlash(path);
});
_$jscoverage['modules/hosts.js'][89]++;
module.exports = CloudHost;
_$jscoverage['modules/hosts.js'].source = ["var constants = require(\"./constants\");","var appProps = require(\"./appProps\");","","function removeEndSlash(input){","  var ret = input;","  if(ret.charAt(ret.length - 1) === \"/\"){","    ret = ret.substring(0, ret.length-1);","  }","  return ret;","}","","function removeStartSlash(input){","  var ret = input;","  if(ret.length &gt; 1 &amp;&amp; ret.charAt(0) === \"/\"){","    ret = ret.substring(1, ret.length);","  }","  return ret;","}","","function CloudHost(cloud_props){","  this.cloud_props = cloud_props;","  this.cloud_host = undefined;","  this.isLegacy = false;","}","","CloudHost.prototype.getHost = function(appType){","  if(this.cloud_host){","    return this.cloud_host;","  } else {","    var url;","    var app_type;","    if(this.cloud_props &amp;&amp; this.cloud_props.hosts){","      url = this.cloud_props.hosts.url;","","      if (typeof url === 'undefined') {","        // resolve url the old way i.e. depending on","        // -burnt in app mode","        // -returned dev or live url","        // -returned dev or live type (node or fh(rhino or proxying))","        var cloud_host = this.cloud_props.hosts.releaseCloudUrl;","        app_type = this.cloud_props.hosts.releaseCloudType;","","        if(typeof appType !== \"undefined\" &amp;&amp; appType.indexOf(\"dev\") &gt; -1){","          cloud_host = this.cloud_props.hosts.debugCloudUrl;","          app_type = this.cloud_props.hosts.debugCloudType;","        }","        url = cloud_host;","      }","    }","    url = removeEndSlash(url);","    this.cloud_host = url;","    if(app_type === \"fh\"){","      this.isLegacy = true;","    }","    return url;","  }","}","","CloudHost.prototype.getActUrl = function(act){","  var app_props = appProps.getAppProps() || {};","  if(typeof this.cloud_host === \"undefined\"){","    this.getHost(app_props.mode);","  }","  if(this.isLegacy){","    return this.cloud_host + constants.boxprefix + \"act/\" + this.cloud_props.domain + \"/\" + app_props.appid + \"/\" + act + \"/\" + app_props.appid;","  } else {","    return this.cloud_host + \"/cloud/\" + act;","  }","}","","CloudHost.prototype.getMBAASUrl = function(service){","  var app_props = appProps.getAppProps() || {};","  if(typeof this.cloud_host === \"undefined\"){","    this.getHost(app_props.mode);","  }","  return this.cloud_host + \"/mbaas/\" + service;","}","","CloudHost.prototype.getCloudUrl = function(path){","  var app_props = appProps.getAppProps() || {};","  if(typeof this.cloud_host === \"undefined\"){","    this.getHost(app_props.mode);","  }","  return this.cloud_host + \"/\" + removeStartSlash(path);","}","","","","module.exports = CloudHost;"];

},{"./appProps":26,"./constants":28}],35:[function(require,module,exports){
/* automatically generated by JSCoverage - do not edit */
if (typeof _$jscoverage === 'undefined') _$jscoverage = {};
if (! _$jscoverage['modules/initializer.js']) {
  _$jscoverage['modules/initializer.js'] = [];
  _$jscoverage['modules/initializer.js'][1] = 0;
  _$jscoverage['modules/initializer.js'][2] = 0;
  _$jscoverage['modules/initializer.js'][3] = 0;
  _$jscoverage['modules/initializer.js'][4] = 0;
  _$jscoverage['modules/initializer.js'][5] = 0;
  _$jscoverage['modules/initializer.js'][6] = 0;
  _$jscoverage['modules/initializer.js'][7] = 0;
  _$jscoverage['modules/initializer.js'][8] = 0;
  _$jscoverage['modules/initializer.js'][9] = 0;
  _$jscoverage['modules/initializer.js'][10] = 0;
  _$jscoverage['modules/initializer.js'][11] = 0;
  _$jscoverage['modules/initializer.js'][13] = 0;
  _$jscoverage['modules/initializer.js'][14] = 0;
  _$jscoverage['modules/initializer.js'][15] = 0;
  _$jscoverage['modules/initializer.js'][16] = 0;
  _$jscoverage['modules/initializer.js'][20] = 0;
  _$jscoverage['modules/initializer.js'][21] = 0;
  _$jscoverage['modules/initializer.js'][22] = 0;
  _$jscoverage['modules/initializer.js'][25] = 0;
  _$jscoverage['modules/initializer.js'][26] = 0;
  _$jscoverage['modules/initializer.js'][43] = 0;
  _$jscoverage['modules/initializer.js'][50] = 0;
  _$jscoverage['modules/initializer.js'][54] = 0;
  _$jscoverage['modules/initializer.js'][58] = 0;
  _$jscoverage['modules/initializer.js'][59] = 0;
  _$jscoverage['modules/initializer.js'][63] = 0;
  _$jscoverage['modules/initializer.js'][64] = 0;
  _$jscoverage['modules/initializer.js'][65] = 0;
  _$jscoverage['modules/initializer.js'][69] = 0;
  _$jscoverage['modules/initializer.js'][70] = 0;
  _$jscoverage['modules/initializer.js'][73] = 0;
  _$jscoverage['modules/initializer.js'][75] = 0;
  _$jscoverage['modules/initializer.js'][76] = 0;
  _$jscoverage['modules/initializer.js'][77] = 0;
  _$jscoverage['modules/initializer.js'][78] = 0;
  _$jscoverage['modules/initializer.js'][79] = 0;
  _$jscoverage['modules/initializer.js'][80] = 0;
  _$jscoverage['modules/initializer.js'][81] = 0;
  _$jscoverage['modules/initializer.js'][84] = 0;
  _$jscoverage['modules/initializer.js'][86] = 0;
  _$jscoverage['modules/initializer.js'][87] = 0;
  _$jscoverage['modules/initializer.js'][90] = 0;
  _$jscoverage['modules/initializer.js'][92] = 0;
  _$jscoverage['modules/initializer.js'][101] = 0;
  _$jscoverage['modules/initializer.js'][105] = 0;
  _$jscoverage['modules/initializer.js'][106] = 0;
  _$jscoverage['modules/initializer.js'][113] = 0;
  _$jscoverage['modules/initializer.js'][114] = 0;
  _$jscoverage['modules/initializer.js'][115] = 0;
  _$jscoverage['modules/initializer.js'][120] = 0;
  _$jscoverage['modules/initializer.js'][121] = 0;
  _$jscoverage['modules/initializer.js'][122] = 0;
  _$jscoverage['modules/initializer.js'][134] = 0;
}
_$jscoverage['modules/initializer.js'][1]++;
var loadScript = require("./loadScript");
_$jscoverage['modules/initializer.js'][2]++;
var Lawnchair = require("../../libs/generated/lawnchair");
_$jscoverage['modules/initializer.js'][3]++;
var lawnchairext = require("./lawnchair-ext");
_$jscoverage['modules/initializer.js'][4]++;
var consts = require("./constants");
_$jscoverage['modules/initializer.js'][5]++;
var fhparams = require("./fhparams");
_$jscoverage['modules/initializer.js'][6]++;
var ajax = require("./ajax");
_$jscoverage['modules/initializer.js'][7]++;
var handleError = require("./handleError");
_$jscoverage['modules/initializer.js'][8]++;
var logger = require("./logger");
_$jscoverage['modules/initializer.js'][9]++;
var JSON = require("JSON");
_$jscoverage['modules/initializer.js'][10]++;
var hashFunc = require("./security/hash");
_$jscoverage['modules/initializer.js'][11]++;
var appProps = require("./appProps");
_$jscoverage['modules/initializer.js'][13]++;
var init = (function (cb) {
  _$jscoverage['modules/initializer.js'][14]++;
  appProps.load((function (err, data) {
  _$jscoverage['modules/initializer.js'][15]++;
  if (err) {
    _$jscoverage['modules/initializer.js'][15]++;
    return cb(err);
  }
  _$jscoverage['modules/initializer.js'][16]++;
  return loadCloudProps(data, cb);
}));
});
_$jscoverage['modules/initializer.js'][20]++;
var loadCloudProps = (function (app_props, callback) {
  _$jscoverage['modules/initializer.js'][21]++;
  if (app_props.loglevel) {
    _$jscoverage['modules/initializer.js'][22]++;
    logger.setLevel(app_props.loglevel);
  }
  _$jscoverage['modules/initializer.js'][25]++;
  if (app_props.local) {
    _$jscoverage['modules/initializer.js'][26]++;
    var res = {"domain": "local", "firstTime": false, "hosts": {"debugCloudType": "node", "debugCloudUrl": app_props.host, "releaseCloudType": "node", "releaseCloudUrl": app_props.host, "type": "cloud_nodejs", "url": app_props.host}, "init": {"trackId": "000000000000000000000000"}, "status": "ok"};
    _$jscoverage['modules/initializer.js'][43]++;
    return callback(null, {cloud: res});
  }
  _$jscoverage['modules/initializer.js'][50]++;
  lawnchairext.addAdapter(app_props, hashFunc);
  _$jscoverage['modules/initializer.js'][54]++;
  var lcConf = {name: "fh_init_storage", adapter: ["dom", "webkit-sqlite", "localFileStorage", "window-name"], fail: (function (msg, err) {
  _$jscoverage['modules/initializer.js'][58]++;
  var error_message = "read/save from/to local storage failed  msg:" + msg + " err:" + err;
  _$jscoverage['modules/initializer.js'][59]++;
  return fail(error_message, {});
})};
  _$jscoverage['modules/initializer.js'][63]++;
  var storage = null;
  _$jscoverage['modules/initializer.js'][64]++;
  try {
    _$jscoverage['modules/initializer.js'][65]++;
    storage = new Lawnchair(lcConf, (function () {
}));
  }
  catch (e) {
    _$jscoverage['modules/initializer.js'][69]++;
    lcConf.adapter = undefined;
    _$jscoverage['modules/initializer.js'][70]++;
    storage = new Lawnchair(lcConf, (function () {
}));
  }
  _$jscoverage['modules/initializer.js'][73]++;
  var path = app_props.host + consts.boxprefix + "app/init";
  _$jscoverage['modules/initializer.js'][75]++;
  storage.get("fh_init", (function (storage_res) {
  _$jscoverage['modules/initializer.js'][76]++;
  var savedHost = null;
  _$jscoverage['modules/initializer.js'][77]++;
  if (storage_res && storage_res.value !== null && typeof storage_res.value !== "undefined" && storage_res !== "") {
    _$jscoverage['modules/initializer.js'][78]++;
    storage_res = typeof storage_res === "string"? JSON.parse(storage_res): storage_res;
    _$jscoverage['modules/initializer.js'][79]++;
    storage_res.value = typeof storage_res.value === "string"? JSON.parse(storage_res.value): storage_res.value;
    _$jscoverage['modules/initializer.js'][80]++;
    if (storage_res.value.init) {
      _$jscoverage['modules/initializer.js'][81]++;
      app_props.init = storage_res.value.init;
    }
    else {
      _$jscoverage['modules/initializer.js'][84]++;
      app_props.init = typeof storage_res.value === "string"? JSON.parse(storage_res.value): storage_res.value;
    }
    _$jscoverage['modules/initializer.js'][86]++;
    if (storage_res.value.hosts) {
      _$jscoverage['modules/initializer.js'][87]++;
      savedHost = storage_res.value;
    }
  }
  _$jscoverage['modules/initializer.js'][90]++;
  var data = fhparams.buildFHParams();
  _$jscoverage['modules/initializer.js'][92]++;
  ajax({"url": path, "type": "POST", "tryJSONP": true, "dataType": "json", "contentType": "application/json", "data": JSON.stringify(data), "timeout": app_props.timeout || consts.fh_timeout, "success": (function (initRes) {
  _$jscoverage['modules/initializer.js'][101]++;
  storage.save({key: "fh_init", value: initRes}, (function () {
}));
  _$jscoverage['modules/initializer.js'][105]++;
  if (callback) {
    _$jscoverage['modules/initializer.js'][106]++;
    callback(null, {cloud: initRes});
  }
}), "error": (function (req, statusText, error) {
  _$jscoverage['modules/initializer.js'][113]++;
  if (savedHost) {
    _$jscoverage['modules/initializer.js'][114]++;
    if (callback) {
      _$jscoverage['modules/initializer.js'][115]++;
      callback(null, {cloud: savedHost});
    }
  }
  else {
    _$jscoverage['modules/initializer.js'][120]++;
    handleError((function (msg, err) {
  _$jscoverage['modules/initializer.js'][121]++;
  if (callback) {
    _$jscoverage['modules/initializer.js'][122]++;
    callback({error: err, message: msg});
  }
}), req, statusText, error);
  }
})});
}));
});
_$jscoverage['modules/initializer.js'][134]++;
module.exports = {"init": init, "loadCloudProps": loadCloudProps};
_$jscoverage['modules/initializer.js'].source = ["var loadScript = require(\"./loadScript\");","var Lawnchair = require('../../libs/generated/lawnchair');","var lawnchairext = require('./lawnchair-ext');","var consts = require(\"./constants\");","var fhparams = require(\"./fhparams\");","var ajax = require(\"./ajax\");","var handleError = require(\"./handleError\");","var logger = require(\"./logger\");","var JSON = require(\"JSON\");","var hashFunc = require(\"./security/hash\");","var appProps = require(\"./appProps\");","","var init = function(cb) {","  appProps.load(function(err, data) {","    if (err) return cb(err);","    return loadCloudProps(data, cb);","  });","}","","var loadCloudProps = function(app_props, callback) {","  if(app_props.loglevel){","    logger.setLevel(app_props.loglevel);","  }","  // If local - shortcircuit the init - just return the host","  if (app_props.local) {","    var res = {","      \"domain\": \"local\",","      \"firstTime\": false,","      \"hosts\": {","        \"debugCloudType\": \"node\",","        \"debugCloudUrl\": app_props.host,","        \"releaseCloudType\": \"node\",","        \"releaseCloudUrl\": app_props.host,","        \"type\": \"cloud_nodejs\",","        \"url\": app_props.host","      },","      \"init\": {","        \"trackId\": \"000000000000000000000000\"","      },","      \"status\": \"ok\"","    };","","    return callback(null, {","      cloud: res","    });","  }","","","  //now we have app props, add the fileStorageAdapter","  lawnchairext.addAdapter(app_props, hashFunc);","  //dom adapter doens't work on windows phone, so don't specify the adapter if the dom one failed","  //we specify the order of lawnchair adapters to use, lawnchair will find the right one to use, to keep backward compatibility, keep the order","  //as dom, webkit-sqlite, localFileStorage, window-name","  var lcConf = {","    name: \"fh_init_storage\",","    adapter: [\"dom\", \"webkit-sqlite\", \"localFileStorage\", \"window-name\"],","    fail: function(msg, err) {","      var error_message = 'read/save from/to local storage failed  msg:' + msg + ' err:' + err;","      return fail(error_message, {});","    }","  };","","  var storage = null;","  try {","    storage = new Lawnchair(lcConf, function() {});","  } catch (e) {","    //when dom adapter failed, Lawnchair throws an error","    //shoudn't go in here anymore","    lcConf.adapter = undefined;","    storage = new Lawnchair(lcConf, function() {});","  }","","  var path = app_props.host + consts.boxprefix + \"app/init\";","","  storage.get('fh_init', function(storage_res) {","    var savedHost = null;","    if (storage_res &amp;&amp; storage_res.value !== null &amp;&amp; typeof(storage_res.value) !== \"undefined\" &amp;&amp; storage_res !== \"\") {","      storage_res = typeof(storage_res) === \"string\" ? JSON.parse(storage_res) : storage_res;","      storage_res.value = typeof(storage_res.value) === \"string\" ? JSON.parse(storage_res.value) : storage_res.value;","      if (storage_res.value.init) {","        app_props.init = storage_res.value.init;","      } else {","        //keep it backward compatible.","        app_props.init = typeof(storage_res.value) === \"string\" ? JSON.parse(storage_res.value) : storage_res.value;","      }","      if (storage_res.value.hosts) {","        savedHost = storage_res.value;","      }","    }","    var data = fhparams.buildFHParams();","","    ajax({","      \"url\": path,","      \"type\": \"POST\",","      \"tryJSONP\": true,","      \"dataType\": \"json\",","      \"contentType\": \"application/json\",","      \"data\": JSON.stringify(data),","      \"timeout\": app_props.timeout || consts.fh_timeout,","      \"success\": function(initRes) {","        storage.save({","          key: \"fh_init\",","          value: initRes","        }, function() {});","        if (callback) {","          callback(null, {","            cloud: initRes","          });","        }","      },","      \"error\": function(req, statusText, error) {","        //use the cached host if we have a copy","        if (savedHost) {","          if (callback) {","            callback(null, {","              cloud: savedHost","            });","          }","        } else {","          handleError(function(msg, err) {","            if (callback) {","              callback({","                error: err,","                message: msg","              });","            }","          }, req, statusText, error);","        }","      }","    });","  });","};","","module.exports = {","  \"init\": init,","  \"loadCloudProps\": loadCloudProps","}"];

},{"../../libs/generated/lawnchair":2,"./ajax":19,"./appProps":26,"./constants":28,"./fhparams":32,"./handleError":33,"./lawnchair-ext":36,"./loadScript":37,"./logger":38,"./security/hash":44,"JSON":3}],36:[function(require,module,exports){
/* automatically generated by JSCoverage - do not edit */
if (typeof _$jscoverage === 'undefined') _$jscoverage = {};
if (! _$jscoverage['modules/lawnchair-ext.js']) {
  _$jscoverage['modules/lawnchair-ext.js'] = [];
  _$jscoverage['modules/lawnchair-ext.js'][1] = 0;
  _$jscoverage['modules/lawnchair-ext.js'][3] = 0;
  _$jscoverage['modules/lawnchair-ext.js'][6] = 0;
  _$jscoverage['modules/lawnchair-ext.js'][7] = 0;
  _$jscoverage['modules/lawnchair-ext.js'][8] = 0;
  _$jscoverage['modules/lawnchair-ext.js'][12] = 0;
  _$jscoverage['modules/lawnchair-ext.js'][13] = 0;
  _$jscoverage['modules/lawnchair-ext.js'][14] = 0;
  _$jscoverage['modules/lawnchair-ext.js'][18] = 0;
  _$jscoverage['modules/lawnchair-ext.js'][19] = 0;
  _$jscoverage['modules/lawnchair-ext.js'][21] = 0;
  _$jscoverage['modules/lawnchair-ext.js'][25] = 0;
  _$jscoverage['modules/lawnchair-ext.js'][26] = 0;
  _$jscoverage['modules/lawnchair-ext.js'][27] = 0;
  _$jscoverage['modules/lawnchair-ext.js'][28] = 0;
  _$jscoverage['modules/lawnchair-ext.js'][29] = 0;
  _$jscoverage['modules/lawnchair-ext.js'][30] = 0;
  _$jscoverage['modules/lawnchair-ext.js'][31] = 0;
  _$jscoverage['modules/lawnchair-ext.js'][32] = 0;
  _$jscoverage['modules/lawnchair-ext.js'][34] = 0;
  _$jscoverage['modules/lawnchair-ext.js'][36] = 0;
  _$jscoverage['modules/lawnchair-ext.js'][37] = 0;
  _$jscoverage['modules/lawnchair-ext.js'][39] = 0;
  _$jscoverage['modules/lawnchair-ext.js'][42] = 0;
  _$jscoverage['modules/lawnchair-ext.js'][43] = 0;
  _$jscoverage['modules/lawnchair-ext.js'][48] = 0;
  _$jscoverage['modules/lawnchair-ext.js'][50] = 0;
  _$jscoverage['modules/lawnchair-ext.js'][54] = 0;
  _$jscoverage['modules/lawnchair-ext.js'][55] = 0;
  _$jscoverage['modules/lawnchair-ext.js'][59] = 0;
  _$jscoverage['modules/lawnchair-ext.js'][63] = 0;
  _$jscoverage['modules/lawnchair-ext.js'][64] = 0;
  _$jscoverage['modules/lawnchair-ext.js'][65] = 0;
  _$jscoverage['modules/lawnchair-ext.js'][66] = 0;
  _$jscoverage['modules/lawnchair-ext.js'][68] = 0;
  _$jscoverage['modules/lawnchair-ext.js'][71] = 0;
  _$jscoverage['modules/lawnchair-ext.js'][72] = 0;
  _$jscoverage['modules/lawnchair-ext.js'][73] = 0;
  _$jscoverage['modules/lawnchair-ext.js'][78] = 0;
  _$jscoverage['modules/lawnchair-ext.js'][80] = 0;
  _$jscoverage['modules/lawnchair-ext.js'][83] = 0;
  _$jscoverage['modules/lawnchair-ext.js'][86] = 0;
  _$jscoverage['modules/lawnchair-ext.js'][92] = 0;
  _$jscoverage['modules/lawnchair-ext.js'][96] = 0;
  _$jscoverage['modules/lawnchair-ext.js'][97] = 0;
  _$jscoverage['modules/lawnchair-ext.js'][98] = 0;
  _$jscoverage['modules/lawnchair-ext.js'][99] = 0;
  _$jscoverage['modules/lawnchair-ext.js'][100] = 0;
  _$jscoverage['modules/lawnchair-ext.js'][101] = 0;
  _$jscoverage['modules/lawnchair-ext.js'][102] = 0;
  _$jscoverage['modules/lawnchair-ext.js'][105] = 0;
  _$jscoverage['modules/lawnchair-ext.js'][106] = 0;
  _$jscoverage['modules/lawnchair-ext.js'][111] = 0;
  _$jscoverage['modules/lawnchair-ext.js'][116] = 0;
  _$jscoverage['modules/lawnchair-ext.js'][118] = 0;
  _$jscoverage['modules/lawnchair-ext.js'][122] = 0;
  _$jscoverage['modules/lawnchair-ext.js'][128] = 0;
  _$jscoverage['modules/lawnchair-ext.js'][134] = 0;
  _$jscoverage['modules/lawnchair-ext.js'][135] = 0;
  _$jscoverage['modules/lawnchair-ext.js'][136] = 0;
  _$jscoverage['modules/lawnchair-ext.js'][138] = 0;
  _$jscoverage['modules/lawnchair-ext.js'][140] = 0;
  _$jscoverage['modules/lawnchair-ext.js'][147] = 0;
  _$jscoverage['modules/lawnchair-ext.js'][151] = 0;
  _$jscoverage['modules/lawnchair-ext.js'][153] = 0;
  _$jscoverage['modules/lawnchair-ext.js'][154] = 0;
  _$jscoverage['modules/lawnchair-ext.js'][156] = 0;
  _$jscoverage['modules/lawnchair-ext.js'][157] = 0;
  _$jscoverage['modules/lawnchair-ext.js'][162] = 0;
  _$jscoverage['modules/lawnchair-ext.js'][165] = 0;
  _$jscoverage['modules/lawnchair-ext.js'][168] = 0;
  _$jscoverage['modules/lawnchair-ext.js'][174] = 0;
  _$jscoverage['modules/lawnchair-ext.js'][181] = 0;
  _$jscoverage['modules/lawnchair-ext.js'][182] = 0;
  _$jscoverage['modules/lawnchair-ext.js'][185] = 0;
}
_$jscoverage['modules/lawnchair-ext.js'][1]++;
var Lawnchair = require("../../libs/generated/lawnchair");
_$jscoverage['modules/lawnchair-ext.js'][3]++;
var fileStorageAdapter = (function (app_props, hashFunc) {
  _$jscoverage['modules/lawnchair-ext.js'][6]++;
  function doLog(mess) {
    _$jscoverage['modules/lawnchair-ext.js'][7]++;
    if (console) {
      _$jscoverage['modules/lawnchair-ext.js'][8]++;
      console.log(mess);
    }
}
  _$jscoverage['modules/lawnchair-ext.js'][12]++;
  var fail = (function (e, i) {
  _$jscoverage['modules/lawnchair-ext.js'][13]++;
  if (console) {
    _$jscoverage['modules/lawnchair-ext.js'][13]++;
    console.log("error in file system adapter !", e, i);
  }
  else {
    _$jscoverage['modules/lawnchair-ext.js'][14]++;
    throw e;
  }
});
  _$jscoverage['modules/lawnchair-ext.js'][18]++;
  function filenameForKey(key, cb) {
    _$jscoverage['modules/lawnchair-ext.js'][19]++;
    key = app_props.appid + key;
    _$jscoverage['modules/lawnchair-ext.js'][21]++;
    hashFunc({algorithm: "MD5", text: key}, (function (result) {
  _$jscoverage['modules/lawnchair-ext.js'][25]++;
  var filename = result.hashvalue + ".txt";
  _$jscoverage['modules/lawnchair-ext.js'][26]++;
  if (typeof navigator.externalstorage !== "undefined") {
    _$jscoverage['modules/lawnchair-ext.js'][27]++;
    navigator.externalstorage.enable((function handleSuccess(res) {
  _$jscoverage['modules/lawnchair-ext.js'][28]++;
  var path = filename;
  _$jscoverage['modules/lawnchair-ext.js'][29]++;
  if (res.path) {
    _$jscoverage['modules/lawnchair-ext.js'][30]++;
    path = res.path;
    _$jscoverage['modules/lawnchair-ext.js'][31]++;
    if (! path.match(/\/$/)) {
      _$jscoverage['modules/lawnchair-ext.js'][32]++;
      path += "/";
    }
    _$jscoverage['modules/lawnchair-ext.js'][34]++;
    path += filename;
  }
  _$jscoverage['modules/lawnchair-ext.js'][36]++;
  filename = path;
  _$jscoverage['modules/lawnchair-ext.js'][37]++;
  return cb(filename);
}), (function handleError(err) {
  _$jscoverage['modules/lawnchair-ext.js'][39]++;
  return cb(filename);
}));
  }
  else {
    _$jscoverage['modules/lawnchair-ext.js'][42]++;
    doLog("filenameForKey key=" + key + " , Filename: " + filename);
    _$jscoverage['modules/lawnchair-ext.js'][43]++;
    return cb(filename);
  }
}));
}
  _$jscoverage['modules/lawnchair-ext.js'][48]++;
  return ({valid: (function () {
  _$jscoverage['modules/lawnchair-ext.js'][50]++;
  return ! ! window.requestFileSystem;
}), init: (function (options, callback) {
  _$jscoverage['modules/lawnchair-ext.js'][54]++;
  if (options && "function" === typeof options.fail) {
    _$jscoverage['modules/lawnchair-ext.js'][54]++;
    fail = options.fail;
  }
  _$jscoverage['modules/lawnchair-ext.js'][55]++;
  if (callback) {
    _$jscoverage['modules/lawnchair-ext.js'][55]++;
    this.fn(this.name, callback).call(this, this);
  }
}), keys: (function (callback) {
  _$jscoverage['modules/lawnchair-ext.js'][59]++;
  throw "Currently not supported";
}), save: (function (obj, callback) {
  _$jscoverage['modules/lawnchair-ext.js'][63]++;
  var key = obj.key;
  _$jscoverage['modules/lawnchair-ext.js'][64]++;
  var value = obj.val || obj.value;
  _$jscoverage['modules/lawnchair-ext.js'][65]++;
  filenameForKey(key, (function (hash) {
  _$jscoverage['modules/lawnchair-ext.js'][66]++;
  window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, (function gotFS(fileSystem) {
  _$jscoverage['modules/lawnchair-ext.js'][68]++;
  fileSystem.root.getFile(hash, {create: true}, (function gotFileEntry(fileEntry) {
  _$jscoverage['modules/lawnchair-ext.js'][71]++;
  fileEntry.createWriter((function gotFileWriter(writer) {
  _$jscoverage['modules/lawnchair-ext.js'][72]++;
  writer.onwrite = (function () {
  _$jscoverage['modules/lawnchair-ext.js'][73]++;
  return callback({key: key, val: value});
});
  _$jscoverage['modules/lawnchair-ext.js'][78]++;
  writer.write(value);
}), (function () {
  _$jscoverage['modules/lawnchair-ext.js'][80]++;
  fail("[save] Failed to create file writer");
}));
}), (function () {
  _$jscoverage['modules/lawnchair-ext.js'][83]++;
  fail("[save] Failed to getFile");
}));
}), (function () {
  _$jscoverage['modules/lawnchair-ext.js'][86]++;
  fail("[save] Failed to requestFileSystem");
}));
}));
}), batch: (function (records, callback) {
  _$jscoverage['modules/lawnchair-ext.js'][92]++;
  throw "Currently not supported";
}), get: (function (key, callback) {
  _$jscoverage['modules/lawnchair-ext.js'][96]++;
  filenameForKey(key, (function (hash) {
  _$jscoverage['modules/lawnchair-ext.js'][97]++;
  window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, (function gotFS(fileSystem) {
  _$jscoverage['modules/lawnchair-ext.js'][98]++;
  fileSystem.root.getFile(hash, {}, (function gotFileEntry(fileEntry) {
  _$jscoverage['modules/lawnchair-ext.js'][99]++;
  fileEntry.file((function gotFile(file) {
  _$jscoverage['modules/lawnchair-ext.js'][100]++;
  var reader = new FileReader();
  _$jscoverage['modules/lawnchair-ext.js'][101]++;
  reader.onloadend = (function (evt) {
  _$jscoverage['modules/lawnchair-ext.js'][102]++;
  var text = evt.target.result;
  _$jscoverage['modules/lawnchair-ext.js'][105]++;
  try {
    _$jscoverage['modules/lawnchair-ext.js'][106]++;
    text = decodeURIComponent(text);
  }
  catch (e) {
  }
  _$jscoverage['modules/lawnchair-ext.js'][111]++;
  return callback({key: key, val: text});
});
  _$jscoverage['modules/lawnchair-ext.js'][116]++;
  reader.readAsText(file);
}), (function () {
  _$jscoverage['modules/lawnchair-ext.js'][118]++;
  fail("[load] Failed to getFile");
}));
}), (function () {
  _$jscoverage['modules/lawnchair-ext.js'][122]++;
  callback({key: key, val: null});
}));
}), (function () {
  _$jscoverage['modules/lawnchair-ext.js'][128]++;
  fail("[load] Failed to get fileSystem");
}));
}));
}), exists: (function (key, callback) {
  _$jscoverage['modules/lawnchair-ext.js'][134]++;
  filenameForKey(key, (function (hash) {
  _$jscoverage['modules/lawnchair-ext.js'][135]++;
  window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, (function gotFS(fileSystem) {
  _$jscoverage['modules/lawnchair-ext.js'][136]++;
  fileSystem.root.getFile(hash, {}, (function gotFileEntry(fileEntry) {
  _$jscoverage['modules/lawnchair-ext.js'][138]++;
  return callback(true);
}), (function (err) {
  _$jscoverage['modules/lawnchair-ext.js'][140]++;
  return callback(false);
}));
}));
}));
}), all: (function (callback) {
  _$jscoverage['modules/lawnchair-ext.js'][147]++;
  throw "Currently not supported";
}), remove: (function (key, callback) {
  _$jscoverage['modules/lawnchair-ext.js'][151]++;
  filenameForKey(key, (function (hash) {
  _$jscoverage['modules/lawnchair-ext.js'][153]++;
  window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, (function gotFS(fileSystem) {
  _$jscoverage['modules/lawnchair-ext.js'][154]++;
  fileSystem.root.getFile(hash, {}, (function gotFileEntry(fileEntry) {
  _$jscoverage['modules/lawnchair-ext.js'][156]++;
  fileEntry.remove((function () {
  _$jscoverage['modules/lawnchair-ext.js'][157]++;
  return callback({key: key, val: null});
}), (function () {
  _$jscoverage['modules/lawnchair-ext.js'][162]++;
  fail("[remove] Failed to remove file");
}));
}), (function () {
  _$jscoverage['modules/lawnchair-ext.js'][165]++;
  fail("[remove] Failed to getFile");
}));
}), (function () {
  _$jscoverage['modules/lawnchair-ext.js'][168]++;
  fail("[remove] Failed to get fileSystem");
}));
}));
}), nuke: (function (callback) {
  _$jscoverage['modules/lawnchair-ext.js'][174]++;
  throw "Currently not supported";
})});
});
_$jscoverage['modules/lawnchair-ext.js'][181]++;
var addAdapter = (function (app_props, hashFunc) {
  _$jscoverage['modules/lawnchair-ext.js'][182]++;
  Lawnchair.adapter("localFileStorage", fileStorageAdapter(app_props, hashFunc));
});
_$jscoverage['modules/lawnchair-ext.js'][185]++;
module.exports = {addAdapter: addAdapter};
_$jscoverage['modules/lawnchair-ext.js'].source = ["var Lawnchair = require('../../libs/generated/lawnchair');","","var fileStorageAdapter = function (app_props, hashFunc) {","  // private methods","","  function doLog(mess){","    if(console){","      console.log(mess);","    }","  }","","  var fail = function (e, i) {","    if(console) console.log('error in file system adapter !', e, i);","    else throw e;","  };","","","  function filenameForKey(key, cb) {","    key = app_props.appid + key;","","    hashFunc({","      algorithm: \"MD5\",","      text: key","    }, function(result) {","      var filename = result.hashvalue + '.txt';","      if (typeof navigator.externalstorage !== \"undefined\") {","        navigator.externalstorage.enable(function handleSuccess(res){","          var path = filename;","          if(res.path ) {","            path = res.path;","            if(!path.match(/\\/$/)) {","              path += '/';","            }","            path += filename;","          }","          filename = path;","          return cb(filename);","        },function handleError(err){","          return cb(filename);","        })","      } else {","        doLog('filenameForKey key=' + key+ ' , Filename: ' + filename);","        return cb(filename);","      }","    });","  }","","  return {","","    valid: function () { return !!(window.requestFileSystem) },","","    init : function (options, callback){","      //calls the parent function fn and applies this scope","      if(options &amp;&amp; 'function' === typeof options.fail ) fail = options.fail;","      if (callback) this.fn(this.name, callback).call(this, this);","    },","","    keys: function (callback){","      throw \"Currently not supported\";","    },","","    save : function (obj, callback){","      var key = obj.key;","      var value = obj.val||obj.value;","      filenameForKey(key, function(hash) {","        window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function gotFS(fileSystem) {","","          fileSystem.root.getFile(hash, {","            create: true","          }, function gotFileEntry(fileEntry) {","            fileEntry.createWriter(function gotFileWriter(writer) {","              writer.onwrite = function() {","                return callback({","                  key: key,","                  val: value","                });","              };","              writer.write(value);","            }, function() {","              fail('[save] Failed to create file writer');","            });","          }, function() {","            fail('[save] Failed to getFile');","          });","        }, function() {","          fail('[save] Failed to requestFileSystem');","        });","      });","    },","","    batch : function (records, callback){","      throw \"Currently not supported\";","    },","","    get : function (key, callback){","      filenameForKey(key, function(hash) {","        window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function gotFS(fileSystem) {","          fileSystem.root.getFile(hash, {}, function gotFileEntry(fileEntry) {","            fileEntry.file(function gotFile(file) {","              var reader = new FileReader();","              reader.onloadend = function (evt) {","                var text = evt.target.result;","                // Check for URLencoded","                // PG 2.2 bug in readAsText()","                try {","                  text = decodeURIComponent(text);","                } catch (e) {","                  // Swallow exception if not URLencoded","                  // Just use the result","                }","                return callback({","                  key: key,","                  val: text","                });","              };","              reader.readAsText(file);","            }, function() {","              fail('[load] Failed to getFile');","            });","          }, function() {","            // Success callback on key load failure","            callback({","              key: key,","              val: null","            });","          });","        }, function() {","          fail('[load] Failed to get fileSystem');","        });","      });","    },","","    exists : function (key, callback){","      filenameForKey(key,function (hash){","        window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function gotFS(fileSystem) {","          fileSystem.root.getFile(hash, {},","            function gotFileEntry(fileEntry) {","              return callback(true);","            }, function (err){","              return callback(false);","            });","        });","      });","    },","","    all : function (callback){","      throw \"Currently not supported\";","    },","","    remove : function (key, callback){","      filenameForKey(key, function(hash) {","","        window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function gotFS(fileSystem) {","          fileSystem.root.getFile(hash, {}, function gotFileEntry(fileEntry) {","","            fileEntry.remove(function() {","              return callback({","                key: key,","                val: null","              });","            }, function() {","              fail('[remove] Failed to remove file');","            });","          }, function() {","            fail('[remove] Failed to getFile');","          });","        }, function() {","          fail('[remove] Failed to get fileSystem');","        });","      });","    },","","    nuke : function (callback){","      throw \"Currently not supported\";","    }","","","  };","}","","var addAdapter = function(app_props, hashFunc){","  Lawnchair.adapter('localFileStorage', fileStorageAdapter(app_props, hashFunc));","}","","module.exports = {","  addAdapter: addAdapter","}"];

},{"../../libs/generated/lawnchair":2}],37:[function(require,module,exports){
/* automatically generated by JSCoverage - do not edit */
if (typeof _$jscoverage === 'undefined') _$jscoverage = {};
if (! _$jscoverage['modules/loadScript.js']) {
  _$jscoverage['modules/loadScript.js'] = [];
  _$jscoverage['modules/loadScript.js'][1] = 0;
  _$jscoverage['modules/loadScript.js'][2] = 0;
  _$jscoverage['modules/loadScript.js'][3] = 0;
  _$jscoverage['modules/loadScript.js'][4] = 0;
  _$jscoverage['modules/loadScript.js'][5] = 0;
  _$jscoverage['modules/loadScript.js'][6] = 0;
  _$jscoverage['modules/loadScript.js'][7] = 0;
  _$jscoverage['modules/loadScript.js'][8] = 0;
  _$jscoverage['modules/loadScript.js'][9] = 0;
  _$jscoverage['modules/loadScript.js'][10] = 0;
  _$jscoverage['modules/loadScript.js'][11] = 0;
  _$jscoverage['modules/loadScript.js'][12] = 0;
  _$jscoverage['modules/loadScript.js'][14] = 0;
  _$jscoverage['modules/loadScript.js'][15] = 0;
  _$jscoverage['modules/loadScript.js'][16] = 0;
  _$jscoverage['modules/loadScript.js'][20] = 0;
}
_$jscoverage['modules/loadScript.js'][1]++;
module.exports = (function (url, callback) {
  _$jscoverage['modules/loadScript.js'][2]++;
  var script;
  _$jscoverage['modules/loadScript.js'][3]++;
  var head = document.head || document.getElementsByTagName("head")[0] || document.documentElement;
  _$jscoverage['modules/loadScript.js'][4]++;
  script = document.createElement("script");
  _$jscoverage['modules/loadScript.js'][5]++;
  script.async = "async";
  _$jscoverage['modules/loadScript.js'][6]++;
  script.src = url;
  _$jscoverage['modules/loadScript.js'][7]++;
  script.type = "text/javascript";
  _$jscoverage['modules/loadScript.js'][8]++;
  script.onload = script.onreadystatechange = (function () {
  _$jscoverage['modules/loadScript.js'][9]++;
  if (! script.readyState || /loaded|complete/.test(script.readyState)) {
    _$jscoverage['modules/loadScript.js'][10]++;
    script.onload = script.onreadystatechange = null;
    _$jscoverage['modules/loadScript.js'][11]++;
    if (head && script.parentNode) {
      _$jscoverage['modules/loadScript.js'][12]++;
      head.removeChild(script);
    }
    _$jscoverage['modules/loadScript.js'][14]++;
    script = undefined;
    _$jscoverage['modules/loadScript.js'][15]++;
    if (callback && typeof callback === "function") {
      _$jscoverage['modules/loadScript.js'][16]++;
      callback();
    }
  }
});
  _$jscoverage['modules/loadScript.js'][20]++;
  head.insertBefore(script, head.firstChild);
});
_$jscoverage['modules/loadScript.js'].source = ["module.exports = function (url, callback) {","  var script;","  var head = document.head || document.getElementsByTagName(\"head\")[0] || document.documentElement;","  script = document.createElement(\"script\");","  script.async = \"async\";","  script.src = url;","  script.type = \"text/javascript\";","  script.onload = script.onreadystatechange = function () {","    if (!script.readyState || /loaded|complete/.test(script.readyState)) {","      script.onload = script.onreadystatechange = null;","      if (head &amp;&amp; script.parentNode) {","        head.removeChild(script);","      }","      script = undefined;","      if (callback &amp;&amp; typeof callback === \"function\") {","        callback();","      }","    }","  };","  head.insertBefore(script, head.firstChild);","};"];

},{}],38:[function(require,module,exports){
/* automatically generated by JSCoverage - do not edit */
if (typeof _$jscoverage === 'undefined') _$jscoverage = {};
if (! _$jscoverage['modules/logger.js']) {
  _$jscoverage['modules/logger.js'] = [];
  _$jscoverage['modules/logger.js'][1] = 0;
  _$jscoverage['modules/logger.js'][2] = 0;
  _$jscoverage['modules/logger.js'][4] = 0;
  _$jscoverage['modules/logger.js'][23] = 0;
}
_$jscoverage['modules/logger.js'][1]++;
var console = require("console");
_$jscoverage['modules/logger.js'][2]++;
var log = require("loglevel");
_$jscoverage['modules/logger.js'][4]++;
log.setLevel("info");
_$jscoverage['modules/logger.js'][23]++;
module.exports = log;
_$jscoverage['modules/logger.js'].source = ["var console = require('console');","var log = require('loglevel');","","log.setLevel('info');","","/**"," * APIs:"," * see https://github.com/pimterry/loglevel."," * In short, you can use:"," * log.setLevel(loglevel) - default to info"," * log.enableAll() - enable all log messages"," * log.disableAll() - disable all log messages"," *"," * log.trace(msg)"," * log.debug(msg)"," * log.info(msg)"," * log.warn(msg)"," * log.error(msg)"," *"," * Available levels: { \"TRACE\": 0, \"DEBUG\": 1, \"INFO\": 2, \"WARN\": 3, \"ERROR\": 4, \"SILENT\": 5}"," * Use either string or integer value"," */","module.exports = log;"];

},{"console":8,"loglevel":14}],39:[function(require,module,exports){
/* automatically generated by JSCoverage - do not edit */
if (typeof _$jscoverage === 'undefined') _$jscoverage = {};
if (! _$jscoverage['modules/platformsMap.js']) {
  _$jscoverage['modules/platformsMap.js'] = [];
  _$jscoverage['modules/platformsMap.js'][1] = 0;
}
_$jscoverage['modules/platformsMap.js'][1]++;
module.exports = [{"destination": "ipad", "test": ["iPad"]}, {"destination": "iphone", "test": ["iPhone"]}, {"destination": "android", "test": ["Android"]}, {"destination": "blackberry", "test": ["BlackBerry", "BB10", "RIM Tablet OS"]}, {"destination": "windowsphone", "test": ["Windows Phone 8"]}, {"destination": "windowsphone7", "test": ["Windows Phone OS 7"]}];
_$jscoverage['modules/platformsMap.js'].source = ["module.exports = [","  {","    \"destination\" :\"ipad\",","    \"test\": [\"iPad\"]","  },","  {","    \"destination\" :\"iphone\",","    \"test\": [\"iPhone\"]","  },","  {","    \"destination\" :\"android\",","    \"test\": [\"Android\"]","  },","  {","    \"destination\" :\"blackberry\",","    \"test\": [\"BlackBerry\", \"BB10\", \"RIM Tablet OS\"]//Blackberry 10 does not contain \"Blackberry\"","  },","  {","    \"destination\" :\"windowsphone\",","    \"test\": [\"Windows Phone 8\"]","  },","  {","    \"destination\" :\"windowsphone7\",","    \"test\": [\"Windows Phone OS 7\"]","  }","];"];

},{}],40:[function(require,module,exports){
/* automatically generated by JSCoverage - do not edit */
if (typeof _$jscoverage === 'undefined') _$jscoverage = {};
if (! _$jscoverage['modules/queryMap.js']) {
  _$jscoverage['modules/queryMap.js'] = [];
  _$jscoverage['modules/queryMap.js'][1] = 0;
  _$jscoverage['modules/queryMap.js'][2] = 0;
  _$jscoverage['modules/queryMap.js'][3] = 0;
  _$jscoverage['modules/queryMap.js'][4] = 0;
  _$jscoverage['modules/queryMap.js'][5] = 0;
  _$jscoverage['modules/queryMap.js'][6] = 0;
  _$jscoverage['modules/queryMap.js'][7] = 0;
  _$jscoverage['modules/queryMap.js'][8] = 0;
  _$jscoverage['modules/queryMap.js'][9] = 0;
  _$jscoverage['modules/queryMap.js'][10] = 0;
  _$jscoverage['modules/queryMap.js'][11] = 0;
  _$jscoverage['modules/queryMap.js'][14] = 0;
}
_$jscoverage['modules/queryMap.js'][1]++;
module.exports = (function (url) {
  _$jscoverage['modules/queryMap.js'][2]++;
  var qmap = {};
  _$jscoverage['modules/queryMap.js'][3]++;
  var i = url.split("?");
  _$jscoverage['modules/queryMap.js'][4]++;
  if (i.length === 2) {
    _$jscoverage['modules/queryMap.js'][5]++;
    var queryString = i[1];
    _$jscoverage['modules/queryMap.js'][6]++;
    var pairs = queryString.split("&");
    _$jscoverage['modules/queryMap.js'][7]++;
    qmap = {};
    _$jscoverage['modules/queryMap.js'][8]++;
    for (var p = 0; p < pairs.length; p++) {
      _$jscoverage['modules/queryMap.js'][9]++;
      var q = pairs[p];
      _$jscoverage['modules/queryMap.js'][10]++;
      var qp = q.split("=");
      _$jscoverage['modules/queryMap.js'][11]++;
      qmap[qp[0]] = qp[1];
}
  }
  _$jscoverage['modules/queryMap.js'][14]++;
  return qmap;
});
_$jscoverage['modules/queryMap.js'].source = ["module.exports = function(url) {","  var qmap = {};","  var i = url.split(\"?\");","  if (i.length === 2) {","    var queryString = i[1];","    var pairs = queryString.split(\"&amp;\");","    qmap = {};","    for (var p = 0; p &lt; pairs.length; p++) {","      var q = pairs[p];","      var qp = q.split(\"=\");","      qmap[qp[0]] = qp[1];","    }","  }","  return qmap;","};"];

},{}],41:[function(require,module,exports){
/* automatically generated by JSCoverage - do not edit */
if (typeof _$jscoverage === 'undefined') _$jscoverage = {};
if (! _$jscoverage['modules/sdkversion.js']) {
  _$jscoverage['modules/sdkversion.js'] = [];
  _$jscoverage['modules/sdkversion.js'][1] = 0;
  _$jscoverage['modules/sdkversion.js'][3] = 0;
  _$jscoverage['modules/sdkversion.js'][4] = 0;
  _$jscoverage['modules/sdkversion.js'][5] = 0;
  _$jscoverage['modules/sdkversion.js'][6] = 0;
  _$jscoverage['modules/sdkversion.js'][7] = 0;
  _$jscoverage['modules/sdkversion.js'][8] = 0;
  _$jscoverage['modules/sdkversion.js'][10] = 0;
}
_$jscoverage['modules/sdkversion.js'][1]++;
var constants = require("./constants");
_$jscoverage['modules/sdkversion.js'][3]++;
module.exports = (function () {
  _$jscoverage['modules/sdkversion.js'][4]++;
  var type = "FH_JS_SDK";
  _$jscoverage['modules/sdkversion.js'][5]++;
  if (typeof window.fh_destination_code !== "undefined") {
    _$jscoverage['modules/sdkversion.js'][6]++;
    type = "FH_HYBRID_SDK";
  }
  else {
    _$jscoverage['modules/sdkversion.js'][7]++;
    if (window.PhoneGap || window.cordova) {
      _$jscoverage['modules/sdkversion.js'][8]++;
      type = "FH_PHONEGAP_SDK";
    }
  }
  _$jscoverage['modules/sdkversion.js'][10]++;
  return type + "/" + constants.sdk_version;
});
_$jscoverage['modules/sdkversion.js'].source = ["var constants = require(\"./constants\");","","module.exports = function() {","  var type = \"FH_JS_SDK\";","  if (typeof window.fh_destination_code !== 'undefined') {","    type = \"FH_HYBRID_SDK\";","  } else if(window.PhoneGap || window.cordova) {","    type = \"FH_PHONEGAP_SDK\";","  }","  return type + \"/\" + constants.sdk_version;","};"];

},{"./constants":28}],42:[function(require,module,exports){
/* automatically generated by JSCoverage - do not edit */
if (typeof _$jscoverage === 'undefined') _$jscoverage = {};
if (! _$jscoverage['modules/security/aes-keygen.js']) {
  _$jscoverage['modules/security/aes-keygen.js'] = [];
  _$jscoverage['modules/security/aes-keygen.js'][1] = 0;
  _$jscoverage['modules/security/aes-keygen.js'][2] = 0;
  _$jscoverage['modules/security/aes-keygen.js'][3] = 0;
  _$jscoverage['modules/security/aes-keygen.js'][5] = 0;
  _$jscoverage['modules/security/aes-keygen.js'][6] = 0;
  _$jscoverage['modules/security/aes-keygen.js'][7] = 0;
  _$jscoverage['modules/security/aes-keygen.js'][8] = 0;
  _$jscoverage['modules/security/aes-keygen.js'][9] = 0;
  _$jscoverage['modules/security/aes-keygen.js'][10] = 0;
  _$jscoverage['modules/security/aes-keygen.js'][11] = 0;
  _$jscoverage['modules/security/aes-keygen.js'][13] = 0;
  _$jscoverage['modules/security/aes-keygen.js'][16] = 0;
  _$jscoverage['modules/security/aes-keygen.js'][17] = 0;
  _$jscoverage['modules/security/aes-keygen.js'][18] = 0;
  _$jscoverage['modules/security/aes-keygen.js'][19] = 0;
  _$jscoverage['modules/security/aes-keygen.js'][21] = 0;
  _$jscoverage['modules/security/aes-keygen.js'][22] = 0;
  _$jscoverage['modules/security/aes-keygen.js'][23] = 0;
  _$jscoverage['modules/security/aes-keygen.js'][25] = 0;
  _$jscoverage['modules/security/aes-keygen.js'][28] = 0;
  _$jscoverage['modules/security/aes-keygen.js'][29] = 0;
  _$jscoverage['modules/security/aes-keygen.js'][31] = 0;
  _$jscoverage['modules/security/aes-keygen.js'][32] = 0;
  _$jscoverage['modules/security/aes-keygen.js'][34] = 0;
  _$jscoverage['modules/security/aes-keygen.js'][41] = 0;
}
_$jscoverage['modules/security/aes-keygen.js'][1]++;
var rsa = require("../../../libs/rsa");
_$jscoverage['modules/security/aes-keygen.js'][2]++;
var SecureRandom = rsa.SecureRandom;
_$jscoverage['modules/security/aes-keygen.js'][3]++;
var byte2Hex = rsa.byte2Hex;
_$jscoverage['modules/security/aes-keygen.js'][5]++;
var generateRandomKey = (function (keysize) {
  _$jscoverage['modules/security/aes-keygen.js'][6]++;
  var r = new SecureRandom();
  _$jscoverage['modules/security/aes-keygen.js'][7]++;
  var key = new Array(keysize);
  _$jscoverage['modules/security/aes-keygen.js'][8]++;
  r.nextBytes(key);
  _$jscoverage['modules/security/aes-keygen.js'][9]++;
  var result = "";
  _$jscoverage['modules/security/aes-keygen.js'][10]++;
  for (var i = 0; i < key.length; i++) {
    _$jscoverage['modules/security/aes-keygen.js'][11]++;
    result += byte2Hex(key[i]);
}
  _$jscoverage['modules/security/aes-keygen.js'][13]++;
  return result;
});
_$jscoverage['modules/security/aes-keygen.js'][16]++;
var aes_keygen = (function (p, s, f) {
  _$jscoverage['modules/security/aes-keygen.js'][17]++;
  if (! p.params.keysize) {
    _$jscoverage['modules/security/aes-keygen.js'][18]++;
    f("no_params_keysize", {}, p);
    _$jscoverage['modules/security/aes-keygen.js'][19]++;
    return;
  }
  _$jscoverage['modules/security/aes-keygen.js'][21]++;
  if (p.params.algorithm.toLowerCase() !== "aes") {
    _$jscoverage['modules/security/aes-keygen.js'][22]++;
    f("keygen_bad_algorithm", {}, p);
    _$jscoverage['modules/security/aes-keygen.js'][23]++;
    return;
  }
  _$jscoverage['modules/security/aes-keygen.js'][25]++;
  var keysize = parseInt(p.params.keysize, 10);
  _$jscoverage['modules/security/aes-keygen.js'][28]++;
  if (keysize > 100) {
    _$jscoverage['modules/security/aes-keygen.js'][29]++;
    keysize = keysize / 8;
  }
  _$jscoverage['modules/security/aes-keygen.js'][31]++;
  if (typeof SecureRandom === "undefined") {
    _$jscoverage['modules/security/aes-keygen.js'][32]++;
    return f("security library is not loaded.");
  }
  _$jscoverage['modules/security/aes-keygen.js'][34]++;
  return s({"algorithm": "AES", "secretkey": generateRandomKey(keysize), "iv": generateRandomKey(keysize)});
});
_$jscoverage['modules/security/aes-keygen.js'][41]++;
module.exports = aes_keygen;
_$jscoverage['modules/security/aes-keygen.js'].source = ["var rsa = require(\"../../../libs/rsa\");","var SecureRandom = rsa.SecureRandom;","var byte2Hex = rsa.byte2Hex;","","var generateRandomKey = function(keysize){","  var r = new SecureRandom();","  var key = new Array(keysize);","  r.nextBytes(key);","  var result = \"\";","  for(var i=0;i&lt;key.length;i++){","    result += byte2Hex(key[i]);","  }","  return result;","};","","var aes_keygen = function(p, s, f){","  if (!p.params.keysize) {","    f('no_params_keysize', {}, p);","    return;","  }","  if (p.params.algorithm.toLowerCase() !== \"aes\") {","    f('keygen_bad_algorithm', {}, p);","    return;","  }","  var keysize = parseInt(p.params.keysize, 10);","  //keysize is in bit, need to convert to bytes to generate random key","  //but the legacy code has a bug, it doesn't do the convert, so if the keysize is less than 100, don't convert","  if(keysize &gt; 100){","    keysize = keysize/8;","  }","  if(typeof SecureRandom === \"undefined\"){","    return f(\"security library is not loaded.\");","  }","  return s({","    'algorithm': 'AES',","    'secretkey': generateRandomKey(keysize),","    'iv': generateRandomKey(keysize)","  });","}","","module.exports = aes_keygen;"];

},{"../../../libs/rsa":4}],43:[function(require,module,exports){
/* automatically generated by JSCoverage - do not edit */
if (typeof _$jscoverage === 'undefined') _$jscoverage = {};
if (! _$jscoverage['modules/security/aes-node.js']) {
  _$jscoverage['modules/security/aes-node.js'] = [];
  _$jscoverage['modules/security/aes-node.js'][1] = 0;
  _$jscoverage['modules/security/aes-node.js'][3] = 0;
  _$jscoverage['modules/security/aes-node.js'][4] = 0;
  _$jscoverage['modules/security/aes-node.js'][5] = 0;
  _$jscoverage['modules/security/aes-node.js'][6] = 0;
  _$jscoverage['modules/security/aes-node.js'][8] = 0;
  _$jscoverage['modules/security/aes-node.js'][9] = 0;
  _$jscoverage['modules/security/aes-node.js'][10] = 0;
  _$jscoverage['modules/security/aes-node.js'][11] = 0;
  _$jscoverage['modules/security/aes-node.js'][14] = 0;
  _$jscoverage['modules/security/aes-node.js'][15] = 0;
  _$jscoverage['modules/security/aes-node.js'][16] = 0;
  _$jscoverage['modules/security/aes-node.js'][19] = 0;
  _$jscoverage['modules/security/aes-node.js'][20] = 0;
  _$jscoverage['modules/security/aes-node.js'][21] = 0;
  _$jscoverage['modules/security/aes-node.js'][22] = 0;
  _$jscoverage['modules/security/aes-node.js'][24] = 0;
  _$jscoverage['modules/security/aes-node.js'][25] = 0;
  _$jscoverage['modules/security/aes-node.js'][26] = 0;
  _$jscoverage['modules/security/aes-node.js'][27] = 0;
  _$jscoverage['modules/security/aes-node.js'][30] = 0;
  _$jscoverage['modules/security/aes-node.js'][31] = 0;
  _$jscoverage['modules/security/aes-node.js'][32] = 0;
  _$jscoverage['modules/security/aes-node.js'][33] = 0;
  _$jscoverage['modules/security/aes-node.js'][34] = 0;
  _$jscoverage['modules/security/aes-node.js'][37] = 0;
}
_$jscoverage['modules/security/aes-node.js'][1]++;
var CryptoJS = require("../../../libs/generated/crypto");
_$jscoverage['modules/security/aes-node.js'][3]++;
var encrypt = (function (p, s, f) {
  _$jscoverage['modules/security/aes-node.js'][4]++;
  var fields = ["key", "plaintext", "iv"];
  _$jscoverage['modules/security/aes-node.js'][5]++;
  if (p.params.algorithm.toLowerCase() !== "aes") {
    _$jscoverage['modules/security/aes-node.js'][6]++;
    return f("encrypt_bad_algorithm", {}, p);
  }
  _$jscoverage['modules/security/aes-node.js'][8]++;
  for (var i = 0; i < fields; i++) {
    _$jscoverage['modules/security/aes-node.js'][9]++;
    var field = fields[i];
    _$jscoverage['modules/security/aes-node.js'][10]++;
    if (! p.params[field]) {
      _$jscoverage['modules/security/aes-node.js'][11]++;
      return f("no_params_" + field, {}, p);
    }
}
  _$jscoverage['modules/security/aes-node.js'][14]++;
  var encrypted = CryptoJS.AES.encrypt(p.params.plaintext, CryptoJS.enc.Hex.parse(p.params.key), {iv: CryptoJS.enc.Hex.parse(p.params.iv)});
  _$jscoverage['modules/security/aes-node.js'][15]++;
  cipher_text = CryptoJS.enc.Hex.stringify(encrypted.ciphertext);
  _$jscoverage['modules/security/aes-node.js'][16]++;
  return s({ciphertext: cipher_text});
});
_$jscoverage['modules/security/aes-node.js'][19]++;
var decrypt = (function (p, s, f) {
  _$jscoverage['modules/security/aes-node.js'][20]++;
  var fields = ["key", "ciphertext", "iv"];
  _$jscoverage['modules/security/aes-node.js'][21]++;
  if (p.params.algorithm.toLowerCase() !== "aes") {
    _$jscoverage['modules/security/aes-node.js'][22]++;
    return f("decrypt_bad_algorithm", {}, p);
  }
  _$jscoverage['modules/security/aes-node.js'][24]++;
  for (var i = 0; i < fields; i++) {
    _$jscoverage['modules/security/aes-node.js'][25]++;
    var field = fields[i];
    _$jscoverage['modules/security/aes-node.js'][26]++;
    if (! p.params[field]) {
      _$jscoverage['modules/security/aes-node.js'][27]++;
      return f("no_params_" + field, {}, p);
    }
}
  _$jscoverage['modules/security/aes-node.js'][30]++;
  var data = CryptoJS.enc.Hex.parse(p.params.ciphertext);
  _$jscoverage['modules/security/aes-node.js'][31]++;
  var encodeData = CryptoJS.enc.Base64.stringify(data);
  _$jscoverage['modules/security/aes-node.js'][32]++;
  var decrypted = CryptoJS.AES.decrypt(encodeData, CryptoJS.enc.Hex.parse(p.params.key), {iv: CryptoJS.enc.Hex.parse(p.params.iv)});
  _$jscoverage['modules/security/aes-node.js'][33]++;
  plain_text = decrypted.toString(CryptoJS.enc.Utf8);
  _$jscoverage['modules/security/aes-node.js'][34]++;
  return s({plaintext: plain_text});
});
_$jscoverage['modules/security/aes-node.js'][37]++;
module.exports = {encrypt: encrypt, decrypt: decrypt};
_$jscoverage['modules/security/aes-node.js'].source = ["var CryptoJS = require(\"../../../libs/generated/crypto\");","","var encrypt = function(p, s, f){","  var fields = ['key', 'plaintext', 'iv'];","  if(p.params.algorithm.toLowerCase() !== \"aes\"){","    return f('encrypt_bad_algorithm', {}, p);","  }","  for (var i = 0; i &lt; fields; i++) {","    var field = fields[i];","    if (!p.params[field]) {","      return f('no_params_' + field, {}, p);","    }","  }","  var encrypted = CryptoJS.AES.encrypt(p.params.plaintext, CryptoJS.enc.Hex.parse(p.params.key), {iv: CryptoJS.enc.Hex.parse(p.params.iv)});","  cipher_text = CryptoJS.enc.Hex.stringify(encrypted.ciphertext);","  return s({ciphertext: cipher_text});","}","","var decrypt = function(p, s, f){","  var fields = ['key', 'ciphertext', 'iv'];","  if(p.params.algorithm.toLowerCase() !== \"aes\"){","    return f('decrypt_bad_algorithm', {}, p);","  }","  for (var i = 0; i &lt; fields; i++) {","    var field = fields[i];","    if (!p.params[field]) {","      return f('no_params_' + field, {}, p);","    }","  }","  var data = CryptoJS.enc.Hex.parse(p.params.ciphertext);","  var encodeData = CryptoJS.enc.Base64.stringify(data);","  var decrypted = CryptoJS.AES.decrypt(encodeData, CryptoJS.enc.Hex.parse(p.params.key), {iv: CryptoJS.enc.Hex.parse(p.params.iv)});","  plain_text = decrypted.toString(CryptoJS.enc.Utf8);","  return s({plaintext:plain_text});","}","","module.exports = {","  encrypt: encrypt,","  decrypt: decrypt","}"];

},{"../../../libs/generated/crypto":1}],44:[function(require,module,exports){
/* automatically generated by JSCoverage - do not edit */
if (typeof _$jscoverage === 'undefined') _$jscoverage = {};
if (! _$jscoverage['modules/security/hash.js']) {
  _$jscoverage['modules/security/hash.js'] = [];
  _$jscoverage['modules/security/hash.js'][1] = 0;
  _$jscoverage['modules/security/hash.js'][4] = 0;
  _$jscoverage['modules/security/hash.js'][5] = 0;
  _$jscoverage['modules/security/hash.js'][6] = 0;
  _$jscoverage['modules/security/hash.js'][7] = 0;
  _$jscoverage['modules/security/hash.js'][9] = 0;
  _$jscoverage['modules/security/hash.js'][10] = 0;
  _$jscoverage['modules/security/hash.js'][11] = 0;
  _$jscoverage['modules/security/hash.js'][12] = 0;
  _$jscoverage['modules/security/hash.js'][13] = 0;
  _$jscoverage['modules/security/hash.js'][14] = 0;
  _$jscoverage['modules/security/hash.js'][15] = 0;
  _$jscoverage['modules/security/hash.js'][16] = 0;
  _$jscoverage['modules/security/hash.js'][17] = 0;
  _$jscoverage['modules/security/hash.js'][19] = 0;
  _$jscoverage['modules/security/hash.js'][21] = 0;
  _$jscoverage['modules/security/hash.js'][24] = 0;
}
_$jscoverage['modules/security/hash.js'][1]++;
var CryptoJS = require("../../../libs/generated/crypto");
_$jscoverage['modules/security/hash.js'][4]++;
var hash = (function (p, s, f) {
  _$jscoverage['modules/security/hash.js'][5]++;
  if (! p.params.text) {
    _$jscoverage['modules/security/hash.js'][6]++;
    f("hash_no_text", {}, p);
    _$jscoverage['modules/security/hash.js'][7]++;
    return;
  }
  _$jscoverage['modules/security/hash.js'][9]++;
  var hashValue;
  _$jscoverage['modules/security/hash.js'][10]++;
  if (p.params.algorithm.toLowerCase() === "md5") {
    _$jscoverage['modules/security/hash.js'][11]++;
    hashValue = CryptoJS.MD5(p.params.text).toString(CryptoJS.enc.Hex);
  }
  else {
    _$jscoverage['modules/security/hash.js'][12]++;
    if (p.params.algorithm.toLowerCase() === "sha1") {
      _$jscoverage['modules/security/hash.js'][13]++;
      hashValue = CryptoJS.SHA1(p.params.text).toString(CryptoJS.enc.Hex);
    }
    else {
      _$jscoverage['modules/security/hash.js'][14]++;
      if (p.params.algorithm.toLowerCase() === "sha256") {
        _$jscoverage['modules/security/hash.js'][15]++;
        hashValue = CryptoJS.SHA256(p.params.text).toString(CryptoJS.enc.Hex);
      }
      else {
        _$jscoverage['modules/security/hash.js'][16]++;
        if (p.params.algorithm.toLowerCase() === "sha512") {
          _$jscoverage['modules/security/hash.js'][17]++;
          hashValue = CryptoJS.SHA512(p.params.text).toString(CryptoJS.enc.Hex);
        }
        else {
          _$jscoverage['modules/security/hash.js'][19]++;
          return f("hash_unsupported_algorithm: " + p.params.algorithm);
        }
      }
    }
  }
  _$jscoverage['modules/security/hash.js'][21]++;
  return s({"hashvalue": hashValue});
});
_$jscoverage['modules/security/hash.js'][24]++;
module.exports = hash;
_$jscoverage['modules/security/hash.js'].source = ["var CryptoJS = require(\"../../../libs/generated/crypto\");","","","var hash = function(p, s, f){","  if (!p.params.text) {","    f('hash_no_text', {}, p);","    return;","  }","  var hashValue;","  if (p.params.algorithm.toLowerCase() === \"md5\") {","    hashValue = CryptoJS.MD5(p.params.text).toString(CryptoJS.enc.Hex);","  } else if(p.params.algorithm.toLowerCase() === \"sha1\"){","    hashValue = CryptoJS.SHA1(p.params.text).toString(CryptoJS.enc.Hex);","  } else if(p.params.algorithm.toLowerCase() === \"sha256\"){","    hashValue = CryptoJS.SHA256(p.params.text).toString(CryptoJS.enc.Hex);","  } else if(p.params.algorithm.toLowerCase() === \"sha512\"){","    hashValue = CryptoJS.SHA512(p.params.text).toString(CryptoJS.enc.Hex);","  } else {","    return f(\"hash_unsupported_algorithm: \" + p.params.algorithm);","  }","  return s({\"hashvalue\": hashValue});","}","","module.exports = hash;"];

},{"../../../libs/generated/crypto":1}],45:[function(require,module,exports){
/* automatically generated by JSCoverage - do not edit */
if (typeof _$jscoverage === 'undefined') _$jscoverage = {};
if (! _$jscoverage['modules/security/rsa-node.js']) {
  _$jscoverage['modules/security/rsa-node.js'] = [];
  _$jscoverage['modules/security/rsa-node.js'][1] = 0;
  _$jscoverage['modules/security/rsa-node.js'][2] = 0;
  _$jscoverage['modules/security/rsa-node.js'][4] = 0;
  _$jscoverage['modules/security/rsa-node.js'][5] = 0;
  _$jscoverage['modules/security/rsa-node.js'][6] = 0;
  _$jscoverage['modules/security/rsa-node.js'][7] = 0;
  _$jscoverage['modules/security/rsa-node.js'][9] = 0;
  _$jscoverage['modules/security/rsa-node.js'][10] = 0;
  _$jscoverage['modules/security/rsa-node.js'][11] = 0;
  _$jscoverage['modules/security/rsa-node.js'][12] = 0;
  _$jscoverage['modules/security/rsa-node.js'][15] = 0;
  _$jscoverage['modules/security/rsa-node.js'][16] = 0;
  _$jscoverage['modules/security/rsa-node.js'][17] = 0;
  _$jscoverage['modules/security/rsa-node.js'][18] = 0;
  _$jscoverage['modules/security/rsa-node.js'][19] = 0;
  _$jscoverage['modules/security/rsa-node.js'][22] = 0;
}
_$jscoverage['modules/security/rsa-node.js'][1]++;
var rsa = require("../../../libs/rsa");
_$jscoverage['modules/security/rsa-node.js'][2]++;
var RSAKey = rsa.RSAKey;
_$jscoverage['modules/security/rsa-node.js'][4]++;
var encrypt = (function (p, s, f) {
  _$jscoverage['modules/security/rsa-node.js'][5]++;
  var fields = ["modulu", "plaintext"];
  _$jscoverage['modules/security/rsa-node.js'][6]++;
  if (p.params.algorithm.toLowerCase() !== "rsa") {
    _$jscoverage['modules/security/rsa-node.js'][7]++;
    return f("encrypt_bad_algorithm", {}, p);
  }
  _$jscoverage['modules/security/rsa-node.js'][9]++;
  for (var i = 0; i < fields; i++) {
    _$jscoverage['modules/security/rsa-node.js'][10]++;
    var field = fields[i];
    _$jscoverage['modules/security/rsa-node.js'][11]++;
    if (! p.params[field]) {
      _$jscoverage['modules/security/rsa-node.js'][12]++;
      return f("no_params_" + field, {}, p);
    }
}
  _$jscoverage['modules/security/rsa-node.js'][15]++;
  var key = new RSAKey();
  _$jscoverage['modules/security/rsa-node.js'][16]++;
  key.setPublic(p.params.modulu, "10001");
  _$jscoverage['modules/security/rsa-node.js'][17]++;
  var ori_text = p.params.plaintext;
  _$jscoverage['modules/security/rsa-node.js'][18]++;
  cipher_text = key.encrypt(ori_text);
  _$jscoverage['modules/security/rsa-node.js'][19]++;
  return s({ciphertext: cipher_text});
});
_$jscoverage['modules/security/rsa-node.js'][22]++;
module.exports = {encrypt: encrypt};
_$jscoverage['modules/security/rsa-node.js'].source = ["var rsa = require(\"../../../libs/rsa\");","var RSAKey = rsa.RSAKey;","","var encrypt = function(p, s, f){","  var fields = ['modulu', 'plaintext'];","  if(p.params.algorithm.toLowerCase() !== \"rsa\"){","    return f('encrypt_bad_algorithm', {}, p);","  }","  for (var i = 0; i &lt; fields; i++) {","    var field = fields[i];","    if (!p.params[field]) {","      return f('no_params_' + field, {}, p);","    }","  }","  var key = new RSAKey();","  key.setPublic(p.params.modulu, \"10001\");","  var ori_text = p.params.plaintext;","  cipher_text = key.encrypt(ori_text);","  return s({ciphertext:cipher_text});","}","","module.exports = {","  encrypt: encrypt","}"];

},{"../../../libs/rsa":4}],46:[function(require,module,exports){
/* automatically generated by JSCoverage - do not edit */
if (typeof _$jscoverage === 'undefined') _$jscoverage = {};
if (! _$jscoverage['modules/sync-cli.js']) {
  _$jscoverage['modules/sync-cli.js'] = [];
  _$jscoverage['modules/sync-cli.js'][1] = 0;
  _$jscoverage['modules/sync-cli.js'][2] = 0;
  _$jscoverage['modules/sync-cli.js'][3] = 0;
  _$jscoverage['modules/sync-cli.js'][4] = 0;
  _$jscoverage['modules/sync-cli.js'][5] = 0;
  _$jscoverage['modules/sync-cli.js'][7] = 0;
  _$jscoverage['modules/sync-cli.js'][87] = 0;
  _$jscoverage['modules/sync-cli.js'][89] = 0;
  _$jscoverage['modules/sync-cli.js'][90] = 0;
  _$jscoverage['modules/sync-cli.js'][91] = 0;
  _$jscoverage['modules/sync-cli.js'][95] = 0;
  _$jscoverage['modules/sync-cli.js'][96] = 0;
  _$jscoverage['modules/sync-cli.js'][99] = 0;
  _$jscoverage['modules/sync-cli.js'][103] = 0;
  _$jscoverage['modules/sync-cli.js'][107] = 0;
  _$jscoverage['modules/sync-cli.js'][109] = 0;
  _$jscoverage['modules/sync-cli.js'][111] = 0;
  _$jscoverage['modules/sync-cli.js'][112] = 0;
  _$jscoverage['modules/sync-cli.js'][114] = 0;
  _$jscoverage['modules/sync-cli.js'][116] = 0;
  _$jscoverage['modules/sync-cli.js'][117] = 0;
  _$jscoverage['modules/sync-cli.js'][118] = 0;
  _$jscoverage['modules/sync-cli.js'][119] = 0;
  _$jscoverage['modules/sync-cli.js'][120] = 0;
  _$jscoverage['modules/sync-cli.js'][121] = 0;
  _$jscoverage['modules/sync-cli.js'][122] = 0;
  _$jscoverage['modules/sync-cli.js'][124] = 0;
  _$jscoverage['modules/sync-cli.js'][126] = 0;
  _$jscoverage['modules/sync-cli.js'][127] = 0;
  _$jscoverage['modules/sync-cli.js'][133] = 0;
  _$jscoverage['modules/sync-cli.js'][134] = 0;
  _$jscoverage['modules/sync-cli.js'][135] = 0;
  _$jscoverage['modules/sync-cli.js'][137] = 0;
  _$jscoverage['modules/sync-cli.js'][140] = 0;
  _$jscoverage['modules/sync-cli.js'][141] = 0;
  _$jscoverage['modules/sync-cli.js'][146] = 0;
  _$jscoverage['modules/sync-cli.js'][149] = 0;
  _$jscoverage['modules/sync-cli.js'][153] = 0;
  _$jscoverage['modules/sync-cli.js'][154] = 0;
  _$jscoverage['modules/sync-cli.js'][155] = 0;
  _$jscoverage['modules/sync-cli.js'][156] = 0;
  _$jscoverage['modules/sync-cli.js'][157] = 0;
  _$jscoverage['modules/sync-cli.js'][158] = 0;
  _$jscoverage['modules/sync-cli.js'][165] = 0;
  _$jscoverage['modules/sync-cli.js'][166] = 0;
  _$jscoverage['modules/sync-cli.js'][169] = 0;
  _$jscoverage['modules/sync-cli.js'][170] = 0;
  _$jscoverage['modules/sync-cli.js'][171] = 0;
  _$jscoverage['modules/sync-cli.js'][172] = 0;
  _$jscoverage['modules/sync-cli.js'][175] = 0;
  _$jscoverage['modules/sync-cli.js'][179] = 0;
  _$jscoverage['modules/sync-cli.js'][180] = 0;
  _$jscoverage['modules/sync-cli.js'][182] = 0;
  _$jscoverage['modules/sync-cli.js'][183] = 0;
  _$jscoverage['modules/sync-cli.js'][185] = 0;
  _$jscoverage['modules/sync-cli.js'][188] = 0;
  _$jscoverage['modules/sync-cli.js'][193] = 0;
  _$jscoverage['modules/sync-cli.js'][194] = 0;
  _$jscoverage['modules/sync-cli.js'][195] = 0;
  _$jscoverage['modules/sync-cli.js'][198] = 0;
  _$jscoverage['modules/sync-cli.js'][202] = 0;
  _$jscoverage['modules/sync-cli.js'][203] = 0;
  _$jscoverage['modules/sync-cli.js'][204] = 0;
  _$jscoverage['modules/sync-cli.js'][205] = 0;
  _$jscoverage['modules/sync-cli.js'][208] = 0;
  _$jscoverage['modules/sync-cli.js'][209] = 0;
  _$jscoverage['modules/sync-cli.js'][212] = 0;
  _$jscoverage['modules/sync-cli.js'][217] = 0;
  _$jscoverage['modules/sync-cli.js'][221] = 0;
  _$jscoverage['modules/sync-cli.js'][225] = 0;
  _$jscoverage['modules/sync-cli.js'][226] = 0;
  _$jscoverage['modules/sync-cli.js'][227] = 0;
  _$jscoverage['modules/sync-cli.js'][228] = 0;
  _$jscoverage['modules/sync-cli.js'][230] = 0;
  _$jscoverage['modules/sync-cli.js'][232] = 0;
  _$jscoverage['modules/sync-cli.js'][237] = 0;
  _$jscoverage['modules/sync-cli.js'][238] = 0;
  _$jscoverage['modules/sync-cli.js'][239] = 0;
  _$jscoverage['modules/sync-cli.js'][244] = 0;
  _$jscoverage['modules/sync-cli.js'][245] = 0;
  _$jscoverage['modules/sync-cli.js'][256] = 0;
  _$jscoverage['modules/sync-cli.js'][257] = 0;
  _$jscoverage['modules/sync-cli.js'][271] = 0;
  _$jscoverage['modules/sync-cli.js'][274] = 0;
  _$jscoverage['modules/sync-cli.js'][275] = 0;
  _$jscoverage['modules/sync-cli.js'][279] = 0;
  _$jscoverage['modules/sync-cli.js'][281] = 0;
  _$jscoverage['modules/sync-cli.js'][282] = 0;
  _$jscoverage['modules/sync-cli.js'][283] = 0;
  _$jscoverage['modules/sync-cli.js'][284] = 0;
  _$jscoverage['modules/sync-cli.js'][289] = 0;
  _$jscoverage['modules/sync-cli.js'][294] = 0;
  _$jscoverage['modules/sync-cli.js'][295] = 0;
  _$jscoverage['modules/sync-cli.js'][296] = 0;
  _$jscoverage['modules/sync-cli.js'][303] = 0;
  _$jscoverage['modules/sync-cli.js'][304] = 0;
  _$jscoverage['modules/sync-cli.js'][311] = 0;
  _$jscoverage['modules/sync-cli.js'][313] = 0;
  _$jscoverage['modules/sync-cli.js'][314] = 0;
  _$jscoverage['modules/sync-cli.js'][316] = 0;
  _$jscoverage['modules/sync-cli.js'][317] = 0;
  _$jscoverage['modules/sync-cli.js'][323] = 0;
  _$jscoverage['modules/sync-cli.js'][325] = 0;
  _$jscoverage['modules/sync-cli.js'][326] = 0;
  _$jscoverage['modules/sync-cli.js'][328] = 0;
  _$jscoverage['modules/sync-cli.js'][329] = 0;
  _$jscoverage['modules/sync-cli.js'][335] = 0;
  _$jscoverage['modules/sync-cli.js'][337] = 0;
  _$jscoverage['modules/sync-cli.js'][338] = 0;
  _$jscoverage['modules/sync-cli.js'][339] = 0;
  _$jscoverage['modules/sync-cli.js'][340] = 0;
  _$jscoverage['modules/sync-cli.js'][341] = 0;
  _$jscoverage['modules/sync-cli.js'][344] = 0;
  _$jscoverage['modules/sync-cli.js'][345] = 0;
  _$jscoverage['modules/sync-cli.js'][351] = 0;
  _$jscoverage['modules/sync-cli.js'][353] = 0;
  _$jscoverage['modules/sync-cli.js'][354] = 0;
  _$jscoverage['modules/sync-cli.js'][356] = 0;
  _$jscoverage['modules/sync-cli.js'][357] = 0;
  _$jscoverage['modules/sync-cli.js'][363] = 0;
  _$jscoverage['modules/sync-cli.js'][365] = 0;
  _$jscoverage['modules/sync-cli.js'][366] = 0;
  _$jscoverage['modules/sync-cli.js'][367] = 0;
  _$jscoverage['modules/sync-cli.js'][368] = 0;
  _$jscoverage['modules/sync-cli.js'][369] = 0;
  _$jscoverage['modules/sync-cli.js'][372] = 0;
  _$jscoverage['modules/sync-cli.js'][373] = 0;
  _$jscoverage['modules/sync-cli.js'][379] = 0;
  _$jscoverage['modules/sync-cli.js'][381] = 0;
  _$jscoverage['modules/sync-cli.js'][382] = 0;
  _$jscoverage['modules/sync-cli.js'][384] = 0;
  _$jscoverage['modules/sync-cli.js'][385] = 0;
  _$jscoverage['modules/sync-cli.js'][391] = 0;
  _$jscoverage['modules/sync-cli.js'][393] = 0;
  _$jscoverage['modules/sync-cli.js'][394] = 0;
  _$jscoverage['modules/sync-cli.js'][395] = 0;
  _$jscoverage['modules/sync-cli.js'][396] = 0;
  _$jscoverage['modules/sync-cli.js'][397] = 0;
  _$jscoverage['modules/sync-cli.js'][398] = 0;
  _$jscoverage['modules/sync-cli.js'][401] = 0;
  _$jscoverage['modules/sync-cli.js'][402] = 0;
  _$jscoverage['modules/sync-cli.js'][408] = 0;
  _$jscoverage['modules/sync-cli.js'][409] = 0;
  _$jscoverage['modules/sync-cli.js'][410] = 0;
  _$jscoverage['modules/sync-cli.js'][416] = 0;
  _$jscoverage['modules/sync-cli.js'][417] = 0;
  _$jscoverage['modules/sync-cli.js'][418] = 0;
  _$jscoverage['modules/sync-cli.js'][424] = 0;
  _$jscoverage['modules/sync-cli.js'][426] = 0;
  _$jscoverage['modules/sync-cli.js'][427] = 0;
  _$jscoverage['modules/sync-cli.js'][428] = 0;
  _$jscoverage['modules/sync-cli.js'][429] = 0;
  _$jscoverage['modules/sync-cli.js'][430] = 0;
  _$jscoverage['modules/sync-cli.js'][433] = 0;
  _$jscoverage['modules/sync-cli.js'][434] = 0;
  _$jscoverage['modules/sync-cli.js'][440] = 0;
  _$jscoverage['modules/sync-cli.js'][442] = 0;
  _$jscoverage['modules/sync-cli.js'][443] = 0;
  _$jscoverage['modules/sync-cli.js'][444] = 0;
  _$jscoverage['modules/sync-cli.js'][445] = 0;
  _$jscoverage['modules/sync-cli.js'][446] = 0;
  _$jscoverage['modules/sync-cli.js'][449] = 0;
  _$jscoverage['modules/sync-cli.js'][450] = 0;
  _$jscoverage['modules/sync-cli.js'][456] = 0;
  _$jscoverage['modules/sync-cli.js'][457] = 0;
  _$jscoverage['modules/sync-cli.js'][460] = 0;
  _$jscoverage['modules/sync-cli.js'][462] = 0;
  _$jscoverage['modules/sync-cli.js'][463] = 0;
  _$jscoverage['modules/sync-cli.js'][469] = 0;
  _$jscoverage['modules/sync-cli.js'][474] = 0;
  _$jscoverage['modules/sync-cli.js'][476] = 0;
  _$jscoverage['modules/sync-cli.js'][477] = 0;
  _$jscoverage['modules/sync-cli.js'][479] = 0;
  _$jscoverage['modules/sync-cli.js'][482] = 0;
  _$jscoverage['modules/sync-cli.js'][486] = 0;
  _$jscoverage['modules/sync-cli.js'][487] = 0;
  _$jscoverage['modules/sync-cli.js'][491] = 0;
  _$jscoverage['modules/sync-cli.js'][492] = 0;
  _$jscoverage['modules/sync-cli.js'][493] = 0;
  _$jscoverage['modules/sync-cli.js'][497] = 0;
  _$jscoverage['modules/sync-cli.js'][498] = 0;
  _$jscoverage['modules/sync-cli.js'][500] = 0;
  _$jscoverage['modules/sync-cli.js'][502] = 0;
  _$jscoverage['modules/sync-cli.js'][504] = 0;
  _$jscoverage['modules/sync-cli.js'][506] = 0;
  _$jscoverage['modules/sync-cli.js'][507] = 0;
  _$jscoverage['modules/sync-cli.js'][509] = 0;
  _$jscoverage['modules/sync-cli.js'][510] = 0;
  _$jscoverage['modules/sync-cli.js'][512] = 0;
  _$jscoverage['modules/sync-cli.js'][514] = 0;
  _$jscoverage['modules/sync-cli.js'][518] = 0;
  _$jscoverage['modules/sync-cli.js'][519] = 0;
  _$jscoverage['modules/sync-cli.js'][520] = 0;
  _$jscoverage['modules/sync-cli.js'][521] = 0;
  _$jscoverage['modules/sync-cli.js'][522] = 0;
  _$jscoverage['modules/sync-cli.js'][523] = 0;
  _$jscoverage['modules/sync-cli.js'][524] = 0;
  _$jscoverage['modules/sync-cli.js'][525] = 0;
  _$jscoverage['modules/sync-cli.js'][526] = 0;
  _$jscoverage['modules/sync-cli.js'][528] = 0;
  _$jscoverage['modules/sync-cli.js'][529] = 0;
  _$jscoverage['modules/sync-cli.js'][530] = 0;
  _$jscoverage['modules/sync-cli.js'][531] = 0;
  _$jscoverage['modules/sync-cli.js'][532] = 0;
  _$jscoverage['modules/sync-cli.js'][534] = 0;
  _$jscoverage['modules/sync-cli.js'][535] = 0;
  _$jscoverage['modules/sync-cli.js'][542] = 0;
  _$jscoverage['modules/sync-cli.js'][545] = 0;
  _$jscoverage['modules/sync-cli.js'][546] = 0;
  _$jscoverage['modules/sync-cli.js'][547] = 0;
  _$jscoverage['modules/sync-cli.js'][548] = 0;
  _$jscoverage['modules/sync-cli.js'][550] = 0;
  _$jscoverage['modules/sync-cli.js'][551] = 0;
  _$jscoverage['modules/sync-cli.js'][552] = 0;
  _$jscoverage['modules/sync-cli.js'][554] = 0;
  _$jscoverage['modules/sync-cli.js'][556] = 0;
  _$jscoverage['modules/sync-cli.js'][557] = 0;
  _$jscoverage['modules/sync-cli.js'][558] = 0;
  _$jscoverage['modules/sync-cli.js'][559] = 0;
  _$jscoverage['modules/sync-cli.js'][560] = 0;
  _$jscoverage['modules/sync-cli.js'][561] = 0;
  _$jscoverage['modules/sync-cli.js'][563] = 0;
  _$jscoverage['modules/sync-cli.js'][564] = 0;
  _$jscoverage['modules/sync-cli.js'][566] = 0;
  _$jscoverage['modules/sync-cli.js'][567] = 0;
  _$jscoverage['modules/sync-cli.js'][568] = 0;
  _$jscoverage['modules/sync-cli.js'][572] = 0;
  _$jscoverage['modules/sync-cli.js'][573] = 0;
  _$jscoverage['modules/sync-cli.js'][574] = 0;
  _$jscoverage['modules/sync-cli.js'][575] = 0;
  _$jscoverage['modules/sync-cli.js'][578] = 0;
  _$jscoverage['modules/sync-cli.js'][580] = 0;
  _$jscoverage['modules/sync-cli.js'][581] = 0;
  _$jscoverage['modules/sync-cli.js'][583] = 0;
  _$jscoverage['modules/sync-cli.js'][584] = 0;
  _$jscoverage['modules/sync-cli.js'][588] = 0;
  _$jscoverage['modules/sync-cli.js'][590] = 0;
  _$jscoverage['modules/sync-cli.js'][591] = 0;
  _$jscoverage['modules/sync-cli.js'][592] = 0;
  _$jscoverage['modules/sync-cli.js'][593] = 0;
  _$jscoverage['modules/sync-cli.js'][594] = 0;
  _$jscoverage['modules/sync-cli.js'][595] = 0;
  _$jscoverage['modules/sync-cli.js'][596] = 0;
  _$jscoverage['modules/sync-cli.js'][597] = 0;
  _$jscoverage['modules/sync-cli.js'][604] = 0;
  _$jscoverage['modules/sync-cli.js'][607] = 0;
  _$jscoverage['modules/sync-cli.js'][610] = 0;
  _$jscoverage['modules/sync-cli.js'][613] = 0;
  _$jscoverage['modules/sync-cli.js'][616] = 0;
  _$jscoverage['modules/sync-cli.js'][620] = 0;
  _$jscoverage['modules/sync-cli.js'][622] = 0;
  _$jscoverage['modules/sync-cli.js'][623] = 0;
  _$jscoverage['modules/sync-cli.js'][625] = 0;
  _$jscoverage['modules/sync-cli.js'][628] = 0;
  _$jscoverage['modules/sync-cli.js'][629] = 0;
  _$jscoverage['modules/sync-cli.js'][630] = 0;
  _$jscoverage['modules/sync-cli.js'][631] = 0;
  _$jscoverage['modules/sync-cli.js'][632] = 0;
  _$jscoverage['modules/sync-cli.js'][633] = 0;
  _$jscoverage['modules/sync-cli.js'][636] = 0;
  _$jscoverage['modules/sync-cli.js'][637] = 0;
  _$jscoverage['modules/sync-cli.js'][639] = 0;
  _$jscoverage['modules/sync-cli.js'][641] = 0;
  _$jscoverage['modules/sync-cli.js'][642] = 0;
  _$jscoverage['modules/sync-cli.js'][648] = 0;
  _$jscoverage['modules/sync-cli.js'][649] = 0;
  _$jscoverage['modules/sync-cli.js'][650] = 0;
  _$jscoverage['modules/sync-cli.js'][654] = 0;
  _$jscoverage['modules/sync-cli.js'][655] = 0;
  _$jscoverage['modules/sync-cli.js'][665] = 0;
  _$jscoverage['modules/sync-cli.js'][667] = 0;
  _$jscoverage['modules/sync-cli.js'][669] = 0;
  _$jscoverage['modules/sync-cli.js'][670] = 0;
  _$jscoverage['modules/sync-cli.js'][671] = 0;
  _$jscoverage['modules/sync-cli.js'][672] = 0;
  _$jscoverage['modules/sync-cli.js'][673] = 0;
  _$jscoverage['modules/sync-cli.js'][676] = 0;
  _$jscoverage['modules/sync-cli.js'][678] = 0;
  _$jscoverage['modules/sync-cli.js'][679] = 0;
  _$jscoverage['modules/sync-cli.js'][680] = 0;
  _$jscoverage['modules/sync-cli.js'][681] = 0;
  _$jscoverage['modules/sync-cli.js'][683] = 0;
  _$jscoverage['modules/sync-cli.js'][685] = 0;
  _$jscoverage['modules/sync-cli.js'][689] = 0;
  _$jscoverage['modules/sync-cli.js'][691] = 0;
  _$jscoverage['modules/sync-cli.js'][692] = 0;
  _$jscoverage['modules/sync-cli.js'][693] = 0;
  _$jscoverage['modules/sync-cli.js'][694] = 0;
  _$jscoverage['modules/sync-cli.js'][697] = 0;
  _$jscoverage['modules/sync-cli.js'][698] = 0;
  _$jscoverage['modules/sync-cli.js'][699] = 0;
  _$jscoverage['modules/sync-cli.js'][700] = 0;
  _$jscoverage['modules/sync-cli.js'][701] = 0;
  _$jscoverage['modules/sync-cli.js'][704] = 0;
  _$jscoverage['modules/sync-cli.js'][705] = 0;
  _$jscoverage['modules/sync-cli.js'][706] = 0;
  _$jscoverage['modules/sync-cli.js'][707] = 0;
  _$jscoverage['modules/sync-cli.js'][711] = 0;
  _$jscoverage['modules/sync-cli.js'][713] = 0;
  _$jscoverage['modules/sync-cli.js'][714] = 0;
  _$jscoverage['modules/sync-cli.js'][715] = 0;
  _$jscoverage['modules/sync-cli.js'][717] = 0;
  _$jscoverage['modules/sync-cli.js'][719] = 0;
  _$jscoverage['modules/sync-cli.js'][720] = 0;
  _$jscoverage['modules/sync-cli.js'][727] = 0;
  _$jscoverage['modules/sync-cli.js'][728] = 0;
  _$jscoverage['modules/sync-cli.js'][729] = 0;
  _$jscoverage['modules/sync-cli.js'][730] = 0;
  _$jscoverage['modules/sync-cli.js'][731] = 0;
  _$jscoverage['modules/sync-cli.js'][736] = 0;
  _$jscoverage['modules/sync-cli.js'][737] = 0;
  _$jscoverage['modules/sync-cli.js'][738] = 0;
  _$jscoverage['modules/sync-cli.js'][740] = 0;
  _$jscoverage['modules/sync-cli.js'][742] = 0;
  _$jscoverage['modules/sync-cli.js'][743] = 0;
  _$jscoverage['modules/sync-cli.js'][744] = 0;
  _$jscoverage['modules/sync-cli.js'][745] = 0;
  _$jscoverage['modules/sync-cli.js'][747] = 0;
  _$jscoverage['modules/sync-cli.js'][748] = 0;
  _$jscoverage['modules/sync-cli.js'][749] = 0;
  _$jscoverage['modules/sync-cli.js'][750] = 0;
  _$jscoverage['modules/sync-cli.js'][751] = 0;
  _$jscoverage['modules/sync-cli.js'][753] = 0;
  _$jscoverage['modules/sync-cli.js'][757] = 0;
  _$jscoverage['modules/sync-cli.js'][758] = 0;
  _$jscoverage['modules/sync-cli.js'][761] = 0;
  _$jscoverage['modules/sync-cli.js'][763] = 0;
  _$jscoverage['modules/sync-cli.js'][768] = 0;
  _$jscoverage['modules/sync-cli.js'][776] = 0;
  _$jscoverage['modules/sync-cli.js'][777] = 0;
  _$jscoverage['modules/sync-cli.js'][779] = 0;
  _$jscoverage['modules/sync-cli.js'][781] = 0;
  _$jscoverage['modules/sync-cli.js'][789] = 0;
  _$jscoverage['modules/sync-cli.js'][790] = 0;
  _$jscoverage['modules/sync-cli.js'][791] = 0;
  _$jscoverage['modules/sync-cli.js'][793] = 0;
  _$jscoverage['modules/sync-cli.js'][794] = 0;
  _$jscoverage['modules/sync-cli.js'][797] = 0;
  _$jscoverage['modules/sync-cli.js'][798] = 0;
  _$jscoverage['modules/sync-cli.js'][800] = 0;
  _$jscoverage['modules/sync-cli.js'][802] = 0;
  _$jscoverage['modules/sync-cli.js'][807] = 0;
  _$jscoverage['modules/sync-cli.js'][811] = 0;
  _$jscoverage['modules/sync-cli.js'][815] = 0;
  _$jscoverage['modules/sync-cli.js'][816] = 0;
  _$jscoverage['modules/sync-cli.js'][820] = 0;
  _$jscoverage['modules/sync-cli.js'][822] = 0;
  _$jscoverage['modules/sync-cli.js'][825] = 0;
  _$jscoverage['modules/sync-cli.js'][830] = 0;
  _$jscoverage['modules/sync-cli.js'][832] = 0;
  _$jscoverage['modules/sync-cli.js'][838] = 0;
  _$jscoverage['modules/sync-cli.js'][841] = 0;
  _$jscoverage['modules/sync-cli.js'][842] = 0;
  _$jscoverage['modules/sync-cli.js'][847] = 0;
  _$jscoverage['modules/sync-cli.js'][849] = 0;
  _$jscoverage['modules/sync-cli.js'][850] = 0;
  _$jscoverage['modules/sync-cli.js'][851] = 0;
  _$jscoverage['modules/sync-cli.js'][853] = 0;
  _$jscoverage['modules/sync-cli.js'][855] = 0;
  _$jscoverage['modules/sync-cli.js'][856] = 0;
  _$jscoverage['modules/sync-cli.js'][858] = 0;
  _$jscoverage['modules/sync-cli.js'][866] = 0;
  _$jscoverage['modules/sync-cli.js'][868] = 0;
  _$jscoverage['modules/sync-cli.js'][869] = 0;
  _$jscoverage['modules/sync-cli.js'][870] = 0;
  _$jscoverage['modules/sync-cli.js'][873] = 0;
  _$jscoverage['modules/sync-cli.js'][874] = 0;
  _$jscoverage['modules/sync-cli.js'][875] = 0;
  _$jscoverage['modules/sync-cli.js'][876] = 0;
  _$jscoverage['modules/sync-cli.js'][877] = 0;
  _$jscoverage['modules/sync-cli.js'][878] = 0;
  _$jscoverage['modules/sync-cli.js'][882] = 0;
  _$jscoverage['modules/sync-cli.js'][883] = 0;
  _$jscoverage['modules/sync-cli.js'][884] = 0;
  _$jscoverage['modules/sync-cli.js'][885] = 0;
  _$jscoverage['modules/sync-cli.js'][888] = 0;
  _$jscoverage['modules/sync-cli.js'][896] = 0;
  _$jscoverage['modules/sync-cli.js'][897] = 0;
  _$jscoverage['modules/sync-cli.js'][898] = 0;
  _$jscoverage['modules/sync-cli.js'][900] = 0;
  _$jscoverage['modules/sync-cli.js'][901] = 0;
  _$jscoverage['modules/sync-cli.js'][903] = 0;
  _$jscoverage['modules/sync-cli.js'][906] = 0;
  _$jscoverage['modules/sync-cli.js'][907] = 0;
  _$jscoverage['modules/sync-cli.js'][908] = 0;
  _$jscoverage['modules/sync-cli.js'][911] = 0;
  _$jscoverage['modules/sync-cli.js'][914] = 0;
  _$jscoverage['modules/sync-cli.js'][915] = 0;
  _$jscoverage['modules/sync-cli.js'][918] = 0;
  _$jscoverage['modules/sync-cli.js'][921] = 0;
  _$jscoverage['modules/sync-cli.js'][922] = 0;
  _$jscoverage['modules/sync-cli.js'][923] = 0;
  _$jscoverage['modules/sync-cli.js'][924] = 0;
  _$jscoverage['modules/sync-cli.js'][926] = 0;
  _$jscoverage['modules/sync-cli.js'][927] = 0;
  _$jscoverage['modules/sync-cli.js'][928] = 0;
  _$jscoverage['modules/sync-cli.js'][929] = 0;
  _$jscoverage['modules/sync-cli.js'][930] = 0;
  _$jscoverage['modules/sync-cli.js'][931] = 0;
  _$jscoverage['modules/sync-cli.js'][934] = 0;
  _$jscoverage['modules/sync-cli.js'][935] = 0;
  _$jscoverage['modules/sync-cli.js'][936] = 0;
  _$jscoverage['modules/sync-cli.js'][939] = 0;
  _$jscoverage['modules/sync-cli.js'][943] = 0;
  _$jscoverage['modules/sync-cli.js'][944] = 0;
  _$jscoverage['modules/sync-cli.js'][945] = 0;
  _$jscoverage['modules/sync-cli.js'][952] = 0;
  _$jscoverage['modules/sync-cli.js'][953] = 0;
  _$jscoverage['modules/sync-cli.js'][954] = 0;
  _$jscoverage['modules/sync-cli.js'][955] = 0;
  _$jscoverage['modules/sync-cli.js'][957] = 0;
  _$jscoverage['modules/sync-cli.js'][958] = 0;
  _$jscoverage['modules/sync-cli.js'][959] = 0;
  _$jscoverage['modules/sync-cli.js'][960] = 0;
  _$jscoverage['modules/sync-cli.js'][961] = 0;
  _$jscoverage['modules/sync-cli.js'][962] = 0;
  _$jscoverage['modules/sync-cli.js'][963] = 0;
  _$jscoverage['modules/sync-cli.js'][966] = 0;
  _$jscoverage['modules/sync-cli.js'][967] = 0;
  _$jscoverage['modules/sync-cli.js'][969] = 0;
  _$jscoverage['modules/sync-cli.js'][973] = 0;
  _$jscoverage['modules/sync-cli.js'][974] = 0;
  _$jscoverage['modules/sync-cli.js'][975] = 0;
  _$jscoverage['modules/sync-cli.js'][976] = 0;
  _$jscoverage['modules/sync-cli.js'][979] = 0;
  _$jscoverage['modules/sync-cli.js'][980] = 0;
  _$jscoverage['modules/sync-cli.js'][981] = 0;
  _$jscoverage['modules/sync-cli.js'][985] = 0;
  _$jscoverage['modules/sync-cli.js'][989] = 0;
  _$jscoverage['modules/sync-cli.js'][990] = 0;
  _$jscoverage['modules/sync-cli.js'][991] = 0;
  _$jscoverage['modules/sync-cli.js'][992] = 0;
  _$jscoverage['modules/sync-cli.js'][993] = 0;
  _$jscoverage['modules/sync-cli.js'][998] = 0;
  _$jscoverage['modules/sync-cli.js'][999] = 0;
  _$jscoverage['modules/sync-cli.js'][1001] = 0;
  _$jscoverage['modules/sync-cli.js'][1002] = 0;
  _$jscoverage['modules/sync-cli.js'][1003] = 0;
  _$jscoverage['modules/sync-cli.js'][1004] = 0;
  _$jscoverage['modules/sync-cli.js'][1006] = 0;
  _$jscoverage['modules/sync-cli.js'][1008] = 0;
  _$jscoverage['modules/sync-cli.js'][1010] = 0;
  _$jscoverage['modules/sync-cli.js'][1011] = 0;
  _$jscoverage['modules/sync-cli.js'][1014] = 0;
  _$jscoverage['modules/sync-cli.js'][1015] = 0;
  _$jscoverage['modules/sync-cli.js'][1016] = 0;
  _$jscoverage['modules/sync-cli.js'][1017] = 0;
  _$jscoverage['modules/sync-cli.js'][1018] = 0;
  _$jscoverage['modules/sync-cli.js'][1022] = 0;
  _$jscoverage['modules/sync-cli.js'][1023] = 0;
  _$jscoverage['modules/sync-cli.js'][1024] = 0;
  _$jscoverage['modules/sync-cli.js'][1025] = 0;
  _$jscoverage['modules/sync-cli.js'][1027] = 0;
  _$jscoverage['modules/sync-cli.js'][1028] = 0;
  _$jscoverage['modules/sync-cli.js'][1029] = 0;
  _$jscoverage['modules/sync-cli.js'][1030] = 0;
  _$jscoverage['modules/sync-cli.js'][1031] = 0;
  _$jscoverage['modules/sync-cli.js'][1032] = 0;
  _$jscoverage['modules/sync-cli.js'][1033] = 0;
  _$jscoverage['modules/sync-cli.js'][1040] = 0;
  _$jscoverage['modules/sync-cli.js'][1041] = 0;
  _$jscoverage['modules/sync-cli.js'][1042] = 0;
  _$jscoverage['modules/sync-cli.js'][1043] = 0;
  _$jscoverage['modules/sync-cli.js'][1044] = 0;
  _$jscoverage['modules/sync-cli.js'][1045] = 0;
  _$jscoverage['modules/sync-cli.js'][1048] = 0;
  _$jscoverage['modules/sync-cli.js'][1049] = 0;
  _$jscoverage['modules/sync-cli.js'][1050] = 0;
  _$jscoverage['modules/sync-cli.js'][1051] = 0;
  _$jscoverage['modules/sync-cli.js'][1062] = 0;
  _$jscoverage['modules/sync-cli.js'][1064] = 0;
  _$jscoverage['modules/sync-cli.js'][1065] = 0;
  _$jscoverage['modules/sync-cli.js'][1066] = 0;
  _$jscoverage['modules/sync-cli.js'][1067] = 0;
  _$jscoverage['modules/sync-cli.js'][1069] = 0;
  _$jscoverage['modules/sync-cli.js'][1070] = 0;
  _$jscoverage['modules/sync-cli.js'][1072] = 0;
  _$jscoverage['modules/sync-cli.js'][1074] = 0;
  _$jscoverage['modules/sync-cli.js'][1075] = 0;
  _$jscoverage['modules/sync-cli.js'][1077] = 0;
  _$jscoverage['modules/sync-cli.js'][1079] = 0;
  _$jscoverage['modules/sync-cli.js'][1080] = 0;
  _$jscoverage['modules/sync-cli.js'][1082] = 0;
  _$jscoverage['modules/sync-cli.js'][1084] = 0;
  _$jscoverage['modules/sync-cli.js'][1086] = 0;
  _$jscoverage['modules/sync-cli.js'][1088] = 0;
  _$jscoverage['modules/sync-cli.js'][1089] = 0;
  _$jscoverage['modules/sync-cli.js'][1093] = 0;
  _$jscoverage['modules/sync-cli.js'][1103] = 0;
  _$jscoverage['modules/sync-cli.js'][1105] = 0;
  _$jscoverage['modules/sync-cli.js'][1106] = 0;
  _$jscoverage['modules/sync-cli.js'][1107] = 0;
  _$jscoverage['modules/sync-cli.js'][1108] = 0;
  _$jscoverage['modules/sync-cli.js'][1110] = 0;
  _$jscoverage['modules/sync-cli.js'][1111] = 0;
  _$jscoverage['modules/sync-cli.js'][1112] = 0;
  _$jscoverage['modules/sync-cli.js'][1113] = 0;
  _$jscoverage['modules/sync-cli.js'][1115] = 0;
  _$jscoverage['modules/sync-cli.js'][1116] = 0;
  _$jscoverage['modules/sync-cli.js'][1118] = 0;
  _$jscoverage['modules/sync-cli.js'][1120] = 0;
  _$jscoverage['modules/sync-cli.js'][1122] = 0;
  _$jscoverage['modules/sync-cli.js'][1124] = 0;
  _$jscoverage['modules/sync-cli.js'][1125] = 0;
  _$jscoverage['modules/sync-cli.js'][1129] = 0;
  _$jscoverage['modules/sync-cli.js'][1138] = 0;
  _$jscoverage['modules/sync-cli.js'][1144] = 0;
  _$jscoverage['modules/sync-cli.js'][1145] = 0;
  _$jscoverage['modules/sync-cli.js'][1146] = 0;
  _$jscoverage['modules/sync-cli.js'][1147] = 0;
  _$jscoverage['modules/sync-cli.js'][1150] = 0;
  _$jscoverage['modules/sync-cli.js'][1151] = 0;
  _$jscoverage['modules/sync-cli.js'][1152] = 0;
  _$jscoverage['modules/sync-cli.js'][1153] = 0;
  _$jscoverage['modules/sync-cli.js'][1155] = 0;
  _$jscoverage['modules/sync-cli.js'][1156] = 0;
  _$jscoverage['modules/sync-cli.js'][1157] = 0;
  _$jscoverage['modules/sync-cli.js'][1160] = 0;
  _$jscoverage['modules/sync-cli.js'][1161] = 0;
  _$jscoverage['modules/sync-cli.js'][1164] = 0;
  _$jscoverage['modules/sync-cli.js'][1166] = 0;
  _$jscoverage['modules/sync-cli.js'][1168] = 0;
  _$jscoverage['modules/sync-cli.js'][1170] = 0;
  _$jscoverage['modules/sync-cli.js'][1171] = 0;
  _$jscoverage['modules/sync-cli.js'][1172] = 0;
  _$jscoverage['modules/sync-cli.js'][1174] = 0;
  _$jscoverage['modules/sync-cli.js'][1175] = 0;
  _$jscoverage['modules/sync-cli.js'][1176] = 0;
  _$jscoverage['modules/sync-cli.js'][1183] = 0;
  _$jscoverage['modules/sync-cli.js'][1184] = 0;
  _$jscoverage['modules/sync-cli.js'][1189] = 0;
  _$jscoverage['modules/sync-cli.js'][1190] = 0;
  _$jscoverage['modules/sync-cli.js'][1193] = 0;
  _$jscoverage['modules/sync-cli.js'][1200] = 0;
  _$jscoverage['modules/sync-cli.js'][1201] = 0;
  _$jscoverage['modules/sync-cli.js'][1204] = 0;
  _$jscoverage['modules/sync-cli.js'][1211] = 0;
  _$jscoverage['modules/sync-cli.js'][1212] = 0;
  _$jscoverage['modules/sync-cli.js'][1213] = 0;
  _$jscoverage['modules/sync-cli.js'][1215] = 0;
  _$jscoverage['modules/sync-cli.js'][1216] = 0;
  _$jscoverage['modules/sync-cli.js'][1217] = 0;
  _$jscoverage['modules/sync-cli.js'][1218] = 0;
  _$jscoverage['modules/sync-cli.js'][1219] = 0;
  _$jscoverage['modules/sync-cli.js'][1220] = 0;
  _$jscoverage['modules/sync-cli.js'][1221] = 0;
  _$jscoverage['modules/sync-cli.js'][1224] = 0;
  _$jscoverage['modules/sync-cli.js'][1225] = 0;
  _$jscoverage['modules/sync-cli.js'][1235] = 0;
  _$jscoverage['modules/sync-cli.js'][1236] = 0;
  _$jscoverage['modules/sync-cli.js'][1237] = 0;
  _$jscoverage['modules/sync-cli.js'][1238] = 0;
  _$jscoverage['modules/sync-cli.js'][1239] = 0;
  _$jscoverage['modules/sync-cli.js'][1240] = 0;
  _$jscoverage['modules/sync-cli.js'][1241] = 0;
  _$jscoverage['modules/sync-cli.js'][1242] = 0;
  _$jscoverage['modules/sync-cli.js'][1243] = 0;
  _$jscoverage['modules/sync-cli.js'][1244] = 0;
  _$jscoverage['modules/sync-cli.js'][1245] = 0;
  _$jscoverage['modules/sync-cli.js'][1246] = 0;
  _$jscoverage['modules/sync-cli.js'][1247] = 0;
  _$jscoverage['modules/sync-cli.js'][1248] = 0;
  _$jscoverage['modules/sync-cli.js'][1249] = 0;
  _$jscoverage['modules/sync-cli.js'][1260] = 0;
  _$jscoverage['modules/sync-cli.js'][1261] = 0;
  _$jscoverage['modules/sync-cli.js'][1262] = 0;
  _$jscoverage['modules/sync-cli.js'][1264] = 0;
  _$jscoverage['modules/sync-cli.js'][1265] = 0;
  _$jscoverage['modules/sync-cli.js'][1266] = 0;
  _$jscoverage['modules/sync-cli.js'][1267] = 0;
  _$jscoverage['modules/sync-cli.js'][1268] = 0;
  _$jscoverage['modules/sync-cli.js'][1270] = 0;
  _$jscoverage['modules/sync-cli.js'][1271] = 0;
  _$jscoverage['modules/sync-cli.js'][1272] = 0;
  _$jscoverage['modules/sync-cli.js'][1273] = 0;
  _$jscoverage['modules/sync-cli.js'][1281] = 0;
  _$jscoverage['modules/sync-cli.js'][1282] = 0;
  _$jscoverage['modules/sync-cli.js'][1287] = 0;
  _$jscoverage['modules/sync-cli.js'][1288] = 0;
  _$jscoverage['modules/sync-cli.js'][1293] = 0;
}
_$jscoverage['modules/sync-cli.js'][1]++;
var JSON = require("JSON");
_$jscoverage['modules/sync-cli.js'][2]++;
var actAPI = require("./api_act");
_$jscoverage['modules/sync-cli.js'][3]++;
var cloudAPI = require("./api_cloud");
_$jscoverage['modules/sync-cli.js'][4]++;
var CryptoJS = require("../../libs/generated/crypto");
_$jscoverage['modules/sync-cli.js'][5]++;
var Lawnchair = require("../../libs/generated/lawnchair");
_$jscoverage['modules/sync-cli.js'][7]++;
var self = {defaults: {"sync_frequency": 10, "auto_sync_local_updates": true, "notify_client_storage_failed": true, "notify_sync_started": true, "notify_sync_complete": true, "notify_offline_update": true, "notify_collision_detected": true, "notify_remote_update_failed": true, "notify_local_update_applied": true, "notify_remote_update_applied": true, "notify_delta_received": true, "notify_record_delta_received": true, "notify_sync_failed": true, "do_console_log": false, "crashed_count_wait": 10, "resend_crashed_updates": true, "sync_active": true, "storage_strategy": "html5-filesystem", "file_system_quota": 61644800}, notifications: {"CLIENT_STORAGE_FAILED": "client_storage_failed", "SYNC_STARTED": "sync_started", "SYNC_COMPLETE": "sync_complete", "OFFLINE_UPDATE": "offline_update", "COLLISION_DETECTED": "collision_detected", "REMOTE_UPDATE_FAILED": "remote_update_failed", "REMOTE_UPDATE_APPLIED": "remote_update_applied", "LOCAL_UPDATE_APPLIED": "local_update_applied", "DELTA_RECEIVED": "delta_received", "RECORD_DELTA_RECEIVED": "record_delta_received", "SYNC_FAILED": "sync_failed"}, datasets: {}, config: undefined, notify_callback: undefined, hasCustomSync: undefined, init: (function (options) {
  _$jscoverage['modules/sync-cli.js'][87]++;
  self.consoleLog("sync - init called");
  _$jscoverage['modules/sync-cli.js'][89]++;
  self.config = JSON.parse(JSON.stringify(self.defaults));
  _$jscoverage['modules/sync-cli.js'][90]++;
  for (var i in options) {
    _$jscoverage['modules/sync-cli.js'][91]++;
    self.config[i] = options[i];
}
  _$jscoverage['modules/sync-cli.js'][95]++;
  if (typeof options.custom_sync !== "undefined") {
    _$jscoverage['modules/sync-cli.js'][96]++;
    self.hasCustomSync = options.custom_sync;
  }
  _$jscoverage['modules/sync-cli.js'][99]++;
  self.datasetMonitor();
}), notify: (function (callback) {
  _$jscoverage['modules/sync-cli.js'][103]++;
  self.notify_callback = callback;
}), manage: (function (dataset_id, options, query_params, meta_data, cb) {
  _$jscoverage['modules/sync-cli.js'][107]++;
  self.consoleLog("manage - START");
  _$jscoverage['modules/sync-cli.js'][109]++;
  var options = options || {};
  _$jscoverage['modules/sync-cli.js'][111]++;
  var doManage = (function (dataset) {
  _$jscoverage['modules/sync-cli.js'][112]++;
  self.consoleLog("doManage dataset :: initialised = " + dataset.initialised + " :: " + dataset_id + " :: " + JSON.stringify(options));
  _$jscoverage['modules/sync-cli.js'][114]++;
  var datasetConfig = self.setOptions(options);
  _$jscoverage['modules/sync-cli.js'][116]++;
  dataset.query_params = query_params || dataset.query_params || {};
  _$jscoverage['modules/sync-cli.js'][117]++;
  dataset.meta_data = meta_data || dataset.meta_data || {};
  _$jscoverage['modules/sync-cli.js'][118]++;
  dataset.config = datasetConfig;
  _$jscoverage['modules/sync-cli.js'][119]++;
  dataset.syncRunning = false;
  _$jscoverage['modules/sync-cli.js'][120]++;
  dataset.syncPending = true;
  _$jscoverage['modules/sync-cli.js'][121]++;
  dataset.initialised = true;
  _$jscoverage['modules/sync-cli.js'][122]++;
  dataset.meta = {};
  _$jscoverage['modules/sync-cli.js'][124]++;
  self.saveDataSet(dataset_id, (function () {
  _$jscoverage['modules/sync-cli.js'][126]++;
  if (cb) {
    _$jscoverage['modules/sync-cli.js'][127]++;
    cb();
  }
}));
});
  _$jscoverage['modules/sync-cli.js'][133]++;
  self.getDataSet(dataset_id, (function (dataset) {
  _$jscoverage['modules/sync-cli.js'][134]++;
  self.consoleLog("manage - dataset already loaded");
  _$jscoverage['modules/sync-cli.js'][135]++;
  doManage(dataset);
}), (function (err) {
  _$jscoverage['modules/sync-cli.js'][137]++;
  self.consoleLog("manage - dataset not loaded... trying to load");
  _$jscoverage['modules/sync-cli.js'][140]++;
  self.loadDataSet(dataset_id, (function (dataset) {
  _$jscoverage['modules/sync-cli.js'][141]++;
  self.consoleLog("manage - dataset loaded from local storage");
  _$jscoverage['modules/sync-cli.js'][146]++;
  self.doNotify(dataset_id, null, self.notifications.LOCAL_UPDATE_APPLIED, "load");
  _$jscoverage['modules/sync-cli.js'][149]++;
  doManage(dataset);
}), (function (err) {
  _$jscoverage['modules/sync-cli.js'][153]++;
  self.consoleLog("manage - Creating new dataset for id " + dataset_id);
  _$jscoverage['modules/sync-cli.js'][154]++;
  var dataset = {};
  _$jscoverage['modules/sync-cli.js'][155]++;
  dataset.data = {};
  _$jscoverage['modules/sync-cli.js'][156]++;
  dataset.pending = {};
  _$jscoverage['modules/sync-cli.js'][157]++;
  self.datasets[dataset_id] = dataset;
  _$jscoverage['modules/sync-cli.js'][158]++;
  doManage(dataset);
}));
}));
}), setOptions: (function (options) {
  _$jscoverage['modules/sync-cli.js'][165]++;
  if (! self.config) {
    _$jscoverage['modules/sync-cli.js'][166]++;
    self.config = JSON.parse(JSON.stringify(self.defaults));
  }
  _$jscoverage['modules/sync-cli.js'][169]++;
  var datasetConfig = JSON.parse(JSON.stringify(self.config));
  _$jscoverage['modules/sync-cli.js'][170]++;
  var optionsIn = JSON.parse(JSON.stringify(options));
  _$jscoverage['modules/sync-cli.js'][171]++;
  for (var k in optionsIn) {
    _$jscoverage['modules/sync-cli.js'][172]++;
    datasetConfig[k] = optionsIn[k];
}
  _$jscoverage['modules/sync-cli.js'][175]++;
  return datasetConfig;
}), list: (function (dataset_id, success, failure) {
  _$jscoverage['modules/sync-cli.js'][179]++;
  self.getDataSet(dataset_id, (function (dataset) {
  _$jscoverage['modules/sync-cli.js'][180]++;
  if (dataset && dataset.data) {
    _$jscoverage['modules/sync-cli.js'][182]++;
    var res = JSON.parse(JSON.stringify(dataset.data));
    _$jscoverage['modules/sync-cli.js'][183]++;
    success(res);
  }
  else {
    _$jscoverage['modules/sync-cli.js'][185]++;
    if (failure) {
      _$jscoverage['modules/sync-cli.js'][185]++;
      failure("no_data");
    }
  }
}), (function (code, msg) {
  _$jscoverage['modules/sync-cli.js'][188]++;
  if (failure) {
    _$jscoverage['modules/sync-cli.js'][188]++;
    failure(code, msg);
  }
}));
}), create: (function (dataset_id, data, success, failure) {
  _$jscoverage['modules/sync-cli.js'][193]++;
  if (data == null) {
    _$jscoverage['modules/sync-cli.js'][194]++;
    if (failure) {
      _$jscoverage['modules/sync-cli.js'][195]++;
      return failure("null_data");
    }
  }
  _$jscoverage['modules/sync-cli.js'][198]++;
  self.addPendingObj(dataset_id, null, data, "create", success, failure);
}), read: (function (dataset_id, uid, success, failure) {
  _$jscoverage['modules/sync-cli.js'][202]++;
  self.getDataSet(dataset_id, (function (dataset) {
  _$jscoverage['modules/sync-cli.js'][203]++;
  var rec = dataset.data[uid];
  _$jscoverage['modules/sync-cli.js'][204]++;
  if (! rec) {
    _$jscoverage['modules/sync-cli.js'][205]++;
    failure("unknown_uid");
  }
  else {
    _$jscoverage['modules/sync-cli.js'][208]++;
    var res = JSON.parse(JSON.stringify(rec));
    _$jscoverage['modules/sync-cli.js'][209]++;
    success(res);
  }
}), (function (code, msg) {
  _$jscoverage['modules/sync-cli.js'][212]++;
  if (failure) {
    _$jscoverage['modules/sync-cli.js'][212]++;
    failure(code, msg);
  }
}));
}), update: (function (dataset_id, uid, data, success, failure) {
  _$jscoverage['modules/sync-cli.js'][217]++;
  self.addPendingObj(dataset_id, uid, data, "update", success, failure);
}), "delete": (function (dataset_id, uid, success, failure) {
  _$jscoverage['modules/sync-cli.js'][221]++;
  self.addPendingObj(dataset_id, uid, null, "delete", success, failure);
}), getPending: (function (dataset_id, cb) {
  _$jscoverage['modules/sync-cli.js'][225]++;
  self.getDataSet(dataset_id, (function (dataset) {
  _$jscoverage['modules/sync-cli.js'][226]++;
  var res;
  _$jscoverage['modules/sync-cli.js'][227]++;
  if (dataset) {
    _$jscoverage['modules/sync-cli.js'][228]++;
    res = dataset.pending;
  }
  _$jscoverage['modules/sync-cli.js'][230]++;
  cb(res);
}), (function (err, datatset_id) {
  _$jscoverage['modules/sync-cli.js'][232]++;
  self.consoleLog(err);
}));
}), clearPending: (function (dataset_id, cb) {
  _$jscoverage['modules/sync-cli.js'][237]++;
  self.getDataSet(dataset_id, (function (dataset) {
  _$jscoverage['modules/sync-cli.js'][238]++;
  dataset.pending = {};
  _$jscoverage['modules/sync-cli.js'][239]++;
  self.saveDataSet(dataset_id, cb);
}));
}), listCollisions: (function (dataset_id, success, failure) {
  _$jscoverage['modules/sync-cli.js'][244]++;
  self.getDataSet(dataset_id, (function (dataset) {
  _$jscoverage['modules/sync-cli.js'][245]++;
  self.doCloudCall({"dataset_id": dataset_id, "req": {"fn": "listCollisions", "meta_data": dataset.meta_data}}, success, failure);
}), failure);
}), removeCollision: (function (dataset_id, colissionHash, success, failure) {
  _$jscoverage['modules/sync-cli.js'][256]++;
  self.getDataSet(dataset_id, (function (dataset) {
  _$jscoverage['modules/sync-cli.js'][257]++;
  self.doCloudCall({"dataset_id": dataset_id, "req": {"fn": "removeCollision", "hash": colissionHash, meta_data: dataset.meta_data}}, success, failure);
}));
}), isOnline: (function (callback) {
  _$jscoverage['modules/sync-cli.js'][271]++;
  var online = true;
  _$jscoverage['modules/sync-cli.js'][274]++;
  if (typeof navigator.onLine !== "undefined") {
    _$jscoverage['modules/sync-cli.js'][275]++;
    online = navigator.onLine;
  }
  _$jscoverage['modules/sync-cli.js'][279]++;
  if (online) {
    _$jscoverage['modules/sync-cli.js'][281]++;
    if (typeof navigator.network !== "undefined" && typeof navigator.network.connection !== "undefined") {
      _$jscoverage['modules/sync-cli.js'][282]++;
      var networkType = navigator.network.connection.type;
      _$jscoverage['modules/sync-cli.js'][283]++;
      if (networkType === "none" || networkType === null) {
        _$jscoverage['modules/sync-cli.js'][284]++;
        online = false;
      }
    }
  }
  _$jscoverage['modules/sync-cli.js'][289]++;
  return callback(online);
}), doNotify: (function (dataset_id, uid, code, message) {
  _$jscoverage['modules/sync-cli.js'][294]++;
  if (self.notify_callback) {
    _$jscoverage['modules/sync-cli.js'][295]++;
    if (self.config["notify_" + code]) {
      _$jscoverage['modules/sync-cli.js'][296]++;
      var notification = {"dataset_id": dataset_id, "uid": uid, "code": code, "message": message};
      _$jscoverage['modules/sync-cli.js'][303]++;
      setTimeout((function () {
  _$jscoverage['modules/sync-cli.js'][304]++;
  self.notify_callback(notification);
}), 0);
    }
  }
}), getDataSet: (function (dataset_id, success, failure) {
  _$jscoverage['modules/sync-cli.js'][311]++;
  var dataset = self.datasets[dataset_id];
  _$jscoverage['modules/sync-cli.js'][313]++;
  if (dataset) {
    _$jscoverage['modules/sync-cli.js'][314]++;
    success(dataset);
  }
  else {
    _$jscoverage['modules/sync-cli.js'][316]++;
    if (failure) {
      _$jscoverage['modules/sync-cli.js'][317]++;
      failure("unknown_dataset " + dataset_id, dataset_id);
    }
  }
}), getQueryParams: (function (dataset_id, success, failure) {
  _$jscoverage['modules/sync-cli.js'][323]++;
  var dataset = self.datasets[dataset_id];
  _$jscoverage['modules/sync-cli.js'][325]++;
  if (dataset) {
    _$jscoverage['modules/sync-cli.js'][326]++;
    success(dataset.query_params);
  }
  else {
    _$jscoverage['modules/sync-cli.js'][328]++;
    if (failure) {
      _$jscoverage['modules/sync-cli.js'][329]++;
      failure("unknown_dataset " + dataset_id, dataset_id);
    }
  }
}), setQueryParams: (function (dataset_id, queryParams, success, failure) {
  _$jscoverage['modules/sync-cli.js'][335]++;
  var dataset = self.datasets[dataset_id];
  _$jscoverage['modules/sync-cli.js'][337]++;
  if (dataset) {
    _$jscoverage['modules/sync-cli.js'][338]++;
    dataset.query_params = queryParams;
    _$jscoverage['modules/sync-cli.js'][339]++;
    self.saveDataSet(dataset_id);
    _$jscoverage['modules/sync-cli.js'][340]++;
    if (success) {
      _$jscoverage['modules/sync-cli.js'][341]++;
      success(dataset.query_params);
    }
  }
  else {
    _$jscoverage['modules/sync-cli.js'][344]++;
    if (failure) {
      _$jscoverage['modules/sync-cli.js'][345]++;
      failure("unknown_dataset " + dataset_id, dataset_id);
    }
  }
}), getMetaData: (function (dataset_id, success, failure) {
  _$jscoverage['modules/sync-cli.js'][351]++;
  var dataset = self.datasets[dataset_id];
  _$jscoverage['modules/sync-cli.js'][353]++;
  if (dataset) {
    _$jscoverage['modules/sync-cli.js'][354]++;
    success(dataset.meta_data);
  }
  else {
    _$jscoverage['modules/sync-cli.js'][356]++;
    if (failure) {
      _$jscoverage['modules/sync-cli.js'][357]++;
      failure("unknown_dataset " + dataset_id, dataset_id);
    }
  }
}), setMetaData: (function (dataset_id, metaData, success, failure) {
  _$jscoverage['modules/sync-cli.js'][363]++;
  var dataset = self.datasets[dataset_id];
  _$jscoverage['modules/sync-cli.js'][365]++;
  if (dataset) {
    _$jscoverage['modules/sync-cli.js'][366]++;
    dataset.meta_data = metaData;
    _$jscoverage['modules/sync-cli.js'][367]++;
    self.saveDataSet(dataset_id);
    _$jscoverage['modules/sync-cli.js'][368]++;
    if (success) {
      _$jscoverage['modules/sync-cli.js'][369]++;
      success(dataset.meta_data);
    }
  }
  else {
    _$jscoverage['modules/sync-cli.js'][372]++;
    if (failure) {
      _$jscoverage['modules/sync-cli.js'][373]++;
      failure("unknown_dataset " + dataset_id, dataset_id);
    }
  }
}), getConfig: (function (dataset_id, success, failure) {
  _$jscoverage['modules/sync-cli.js'][379]++;
  var dataset = self.datasets[dataset_id];
  _$jscoverage['modules/sync-cli.js'][381]++;
  if (dataset) {
    _$jscoverage['modules/sync-cli.js'][382]++;
    success(dataset.config);
  }
  else {
    _$jscoverage['modules/sync-cli.js'][384]++;
    if (failure) {
      _$jscoverage['modules/sync-cli.js'][385]++;
      failure("unknown_dataset " + dataset_id, dataset_id);
    }
  }
}), setConfig: (function (dataset_id, config, success, failure) {
  _$jscoverage['modules/sync-cli.js'][391]++;
  var dataset = self.datasets[dataset_id];
  _$jscoverage['modules/sync-cli.js'][393]++;
  if (dataset) {
    _$jscoverage['modules/sync-cli.js'][394]++;
    var fullConfig = self.setOptions(config);
    _$jscoverage['modules/sync-cli.js'][395]++;
    dataset.config = fullConfig;
    _$jscoverage['modules/sync-cli.js'][396]++;
    self.saveDataSet(dataset_id);
    _$jscoverage['modules/sync-cli.js'][397]++;
    if (success) {
      _$jscoverage['modules/sync-cli.js'][398]++;
      success(dataset.config);
    }
  }
  else {
    _$jscoverage['modules/sync-cli.js'][401]++;
    if (failure) {
      _$jscoverage['modules/sync-cli.js'][402]++;
      failure("unknown_dataset " + dataset_id, dataset_id);
    }
  }
}), stopSync: (function (dataset_id, success, failure) {
  _$jscoverage['modules/sync-cli.js'][408]++;
  self.setConfig(dataset_id, {"sync_active": false}, (function () {
  _$jscoverage['modules/sync-cli.js'][409]++;
  if (success) {
    _$jscoverage['modules/sync-cli.js'][410]++;
    success();
  }
}), failure);
}), startSync: (function (dataset_id, success, failure) {
  _$jscoverage['modules/sync-cli.js'][416]++;
  self.setConfig(dataset_id, {"sync_active": true}, (function () {
  _$jscoverage['modules/sync-cli.js'][417]++;
  if (success) {
    _$jscoverage['modules/sync-cli.js'][418]++;
    success();
  }
}), failure);
}), doSync: (function (dataset_id, success, failure) {
  _$jscoverage['modules/sync-cli.js'][424]++;
  var dataset = self.datasets[dataset_id];
  _$jscoverage['modules/sync-cli.js'][426]++;
  if (dataset) {
    _$jscoverage['modules/sync-cli.js'][427]++;
    dataset.syncPending = true;
    _$jscoverage['modules/sync-cli.js'][428]++;
    self.saveDataSet(dataset_id);
    _$jscoverage['modules/sync-cli.js'][429]++;
    if (success) {
      _$jscoverage['modules/sync-cli.js'][430]++;
      success();
    }
  }
  else {
    _$jscoverage['modules/sync-cli.js'][433]++;
    if (failure) {
      _$jscoverage['modules/sync-cli.js'][434]++;
      failure("unknown_dataset " + dataset_id, dataset_id);
    }
  }
}), forceSync: (function (dataset_id, success, failure) {
  _$jscoverage['modules/sync-cli.js'][440]++;
  var dataset = self.datasets[dataset_id];
  _$jscoverage['modules/sync-cli.js'][442]++;
  if (dataset) {
    _$jscoverage['modules/sync-cli.js'][443]++;
    dataset.syncForced = true;
    _$jscoverage['modules/sync-cli.js'][444]++;
    self.saveDataSet(dataset_id);
    _$jscoverage['modules/sync-cli.js'][445]++;
    if (success) {
      _$jscoverage['modules/sync-cli.js'][446]++;
      success();
    }
  }
  else {
    _$jscoverage['modules/sync-cli.js'][449]++;
    if (failure) {
      _$jscoverage['modules/sync-cli.js'][450]++;
      failure("unknown_dataset " + dataset_id, dataset_id);
    }
  }
}), sortObject: (function (object) {
  _$jscoverage['modules/sync-cli.js'][456]++;
  if (typeof object !== "object" || object === null) {
    _$jscoverage['modules/sync-cli.js'][457]++;
    return object;
  }
  _$jscoverage['modules/sync-cli.js'][460]++;
  var result = [];
  _$jscoverage['modules/sync-cli.js'][462]++;
  Object.keys(object).sort().forEach((function (key) {
  _$jscoverage['modules/sync-cli.js'][463]++;
  result.push({key: key, value: self.sortObject(object[key])});
}));
  _$jscoverage['modules/sync-cli.js'][469]++;
  return result;
}), sortedStringify: (function (obj) {
  _$jscoverage['modules/sync-cli.js'][474]++;
  var str = "";
  _$jscoverage['modules/sync-cli.js'][476]++;
  try {
    _$jscoverage['modules/sync-cli.js'][477]++;
    str = JSON.stringify(self.sortObject(obj));
  }
  catch (e) {
    _$jscoverage['modules/sync-cli.js'][479]++;
    console.error("Error stringifying sorted object:" + e);
  }
  _$jscoverage['modules/sync-cli.js'][482]++;
  return str;
}), generateHash: (function (object) {
  _$jscoverage['modules/sync-cli.js'][486]++;
  var hash = CryptoJS.SHA1(self.sortedStringify(object));
  _$jscoverage['modules/sync-cli.js'][487]++;
  return hash.toString();
}), addPendingObj: (function (dataset_id, uid, data, action, success, failure) {
  _$jscoverage['modules/sync-cli.js'][491]++;
  self.isOnline((function (online) {
  _$jscoverage['modules/sync-cli.js'][492]++;
  if (! online) {
    _$jscoverage['modules/sync-cli.js'][493]++;
    self.doNotify(dataset_id, uid, self.notifications.OFFLINE_UPDATE, action);
  }
}));
  _$jscoverage['modules/sync-cli.js'][497]++;
  function storePendingObject(obj) {
    _$jscoverage['modules/sync-cli.js'][498]++;
    obj.hash = self.generateHash(obj);
    _$jscoverage['modules/sync-cli.js'][500]++;
    self.getDataSet(dataset_id, (function (dataset) {
  _$jscoverage['modules/sync-cli.js'][502]++;
  dataset.pending[obj.hash] = obj;
  _$jscoverage['modules/sync-cli.js'][504]++;
  self.updateDatasetFromLocal(dataset, obj);
  _$jscoverage['modules/sync-cli.js'][506]++;
  if (self.config.auto_sync_local_updates) {
    _$jscoverage['modules/sync-cli.js'][507]++;
    dataset.syncPending = true;
  }
  _$jscoverage['modules/sync-cli.js'][509]++;
  self.saveDataSet(dataset_id);
  _$jscoverage['modules/sync-cli.js'][510]++;
  self.doNotify(dataset_id, uid, self.notifications.LOCAL_UPDATE_APPLIED, action);
  _$jscoverage['modules/sync-cli.js'][512]++;
  success(obj);
}), (function (code, msg) {
  _$jscoverage['modules/sync-cli.js'][514]++;
  if (failure) {
    _$jscoverage['modules/sync-cli.js'][514]++;
    failure(code, msg);
  }
}));
}
  _$jscoverage['modules/sync-cli.js'][518]++;
  var pendingObj = {};
  _$jscoverage['modules/sync-cli.js'][519]++;
  pendingObj.inFlight = false;
  _$jscoverage['modules/sync-cli.js'][520]++;
  pendingObj.action = action;
  _$jscoverage['modules/sync-cli.js'][521]++;
  pendingObj.post = JSON.parse(JSON.stringify(data));
  _$jscoverage['modules/sync-cli.js'][522]++;
  pendingObj.postHash = self.generateHash(pendingObj.post);
  _$jscoverage['modules/sync-cli.js'][523]++;
  pendingObj.timestamp = new Date().getTime();
  _$jscoverage['modules/sync-cli.js'][524]++;
  if ("create" === action) {
    _$jscoverage['modules/sync-cli.js'][525]++;
    pendingObj.uid = pendingObj.postHash;
    _$jscoverage['modules/sync-cli.js'][526]++;
    storePendingObject(pendingObj);
  }
  else {
    _$jscoverage['modules/sync-cli.js'][528]++;
    self.read(dataset_id, uid, (function (rec) {
  _$jscoverage['modules/sync-cli.js'][529]++;
  pendingObj.uid = uid;
  _$jscoverage['modules/sync-cli.js'][530]++;
  pendingObj.pre = rec.data;
  _$jscoverage['modules/sync-cli.js'][531]++;
  pendingObj.preHash = self.generateHash(rec.data);
  _$jscoverage['modules/sync-cli.js'][532]++;
  storePendingObject(pendingObj);
}), (function (code, msg) {
  _$jscoverage['modules/sync-cli.js'][534]++;
  if (failure) {
    _$jscoverage['modules/sync-cli.js'][535]++;
    failure(code, msg);
  }
}));
  }
}), syncLoop: (function (dataset_id) {
  _$jscoverage['modules/sync-cli.js'][542]++;
  self.getDataSet(dataset_id, (function (dataSet) {
  _$jscoverage['modules/sync-cli.js'][545]++;
  dataSet.syncPending = false;
  _$jscoverage['modules/sync-cli.js'][546]++;
  dataSet.syncRunning = true;
  _$jscoverage['modules/sync-cli.js'][547]++;
  dataSet.syncLoopStart = new Date().getTime();
  _$jscoverage['modules/sync-cli.js'][548]++;
  self.doNotify(dataset_id, null, self.notifications.SYNC_STARTED, null);
  _$jscoverage['modules/sync-cli.js'][550]++;
  self.isOnline((function (online) {
  _$jscoverage['modules/sync-cli.js'][551]++;
  if (! online) {
    _$jscoverage['modules/sync-cli.js'][552]++;
    self.syncComplete(dataset_id, "offline", self.notifications.SYNC_FAILED);
  }
  else {
    _$jscoverage['modules/sync-cli.js'][554]++;
    self.checkHasCustomSync(dataset_id, (function () {
  _$jscoverage['modules/sync-cli.js'][556]++;
  var syncLoopParams = {};
  _$jscoverage['modules/sync-cli.js'][557]++;
  syncLoopParams.fn = "sync";
  _$jscoverage['modules/sync-cli.js'][558]++;
  syncLoopParams.dataset_id = dataset_id;
  _$jscoverage['modules/sync-cli.js'][559]++;
  syncLoopParams.query_params = dataSet.query_params;
  _$jscoverage['modules/sync-cli.js'][560]++;
  syncLoopParams.config = dataSet.config;
  _$jscoverage['modules/sync-cli.js'][561]++;
  syncLoopParams.meta_data = dataSet.meta_data;
  _$jscoverage['modules/sync-cli.js'][563]++;
  syncLoopParams.dataset_hash = dataSet.hash;
  _$jscoverage['modules/sync-cli.js'][564]++;
  syncLoopParams.acknowledgements = dataSet.acknowledgements || [];
  _$jscoverage['modules/sync-cli.js'][566]++;
  var pending = dataSet.pending;
  _$jscoverage['modules/sync-cli.js'][567]++;
  var pendingArray = [];
  _$jscoverage['modules/sync-cli.js'][568]++;
  for (var i in pending) {
    _$jscoverage['modules/sync-cli.js'][572]++;
    if (! pending[i].inFlight && ! pending[i].crashed && ! pending[i].delayed) {
      _$jscoverage['modules/sync-cli.js'][573]++;
      pending[i].inFlight = true;
      _$jscoverage['modules/sync-cli.js'][574]++;
      pending[i].inFlightDate = new Date().getTime();
      _$jscoverage['modules/sync-cli.js'][575]++;
      pendingArray.push(pending[i]);
    }
}
  _$jscoverage['modules/sync-cli.js'][578]++;
  syncLoopParams.pending = pendingArray;
  _$jscoverage['modules/sync-cli.js'][580]++;
  if (pendingArray.length > 0) {
    _$jscoverage['modules/sync-cli.js'][581]++;
    self.consoleLog("Starting sync loop - global hash = " + dataSet.hash + " :: params = " + JSON.stringify(syncLoopParams, null, 2));
  }
  _$jscoverage['modules/sync-cli.js'][583]++;
  try {
    _$jscoverage['modules/sync-cli.js'][584]++;
    self.doCloudCall({"dataset_id": dataset_id, "req": syncLoopParams}, (function (res) {
  _$jscoverage['modules/sync-cli.js'][588]++;
  var rec;
  _$jscoverage['modules/sync-cli.js'][590]++;
  function processUpdates(updates, notification, acknowledgements) {
    _$jscoverage['modules/sync-cli.js'][591]++;
    if (updates) {
      _$jscoverage['modules/sync-cli.js'][592]++;
      for (var up in updates) {
        _$jscoverage['modules/sync-cli.js'][593]++;
        rec = updates[up];
        _$jscoverage['modules/sync-cli.js'][594]++;
        acknowledgements.push(rec);
        _$jscoverage['modules/sync-cli.js'][595]++;
        if (dataSet.pending[up] && dataSet.pending[up].inFlight && ! dataSet.pending[up].crashed) {
          _$jscoverage['modules/sync-cli.js'][596]++;
          delete dataSet.pending[up];
          _$jscoverage['modules/sync-cli.js'][597]++;
          self.doNotify(dataset_id, rec.uid, notification, rec);
        }
}
    }
}
  _$jscoverage['modules/sync-cli.js'][604]++;
  self.updatePendingFromNewData(dataset_id, dataSet, res);
  _$jscoverage['modules/sync-cli.js'][607]++;
  self.updateCrashedInFlightFromNewData(dataset_id, dataSet, res);
  _$jscoverage['modules/sync-cli.js'][610]++;
  self.updateDelayedFromNewData(dataset_id, dataSet, res);
  _$jscoverage['modules/sync-cli.js'][613]++;
  self.updateNewDataFromInFlight(dataset_id, dataSet, res);
  _$jscoverage['modules/sync-cli.js'][616]++;
  self.updateNewDataFromPending(dataset_id, dataSet, res);
  _$jscoverage['modules/sync-cli.js'][620]++;
  if (res.records) {
    _$jscoverage['modules/sync-cli.js'][622]++;
    dataSet.data = res.records;
    _$jscoverage['modules/sync-cli.js'][623]++;
    dataSet.hash = res.hash;
    _$jscoverage['modules/sync-cli.js'][625]++;
    self.doNotify(dataset_id, res.hash, self.notifications.DELTA_RECEIVED, "full dataset");
  }
  _$jscoverage['modules/sync-cli.js'][628]++;
  if (res.updates) {
    _$jscoverage['modules/sync-cli.js'][629]++;
    var acknowledgements = [];
    _$jscoverage['modules/sync-cli.js'][630]++;
    processUpdates(res.updates.applied, self.notifications.REMOTE_UPDATE_APPLIED, acknowledgements);
    _$jscoverage['modules/sync-cli.js'][631]++;
    processUpdates(res.updates.failed, self.notifications.REMOTE_UPDATE_FAILED, acknowledgements);
    _$jscoverage['modules/sync-cli.js'][632]++;
    processUpdates(res.updates.collisions, self.notifications.COLLISION_DETECTED, acknowledgements);
    _$jscoverage['modules/sync-cli.js'][633]++;
    dataSet.acknowledgements = acknowledgements;
  }
  _$jscoverage['modules/sync-cli.js'][636]++;
  if (! res.records && res.hash && res.hash !== dataSet.hash) {
    _$jscoverage['modules/sync-cli.js'][637]++;
    self.consoleLog("Local dataset stale - syncing records :: local hash= " + dataSet.hash + " - remoteHash=" + res.hash);
    _$jscoverage['modules/sync-cli.js'][639]++;
    self.syncRecords(dataset_id);
  }
  else {
    _$jscoverage['modules/sync-cli.js'][641]++;
    self.consoleLog("Local dataset up to date");
    _$jscoverage['modules/sync-cli.js'][642]++;
    self.syncComplete(dataset_id, "online", self.notifications.SYNC_COMPLETE);
  }
}), (function (msg, err) {
  _$jscoverage['modules/sync-cli.js'][648]++;
  self.markInFlightAsCrashed(dataSet);
  _$jscoverage['modules/sync-cli.js'][649]++;
  self.consoleLog("syncLoop failed : msg=" + msg + " :: err = " + err);
  _$jscoverage['modules/sync-cli.js'][650]++;
  self.syncComplete(dataset_id, msg, self.notifications.SYNC_FAILED);
}));
  }
  catch (e) {
    _$jscoverage['modules/sync-cli.js'][654]++;
    self.consoleLog("Error performing sync - " + e);
    _$jscoverage['modules/sync-cli.js'][655]++;
    self.syncComplete(dataset_id, e, self.notifications.SYNC_FAILED);
  }
}));
  }
}));
}));
}), syncRecords: (function (dataset_id) {
  _$jscoverage['modules/sync-cli.js'][665]++;
  self.getDataSet(dataset_id, (function (dataSet) {
  _$jscoverage['modules/sync-cli.js'][667]++;
  var localDataSet = dataSet.data || {};
  _$jscoverage['modules/sync-cli.js'][669]++;
  var clientRecs = {};
  _$jscoverage['modules/sync-cli.js'][670]++;
  for (var i in localDataSet) {
    _$jscoverage['modules/sync-cli.js'][671]++;
    var uid = i;
    _$jscoverage['modules/sync-cli.js'][672]++;
    var hash = localDataSet[i].hash;
    _$jscoverage['modules/sync-cli.js'][673]++;
    clientRecs[uid] = hash;
}
  _$jscoverage['modules/sync-cli.js'][676]++;
  var syncRecParams = {};
  _$jscoverage['modules/sync-cli.js'][678]++;
  syncRecParams.fn = "syncRecords";
  _$jscoverage['modules/sync-cli.js'][679]++;
  syncRecParams.dataset_id = dataset_id;
  _$jscoverage['modules/sync-cli.js'][680]++;
  syncRecParams.query_params = dataSet.query_params;
  _$jscoverage['modules/sync-cli.js'][681]++;
  syncRecParams.clientRecs = clientRecs;
  _$jscoverage['modules/sync-cli.js'][683]++;
  self.consoleLog("syncRecParams :: " + JSON.stringify(syncRecParams));
  _$jscoverage['modules/sync-cli.js'][685]++;
  self.doCloudCall({"dataset_id": dataset_id, "req": syncRecParams}, (function (res) {
  _$jscoverage['modules/sync-cli.js'][689]++;
  var i;
  _$jscoverage['modules/sync-cli.js'][691]++;
  if (res.create) {
    _$jscoverage['modules/sync-cli.js'][692]++;
    for (i in res.create) {
      _$jscoverage['modules/sync-cli.js'][693]++;
      localDataSet[i] = {"hash": res.create[i].hash, "data": res.create[i].data};
      _$jscoverage['modules/sync-cli.js'][694]++;
      self.doNotify(dataset_id, i, self.notifications.RECORD_DELTA_RECEIVED, "create");
}
  }
  _$jscoverage['modules/sync-cli.js'][697]++;
  if (res.update) {
    _$jscoverage['modules/sync-cli.js'][698]++;
    for (i in res.update) {
      _$jscoverage['modules/sync-cli.js'][699]++;
      localDataSet[i].hash = res.update[i].hash;
      _$jscoverage['modules/sync-cli.js'][700]++;
      localDataSet[i].data = res.update[i].data;
      _$jscoverage['modules/sync-cli.js'][701]++;
      self.doNotify(dataset_id, i, self.notifications.RECORD_DELTA_RECEIVED, "update");
}
  }
  _$jscoverage['modules/sync-cli.js'][704]++;
  if (res["delete"]) {
    _$jscoverage['modules/sync-cli.js'][705]++;
    for (i in res["delete"]) {
      _$jscoverage['modules/sync-cli.js'][706]++;
      delete localDataSet[i];
      _$jscoverage['modules/sync-cli.js'][707]++;
      self.doNotify(dataset_id, i, self.notifications.RECORD_DELTA_RECEIVED, "delete");
}
  }
  _$jscoverage['modules/sync-cli.js'][711]++;
  self.doNotify(dataset_id, res.hash, self.notifications.DELTA_RECEIVED, "partial dataset");
  _$jscoverage['modules/sync-cli.js'][713]++;
  dataSet.data = localDataSet;
  _$jscoverage['modules/sync-cli.js'][714]++;
  if (res.hash) {
    _$jscoverage['modules/sync-cli.js'][715]++;
    dataSet.hash = res.hash;
  }
  _$jscoverage['modules/sync-cli.js'][717]++;
  self.syncComplete(dataset_id, "online", self.notifications.SYNC_COMPLETE);
}), (function (msg, err) {
  _$jscoverage['modules/sync-cli.js'][719]++;
  self.consoleLog("syncRecords failed : msg=" + msg + " :: err=" + err);
  _$jscoverage['modules/sync-cli.js'][720]++;
  self.syncComplete(dataset_id, msg, self.notifications.SYNC_FAILED);
}));
}));
}), syncComplete: (function (dataset_id, status, notification) {
  _$jscoverage['modules/sync-cli.js'][727]++;
  self.getDataSet(dataset_id, (function (dataset) {
  _$jscoverage['modules/sync-cli.js'][728]++;
  dataset.syncRunning = false;
  _$jscoverage['modules/sync-cli.js'][729]++;
  dataset.syncLoopEnd = new Date().getTime();
  _$jscoverage['modules/sync-cli.js'][730]++;
  self.saveDataSet(dataset_id);
  _$jscoverage['modules/sync-cli.js'][731]++;
  self.doNotify(dataset_id, dataset.hash, notification, status);
}));
}), checkDatasets: (function () {
  _$jscoverage['modules/sync-cli.js'][736]++;
  for (var dataset_id in self.datasets) {
    _$jscoverage['modules/sync-cli.js'][737]++;
    if (self.datasets.hasOwnProperty(dataset_id)) {
      _$jscoverage['modules/sync-cli.js'][738]++;
      var dataset = self.datasets[dataset_id];
      _$jscoverage['modules/sync-cli.js'][740]++;
      if (! dataset.syncRunning && (dataset.config.sync_active || dataset.syncForced)) {
        _$jscoverage['modules/sync-cli.js'][742]++;
        var lastSyncStart = dataset.syncLoopStart;
        _$jscoverage['modules/sync-cli.js'][743]++;
        var lastSyncCmp = dataset.syncLoopEnd;
        _$jscoverage['modules/sync-cli.js'][744]++;
        if (lastSyncStart == null) {
          _$jscoverage['modules/sync-cli.js'][745]++;
          self.consoleLog(dataset_id + " - Performing initial sync");
          _$jscoverage['modules/sync-cli.js'][747]++;
          dataset.syncPending = true;
        }
        else {
          _$jscoverage['modules/sync-cli.js'][748]++;
          if (lastSyncCmp != null) {
            _$jscoverage['modules/sync-cli.js'][749]++;
            var timeSinceLastSync = new Date().getTime() - lastSyncCmp;
            _$jscoverage['modules/sync-cli.js'][750]++;
            var syncFrequency = dataset.config.sync_frequency * 1000;
            _$jscoverage['modules/sync-cli.js'][751]++;
            if (timeSinceLastSync > syncFrequency) {
              _$jscoverage['modules/sync-cli.js'][753]++;
              dataset.syncPending = true;
            }
          }
        }
        _$jscoverage['modules/sync-cli.js'][757]++;
        if (dataset.syncForced) {
          _$jscoverage['modules/sync-cli.js'][758]++;
          dataset.syncPending = true;
        }
        _$jscoverage['modules/sync-cli.js'][761]++;
        if (dataset.syncPending) {
          _$jscoverage['modules/sync-cli.js'][763]++;
          dataset.syncForced = false;
          _$jscoverage['modules/sync-cli.js'][768]++;
          self.syncLoop(dataset_id);
        }
      }
    }
}
}), checkHasCustomSync: (function (dataset_id, cb) {
  _$jscoverage['modules/sync-cli.js'][776]++;
  if (self.hasCustomSync != null) {
    _$jscoverage['modules/sync-cli.js'][777]++;
    return cb();
  }
  _$jscoverage['modules/sync-cli.js'][779]++;
  self.consoleLog("starting check has custom sync");
  _$jscoverage['modules/sync-cli.js'][781]++;
  actAPI({"act": dataset_id, "req": {"fn": "sync"}}, (function (res) {
  _$jscoverage['modules/sync-cli.js'][789]++;
  self.consoleLog("checkHasCustomSync - success - ", res);
  _$jscoverage['modules/sync-cli.js'][790]++;
  self.hasCustomSync = true;
  _$jscoverage['modules/sync-cli.js'][791]++;
  return cb();
}), (function (msg, err) {
  _$jscoverage['modules/sync-cli.js'][793]++;
  self.consoleLog("checkHasCustomSync - failure - ", err);
  _$jscoverage['modules/sync-cli.js'][794]++;
  if (err.status && err.status === 500) {
    _$jscoverage['modules/sync-cli.js'][797]++;
    self.consoleLog("checkHasCustomSync - failed with 500, endpoint does exists");
    _$jscoverage['modules/sync-cli.js'][798]++;
    self.hasCustomSync = true;
  }
  else {
    _$jscoverage['modules/sync-cli.js'][800]++;
    self.hasCustomSync = false;
  }
  _$jscoverage['modules/sync-cli.js'][802]++;
  return cb();
}));
}), setHasCustomSync: (function (custom_sync) {
  _$jscoverage['modules/sync-cli.js'][807]++;
  self.hasCustomSync = custom_sync;
}), getHasCustomSync: (function () {
  _$jscoverage['modules/sync-cli.js'][811]++;
  return self.hasCustomSync;
}), doCloudCall: (function (params, success, failure) {
  _$jscoverage['modules/sync-cli.js'][815]++;
  if (self.hasCustomSync) {
    _$jscoverage['modules/sync-cli.js'][816]++;
    actAPI({"act": params.dataset_id, "req": params.req}, (function (res) {
  _$jscoverage['modules/sync-cli.js'][820]++;
  success(res);
}), (function (msg, err) {
  _$jscoverage['modules/sync-cli.js'][822]++;
  failure(msg, err);
}));
  }
  else {
    _$jscoverage['modules/sync-cli.js'][825]++;
    cloudAPI({"path": "/mbaas/sync/" + params.dataset_id, "method": "post", "data": params.req}, (function (res) {
  _$jscoverage['modules/sync-cli.js'][830]++;
  success(res);
}), (function (msg, err) {
  _$jscoverage['modules/sync-cli.js'][832]++;
  failure(msg, err);
}));
  }
}), datasetMonitor: (function () {
  _$jscoverage['modules/sync-cli.js'][838]++;
  self.checkDatasets();
  _$jscoverage['modules/sync-cli.js'][841]++;
  setTimeout((function () {
  _$jscoverage['modules/sync-cli.js'][842]++;
  self.datasetMonitor();
}), 500);
}), saveDataSet: (function (dataset_id, cb) {
  _$jscoverage['modules/sync-cli.js'][847]++;
  var onFail = (function (msg, err) {
  _$jscoverage['modules/sync-cli.js'][849]++;
  var errMsg = "save to local storage failed  msg:" + msg + " err:" + err;
  _$jscoverage['modules/sync-cli.js'][850]++;
  self.doNotify(dataset_id, null, self.notifications.CLIENT_STORAGE_FAILED, errMsg);
  _$jscoverage['modules/sync-cli.js'][851]++;
  self.consoleLog(errMsg);
});
  _$jscoverage['modules/sync-cli.js'][853]++;
  self.getDataSet(dataset_id, (function (dataset) {
  _$jscoverage['modules/sync-cli.js'][855]++;
  Lawnchair({fail: onFail, adapter: self.config.storage_strategy, size: self.config.file_system_quota}, (function () {
  _$jscoverage['modules/sync-cli.js'][856]++;
  this.save({key: "dataset_" + dataset_id, val: dataset}, (function () {
  _$jscoverage['modules/sync-cli.js'][858]++;
  if (cb) {
    _$jscoverage['modules/sync-cli.js'][858]++;
    return cb();
  }
}));
}));
}));
}), loadDataSet: (function (dataset_id, success, failure) {
  _$jscoverage['modules/sync-cli.js'][866]++;
  var onFail = (function (msg, err) {
  _$jscoverage['modules/sync-cli.js'][868]++;
  var errMsg = "load from local storage failed  msg:" + msg;
  _$jscoverage['modules/sync-cli.js'][869]++;
  self.doNotify(dataset_id, null, self.notifications.CLIENT_STORAGE_FAILED, errMsg);
  _$jscoverage['modules/sync-cli.js'][870]++;
  self.consoleLog(errMsg);
});
  _$jscoverage['modules/sync-cli.js'][873]++;
  Lawnchair({fail: onFail, adapter: self.config.storage_strategy, size: self.config.file_system_quota}, (function () {
  _$jscoverage['modules/sync-cli.js'][874]++;
  this.get("dataset_" + dataset_id, (function (data) {
  _$jscoverage['modules/sync-cli.js'][875]++;
  if (data && data.val !== null) {
    _$jscoverage['modules/sync-cli.js'][876]++;
    var dataset = data.val;
    _$jscoverage['modules/sync-cli.js'][877]++;
    if (typeof dataset === "string") {
      _$jscoverage['modules/sync-cli.js'][878]++;
      dataset = JSON.parse(dataset);
    }
    _$jscoverage['modules/sync-cli.js'][882]++;
    dataset.initialised = false;
    _$jscoverage['modules/sync-cli.js'][883]++;
    self.datasets[dataset_id] = dataset;
    _$jscoverage['modules/sync-cli.js'][884]++;
    self.consoleLog("load from local storage success for dataset_id :" + dataset_id);
    _$jscoverage['modules/sync-cli.js'][885]++;
    if (success) {
      _$jscoverage['modules/sync-cli.js'][885]++;
      return success(dataset);
    }
  }
  else {
    _$jscoverage['modules/sync-cli.js'][888]++;
    if (failure) {
      _$jscoverage['modules/sync-cli.js'][888]++;
      return failure();
    }
  }
}));
}));
}), updateDatasetFromLocal: (function (dataset, pendingRec) {
  _$jscoverage['modules/sync-cli.js'][896]++;
  var pending = dataset.pending;
  _$jscoverage['modules/sync-cli.js'][897]++;
  var previousPendingUid;
  _$jscoverage['modules/sync-cli.js'][898]++;
  var previousPending;
  _$jscoverage['modules/sync-cli.js'][900]++;
  var uid = pendingRec.uid;
  _$jscoverage['modules/sync-cli.js'][901]++;
  self.consoleLog("updating local dataset for uid " + uid + " - action = " + pendingRec.action);
  _$jscoverage['modules/sync-cli.js'][903]++;
  dataset.meta[uid] = dataset.meta[uid] || {};
  _$jscoverage['modules/sync-cli.js'][906]++;
  if (pendingRec.action === "create") {
    _$jscoverage['modules/sync-cli.js'][907]++;
    if (dataset.data[uid]) {
      _$jscoverage['modules/sync-cli.js'][908]++;
      self.consoleLog("dataset already exists for uid in create :: " + JSON.stringify(dataset.data[uid]));
      _$jscoverage['modules/sync-cli.js'][911]++;
      if (dataset.meta[uid].fromPending) {
        _$jscoverage['modules/sync-cli.js'][914]++;
        previousPendingUid = dataset.meta[uid].pendingUid;
        _$jscoverage['modules/sync-cli.js'][915]++;
        delete pending[previousPendingUid];
      }
    }
    _$jscoverage['modules/sync-cli.js'][918]++;
    dataset.data[uid] = {};
  }
  _$jscoverage['modules/sync-cli.js'][921]++;
  if (pendingRec.action === "update") {
    _$jscoverage['modules/sync-cli.js'][922]++;
    if (dataset.data[uid]) {
      _$jscoverage['modules/sync-cli.js'][923]++;
      if (dataset.meta[uid].fromPending) {
        _$jscoverage['modules/sync-cli.js'][924]++;
        self.consoleLog("updating an existing pending record for dataset :: " + JSON.stringify(dataset.data[uid]));
        _$jscoverage['modules/sync-cli.js'][926]++;
        previousPendingUid = dataset.meta[uid].pendingUid;
        _$jscoverage['modules/sync-cli.js'][927]++;
        dataset.meta[uid].previousPendingUid = previousPendingUid;
        _$jscoverage['modules/sync-cli.js'][928]++;
        previousPending = pending[previousPendingUid];
        _$jscoverage['modules/sync-cli.js'][929]++;
        if (previousPending) {
          _$jscoverage['modules/sync-cli.js'][930]++;
          if (! previousPending.inFlight) {
            _$jscoverage['modules/sync-cli.js'][931]++;
            self.consoleLog("existing pre-flight pending record = " + JSON.stringify(previousPending));
            _$jscoverage['modules/sync-cli.js'][934]++;
            previousPending.post = pendingRec.post;
            _$jscoverage['modules/sync-cli.js'][935]++;
            previousPending.postHash = pendingRec.postHash;
            _$jscoverage['modules/sync-cli.js'][936]++;
            delete pending[pendingRec.hash];
            _$jscoverage['modules/sync-cli.js'][939]++;
            pendingRec.hash = previousPendingUid;
          }
          else {
            _$jscoverage['modules/sync-cli.js'][943]++;
            self.consoleLog("existing in-inflight pending record = " + JSON.stringify(previousPending));
            _$jscoverage['modules/sync-cli.js'][944]++;
            pendingRec.delayed = true;
            _$jscoverage['modules/sync-cli.js'][945]++;
            pendingRec.waiting = previousPending.hash;
          }
        }
      }
    }
  }
  _$jscoverage['modules/sync-cli.js'][952]++;
  if (pendingRec.action === "delete") {
    _$jscoverage['modules/sync-cli.js'][953]++;
    if (dataset.data[uid]) {
      _$jscoverage['modules/sync-cli.js'][954]++;
      if (dataset.meta[uid].fromPending) {
        _$jscoverage['modules/sync-cli.js'][955]++;
        self.consoleLog("Deleting an existing pending record for dataset :: " + JSON.stringify(dataset.data[uid]));
        _$jscoverage['modules/sync-cli.js'][957]++;
        previousPendingUid = dataset.meta[uid].pendingUid;
        _$jscoverage['modules/sync-cli.js'][958]++;
        dataset.meta[uid].previousPendingUid = previousPendingUid;
        _$jscoverage['modules/sync-cli.js'][959]++;
        previousPending = pending[previousPendingUid];
        _$jscoverage['modules/sync-cli.js'][960]++;
        if (previousPending) {
          _$jscoverage['modules/sync-cli.js'][961]++;
          if (! previousPending.inFlight) {
            _$jscoverage['modules/sync-cli.js'][962]++;
            self.consoleLog("existing pending record = " + JSON.stringify(previousPending));
            _$jscoverage['modules/sync-cli.js'][963]++;
            if (previousPending.action === "create") {
              _$jscoverage['modules/sync-cli.js'][966]++;
              delete pending[pendingRec.hash];
              _$jscoverage['modules/sync-cli.js'][967]++;
              delete pending[previousPendingUid];
            }
            _$jscoverage['modules/sync-cli.js'][969]++;
            if (previousPending.action === "update") {
              _$jscoverage['modules/sync-cli.js'][973]++;
              pendingRec.pre = previousPending.pre;
              _$jscoverage['modules/sync-cli.js'][974]++;
              pendingRec.preHash = previousPending.preHash;
              _$jscoverage['modules/sync-cli.js'][975]++;
              pendingRec.inFlight = false;
              _$jscoverage['modules/sync-cli.js'][976]++;
              delete pending[previousPendingUid];
            }
          }
          else {
            _$jscoverage['modules/sync-cli.js'][979]++;
            self.consoleLog("existing in-inflight pending record = " + JSON.stringify(previousPending));
            _$jscoverage['modules/sync-cli.js'][980]++;
            pendingRec.delayed = true;
            _$jscoverage['modules/sync-cli.js'][981]++;
            pendingRec.waiting = previousPending.hash;
          }
        }
      }
      _$jscoverage['modules/sync-cli.js'][985]++;
      delete dataset.data[uid];
    }
  }
  _$jscoverage['modules/sync-cli.js'][989]++;
  if (dataset.data[uid]) {
    _$jscoverage['modules/sync-cli.js'][990]++;
    dataset.data[uid].data = pendingRec.post;
    _$jscoverage['modules/sync-cli.js'][991]++;
    dataset.data[uid].hash = pendingRec.postHash;
    _$jscoverage['modules/sync-cli.js'][992]++;
    dataset.meta[uid].fromPending = true;
    _$jscoverage['modules/sync-cli.js'][993]++;
    dataset.meta[uid].pendingUid = pendingRec.hash;
  }
}), updatePendingFromNewData: (function (dataset_id, dataset, newData) {
  _$jscoverage['modules/sync-cli.js'][998]++;
  var pending = dataset.pending;
  _$jscoverage['modules/sync-cli.js'][999]++;
  var newRec;
  _$jscoverage['modules/sync-cli.js'][1001]++;
  if (pending && newData.records) {
    _$jscoverage['modules/sync-cli.js'][1002]++;
    for (var pendingHash in pending) {
      _$jscoverage['modules/sync-cli.js'][1003]++;
      if (pending.hasOwnProperty(pendingHash)) {
        _$jscoverage['modules/sync-cli.js'][1004]++;
        var pendingRec = pending[pendingHash];
        _$jscoverage['modules/sync-cli.js'][1006]++;
        dataset.meta[pendingRec.uid] = dataset.meta[pendingRec.uid] || {};
        _$jscoverage['modules/sync-cli.js'][1008]++;
        if (pendingRec.inFlight === false) {
          _$jscoverage['modules/sync-cli.js'][1010]++;
          self.consoleLog("updatePendingFromNewData - Found Non inFlight record -> action=" + pendingRec.action + " :: uid=" + pendingRec.uid + " :: hash=" + pendingRec.hash);
          _$jscoverage['modules/sync-cli.js'][1011]++;
          if (pendingRec.action === "update" || pendingRec.action === "delete") {
            _$jscoverage['modules/sync-cli.js'][1014]++;
            newRec = newData.records[pendingRec.uid];
            _$jscoverage['modules/sync-cli.js'][1015]++;
            if (newRec) {
              _$jscoverage['modules/sync-cli.js'][1016]++;
              self.consoleLog("updatePendingFromNewData - Updating pre values for existing pending record " + pendingRec.uid);
              _$jscoverage['modules/sync-cli.js'][1017]++;
              pendingRec.pre = newRec.data;
              _$jscoverage['modules/sync-cli.js'][1018]++;
              pendingRec.preHash = newRec.hash;
            }
            else {
              _$jscoverage['modules/sync-cli.js'][1022]++;
              var previousPendingUid = dataset.meta[pendingRec.uid].previousPendingUid;
              _$jscoverage['modules/sync-cli.js'][1023]++;
              var previousPending = pending[previousPendingUid];
              _$jscoverage['modules/sync-cli.js'][1024]++;
              if (previousPending) {
                _$jscoverage['modules/sync-cli.js'][1025]++;
                if (newData && newData.updates && newData.updates.applied && newData.updates.applied[previousPending.hash]) {
                  _$jscoverage['modules/sync-cli.js'][1027]++;
                  var newUid = newData.updates.applied[previousPending.hash].uid;
                  _$jscoverage['modules/sync-cli.js'][1028]++;
                  newRec = newData.records[newUid];
                  _$jscoverage['modules/sync-cli.js'][1029]++;
                  if (newRec) {
                    _$jscoverage['modules/sync-cli.js'][1030]++;
                    self.consoleLog("updatePendingFromNewData - Updating pre values for existing pending record which was previously a create " + pendingRec.uid + " ==> " + newUid);
                    _$jscoverage['modules/sync-cli.js'][1031]++;
                    pendingRec.pre = newRec.data;
                    _$jscoverage['modules/sync-cli.js'][1032]++;
                    pendingRec.preHash = newRec.hash;
                    _$jscoverage['modules/sync-cli.js'][1033]++;
                    pendingRec.uid = newUid;
                  }
                }
              }
            }
          }
          _$jscoverage['modules/sync-cli.js'][1040]++;
          if (pendingRec.action === "create") {
            _$jscoverage['modules/sync-cli.js'][1041]++;
            if (newData && newData.updates && newData.updates.applied && newData.updates.applied[pendingHash]) {
              _$jscoverage['modules/sync-cli.js'][1042]++;
              self.consoleLog("updatePendingFromNewData - Found an update for a pending create " + JSON.stringify(newData.updates.applied[pendingHash]));
              _$jscoverage['modules/sync-cli.js'][1043]++;
              newRec = newData.records[newData.updates.applied[pendingHash].uid];
              _$jscoverage['modules/sync-cli.js'][1044]++;
              if (newRec) {
                _$jscoverage['modules/sync-cli.js'][1045]++;
                self.consoleLog("updatePendingFromNewData - Changing pending create to an update based on new record  " + JSON.stringify(newRec));
                _$jscoverage['modules/sync-cli.js'][1048]++;
                pendingRec.action = "update";
                _$jscoverage['modules/sync-cli.js'][1049]++;
                pendingRec.pre = newRec.data;
                _$jscoverage['modules/sync-cli.js'][1050]++;
                pendingRec.preHash = newRec.hash;
                _$jscoverage['modules/sync-cli.js'][1051]++;
                pendingRec.uid = newData.updates.applied[pendingHash].uid;
              }
            }
          }
        }
      }
}
  }
}), updateNewDataFromInFlight: (function (dataset_id, dataset, newData) {
  _$jscoverage['modules/sync-cli.js'][1062]++;
  var pending = dataset.pending;
  _$jscoverage['modules/sync-cli.js'][1064]++;
  if (pending && newData.records) {
    _$jscoverage['modules/sync-cli.js'][1065]++;
    for (var pendingHash in pending) {
      _$jscoverage['modules/sync-cli.js'][1066]++;
      if (pending.hasOwnProperty(pendingHash)) {
        _$jscoverage['modules/sync-cli.js'][1067]++;
        var pendingRec = pending[pendingHash];
        _$jscoverage['modules/sync-cli.js'][1069]++;
        if (pendingRec.inFlight) {
          _$jscoverage['modules/sync-cli.js'][1070]++;
          var updateReceivedForPending = (newData && newData.updates && newData.updates.hashes && newData.updates.hashes[pendingHash])? true: false;
          _$jscoverage['modules/sync-cli.js'][1072]++;
          self.consoleLog("updateNewDataFromInFlight - Found inflight pending Record - action = " + pendingRec.action + " :: hash = " + pendingHash + " :: updateReceivedForPending=" + updateReceivedForPending);
          _$jscoverage['modules/sync-cli.js'][1074]++;
          if (! updateReceivedForPending) {
            _$jscoverage['modules/sync-cli.js'][1075]++;
            var newRec = newData.records[pendingRec.uid];
            _$jscoverage['modules/sync-cli.js'][1077]++;
            if (pendingRec.action === "update" && newRec) {
              _$jscoverage['modules/sync-cli.js'][1079]++;
              newRec.data = pendingRec.post;
              _$jscoverage['modules/sync-cli.js'][1080]++;
              newRec.hash = pendingRec.postHash;
            }
            else {
              _$jscoverage['modules/sync-cli.js'][1082]++;
              if (pendingRec.action === "delete" && newRec) {
                _$jscoverage['modules/sync-cli.js'][1084]++;
                delete newData.records[pendingRec.uid];
              }
              else {
                _$jscoverage['modules/sync-cli.js'][1086]++;
                if (pendingRec.action === "create") {
                  _$jscoverage['modules/sync-cli.js'][1088]++;
                  self.consoleLog("updateNewDataFromInFlight - re adding pending create to incomming dataset");
                  _$jscoverage['modules/sync-cli.js'][1089]++;
                  var newPendingCreate = {data: pendingRec.post, hash: pendingRec.postHash};
                  _$jscoverage['modules/sync-cli.js'][1093]++;
                  newData.records[pendingRec.uid] = newPendingCreate;
                }
              }
            }
          }
        }
      }
}
  }
}), updateNewDataFromPending: (function (dataset_id, dataset, newData) {
  _$jscoverage['modules/sync-cli.js'][1103]++;
  var pending = dataset.pending;
  _$jscoverage['modules/sync-cli.js'][1105]++;
  if (pending && newData.records) {
    _$jscoverage['modules/sync-cli.js'][1106]++;
    for (var pendingHash in pending) {
      _$jscoverage['modules/sync-cli.js'][1107]++;
      if (pending.hasOwnProperty(pendingHash)) {
        _$jscoverage['modules/sync-cli.js'][1108]++;
        var pendingRec = pending[pendingHash];
        _$jscoverage['modules/sync-cli.js'][1110]++;
        if (pendingRec.inFlight === false) {
          _$jscoverage['modules/sync-cli.js'][1111]++;
          self.consoleLog("updateNewDataFromPending - Found Non inFlight record -> action=" + pendingRec.action + " :: uid=" + pendingRec.uid + " :: hash=" + pendingRec.hash);
          _$jscoverage['modules/sync-cli.js'][1112]++;
          var newRec = newData.records[pendingRec.uid];
          _$jscoverage['modules/sync-cli.js'][1113]++;
          if (pendingRec.action === "update" && newRec) {
            _$jscoverage['modules/sync-cli.js'][1115]++;
            newRec.data = pendingRec.post;
            _$jscoverage['modules/sync-cli.js'][1116]++;
            newRec.hash = pendingRec.postHash;
          }
          else {
            _$jscoverage['modules/sync-cli.js'][1118]++;
            if (pendingRec.action === "delete" && newRec) {
              _$jscoverage['modules/sync-cli.js'][1120]++;
              delete newData.records[pendingRec.uid];
            }
            else {
              _$jscoverage['modules/sync-cli.js'][1122]++;
              if (pendingRec.action === "create") {
                _$jscoverage['modules/sync-cli.js'][1124]++;
                self.consoleLog("updateNewDataFromPending - re adding pending create to incomming dataset");
                _$jscoverage['modules/sync-cli.js'][1125]++;
                var newPendingCreate = {data: pendingRec.post, hash: pendingRec.postHash};
                _$jscoverage['modules/sync-cli.js'][1129]++;
                newData.records[pendingRec.uid] = newPendingCreate;
              }
            }
          }
        }
      }
}
  }
}), updateCrashedInFlightFromNewData: (function (dataset_id, dataset, newData) {
  _$jscoverage['modules/sync-cli.js'][1138]++;
  var updateNotifications = {applied: self.notifications.REMOTE_UPDATE_APPLIED, failed: self.notifications.REMOTE_UPDATE_FAILED, collisions: self.notifications.COLLISION_DETECTED};
  _$jscoverage['modules/sync-cli.js'][1144]++;
  var pending = dataset.pending;
  _$jscoverage['modules/sync-cli.js'][1145]++;
  var resolvedCrashes = {};
  _$jscoverage['modules/sync-cli.js'][1146]++;
  var pendingHash;
  _$jscoverage['modules/sync-cli.js'][1147]++;
  var pendingRec;
  _$jscoverage['modules/sync-cli.js'][1150]++;
  if (pending) {
    _$jscoverage['modules/sync-cli.js'][1151]++;
    for (pendingHash in pending) {
      _$jscoverage['modules/sync-cli.js'][1152]++;
      if (pending.hasOwnProperty(pendingHash)) {
        _$jscoverage['modules/sync-cli.js'][1153]++;
        pendingRec = pending[pendingHash];
        _$jscoverage['modules/sync-cli.js'][1155]++;
        if (pendingRec.inFlight && pendingRec.crashed) {
          _$jscoverage['modules/sync-cli.js'][1156]++;
          self.consoleLog("updateCrashedInFlightFromNewData - Found crashed inFlight pending record uid=" + pendingRec.uid + " :: hash=" + pendingRec.hash);
          _$jscoverage['modules/sync-cli.js'][1157]++;
          if (newData && newData.updates && newData.updates.hashes) {
            _$jscoverage['modules/sync-cli.js'][1160]++;
            var crashedUpdate = newData.updates.hashes[pendingHash];
            _$jscoverage['modules/sync-cli.js'][1161]++;
            if (crashedUpdate) {
              _$jscoverage['modules/sync-cli.js'][1164]++;
              resolvedCrashes[crashedUpdate.uid] = crashedUpdate;
              _$jscoverage['modules/sync-cli.js'][1166]++;
              self.consoleLog("updateCrashedInFlightFromNewData - Resolving status for crashed inflight pending record " + JSON.stringify(crashedUpdate));
              _$jscoverage['modules/sync-cli.js'][1168]++;
              if (crashedUpdate.type === "failed") {
                _$jscoverage['modules/sync-cli.js'][1170]++;
                if (crashedUpdate.action === "create") {
                  _$jscoverage['modules/sync-cli.js'][1171]++;
                  self.consoleLog("updateCrashedInFlightFromNewData - Deleting failed create from dataset");
                  _$jscoverage['modules/sync-cli.js'][1172]++;
                  delete dataset.data[crashedUpdate.uid];
                }
                else {
                  _$jscoverage['modules/sync-cli.js'][1174]++;
                  if (crashedUpdate.action === "update" || crashedUpdate.action === "delete") {
                    _$jscoverage['modules/sync-cli.js'][1175]++;
                    self.consoleLog("updateCrashedInFlightFromNewData - Reverting failed " + crashedUpdate.action + " in dataset");
                    _$jscoverage['modules/sync-cli.js'][1176]++;
                    dataset.data[crashedUpdate.uid] = {data: pendingRec.pre, hash: pendingRec.preHash};
                  }
                }
              }
              _$jscoverage['modules/sync-cli.js'][1183]++;
              delete pending[pendingHash];
              _$jscoverage['modules/sync-cli.js'][1184]++;
              self.doNotify(dataset_id, crashedUpdate.uid, updateNotifications[crashedUpdate.type], crashedUpdate);
            }
            else {
              _$jscoverage['modules/sync-cli.js'][1189]++;
              if (pendingRec.crashedCount) {
                _$jscoverage['modules/sync-cli.js'][1190]++;
                pendingRec.crashedCount++;
              }
              else {
                _$jscoverage['modules/sync-cli.js'][1193]++;
                pendingRec.crashedCount = 1;
              }
            }
          }
          else {
            _$jscoverage['modules/sync-cli.js'][1200]++;
            if (pendingRec.crashedCount) {
              _$jscoverage['modules/sync-cli.js'][1201]++;
              pendingRec.crashedCount++;
            }
            else {
              _$jscoverage['modules/sync-cli.js'][1204]++;
              pendingRec.crashedCount = 1;
            }
          }
        }
      }
}
    _$jscoverage['modules/sync-cli.js'][1211]++;
    for (pendingHash in pending) {
      _$jscoverage['modules/sync-cli.js'][1212]++;
      if (pending.hasOwnProperty(pendingHash)) {
        _$jscoverage['modules/sync-cli.js'][1213]++;
        pendingRec = pending[pendingHash];
        _$jscoverage['modules/sync-cli.js'][1215]++;
        if (pendingRec.inFlight && pendingRec.crashed) {
          _$jscoverage['modules/sync-cli.js'][1216]++;
          if (pendingRec.crashedCount > dataset.config.crashed_count_wait) {
            _$jscoverage['modules/sync-cli.js'][1217]++;
            self.consoleLog("updateCrashedInFlightFromNewData - Crashed inflight pending record has reached crashed_count_wait limit : " + JSON.stringify(pendingRec));
            _$jscoverage['modules/sync-cli.js'][1218]++;
            if (dataset.config.resend_crashed_updates) {
              _$jscoverage['modules/sync-cli.js'][1219]++;
              self.consoleLog("updateCrashedInFlightFromNewData - Retryig crashed inflight pending record");
              _$jscoverage['modules/sync-cli.js'][1220]++;
              pendingRec.crashed = false;
              _$jscoverage['modules/sync-cli.js'][1221]++;
              pendingRec.inFlight = false;
            }
            else {
              _$jscoverage['modules/sync-cli.js'][1224]++;
              self.consoleLog("updateCrashedInFlightFromNewData - Deleting crashed inflight pending record");
              _$jscoverage['modules/sync-cli.js'][1225]++;
              delete pending[pendingHash];
            }
          }
        }
      }
}
  }
}), updateDelayedFromNewData: (function (dataset_id, dataset, newData) {
  _$jscoverage['modules/sync-cli.js'][1235]++;
  var pending = dataset.pending;
  _$jscoverage['modules/sync-cli.js'][1236]++;
  var pendingHash;
  _$jscoverage['modules/sync-cli.js'][1237]++;
  var pendingRec;
  _$jscoverage['modules/sync-cli.js'][1238]++;
  if (pending) {
    _$jscoverage['modules/sync-cli.js'][1239]++;
    for (pendingHash in pending) {
      _$jscoverage['modules/sync-cli.js'][1240]++;
      if (pending.hasOwnProperty(pendingHash)) {
        _$jscoverage['modules/sync-cli.js'][1241]++;
        pendingRec = pending[pendingHash];
        _$jscoverage['modules/sync-cli.js'][1242]++;
        if (pendingRec.delayed && pendingRec.waiting) {
          _$jscoverage['modules/sync-cli.js'][1243]++;
          self.consoleLog("updateDelayedFromNewData - Found delayed pending record uid=" + pendingRec.uid + " :: hash=" + pendingRec.hash + " :: waiting=" + pendingRec.waiting);
          _$jscoverage['modules/sync-cli.js'][1244]++;
          if (newData && newData.updates && newData.updates.hashes) {
            _$jscoverage['modules/sync-cli.js'][1245]++;
            var waitingRec = newData.updates.hashes[pendingRec.waiting];
            _$jscoverage['modules/sync-cli.js'][1246]++;
            if (waitingRec) {
              _$jscoverage['modules/sync-cli.js'][1247]++;
              self.consoleLog("updateDelayedFromNewData - Waiting pending record is resolved rec=" + JSON.stringify(waitingRec));
              _$jscoverage['modules/sync-cli.js'][1248]++;
              pendingRec.delayed = false;
              _$jscoverage['modules/sync-cli.js'][1249]++;
              pendingRec.waiting = undefined;
            }
          }
        }
      }
}
  }
}), markInFlightAsCrashed: (function (dataset) {
  _$jscoverage['modules/sync-cli.js'][1260]++;
  var pending = dataset.pending;
  _$jscoverage['modules/sync-cli.js'][1261]++;
  var pendingHash;
  _$jscoverage['modules/sync-cli.js'][1262]++;
  var pendingRec;
  _$jscoverage['modules/sync-cli.js'][1264]++;
  if (pending) {
    _$jscoverage['modules/sync-cli.js'][1265]++;
    var crashedRecords = {};
    _$jscoverage['modules/sync-cli.js'][1266]++;
    for (pendingHash in pending) {
      _$jscoverage['modules/sync-cli.js'][1267]++;
      if (pending.hasOwnProperty(pendingHash)) {
        _$jscoverage['modules/sync-cli.js'][1268]++;
        pendingRec = pending[pendingHash];
        _$jscoverage['modules/sync-cli.js'][1270]++;
        if (pendingRec.inFlight) {
          _$jscoverage['modules/sync-cli.js'][1271]++;
          self.consoleLog("Marking in flight pending record as crashed : " + pendingHash);
          _$jscoverage['modules/sync-cli.js'][1272]++;
          pendingRec.crashed = true;
          _$jscoverage['modules/sync-cli.js'][1273]++;
          crashedRecords[pendingRec.uid] = pendingRec;
        }
      }
}
  }
}), consoleLog: (function (msg) {
  _$jscoverage['modules/sync-cli.js'][1281]++;
  if (self.config.do_console_log) {
    _$jscoverage['modules/sync-cli.js'][1282]++;
    console.log(msg);
  }
})};
_$jscoverage['modules/sync-cli.js'][1287]++;
(function () {
  _$jscoverage['modules/sync-cli.js'][1288]++;
  self.config = self.defaults;
})();
_$jscoverage['modules/sync-cli.js'][1293]++;
module.exports = {init: self.init, manage: self.manage, notify: self.notify, doList: self.list, doCreate: self.create, doRead: self.read, doUpdate: self.update, doDelete: self["delete"], listCollisions: self.listCollisions, removeCollision: self.removeCollision, getPending: self.getPending, clearPending: self.clearPending, getDataset: self.getDataSet, getQueryParams: self.getQueryParams, setQueryParams: self.setQueryParams, getMetaData: self.getMetaData, setMetaData: self.setMetaData, getConfig: self.getConfig, setConfig: self.setConfig, startSync: self.startSync, stopSync: self.stopSync, doSync: self.doSync, forceSync: self.forceSync, generateHash: self.generateHash, loadDataSet: self.loadDataSet, setHasCustomSync: self.setHasCustomSync, checkHasCustomSync: self.checkHasCustomSync, getHasCustomSync: self.getHasCustomSync};
_$jscoverage['modules/sync-cli.js'].source = ["var JSON = require(\"JSON\");","var actAPI = require(\"./api_act\");","var cloudAPI = require(\"./api_cloud\");","var CryptoJS = require(\"../../libs/generated/crypto\");","var Lawnchair = require('../../libs/generated/lawnchair');","","var self = {","","  // CONFIG","  defaults: {","    \"sync_frequency\": 10,","    // How often to synchronise data with the cloud in seconds.","    \"auto_sync_local_updates\": true,","    // Should local chages be syned to the cloud immediately, or should they wait for the next sync interval","    \"notify_client_storage_failed\": true,","    // Should a notification event be triggered when loading/saving to client storage fails","    \"notify_sync_started\": true,","    // Should a notification event be triggered when a sync cycle with the server has been started","    \"notify_sync_complete\": true,","    // Should a notification event be triggered when a sync cycle with the server has been completed","    \"notify_offline_update\": true,","    // Should a notification event be triggered when an attempt was made to update a record while offline","    \"notify_collision_detected\": true,","    // Should a notification event be triggered when an update failed due to data collision","    \"notify_remote_update_failed\": true,","    // Should a notification event be triggered when an update failed for a reason other than data collision","    \"notify_local_update_applied\": true,","    // Should a notification event be triggered when an update was applied to the local data store","    \"notify_remote_update_applied\": true,","    // Should a notification event be triggered when an update was applied to the remote data store","    \"notify_delta_received\": true,","    // Should a notification event be triggered when a delta was received from the remote data store for the dataset ","    \"notify_record_delta_received\": true,","    // Should a notification event be triggered when a delta was received from the remote data store for a record","    \"notify_sync_failed\": true,","    // Should a notification event be triggered when the sync loop failed to complete","    \"do_console_log\": false,","    // Should log statements be written to console.log","    \"crashed_count_wait\" : 10,","    // How many syncs should we check for updates on crashed in flight updates before we give up searching","    \"resend_crashed_updates\" : true,","    // If we have reached the crashed_count_wait limit, should we re-try sending the crashed in flight pending record","    \"sync_active\" : true,","    // Is the background sync with the cloud currently active","    \"storage_strategy\" : \"html5-filesystem\",","    // Storage strategy to use for Lawnchair - supported strategies are 'html5-filesystem' and 'dom'","    \"file_system_quota\" : 50 * 1024 * 1204","    // Amount of space to request from the HTML5 filesystem API when running in browser","  },","","  notifications: {","    \"CLIENT_STORAGE_FAILED\": \"client_storage_failed\",","    // loading/saving to client storage failed","    \"SYNC_STARTED\": \"sync_started\",","    // A sync cycle with the server has been started","    \"SYNC_COMPLETE\": \"sync_complete\",","    // A sync cycle with the server has been completed","    \"OFFLINE_UPDATE\": \"offline_update\",","    // An attempt was made to update a record while offline","    \"COLLISION_DETECTED\": \"collision_detected\",","    //Update Failed due to data collision","    \"REMOTE_UPDATE_FAILED\": \"remote_update_failed\",","    // Update Failed for a reason other than data collision","    \"REMOTE_UPDATE_APPLIED\": \"remote_update_applied\",","    // An update was applied to the remote data store","    \"LOCAL_UPDATE_APPLIED\": \"local_update_applied\",","    // An update was applied to the local data store","    \"DELTA_RECEIVED\": \"delta_received\",","    // A delta was received from the remote data store for the dataset ","    \"RECORD_DELTA_RECEIVED\": \"record_delta_received\",","    // A delta was received from the remote data store for the record ","    \"SYNC_FAILED\": \"sync_failed\"","    // Sync loop failed to complete","  },","","  datasets: {},","","  // Initialise config to default values;","  config: undefined,","","  notify_callback: undefined,","","  hasCustomSync : undefined,","","  // PUBLIC FUNCTION IMPLEMENTATIONS","  init: function(options) {","    self.consoleLog('sync - init called');","","    self.config = JSON.parse(JSON.stringify(self.defaults));","    for (var i in options) {","      self.config[i] = options[i];","    }","","    //for testing","    if(typeof options.custom_sync !== \"undefined\"){","      self.hasCustomSync = options.custom_sync;","    }","","    self.datasetMonitor();","  },","","  notify: function(callback) {","    self.notify_callback = callback;","  },","","  manage: function(dataset_id, options, query_params, meta_data, cb) {","    self.consoleLog('manage - START');","","    var options = options || {};","","    var doManage = function(dataset) {","      self.consoleLog('doManage dataset :: initialised = ' + dataset.initialised + \" :: \" + dataset_id + ' :: ' + JSON.stringify(options));","","      var datasetConfig = self.setOptions(options);","","      dataset.query_params = query_params || dataset.query_params || {};","      dataset.meta_data = meta_data || dataset.meta_data || {};","      dataset.config = datasetConfig;","      dataset.syncRunning = false;","      dataset.syncPending = true;","      dataset.initialised = true;","      dataset.meta = {};","","      self.saveDataSet(dataset_id, function() {","","        if( cb ) {","          cb();","        }","      });","    };","","    // Check if the dataset is already loaded","    self.getDataSet(dataset_id, function(dataset) {","      self.consoleLog('manage - dataset already loaded');","      doManage(dataset);","    }, function(err) {","      self.consoleLog('manage - dataset not loaded... trying to load');","","      // Not already loaded, try to load from local storage","      self.loadDataSet(dataset_id, function(dataset) {","          self.consoleLog('manage - dataset loaded from local storage');","","          // Loading from local storage worked","","          // Fire the local update event to indicate that dataset was loaded from local storage","          self.doNotify(dataset_id, null, self.notifications.LOCAL_UPDATE_APPLIED, \"load\");","","          // Put the dataet under the management of the sync service","          doManage(dataset);","        },","        function(err) {","          // No dataset in memory or local storage - create a new one and put it in memory","          self.consoleLog('manage - Creating new dataset for id ' + dataset_id);","          var dataset = {};","          dataset.data = {};","          dataset.pending = {};","          self.datasets[dataset_id] = dataset;","          doManage(dataset);","        });","    });","  },","","  setOptions: function(options) {","    // Make sure config is initialised","    if( ! self.config ) {","      self.config = JSON.parse(JSON.stringify(self.defaults));","    }","","    var datasetConfig = JSON.parse(JSON.stringify(self.config));","    var optionsIn = JSON.parse(JSON.stringify(options));","    for (var k in optionsIn) {","      datasetConfig[k] = optionsIn[k];","    }","","    return datasetConfig;","  },","","  list: function(dataset_id, success, failure) {","    self.getDataSet(dataset_id, function(dataset) {","      if (dataset &amp;&amp; dataset.data) {","        // Return a copy of the dataset so updates will not automatically make it back into the dataset","        var res = JSON.parse(JSON.stringify(dataset.data));","        success(res);","      } else {","        if(failure) failure('no_data');","      }","    }, function(code, msg) {","      if(failure) failure(code, msg);","    });","  },","","  create: function(dataset_id, data, success, failure) {","    if(data == null){","      if(failure){","        return failure(\"null_data\");","      }","    }","    self.addPendingObj(dataset_id, null, data, \"create\", success, failure);","  },","","  read: function(dataset_id, uid, success, failure) {","    self.getDataSet(dataset_id, function(dataset) {","      var rec = dataset.data[uid];","      if (!rec) {","        failure(\"unknown_uid\");","      } else {","        // Return a copy of the record so updates will not automatically make it back into the dataset","        var res = JSON.parse(JSON.stringify(rec));","        success(res);","      }","    }, function(code, msg) {","      if(failure) failure(code, msg);","    });","  },","","  update: function(dataset_id, uid, data, success, failure) {","    self.addPendingObj(dataset_id, uid, data, \"update\", success, failure);","  },","","  'delete': function(dataset_id, uid, success, failure) {","    self.addPendingObj(dataset_id, uid, null, \"delete\", success, failure);","  },","","  getPending: function(dataset_id, cb) {","    self.getDataSet(dataset_id, function(dataset) {","      var res;","      if( dataset ) {","        res = dataset.pending;","      }","      cb(res);","    }, function(err, datatset_id) {","        self.consoleLog(err);","    });","  },","","  clearPending: function(dataset_id, cb) {","    self.getDataSet(dataset_id, function(dataset) {","      dataset.pending = {};","      self.saveDataSet(dataset_id, cb);","    });","  },","","  listCollisions : function(dataset_id, success, failure){","    self.getDataSet(dataset_id, function(dataset) {","      self.doCloudCall({","        \"dataset_id\": dataset_id,","        \"req\": {","          \"fn\": \"listCollisions\",","          \"meta_data\" : dataset.meta_data","        }","      }, success, failure);","    }, failure);","  },","","  removeCollision: function(dataset_id, colissionHash, success, failure) {","    self.getDataSet(dataset_id, function(dataset) {","      self.doCloudCall({","        \"dataset_id\" : dataset_id,","        \"req\": {","          \"fn\": \"removeCollision\",","          \"hash\": colissionHash,","          meta_data: dataset.meta_data","        }","      }, success, failure);","    });","  },","","","  // PRIVATE FUNCTIONS","  isOnline: function(callback) {","    var online = true;","","    // first, check if navigator.online is available","    if(typeof navigator.onLine !== \"undefined\"){","      online = navigator.onLine;","    }","","    // second, check if Phonegap is available and has online info","    if(online){","      //use phonegap to determin if the network is available","      if(typeof navigator.network !== \"undefined\" &amp;&amp; typeof navigator.network.connection !== \"undefined\"){","        var networkType = navigator.network.connection.type;","        if(networkType === \"none\" || networkType === null) {","          online = false;","        }","      }","    }","","    return callback(online);","  },","","  doNotify: function(dataset_id, uid, code, message) {","","    if( self.notify_callback ) {","      if ( self.config['notify_' + code] ) {","        var notification = {","          \"dataset_id\" : dataset_id,","          \"uid\" : uid,","          \"code\" : code,","          \"message\" : message","        };","        // make sure user doesn't block","        setTimeout(function () {","          self.notify_callback(notification);","        }, 0);","      }","    }","  },","","  getDataSet: function(dataset_id, success, failure) {","    var dataset = self.datasets[dataset_id];","","    if (dataset) {","      success(dataset);","    } else {","      if(failure){","        failure('unknown_dataset ' + dataset_id, dataset_id);","      }","    }","  },","","  getQueryParams: function(dataset_id, success, failure) {","    var dataset = self.datasets[dataset_id];","","    if (dataset) {","      success(dataset.query_params);","    } else {","      if(failure){","        failure('unknown_dataset ' + dataset_id, dataset_id);","      }","    }","  },","","  setQueryParams: function(dataset_id, queryParams, success, failure) {","    var dataset = self.datasets[dataset_id];","","    if (dataset) {","      dataset.query_params = queryParams;","      self.saveDataSet(dataset_id);","      if( success ) {","        success(dataset.query_params);","      }","    } else {","      if ( failure ) {","        failure('unknown_dataset ' + dataset_id, dataset_id);","      }","    }","  },","","  getMetaData: function(dataset_id, success, failure) {","    var dataset = self.datasets[dataset_id];","","    if (dataset) {","      success(dataset.meta_data);","    } else {","      if(failure){","        failure('unknown_dataset ' + dataset_id, dataset_id);","      }","    }","  },","","  setMetaData: function(dataset_id, metaData, success, failure) {","    var dataset = self.datasets[dataset_id];","","    if (dataset) {","      dataset.meta_data = metaData;","      self.saveDataSet(dataset_id);","      if( success ) {","        success(dataset.meta_data);","      }","    } else {","      if( failure ) {","        failure('unknown_dataset ' + dataset_id, dataset_id);","      }","    }","  },","","  getConfig: function(dataset_id, success, failure) {","    var dataset = self.datasets[dataset_id];","","    if (dataset) {","      success(dataset.config);","    } else {","      if(failure){","        failure('unknown_dataset ' + dataset_id, dataset_id);","      }","    }","  },","","  setConfig: function(dataset_id, config, success, failure) {","    var dataset = self.datasets[dataset_id];","","    if (dataset) {","      var fullConfig = self.setOptions(config);","      dataset.config = fullConfig;","      self.saveDataSet(dataset_id);","      if( success ) {","        success(dataset.config);","      }","    } else {","      if( failure ) {","        failure('unknown_dataset ' + dataset_id, dataset_id);","      }","    }","  },","","  stopSync: function(dataset_id, success, failure) {","    self.setConfig(dataset_id, {\"sync_active\" : false}, function() {","      if( success ) {","        success();","      }","    }, failure);","  },","","  startSync: function(dataset_id, success, failure) {","    self.setConfig(dataset_id, {\"sync_active\" : true}, function() {","      if( success ) {","        success();","      }","    }, failure);","  },","","  doSync: function(dataset_id, success, failure) {","    var dataset = self.datasets[dataset_id];","","    if (dataset) {","      dataset.syncPending = true;","      self.saveDataSet(dataset_id);","      if( success ) {","        success();","      }","    } else {","      if( failure ) {","        failure('unknown_dataset ' + dataset_id, dataset_id);","      }","    }","  },","","  forceSync: function(dataset_id, success, failure) {","    var dataset = self.datasets[dataset_id];","","    if (dataset) {","      dataset.syncForced = true;","      self.saveDataSet(dataset_id);","      if( success ) {","        success();","      }","    } else {","      if( failure ) {","        failure('unknown_dataset ' + dataset_id, dataset_id);","      }","    }","  },","","  sortObject : function(object) {","    if (typeof object !== \"object\" || object === null) {","      return object;","    }","","    var result = [];","","    Object.keys(object).sort().forEach(function(key) {","      result.push({","        key: key,","        value: self.sortObject(object[key])","      });","    });","","    return result;","  },","","  sortedStringify : function(obj) {","","    var str = '';","","    try {","      str = JSON.stringify(self.sortObject(obj));","    } catch (e) {","      console.error('Error stringifying sorted object:' + e);","    }","","    return str;","  },","","  generateHash: function(object) {","    var hash = CryptoJS.SHA1(self.sortedStringify(object));","    return hash.toString();","  },","","  addPendingObj: function(dataset_id, uid, data, action, success, failure) {","    self.isOnline(function (online) {","      if (!online) {","        self.doNotify(dataset_id, uid, self.notifications.OFFLINE_UPDATE, action);","      }","    });","","    function storePendingObject(obj) {","      obj.hash = self.generateHash(obj);","","      self.getDataSet(dataset_id, function(dataset) {","","        dataset.pending[obj.hash] = obj;","","        self.updateDatasetFromLocal(dataset, obj);","","        if(self.config.auto_sync_local_updates) {","          dataset.syncPending = true;","        }","        self.saveDataSet(dataset_id);","        self.doNotify(dataset_id, uid, self.notifications.LOCAL_UPDATE_APPLIED, action);","","        success(obj);","      }, function(code, msg) {","        if(failure) failure(code, msg);","      });","    }","","    var pendingObj = {};","    pendingObj.inFlight = false;","    pendingObj.action = action;","    pendingObj.post = JSON.parse(JSON.stringify(data));","    pendingObj.postHash = self.generateHash(pendingObj.post);","    pendingObj.timestamp = new Date().getTime();","    if( \"create\" === action ) {","      pendingObj.uid = pendingObj.postHash;","      storePendingObject(pendingObj);","    } else {","      self.read(dataset_id, uid, function(rec) {","        pendingObj.uid = uid;","        pendingObj.pre = rec.data;","        pendingObj.preHash = self.generateHash(rec.data);","        storePendingObject(pendingObj);","      }, function(code, msg) {","        if(failure){","          failure(code, msg);","        }","      });","    }","  },","","  syncLoop: function(dataset_id) {","    self.getDataSet(dataset_id, function(dataSet) {","    ","      // The sync loop is currently active","      dataSet.syncPending = false;","      dataSet.syncRunning = true;","      dataSet.syncLoopStart = new Date().getTime();","      self.doNotify(dataset_id, null, self.notifications.SYNC_STARTED, null);","","      self.isOnline(function(online) {","        if (!online) {","          self.syncComplete(dataset_id, \"offline\", self.notifications.SYNC_FAILED);","        } else {","          self.checkHasCustomSync(dataset_id, function() {","","            var syncLoopParams = {};","            syncLoopParams.fn = 'sync';","            syncLoopParams.dataset_id = dataset_id;","            syncLoopParams.query_params = dataSet.query_params;","            syncLoopParams.config = dataSet.config;","            syncLoopParams.meta_data = dataSet.meta_data;","            //var datasetHash = self.generateLocalDatasetHash(dataSet);","            syncLoopParams.dataset_hash = dataSet.hash;","            syncLoopParams.acknowledgements = dataSet.acknowledgements || [];","","            var pending = dataSet.pending;","            var pendingArray = [];","            for(var i in pending ) {","              // Mark the pending records we are about to submit as inflight and add them to the array for submission","              // Don't re-add previous inFlight pending records who whave crashed - i.e. who's current state is unknown","              // Don't add delayed records","              if( !pending[i].inFlight &amp;&amp; !pending[i].crashed &amp;&amp; !pending[i].delayed) {","                pending[i].inFlight = true;","                pending[i].inFlightDate = new Date().getTime();","                pendingArray.push(pending[i]);","              }","            }","            syncLoopParams.pending = pendingArray;","","            if( pendingArray.length &gt; 0 ) {","              self.consoleLog('Starting sync loop - global hash = ' + dataSet.hash + ' :: params = ' + JSON.stringify(syncLoopParams, null, 2));","            }","            try {","              self.doCloudCall({","                'dataset_id': dataset_id,","                'req': syncLoopParams","              }, function(res) {","                var rec;","","                function processUpdates(updates, notification, acknowledgements) {","                  if( updates ) {","                    for (var up in updates) {","                      rec = updates[up];","                      acknowledgements.push(rec);","                      if( dataSet.pending[up] &amp;&amp; dataSet.pending[up].inFlight &amp;&amp; !dataSet.pending[up].crashed ) {","                        delete dataSet.pending[up];","                        self.doNotify(dataset_id, rec.uid, notification, rec);","                      }","                    }","                  }","                }","","                // Check to see if any new pending records need to be updated to reflect the current state of play.","                self.updatePendingFromNewData(dataset_id, dataSet, res);","","                // Check to see if any previously crashed inflight records can now be resolved","                self.updateCrashedInFlightFromNewData(dataset_id, dataSet, res);","","                //Check to see if any delayed pending records can now be set to ready","                self.updateDelayedFromNewData(dataset_id, dataSet, res);","","                // Update the new dataset with details of any inflight updates which we have not received a response on","                self.updateNewDataFromInFlight(dataset_id, dataSet, res);","","                // Update the new dataset with details of any pending updates","                self.updateNewDataFromPending(dataset_id, dataSet, res);","","","","                if (res.records) {","                  // Full Dataset returned","                  dataSet.data = res.records;","                  dataSet.hash = res.hash;","","                  self.doNotify(dataset_id, res.hash, self.notifications.DELTA_RECEIVED, 'full dataset');","                }","","                if (res.updates) {","                  var acknowledgements = [];","                  processUpdates(res.updates.applied, self.notifications.REMOTE_UPDATE_APPLIED, acknowledgements);","                  processUpdates(res.updates.failed, self.notifications.REMOTE_UPDATE_FAILED, acknowledgements);","                  processUpdates(res.updates.collisions, self.notifications.COLLISION_DETECTED, acknowledgements);","                  dataSet.acknowledgements = acknowledgements;","                }","","                if (!res.records &amp;&amp; res.hash &amp;&amp; res.hash !== dataSet.hash) {","                  self.consoleLog(\"Local dataset stale - syncing records :: local hash= \" + dataSet.hash + \" - remoteHash=\" + res.hash);","                  // Different hash value returned - Sync individual records","                  self.syncRecords(dataset_id);","                } else {","                  self.consoleLog(\"Local dataset up to date\");","                  self.syncComplete(dataset_id,  \"online\", self.notifications.SYNC_COMPLETE);","                }","              }, function(msg, err) {","                // The AJAX call failed to complete succesfully, so the state of the current pending updates is unknown","                // Mark them as \"crashed\". The next time a syncLoop completets successfully, we will review the crashed","                // records to see if we can determine their current state.","                self.markInFlightAsCrashed(dataSet);","                self.consoleLog(\"syncLoop failed : msg=\" + msg + \" :: err = \" + err);","                self.syncComplete(dataset_id, msg, self.notifications.SYNC_FAILED);","              });","            }","            catch (e) {","              self.consoleLog('Error performing sync - ' + e);","              self.syncComplete(dataset_id, e, self.notifications.SYNC_FAILED);","            }","          });","        }","      });","    });","  },","","  syncRecords: function(dataset_id) {","","    self.getDataSet(dataset_id, function(dataSet) {","","      var localDataSet = dataSet.data || {};","","      var clientRecs = {};","      for (var i in localDataSet) {","        var uid = i;","        var hash = localDataSet[i].hash;","        clientRecs[uid] = hash;","      }","","      var syncRecParams = {};","","      syncRecParams.fn = 'syncRecords';","      syncRecParams.dataset_id = dataset_id;","      syncRecParams.query_params = dataSet.query_params;","      syncRecParams.clientRecs = clientRecs;","","      self.consoleLog(\"syncRecParams :: \" + JSON.stringify(syncRecParams));","","      self.doCloudCall({","        'dataset_id': dataset_id,","        'req': syncRecParams","      }, function(res) {","        var i;","","        if (res.create) {","          for (i in res.create) {","            localDataSet[i] = {\"hash\" : res.create[i].hash, \"data\" : res.create[i].data};","            self.doNotify(dataset_id, i, self.notifications.RECORD_DELTA_RECEIVED, \"create\");","          }","        }","        if (res.update) {","          for (i in res.update) {","            localDataSet[i].hash = res.update[i].hash;","            localDataSet[i].data = res.update[i].data;","            self.doNotify(dataset_id, i, self.notifications.RECORD_DELTA_RECEIVED, \"update\");","          }","        }","        if (res['delete']) {","          for (i in res['delete']) {","            delete localDataSet[i];","            self.doNotify(dataset_id, i, self.notifications.RECORD_DELTA_RECEIVED, \"delete\");","          }","        }","","        self.doNotify(dataset_id, res.hash, self.notifications.DELTA_RECEIVED, 'partial dataset');","","        dataSet.data = localDataSet;","        if(res.hash) {","          dataSet.hash = res.hash;","        }","        self.syncComplete(dataset_id, \"online\", self.notifications.SYNC_COMPLETE);","      }, function(msg, err) {","        self.consoleLog(\"syncRecords failed : msg=\" + msg + \" :: err=\" + err);","        self.syncComplete(dataset_id, msg, self.notifications.SYNC_FAILED);","      });","    });","  },","","  syncComplete: function(dataset_id, status, notification) {","","    self.getDataSet(dataset_id, function(dataset) {","      dataset.syncRunning = false;","      dataset.syncLoopEnd = new Date().getTime();","      self.saveDataSet(dataset_id);","      self.doNotify(dataset_id, dataset.hash, notification, status);","    });","  },","","  checkDatasets: function() {","    for( var dataset_id in self.datasets ) {","      if( self.datasets.hasOwnProperty(dataset_id) ) {","        var dataset = self.datasets[dataset_id];","","        if( !dataset.syncRunning &amp;&amp; (dataset.config.sync_active || dataset.syncForced)) {","          // Check to see if it is time for the sync loop to run again","          var lastSyncStart = dataset.syncLoopStart;","          var lastSyncCmp = dataset.syncLoopEnd;","          if( lastSyncStart == null ) {","            self.consoleLog(dataset_id +' - Performing initial sync');","            // Dataset has never been synced before - do initial sync","            dataset.syncPending = true;","          } else if (lastSyncCmp != null) {","            var timeSinceLastSync = new Date().getTime() - lastSyncCmp;","            var syncFrequency = dataset.config.sync_frequency * 1000;","            if( timeSinceLastSync &gt; syncFrequency ) {","              // Time between sync loops has passed - do another sync","              dataset.syncPending = true;","            }","          } ","","          if( dataset.syncForced ) {","            dataset.syncPending = true;","          }","","          if( dataset.syncPending ) {","            // Reset syncForced in case it was what caused the sync cycle to run.","            dataset.syncForced = false;","","            // If the dataset requres syncing, run the sync loop. This may be because the sync interval has passed","            // or because the sync_frequency has been changed or because a change was made to the dataset and the","            // immediate_sync flag set to true","            self.syncLoop(dataset_id);","          }","        }","      }","    }","  },","","  checkHasCustomSync : function(dataset_id, cb) {","    if(self.hasCustomSync != null) {","      return cb();","    }","    self.consoleLog('starting check has custom sync');","","    actAPI({","      'act' : dataset_id,","      'req': {","        'fn': 'sync'","      }","    }, function(res) {","      //if the custom sync is defined in the cloud, this call should success.","      //if failed, we think this the custom sync is not defined","      self.consoleLog('checkHasCustomSync - success - ', res);","      self.hasCustomSync = true;","      return cb();","    }, function(msg,err) {","      self.consoleLog('checkHasCustomSync - failure - ', err);","      if(err.status &amp;&amp; err.status === 500){","        //if we receive 500, it could be that there is an error occured due to missing parameters or similar,","        //but the endpoint is defined.","        self.consoleLog('checkHasCustomSync - failed with 500, endpoint does exists');","        self.hasCustomSync = true;","      } else {","        self.hasCustomSync = false;","      }","      return cb();","    });","  },","","  setHasCustomSync : function(custom_sync){","    self.hasCustomSync = custom_sync;","  },","","  getHasCustomSync: function(){","    return self.hasCustomSync;","  },","","  doCloudCall: function(params, success, failure) {","    if( self.hasCustomSync ) {","      actAPI({","        'act' : params.dataset_id,","        'req' : params.req","      }, function(res) {","        success(res);","      }, function(msg, err) {","        failure(msg, err);","      });      ","    } else {","      cloudAPI({","        'path' : '/mbaas/sync/' + params.dataset_id,","        'method' : 'post',","        'data' : params.req","      }, function(res) {","        success(res);","      }, function(msg, err) {","        failure(msg, err);","      })","    }","  },","","  datasetMonitor: function() {","    self.checkDatasets();","","    // Re-execute datasetMonitor every 500ms so we keep invoking checkDatasets();","    setTimeout(function() {","      self.datasetMonitor();","    }, 500);","  },","","  saveDataSet: function (dataset_id, cb) {","    var onFail =  function(msg, err) {","      // save failed","      var errMsg = 'save to local storage failed  msg:' + msg + ' err:' + err;","      self.doNotify(dataset_id, null, self.notifications.CLIENT_STORAGE_FAILED, errMsg);","      self.consoleLog(errMsg);","    };","    self.getDataSet(dataset_id, function(dataset) {","      // save dataset to local storage","      Lawnchair({fail:onFail, adapter: self.config.storage_strategy, size:self.config.file_system_quota}, function (){","        this.save({key:\"dataset_\" + dataset_id, val:dataset}, function(){","          //save success","          if(cb) return cb();","        });","      });","    });","  },","","  loadDataSet: function (dataset_id, success, failure) {","    // load dataset from local storage","    var onFail = function(msg, err) {","      // load failed","      var errMsg = 'load from local storage failed  msg:' + msg;","      self.doNotify(dataset_id, null, self.notifications.CLIENT_STORAGE_FAILED, errMsg);","      self.consoleLog(errMsg);","    };","","        Lawnchair({fail:onFail, adapter: self.config.storage_strategy, size:self.config.file_system_quota},function (){       ","          this.get( \"dataset_\" + dataset_id, function (data){","            if (data &amp;&amp; data.val !== null) {","              var dataset = data.val;","              if(typeof dataset === \"string\"){","                dataset = JSON.parse(dataset);","              }","              // Datasets should not be auto initialised when loaded - the mange function should be called for each dataset","              // the user wants sync","              dataset.initialised = false;","              self.datasets[dataset_id] = dataset; // TODO: do we need to handle binary data?","              self.consoleLog('load from local storage success for dataset_id :' + dataset_id);","              if(success) return success(dataset);","            } else {","              // no data yet, probably first time. failure calback should handle this","              if(failure) return failure();","            }","       });","    });","  },","","","  updateDatasetFromLocal: function(dataset, pendingRec) {","    var pending = dataset.pending;","    var previousPendingUid;","    var previousPending;","","    var uid = pendingRec.uid;","    self.consoleLog('updating local dataset for uid ' + uid + ' - action = ' + pendingRec.action);","","    dataset.meta[uid] = dataset.meta[uid] || {};","","    // Creating a new record","    if( pendingRec.action === \"create\" ) {","      if( dataset.data[uid] ) {","        self.consoleLog('dataset already exists for uid in create :: ' + JSON.stringify(dataset.data[uid]));","","        // We are trying to do a create using a uid which already exists","        if (dataset.meta[uid].fromPending) {","          // We are trying to create on top of an existing pending record","          // Remove the previous pending record and use this one instead","          previousPendingUid = dataset.meta[uid].pendingUid;","          delete pending[previousPendingUid];","        }","      }","      dataset.data[uid] = {};","    }","","    if( pendingRec.action === \"update\" ) {","      if( dataset.data[uid] ) {","        if (dataset.meta[uid].fromPending) {","          self.consoleLog('updating an existing pending record for dataset :: ' + JSON.stringify(dataset.data[uid]));","          // We are trying to update an existing pending record","          previousPendingUid = dataset.meta[uid].pendingUid;","          dataset.meta[uid].previousPendingUid = previousPendingUid;","          previousPending = pending[previousPendingUid];","          if(previousPending) {","            if(!previousPending.inFlight){","              self.consoleLog('existing pre-flight pending record = ' + JSON.stringify(previousPending));","              // We are trying to perform an update on an existing pending record","              // modify the original record to have the latest value and delete the pending update","              previousPending.post = pendingRec.post;","              previousPending.postHash = pendingRec.postHash;","              delete pending[pendingRec.hash];","              // Update the pending record to have the hash of the previous record as this is what is now being","              // maintained in the pending array &amp; is what we want in the meta record","              pendingRec.hash = previousPendingUid;","            } else {","              //we are performing changes to a pending record which is inFlight. Until the status of this pending record is resolved,","              //we should not submit this pending record to the cloud. Mark it as delayed.","              self.consoleLog('existing in-inflight pending record = ' + JSON.stringify(previousPending));","              pendingRec.delayed = true;","              pendingRec.waiting = previousPending.hash;","            }","          }","        }","      }","    }","","    if( pendingRec.action === \"delete\" ) {","      if( dataset.data[uid] ) {","        if (dataset.meta[uid].fromPending) {","          self.consoleLog('Deleting an existing pending record for dataset :: ' + JSON.stringify(dataset.data[uid]));","          // We are trying to delete an existing pending record","          previousPendingUid = dataset.meta[uid].pendingUid;","          dataset.meta[uid].previousPendingUid = previousPendingUid;","          previousPending = pending[previousPendingUid];","          if( previousPending ) {","            if(!previousPending.inFlight){","              self.consoleLog('existing pending record = ' + JSON.stringify(previousPending));","              if( previousPending.action === \"create\" ) {","                // We are trying to perform a delete on an existing pending create","                // These cancel each other out so remove them both","                delete pending[pendingRec.hash];","                delete pending[previousPendingUid];","              }","              if( previousPending.action === \"update\" ) {","                // We are trying to perform a delete on an existing pending update","                // Use the pre value from the pending update for the delete and","                // get rid of the pending update","                pendingRec.pre = previousPending.pre;","                pendingRec.preHash = previousPending.preHash;","                pendingRec.inFlight = false;","                delete pending[previousPendingUid];","              }","            } else {","              self.consoleLog('existing in-inflight pending record = ' + JSON.stringify(previousPending));","              pendingRec.delayed = true;","              pendingRec.waiting = previousPending.hash;","            }","          }","        }","        delete dataset.data[uid];","      }","    }","","    if( dataset.data[uid] ) {","      dataset.data[uid].data = pendingRec.post;","      dataset.data[uid].hash = pendingRec.postHash;","      dataset.meta[uid].fromPending = true;","      dataset.meta[uid].pendingUid = pendingRec.hash;","    }","  },","","  updatePendingFromNewData: function(dataset_id, dataset, newData) {","    var pending = dataset.pending;","    var newRec;","","    if( pending &amp;&amp; newData.records) {","      for( var pendingHash in pending ) {","        if( pending.hasOwnProperty(pendingHash) ) {","          var pendingRec = pending[pendingHash];","","          dataset.meta[pendingRec.uid] = dataset.meta[pendingRec.uid] || {};","","          if( pendingRec.inFlight === false ) {","            // Pending record that has not been submitted","            self.consoleLog('updatePendingFromNewData - Found Non inFlight record -&gt; action=' + pendingRec.action +' :: uid=' + pendingRec.uid  + ' :: hash=' + pendingRec.hash);","            if( pendingRec.action === \"update\" || pendingRec.action === \"delete\") {","              // Update the pre value of pending record to reflect the latest data returned from sync.","              // This will prevent a collision being reported when the pending record is sent.","              newRec = newData.records[pendingRec.uid];","              if( newRec ) {","                self.consoleLog('updatePendingFromNewData - Updating pre values for existing pending record ' + pendingRec.uid);","                pendingRec.pre = newRec.data;","                pendingRec.preHash = newRec.hash;","              }","              else {","                // The update/delete may be for a newly created record in which case the uid will have changed.","                var previousPendingUid = dataset.meta[pendingRec.uid].previousPendingUid;","                var previousPending = pending[previousPendingUid];","                if( previousPending ) {","                  if( newData &amp;&amp; newData.updates &amp;&amp;  newData.updates.applied &amp;&amp; newData.updates.applied[previousPending.hash] ) {","                    // There is an update in from a previous pending action","                    var newUid = newData.updates.applied[previousPending.hash].uid;","                    newRec = newData.records[newUid];","                    if( newRec ) {","                      self.consoleLog('updatePendingFromNewData - Updating pre values for existing pending record which was previously a create ' + pendingRec.uid + ' ==&gt; ' + newUid);","                      pendingRec.pre = newRec.data;","                      pendingRec.preHash = newRec.hash;","                      pendingRec.uid = newUid;","                    }","                  }","                }","              }","            }","","            if( pendingRec.action === \"create\" ) {","              if( newData &amp;&amp; newData.updates &amp;&amp;  newData.updates.applied &amp;&amp; newData.updates.applied[pendingHash] ) {","                self.consoleLog('updatePendingFromNewData - Found an update for a pending create ' + JSON.stringify(newData.updates.applied[pendingHash]));","                newRec = newData.records[newData.updates.applied[pendingHash].uid];","                if( newRec ) {","                  self.consoleLog('updatePendingFromNewData - Changing pending create to an update based on new record  ' + JSON.stringify(newRec));","","                  // Set up the pending create as an update","                  pendingRec.action = \"update\";","                  pendingRec.pre = newRec.data;","                  pendingRec.preHash = newRec.hash;","                  pendingRec.uid = newData.updates.applied[pendingHash].uid;","                }","              }","            }","          }","        }","      }","    }","  },","","  updateNewDataFromInFlight: function(dataset_id, dataset, newData) {","    var pending = dataset.pending;","","    if( pending &amp;&amp; newData.records) {","      for( var pendingHash in pending ) {","        if( pending.hasOwnProperty(pendingHash) ) {","          var pendingRec = pending[pendingHash];","","          if( pendingRec.inFlight ) {","            var updateReceivedForPending = (newData &amp;&amp; newData.updates &amp;&amp;  newData.updates.hashes &amp;&amp; newData.updates.hashes[pendingHash]) ? true : false;","","            self.consoleLog('updateNewDataFromInFlight - Found inflight pending Record - action = ' + pendingRec.action + ' :: hash = ' + pendingHash + ' :: updateReceivedForPending=' + updateReceivedForPending);","","            if( ! updateReceivedForPending ) {","              var newRec = newData.records[pendingRec.uid];","","              if( pendingRec.action === \"update\" &amp;&amp; newRec) {","                // Modify the new Record to have the updates from the pending record so the local dataset is consistent","                newRec.data = pendingRec.post;","                newRec.hash = pendingRec.postHash;","              }","              else if( pendingRec.action === \"delete\" &amp;&amp; newRec) {","                // Remove the record from the new dataset so the local dataset is consistent","                delete newData.records[pendingRec.uid];","              }","              else if( pendingRec.action === \"create\" ) {","                // Add the pending create into the new dataset so it is not lost from the UI","                self.consoleLog('updateNewDataFromInFlight - re adding pending create to incomming dataset');","                var newPendingCreate = {","                  data: pendingRec.post,","                  hash: pendingRec.postHash","                };","                newData.records[pendingRec.uid] = newPendingCreate;","              }","            }","          }","        }","      }","    }","  },","","  updateNewDataFromPending: function(dataset_id, dataset, newData) {","    var pending = dataset.pending;","","    if( pending &amp;&amp; newData.records) {","      for( var pendingHash in pending ) {","        if( pending.hasOwnProperty(pendingHash) ) {","          var pendingRec = pending[pendingHash];","","          if( pendingRec.inFlight === false ) {","            self.consoleLog('updateNewDataFromPending - Found Non inFlight record -&gt; action=' + pendingRec.action +' :: uid=' + pendingRec.uid  + ' :: hash=' + pendingRec.hash);","            var newRec = newData.records[pendingRec.uid];","            if( pendingRec.action === \"update\" &amp;&amp; newRec) {","              // Modify the new Record to have the updates from the pending record so the local dataset is consistent","              newRec.data = pendingRec.post;","              newRec.hash = pendingRec.postHash;","            }","            else if( pendingRec.action === \"delete\" &amp;&amp; newRec) {","              // Remove the record from the new dataset so the local dataset is consistent","              delete newData.records[pendingRec.uid];","            }","            else if( pendingRec.action === \"create\" ) {","              // Add the pending create into the new dataset so it is not lost from the UI","              self.consoleLog('updateNewDataFromPending - re adding pending create to incomming dataset');","              var newPendingCreate = {","                data: pendingRec.post,","                hash: pendingRec.postHash","              };","              newData.records[pendingRec.uid] = newPendingCreate;","            }","          }","        }","      }","    }","  },","","  updateCrashedInFlightFromNewData: function(dataset_id, dataset, newData) {","    var updateNotifications = {","      applied: self.notifications.REMOTE_UPDATE_APPLIED,","      failed: self.notifications.REMOTE_UPDATE_FAILED,","      collisions: self.notifications.COLLISION_DETECTED","    };","","    var pending = dataset.pending;","    var resolvedCrashes = {};","    var pendingHash;","    var pendingRec;","","","    if( pending ) {","      for( pendingHash in pending ) {","        if( pending.hasOwnProperty(pendingHash) ) {","          pendingRec = pending[pendingHash];","","          if( pendingRec.inFlight &amp;&amp; pendingRec.crashed) {","            self.consoleLog('updateCrashedInFlightFromNewData - Found crashed inFlight pending record uid=' + pendingRec.uid + ' :: hash=' + pendingRec.hash );","            if( newData &amp;&amp; newData.updates &amp;&amp; newData.updates.hashes) {","","              // Check if the updates received contain any info about the crashed in flight update","              var crashedUpdate = newData.updates.hashes[pendingHash];","              if( crashedUpdate ) {","                // We have found an update on one of our in flight crashed records","","                resolvedCrashes[crashedUpdate.uid] = crashedUpdate;","","                self.consoleLog('updateCrashedInFlightFromNewData - Resolving status for crashed inflight pending record ' + JSON.stringify(crashedUpdate));","","                if( crashedUpdate.type === 'failed' ) {","                  // Crashed update failed - revert local dataset","                  if( crashedUpdate.action === 'create' ) {","                    self.consoleLog('updateCrashedInFlightFromNewData - Deleting failed create from dataset');","                    delete dataset.data[crashedUpdate.uid];","                  }","                  else if ( crashedUpdate.action === 'update' || crashedUpdate.action === 'delete' ) {","                    self.consoleLog('updateCrashedInFlightFromNewData - Reverting failed ' + crashedUpdate.action + ' in dataset');","                    dataset.data[crashedUpdate.uid] = {","                      data : pendingRec.pre,","                      hash : pendingRec.preHash","                    };","                  }","                }","","                delete pending[pendingHash];","                self.doNotify(dataset_id, crashedUpdate.uid, updateNotifications[crashedUpdate.type], crashedUpdate);","              }","              else {","                // No word on our crashed update - increment a counter to reflect another sync that did not give us","                // any update on our crashed record.","                if( pendingRec.crashedCount ) {","                  pendingRec.crashedCount++;","                }","                else {","                  pendingRec.crashedCount = 1;","                }","              }","            }","            else {","              // No word on our crashed update - increment a counter to reflect another sync that did not give us","              // any update on our crashed record.","              if( pendingRec.crashedCount ) {","                pendingRec.crashedCount++;","              }","              else {","                pendingRec.crashedCount = 1;","              }","            }","          }","        }","      }","","      for( pendingHash in pending ) {","        if( pending.hasOwnProperty(pendingHash) ) {","          pendingRec = pending[pendingHash];","","          if( pendingRec.inFlight &amp;&amp; pendingRec.crashed) {","            if( pendingRec.crashedCount &gt; dataset.config.crashed_count_wait ) {","              self.consoleLog('updateCrashedInFlightFromNewData - Crashed inflight pending record has reached crashed_count_wait limit : ' + JSON.stringify(pendingRec));","              if( dataset.config.resend_crashed_updates ) {","                self.consoleLog('updateCrashedInFlightFromNewData - Retryig crashed inflight pending record');","                pendingRec.crashed = false;","                pendingRec.inFlight = false;","              }","              else {","                self.consoleLog('updateCrashedInFlightFromNewData - Deleting crashed inflight pending record');","                delete pending[pendingHash];","              }","            }","          }","        }","      }","    }","  },","","  updateDelayedFromNewData: function(dataset_id, dataset, newData){","    var pending = dataset.pending;","    var pendingHash;","    var pendingRec;","    if(pending){","      for( pendingHash in pending ){","        if( pending.hasOwnProperty(pendingHash) ){","          pendingRec = pending[pendingHash];","          if( pendingRec.delayed &amp;&amp; pendingRec.waiting ){","            self.consoleLog('updateDelayedFromNewData - Found delayed pending record uid=' + pendingRec.uid + ' :: hash=' + pendingRec.hash + ' :: waiting=' + pendingRec.waiting);","            if( newData &amp;&amp; newData.updates &amp;&amp; newData.updates.hashes ){","              var waitingRec = newData.updates.hashes[pendingRec.waiting];","              if(waitingRec){","                self.consoleLog('updateDelayedFromNewData - Waiting pending record is resolved rec=' + JSON.stringify(waitingRec));","                pendingRec.delayed = false;","                pendingRec.waiting = undefined;","              }","            }","          }","        }","      }","    }","  },","","","  markInFlightAsCrashed : function(dataset) {","    var pending = dataset.pending;","    var pendingHash;","    var pendingRec;","","    if( pending ) {","      var crashedRecords = {};","      for( pendingHash in pending ) {","        if( pending.hasOwnProperty(pendingHash) ) {","          pendingRec = pending[pendingHash];","","          if( pendingRec.inFlight ) {","            self.consoleLog('Marking in flight pending record as crashed : ' + pendingHash);","            pendingRec.crashed = true;","            crashedRecords[pendingRec.uid] = pendingRec;","          }","        }","      }","    }","  },","","  consoleLog: function(msg) {","    if( self.config.do_console_log ) {","      console.log(msg);","    }","  }","};","","(function() {","  self.config = self.defaults;","  //Initialse the sync service with default config","  //self.init({});","})();","","module.exports = {","  init: self.init,","  manage: self.manage,","  notify: self.notify,","  doList: self.list,","  doCreate: self.create,","  doRead: self.read,","  doUpdate: self.update,","  doDelete: self['delete'],","  listCollisions: self.listCollisions,","  removeCollision: self.removeCollision,","  getPending : self.getPending,","  clearPending : self.clearPending,","  getDataset : self.getDataSet,","  getQueryParams: self.getQueryParams,","  setQueryParams: self.setQueryParams,","  getMetaData: self.getMetaData,","  setMetaData: self.setMetaData,","  getConfig: self.getConfig,","  setConfig: self.setConfig,","  startSync: self.startSync,","  stopSync: self.stopSync,","  doSync: self.doSync,","  forceSync: self.forceSync,","  generateHash: self.generateHash,","  loadDataSet: self.loadDataSet,","  setHasCustomSync: self.setHasCustomSync,","  checkHasCustomSync: self.checkHasCustomSync,","  getHasCustomSync: self.getHasCustomSync","};"];

},{"../../libs/generated/crypto":1,"../../libs/generated/lawnchair":2,"./api_act":20,"./api_cloud":22,"JSON":3}],47:[function(require,module,exports){
/* automatically generated by JSCoverage - do not edit */
if (typeof _$jscoverage === 'undefined') _$jscoverage = {};
if (! _$jscoverage['modules/uuid.js']) {
  _$jscoverage['modules/uuid.js'] = [];
  _$jscoverage['modules/uuid.js'][1] = 0;
  _$jscoverage['modules/uuid.js'][5] = 0;
  _$jscoverage['modules/uuid.js'][6] = 0;
  _$jscoverage['modules/uuid.js'][7] = 0;
  _$jscoverage['modules/uuid.js'][8] = 0;
  _$jscoverage['modules/uuid.js'][10] = 0;
  _$jscoverage['modules/uuid.js'][11] = 0;
  _$jscoverage['modules/uuid.js'][12] = 0;
  _$jscoverage['modules/uuid.js'][13] = 0;
}
_$jscoverage['modules/uuid.js'][1]++;
module.exports = {createUUID: (function () {
  _$jscoverage['modules/uuid.js'][5]++;
  var s = [];
  _$jscoverage['modules/uuid.js'][6]++;
  var hexDigitals = "0123456789ABCDEF";
  _$jscoverage['modules/uuid.js'][7]++;
  for (var i = 0; i < 32; i++) {
    _$jscoverage['modules/uuid.js'][8]++;
    s[i] = hexDigitals.substr(Math.floor(Math.random() * 16), 1);
}
  _$jscoverage['modules/uuid.js'][10]++;
  s[12] = "4";
  _$jscoverage['modules/uuid.js'][11]++;
  s[16] = hexDigitals.substr((s[16] & 3) | 8, 1);
  _$jscoverage['modules/uuid.js'][12]++;
  var uuid = s.join("");
  _$jscoverage['modules/uuid.js'][13]++;
  return uuid;
})};
_$jscoverage['modules/uuid.js'].source = ["module.exports = {","  createUUID : function () {","    //from http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript","    //based on RFC 4122, section 4.4 (Algorithms for creating UUID from truely random pr pseudo-random number)","    var s = [];","    var hexDigitals = \"0123456789ABCDEF\";","    for (var i = 0; i &lt; 32; i++) {","      s[i] = hexDigitals.substr(Math.floor(Math.random() * 0x10), 1);","    }","    s[12] = \"4\";","    s[16] = hexDigitals.substr((s[16] &amp; 0x3) | 0x8, 1);","    var uuid = s.join(\"\");","    return uuid;","  }","};"];

},{}],48:[function(require,module,exports){
/* automatically generated by JSCoverage - do not edit */
if (typeof _$jscoverage === 'undefined') _$jscoverage = {};
if (! _$jscoverage['modules/waitForCloud.js']) {
  _$jscoverage['modules/waitForCloud.js'] = [];
  _$jscoverage['modules/waitForCloud.js'][1] = 0;
  _$jscoverage['modules/waitForCloud.js'][2] = 0;
  _$jscoverage['modules/waitForCloud.js'][3] = 0;
  _$jscoverage['modules/waitForCloud.js'][4] = 0;
  _$jscoverage['modules/waitForCloud.js'][5] = 0;
  _$jscoverage['modules/waitForCloud.js'][9] = 0;
  _$jscoverage['modules/waitForCloud.js'][11] = 0;
  _$jscoverage['modules/waitForCloud.js'][12] = 0;
  _$jscoverage['modules/waitForCloud.js'][13] = 0;
  _$jscoverage['modules/waitForCloud.js'][16] = 0;
  _$jscoverage['modules/waitForCloud.js'][17] = 0;
  _$jscoverage['modules/waitForCloud.js'][18] = 0;
  _$jscoverage['modules/waitForCloud.js'][20] = 0;
  _$jscoverage['modules/waitForCloud.js'][21] = 0;
  _$jscoverage['modules/waitForCloud.js'][23] = 0;
  _$jscoverage['modules/waitForCloud.js'][24] = 0;
  _$jscoverage['modules/waitForCloud.js'][25] = 0;
  _$jscoverage['modules/waitForCloud.js'][26] = 0;
  _$jscoverage['modules/waitForCloud.js'][27] = 0;
  _$jscoverage['modules/waitForCloud.js'][28] = 0;
  _$jscoverage['modules/waitForCloud.js'][29] = 0;
  _$jscoverage['modules/waitForCloud.js'][31] = 0;
  _$jscoverage['modules/waitForCloud.js'][32] = 0;
  _$jscoverage['modules/waitForCloud.js'][33] = 0;
  _$jscoverage['modules/waitForCloud.js'][34] = 0;
  _$jscoverage['modules/waitForCloud.js'][41] = 0;
  _$jscoverage['modules/waitForCloud.js'][42] = 0;
  _$jscoverage['modules/waitForCloud.js'][45] = 0;
  _$jscoverage['modules/waitForCloud.js'][46] = 0;
  _$jscoverage['modules/waitForCloud.js'][47] = 0;
  _$jscoverage['modules/waitForCloud.js'][48] = 0;
  _$jscoverage['modules/waitForCloud.js'][50] = 0;
  _$jscoverage['modules/waitForCloud.js'][54] = 0;
  _$jscoverage['modules/waitForCloud.js'][55] = 0;
  _$jscoverage['modules/waitForCloud.js'][58] = 0;
  _$jscoverage['modules/waitForCloud.js'][59] = 0;
  _$jscoverage['modules/waitForCloud.js'][63] = 0;
  _$jscoverage['modules/waitForCloud.js'][64] = 0;
  _$jscoverage['modules/waitForCloud.js'][65] = 0;
  _$jscoverage['modules/waitForCloud.js'][66] = 0;
  _$jscoverage['modules/waitForCloud.js'][67] = 0;
  _$jscoverage['modules/waitForCloud.js'][68] = 0;
  _$jscoverage['modules/waitForCloud.js'][73] = 0;
  _$jscoverage['modules/waitForCloud.js'][74] = 0;
  _$jscoverage['modules/waitForCloud.js'][75] = 0;
  _$jscoverage['modules/waitForCloud.js'][76] = 0;
  _$jscoverage['modules/waitForCloud.js'][78] = 0;
  _$jscoverage['modules/waitForCloud.js'][81] = 0;
  _$jscoverage['modules/waitForCloud.js'][85] = 0;
}
_$jscoverage['modules/waitForCloud.js'][1]++;
var initializer = require("./initializer");
_$jscoverage['modules/waitForCloud.js'][2]++;
var events = require("./events");
_$jscoverage['modules/waitForCloud.js'][3]++;
var CloudHost = require("./hosts");
_$jscoverage['modules/waitForCloud.js'][4]++;
var constants = require("./constants");
_$jscoverage['modules/waitForCloud.js'][5]++;
var logger = require("./logger");
_$jscoverage['modules/waitForCloud.js'][9]++;
var cloud_host;
_$jscoverage['modules/waitForCloud.js'][11]++;
var is_initialising = false;
_$jscoverage['modules/waitForCloud.js'][12]++;
var is_cloud_ready = false;
_$jscoverage['modules/waitForCloud.js'][13]++;
var init_error = null;
_$jscoverage['modules/waitForCloud.js'][16]++;
var ready = (function (cb) {
  _$jscoverage['modules/waitForCloud.js'][17]++;
  if (is_cloud_ready) {
    _$jscoverage['modules/waitForCloud.js'][18]++;
    return cb(null, {host: getCloudHostUrl()});
  }
  else {
    _$jscoverage['modules/waitForCloud.js'][20]++;
    events.once(constants.INIT_EVENT, (function (err, host) {
  _$jscoverage['modules/waitForCloud.js'][21]++;
  return cb(err, host);
}));
    _$jscoverage['modules/waitForCloud.js'][23]++;
    if (! is_initialising) {
      _$jscoverage['modules/waitForCloud.js'][24]++;
      is_initialising = true;
      _$jscoverage['modules/waitForCloud.js'][25]++;
      initializer.init((function (err, initRes) {
  _$jscoverage['modules/waitForCloud.js'][26]++;
  is_initialising = false;
  _$jscoverage['modules/waitForCloud.js'][27]++;
  if (err) {
    _$jscoverage['modules/waitForCloud.js'][28]++;
    init_error = err;
    _$jscoverage['modules/waitForCloud.js'][29]++;
    return events.emit(constants.INIT_EVENT, err);
  }
  else {
    _$jscoverage['modules/waitForCloud.js'][31]++;
    init_error = null;
    _$jscoverage['modules/waitForCloud.js'][32]++;
    is_cloud_ready = true;
    _$jscoverage['modules/waitForCloud.js'][33]++;
    cloud_host = new CloudHost(initRes.cloud);
    _$jscoverage['modules/waitForCloud.js'][34]++;
    return events.emit(constants.INIT_EVENT, null, {host: getCloudHostUrl()});
  }
}));
    }
  }
});
_$jscoverage['modules/waitForCloud.js'][41]++;
var getCloudHost = (function () {
  _$jscoverage['modules/waitForCloud.js'][42]++;
  return cloud_host;
});
_$jscoverage['modules/waitForCloud.js'][45]++;
var getCloudHostUrl = (function () {
  _$jscoverage['modules/waitForCloud.js'][46]++;
  if (typeof cloud_host !== "undefined") {
    _$jscoverage['modules/waitForCloud.js'][47]++;
    var appProps = require("./appProps").getAppProps();
    _$jscoverage['modules/waitForCloud.js'][48]++;
    return cloud_host.getHost(appProps.mode);
  }
  else {
    _$jscoverage['modules/waitForCloud.js'][50]++;
    return undefined;
  }
});
_$jscoverage['modules/waitForCloud.js'][54]++;
var isReady = (function () {
  _$jscoverage['modules/waitForCloud.js'][55]++;
  return is_cloud_ready;
});
_$jscoverage['modules/waitForCloud.js'][58]++;
var getInitError = (function () {
  _$jscoverage['modules/waitForCloud.js'][59]++;
  return init_error;
});
_$jscoverage['modules/waitForCloud.js'][63]++;
var reset = (function () {
  _$jscoverage['modules/waitForCloud.js'][64]++;
  is_cloud_ready = false;
  _$jscoverage['modules/waitForCloud.js'][65]++;
  is_initialising = false;
  _$jscoverage['modules/waitForCloud.js'][66]++;
  cloud_host = undefined;
  _$jscoverage['modules/waitForCloud.js'][67]++;
  init_error = undefined;
  _$jscoverage['modules/waitForCloud.js'][68]++;
  ready((function () {
}));
});
_$jscoverage['modules/waitForCloud.js'][73]++;
ready((function (error, host) {
  _$jscoverage['modules/waitForCloud.js'][74]++;
  if (error) {
    _$jscoverage['modules/waitForCloud.js'][75]++;
    if (error.message !== "app_config_missing") {
      _$jscoverage['modules/waitForCloud.js'][76]++;
      logger.error("Failed to initialise fh.");
    }
    else {
      _$jscoverage['modules/waitForCloud.js'][78]++;
      logger.info("No fh config file");
    }
  }
  else {
    _$jscoverage['modules/waitForCloud.js'][81]++;
    logger.info("fh cloud is ready");
  }
}));
_$jscoverage['modules/waitForCloud.js'][85]++;
module.exports = {ready: ready, isReady: isReady, getCloudHost: getCloudHost, getCloudHostUrl: getCloudHostUrl, getInitError: getInitError, reset: reset};
_$jscoverage['modules/waitForCloud.js'].source = ["var initializer = require(\"./initializer\");","var events = require(\"./events\");","var CloudHost = require(\"./hosts\");","var constants = require(\"./constants\");","var logger = require(\"./logger\");","","","//the cloud configurations","var cloud_host;","","var is_initialising = false;","var is_cloud_ready = false;","var init_error = null;","","","var ready = function(cb){","  if(is_cloud_ready){","    return cb(null, {host: getCloudHostUrl()});","  } else {","    events.once(constants.INIT_EVENT, function(err, host){","      return cb(err, host);","    });","    if(!is_initialising){","      is_initialising = true;","      initializer.init(function(err, initRes){","        is_initialising = false;","        if(err){","          init_error = err;","          return events.emit(constants.INIT_EVENT, err);","        } else {","          init_error = null;","          is_cloud_ready = true;","          cloud_host = new CloudHost(initRes.cloud);","          return events.emit(constants.INIT_EVENT, null, {host: getCloudHostUrl()});","        }","      });","    }","  }","}","","var getCloudHost = function(){","  return cloud_host;","}","","var getCloudHostUrl = function(){","  if(typeof cloud_host !== \"undefined\"){","    var appProps = require(\"./appProps\").getAppProps();","    return cloud_host.getHost(appProps.mode);","  } else {","    return undefined;","  }","}","","var isReady = function(){","  return is_cloud_ready;","}","","var getInitError = function(){","  return init_error;","}","","//for test","var reset = function(){","  is_cloud_ready = false;","  is_initialising = false;","  cloud_host = undefined;","  init_error = undefined;","  ready(function(){","    ","  });","}","","ready(function(error, host){","  if(error){","    if(error.message !== \"app_config_missing\"){","      logger.error(\"Failed to initialise fh.\");","    } else {","      logger.info(\"No fh config file\");","    }","  } else {","    logger.info(\"fh cloud is ready\");","  }","});","","module.exports = {","  ready: ready,","  isReady: isReady,","  getCloudHost: getCloudHost,","  getCloudHostUrl: getCloudHostUrl,","  getInitError: getInitError,","  reset: reset","}"];

},{"./appProps":26,"./constants":28,"./events":31,"./hosts":34,"./initializer":35,"./logger":38}]},{},["f312fA"])
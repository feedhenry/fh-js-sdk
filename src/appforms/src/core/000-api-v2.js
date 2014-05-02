;
(function(root) {

  //!!!lib start!!!
  /*
    json2.js
    2008-03-24

    Public Domain.

    NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.

    See http://www.JSON.org/js.html

    This file creates a global JSON object containing three methods: stringify,
    parse, and quote.


        JSON.stringify(value, replacer, space)
            value       any JavaScript value, usually an object or array.

            replacer    an optional parameter that determines how object
                        values are stringified for objects without a toJSON
                        method. It can be a function or an array.

            space       an optional parameter that specifies the indentation
                        of nested structures. If it is omitted, the text will
                        be packed without extra whitespace. If it is a number,
                        it will specify the number of spaces to indent at each
                        level. If it is a string (such as '\t'), it contains the
                        characters used to indent at each level.

            This method produces a JSON text from a JavaScript value.

            When an object value is found, if the object contains a toJSON
            method, its toJSON method with be called and the result will be
            stringified. A toJSON method does not serialize: it returns the
            value represented by the name/value pair that should be serialized,
            or undefined if nothing should be serialized. The toJSON method will
            be passed the key associated with the value, and this will be bound
            to the object holding the key.

            This is the toJSON method added to Dates:

                function toJSON(key) {
                    return this.getUTCFullYear()   + '-' +
                         f(this.getUTCMonth() + 1) + '-' +
                         f(this.getUTCDate())      + 'T' +
                         f(this.getUTCHours())     + ':' +
                         f(this.getUTCMinutes())   + ':' +
                         f(this.getUTCSeconds())   + 'Z';
                }

            You can provide an optional replacer method. It will be passed the
            key and value of each member, with this bound to the containing
            object. The value that is returned from your method will be
            serialized. If your method returns undefined, then the member will
            be excluded from the serialization.

            If no replacer parameter is provided, then a default replacer
            will be used:

                function replacer(key, value) {
                    return Object.hasOwnProperty.call(this, key) ?
                        value : undefined;
                }

            The default replacer is passed the key and value for each item in
            the structure. It excludes inherited members.

            If the replacer parameter is an array, then it will be used to
            select the members to be serialized. It filters the results such
            that only members with keys listed in the replacer array are
            stringified.

            Values that do not have JSON representaions, such as undefined or
            functions, will not be serialized. Such values in objects will be
            dropped; in arrays they will be replaced with null. You can use
            a replacer function to replace those with JSON values.
            JSON.stringify(undefined) returns undefined.

            The optional space parameter produces a stringification of the value
            that is filled with line breaks and indentation to make it easier to
            read.

            If the space parameter is a non-empty string, then that string will
            be used for indentation. If the space parameter is a number, then
            then indentation will be that many spaces.

            Example:

            text = JSON.stringify(['e', {pluribus: 'unum'}]);
            // text is '["e",{"pluribus":"unum"}]'


            text = JSON.stringify(['e', {pluribus: 'unum'}], null, '\t');
            // text is '[\n\t"e",\n\t{\n\t\t"pluribus": "unum"\n\t}\n]'


        JSON.parse(text, reviver)
            This method parses a JSON text to produce an object or array.
            It can throw a SyntaxError exception.

            The optional reviver parameter is a function that can filter and
            transform the results. It receives each of the keys and values, and
            its return value is used instead of the original value. If it
            returns what it received, then structure is not modified. If it
            returns undefined then the member is deleted.

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


        JSON.quote(text)
            This method wraps a string in quotes, escaping some characters
            as needed.


    This is a reference implementation. You are free to copy, modify, or
    redistribute.

    USE YOUR OWN COPY. IT IS EXTREMELY UNWISE TO LOAD THIRD PARTY
    CODE INTO YOUR PAGES.
*/

  /*jslint regexp: true, forin: true, evil: true */

  /*global JSON */

  /*members "", "\b", "\t", "\n", "\f", "\r", "\"", JSON, "\\", apply,
    call, charCodeAt, floor, getUTCDate, getUTCFullYear, getUTCHours,
    getUTCMinutes, getUTCMonth, getUTCSeconds, hasOwnProperty, join, length,
    parse, propertyIsEnumerable, prototype, push, quote, replace, stringify,
    test, toJSON, toString
*/

  if (!JSON) {

    // Create a JSON object only if one does not already exist. We create the
    // object in a closure to avoid global variables.

    var JSON = function() {

      function f(n) { // Format integers to have at least two digits.
        return n < 10 ? '0' + n : n;
      }

      Date.prototype.toJSON = function() {

        // Eventually, this method will be based on the date.toISOString method.

        return this.getUTCFullYear() + '-' +
          f(this.getUTCMonth() + 1) + '-' +
          f(this.getUTCDate()) + 'T' +
          f(this.getUTCHours()) + ':' +
          f(this.getUTCMinutes()) + ':' +
          f(this.getUTCSeconds()) + 'Z';
      };


      var escapeable = /["\\\x00-\x1f\x7f-\x9f]/g,
        gap,
        indent,
        meta = { // table of character substitutions
          '\b': '\\b',
          '\t': '\\t',
          '\n': '\\n',
          '\f': '\\f',
          '\r': '\\r',
          '"': '\\"',
          '\\': '\\\\'
        },
        rep;


      function quote(string) {

        // If the string contains no control characters, no quote characters, and no
        // backslash characters, then we can safely slap some quotes around it.
        // Otherwise we must also replace the offending characters with safe escape
        // sequences.

        return escapeable.test(string) ?
          '"' + string.replace(escapeable, function(a) {
            var c = meta[a];
            if (typeof c === 'string') {
              return c;
            }
            c = a.charCodeAt();
            return '\\u00' + Math.floor(c / 16).toString(16) +
              (c % 16).toString(16);
          }) + '"' :
          '"' + string + '"';
      }


      function str(key, holder) {

        // Produce a string from holder[key].

        var i, // The loop counter.
          k, // The member key.
          v, // The member value.
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

            // If the object has a dontEnum length property, we'll treat it as an array.

            if (typeof value.length === 'number' && !(value.propertyIsEnumerable('length'))) {

              // The object is an array. Stringify every element. Use null as a placeholder
              // for non-JSON values.

              length = value.length;
              for (i = 0; i < length; i += 1) {
                partial[i] = str(i, value) || 'null';
              }

              // Join all of the elements together, separated with commas, and wrap them in
              // brackets.

              v = partial.length === 0 ? '[]' :
                gap ? '[\n' + gap + partial.join(',\n' + gap) +
                '\n' + mind + ']' :
                '[' + partial.join(',') + ']';
              gap = mind;
              return v;
            }

            // If the replacer is an array, use it to select the members to be stringified.

            if (typeof rep === 'object') {
              length = rep.length;
              for (i = 0; i < length; i += 1) {
                k = rep[i];
                if (typeof k === 'string') {
                  v = str(k, value, rep);
                  if (v) {
                    partial.push(quote(k) + (gap ? ': ' : ':') + v);
                  }
                }
              }
            } else {

              // Otherwise, iterate through all of the keys in the object.

              for (k in value) {
                v = str(k, value, rep);
                if (v) {
                  partial.push(quote(k) + (gap ? ': ' : ':') + v);
                }
              }
            }

            // Join all of the member texts together, separated with commas,
            // and wrap them in braces.

            v = partial.length === 0 ? '{}' :
              gap ? '{\n' + gap + partial.join(',\n' + gap) +
              '\n' + mind + '}' :
              '{' + partial.join(',') + '}';
            gap = mind;
            return v;
        }
      }


      // Return the JSON object containing the stringify, parse, and quote methods.

      return {
        stringify: function(value, replacer, space) {

          // The stringify method takes a value and an optional replacer, and an optional
          // space parameter, and returns a JSON text. The replacer can be a function
          // that can replace values, or an array of strings that will select the keys.
          // A default replacer method can be provided. Use of the space parameter can
          // produce text that is more easily readable.

          var i;
          gap = '';
          indent = '';
          if (space) {

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
          }

          // If there is no replacer parameter, use the default replacer.

          if (!replacer) {
            rep = function(key, value) {
              if (!Object.hasOwnProperty.call(this, key)) {
                return undefined;
              }
              return value;
            };

            // The replacer can be a function or an array. Otherwise, throw an error.

          } else if (typeof replacer === 'function' ||
            (typeof replacer === 'object' &&
              typeof replacer.length === 'number')) {
            rep = replacer;
          } else {
            throw new Error('JSON.stringify');
          }

          // Make a fake root object containing our value under the key of ''.
          // Return the result of stringifying the value.

          return str('', {
            '': value
          });
        },


        parse: function(text, reviver) {

          // The parse method takes a text and an optional reviver function, and returns
          // a JavaScript value if the text is a valid JSON text.

          var j;

          function walk(holder, key) {

            // The walk method is used to recursively walk the resulting structure so
            // that modifications can be made.

            var k, v, value = holder[key];
            if (value && typeof value === 'object') {
              for (k in value) {
                if (Object.hasOwnProperty.call(value, k)) {
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


          // Parsing happens in three stages. In the first stage, we run the text against
          // regular expressions that look for non-JSON patterns. We are especially
          // concerned with '()' and 'new' because they can cause invocation, and '='
          // because it can cause mutation. But just to be safe, we want to reject all
          // unexpected forms.

          // We split the first stage into 4 regexp operations in order to work around
          // crippling inefficiencies in IE's and Safari's regexp engines. First we
          // replace all backslash pairs with '@' (a non-JSON character). Second, we
          // replace all simple value tokens with ']' characters. Third, we delete all
          // open brackets that follow a colon or comma or that begin the text. Finally,
          // we look to see that the remaining characters are only whitespace or ']' or
          // ',' or ':' or '{' or '}'. If that is so, then the text is safe for eval.

          if (/^[\],:{}\s]*$/.test(text.replace(/\\["\\\/bfnrtu]/g, '@').replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {

            // In the second stage we use the eval function to compile the text into a
            // JavaScript structure. The '{' operator is subject to a syntactic ambiguity
            // in JavaScript: it can begin a block or an object literal. We wrap the text
            // in parens to eliminate the ambiguity.

            j = eval('(' + text + ')');

            // In the optional third stage, we recursively walk the new structure, passing
            // each name/value pair to a reviver function for possible transformation.

            return typeof reviver === 'function' ?
              walk({
                '': j
              }, '') : j;
          }

          // If the text is not JSON parseable, then a SyntaxError is thrown.

          throw new SyntaxError('JSON.parse');
        },

        quote: quote
      };
    }();
  }

  //json end

  //persist-min start

  (function() {
    if (window.google && google.gears)
      return;
    var F = null;
    if (typeof GearsFactory != 'undefined') {
      F = new GearsFactory();
    } else {
      try {
        F = new ActiveXObject('Gears.Factory');
        if (F.getBuildInfo().indexOf('ie_mobile') != -1)
          F.privateSetGlobalObject(this);
      } catch (e) {
        if ((typeof navigator.mimeTypes != 'undefined') && navigator.mimeTypes["application/x-googlegears"]) {
          F = document.createElement("object");
          F.style.display = "none";
          F.width = 0;
          F.height = 0;
          F.type = "application/x-googlegears";
          document.documentElement.appendChild(F);
        }
      }
    }
    if (!F)
      return;
    if (!window.google)
      google = {};
    if (!google.gears)
      google.gears = {
        factory: F
      };
  })();
  Persist = (function() {
    var VERSION = '0.2.0',
      P, B, esc, init, empty, ec;
    ec = (function() {
      var EPOCH = 'Thu, 01-Jan-1970 00:00:01 GMT',
        RATIO = 1000 * 60 * 60 * 24,
        KEYS = ['expires', 'path', 'domain'],
        esc = escape,
        un = unescape,
        doc = document,
        me;
      var get_now = function() {
        var r = new Date();
        r.setTime(r.getTime());
        return r;
      }
      var cookify = function(c_key, c_val) {
        var i, key, val, r = [],
          opt = (arguments.length > 2) ? arguments[2] : {};
        r.push(esc(c_key) + '=' + esc(c_val));
        for (i = 0; i < KEYS.length; i++) {
          key = KEYS[i];
          if (val = opt[key])
            r.push(key + '=' + val);
        }
        if (opt.secure)
          r.push('secure');
        return r.join('; ');
      }
      var alive = function() {
        var k = '__EC_TEST__',
          v = new Date();
        v = v.toGMTString();
        this.set(k, v);
        this.enabled = (this.remove(k) == v);
        return this.enabled;
      }
      me = {
        set: function(key, val) {
          var opt = (arguments.length > 2) ? arguments[2] : {}, now = get_now(),
            expire_at, cfg = {};
          if (opt.expires) {
            opt.expires *= RATIO;
            cfg.expires = new Date(now.getTime() + opt.expires);
            cfg.expires = cfg.expires.toGMTString();
          }
          var keys = ['path', 'domain', 'secure'];
          for (i = 0; i < keys.length; i++)
            if (opt[keys[i]])
              cfg[keys[i]] = opt[keys[i]];
          var r = cookify(key, val, cfg);
          doc.cookie = r;
          return val;
        },
        has: function(key) {
          key = esc(key);
          var c = doc.cookie,
            ofs = c.indexOf(key + '='),
            len = ofs + key.length + 1,
            sub = c.substring(0, key.length);
          return ((!ofs && key != sub) || ofs < 0) ? false : true;
        },
        get: function(key) {
          key = esc(key);
          var c = doc.cookie,
            ofs = c.indexOf(key + '='),
            len = ofs + key.length + 1,
            sub = c.substring(0, key.length),
            end;
          if ((!ofs && key != sub) || ofs < 0)
            return null;
          end = c.indexOf(';', len);
          if (end < 0)
            end = c.length;
          return un(c.substring(len, end));
        },
        remove: function(k) {
          var r = me.get(k),
            opt = {
              expires: EPOCH
            };
          doc.cookie = cookify(k, '', opt);
          return r;
        },
        keys: function() {
          var c = doc.cookie,
            ps = c.split('; '),
            i, p, r = [];
          for (i = 0; i < ps.length; i++) {
            p = ps[i].split('=');
            r.push(un(p[0]));
          }
          return r;
        },
        all: function() {
          var c = doc.cookie,
            ps = c.split('; '),
            i, p, r = [];
          for (i = 0; i < ps.length; i++) {
            p = ps[i].split('=');
            r.push([un(p[0]), un(p[1])]);
          }
          return r;
        },
        version: '0.2.1',
        enabled: false
      };
      me.enabled = alive.call(me);
      return me;
    }());
    var index_of = (function() {
      if (Array.prototype.indexOf)
        return function(ary, val) {
          return Array.prototype.indexOf.call(ary, val);
        };
      else
        return function(ary, val) {
          var i, l;
          for (i = 0, l = ary.length; i < l; i++)
            if (ary[i] == val)
              return i;
          return -1;
        };
    })();
    empty = function() {};
    esc = function(str) {
      return 'PS' + str.replace(/_/g, '__').replace(/ /g, '_s');
    };
    C = {
      search_order: ['localstorage', 'whatwg_db', 'globalstorage', 'gears', 'ie', 'flash', 'cookie'],
      name_re: /^[a-z][a-z0-9_ -]+$/i,
      methods: ['init', 'get', 'set', 'remove', 'load', 'save'],
      sql: {
        version: '1',
        create: "CREATE TABLE IF NOT EXISTS persist_data (k TEXT UNIQUE NOT NULL PRIMARY KEY, v TEXT NOT NULL)",
        get: "SELECT v FROM persist_data WHERE k = ?",
        set: "INSERT INTO persist_data(k, v) VALUES (?, ?)",
        remove: "DELETE FROM persist_data WHERE k = ?"
      },
      flash: {
        div_id: '_persist_flash_wrap',
        id: '_persist_flash',
        path: 'persist.swf',
        size: {
          w: 1,
          h: 1
        },
        args: {
          autostart: true
        }
      }
    };
    B = {
      gears: {
        size: -1,
        test: function() {
          try {
            return (window.google && window.google.gears) ? true : false;
          } catch (e) {
            return false;
          }

        },
        methods: {
          transaction: function(fn) {
            var db = this.db;
            db.execute('BEGIN').close();
            fn.call(this, db);
            db.execute('COMMIT').close();
          },
          init: function() {
            var db;
            db = this.db = google.gears.factory.create('beta.database');
            db.open(esc(this.name));
            db.execute(C.sql.create).close();
          },
          get: function(key, fn, scope) {
            var r, sql = C.sql.get;
            if (!fn)
              return;
            this.transaction(function(t) {
              var is_valid, val;
              r = t.execute(sql, [key]);
              is_valid = r.isValidRow();
              val = is_valid ? r.field(0) : null;
              r.close();
              fn.call(scope || this, is_valid, val);
            });
          },
          set: function(key, val, fn, scope) {
            var rm_sql = C.sql.remove,
              sql = C.sql.set,
              r;
            this.transaction(function(t) {
              t.execute(rm_sql, [key]).close();
              t.execute(sql, [key, val]).close();
              if (fn)
                fn.call(scope || this, true, val);
            });
          },
          remove: function(key, fn, scope) {
            var get_sql = C.sql.get;
            sql = C.sql.remove, r, val = null, is_valid = false;
            this.transaction(function(t) {
              if (fn) {
                r = t.execute(get_sql, [key]);
                is_valid = r.isValidRow();
                val = is_valid ? r.field(0) : null;
                r.close();
              }
              if (!fn || is_valid) {
                t.execute(sql, [key]).close();
              }
              if (fn)
                fn.call(scope || this, is_valid, val);
            });
          }
        }
      },
      whatwg_db: {
        size: 200 * 1024,
        test: function() {
          try {
            var name = 'PersistJS Test',
              desc = 'Persistent database test.';
            if (!window.openDatabase)
              return false;
            if (!window.openDatabase(name, C.sql.version, desc, B.whatwg_db.size))
              return false;
            return true;
          } catch (e) {
            return false;
          }

        },
        methods: {
          transaction: function(fn) {
            if (!this.db_created) {
              this.db.transaction(function(t) {
                t.executeSql(C.sql.create, [], function() {
                  this.db_created = true;
                });
              }, empty);
            }
            this.db.transaction(fn);
          },
          init: function() {
            this.db = openDatabase(this.name, C.sql.version, this.o.about || ("Persistent storage for " + this.name), this.o.size || B.whatwg_db.size);
          },
          get: function(key, fn, scope) {
            var sql = C.sql.get;
            if (!fn)
              return;
            scope = scope || this;
            this.transaction(function(t) {
              t.executeSql(sql, [key], function(t, r) {
                if (r.rows.length > 0)
                  fn.call(scope, true, r.rows.item(0)['v']);
                else
                  fn.call(scope, false, null);
              });
            });
          },
          set: function(key, val, fn, scope) {
            var rm_sql = C.sql.remove,
              sql = C.sql.set;
            this.transaction(function(t) {
              t.executeSql(rm_sql, [key], function() {
                t.executeSql(sql, [key, val], function(t, r) {
                  if (fn)
                    fn.call(scope || this, true, val);
                });
              });
            });
            return val;
          },
          remove: function(key, fn, scope) {
            var get_sql = C.sql.get;
            sql = C.sql.remove;
            this.transaction(function(t) {
              if (fn) {
                t.executeSql(get_sql, [key], function(t, r) {
                  if (r.rows.length > 0) {
                    var val = r.rows.item(0)['v'];
                    t.executeSql(sql, [key], function(t, r) {
                      fn.call(scope || this, true, val);
                    });
                  } else {
                    fn.call(scope || this, false, null);
                  }
                });
              } else {
                t.executeSql(sql, [key]);
              }
            });
          }
        }
      },
      globalstorage: {
        size: 5 * 1024 * 1024,
        test: function() {
          try {
            return window.globalStorage ? true : false;
          } catch (e) {
            return false;
          }
        },
        methods: {
          key: function(key) {
            return esc(this.name) + esc(key);
          },
          init: function() {
            alert('domain = ' + this.o.domain);
            this.store = globalStorage[this.o.domain];
          },
          get: function(key, fn, scope) {
            key = this.key(key);
            if (fn)
              fn.call(scope || this, true, this.store.getItem(key));
          },
          set: function(key, val, fn, scope) {
            key = this.key(key);
            this.store.setItem(key, val);
            if (fn)
              fn.call(scope || this, true, val);
          },
          remove: function(key, fn, scope) {
            var val;
            key = this.key(key);
            val = this.store[key];
            this.store.removeItem(key);
            if (fn)
              fn.call(scope || this, (val !== null), val);
          }
        }
      },
      localstorage: {
        size: -1,
        test: function() {
          try {
            return window.localStorage ? true : false;
          } catch (e) {
            return false;
          }

        },
        methods: {
          key: function(key) {
            return esc(this.name) + esc(key);
          },
          init: function() {
            this.store = localStorage;
          },
          get: function(key, fn, scope) {
            key = this.key(key);
            if (fn)
              fn.call(scope || this, true, this.store.getItem(key));
          },
          set: function(key, val, fn, scope) {
            key = this.key(key);
            this.store.setItem(key, val);
            if (fn)
              fn.call(scope || this, true, val);
          },
          remove: function(key, fn, scope) {
            var val;
            key = this.key(key);
            val = this.store.getItem(key);
            this.store.removeItem(key);
            if (fn)
              fn.call(scope || this, (val !== null), val);
          }
        }
      },
      ie: {
        prefix: '_persist_data-',
        size: 64 * 1024,
        test: function() {
          try {
            return window.ActiveXObject ? true : false;
          } catch (e) {
            return false;
          }

        },
        make_userdata: function(id) {
          var el = document.createElement('div');
          el.id = id;
          el.style.display = 'none';
          el.addBehavior('#default#userdata');
          document.body.appendChild(el);
          return el;
        },
        methods: {
          init: function() {
            var id = B.ie.prefix + esc(this.name);
            this.el = B.ie.make_userdata(id);
            if (this.o.defer)
              this.load();
          },
          get: function(key, fn, scope) {
            var val;
            key = esc(key);
            if (!this.o.defer)
              this.load();
            val = this.el.getAttribute(key);
            if (fn)
              fn.call(scope || this, val ? true : false, val);
          },
          set: function(key, val, fn, scope) {
            key = esc(key);
            this.el.setAttribute(key, val);
            if (!this.o.defer)
              this.save();
            if (fn)
              fn.call(scope || this, true, val);
          },
          remove: function(key, fn, scope) {
            var val;
            key = esc(key);
            if (!this.o.defer)
              this.load();
            val = this.el.getAttribute(key);
            this.el.removeAttribute(key);
            if (!this.o.defer)
              this.save();
            if (fn)
              fn.call(scope || this, val ? true : false, val);
          },
          load: function() {
            this.el.load(esc(this.name));
          },
          save: function() {
            this.el.save(esc(this.name));
          }
        }
      },
      cookie: {
        delim: ':',
        size: 4000,
        test: function() {
          try {
            return P.Cookie.enabled ? true : false;
          } catch (e) {
            return false;
          }

        },
        methods: {
          key: function(key) {
            return this.name + B.cookie.delim + key;
          },
          get: function(key, fn, scope) {
            var val;
            key = this.key(key);
            val = ec.get(key);
            if (fn)
              fn.call(scope || this, val != null, val);
          },
          set: function(key, val, fn, scope) {
            key = this.key(key);
            ec.set(key, val, this.o);
            if (fn)
              fn.call(scope || this, true, val);
          },
          remove: function(key, val, fn, scope) {
            var val;
            key = this.key(key);
            val = ec.remove(key)
            if (fn)
              fn.call(scope || this, val != null, val);
          }
        }
      },
      flash: {
        test: function() {
          try {
            if (!deconcept || !deconcept.SWFObjectUtil)
              return false;
            var major = deconcept.SWFObjectUtil.getPlayerVersion().major;
            return (major >= 8) ? true : false;
          } catch (e) {
            return false;
          }

        },
        methods: {
          init: function() {
            if (!B.flash.el) {
              var o, key, el, cfg = C.flash;
              el = document.createElement('div');
              el.id = cfg.div_id;
              document.body.appendChild(el);
              o = new deconcept.SWFObject(this.o.swf_path || cfg.path, cfg.id, cfg.size.w, cfg.size.h, '8');
              for (key in cfg.args)
                o.addVariable(key, cfg.args[key]);
              o.write(el);
              B.flash.el = document.getElementById(cfg.id);
            }
            this.el = B.flash.el;
          },
          get: function(key, fn, scope) {
            var val;
            key = esc(key);
            val = this.el.get(this.name, key);
            if (fn)
              fn.call(scope || this, val !== null, val);
          },
          set: function(key, val, fn, scope) {
            var old_val;
            key = esc(key);
            old_val = this.el.set(this.name, key, val);
            if (fn)
              fn.call(scope || this, true, val);
          },
          remove: function(key, fn, scope) {
            var val;
            key = esc(key);
            val = this.el.remove(this.name, key);
            if (fn)
              fn.call(scope || this, true, val);
          }
        }
      }
    };
    var init = function() {
      var i, l, b, key, fns = C.methods,
        keys = C.search_order;
      for (i = 0, l = fns.length; i < l; i++)
        P.Store.prototype[fns[i]] = empty;
      P.type = null;
      P.size = -1;
      for (i = 0, l = keys.length; !P.type && i < l; i++) {
        b = B[keys[i]];
        if (b.test()) {
          P.type = keys[i];
          P.size = b.size;
          for (key in b.methods)
            P.Store.prototype[key] = b.methods[key];
        }
      }
      P._init = true;
    };
    P = {
      VERSION: VERSION,
      type: null,
      size: 0,
      add: function(o) {
        B[o.id] = o;
        C.search_order = [o.id].concat(C.search_order);
        init();
      },
      remove: function(id) {
        var ofs = index_of(C.search_order, id);
        if (ofs < 0)
          return;
        C.search_order.splice(ofs, 1);
        delete B[id];
        init();
      },
      Cookie: ec,
      Store: function(name, o) {
        if (!C.name_re.exec(name))
          throw new Error("Invalid name");
        if (!P.type)
          throw new Error("No suitable storage found");
        o = o || {};
        this.name = name;
        o.domain = o.domain || location.host || 'localhost';
        o.domain = o.domain.replace(/:\d+$/, '')
        this.o = o;
        o.expires = o.expires || 365 * 2;
        o.path = o.path || '/';
        this.init();
      }
    };
    init();
    return P;
  })();
  //persist-min end

  //swfobject-min start

  if (typeof deconcept == "undefined") var deconcept = new Object();
  if (typeof deconcept.util == "undefined") deconcept.util = new Object();
  if (typeof deconcept.SWFObjectUtil == "undefined") deconcept.SWFObjectUtil = new Object();
  deconcept.SWFObject = function(swf, id, w, h, ver, c, quality, xiRedirectUrl, redirectUrl, detectKey) {
    if (!document.getElementById) {
      return;
    }
    this.DETECT_KEY = detectKey ? detectKey : 'detectflash';
    this.skipDetect = deconcept.util.getRequestParameter(this.DETECT_KEY);
    this.params = new Object();
    this.variables = new Object();
    this.attributes = new Array();
    if (swf) {
      this.setAttribute('swf', swf);
    }
    if (id) {
      this.setAttribute('id', id);
    }
    if (w) {
      this.setAttribute('width', w);
    }
    if (h) {
      this.setAttribute('height', h);
    }
    if (ver) {
      this.setAttribute('version', new deconcept.PlayerVersion(ver.toString().split(".")));
    }
    this.installedVer = deconcept.SWFObjectUtil.getPlayerVersion();
    if (!window.opera && document.all && this.installedVer.major > 7) {
      deconcept.SWFObject.doPrepUnload = true;
    }
    if (c) {
      this.addParam('bgcolor', c);
    }
    var q = quality ? quality : 'high';
    this.addParam('quality', q);
    this.setAttribute('useExpressInstall', false);
    this.setAttribute('doExpressInstall', false);
    var xir = (xiRedirectUrl) ? xiRedirectUrl : window.location;
    this.setAttribute('xiRedirectUrl', xir);
    this.setAttribute('redirectUrl', '');
    if (redirectUrl) {
      this.setAttribute('redirectUrl', redirectUrl);
    }
  }
  deconcept.SWFObject.prototype = {
    useExpressInstall: function(path) {
      this.xiSWFPath = !path ? "expressinstall.swf" : path;
      this.setAttribute('useExpressInstall', true);
    },
    setAttribute: function(name, value) {
      this.attributes[name] = value;
    },
    getAttribute: function(name) {
      return this.attributes[name];
    },
    addParam: function(name, value) {
      this.params[name] = value;
    },
    getParams: function() {
      return this.params;
    },
    addVariable: function(name, value) {
      this.variables[name] = value;
    },
    getVariable: function(name) {
      return this.variables[name];
    },
    getVariables: function() {
      return this.variables;
    },
    getVariablePairs: function() {
      var variablePairs = new Array();
      var key;
      var variables = this.getVariables();
      for (key in variables) {
        variablePairs.push(key + "=" + variables[key]);
      }
      return variablePairs;
    },
    getSWFHTML: function() {
      var swfNode = "";
      if (navigator.plugins && navigator.mimeTypes && navigator.mimeTypes.length) {
        if (this.getAttribute("doExpressInstall")) {
          this.addVariable("MMplayerType", "PlugIn");
          this.setAttribute('swf', this.xiSWFPath);
        }
        swfNode = '<embed type="application/x-shockwave-flash" src="' + this.getAttribute('swf') + '" width="' + this.getAttribute('width') + '" height="' + this.getAttribute('height') + '"';
        swfNode += ' id="' + this.getAttribute('id') + '" name="' + this.getAttribute('id') + '" ';
        var params = this.getParams();
        for (var key in params) {
          swfNode += [key] + '="' + params[key] + '" ';
        }
        var pairs = this.getVariablePairs().join("&");
        if (pairs.length > 0) {
          swfNode += 'flashvars="' + pairs + '"';
        }
        swfNode += '/>';
      } else {
        if (this.getAttribute("doExpressInstall")) {
          this.addVariable("MMplayerType", "ActiveX");
          this.setAttribute('swf', this.xiSWFPath);
        }
        swfNode = '<object id="' + this.getAttribute('id') + '" classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" width="' + this.getAttribute('width') + '" height="' + this.getAttribute('height') + '">';
        swfNode += '<param name="movie" value="' + this.getAttribute('swf') + '" />';
        var params = this.getParams();
        for (var key in params) {
          swfNode += '<param name="' + key + '" value="' + params[key] + '" />';
        }
        var pairs = this.getVariablePairs().join("&");
        if (pairs.length > 0) {
          swfNode += '<param name="flashvars" value="' + pairs + '" />';
        }
        swfNode += "</object>";
      }
      return swfNode;
    },
    write: function(elementId) {
      if (this.getAttribute('useExpressInstall')) {
        var expressInstallReqVer = new deconcept.PlayerVersion([6, 0, 65]);
        if (this.installedVer.versionIsValid(expressInstallReqVer) && !this.installedVer.versionIsValid(this.getAttribute('version'))) {
          this.setAttribute('doExpressInstall', true);
          this.addVariable("MMredirectURL", escape(this.getAttribute('xiRedirectUrl')));
          document.title = document.title.slice(0, 47) + " - Flash Player Installation";
          this.addVariable("MMdoctitle", document.title);
        }
      }
      if (this.skipDetect || this.getAttribute('doExpressInstall') || this.installedVer.versionIsValid(this.getAttribute('version'))) {
        var n = (typeof elementId == 'string') ? document.getElementById(elementId) : elementId;
        n.innerHTML = this.getSWFHTML();
        return true;
      } else {
        if (this.getAttribute('redirectUrl') != "") {
          document.location.replace(this.getAttribute('redirectUrl'));
        }
      }
      return false;
    }
  }
  deconcept.SWFObjectUtil.getPlayerVersion = function() {
    var PlayerVersion = new deconcept.PlayerVersion([0, 0, 0]);
    if (navigator.plugins && navigator.mimeTypes.length) {
      var x = navigator.plugins["Shockwave Flash"];
      if (x && x.description) {
        PlayerVersion = new deconcept.PlayerVersion(x.description.replace(/([a-zA-Z]|\s)+/, "").replace(/(\s+r|\s+b[0-9]+)/, ".").split("."));
      }
    } else {
      try {
        var axo = new ActiveXObject("ShockwaveFlash.ShockwaveFlash.7");
      } catch (e) {
        try {
          var axo = new ActiveXObject("ShockwaveFlash.ShockwaveFlash.6");
          PlayerVersion = new deconcept.PlayerVersion([6, 0, 21]);
          axo.AllowScriptAccess = "always";
        } catch (e) {
          if (PlayerVersion.major == 6) {
            return PlayerVersion;
          }
        }
        try {
          axo = new ActiveXObject("ShockwaveFlash.ShockwaveFlash");
        } catch (e) {}
      }
      if (axo != null) {
        PlayerVersion = new deconcept.PlayerVersion(axo.GetVariable("$version").split(" ")[1].split(","));
      }
    }
    return PlayerVersion;
  }
  deconcept.PlayerVersion = function(arrVersion) {
    this.major = arrVersion[0] != null ? parseInt(arrVersion[0]) : 0;
    this.minor = arrVersion[1] != null ? parseInt(arrVersion[1]) : 0;
    this.rev = arrVersion[2] != null ? parseInt(arrVersion[2]) : 0;
  }
  deconcept.PlayerVersion.prototype.versionIsValid = function(fv) {
    if (this.major < fv.major) return false;
    if (this.major > fv.major) return true;
    if (this.minor < fv.minor) return false;
    if (this.minor > fv.minor) return true;
    if (this.rev < fv.rev) return false;
    return true;
  }
  deconcept.util = {
    getRequestParameter: function(param) {
      var q = document.location.search || document.location.hash;
      if (q) {
        var pairs = q.substring(1).split("&");
        for (var i = 0; i < pairs.length; i++) {
          if (pairs[i].substring(0, pairs[i].indexOf("=")) == param) {
            return pairs[i].substring((pairs[i].indexOf("=") + 1));
          }
        }
      }
      return "";
    }
  }
  deconcept.SWFObjectUtil.cleanupSWFs = function() {
    var objects = document.getElementsByTagName("OBJECT");
    for (var i = 0; i < objects.length; i++) {
      objects[i].style.display = 'none';
      for (var x in objects[i]) {
        if (typeof objects[i][x] == 'function') {
          objects[i][x] = function() {};
        }
      }
    }
  }
  if (deconcept.SWFObject.doPrepUnload) {
    deconcept.SWFObjectUtil.prepUnload = function() {
      __flash_unloadHandler = function() {};
      __flash_savedUnloadHandler = function() {};
      window.attachEvent("onunload", deconcept.SWFObjectUtil.cleanupSWFs);
    }
    window.attachEvent("onbeforeunload", deconcept.SWFObjectUtil.prepUnload);
  }
  if (Array.prototype.push == null) {
    Array.prototype.push = function(item) {
      this[this.length] = item;
      return this.length;
    }
  }
  var getQueryParamValue = deconcept.util.getRequestParameter;
  var FlashObject = deconcept.SWFObject;
  var SWFObject = deconcept.SWFObject;
  //swfobject-min end

  //!!!lib end!!!

  var $fh = root.$fh || {};
  if (typeof fh_app_props === "object") {
    $fh.app_props = fh_app_props;
  }

  $fh.legacy = {};

  var defaultargs = {
    success: function() {},
    failure: function() {},
    params: {}
  };

  var handleargs = function(inargs, defaultparams, applyto) {
    var outargs = [null, null, null];
    var origargs = [null, null, null];
    var numargs = inargs.length;

    if (2 < numargs) {
      origargs[0] = inargs[numargs - 3];
      origargs[1] = inargs[numargs - 2];
      origargs[2] = inargs[numargs - 1];
    } else if (2 == numargs) {
      origargs[1] = inargs[0];
      origargs[2] = inargs[1];
    } else if (1 == numargs) {
      origargs[2] = inargs[0];
    }

    var i = 0,
      j = 0;
    for (; i < 3; i++) {
      var a = origargs[i];
      var ta = typeof a;
      //console.log('iter i:'+i+' j:'+j+' ta:'+ta);
      if (a && 0 == j && ('object' == ta || 'boolean' == ta)) {
        //console.log('object i:'+i+' j:'+j+' ta:'+ta);
        outargs[j++] = a;
      } else if (a && 'function' == ta) {
        j = 0 == j ? 1 : j;
        //console.log('function i:'+i+' j:'+j+' ta:'+ta);
        outargs[j++] = a;
      }
    }

    if (null == outargs[0]) {
      outargs[0] = defaultparams ? defaultparams : defaultargs.params;
    } else {
      var paramsarg = outargs[0];
      paramsarg._defaults = [];
      for (var n in defaultparams) {
        if (defaultparams.hasOwnProperty(n)) {
          if (typeof paramsarg[n] === "undefined") { //we don't want to use !paramsarg[n] here because the parameter could exists in the argument and it could be false
            paramsarg[n] = defaultparams[n];
            paramsarg._defaults.push(n);
          }
        }
      }
    }

    outargs[1] = null == outargs[1] ? defaultargs.success : outargs[1];
    outargs[2] = null == outargs[2] ? defaultargs.failure : outargs[2];

    applyto(outargs[0], outargs[1], outargs[2]);
  }

  var eventSupported = function(event) {
    var element = document.createElement('i');
    return event in element || element.setAttribute && element.setAttribute(event, "return;") || false;
  }

  var __is_ready = false;
  var __ready_list = [];
  var __ready_bound = false;
  var boxprefix = "/box/srv/1.1/";

  _getHostPrefix = function() {
    return $fh.app_props.host + boxprefix;
  }

  var __ready = function() {
    if (!__is_ready) {
      __is_ready = true;
      if (__ready_list) {
        try {
          while (__ready_list[0]) {
            __ready_list.shift().apply(document, []);
          }

        } finally {

        }
        __ready_list = null;
      }
    }
  };

  var __bind_ready = function() {
    if (__ready_bound) return;
    __ready_bound = true;

    // Mozilla, Opera and webkit nightlies currently support this event
    if (document.addEventListener) {
      // Use the handy event callback
      document.addEventListener("DOMContentLoaded", function() {
        document.removeEventListener("DOMContentLoaded", arguments.callee, false);
        __ready();
      }, false);

      window.addEventListener("load", __ready, false);

      // If IE event model is used
    } else if (document.attachEvent) {
      // ensure firing before onload,
      // maybe late but safe also for iframes
      document.attachEvent("onreadystatechange", function() {
        if (document.readyState === "complete") {
          document.detachEvent("onreadystatechange", arguments.callee);
          __ready();
        }
      });

      window.attachEvent("onload", __ready);

      // If IE and not an iframe
      // continually check to see if the document is ready
      if (document.documentElement.doScroll && window == window.top)(function() {
        if (__is_ready) return;

        try {
          // If IE is used, use the trick by Diego Perini
          // http://javascript.nwbox.com/IEContentLoaded/
          document.documentElement.doScroll("left");
        } catch (error) {
          setTimeout(arguments.callee, 0);
          return;
        }

        // and execute any waiting functions
        __ready();
      })();
    }
  };

  __bind_ready();

  // destination functions
  var _mapScriptLoaded = (typeof google != "undefined") && (typeof google.maps != "undefined") && (typeof google.maps.Map != "undefined");
  //Contains the target element and success function for $fh.map functions
  var _mapLoadSuccessParameters = [];
  //Flag to show if a map script is loading or not.
  var _mapScriptLoading = false; 
  var _loadMapScript = function() {
    var script = document.createElement("script");
    script.type = "text/javascript";
    var protocol = document.location.protocol;
    protocol = (protocol === "http:" || protocol === "https:") ? protocol : "https:";
    script.src = protocol + "//maps.google.com/maps/api/js?sensor=true&callback=$fh._mapLoaded";
    document.body.appendChild(script);
  };

  var audio_obj = null;
  var audio_is_playing = false;

  $fh.__dest__ = {
    send: function(p, s, f) {
      f('send_nosupport');
    },
    notify: function(p, s, f) {
      f('notify_nosupport');
    },
    contacts: function(p, s, f) {
      f('contacts_nosupport');
    },
    acc: function(p, s, f) {
      f('acc_nosupport');
    },
    geo: function(p, s, f) {
      f('geo_nosupport');
    },
    cam: function(p, s, f) {
      f('cam_nosupport');
    },
    device: function(p, s, f) {
      f('device_nosupport');
    },
    listen: function(p, s, f) {
      f('listen_nosupport');
    },
    handlers: function(p, s, f) {
      f('handlers_no_support');
    },
    file: function(p, s, f) {
      f('file_nosupport');
    },
    push: function(p, s, f) {
      f('push_nosupport');
    },
    env: function(p, s, f) {
      s({
        height: window.innerHeight,
        width: window.innerWidth
      });
    }

    ,
    data: function(p, s, f) {
      if (!$fh._persist) {
        $fh._persist = new Persist.Store('FH' + $fh.app_props.appid, {
          swf_path: '/static/c/start/swf/persist.swf'
        });
      }

      if (!p.key) {
        f('data_nokey');
        return;
      }

      var acts = {
        load: function() {
          $fh._persist.get(p.key, function(ok, val) {
            ok ? s({
              key: p.key,
              val: val
            }) : s({
              key: p.key,
              val: null
            });
          });
        },
        save: function() {
          if (!p.val) {
            f('data_noval');
            return;
          }
          try {
            $fh._persist.set(p.key, p.val);
          } catch (e) {
            f('data_error', {}, p);
            return;
          }
          s();
        },
        remove: function() {
          $fh._persist.remove(p.key, function(ok, val) {
            ok ? s({
              key: p.key,
              val: val
            }) : s({
              key: p.key,
              val: null
            });
          });
        }
      };

      acts[p.act] ? acts[p.act]() : f('data_badact', p);
    }

    ,
    log: function(p, s, f) {
      typeof console === "undefined" ? f('log_nosupport') : console.log(p.message);
    }

    ,
    ori: function(p, s, f) {
      if (typeof p.act == "undefined" || p.act == "listen") {
        if (eventSupported('onorientationchange')) {
          window.addEventListener('orientationchange', s, false);
        } else {
          f('ori_nosupport', {}, p);
        }
      } else if (p.act == "set") {
        if (!p.value) {
          f('ori_no_value', {}, p);
          return;
        }
        if (p.value == "portrait") {
          document.getElementsByTagName("body")[0].style['-moz-transform'] = "";
          document.getElementsByTagName("body")[0].style['-webkit-transform'] = "";
          s({
            orientation: 'portrait'
          });
        } else {
          document.getElementsByTagName("body")[0].style['-moz-transform'] = 'rotate(90deg)';
          document.getElementsByTagName("body")[0].style['-webkit-transform'] = 'rotate(90deg)';
          s({
            orientation: 'landscape'
          });
        }
      } else {
        f('ori_badact', {}, p);
      }
    },
    map: function(p, s, f) {
      if (!p.target) {
        f('map_notarget', {}, p);
        return;
      }
      if (!p.lat) {
        f('map_nolatitude', {}, p);
        return;
      }
      if (!p.lon) {
        f('map_nologitude', {}, p);
        return;
      }
      var target = p.target;
      if (typeof target === "string") {
        var target_dom = null;
        if (typeof jQuery != "undefined") {
          try {
            var jq_obj = jQuery(target);
            if (jq_obj.length > 0) {
              target_dom = jq_obj[0];
            }
          } catch (e) {
            target_dom = null;
          }
        }
        if (null == target_dom) {
          target_dom = document.getElementById(target);
        }
        target = target_dom;
      } else if (typeof target === "object") {
        if (target.nodeType === 1 && typeof target.nodeName === "string") {
          // A DOM Element, do nothing
        } else {
          //A jQuery node
          target = target[0];
        }
      } else {
        target = null;
      }

      if (!target) {
        f('map_nocontainer', {}, p);
        return;
      }




      if (!_mapScriptLoaded) {

        //Queue the success function
        if(typeof(s) === 'function'){
            _mapLoadSuccessParameters.push({target: target, successFunction: s, mOptions: p});    
        }
        

        $fh._mapLoaded = function() {
          _mapScriptLoaded = true;
          var mapLoadSuccessParameter = _mapLoadSuccessParameters.shift();

          while(typeof(mapLoadSuccessParameter) !== 'undefined'){
            var mOptions = mapLoadSuccessParameter.mOptions;
            var mapOptions = {};
            mapOptions.zoom = mOptions.zoom ? mOptions.zoom : 8;
            mapOptions.center = new google.maps.LatLng(mOptions.lat, mOptions.lon);
            mapOptions.mapTypeId = google.maps.MapTypeId.ROADMAP;

            var map = new google.maps.Map(mapLoadSuccessParameter.target, mapOptions);
            mapLoadSuccessParameter.successFunction({map: map});  
            mapLoadSuccessParameter = _mapLoadSuccessParameters.shift();
          }
        };

        if(!_mapScriptLoading){
            _mapScriptLoading = true;
            _loadMapScript();    
        }
        
        //after 20 secs, if the map script is still not loaded, run the fail function
        setTimeout(function() {
          if (!_mapScriptLoaded) {
            f('map_timeout', {}, p);
          }
        }, 20000);
      } else {
        var mapOptions = {};
        mapOptions.zoom = p.zoom ? p.zoom : 8;
        mapOptions.center = new google.maps.LatLng(p.lat, p.lon);
        mapOptions.mapTypeId = google.maps.MapTypeId.ROADMAP;
        var map = new google.maps.Map(target, mapOptions);
        s({
          map: map
        });
      }
    }

    ,
    audio: function(p, s, f) {
      if (!audio_obj == null && p.act == "play" && (!p.path || p.path == "")) {
        f('no_audio_path');
        return;
      }
      var acts = {
        'play': function() {
          if (null == audio_obj) {
            audio_obj = document.createElement("audio");
            if (!((audio_obj.play) ? true : false)) {
              f('audio_not_support');
              return;
            }
            if (p.type) {
              var canplay = audio_obj.canPlayType(p.type);
              if (canplay == "no" || canplay == "") {
                f("audio_type_not_supported");
                return;
              }
            }
            audio_obj.src = p.path;
            if (p.controls) {
              audio_obj.controls = "controls";
            }
            if (p.autoplay) {
              audio_obj.autoplay = "autoplay";
            }
            if (p.loop) {
              audio_obj.loop = "loop";
            }
            document.body.appendChild(audio_obj);
            audio_obj.play();
            audio_is_playing = true;
            s();
          } else {
            //playing a new audio
            if (p.path && (p.path != audio_obj.src)) {
              if (audio_is_playing) {
                acts['stop'](true);
              }
              acts['play']();
            } else {
              //resume the existing audio
              if (!audio_is_playing) {
                audio_obj.play();
                audio_is_playing = true;
                s();
              }
            }
          }
        },

        'pause': function() {
          if (null != audio_obj && audio_is_playing) {
            if (typeof audio_obj.pause == "function") {
              audio_obj.pause();
            } else if (typeof audio_obj.stop == "function") {
              audio_obj.stop();
            }
            audio_is_playing = false;
            s();
          } else {
            f('no_audio_playing');
          }
        },

        'stop': function(nocallback) {
          if (null != audio_obj) {
            if (typeof audio_obj.stop == "function") {
              audio_obj.stop();
            } else if (typeof audio_obj.pause == "function") {
              audio_obj.pause();
            }
            document.body.removeChild(audio_obj);
            audio_obj = null;
            audio_is_playing = false;
            if (!nocallback) {
              s();
            }
          } else {
            f('no_audio');
          }
        }
      }

      acts[p.act] ? acts[p.act]() : f('data_badact', p);
    }

    ,
    webview: function(p, s, f) {
      f('webview_nosupport');
    },

    ready: function(p, s, f) {
      __bind_ready();
      if (__is_ready) {
        s.apply(document, []);
      } else {
        __ready_list.push(s);
      }
    }
  }

  $fh.send = function() {
    handleargs(arguments, {
      type: 'email'
    }, $fh.__dest__.send);
  }

  $fh.notify = function() {
    handleargs(arguments, {
      type: 'vibrate'
    }, $fh.__dest__.notify);
  }

  $fh.contacts = function() {
    handleargs(arguments, {
      act: 'list'
    }, $fh.__dest__.contacts);
  }

  $fh.acc = function() {
    handleargs(arguments, {
      act: 'register',
      interval: 0
    }, $fh.__dest__.acc);
  }

  $fh.geo = function() {
    handleargs(arguments, {
      act: 'register',
      interval: 0
    }, $fh.__dest__.geo);
  }

  $fh.cam = function() {
    handleargs(arguments, {
      act: 'picture'
    }, $fh.__dest__.cam);
  }

  $fh.data = function() {
    handleargs(arguments, {
      act: 'load'
    }, $fh.__dest__.data);
  }

  $fh.log = function() {
    handleargs(arguments, {
      message: 'none'
    }, $fh.__dest__.log);
  }

  $fh.device = function() {
    handleargs(arguments, {}, $fh.__dest__.device);
  }

  $fh.listen = function() {
    handleargs(arguments, {
      act: 'add'
    }, $fh.__dest__.listen);
  }

  $fh.ori = function() {
    handleargs(arguments, {}, $fh.__dest__.ori);
  }

  $fh.map = function() {
    handleargs(arguments, {}, $fh.__dest__.map);
  }

  $fh.audio = function() {
    handleargs(arguments, {}, $fh.__dest__.audio);
  }

  $fh.webview = function() {
    handleargs(arguments, {}, $fh.__dest__.webview);
  }

  $fh.ready = function() {
    handleargs(arguments, {}, $fh.__dest__.ready);
  };

  $fh.handlers = function() {
    handleargs(arguments, {
      type: 'back'
    }, $fh.__dest__.handlers);
  };

  $fh.file = function() {
    handleargs(arguments, {
      act: 'upload'
    }, $fh.__dest__.file);
  };

  $fh.push = function() {
    handleargs(arguments, {}, $fh.__dest__.push);
  };

  // new functions
  $fh.env = function() {
    handleargs(arguments, {}, function(p, s, f) {
      // flat property set - no sub objects!
      $fh.__dest__.env({}, function(destEnv) {
        destEnv.application = $fh.app_props.appid;
        if ($fh._getDeviceId) {
          destEnv.uuid = $fh._getDeviceId();
        }
        destEnv.agent = navigator.userAgent || 'unknown';
        s(destEnv);
      });
    });
  }

  $fh.device = function() {
    handleargs(arguments, {}, function(p, s, f) {

    });
  }


  // defaults: 
  //    {act:'get'} -> {geoip:{...}}
  //  failures: geoip_badact
  //
  $fh.geoip = function() {
    handleargs(arguments, {
      act: 'get'
    }, function(p, s, f) {
      if ('get' == p.act) {
        var data = {
          instance: $fh.app_props.appid,
          domain: $fh.cloud_props.domain
        }
        $fh.__ajax({
          "url": _getHostPrefix() + "act/wid/geoip/resolve",
          "type": "POST",
          "data": JSON.stringify(data),
          "success": function(res) {
            // backwards compat
            for (var n in res.geoip) {
              res[n] = res['geoip'][n];
            }
            s(res);
          }
        });
      } else {
        f('geoip_badact', p);
      }
    });
  };

  $fh.web = function(p, s, f) {
    handleargs(arguments, {
      method: 'GET'
    }, function(p, s, f) {
      if (!p.url) {
        f('bad_url');
      }

      if (p.is_local) {
        $fh.__ajax({
          url: p.url,
          type: "GET",
          dataType: "html",
          //xhr: $fh.xhr,
          success: function(data) {
            var res = {};
            res.status = 200;
            res.body = data;
            s(res);
          },
          error: function() {
            f();
          }
        })
      } else {
        $fh.__ajax({
          "url": _getHostPrefix() + "act/wid/web",
          "type": "POST",
          "data": JSON.stringify(p),
          "success": function(res) {
            s(res);
          }
        });
      }
    });
  };

  $fh.__webview_win = undefined;
  $fh.__dest__.webview = function(p, s, f) {
    if (!('act' in p) || p.act === 'open') {
      if (!p.url) {
        f('no_url');
        return;
      }
      var old_url = p.url;
      $fh.__webview_win = window.open(p.url, '_blank');
      s("opened");
    } else {
      if (p.act === 'close') {
        if (typeof $fh.__webview_win != 'undefined') {
          $fh.__webview_win.close();
          $fh.__webview_win = undefined;
        }
        s("closed");
      }
    }
  };

  $fh.__dest__.geo = function(p, s, f) {
    if (typeof navigator.geolocation != 'undefined') {
      if (!p.act || p.act == "register") {
        if ($fh.__dest__._geoWatcher) {
          f('geo_inuse', {}, p);
          return;
        }
        if (p.interval == 0) {
          navigator.geolocation.getCurrentPosition(function(position) {
            var coords = position.coords;
            var resdata = {
              lon: coords.longitude,
              lat: coords.latitude,
              alt: coords.altitude,
              acc: coords.accuracy,
              head: coords.heading,
              speed: coords.speed,
              when: position.timestamp
            };
            s(resdata);
          }, function() {
            f('error_geo', {}, p);
          })
        };
        if (p.interval > 0) {
          var internalWatcher = navigator.geolocation.watchPosition(function(position) {
            var coords = position.coords;
            var resdata = {
              lon: coords.longitude,
              lat: coords.latitude,
              alt: coords.altitude,
              acc: coords.accuracy,
              head: coords.heading,
              speed: coords.speed,
              when: position.timestamp
            };
            s(resdata);
          }, function() {
            f('error_geo', {}, p);
          }, {
            frequency: p.interval
          });
          $fh.__dest__._geoWatcher = internalWatcher;
        };
      } else if (p.act == "unregister") {
        if ($fh.__dest__._geoWatcher) {
          navigator.geolocation.clearWatch($fh.__dest__._geoWatcher);
          $fh.__dest__._geoWatcher = undefined;
        };
        s();
      } else {
        f('geo_badact', {}, p);
      }
    } else {
      f('geo_nosupport', {}, p);
    }
  };

  $fh.__dest__.acc = function(p, s, f) {
    s({
      x: (Math.random() * 4) - 2,
      y: (Math.random() * 4) - 2,
      z: (Math.random() * 4) - 2,
      when: new Date().getTime()
    });
  }

  root.$fh = $fh;

})(this);
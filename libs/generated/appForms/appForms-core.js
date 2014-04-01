;
(function (root) {

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

    var JSON = function () {

      function f(n) {    // Format integers to have at least two digits.
        return n < 10 ? '0' + n : n;
      }

      Date.prototype.toJSON = function () {

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
        meta = {    // table of character substitutions
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
          '"' + string.replace(escapeable, function (a) {
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
        stringify: function (value, replacer, space) {

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
            rep = function (key, value) {
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

          return str('', {'': value});
        },


        parse: function (text, reviver) {

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

          if (/^[\],:{}\s]*$/.test(text.replace(/\\["\\\/bfnrtu]/g, '@').
            replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').
            replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {

// In the second stage we use the eval function to compile the text into a
// JavaScript structure. The '{' operator is subject to a syntactic ambiguity
// in JavaScript: it can begin a block or an object literal. We wrap the text
// in parens to eliminate the ambiguity.

            j = eval('(' + text + ')');

// In the optional third stage, we recursively walk the new structure, passing
// each name/value pair to a reviver function for possible transformation.

            return typeof reviver === 'function' ?
              walk({'': j}, '') : j;
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

  (function(){if(window.google&&google.gears)
    return;var F=null;if(typeof GearsFactory!='undefined'){F=new GearsFactory();}else{try{F=new ActiveXObject('Gears.Factory');if(F.getBuildInfo().indexOf('ie_mobile')!=-1)
    F.privateSetGlobalObject(this);}catch(e){if((typeof navigator.mimeTypes!='undefined')&&navigator.mimeTypes["application/x-googlegears"]){F=document.createElement("object");F.style.display="none";F.width=0;F.height=0;F.type="application/x-googlegears";document.documentElement.appendChild(F);}}}
    if(!F)
      return;if(!window.google)
      google={};if(!google.gears)
      google.gears={factory:F};})();Persist=(function(){var VERSION='0.2.0',P,B,esc,init,empty,ec;ec=(function(){var EPOCH='Thu, 01-Jan-1970 00:00:01 GMT',RATIO=1000*60*60*24,KEYS=['expires','path','domain'],esc=escape,un=unescape,doc=document,me;var get_now=function(){var r=new Date();r.setTime(r.getTime());return r;}
    var cookify=function(c_key,c_val){var i,key,val,r=[],opt=(arguments.length>2)?arguments[2]:{};r.push(esc(c_key)+'='+esc(c_val));for(i=0;i<KEYS.length;i++){key=KEYS[i];if(val=opt[key])
      r.push(key+'='+val);}
      if(opt.secure)
        r.push('secure');return r.join('; ');}
    var alive=function(){var k='__EC_TEST__',v=new Date();v=v.toGMTString();this.set(k,v);this.enabled=(this.remove(k)==v);return this.enabled;}
    me={set:function(key,val){var opt=(arguments.length>2)?arguments[2]:{},now=get_now(),expire_at,cfg={};if(opt.expires){opt.expires*=RATIO;cfg.expires=new Date(now.getTime()+opt.expires);cfg.expires=cfg.expires.toGMTString();}
      var keys=['path','domain','secure'];for(i=0;i<keys.length;i++)
        if(opt[keys[i]])
          cfg[keys[i]]=opt[keys[i]];var r=cookify(key,val,cfg);doc.cookie=r;return val;},has:function(key){key=esc(key);var c=doc.cookie,ofs=c.indexOf(key+'='),len=ofs+key.length+1,sub=c.substring(0,key.length);return((!ofs&&key!=sub)||ofs<0)?false:true;},get:function(key){key=esc(key);var c=doc.cookie,ofs=c.indexOf(key+'='),len=ofs+key.length+1,sub=c.substring(0,key.length),end;if((!ofs&&key!=sub)||ofs<0)
      return null;end=c.indexOf(';',len);if(end<0)
      end=c.length;return un(c.substring(len,end));},remove:function(k){var r=me.get(k),opt={expires:EPOCH};doc.cookie=cookify(k,'',opt);return r;},keys:function(){var c=doc.cookie,ps=c.split('; '),i,p,r=[];for(i=0;i<ps.length;i++){p=ps[i].split('=');r.push(un(p[0]));}
      return r;},all:function(){var c=doc.cookie,ps=c.split('; '),i,p,r=[];for(i=0;i<ps.length;i++){p=ps[i].split('=');r.push([un(p[0]),un(p[1])]);}
      return r;},version:'0.2.1',enabled:false};me.enabled=alive.call(me);return me;}());var index_of=(function(){if(Array.prototype.indexOf)
    return function(ary,val){return Array.prototype.indexOf.call(ary,val);};else
    return function(ary,val){var i,l;for(i=0,l=ary.length;i<l;i++)
      if(ary[i]==val)
        return i;return-1;};})();empty=function(){};esc=function(str){return'PS'+str.replace(/_/g,'__').replace(/ /g,'_s');};C={search_order:['localstorage','whatwg_db','globalstorage','gears','ie','flash','cookie'],name_re:/^[a-z][a-z0-9_ -]+$/i,methods:['init','get','set','remove','load','save'],sql:{version:'1',create:"CREATE TABLE IF NOT EXISTS persist_data (k TEXT UNIQUE NOT NULL PRIMARY KEY, v TEXT NOT NULL)",get:"SELECT v FROM persist_data WHERE k = ?",set:"INSERT INTO persist_data(k, v) VALUES (?, ?)",remove:"DELETE FROM persist_data WHERE k = ?"},flash:{div_id:'_persist_flash_wrap',id:'_persist_flash',path:'persist.swf',size:{w:1,h:1},args:{autostart:true}}};B={gears:{size:-1,test:function(){return(window.google&&window.google.gears)?true:false;},methods:{transaction:function(fn){var db=this.db;db.execute('BEGIN').close();fn.call(this,db);db.execute('COMMIT').close();},init:function(){var db;db=this.db=google.gears.factory.create('beta.database');db.open(esc(this.name));db.execute(C.sql.create).close();},get:function(key,fn,scope){var r,sql=C.sql.get;if(!fn)
    return;this.transaction(function(t){var is_valid,val;r=t.execute(sql,[key]);is_valid=r.isValidRow();val=is_valid?r.field(0):null;r.close();fn.call(scope||this,is_valid,val);});},set:function(key,val,fn,scope){var rm_sql=C.sql.remove,sql=C.sql.set,r;this.transaction(function(t){t.execute(rm_sql,[key]).close();t.execute(sql,[key,val]).close();if(fn)
    fn.call(scope||this,true,val);});},remove:function(key,fn,scope){var get_sql=C.sql.get;sql=C.sql.remove,r,val=null,is_valid=false;this.transaction(function(t){if(fn){r=t.execute(get_sql,[key]);is_valid=r.isValidRow();val=is_valid?r.field(0):null;r.close();}
    if(!fn||is_valid){t.execute(sql,[key]).close();}
    if(fn)
      fn.call(scope||this,is_valid,val);});}}},whatwg_db:{size:200*1024,test:function(){var name='PersistJS Test',desc='Persistent database test.';if(!window.openDatabase)
    return false;if(!window.openDatabase(name,C.sql.version,desc,B.whatwg_db.size))
    return false;return true;},methods:{transaction:function(fn){if(!this.db_created){this.db.transaction(function(t){t.executeSql(C.sql.create,[],function(){this.db_created=true;});},empty);}
    this.db.transaction(fn);},init:function(){this.db=openDatabase(this.name,C.sql.version,this.o.about||("Persistent storage for "+this.name),this.o.size||B.whatwg_db.size);},get:function(key,fn,scope){var sql=C.sql.get;if(!fn)
    return;scope=scope||this;this.transaction(function(t){t.executeSql(sql,[key],function(t,r){if(r.rows.length>0)
    fn.call(scope,true,r.rows.item(0)['v']);else
    fn.call(scope,false,null);});});},set:function(key,val,fn,scope){var rm_sql=C.sql.remove,sql=C.sql.set;this.transaction(function(t){t.executeSql(rm_sql,[key],function(){t.executeSql(sql,[key,val],function(t,r){if(fn)
    fn.call(scope||this,true,val);});});});return val;},remove:function(key,fn,scope){var get_sql=C.sql.get;sql=C.sql.remove;this.transaction(function(t){if(fn){t.executeSql(get_sql,[key],function(t,r){if(r.rows.length>0){var val=r.rows.item(0)['v'];t.executeSql(sql,[key],function(t,r){fn.call(scope||this,true,val);});}else{fn.call(scope||this,false,null);}});}else{t.executeSql(sql,[key]);}});}}},globalstorage:{size:5*1024*1024,test:function(){return window.globalStorage?true:false;},methods:{key:function(key){return esc(this.name)+esc(key);},init:function(){alert('domain = '+this.o.domain);this.store=globalStorage[this.o.domain];},get:function(key,fn,scope){key=this.key(key);if(fn)
    fn.call(scope||this,true,this.store.getItem(key));},set:function(key,val,fn,scope){key=this.key(key);this.store.setItem(key,val);if(fn)
    fn.call(scope||this,true,val);},remove:function(key,fn,scope){var val;key=this.key(key);val=this.store[key];this.store.removeItem(key);if(fn)
    fn.call(scope||this,(val!==null),val);}}},localstorage:{size:-1,test:function(){return window.localStorage?true:false;},methods:{key:function(key){return esc(this.name)+esc(key);},init:function(){this.store=localStorage;},get:function(key,fn,scope){key=this.key(key);if(fn)
    fn.call(scope||this,true,this.store.getItem(key));},set:function(key,val,fn,scope){key=this.key(key);this.store.setItem(key,val);if(fn)
    fn.call(scope||this,true,val);},remove:function(key,fn,scope){var val;key=this.key(key);val=this.store.getItem(key);this.store.removeItem(key);if(fn)
    fn.call(scope||this,(val!==null),val);}}},ie:{prefix:'_persist_data-',size:64*1024,test:function(){return window.ActiveXObject?true:false;},make_userdata:function(id){var el=document.createElement('div');el.id=id;el.style.display='none';el.addBehavior('#default#userdata');document.body.appendChild(el);return el;},methods:{init:function(){var id=B.ie.prefix+esc(this.name);this.el=B.ie.make_userdata(id);if(this.o.defer)
    this.load();},get:function(key,fn,scope){var val;key=esc(key);if(!this.o.defer)
    this.load();val=this.el.getAttribute(key);if(fn)
    fn.call(scope||this,val?true:false,val);},set:function(key,val,fn,scope){key=esc(key);this.el.setAttribute(key,val);if(!this.o.defer)
    this.save();if(fn)
    fn.call(scope||this,true,val);},remove:function(key,fn,scope){var val;key=esc(key);if(!this.o.defer)
    this.load();val=this.el.getAttribute(key);this.el.removeAttribute(key);if(!this.o.defer)
    this.save();if(fn)
    fn.call(scope||this,val?true:false,val);},load:function(){this.el.load(esc(this.name));},save:function(){this.el.save(esc(this.name));}}},cookie:{delim:':',size:4000,test:function(){return P.Cookie.enabled?true:false;},methods:{key:function(key){return this.name+B.cookie.delim+key;},get:function(key,fn,scope){var val;key=this.key(key);val=ec.get(key);if(fn)
    fn.call(scope||this,val!=null,val);},set:function(key,val,fn,scope){key=this.key(key);ec.set(key,val,this.o);if(fn)
    fn.call(scope||this,true,val);},remove:function(key,val,fn,scope){var val;key=this.key(key);val=ec.remove(key)
    if(fn)
      fn.call(scope||this,val!=null,val);}}},flash:{test:function(){if(!deconcept||!deconcept.SWFObjectUtil)
    return false;var major=deconcept.SWFObjectUtil.getPlayerVersion().major;return(major>=8)?true:false;},methods:{init:function(){if(!B.flash.el){var o,key,el,cfg=C.flash;el=document.createElement('div');el.id=cfg.div_id;document.body.appendChild(el);o=new deconcept.SWFObject(this.o.swf_path||cfg.path,cfg.id,cfg.size.w,cfg.size.h,'8');for(key in cfg.args)
    o.addVariable(key,cfg.args[key]);o.write(el);B.flash.el=document.getElementById(cfg.id);}
    this.el=B.flash.el;},get:function(key,fn,scope){var val;key=esc(key);val=this.el.get(this.name,key);if(fn)
    fn.call(scope||this,val!==null,val);},set:function(key,val,fn,scope){var old_val;key=esc(key);old_val=this.el.set(this.name,key,val);if(fn)
    fn.call(scope||this,true,val);},remove:function(key,fn,scope){var val;key=esc(key);val=this.el.remove(this.name,key);if(fn)
    fn.call(scope||this,true,val);}}}};var init=function(){var i,l,b,key,fns=C.methods,keys=C.search_order;for(i=0,l=fns.length;i<l;i++)
    P.Store.prototype[fns[i]]=empty;P.type=null;P.size=-1;for(i=0,l=keys.length;!P.type&&i<l;i++){b=B[keys[i]];if(b.test()){P.type=keys[i];P.size=b.size;for(key in b.methods)
    P.Store.prototype[key]=b.methods[key];}}
    P._init=true;};P={VERSION:VERSION,type:null,size:0,add:function(o){B[o.id]=o;C.search_order=[o.id].concat(C.search_order);init();},remove:function(id){var ofs=index_of(C.search_order,id);if(ofs<0)
    return;C.search_order.splice(ofs,1);delete B[id];init();},Cookie:ec,Store:function(name,o){if(!C.name_re.exec(name))
    throw new Error("Invalid name");if(!P.type)
    throw new Error("No suitable storage found");o=o||{};this.name=name;o.domain=o.domain||location.host||'localhost';o.domain=o.domain.replace(/:\d+$/,'')
    this.o=o;o.expires=o.expires||365*2;o.path=o.path||'/';this.init();}};init();return P;})();
//persist-min end

//swfobject-min start

  if(typeof deconcept=="undefined")var deconcept=new Object();if(typeof deconcept.util=="undefined")deconcept.util=new Object();if(typeof deconcept.SWFObjectUtil=="undefined")deconcept.SWFObjectUtil=new Object();deconcept.SWFObject=function(swf,id,w,h,ver,c,quality,xiRedirectUrl,redirectUrl,detectKey){if(!document.getElementById){return;}
    this.DETECT_KEY=detectKey?detectKey:'detectflash';this.skipDetect=deconcept.util.getRequestParameter(this.DETECT_KEY);this.params=new Object();this.variables=new Object();this.attributes=new Array();if(swf){this.setAttribute('swf',swf);}
    if(id){this.setAttribute('id',id);}
    if(w){this.setAttribute('width',w);}
    if(h){this.setAttribute('height',h);}
    if(ver){this.setAttribute('version',new deconcept.PlayerVersion(ver.toString().split(".")));}
    this.installedVer=deconcept.SWFObjectUtil.getPlayerVersion();if(!window.opera&&document.all&&this.installedVer.major>7){deconcept.SWFObject.doPrepUnload=true;}
    if(c){this.addParam('bgcolor',c);}
    var q=quality?quality:'high';this.addParam('quality',q);this.setAttribute('useExpressInstall',false);this.setAttribute('doExpressInstall',false);var xir=(xiRedirectUrl)?xiRedirectUrl:window.location;this.setAttribute('xiRedirectUrl',xir);this.setAttribute('redirectUrl','');if(redirectUrl){this.setAttribute('redirectUrl',redirectUrl);}}
  deconcept.SWFObject.prototype={useExpressInstall:function(path){this.xiSWFPath=!path?"expressinstall.swf":path;this.setAttribute('useExpressInstall',true);},setAttribute:function(name,value){this.attributes[name]=value;},getAttribute:function(name){return this.attributes[name];},addParam:function(name,value){this.params[name]=value;},getParams:function(){return this.params;},addVariable:function(name,value){this.variables[name]=value;},getVariable:function(name){return this.variables[name];},getVariables:function(){return this.variables;},getVariablePairs:function(){var variablePairs=new Array();var key;var variables=this.getVariables();for(key in variables){variablePairs.push(key+"="+variables[key]);}
    return variablePairs;},getSWFHTML:function(){var swfNode="";if(navigator.plugins&&navigator.mimeTypes&&navigator.mimeTypes.length){if(this.getAttribute("doExpressInstall")){this.addVariable("MMplayerType","PlugIn");this.setAttribute('swf',this.xiSWFPath);}
    swfNode='<embed type="application/x-shockwave-flash" src="'+this.getAttribute('swf')+'" width="'+this.getAttribute('width')+'" height="'+this.getAttribute('height')+'"';swfNode+=' id="'+this.getAttribute('id')+'" name="'+this.getAttribute('id')+'" ';var params=this.getParams();for(var key in params){swfNode+=[key]+'="'+params[key]+'" ';}
    var pairs=this.getVariablePairs().join("&");if(pairs.length>0){swfNode+='flashvars="'+pairs+'"';}
    swfNode+='/>';}else{if(this.getAttribute("doExpressInstall")){this.addVariable("MMplayerType","ActiveX");this.setAttribute('swf',this.xiSWFPath);}
    swfNode='<object id="'+this.getAttribute('id')+'" classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" width="'+this.getAttribute('width')+'" height="'+this.getAttribute('height')+'">';swfNode+='<param name="movie" value="'+this.getAttribute('swf')+'" />';var params=this.getParams();for(var key in params){swfNode+='<param name="'+key+'" value="'+params[key]+'" />';}
    var pairs=this.getVariablePairs().join("&");if(pairs.length>0){swfNode+='<param name="flashvars" value="'+pairs+'" />';}
    swfNode+="</object>";}
    return swfNode;},write:function(elementId){if(this.getAttribute('useExpressInstall')){var expressInstallReqVer=new deconcept.PlayerVersion([6,0,65]);if(this.installedVer.versionIsValid(expressInstallReqVer)&&!this.installedVer.versionIsValid(this.getAttribute('version'))){this.setAttribute('doExpressInstall',true);this.addVariable("MMredirectURL",escape(this.getAttribute('xiRedirectUrl')));document.title=document.title.slice(0,47)+" - Flash Player Installation";this.addVariable("MMdoctitle",document.title);}}
    if(this.skipDetect||this.getAttribute('doExpressInstall')||this.installedVer.versionIsValid(this.getAttribute('version'))){var n=(typeof elementId=='string')?document.getElementById(elementId):elementId;n.innerHTML=this.getSWFHTML();return true;}else{if(this.getAttribute('redirectUrl')!=""){document.location.replace(this.getAttribute('redirectUrl'));}}
    return false;}}
  deconcept.SWFObjectUtil.getPlayerVersion=function(){var PlayerVersion=new deconcept.PlayerVersion([0,0,0]);if(navigator.plugins&&navigator.mimeTypes.length){var x=navigator.plugins["Shockwave Flash"];if(x&&x.description){PlayerVersion=new deconcept.PlayerVersion(x.description.replace(/([a-zA-Z]|\s)+/,"").replace(/(\s+r|\s+b[0-9]+)/,".").split("."));}}else{try{var axo=new ActiveXObject("ShockwaveFlash.ShockwaveFlash.7");}catch(e){try{var axo=new ActiveXObject("ShockwaveFlash.ShockwaveFlash.6");PlayerVersion=new deconcept.PlayerVersion([6,0,21]);axo.AllowScriptAccess="always";}catch(e){if(PlayerVersion.major==6){return PlayerVersion;}}
    try{axo=new ActiveXObject("ShockwaveFlash.ShockwaveFlash");}catch(e){}}
    if(axo!=null){PlayerVersion=new deconcept.PlayerVersion(axo.GetVariable("$version").split(" ")[1].split(","));}}
    return PlayerVersion;}
  deconcept.PlayerVersion=function(arrVersion){this.major=arrVersion[0]!=null?parseInt(arrVersion[0]):0;this.minor=arrVersion[1]!=null?parseInt(arrVersion[1]):0;this.rev=arrVersion[2]!=null?parseInt(arrVersion[2]):0;}
  deconcept.PlayerVersion.prototype.versionIsValid=function(fv){if(this.major<fv.major)return false;if(this.major>fv.major)return true;if(this.minor<fv.minor)return false;if(this.minor>fv.minor)return true;if(this.rev<fv.rev)return false;return true;}
  deconcept.util={getRequestParameter:function(param){var q=document.location.search||document.location.hash;if(q){var pairs=q.substring(1).split("&");for(var i=0;i<pairs.length;i++){if(pairs[i].substring(0,pairs[i].indexOf("="))==param){return pairs[i].substring((pairs[i].indexOf("=")+1));}}}
    return"";}}
  deconcept.SWFObjectUtil.cleanupSWFs=function(){var objects=document.getElementsByTagName("OBJECT");for(var i=0;i<objects.length;i++){objects[i].style.display='none';for(var x in objects[i]){if(typeof objects[i][x]=='function'){objects[i][x]=function(){};}}}}
  if(deconcept.SWFObject.doPrepUnload){deconcept.SWFObjectUtil.prepUnload=function(){__flash_unloadHandler=function(){};__flash_savedUnloadHandler=function(){};window.attachEvent("onunload",deconcept.SWFObjectUtil.cleanupSWFs);}
    window.attachEvent("onbeforeunload",deconcept.SWFObjectUtil.prepUnload);}
  if(Array.prototype.push==null){Array.prototype.push=function(item){this[this.length]=item;return this.length;}}
  var getQueryParamValue=deconcept.util.getRequestParameter;var FlashObject=deconcept.SWFObject;var SWFObject=deconcept.SWFObject;
//swfobject-min end

  //!!!lib end!!!

  var $fh = root.$fh || {};

  var defaultargs = {
    success: function () {
    },
    failure: function () {
    },
    params: {}
  };

  var handleargs = function (inargs, defaultparams, applyto) {
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
          if (typeof paramsarg[n] === "undefined") {  //we don't want to use !paramsarg[n] here because the parameter could exists in the argument and it could be false
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

  var eventSupported = function (event) {
    var element = document.createElement('i');
    return event in element || element.setAttribute && element.setAttribute(event, "return;") || false;
  }

  var __is_ready = false;
  var __ready_list = [];
  var __ready_bound = false;
  var boxprefix = "/box/srv/1.1/";

  _getHostPrefix = function () {
    return $fh.app_props.host + boxprefix;
  }

  var __ready = function () {
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

  var __bind_ready = function () {
    if (__ready_bound) return;
    __ready_bound = true;

    // Mozilla, Opera and webkit nightlies currently support this event
    if (document.addEventListener) {
      // Use the handy event callback
      document.addEventListener("DOMContentLoaded", function () {
        document.removeEventListener("DOMContentLoaded", arguments.callee, false);
        __ready();
      }, false);

      window.addEventListener("load", __ready, false);

      // If IE event model is used
    } else if (document.attachEvent) {
      // ensure firing before onload,
      // maybe late but safe also for iframes
      document.attachEvent("onreadystatechange", function () {
        if (document.readyState === "complete") {
          document.detachEvent("onreadystatechange", arguments.callee);
          __ready();
        }
      });

      window.attachEvent("onload", __ready);

      // If IE and not an iframe
      // continually check to see if the document is ready
      if (document.documentElement.doScroll && window == window.top)(function () {
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
  var mapFuncs = [];
  var loadingScript = false;
  var _loadMapScript = function () {
    if (loadingScript) return;
    loadingScript = true;
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
    send: function (p, s, f) {
      f('send_nosupport');
    },
    notify: function (p, s, f) {
      f('notify_nosupport');
    },
    contacts: function (p, s, f) {
      f('contacts_nosupport');
    },
    acc: function (p, s, f) {
      f('acc_nosupport');
    },
    geo: function (p, s, f) {
      f('geo_nosupport');
    },
    cam: function (p, s, f) {
      f('cam_nosupport');
    },
    device: function (p, s, f) {
      f('device_nosupport');
    },
    listen: function (p, s, f) {
      f('listen_nosupport');
    },
    handlers: function (p, s, f) {
      f('handlers_no_support');
    },
    file: function (p, s, f) {
      f('file_nosupport');
    },
    push: function (p, s, f) {
      f('push_nosupport');
    },
    env: function (p, s, f) {
      s({
        height: window.innerHeight,
        width: window.innerWidth
      });
    },
    data: function (p, s, f) {
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
        load: function () {
          $fh._persist.get(p.key, function (ok, val) {
            ok ? s({
              key: p.key,
              val: val
            }) : s({
              key: p.key,
              val: null
            });
          });
        },
        save: function () {
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
        remove: function () {
          $fh._persist.remove(p.key, function (ok, val) {
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
    },
    log: function (p, s, f) {
      typeof console === "undefined" ? f('log_nosupport') : console.log(p.message);
    },
    ori: function (p, s, f) {
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
          s({orientation: 'portrait'});
        } else {
          document.getElementsByTagName("body")[0].style['-moz-transform'] = 'rotate(90deg)';
          document.getElementsByTagName("body")[0].style['-webkit-transform'] = 'rotate(90deg)';
          s({orientation: 'landscape'});
        }
      } else {
        f('ori_badact', {}, p);
      }
    },
    map: function (p, s, f) {
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
      }
      else if (typeof target === "object") {
        if (target.nodeType === 1 && typeof target.nodeName === "string") {
          // A DOM Element, do nothing
        } else {
          //A jQuery node
          target = target[0];
        }
      }
      else {
        target = null;
      }

      if (!target) {
        f('map_nocontainer', {}, p);
        return;
      }
      $fh._mapLoaded = function () {
        var fMap;
        while (fMap = mapFuncs.pop()) {
          fMap();
        }
      };
      mapFuncs.push(function () {
        var mapOptions = {};
        mapOptions.zoom = p.zoom ? p.zoom : 8;
        mapOptions.center = new google.maps.LatLng(p.lat, p.lon);
        mapOptions.mapTypeId = google.maps.MapTypeId.ROADMAP;
        var map = new google.maps.Map(target, mapOptions);
        s({
          map: map
        });
      });
      _mapScriptLoaded = (typeof google != "undefined") && (typeof google.maps != "undefined") && (typeof google.maps.Map != "undefined");
      if (!_mapScriptLoaded) {
        _loadMapScript();
        //after 20 secs, if the map script is still not loaded, run the fail function
        setTimeout(function () {
          _mapScriptLoaded = (typeof google != "undefined") && (typeof google.maps != "undefined") && (typeof google.maps.Map != "undefined");
          if (!_mapScriptLoaded) {
            f('map_timeout', {}, p);
          }
        }, 20000);
      } else {
        $fh._mapLoaded();
      }
    },
    audio: function (p, s, f) {
      if (!audio_obj == null && p.act == "play" && (!p.path || p.path == "")) {
        f('no_audio_path');
        return;
      }
      var acts = {
        'play': function () {
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

        'pause': function () {
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

        'stop': function (nocallback) {
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
    },
    webview: function (p, s, f) {
      f('webview_nosupport');
    },

    ready: function (p, s, f) {
      __bind_ready();
      if (__is_ready) {
        s.apply(document, []);
      } else {
        __ready_list.push(s);
      }
    }
  }

  //Overriding $fh.ready if the app is on-device.
  if(window.PhoneGap || window.cordova){
    $fh._readyCallbacks = [];
    $fh._readyState = false;
    $fh.__dest__.ready = function (p, s, f) {
      if ($fh._readyState) {
        try {
          s();
        } catch (e) {
          console.log("Error during $fh.ready. Skip. Error = " + e.message);
        }
      } else {
        $fh._readyCallbacks.push(s);
      }
    };
  }

  $fh.send = function () {
    handleargs(arguments, {
      type: 'email'
    }, $fh.__dest__.send);
  }

  $fh.notify = function () {
    handleargs(arguments, {
      type: 'vibrate'
    }, $fh.__dest__.notify);
  }

  $fh.contacts = function () {
    handleargs(arguments, {
      act: 'list'
    }, $fh.__dest__.contacts);
  }

  $fh.acc = function () {
    handleargs(arguments, {
      act: 'register',
      interval: 0
    }, $fh.__dest__.acc);
  }

  $fh.geo = function () {
    handleargs(arguments, {
      act: 'register',
      interval: 0
    }, $fh.__dest__.geo);
  }

  $fh.cam = function () {
    handleargs(arguments, {
      act: 'picture'
    }, $fh.__dest__.cam);
  }

  $fh.data = function () {
    handleargs(arguments, {
      act: 'load'
    }, $fh.__dest__.data);
  }

  $fh.log = function () {
    handleargs(arguments, {
      message: 'none'
    }, $fh.__dest__.log);
  }

  $fh.device = function () {
    handleargs(arguments, {}, $fh.__dest__.device);
  }

  $fh.listen = function () {
    handleargs(arguments, {
      act: 'add'
    }, $fh.__dest__.listen);
  }

  $fh.ori = function () {
    handleargs(arguments, {}, $fh.__dest__.ori);
  }

  $fh.map = function () {
    handleargs(arguments, {}, $fh.__dest__.map);
  }

  $fh.audio = function () {
    handleargs(arguments, {}, $fh.__dest__.audio);
  }

  $fh.webview = function () {
    handleargs(arguments, {}, $fh.__dest__.webview);
  }

  $fh.ready = function () {
    handleargs(arguments, {}, $fh.__dest__.ready);
  };

  $fh.handlers = function () {
    handleargs(arguments, {
      type: 'back'
    }, $fh.__dest__.handlers);
  };

  $fh.file = function () {
    handleargs(arguments, {
      act: 'upload'
    }, $fh.__dest__.file);
  };

  $fh.push = function () {
    handleargs(arguments, {}, $fh.__dest__.push);
  };

  // new functions
  $fh.env = function () {
    handleargs(arguments, {}, function (p, s, f) {
      // flat property set - no sub objects!
      $fh.__dest__.env({}, function (destEnv) {
        destEnv.application = $fh.app_props.appid;
        destEnv.agent = navigator.userAgent || 'unknown';
        s(destEnv);
      });
    });
  }

  $fh.device = function () {
    handleargs(arguments, {}, function (p, s, f) {

    });
  }


  // defaults:
  //    {act:'get'} -> {geoip:{...}}
  //  failures: geoip_badact
  //
  $fh.geoip = function () {
    handleargs(arguments, {
      act: 'get'
    }, function (p, s, f) {
      if ('get' == p.act) {
        var data = {instance: $fh.app_props.appid, domain: $fh.cloud_props.domain}
        $fh.__ajax({
          "url": _getHostPrefix() + "act/wid/geoip/resolve",
          "type": "POST",
          "data": JSON.stringify(data),
          "success": function (res) {
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

  $fh.web = function (p, s, f) {
    handleargs(arguments, {
      method: 'GET'
    }, function (p, s, f) {
      if (!p.url) {
        f('bad_url');
      }

      if (p.is_local) {
        $fh.__ajax({
          url: p.url,
          type: "GET",
          dataType: "html",
          //xhr: $fh.xhr,
          success: function (data) {
            var res = {};
            res.status = 200;
            res.body = data;
            s(res);
          },
          error: function () {
            f();
          }
        })
      } else {
        $fh.__ajax({
          "url": _getHostPrefix() + "act/wid/web",
          "type": "POST",
          "data": JSON.stringify(p),
          "success": function (res) {
            s(res);
          }
        });
      }
    });
  };

  $fh.__webview_win = undefined;
  $fh.__dest__.webview = function (p, s, f) {
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

  $fh.__dest__.geo = function (p, s, f) {
    if (typeof navigator.geolocation != 'undefined') {
      if (!p.act || p.act == "register") {
        if ($fh.__dest__._geoWatcher) {
          f('geo_inuse', {}, p);
          return;
        }
        if (p.interval == 0) {
          navigator.geolocation.getCurrentPosition(function (position) {
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
          }, function () {
            f('error_geo', {}, p);
          })
        }
        ;
        if (p.interval > 0) {
          var internalWatcher = navigator.geolocation.watchPosition(function (position) {
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
          }, function () {
            f('error_geo', {}, p);
          }, {
            frequency: p.interval
          });
          $fh.__dest__._geoWatcher = internalWatcher;
        }
        ;
      } else if (p.act == "unregister") {
        if ($fh.__dest__._geoWatcher) {
          navigator.geolocation.clearWatch($fh.__dest__._geoWatcher);
          $fh.__dest__._geoWatcher = undefined;
        }
        ;
        s();
      } else {
        f('geo_badact', {}, p);
      }
    } else {
      f('geo_nosupport', {}, p);
    }
  };

  $fh.__dest__.acc = function (p, s, f) {
    s({ x: (Math.random() * 4) - 2, y: (Math.random() * 4) - 2, z: (Math.random() * 4) - 2, when: new Date().getTime() });
  }

  root.$fh = $fh;

})(this);
/**
 * FeedHenry License
 */

//if (typeof window =="undefined"){
//    var window={};
//}
//this is a partial js file which defines the start of appform SDK closure
(function(_scope){
    //start module

var appForm = function (module) {
    module.init = init;
    function init(params, cb) {
      var def = { 'updateForms': true };
      if (typeof cb == 'undefined') {
        cb = params;
      } else {
        for (var key in params) {
          def[key] = params[key];
        }
      }


      //init config module
      var config = def.config || {};
      appForm.config = appForm.models.config;
      appForm.config.init(config, function (err) {
        if(err) $fh.forms.log.e("Form config loading error: ", err);
        //Loading the current state of the uploadManager for any upload tasks that are still in progress.
        appForm.models.uploadManager.loadLocal(function (err) {
          $fh.forms.log.d("Upload Manager loaded from memory.");
          if (err) $fh.forms.log.e("Error loading upload manager from memory ", err);
          //init forms module
          $fh.forms.log.l("Refreshing Theme.");
          appForm.models.theme.refresh(true, function (err) {
            if (err) $fh.forms.log.e("Error refreshing theme ", err);
            if (def.updateForms === true) {
              $fh.forms.log.l("Refreshing Forms.");
              appForm.models.forms.refresh(true, function (err) {
                if (err)
                  $fh.forms.log.e(err);
                appForm.models.log.loadLocal(function(){
                  cb();
                });
              });
            } else {
              cb();
            }
          });
        });
      });
    }
    return module;
  }(appForm || {});
appForm.utils = function(module) {
  module.extend = extend;
  module.localId = localId;
  module.md5 = md5;
  module.getTime = getTime;
  module.send=send;
  module.isPhoneGap = isPhoneGap;

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

  function extend(child, parent) {

    if (parent.constructor && parent.constructor == Function) {
      for (var mkey in parent.prototype) {
        child.prototype[mkey] = parent.prototype[mkey];
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
      return _id + '_' + _type + '_' + ts;
    } else if (_id) {
      return _id + '_' + ts;
    } else if (_type) {
      return _type + '_' + ts;
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
    if (typeof $fh != 'undefined' && $fh.hash) {
      $fh.hash({
        algorithm: 'MD5',
        text: str
      }, function(result) {
        if (result && result.hashvalue) {
          cb(null, result.hashvalue);
        } else {
          cb('Crypto failed.');
        }
      });
    } else {
      cb('Crypto not found');
    }
  }

  function send(params,cb){
    $fh.forms.log.d("Sending mail: ", params);
    $fh.send(params,function(){
      cb(null);
    },function(msg){
      cb(msg);
    });
  }
  return module;
}(appForm.utils || {});

appForm.utils = function (module) {
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
  var _requestFileSystem = function () {
    console.error("No file system available");
  };
  //placeholder
  var PERSISTENT = 1;
  //placeholder
  function isFileSystemAvailable() {
    return fileSystemAvailable;
  }
  //convert a file object to base64 encoded.
  function fileToBase64(file, cb) {
    if (!file instanceof File) {
      throw 'Only file object can be used for converting';
    }
    var fileReader = new FileReader();
    fileReader.onloadend = function (evt) {
      var text = evt.target.result;
      return cb(null, text);
    };
    fileReader.readAsDataURL(file);
  }

  function _createBlobOrString(contentstr) {
    var retVal;
    if (appForm.utils.isPhoneGap()) {  // phonegap filewriter works with strings, later versions also ork with binary arrays, and if passed a blob will just convert to binary array anyway
      retVal = contentstr;
    } else {
      var targetContentType = 'text/plain';
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
    if (typeof content == 'object') {
      if (content instanceof File) {
        //File object
        saveObj = content;
        size = saveObj.size;
      } else if (content instanceof Blob) {
        saveObj = content;
        size = saveObj.size;
      } else {
        //JSON object
        var contentstr = JSON.stringify(content);
        saveObj = _createBlobOrString(contentstr);
        size = saveObj.size || saveObj.length;
      }
    } else if (typeof content == 'string') {
      saveObj = _createBlobOrString(content);
      size = saveObj.size || saveObj.length;
    }

    _getFileEntry(fileName, size, { create: true }, function (err, fileEntry) {
      if (err) {
        console.error(err);
        cb(err);
      } else {
        fileEntry.createWriter(function (writer) {
          function _onFinished(evt) {
            return cb(null, evt);
          }
          function _onTruncated() {
            writer.onwriteend = _onFinished;
            writer.write(saveObj);  //write method can take a blob or file object according to html5 standard.
          }
          writer.onwriteend = _onTruncated;
          //truncate the file first.
          writer.truncate(0);
        }, function (e) {
          cb('Failed to create file write:' + e);
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
    _getFileEntry(fileName, 0, {}, function (err, fileEntry) {
      if (err) {
        if (!(err.name == 'NotFoundError' || err.code == 1)) {
          return cb(err);
        } else {
          return cb(null, null);
        }
      }
      fileEntry.remove(function () {
        cb(null, null);
      }, function (e) {
        // console.error(e);
        cb('Failed to remove file' + e);
      });
    });
  }
  /**
     * Read a file as text
     * @param  {[type]}   fileName [description]
     * @param  {Function} cb       (err,text)
     * @return {[type]}            [description]
     */
  function readAsText(fileName, cb) {
    _getFile(fileName, function (err, file) {
      if (err) {
        cb(err);
      } else {
        var reader = new FileReader();
        reader.onloadend = function (evt) {
          var text = evt.target.result;
          // Check for URLencoded
          // PG 2.2 bug in readAsText()
          try {
            text = decodeURIComponent(text);
          } catch (e) {
          }
          // console.log('load: ' + key + '. Filename: ' + hash + " value:" + evt.target.result);
          return cb(null, text);
        };
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
    _getFile(fileName, function (err, file) {
      if (err) {
        return cb(err);
      }
      var reader = new FileReader();
      reader.onloadend = function (evt) {
        var text = evt.target.result;
        return cb(null, text);
      };
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
    _getFile(fileName, function (err, file) {
      if (err) {
        return cb(err);
      } else {
        var type = file.type;
        var reader = new FileReader();
        reader.onloadend = function (evt) {
          var arrayBuffer = evt.target.result;
          var blob = new Blob([arrayBuffer], { 'type': type });
          cb(null, blob);
        };
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
    _getFileEntry(fileName, 0, {}, function (err, fe) {
      if (err) {
        return cb(err);
      }
      fe.file(function (file) {
        cb(null, file);
      }, function (e) {
        console.error('Failed to get file:' + e);
        cb(e);
      });
    });
  }
  function _getFileEntry(fileName, size, params, cb) {
    _checkEnv();
    _requestFileSystem(PERSISTENT, size, function gotFS(fileSystem) {
      fileSystem.root.getFile(fileName, params, function gotFileEntry(fileEntry) {
        cb(null, fileEntry);
      }, function (err) {
        if (err.name == 'QuotaExceededError' || err.code == 10) {
          //this happens only on browser. request for 1 gb storage
          //TODO configurable from cloud
          var bigSize = 1024 * 1024 * 1024;
          _requestQuote(bigSize, function (err, bigSize) {
            _getFileEntry(fileName, size, params, cb);
          });
        } else {
          console.error('Failed to get file entry:' + err.message);
          cb(err);
        }
      });
    }, function () {
      cb('Failed to requestFileSystem');
    });
  }
  function _requestQuote(size, cb) {
    if (navigator.webkitPersistentStorage) {
      //webkit browser
      navigator.webkitPersistentStorage.requestQuota(size, function (size) {
        cb(null, size);
      }, function (err) {
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
      fileSystemAvailable = false;  // console.error("No filesystem available. Fallback use $fh.data for storage");
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
}(appForm.utils || {});

appForm.utils = function (module) {
  module.takePhoto = takePhoto;
  module.isPhoneGapCamAvailable = isPhoneGapAvailable;
  module.isHtml5CamAvailable = isHtml5CamAvailable;
  module.initHtml5Camera = initHtml5Camera;
  module.cancelHtml5Camera = cancelHtml5Camera;
  var isPhoneGap = false;
  var isHtml5 = false;
  var video = null;
  var canvas = null;
  var ctx = null;
  var localMediaStream = null;
  function isHtml5CamAvailable() {
    checkEnv();
    return isHtml5;
  }
  function isPhoneGapAvailable() {
    checkEnv();
    return isPhoneGap;
  }
  function initHtml5Camera(params, cb) {
    checkEnv();
    _html5Camera(params, cb);
  }
  function cancelHtml5Camera() {
    if (localMediaStream) {
      localMediaStream.stop();
      localMediaStream = null;
    }
  }
  function takePhoto(params, cb) {
    $fh.forms.log.d("Taking photo ", params, isPhoneGap);
    //use configuration
    var width =  params.targetWidth ? params.targetWidth : $fh.forms.config.get("targetWidth", 640);
    var height = params.targetHeight ? params.targetHeight : $fh.forms.config.get("targetHeight", 480);
    var quality= params.quality ? params.quality : $fh.forms.config.get("quality", 50);

    if ("undefined" === typeof params.sourceType) {
      params.sourceType = Camera.PictureSourceType.CAMERA;
    }

    if (isPhoneGap) {
      navigator.camera.getPicture(_phoneGapSuccess(cb), cb, {
        quality: quality,
        targetWidth: width,
        targetHeight: height,
        sourceType: params.sourceType,
        saveToPhotoAlbum: false,
        destinationType: Camera.DestinationType.DATA_URL,
        encodingType: Camera.EncodingType.PNG
      });
    } else if (isHtml5) {
      snapshot(params, cb);
    } else {
      cb('Your device does not support camera.');
    }
  }
  function _phoneGapSuccess(cb) {
    return function (imageData) {
      var base64Img = 'data:image/png;base64,' + imageData;
      cb(null, base64Img);
    };
  }
  function _html5Camera(params, cb) {
    $fh.forms.log.d("Taking photo _html5Camera", params, isPhoneGap);
    var width = params.targetWidth || $fh.forms.config.get("targetWidth");
    var height = params.targetHeight || $fh.forms.config.get("targetHeight");
    video.width = width;
    video.height = height;
    canvas.width = width;
    canvas.height = height;
    if (!localMediaStream) {
      navigator.getUserMedia({ video: true }, function (stream) {
        video.src = window.URL.createObjectURL(stream);
        localMediaStream = stream;
        cb(null, video);
      }, cb);
    } else {
      console.error('Media device was not released.');
      cb('Media device occupied.');
    }
  }
  function checkEnv() {
    $fh.forms.log.d("Checking env");
    if (navigator.camera && navigator.camera.getPicture) {
      // PhoneGap
      isPhoneGap = true;
    } else if (_browserWebSupport()) {
      isHtml5 = true;
      video = document.createElement('video');
      video.autoplay = 'autoplay';
      canvas = document.createElement('canvas');
      ctx = canvas.getContext('2d');
    } else {
      console.error('Cannot detect usable media API. Camera will not run properly on this device.');
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

  function snapshot(params, cb) {
    $fh.forms.log.d("Snapshot ", params);
    if (localMediaStream) {
      ctx.drawImage(video, 0, 0, params.width, params.height);
      // "image/webp" works in Chrome.
      // Other browsers will fall back to image/png.
      var base64 = canvas.toDataURL('image/png');
      cancelHtml5Camera();
      cb(null, base64);
    } else {
      $fh.forms.log.e('Media resource is not available');
      cb('Resource not available');
    }
  }
  return module;
}(appForm.utils || {});

appForm.web = function (module) {

  module.uploadFile = function(url, fileProps, cb){
    $fh.forms.log.d("uploadFile ", url, fileProps);
    var filePath = fileProps.fullPath;

    var success = function (r) {
      $fh.forms.log.d("upload to url ", url, " sucessful");
      r.response = r.response || {};
      if(typeof r.response == "string"){
        r.response = JSON.parse(r.response);
      }
      cb(null, r.response);
    };

    var fail = function (error) {
      $fh.forms.log.e("An error uploading a file has occurred: Code = " + error.code);
      $fh.forms.log.d("upload error source " + error.source);
      $fh.forms.log.d("upload error target " + error.target);
      cb(error);
    };

    var options = new FileUploadOptions();
    options.fileName = fileProps.name;
    options.mimeType = fileProps.contentType ? fileProps.contentType : "application/octet-stream";
    options.httpMethod = "https";
    options.chunkedMode = true;
    options.fileKey = "file";

    //http://grandiz.com/phonegap-development/phonegap-file-transfer-error-code-3-solved/
    options.headers = {
      "Connection": "close"
    };

    $fh.forms.log.d("Beginning file upload ",url, options);
    var ft = new FileTransfer();
    ft.upload(filePath, encodeURI(url), success, fail, options);
  };

  return module;
}(appForm.web || {});
appForm.web.ajax = function (module) {
  module = typeof $fh != 'undefined' && $fh.__ajax ? $fh.__ajax : _myAjax;
  module.get = get;
  module.post = post;
  var _ajax = module;
  function _myAjax() {
  }
  function get(url, cb) {
    $fh.forms.log.d("Ajax get ", url);
    _ajax({
      'url': url,
      'type': 'GET',
      'dataType': 'json',
      'success': function (data, text) {
        $fh.forms.log.d("Ajax get", url, "Success");
        cb(null, data);
      },
      'error': function (xhr, status, err) {
        $fh.forms.log.e("Ajax get", url, "Fail", xhr, status, err);
        cb(xhr);
      }
    });
  }
  function post(url, body, cb) {
    $fh.forms.log.d("Ajax post ", url, body);
    var file = false;
    var formData;
    if (typeof body == 'object') {
      if (body instanceof File) {
        file = true;
        formData = new FormData();
        var name = body.name;
        formData.append(name, body);
        body = formData;
      } else {
        body = JSON.stringify(body);
      }
    }
    var param = {
        'url': url,
        'type': 'POST',
        'data': body,
        'dataType': 'json',
        'success': function (data, text) {
          $fh.forms.log.d("Ajax post ", url, " Success");
          cb(null, data);
        },
        'error': function (xhr, status, err) {
          $fh.forms.log.e("Ajax post ", url, " Fail ", xhr, status, err);
          cb(xhr);
        }
      };
    if (file === false) {
      param.contentType = 'application/json';
    }
    _ajax(param);
  }
  return module;
}(appForm.web.ajax || {});
appForm.stores = function (module) {
  module.Store = Store;
  function Store(name) {
    this.name = name;
  }
  Store.prototype.create = function (model, cb) {
    throw 'Create not implemented:' + this.name;
  };
  /**
     * Read a model data from store
     * @param  {[type]} model          [description]
     * @param  {[type]} cb(error, data);
     */
  Store.prototype.read = function (model, cb) {
    throw 'Read not implemented:' + this.name;
  };
  Store.prototype.update = function (model, cb) {
    throw 'Update not implemented:' + this.name;
  };
  Store.prototype["delete"] = function (model, cb) {
    throw 'Delete not implemented:' + this.name;
  };
  Store.prototype.upsert = function (model, cb) {
    throw 'Upsert not implemented:' + this.name;
  };
  return module;
}(appForm.stores || {});
/**
 * Local storage stores a model's json definition persistently.
 */
appForm.stores = function(module) {
  //implementation
  var utils = appForm.utils;
  var fileSystem = utils.fileSystem;
  var _fileSystemAvailable = function() {};
  //placeholder
  function LocalStorage() {
    appForm.stores.Store.call(this, 'LocalStorage');
  }
  appForm.utils.extend(LocalStorage, appForm.stores.Store);
  //store a model to local storage
  LocalStorage.prototype.create = function(model, cb) {
    var key = utils.localId(model);
    model.setLocalId(key);
    this.update(model, cb);
  };
  //read a model from local storage
  LocalStorage.prototype.read = function(model, cb) {
    if (model.get("_type") == "offlineTest") {
      cb(null, {});
    } else {
      var key = model.getLocalId();
      if (key != null) {
        _fhData({
          'act': 'load',
          'key': key.toString()
        }, cb, cb);
      } else {
        //model does not exist in local storage if key is null.
        cb(null, null);
      }
    }
  };
  //update a model
  LocalStorage.prototype.update = function(model, cb) {
    var key = model.getLocalId();
    var data = model.getProps();
    var dataStr = JSON.stringify(data);
    _fhData({
      'act': 'save',
      'key': key.toString(),
      'val': dataStr
    }, cb, cb);
  };
  //delete a model
  LocalStorage.prototype["delete"] = function(model, cb) {
    var key = model.getLocalId();
    _fhData({
      'act': 'remove',
      'key': key.toString()
    }, cb, cb);
  };
  LocalStorage.prototype.upsert = function(model, cb) {
    var key = model.getLocalId();
    if (key == null) {
      this.create(model, cb);
    } else {
      this.update(model, cb);
    }
  };
  LocalStorage.prototype.switchFileSystem = function(isOn) {
    _fileSystemAvailable = function() {
      return isOn;
    };
  };
  LocalStorage.prototype.defaultStorage = function() {
    _fileSystemAvailable = function() {
      return fileSystem.isFileSystemAvailable();
    };
  };
  _fileSystemAvailable = function() {
    return fileSystem.isFileSystemAvailable();
  };
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
    //allow for no $fh api in studio
    if(! $fh || ! $fh.data) return success();

    $fh.data(options, function (res) {
      if (typeof res == 'undefined') {
        res = {
          key: options.key,
          val: options.val
        };
      }
      //unify the interfaces
      if (options.act.toLowerCase() == 'remove') {
        return success(null, null);
      }
      success(null, res.val ? res.val : null);
    }, failure);
  }
  //use file system
  function _fhFileData(options, success, failure) {
    function fail(msg) {
      if (typeof failure !== 'undefined') {
        return failure(msg, {});
      } else {}
    }

    function filenameForKey(key, cb) {
      var appid = appForm.config.get("appId","unknownAppId");
      key = key + appid;
      utils.md5(key, function(err, hash) {
        if (err) {
          hash = key;
        }
        var filename = hash + '.txt';
        if (typeof navigator.externalstorage !== 'undefined') {
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
          });
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
        fileSystem.remove(hash, function(err) {
          if (err) {
            if (err.name == 'NotFoundError' || err.code == 1) {
              //same respons of $fh.data if key not found.
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
            if (err.name == 'NotFoundError' || err.code == 1) {
              //same respons of $fh.data if key not found.
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
        return failure('Action [' + options.act + '] is not defined', {});
      }
    }
  }
  module.localStorage = new LocalStorage();
  return module;
}(appForm.stores || {});
appForm.stores = function(module) {
  var Store = appForm.stores.Store;
  module.mBaaS = new MBaaS();

  function MBaaS() {
    Store.call(this, 'MBaaS');
  }
  appForm.utils.extend(MBaaS, Store);
  MBaaS.prototype.checkStudio = function() {
    return appForm.config.get("studioMode");
  };
  MBaaS.prototype.create = function(model, cb) {
    if (this.checkStudio()) {
      cb("Studio mode not supported");
    } else {
      var url = _getUrl(model);
      if((model.get("_type") == "fileSubmission" || model.get("_type") == "base64fileSubmission") && (typeof window.Phonegap !== "undefined" || typeof window.cordova !== "undefined")){
        appForm.web.uploadFile(url, model.getProps(), cb);
      } else {
        appForm.web.ajax.post(url, model.getProps(), cb);
      }
    }
  };
  MBaaS.prototype.read = function(model, cb) {
    if (this.checkStudio()) {
      cb("Studio mode not supported");
    } else {
      if (model.get("_type") == "offlineTest") {
        cb("offlinetest. ignore");
      } else {
        var url = _getUrl(model);
        appForm.web.ajax.get(url, cb);
      }
    }
  };
  MBaaS.prototype.update = function(model, cb) {};
  MBaaS.prototype["delete"] = function(model, cb) {};
  //@Deprecated use create instead
  MBaaS.prototype.completeSubmission = function(submissionToComplete, cb) {
    var url = _getUrl(submissionToComplete);
    appForm.web.ajax.post(url, {}, cb);
  };
  MBaaS.prototype.submissionStatus = function(submission, cb) {
    var url = _getUrl(submission);
    appForm.web.ajax.get(url, cb);
  };

  function _getUrl(model) {
    $fh.forms.log.d("_getUrl ", model);
    var type = model.get('_type');
    var host = appForm.config.get('cloudHost');
    var mBaaSBaseUrl = appForm.config.get('mbaasBaseUrl');
    var formUrls = appForm.config.get('formUrls');
    var relativeUrl = "";
    if (formUrls[type]) {
      relativeUrl = formUrls[type];
    } else {
      $fh.forms.log.e('type not found to get url:' + type);
    }
    var url = host + mBaaSBaseUrl + relativeUrl;
    var props = {};
    props.appId = appForm.config.get('appId');
    //Theme and forms do not require any parameters that are not in _fh
    switch (type) {
      case 'config':
        props.appid = model.get("appId");
        props.deviceId = model.get("deviceId");
        break;
      case 'form':
        props.formId = model.get('_id');
        break;
      case 'formSubmission':
        props.formId = model.getFormId();
        break;
      case 'fileSubmission':
        props.submissionId = model.getSubmissionId();
        props.hashName = model.getHashName();
        props.fieldId = model.getFieldId();
        break;
      case 'base64fileSubmission':
        props.submissionId = model.getSubmissionId();
        props.hashName = model.getHashName();
        props.fieldId = model.getFieldId();
        break;
      case 'submissionStatus':
        props.submissionId = model.get('submissionId');
        break;
      case 'completeSubmission':
        props.submissionId = model.get('submissionId');
        break;
      case 'offlineTest':
        return "http://127.0.0.1:8453";
    }
    for (var key in props) {
      url = url.replace(':' + key, props[key]);
    }
    return url;
  }
  return module;
}(appForm.stores || {});
appForm.stores = function (module) {
  var Store = appForm.stores.Store;
  //DataAgent is read only store
  module.DataAgent = DataAgent;
  module.dataAgent = new DataAgent(appForm.stores.mBaaS, appForm.stores.localStorage);
  //default data agent uses mbaas as remote store, localstorage as local store
  function DataAgent(remoteStore, localStore) {
    Store.call(this, 'DataAgent');
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
  DataAgent.prototype.read = function (model, cb) {
    $fh.forms.log.d("DataAgent read ", model);
    var that = this;
    this.localStore.read(model, function (err, locRes) {
      if (err || !locRes) {
        //local loading failed
        if (err) {
          $fh.forms.log.e("Error reading model from localStore ", model, err);
        }
        that.refreshRead(model, cb);
      } else {
        //local loading succeed
        cb(null, locRes, false);
      }
    });
  };
  /**
     * Read from remote store and store the content locally.
     * @param  {[type]}   model [description]
     * @param  {Function} cb    [description]
     * @return {[type]}         [description]
     */
  DataAgent.prototype.refreshRead = function (model, cb) {
    $fh.forms.log.d("DataAgent refreshRead ", model);
    var that = this;
    this.remoteStore.read(model, function (err, res) {
      if (err) {
        $fh.forms.log.e("Error reading model from remoteStore ", model, err);
        cb(err);
      } else {
        $fh.forms.log.d("Model refresh successfull from remoteStore ", model, res);
        //update model from remote response
        model.fromJSON(res);
        //update local storage for the model
        that.localStore.upsert(model, function () {
          var args = Array.prototype.slice.call(arguments, 0);
          args.push(true);
          cb.apply({}, args);
        });
      }
    });
  };

  /**
   * Attempt to run refresh read first, if failed, run read.
   * @param  {[type]}   model [description]
   * @param  {Function} cb    [description]
   * @return {[type]}         [description]
   */
  DataAgent.prototype.attemptRead=function(model,cb){
    $fh.forms.log.d("DataAgent attemptRead ", model);
    var self=this;
    self.refreshRead(model,function(err){
      if (err){
        self.read(model,cb);
      }else{
        cb.apply({},arguments);
      }
    });
  };
  return module;
}(appForm.stores || {});
appForm.models = function (module) {
  function Model(opt) {
    this.props = {
      '_id': null,
      '_type': null,
      '_ludid': null
    };
    this.utils = appForm.utils;
    this.events = {};
    if (typeof opt != 'undefined') {
      for (var key in opt) {
        this.props[key] = opt[key];
      }
    }
    this.touch();
  }
  Model.prototype.on = function (name, func) {
    if (!this.events[name]) {
      this.events[name] = [];
    }
    if (this.events[name].indexOf(func) < 0) {
      this.events[name].push(func);
    }
  };
  Model.prototype.off = function (name, func) {
    if (this.events[name]) {
      if (this.events[name].indexOf(func) >= 0) {
        this.events[name].splice(this.events[name].indexOf(func), 1);
      }
    }
  };

  Model.prototype.clearEvents = function(){
    this.events = {};
  };
  Model.prototype.emit = function () {
    var args = Array.prototype.slice.call(arguments, 0);
    var e = args.shift();
    var funcs = this.events[e];
    if (funcs && funcs.length > 0) {
      for (var i = 0; i < funcs.length; i++) {
        var func = funcs[i];
        func.apply(this, args);
      }
    }
  };
  Model.prototype.getProps = function () {
    return this.props;
  };
  Model.prototype.get = function (key, def) {
    return typeof this.props[key] == 'undefined' ? def : this.props[key];
  };
  Model.prototype.set = function (key, val) {
    this.props[key] = val;
  };
  Model.prototype.setLocalId = function (localId) {
    this.set('_ludid', localId);
  };
  Model.prototype.getLocalId = function () {
    return this.get('_ludid');
  };
  Model.prototype.fromJSON = function (json) {
    if (typeof json == 'string') {
      this.fromJSONStr(json);
    } else {
      for (var key in json) {
        this.set(key, json[key]);
      }
    }
    this.touch();
  };
  Model.prototype.fromJSONStr = function (jsonStr) {
    try {
      var json = JSON.parse(jsonStr);
      this.fromJSON(json);
    } catch (e) {
      console.error(e);
    }
  };

  Model.prototype.touch = function () {
    this.set('_localLastUpdate', appForm.utils.getTime());
  };
  Model.prototype.getLocalUpdateTimeStamp = function () {
    return this.get('_localLastUpdate');
  };
  Model.prototype.genLocalId = function () {
    return appForm.utils.localId(this);
  };
  /**
     * retrieve model from local or remote with data agent store.
     * @param {boolean} fromRemote optional true--force from remote
     * @param  {Function} cb (err,currentModel)
     * @return {[type]}      [description]
     */
  Model.prototype.refresh = function (fromRemote, cb) {
    var dataAgent = this.getDataAgent();
    var that = this;
    if (typeof cb == 'undefined') {
      cb = fromRemote;
      fromRemote = false;
    }
    if (fromRemote) {
      dataAgent.attemptRead(this, _handler);
    } else {
      dataAgent.read(this, _handler);
    }
    function _handler(err, res) {
      if (!err && res) {
        that.fromJSON(res);
        cb(null, that);
      } else {
        cb(err, that);
      }
    }
  };
  Model.prototype.attemptRefresh=function(cb){
    var dataAgent = this.getDataAgent();
    var self=this;
    dataAgent.attemptRead(this,function(err,res){
      if (!err && res){
        self.fromJSON(res);
        cb(null,self);
      }else{
        cb(err,self);
      }
    });
  };
  /**
     * Retrieve model from local storage store
     * @param  {Function} cb (err, curModel)
     * @return {[type]}      [description]
     */
  Model.prototype.loadLocal = function (cb) {
    var localStorage = appForm.stores.localStorage;
    var that = this;
    localStorage.read(this, function (err, res) {
      if (err) {
        cb(err);
      } else {
        if (res) {
          that.fromJSON(res);
        }
        cb(err, that);
      }
    });
  };
  /**
     * save current model to local storage store
     * @param  {Function} cb [description]
     * @return {[type]}      [description]
     */
  Model.prototype.saveLocal = function (cb) {
    var localStorage = appForm.stores.localStorage;
    localStorage.upsert(this, cb);
  };
  /**
     * Remove current model from local storage store
     * @param  {Function} cb [description]
     * @return {[type]}      [description]
     */
  Model.prototype.clearLocal = function (cb) {
    var localStorage = appForm.stores.localStorage;
    localStorage["delete"](this, cb);
  };
  Model.prototype.getDataAgent = function () {
    if (!this.dataAgent) {
      this.setDataAgent(appForm.stores.dataAgent);
    }
    return this.dataAgent;
  };
  Model.prototype.setDataAgent = function (dataAgent) {
    this.dataAgent = dataAgent;
  };
  module.Model = Model;
  return module;
}(appForm.models || {});
appForm.models = function(module) {
  var Model = appForm.models.Model;

  function Config() {
    Model.call(this, {
      '_type': 'config',
      "_ludid": "config"
    });

  }
  appForm.utils.extend(Config, Model);
  //call in appForm.init
  Config.prototype.init = function(config, cb) {
    if (config.studioMode) { //running in studio
      this.set("studioMode", true);
      this.fromJSON(config);
      cb();
    } else {
      //load hard coded static config first
      this.staticConfig();
      //attempt load config from mbaas then local storage.
      this.refresh(true, cb);
    }
  };
  Config.prototype.refresh = function (fromRemote, cb) {
    var dataAgent = this.getDataAgent();
    var self = this;
    if (typeof cb == 'undefined') {
      cb = fromRemote;
      fromRemote = false;
    }

    function _handler(err, res) {
      var configObj = {};

      if (!err && res) {
        if(typeof(res) === "string"){
          try{
            configObj = JSON.parse(res);
          } catch(error){
            $fh.forms.log.e("Invalid json config defintion from remote", error);
            configObj = {};
            return cb(error, null);
          }
        } else {
          configObj = res;
        }

        self.set("defaultConfigValues", configObj);
        self.saveLocal(function(err, updatedConfigJSON){
          cb(err, self);
        });
      } else {
        cb(err, self);
      }
    }
    self.loadLocal(function(err, localConfig){
      if(err) $fh.forms.log.e("Config loadLocal ", err);

      dataAgent.remoteStore.read(self, _handler);
    });
  };
  Config.prototype.staticConfig = function(config) {
    var self = this;
    var defaultConfig = {"defaultConfigValues": {}, "userConfigValues": {}};
    //If user already has set values, don't want to overwrite them
    if(self.get("userConfigValues")){
      defaultConfig.userConfigValues = self.get("userConfigValues");
    }
    var appid = $fh && $fh.app_props ? $fh.app_props.appid : config.appid;
    var mode = $fh && $fh.app_props ? $fh.app_props.mode : 'dev';
    self.set('appId', appid);
    self.set('env', mode);

    if($fh && $fh._getDeviceId){
      self.set('deviceId', $fh._getDeviceId());
    } else {
      self.set('deviceId', "notset");
    }


    self._initMBaaS();
    //Setting default retry attempts if not set in the config
    if (!config) {
      config = {};
    }

    //config_admin_user can not be set by the user.
    if(config.config_admin_user){
      delete config.config_admin_user;
    }

    defaultConfig.defaultConfigValues = config;
    var staticConfig = {
      "sent_save_min": 5,
      "sent_save_max": 1000,
      "targetWidth": 640,
      "targetHeight": 480,
      "quality": 50,
      "debug_mode": false,
      "logger": false,
      "max_retries": 3,
      "timeout": 7,
      "log_line_limit": 5000,
      "log_email": "test@example.com",
      "log_level": 3,
      "log_levels": ["error", "warning", "log", "debug"],
      "config_admin_user": true
    };

    for(var key in staticConfig){
      defaultConfig.defaultConfigValues[key] = staticConfig[key];
    }

    self.fromJSON(defaultConfig);
  };
  Config.prototype._initMBaaS = function() {
    var cloud_props = $fh.cloud_props;
    var app_props = $fh.app_props;
    var cloudUrl;
    var mode = 'dev';
    if (app_props) {
      cloudUrl = app_props.host;
      mode = app_props.mode ? app_props.mode : 'dev';
    }
    if (cloud_props && cloud_props.hosts) {
      cloudUrl = cloud_props.hosts.url;
    }
    this.set('cloudHost', cloudUrl);
    this.set('mbaasBaseUrl', '/mbaas');
    var appId = this.get('appId');
    //ebaas url definition https://docs.google.com/a/feedhenry.com/document/d/1_bd4kZMm7q6C1htNJBTSA2X4zi1EKx0hp_4aiJ-N5Zg/edit#
    this.set('formUrls', {
      'forms': '/forms/:appId',
      'form': '/forms/:appId/:formId',
      'theme': '/forms/:appId/theme',
      'formSubmission': '/forms/:appId/:formId/submitFormData',
      'fileSubmission': '/forms/:appId/:submissionId/:fieldId/:hashName/submitFormFile',
      'base64fileSubmission': '/forms/:appId/:submissionId/:fieldId/:hashName/submitFormFileBase64',
      'submissionStatus': '/forms/:appId/:submissionId/status',
      'completeSubmission': '/forms/:appId/:submissionId/completeSubmission',
      "config": '/forms/:appid/config/:deviceId'
    });
  };

  module.config = new Config();
  return module;
}(appForm.models || {});
appForm.models = function (module) {
  var Model = appForm.models.Model;
  function Forms() {
    Model.call(this, {
      '_type': 'forms',
      '_ludid': 'forms_list',
      'loaded': false
    });
  }
  appForm.utils.extend(Forms, Model);

  Forms.prototype.isFormUpdated = function (formModel) {
    var id = formModel.get('_id');
    var formLastUpdate = formModel.getLastUpdate();
    var formMeta = this.getFormMetaById(id);
    if (formMeta) {
      return formLastUpdate != formMeta.lastUpdatedTimestamp;
    } else {
      //could have been deleted. leave it for now
      return false;
    }
  };
  Forms.prototype.setLocalId = function(){
    $fh.forms.log.e("Forms setLocalId. Not Permitted for Forms.");
  };
  Forms.prototype.getFormMetaById = function (formId) {
    $fh.forms.log.d("Forms getFormMetaById ", formId);
    var forms = this.get('forms');
    for (var i = 0; i < forms.length; i++) {
      var form = forms[i];
      if (form._id == formId) {
        return form;
      }
    }
    $fh.forms.log.e("Forms getFormMetaById: No form found for id: ", formId);
    return null;
  };
  Forms.prototype.size = function () {
    return this.get('forms').length;
  };
  Forms.prototype.getFormsList = function () {
    return this.get('forms');
  };
  Forms.prototype.getFormIdByIndex = function (index) {
    $fh.forms.log.d("Forms getFormIdByIndex: ", index);
    return this.getFormsList()[index]._id;
  };
  module.forms = new Forms();
  return module;
}(appForm.models || {});
appForm.models = function (module) {
  var Model = appForm.models.Model;
  module.Form = Form;
  var _forms = {};
  //cache of all forms. single instance for 1 formid
  /**
     * [Form description]
     * @param {[type]}   params  {formId: string, fromRemote:boolean(false), rawMode:false, rawData:JSON}
     * @param {Function} cb         [description]
     */
  function Form(params, cb) {
    var that = this;
    var rawMode = params.rawMode || false;
    var rawData = params.rawData || null;
    var formId = params.formId;
    var fromRemote = params.fromRemote;
    $fh.forms.log.d("Form: ", rawMode, rawData, formId, fromRemote);

    if (typeof fromRemote == 'function' || typeof cb == 'function') {
      if (typeof fromRemote == 'function') {
        cb = fromRemote;
        fromRemote = false;
      }
    } else {
      return $fh.forms.log.e('a callback function is required for initialising form data. new Form (formId, [isFromRemote], cb)');
    }

    if (!formId) {
      return cb('Cannot initialise a form object without an id. id:' + formId, null);
    }

    Model.call(this, {
      '_id': formId,
      '_type': 'form'
    });


    function loadFromLocal(){
      $fh.forms.log.d("Form: loadFromLocal ", rawMode, rawData, formId, fromRemote);
      if (_forms[formId]) {
        //found form object in mem return it.
        cb(null, _forms[formId]);
        return _forms[formId];
      }

      function processRawFormJSON(){
        that.fromJSON(rawData);
        that.initialise();

        _forms[that.getFormId()] = that;
        return cb(null, that);
      }

      if(rawData){
        return processRawFormJSON();
      }
    }


    function loadFromRemote(){
      $fh.forms.log.d("Form: loadFromRemote", rawMode, rawData, formId, fromRemote);
      function checkForUpdate(form){
        $fh.forms.log.d("Form: checkForUpdate", rawMode, rawData, formId, fromRemote);
        form.refresh(false, function (err, obj) {
          if (appForm.models.forms.isFormUpdated(form)) {
            form.refresh(true, function (err, obj1) {
              if(err){
                return cb(err, null);
              }
              form.initialise();

              _forms[formId] = obj1;
              return cb(err, obj1);
            });
          } else {
            form.initialise();
            _forms[formId] = obj;
            cb(err, obj);
          }
        });
      }

      if (_forms[formId]) {
        $fh.forms.log.d("Form: loaded from cache", rawMode, rawData, formId, fromRemote);
        //found form object in mem return it.
        if(!appForm.models.forms.isFormUpdated(_forms[formId])){
          cb(null, _forms[formId]);
          return _forms[formId];
        }
      }

      checkForUpdate(that);
    }

    //Raw mode is for avoiding interaction with the mbaas
    if(rawMode === true){
      loadFromLocal();
    } else {
      loadFromRemote();
    }
  }
  appForm.utils.extend(Form, Model);
  Form.prototype.getLastUpdate = function () {
    $fh.forms.log.d("Form: getLastUpdate");
    return this.get('lastUpdatedTimestamp');
  };
  /**
     * Initiliase form json to objects
     * @return {[type]} [description]
     */
  Form.prototype.initialise = function () {
    this.initialisePage();
    this.initialiseFields();
    this.initialiseRules();
  };
  Form.prototype.initialiseFields = function () {
    $fh.forms.log.d("Form: initialiseFields");
    var fieldsRef = this.getFieldRef();
    this.fields = {};
    for (var fieldId in fieldsRef) {
      var fieldRef = fieldsRef[fieldId];
      var pageIndex = fieldRef.page;
      var fieldIndex = fieldRef.field;
      if (pageIndex === undefined || fieldIndex === undefined) {
        throw 'Corruptted field reference';
      }
      var fieldDef = this.getFieldDefByIndex(pageIndex, fieldIndex);
      if (fieldDef) {
        this.fields[fieldId] = new appForm.models.Field(fieldDef, this);
      } else {
        throw 'Field def is not found.';
      }
    }
  };
  Form.prototype.initialiseRules = function () {
    $fh.forms.log.d("Form: initialiseRules");
    this.rules = {};
    var pageRules = this.getPageRules();
    var fieldRules = this.getFieldRules();
    var constructors = [];
    for (var i = 0; i<pageRules.length ; i++) {
      var pageRule = pageRules[i];
      constructors.push({
        'type': 'page',
        'definition': pageRule
      });
    }
    for (i = 0; i<fieldRules.length; i++) {
      var fieldRule = fieldRules[i];
      constructors.push({
        'type': 'field',
        'definition': fieldRule
      });
    }
    for (i = 0; i<constructors.length ; i++) {
      var constructor = constructors[i];
      var ruleObj = new appForm.models.Rule(constructor);
      var fieldIds = ruleObj.getRelatedFieldId();
      for (var j = 0; j<fieldIds.length; j++) {
        var  fieldId = fieldIds[j];
        if (!this.rules[fieldId]) {
          this.rules[fieldId] = [];
        }
        this.rules[fieldId].push(ruleObj);
      }
    }
  };
  Form.prototype.getRulesByFieldId = function (fieldId) {
    $fh.forms.log.d("Form: getRulesByFieldId");
    return this.rules[fieldId];
  };
  Form.prototype.initialisePage = function () {
    $fh.forms.log.d("Form: initialisePage");
    var pages = this.getPagesDef();
    this.pages = [];
    for (var i = 0; i < pages.length; i++) {
      var pageDef = pages[i];
      var pageModel = new appForm.models.Page(pageDef, this);
      this.pages.push(pageModel);
    }
  };
  Form.prototype.getPageModelList = function () {
    return this.pages;
  };
  Form.prototype.getName = function () {
    return this.get('name', '');
  };
  Form.prototype.getDescription = function () {
    return this.get('description', '');
  };
  Form.prototype.getPageRules = function () {
    return this.get('pageRules', []);
  };
  Form.prototype.getFieldRules = function () {
    return this.get('fieldRules', []);
  };
  Form.prototype.getFieldRef = function () {
    return this.get('fieldRef', {});
  };
  Form.prototype.getPagesDef = function () {
    return this.get('pages', []);
  };
  Form.prototype.getPageRef = function () {
    return this.get('pageRef', {});
  };
  Form.prototype.getFieldModelById = function (fieldId) {
    return this.fields[fieldId];
  };
  Form.prototype.getFieldDefByIndex = function (pageIndex, fieldIndex) {
    $fh.forms.log.d("Form: getFieldDefByIndex: ", pageIndex, fieldIndex);
    var pages = this.getPagesDef();
    var page = pages[pageIndex];
    if (page) {
      var fields = page.fields ? page.fields : [];
      var field = fields[fieldIndex];
      if (field) {
        return field;
      }
    }
    $fh.forms.log.e("Form: getFieldDefByIndex: No field found for page and field index: ", pageIndex, fieldIndex);
    return null;
  };
  Form.prototype.getPageModelById = function (pageId) {
    $fh.forms.log.d("Form: getPageModelById: ", pageId);
    var index = this.getPageRef()[pageId];
    if (typeof index == 'undefined') {
      throw 'page id is not found';
    } else {
      return this.pages[index];
    }
  };
  Form.prototype.newSubmission = function () {
    $fh.forms.log.d("Form: newSubmission");
    return appForm.models.submission.newInstance(this);
  };
  Form.prototype.getFormId = function () {
    return this.get('_id');
  };
  Form.prototype.removeFromCache = function () {
    $fh.forms.log.d("Form: removeFromCache");
    if (_forms[this.getFormId()]) {
      delete _forms[this.getFormId()];
    }
  };
  Form.prototype.getFileFieldsId = function () {
    $fh.forms.log.d("Form: getFileFieldsId");
    var fieldsId = [];
    for (var fieldId in this.fields) {
      var field = this.fields[fieldId];
      if (field.getType() == 'file' || field.getType() == 'photo' || field.getType() == 'signature') {
        fieldsId.push(fieldId);
      }
    }
    return fieldsId;
  };

  Form.prototype.getRuleEngine = function () {
    $fh.forms.log.d("Form: getRuleEngine");
    if (this.rulesEngine) {
      return this.rulesEngine;
    } else {
      var formDefinition = this.getProps();
      this.rulesEngine = new appForm.RulesEngine(formDefinition);
      return this.rulesEngine;
    }
  };
  return module;
}(appForm.models || {});
appForm.models = function (module) {
  var Model = appForm.models.Model;
  module.FileSubmission = FileSubmission;
  function FileSubmission(fileData) {
    $fh.forms.log.d("FileSubmission ", fileData);
    Model.call(this, {
      '_type': 'fileSubmission',
      'data': fileData
    });
  }
  appForm.utils.extend(FileSubmission, Model);
  FileSubmission.prototype.loadFile = function (cb) {
    $fh.forms.log.d("FileSubmission loadFile");
    var fileName = this.getHashName();
    var that = this;
    appForm.utils.fileSystem.readAsFile(fileName, function (err, file) {
      if (err) {
        $fh.forms.log.e("FileSubmission loadFile. Error reading file", fileName, err);
        cb(err);
      } else {
        $fh.forms.log.d("FileSubmission loadFile. File read correctly", fileName, file);
        that.fileObj = file;
        cb(null);
      }
    });
  };
  FileSubmission.prototype.getProps = function () {
    return this.fileObj;
  };
  FileSubmission.prototype.setSubmissionId = function (submissionId) {
    $fh.forms.log.d("FileSubmission setSubmissionId.", submissionId);
    this.set('submissionId', submissionId);
  };
  FileSubmission.prototype.getSubmissionId = function () {
    return this.get('submissionId');
  };
  FileSubmission.prototype.getHashName = function () {
    return this.get('data').hashName;
  };
  FileSubmission.prototype.getFieldId = function () {
    return this.get('data').fieldId;
  };
  return module;
}(appForm.models || {});
appForm.models = function (module) {
  var Model = appForm.models.Model;
  module.FormSubmission = FormSubmission;
  function FormSubmission(submissionJSON) {
    Model.call(this, {
      '_type': 'formSubmission',
      'data': submissionJSON
    });
  }
  appForm.utils.extend(FormSubmission, Model);
  FormSubmission.prototype.getProps = function () {
    return this.get('data');
  };
  FormSubmission.prototype.getFormId = function () {
    if(!this.get('data')){
      console.log(this);
      console.trace();
    }

    return this.get('data').formId;
  };
  return module;
}(appForm.models || {});
appForm.models = function (module) {
  var Model = appForm.models.Model;
  module.FormSubmissionComplete = FormSubmissionComplete;
  function FormSubmissionComplete(submissionTask) {
    Model.call(this, {
      '_type': 'completeSubmission',
      'submissionId': submissionTask.get('submissionId'),
      'localSubmissionId': submissionTask.get('localSubmissionId')
    });
  }
  appForm.utils.extend(FormSubmissionComplete, Model);
  return module;
}(appForm.models || {});
appForm.models = function (module) {
  var Model = appForm.models.Model;
  module.FormSubmissionStatus = FormSubmissionStatus;
  function FormSubmissionStatus(submissionTask) {
    Model.call(this, {
      '_type': 'submissionStatus',
      'submissionId': submissionTask.get('submissionId'),
      'localSubmissionId': submissionTask.get('localSubmissionId')
    });
  }
  appForm.utils.extend(FormSubmissionStatus, Model);
  return module;
}(appForm.models || {});
appForm.models = function (module) {
  var FileSubmission = appForm.models.FileSubmission;
  module.Base64FileSubmission = Base64FileSubmission;
  function Base64FileSubmission(fileData) {
    FileSubmission.call(this, fileData);
    this.set('_type', 'base64fileSubmission');
  }
  appForm.utils.extend(Base64FileSubmission, FileSubmission);
  return module;
}(appForm.models || {});
appForm.models = function (module) {
  var Model = appForm.models.Model;
  function Submissions() {
    Model.call(this, {
      '_type': 'submissions',
      '_ludid': 'submissions_list',
      'submissions': []
    });
  }
  appForm.utils.extend(Submissions, Model);
  Submissions.prototype.setLocalId = function () {
    $fh.forms.log.e("Submissions setLocalId. Not Permitted for submissions.");
  };
  /**
     * save a submission to list and store it immediately
     * @param  {[type]}   submission [description]
     * @param  {Function} cb         [description]
     * @return {[type]}              [description]
     */
  Submissions.prototype.saveSubmission = function (submission, cb) {
    $fh.forms.log.d("Submissions saveSubmission");
    var self=this;
    this.updateSubmissionWithoutSaving(submission);
    this.clearSentSubmission(function(){
      self.saveLocal(cb);  
    });
  };
  Submissions.prototype.updateSubmissionWithoutSaving = function (submission) {
    $fh.forms.log.d("Submissions updateSubmissionWithoutSaving");
    var pruneData = this.pruneSubmission(submission);
    var localId = pruneData._ludid;
    if (localId) {
      var meta = this.findMetaByLocalId(localId);
      var submissions = this.get('submissions');
      if (meta) {
        //existed, remove the old meta and save the new one.
        submissions.splice(submissions.indexOf(meta), 1);
        submissions.push(pruneData);
      } else {
        // not existed, insert to the tail.
        submissions.push(pruneData);
      }
    } else {
      // invalid local id.
      $fh.forms.log.e('Invalid submission for localId:', localId, JSON.stringify(submission));
    }
  };
  Submissions.prototype.clearSentSubmission=function(cb){
    $fh.forms.log.d("Submissions clearSentSubmission");
    var self=this;
    var maxSent= $fh.forms.config.get("max_sent_saved") ? $fh.forms.config.get("max_sent_saved") : $fh.forms.config.get("sent_save_min");
    var submissions=this.get("submissions");
    var sentSubmissions=this.getSubmitted();


    if (sentSubmissions.length>maxSent){
      $fh.forms.log.d("Submissions clearSentSubmission pruning sentSubmissions.length>maxSent");
      sentSubmissions=sentSubmissions.sort(function(a,b){
        if (a.submittedDate<b.submittedDate){
          return -1;
        }else {
          return 1;
        }
      });
      var toBeRemoved=[];
      while (sentSubmissions.length>maxSent){
        toBeRemoved.push(sentSubmissions.pop());
      }
      var count=toBeRemoved.length;
      for (var i=0;i<toBeRemoved.length;i++){
        var subMeta=toBeRemoved[i];
        self.getSubmissionByMeta(subMeta,function(err,submission){
          submission.clearLocal(function(err){
            if (err){
              $fh.forms.log.e("Submissions clearSentSubmission submission clearLocal", err);
            }
            count--;
            if (count===0){
              cb(null,null);
            }
          });
        });
      }
    }else{
      cb(null,null);
    }
  };
  Submissions.prototype.findByFormId = function (formId) {
    $fh.forms.log.d("Submissions findByFormId", formId);
    var rtn = [];
    var submissions = this.get('submissions');
    for (var i = 0; i < submissions.length; i++) {
      var obj = submissions[i];
      if (submissions[i].formId == formId) {
        rtn.push(obj);
      }
    }
    return rtn;
  };
  Submissions.prototype.getSubmissions = function () {
    return this.get('submissions');
  };
  Submissions.prototype.getSubmissionMetaList = Submissions.prototype.getSubmissions;
  //function alias
  Submissions.prototype.findMetaByLocalId = function (localId) {
    $fh.forms.log.d("Submissions findMetaByLocalId", localId);
    var submissions = this.get('submissions');
    for (var i = 0; i < submissions.length; i++) {
      var obj = submissions[i];
      if (submissions[i]._ludid == localId) {
        return obj;
      }
    }

    $fh.forms.log.e("Submissions findMetaByLocalId: No submissions for localId: ", localId);
    return null;
  };
  Submissions.prototype.pruneSubmission = function (submission) {
    $fh.forms.log.d("Submissions pruneSubmission");
    var fields = [
        '_id',
        '_ludid',
        'status',
        'formName',
        'formId',
        '_localLastUpdate',
        'createDate',
        'submitDate',
        'deviceFormTimestamp',
        'errorMessage',
        'submissionStartedTimestamp',
        'submittedDate'
      ];
    var data = submission.getProps();
    var rtn = {};
    for (var i = 0; i < fields.length; i++) {
      var key = fields[i];
      rtn[key] = data[key];
    }
    return rtn;
  };

  Submissions.prototype.clear = function(cb) {
    $fh.forms.log.d("Submissions clear");
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
  };
  Submissions.prototype.getDrafts = function(params) {
    $fh.forms.log.d("Submissions getDrafts: ", params);
    if(!params){
      params = {};
    }
    params.status = "draft";
    return this.findByStatus(params);
  };
  Submissions.prototype.getPending = function(params) {
    $fh.forms.log.d("Submissions getPending: ", params);
    if(!params){
      params = {};
    }
    params.status = "pending";
    return this.findByStatus(params);
  };
  Submissions.prototype.getSubmitted = function(params) {
    $fh.forms.log.d("Submissions getSubmitted: ", params);
    if(!params){
      params = {};
    }
    params.status = "submitted";
    return this.findByStatus(params);
  };
  Submissions.prototype.getError = function(params) {
    $fh.forms.log.d("Submissions getError: ", params);
    if(!params){
      params = {};
    }
    params.status = "error";
    return this.findByStatus(params);
  };
  Submissions.prototype.getInProgress = function(params) {
    $fh.forms.log.d("Submissions getInProgress: ", params);
    if(!params){
      params = {};
    }
    params.status = "inprogress";
    return this.findByStatus(params);
  };
  Submissions.prototype.findByStatus = function(params) {
    $fh.forms.log.d("Submissions findByStatus: ", params);
    if(!params){
      params = {};
    }
    if (typeof params =="string"){
      params={status:params};
    }
    if(params.status == null){
      return [];
    }

    var status = params.status;
    var formId = params.formId;

    var submissions = this.get("submissions");
    var rtn = [];
    for (var i = 0; i < submissions.length; i++) {
        if (submissions[i].status == status) {
          if(formId != null){
            if(submissions[i].formId == formId){
              rtn.push(submissions[i]);
            }
          } else {
            rtn.push(submissions[i]);
          }

        }
    }
    return rtn;
  };
  /**
   * return a submission model object by the meta data passed in.
   * @param  {[type]}   meta [description]
   * @param  {Function} cb   [description]
   * @return {[type]}        [description]
   */
  Submissions.prototype.getSubmissionByMeta = function (meta, cb) {
    $fh.forms.log.d("Submissions getSubmissionByMeta: ", meta);
    var localId = meta._ludid;
    if (localId) {
      appForm.models.submission.fromLocal(localId, cb);
    } else {
      $fh.forms.log.e("Submissions getSubmissionByMeta: local id not found for retrieving submission.", localId, meta);
      cb("local id not found for retrieving submission");
    }
  };
  Submissions.prototype.removeSubmission = function (localId, cb) {
    $fh.forms.log.d("Submissions removeSubmission: ", localId);
    var index = this.indexOf(localId);
    if (index > -1) {
      this.get('submissions').splice(index, 1);
    }
    this.saveLocal(cb);
  };
  Submissions.prototype.indexOf = function (localId, cb) {
    $fh.forms.log.d("Submissions indexOf: ", localId);
    var submissions = this.get('submissions');
    for (var i = 0; i < submissions.length; i++) {
      var obj = submissions[i];
      if (submissions[i]._ludid == localId) {
        return i;
      }
    }
    return -1;
  };
  module.submissions = new Submissions();
  return module;
}(appForm.models || {});
appForm.models = function(module) {
  module.submission = {
    newInstance: newInstance,
    fromLocal: fromLocal
  };
  //implmenetation
  var _submissions = {};
  //cache in mem for single reference usage.
  var Model = appForm.models.Model;
  var statusMachine = {
    'new': [
      'draft',
      'pending'
    ],
    'draft': [
      'pending',
      'draft'
    ],
    'pending': ['inprogress'],
    'inprogress': [
      'submitted',
      'pending',
      'error',
      'inprogress'
    ],
    'submitted': [],
    'error': [
      'draft',
      'pending',
      'inprogress',
      'error'
    ]
  };

  function newInstance(form) {
    return new Submission(form);
  }

  function fromLocal(localId, cb) {
    $fh.forms.log.d("Submission fromLocal: ", localId);
    if (_submissions[localId]) {
      $fh.forms.log.d("Submission fromLocal from cache: ", localId);
      //already loaded
      cb(null, _submissions[localId]);
    } else {
      //load from storage
      $fh.forms.log.d("Submission fromLocal not in cache. Loading from local storage.: ", localId);
      var obj = new Submission();
      obj.setLocalId(localId);
      obj.loadLocal(function(err, submission) {
        if (err) {
          $fh.forms.log.e("Submission fromLocal. Error loading from local: ", localId, err);
          cb(err);
        } else {
          $fh.forms.log.d("Submission fromLocal. Load from local sucessfull: ", localId);
          submission.reloadForm(function(err, res) {
            if (err) {
              $fh.forms.log.e("Submission fromLocal. reloadForm. Error re-loading form: ", localId, err);
              cb(err);
            } else {
              $fh.forms.log.d("Submission fromLocal. reloadForm. Re-loading form successfull: ", localId);
              _submissions[localId] = submission;
              cb(null, submission);
            }
          });
        }
      });
    }
  }

  function Submission(form) {
    $fh.forms.log.d("Submission: ");
    Model.call(this, {
      '_type': 'submission'
    });
    if (typeof form != 'undefined' && form) {
      this.set('formName', form.get('name'));
      this.set('formId', form.get('_id'));
      this.set('deviceFormTimestamp', form.getLastUpdate());
      this.form = form; //TODO may contain whole form definition in props.
    }
    this.set('status', 'new');
    this.set('createDate', appForm.utils.getTime());
    this.set('timezoneOffset', appForm.utils.getTime(true));
    this.set('appId', appForm.config.get('appId'));
    this.set('appEnvironment', appForm.config.get('env'));
    this.set('appCloudName', '');

    this.set('comments', []);
    this.set('formFields', []);
    this.set('saveDate', null);
    this.set('submitDate', null);
    this.set('uploadStartDate', null);
    this.set('submittedDate', null);
    this.set('userId', null);
    this.set('filesInSubmission', {});
    this.set('deviceId', appForm.config.get('deviceId'));
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
    $fh.forms.log.d("Submission saveDraft: ");
    var targetStatus = 'draft';
    var that = this;
    this.set('timezoneOffset', appForm.utils.getTime(true));
    this.set('saveDate', appForm.utils.getTime());
    this.changeStatus(targetStatus, function(err) {
      if (err) {
        return cb(err);
      } else {
        that.emit('savedraft');
        cb(null, null);
      }
    });
  };
  Submission.prototype.validateField = function(fieldId, cb) {
    $fh.forms.log.d("Submission validateField: ", fieldId);
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
  };
  Submission.prototype.checkRules = function(cb) {
    $fh.forms.log.d("Submission checkRules: ");
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
  };
  /**
   * submit current submission to remote
   * @param  {Function} cb [description]
   * @return {[type]}      [description]
   */
  Submission.prototype.submit = function(cb) {
    $fh.forms.log.d("Submission submit: ");
    var targetStatus = 'pending';
    var validateResult = true;
    var that = this;
    this.set('timezoneOffset', appForm.utils.getTime(true));
    this.getForm(function(err, form) {
      if(err) $fh.forms.log.e("Submission submit: Error getting form ", err);
      var ruleEngine = form.getRuleEngine();
      var submission = that.getProps();
      ruleEngine.validateForm(submission, function(err, res) {
        if (err) {
          $fh.forms.log.e("Submission submit validateForm: Error validating form ", err);
          cb(err);
        } else {
          $fh.forms.log.d("Submission submit: validateForm. Completed result", res);
          var validation = res.validation;
          if (validation.valid) {
            $fh.forms.log.d("Submission submit: validateForm. Completed Form Valid", res);
            that.set('submitDate', new Date());
            that.changeStatus(targetStatus, function(error) {
              if (error) {
                cb(error);
              } else {
                that.emit('submit');
                cb(null, null);
              }
            });
          } else {
            $fh.forms.log.d("Submission submit: validateForm. Completed Validation error", res);
            cb('Validation error');
            that.emit('validationerror', validation);
          }
        }
      });
    });
  };
  Submission.prototype.getUploadTask = function(cb) {
    var taskId = this.getUploadTaskId();
    if (taskId) {
      appForm.models.uploadManager.getTaskById(taskId, cb);
    } else {
      cb(null, null);
    }
  };
  Submission.prototype.cancelUploadTask = function(cb) {
    var targetStatus = 'submit';
    var that = this;
    appForm.models.uploadManager.cancelSubmission(this, function(err) {
      if (err) {
        console.error(err);
      }
      that.changeStatus(targetStatus, cb);
    });
  };
  Submission.prototype.getUploadTaskId = function() {
    return this.get('uploadTaskId');
  };
  Submission.prototype.setUploadTaskId = function(utId) {
    this.set('uploadTaskId', utId);
  };
  Submission.prototype.submitted = function(cb) {
    var targetStatus = 'submitted';
    var that = this;
    this.set('submittedDate', appForm.utils.getTime());
    this.changeStatus(targetStatus, function(err) {
      if (err) {
        cb(err);
      } else {
        that.emit('submitted');
        cb(null, null);
      }
    });
  };
  //joint form id and submissions timestamp.
  Submission.prototype.genLocalId = function() {
    var lid = appForm.utils.localId(this);
    var formId = this.get('formId') || Math.ceil(Math.random() * 100000);
    this.setLocalId(formId + '_' + lid);
  };
  /**
   * change status and save the submission locally and register to submissions list.
   * @param {[type]} status [description]
   */
  Submission.prototype.changeStatus = function(status, cb) {
    if (this.isStatusValid(status)) {
      var that = this;
      this.set('status', status);
      this.saveToList(function(err) {
        if (err) {
          console.error(err);
        }
      });
      this.saveLocal(cb);
    } else {
      throw 'Target status is not valid: ' + status;
    }
  };
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
          ut.set("error", null);
          ut.saveLocal(function(err) {
            if (err) console.error(err);
          });
          that.emit("inprogress", ut);
          ut.on("progress", function(progress) {
            that.emit("progress", progress);
          });
          cb(null, ut);
        }
      });

    } else {
      return cb("Invalid Status to upload a form submission.");
    }
  };
  Submission.prototype.saveToList = function(cb) {
    appForm.models.submissions.saveSubmission(this, cb);
  };
  Submission.prototype.error = function(errorMsg, cb) {
    this.set('errorMessage', errorMsg);
    var targetStatus = 'error';
    this.changeStatus(targetStatus, cb);
    this.emit('submitted', errorMsg);
  };
  Submission.prototype.getStatus = function() {
    return this.get('status');
  };
  /**
   * check if a target status is valid
   * @param  {[type]}  targetStatus [description]
   * @return {Boolean}              [description]
   */
  Submission.prototype.isStatusValid = function(targetStatus) {
    var status = this.get('status').toLowerCase();
    var nextStatus = statusMachine[status];
    if (nextStatus.indexOf(targetStatus) > -1) {
      return true;
    } else {
      return false;
    }
  };
  Submission.prototype.addComment = function(msg, user) {
    var now = appForm.utils.getTime();
    var ts = now.getTime();
    var newComment = {
      'madeBy': typeof user == 'undefined' ? '' : user.toString(),
      'madeOn': now,
      'value': msg,
      'timeStamp': ts
    };
    this.getComments().push(newComment);
    return ts;
  };
  Submission.prototype.getComments = function() {
    return this.get('comments');
  };
  Submission.prototype.removeComment = function(timeStamp) {
    var comments = this.getComments();
    for (var i = 0; i < comments.length; i++) {
      var comment = comments[i];
      if (comment.timeStamp == timeStamp) {
        comments.splice(i, 1);
        return;
      }
    }
  };
  Submission.prototype.addSubmissionFile = function(fileHash) {
    var filesInSubmission = this.get('filesInSubmission', {});
    filesInSubmission[fileHash] = true;
    this.set('filesInSubmission', filesInSubmission);
    this.saveLocal(function(err) {
      if (err)
        console.error(err);
    });
  };
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
    var fieldId = params.fieldId;
    var inputValue = params.value;
    var index = params.index === undefined ? -1 : params.index;
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
            if (index > -1) {
              that.tmpFields[fieldId][index] = result;
            } else {
              that.tmpFields[fieldId].push(result);
            }
            if (result != null && result.hashName) {
              that.addSubmissionFile(result.hashName);
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
            if (index > -1) {
              target.fieldValues[index] = result;
            } else {
              target.fieldValues.push(result);
            }
            if (result != null && result.hashName) {
              that.addSubmissionFile(result.hashName);
            }
            cb(null, result);
          }
        });
      }
    });
  };
  Submission.prototype.getInputValueByFieldId = function(fieldId, cb) {
    var values = this.getInputValueObjectById(fieldId).fieldValues;
    this.getForm(function(err, form) {
      var fieldModel = form.getFieldModelById(fieldId);
      fieldModel.convertSubmission(values, cb);
    });
  };
  /**
   * Reset submission
   * @return {[type]} [description]
   */
  Submission.prototype.reset = function(cb) {
    this.set('formFields', []);
  };
  Submission.prototype.clearLocalSubmissionFiles = function(cb) {
    var filesInSubmission = this.get('filesInSubmission', {});
    for (var fileHashName in filesInSubmission) {
      appForm.utils.fileSystem.remove(fileHashName, function(err) {
        if (err)
          console.error(err);
      });
    }
    cb();
  };
  Submission.prototype.startInputTransaction = function() {
    this.transactionMode = true;
    this.tmpFields = {};
  };
  Submission.prototype.endInputTransaction = function(succeed) {
    this.transactionMode = false;
    if (succeed) {
      var targetArr = this.get('formFields');
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
  };
  /**
   * remove an input value from submission
   * @param  {[type]} fieldId field id
   * @param  {[type]} index (optional) the position of the value will be removed if it is repeated field.
   * @return {[type]}         [description]
   */
  Submission.prototype.removeFieldValue = function(fieldId, index) {
    var targetArr = [];
    if (this.transactionMode) {
      targetArr = this.tmpFields.fieldId;
    } else {
      targetArr = this.getInputValueObjectById(fieldId).fieldId;
    }
    if (typeof index == 'undefined') {
      targetArr.splice(0, targetArr.length);
    } else {
      if (targetArr.length > index) {
        targetArr.splice(index, 1);
      }
    }
  };
  Submission.prototype.getInputValueObjectById = function(fieldId) {
    var formFields = this.get('formFields', []);
    for (var i = 0; i < formFields.length; i++) {
      var formField = formFields[i];
      if (formField.fieldId == fieldId) {
        return formField;
      }
    }
    var newField = {
      'fieldId': fieldId,
      'fieldValues': []
    };
    formFields.push(newField);
    return newField;
  };
  /**
   * get form model related to this submission.
   * @return {[type]} [description]
   */
  Submission.prototype.getForm = function(cb) {
    var Form = appForm.models.Form;
    var formId = this.get('formId');
    new Form({
      'formId': formId,
      'rawMode': true
    }, cb);
  };
  Submission.prototype.reloadForm = function(cb) {
    var Form = appForm.models.Form;
    var formId = this.get('formId');
    var self = this;
    new Form({
      formId: formId,
      'rawMode': true
    }, function(err, form) {
      if (err) {
        cb(err);
      } else {
        self.form = form;
        if (!self.get('deviceFormTimestamp', null)) {
          self.set('deviceFormTimestamp', form.getLastUpdate());
        }
        cb(null, form);
      }
    });
  };
  /**
   * Retrieve all file fields related value
   * @return {[type]} [description]
   */
  Submission.prototype.getFileInputValues = function() {
    var fileFieldIds = this.form.getFileFieldsId();
    return this.getInputValueArray(fileFieldIds);
  };

  Submission.prototype.getInputValueArray = function(fieldIds) {
    var rtn = [];
    for (var i = 0; i< fieldIds.length; i++) {
      var  fieldId = fieldIds[i];
      var inputValue = this.getInputValueObjectById(fieldId);
      for (var j = 0; j < inputValue.fieldValues.length; j++) {
        var tmpObj = inputValue.fieldValues[j];
        if (tmpObj) {
          tmpObj.fieldId = fieldId;
          rtn.push(tmpObj);
        }
      }
    }
    return rtn;
  };
  Submission.prototype.clearLocal = function(cb) {
    var self = this;
    //remove from uploading list
    appForm.models.uploadManager.cancelSubmission(self, function(err, uploadTask) {
      if (err) {
        console.error(err);
        return cb(err);
      }
      //remove from submission list
      appForm.models.submissions.removeSubmission(self.getLocalId(), function(err) {
        if (err) {
          console.err(err);
          return cb(err);
        }
        self.clearLocalSubmissionFiles(function() {
          Model.prototype.clearLocal.call(self, function(err) {
            if (err) {
              console.error(err);
              return cb(err);
            }
            cb(null, null);
          });
        });
      });
    });
  };
  return module;
}(appForm.models || {});
/**
 * Field model for form
 * @param  {[type]} module [description]
 * @return {[type]}        [description]
 */
appForm.models = function (module) {
  var Model = appForm.models.Model;
  function Field(opt, form) {
    Model.call(this, { '_type': 'field' });
    if (opt) {
      this.fromJSON(opt);
      this.genLocalId();
    }
    if (form) {
      this.form = form;
    }
  }
  appForm.utils.extend(Field, Model);
  Field.prototype.isRequired = function () {
    return this.get('required');
  };
  Field.prototype.getFieldValidation = function () {
    return this.getFieldOptions().validation || {};
  };
  Field.prototype.getFieldDefinition = function () {
    return this.getFieldOptions().definition || {};
  };
  Field.prototype.getMinRepeat = function () {
    var def = this.getFieldDefinition();
    return def.minRepeat || 1;
  };
  Field.prototype.getMaxRepeat = function () {
    var def = this.getFieldDefinition();
    return def.maxRepeat || 1;
  };
  Field.prototype.getFieldOptions = function () {
    return this.get('fieldOptions', {
      'validation': {},
      'definition': {}
    });
  };
  Field.prototype.getPhotoOptions = function(){
    var photoOptions = {
      "targetWidth" : null,
      "targetHeight" : null,
      "quality" : null
    };

    var fieldDef = this.getFieldDefinition();
    photoOptions.targetWidth = fieldDef.photoWidth;
    photoOptions.targetHeight = fieldDef.photoHeight;
    photoOptions.quality = fieldDef.photoQuality;
    return photoOptions;
  };
  Field.prototype.isRepeating = function () {
    return this.get('repeating', false);
  };
  /**
     * retrieve field type.
     * @return {[type]} [description]
     */
  Field.prototype.getType = function () {
    return this.get('type', 'text');
  };
  Field.prototype.getFieldId = function () {
    return this.get('_id', '');
  };
  Field.prototype.getName = function () {
    return this.get('name', 'unknown name');
  };
  Field.prototype.getHelpText = function () {
    return this.get('helpText', '');
  };
  /**
     * Process an input value. convert to submission format. run field.validate before this
     * @param  {[type]} params {"value", "isStore":optional}
     * @param {cb} cb(err,res)
     * @return {[type]}           submission json used for fieldValues for the field
     */
  Field.prototype.processInput = function (params, cb) {
    var type = this.getType();
    var processorName = 'process_' + type;
    var inputValue = params.value;
    if (typeof inputValue === 'undefined' || inputValue === null) {
      //if user input is empty, keep going.
      return cb(null, inputValue);
    }
    // try to find specified processor
    if (this[processorName] && typeof this[processorName] == 'function') {
      this[processorName](params, cb);
    } else {
      cb(null, inputValue);
    }
  };
  /**
     * Convert the submission value back to input value.
     * @param  {[type]} submissionValue [description]
     * @param { function} cb callback
     * @return {[type]}                 [description]
     */
  Field.prototype.convertSubmission = function (submissionValue, cb) {
    var type = this.getType();
    var processorName = 'convert_' + type;
    // try to find specified processor
    if (this[processorName] && typeof this[processorName] == 'function') {
      this[processorName](submissionValue, cb);
    } else {
      cb(null, submissionValue);
    }
  };
  /**
     * validate a input with this field.
     * @param  {[type]} inputValue [description]
     * @return true / error message
     */
  Field.prototype.validate = function (inputValue, cb) {
    this.form.getRuleEngine().validateFieldValue(this.getFieldId(), inputValue, cb);
  };
  /**
     * return rule array attached to this field.
     * @return {[type]} [description]
     */
  Field.prototype.getRules = function () {
    var id = this.getFieldId();
    return this.form.getRulesByFieldId(id);
  };
  Field.prototype.setVisible = function (isVisible) {
    this.set('visible', isVisible);
    if (isVisible) {
      this.emit('visible');
    } else {
      this.emit('hidden');
    }
  };
  module.Field = Field;
  return module;
}(appForm.models || {});

/**
 * extension of Field class to support checkbox field
 */
appForm.models.Field = function (module) {
  module.prototype.getCheckBoxOptions = function () {
    var def = this.getFieldDefinition();
    if (def.options) {
      return def.options;
    } else {
      throw 'checkbox choice definition is not found in field definition';
    }
  };
  module.prototype.process_checkboxes = function (params, cb) {
    var inputValue = params.value;
    if (!inputValue || !inputValue.selections || !(inputValue.selections instanceof Array)){
      cb('the input value for processing checkbox field should be like {selections: [val1,val2]}');
    } else {
      cb(null, inputValue);
    }
  };
  module.prototype.convert_checkboxes = function (value, cb) {
    var rtn = [];
    for (var i = 0; i < value.length; i++) {
      rtn.push(value[i].selections);
    }
    cb(null, rtn);
  };
  return module;
}(appForm.models.Field || {});

/**
 * extension of Field class to support file field
 */
appForm.models.Field = function (module) {
  function checkFileObj(obj) {
    return obj.fileName && obj.fileType && obj.hashName;
  }
  module.prototype.process_file = function (params, cb) {
    var inputValue = params.value;
    var isStore = params.isStore === undefined ? true : params.isStore;
    if (typeof inputValue == 'undefined' || inputValue == null) {
      return cb(null, null);
    }
    if (typeof inputValue != 'object' || !inputValue instanceof HTMLInputElement && !inputValue instanceof File && !checkFileObj(inputValue)) {
      throw 'the input value for file field should be a html file input element or a File object';
    }
    if (checkFileObj(inputValue)) {
      return cb(null, inputValue);
    }
    var file = inputValue;
    if (inputValue instanceof HTMLInputElement) {
      file = inputValue.files[0];  // 1st file only, not support many files yet.
    }
    var rtnJSON = {
        'fileName': file.name,
        'fileSize': file.size,
        'fileType': file.type,
        'fileUpdateTime': file.lastModifiedDate.getTime(),
        'hashName': '',
        'contentType': 'binary'
      };
    var name = file.name + new Date().getTime() + Math.ceil(Math.random() * 100000);
    appForm.utils.md5(name, function (err, res) {
      var hashName = res;
      if (err) {
        hashName = name;
      }
      hashName = 'filePlaceHolder' + hashName;
      rtnJSON.hashName = hashName;
      if (isStore) {
        appForm.utils.fileSystem.save(hashName, file, function (err, res) {
          if (err) {
            console.error(err);
            cb(err);
          } else {
            cb(null, rtnJSON);
          }
        });
      } else {
        cb(null, rtnJSON);
      }
    });
  };
  return module;
}(appForm.models.Field || {});

/**
 * extension of Field class to support latitude longitude field
 */
appForm.models.Field = function (module) {
  /**
     * Format: [{lat: number, long: number}]
     * @param  {[type]} inputValues [description]
     * @return {[type]}             [description]
     */
  module.prototype.process_location = function (params, cb) {
    var inputValue = params.value;
    var def = this.getFieldDefinition();
    var obj={};
    switch (def.locationUnit) {
    case 'latlong':
      if (!inputValue.lat || !inputValue["long"]) {
        cb('the input values for latlong field is {lat: number, long: number}');
      } else {
        obj = {
            'lat': inputValue.lat,
            'long': inputValue["long"]
          };
        cb(null, obj);
      }
      break;
    case 'eastnorth':
      if (!inputValue.zone || !inputValue.eastings || !inputValue.northings) {
        cb('the input values for northeast field is {zone: text, eastings: text, northings:text}');
      } else {
        obj = {
            'zone': inputValue.zone,
            'eastings': inputValue.eastings,
            'northings': inputValue.northings
          };
        cb(null, obj);
      }
      break;
    default:
      cb('Invalid subtype type of location field, allowed types: latlong and eastnorth, was: ' + def.locationUnit);
      break;
    }
  };
  return module;
}(appForm.models.Field || {});
/**
 * extension of Field class to support matrix field
 */
appForm.models.Field = function (module) {
  module.prototype.getMatrixRows = function () {
    var def = this.getFieldDefinition();
    if (def.rows) {
      return def.rows;
    } else {
      throw 'matrix rows definition is not found in field definition';
    }
  };
  module.prototype.getMatrixCols = function () {
    var def = this.getFieldDefinition();
    if (def.columns) {
      return def.columns;
    } else {
      throw 'matrix columns definition is not found in field definition';
    }
  };
  return module;
}(appForm.models.Field || {});


/**
 * extension of Field class to support radio field
 */
appForm.models.Field = function (module) {
  module.prototype.getRadioOption = function () {
    var def = this.getFieldDefinition();
    if (def.options) {
      return def.options;
    } else {
      throw 'Radio options definition is not found in field definition';
    }
  };
  return module;
}(appForm.models.Field || {});
/**
 * extension of Field class to support file field
 */
appForm.models.Field = function (module) {
  function checkFileObj(obj) {
    return obj.fileName && obj.fileType && obj.hashName;
  }
  function imageProcess(params, cb) {
    var inputValue = params.value;
    var isStore = params.isStore === undefined ? true : params.isStore;
    if (inputValue === '') {
      return cb(null, null);
    }
    var imgName = '';
    var dataArr = inputValue.split(';base64,');
    var imgType = dataArr[0].split(':')[1];
    var extension = imgType.split('/')[1];
    var size = inputValue.length;
    genImageName(function (err, n) {
      imgName = 'filePlaceHolder' + n;
      //TODO Abstract this out
      var meta = {
          'fileName': imgName + '.' + extension,
          'hashName': imgName,
          'contentType': 'base64',
          'fileSize': size,
          'fileType': imgType,
          'imgHeader': 'data:' + imgType + ';base64,',
          'fileUpdateTime': new Date().getTime()
        };
      if (isStore) {
        appForm.utils.fileSystem.save(imgName, dataArr[1], function (err, res) {
          if (err) {
            console.error(err);
            cb(err);
          } else {
            cb(null, meta);
          }
        });
      } else {
        cb(null, meta);
      }
    });
  }
  function genImageName(cb) {
    var name = new Date().getTime() + '' + Math.ceil(Math.random() * 100000);
    appForm.utils.md5(name, cb);
  }
  function covertImage(value, cb) {
    if (value.length === 0) {
      cb(null, value);
    } else {
      var count = value.length;
      for (var i = 0; i < value.length; i++) {
        var meta = value[i];
        _loadImage(meta, function () {
          count--;
          if (count === 0) {
            cb(null, value);
          }
        });
      }
    }
  }
  function _loadImage(meta, cb) {
    if (meta) {
      var name = meta.hashName;
      appForm.utils.fileSystem.readAsText(name, function (err, text) {
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
}(appForm.models.Field || {});
/**
 * One form contains multiple pages
 */
appForm.models = function (module) {
  var Model = appForm.models.Model;
  function Page(opt, parentForm) {
    if (typeof opt == 'undefined' || typeof parentForm == 'undefined') {
      throw 'Page initialise failed: new Page(pageDefinitionJSON, parentFormModel)';
    }
    Model.call(this, { '_type': 'page' });
    this.fromJSON(opt);
    this.form = parentForm;
    this.initialise();
  }
  appForm.utils.extend(Page, Model);
  Page.prototype.initialise = function () {
    var fieldsDef = this.getFieldDef();
    this.fieldsIds = [];
    for (var i = 0; i < fieldsDef.length; i++) {
      this.fieldsIds.push(fieldsDef[i]._id);
    }
  };
  Page.prototype.setVisible = function (isVisible) {
    this.set('visible', isVisible);
    if (isVisible) {
      this.emit('visible');
    } else {
      this.emit('hidden');
    }
  };
  Page.prototype.getFieldDef=function(){
    return this.get("fields",[]);
  };
  Page.prototype.getFieldDef=function(){
      return this.get("fields",[]);
  };
  Page.prototype.getFieldModelList=function(){
      var list=[];
      for (var i=0;i<this.fieldsIds.length;i++){
          list.push(this.form.getFieldModelById(this.fieldsIds[i]));
      }
      return list;
  };
  Page.prototype.checkForSectionBreaks=function(){ //Checking for any sections
    for (var i=0;i<this.fieldsIds.length;i++){
      var fieldModel = this.form.getFieldModelById(this.fieldsIds[i]);
      if(fieldModel && fieldModel.getType() == "sectionBreak"){
        return true;
      }
    }
    return false;
  };
  Page.prototype.getSections=function(){ //Checking for any sections
    var sectionList={};
    var currentSection = null;
    var sectionBreaksExist = this.checkForSectionBreaks();
    var insertSectionBreak = false;

    if(sectionBreaksExist){
      //If there are section breaks, the first field in the form must be a section break. If not, add a placeholder
      var firstField = this.form.getFieldModelById(this.fieldsIds[0]);

      if(firstField.getType() != "sectionBreak"){
        insertSectionBreak = true;
      }
    } else {
      return null;
    }

    for (var i=0;i<this.fieldsIds.length;i++){
      var fieldModel = this.form.getFieldModelById(this.fieldsIds[i]);

      if(insertSectionBreak && i === 0){ //Adding a first section.
        currentSection = "sectionBreak" + i;
        sectionList[currentSection] = sectionList[currentSection] ? sectionList[currentSection] : [];
      }

      if(currentSection !== null && fieldModel.getType() != "sectionBreak"){
        sectionList[currentSection].push(fieldModel);
      }

      if(fieldModel.getType() == "sectionBreak"){
        currentSection = "sectionBreak" + i;
        sectionList[currentSection] = sectionList[currentSection] ? sectionList[currentSection] : [];
        sectionList[currentSection].push(fieldModel);
      }
    }

    return sectionList;
  };
  Page.prototype.getFieldModelById=function(fieldId){
    return this.form.getFieldModelById(fieldId);
  };
  Page.prototype.getPageId=function(){
    return this.get("_id","");
  };
  Page.prototype.getName = function () {
    return this.get('name', '');
  };
  Page.prototype.getDescription = function () {
    return this.get('description', '');
  };
  Page.prototype.getFieldDef = function () {
    return this.get('fields', []);
  };
  Page.prototype.getFieldModelList = function () {
    var list = [];
    for (var i = 0; i < this.fieldsIds.length; i++) {
      list.push(this.form.getFieldModelById(this.fieldsIds[i]));
    }

    return list;
  };

    module.Page=Page;

    return module;
}(appForm.models || {});

/**
 * Manages submission uploading tasks
 */
appForm.models = function (module) {
  var Model = appForm.models.Model;
  function UploadManager() {
    Model.call(this, {
      '_type': 'uploadManager',
      '_ludid': 'uploadManager_queue'
    });
    this.set('taskQueue', []);
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
  UploadManager.prototype.queueSubmission = function (submissionModel, cb) {
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
    if (!this.timer) {
      this.start();
    }
    if (uploadTask) {
      uploadTask.saveLocal(function (err) {
        if (err) {
          console.error(err);
        }
        self.saveLocal(function (err) {
          if (err) {
            console.error(err);
          }
          submissionModel.setUploadTaskId(utId);
          cb(null, uploadTask);
        });
      });
    } else {
      self.getTaskById(utId, cb);
    }
  };
  /**
     * cancel a submission uploading
     * @param  {[type]}   submissionsModel [description]
     * @param  {Function} cb               [description]
     * @return {[type]}                    [description]
     */
  UploadManager.prototype.cancelSubmission = function (submissionsModel, cb) {
    var uploadTId = submissionsModel.getUploadTaskId();
    var queue = this.get('taskQueue');
    if (uploadTId) {
      var index = queue.indexOf(uploadTId);
      if (index > -1) {
        queue.splice(index, 1);
      }
      this.getTaskById(uploadTId, function (err, task) {
        if (err) {
          console.error(err);
          cb(err, task);
        } else {
          if (task) {
            task.clearLocal(cb);
          } else {
            cb(null, null);
          }
        }
      });
      this.saveLocal(function (err) {
        if (err)
          console.error(err);
      });
    } else {
      cb(null, null);
    }
  };

  UploadManager.prototype.getTaskQueue = function () {
    return this.get('taskQueue', []);
  };
  /**
     * start a timer
     * @param  {} interval ms
     * @return {[type]}      [description]
     */
  UploadManager.prototype.start = function () {
    var that = this;
    this.stop();
    this.timer = setInterval(function () {
      that.tick();
    }, this.timerInterval);
  };
  /**
     * stop uploadgin
     * @return {[type]} [description]
     */
  UploadManager.prototype.stop = function () {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  };
  UploadManager.prototype.push = function (uploadTaskId) {
    this.get('taskQueue').push(uploadTaskId);
    this.saveLocal(function (err) {
      if (err)
        console.error(err);
    });
  };
  UploadManager.prototype.shift = function () {
    var shiftedTask = this.get('taskQueue').shift();
    this.saveLocal(function (err) {
      if (err)
        console.error(err);
    });
    return shiftedTask;
  };
  UploadManager.prototype.rollTask = function () {
    this.push(this.shift());
  };
  UploadManager.prototype.tick = function () {
    if (this.sending) {
      var now = appForm.utils.getTime();
      var timePassed = now.getTime() - this.sendingStart.getTime();
      if (timePassed > $fh.forms.config.get("timeout") * 1000) {
        //time expired. roll current task to the end of queue
        console.error('Uploading content timeout. it will try to reupload.');
        this.sending = false;
        this.rollTask();
      }
    } else {
      if (this.hasTask()) {
        this.sending = true;
        this.sendingStart = appForm.utils.getTime();
        var that = this;
        this.getCurrentTask(function (err, task) {
          if (err || !task) {
            console.error(err);
            that.sending = false;
          } else {
            if (task.isCompleted() || task.isError()) {
              //current task uploaded or aborted by error. shift it from queue
              that.shift();
              that.sending = false;
              that.saveLocal(function () {
              });
            } else {
              task.uploadTick(function (err) {
                //callback when finished. ready for next upload command
                that.sending = false;
              });
            }
          }
        });
      } else {
        //no task . stop timer.
        this.stop();
      }
    }
  };
  UploadManager.prototype.hasTask = function () {
    return this.get('taskQueue').length > 0;
  };
  UploadManager.prototype.getCurrentTask = function (cb) {
    var taskId = this.getTaskQueue()[0];
    if (taskId) {
      this.getTaskById(taskId, cb);
    } else {
      cb(null, null);
    }
  };
  UploadManager.prototype.getTaskById = function (taskId, cb) {
    appForm.models.uploadTask.fromLocal(taskId, cb);
  };
  module.uploadManager = new UploadManager();
  return module;
}(appForm.models || {});
appForm.models = function (module) {
  var Model = appForm.models.Model;
  /**
     * Describe rules associated to one field.
     * @param {[type]} param {"type":"page | field", "definition":defJson}
     */
  function Rule(param) {
    Model.call(this, { '_type': 'rule' });
    this.fromJSON(param);
  }
  appForm.utils.extend(Rule, Model);
  /**
     * Return source fields id required from input value for this rule
     * @return [fieldid1, fieldid2...] [description]
     */
  Rule.prototype.getRelatedFieldId = function () {
    var def = this.getDefinition();
    var statements = def.ruleConditionalStatements;
    var rtn = [];
    for (var i = 0; i<statements.length; i++) {
      var statement = statements[i];
      rtn.push(statement.sourceField);
    }
    return rtn;
  };
  /**
     * test if input value meet the condition
     * @param  {[type]} param {fieldId:value, fieldId2:value2}
     * @return {[type]}       true - meet rule  / false -  not meet rule
     */
  Rule.prototype.test = function (param) {
    var fields = this.getRelatedFieldId();
    var logic = this.getLogic();
    var res = logic == 'or' ? false : true;
    for (var i = 0; i< fields.length ; i++) {
      var fieldId = fields[i];
      var val = param[fieldId];
      if (val) {
        var tmpRes = this.testField(fieldId, val);
        if (logic == 'or') {
          res = res || tmpRes;
          if (res === true) {
            //break directly
            return true;
          }
        } else {
          res = res && tmpRes;
          if (res === false) {
            //break directly
            return false;
          }
        }
      } else {
        if (logic == 'or') {
          res = res || false;
        } else {
          return false;
        }
      }
    }
    return res;
  };
  /**
     * test a field if the value meets its conditon
     * @param  {[type]} fieldId [description]
     * @param  {[type]} val     [description]
     * @return {[type]}         [description]
     */
  Rule.prototype.testField = function (fieldId, val) {
    var statement = this.getRuleConditionStatement(fieldId);
    var condition = statement.restriction;
    var expectVal = statement.sourceValue;
    return appForm.models.checkRule(condition, expectVal, val);
  };
  Rule.prototype.getRuleConditionStatement = function (fieldId) {
    var statements = this.getDefinition().ruleConditionalStatements;
    for (var i = 0; i<statements.length; i++) {
      var statement = statements[i];
      if (statement.sourceField == fieldId) {
        return statement;
      }
    }
    return null;
  };
  Rule.prototype.getLogic = function () {
    var def = this.getDefinition();
    return def.ruleConditionalOperator.toLowerCase();
  };
  Rule.prototype.getDefinition = function () {
    return this.get('definition');
  };
  Rule.prototype.getAction = function () {
    var def = this.getDefinition();
    var target = {
        'action': def.type,
        'targetId': this.get('type') == 'page' ? def.targetPage : def.targetField,
        'targetType': this.get('type')
      };
    return target;
  };
  module.Rule = Rule;
  return module;
}(appForm.models || {});
/**
 * Uploading task for each submission
 */
appForm.models = function (module) {
  module.uploadTask = {
    'newInstance': newInstance,
    'fromLocal': fromLocal
  };
  var _uploadTasks = {};
  //mem cache for singleton.
  var Model = appForm.models.Model;
  function newInstance(submissionModel) {
    var utObj = new UploadTask();
    utObj.init(submissionModel);
    _uploadTasks[utObj.getLocalId()] = utObj;
    return utObj;
  }
  function fromLocal(localId, cb) {
    if (_uploadTasks[localId]) {
      return cb(null, _uploadTasks[localId]);
    }
    var utObj = new UploadTask();
    utObj.setLocalId(localId);
    _uploadTasks[localId] = utObj;
    utObj.loadLocal(cb);
  }
  function UploadTask() {
    Model.call(this, { '_type': 'uploadTask' });
  }
  appForm.utils.extend(UploadTask, Model);
  UploadTask.prototype.init = function (submissionModel) {
    var json = submissionModel.getProps();
    var files = submissionModel.getFileInputValues();
    var submissionLocalId = submissionModel.getLocalId();
    this.setLocalId(submissionLocalId + '_' + 'uploadTask');
    this.set('submissionLocalId', submissionLocalId);
    this.set('jsonTask', json);
    this.set('fileTasks', []);
    this.set('currentTask', null);
    this.set('completed', false);
    this.set('mbaasCompleted', false);
    this.set('retryAttempts', 0);
    this.set('retryNeeded', false);
    this.set('formId', submissionModel.get('formId'));
    for (var i = 0; i<files.length ; i++) {
      var file = files[i];
      this.addFileTask(file);
    }
  };
  UploadTask.prototype.getTotalSize = function () {
    var jsonSize = JSON.stringify(this.get('jsonTask')).length;
    var fileTasks = this.get('fileTasks');
    var fileSize = 0;
    var fileTask;
    for (var i = 0; i<fileTasks.length ; i++) {
      fileTask = fileTasks[i];
      fileSize += fileTask.fileSize;
    }
    return jsonSize + fileSize;
  };
  UploadTask.prototype.getUploadedSize = function () {
    var currentTask = this.getCurrentTask();
    if (currentTask === null) {
      return 0;
    } else {
      var jsonSize = JSON.stringify(this.get('jsonTask')).length;
      var fileTasks = this.get('fileTasks');
      var fileSize = 0;
      for (var i = 0, fileTask; (fileTask = fileTasks[i]) && i < currentTask; i++) {
        fileSize += fileTask.fileSize;
      }
      return jsonSize + fileSize;
    }
  };
  UploadTask.prototype.getRemoteStore = function () {
    return appForm.stores.mBaaS;
  };
  UploadTask.prototype.addFileTask = function (fileDef) {
    this.get('fileTasks').push(fileDef);
  };
  /**
   * get current uploading task
   * @return {[type]} [description]
   */
  UploadTask.prototype.getCurrentTask = function () {
    return this.get('currentTask', null);
  };
  UploadTask.prototype.getRetryAttempts = function () {
    return this.get('retryAttempts');
  };
  UploadTask.prototype.increRetryAttempts = function () {
    this.set('retryAttempts', this.get('retryAttempts') + 1);
  };
  UploadTask.prototype.resetRetryAttempts = function () {
    this.set('retryAttempts', 0);
  };
  UploadTask.prototype.isStarted = function () {
    return this.getCurrentTask() == null ? false : true;
  };
  /**
   * upload form submission
   * @param  {Function} cb [description]
   * @return {[type]}      [description]
   */
  UploadTask.prototype.uploadForm = function (cb) {
    var that = this;

    function processUploadDataResult(res){
      if(res.error){
        console.error("Error submitting form " + res.error);
        return cb("Error submitting form " + res.error);
      } else {
        var submissionId = res.submissionId;
        // form data submitted successfully.
        formSub.lastUpdate = appForm.utils.getTime();
        that.set('submissionId', submissionId);
        that.increProgress();
        that.saveLocal(function (err) {
          if (err) {
            console.error(err);
          }
        });
        that.emit('progress', that.getProgress());
        return cb(null);
      }
    }

    var formSub = this.get('jsonTask');

    var formSubmissionModel = new appForm.models.FormSubmission(formSub);
    this.getRemoteStore().create(formSubmissionModel, function (err, res) {
      if (err) {
        return cb(err);
      } else {
        var updatedFormDefinition = res.updatedFormDefinition;

        if (updatedFormDefinition) {
          // remote form definition is updated
          that.refreshForm(updatedFormDefinition, function (err) {
            //refresh form def in parallel. maybe not needed.
            console.log("Form Updated, refreshed");
            if (err) {
              console.error(err);
            }

            processUploadDataResult(res);
          });
        } else {
          processUploadDataResult(res);
        }
      }
    });
  };
  /**
   * Handles the case where a call to completeSubmission returns a status other than "completed".
   * Will only ever get to this function when a call is made to the completeSubmission server.
   *
   *
   * @param err (String) Error message associated with the error returned
   * @param res {"status" : <pending/error>, "pendingFiles" : [<any pending files not yet uploaded>]}
   * @param cb Function callback
   */
  UploadTask.prototype.handleCompletionError = function (err, res, cb) {
    var errorMessage = err;
    if (res.status === 'pending') {
      //The submission is not yet complete, there are files waiting to upload. This is an unexpected state as all of the files should have been uploaded.
      errorMessage = 'Submission Still Pending.';
    } else if (res.status === 'error') {
      //There was an error completing the submission.
      errorMessage = 'Error completing submission';
    } else {
      errorMessage = 'Invalid return type from complete submission';
    }
    cb(errorMessage);
  };
  /**
   * Handles the case where the current submission status is required from the server.
   * Based on the files waiting to be uploaded, the upload task is re-built with pendingFiles from the server.
   *
   * @param cb
   */
  UploadTask.prototype.handleIncompleteSubmission = function (cb) {
    var remoteStore = this.getRemoteStore();
    var submissionStatus = new appForm.models.FormSubmissionStatus(this);
    var that = this;
    remoteStore.submissionStatus(submissionStatus, function (err, res) {
      var errMessage="";
      if (err) {
        cb(err);
      } else if (res.status === 'error') {
        //The server had an error submitting the form, finish with an error
         errMessage= 'Error submitting form.';
        cb(errMessage);
      } else if (res.status === 'complete') {
        //Submission is complete, make uploading progress further
        that.increProgress();
        cb();
      } else if (res.status === 'pending') {
        //Submission is still pending, check for files not uploaded yet.
        var pendingFiles = res.pendingFiles || [];
        if (pendingFiles.length > 0) {
          that.resetUploadTask(pendingFiles, function () {
            cb();
          });
        } else {
          //No files pending on the server, make the progress further
          that.increProgress();
          cb();
        }
      } else {
        //Should not get to this point. Only valid status responses are error, pending and complete.
        errMessage = 'Invalid submission status response.';
        cb(errMessage);
      }
    });
  };
  /**
   * Resetting the upload task based on the response from getSubmissionStatus
   * @param pendingFiles -- Array of files still waiting to upload
   * @param cb
   */
  UploadTask.prototype.resetUploadTask = function (pendingFiles, cb) {
    var filesToUpload = this.get('fileTasks');
    var resetFilesToUpload = [];
    var fileIndex;
    //Adding the already completed files to the reset array.
    for (fileIndex = 0; fileIndex < filesToUpload.length; fileIndex++) {
      if (pendingFiles.indexOf(filesToUpload[fileIndex].hashName) < 0) {
        resetFilesToUpload.push(filesToUpload[fileIndex]);
      }
    }
    //Adding the pending files to the end of the array.
    for (fileIndex = 0; fileIndex < filesToUpload.length; fileIndex++) {
      if (pendingFiles.indexOf(filesToUpload[fileIndex].hashName) > -1) {
        resetFilesToUpload.push(filesToUpload[fileIndex]);
      }
    }
    var resetFileIndex = filesToUpload.length - pendingFiles.length - 1;
    var resetCurrentTask = 0;
    if (resetFileIndex > 0) {
      resetCurrentTask = resetFileIndex;
    }
    //Reset current task
    this.set('currentTask', resetCurrentTask);
    this.set('fileTasks', resetFilesToUpload);
    this.saveLocal(cb);  //Saving the reset files list to local
  };
  UploadTask.prototype.uploadFile = function (cb) {
    var that = this;
    var submissionId = this.get('submissionId');
    if (submissionId) {
      var progress = this.getCurrentTask();
      if (progress == null) {
        progress = 0;
        that.set('currentTask', progress);
      }
      var fileTask = this.get('fileTasks', [])[progress];
      if (!fileTask) {
        return cb('cannot find file task');
      }
      var fileSubmissionModel;
      if (fileTask.contentType == 'base64') {
        fileSubmissionModel = new appForm.models.Base64FileSubmission(fileTask);
      } else {
        fileSubmissionModel = new appForm.models.FileSubmission(fileTask);
      }
      fileSubmissionModel.setSubmissionId(submissionId);
      fileSubmissionModel.loadFile(function (err) {
        if (err) {
          return cb(err);
        } else {
          that.getRemoteStore().create(fileSubmissionModel, function (err, res) {
            if (err) {
              cb(err);
            } else {
              if (res.status == 'ok' || res.status == '200') {
                fileTask.updateDate = appForm.utils.getTime();
                that.increProgress();
                that.saveLocal(function (err) {
                  //save current status.
                  if (err) {
                    console.error(err);
                  }
                });
                that.emit('progress', that.getProgress());
                cb(null);
              } else {
                var errorMessage = 'File upload failed for file: ' + fileTask.fileName;
                cb(errorMessage);
              }
            }
          });
        }
      });
    } else {
      cb('Failed to upload file. Submission Id not found.');
    }
  };
  //The upload task needs to be retried
  UploadTask.prototype.setRetryNeeded = function (retryNeeded) {
    //If there is a submissionId, then a retry is needed. If not, then the current task should be set to null to retry the submission.
    if (this.get('submissionId', null) != null) {
      this.set('retryNeeded', retryNeeded);
    } else {
      this.set('retryNeeded', false);
      this.set('currentTask', null);
    }
  };
  UploadTask.prototype.retryNeeded = function () {
    return this.get('retryNeeded');
  };
  UploadTask.prototype.uploadTick = function (cb) {
    var that = this;
    function _handler(err) {
      if (err) {
        console.error('Err, retrying:', err);
        //If the upload has encountered an error -- flag the submission as needing a retry on the next tick -- User should be insulated from an error until the retries are finished.
        that.increRetryAttempts();
        if (that.getRetryAttempts() <= $fh.forms.config.get('max_retries')) {
          that.setRetryNeeded(true);
          that.saveLocal(function (err) {
            if (err)
              console.error(err);
            cb();
          });
        } else {
          //The number of retry attempts exceeds the maximum number of retry attempts allowed, flag the upload as an error.
          that.setRetryNeeded(true);
          that.resetRetryAttempts();
          that.error(err, function () {
            cb(err);
          });
        }
      } else {
        //no error.
        that.setRetryNeeded(false);
        that.saveLocal(function (_err) {
          if (_err)
            console.error(_err);
        });
        that.submissionModel(function (err, submission) {
          if (err) {
            cb(err);
          } else {
            var status = submission.get('status');
            if (status != 'inprogress' && status != 'submitted') {
              cb('Submission status is incorrect. Upload task should be started by submission object\'s upload method.');
            } else {
              cb();
            }
          }
        });
      }
    }
    if (!this.isFormCompleted()) {
      // No current task, send the form json
      this.uploadForm(_handler);
    } else if (this.retryNeeded()) {
      //If a retry is needed, this tick gets the current status of the submission from the server and resets the submission.
      this.handleIncompleteSubmission(_handler);
    } else if (!this.isFileCompleted()) {
      //files to be uploaded
      this.uploadFile(_handler);
    } else if (!this.isMBaaSCompleted()) {
      //call mbaas to complete upload
      this.uploadComplete(_handler);
    } else if (!this.isCompleted()) {
      //complete the upload task
      this.success(_handler);
    } else {
      //task is already completed.
      _handler(null, null);
    }
  };
  UploadTask.prototype.increProgress = function () {
    var curTask = this.getCurrentTask();
    if (curTask === null) {
      curTask = 0;
    } else {
      curTask++;
    }
    this.set('currentTask', curTask);
  };
  UploadTask.prototype.uploadComplete = function (cb) {
    var submissionId = this.get('submissionId', null);
    var that = this;
    if (submissionId === null) {
      return cb('Failed to complete submission. Submission Id not found.');
    }
    var remoteStore = this.getRemoteStore();
    var completeSubmission = new appForm.models.FormSubmissionComplete(this);
    remoteStore.create(completeSubmission, function (err, res) {
      //if status is not "completed", then handle the completion err
      res = res || {};
      if (res.status !== 'complete') {
        return that.handleCompletionError(err, res, cb);
      }
      //Completion is now completed sucessfully.. we can make the progress further.
      that.increProgress();
      cb(null);
    });
  };
  /**
   * the upload task is successfully completed. This will be called when all uploading process finished successfully.
   * @return {[type]} [description]
   */
  UploadTask.prototype.success = function (cb) {
    var that = this;
    that.set('completed', true);
    that.saveLocal(function (err) {
      if (err) {
        console.error(err);
        console.error('Upload task save failed');
      }
    });
    that.submissionModel(function (_err, model) {
      if (_err) {
        cb(_err);
      } else {
        model.submitted(cb);
      }
    });
  };
  /**
   * the upload task is failed. It will not complete the task but will set error with error returned.
   * @param  {[type]}   err [description]
   * @param  {Function} cb  [description]
   * @return {[type]}       [description]
   */
  UploadTask.prototype.error = function (err, cb) {
    this.set('error', err);
    this.saveLocal(function (err) {
      if (err) {
        console.error(err);
        console.error('Upload task save failed');
      }
    });
    this.submissionModel(function (_err, model) {
      if (_err) {
        cb(_err);
      } else {
        model.error(err, function () {
        });
        cb(err);
      }
    });
  };
  UploadTask.prototype.isFormCompleted = function () {
    var curTask = this.getCurrentTask();
    if (curTask === null) {
      return false;
    } else {
      return true;
    }
  };
  UploadTask.prototype.isFileCompleted = function () {
    var curTask = this.getCurrentTask();
    if (curTask === null) {
      return false;
    } else if (curTask < this.get('fileTasks', []).length) {
      return false;
    } else {
      return true;
    }
  };
  UploadTask.prototype.isError = function () {
    var error = this.get('error', null);
    if (error) {
      return true;
    } else {
      return false;
    }
  };
  UploadTask.prototype.isCompleted = function () {
    return this.get('completed', false);
  };
  UploadTask.prototype.isMBaaSCompleted = function () {
    if (!this.isFileCompleted()) {
      return false;
    } else {
      var curTask = this.getCurrentTask();
      if (curTask > this.get('fileTasks', []).length) {
        //change offset if completion bit is changed
        return true;
      } else {
        return false;
      }
    }
  };
  UploadTask.prototype.getProgress = function () {
    var rtn = {
        'formJSON': false,
        'currentFileIndex': 0,
        'totalFiles': this.get('fileTasks').length,
        'totalSize': this.getTotalSize(),
        'uploaded': this.getUploadedSize(),
        'retryAttempts': this.getRetryAttempts()
      };
    var progress = this.getCurrentTask();
    if (progress === null) {
      return rtn;
    } else {
      rtn.formJSON = true;
      rtn.currentFileIndex = progress;
    }
    return rtn;
  };
  /**
   * Refresh related form definition.
   * @param  {Function} cb [description]
   * @return {[type]}      [description]
   */
  UploadTask.prototype.refreshForm = function (updatedForm, cb) {
    var formId = this.get('formId');
    new appForm.models.Form({'formId': formId, 'rawMode': true, 'rawData' : updatedForm }, function (err, form) {
      if (err) {
        console.error(err);
      }

      console.log('successfully updated form the form with id ' + updatedForm._id);
      cb();
    });
  };
  UploadTask.prototype.submissionModel = function (cb) {
    appForm.models.submission.fromLocal(this.get('submissionLocalId'), function (err, submission) {
      if (err) {
        console.error(err);
      }
      cb(err, submission);
    });
  };
  return module;
}(appForm.models || {});
appForm.models = function (module) {
  var Model = appForm.models.Model;
  function Theme() {
    Model.call(this, {
      '_type': 'theme',
      '_ludid': 'theme_object'
    });
  }
  Theme.prototype.getCSS = function () {
    return this.get('css', '');
  };
  appForm.utils.extend(Theme, Model);
  module.theme = new Theme();
  return module;
}(appForm.models || {});
/**
 * Async log module
 * @param  {[type]} module [description]
 * @return {[type]}        [description]
 */
appForm.models = (function(module) {
  var Model = appForm.models.Model;

  function Log() {
    Model.call(this, {
      '_type': 'log',
      "_ludid": "log"
    });
    this.set("logs", []);
    this.isWriting = false;
    this.moreToWrite = false;
    //    appForm.
    //    this.loadLocal(function() {});
  }
  appForm.utils.extend(Log, Model);

  Log.prototype.info = function(logLevel, msgs) {
    if ($fh.forms.config.get("logger") == "true") {
      var levelString = "";
      var curLevel = $fh.forms.config.get("log_level");
      var log_levels = $fh.forms.config.get("log_levels");
      var self = this;
      if (typeof logLevel == "string") {
        levelString = logLevel;
        logLevel = log_levels.indexOf(logLevel.toLowerCase());
      } else {
        levelString = log_levels[logLevel];
        if (logLevel >= log_levels.length) {
          levelString = "Unknown";
        }
      }
      if (curLevel < logLevel) {
        return;
      } else {
        var args = Array.prototype.splice.call(arguments, 0);
        var logs = self.get("logs");
        args.shift();
        while (args.length > 0) {
          logs.push(self.wrap(args.shift(), levelString));
          if (logs.length > $fh.forms.config.get("log_line_limit")) {
            logs.shift();
          }
        }
        if (self.isWriting) {
          self.moreToWrite = true;
        } else {
          var _recursiveHandler = function() {
            if (self.moreToWrite) {
              self.moreToWrite = false;
              self.write(_recursiveHandler);
            }
          };
          self.write(_recursiveHandler);
        }
      }
    }
  };
  Log.prototype.wrap = function(msg, levelString) {
    var now = new Date();
    var dateStr = now.toISOString();
    if (typeof msg == "object") {
      msg = JSON.stringify(msg);
    }
    var finalMsg = dateStr + " " + levelString.toUpperCase() + " " + msg;
    return finalMsg;
  };
  Log.prototype.getPolishedLogs = function() {
    var arr = [];
    var logs = this.getLogs();
    var patterns = [{
      reg: /^.+\sERROR\s.*/,
      color: $fh.forms.config.get('color_error') || "#FF0000"
    }, {
      reg: /^.+\sWARNING\s.*/,
      color: $fh.forms.config.get('color_warning') || "#FF9933"
    }, {
      reg: /^.+\sLOG\s.*/,
      color: $fh.forms.config.get('color_log') || "#009900"
    }, {
      reg: /^.+\sDEBUG\s.*/,
      color: $fh.forms.config.get('color_debug') || "#3366FF"
    }, {
      reg: /^.+\sUNKNOWN\s.*/,
      color: $fh.forms.config.get('color_unknown') || "#000000"
    }];
    for (var i = 0; i < logs.length; i++) {
      var log = logs[i];
      for (var j = 0; j < patterns.length; j++) {
        var p = patterns[j];
        if (p.reg.test(log)) {
          arr.unshift("<div style='color:" + p.color + ";'>" + log + "</div>");
          break;
        }
      }
    }
    return arr;
  };
  Log.prototype.write = function(cb) {
    var self = this;
    self.isWriting = true;
    self.saveLocal(function() {
      self.isWriting = false;
      cb();
    });
  };
  Log.prototype.e = function() {
    var args = Array.prototype.splice.call(arguments, 0);
    args.unshift("error");
    this.info.apply(this, args);
  };
  Log.prototype.w = function() {
    var args = Array.prototype.splice.call(arguments, 0);
    args.unshift("warning");
    this.info.apply(this, args);
  };
  Log.prototype.l = function() {
    var args = Array.prototype.splice.call(arguments, 0);
    args.unshift("log");
    this.info.apply(this, args);
  };
  Log.prototype.d = function() {
    var args = Array.prototype.splice.call(arguments, 0);
    args.unshift("debug");
    this.info.apply(this, args);
  };
  Log.prototype.getLogs = function() {
    return this.get("logs");
  };
  Log.prototype.clearLogs = function(cb) {
    this.set("logs", []);
    this.saveLocal(function() {
      if (cb) {
        cb();
      }
    });
  };
  Log.prototype.sendLogs = function(cb) {
    var email = $fh.forms.config.get("log_email");
    var config = appForm.config.getProps();
    var logs = this.getLogs();
    var params = {
      "type": "email",
      "to": email,
      "subject": "App Forms App Logs",
      "body": "Configuration:\n" + JSON.stringify(config) + "\n\nApp Logs:\n" + logs.join("\n")
    };
    appForm.utils.send(params, cb);
  };
  module.log = new Log();
  appForm.log = module.log;
  return module;
})(appForm.models || {});
/**
 * FeedHenry License
 */
appForm.api = function (module) {
  module.getForms = getForms;
  module.getForm = getForm;
  module.getTheme = getTheme;
  module.submitForm = submitForm;
  module.getSubmissions = getSubmissions;
  module.init = appForm.init;
  module.log=appForm.models.log;
  var _submissions = null;
  var formConfig = appForm.models.config;

  /**
   * Get and set config values. Can only set a config value if you are an config_admin_user
   */
  var configInterface = {
    "editAllowed" : function(){
      var defaultConfigValues = formConfig.get("defaultConfigValues", {});
      return defaultConfigValues["config_admin_user"] === true;
    },
    "get" : function(key){
      var self = this;
      if(key){
        var userConfigValues = formConfig.get("userConfigValues", {});
        var defaultConfigValues = formConfig.get("defaultConfigValues", {});


        if(userConfigValues[key]){
          return userConfigValues[key];
        } else {
          return defaultConfigValues[key];
        }

      }
    },
    "set" : function(key, val){
      var self = this;
      if(!key || !val){
        return;
      }

      if(self.editAllowed() || key === "max_sent_saved"){
        var userConfig = formConfig.get("userConfigValues", {});
        userConfig[key] = val;
        formConfig.set("userConfigValues", userConfig);
      }

    },
    "getConfig" : function(){
      var self = this;
      var defaultValues = formConfig.get("defaultConfigValues", {});
      var userConfigValues = formConfig.get("userConfigValues", {});
      var returnObj = {};

      if(self.editAllowed()){
        for(var defKey in defaultValues){
          if(userConfigValues[defKey]){
            returnObj[defKey] = userConfigValues[defKey];
          } else {
            returnObj[defKey] = defaultValues[defKey];
          }
        }
        return returnObj;
      } else {
        return defaultValues;
      }
    },
    "saveConfig": function(){
      var self = this;
      formConfig.saveLocal(function(err, configModel){
        if(err){
          $fh.forms.log.e("Error saving a form config: ", err);
        }else{
          $fh.forms.log.l("Form config saved sucessfully.");
        }

      });
    }
  };

  module.config = configInterface;


  /**
     * Retrieve forms model. It contains forms list. check forms model usage
     * @param  {[type]}   params {fromRemote:boolean}
     * @param  {Function} cb    (err, formsModel)
     * @return {[type]}          [description]
     */
  function getForms(params, cb) {
    var fromRemote = params.fromRemote;
    if (fromRemote === undefined) {
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
  function getTheme(params, cb) {
    var theme = appForm.models.theme;
    if (!params.fromRemote) {
      params.fromRemote = false;
    }
    theme.refresh(params.fromRemote, function (err, updatedTheme) {
      if (err)
        return cb(err);
      if (updatedTheme === null) {
        return cb(new Error('No theme defined for this app'));
      }
      if (params.css === true) {
        return cb(null, theme.getCSS());
      } else {
        return cb(null, theme);
      }
    });
  }
  /**
     * Get submissions that are submitted. I.e. submitted and complete.
     * @param params {}
     * @param {Function} cb     (err, submittedArray)
     */
  function getSubmissions(params, cb) {
    //Getting submissions that have been completed.
    var submissions = appForm.models.submissions;
    if (_submissions == null) {
      appForm.models.submissions.loadLocal(function (err) {
        if (err) {
          console.error(err);
          cb(err);
        } else {
          _submissions = appForm.models.submissions;
          cb(null, _submissions);
        }
      });
    } else {
      cb(null, _submissions);
    }
  }
  function submitForm(submission, cb) {
    if (submission) {
      submission.submit(function (err) {
        if (err)
          return cb(err);
        //Submission finished and validated. Now upload the form
        submission.upload(cb);
      });
    } else {
      return cb('Invalid submission object.');
    }
  }
  return module;
}(appForm.api || {});
//mockup $fh apis for Addons.
if (typeof $fh == 'undefined') {
  $fh = {};
}
if ($fh.forms === undefined) {
  $fh.forms = appForm.api;
}
/*! fh-forms - v0.2.53 -  */
/*! async - v0.2.9 -  */
/*! 2014-03-27 */
/* This is the prefix file */
if(appForm){
  appForm.RulesEngine=rulesEngine;
}

function rulesEngine (formDef) {
  var define = {};
  var module = {exports:{}}; // create a module.exports - async will load into it
  /* jshint ignore:start */
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
  /* jshint ignore:end */
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
    var FIELD_TYPE_DATETIME_DATETIMEUNIT_DATETIME = "datetime";

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
        "number":       validatorNumericString,
        "emailAddress": validatorEmail,
        "dropdown":     validatorDropDown,
        "radio":        validatorDropDown,
        "checkboxes":   validatorCheckboxes,
        "location":     validatorLocation,
        "locationMap":  validatorLocationMap,
        "photo":        validatorFile,
        "signature":    validatorFile,
        "file":         validatorFile,
        "dateTime":     validatorDateTime,
        "url":          validatorString,
        "sectionBreak": validatorSection
      };

      var validatorsClientMap = {
        "text":         validatorString,
        "textarea":     validatorString,
        "number":       validatorNumericString,
        "emailAddress": validatorEmail,
        "dropdown":     validatorDropDown,
        "radio":        validatorDropDown,
        "checkboxes":   validatorCheckboxes,
        "location":     validatorLocation,
        "locationMap":  validatorLocationMap,
        "photo":        validatorAnyFile,
        "signature":    validatorAnyFile,
        "file":         validatorAnyFile,
        "dateTime":     validatorDateTime,
        "url":          validatorString,
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

            field.fieldOptions = field.fieldOptions ? field.fieldOptions : {};
            field.fieldOptions.definition = field.fieldOptions.definition ? field.fieldOptions.definition : {};
            field.fieldOptions.validation = field.fieldOptions.validation ? field.fieldOptions.validation : {};

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
              checkIfRequiredFieldsNotSubmitted
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
                resField.fieldErrorMessage = ["Required Field Not Submitted"];
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
      function validateFieldValue(fieldId, inputValue, valueIndex, cb) {
        if ("function" === typeof valueIndex) {
          cb = valueIndex;
          valueIndex = 0;
        }

        init(function(err){
          if (err) return cb(err);
          var fieldDefinition = fieldMap[fieldId];

          var required = false;
          if(fieldDefinition.repeating &&
            fieldDefinition.fieldOptions &&
            fieldDefinition.fieldOptions.definition &&
            fieldDefinition.fieldOptions.definition.minRepeat) {
            required = (valueIndex < fieldDefinition.fieldOptions.definition.minRepeat);
          } else {
            required = fieldDefinition.required;
          }

          var validation = (fieldDefinition.fieldOptions && fieldDefinition.fieldOptions.validation) ? fieldDefinition.fieldOptions.validation : undefined;

          if(! validation || ! validation.validateImmediately){
            var ret = {validation: {}};
            ret.validation[fieldId] = {"valid":true};
            return cb(undefined, ret );
          }

          if(fieldEmpty(inputValue)) {
            if(required) {
              return formatResponse("No value specified for required input", cb);
            } else {
              return formatResponse(undefined, cb);  // optional field not supplied is valid
            }
          }

          // not empty need to validate
          getClientValidatorFunction(fieldDefinition.type, function (err, validator) {
            if (err) return cb(err);

            validator(inputValue, fieldDefinition, undefined, function (err) {
              var message;
              if(err) {
                if(err.message) {
                  message = err.message;
                } else {
                  message = "Unknown error message";
                }
              }
              formatResponse(message, cb);
            });
          });
        });

        function formatResponse(msg, cb) {
          var messages = {errorMessages: []};
          if(msg) {
            messages.errorMessages.push(msg);
          }
          return createValidatorResponse(fieldId, messages, function (err, res) {
            if (err) return cb(err);
            var ret = {validation: {}};
            ret.validation[fieldId] = res;
            return cb(undefined, ret);
          });
        }
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

      function getMapFunction(key, map, cb) {
        var validator = map[key];
        if (!validator) {
          return cb(new Error("Invalid Field Type " + key));
        }

        return cb(undefined, validator);
      }

      function getValidatorFunction(fieldType, cb) {
        return getMapFunction(fieldType, validatorsMap, cb);
      }

      function getClientValidatorFunction(fieldType, cb) {
        return getMapFunction(fieldType, validatorsClientMap, cb);
      }

      function fieldEmpty(fieldValue) {
        return ('undefined' === typeof fieldValue || null === fieldValue || "" === fieldValue); // empty string also regarded as not specified
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
          if(! fieldDefinition.required) return cb(undefined, null);
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

          if(fieldDefinition.repeating && fieldDefinition.fieldOptions && fieldDefinition.fieldOptions.definition){
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
            if (err) return cb(err);
            async.map(submittedField.fieldValues, function(fieldValue, cb){
              if(fieldEmpty(fieldValue)) {
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

      function convertSimpleFormatToRegex(field_format_string) {
        var regex = "^";
        var C = "c".charCodeAt(0);
        var N = "n".charCodeAt(0);

        var i;
        var ch;
        var match;
        var len = field_format_string.length;
        for (i = 0; i < len; i += 1) {
          ch = field_format_string.charCodeAt(i);
          switch (ch) {
            case C:
              match = "[a-zA-Z0-9]";
              break;
            case N:
              match = "[0-9]";
              break;
            default:
              var num = ch.toString(16).toUpperCase();
              match = "\\u" + ("0000" + num).substr(-4);
              break;
          }
          regex += match;
        }
        return regex + "$";
      }

      function validFormatRegex(fieldValue, field_format_string) {
        var pattern = new RegExp(field_format_string);
        return pattern.test(fieldValue);
      }

      function validFormat(fieldValue, field_format_mode, field_format_string) {
        var regex;
        if ("simple" === field_format_mode) {
          regex = convertSimpleFormatToRegex(field_format_string);
        } else if ("regex" === field_format_mode) {
          regex = field_format_string;
        } else { // should never be anything else, but if it is then default to simple format
          regex = convertSimpleFormatToRegex(field_format_string);
        }

        return validFormatRegex(fieldValue, regex);
      }

      function validatorString (fieldValue, fieldDefinition, previousFieldValues, cb) {
        if(typeof fieldValue !== "string"){
          return cb(new Error("Expected string but got " + typeof(fieldValue)));
        }

        var validation = {};
        if (fieldDefinition && fieldDefinition.fieldOptions && fieldDefinition.fieldOptions.validation) {
          validation = fieldDefinition.fieldOptions.validation;
        }

        var field_format_mode = validation.field_format_mode || "";
        field_format_mode = field_format_mode.trim();
        var field_format_string = validation.field_format_string || "";
        field_format_string = field_format_string.trim();

        if (field_format_string && (field_format_string.length > 0) && field_format_mode && (field_format_mode.length > 0)) {
          if(!validFormat(fieldValue, field_format_mode, field_format_string)) {
            return cb(new Error("field value in incorrect format, expected format: " + field_format_string + " but submission value is: " + fieldValue));
          }
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

      function validatorNumericString (fieldValue, fieldDefinition, previousFieldValues, cb) {
        var testVal = (fieldValue - 0);  // coerce to number (or NaN)
        var numeric = (testVal == fieldValue); // testVal co-erced to numeric above, so numeric comparison and NaN != NaN
        if(!numeric) {
          return cb(new Error("Expected numeric but got: " + fieldValue));
        }

        return validatorNumber(testVal, fieldDefinition, previousFieldValues, cb);
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
          return cb(new Error("Expected string but got " + typeof(fieldValue)));
        }

        if(fieldValue.match(/[-0-9a-zA-Z.+_]+@[-0-9a-zA-Z.+_]+\.[a-zA-Z]{2,4}/g) === null){
          return cb(new Error("Invalid email address format: " + fieldValue));
        } else {
          return cb();
        }
      }

      function validatorDropDown (fieldValue, fieldDefinition, previousFieldValues, cb) {
        if(typeof(fieldValue) !== "string"){
          return cb(new Error("Expected submission to be string but got " + typeof(fieldValue)));
        }

        //Check value exists in the field definition
        if(!fieldDefinition.fieldOptions.definition.options){
          return cb(new Error("No options exist for field " + fieldDefinition.name));
        }

        async.some(fieldDefinition.fieldOptions.definition.options, function (dropdownOption, cb) {
          return cb(dropdownOption.label === fieldValue);
        }, function (found) {
          if (!found) {
            return cb(new Error("Invalid option specified: " + fieldValue));
          } else {
            return cb();
          }
        });
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

        async.eachSeries(fieldDefinition.fieldOptions.definition.options, function(choice, cb){
          for(var choiceName in choice){
            optionsInCheckbox.push(choice[choiceName]);
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

      function validatorLocationMap (fieldValue, fieldDefinition, previousFieldValues, cb) {
        if(fieldValue.lat && fieldValue["long"]) {
          if(isNaN(parseFloat(fieldValue.lat)) || isNaN(parseFloat(fieldValue["long"]))) {
            return cb(new Error("Invalid latitude and longitude values"));
          } else {
            return cb();
          }
        } else {
          return cb(new Error("Invalid object for locationMap submission"));
        }
      }


      function validatorLocation (fieldValue, fieldDefinition, previousFieldValues, cb) {
        if(fieldDefinition.fieldOptions.definition.locationUnit === "latlong") {
          if(fieldValue.lat && fieldValue["long"]){
            if(isNaN(parseFloat(fieldValue.lat)) || isNaN(parseFloat(fieldValue["long"]))){
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
          if(typeof(fieldValue.zone) !== "string" || fieldValue.zone.length === 0){
            return cb(new Error("Invalid zone definition for northings and eastings location. " + fieldValue.zone));
          }

          var east = parseInt(fieldValue.eastings,10);
          if(isNaN(east)){
            return cb(new Error("Invalid eastings definition for northings and eastings location. " + fieldValue.eastings));
          }

          var north = parseInt(fieldValue.northings, 10);
          if(isNaN(north)){
            return cb(new Error("Invalid northings definition for northings and eastings location. " + fieldValue.northings));
          }

          return cb();
        }
      }

      function validatorAnyFile(fieldValue, fieldDefinition, previousFieldValues, cb) {
        // if any of the following validators return ok, then return ok.
        validatorBase64(fieldValue, fieldDefinition, previousFieldValues, function (err) {
          if(!err) {
            return cb();
          }
          validatorFile(fieldValue, fieldDefinition, previousFieldValues, function (err) {
            if(!err) {
              return cb();
            }
            validatorFileObj(fieldValue, fieldDefinition, previousFieldValues, function (err) {
              if(!err) {
                return cb();
              }
              return cb(err);
            });
          });
        });
      }

      function validatorFile (fieldValue, fieldDefinition, previousFieldValues, cb) {
        if(typeof fieldValue !== "object"){
          return cb(new Error("Expected object but got " + typeof(fieldValue)));
        }

        var keyTypes = [
          { keyName: "fileName", valueType: "string" },
          { keyName: "fileSize", valueType: "number" },
          { keyName: "fileType", valueType: "string" },
          { keyName: "fileUpdateTime", valueType: "number" },
          { keyName: "hashName", valueType: "string" }
        ];

        async.each(keyTypes, function (keyType, cb) {
          var actualType = typeof fieldValue[keyType.keyName];
          if (actualType !== keyType.valueType) {
            return cb(new Error("Expected " + keyType.valueType + " but got " + actualType));
          }
          if (keyType.keyName === "fileName" && fieldValue[keyType.keyName].length <=0) {
            return cb(new Error("Expected value for " + keyType.keyName));
          }

          return cb();
        }, function (err) {
          if (err) return cb(err);

          if(fieldValue.hashName.indexOf("filePlaceHolder") > -1){ //TODO abstract out to config
            return cb();
          } else if (previousFieldValues && previousFieldValues.hashName && previousFieldValues.hashName.indexOf(fieldValue.hashName) > -1){
            return cb();
          } else {
            return cb(new Error("Invalid file placeholder text" + fieldValue.hashName));
          }

        });
      }

      function validatorFileObj (fieldValue, fieldDefinition, previousFieldValues, cb) {
        if((typeof File !== "function") || !(fieldValue instanceof File)) {
          return cb(new Error("Expected File object but got " + typeof(fieldValue)));
        }

        var keyTypes = [
          { keyName: "name", valueType: "string" },
          { keyName: "size", valueType: "number" }
        ];

        async.each(keyTypes, function (keyType, cb) {
          var actualType = typeof fieldValue[keyType.keyName];
          if (actualType !== keyType.valueType) {
            return cb(new Error("Expected " + keyType.valueType + " but got " + actualType));
          }
          if (actualType === "string" && fieldValue[keyType.keyName].length <=0) {
            return cb(new Error("Expected value for " + keyType.keyName));
          }
          if (actualType === "number" && fieldValue[keyType.keyName] <=0) {
            return cb(new Error("Expected > 0 value for " + keyType.keyName));
          }

          return cb();
        }, function (err) {
          if (err) return cb(err);
          return cb();
        });

      }

      function validatorBase64 (fieldValue, fieldDefinition, previousFieldValues, cb) {
        if(typeof fieldValue !== "string"){
          return cb(new Error("Expected base64 string but got " + typeof(fieldValue)));
        }

        if(fieldValue.length <= 0){
          return cb(new Error("Expected base64 string but was empty"));
        }

        return cb();
      }

      function validatorDateTime  (fieldValue, fieldDefinition, previousFieldValues, cb) {
        var testDate;

        if(typeof(fieldValue) !== "string"){
          return cb(new Error("Expected string but got " + typeof(fieldValue)));
        }

        switch (fieldDefinition.fieldOptions.definition.datetimeUnit)
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
            return cb(new Error("Invalid dateTime fieldtype " + fieldDefinition.fieldOptions.definition.datetimeUnit));
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
            var condition;
            var testValue;
            if (submissionFieldsMap[ruleConditionalStatement.sourceField] && submissionFieldsMap[ruleConditionalStatement.sourceField].fieldValues) {
              submissionValues = submissionFieldsMap[ruleConditionalStatement.sourceField].fieldValues;
              condition = ruleConditionalStatement.restriction;
              testValue = ruleConditionalStatement.sourceValue;

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
      var fieldOptions = field.fieldOptions ? field.fieldOptions : {};

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
          switch (fieldOptions.definition.datetimeUnit)
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
          switch (fieldOptions.definition.datetimeUnit)
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
          switch (fieldOptions.definition.datetimeUnit)
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
}

/* End of suffix file */


//end  module;

//this is partial file which define the end of closure
})(window || module.exports);


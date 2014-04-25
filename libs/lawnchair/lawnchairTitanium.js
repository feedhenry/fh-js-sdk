Lawnchair.adapter('titanium', (function(global){

    return {
        // boolean; true if the adapter is valid for the current environment
        valid: function() {
            return typeof Titanium !== 'undefined';
        },

        // constructor call and callback. 'name' is the most common option
        init: function( options, callback ) {
          if (callback){
            return this.fn('init', callback).call(this)
          }
        },

        // returns all the keys in the store
        keys: function( callback ) {
          if (callback) {
            return this.fn('keys', callback).call(this, Titanium.App.Properties.listProperties());
          }
          return this;
        },

        // save an object
        save: function( obj, callback ) {
            var saveRes = Titanium.App.Properties.setObject(obj.key, obj);
            if (callback) {
              return this.fn('save', callback).call(this, saveRes);
            }
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
                return this.fn('init', callback).call(this, Titanium.App.Properties.getObject(key));
            }
            return this;
        },

        // check if an obj exists in the collection
        exists: function( key, callback ) {
            if (callback){
              if (Titanium.App.Properties.getObject(key)){
                return callback(this, true);
              }else{
                return callback(this, false);
              }
            }

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
            Titanium.App.Properties.removeProperty(key);
            if (callback) {
              return this.fn('remove', callback).call(this);
            }
            return this;
        },

        // destroy everything
        nuke: function( callback ) {
            // nah, lets not do that
        }
    };
}(this)));

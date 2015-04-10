var Lawnchair = require('../../libs/generated/lawnchair');
var lawnchairext = require('./lawnchair-ext');
var logger = require('./logger');
var constants = require("./constants");

var data = {
  //dom adapter doens't work on windows phone, so don't specify the adapter if the dom one failed
  //we specify the order of lawnchair adapters to use, lawnchair will find the right one to use, to keep backward compatibility, keep the order
  //as dom, webkit-sqlite, localFileStorage, window-name
  DEFAULT_ADAPTERS : ["dom", "webkit-sqlite", "window-name"],
  getStorage: function(name, adapters, fail){
    var adpts = data.DEFAULT_ADAPTERS;
    var errorHandler = fail || function(){};
    if(adapters && adapters.length > 0){
      adpts = (typeof adapters === 'string'?[adapters]: adapters);
    }
    var conf = {
      name: name,
      adapters: adpts,
      fail: function(msg, err){
        var error_message = 'read/save from/to local storage failed  msg:' + msg + ' err:' + err;
        logger.error(error_message, err);
        errorHandler(error_message, {});
      }
    };
    var store = Lawnchair(conf, function(){});
    return store;
  },
  addFileStorageAdapter: function(appProps, hashFunc){
    Lawnchair.adapter('localFileStorage', lawnchairext.fileStorageAdapter(appProps, hashFunc));
  },
  sessionManager: {
    read: function(cb){
      data.getStorage(constants.SESSION_TOKEN_STORAGE_NAME).get(constants.SESSION_TOKEN_KEY_NAME, function(session){
        if(cb){
          return cb(null, session);
        }
      });
    },
    exists: function(cb){
      data.getStorage(constants.SESSION_TOKEN_STORAGE_NAME).exists(constants.SESSION_TOKEN_KEY_NAME, function(exist){
        if(cb){
          return cb(null, exist);
        }
      });
    },
    remove: function(cb){
      data.getStorage(constants.SESSION_TOKEN_STORAGE_NAME).remove(constants.SESSION_TOKEN_KEY_NAME, function(){
        if(cb){
          return cb();
        }
      });
    },
    save: function(sessionToken, cb){
      data.getStorage(constants.SESSION_TOKEN_STORAGE_NAME).save({key: constants.SESSION_TOKEN_KEY_NAME, sessionToken: sessionToken}, function(obj){
        if(cb){
          return cb();
        }
      });
    }
  }
};

module.exports = data;
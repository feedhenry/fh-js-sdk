var findFHPath = require("./findFHPath");
var loadScript = require("./loadScript");
var Lawnchair = require('../../libs/generated/lawnchair');
var lawnchairext = require('./lawnchair-ext');
var consts = require("./constants");
var fhparams = require("./fhparams");
var ajax = require("./ajax");
var handleError = require("./handleError");
var console = require("console");
var JSON = require("JSON");
var hashFunc = require("./security/hash");
var appProps = require("./appProps");

var init = function(cb, app_props){
  if(arguments.length === 2 && typeof app_props === "object" && app_props.mode){
    appProps.setAppProps(app_props);
    return loadCloudProps(app_props, cb);
  } else {
    appProps.load(function(err, data){
      if(err) return cb(err);
      return loadCloudProps(data, cb);
    });
  }
}

var loadCloudProps = function(app_props, callback){
  //now we have app props, add the fileStorageAdapter
  lawnchairext.addAdapter(app_props, hashFunc);
  //dom adapter doens't work on windows phone, so don't specify the adapter if the dom one failed
  //we specify the order of lawnchair adapters to use, lawnchair will find the right one to use, to keep backward compatibility, keep the order
  //as dom, webkit-sqlite, localFileStorage, window-name
  var lcConf = {
    name: "fh_init_storage",
    adapter: ["dom", "webkit-sqlite", "localFileStorage", "window-name"],
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
    //shoudn't go in here anymore
    lcConf.adapter = undefined;
    storage = new Lawnchair(lcConf, function() {});
  }

  var path = app_props.host + consts.boxprefix + "app/init";
  
  storage.get('fh_init', function(storage_res) {
    var savedHost = null;
    if (storage_res && storage_res.value !== null && storage_res !== "") {
      storage_res = typeof(storage_res) === "string" ? JSON.parse(storage_res) : storage_res;
      storage_res.value = typeof(storage_res.value) === "string" ? JSON.parse(storage_res.value): storage_res.value;
      if(storage_res.value.init){
        app_props.init = storage_res.value.init;
      } else {
        //keep it backward compatible.
        app_props.init = typeof(storage_res.value) === "string" ? JSON.parse(storage_res.value) : storage_res.value;
      }
      if(storage_res.value.hosts){
        savedHost = storage_res.value;
      }
    }
    var data = fhparams.buildFHParams();

    ajax(
      {
        "url": path,
        "type": "POST",
        "tryJSONP": true,
        "dataType": "json",
        "contentType": "application/json",
        "data": JSON.stringify(data),
        "timeout": app_props.timeout || consts.fh_timeout,
        "success": function(initRes) {
          storage.save({
            key: "fh_init",
            value: initRes
          }, function() {
          });
          if(callback) {
            callback(null, {cloud: initRes});
          }
        },
        "error": function(req, statusText, error) {
          //use the cached host if we have a copy
          if(savedHost){
            if(callback){
              callback(null, {cloud: savedHost});
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
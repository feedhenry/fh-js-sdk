var findFHPath = require("./findFHPath");
var loadScript = require("./loadScript");
var Lawnchair = require('../../libs/generated/lawnchair');
var lawnchairext = require('./lawnchair-ext');
var consts = require("./constants");
var fhparams = require("./fhparams");
var ajax = require("./ajax");
var handleError = require("./handleError");
var logger = require("./logger");
var JSON = require("JSON");
var hashFunc = require("./security/hash");
var appProps = require("./appProps");

var init = function(cb) {
  appProps.load(function(err, data) {
    if (err) return cb(err);
    return loadCloudProps(data, cb);
  });
}

var loadCloudProps = function(app_props, callback) {
  if(app_props.loglevel){
    logger.setLevel(app_props.loglevel);
  }
  // If local - shortcircuit the init - just return the host
  if (app_props.local) {
    var res = {
      "domain": "local",
      "firstTime": false,
      "hosts": {
        "debugCloudType": "node",
        "debugCloudUrl": app_props.host,
        "releaseCloudType": "node",
        "releaseCloudUrl": app_props.host,
        "type": "cloud_nodejs",
        "url": app_props.host
      },
      "init": {
        "trackId": "000000000000000000000000"
      },
      "status": "ok"
    };

    return callback(null, {
      cloud: res
    });
  }


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
  } catch (e) {
    //when dom adapter failed, Lawnchair throws an error
    //shoudn't go in here anymore
    lcConf.adapter = undefined;
    storage = new Lawnchair(lcConf, function() {});
  }

  var path = app_props.host + consts.boxprefix + "app/init";

  storage.get('fh_init', function(storage_res) {
    var savedHost = null;
    if (storage_res && storage_res.value !== null && typeof(storage_res.value) !== "undefined" && storage_res !== "") {
      storage_res = typeof(storage_res) === "string" ? JSON.parse(storage_res) : storage_res;
      storage_res.value = typeof(storage_res.value) === "string" ? JSON.parse(storage_res.value) : storage_res.value;
      if (storage_res.value.init) {
        app_props.init = storage_res.value.init;
      } else {
        //keep it backward compatible.
        app_props.init = typeof(storage_res.value) === "string" ? JSON.parse(storage_res.value) : storage_res.value;
      }
      if (storage_res.value.hosts) {
        savedHost = storage_res.value;
      }
    }
    var data = fhparams.buildFHParams();

    ajax({
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
        }, function() {});
        if (callback) {
          callback(null, {
            cloud: initRes
          });
        }
      },
      "error": function(req, statusText, error) {
        var errormsg = "unknown";
        if(req){
          errormsg = req.status + " - " + req.responseText;
        }
        logger.error("App init returned error : " + errormsg);
        //use the cached host if we have a copy
        if (savedHost) {
          logger.info("Using cached host: " + JSON.stringify(savedHost));
          if (callback) {
            callback(null, {
              cloud: savedHost
            });
          }
        } else {
          logger.error("No cached host found. Init failed.");
          handleError(function(msg, err) {
            if (callback) {
              callback({
                error: err,
                message: msg
              });
            }
          }, req, statusText, error);
        }
      }
    });
  });
};

module.exports = {
  "init": init,
  "loadCloudProps": loadCloudProps
}
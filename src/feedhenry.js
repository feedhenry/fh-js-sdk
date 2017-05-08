var constants = require("./modules/constants");
var events = require("./modules/events");
var logger = require("./modules/logger");
var ajax = require("./modules/ajax");
var events = require("./modules/events");
var cloud = require("./modules/waitForCloud");
var api_act = require("./modules/api_act");
var api_auth = require("./modules/api_auth");
var api_sec = require("./modules/api_sec");
var api_hash = require("./modules/api_hash");
var api_sync = require("./modules/sync-cli");
var api_mbaas = require("./modules/api_mbaas");
var api_cloud = require("./modules/api_cloud");
var api_push = require("./modules/api_push");
var fhparams = require("./modules/fhparams");
var appProps = require("./modules/appProps");
var device = require("./modules/device");

var defaultFail = function(msg, error) {
  logger.error(msg + ":" + JSON.stringify(error));
};

var addListener = function(type, listener) {
  events.addListener(type, listener);
  if (type === constants.INIT_EVENT) {
    //for fhinit event, need to check the status of cloud and may need to fire the listener immediately.
    if (cloud.isReady()) {
      listener(null, {
        host: cloud.getCloudHostUrl()
      });
    } else if (cloud.getInitError()) {
      listener(cloud.getInitError());
    }
  }
};

var once = function(type, listener) {
  if (type === constants.INIT_EVENT && cloud.isReady()) {
    listener(null, {
      host: cloud.getCloudHostUrl()
    });
  } else if (type === constants.INIT_EVENT && cloud.getInitError()) {
    listener(cloud.getInitError());
  } else {
    events.once(type, listener);
  }
};

var init = function(success, fail) {
  if(typeof window.cordova !== "undefined" || typeof window.phonegap !== "undefined"){
    //if we are running inside cordova/phonegap, only init after device is ready to ensure the device id is the right one
    document.addEventListener("deviceready", cloud.fhinit, false);
  } else {
    cloud.fhinit();
  }
  cloud.ready(function(err, host) {
    if (err && typeof fail === "function") {
      return fail(err);
    } else if (!err && typeof success === "function"){
      return success();
    }
  });
};

var fh = window.$fh || {};
fh.init = init;
fh.act = api_act;
fh.auth = api_auth;
fh.cloud = api_cloud;
fh.sec = api_sec;
fh.hash = api_hash;
fh.sync = api_sync;
fh.push = api_push;
fh.ajax = fh.__ajax = ajax;
fh.mbaas = api_mbaas;
fh._getDeviceId = device.getDeviceId;
fh.fh_timeout = 60000; //keep backward compatible

fh.getCloudURL = function() {
  return cloud.getCloudHostUrl();
};

fh.getFHParams = function() {
  return fhparams.buildFHParams();
};

fh.getFHHeaders = function() {
  return fhparams.getFHHeaders();
};

//events
fh.addListener = addListener;
fh.on = addListener;
fh.once = once;
var methods = ["removeListener", "removeAllListeners", "setMaxListeners", "listeners", "emit"];
for (var i = 0; i < methods.length; i++) {
  fh[methods[i]] = events[methods[i]];
}

//keep backward compatibility
fh.on(constants.INIT_EVENT, function(err, host) {
  if (err) {
    fh.cloud_props = {};
    fh.app_props = {};
  } else {
    fh.cloud_props = {
      hosts: {
        url: host.host
      }
    };
    fh.app_props = appProps.getAppProps();
  }
});

//keep backward compatibility
fh.on(constants.INTERNAL_CONFIG_LOADED_EVENT, function(err, host) {
  if (err) {
    fh.app_props = {};
  } else {
    fh.app_props = appProps.getAppProps();
  }

  // Emit config loaded event - appprops set at this point
  // V2 legacy SDK uses this to know when to fire $fh.ready (i.e. appprops is now set)
  events.emit(constants.CONFIG_LOADED_EVENT, null);
});

//for test
fh.reset = cloud.reset;
//we should really stop polluting global name space. Ideally we should ask browserify to use "$fh" when umd-fy the module. However, "$" is not allowed as the standard module name.
//So, we assign $fh to the window name space directly here. (otherwise, we have to fork the grunt browserify plugin, then fork browerify and the dependent umd module, really not worthing the effort).
window.$fh = fh;
module.exports = fh;
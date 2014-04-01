var constants = require("./modules/constants");
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
var fhparams = require("./modules/fhparams");
var appProps = require("./modules/appProps");
var device = require("./modules/device");

var defaultFail = function(msg, error){
  logger.error(msg + ":" + JSON.stringify(error));
};

var addListener = function(type, listener){
  if(type === "cloudready"){
    cloud.ready(function(err, host){
      if(!err){
        listener(host);
      }
    });
  } else {
    events.addListener(type, listener);
  }
};

var once = function(type, listener){
  if(type === "cloudready"){
    cloud.ready(function(err, host){
      if(!err){
        listener(host);
      }
    });
  } else {
    events.once(type, listener);
  }
};

//we have to continue support for init for now as for FH v2 apps, there won't be a config file created
var init = function(opts, success, fail){
  logger.warn("$fh.init will be deprecated soon");
  cloud.ready(function(err, host){
    if(err){
      if(err.message === "app_config_missing"){
        //cloud.ready will be invoked when js sdk is loaded, it may cause init call to be added to the "cloudready" event listeners stack when it's called. If that is the case and getting an error
        //about app config is missing, we just try again
        init(opts, success, fail);
      } else {
        if(typeof fail === "function"){
          return fail(err);
        }
      }
    } else {
      if(typeof success === "function"){
        success(host.host);
      }
    }
  }, opts);
};

var cloudFunc = function(act_name, params, cb){
  var funcName = act_name;
  var data = params;
  var callback = cb;
  if(typeof params === "function"){
    data = {};
    callback = params;
  }
  var reqParams = {act: funcName, req: data};
  api_act(reqParams, function(res){
    return callback(null, res);
  }, function(msg, error){
    return callback(error);
  });
};

var fh = window.$fh || {};
fh.init = init;
fh.act = api_act;
fh.auth = api_auth;
fh.cloud = cloudFunc;
fh.sec = api_sec;
fh.hash = api_hash;
fh.sync = api_sync;
fh.ajax = fh.__ajax = ajax;
fh.mbaas = api_mbaas;
fh._getDeviceId = device.getDeviceId;

fh.getCloudURL = function(){
  return cloud.getCloudHostUrl();
};

fh.getFHParams = function(){
  return fhparams.buildFHParams();
};

//events
fh.addListener = addListener;
fh.on = addListener;
fh.once = once;
var methods = ["removeListener", "removeAllListeners", "setMaxListeners", "listeners", "emit"];
for(var i=0;i<methods.length;i++){
  fh[methods[i]] = events[methods[i]];
}

//keep backward compatibility
fh.on("cloudready", function(host){
  fh.cloud_props = {hosts: {url: host.host}};
  fh.app_props = appProps.getAppProps();
});

//for test
fh.reset = cloud.reset;
//we should really stop polluting global name space. Ideally we should ask browserify to use "$fh" when umd-fy the module. However, "$" is not allowed as the standard module name.
//So, we assign $fh to the window name space directly here. (otherwise, we have to fork the grunt browserify plugin, then fork browerify and the dependent umd module, really not worthing the effort).
window.$fh = fh;
module.exports = fh;






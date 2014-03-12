var constants = require("./modules/constants");
var console = require("console");
var ajax = require("./modules/ajax");
var events = require("./modules/events");
var cloud = require("./modules/waitForCloud");
var api_act = require("./modules/api_act");
var api_auth = require("./modules/api_auth");
var api_sec = require("./modules/api_sec");
var api_hash = require("./modules/api_hash");
var api_sync = require("./modules/sync-cli");

var defaultFail = function(msg, error){
  console.log(msg + ":" + JSON.stringify(error));
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

var init = function(opts, success, fail){
  console.warn("$fh.init has been deprecated.");
  cloud.ready(function(err, host){
    if(err){
      if(typeof fail === "function"){
        return fail(err);
      }
    } else {
      if(typeof success === "function"){
        success(host.host);
      }
    }
  });
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
fh.ajax = ajax;

fh.getCloudURL = function(){
  return cloud.getCloudHostUrl();
};

//events
fh.addListener = addListener;
fh.on = addListener;
fh.once = once;
var methods = ["removeListener", "removeAllListeners", "setMaxListeners", "listeners", "emit"];
for(var i=0;i<methods.length;i++){
  fh[methods[i]] = events[methods[i]];
}

//for test
fh.reset = cloud.reset;
//we should really stop polluting global name space. Ideally we should ask browserify to use "$fh" when umd-fy the module. However, "$" is not allowed as the standard module name.
//So, we assign $fh to the window name space directly here. (otherwise, we have to fork the grunt browserify plugin, then fork browerify and the dependent umd module, really not worthing the effort).
window.$fh = fh;
module.exports = fh;






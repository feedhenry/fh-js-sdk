var initializer = require("./initializer");
var events = require("./events");
var CloudHost = require("./hosts");
var constants = require("./constants");

var init_attempt = 0;
//the app configurations
var app_props;
//the cloud configurations
var cloud_host;

//flag for indicating if it has initialised
var is_initializing = false;
//flag for indicating if init has failed
var init_failed = false;
//hold listeners
var cloud_ready_listeners = [];


var tryInitialise = function(conf_path, retry, cb){
  init_attempt++;
  initializer.init(conf_path, function(error, initRes){
    if(error){
      if(retry && init_attempt <= retry){
        setTimeout(function(){
          tryInitialise(conf_path, retry, cb);
        }, 200);
      } else {
        return cb(error);
      }
    } else {
      app_props = initRes.app;
      cloud_host = new CloudHost(initRes.cloud);
      return cb(null, cloud_host);
    }
  });
}

var waitForCloudReady = function(cb, retry){
  //if we have cloud_host, then cloud is ready
  if(cloud_host){
    return cb(null, cloud_host);
  } else {
    if(is_initializing){
      cloud_ready_listeners.push(cb);
    } else {
      is_initializing = true;
      init_attempt = 0;
      tryInitialise(constants.config_js, retry, function(err, data){
        is_initializing = false;
        if(typeof(cb) === "function"){
          cb(err, data);
        }
        cloudReady(null === err);
      });
    }
  }
}

var cloudReady = function(success){
  if(success){
    events.fireEvent("cloudready", {host: getCloudHostUrl()});
  }
  try{
    while(cloud_ready_listeners[0]){
      var cb = cloud_ready_listeners.shift();
      if(success){
        return cb(null, null);
      } else {
        return cb("cloud is not ready", null);
      }
    }
  } finally {

  }
}

var getAppProps = function(){
  return app_props;
}

var getCloudHost = function(){
  return cloud_host;
}

var getCloudHostUrl = function(){
  if(typeof cloud_host !== "undefined"){
    return cloud_host.getHost(app_props.mode);
  } else {
    return undefined;
  }
}

waitForCloudReady(function(){
  console.log("fh cloud is ready");
}, 2);

module.exports = {
  wait: waitForCloudReady,
  getAppProps: getAppProps,
  getCloudHost: getCloudHost,
  getCloudHostUrl: getCloudHostUrl
}
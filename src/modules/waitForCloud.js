var initializer = require("./initializer");
var events = require("./events");
var CloudHost = require("./hosts");
var constants = require("./constants");

var init_attempt = 0;
//the app configurations
var app_props;
//the cloud configurations
var cloud_host;

var is_cloud_ready = false;


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

var ready = function(cb, retry){
  if(is_cloud_ready){
    return cb(null, {host: getCloudHostUrl()});
  } else {
    events.once('cloudready', function(host){
      return cb(null, host);
    });
    events.once('error', function(error){
      return cb(error);
    });
    init_attempt = 0;
    tryInitialise(constants.config_js, retry, function(err, data){
      if(err){
        return events.emit("error", err);
      } else {
        is_cloud_ready = true;
        return events.emit("cloudready", {host: getCloudHostUrl()});
      }
    });
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

var isReady = function(){
  return is_cloud_ready;
}

//for test
var reset = function(){
  is_cloud_ready = false;
  cloud_host = undefined;
}

ready(function(error, host){
  if(error){
    console.error("Failed to initialise fh.");
  } else {
    console.log("fh cloud is ready");
  }
}, 2);

module.exports = {
  ready: ready,
  isReady: isReady,
  getAppProps: getAppProps,
  getCloudHost: getCloudHost,
  getCloudHostUrl: getCloudHostUrl,
  reset: reset
}
var initializer = require("./initializer");
var events = require("./events");
var CloudHost = require("./hosts");
var constants = require("./constants");
var logger = require("./logger");


//the cloud configurations
var cloud_host;

var is_initialising = false;
var is_cloud_ready = false;
var init_error = null;


var ready = function(cb){
  if(is_cloud_ready){
    return cb(null, {host: getCloudHostUrl()});
  } else {
    events.once(constants.INIT_EVENT, function(err, host){
      return cb(err, host);
    });
    if(!is_initialising){
      is_initialising = true;
      initializer.init(function(err, initRes){
        is_initialising = false;
        if(err){
          init_error = err;
          return events.emit(constants.INIT_EVENT, err);
        } else {
          init_error = null;
          is_cloud_ready = true;
          cloud_host = new CloudHost(initRes.cloud);
          return events.emit(constants.INIT_EVENT, null, {host: getCloudHostUrl()});
        }
      });
    }
  }
}

var getCloudHost = function(){
  return cloud_host;
}

var getCloudHostUrl = function(){
  if(typeof cloud_host !== "undefined"){
    var appProps = require("./appProps").getAppProps();
    return cloud_host.getHost(appProps.mode);
  } else {
    return undefined;
  }
}

var isReady = function(){
  return is_cloud_ready;
}

var getInitError = function(){
  return init_error;
}

//for test
var reset = function(){
  is_cloud_ready = false;
  is_initialising = false;
  cloud_host = undefined;
  init_error = undefined;
  ready(function(){
    
  });
}

ready(function(error, host){
  if(error){
    if(error.message !== "app_config_missing"){
      logger.error("Failed to initialise fh.");
    } else {
      logger.info("No fh config file");
    }
  } else {
    logger.info("fh cloud is ready");
  }
});

module.exports = {
  ready: ready,
  isReady: isReady,
  getCloudHost: getCloudHost,
  getCloudHostUrl: getCloudHostUrl,
  getInitError: getInitError,
  reset: reset
}
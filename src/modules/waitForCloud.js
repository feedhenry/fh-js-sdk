var initializer = require("./initializer");
var events = require("./events");
var CloudHost = require("./hosts");
var constants = require("./constants");

var init_attempt = 0;
//the cloud configurations
var cloud_host;

var is_initialising = false;
var is_cloud_ready = false;


var tryInitialise = function(retry, cb, props){
  init_attempt++;
  initializer.init(function(error, initRes){

    if(error){
      if(retry && init_attempt <= retry){
        tryInitialise(retry, cb);
      } else {
        return cb(error);
      }
    } else {
      cloud_host = new CloudHost(initRes.cloud);
      return cb(null, cloud_host);
    }
  }, props);
}

var ready = function(cb, retry, app_props){
  var props = app_props;
  var tries = retry;
  if(typeof retry === "object"){
    props = retry;
    tries = 0;
  }
  if(is_cloud_ready){
    return cb(null, {host: getCloudHostUrl()});
  } else {
    events.once('cloudready', function(host){
      return cb(null, host);
    });
    events.once('error', function(error){
      return cb(error);
    });
    if(!is_initialising){
      is_initialising = true;
      init_attempt = 0;
      tryInitialise(tries, function(err, data){
        is_initialising = false;
        if(err){
          return events.emit("error", err);
        } else {
          is_cloud_ready = true;
          return events.emit("cloudready", {host: getCloudHostUrl()});
        }
      }, props);
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

//for test
var reset = function(){
  is_cloud_ready = false;
  is_initialising = false;
  cloud_host = undefined;
}

ready(function(error, host){
  if(error){
    if(error.message !== "app_config_missing"){
      console.error("Failed to initialise fh.");
    } else {
      console.log("No fh config file");
    }
  } else {
    console.log("fh cloud is ready");
  }
});

module.exports = {
  ready: ready,
  isReady: isReady,
  getCloudHost: getCloudHost,
  getCloudHostUrl: getCloudHostUrl,
  reset: reset
}
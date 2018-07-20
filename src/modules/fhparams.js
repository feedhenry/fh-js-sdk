var device = require("./device");
var sdkversion = require("./sdkversion");
var appProps = require("./appProps");
var logger = require("./logger");

var defaultParams = null;
var authSessionToken = null;
//TODO: review these options, we probably only needs all of them for init calls, but we shouldn't need all of them for act calls
var buildFHParams = function(){
  if(defaultParams){
    return defaultParams;
  }
  var fhparams = {};
  fhparams.cuid = device.getDeviceId();
  fhparams.cuidMap = device.getCuidMap();
  fhparams.destination = device.getDestination();

  if(window.device || navigator.device){
    fhparams.device = window.device || navigator.device;
  }

  //backward compatible
  if (typeof window.fh_app_version !== 'undefined'){
    fhparams.app_version = fh_app_version;
  }
  if (typeof window.fh_project_version !== 'undefined'){
    fhparams.project_version = fh_project_version;
  }
  if (typeof window.fh_project_app_version !== 'undefined'){
    fhparams.project_app_version = fh_project_app_version;
  }
  fhparams.sdk_version = sdkversion();
  if(authSessionToken){
    fhparams.sessionToken = authSessionToken;
  }

  var app_props = appProps.getAppProps();
  if(app_props){
    fhparams.appid = app_props.appid;
    fhparams.appkey = app_props.appkey;
    fhparams.projectid = app_props.projectid;
    fhparams.analyticsTag =  app_props.analyticsTag;
    fhparams.connectiontag = app_props.connectiontag;
    if(app_props.init){
      fhparams.init = typeof(app_props.init) === "string" ? JSON.parse(app_props.init) : app_props.init;
    }
  }

  defaultParams = fhparams;
  logger.debug("fhparams = ", defaultParams);
  return fhparams;
};

//TODO: deprecate this. Move to use headers instead
var addFHParams = function(params){
  var p = params || {};
  p.__fh = buildFHParams();
  return p;
};

var getFHHeaders = function(){
  var headers = {};
  var params = buildFHParams();
  for(var name in params){
    if(params.hasOwnProperty(name)){
      headers['X-FH-' + name] = JSON.stringify(params[name]);
    }
  }
  return headers;
};

var setAuthSessionToken = function(sessionToken){
  authSessionToken = sessionToken;
  defaultParams = null;
};

module.exports = {
  "buildFHParams": buildFHParams,
  "addFHParams": addFHParams,
  "setAuthSessionToken":setAuthSessionToken,
  "getFHHeaders": getFHHeaders
};

var device = require("./device");
var sdkversion = require("./sdkversion");

var defaultParams = null;
//TODO: review these options, we probably only needs all of them for init calls, but we shouldn't need all of them for act calls
var buildParams = function(app_props){
  if(defaultParams){
    return defaultParams;
  }
  var fhparams = {};
  fhparams.cuid = device.getDeviceId();
  fhparams.cuidMap = device.getCuidMap();
  fhparams.appid = app_props.appid;
  fhparams.appkey = app_props.appkey;
  fhparams.projectid = app_props.projectid;
  fhparams.analyticsTag =  app_props.analyticsTag;
  fhparams.init = app_props.init;
  fhparams.destination = device.getDestination();
  fhparams.connectiontag = app_props.connectiontag;
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
  defaultParams = fhparams;
  return fhparams;
}

var addDefaultParams = function(app_props, params){
  var params = params || {};
  params.__fh = buildParams(app_props);
  return params;
}

module.exports = {
  "buildParams": buildParams,
  "addDefaultParams": addDefaultParams
}

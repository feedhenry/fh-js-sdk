var constants = require("./constants");
var appProps = require("./appProps");

function removeEndSlash(input){
  var ret = input;
  if(ret.charAt(ret.length - 1) === "/"){
    ret = ret.substring(0, ret.length-1);
  }
  return ret;
}

function removeStartSlash(input){
  var ret = input;
  if(ret.length > 1 && ret.charAt(0) === "/"){
    ret = ret.substring(1, ret.length);
  }
  return ret;
}

function CloudHost(cloud_props){
  this.cloud_props = cloud_props;
  this.cloud_host = undefined;
  this.isLegacy = false;
}

CloudHost.prototype.getHost = function(appType){
  if(this.cloud_host){
    return this.cloud_host;
  } else {
    var url;
    var app_type;
    if(this.cloud_props && this.cloud_props.hosts){
      url = this.cloud_props.hosts.url;

      if (typeof url === 'undefined') {
        // resolve url the old way i.e. depending on
        // -burnt in app mode
        // -returned dev or live url
        // -returned dev or live type (node or fh(rhino or proxying))
        var cloud_host = this.cloud_props.hosts.releaseCloudUrl;
        app_type = this.cloud_props.hosts.releaseCloudType;

        if(typeof appType !== "undefined" && appType.indexOf("dev") > -1){
          cloud_host = this.cloud_props.hosts.debugCloudUrl;
          app_type = this.cloud_props.hosts.debugCloudType;
        }
        url = cloud_host;
      }
    }
    url = removeEndSlash(url);
    this.cloud_host = url;
    if(app_type === "fh"){
      this.isLegacy = true;
    }
    return url;
  }
}

CloudHost.prototype.getActUrl = function(act){
  var app_props = appProps.getAppProps() || {};
  if(typeof this.cloud_host === "undefined"){
    this.getHost(app_props.mode);
  }
  if(this.isLegacy){
    return this.cloud_host + constants.boxprefix + "act/" + this.cloud_props.domain + "/" + app_props.appid + "/" + act + "/" + app_props.appid;
  } else {
    return this.cloud_host + "/cloud/" + act;
  }
}

CloudHost.prototype.getMBAASUrl = function(service){
  var app_props = appProps.getAppProps() || {};
  if(typeof this.cloud_host === "undefined"){
    this.getHost(app_props.mode);
  }
  return this.cloud_host + "/mbaas/" + service;
}

CloudHost.prototype.getCloudUrl = function(path){
  var app_props = appProps.getAppProps() || {};
  if(typeof this.cloud_host === "undefined"){
    this.getHost(app_props.mode);
  }
  return this.cloud_host + "/" + removeStartSlash(path);
}



module.exports = CloudHost;
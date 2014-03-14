var consts = require("./constants");
var ajax = require("./ajax");
var console = require("console");

var app_props = null;

var load = function(cb){
  ajax({url: consts.config_js, dataType:"json", success: function(data){
    console.log("fhconfig = " + JSON.stringify(data));
    app_props = data;
    cb(null, app_props);
  }, error: function(req, statusText, error){
    console.error("Can not load " + consts.config_js + ". Please make usre it exists.");
    cb(statusText);
  }});
}

var getAppProps = function(){
  return app_props;
}

module.exports = {
  load: load,
  getAppProps: getAppProps
}
var consts = require("./constants");
var ajax = require("./ajax");
var console = require("console");

var app_props = null;

var load = function(cb){
  ajax({url: consts.config_js, dataType:"json", success: function(data){
    console.log("fhconfig = " + JSON.stringify(data));
    //when load the config file on device, because file:// protocol is used, it will never call fail call back. The success callback will be called but the data value will be null.
    if(null == data){
      return cb(new Error("app_config_missing"));
    } else {
      app_props = data;
      cb(null, app_props);
    }
  }, error: function(req, statusText, error){
    console.log(consts.config_js  + " Not Found");
    cb(new Error("app_config_missing"));
  }});
}

var setAppProps = function(props){
  app_props = props;
}

var getAppProps = function(){
  return app_props;
}

module.exports = {
  load: load,
  getAppProps: getAppProps,
  setAppProps: setAppProps
}
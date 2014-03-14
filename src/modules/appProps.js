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
    console.log(consts.config_js  + " Not Found");
    cb(statusText);
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
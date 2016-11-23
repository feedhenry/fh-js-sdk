var consts = require("./constants");
var ajax = require("./ajax");
var logger = require("./logger");
var qs = require("./queryMap");
var _ = require('underscore');

var app_props = null;

var load = function(cb) {
  var doc_url = document.location.href;
  var url_params = qs(doc_url.replace(/#.*?$/g, ''));
  var url_props = {};

  //only use fh_ prefixed params
  for(var key in url_params){
    if(url_params.hasOwnProperty(key) ){
      if(key.indexOf('fh_') === 0){
        url_props[key.substr(3)] = decodeURI(url_params[key]);
      }
    }
  }

  //default properties
  app_props = {
    appid: "000000000000000000000000",
    appkey: "0000000000000000000000000000000000000000",
    projectid: "000000000000000000000000",
    connectiontag: "0.0.1"
  };

  function setProps(props){
    _.extend(app_props, props, url_props);

    if(typeof url_params.url !== 'undefined'){
     app_props.host = url_params.url;
    }

    app_props.studio = (url_props.destination_code === 'studio');
    app_props.local = !!(url_props.host || url_params.url);
    cb(null, app_props);
  }

  var config_url = url_params.fhconfig || consts.config_js;
  ajax({
    url: config_url,
    dataType: "json",
    success: function(data) {
      logger.debug("fhconfig = " + JSON.stringify(data));
      //when load the config file on device, because file:// protocol is used, it will never call fail call back. The success callback will be called but the data value will be null.
      if (null == data) {
        //fh v2 only
        if(window.fh_app_props){
          return setProps(window.fh_app_props);
        }
        return cb(new Error("app_config_missing"));
      } else {

        setProps(data);
      }
    },
    error: function(req, statusText, error) {
      //fh v2 only
      if(window.fh_app_props){
        return setProps(window.fh_app_props);
      }
      logger.error(consts.config_js + " Not Found");
      cb(new Error("app_config_missing"));
    }
  });
};

var setAppProps = function(props) {
  app_props = props;
};

var getAppProps = function() {
  return app_props;
};

module.exports = {
  load: load,
  getAppProps: getAppProps,
  setAppProps: setAppProps
};

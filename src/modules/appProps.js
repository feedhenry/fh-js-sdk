var consts = require("./constants");
var ajax = require("./ajax");
var logger = require("./logger");
var qs = require("./queryMap");

var app_props = null;

var load = function(cb) {
  var doc_url = document.location.href;
  var url_params = qs(doc_url);
  var local = (typeof url_params.url !== 'undefined');

  // For local environments, no init needed
  if (local) {
    app_props = {};
    app_props.local = true;
    app_props.host = url_params.url;
    app_props.appid = "000000000000000000000000";
    app_props.appkey = "0000000000000000000000000000000000000000";
    app_props.projectid = "000000000000000000000000";
    app_props.connectiontag = "0.0.1";
    return cb(null, app_props);
  }

  var config_url = url_params.fhconfig || consts.config_js;
  ajax({
    url: config_url,
    dataType: "json",
    success: function(data) {
      logger.debug("fhconfig = " + JSON.stringify(data));
      //when load the config file on device, because file:// protocol is used, it will never call fail call back. The success callback will be called but the data value will be null.
      if (null === data) {
        return cb(new Error("app_config_missing"));
      } else {
        app_props = data;

        cb(null, app_props);
      }
    },
    error: function(req, statusText, error) {
      //fh v2 only
      if(window.fh_app_props){
        return cb(null, window.fh_app_props);
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
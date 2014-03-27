var consts = require("./constants");
var ajax = require("./ajax");
var console = require("console");
var qs = require("./queryMap");

var app_props = null;

var load = function(cb) {
  var doc_url = document.location.href;
  var url_params = qs(doc_url);
  var local = (typeof url_params.fhconfig !== 'undefined');
  var config_url = url_params.fhconfig || consts.config_js;

  ajax({
    url: config_url,
    dataType: "json",
    success: function(data) {
      console.log("fhconfig = " + JSON.stringify(data));
      //when load the config file on device, because file:// protocol is used, it will never call fail call back. The success callback will be called but the data value will be null.
      if (null === data) {
        return cb(new Error("app_config_missing"));
      } else {
        app_props = data;

        // For local environments, no init needed
        if (local) {
          // Set defaults for keys other than host
          app_props.local = true;
          app_props.appid = "000000000000000000000000";
          app_props.appkey = "0000000000000000000000000000000000000000";
          app_props.projectid = "000000000000000000000000";
          app_props.connectiontag = "0.0.1";
        }

        cb(null, app_props);
      }
    },
    error: function(req, statusText, error) {
      console.log(consts.config_js + " Not Found");
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
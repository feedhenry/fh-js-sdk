var logger = require("./logger");
var appProps = require("./appProps");
var cloud = require("./waitForCloud");

module.exports = function (onNotification, success, fail, config) {
  if (!fail) {
    fail = function (msg, error) {
      logger.debug(msg + ":" + JSON.stringify(error));
    };
  }

  cloud.ready(function(err, cloudHost){
    logger.debug("push is called");
    if(err){
      return fail(err.message, err);
    } else {
      if (window.push) {
        var props = appProps.getAppProps();
        props.pushServerURL = props.host + '/api/v2/ag-push';
        if (config) {
          for(var key in config) {
            props[key] = config[key];
          }
        }
        window.push.register(onNotification, success, fail, props);
      } else {
        fail('push plugin not installed');
      }
    }
  });
};

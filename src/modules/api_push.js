var logger = require("./logger");
var appProps = require("./appProps");
var cloud = require("./waitForCloud");

module.exports = function (onNotification, success, fail) {
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
        window.push.register(onNotification, success, fail, appProps.getAppProps());
      } else {
        fail('push plugin not installed');
      }
    }
  });
};

var logger = require("./logger");
var appProps = require("./appProps");

module.exports = function (onNotification, success, fail) {
  logger.debug("push is called");
  if (!fail) {
    fail = function (msg, error) {
      logger.debug(msg + ":" + JSON.stringify(error));
    };
  }

  window.push.register(onNotification, success, fail, appProps.getAppProps());
};
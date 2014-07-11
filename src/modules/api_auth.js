var logger = require("./logger");
var cloud = require("./waitForCloud");
var fhparams = require("./fhparams");
var ajax = require("./ajax");
var JSON = require("JSON");
var handleError = require("./handleError");
var device = require("./device");
var constants = require("./constants");
var checkAuth = require("./checkAuth");
var appProps = require("./appProps");

module.exports = function(opts, success, fail) {
  if (!fail) {
    fail = function(msg, error) {
      logger.debug(msg + ":" + JSON.stringify(error));
    };
  }
  if (!opts.policyId) {
    return fail('auth_no_policyId', {});
  }
  if (!opts.clientToken) {
    return fail('auth_no_clientToken', {});
  }

  cloud.ready(function(err, data) {
    if (err) {
      return fail(err.message, err);
    } else {
      var req = {};
      req.policyId = opts.policyId;
      req.clientToken = opts.clientToken;
      if (opts.endRedirectUrl) {
        req.endRedirectUrl = opts.endRedirectUrl;
        if (opts.authCallback) {
          req.endRedirectUrl += (/\?/.test(req.endRedirectUrl) ? "&" : "?") + "_fhAuthCallback=" + opts.authCallback;
        }
      }
      req.params = {};
      if (opts.params) {
        req.params = opts.params;
      }
      var endurl = opts.endRedirectUrl || "status=complete";
      req.device = device.getDeviceId();
      var app_props = appProps.getAppProps();
      var path = app_props.host + constants.boxprefix + "admin/authpolicy/auth";

      if (app_props.local) {
        path = constants.boxprefix + "admin/authpolicy/auth";
      }

      req = fhparams.addFHParams(req);

      ajax({
        "url": path,
        "type": "POST",
        "tryJSONP": true,
        "data": JSON.stringify(req),
        "dataType": "json",
        "contentType": "application/json",
        "timeout": opts.timeout || app_props.timeout,
        success: function(res) {
          checkAuth.handleAuthResponse(endurl, res, success, fail);
        },
        error: function(req, statusText, error) {
          handleError(fail, req, statusText, error);
        }
      });
    }
  });
}
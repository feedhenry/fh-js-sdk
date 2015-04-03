var logger = require("./logger");
var cloud = require("./waitForCloud");
var fhparams = require("./fhparams");
var ajax = require("./ajax");
var handleError = require("./handleError");
var device = require("./device");
var constants = require("./constants");
var checkAuth = require("./checkAuth");
var appProps = require("./appProps");
var data = require('./data');

function callAuthEndpoint(endpoint, data, opts, success, fail){
  var app_props = appProps.getAppProps();
  var path = app_props.host + constants.boxprefix + "admin/authpolicy/" + endpoint;

  if (app_props.local) {
    path = constants.boxprefix + "admin/authpolicy/" + endpoint;
  }

  ajax({
    "url": path,
    "type": "POST",
    "tryJSONP": typeof Titanium === 'undefined',
    "data": JSON.stringify(data),
    "dataType": "json",
    "contentType": "application/json",
    "timeout": opts.timeout || app_props.timeout,
    success: function(res){
      if(success){
        return success(res);
      }
    },
    error: function(req, statusText, error){
      logger.error('got error when calling ' + endpoint, req.responseText || req, error);
      if(fail){
        fail(req, statusText, error);
      }
    }
  });
}

var auth = function(opts, success, fail) {
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
      var cloudHost = cloud.getCloudHost();
      if(cloudHost.getEnv()){
        req.environment = cloudHost.getEnv(); 
      }
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
      req = fhparams.addFHParams(req);
      callAuthEndpoint('auth', req, opts, function(res){
        auth.authenticateHandler(endurl, res, success, fail);
      }, function(req, statusText, error){
        handleError(fail, req, statusText, error);
      });
    }
  });
};

auth.hasSession = function(cb){
  data.sessionManager.exists(cb);
};

auth.clearSession = function(cb){
  data.sessionManager.read(function(err, session){
    if(err){
      return cb(err);
    }
    if(session){
      //try the best to delete the remote session
      callAuthEndpoint('revokesession', session, {});
    }
    data.sessionManager.remove(cb);
    fhparams.setAuthSessionToken(undefined);
  });
};

auth.authenticateHandler = checkAuth.handleAuthResponse;

auth.verify = function(cb){
  data.sessionManager.read(function(err, session){
    if(err){
      return cb(err);
    }
    if(session){
      //try the best to delete the session in remote
      callAuthEndpoint('verifysession', session, {}, function(res){
        return cb(null, res.isValid);
      }, function(req, statusText, error){
        return cb('network_error');
      });
    } else {
      return cb('no_session');
    }
  });
};

module.exports = auth;
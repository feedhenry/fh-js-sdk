var logger =require("./logger");
var cloud = require("./waitForCloud");
var fhparams = require("./fhparams");
var ajax = require("./ajax");
var handleError = require("./handleError");
var appProps = require("./appProps");
var _ = require('underscore');

function doCloudCall(opts, success, fail){
  var cloud_host = cloud.getCloudHost();
  var url = cloud_host.getCloudUrl(opts.path);
  var params = opts.data || {};
  params = fhparams.addFHParams(params);
  var type = opts.method || "POST";
  var data;
  if (["POST", "PUT", "PATCH", "DELETE"].indexOf(type.toUpperCase()) !== -1) {
    data = JSON.stringify(params);
  } else {
    data = params;
  }

  var headers = fhparams.getFHHeaders();
  if (opts.headers) {
    headers = _.extend(headers, opts.headers);
  }

  return ajax({
    "url": url,
    "type": type,
    "dataType": opts.dataType || "json",
    "data": data,
    "contentType": opts.contentType || "application/json",
    "timeout": opts.timeout || appProps.timeout,
    "headers": headers,
    "success": success,
    "error": function(req, statusText, error){
      return handleError(fail, req, statusText, error);
    }
  });
}

module.exports = function(opts, success, fail){
  logger.debug("cloud is called");
  if(!fail){
    fail = function(msg, error){
      logger.debug(msg + ":" + JSON.stringify(error));
    };
  }

  cloud.ready(function(err, cloudHost){
    logger.debug("Calling fhact now");
    if(err){
      return fail(err.message, err);
    } else {
      doCloudCall(opts, success, fail);
    }
  });
};
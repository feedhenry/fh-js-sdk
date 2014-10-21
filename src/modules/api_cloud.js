var logger =require("./logger");
var cloud = require("./waitForCloud");
var fhparams = require("./fhparams");
var ajax = require("./ajax");
var JSON = require("JSON");
var handleError = require("./handleError");
var appProps = require("./appProps");

function doCloudCall(opts, success, fail){
  var cloud_host = cloud.getCloudHost();
  var url = cloud_host.getCloudUrl(opts.path);
  var params = opts.data || {};
  params = fhparams.addFHParams(params);
  return ajax({
    "url": url,
    "type": opts.method || "POST",
    "dataType": opts.dataType || "json",
    "data": params,
    "contentType": opts.contentType || "application/json",
    "timeout": opts.timeout || appProps.timeout,
    "success": success,
    "error": function(req, statusText, error){
      return handleError(fail, req, statusText, error);
    }
  })
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
  })
}

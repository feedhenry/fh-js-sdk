var console =require("console");
var cloud = require("./waitForCloud");
var fhparams = require("./fhparams");
var ajax = require("./ajax");
var JSON = require("JSON");
var handleError = require("./handleError");

function doActCall(opts, success, fail){
  var cloud_host = cloud.getCloudHost();
  var app_props = cloud.getAppProps();
  var url = cloud_host.getActUrl(app_props, opts.act);
  var params = opts.req || {};
  params = fhparams.addDefaultParams(app_props, params);
  return ajax({
    "url": url,
    "type": "POST",
    "data": JSON.stringify(params),
    "contentType": "application/json",
    "timeout": opts.timeout,
    "success": function(res){
      if(success){
        return success(res);
      }
    },
    "error": function(req, statusText, error){
      handleError(fail, req, statusText);
    }
  })
}

module.exports = function(opts, success, fail){
  console.log("act is called");
  if(!fail){
    fail = function(msg, error){
      console.log(msg + ":" + JSON.stringify(error));
    };
  }

  if(!opts.act){
    return fail('act_no_action', {});
  }

  cloud.ready(function(err, cloudHost){
    console.log("Calling fhact now");
    if(err){
      return fail(err.message, err);
    } else {
      doActCall(opts, success, fail);
    }
  })
}
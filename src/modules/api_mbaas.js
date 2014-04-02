var console =require("console");
var cloud = require("./waitForCloud");
var fhparams = require("./fhparams");
var ajax = require("./ajax");
var JSON = require("JSON");
var handleError = require("./handleError");
var consts = require("./constants");


module.exports = function(opts, success, fail){
  console.log("mbaas is called.");
  if(!fail){
    fail = function(msg, error){
      console.log(msg + ":" + JSON.stringify(error));
    };
  }

  var mbaas = opts.service;
  var params = opts.params;

  cloud.ready(function(err, cloudHost){
    console.log("Calling mbaas now");
    if(err){
      return fail(err.message, err);
    } else {
      var cloud_host = cloud.getCloudHost();
      var url = cloud_host.getMBAASUrl(mbaas);
      params = fhparams.addFHParams(params);
      return ajax({
        "url": url,
        "tryJSONP": true,
        "type": "POST",
        "dataType": "json",
        "data": JSON.stringify(params),
        "contentType": "application/json",
        "timeout": opts.timeout || consts.fh_timeout,
        "success": success,
        "error": fail
      });
    }
  });
} 
var constants = require("./modules/constants");
var console = require("console");
var cloud = require("./modules/waitForCloud");
var api_act = require("./modules/api_act");
var api_auth = require("./modules/api_auth");

var defaultFail = function(msg, error){
  console.log(msg + ":" + JSON.stringify(error));
}

var init = function(opts, success, fail){
  console.warn("$fh.init has been deprecated.");
  cloud.wait(function(){
    if(typeof success === "function"){
      success(cloud.getCloudHostUrl());
    }
  });
}

var act = api_act;
var auth = api_auth;

var cloudFunc = function(act_name, params, cb){
  var funcName = act_name;
  var data = params;
  var callback = cb;
  if(typeof params === "function"){
    data = {};
    callback = params;
  }
  var reqParams = {act: funcName, req: data};
  act(reqParams, function(res){
    return callback(null, res);
  }, function(msg, error){
    return callback(error);
  });
}

var $fh = window.$fh || {};
$fh.init = init;
$fh.act = act;
$fh.auth = auth;
$fh.cloud = cloudFunc;

module.exports = $fh;







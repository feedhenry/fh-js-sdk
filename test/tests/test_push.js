var chai = require('chai');
var expect = chai.expect;
var sinonChai = require('sinon-chai');
chai.use(sinonChai);

var process = require("process");
if(document && document.location){
  if(document.location.href.indexOf("coverage=1") > -1){
    process.env.LIB_COV = 1;
  }
}

var fhconfig = {
  "host": "http://localhost:8100",
  "appid" : "testappid",
  "appkey" : "testappkey",
  "projectid" : "testprojectid",
  "connectiontag" : "testconnectiontag",
  "pushServerURL": "testPushServerURL"
};

describe("test push wrapper", function() {
  
  it("should invoke wrapped push", function() {
    var success = sinon.spy();
    var fail = sinon.spy();
    
    window.push = {};
    window.push.register = function(onNotification, successHandler, errorHandler, pushConfig) {
      expect(pushConfig).to.have.property('pushServerURL');
      successHandler();
    }
    
    var $fh = process.env.LIB_COV? require("../../src-cov/feedhenry") : require("../../src/feedhenry");
    
    $fh.cloud(function() {}, success, fail);
    
    expect(success).to.have.been.calledOnce;
    expect(fail).to.have.not.been.called;
  });
});
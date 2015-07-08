var chai = require('chai');
var expect = chai.expect;
var sinonChai = require('sinon-chai');
chai.use(sinonChai);

var process = require("process");
if (document && document.location) {
  if (document.location.href.indexOf("coverage=1") > -1) {
    process.env.LIB_COV = 1;
  }
}

var $fh = process.env.LIB_COV? require("../../src-cov/feedhenry") : require("../../src/feedhenry");

describe("test push wrapper", function() {
  
  it("should invoke wrapped push", function() {
    //given
    var success = sinon.spy();
    var fail = sinon.spy();
    window.push = {};
    window.push.register = function(onNotification, successHandler, errorHandler, pushConfig) {
      successHandler();
    }

    //when
    $fh.push(function() {}, success, fail);
    
    //then
    expect(success).to.have.been.calledOnce;
    expect(fail).to.have.not.been.called;
  });

  it("should invoke fail when push plugin is not installed", function() {
    //given
    var success = sinon.spy();
    var fail = sinon.spy();
    delete window.push;
    
    //when
    $fh.push(function() {}, success, fail);
    
    //then
    expect(fail).to.have.been.calledOnce;
    expect(success).to.have.not.been.called;
  });
  
});
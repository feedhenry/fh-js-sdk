var chai = require('chai');
var expect = chai.expect;
var sinonChai = require('sinon-chai');
var url = require('url');

var process = require("process");
if(document && document.location){
  if(document.location.href.indexOf("coverage=1") > -1){
    process.env.LIB_COV = 1;
  }
}

var ajax = process.env.LIB_COV? require("../../src-cov/modules/ajax") : require("../../src/modules/ajax");
var qs = process.env.LIB_COV? require("../../src-cov/modules/queryMap"): require("../../src/modules/queryMap");

chai.use(sinonChai);

var fhconfig = {
  "host": "http://localhost:8100",
  "appid" : "testappid",
  "appkey" : "testappkey",
  "projectid" : "testprojectid",
  "connectiontag" : "testconnectiontag"
};

var apphost = {
  domain: "testing",
  firstTime: false,
  hosts: {
    "url": "http://localhost:8101"
  },
  init: {
    "trackId": "testtrackid"
  }
};

var expectedUrl = "http://localhost:8101";

if(document && document.location){
  var doc_url = document.location.href;
  var url_params = qs(doc_url);
  var local = (typeof url_params.url !== 'undefined');
  if(local){
    expectedUrl = url_params.url;
  }
}

describe("test all cloud related GETs", function(){

  var server;
  var requests;

  beforeEach(function () {
    server = sinon.useFakeXMLHttpRequest(); 
    requests = [];
    server.onCreate = function (xhr) {
      requests.push(xhr);
    };
  });

  afterEach(function () { server.restore(); });

  it("should work with cloud GET call", function(){
    var success = sinon.spy();
    var fail = sinon.spy();
    var initSuccess = sinon.spy();
    var initFail = sinon.spy();

    var $fh = process.env.LIB_COV? require("../../src-cov/feedhenry") : require("../../src/feedhenry");

    $fh.reset();
    $fh.init(initSuccess,initFail);

    $fh.cloud({
      path: 'test/echo',
      method: 'GET',
      data: {var1: 'hello'}
    }, success, fail);

    expect(requests).to.have.length.of.at.least(1);
    requests[0].respond(200, { "Content-Type": "application/json" }, JSON.stringify(fhconfig));

    var request = requests[1];
    expect(request.method).to.equal('GET');

    expect(request).to.have.property('url');

    var requestedUrl = url.parse(request.url, true);
    expect(requestedUrl.pathname).to.equal('/test/echo');
    expect(requestedUrl.query).to.have.property('var1', 'hello');

    request.respond(200, { "Content-Type": "application/json" }, '{ "status": "it worked!"}');

    expect(success).to.have.been.calledOnce;
    expect(success).to.have.been.calledWith({ "status": "it worked!"});
    expect(fail).to.have.not.been.called;

  });
});


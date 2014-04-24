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

var qs = process.env.LIB_COV? require("../../src-cov/modules/queryMap"): require("../../src/modules/queryMap");

var fhconfig = {
  "host": "http://localhost:8100",
  "appid" : "testappid",
  "appkey" : "testappkey",
  "mode": "dev"
}

var legacyAppHost = {
  domain: "testing",
  firstTime: false,
  hosts: {
    "releaseCloudUrl": "http://localhost:8102",
    "releaseCloudType": "fh",
    "debugCloudUrl": "http://localhost:8103",
    "debugCloudType": "fh"
  },
  init: {
    "trackId": "testtrackid"
  }
}

var expectedUrl = "http://localhost:8103";
if(document && document.location){
  var doc_url = document.location.href;
  var url_params = qs(doc_url);
  var local = (typeof url_params.url !== 'undefined');
  if(local){
    expectedUrl = url_params.url;
  }
}

var buildFakeRes = function(data){
  return [200, {"Content-Type": "application/json"}, JSON.stringify(data)];
}

var initFakeServer = function(server){
   server.respondWith('GET', /fhconfig.json/, buildFakeRes(fhconfig));

   server.respondWith('POST', /init/, buildFakeRes(legacyAppHost));
}

describe("test legacy app props/app init", function(){
  var server;

  beforeEach(function () { server = sinon.fakeServer.create(); });
  afterEach(function () { server.restore(); });

  describe("test legacy app init", function(){
    it("$fh.init should initialise the app", function(){
      var callback = sinon.spy();

      initFakeServer(server);
      var $fh = process.env.LIB_COV? require("../../src-cov/feedhenry") : require("../../src/feedhenry");

      $fh.reset();

      $fh.init({}, callback);
      server.respond();
      server.respond();

      expect(callback).to.have.been.called;
      expect(callback).to.have.been.calledOnce;
      expect(callback).to.have.been.calledWith(expectedUrl);

      var hostUrl = $fh.getCloudURL();
      expect(hostUrl).to.equal(expectedUrl);
    });
  });

  describe("test auto initialisation", function(){
    it("should emit fhinit events", function(){

      var callback = sinon.spy();

      initFakeServer(server);
      var $fh = process.env.LIB_COV? require("../../src-cov/feedhenry") : require("../../src/feedhenry");
      
      $fh.reset();

      $fh.on('fhinit', callback);

      server.respond();
      server.respond();

      expect(callback).to.have.been.called;
      expect(callback).to.have.been.calledOnce;
      expect(callback).to.have.been.calledWith(null, {host: expectedUrl});

      var hostUrl = $fh.getCloudURL();
      expect(hostUrl).to.equal(expectedUrl);

    });
  });
});
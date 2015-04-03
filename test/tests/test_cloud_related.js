var chai = require('chai');
var expect = chai.expect;
var sinonChai = require('sinon-chai');

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
}

var apphost = {
  domain: "testing",
  firstTime: false,
  hosts: {
    "url": "http://localhost:8101"
  },
  init: {
    "trackId": "testtrackid"
  }
}

var expectedUrl = "http://localhost:8101";
if(document && document.location){
  var doc_url = document.location.href;
  var url_params = qs(doc_url);
  var local = (typeof url_params.url !== 'undefined');
  if(local){
    expectedUrl = url_params.url;
  }
}


var buildFakeRes = function(data){
  return [200, {"Content-Type": "text/script"}, JSON.stringify(data)]; //we deliberately set the wrong content type here to make sure the response does get converted to JSON
}

var initFakeServer = function(server){
   server.respondWith('GET', /fhconfig.json/, buildFakeRes(fhconfig));

   server.respondWith('POST', /init/, buildFakeRes(apphost));
}

describe("test all cloud related", function(){

  var server;

  beforeEach(function () { server = sinon.fakeServer.create(); });
  afterEach(function () { server.restore(); });

  describe("test auto initialisation", function(){
    it("should emit fhinit events", function(){

      var callback = sinon.spy();
      var cb2 = sinon.spy();

      initFakeServer(server);
      var $fh = process.env.LIB_COV? require("../../src-cov/feedhenry") : require("../../src/feedhenry");
      //at this point, $fh is already initialised (and failed), it will not emit another fhinit event 
      //until another call to any $fh cloud APIs, so for testing, call reset which will force it to re-intialise again.
      $fh.reset();

      $fh.on('fhinit', callback);
      $fh.on('fhinit', cb2);

      server.respond();
      server.respond();
      //host url is overridden by the url in the request
      expect(callback).to.have.been.called;
      expect(callback).to.have.been.calledOnce;
      expect(callback).to.have.been.calledWith(null, {host: expectedUrl});

      expect(cb2).to.have.been.called;
      expect(cb2).to.have.been.calledOnce;

      var hostUrl = $fh.getCloudURL();
      expect(hostUrl).to.equal(expectedUrl);

      
      expect($fh).to.have.property("cloud_props");
      expect($fh.cloud_props).to.have.property("hosts");
      expect($fh.cloud_props.hosts).to.have.property("url");
      expect($fh.cloud_props.hosts.url).to.equal(expectedUrl);

      expect($fh).to.have.property("app_props");
    });
  });

  describe("test act/cloud call", function(){
    it("act call should success", function(){
      var success = sinon.spy();
      var fail = sinon.spy();

      initFakeServer(server);

      var data = {echo: 'hi'};

      server.respondWith('POST', /cloud\/echo/, buildFakeRes(data));

      var $fh = process.env.LIB_COV? require("../../src-cov/feedhenry") : require("../../src/feedhenry");
      $fh.reset();

      $fh.fh_timeout = 30000;

      $fh.act({}, success, fail);

      expect(fail).to.have.been.calledOnce;

      var fail2 = sinon.spy();

      $fh.act({act: 'echo', req: {}}, success, fail2);

      server.respond();
      server.respond();
      server.respond();

      expect(success).to.have.been.calledOnce;
      expect(success).to.have.been.calledWith(data);

      expect(fail2).to.have.not.been.called;
    });

    it("should work with cloud call", function(){
      var success = sinon.spy();
      var fail = sinon.spy();

      initFakeServer(server);

      var data = {echo: 'hi'};

      server.respondWith('POST', /test\/echo/, buildFakeRes(data));

      var $fh = process.env.LIB_COV? require("../../src-cov/feedhenry") : require("../../src/feedhenry");
      $fh.reset();

      $fh.cloud({
        path: 'test/echo',
        method: 'POST'
      }, success, fail);

      server.respond();
      server.respond();
      server.respond();

      expect(success).to.have.been.calledOnce;
      expect(success).to.have.been.calledWith(data);
      expect(fail).to.have.not.been.called;
    });
  });

  describe("test auth call", function(){
    it("auth call should work", function(done){
      initFakeServer(server);
      server.respondWith('POST', /authpolicy\/auth/, buildFakeRes({status: "ok", sessionToken: 'testSessionToken'}));
      server.respondWith('POST', /authpolicy\/verifysession/, buildFakeRes({status:"ok", isValid: true}));

      var $fh = process.env.LIB_COV? require("../../src-cov/feedhenry") : require("../../src/feedhenry");
      $fh.reset();

      var success = sinon.spy();
      var fail = sinon.spy();
      $fh.auth({}, success, fail);
      expect(fail).to.have.been.calledOnce;

      fail = sinon.spy();
      $fh.auth({policyId: 'testpolicy', clientToken: 'testtoken', transport: ajax}, success, fail);

      server.respond();
      server.respond();
      server.respond();

      expect(success).to.have.been.calledOnce;
      expect(fail).to.have.not.been.called;

      $fh.auth.hasSession(function(err, exists){
        expect(exists).to.be.ok;

        var verifycb = sinon.spy();
        $fh.auth.verify(verifycb);
        server.respond();
        expect(verifycb).to.have.been.calledWith(null, true);

        $fh.auth.clearSession(function(){
          $fh.auth.hasSession(function(err, exist){
            expect(exist).to.be.false;
            done();
          });
        });
      });
    });
  });

  describe("test mbaas call", function(){
    it("mbaas call should call", function(){
      initFakeServer(server);
      server.respondWith('POST', /mbaas\/forms/, buildFakeRes({"status": "ok"}));

      var $fh = process.env.LIB_COV? require("../../src-cov/feedhenry") : require("../../src/feedhenry");
      $fh.reset();

      var success = sinon.spy();
      var fail = sinon.spy();

      $fh.mbaas({service: "forms"}, success, fail);

      server.respond();
      server.respond();
      server.respond();

      expect(success).to.have.been.calledOnce;
      expect(fail).to.have.not.been.called;
      expect(success).to.have.been.calledWith({"status": "ok"});

    });
  });
});
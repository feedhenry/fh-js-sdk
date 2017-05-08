define(['require', 'chai', 'sinonChai'], function(require, chai, sinonChai){
  var sinon = window.sinon;
  // Chai
  var expect = chai.expect;
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

  var buildFakeRes = function(data){
    return [200, {"Content-Type": "application/json"}, JSON.stringify(data)];
  }

  var initFakeServer = function(server){
     server.respondWith('GET', /fhconfig.json/, buildFakeRes(fhconfig));

     server.respondWith('POST', /init/, buildFakeRes(apphost));
  }

  describe("test all cloud related", function(done){

    var server;
    var initSuccess = sinon.spy();
    var initFail = sinon.spy();

    beforeEach(function () { server = sinon.fakeServer.create(); });
    afterEach(function () { server.restore(); });

    describe("test auto initialisation", function(){
      it("should emit fhinit events", function(){

        var callback = sinon.spy();


        initFakeServer(server);
        var $fh = require("feedhenry");
        $fh.init(initSuccess,initFail);

        //at this point, $fh is already initialised (and failed), it will not emit another fhinit event 
        //until another call to any $fh cloud APIs, so for testing, call reset which will force it to re-intialise again.
        $fh.reset();

        $fh.on('fhinit', callback);

        server.respond();
        server.respond();

        expect(callback).to.have.been.called;
        expect(callback).to.have.been.calledOnce;
        expect(callback).to.have.been.calledWith(null, {host: "http://localhost:8101"});

        var hostUrl = $fh.getCloudURL();
        expect(hostUrl).to.equal("http://localhost:8101");

      });
    });

    describe("test act/cloud call", function(){
      it("act call should success", function(){
        var success = sinon.spy();
        var fail = sinon.spy();

        initFakeServer(server);

        var data = {echo: 'hi'};

        server.respondWith('POST', /cloud\/echo/, buildFakeRes(data));

        var $fh = require("feedhenry");
        $fh.init(initSuccess,initFail);

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

        var $fh = require("feedhenry");
        $fh.init(initSuccess,initFail);

        $fh.cloud({
          path: 'test/echo',
          method: 'POST'
        }, success, fail);

        server.respond();
        server.respond();
        server.respond();

        expect(success).to.have.been.calledOnce;
        expect(success).to.have.been.calledWith(data);

      });
    });

    describe("test auth call", function(){
      it("auth call should work", function(){
        initFakeServer(server);

        server.respondWith('POST', /authpolicy/, buildFakeRes({status: "ok"}));

        var $fh = require("feedhenry");
        $fh.init(initSuccess,initFail);
        var success = sinon.spy();
        var fail = sinon.spy();
        $fh.auth({}, success, fail);
        expect(fail).to.have.been.calledOnce;

        fail = sinon.spy();
        $fh.auth({policyId: 'testpolicy', clientToken: 'testtoken', transport: $fh.ajax}, success, fail);

        server.respond();
        server.respond();
        server.respond();

        expect(success).to.have.been.calledOnce;
        expect(fail).to.have.not.been.called;
      });
    });
  });
});
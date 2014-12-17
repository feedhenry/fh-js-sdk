/*jshint expr: true*/
var proxyquire = require('proxyquireify')(require);
var chai = require('chai');
var expect = chai.expect;
var assert = chai.assert;
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
var _ = require('underscore');
var fakeLocalStore = require('../../fixtures/local_store.js');
var fakeMbaasStore = require('../../fixtures/fake_mbaas.js');
chai.use(sinonChai);

var process = require("process");
if(document && document.location){
  if(document.location.href.indexOf("coverage=1") > -1){
    process.env.LIB_COV = 1;
  }
}

var stubs = {
    './localStorage' : fakeLocalStore,
    './storeMbaas': fakeMbaasStore
};


var config = proxyquire("../../../src/modules/forms/config", stubs);

describe("Config module",function(){
    
    it ("config should be init before usage. config should get data from mbaas.",function(done){
        config.init({},function(err,returnedConfig){
            assert(!err);
            assert(config.get("log_email","logs.enterpriseplc@feedhenry.com"));
            done();
        });
    });

    it ("how to get config properties",function(){
        assert(config.get("appId"), "Expected appId To Be set");
        assert(config.get("mbaasBaseUrl"), "Expected mbaasBaseUrl To Be set");
        assert(config.get("formUrls"), "Expected formUrls To Be set");
        assert(config.get("env"), "Expected env To Be set");
        assert(config.get("defaultConfigValues"), "Expected defaultConfigValues To Be set");
        assert(config.get("userConfigValues"), "Expected userConfigValues To Be set");
    });

    
});

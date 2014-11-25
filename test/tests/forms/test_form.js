/*jshint expr: true*/
var chai = require('chai');
var expect = chai.expect;
var assert = chai.assert;
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
var proxyquire = require('proxyquireify')(require);
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

var Form = proxyquire("../../../src/modules/forms/form", stubs);


describe("Form model", function() {
    it("how to initialise a form with a formid", function(done) {
        var callback = sinon.spy();
    
        //load from local then from remote.
        new Form({
            formId: '52dfd909a926eb2e3f123456',
            fromRemote: true
        }, callback);

        assert(callback.calledOnce);
        assert(!callback.args[0][0]);
        assert(callback.args[0][1]);
    });
});
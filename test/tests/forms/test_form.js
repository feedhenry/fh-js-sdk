var chai = require('chai');
var expect = chai.expect;
var assert = chai.assert;
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
var proxyquire = require('proxyquireify')(require);
var server;
server = sinon.fakeServer.create();
chai.use(sinonChai);


var process = require("process");
if(document && document.location){
  if(document.location.href.indexOf("coverage=1") > -1){
    process.env.LIB_COV = 1;
  }
}

var testFormData = require("../../fixtures/form.json");

var savedModels = {

}

var stubs = {
    "./localStorage": {
        upsert: function(model, cb){
            var localId = "localIdSet" + Math.floor((Math.random() * 1000000000) + 1);
            
            assert.ok(model, "Expected a model to be passed");
            assert.ok(typeof(cb) === "function", "Expected a callback function");

            if(!model.getLocalId()){
                model.set('_ludid', localId);    
            }

            savedModels[localId] = model.toJSON();
            return cb(null, model);
        },
        removeEntry: function(model, cb){
            assert.ok(model, "Expected a model to be passed");
            assert.ok(model.getLocalId(), "Expected a localId to be set");

            assert.ok(savedModels[model.getLocalId()], "Expected a saved model");

            delete savedModels[model.getLocalId()];

            assert.ok(typeof(cb) === "function", "Expected a callback function");
            return cb(null);
        },
        read: function(model, cb){
            assert.ok(model, "Expected a model to be passed");
            assert.ok(model.getLocalId(), "Expected a localId to be set");
            return cb(null, savedModels[model.getLocalId()] || model);    
        }
    },
    "./log": {
        d: function(){
            console.log("Debug Called");
        },
        e: function(){
            console.error("Error Called");
        },
        l: function(){
            console.log("Log Called");
        }
    }
};


var Form = proxyquire("../../../src/modules/forms/form", stubs);


describe("Form model", function() {
    it("how to initialise a form with a formid", function(done) {
        var callback = sinon.spy();
        var error = false;
        try {
            //throw error since no form id
            var form = new Form()
        } catch (e) {
            error = true;
        }
        assert(error);

        var error = false;
    
        //load from local then from remote.
        new Form({
            formId: testFormData._id,
            fromRemote: true
        }, callback);

        server.requests[0].respond(
            200,
            { "Content-Type": "application/json" },
            JSON.stringify(testFormData)
        );

        assert(callback.calledOnce);
        assert(!callback.args[0][0]);
        assert(callback.args[0][1]);
    });
});
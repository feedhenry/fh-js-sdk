var chai = require('chai');
var expect = chai.expect;
var assert = chai.assert;
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
var proxyquire = require('proxyquireify')(require);
chai.use(sinonChai);

var process = require("process");
if(document && document.location){
  if(document.location.href.indexOf("coverage=1") > -1){
    process.env.LIB_COV = 1;
  }
}

var stubs = {
    "./localStorage": {
        upsert: function(model, cb){
          console.log("NNNNNNNNNNNNNNN");
            return cb(null, model);
        }
    }
};


var Model = proxyquire("../../../src/modules/forms/model", stubs);


describe("Form Model", function() {
    it("how to get and set properties", function() {
        var model = new Model();
        model.set("hello", "Model");
        assert(model.get("hello") == "Model");
    });

    it("how to get and set local id", function() {
        var model = new Model();
        model.setLocalId("aaa");
        assert(model.getLocalId() == "aaa");
    });
    it ("how to touch a model",function(done){
        var model=new Model();
        var ts=model.getLocalUpdateTimeStamp();

        assert(ts, "Expected a timestamp but got nothing.");
        setTimeout(function(){
            model.touch();
            assert(ts!=model.getLocalUpdateTimeStamp());
            done();
        },1);
        
    });
    it("how to convert a json string to model data", function() {
        var json = {
            "item": "name",
            "hello": "world"
        }
        var jsonStr = JSON.stringify(json);
        var model = new Model();
        model.fromJSONStr(jsonStr);
        assert(model.get("item") == "name");
        assert(model.get("hello") == "world");
    });

    it("how to save the model to local storage", function(done) {
        var model = new Model();
        model.set("name", "hello");
        model.saveLocal(function(err, res) {
            console.log("RESSS", err, res);
            assert(!err);
            assert(res);
            assert(model.getLocalId());
            done();
        });
    });

    it("how to load model from local storage", function(done) {
        var model = new Model();
        model.set("name", "hello");

        model.saveLocal(function(err, res) {
            assert(!err);
            assert(res);
            assert(model.getLocalId());
            var key = model.getLocalId();
            var model1 = new Model();
            model1.setLocalId(key);

            model1.loadLocal(function(err, res) {
                assert(!err);
                assert(res);
                assert(model1.get("name") == "hello");
                done();
            });

        });
    });

    it("how to remove model from local storage", function(done) {
        var model = new Model();
        model.set("name", "hello");
        model.saveLocal(function(err, res) {
            assert(!err);
            assert(res);
            assert(model.getLocalId());
            model.clearLocal(function(err) {
                assert(!err);
                var key = model.getLocalId();
                var model1 = new Model();
                model1.setLocalId(key);

                model1.loadLocal(function(err, res) {
                    assert(!err);
                    assert(res);
                    assert(model1.get("name") == undefined);
                    done();
                });
            });
        });
    });
    it ("how to emit an event and subscribe to it",function(done){
        var model = new Model();
        model.on("mockEvent",function(param1,param2){
            assert(param1=="hello");
            assert(param2=="world");
            done();
        });
        model.emit("mockEvent","hello","world");
    });
    it ("how to attempt refresh model from remote then local",function(done){
         var model = forms;

        model.attemptRefresh(function(err,model){
            assert(!err);
            assert(model);
            done();
        });
    });
    it ("attempt refresh could fail if neither remote nor local accessible",function(done){
        var model = new Model();
        model.attemptRefresh(function(err,model){
            assert(err);
            assert(model);
            done();
        });
        
    });
});
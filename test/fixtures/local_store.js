/*jshint expr: true*/
var chai = require('chai');
var expect = chai.expect;
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
var assert = chai.assert;
chai.use(sinonChai);

var savedModels = {

};

var stubs = {
    upsert: function(model, cb){
        var localId = "localIdSet" + Math.floor((Math.random() * 1000000000) + 1);
        
        assert.ok(model, "Expected a model to be passed");
        assert.ok(typeof(cb) === "function", "Expected a callback function");
        model.set('_ludid', localId);
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
};

module.exports = stubs;
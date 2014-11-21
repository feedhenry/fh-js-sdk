var chai = require('chai');
var expect = chai.expect;
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
var assert = chai.assert;
chai.use(sinonChai);

var process = require("process");
if(document && document.location){
  if(document.location.href.indexOf("coverage=1") > -1){
    process.env.LIB_COV = 1;
  }
};

var utils = require("../../../src/modules/forms/utils");

describe("test forms utils module", function(){
	it("should extend a function", function(){
		var func1 = function(){};
		func1.prototype.function1 = function(){};

		var func2 = function(){};
		func2.prototype.function2 = function(){};

		utils.extend(func1, func2);

		expect(func1.prototype).to.have.property("function2");
	});
	it ("how to generate a local id from a model",function(){
        var localId=utils.localId("123456", "type1");
        assert(localId);
    });
});
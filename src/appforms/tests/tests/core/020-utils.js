var assert=chai.assert;

describe("Utilities",function(){

    it("how to extend a class",function(){
        var parent=function(){};
        parent.prototype.method1=function(){};
        var child=function(){};
        appForm.utils.extend(child,parent);
        var instance=new child();
        assert(typeof instance.method1 === "function");
        assert(instance.method1==parent.prototype.method1);
    });

    it ("how to generate a local id from a model",function(){
        var utils=appForm.utils;
        var Model=appForm.models.Model;
        var model=new Model;
        var localId=utils.localId(model);
        assert(localId);
    });
});
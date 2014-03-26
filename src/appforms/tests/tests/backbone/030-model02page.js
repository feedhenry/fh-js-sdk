var assert = chai.assert;
var bbPage;

describe("Backbone - Page Model", function() {

    it("create model & collection", function(done) {

        var form=new FormModel({
            formId:"527d4539639f521e0a000004"
        });
        form.loadForm(function(){
            assert.ok(form.getName());
            bbPage=form.getPageModelList()[0];
            assert(bbPage);
            done();
        });
            
    });

    it("get page name & description", function() {
        assert.ok(bbPage.getName());
        assert.ok(bbPage.getDescription());
    });
});
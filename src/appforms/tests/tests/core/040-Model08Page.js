describe("Page model", function() {
    var pageModel = null;
    it("page model objec is initialised when a form is initialised ", function(done) {
        var Form = appForm.models.Form;
        new Form({formId:"527d4539639f521e0a000004",fromRemote: true}, function(err, form) {
            pageModel = form.getPageModelById("527d4539639f521e0a000005");
            assert(pageModel);
            assert(pageModel.get("_id") == "527d4539639f521e0a000005");
            done();
        });
    });
    it ("page model is able to retrieve the field model list",function(){
        
        var fieldModels=pageModel.getFieldModelList();
        assert(fieldModels);

        assert(fieldModels.length>0);
        assert(fieldModels.length == pageModel.getFieldDef().length);
    });

    it ("page model get general information (name, description, fieldDef, etc",function(){
        assert(pageModel.getName());
        assert(pageModel.getDescription());
        assert(pageModel.getFieldDef());
    });

    it ("get a field model by its id",function(){
        var fieldModel=pageModel.getFieldModelById("527d4539639f521e0a000006");
        assert(fieldModel);
        assert(fieldModel.get("_id")=="527d4539639f521e0a000006");
    });
    

});
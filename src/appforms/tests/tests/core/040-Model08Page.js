describe("Page model", function() {
    var pageModel = null;
    it("page model objec is initialised when a form is initialised ", function(done) {
        var Form = appForm.models.Form;
        new Form({formId: testData.formId ,fromRemote: true}, function(err, form) {
            pageModel = form.getPageModelById(testData.pageId);
            assert(pageModel);
            assert(pageModel.get("_id") == testData.pageId);
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
        assert(pageModel.getFieldDef());
    });

    it ("get a field model by its id",function(){
        var fieldModel=pageModel.getFieldModelById(testData.fieldId);
        assert(fieldModel);
        assert(fieldModel.get("_id")== testData.fieldId);
    });

    it("page model by default only returns non-admin fields", function(done){
      var Form = appForm.models.Form;
      new Form({formId: testData.adminFormId ,fromRemote: true}, function(err, form) {
        pageModel = form.getPageModelById(testData.adminPageId);
        assert(pageModel);
        assert(pageModel.get("_id") == testData.adminPageId);

        var fieldModels=pageModel.getFieldModelList();

        //In the test data, there is only a single non-admin field
        assert(fieldModels.length === 1);
        assert(fieldModels[0].getFieldId() === testData.adminNonAdminFieldId);

        done();
      });
    });
});
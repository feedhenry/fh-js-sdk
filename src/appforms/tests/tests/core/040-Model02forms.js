describe("forms model",function(){
    it ("How to load form list from local storage-> mBaaS / can load forms and refresh the model ",function(done){
        var formsModel=appForm.models.forms;
        var timeStamp1=formsModel.getLocalUpdateTimeStamp();
        formsModel.refresh(function(err,model){
            assert(!err);
            var timeStamp2=model.getLocalUpdateTimeStamp();
            assert(timeStamp1!=timeStamp2);
            done();
        });
    });
    it ("how to forcely load form list from mBaaS and store it locally / can load forms and refresh the model forcely from remote",function(done){
        var formsModel=appForm.models.forms;
        var timeStamp1=formsModel.getLocalUpdateTimeStamp();
        formsModel.refresh(true, function(err,model){
            assert(!err);
            var timeStamp2=model.getLocalUpdateTimeStamp();
            assert(timeStamp1!=timeStamp2);
            done();
        });
    });

    it (" how to find a form's meta info from form list / can load a formMeta data by its form id",function(){
        var formsModel=appForm.models.forms;
        var form=formsModel.getFormMetaById(testData.formId);
        assert(form);
        assert(form._id==testData.formId);
        assert(form.lastUpdated);
    });

    it ("how to test if a form model object is up to date / should check if a form is up to date",function(done){
        var form=new appForm.models.Form({formId:testData.formId,fromRemote:true},function(err){
            assert(!err);
            var formsModel=appForm.models.forms;

            assert (!formsModel.isFormUpdated(form));
            done();
        });
    });
    it ("how to return the full list of forms",function(done){
        var formMetaList=appForm.models.forms.getFormsList();
        assert(formMetaList);
        assert(formMetaList.length>0);
        done();
    });
});
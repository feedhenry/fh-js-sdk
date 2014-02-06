describe("submissions model",function(){
    after(function(done){
        
        appForm.models.submissions.clear(done);
    });
    it ("retrieve submissions list",function(){
        var submissions=appForm.models.submissions.getSubmissions();
        assert(submissions);
        assert(submissions instanceof Array);
        
    });

    it ("how to register a submission to the list",function(done){
        var Form = appForm.models.Form;
        //load form
        var form = new Form({formId: testData.formId}, function(err, form) {
            assert(!err);
            var submission=appForm.models.submission.newInstance(form);
            var localId=submission.getLocalId();
            appForm.models.submissions.saveSubmission(submission,function(err){
                assert(!err);
                done();
            });  
        });
    });

    it ("how to load stored submissions list",function(done){
        appForm.models.submissions.loadLocal(function(err){
            assert(!err);
            assert(appForm.models.submissions.getSubmissions().length>0);
            done();
        });
    });
    it ("how to get submission meta data from the list",function(done){
        var Form = appForm.models.Form;
        //load form
        var form = new Form({formId:testData.formId}, function(err, form) {
            assert(!err);
            var submission=appForm.models.submission.newInstance(form);
            var localId=submission.getLocalId();
            appForm.models.submissions.saveSubmission(submission,function(err){
                assert(!err);
                var meta=appForm.models.submissions.findMetaByLocalId(localId);
                assert(meta.formId==submission.get("formId"));
                done();
            });  
        });
        
    });
    it ("how to get submission meta list for a form id",function(){
        var formId=testData.formId;
        var metaList=appForm.models.submissions.findByFormId(formId);
        assert(metaList.length>0);
    });
    it ("how to get submission drafts ",function(){
        var rtn=appForm.models.submissions.getDrafts();
        assert(rtn);
    });

    it ("how to get a submission model from meta data",function(done){
        var metaList=appForm.models.submissions.getSubmissionMetaList();
        var meta=metaList[0];
        appForm.models.submissions.getSubmissionByMeta(meta,function(err,submission){
            assert(!err);
            assert(submission.getLocalId()==meta._ludid);
            done();
        });
    });
});
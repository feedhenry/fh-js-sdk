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
      assert(!err, "Expected no error: " + err);
      var submission=appForm.models.submission.newInstance(form);
      var localId=submission.getLocalId();
      appForm.models.submissions.saveSubmission(submission,function(err){
        assert(!err, "Expected no error: " + err);
        done();
      });
    });
  });

  it ("how to load stored submissions list",function(done){
    appForm.models.submissions.loadLocal(function(err){
      assert(!err, "Expected no error: " + err);
      assert(appForm.models.submissions.getSubmissions().length>0);
      done();
    });
  });
  it ("how to get submission meta data from the list",function(done){
    var Form = appForm.models.Form;
    //load form
    var form = new Form({formId:testData.formId}, function(err, form) {
      assert(!err, "Expected no error: " + err);
      var submission=appForm.models.submission.newInstance(form);
      var localId=submission.getLocalId();
      appForm.models.submissions.saveSubmission(submission,function(err){
        assert(!err, "Expected no error: " + err);
        var meta=appForm.models.submissions.findMetaByLocalId(localId);
        assert(meta.formId==submission.get("formId"));
        done();
      });
    });

  });
  it ("how to get submission using a local id",function(done){
    var Form = appForm.models.Form;
    //load form
    new Form({formId:testData.formId}, function(err, form) {
      assert(!err, "Expected no error: " + err);
      var submission=appForm.models.submission.newInstance(form);
      var localId=submission.getLocalId();
      appForm.models.submissions.saveSubmission(submission,function(err){
        assert(!err, "Expected no error: " + err);
        appForm.models.submissions.getSubmissionByLocalId(localId, function(err, submission){
          assert.ok(!err, "Expected No Error");
          assert.equal(localId, submission.getLocalId());
          done();
        });
      });
    });
  });
  it ("how to get submission using a remote id",function(done){
    var Form = appForm.models.Form;
    //load form
    new Form({formId:testData.formId}, function(err, form) {
      assert(!err, "Expected no error: " + err);
      var submission=appForm.models.submission.newInstance(form);
      var testRemoteId = "remote123456";
      submission.setRemoteSubmissionId(testRemoteId);
      var localId=submission.getLocalId();
      appForm.models.submissions.saveSubmission(submission,function(err){
        assert(!err, "Expected no error: " + err);
        appForm.models.submissions.getSubmissionByRemoteId(testRemoteId, function(err, submission){
          assert.ok(!err, "Expected No Error");
          assert.equal(localId, submission.getLocalId());
          assert.equal(testRemoteId, submission.getRemoteSubmissionId());
          done();
        });
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

  it ("how to get downloaded submissions ",function(done){
    var submissionId = "submissionData";
    var downloadSubmission = appForm.api.downloadSubmission;

    downloadSubmission({fromRemote: true, submissionId: submissionId}, function(err, submission){
      assert.ok(submission);
      assert.ok(submission.getRemoteSubmissionId().length > 0);
      var rtn=appForm.models.submissions.getDownloaded();
      assert(Array.isArray(rtn));
      assert(rtn.length === 1);
      assert(rtn[0].submissionId === submissionId);
      done();
    });

  });

  it ("how to get a submission model from meta data",function(done){
    var metaList=appForm.models.submissions.getSubmissionMetaList();
    var meta=metaList[0];
    appForm.models.submissions.getSubmissionByMeta(meta,function(err,submission){
      assert(!err, "Expected no error: " + err);
      assert(submission.getLocalId()==meta._ludid);
      done();
    });
  });
});
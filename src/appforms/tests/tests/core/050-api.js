describe("$fh.forms API",function(){
  it("$fh.forms.getForms", function(done) {
    var getForms = appForm.api.getForms;

    getForms({"fromRemote": true}, function(err, foundForms){
      assert(!err);

      assert(foundForms.get("_type") === "forms");
      assert(Array.isArray(foundForms.getFormsList()));
      assert(foundForms.getFormsList().length > 0);
      done();
    });
  });
  it("$fh.forms.getForm", function(done) {
    var getForm = appForm.api.getForm;

    getForm({"formId" : "527d4539639f521e0a000004"}, function(err, foundForm){
      assert(!err);

      assert(foundForm.get("_type") === "form");
      assert(foundForm.getName() === "testFieldsForm");
      done();
    });
  });
  it("$fh.forms.getTheme", function(done) {
    var getTheme = appForm.api.getTheme;

    getTheme({"fromRemote": true}, function(err, theme){
      assert(!err);

      assert(theme.get("name") === "ShinyBlueTheme");
      done();
    });
  });
//  it("$fh.forms.getDrafts", function(done) {
//    var getDrafts = appForm.api.getDrafts;
//    var Form = appForm.models.Form;
//
//    var form = new Form({
//      formId: "527d4539639f521e0a000004"
//    }, function(err, form) {
//      assert(!err);
//      var submission = appForm.models.submission.newInstance(form);
//
//      submission.saveDraft(function(err) {
//        assert(!err);
//        var localId = submission.getLocalId();
//        var meta = appForm.models.submissions.findMetaByLocalId(localId);
//        assert(meta._ludid == localId);
//        assert(meta.formId == submission.get("formId"));
//
//        getDrafts({}, function(err, drafts){
//          assert(!err);
//
//          assert(Array.isArray(drafts));
//          assert(drafts.length > 0);
//          assert(drafts[0].localSubmissionId);
//          assert(drafts[0].formId);
//          assert(drafts[0].dateSaved);
//          assert(Date.parse(drafts[0].dateSaved) !== "Invalid Time");
//          done();
//        });
//      });
//    });
//  });
//  it("$fh.forms.getPending", function(done) {
//    var getPending = appForm.api.getPending;
//    var Form = appForm.models.Form;
//
//    var form = new Form({
//      formId: "527d4539639f521e0a000004"
//    }, function(err, form) {
//      assert(!err);
//      var submission = appForm.models.submission.newInstance(form);
//
//      submission.submit(function(err) {
//        assert(!err);
//        var localId = submission.getLocalId();
//        var meta = appForm.models.submissions.findMetaByLocalId(localId);
//        assert(meta._ludid == localId);
//        assert(meta.formId == submission.get("formId"));
//
//
//        getPending({}, function(err, pending){
//          assert(!err);
//
//          assert(Array.isArray(pending));
//          assert(pending.length > 0);
//          assert(pending[0].localSubmissionId);
//          assert(pending[0].formId);
//          assert(pending[0].dateSubmissionStarted);
//          done();
//        });
//      });
//    });
//  });
//  it("$fh.forms.getFailed", function(done) {
//    var getFailed = appForm.api.getFailed;
//    var Form = appForm.models.Form;
//
//    var form = new Form({
//      formId: "527d4539639f521e0a000004"
//    }, function(err, form) {
//      assert(!err);
//      var submission = appForm.models.submission.newInstance(form);
//
//      var localId = submission.getLocalId();
//      appForm.models.submissions.saveSubmission(submission, function(err){
//        assert(!err);
//
//        var meta = appForm.models.submissions.findMetaByLocalId(localId);
//        assert(meta._ludid == localId);
//        assert(meta.formId == submission.get("formId"));
//
//        submission.submit(function(err){
//          assert(!err);
//
//          submission.error("This submission failed somehow.", function(err){
//            assert(!err);
//
//            getFailed({}, function(err, failedSubmissions){
//              assert(!err);
//
//              assert(Array.isArray(failedSubmissions));
//              assert(failedSubmissions.length > 0);
//              assert(failedSubmissions[0].errorMessage);
//              assert(failedSubmissions[0].localSubmissionId);
//              assert(failedSubmissions[0].dateSubmissionStarted);
//              done();
//            });
//          });
//        });
//      });
//    });
//  });
  it("$fh.forms.getSubmissions", function(done) {
    var getSubmissions = appForm.api.getSubmissions;
    var Form = appForm.models.Form;

    var form = new Form({
      formId: "527d4539639f521e0a000004"
    }, function(err, form) {
      assert(!err);
      var submission = appForm.models.submission.newInstance(form);

      submission.saveDraft(function(err){
        assert(!err);

        getSubmissions({}, function(err, submissions){
          assert(!err);

          assert(submissions);
          assert(submissions.get("_type") === "submissions");
          assert(submissions.findByStatus("draft"));
          done();
        });
      });
    });
  });
//  it("$fh.forms.getSubmissionData", function(done) {
//    var getSubmissionData = appForm.api.getSubmissionData;
//
//    //Get Submission Data should return a full submission object populated from local
//    var forms = appForm.models.forms;
//    var submission = appForm.models.submission;
//    var saveDraft = appForm.api.saveDraft;
//    var Form = appForm.models.Form;
//
//    forms.refresh(true, function(err, forms){
//      assert(!err);
//
//      var form = new Form({"formId": "527d4539639f521e0a000004", "fromRemote": false}, function(err, form){
//        assert(!err);
//
//        //Create submission
//        var newSubmission = submission.newInstance(form);
//        var localId = newSubmission.getLocalId();
//        //Add some data to the submission
//        newSubmission.startInputTransaction();
//        newSubmission.addInputValue("527d4539639f521e0a000006","This is some text min 20 chars.", function(err, res){assert.ok(!err); assert.ok(res);});
//        newSubmission.addInputValue("527d4539639f521e0a000006","This is some more text min 20 chars.", function(err, res){assert.ok(!err); assert.ok(res);});
//        newSubmission.addInputValue("527d4539639f521e0a000006","This is even more text min 20 chars.", function(err, res){assert.ok(!err); assert.ok(res);});
//        newSubmission.endInputTransaction(true);
//        //Now save the draft..
//        saveDraft(newSubmission, function(err, savedDraft){
//          assert(!err);
//
//          getSubmissionData({"localSubmissionId" : localId}, function(err, submission){
//            assert(!err);
//
//            assert(submission.get("_type") === "submission");
//            submission.getInputValueByFieldId("527d4539639f521e0a000006", function(err, submissionValues){
//              if(err) console.error(err);
//              assert.ok(!err);
//              assert.ok(submissionValues[0] === "This is some text min 20 chars.");
//            });
//            submission.getInputValueByFieldId("527d4539639f521e0a000006", function(err, submissionValues){
//              if(err) console.error(err);
//              assert.ok(!err);
//              assert.ok(submissionValues[1] === "This is some more text min 20 chars.");
//            });
//            submission.getInputValueByFieldId("527d4539639f521e0a000006", function(err, submissionValues){
//              if(err) console.error(err);
//              assert.ok(!err);
//              assert.ok(submissionValues[2] === "This is even more text min 20 chars.");
//            });
//            done();
//          });
//        });
//      });
//    });
//  });
//  it("$fh.forms.saveDraft", function(done) {
//
//    var forms = appForm.models.forms;
//    var submission = appForm.models.submission;
//    var saveDraft = appForm.api.saveDraft;
//    var Form = appForm.models.Form;
//
//    forms.refresh(true, function(err, forms){
//      assert(!err);
//
//      var form = new Form({"formId": "527d4539639f521e0a000004", "fromRemote": false}, function(err, form){
//        assert(!err);
//
//        //Create submission
//        var newSubmission = submission.newInstance(form);
//
//        //Add some data to the submission
//        newSubmission.startInputTransaction();
//        newSubmission.addInputValue("527d4539639f521e0a000006","This is some text min 20 chars.", function(err, res){
//          if(err) console.error(err);
//          assert.ok(!err);
//          assert.ok(res);
//        });
//        newSubmission.addInputValue("527d4539639f521e0a000006","This is some more text min 20 chars.", function(err, res){
//          if(err) console.error(err);
//          assert.ok(!err);
//          assert.ok(res);
//        });
//        newSubmission.addInputValue("527d4539639f521e0a000006","This is even more text min 20 chars.", function(err, res){
//          if(err) console.error(err);
//          assert.ok(!err);
//          assert.ok(res);
//        });
//        newSubmission.endInputTransaction(true);
//
//        //Now save the draft..
//        saveDraft(newSubmission, function(err, savedDraft){
//          if(err) console.error(err);
//          assert(!err);
//          assert(savedDraft);
//          done();
//        });
//      });
//    });
//  });
  it("$fh.forms.submitForm", function(done) {
    var forms = appForm.models.forms;
    var submitForm = appForm.api.submitForm;
    var Form = appForm.models.Form;
    this.timeout(10000);

    forms.refresh(true, function(err, forms){
      assert(!err);

      var form = new Form({"formId": "527d4539639f521e0a000004", "fromRemote": false}, function(err, form){
        assert(!err);

        //Create submission
        var newSubmission = form.newSubmission();

        //Add some data to the submission
        newSubmission.startInputTransaction();
        newSubmission.addInputValue("527d4539639f521e0a000006","This is some text min 20 chars.", function(err, res){
          if(err) console.error(err);
          assert.ok(!err);
          assert.ok(res);
        });
        newSubmission.addInputValue("527d4539639f521e0a000006","This is some more text min 20 chars.", function(err, res){
          if(err) console.error(err);
          assert.ok(!err);
          assert.ok(res);
        });
        newSubmission.addInputValue("527d4539639f521e0a000006","This is even more text min 20 chars.", function(err, res){
          if(err) console.error(err);
          assert.ok(!err);
          assert.ok(res);
        });
        newSubmission.endInputTransaction(true);

        newSubmission.on("submitted", function(err){
          assert.ok(!err);
          done();
        });

        submitForm(newSubmission, function(err, uploadTask){
          assert(!err);
          assert.ok(uploadTask);

          uploadTask.uploadTick(function(err){
            assert.ok(!err);

            uploadTask.uploadTick(function(err){
              assert.ok(!err);
            });
          });
        });
      });
    });
  });
});
describe("Submission model", function() {
    it("how to create new submission from a form", function(done) {
        var Form = appForm.models.Form;
        //load form
        var form = new Form({
            formId: testData.formId
        }, function(err, form) {
            assert(!err);
            var submission = appForm.models.submission.newInstance(form);
            var localId = submission.getLocalId();
            assert(submission.getStatus() == "new");
            assert(submission);
            assert(localId);
            done();
        });
    });

    it("how to load a submission from local storage without a form", function(done) {
        var Form = appForm.models.Form;
        //load form
        var form = new Form({
            formId: testData.formId
        }, function(err, form) {
            assert(!err);
            var submission = appForm.models.submission.newInstance(form);
            var localId = submission.getLocalId();
            submission.saveDraft(function(err) {
                assert(!err);
                appForm.models.submission.fromLocal(localId, function(err, submission1) {
                    assert(!err);
                    assert(submission1.get("formId") == submission.get("formId"));
                    assert(submission1.getStatus() == "draft");
                    done();
                });

            });
        });
    });

    it("will throw error if status is in wrong order", function(done) {
        var Form = appForm.models.Form;
        var error = false;
        //load form
        var form = new Form({
            formId: testData.formId
        }, function(err, form) {
            assert(!err);
            var submission = appForm.models.submission.newInstance(form);
            var localId = submission.getLocalId();
            submission.saveDraft(function(err) {
                assert(!err);
                try {
                    submission.submitted(function() {

                    });
                } catch (e) {
                    error = true;
                }
                assert(error);
                done();
            });
        });
    });

    it("how to store a draft,and find it from submissions list", function(done) {
        var Form = appForm.models.Form;
        //load form
        var form = new Form({
            formId: testData.formId
        }, function(err, form) {
            assert(!err);
            var submission = appForm.models.submission.newInstance(form);
            var localId = submission.getLocalId();

            submission.saveDraft(function(err) {
                assert(!err);
                var localId = submission.getLocalId();
                var meta = appForm.models.submissions.findMetaByLocalId(localId);
                assert(meta._ludid == localId);
                assert(meta.formId == submission.get("formId"));
                appForm.models.submissions.getSubmissionByMeta(meta, function(err, sub1) {
                    assert(submission === sub1);
                    done();
                });
            });

        });
    });
    it("submission model loaded from local should have only 1 reference", function(done) {
        var meta = appForm.models.submissions.findByFormId(testData.formId)[0];
        var localId = meta._ludid;
        appForm.models.submission.fromLocal(localId, function(err, submission1) {
            appForm.models.submission.fromLocal(localId, function(err, submission2) {
                assert(submission1 === submission2);
                done();
            });

        });
    });
    describe("comment", function() {
        it("how to add a comment to a submission with or without a user", function(done) {
            var meta = appForm.models.submissions.findByFormId(testData.formId)[0];
            // debugger;
            var localId = meta._ludid;
            appForm.models.submission.fromLocal(localId, function(err, submission) {
                assert(!err);
                var ts1 = submission.addComment("hello world");
                var ts2 = submission.addComment("test", "testerName");
                var comments = submission.getComments();
                assert(comments.length > 0);
                var str = JSON.stringify(comments);
                assert(str.indexOf("hello world") > -1);
                assert(str.indexOf("testerName") > -1);
                done();
            });
        });

        it("how to remove a comment from submission", function(done) {
            var meta = appForm.models.submissions.findByFormId(testData.formId)[0];
            var localId = meta._ludid;
            appForm.models.submission.fromLocal(localId, function(err, submission) {
                assert(!err, "unexpected error: " + err);
                var ts1 = submission.addComment("hello world2");
                submission.removeComment(ts1);
                var comments = submission.getComments();

                var str = JSON.stringify(comments);
                assert(str.indexOf(ts1.toString()) == -1, "comment still in submission: " + str);
                done();
            });
        });

    });

    describe("User input", function() {
        var submission = null;
        before(function(done) {
            var Form = appForm.models.Form;
            //load form
            var form = new Form({
                formId: testData.formId
            }, function(err, form) {
                assert(!err);
                submission = appForm.models.submission.newInstance(form);
                var localId = submission.getLocalId();
                assert(submission.getStatus() == "new");
                assert(submission);
                assert(localId);
                done();
            });
        });
        it("how to add user input value to submission model", function() {
            submission.addInputValue({
                fieldId: testData.fieldId,
                value: 40
            }, function(err) {
                assert(!err)
            });
            submission.getInputValueByFieldId(testData.fieldId, function(err, res) {
                assert(res[0] == 40);
            });
        });
        it("how to reset a submission to clear all user input", function() {
            submission.addInputValue({
                fieldId: testData.fieldId,
                value: 40
            }, function(err) {
                assert(!err)
            });
            submission.reset();
            submission.getInputValueByFieldId(testData.fieldId, function(err, res) {
                assert(!err);
                assert(res.length == 0);
            });
        });

        it("how to use transaction to input a series of user values to submission model", function() {
            submission.reset();
            submission.addInputValue({
                fieldId: testData.fieldId,
                value: 40
            }, function(err) {
                assert(!err)
            });
            submission.startInputTransaction();
            submission.addInputValue({
                fieldId: testData.fieldId,
                value: 50
            }, function(err) {
                assert(!err)
            });
            submission.addInputValue({
                fieldId: testData.fieldId,
                value: 60
            }, function(err) {
                assert(!err)
            });
            submission.addInputValue({
                fieldId: testData.fieldId,
                value: 35
            }, function(err) {
                assert(!err)
            });
            submission.endInputTransaction(true);
            submission.getInputValueByFieldId(testData.fieldId, function(err, res) {
                assert(res[0] == 40);
            });
            submission.getInputValueByFieldId(testData.fieldId, function(err, res) {
                assert(res[1] == 50);
            });
            submission.getInputValueByFieldId(testData.fieldId, function(err, res) {
                assert(res[2] == 60);
            });
            submission.getInputValueByFieldId(testData.fieldId, function(err, res) {
                assert(res[3] == 35);
            });
        });
        it("how to use transaction for user input and roll back", function() {
            submission.reset();
            submission.addInputValue({
                fieldId: testData.fieldId,
                value: 40
            }, function(err) {
                assert(!err)
            });
            submission.startInputTransaction();
            submission.addInputValue({
                fieldId: testData.fieldId,
                value: 50
            }, function(err) {
                assert(!err)
            });
            submission.addInputValue({
                fieldId: testData.fieldId,
                value: 60
            }, function(err) {
                assert(!err)
            });
            submission.addInputValue({
                fieldId: testData.fieldId,
                value: 35
            }, function(err) {
                assert(!err)
            });
            submission.endInputTransaction(false);
            submission.getInputValueByFieldId(testData.fieldId, function(err, res) {
                assert(res[0] == 40);
            });
            submission.getInputValueByFieldId(testData.fieldId, function(err, res) {
                assert(res[1] == undefined);
            });
            submission.getInputValueByFieldId(testData.fieldId, function(err, res) {
                assert(res[2] == undefined);
            });
            submission.getInputValueByFieldId(testData.fieldId, function(err, res) {
                assert(res[3] == undefined);
            });
        });
    });

    describe("upload submission with upload manager", function() {
        var form = null;
        before(function(done) {
            var Form = appForm.models.Form;
            new Form({
                formId: testData.formId,
                fromRemote: true
            }, function(err, _form) {
                form = _form;
                done();
            });
        });
        it("how to queue a submission", function(done) {
            var submission = form.newSubmission();
            this.timeout(20000);
            submission.on("submit", function(err) {
                assert(!err);

                submission.upload(function(err, uploadTask) {
                    assert(!err);
                    assert(uploadTask);
                    assert(appForm.models.uploadManager.timer);
                    assert(appForm.models.uploadManager.hasTask());

                    submission.getUploadTask(function(err, task) {
                        assert(!err);
                        assert(task);
                        done();
                    });
                });
            });

            submission.submit(function(err) {
               if(err) console.log(err);
               assert(!err);
            });
        });
        it("how to monitor if a submission is submitted", function(done) {
            var submission = form.newSubmission();
            this.timeout(20000);

            submission.on("submit", function() {
                submission.upload(function(err, uploadTask) {
                    assert(!err);
                    assert(uploadTask);
                });
            });
            submission.on("progress", function(err ,progress){
              console.log("PROGRESS: ", err, progress);
            });
            submission.on("error", function(err ,progress){
              console.log("ERROR: ", err, progress);
            });
            submission.on("submitted", function(err) {
                assert(!err);
                done();
            });
            submission.submit(function(err) {
                assert(!err);
            });
        });

    });
});
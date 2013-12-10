describe("UploadTask model", function() {
    var form;
    before(function(done) {
        var Form = appForm.models.Form;
        new Form({
            formId: "527d4539639f521e0a000004",
            fromRemote: true
        }, function(err, _form) {
            form = _form;
            done();
        });
    });
    it("how to upload submission form", function(done) {
        var submission = form.newSubmission();
        var ut = appForm.models.uploadTask.newInstance(submission);
        ut.uploadForm(function(err) {
            assert(!err);
            var progress = ut.getProgress();
            assert(progress.formJSON);
            done();
        });
    });

    it("how to dealwith out of date submission", function(done) {
        var submission = form.newSubmission();
        submission.set("outOfDate", true);
        submission.changeStatus("pending", function() {});
        submission.changeStatus("inprogress", function() {});
        var ut = appForm.models.uploadTask.newInstance(submission);
        ut.uploadForm(function(err) {

            assert(err);
            var progress = ut.getProgress();
            assert(!progress.formJSON);
            assert(ut.isCompleted());
            assert(ut.get("error"));
            done();
        });
    });

    it("how to upload a file ", function(done) {
        this.timeout(10000);
        var submission = form.newSubmission();
        submission.changeStatus("pending", function() {});
        submission.changeStatus("inprogress", function() {});
        appForm.utils.fileSystem.save("testfile.txt", "content of the file", function(err) {
            assert(!err);
            appForm.utils.fileSystem.readAsFile("testfile.txt", function(err, file) {
                submission.addInputValue("52974ee55e272dcb3d0000a6", file, function(err) {
                    assert(!err);
                    var ut = appForm.models.uploadTask.newInstance(submission);
                    ut.uploadForm(function(err) { //need to upload form first to get submission id
                        assert(!err);

                        ut.uploadFile(function(err) {
                            assert(!err);
                            assert(ut.get("currentTask") == 1);
                            done();
                        });
                    });
                });
            });
        });
    });

    it("how to upload by tick", function(done) {
        this.timeout(10000);
        var submission = form.newSubmission();
        submission.changeStatus("pending", function() {});
        submission.changeStatus("inprogress", function() {});
        appForm.utils.fileSystem.save("testfile.txt", "content of the file", function(err) {
            assert(!err);
            appForm.utils.fileSystem.readAsFile("testfile.txt", function(err, file) {
                submission.addInputValue("52974ee55e272dcb3d0000a6", file, function(err) {
                    assert(!err);
                    var ut = appForm.models.uploadTask.newInstance(submission);
                    var sending = false;
                    var timer = setInterval(function() {
                        if (ut.isCompleted()) {
                            clearInterval(timer);
                            assert(ut.get("currentTask") == 1);
                            done();
                        }
                        if (sending == false) {
                            sending = true;
                            ut.uploadTick(function(err) {
                                assert(!err);
                                sending=false;
                            });
                        } else {

                        }

                    }, 500);
                });
            });
        });
    });

    it("how to get total upload size", function() {
        var submission = form.newSubmission();
        submission.changeStatus("pending", function() {});
        submission.changeStatus("inprogress", function() {});
        var ut = appForm.models.uploadTask.newInstance(submission);
        assert(ut.getTotalSize());
    });

    it("how to get uploaded size", function(done) {
        var submission = form.newSubmission();
        submission.changeStatus("pending", function() {});
        submission.changeStatus("inprogress", function() {});
        var ut = appForm.models.uploadTask.newInstance(submission);
        assert(ut.getTotalSize());
        assert(ut.getUploadedSize() == 0);
        ut.uploadTick(function() {
            assert(ut.getTotalSize() == ut.getUploadedSize());
            done();
        });
    });


});
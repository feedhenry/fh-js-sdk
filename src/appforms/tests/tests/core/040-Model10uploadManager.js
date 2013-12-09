describe("upload manager", function() {
    var uploadManager = null;
    var form=null;
    before(function(done) {
        uploadManager = appForm.models.uploadManager;
        var Form = appForm.models.Form;
        new Form({
            formId: "527d4539639f521e0a000004",
            fromRemote: true
        }, function(err, _form) {
            form = _form;
            done();
        });
    })
    it("how to check if there is task in queue", function() {
        appForm.models.uploadManager.hasTask();
    });



});
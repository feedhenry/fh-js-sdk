describe("Form model", function() {
    it("how to initialise a form with a formid", function(done) {
        var Form = appForm.models.Form;
        var error = false;
        try {
            //throw error since no form id
            var form = new Form()
        } catch (e) {
            error = true;
        }
        assert(error);

        var error = false;
        try {
            //load from local then from remote.
            new Form({
                formId: "527d4539639f521e0a000004",
                fromRemote: true
            }, function(err, form) {
                assert(!err);
                assert(form);
                assert(form.get("_id") == "527d4539639f521e0a000004");
                assert(form.getLastUpdate());
                assert(form.get("name") == "testFieldsForm");
                done();
            });
        } catch (e) {
            console.log(e);
            error = true;
        }
        assert(!error);
        if (error) {
            done();
        }
    });
    it("how to initialise a form and pop data associated forcely from remote", function(done) {
        var Form = appForm.models.Form;
        var form = new Form({
            formId: "527d4539639f521e0a000004"
        }, function(err, form) {
            assert(!err);
            assert(form);
            assert(form.get("_id") == "527d4539639f521e0a000004");
            assert(form.getLastUpdate());
            assert(form.get("name") == "testFieldsForm");
            done();
        });
    });

    it("if form id is not found when trying to pop data, it will return error ", function(done) {
        var Form = appForm.models.Form;
        var form = new Form({
            formId: "somerandomformid"
        }, function(err, form) {
            assert(err);
            assert(form);

            done();
        });
    });
    it("how to get form general properties (name, description,etc)", function(done) {
        var Form = appForm.models.Form;
        var form = new Form({
            formId: "527d4539639f521e0a000004",
            fromRemote: true
        }, function(err, form) {
            assert(form.getName());
            assert(form.getDescription());
            assert(form.getPageRules());
            assert(form.getFieldRules());
            done();
        });
    });
    it("how to get pages associated to the form", function(done) {
        var Form = appForm.models.Form;
        new Form({
            formId: "527d4539639f521e0a000004",
            fromRemote: true
        }, function(err, form) {
            var pageList = form.getPageModelList();
            assert(pageList);
            assert(pageList.length == 1);
            done();
        });
    });

    it("how to get a field model by field id", function(done) {
        var Form = appForm.models.Form;
        new Form({
            formId: "527d4539639f521e0a000004",
            fromRemote: true
        }, function(err, form) {
            var fieldModel = form.getFieldModelById("527d4539639f521e0a000006");
            assert(fieldModel);
            assert(fieldModel.get("_id") == "527d4539639f521e0a000006");
            done();
        });
    });
    it("how to get a page model by page id", function(done) {
        var Form = appForm.models.Form;
        new Form({
            formId: "527d4539639f521e0a000004",
            fromRemote: true
        }, function(err, form) {
            var pageModel = form.getPageModelById("527d4539639f521e0a000005");
            assert(pageModel);
            assert(pageModel.get("_id") == "527d4539639f521e0a000005");
            done();
        });
    });

    it("how to initialise a new submission from a form", function(done) {
        var Form = appForm.models.Form;
        new Form({
            formId: "527d4539639f521e0a000004",
            fromRemote: true
        }, function(err, form) {
            var submission = form.newSubmission();
            assert(submission);
            assert(submission.get("formId", "527d4539639f521e0a000004"));
            done();
        });
    });

    it("form initialisation is singleton for a single formid. only 1 instance of form model will be returned for same form id", function(done) {
        var Form = appForm.models.Form;
        new Form({
            formId: "527d4539639f521e0a000004",
            fromRemote: true
        }, function(err, form1) {
            new Form({
                formId: "527d4539639f521e0a000004",
                fromRemote: true
            }, function(err, form2) {
                assert(!err);
                assert(form1 === form2);
                done();
            });

        });
    });
    it("how to remove a form from cache and return new instance", function(done) {
        var Form = appForm.models.Form;
        new Form({
            formId: "527d4539639f521e0a000004",
            fromRemote: true
        }, function(err, form1) {
            form1.removeFromCache(); //remove form1 from cache.
            new Form({ //this will not load the form mem cache but still from local storage
                formId: "527d4539639f521e0a000004",
                fromRemote: false
            }, function(err, form2) {
                assert(!err);
                assert(form1 != form2);
                done();
            });

        });
    });

    it ("how to initialise form with raw json definition",function(done){
        appForm.web.ajax.get("/mbaas/forms/appid/527d4539639f521e0a000004",function(err,res){
            var formJSON=res;
             var Form = appForm.models.Form;
             new Form({
                "formId":"myformid",
                "rawMode":true,
                "rawData":formJSON
             },function(err,form){
                assert(!err);
                assert(form);
                assert(form.getPageModelList());
                done();
             });
        });
    });

});
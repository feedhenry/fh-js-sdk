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
                formId: testData.formId,
                fromRemote: true
            }, function(err, form) {
                console.log("FINISHED", err, form);
                assert(!err, "Expected no error: " + err);
                assert(form);
                assert(form.get("_id") == testData.formId);
                assert(form.getLastUpdate());
                assert(form.get("name") == testData.formName);
                done();
            });
        } catch (e) {
          console.log("FINISHED EXE", e);
            console.error(e);
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
            formId: testData.formId
        }, function(err, form) {
            assert(!err, "Expected no error: " + err);
            assert(form);
            assert(form.get("_id") == testData.formId);
            assert(form.getLastUpdate());
            assert(form.get("name") == testData.formName);
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
            formId: testData.formId,
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
            formId: testData.formId,
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
            formId: testData.formId,
            fromRemote: true
        }, function(err, form) {
            var fieldModel = form.getFieldModelById(testData.fieldId);
            assert(fieldModel, "fieldModel is null/undefined");
            assert(fieldModel.get("_id") == testData.fieldId, "fieldModel has wrong fieldId: " + fieldModel.get("_id"));
            done();
        });
    });

    it("how to get a field model by field code", function(done) {
      var Form = appForm.models.Form;
       new Form({
         formId: testData.formId,
         fromRemote: true
       }, function(err, form){
         assert.ok(!err, "Unexpected Error Getting Form");
         assert.ok(form, "Expected A Form But Got Null");

         //Getting a field by code.
         var field = form.getFieldModelByCode(testData.fieldCode);

         assert.ok(field, "Expected to find a field but got nothing.");
         assert.ok(field.getName() === "LOCN", "Expected field name to be 'LOCN' but was " + field.getName());
         done();
       });
    });

    it("how to get a page model by page id", function(done) {
        var Form = appForm.models.Form;
        new Form({
            formId: testData.formId,
            fromRemote: true
        }, function(err, form) {
            var pageModel = form.getPageModelById(testData.pageId);
            assert(pageModel);
            assert(pageModel.get("_id") == testData.pageId);
            done();
        });
    });

    it("how to initialise a new submission from a form", function(done) {
        var Form = appForm.models.Form;
        new Form({
            formId: testData.formId,
            fromRemote: true
        }, function(err, form) {
            var submission = form.newSubmission();
            assert(submission);
            assert(submission.get("formId", testData.formId));
            done();
        });
    });

    it("form initialisation is singleton for a single formid. only 1 instance of form model will be returned for same form id", function(done) {
        var Form = appForm.models.Form;
        new Form({
            formId: testData.formId,
            fromRemote: true
        }, function(err, form1) {
            new Form({
                formId: testData.formId,
                fromRemote: true
            }, function(err, form2) {
                assert(!err, "Expected no error: " + err);
                assert(form1 === form2);
                done();
            });

        });
    });
    it("how to remove a form from cache and return new instance", function(done) {
        var Form = appForm.models.Form;
        new Form({
            formId: testData.formId,
            fromRemote: true
        }, function(err, form1) {
            form1.removeFromCache(); //remove form1 from cache.
            new Form({ //this will not load the form mem cache but still from local storage
                formId: testData.formId,
                fromRemote: false
            }, function(err, form2) {
                assert(!err, "Expected no error: " + err);
                assert(form1 != form2);
                done();
            });

        });
    });

    it ("how to initialise form with raw json definition",function(done){
        appForm.web.ajax.get("/mbaas/forms/appId" + testData.formId,function(err,res){
            var formJSON=res;
             var Form = appForm.models.Form;
             new Form({
                "formId":"myformid",
                "rawMode":true,
                "rawData":formJSON
             },function(err,form){
                assert(!err, "Expected no error: " + err);
                assert(form);
                assert(form.getPageModelList());
                done();
             });
        });
    });

});
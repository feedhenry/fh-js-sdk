describe("$fh.forms API", function() {
  it("$fh.forms.getForms", function(done) {
    var getForms = appForm.api.getForms;

    getForms({
      "fromRemote": true
    }, function(err, foundForms) {
      assert(!err);

      assert(foundForms.get("_type") === "forms");
      assert(Array.isArray(foundForms.getFormsList()));
      assert(foundForms.getFormsList().length > 0);
      done();
    });
  });
  it("$fh.forms.getForm", function(done) {
    var getForm = appForm.api.getForm;

    getForm({
      "formId": testData.formId
    }, function(err, foundForm) {
      assert(!err);

      assert(foundForm.get("_type") === "form");
      assert(foundForm.getName() === testData.formName);
      done();
    });
  });
  it("$fh.forms.getTheme", function(done) {
    var getTheme = appForm.api.getTheme;

    getTheme({
      "fromRemote": true
    }, function(err, theme) {
      assert(!err);

      assert(theme.get("name") === testData.themeName);
      done();
    });
  });
  it("$fh.forms.getTheme with CSS", function(done) {
    var getTheme = appForm.api.getTheme;

    getTheme({
      "fromRemote": true,
      "css" : true
    }, function(err, themeCSS) {
      assert(!err);

      assert(typeof(themeCSS) === "string");
      done();
    });
  });
  it("$fh.forms.getSubmissions", function(done) {
    var getSubmissions = appForm.api.getSubmissions;
    var Form = appForm.models.Form;

    var form = new Form({
      formId: testData.formId
    }, function(err, form) {
      assert(!err);
      var submission = appForm.models.submission.newInstance(form);

      submission.saveDraft(function(err) {
        assert(!err);

        getSubmissions({}, function(err, submissions) {
          assert(!err);

          assert(submissions);
          assert(submissions.get("_type") === "submissions");
          assert(submissions.findByStatus("draft"));
          done();
        });
      });
    });
  });
  it("$fh.forms.submitForm", function(done) {
    var forms = appForm.models.forms;
    var submitForm = appForm.api.submitForm;
    var Form = appForm.models.Form;
    this.timeout(10000);

    forms.refresh(true, function(err, forms) {
      assert(!err);

      var form = new Form({
        "formId": testData.formId,
        "fromRemote": false
      }, function(err, form) {
        assert(!err);

        //Create submission
        var newSubmission = form.newSubmission();

        //Add some data to the submission
        newSubmission.startInputTransaction();
        newSubmission.addInputValue({
          fieldId: testData.fieldId,
          value: "This is some text min 20 chars."
        }, function(err, res) {
          if (err) console.error(err);
          assert.ok(!err);
          assert.ok(res);
        });
        newSubmission.addInputValue({
          fieldId: testData.fieldId,
          value: "This is some more text min 20 chars."
        }, function(err, res) {
          if (err) console.error(err);
          assert.ok(!err);
          assert.ok(res);
        });
        newSubmission.addInputValue({
          fieldId: testData.fieldId,
          value: "This is even more text min 20 chars."
        }, function(err, res) {
          if (err) console.error(err);
          assert.ok(!err);
          assert.ok(res);
        });
        newSubmission.endInputTransaction(true);

        newSubmission.on("submitted", function(submissionId) {
          assert.ok(submissionId);
          done();
        });

        submitForm(newSubmission, function(err, uploadTask) {
          assert(!err);
          assert.ok(uploadTask);

          uploadTask.uploadTick(function(err) {
            assert.ok(!err);

            uploadTask.uploadTick(function(err) {
              assert.ok(!err);
            });
          });
        });
      });
    });
  });
  it("$fh.forms.downloadSubmission", function(done){
    this.timeout(10000);
    var submissionId = "submissionData";
    var downloadSubmission = appForm.api.downloadSubmission;

    downloadSubmission({fromRemote: true, submissionId: submissionId}, function(err, submission){
      assert.ok(submission);
      console.log("Submission Data: ", submission);
      assert.ok(submission.getRemoteSubmissionId().length > 0);
      done();
    });
  });
  it("$fh.forms.downloadSubmission with files", function(done){
    this.timeout(10000);
    var submissionId = "submissionFile";
    var downloadSubmission = appForm.api.downloadSubmission;

    downloadSubmission({fromRemote: true, submissionId: submissionId}, function(err, submission){
      assert.ok(submission);
      console.log("Submission File: ", submission);
      assert.ok(submission.getRemoteSubmissionId().length > 0);
      assert.ok(submission.getSubmissionFiles().length === 1);
      assert.ok(submission.getSubmissionFiles()[0].url);
      assert.ok(submission.getSubmissionFiles()[0].localURI);

      //Checking for no null values
      var formFields = submission.getFormFields();
      _.each(formFields, function(formField){
        var values = formField.fieldValues;
        _.each(values, function(value){
          assert.ok(value !== null && typeof(value) !== "undefined");
        });
      });

      done();
    });
  });
  it("$fh.forms.on function should register a global event emitter", function(done){
    //First Register A Function to be emitted
    var modelEventCalled = false;
    var firstArg = "arg1";
    var secondArg = "arg2";

    var testModel = new appForm.models.Model({
      _type: "somemodel"
    });

    testModel.on('someevent', function(arg1, arg2){
      modelEventCalled = true;
      assert.equal(firstArg, arg1);
      assert.equal(secondArg, arg2);
      assert.strictEqual(this, testModel);
    });

    //A Global Monitoring Function
    var functionToEmit = function(arg1, arg2){
      assert.equal(firstArg, arg1);
      assert.equal(secondArg, arg2);
      assert.equal(true, modelEventCalled);
      assert.strictEqual(this, testModel);
      done();
    };

    appForm.api.on("somemodel:someevent", functionToEmit);

    testModel.emit("someevent", firstArg, secondArg);
  });
  it("$fh.forms.once function should register a global event emitter to be called only once", function(done){
    //First Register A Function to be emitted
    var modelEventCalled = false;
    var numTimesGlobalEventCalled = 0;
    var firstArg = "arg1";
    var secondArg = "arg2";

    var testModel = new appForm.models.Model({
      _type: "somemodel"
    });

    testModel.on('onceevent', function(arg1, arg2){
      modelEventCalled = true;
      assert.equal(firstArg, arg1);
      assert.equal(secondArg, arg2);
      assert.strictEqual(this, testModel);
    });

    //A Global Monitoring Function
    var functionToEmitOnce = function(arg1, arg2){
      numTimesGlobalEventCalled++;
      assert.equal(1, numTimesGlobalEventCalled);
      assert.equal(firstArg, arg1);
      assert.equal(secondArg, arg2);
      //The third argument should not exist
      assert.equal(undefined, arguments[2]);
      assert.equal(true, modelEventCalled);
      assert.strictEqual(this, testModel);
      done();
    };

    appForm.api.once("somemodel:onceevent", functionToEmitOnce);

    testModel.emit("onceevent", firstArg, secondArg);
    testModel.emit("onceevent", firstArg, secondArg, "someotherarg");
  });
});
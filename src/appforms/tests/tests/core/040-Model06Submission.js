describe("Submission model", function() {
  before(function(done) {
    if (appForm.utils.fileSystem.isFileSystemAvailable()) {
      appForm.utils.fileSystem.clearFileSystem(done, done);
    } else {
      done();
    }
  });
  it("how to create new submission from a form", function(done) {
    var Form = appForm.models.Form;
    //load form
    var form = new Form({
      formId: testData.formId
    }, function(err, form) {
      assert(!err, "Expected no error: " + err);
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
      assert(!err, "Expected no error: " + err);
      var submission = appForm.models.submission.newInstance(form);
      var localId = submission.getLocalId();
      submission.saveDraft(function(err) {
        assert(!err, "Expected no error: " + err);
        appForm.models.submission.fromLocal(localId, function(err, submission1) {
          assert(!err, "Expected no error: " + err);
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
      assert(!err, "Expected no error: " + err);
      var submission = appForm.models.submission.newInstance(form);
      var localId = submission.getLocalId();
      submission.saveDraft(function(err) {
        assert(!err, "Expected no error: " + err);

        submission.submitted(function(err) {
          assert(err);
          done();
        });
      });
    });
  });

  it("how to store a draft,and find it from submissions list", function(done) {
    var Form = appForm.models.Form;
    //load form
    var form = new Form({
      formId: testData.formId
    }, function(err, form) {
      assert(!err, "Expected no error: " + err);
      var submission = appForm.models.submission.newInstance(form);
      var localId = submission.getLocalId();

      submission.saveDraft(function(err) {
        assert(!err, "Expected no error: " + err);
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

  it("A new submission should have default values set", function(done) {
    var Form = appForm.models.Form;
    var testDefaultValueForm = {
      "_id": "58218fde6ec6d6aa36746758",
      "name": "Test Default Value Form",
      "createdBy": "testing-admin@example.com",
      "pages": [{
        "_id": "58218fde6ec6d6aa36746757",
        "fields": [{
          "required": true,
          "type": "radio",
          "name": "Rad",
          "fieldCode": null,
          "_id": "58218ffd6ec6d6aa36746759",
          "adminOnly": false,
          "fieldOptions": {
            "validation": {"validateImmediately": true},
            "definition": {
              "options": [{"label": "Rad 1", "checked": false}, {
                "label": "Rad 2",
                "checked": false
              }, {"checked": true, "name": "", "label": "Rad 3"}]
            }
          },
          "repeating": false
        }, {
          "required": true,
          "type": "dropdown",
          "name": "Dropdown",
          "_id": "58218ffd6ec6d6aa3674675a",
          "adminOnly": false,
          "fieldOptions": {
            "definition": {
              "options": [{"label": "Drop 1", "checked": false}, {"label": "Drop 2", "checked": true}],
              "include_blank_option": false
            }
          },
          "repeating": false
        }, {
          "required": true,
          "type": "checkboxes",
          "name": "Check",
          "fieldCode": null,
          "_id": "58218ffd6ec6d6aa3674675b",
          "adminOnly": false,
          "fieldOptions": {
            "definition": {"options": [{"label": "Check 1", "checked": true}, {"label": "Check 2", "checked": true}]}
          },
          "repeating": false
        }, {
          "required": true,
          "type": "text",
          "name": "Text Field",
          "_id": "53146c1f04e694ec1ad715b6",
          "repeating": false,
          "fieldOptions": {
            definition: {defaultValue: "somedefaulttext"}
          }
        }, {
          "required": true,
          "type": "number",
          "name": "Number Field",
          "_id": "53146c1f04e694ec1ad71123",
          "repeating": false,
          "fieldOptions": {}
        }]
      }],
      "pageRef": {"58218fde6ec6d6aa36746757": 0},
      "fieldRef": {
        "58218ffd6ec6d6aa36746759": {"page": 0, "field": 0},
        "58218ffd6ec6d6aa3674675a": {"page": 0, "field": 1},
        "58218ffd6ec6d6aa3674675b": {"page": 0, "field": 2},
        "53146c1f04e694ec1ad715b6": {"page": 0, "field": 3},
        "53146c1f04e694ec1ad71123": {"page": 0, "field": 4}
      }
    };


    new Form({
      formId: "58218fde6ec6d6aa36746758",
      rawMode: true,
      rawData: testDefaultValueForm
    }, function(err, formModel) {
      assert.ok(!err, "Expected no error when initialising the form " + err);

      //Creating a new submission based on the form model
      var submission = formModel.newSubmission();

      //The default values should be set for the different field types.
      var formFields = submission.getFormFields();

      //The radio field should have the checked option added to the submission by default
      var formField = _.findWhere(formFields, {fieldId: "58218ffd6ec6d6aa36746759"});

      assert.ok(formField, "Expected a submission entry for the radio field.");
      assert.equal("Rad 3", formField.fieldValues[0]);

      //The dropdown field should have the checked option added to the submission by default
      formField = _.findWhere(formFields, {fieldId: "58218ffd6ec6d6aa3674675a"});

      assert.ok(formField, "Expected a submission entry for the dropdown field.");
      assert.equal("Drop 2", formField.fieldValues[0]);

      //The checkboxes field should have the checked options added to the submission by default
      formField = _.findWhere(formFields, {fieldId: "58218ffd6ec6d6aa3674675b"});

      assert.ok(formField, "Expected a submission entry for the checkbox field.");
      //The checkbox entries are arrays as they can have multiple values.
      assert.equal("Check 1", formField.fieldValues[0][0]);
      assert.equal("Check 2", formField.fieldValues[0][1]);


      //The text field should have the default value option added to the submission by default
      formField = _.findWhere(formFields, {fieldId: "53146c1f04e694ec1ad715b6"});

      assert.ok(formField, "Expected a submission entry for the text field.");
      assert.equal("somedefaulttext", formField.fieldValues[0]);

      //The number field should not have an entry as it has no default value.
      formField = _.findWhere(formFields, {fieldId: "53146c1f04e694ec1ad71123"});

      assert.ok(!formField, "Expected no submission entry for the number field.");
      done();
    });
  });

  describe("comment", function() {
    it("how to add a comment to a submission with or without a user", function(done) {
      var meta = appForm.models.submissions.findByFormId(testData.formId)[0];
      // debugger;
      var localId = meta._ludid;
      appForm.models.submission.fromLocal(localId, function(err, submission) {
        assert(!err, "Expected no error: " + err);
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
        assert(!err, "Expected no error: " + err);
        submission = appForm.models.submission.newInstance(form);
        var localId = submission.getLocalId();
        assert(submission.getStatus() == "new");
        assert(submission);
        assert(localId);
        done();
      });
    });

    it("Removing an input value from a submission", function(done) {
      async.waterfall([
        function createForm(cb) {
          var Form = appForm.models.Form;
          //load form
          var form = new Form({
            formId: testData.formId
          }, function(err, form) {
            assert(!err, "Expected no error " + err);
            cb(err, form);
          });
        },
        function addValue(form, cb) {
          var submission = appForm.models.submission.newInstance(form);

          submission.addInputValue({
            fieldId: testData.fieldId,
            value: 40
          }, function(err) {
            assert(!err, "Expected no error: " + err);
            cb(err, form, submission);
          });
        },
        function verifyValueAdded(form, submission, cb) {
          submission.getInputValueByFieldId(testData.fieldId, function(err, values) {
            assert.equal(40, values[0]);

            cb(err, form, submission);
          });
        },
        function removeValue(form, submission, cb) {
          submission.removeFieldValue(testData.fieldId, 0);

          //The value should now have been removed.
          submission.getInputValueByFieldId(testData.fieldId, function(err, values) {
            assert.equal(undefined, values[0]);

            cb(err);
          });
        }
      ], done);
    });

    it("Removing a file input value from a submission", function(done) {
      var fileName = "myfiletosave2.txt";
      var fileSystem = appForm.utils.fileSystem;
      async.waterfall([
        function createForm(cb) {
          var Form = appForm.models.Form;
          //load form
          var form = new Form({
            formId: "testfileformid"
          }, function(err, form) {
            assert(!err, "Expected no error " + err);
            cb(err, form);
          });
        },
        function createTextFile(form, cb) {
          fileSystem.save(fileName, "This param could be string, json object or File object", function(err) {
            assert.ok(!err, "Expected no error " + err);
            cb(err, form);
          });
        },
        function readTextFile(form, cb) {
          fileSystem.readAsFile(fileName, function(err, file) {
            assert.ok(!err, "Expected no error " + err);
            assert.ok(file instanceof File, "Expected a file instance.");
            cb(err, form, file);
          });
        },
        function createSubmission(form, file, cb) {
          var submission = appForm.models.submission.newInstance(form);

          //Add a file value
          submission.addInputValue({
            fieldId: 'filefieldid',
            value: file
          }, function(err) {
            assert.ok(!err, "Expected no error " + err);

            cb(err, form, file, submission);
          });
        },
        function checkFileValue(form, file, submission, cb) {
          //The file value should have been set in the submission
          var inputValues = submission.getInputValueByFieldId('filefieldid', function(err, fileValues) {
            assert.ok(!err, "Expected No Error " + err);

            assert.equal(fileName, fileValues[0].fileName);
            assert.ok(fileValues[0].hashName, "Expected A File Hash Name");
            cb(err, form, file, submission, fileValues[0].hashName);
          });
        },
        function addAnotherFile(form, file, submission, hashName, cb) {
          submission.addInputValue({
            fieldId: 'filefieldid',
            value: file
          }, function(err) {
            assert.ok(!err, "Expected no error " + err);

            cb(err, form, file, submission, hashName);
          });
        },
        function checkMultipleFileValues(form, file, submission, hashName, cb) {
          //The file value should have been set in the submission
          var inputValues = submission.getInputValueByFieldId('filefieldid', function(err, fileValues) {
            assert.ok(!err, "Expected No Error " + err);

            assert.equal(fileName, fileValues[1].fileName);
            assert.ok(fileValues[1].hashName, "Expected A File Hash Name");
            assert.notEqual(hashName, fileValues[1].hashName);
            cb(err, form, file, submission, hashName, fileValues[1].hashName);
          });
        },
        function removeFileValue(form, file, submission, hashName1, hashName2, cb) {
          //Remove a file value
          submission.removeFieldValue('filefieldid', 0, function(err) {
            assert.ok(!err, "Expected No Error");

            cb(err, form, submission, hashName1, hashName2);
          });
        },
        function checkValueRemoved(form, submission, hashName1, hashName2, cb) {
          var inputValues = submission.getInputValueByFieldId('filefieldid', function(err, fileValues) {
            assert.ok(!err, "Expected No Error " + err);

            assert.equal(undefined, fileValues[0]);
            assert.equal(hashName2, fileValues[1].hashName);
            cb(err, submission, hashName1, hashName2);
          });
        },
        function removeOtherFile(submission, hashName1, hashName2, cb) {
          submission.removeFieldValue('filefieldid', 1, function(err) {
            assert.ok(!err, "Expected No Error");

            cb(err, submission, hashName1, hashName2);
          });
        },
        function checkValueRemoved(submission, hashName1, hashName2, cb) {
          var inputValues = submission.getInputValueByFieldId('filefieldid', function(err, fileValues) {
            assert.ok(!err, "Expected No Error " + err);

            assert.equal(undefined, fileValues[0]);
            assert.equal(undefined, fileValues[1]);
            cb(err, submission, hashName1, hashName2);
          });
        },
        //Cached Files should have been removed.
        function checkFileRemoved(submission, hashName1, hashName2, cb) {
          fileSystem.readAsFile(hashName1, function(err, file1) {
            assert.equal(err.name, "NotFoundError");
            assert.ok(!file1, "Expected No File");

            fileSystem.readAsFile(hashName2, function(err, file2) {
              assert.equal(err.name, "NotFoundError");
              assert.ok(!file2, "Expected No File");
              cb();
            });
          });
        }
      ], done);
    });

    it("When adding a null value to a field, any existing file entry is kept", function(done) {
      var fileName = "myfiletosave.txt";
      var fileSystem = appForm.utils.fileSystem;
      async.waterfall([
        function createForm(cb) {
          var Form = appForm.models.Form;
          //load form
          var form = new Form({
            formId: "testfileformid"
          }, function(err, form) {
            assert(!err, "Expected no error " + err);
            cb(err, form);
          });
        },
        function createTextFile(form, cb) {
          fileSystem.save(fileName, "This param could be string, json object or File object", function(err) {
            assert.ok(!err, "Expected no error " + err);
            cb(err, form);
          });
        },
        function readTextFile(form, cb) {
          fileSystem.readAsFile(fileName, function(err, file) {
            assert.ok(!err, "Expected no error " + err);
            assert.ok(file instanceof File, "Expected a file instance.");
            cb(err, form, file);
          });
        },
        function createSubmission(form, file, cb) {
          var submission = appForm.models.submission.newInstance(form);

          //Add a file value
          submission.addInputValue({
            fieldId: 'filefieldid',
            value: file
          }, function(err) {
            assert.ok(!err, "Expected no error " + err);

            cb(err, form, file, submission);
          });
        },
        function checkFileValue(form, file, submission, cb) {
          //The file value should have been set in the submission
          var inputValues = submission.getInputValueByFieldId('filefieldid', function(err, fileValues) {
            assert.ok(!err, "Expected No Error " + err);

            assert.equal(fileName, fileValues[0].fileName);
            cb(err, form, file, submission);
          });
        },
        function addNullValue(form, file, submission, cb) {
          //Add a file value
          submission.addInputValue({
            fieldId: 'filefieldid',
            value: null
          }, function(err) {
            assert.ok(!err, "Expected no error " + err);

            cb(err, form, file, submission);
          });
        },
        function checkForExistingValue(form, file, submission, cb) {
          var inputValues = submission.getInputValueByFieldId('filefieldid', function(err, fileValues) {
            assert.ok(!err, "Expected No Error " + err);

            assert.equal(fileName, fileValues[0].fileName);
            cb(err);
          });
        }
      ], done);
    });

    it("how to add user input value to submission model", function() {
      submission.addInputValue({
        fieldId: testData.fieldId,
        value: 40
      }, function(err) {
        assert(!err, "Expected no error: " + err);
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
        assert(!err, "Expected no error: " + err);
      });
      submission.reset();
      submission.getInputValueByFieldId(testData.fieldId, function(err, res) {
        assert(!err, "Expected no error: " + err);
        assert(res.length === 0);
      });
    });

    it("how to handle a null user input", function() {
      submission.reset();
      submission.addInputValue({
        fieldId: testData.fieldId,
        value: null
      }, function(err) {
        assert(!err, "Expected no error: " + err);
      });
      submission.getInputValueByFieldId(testData.fieldId, function(err, res) {
        assert(!err, "Expected no error: " + err);
        assert(res.length === 1);
        assert.equal(null, res[0]);
      });
    });

    it("how to use transaction to input a series of user values to submission model", function() {
      submission.reset();
      submission.addInputValue({
        fieldId: testData.fieldId,
        value: 40
      }, function(err) {
        assert(!err, "Expected no error: " + err);
      });
      submission.startInputTransaction();
      submission.addInputValue({
        fieldId: testData.fieldId,
        value: 50
      }, function(err) {
        assert(!err, "Expected no error: " + err);
      });
      submission.addInputValue({
        fieldId: testData.fieldId,
        value: 60
      }, function(err) {
        assert(!err, "Expected no error: " + err);
      });
      submission.addInputValue({
        fieldId: testData.fieldId,
        value: 35
      }, function(err) {
        assert(!err, "Expected no error: " + err);
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
        assert(!err, "Expected no error: " + err);
      });
      submission.startInputTransaction();
      submission.addInputValue({
        fieldId: testData.fieldId,
        value: 50
      }, function(err) {
        assert(!err, "Expected no error: " + err);
      });
      submission.addInputValue({
        fieldId: testData.fieldId,
        value: 60
      }, function(err) {
        assert(!err, "Expected no error: " + err);
      });
      submission.addInputValue({
        fieldId: testData.fieldId,
        value: 35
      }, function(err) {
        assert(!err, "Expected no error: " + err);
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
        assert(!err, "Expected no error: " + err);

        submission.upload(function(err, uploadTask) {
          assert(!err, "Expected no error: " + err);
          assert(uploadTask);
          assert(appForm.models.uploadManager.timer);
          assert(appForm.models.uploadManager.hasTask());

          submission.getUploadTask(function(err, task) {
            assert(!err, "Expected no error: " + err);
            assert(task);
            done();
          });
        });
      });

      submission.submit(function(err) {
        if (err) console.log(err);
        assert(!err, "Expected no error: " + err);
      });
    });
    it("how to monitor if a submission is submitted", function(done) {
      var submission = form.newSubmission();
      this.timeout(20000);

      submission.on("submit", function() {
        submission.upload(function(err, uploadTask) {
          assert(!err, "Expected no error: " + err);
          assert(uploadTask);
        });
      });
      submission.on("progress", function(err, progress) {
        console.log("PROGRESS: ", err, progress);
      });
      submission.on("error", function(err, progress) {
        console.log("ERROR: ", err, progress);
      });
      submission.on("submitted", function(submissionId) {
        assert.ok(submissionId);
        assert.ok(submission.getLocalId());
        assert.ok(submission.getRemoteSubmissionId());
        //The _id field should be set
        assert.equal(submission.getRemoteSubmissionId(), submission.get('_id'));
        done();
      });
      submission.submit(function(err) {
        assert(!err, "Expected no error: " + err);
      });
    });
  });

  describe("download a submission using a submission Id", function() {
    it("how to queue a submission for download", function(done) {
      this.timeout(20000);
      var submissionToDownload = null;
      submissionToDownload = appForm.models.submission.newInstance(null, {"submissionId": "testSubmissionId"});

      submissionToDownload.on("progress", function(progress) {
        console.log("DOWNLOAD PROGRESS: ", progress);
        assert.ok(progress);
      });

      submissionToDownload.on("downloaded", function() {
        console.log("downloaded event called");
        done();
      });

      submissionToDownload.on("error", function(err, progress) {
        console.error("error event called");
        assert.ok(!err);
        assert.ok(progress);
        done();
      });

      submissionToDownload.download(function(err, downloadTask) {
        console.log(err, downloadTask);
        assert.ok(!err);
        assert.ok(downloadTask);

        submissionToDownload.getDownloadTask(function(err, downloadTask) {
          console.log(err, downloadTask);
          assert.ok(!err);
          assert.ok(downloadTask);
        });
      });
    });
  });

  describe("Submissions values should be removed from hidden fields", function() {

    var testHidingFieldsForm = {
      "_id": "582dbc9009ce8d9c6e63f532",
      "name": "hiddenvalue",
      "pageRules": [
        {
          "type": "skip",
          "_id": "582dbe8209ce8d9c6e63f538",
          "targetPage": [
            "582dbce709ce8d9c6e63f535"
          ],
          "ruleConditionalStatements": [
            {
              "sourceField": "582dbce709ce8d9c6e63f533",
              "restriction": "is",
              "sourceValue": "hidepage",
              "_id": "582dbe8209ce8d9c6e63f539"
            }
          ],
          "ruleConditionalOperator": "and",
          "relationType": "and"
        }
      ],
      "fieldRules": [
        {
          "type": "hide",
          "_id": "582dbda67ae62c9b6e4afedc",
          "targetField": [
            "582dbce709ce8d9c6e63f534"
          ],
          "ruleConditionalStatements": [
            {
              "sourceField": "582dbce709ce8d9c6e63f533",
              "restriction": "is",
              "sourceValue": "hidenumber",
              "_id": "582dbda67ae62c9b6e4afedd"
            }
          ],
          "ruleConditionalOperator": "and",
          "relationType": "and"
        },
        {
          "type": "hide",
          "_id": "582dbda67ae62c9b6e4afede",
          "targetField": [
            "582dbce709ce8d9c6e63f537"
          ],
          "ruleConditionalStatements": [
            {
              "sourceField": "582dbce709ce8d9c6e63f533",
              "restriction": "is",
              "sourceValue": "hidefile",
              "_id": "582dbda67ae62c9b6e4afedf"
            }
          ],
          "ruleConditionalOperator": "and",
          "relationType": "and"
        }
      ],
      "pages": [
        {
          "_id": "582dbc9009ce8d9c6e63f531",
          "name": "Page 1",
          "fields": [
            {
              "required": true,
              "type": "text",
              "name": "Text",
              "_id": "582dbce709ce8d9c6e63f533",
              "adminOnly": false,
              "fieldOptions": {
                "validation": {
                  "validateImmediately": true
                }
              },
              "repeating": false,
              "dataSourceType": "static"
            },
            {
              "required": true,
              "type": "number",
              "name": "Number",
              "_id": "582dbce709ce8d9c6e63f534",
              "adminOnly": false,
              "fieldOptions": {
                "validation": {
                  "validateImmediately": true
                }
              },
              "repeating": false,
              "dataSourceType": "static"
            }
          ]
        },
        {
          "name": "Page 2",
          "_id": "582dbce709ce8d9c6e63f535",
          "fields": [
            {
              "required": true,
              "type": "text",
              "name": "Text 2",
              "_id": "582dbce709ce8d9c6e63f536",
              "adminOnly": false,
              "fieldOptions": {
                "validation": {
                  "validateImmediately": true
                }
              },
              "repeating": false,
              "dataSourceType": "static"
            },
            {
              "required": true,
              "type": "file",
              "name": "File",
              "_id": "582dbce709ce8d9c6e63f537",
              "adminOnly": false,
              "fieldOptions": {
                "validation": {
                  "validateImmediately": true
                }
              },
              "repeating": false,
              "dataSourceType": "static"
            }
          ]
        }
      ],
      "lastUpdated": "2016-11-17T14:28:18.397Z",
      "dateCreated": "2016-11-17T14:20:00.607Z",
      "lastDataRefresh": "2016-11-17T14:28:18.397Z",
      "pageRef": {
        "582dbc9009ce8d9c6e63f531": 0,
        "582dbce709ce8d9c6e63f535": 1
      },
      "fieldRef": {
        "582dbce709ce8d9c6e63f533": {
          "page": 0,
          "field": 0
        },
        "582dbce709ce8d9c6e63f534": {
          "page": 0,
          "field": 1
        },
        "582dbce709ce8d9c6e63f536": {
          "page": 1,
          "field": 0
        },
        "582dbce709ce8d9c6e63f537": {
          "page": 1,
          "field": 1
        }
      },
      "lastUpdatedTimestamp": 1479392898397
    };

    function getFormSubmission(cb) {
      new appForm.models.Form({
        formId: "582dbc9009ce8d9c6e63f532",
        rawMode: true,
        rawData: testHidingFieldsForm
      }, function(err, form) {
        assert.ok(!err, "Expected no error getting a form", err);

        cb(err, form.newSubmission());
      });
    }

    function addValue(fieldId, value, submission, cb) {

      //Adding a value for the number field.
      submission.addInputValue({
        fieldId: fieldId,
        value: value
      }, function(err) {
        assert.ok(!err, "Expected no error when adding a value", err);

        return cb(err, submission);
      });
    }

    it("Hiding a field should remove a field value", function(done) {

      async.waterfall([
        async.apply(getFormSubmission),
        //Adding a number value to the number field. This should be removed after hiding.
        async.apply(addValue, "582dbce709ce8d9c6e63f534", 22),
        //Using the hidenumber value to hide the number field on page 2
        async.apply(addValue, "582dbce709ce8d9c6e63f533", "hidenumber"),
        function(submission, cb) {
          //The number value should still be there - users may unhide the field at any point when editing the form.
          assert.equal(22, submission.getFormFields()[0].fieldValues[0]);
          cb(null, submission);
        },
        function submitForm(submission, cb) {
          submission.submit(function(err) {
            assert.ok(err, "Expected an error as the submission is not complete");

            //The hidden number field should have been removed
            var numberFieldValues = _.findWhere(submission.getFormFields(), {fieldId: "582dbce709ce8d9c6e63f534"});

            assert.equal(0, numberFieldValues.fieldValues.length);

            //The text field should be there.
            var textFieldValues = _.findWhere(submission.getFormFields(), {fieldId: "582dbce709ce8d9c6e63f533"});

            assert.equal("hidenumber", textFieldValues.fieldValues[0]);
            cb();
          });
        }
      ], done);
    });

    it("Hiding a Page should remove values in all fields in that page", function(done) {
      var textValue = "sometextvalue";
      var fileName = "testhiddenfieldfile.txt";
      var fileSystem = appForm.utils.fileSystem;

      async.waterfall([
        function createTextFile(cb) {
          fileSystem.save(fileName, "This file is going to be removed", function(err) {
            assert.ok(!err, "Expected no error " + err);
            cb(err);
          });
        },
        async.apply(getFormSubmission),
        async.apply(addValue, "582dbce709ce8d9c6e63f536", textValue),
        function readTextFile(submission, cb) {
          fileSystem.readAsFile(fileName, function(err, file) {
            assert.ok(!err, "Expected no error " + err);
            assert.ok(file instanceof File, "Expected a file instance.");
            cb(err, submission, file);
          });
        },
        function(submission, file, cb) {
          addValue("582dbce709ce8d9c6e63f537", file, submission, cb);
        },
        function(submission, cb) {
          //The number value should still be there - users may unhide the field at any point when editing the form.
          var formFields = submission.getFormFields();
          assert.equal(textValue, formFields[0].fieldValues[0]);

          //Expecting a file value to be saved
          assert.ok(formFields[1].fieldValues[0].hashName, "Expected A File Hash Name");

          cb(null, submission);
        },
        //Applying a value to the text field to hide the page
        async.apply(addValue, "582dbce709ce8d9c6e63f533", "hidepage"),
        function submitForm(submission, cb) {
          submission.submit(function(err) {
            assert.ok(err, "Expected an error as the submission is not complete");

            var formFields = submission.getFormFields();
            //The hidden text field in the hidden page should be empty.
            var textFieldValues = _.findWhere(formFields, {fieldId: "582dbce709ce8d9c6e63f536"});
            assert.equal(0, textFieldValues.fieldValues.length);

            //The hidden file field values should be removed.
            var fileFieldValues = _.findWhere(formFields, {fieldId: "582dbce709ce8d9c6e63f537"});
            assert.equal(0, fileFieldValues.fieldValues.length);

            //The text field on page 1 should be there.
            var originalTextField = _.findWhere(submission.getFormFields(), {fieldId: "582dbce709ce8d9c6e63f533"});
            assert.equal("hidepage", originalTextField.fieldValues[0]);

            cb();
          });
        }
      ], done);
    });

  });

  describe("Repeating sections", function() {
    var repeatingSectionForm = {
      _id: "repeatingSectionFormId",
      name: "Test Default Value Form",
      createdBy: "testing-admin@example.com",
      pages: [{
        _id: "page1id",
        name: "This is page 1",
        fields: [
          {
            _id: "field1_page1id_id",
            type: "text",
            name: "Text Field",
            description: "This is a text field in section 1"
          },
          {
            _id: "section2_page1_id",
            type: "sectionBreak",
            name: "Section 2",
            description: "This is section 2 in page 1"
          },
          {
            _id: "field1_section2_page1_id",
            type: "text",
            name: "Text Field",
            description: "This is a text field in section 1"
          },
          {
            _id: "field2_section2_page1_id",
            type: "text",
            name: "Text Field",
            description: "This is a number field in section 2"
          },
          {
            _id: "sectionid3_page1_id",
            type: "sectionBreak",
            name: "Section 3",
            description: "This is section 3 in page 1"
          },
          {
            _id: "field1_section3_page1_id",
            type: "text",
            name: "Text Field",
            description: "This is a text field in section 1"
          }
        ]
      },
        {
          _id: "page2id",
          name: "This is page 1",
          fields: [
            {
              _id: "field1_page2_id",
              type: "text",
              name: "Text Field",
              description: "This is a text field in section 1"
            },
            {
              _id: "section2_page2_id",
              type: "sectionBreak",
              name: "Section 2",
              description: "This is section 2 in page 1"
            },
            {
              _id: "field1_section2_page2_id",
              type: "text",
              name: "Text Field",
              description: "This is a text field in section 1"
            },
            {
              _id: "field2_section2_page2_id",
              type: "text",
              name: "Text Field",
              description: "This is a number field in section 2"
            },
            {
              _id: "section3_page2_id",
              type: "sectionBreak",
              name: "Section 3",
              description: "This is section 3 in page 1"
            },
            {
              _id: "field1_section3",
              type: "text",
              name: "Text Field",
              description: "This is a text field in section 1"
            }
          ]
        }],
      pageRef: {
        page1id: 0,
        page2id: 1
      },
      fieldRef: {
        field1_page1id_id:        {page: 0, field: 0},
        section2_page1_id:        {page: 0, field: 1},
        field1_section2_page1_id: {page: 0, field: 2},
        field2_section2_page1_id: {page: 0, field: 3},
        sectionid3_page1_id:      {page: 0, field: 4},

        field1_page2_id:          {page: 1, field: 0},
        section2_page2_id:        {page: 1, field: 1},
        field1_section2_page2_id: {page: 1, field: 2},
        field2_section2_page2_id: {page: 1, field: 3},
        section3_page2_id:        {page: 1, field: 4},
        field1_section3:          {page: 1, field: 5}
      }
    };

    it("should add input value for a field", function(done) {
      var Form = appForm.models.Form;

      new Form({
        formId: "repeatingSectionFormId",
        rawMode: true,
        rawData: repeatingSectionForm
      }, function(err, formModel) {
        assert.ok(!err, "Expected no error when initialising the form " + err);

        //Creating a new submission based on the form model
        var submission = formModel.newSubmission();

        var params = {
          fieldId: "field1_page1id_id",
          value: "field1_page1id_value"
        };

        submission.addInputValue(params, function(err, result) {
          assert.ok(!err);
        });

        submission.getInputValueByFieldId(params.fieldId, function(err, res) {
          assert(res[0] === params.value);
        });
        done();
      });
    });

    it("should add input value for a field in a section without section index", function(done) {
      var Form = appForm.models.Form;

      new Form({
        formId: "repeatingSectionFormId",
        rawMode: true,
        rawData: repeatingSectionForm
      }, function(err, formModel) {
        assert.ok(!err, "Expected no error when initialising the form " + err);

        //Creating a new submission based on the form model
        var submission = formModel.newSubmission();

        var params = {
          fieldId: "field1_section2_page1_id",
          value: "field1_section2_page1_value"
        };

        submission.addInputValue(params, function(err, result) {
          assert.ok(!err);
        });

        var field = submission.getInputValueObjectById(params.fieldId);
        chai.expect(field.sectionIndex).to.exist;
        chai.expect(field.sectionIndex).to.equal(0);
        done();
      });
    });

    it("should add input value for a field in a section with section index", function(done) {
      var Form = appForm.models.Form;

      new Form({
        formId: "repeatingSectionFormId",
        rawMode: true,
        rawData: repeatingSectionForm
      }, function(err, formModel) {
        assert.ok(!err, "Expected no error when initialising the form " + err);

        //Creating a new submission based on the form model
        var submission = formModel.newSubmission();

        var params = {
          fieldId: "field1_section2_page1_id",
          value: "field1_section2_page1_value",
          sectionIndex: 3
        };

        submission.addInputValue(params, function(err, result) {
          assert.ok(!err);
        });

        var field = submission.getInputValueObjectById(params.fieldId, params.sectionIndex);
        chai.expect(field.sectionIndex).to.exist;
        chai.expect(field.sectionIndex).to.equal(3);
        done();
      });
    });

    it("should add input values for a fields in a section with a different section index", function(done) {
      var Form = appForm.models.Form;

      new Form({
        formId: "repeatingSectionFormId",
        rawMode: true,
        rawData: repeatingSectionForm
      }, function(err, formModel) {
        assert.ok(!err, "Expected no error when initialising the form " + err);

        //Creating a new submission based on the form model
        var submission = formModel.newSubmission();

        var params = {
          fieldId: "field1_section2_page1_id",
          value: "field1_section2_page1_value",
          sectionIndex: 3
        };
        var params_2 = {
          fieldId: "field1_section2_page1_id",
          value: "field1_section2_page1_value_index_5",
          sectionIndex: 5
        };

        var params_3 = {
          fieldId: "field1_section2_page1_id",
          value: "field1_section2_page1_value_index_7",
          sectionIndex: 7
        };

        submission.addInputValue(params, function(err, result) {
          assert.ok(!err);
        });

        submission.addInputValue(params_2, function(err, result) {
          assert.ok(!err);
        });

        submission.addInputValue(params_3, function(err, result) {
          assert.ok(!err);
        });

        var field = submission.getInputValueObjectById(params.fieldId, params.sectionIndex);
        chai.expect(field.sectionIndex).to.exist;
        chai.expect(field.fieldValues[0]).to.equal(params.value);
        chai.expect(field.sectionIndex).to.equal(3);

        var field_2 = submission.getInputValueObjectById(params_2.fieldId, params_2.sectionIndex);
        chai.expect(field_2.sectionIndex).to.exist;
        chai.expect(field_2.fieldValues[0]).to.equal(params_2.value);
        chai.expect(field_2.sectionIndex).to.equal(5);

        var field_3 = submission.getInputValueObjectById(params_3.fieldId, params_3.sectionIndex);
        chai.expect(field_3.sectionIndex).to.exist;
        chai.expect(field_3.fieldValues[0]).to.equal(params_3.value);
        chai.expect(field_3.sectionIndex).to.equal(7);
        
        
        
        
        //make sure 1st field didnt get overwritten
        field = submission.getInputValueObjectById(params.fieldId, params.sectionIndex);
        chai.expect(field.sectionIndex).to.exist;
        chai.expect(field.fieldValues[0]).to.equal(params.value);
        chai.expect(field.sectionIndex).to.equal(3);

        done();
      });
    });


  });
});

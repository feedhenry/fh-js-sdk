describe("Submission model", function() {
    before(function(done){
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

  it("A new submission should have default values set", function (done) {
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
          "fieldOptions": {
          }
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
    }, function(err, formModel){
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

        it("Removing an input value from a submission", function(done){
          async.waterfall([
            function createForm(cb){
               var Form = appForm.models.Form;
                //load form
                var form = new Form({
                    formId: testData.formId
                }, function(err, form) {
                    assert(!err, "Expected no error " + err);
                    cb(err, form);
                });
            },
            function addValue(form, cb){
              var submission = appForm.models.submission.newInstance(form);

              submission.addInputValue({
                  fieldId: testData.fieldId,
                  value: 40
              }, function(err) {
                  assert(!err, "Expected no error: " + err);
                  cb(err, form, submission);
              });
            },
            function verifyValueAdded(form, submission, cb){
              submission.getInputValueByFieldId(testData.fieldId, function(err, values) {
                  assert.equal(40, values[0]);

                  cb(err, form, submission);
              });
            },
            function removeValue(form, submission, cb){
              submission.removeFieldValue(testData.fieldId, 0);

              //The value should now have been removed.
              submission.getInputValueByFieldId(testData.fieldId, function(err, values) {
                  assert.equal(undefined, values[0]);

                  cb(err);
              });
            }
          ], done);
        });

        it("Removing a file input value from a submission", function(done){
          var fileName = "myfiletosave2.txt";
          var fileSystem = appForm.utils.fileSystem;
          async.waterfall([
              function createForm(cb){
                 var Form = appForm.models.Form;
                  //load form
                  var form = new Form({
                      formId: "testfileformid"
                  }, function(err, form) {
                      assert(!err, "Expected no error " + err);
                      cb(err, form);
                  });
              },
              function createTextFile(form, cb){
                  fileSystem.save(fileName, "This param could be string, json object or File object", function(err) {
                      assert.ok(!err, "Expected no error " + err);
                      cb(err, form);
                  });
              },
              function readTextFile(form, cb){
                  fileSystem.readAsFile(fileName, function(err, file){
                      assert.ok(!err, "Expected no error " + err);
                      assert.ok(file instanceof File, "Expected a file instance.");
                      cb(err, form, file);
                  });
              },
              function createSubmission(form, file, cb){
                  var submission = appForm.models.submission.newInstance(form);

                  //Add a file value
                  submission.addInputValue({
                      fieldId: 'filefieldid',
                      value: file
                  }, function(err){
                      assert.ok(!err, "Expected no error " + err);

                      cb(err, form, file, submission);
                  });
              },
              function checkFileValue(form, file, submission, cb){
                  //The file value should have been set in the submission
                  var inputValues = submission.getInputValueByFieldId('filefieldid', function(err, fileValues){
                    assert.ok(!err, "Expected No Error " + err);

                    assert.equal(fileName, fileValues[0].fileName);
                    assert.ok(fileValues[0].hashName, "Expected A File Hash Name");
                    cb(err, form, file, submission, fileValues[0].hashName);
                  });
              },
              function addAnotherFile(form, file, submission, hashName, cb){
                submission.addInputValue({
                    fieldId: 'filefieldid',
                    value: file
                }, function(err){
                    assert.ok(!err, "Expected no error " + err);

                    cb(err, form, file, submission, hashName);
                });
              },
              function checkMultipleFileValues(form, file, submission, hashName, cb){
                  //The file value should have been set in the submission
                  var inputValues = submission.getInputValueByFieldId('filefieldid', function(err, fileValues){
                    assert.ok(!err, "Expected No Error " + err);

                    assert.equal(fileName, fileValues[1].fileName);
                    assert.ok(fileValues[1].hashName, "Expected A File Hash Name");
                    assert.notEqual(hashName, fileValues[1].hashName);
                    cb(err, form, file, submission, hashName, fileValues[1].hashName);
                  });
              },
              function removeFileValue(form, file, submission, hashName1, hashName2, cb){
                //Remove a file value
                submission.removeFieldValue('filefieldid', 0, function(err){
                  assert.ok(!err, "Expected No Error");

                  cb(err, form, submission, hashName1, hashName2);
                });
              },
              function checkValueRemoved(form, submission, hashName1, hashName2, cb){
                var inputValues = submission.getInputValueByFieldId('filefieldid', function(err, fileValues){
                  assert.ok(!err, "Expected No Error " + err);

                  assert.equal(undefined, fileValues[0]);
                  assert.equal(hashName2, fileValues[1].hashName);
                  cb(err, submission, hashName1, hashName2);
                });
              },
              function removeOtherFile(submission, hashName1, hashName2, cb){
                submission.removeFieldValue('filefieldid', 1, function(err){
                  assert.ok(!err, "Expected No Error");

                  cb(err, submission, hashName1, hashName2);
                });
              },
              function checkValueRemoved(submission, hashName1, hashName2, cb){
                var inputValues = submission.getInputValueByFieldId('filefieldid', function(err, fileValues){
                  assert.ok(!err, "Expected No Error " + err);

                  assert.equal(undefined, fileValues[0]);
                  assert.equal(undefined, fileValues[1]);
                  cb(err, submission, hashName1, hashName2);
                });
              },
              //Cached Files should have been removed.
              function checkFileRemoved(submission, hashName1, hashName2, cb){
                fileSystem.readAsFile(hashName1, function(err, file1){
                    assert.equal(err.name, "NotFoundError");
                    assert.ok(!file1, "Expected No File");

                    fileSystem.readAsFile(hashName2, function(err, file2){
                      assert.equal(err.name, "NotFoundError");
                      assert.ok(!file2, "Expected No File");
                      cb();
                    });
                });
              }
          ], done);
        });

        it("When adding a null value to a field, any existing file entry is kept", function(done){
            var fileName = "myfiletosave.txt";
            var fileSystem = appForm.utils.fileSystem;
            async.waterfall([
                function createForm(cb){
                   var Form = appForm.models.Form;
                    //load form
                    var form = new Form({
                        formId: "testfileformid"
                    }, function(err, form) {
                        assert(!err, "Expected no error " + err);
                        cb(err, form);
                    });
                },
                function createTextFile(form, cb){
                    fileSystem.save(fileName, "This param could be string, json object or File object", function(err) {
                        assert.ok(!err, "Expected no error " + err);
                        cb(err, form);
                    });
                },
                function readTextFile(form, cb){
                    fileSystem.readAsFile(fileName, function(err, file){
                        assert.ok(!err, "Expected no error " + err);
                        assert.ok(file instanceof File, "Expected a file instance.");
                        cb(err, form, file);
                    });
                },
                function createSubmission(form, file, cb){
                    var submission = appForm.models.submission.newInstance(form);

                    //Add a file value
                    submission.addInputValue({
                        fieldId: 'filefieldid',
                        value: file
                    }, function(err){
                        assert.ok(!err, "Expected no error " + err);

                        cb(err, form, file, submission);
                    });
                },
                function checkFileValue(form, file, submission, cb){
                    //The file value should have been set in the submission
                    var inputValues = submission.getInputValueByFieldId('filefieldid', function(err, fileValues){
                      assert.ok(!err, "Expected No Error " + err);

                      assert.equal(fileName, fileValues[0].fileName);
                      cb(err, form, file, submission);
                    });
                },
                function addNullValue(form, file, submission, cb){
                  //Add a file value
                  submission.addInputValue({
                      fieldId: 'filefieldid',
                      value: null
                  }, function(err){
                      assert.ok(!err, "Expected no error " + err);

                      cb(err, form, file, submission);
                  });
                },
                function checkForExistingValue(form, file, submission, cb){
                  var inputValues = submission.getInputValueByFieldId('filefieldid', function(err, fileValues){
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
               if(err) console.log(err);
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
            submission.on("progress", function(err ,progress){
              console.log("PROGRESS: ", err, progress);
            });
            submission.on("error", function(err ,progress){
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

    describe("download a submission using a submission Id", function(){
      it("how to queue a submission for download", function(done) {
        this.timeout(20000);
        var submissionToDownload = null;
        submissionToDownload = appForm.models.submission.newInstance(null, {"submissionId": "testSubmissionId"});

        submissionToDownload.on("progress", function(progress){
          console.log("DOWNLOAD PROGRESS: ", progress);
          assert.ok(progress);
        });

        submissionToDownload.on("downloaded", function(){
          console.log("downloaded event called");
          done();
        });

        submissionToDownload.on("error", function(err, progress){
          console.error("error event called");
          assert.ok(!err);
          assert.ok(progress);
          done();
        });

        submissionToDownload.download(function(err, downloadTask){
          console.log(err, downloadTask);
          assert.ok(!err);
          assert.ok(downloadTask);

          submissionToDownload.getDownloadTask(function(err, downloadTask){
            console.log(err, downloadTask);
            assert.ok(!err);
            assert.ok(downloadTask);
          });
        });
      });
    });
});

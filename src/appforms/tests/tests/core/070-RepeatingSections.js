describe('Repeating Sections', function() {

  var form;

  before(function(done) {
    var testFormDefinition = {
      "_id": "1",
      "name": "Test Repeating Sections",
      "createdBy": "testing-admin@example.com",
      "pages": [{
        "_id": "2",
        "fields": [{
          "required": true,
          "type": "sectionBreak",
          "name": "SectionBreak",
          "_id": "3",
          "repeating": true,
          "fieldOptions": {
            "definition": {
              "maxRepeat": 3,
              "minRepeat": 1
            }
          }
        }, {
          "required": true,
          "type": "text",
          "name": "Text Field",
          "_id": "4",
          "repeating": false,
          "fieldOptions": {}
        }]
      }],
      "pageRef": {"2": 0},
      "fieldRef": {
        "3": {"page": 0, "field": 0},
        "4": {"page": 0, "field": 1}
      }
    };

    var Form = appForm.models.Form;
    new Form({
      formId: "1",
      rawMode: true,
      rawData: testFormDefinition
    }, function(err, formModel) {
      assert.ok(!err, "Expected no error when initialising the form " + err);

      form = formModel;
      done();
    });
  });

  it('should not submit less then min sections', function(done) {
    var submission = form.newSubmission();
    submission.submit(function(err) {
      assert.ok(err, "Expected error");
      done();
    });
  });

  it('should not submit more then max sections', function(done) {
    var submission = form.newSubmission();
    async.series([
      function(cb) {
        submission.addInputValue({ fieldId: '4', value: 'test1', sectionIndex: 0 }, cb);
      },
      function(cb) {
        submission.addInputValue({ fieldId: '4', value: 'test2', sectionIndex: 1 }, cb);
      },
      function(cb) {
        submission.addInputValue({ fieldId: '4', value: 'test3', sectionIndex: 2 }, cb);
      },
      function(cb) {
        submission.addInputValue({ fieldId: '4', value: 'test4', sectionIndex: 3 }, cb);
      },
      function(cb) {
        submission.submit(function(err) {
          assert.ok(err, "Expected error");
          cb();
        });
      }
    ], done);
  });

  it('should submit valid number of sections', function(done) {
    var submission = form.newSubmission();
    async.series([
      function(cb) {
        submission.addInputValue({ fieldId: '4', value: 'test1', sectionIndex: 0 }, cb);
      },
      function(cb) {
        submission.addInputValue({ fieldId: '4', value: 'test2', sectionIndex: 1 }, cb);
      },
      function(cb) {
        submission.addInputValue({ fieldId: '4', value: 'test3', sectionIndex: 2 }, cb);
      },
      function(cb) {
        submission.submit(cb);
      }
    ], done);
  });

});
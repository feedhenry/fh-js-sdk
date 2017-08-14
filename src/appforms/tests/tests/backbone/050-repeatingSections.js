var assert = chai.assert;

describe('Backbone - Repeating Sections', function() {

  var form;
  var submission;
  var formView;

  function createFormView(readOnly, cb) {
    formView = new FormView({
      parentEl: $('<div></div>'),
      readOnly: readOnly
    });

    formView.loadForm({
      form: form,
      submission: submission
    }, function(err) {
      assert.ok(!err, 'Expected no error');
      formView.render();

      cb();
    });
  }

  before(function(done) {
    function createForm(cb) {
      var testFormDefinition = {
        "_id": "bb-rs-1",
        "name": "Test Repeating Sections",
        "createdBy": "testing-admin@example.com",
        "pages": [{
          "_id": "bb-rs-2",
          "fields": [{
            "required": true,
            "type": "sectionBreak",
            "name": "SectionBreak",
            "_id": "bb-rs-3",
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
            "_id": "bb-rs-4",
            "repeating": false,
            "fieldOptions": {}
          }]
        }],
        "pageRef": {"bb-rs-2": 0},
        "fieldRef": {
          "bb-rs-3": {"page": 0, "field": 0},
          "bb-rs-4": {"page": 0, "field": 1}
        }
      };

      var Form = appForm.models.Form;
      new Form({
        formId: "bb-rs-1",
        rawMode: true,
        rawData: testFormDefinition
      }, function(err, formModel) {
        assert.ok(!err, "Expected no error when initialising the form " + err);

        form = formModel;
        cb();
      });
    }

    function createSubmission(cb) {
      submission = form.newSubmission();
      submission.addInputValue({ fieldId: 'bb-rs-4', value: 'test1', sectionIndex: 1 }, cb);
    }

    async.series([
      createForm,
      createSubmission,
      function(cb) {
        createFormView(false, cb);
      }
    ], done);
  });

  it('should render repeating sections from draft', function() {
    var value = formView.$el.find('#fh_appform_bb-rs-3_1 input').val();
    assert.equal(value, 'test1');

    var sectionButtonsDisplay = formView.$el.find('.fh_appform_section_button_bar').css('display');
    assert.equal(sectionButtonsDisplay, '');
  });

  it('should hide add/remove buttons in submitted form', function(done) {
    createFormView(true, function() {
      var sectionButtonsDisplay = formView.$el.find('.fh_appform_section_button_bar').css('display');
      assert.equal(sectionButtonsDisplay, 'none');
      done();
    });
  })

});
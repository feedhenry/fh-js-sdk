var assert = chai.assert;

describe('Backbone - Repeating Sections', function() {

  var form;
  var submission;
  var formView;

  var basicFormDefinition = {
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

  var basicFormDefinition2 = {
    "_id": "bb-rs2-1",
    "name": "Test Repeating Sections",
    "createdBy": "testing-admin@example.com",
    "pages": [{
      "_id": "bb-rs2-2",
      "fields": [{
        "required": true,
        "type": "sectionBreak",
        "name": "SectionBreak",
        "_id": "bb-rs2-3",
        "repeating": true,
        "fieldOptions": {
          "definition": {
            "maxRepeat": 3,
            "minRepeat": 2
          }
        }
      }, {
        "required": true,
        "type": "text",
        "name": "Text Field",
        "_id": "bb-rs2-4",
        "repeating": false,
        "fieldOptions": {}
      }]
    }],
    "pageRef": {"bb-rs2-2": 0},
    "fieldRef": {
      "bb-rs2-3": {"page": 0, "field": 0},
      "bb-rs2-4": {"page": 0, "field": 1}
    }
  };

  var fieldRulesFormDefinition = {
    "_id": "bb-rs3-1",
    "name": "Test Repeating Sections",
    "createdBy": "testing-admin@example.com",
    "fieldRules": [
      {
        "type": "hide",
        "_id": "bb-rs3-7",
        "targetField": [
          "bb-rs3-5"
        ],
        "ruleConditionalStatements": [
          {
            "sourceField": "bb-rs3-3",
            "restriction": "is",
            "sourceValue": "test",
            "_id": "bb-rs3-8"
          }
        ],
        "ruleConditionalOperator": "and",
        "relationType": "and"
      },
      {
        "type": "hide",
        "_id": "bb-rs3-9",
        "targetField": [
          "bb-rs3-6"
        ],
        "ruleConditionalStatements": [
          {
            "sourceField": "bb-rs3-5",
            "restriction": "is",
            "sourceValue": "test",
            "_id": "bb-rs3-10"
          }
        ],
        "ruleConditionalOperator": "and",
        "relationType": "and"
      }
    ],
    "pages": [{
      "_id": "bb-rs3-2",
      "fields": [{
        "required": true,
        "type": "text",
        "name": "Text Field 1",
        "_id": "bb-rs3-3",
        "repeating": false,
        "fieldOptions": {}
      }, {
        "required": true,
        "type": "sectionBreak",
        "name": "SectionBreak",
        "_id": "bb-rs3-4",
        "repeating": true,
        "fieldOptions": {
          "definition": {
            "maxRepeat": 3,
            "minRepeat": 2
          }
        }
      }, {
        "required": true,
        "type": "text",
        "name": "Text Field 2",
        "_id": "bb-rs3-5",
        "repeating": false,
        "fieldOptions": {}
      }, {
        "required": true,
        "type": "text",
        "name": "Text Field 3",
        "_id": "bb-rs3-6",
        "repeating": false,
        "fieldOptions": {}
      }]
    }],
    "pageRef": {"bb-rs3-2": 0},
    "fieldRef": {
      "bb-rs3-3": {"page": 0, "field": 0},
      "bb-rs3-4": {"page": 0, "field": 1},
      "bb-rs3-5": {"page": 0, "field": 2},
      "bb-rs3-6": {"page": 0, "field": 3}
    }
  }

  function createFormView(loadSubmission, readOnly, cb) {
    formView = new FormView({
      parentEl: $('<div></div>'),
      readOnly: readOnly
    });

    formView.loadForm({
      form: form,
      submission: loadSubmission ? submission : undefined
    }, function(err) {
      assert.ok(!err, 'Expected no error');
      formView.render();

      cb();
    });
  }

  function createForm(formDefinition, cb) {
    var Form = appForm.models.Form;
    new Form({
      formId: formDefinition._id,
      rawMode: true,
      rawData: formDefinition
    }, function(err, formModel) {
      assert.ok(!err, "Expected no error when initialising the form " + err);

      form = formModel;
      cb();
    });
  }

  before(function(done) {
    function createSubmission(cb) {
      submission = form.newSubmission();
      submission.addInputValue({ fieldId: 'bb-rs-4', value: 'test1', sectionIndex: 1 }, cb);
    }

    async.series([
      function(cb) {
        createForm(basicFormDefinition, cb);
      },
      createSubmission,
      function(cb) {
        createFormView(true, false, cb);
      }
    ], done);
  });

  it('should render repeating sections from draft', function() {
    var value = formView.$el.find('#fh_appform_bb-rs-3_1 input').val();
    assert.equal(value, 'test1');

    var sectionButtonsDisplay = formView.$el.find('.fh_appform_section_button_bar').css('display');
    assert.equal(sectionButtonsDisplay, '');
  });

  it('should have +/- buttons for repeating sections', function() {
    var sections = formView.$el.find('input.fh_appform_field_input');
    assert.equal(sections.length, 2);

    var addSectionButton = formView.$el.find('.fh_appform_button_addSection');
    var removeSectionButton = formView.$el.find('.fh_appform_button_removeSection');

    assert.equal(addSectionButton.css('display'), 'inline-block');
    assert.equal(removeSectionButton.css('display'), 'inline-block');

    addSectionButton.click();
    assert.equal(formView.$el.find('input.fh_appform_field_input').length, 3);

    assert.equal(addSectionButton.css('display'), 'none');
    assert.equal(removeSectionButton.css('display'), 'inline-block');

    removeSectionButton.click();
    assert.equal(formView.$el.find('input.fh_appform_field_input').length, 2);

    removeSectionButton.click();
    assert.equal(formView.$el.find('input.fh_appform_field_input').length, 1);

    assert.equal(addSectionButton.css('display'), 'inline-block');
    assert.equal(removeSectionButton.css('display'), 'none');

    addSectionButton.click();
    var value = formView.$el.find('#fh_appform_bb-rs-3_1 input').val();
    assert.equal(value, '');
  });

  it('should hide add/remove buttons in submitted form', function(done) {
    createFormView(true, true, function() {
      var sectionButtonsDisplay = formView.$el.find('.fh_appform_section_button_bar').css('display');
      assert.equal(sectionButtonsDisplay, 'none');
      done();
    });
  });

  it('should show an error for repeating section', function(done) {
    async.series([
      function(cb) {
        createForm(basicFormDefinition2, cb);
      },
      function(cb) {
        createFormView(false, false, cb);
      },
      function(cb) {
        formView.$el.find('#fh_appform_bb-rs2-3_0 input').val('test');
        formView.$el.find('#fh_appform_bb-rs2-3_1 input').change();
        var error = formView.$el.find('#fh_appform_bb-rs2-3_1 .fh_appform_field_error');
        assert.ok(error, 'Expected error for second repeating section');

        cb();
      }
    ], done);
  });

  it('should test field rules', function(done) {
    async.series([
      function(cb) {
        createForm(fieldRulesFormDefinition, cb);
      },
      function(cb) {
        createFormView(false, false, cb);
      },
      function(cb) {
        formView.$el.find('#fh_appform_bb-rs3-4_0_body_icon').click();
        formView.$el.find('#fh_appform_bb-rs3-4_1_body_icon').click();

        // field rule 1
        formView.$el.find('#wrapper_bb-rs3-3_0 input').val('test').change();

        setTimeout(cb, 100);
      },
      function(cb) {
        var display = formView.$el.find('#fh_appform_bb-rs3-4_0 .fh_appform_field_area:contains("Text Field 2")').css('display');
        assert.equal(display, 'none');
        display = formView.$el.find('#fh_appform_bb-rs3-4_1 .fh_appform_field_area:contains("Text Field 2")').css('display');
        assert.equal(display, 'none');
        formView.$el.find('#wrapper_bb-rs3-3_0 input').val('').change();

        setTimeout(cb, 100);
      },
      function(cb) {
        display = formView.$el.find('#fh_appform_bb-rs3-4_0 .fh_appform_field_area:contains("Text Field 2")').css('display');
        assert.equal(display, 'block');
        display = formView.$el.find('#fh_appform_bb-rs3-4_1 .fh_appform_field_area:contains("Text Field 2")').css('display');
        assert.equal(display, 'block');

        // field rule 2
        formView.$el.find('#fh_appform_bb-rs3-4_1 .fh_appform_field_area:contains("Text Field 2") input').val('test').change();
        
        setTimeout(cb, 100);
      },
      function(cb) {
        display = formView.$el.find('#fh_appform_bb-rs3-4_0 .fh_appform_field_area:contains("Text Field 3")').css('display');
        assert.equal(display, 'block');
        display = formView.$el.find('#fh_appform_bb-rs3-4_1 .fh_appform_field_area:contains("Text Field 3")').css('display');
        assert.equal(display, 'none');
        formView.$el.find('#fh_appform_bb-rs3-4_1 .fh_appform_field_area:contains("Text Field 2") input').val('').change();
        
        setTimeout(cb, 100);
      },
      function(cb) {
        display = formView.$el.find('#fh_appform_bb-rs3-4_1 .fh_appform_field_area:contains("Text Field 3")').css('display');
        assert.equal(display, 'block');
        
        cb();
      }
    ], done);
  });

});
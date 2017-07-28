describe("Remove sections", function() {

  it("should remove inputs for section", function(done) {
    var submission;
    var failed = null;
    async.waterfall([
      function createForm(cb){
        var Form = appForm.models.Form;
        new Form({
          formId: "repeatingSectionFormId",
          rawMode: true,
          rawData: repeatingSectionForm
        }, function(err, formModel) {
          assert.ok(!err, "Expected no error when initialising the form " + err);
          cb(err, formModel);
        });
      },
      function addValuesToIdx0(form, cb) {
        submission = form.newSubmission();
        addSubmission_01(submission, 0, 'index00_', cb);
      },
      function addValuesToIdx1(cb) {
        addSubmission_01(submission, 1, 'index11_', cb);
      },
      function removeSection1(cb) {
        submission.removeSection('section2_page1_id', 1, cb);
      },
      function getFieldValuesforIdx0(cb) {
        submission.getInputValueByFieldId(inputFields[0].fieldId, 0, cb);
      },
      function checkValuesforIdx0(values, cb) {
        chai.expect(values).to.have.lengthOf(1);
        chai.expect(values[0]).to.have.string('index00_textfield_value');
        cb();
      },
      function getFieldValuesFodIsx1(cb) {
        submission.getInputValueByFieldId(inputFields[0].fieldId, 1, cb);
      },
      function checkValuesforIdx0(values, cb) {
        chai.expect(values).to.have.lengthOf(0);
        cb();
      }
    ], done);
  });

  it("should not remove inputs for section if other section is removed", function(done) {
    var submission;
    var failed = null;
    async.waterfall([
      function createForm(cb){
        var Form = appForm.models.Form;
        new Form({
          formId: "repeatingSectionFormId",
          rawMode: true,
          rawData: repeatingSectionForm
        }, function(err, formModel) {
          assert.ok(!err, "Expected no error when initialising the form " + err);
          cb(err, formModel);
        });
      },
      function addValuesToIdx0(form, cb) {
        submission = form.newSubmission();
        addSubmission_01(submission, 0, 'index00_', cb);
      },
      function addValuesToIdx1(cb) {
        addSubmission_01(submission, 1, 'index11_', cb);
      },
      function removeSection1(cb) {
        submission.removeSection('sectionid3_page1_id', 1, cb);
      },
      function getFieldValuesforIdx0(cb) {
        submission.getInputValueByFieldId(inputFields[0].fieldId, 0, cb);
      },
      function checkValuesforIdx0(values, cb) {
        chai.expect(values).to.have.lengthOf(1);
        chai.expect(values[0]).to.have.string('index00_textfield_value');
        cb();
      },
      function getFieldValuesFodIsx1(cb) {
        submission.getInputValueByFieldId(inputFields[0].fieldId, 1, cb);
      },
      function checkValuesforIdx0(values, cb) {
        chai.expect(values).to.have.lengthOf(1);
        chai.expect(values[0]).to.have.string('index11_textfield_value');
        cb();
      }
    ], done);
  });


});


var addSubmission_01 = function(submission, sectionIndex, valuePrefix, callback) {
  var field;
  async.forEachSeries(inputFields, function(inputField, cb) {
    field = _.clone(inputField);
    field.sectionIndex = sectionIndex;
    if (valuePrefix) field.value = valuePrefix + field.value;
    submission.addInputValue(field, cb);
  }, callback);
};


var inputFields = [
  {
    fieldId: 'field1_section2_page1_id',
    value: 'textfield_value',
    sectionIndex: 0,
    type: 'text'
  },
  {
    fieldId: 'field2_section2_page1_id',
    value: 'textfield_value',
    sectionIndex: 0,
    type: 'text'
  }
];


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
        description: "This is section 2 in page 1",
        repeating: true
      },
      {
        required: false,
        type: "file",
        fieldCode: "code6",
        name: "File",
        _id: "file_field_section2_page1_id",
        repeating: false
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
    field1_page1id_id: {page: 0, field: 0},
    section2_page1_id: {page: 0, field: 1},
    field1_section2_page1_id: {page: 0, field: 2},
    field2_section2_page1_id: {page: 0, field: 3},
    sectionid3_page1_id: {page: 0, field: 4},

    field1_page2_id: {page: 1, field: 0},
    section2_page2_id: {page: 1, field: 1},
    field1_section2_page2_id: {page: 1, field: 2},
    field2_section2_page2_id: {page: 1, field: 3},
    section3_page2_id: {page: 1, field: 4},
    field1_section3: {page: 1, field: 5}
  }
};
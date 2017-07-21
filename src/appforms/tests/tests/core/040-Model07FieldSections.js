describe("Field Model", function() {

  it("should return the section id if the field is contained within a section", function() {
    var Form = appForm.models.Form;

    new Form({
      formId: "repeatingSectionFormId",
      rawMode: true,
      rawData: repeatingSectionForm
    }, function(err, formModel) {
      assert.ok(!err, "Expected no error when initialising the form " + err);

      var field = formModel.getFieldModelById('field1_page1id_id');
      var sectionId = field.getSectionId();
      assert(sectionId === null);

      field = formModel.getFieldModelById('section2_page1_id');
      sectionId = field.getSectionId();
      assert(sectionId === 'section2_page1_id');

      field = formModel.getFieldModelById('field1_section2_page1_id');
      sectionId = field.getSectionId();
      assert(sectionId === 'section2_page1_id');

      field = formModel.getFieldModelById('field2_section2_page1_id');
      sectionId = field.getSectionId();
      assert(sectionId === 'section2_page1_id');

      field = formModel.getFieldModelById('sectionid3_page1_id');
      sectionId = field.getSectionId();
      assert(sectionId === 'sectionid3_page1_id');

      field = formModel.getFieldModelById('field1_section3_page1_id');
      sectionId = field.getSectionId();
      assert(sectionId === 'sectionid3_page1_id');

      field = formModel.getFieldModelById('field1_page2_id');
      sectionId = field.getSectionId();
      assert(sectionId === null);

      field = formModel.getFieldModelById('section2_page2_id');
      sectionId = field.getSectionId();
      assert(sectionId === 'section2_page2_id');

      field = formModel.getFieldModelById('field1_section2_page2_id');
      sectionId = field.getSectionId();
      assert(sectionId === 'section2_page2_id');

      field = formModel.getFieldModelById('field2_section2_page2_id');
      sectionId = field.getSectionId();
      assert(sectionId === 'section2_page2_id');

      field = formModel.getFieldModelById('section3_page2_id');
      sectionId = field.getSectionId();
      assert(sectionId === 'section3_page2_id');

      field = formModel.getFieldModelById('field1_section3');
      sectionId = field.getSectionId();
      assert(sectionId === 'section3_page2_id');
    });
  });


});

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
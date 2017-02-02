describe("Page model", function() {
    var pageModel = null;
    it("page model objec is initialised when a form is initialised ", function(done) {
        var Form = appForm.models.Form;
        new Form({formId: testData.formId ,fromRemote: true}, function(err, form) {
            pageModel = form.getPageModelById(testData.pageId);
            assert(pageModel);
            assert(pageModel.get("_id") == testData.pageId);
            done();
        });
    });
    it ("page model is able to retrieve the field model list",function(){
        
        var fieldModels=pageModel.getFieldModelList();
        assert(fieldModels);

        assert(fieldModels.length>0);
        assert(fieldModels.length == pageModel.getFieldDef().length);
    });

    it ("page model get general information (name, description, fieldDef, etc",function(){
        assert(pageModel.getFieldDef());
    });

    it ("get a field model by its id",function(){
        var fieldModel=pageModel.getFieldModelById(testData.fieldId);
        assert(fieldModel);
        assert(fieldModel.get("_id")== testData.fieldId);
    });

    it("page model by default only returns non-admin fields", function(done){
      var Form = appForm.models.Form;
      new Form({formId: testData.adminFormId ,fromRemote: true}, function(err, form) {
        pageModel = form.getPageModelById(testData.adminPageId);
        assert(pageModel);
        assert(pageModel.get("_id") == testData.adminPageId);

        var fieldModels=pageModel.getFieldModelList();

        //In the test data, there is only a single non-admin field
        assert(fieldModels.length === 1);
        assert(fieldModels[0].getFieldId() === testData.adminNonAdminFieldId);

        done();
      });
    });

  describe("Section Breaks", function() {

    function getSectionBreakFormJSON(formId, includeFirstSection) {

      var firstSectionBreak = {
        _id: "sectionid1",
        type: "sectionBreak",
        name: "Section 1",
        description: "This is section 1"
      };

      var form = {
        "_id": formId,
        "name": "Test Default Value Form",
        "createdBy": "testing-admin@example.com",
        "pages": [{
          _id: "page1id",
          name: "This is page 1",
          fields: [
            {
              _id: "fieldid1",
              type: "text",
              name: "Text Field",
              description: "This is a text field in section 1"
            },
            {
              _id: "sectionid2",
              type: "sectionBreak",
              name: "Section 2",
              description: "This is section 2 in page 1"
            },
            {
              _id: "numberfieldid",
              type: "number",
              name: "Number Field",
              description: "This is a number field in section 2"
            }
          ]
        }],
        "pageRef": {"page1id": 0},
        "fieldRef": {
          "sectionid1": {"page": 0, "field": 0},
          "fieldid1": {"page": 0, "field": 1},
          "sectionid2": {"page": 0, "field": 2},
          "numberfieldid": {"page": 0, "field": 3}
        }
      };

      if(includeFirstSection) {
        form.pages[0].fields.unshift(firstSectionBreak);
      }


      return form;
    }

    it("pages should return unique section IDs", function(done) {

      var formId = "sectionbreakformid";
      var sectionBreakForm = getSectionBreakFormJSON(formId, true);

      var Form = appForm.models.Form;

      new Form({
        formId: formId,
        rawMode: true,
        rawData: sectionBreakForm
      }, function(err, formModel) {
        assert.ok(!err, "Expected no error intialising form");

        var pageModel = formModel.getPageModelById("page1id");

        var sections = pageModel.getSections();

        var expectedSection1Id = "sectionid1";
        var expectedSection2Id = "sectionid2";

        assert.equal("fieldid1", sections[expectedSection1Id].fields[0].getFieldId());
        assert.equal("numberfieldid", sections[expectedSection2Id].fields[0].getFieldId());
        done();
      });
    });

    it("pages should add a default section first if not specified", function(done) {

      var formId = "sectionbreakformidnofirstsection";
      var sectionBreakForm = getSectionBreakFormJSON(formId, false);

      var Form = appForm.models.Form;

      new Form({
        formId: formId,
        rawMode: true,
        rawData: sectionBreakForm
      }, function(err, formModel) {
        assert.ok(!err, "Expected no error intialising form");

        var pageModel = formModel.getPageModelById("page1id");

        var sections = pageModel.getSections();

        var expectedSection1Id = "sectionBreakpage1id0";
        var expectedSection2Id = "sectionid2";

        assert.equal("fieldid1", sections[expectedSection1Id].fields[0].getFieldId());
        assert.equal("numberfieldid", sections[expectedSection2Id].fields[0].getFieldId());
        done();
      });
    });


  });
});
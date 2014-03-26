describe("FieldLocation Model", function() {
    var fieldModel;
    var form = null;
    it("Field model is initialised when a form is initialised", function(done) {
        var Form = appForm.models.Form;
        new Form({
            formId: testData.formId,
            fromRemote: true
        }, function(err, f) {
            form = f;
            fieldModel = form.getFieldModelById(testData.fieldIdLocation);
            assert(fieldModel);
            assert(fieldModel.get("_id") == testData.fieldIdLocation);
            done();
        });
    });
    it("check if the field is required", function() {
        assert(!fieldModel.isRequired());
    });
    it("get general properties (name, helptext,type,field id, etc)", function() {
        assert(fieldModel.getType());
        assert(fieldModel.getFieldId());
        assert(fieldModel.getName());
        assert(fieldModel.getHelpText()=="");
    });

    it("process eastnorth location", function(done) {
      var inputValue = {
        zone: "SL",
        eastings: "1234",
        northings: "6789"
      };
      fieldModel.process_location({value:inputValue}, function (err, result) {
        assert(!err, "Unexpected error");
        assert(result.zone, "should have zone");
        assert(result.eastings, "should have eastings");
        assert(result.northings, "should have northings");
        done();
      });
    });

});
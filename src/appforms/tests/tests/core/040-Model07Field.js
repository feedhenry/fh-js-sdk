describe("Field Model", function() {
    var fieldModel;
    var form = null;
    it("Field model is initialised when a form is initialised", function(done) {
        var Form = appForm.models.Form;
        new Form({
            formId: testData.formId,
            fromRemote: true
        }, function(err, f) {
            form = f;
            fieldModel = form.getFieldModelById(testData.fieldId);
            assert(fieldModel,"field model null");
            assert(fieldModel.get("_id") == testData.fieldId, "wrong fieldid");
            done();
        });
    });
    it("check if the field is required", function() {
        assert(!fieldModel.isRequired());
    });
    it("get field definition (max/min repeat)", function() {
        assert(fieldModel.getFieldDefinition());
    });
    it("get field validation", function() {
        assert(fieldModel.getFieldValidation());
    });
    it("check if the field repeating", function() {
        assert(fieldModel.isRepeating());
    });
    it("get general properties (name, helptext,type,field id, fieldCode etc)", function() {
        assert(fieldModel.getType());
        assert(fieldModel.getFieldId());
        assert(fieldModel.getName());
        assert(fieldModel.getHelpText()=="");
        assert(fieldModel.getCode());
    });
    it("how to get rules associated to a field", function() {
        var rules = fieldModel.getRules();
        assert(rules);
        assert(rules.length > 0);
        var rule = rules[0];
        assert(rule instanceof appForm.models.Rule);

    });
    describe("Checkbox", function() {
        it("get checkbox options", function() {
            var checkBoxFieldModel = form.getFieldModelById(testData.fieldIdCheckbox);
            assert(checkBoxFieldModel.getCheckBoxOptions().length > 0);
        });
    });
    describe("Radio", function() {
        it("get radio options", function() {
            var radioFieldModel = form.getFieldModelById(testData.fieldIdRadio);
            assert(radioFieldModel.getRadioOption().length > 0);
        });
    });

    describe("File", function() {
        it("how to process a file input", function(done) {
            var fileFieldId = testData.fieldIdFile;
            var fileField = form.getFieldModelById(fileFieldId);
            appForm.utils.fileSystem.save("myTestFile.txt", "hello this is a test", function(err, res) {
                assert(!err, "Expected no error: " + err);
                appForm.utils.fileSystem.readAsFile("myTestFile.txt", function(err, file) {
                    assert(!err, "Expected no error: " + err);
                    fileField.processInput({
                        value: file
                    }, function(err, json) {
                        assert(!err, "Expected no error: " + err);
                        assert(json.fileName);
                        assert(json.fileSize);
                        assert(json.fileType);
                        assert(json.fileUpdateTime);
                        assert(json.hashName);

                        done();
                    });
                });
            });
        });
    });

});
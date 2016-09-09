var assert = chai.assert;


describe("Backbone - Field View", function() {

    var textFieldId =  "52cfc0a78a31bc1524000003";
    var textFieldSelector = 'input[data-field="' + textFieldId + '"]';

    before(function(done){
        var self = this;
        var Form = appForm.models.Form;
        new Form({
            formId: "527d4539639f521e0a000004",
            fromRemote: true
        }, function(err, form) {
            assert.ok(!err, "Expected No Error");
            assert.ok(form, "Expected a form  model");

            self.form = form;

            self.formView = new FormView({
                parentEl: $("<div></div>")
            });

            self.formView.loadForm({
                form: form
            }, function(err){
                assert.ok(!err, "Expected no error");
                self.formView.render();

                done();
            });
        });
    });

    it("create & render FieldView", function(done) {
        var fieldView;
        var fieldModel;

        fieldModel = this.form.getFieldModelById(textFieldId);
        assert(fieldModel, "Expected a field model");

        // create backbone field View
        fieldView = new FieldView({
            parentEl: $("<div></div>"),
            formView: this.formView,
            model: fieldModel
        });

        assert.ok(fieldView, "Expected a field view to be created");

        done();
    });

    it("Field values should be populated to the submission immediately when the content changes ", function(done) {
        var testValue = 'sometestval';
        this.formView.$el.find(textFieldSelector).val(testValue).trigger('change');

        //The submission should have that value
        this.formView.submission.getInputValueByFieldId(textFieldId, function(err, fieldValues) {
            assert.ok(!err, "Expected no error");
            assert.equal(testValue, fieldValues[0]);
            done();
        });
    });

    it("Field values should be removed from the submission when the content is removed ", function(done) {
        this.formView.$el.find(textFieldSelector).val('').trigger('change');

        //The submission should have the value removed
        this.formView.submission.getInputValueByFieldId(textFieldId, function(err, fieldValues) {
            assert.ok(!err, "Expected no error");
            assert.equal(null, fieldValues[0]);
            done();
        });
    });

    it("Field rules should be triggered when a field value changes", function(done) {
        //Value that will hide the paragraph field. Defined in the form with id 527d4539639f521e0a000004
        var self = this;
        var testValue = 'hideparagraph';
        var paragraphFieldId = "52cfc0a78a31bc1524000004";
        var paragraphFieldIdSelector = 'div[data-field="' + paragraphFieldId +'"]';

        //The field should be present
        var visibleField = this.formView.$el.find(paragraphFieldIdSelector);
        assert.equal(1, visibleField.length, "The paragraph field should be present");

        //Add the new value that should hide the paragraph field
        this.formView.$el.find(textFieldSelector).val(testValue).trigger('change');

        //The field should not be visible
        setTimeout(function() {
            visibleField = self.formView.$el.find(paragraphFieldIdSelector + '[style="display: none;"]');
            assert.equal(1, visibleField.length, "Expected the paragraph field to be hidden");
            done();
        }, 1);
    });
});
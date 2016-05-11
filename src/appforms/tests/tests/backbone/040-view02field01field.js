var assert = chai.assert;


describe("Backbone - Field View", function() {

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

        fieldModel = this.form.getFieldModelById("52cfc0a78a31bc1524000003");
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
});
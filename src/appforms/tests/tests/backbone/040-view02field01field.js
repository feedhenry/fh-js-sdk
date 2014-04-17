var assert = chai.assert;
var fieldView;
var fieldModel;

describe("Backbone - Field View", function() {
    it("create & render FieldView", function(done) {

        var Form = appForm.models.Form;
        new Form({
            formId: "527d4539639f521e0a000004",
            fromRemote: true
        }, function(err, f) {
            form = f;
            fieldModel = form.getFieldModelById("527d4539639f521e0a000006");
            assert(fieldModel);

            
            
            // create backbone field View
            fieldView = new FieldView({ //required params
                parentEl: $("<div></div>"),
                parentView: null,
                model: fieldModel
            });
            assert.ok(fieldView);
            done();
        });
    });
});
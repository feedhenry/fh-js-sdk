var assert = chai.assert;


describe("Backbone - Checkbox Field View", function() {

  beforeEach(function(done) {
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
      }, function(err) {
        assert.ok(!err, "Expected no error");
        self.formView.render();


        done();
      });
    });
  });

  it("it should render Checkboxes field", function() {
    var checkboxesField = this.form.getFieldModelById("checkboxes_id");

    // create backbone dropdown field View
    var parentView = new Backbone.View();
    new FieldCheckboxView({
      parentEl: parentView.$el,
      formView: this.formView,
      model: checkboxesField
    });
    var wrapperSelector = 'div.fh_appform_field_input ';
    var checkBoxButtonSelector = 'button.fh_appform_button_action ';
    var checkboxOptionSelector = 'i.choice_icon ';

    var checkboxOptions = parentView.$el.find(wrapperSelector + checkBoxButtonSelector + checkboxOptionSelector);

    assert.equal(2, checkboxOptions.length, "Expected a field view to be created");
  });

  it("it should render Checkboxes selections", function() {
    var checkboxesField = this.form.getFieldModelById("checkboxes_id");

        // create backbone dropdown field View
    var parentView = new Backbone.View();
    new FieldCheckboxView({
      parentEl: parentView.$el,
      formView: this.formView,
      model: checkboxesField
    });
    var wrapperSelector = 'div.fh_appform_field_input ';
    var checkBoxButtonSelector = 'button.fh_appform_button_action ';
    var checkboxOptionSelector = 'i.choice_icon ';

    var checkboxOptions = parentView.$el.find(wrapperSelector + checkBoxButtonSelector + checkboxOptionSelector);

    var firstOption = checkboxOptions[0];
    var secondOption = checkboxOptions[1];
    assert.equal('<i class="choice_icon icon-check"></i>', firstOption.outerHTML);
    assert.equal('<i class="icon-check-empty choice_icon"></i>', secondOption.outerHTML);
  });

  it("it should get correct value for selected Checkboxes", function() {
    var checkboxesField = this.form.getFieldModelById("checkboxes_id");

        // create backbone dropdown field View
    var parentView = new Backbone.View();
    var checkboxView = new FieldCheckboxView({
      parentEl: parentView.$el,
      formView: this.formView,
      model: checkboxesField
    });
    var wrapperSelector = 'div.fh_appform_field_input ';
    var checkBoxButtonSelector = 'button.fh_appform_button_action ';
    var checkboxOptionSelector = 'i.icon-check';

    var checkboxOptions = parentView.$el.find(wrapperSelector + checkBoxButtonSelector + checkboxOptionSelector);

    var selection = checkboxView.valueFromElement(0);

    var optionValue = checkboxOptions[0].parentElement.value;

    assert.equal(selection.selections[0], optionValue);
  });
});
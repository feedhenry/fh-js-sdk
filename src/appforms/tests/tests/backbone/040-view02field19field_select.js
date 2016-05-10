var assert = chai.assert;


describe("Backbone - Dropdown Field View", function() {

  beforeEach(function(done){
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

  it("Render Dropdown field, blank option", function() {
    var dropdownField = this.form.getFieldModelById("dropdownwithblank");


    // create backbone dropdown field View
    var parentView = new Backbone.View();
    new FieldSelectView({
      parentEl: parentView.$el,
      formView: this.formView,
      model: dropdownField
    });

    assert.equal(3, parentView.$el.find('select option').length, "Expected a field view to be created");
  });

  it("Render Dropdown field, no blank option", function() {
    var dropdownField = this.form.getFieldModelById("dropdownnoblank");


    // create backbone dropdown field View
    var parentView = new Backbone.View();
    new FieldSelectView({
      parentEl: parentView.$el,
      formView: this.formView,
      model: dropdownField
    });

    assert.equal(2, parentView.$el.find('select option').length, "Expected a field view to be created");
  });
});
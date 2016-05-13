var assert = chai.assert;


describe("Backbone - DateTime Field View", function() {

  beforeEach(function(done){
    var self = this;
    var Form = appForm.models.Form;
    new Form({
      formId: "testdatetimeform",
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

  it("date option", function() {
    var dateTimeFieldDateModel = this.form.getFieldModelById("dateonlyfield");

    assert.ok(dateTimeFieldDateModel, "Expected a date field");

    var parentView = createParentView(dateTimeFieldDateModel, this.formView);
    assert.equal(1, parentView.$el.find('input[type="date"]').length, "Expected a date field view to be rendered");
  });

  it("time option", function() {
    var dateTimeTimeFieldModel = this.form.getFieldModelById("timeonlyfield");

    assert.ok(dateTimeTimeFieldModel, "Expected a time field");

    var parentView = createParentView(dateTimeTimeFieldModel, this.formView);
    assert.equal(1, parentView.$el.find('input[type="time"]').length, "Expected a time field view to be rendered");
  });

  it('datetime option - no format', function(done){
    var dateTimeTimeFieldModel = this.form.getFieldModelById("datetimefieldnoformat");

    assert.ok(dateTimeTimeFieldModel, "Expected a datetime field with no format");
    assert.ok(!dateTimeTimeFieldModel.getFieldDefinition().dateTimeFormat, "Expected no format");

    var parentView = createParentView(dateTimeTimeFieldModel, this.formView);
    assert.equal(1, parentView.$el.find('input[type="text"][placeholder="YYYY-MM-DD HH:mm:ss"]').length, "Expected a time field view to be rendered with default dateTimeFormat");
    done();
  });

  it('datetime option - format specified', function(done){
    var dateTimeTimeFieldModel = this.form.getFieldModelById("datetimefieldwithformat");

    assert.ok(dateTimeTimeFieldModel, "Expected a datetime field");
    var format = dateTimeTimeFieldModel.getFieldDefinition().dateTimeFormat;
    assert.ok(format, "Expected a format");

    var parentView = createParentView(dateTimeTimeFieldModel, this.formView);
    assert.equal(1, parentView.$el.find('input[type="text"][placeholder="' + format + '"]').length, "Expected a time field view to be rendered with default dateTimeFormat");
    done();
  });
});

// create backbone dropdown field View
function createParentView(dateFieldModel, formView) {
    var parentView = new Backbone.View();
    new FieldDateTimeView({
      parentEl: parentView.$el,
      formView: formView,
      model: dateFieldModel
    });
    return parentView
}

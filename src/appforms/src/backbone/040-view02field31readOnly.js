FieldReadOnlyView = FieldView.extend({
  type: "readOnly",
  readOnlyElement: '<div class="fh_appform_field_input"> </div>',
  readOnlySingleField: '<%= text %> <br/>',
  renderInput: function(){
    var self = this;
    var readOnlyEl = $(this.readOnlyElement);

    var options = this.model.getCheckBoxOptions();

    var singleTemplate = _.template(self.readOnlySingleField);

    _.each(options, function(option){
        readOnlyEl.append(singleTemplate({
          text: option.label
        }));
    });

    return readOnlyEl;
  }
});

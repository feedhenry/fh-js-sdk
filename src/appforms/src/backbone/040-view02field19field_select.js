FieldSelectView = FieldView.extend({
  select: "<div class='fh_appform_field_input'><select data-field='<%= fieldId %>' data-index='<%= index %>'><%= options %></select></div>",
  option: '<option value="<%= value %>" <%= selected %>><%= value %></option>',
  renderInput: function(index) {
    var fieldId=this.model.getFieldId();
    var choices = this.model.get('fieldOptions');
    choices = choices.definition.options;
    var options="";
    var self=this;
    $.each(choices, function(i, choice) {
      options += _.template(self.option, {
        "value": choice.label,
        "selected": (choice.checked) ? "selected='selected'" : ""
      });
    });
   return _.template(this.select, {
      "fieldId":fieldId,
      "index":index,
      "options":options
    });
  }
});
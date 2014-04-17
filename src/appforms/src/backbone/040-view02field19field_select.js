FieldSelectView = FieldView.extend({
  select: "<select class='fh_appform_field_input <%= repeatingClassName%>' data-field='<%= fieldId %>' data-index='<%= index %>'><%= options %></select>",
  option: '<option value="<%= value %>" <%= selected %>><%= value %></option>',

  renderInput: function(index) {
    var fieldId=this.model.getFieldId();
    var choices = this.model.get('fieldOptions');
    choices = choices.definition.options;
    var options="";
    var selectHtml = "";
    var html = "";
    var repeatingClassName = this.model.isRepeating() ? this.repeatingClassName : this.nonRepeatingClassName;

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
      "options":options,
      "repeatingClassName": repeatingClassName
    });
  }
});
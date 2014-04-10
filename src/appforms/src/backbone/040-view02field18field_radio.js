FieldRadioView = FieldView.extend({
  hidden_field: '<input  id="radio<%= id %>" type="fh_appform_hidden" value="" data-type="radio">',
  choice: '<input data-field="<%= fieldId %>" data-index="<%= index %>" name="<%= fieldId %>_<%= index %>" class="field radio" value="<%= value %>" type="radio"><label class="choice" ><%= choice %></label><br/>',
  radio: '<div class="fh_appform_field_input <%= repeatingClassName%>"><%= radioChoices %></div>',

  renderInput: function(index) {
    var choices = this.model.getRadioOption();
    var self = this;
    var radioChoicesHtml = "";
    var fullRadioHtml = "";
    var html = "";
    var repeatingClassName = this.model.isRepeating() ? this.repeatingClassName : this.nonRepeatingClassName;

    var fieldId = this.model.getFieldId();
    $.each(choices, function(i, choice) {
      var jQObj = $(_.template(self.choice, {
        "fieldId": fieldId,
        "choice": choice.label,
        "value": choice.label,
        "index": index
      }));

      if (choice.checked === true) {
        jQObj.attr('checked', 'checked');
      }
      radioChoicesHtml += self.htmlFromjQuery(jQObj);
    });

    return _.template(this.radio, {"radioChoices": radioChoicesHtml, "repeatingClassName": repeatingClassName});
  },
  valuePopulateToElement: function (index, value) {
    var wrapperObj = this.getWrapper(index);
    var opt = wrapperObj.find('input[value=\'' + value + '\']');
    if (opt.length === 0) {
      opt = wrapperObj.find('input:first-child');
    }
    opt.attr('checked', 'checked');
  },
  valueFromElement: function (index) {
    var wrapperObj = this.getWrapper(index);
    return wrapperObj.find('input:checked').val() || this.model.getRadioOption()[0].label;
  }
});
FieldRadioView = FieldView.extend({
  hidden_field: '<input id="radio<%= id %>" type="hidden" value="" data-type="radio">',
  choice: '<input data-field="<%= fieldId %>" data-index="<%= index %>" name="<%= fieldId %>_<%= index %>" type="radio" class="field radio" value="<%= value %>" ><label class="choice" ><%= choice %></label><br/>',
  renderInput: function(index) {
    var choices = this.model.getRadioOption();
    var self = this;
    var html = "";
    var fieldId = this.model.getFieldId();
    $.each(choices, function(i, choice) {
      var jQObj = $(_.template(self.choice, {
        "fieldId": fieldId,
        "choice": choice.label,
        "value": choice.label,
        "index": index
      }));

      if (choice.checked == true) {
        jQObj.attr('checked', 'checked');
      }
      html += self.htmlFromjQuery(jQObj);
    });
    return html;
  },
  // addValidationRules: function() {
  //   // first radio is always initially checked, so no need to do 'required' validation on this field
  // },
  valuePopulateToElement: function(index, value) {
    var wrapperObj=this.getWrapper(index);
    var opt=wrapperObj.find("input[value='"+value+"']");
    if (opt.length==0){
      opt=wrapperObj.find("input:first-child");
      
    }
    opt.attr("checked","checked");  
  },
  valueFromElement: function(index) {
    var wrapperObj=this.getWrapper(index);
    return wrapperObj.find("input:checked").val() || this.model.getRadioOption()[0].label;
  }
});
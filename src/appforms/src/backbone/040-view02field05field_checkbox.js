FieldCheckboxView = FieldView.extend({
  checkboxes: '<div class="fh_appform_field_input <%= repeatingClassName%>"><div class="checkboxes"><%= choices %></div></div>',
  choice: '<input data-fieldId="<%= fieldId %>" <%= checked %> data-index="<%= index %>" name="<%= fieldId %>[]" type="checkbox" class="field checkbox" value="<%= value %>" ><label class="choice" ><%= choice %></label><br/>',


  renderInput: function(index) {
    var subfields = this.model.getCheckBoxOptions();
    var fieldId=this.model.getFieldId();
    var choicesHtml = "";
    var checkboxesHtml = "";
    var html = "";
    var required = this.getFieldRequired(index);
    var self=this;
    var repeatingClassName = this.model.isRepeating() ? this.repeatingClassName : this.nonRepeatingClassName;



    $.each(subfields, function(i, subfield) {
      choicesHtml+= _.template(self.choice, {
        "fieldId": fieldId,
        "index": index,
        "choice": subfield.label,
        "value": subfield.label,
        "checked": (subfield.checked) ? "checked='checked'" : ""
      });
    });

    checkboxesHtml = _.template(this.checkboxes, {"choices": choicesHtml, "repeatingClassName": repeatingClassName});

    return checkboxesHtml;
  },
  valueFromElement: function(index) {
    var value = {
      selections: []
    };
    var wrapperObj=this.getWrapper(index);
    var checked=wrapperObj.find("input:checked");
    checked.each(function(){
      value.selections.push($(this).val());
    });
    return value;
  },
  valuePopulateToElement: function(index,value) {
    var wrapperObj=this.getWrapper(index);
    if (!value || !(value instanceof Array)){
      return;
    }
    for (var i=0; i < value.length; i++){
      var v=value[i];
      wrapperObj.find("input[value='"+v+"']").attr("checked","checked");
    }
  }
});

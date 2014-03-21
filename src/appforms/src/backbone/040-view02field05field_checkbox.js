FieldCheckboxView = FieldView.extend({
  checkboxes: '<div class="fh_appform_field_input"><div class="checkboxes"><%= choices %></div></div>',
  choice: '<input data-fieldId="<%= fieldId %>" <%= checked %> data-index="<%= index %>" name="<%= fieldId %>[]" type="checkbox" class="field checkbox" value="<%= value %>" ><label class="choice" ><%= choice %></label><br/>',


  renderInput: function(index) {
    var subfields = this.model.getCheckBoxOptions();
    var fieldId=this.model.getFieldId();
    var choicesHtml = "";
    var checkboxesHtml = "";
    var html = "";
    var required = this.getFieldRequired(index);
    var self=this;


    $.each(subfields, function(i, subfield) {
      choicesHtml+= _.template(self.choice, {
        "fieldId": fieldId,
        "index": index,
        "choice": subfield.label,
        "value": subfield.label,
        "checked": (subfield.selected) ? "checked='checked'" : ""
      });
    });

    checkboxesHtml = _.template(this.checkboxes, {"choices": choicesHtml});

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
    if (!value || !value.selections || !(value.selections instanceof Array)){
      return;
    }
    for (var i=0; i < value.selections.length; i++){
      var v=value.selections[i];
      wrapperObj.find("input[value='"+v+"']").attr("checked","checked");
    }
  }
});

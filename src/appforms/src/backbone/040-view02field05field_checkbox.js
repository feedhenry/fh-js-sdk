FieldCheckboxView = FieldView.extend({
  checkboxes: '<div class="btn-group-vertical fh_appform_field_input col-xs-12 <%= repeatingClassName%>" data-toggle="buttons-checkbox"></div>',
  choice: '<button class="btn btn-primary text-left fh_appform_button_action col-xs-12" type="button" value="<%= value %>" name="<%= fieldId %>[]" data-field="<%= fieldId %>" data-index="<%= index %>"><i class="icon-check-empty choice_icon"></i><%= choice %></button>',


  renderInput: function(index) {
    var self=this;
    var subfields = this.model.getCheckBoxOptions();
    var fieldId=this.model.getFieldId();
    var choicesHtml = "";
    var checkboxesHtml = "";
    var html = "";
    var required = this.getFieldRequired(index);
    
    var repeatingClassName = this.model.isRepeating() ? this.repeatingClassName : this.nonRepeatingClassName;
    checkboxesHtml = _.template(this.checkboxes, {"repeatingClassName": repeatingClassName});
    checkboxesHtml = $(checkboxesHtml);

    $.each(subfields, function(i, subfield) {
      var choice = _.template(self.choice, {
        "fieldId": fieldId,
        "index": index,
        "choice": subfield.label,
        "value": subfield.label,
        "checked": (subfield.checked) ? "checked='checked'" : ""
      });
      choice = $(choice);
      choice.off('click');
      choice.on('click', function(e){
        //$(this).toggleClass('active');
        $(this).find('.choice_icon').toggleClass('icon-check-empty');
        $(this).find('.choice_icon').toggleClass('icon-check');
      });

      checkboxesHtml.append(choice);
    });
    
    return checkboxesHtml;
  },
  valueFromElement: function(index) {
    var value = {
      selections: []
    };
    var wrapperObj=this.getWrapper(index);
    var checked=wrapperObj.find("button.active");
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
      wrapperObj.find("button[value='"+v+"']").addClass("active");
      wrapperObj.find("button[value='"+v+"'] .choice_icon").removeClass("icon-check-empty");
      wrapperObj.find("button[value='"+v+"'] .choice_icon").addClass("icon-check");
    }
  }
});

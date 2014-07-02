FieldRadioView = FieldView.extend({
  choice: '<button class="btn btn-primary fh_appform_button_action" type="button" data-field="<%= fieldId %>" data-index="<%= index %>" data-value="<%= choice %>"><%= choice %></button>',
  radio: '<div class="btn-group-vertical fh_appform_field_input col-xs-12 <%= repeatingClassName%>" data-toggle="buttons-radio"><%= radioChoices %></div>',

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
    var opt = wrapperObj.find('button[data-value=\'' + value + '\']');
    if (opt.length === 0) {
      opt = wrapperObj.find('button:first-child');
    }
    opt.addClass("active");
  },
  valueFromElement: function (index) {
    var wrapperObj = this.getWrapper(index);

    var data = wrapperObj.find('button.active').data();
    if(data){
      return wrapperObj.find('button.active').data().value;  
    } else {
      return this.model.getRadioOption()[0].label;
    }
  },
  onElementShow: function(index){
    
  }
});
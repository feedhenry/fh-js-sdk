FieldRadioView = FieldView.extend({
  choice: '<button class="btn btn-primary text-left fh_appform_button_action" type="button" data-field="<%= fieldId %>" data-index="<%= index %>" data-value="<%= choice %>"><i class="icon-circle-blank choice_icon"></i><%= choice %></button>',
  radio: '<div class="btn-group-vertical fh_appform_field_input col-xs-12 <%= repeatingClassName%>" data-toggle="buttons-radio"></div>',

  renderInput: function(index) {
    var choices = this.model.getRadioOption();
    var self = this;
    var repeatingClassName = this.model.isRepeating() ? this.repeatingClassName : this.nonRepeatingClassName;
    var inputElement = _.template(self.radio, { "repeatingClassName": repeatingClassName});
    inputElement = $(inputElement);

    var fieldId = this.model.getFieldId();
    $.each(choices, function(i, choice) {
      var jQObj = _.template(self.choice, {
        "fieldId": fieldId,
        "choice": choice.label,
        "value": choice.label,
        "index": index
      });

      jQObj = $(jQObj);

      if (choice.checked === true) {
        jQObj.addClass("active");
        jQObj.addClass('option-checked');
        jQObj.find('.choice_icon').removeClass('icon-circle-blank');
        jQObj.find('.choice_icon').addClass('icon-circle');
      }

      jQObj.off('click');
      jQObj.on('click', function(e){
        $(this).parent().find('.option-checked').removeClass('option-checked');
        $(this).parent().find('.choice_icon').removeClass('icon-circle');
        $(this).parent().find('.choice_icon').addClass('icon-circle-blank');

        $(this).addClass('option-checked');
        $(this).find('.choice_icon').removeClass('icon-circle-blank');
        $(this).find('.choice_icon').addClass('icon-circle');
        $(this).trigger('change');
      });

      inputElement.append(jQObj);
    });

    return inputElement;
  },
  valuePopulateToElement: function (index, value) {
    var wrapperObj = this.getWrapper(index);
    var opt = wrapperObj.find('button[data-value=\'' + value + '\']');

    $(wrapperObj).find('button.active').removeClass("active");
    $(wrapperObj).find('button.option-checked').removeClass("option-checked");
    $(opt).parent().find('.choice_icon').removeClass('icon-circle');
    $(opt).parent().find('.choice_icon').addClass('icon-circle-blank');

    if (opt.length === 0) {
      opt = wrapperObj.find('button:first-child');
    }
    opt.addClass("active");
    opt.addClass("option-checked");
    opt.find('.choice_icon').removeClass('icon-circle-blank');
    opt.find('.choice_icon').addClass('icon-circle');
    $(opt).trigger('change');
  },
  valueFromElement: function (index) {
    var wrapperObj = this.getWrapper(index);

    var data = wrapperObj.find('button.option-checked').data();
    if(data){
      return wrapperObj.find('button.option-checked').data().value;
    } else {
      return null;
    }
  },
  onElementShow: function(index){
    
  }
});
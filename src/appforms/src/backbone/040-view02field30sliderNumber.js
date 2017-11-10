FieldSliderNumberView = FieldView.extend({
  type: "sliderNumber",
  input: "<div class='col-xs-12 text-center fh_appform_field_input slideValue'></div><b class='pull-left fh_appform_field_instructions slider-label'><%= min%></b><b class='pull-right fh_appform_field_instructions slider-label'><%= max%></b><input class='fh_appform_field_input slideInput' data-field='<%= fieldId %>' data-index='<%= index %>' type='range' min='<%= min%>' max='<%= max%>' step='<%= step%>' data-slider-min='<%= min%>' data-slider-max='<%= max%>' data-slider-step='<%= step%>' data-slider-value='<%= value%>'/>",
  renderInput: function(index) {
    var self = this;
    var fieldId=self.model.getFieldId();

    var fieldValidation = self.model.getFieldValidation();
    var fieldDefinition = self.model.getFieldDefinition();
    var defaultValue = self.model.getDefaultValue();

    var params = {
      fieldId: fieldId,
      index: index,
      min: fieldValidation.min || 0,
      max: fieldValidation.max || 10,
      step: fieldDefinition.stepSize || 1,
      value: defaultValue
    };

    var input = $(_.template(this.input)(params));

    return input;
  },
  onElementShow: function(index) {
    //Initialising the rangeslider
    var self = this;
    var fieldId=self.model.getFieldId();
    var fieldValidation = self.model.getFieldValidation();
    var fieldDefinition = self.model.getFieldDefinition();
    var defaultValue = self.model.getDefaultValue() || fieldValidation.min || 0;

    var params = {
      enabled: (!self.readonly),
      tooltip: "hide",
      fieldId: fieldId,
      index: index,
      min: fieldValidation.min || 0,
      max: fieldValidation.max || 10,
      step: fieldDefinition.stepSize || 1,
      value: defaultValue || fieldValidation.min || 0,
      formatter: function(value) {
        return 'Current value: ' + value;
      }
    };

    var wrapperObj = this.getWrapper(index);

    var input = $(wrapperObj.find("input[type='range']"));

    wrapperObj.find(".slideValue").html("Selected Value: " + defaultValue);

    //If the bootstrap plugin does not exist, the input will be type 'range'
    if(typeof(input.slider) === "function" || typeof(input.bootstrapSlider) === "function"){
      //If the bootstrap slide is in compatibility mode then use that one instead.

      if(input.bootstrapSlider){
        input.bootstrapSlider(params);
        if (this.readonly) {

        }
      } else {
        input.slider(params);
      }
    }


    //Listen for slide events
    input.on('slide', self.contentChanged);
  },
  valueFromElement: function(index) {
    var wrapperObj = this.getWrapper(index);
    return wrapperObj.find("input[type='range']").attr('value') || "";
  },
  valuePopulateToElement: function(index, value) {
    var wrapperObj = this.getWrapper(index);
    var input = $(wrapperObj.find("input[type='range']"));

    if(value){
      input.val(value);
      input.slider('setValue', parseInt(value), true);
      wrapperObj.find(".slideValue").html("Selected Value: " + value);
    }
  },
  contentChanged: function(e){
    var self = this;
    var fileEle = e.target;
    var filejQ = $(fileEle);
    var index = filejQ.data().index;
    var sectionIndex = self.options.sectionIndex;

    var wrapperObj = this.getWrapper(index);

    var input = $(wrapperObj.find("input[type='range']"));
    var value = input.attr('value') || input.val();

    self.updateOrRemoveValue({
      fieldId: self.model.getFieldId(),
      index: index,
      value: value,
      isStore: true,
      sectionIndex:sectionIndex
    }, function() {
      wrapperObj.find(".slideValue").html("Selected Value: " + value);
      self.validateElement(index, value);
      self.checkRules();
    });
  },
  getHTMLInputType: function() {
    return "text";
  }
});
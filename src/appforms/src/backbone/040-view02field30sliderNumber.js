FieldSliderNumberView = FieldView.extend({
  type: "sliderNumber",
  input: "<div class='fh_appform_field_input slideInput' data-field='<%= fieldId %>' data-index='<%= index %>'></div>",
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


    return $(_.template(this.input)( params));
  },
  onElementShow: function(index) {
    //Initialising the rangeslider
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

    var wrapperObj = this.getWrapper(index);

    var input = $(wrapperObj.find("input[type='text']"));

    //Rangeslider may not be available
    //If not, just use the basic browser range control if available.
    if(input.sGlide){
      input.sGlide();
    }
  },
  valueFromElement: function(index) {
    var wrapperObj = this.getWrapper(index);
    return wrapperObj.find("input[type='text']").val() || "";
  },
  valuePopulateToElement: function(index, value) {
    var wrapperObj = this.getWrapper(index);

    if(value){
      wrapperObj.find("input[type='text']").val(value);
    }
  },
  contentChanged: function(e){
    var self = this;
    var fileEle = e.target;
    var filejQ = $(fileEle);
    var index = filejQ.data().index;

    var wrapperObj = this.getWrapper(index);

    var input = $(wrapperObj.find("input[type='text']"));
    var value = input.val();

    wrapperObj.find(".sliderValue").html("Selected Value: " + value);
  },
  getHTMLInputType: function() {
    return "text";
  }
});
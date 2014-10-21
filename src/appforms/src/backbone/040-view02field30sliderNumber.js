FieldSliderNumberView = FieldView.extend({
  type: "sliderNumber",
  input: "<div class='col-xs-12 sliderValue'></div>" +
    "<input class='fh_appform_field_input col-xs-12' data-field='<%= fieldId %>' data-index='<%= index %>'  type='range' min='<%= min %>' max='<%= max %>' step='<%= stepSize %>' value='<%= defaultValue %>'>",
  renderInput: function(index) {
    var self = this;
    var fieldId=this.model.getFieldId();

    var fieldValidation = self.model.getFieldValidation();
    var fieldDefinition = self.model.getFieldDefinition();
    var defaultValue = self.model.getDefaultValue();

    var params = {
      fieldId: fieldId,
      index: index,
      min: fieldValidation.min || 0,
      max: fieldValidation.max || 10,
      stepSize: fieldDefinition.stepSize || 1,
      defaultValue: defaultValue
    };


    return $(_.template(this.input, params));
  },
  onElementShow: function(index) {
    //Initialising the rangeslider

    var wrapperObj = this.getWrapper(index);

    var input = $(wrapperObj.find("input[type='range']"));

    //Rangeslider may not be available
    //If not, just use the basic browser range control if available.
    if(input.rangeslider){
      input.rangeslider({

      });
    }
  },
  valueFromElement: function(index) {
    var wrapperObj = this.getWrapper(index);
    return wrapperObj.find("input[type='range']").val() || "";
  },
  valuePopulateToElement: function(index, value) {
    var wrapperObj = this.getWrapper(index);

    if(value){
      wrapperObj.find("input[type='range']").val(value);
    }
  },
  contentChanged: function(e){
    var self = this;
    var fileEle = e.target;
    var filejQ = $(fileEle);
    var index = filejQ.data().index;

    var wrapperObj = this.getWrapper(index);

    var input = $(wrapperObj.find("input[type='range']"));
    var value = input.val();

    wrapperObj.find(".sliderValue").html("Selected Value: " + value);
  },
  getHTMLInputType: function() {
    return "range";
  }
});
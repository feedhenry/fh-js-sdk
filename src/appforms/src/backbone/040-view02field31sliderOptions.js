FieldSliderOptionsView = FieldView.extend({
  type: "sliderOptions",
  input: "<input class='fh_appform_field_input' data-field='<%= fieldId %>' data-index='<%= index %>'  type='text'>",
  renderInput: function(index) {
    var self = this;
    var fieldId= self.model.getFieldId();

    var choices = self.model.getSliderOptions();

    var defaultValue = 0;


    //Find which choice is selected.
    for(var choiceIndex = 0; choiceIndex < choices.length; choiceIndex++){
      var choice = choices[choiceIndex];

      if(choice.checked){
        defaultValue = choiceIndex;
        break;
      }
    }

    var params = {
      fieldId: fieldId,
      index: index,
      min: 0,
      max: choices.length - 1,
      step: 1,
      value: defaultValue
    };

    return $(_.template(this.input, params));
  },
  onElementShow: function(index) {
    //Initialising the rangeslider

    var self = this;
    var fieldId= self.model.getFieldId();

    var choices = self.model.getSliderOptions();

    var defaultValue = 0;


    //Find which choice is selected.
    for(var choiceIndex = 0; choiceIndex < choices.length; choiceIndex++){
      var choice = choices[choiceIndex];

      if(choice.checked){
        defaultValue = choiceIndex;
        break;
      }
    }

    var params = {
      fieldId: fieldId,
      index: index,
      min: 0,
      max: choices.length - 1,
      step: 1,
      value: defaultValue,
      formatter: function(value){
        return self.valueFromElement(index);
      }
    };

    var wrapperObj = this.getWrapper(index);

    var input = $(wrapperObj.find("input[type='text']"));

    //Rangeslider may not be available
    //If not, just use the basic browser range control if available.
    if(input.slider){
      input.slider(params);
    }
  },
  valueFromElement: function(index) {
    var self = this;
    var wrapperObj = this.getWrapper(index);
    var selectedIndex = wrapperObj.find("input[type='text']").val();

    selectedIndex = parseInt(selectedIndex);

    if(isNaN(selectedIndex)){
      return null;
    }

    var options = self.model.getSliderOptions();

    var selectedOption = options[selectedIndex];

    if(selectedOption && selectedOption.label){
      return selectedOption.label;
    } else {
      return null;
    }
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

    value = parseInt(value);

    if(isNaN(value)){
      return;
    }

    var choices = self.model.getSliderOptions();

    wrapperObj.find(".sliderValue").html("Selected Value: " + choices[value].label);
  },
  getHTMLInputType: function() {
    return "text";
  }
});
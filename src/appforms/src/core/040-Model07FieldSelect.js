/**
 * extension of Field class to support the dropdown field
 */
appForm.models.Field = function (module) {
  module.prototype.getDropdownOptions = function () {
    var fieldDefinition = this.getFieldDefinition();
    var dropdownOptions = [];

    //If the include_blank_option is set, then add an empty option to the beginning of the options list.
    if(fieldDefinition.include_blank_option){
      dropdownOptions.push({
        label: ""
      });
    }

    var fieldDefOptions = fieldDefinition.options || [];

    for(var optionIndex = 0; optionIndex < fieldDefOptions.length; optionIndex++){
      dropdownOptions.push(fieldDefOptions[optionIndex]);
    }

    return dropdownOptions;
  };
  return module;
}(appForm.models.Field || {});
/**
 * Field model for form
 * @param  {[type]} module [description]
 * @return {[type]}        [description]
 */
appForm.models = function (module) {
  var Model = appForm.models.Model;
  function Field(opt, form) {
    Model.call(this, { '_type': 'field' });
    if (opt) {
      this.fromJSON(opt);
      this.genLocalId();
    }
    if (form) {
      this.form = form;
    }
  }
  appForm.utils.extend(Field, Model);
  Field.prototype.isRequired = function () {
    return this.get('required');
  };
  Field.prototype.getFieldValidation = function () {
    return this.getFieldOptions().validation || {};
  };
  Field.prototype.getFieldDefinition = function () {
    return this.getFieldOptions().definition || {};
  };
  Field.prototype.getMinRepeat = function () {
    var def = this.getFieldDefinition();
    return def.minRepeat || 1;
  };
  Field.prototype.getMaxRepeat = function () {
    var def = this.getFieldDefinition();
    return def.maxRepeat || 1;
  };
  Field.prototype.getFieldOptions = function () {
    return this.get('fieldOptions', {
      'validation': {},
      'definition': {}
    });
  };
  Field.prototype.getPhotoOptions = function(){
    var photoOptions = {
      "targetWidth" : null,
      "targetHeight" : null,
      "quality" : null,
      "saveToPhotoAlbum": null,
      "pictureSource": null,
      "encodingType": null
    };

    var fieldDef = this.getFieldDefinition();
    photoOptions.targetWidth = fieldDef.photoWidth;
    photoOptions.targetHeight = fieldDef.photoHeight;
    photoOptions.quality = fieldDef.photoQuality;
    photoOptions.saveToPhotoAlbum = fieldDef.saveToPhotoAlbum;
    photoOptions.pictureSource = fieldDef.photoSource;
    photoOptions.encodingType = fieldDef.photoType;

    return photoOptions;
  };
  Field.prototype.isRepeating = function () {
    return this.get('repeating', false);
  };
  /**
     * retrieve field type.
     * @return {[type]} [description]
     */
  Field.prototype.getType = function () {
    return this.get('type', 'text');
  };
  Field.prototype.getFieldId = function () {
    return this.get('_id', '');
  };
  Field.prototype.getName = function () {
    return this.get('name', 'unknown');
  };
  /**
   * Function to return the Field Code specified in the studio if it exists
   * otherwise return null.
   */
  Field.prototype.getCode = function(){
    return this.get('fieldCode', null);
  };
  Field.prototype.getHelpText = function () {
    return this.get('helpText', '');
  };

  /**
     * return default value for a field
     *
  */
  Field.prototype.getDefaultValue = function () {
    var def = this.getFieldDefinition();

    //If the field is a multichoice field, then the selected option will be set in the options list.
    if(this.isMultiChoiceField()) {
      return this.getDefaultMultiValue();
    } else {
      return def.defaultValue;
    }
  };

  /**
   * Function to get the selected values for a multichoice fields
   */
  Field.prototype.getDefaultMultiValue = function() {
    var fieldDefinition = this.getFieldDefinition();

    if(!fieldDefinition.options) {
      return null;
    }

    var selectedOptions = _.filter(fieldDefinition.options, function(option) {
      return option.checked;
    });

    //No default options were selected.
    if(_.isEmpty(selectedOptions)) {
      return null;
    }

    selectedOptions = _.pluck(selectedOptions, 'label');

    //Checkbox fields can have multiple inputs per field entry.
    if(this.isCheckboxField()) {
      return selectedOptions;
    } else {
      return _.first(selectedOptions);
    }
  };

  Field.prototype.isAdminField = function(){
    return this.get("adminOnly");
  };

  /**
   * Checking if a field is a checkbox, radio or dropdown field type.
   */
  Field.prototype.isMultiChoiceField = function() {
    return this.isCheckboxField() || this.isRadioField() || this.isDropdownField();
  };

  /**
   * Checking if a field is a checkboxes field type
   * @returns {boolean}
   */
  Field.prototype.isCheckboxField = function() {
    return this.get('type') === 'checkboxes';
  };

  /**
   * Checking if a field is a Radio field type
   * @returns {boolean}
   */
  Field.prototype.isRadioField = function() {
    return this.get('type') === 'radio';
  };

  /**
   * Checking if a field is a Dropdown field type
   * @returns {boolean}
   */
  Field.prototype.isDropdownField = function() {
    return this.get('type') === 'dropdown';
  };

  /**
   * Checking if a field is a section break field type
   * @returns {boolean}
   */
  Field.prototype.isSectionBreak = function() {
    return this.get('type') === 'sectionBreak';
  };

  /**
     * Process an input value. convert to submission format. run field.validate before this
     * @param  {[type]} params {"value", "isStore":optional}
     * @param {cb} cb(err,res)
     * @return {[type]}           submission json used for fieldValues for the field
     */
  Field.prototype.processInput = function (params, cb) {
    var type = this.getType();
    var processorName = 'process_' + type;
    var inputValue = params.value;
    if (typeof inputValue === 'undefined' || inputValue === null) {
      //if user input is empty, keep going.
      return cb(null, inputValue);
    }
    // try to find specified processor
    if (this[processorName] && typeof this[processorName] === 'function') {
      this[processorName](params, cb);
    } else {
      cb(null, inputValue);
    }
  };
  /**
     * Convert the submission value back to input value.
     * @param  {[type]} submissionValue [description]
     * @param { function} cb callback
     * @return {[type]}                 [description]
     */
  Field.prototype.convertSubmission = function (submissionValue, cb) {
    var type = this.getType();
    var processorName = 'convert_' + type;
    // try to find specified processor
    if (this[processorName] && typeof this[processorName] === 'function') {
      this[processorName](submissionValue, cb);
    } else {
      cb(null, submissionValue);
    }
  };
  /**
     * validate an input with this field.
     * @param  {[type]} inputValue [description]
     * @return true / error message
     */
  Field.prototype.validate = function (inputValue, inputValueIndex, cb) {
    if(typeof(inputValueIndex) === 'function'){
      cb =inputValueIndex;
      inputValueIndex = 0;
    } 
    this.form.getRuleEngine().validateFieldValue(this.getFieldId(), inputValue,inputValueIndex, cb);
  };
  /**
     * return rule array attached to this field.
     * @return {[type]} [description]
     */
  Field.prototype.getRules = function () {
    var id = this.getFieldId();
    return this.form.getRulesByFieldId(id);
  };
  Field.prototype.setVisible = function (isVisible) {
    this.set('visible', isVisible);
    if (isVisible) {
      this.emit('visible');
    } else {
      this.emit('hidden');
    }
  };

  /**
   * Returns the section id if the field is contained within a section,
   * if the field is a section break this will return its own fieldId,
   * if the field is not in a section this will return null
   * @returns {string} sectionId || null
   */
  Field.prototype.getSectionId = function() {
    var self = this;
    var fieldId = self.getFieldId();

    var fieldType = self.getType();
    if (fieldType === "sectionBreak"){
      return fieldId;
    }

    var form = self.form;

    var fieldRef = form ? form.getFieldRef()[fieldId] : null;
    if (!fieldRef || !fieldRef.field || fieldRef.fieldRef === 0){
      return null;
    }

    var page = form.pages[fieldRef.page];

    var sectionId = null;

    page.fieldsIds.some(function (pageFieldId){
      var fieldModel = page.getFieldModelById(pageFieldId);
      if (fieldModel.isSectionBreak()) {
        sectionId = pageFieldId;
      }
      return pageFieldId === fieldId;
    });

    return sectionId;
  };

  module.Field = Field;
  return module;
}(appForm.models || {});

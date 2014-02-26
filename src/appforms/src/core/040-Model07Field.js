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
      "quality" : null
    };

    var fieldDef = this.getFieldDefinition();
    photoOptions.targetWidth = fieldDef.photoWidth;
    photoOptions.targetHeight = fieldDef.photoHeight;
    photoOptions.quality = fieldDef.photoQuality;
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
    return this.get('name', 'unknown name');
  };
  Field.prototype.getHelpText = function () {
    return this.get('helpText', '');
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
    if (this[processorName] && typeof this[processorName] == 'function') {
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
    if (this[processorName] && typeof this[processorName] == 'function') {
      this[processorName](submissionValue, cb);
    } else {
      cb(null, submissionValue);
    }
  };
  /**
     * validate a input with this field.
     * @param  {[type]} inputValue [description]
     * @return true / error message
     */
  Field.prototype.validate = function (inputValue, cb) {
    var self = this;
    self.convertSubmission(inputValue, function(err, convertedSubmissionValue){
      if(err) $fh.forms.log.e("Error converting sumbission: ", err);
      self.form.getRuleEngine().validateFieldValue(self.getFieldId(), convertedSubmissionValue, cb);
    });
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
  module.Field = Field;
  return module;
}(appForm.models || {});
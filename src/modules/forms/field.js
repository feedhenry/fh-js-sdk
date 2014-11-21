/**
 * Field model for form
 * @param  {[type]} module [description]
 * @return {[type]}        [description]
 */
var Model = require("./model");
var log = require("./log");
var config = require("./config");
var utils = require("./utils");
var fieldCheckboxes = require("./fieldCheckboxes");
var fieldFile = require("./fieldFile");
var fieldImage = require("./fieldImage");
var fieldLocation = require("./fieldLocation");
var fieldMatrix = require("./fieldMatrix");
var fieldRadio = require("./fieldRadio");

function Field(opt, form) {
    Model.call(this, {
        '_type': 'field'
    });
    if (opt) {
        this.fromJSON(opt);
        this.genLocalId();
    }
    if (form) {
        this.form = form;
    }
}

utils.extend(Field, Model);
utils.extend(Field, fieldCheckboxes);
utils.extend(Field, fieldFile);
utils.extend(Field, fieldLocation);
utils.extend(Field, fieldMatrix);
utils.extend(Field, fieldRadio);

Field.prototype.isRequired = function() {
    return this.get('required');
};
Field.prototype.getFieldValidation = function() {
    return this.getFieldOptions().validation || {};
};
Field.prototype.getFieldDefinition = function() {
    return this.getFieldOptions().definition || {};
};
Field.prototype.getMinRepeat = function() {
    var def = this.getFieldDefinition();
    return def.minRepeat || 1;
};
Field.prototype.getMaxRepeat = function() {
    var def = this.getFieldDefinition();
    return def.maxRepeat || 1;
};
Field.prototype.getFieldOptions = function() {
    return this.get('fieldOptions', {
        'validation': {},
        'definition': {}
    });
};
Field.prototype.getPhotoOptions = function() {
    var photoOptions = {
        "targetWidth": null,
        "targetHeight": null,
        "quality": null,
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
Field.prototype.isRepeating = function() {
    return this.get('repeating', false);
};
/**
 * retrieve field type.
 * @return {[type]} [description]
 */
Field.prototype.getType = function() {
    return this.get('type', 'text');
};
Field.prototype.getFieldId = function() {
    return this.get('_id', '');
};
Field.prototype.getName = function() {
    return this.get('name', 'unknown');
};
/**
 * Function to return the Field Code specified in the studio if it exists
 * otherwise return null.
 */
Field.prototype.getCode = function() {
    return this.get('fieldCode', null);
};
Field.prototype.getHelpText = function() {
    return this.get('helpText', '');
};

/**
 * return default value for a field
 *
 */
Field.prototype.getDefaultValue = function() {
    var def = this.getFieldDefinition();
    if (def) {
        return def.defaultValue;
    }
    return "";
};

Field.prototype.isAdminField = function() {
    return this.get("adminOnly");
};


/**
 * Process an input value. convert to submission format. run Field.prototype.validate before this
 * @param  {[type]} params {"value", "isStore":optional}
 * @param {cb} cb(err,res)
 * @return {[type]}           submission json used for fieldValues for the field
 */
Field.prototype.processInput = function(params, cb) {
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
Field.prototype.convertSubmission = function(submissionValue, cb) {
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
 * validate an input with this Field.prototype.
 * @param  {[type]} inputValue [description]
 * @return true / error message
 */
Field.prototype.validate = function(inputValue, inputValueIndex, cb) {
    if (typeof(inputValueIndex) === 'function') {
        cb = inputValueIndex;
        inputValueIndex = 0;
    }
    this.form.getRuleEngine().validateFieldValue(this.getFieldId(), inputValue, inputValueIndex, cb);
};
/**
 * return rule array attached to this Field.prototype.
 * @return {[type]} [description]
 */
Field.prototype.getRules = function() {
    var id = this.getFieldId();
    return this.form.getRulesByFieldId(id);
};
Field.prototype.setVisible = function(isVisible) {
    this.set('visible', isVisible);
    if (isVisible) {
        this.emit('visible');
    } else {
        this.emit('hidden');
    }
};

module.exports = Field;
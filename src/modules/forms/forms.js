var Model = require("./model");
var utils = require("./utils");
var log = require("./log");

var forms;

function Forms() {
    Model.call(this, {
        '_type': 'forms',
        '_ludid': 'forms_list',
        'loaded': false
    });
}

utils.extend(Forms, Model);

Forms.prototype.isFormUpdated = function(formModel) {
    var id = formModel.get('_id');
    var formLastUpdate = formModel.getLastUpdate();
    var formMeta = this.getFormMetaById(id);
    if (formMeta) {
        return formLastUpdate !== formMeta.lastUpdatedTimestamp;
    } else {
        //could have been deleted. leave it for now
        return false;
    }
};
Forms.prototype.setLocalId = function() {
    log.e("Forms setLocalId. Not Permitted for Forms.prototype.");
};
Forms.prototype.getFormMetaById = function(formId) {
    log.d("Forms getFormMetaById ", formId);
    var forms = this.getFormsList();
    for (var i = 0; i < forms.length; i++) {
        var form = forms[i];
        if (form._id === formId) {
            return form;
        }
    }
    log.e("Forms getFormMetaById: No form found for id: ", formId);
    return null;
};
Forms.prototype.size = function() {
    return this.get('forms').length;
};
Forms.prototype.getFormsList = function() {
    return this.get('forms', []);
};
Forms.prototype.getFormIdByIndex = function(index) {
    log.d("Forms getFormIdByIndex: ", index);
    return this.getFormsList()[index]._id;
};


module.exports = new Forms();

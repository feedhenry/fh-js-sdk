appForm.models = function (module) {
  var Model = appForm.models.Model;
  function Forms() {
    Model.call(this, {
      '_type': 'forms',
      '_ludid': 'forms_list',
      'loaded': false
    });
  }
  appForm.utils.extend(Forms, Model);
  /**
     * remove all local forms stored.
     * @param  {Function} cb [description]
     * @return {[type]}      [description]
     */
  Forms.prototype.clearAllForms = function (cb) {
  };
  Forms.prototype.isFormUpdated = function (formModel) {
    var id = formModel.get('_id');
    var formLastUpdate = formModel.getLastUpdate();
    var formMeta = this.getFormMetaById(id);
    if (formMeta) {
      return formLastUpdate != formMeta.lastUpdatedTimestamp;
    } else {
      //could have been deleted. leave it for now
      return false;
    }
  };
  Forms.prototype.getFormMetaById = function (formId) {
    var forms = this.get('forms');
    for (var i = 0; i < forms.length; i++) {
      var form = forms[i];
      if (form._id == formId) {
        return form;
      }
    }
    return null;
  };
  Forms.prototype.size = function () {
    return this.get('forms').length;
  };
  Forms.prototype.setLocalId = function () {
    throw 'forms id cannot be set programmly';
  };
  Forms.prototype.getFormsList = function () {
    return this.get('forms');
  };
  Forms.prototype.getFormIdByIndex = function (index) {
    return this.getFormsList()[index]._id;
  };
  module.forms = new Forms();
  return module;
}(appForm.models || {});
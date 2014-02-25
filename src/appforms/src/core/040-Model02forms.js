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
  Forms.prototype.setLocalId = function(){
    $fh.forms.log.e("Forms setLocalId. Not Permitted for Forms.");
  };
  Forms.prototype.getFormMetaById = function (formId) {
    $fh.forms.log.d("Forms getFormMetaById ", formId);
    var forms = this.get('forms');
    for (var i = 0; i < forms.length; i++) {
      var form = forms[i];
      if (form._id == formId) {
        return form;
      }
    }
    $fh.forms.log.e("Forms getFormMetaById: No form found for id: ", formId);
    return null;
  };
  Forms.prototype.size = function () {
    return this.get('forms').length;
  };
  Forms.prototype.getFormsList = function () {
    return this.get('forms');
  };
  Forms.prototype.getFormIdByIndex = function (index) {
    $fh.forms.log.d("Forms getFormIdByIndex: ", index);
    return this.getFormsList()[index]._id;
  };
  module.forms = new Forms();
  return module;
}(appForm.models || {});
appForm.models = function (module) {
  var Model = appForm.models.Model;
  module.FormSubmission = FormSubmission;
  function FormSubmission(submissionJSON) {
    Model.call(this, {
      '_type': 'formSubmission',
      'data': submissionJSON
    });
  }
  appForm.utils.extend(FormSubmission, Model);
  FormSubmission.prototype.getProps = function () {
    return this.get('data');
  };
  FormSubmission.prototype.getFormId = function () {
    if(!this.get('data')){
      console.log(this);
      console.trace();
    }

    return this.get('data').formId;
  };
  return module;
}(appForm.models || {});
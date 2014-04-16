appForm.models = function (module) {
  var Model = appForm.models.Model;
  module.FormSubmissionDownload = FormSubmissionDownload;
  function FormSubmissionDownload(uploadTask) {
    Model.call(this, {
      '_type': 'formSubmissionDownload',
      'data': uploadTask
    });
  }
  appForm.utils.extend(FormSubmissionDownload, Model);
  FormSubmissionDownload.prototype.getSubmissionId = function () {
    return this.get('data').get("submissionId", "not-set");
  };
  return module;
}(appForm.models || {});
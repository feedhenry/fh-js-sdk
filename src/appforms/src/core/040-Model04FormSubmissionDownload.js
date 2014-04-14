appForm.models = function (module) {
  var Model = appForm.models.Model;
  module.FormSubmissionDownload = FormSubmissionDownload;
  function FormSubmissionDownload(submissionTask) {
    Model.call(this, {
      '_type': 'downloadSubmission',
      'submissionId': submissionTask.get('submissionId'),
      'localSubmissionId': submissionTask.get('localSubmissionId')
    });
  }
  appForm.utils.extend(FormSubmissionDownload, Model);
  return module;
}(appForm.models || {});
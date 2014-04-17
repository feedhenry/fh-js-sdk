appForm.models = function (module) {
  var Model = appForm.models.Model;
  module.FormSubmissionStatus = FormSubmissionStatus;
  function FormSubmissionStatus(submissionTask) {
    Model.call(this, {
      '_type': 'submissionStatus',
      'submissionId': submissionTask.get('submissionId'),
      'localSubmissionId': submissionTask.get('localSubmissionId')
    });
  }
  appForm.utils.extend(FormSubmissionStatus, Model);
  return module;
}(appForm.models || {});
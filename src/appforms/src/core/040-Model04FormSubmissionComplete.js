appForm.models=(function(module){
  var Model=appForm.models.Model;
  module.FormSubmissionComplete=FormSubmissionComplete;

  function FormSubmissionComplete(submissionTask){
    Model.call(this,{
      "_type":"completeSubmission",
      "submissionId": submissionTask.get("submissionId"),
      "localSubmissionId" : submissionTask.get("localSubmissionId")
    });
  }

  appForm.utils.extend(FormSubmissionComplete,Model);

  return module;
})(appForm.models || {});
appForm.models = function (module) {
  var FileSubmission = appForm.models.FileSubmission;
  module.Base64FileSubmission = Base64FileSubmission;
  function Base64FileSubmission(fileData) {
    FileSubmission.call(this, fileData);
    this.set('_type', 'base64fileSubmission');
  }
  appForm.utils.extend(Base64FileSubmission, FileSubmission);
  return module;
}(appForm.models || {});
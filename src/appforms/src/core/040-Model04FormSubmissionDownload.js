appForm.models = function (module) {
  var Model = appForm.models.Model;
  module.FileSubmissionDownload = FileSubmissionDownload;
  function FileSubmissionDownload(fileData) {
    $fh.forms.log.d("FileSubmissionDownload ", fileData);
    Model.call(this, {
      '_type': 'fileSubmissionDownload',
      'data': fileData
    });
  }
  appForm.utils.extend(FileSubmissionDownload, Model);
  FileSubmissionDownload.prototype.setSubmissionId = function (submissionId) {
    $fh.forms.log.d("FileSubmission setSubmissionId.", submissionId);
    this.set('submissionId', submissionId);
  };
  FileSubmissionDownload.prototype.getSubmissionId = function () {
    $fh.forms.log.d("FileSubmission getSubmissionId: ", this.get('submissionId'));
    return this.get('submissionId');
  };
  FileSubmissionDownload.prototype.getHashName = function () {
    $fh.forms.log.d("FileSubmission getHashName: ", this.get('data').hashName);
    return this.get('data', {}).hashName;
  };
  FileSubmissionDownload.prototype.getFieldId = function () {
    $fh.forms.log.d("FileSubmission getFieldId: ", this.get('data').fieldId);
    return this.get('data', {}).fieldId;
  };
  FileSubmissionDownload.prototype.getFileMetaData = function(){
    $fh.forms.log.d("FileSubmission getFileMetaData: ", this.get('data'));
    if(this.get('data')){
      $fh.forms.log.d("FileSubmission getFileMetaData: data found", this.get('data'));
    } else {
      $fh.forms.log.e("FileSubmission getFileMetaData: No data found");
    }
    return this.get('data', {});
  };
  return module;
}(appForm.models || {});
appForm.models = function (module) {
  var Model = appForm.models.Model;
  module.FileSubmission = FileSubmission;
  function FileSubmission(fileData) {
    $fh.forms.log.d("FileSubmission ", fileData);
    Model.call(this, {
      '_type': 'fileSubmission',
      'data': fileData
    });
  }
  appForm.utils.extend(FileSubmission, Model);
  FileSubmission.prototype.loadFile = function (cb) {
    $fh.forms.log.d("FileSubmission loadFile");
    var fileName = this.getHashName();
    var that = this;
    appForm.utils.fileSystem.readAsFile(fileName, function (err, file) {
      if (err) {
        $fh.forms.log.e("FileSubmission loadFile. Error reading file", fileName, err);
        cb(err);
      } else {
        $fh.forms.log.d("FileSubmission loadFile. File read correctly", fileName, file);
        that.fileObj = file;
        cb(null);
      }
    });
  };
  FileSubmission.prototype.getProps = function () {
    if(this.fileObj){
      $fh.forms.log.d("FileSubmissionDownload: file object found");
      return this.fileObj;
    } else {
      $fh.forms.log.e("FileSubmissionDownload: no file object found");
    }
  };
  FileSubmission.prototype.setSubmissionId = function (submissionId) {
    $fh.forms.log.d("FileSubmission setSubmissionId.", submissionId);
    this.set('submissionId', submissionId);
  };
  FileSubmission.prototype.getSubmissionId = function () {
    return this.get('submissionId');
  };
  FileSubmission.prototype.getHashName = function () {
    return this.get('data').hashName;
  };
  FileSubmission.prototype.getFieldId = function () {
    return this.get('data').fieldId;
  };
  return module;
}(appForm.models || {});
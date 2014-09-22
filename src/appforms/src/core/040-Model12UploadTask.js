/**
 * Uploading task for each submission
 */
appForm.models = function (module) {
  module.uploadTask = {
    'newInstance': newInstance,
    'fromLocal': fromLocal
  };


  var _uploadTasks = {};

  var Model = appForm.models.Model;

  function newInstance(submissionModel) {
    if(submissionModel){
      var utObj = new UploadTask();
      utObj.init(submissionModel);
      _uploadTasks[utObj.getLocalId()] = utObj;
      return utObj;
    } else {
      return {};
    }
  }


  function fromLocal(localId, cb) {
    if (_uploadTasks[localId]) {
      return cb(null, _uploadTasks[localId]);
    }
    var utObj = new UploadTask();
    utObj.setLocalId(localId);
    _uploadTasks[localId] = utObj;
    utObj.loadLocal(cb);
  }


  function UploadTask() {
    Model.call(this, { '_type': 'uploadTask' });
  }


  appForm.utils.extend(UploadTask, Model);
  UploadTask.prototype.init = function (submissionModel) {
    var self = this;
    var submissionLocalId = submissionModel.getLocalId();
    self.setLocalId(submissionLocalId + '_' + 'uploadTask');
    self.set('submissionLocalId', submissionLocalId);
    self.set('fileTasks', []);
    self.set('currentTask', null);
    self.set('completed', false);
    self.set('retryAttempts', 0);
    self.set('retryNeeded', false);
    self.set('mbaasCompleted', false);
    self.set('submissionTransferType', 'upload');
    submissionModel.setUploadTaskId(self.getLocalId());

    function initSubmissionUpload(){
      var json = submissionModel.getProps();
      self.set('jsonTask', json);
      self.set('formId', submissionModel.get('formId'));

    }

    function initSubmissionDownload(){
      self.set('submissionId', submissionModel.getRemoteSubmissionId());
      self.set('jsonTask', {});
      self.set('submissionTransferType', 'download');
    }

    if(submissionModel.isDownloadSubmission()){
      initSubmissionDownload();
    } else {
      initSubmissionUpload();
    }
  };
  UploadTask.prototype.getTotalSize = function () {
    var self = this;
    var jsonSize = JSON.stringify(self.get('jsonTask')).length;
    var fileTasks = self.get('fileTasks');
    var fileSize = 0;
    var fileTask;
    for (var i = 0; i<fileTasks.length ; i++) {
      fileTask = fileTasks[i];
      fileSize += fileTask.fileSize;
    }
    return jsonSize + fileSize;
  };
  UploadTask.prototype.getUploadedSize = function () {
    var currentTask = this.getCurrentTask();
    if (currentTask === null) {
      return 0;
    } else {
      var jsonSize = JSON.stringify(this.get('jsonTask')).length;
      var fileTasks = this.get('fileTasks');
      var fileSize = 0;
      for (var i = 0, fileTask; (fileTask = fileTasks[i]) && i < currentTask; i++) {
        fileSize += fileTask.fileSize;
      }
      return jsonSize + fileSize;
    }
  };
  UploadTask.prototype.getRemoteStore = function () {
    return appForm.stores.dataAgent.remoteStore;
  };
  UploadTask.prototype.addFileTasks = function(submissionModel, cb){
    var self = this;
    submissionModel.getFileInputValues(function(err, files){
      if(err){
        $fh.forms.log.e("Error getting file Input values: " + err);
        return cb(err);
      }
      for (var i = 0; i<files.length ; i++) {
        var file = files[i];
        self.addFileTask(file);
      }
      cb();
    });
  };
  UploadTask.prototype.addFileTask = function (fileDef) {
    this.get('fileTasks').push(fileDef);
  };
  /**
   * get current uploading task
   * @return {[type]} [description]
   */
  UploadTask.prototype.getCurrentTask = function () {
    return this.get('currentTask', null);
  };
  UploadTask.prototype.getRetryAttempts = function () {
    return this.get('retryAttempts');
  };
  UploadTask.prototype.increRetryAttempts = function () {
    this.set('retryAttempts', this.get('retryAttempts') + 1);
  };
  UploadTask.prototype.resetRetryAttempts = function () {
    this.set('retryAttempts', 0);
  };
  UploadTask.prototype.isStarted = function () {
    return this.getCurrentTask() === null ? false : true;
  };


  UploadTask.prototype.setSubmissionQueued = function(cb){
    var self = this;
    self.submissionModel(function(err, submission){
      if(err){
        return cb(err);
      }

      if(self.get("submissionId")){
        submission.setRemoteSubmissionId(self.get("submissionId"));
      }

      submission.queued(cb);
    });
  };
  /**
   * upload/download form submission
   * @param  {Function} cb [description]
   * @return {[type]}      [description]
   */
  UploadTask.prototype.uploadForm = function (cb) {
    var self = this;

    function processUploadDataResult(res){
      $fh.forms.log.d("In processUploadDataResult");
      var formSub = self.get("jsonTask");
      if(res.error){
        $fh.forms.log.e("Error submitting form " + res.error);
        return cb("Error submitting form " + res.error);
      } else {
        var submissionId = res.submissionId;
        // form data submitted successfully.
        formSub.lastUpdate = appForm.utils.getTime();
        self.set('submissionId', submissionId);

        self.setSubmissionQueued(function(err){
          self.increProgress();
          self.saveLocal(function (err) {
            if (err) {
              $fh.forms.log.e("Error saving uploadTask to local storage" + err);
            }
          });
          self.emit('progress', self.getProgress());
          return cb(null);
        });
      }
    }

    function processDownloadDataResult(err, res){
      $fh.forms.log.d("In processDownloadDataResult");
      if(err){
        $fh.forms.log.e("Error downloading submission data"+ err);
        return cb(err);
      }

      //Have the definition of the submission
      self.submissionModel(function(err, submissionModel){
        $fh.forms.log.d("Got SubmissionModel", err, submissionModel);
        if(err){
          return cb(err);
        }
        var JSONRes = {};

        //Instantiate the model from the json definition
        if(typeof(res) === "string"){
          try{
            JSONRes = JSON.parse(res);
          } catch (e){
            $fh.forms.log.e("processDownloadDataResult Invalid JSON Object Returned", res);
            return cb("Invalid JSON Object Returned");
          }
        } else {
          JSONRes = res;
        }

        if(JSONRes.status){
          delete JSONRes.status;
        }

        submissionModel.fromJSON(JSONRes);
        self.set('jsonTask', res);
        submissionModel.saveLocal(function(err){
          $fh.forms.log.d("Saved SubmissionModel", err, submissionModel);
          if(err){
            $fh.forms.log.e("Error saving updated submission from download submission: " + err);
          }

          //Submission Model is now populated with all the fields in the submission
          self.addFileTasks(submissionModel, function(err){
            $fh.forms.log.d("addFileTasks called", err, submissionModel);
            if(err){
              return cb(err);
            }
            self.increProgress();
            self.saveLocal(function (err) {
              if (err) {
                $fh.forms.log.e("Error saving downloadTask to local storage" + err);
              }

              self.emit('progress', self.getProgress());
              return cb();
            });
          });
        });
      });
    }

    function uploadSubmissionJSON(){
      $fh.forms.log.d("In uploadSubmissionJSON");
      var formSub = self.get('jsonTask');
      self.submissionModel(function(err, submissionModel){
        if(err){
          return cb(err);
        }
        self.addFileTasks(submissionModel, function(err){
          if(err){
            $fh.forms.log.e("Error adding file tasks for submission upload");
            return cb(err);
          }

          var formSubmissionModel = new appForm.models.FormSubmission(formSub);
          self.getRemoteStore().create(formSubmissionModel, function (err, res) {
            if (err) {
              return cb(err);
            } else {
              var updatedFormDefinition = res.updatedFormDefinition;
              if (updatedFormDefinition) {
                // remote form definition is updated
                self.refreshForm(updatedFormDefinition, function (err) {
                  //refresh form def in parallel. maybe not needed.
                  $fh.forms.log.d("Form Updated, refreshed");
                  if (err) {
                    $fh.forms.log.e(err);
                  }
                  processUploadDataResult(res);
                });
              } else {
                processUploadDataResult(res);
              }
            }
          });
        });
      });

    }

    function downloadSubmissionJSON(){
      var formSubmissionDownload = new appForm.models.FormSubmissionDownload(self);
      self.getRemoteStore().read(formSubmissionDownload, processDownloadDataResult);
    }

    if(self.isDownloadTask()){
      downloadSubmissionJSON();
    } else {
      uploadSubmissionJSON();
    }
  };

  /**
   * Handles the case where a call to completeSubmission returns a status other than "completed".
   * Will only ever get to this function when a call is made to the completeSubmission server.
   *
   *
   * @param err (String) Error message associated with the error returned
   * @param res {"status" : <pending/error>, "pendingFiles" : [<any pending files not yet uploaded>]}
   * @param cb Function callback
   */
  UploadTask.prototype.handleCompletionError = function (err, res, cb) {
    $fh.forms.log.d("handleCompletionError Called");
    var errorMessage = err;
    if (res.status === 'pending') {
      //The submission is not yet complete, there are files waiting to upload. This is an unexpected state as all of the files should have been uploaded.
      errorMessage = 'Submission Still Pending.';
    } else if (res.status === 'error') {
      //There was an error completing the submission.
      errorMessage = 'Error completing submission';
    } else {
      errorMessage = 'Invalid return type from complete submission';
    }
    cb(errorMessage);
  };

  /**
   * Handles the case where the current submission status is required from the server.
   * Based on the files waiting to be uploaded, the upload task is re-built with pendingFiles from the server.
   *
   * @param cb
   */
  UploadTask.prototype.handleIncompleteSubmission = function (cb) {
    var self = this;
    function processUploadIncompleteSubmission(){

      var remoteStore = self.getRemoteStore();
      var submissionStatus = new appForm.models.FormSubmissionStatus(self);

      remoteStore.submissionStatus(submissionStatus, function (err, res) {
        var errMessage="";
        if (err) {
          cb(err);
        } else if (res.status === 'error') {
          //The server had an error submitting the form, finish with an error
          errMessage= 'Error submitting form.';
          cb(errMessage);
        } else if (res.status === 'complete') {
          //Submission is complete, make uploading progress further
          self.increProgress();
          cb();
        } else if (res.status === 'pending') {
          //Submission is still pending, check for files not uploaded yet.
          var pendingFiles = res.pendingFiles || [];
          if (pendingFiles.length > 0) {
            self.resetUploadTask(pendingFiles, function () {
              cb();
            });
          } else {
            //No files pending on the server, make the progress further
            self.increProgress();
            cb();
          }
        } else {
          //Should not get to this point. Only valid status responses are error, pending and complete.
          errMessage = 'Invalid submission status response.';
          cb(errMessage);
        }
      });
    }

    function processDownloadIncompleteSubmission(){
      //No need to go the the server to get submission details -- The current progress status is valid locally
      cb();
    }

    if(self.isDownloadTask()){
      processDownloadIncompleteSubmission();
    } else {
      processUploadIncompleteSubmission();
    }
  };

  /**
   * Resetting the upload task based on the response from getSubmissionStatus
   * @param pendingFiles -- Array of files still waiting to upload
   * @param cb
   */
  UploadTask.prototype.resetUploadTask = function (pendingFiles, cb) {
    var filesToUpload = this.get('fileTasks');
    var resetFilesToUpload = [];
    var fileIndex;
    //Adding the already completed files to the reset array.
    for (fileIndex = 0; fileIndex < filesToUpload.length; fileIndex++) {
      if (pendingFiles.indexOf(filesToUpload[fileIndex].hashName) < 0) {
        resetFilesToUpload.push(filesToUpload[fileIndex]);
      }
    }
    //Adding the pending files to the end of the array.
    for (fileIndex = 0; fileIndex < filesToUpload.length; fileIndex++) {
      if (pendingFiles.indexOf(filesToUpload[fileIndex].hashName) > -1) {
        resetFilesToUpload.push(filesToUpload[fileIndex]);
      }
    }
    var resetFileIndex = filesToUpload.length - pendingFiles.length - 1;
    var resetCurrentTask = 0;
    if (resetFileIndex > 0) {
      resetCurrentTask = resetFileIndex;
    }
    //Reset current task
    this.set('currentTask', resetCurrentTask);
    this.set('fileTasks', resetFilesToUpload);
    this.saveLocal(cb);  //Saving the reset files list to local
  };
  UploadTask.prototype.uploadFile = function (cb) {
    var self = this;
    var progress = self.getCurrentTask();

    if (progress === null) {
      progress = 0;
      self.set('currentTask', progress);
    }
    var fileTask = self.get('fileTasks', [])[progress];
    var submissionId = self.get('submissionId');
    var fileSubmissionModel;
    if (!fileTask) {
      $fh.forms.log.e("No file task found when trying to transfer a file.");
      return cb('cannot find file task');
    }

    if(!submissionId){
      $fh.forms.log.e("No submission id found when trying to transfer a file.");
      return cb("No submission Id found");
    }

    function processUploadFile(){
      $fh.forms.log.d("processUploadFile for submissionId: ");
      if (fileTask.contentType === 'base64') {
        fileSubmissionModel = new appForm.models.Base64FileSubmission(fileTask);
      } else {
        fileSubmissionModel = new appForm.models.FileSubmission(fileTask);
      }
      fileSubmissionModel.setSubmissionId(submissionId);
      fileSubmissionModel.loadFile(function (err) {
        if (err) {
          $fh.forms.log.e("Error loading file for upload: " + err);
          return cb(err);
        } else {
          self.getRemoteStore().create(fileSubmissionModel, function (err, res) {
            if (err) {
              cb(err);
            } else {
              if (res.status === 'ok' || res.status === 200 || res.status === '200') {
                fileTask.updateDate = appForm.utils.getTime();
                self.increProgress();
                self.saveLocal(function (err) {
                  //save current status.
                  if (err) {
                    $fh.forms.log.e("Error saving upload task" + err);
                  }
                });
                self.emit('progress', self.getProgress());
                cb(null);
              } else {
                var errorMessage = 'File upload failed for file: ' + fileTask.fileName;
                cb(errorMessage);
              }
            }
          });
        }
      });
    }

    function processDownloadFile(){
      $fh.forms.log.d("processDownloadFile called");
      fileSubmissionModel = new appForm.models.FileSubmissionDownload(fileTask);
      fileSubmissionModel.setSubmissionId(submissionId);
      self.getRemoteStore().read(fileSubmissionModel, function (err, localFilePath) {
        if(err){
          $fh.forms.log.e("Error downloading a file from remote: " + err);
          return cb(err);
        }

        $fh.forms.log.d("processDownloadFile called. Local File Path: " + localFilePath);

        //Update the submission model to add local file uri to a file submission object
        self.submissionModel(function(err, submissionModel){
          if(err){
            $fh.forms.log.e("Error Loading submission model for processDownloadFile " + err);
            return cb(err);
          }

          submissionModel.updateFileLocalURI(fileTask, localFilePath, function(err){
            if(err){
              $fh.forms.log.e("Error updating file local url for fileTask " + JSON.stringify(fileTask));
              return cb(err);
            }

            self.increProgress();
            self.saveLocal(function (err) {
              //save current status.
              if (err) {
                $fh.forms.log.e("Error saving download task");
              }
            });
            self.emit('progress', self.getProgress());
            return cb();
          });
        });
      });
    }

    if(self.isDownloadTask()){
      processDownloadFile();
    } else {
      processUploadFile();
    }
  };
  UploadTask.prototype.isDownloadTask = function(){
    return this.get("submissionTransferType") === "download";
  };
  //The upload task needs to be retried
  UploadTask.prototype.setRetryNeeded = function (retryNeeded) {
    //If there is a submissionId, then a retry is needed. If not, then the current task should be set to null to retry the submission.
    if (this.get('submissionId', null) != null) {
      this.set('retryNeeded', retryNeeded);
    } else {
      this.set('retryNeeded', false);
      this.set('currentTask', null);
    }
  };
  UploadTask.prototype.retryNeeded = function () {
    return this.get('retryNeeded');
  };
  UploadTask.prototype.uploadTick = function (cb) {
    var self = this;
    function _handler(err) {
      if (err) {
        $fh.forms.log.d('Err, retrying transfer: ' + self.getLocalId());
        //If the upload has encountered an error -- flag the submission as needing a retry on the next tick -- User should be insulated from an error until the retries are finished.
        self.increRetryAttempts();
        if (self.getRetryAttempts() <= $fh.forms.config.get('max_retries')) {
          self.setRetryNeeded(true);
          self.saveLocal(function (err) {
            if (err){
              $fh.forms.log.e("Error saving upload taskL " + err);
            }

            cb();
          });
        } else {
          //The number of retry attempts exceeds the maximum number of retry attempts allowed, flag the upload as an error.
          self.setRetryNeeded(true);
          self.resetRetryAttempts();
          self.error(err, function () {
            cb(err);
          });
        }
      } else {
        //no error.
        self.setRetryNeeded(false);
        self.saveLocal(function (_err) {
          if (_err){
            $fh.forms.log.e("Error saving upload task to local memory" + _err);
          }
        });
        self.submissionModel(function (err, submission) {
          if (err) {
            cb(err);
          } else {
            var status = submission.get('status');
            if (status !== 'inprogress' && status !== 'submitted' && status !== 'downloaded' && status !== 'queued') {
              $fh.forms.log.e('Submission status is incorrect. Upload task should be started by submission object\'s upload method.' + status);
              cb('Submission status is incorrect. Upload task should be started by submission object\'s upload method.');
            } else {
              cb();
            }
          }
        });
      }
    }
    if (!this.isFormCompleted()) {
      // No current task, send the form json
      this.uploadForm(_handler);
    } else if (this.retryNeeded()) {
      //If a retry is needed, this tick gets the current status of the submission from the server and resets the submission.
      this.handleIncompleteSubmission(_handler);
    } else if (!this.isFileCompleted()) {
      //files to be uploaded
      this.uploadFile(_handler);
    } else if (!this.isMBaaSCompleted()) {
      //call mbaas to complete upload
      this.uploadComplete(_handler);
    } else if (!this.isCompleted()) {
      //complete the upload task
      this.success(_handler);
    } else {
      //task is already completed.
      _handler(null, null);
    }
  };
  UploadTask.prototype.increProgress = function () {
    var curTask = this.getCurrentTask();
    if (curTask === null) {
      curTask = 0;
    } else {
      curTask++;
    }
    this.set('currentTask', curTask);
  };
  UploadTask.prototype.uploadComplete = function (cb) {
    $fh.forms.log.d("UploadComplete Called");
    var self = this;
    var submissionId = self.get('submissionId', null);

    if (submissionId === null) {
      return cb('Failed to complete submission. Submission Id not found.');
    }

    function processDownloadComplete(){
      $fh.forms.log.d("processDownloadComplete Called");
      self.increProgress();
      cb(null);
    }

    function processUploadComplete(){
      $fh.forms.log.d("processUploadComplete Called");
      var remoteStore = self.getRemoteStore();
      var completeSubmission = new appForm.models.FormSubmissionComplete(self);
      remoteStore.create(completeSubmission, function (err, res) {
        //if status is not "completed", then handle the completion err
        res = res || {};
        if (res.status !== 'complete') {
          return self.handleCompletionError(err, res, cb);
        }
        //Completion is now completed sucessfully.. we can make the progress further.
        self.increProgress();
        cb(null);
      });
    }

    if(self.isDownloadTask()){
      processDownloadComplete();
    } else {
      processUploadComplete();
    }
  };
  /**
   * the upload task is successfully completed. This will be called when all uploading process finished successfully.
   * @return {[type]} [description]
   */
  UploadTask.prototype.success = function (cb) {
    $fh.forms.log.d("Transfer Sucessful. Success Called.");
    var self = this;
    var submissionId = self.get('submissionId', null);
    self.set('completed', true);
    

    function processUploadSuccess(cb){
      $fh.forms.log.d("processUploadSuccess Called");
      self.submissionModel(function (_err, model) {
        if(_err){
          return cb(_err);
        }
        model.set('submissionId', submissionId);
        model.submitted(cb);
      });
    }

    function processDownloadSuccess(cb){
      $fh.forms.log.d("processDownloadSuccess Called");
      self.submissionModel(function (_err, model) {
        if(_err){
          return cb(_err);
        } else {
          model.populateFilesInSubmission();
          model.downloaded(cb);
        }
      });
    }

    self.saveLocal(function (err) {
      if (err) {
        $fh.forms.log.e("Error Clearing Upload Task");
      }

      if(self.isDownloadTask()){
        processDownloadSuccess(function(err){
          self.clearLocal(cb);
        });
      } else {
        processUploadSuccess(function(err){
          self.clearLocal(cb);
        });
      }
    });
  };
  /**
   * the upload task is failed. It will not complete the task but will set error with error returned.
   * @param  {[type]}   err [description]
   * @param  {Function} cb  [description]
   * @return {[type]}       [description]
   */
  UploadTask.prototype.error = function (uploadErrorMessage, cb) {
    var self = this;
    $fh.forms.log.e("Error uploading submission: ", uploadErrorMessage);
    self.set('error', uploadErrorMessage);
    self.saveLocal(function (err) {
      if (err) {
        $fh.forms.log.e('Upload task save failed: ' + err);
      }

      self.submissionModel(function (_err, model) {
        if (_err) {
          cb(_err);
        } else {
          model.setUploadTaskId(null);
          model.error(uploadErrorMessage, function (err) {
            if(err){
              $fh.forms.log.e("Error updating submission model to error status ", err);
            } 
            self.clearLocal(function(err){
              if(err){
                $fh.forms.log.e("Error clearing upload task local storage: ", err);
              }  
              cb(err);    
            });
          });
        }
      });
    });
  };
  UploadTask.prototype.isFormCompleted = function () {
    var curTask = this.getCurrentTask();
    if (curTask === null) {
      return false;
    } else {
      return true;
    }
  };
  UploadTask.prototype.isFileCompleted = function () {
    var curTask = this.getCurrentTask();
    if (curTask === null) {
      return false;
    } else if (curTask < this.get('fileTasks', []).length) {
      return false;
    } else {
      return true;
    }
  };
  UploadTask.prototype.isError = function () {
    var error = this.get('error', null);
    if (error) {
      return true;
    } else {
      return false;
    }
  };
  UploadTask.prototype.isCompleted = function () {
    return this.get('completed', false);
  };
  UploadTask.prototype.isMBaaSCompleted = function () {
    var self = this;
    if (!self.isFileCompleted()) {
      return false;
    } else {
      var curTask = self.getCurrentTask();
      if (curTask > self.get('fileTasks', []).length) {
        //change offset if completion bit is changed
        self.set("mbaasCompleted", true);
        self.saveLocal(function(err){
          if(err){
            $fh.forms.log.e("Error saving upload task: ", err);
          }
        });
        return true;
      } else {
        return false;
      }
    }
  };
  UploadTask.prototype.getProgress = function () {
    var self = this;
    var rtn = {
        'formJSON': false,
        'currentFileIndex': 0,
        'totalFiles': self.get('fileTasks').length,
        'totalSize': self.getTotalSize(),
        'uploaded': self.getUploadedSize(),
        'retryAttempts': self.getRetryAttempts(),
        'submissionTransferType': self.get('submissionTransferType')
      };
    var progress = self.getCurrentTask();
    if (progress === null) {
      return rtn;
    } else {
      rtn.formJSON = true;
      rtn.currentFileIndex = progress;
    }
    return rtn;
  };
  /**
   * Refresh related form definition.
   * @param  {Function} cb [description]
   * @return {[type]}      [description]
   */
  UploadTask.prototype.refreshForm = function (updatedForm, cb) {
    var formId = this.get('formId');
    new appForm.models.Form({'formId': formId, 'rawMode': true, 'rawData' : updatedForm }, function (err, form) {
      if (err) {
        $fh.forms.log.e(err);
      }

      $fh.forms.log.l('successfully updated form the form with id ' + updatedForm._id);
      cb();
    });
  };
  UploadTask.prototype.submissionModel = function (cb) {
    appForm.models.submission.fromLocal(this.get('submissionLocalId'), function (err, submission) {
      if (err) {
        $fh.forms.log.e("Error getting submission model from local memory " + err);
      }
      cb(err, submission);
    });
  };
  return module;
}(appForm.models || {});
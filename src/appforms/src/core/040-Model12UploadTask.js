/**
 * Uploading task for each submission
 */
appForm.models = function (module) {
  module.uploadTask = {
    'newInstance': newInstance,
    'fromLocal': fromLocal
  };
  var _uploadTasks = {};
  //mem cache for singleton.
  var Model = appForm.models.Model;
  function newInstance(submissionModel) {
    var utObj = new UploadTask();
    utObj.init(submissionModel);
    _uploadTasks[utObj.getLocalId()] = utObj;
    return utObj;
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
    var json = submissionModel.getProps();
    var files = submissionModel.getFileInputValues();
    var submissionLocalId = submissionModel.getLocalId();
    this.setLocalId(submissionLocalId + '_' + 'uploadTask');
    this.set('submissionLocalId', submissionLocalId);
    this.set('jsonTask', json);
    this.set('fileTasks', []);
    this.set('currentTask', null);
    this.set('completed', false);
    this.set('mbaasCompleted', false);
    this.set('retryAttempts', 0);
    this.set('retryNeeded', false);
    this.set('formId', submissionModel.get('formId'));
    for (var i = 0; i<files.length ; i++) {
      var file = files[i];
      this.addFileTask(file);
    }
  };
  UploadTask.prototype.getTotalSize = function () {
    var jsonSize = JSON.stringify(this.get('jsonTask')).length;
    var fileTasks = this.get('fileTasks');
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
    return appForm.stores.mBaaS;
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
    return this.getCurrentTask() == null ? false : true;
  };
  /**
   * upload form submission
   * @param  {Function} cb [description]
   * @return {[type]}      [description]
   */
  UploadTask.prototype.uploadForm = function (cb) {
    var that = this;

    function processUploadDataResult(res){
      if(res.error){
        console.error("Error submitting form " + res.error);
        return cb("Error submitting form " + res.error);
      } else {
        var submissionId = res.submissionId;
        // form data submitted successfully.
        formSub.lastUpdate = appForm.utils.getTime();
        that.set('submissionId', submissionId);
        that.increProgress();
        that.saveLocal(function (err) {
          if (err) {
            console.error(err);
          }
        });
        that.emit('progress', that.getProgress());
        return cb(null);
      }
    }

    var formSub = this.get('jsonTask');

    var formSubmissionModel = new appForm.models.FormSubmission(formSub);
    this.getRemoteStore().create(formSubmissionModel, function (err, res) {
      if (err) {
        return cb(err);
      } else {
        var updatedFormDefinition = res.updatedFormDefinition;

        if (updatedFormDefinition) {
          // remote form definition is updated
          that.refreshForm(updatedFormDefinition, function (err) {
            //refresh form def in parallel. maybe not needed.
            console.log("Form Updated, refreshed");
            if (err) {
              console.error(err);
            }

            processUploadDataResult(res);
          });
        } else {
          processUploadDataResult(res);
        }
      }
    });
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
    var remoteStore = this.getRemoteStore();
    var submissionStatus = new appForm.models.FormSubmissionStatus(this);
    var that = this;
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
        that.increProgress();
        cb();
      } else if (res.status === 'pending') {
        //Submission is still pending, check for files not uploaded yet.
        var pendingFiles = res.pendingFiles || [];
        if (pendingFiles.length > 0) {
          that.resetUploadTask(pendingFiles, function () {
            cb();
          });
        } else {
          //No files pending on the server, make the progress further
          that.increProgress();
          cb();
        }
      } else {
        //Should not get to this point. Only valid status responses are error, pending and complete.
        errMessage = 'Invalid submission status response.';
        cb(errMessage);
      }
    });
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
    var that = this;
    var submissionId = this.get('submissionId');
    if (submissionId) {
      var progress = this.getCurrentTask();
      if (progress == null) {
        progress = 0;
        that.set('currentTask', progress);
      }
      var fileTask = this.get('fileTasks', [])[progress];
      if (!fileTask) {
        return cb('cannot find file task');
      }
      var fileSubmissionModel;
      if (fileTask.contentType == 'base64') {
        fileSubmissionModel = new appForm.models.Base64FileSubmission(fileTask);
      } else {
        fileSubmissionModel = new appForm.models.FileSubmission(fileTask);
      }
      fileSubmissionModel.setSubmissionId(submissionId);
      fileSubmissionModel.loadFile(function (err) {
        if (err) {
          return cb(err);
        } else {
          that.getRemoteStore().create(fileSubmissionModel, function (err, res) {
            if (err) {
              cb(err);
            } else {
              if (res.status == 'ok' || res.status == '200') {
                fileTask.updateDate = appForm.utils.getTime();
                that.increProgress();
                that.saveLocal(function (err) {
                  //save current status.
                  if (err) {
                    console.error(err);
                  }
                });
                that.emit('progress', that.getProgress());
                cb(null);
              } else {
                var errorMessage = 'File upload failed for file: ' + fileTask.fileName;
                cb(errorMessage);
              }
            }
          });
        }
      });
    } else {
      cb('Failed to upload file. Submission Id not found.');
    }
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
    var that = this;
    function _handler(err) {
      if (err) {
        console.error('Err, retrying:', err);
        //If the upload has encountered an error -- flag the submission as needing a retry on the next tick -- User should be insulated from an error until the retries are finished.
        that.increRetryAttempts();
        if (that.getRetryAttempts() <= appForm.config.get('max_retries')) {
          that.setRetryNeeded(true);
          that.saveLocal(function (err) {
            if (err)
              console.error(err);
            cb();
          });
        } else {
          //The number of retry attempts exceeds the maximum number of retry attempts allowed, flag the upload as an error.
          that.setRetryNeeded(true);
          that.resetRetryAttempts();
          that.error(err, function () {
            cb(err);
          });
        }
      } else {
        //no error.
        that.setRetryNeeded(false);
        that.saveLocal(function (_err) {
          if (_err)
            console.error(_err);
        });
        that.submissionModel(function (err, submission) {
          if (err) {
            cb(err);
          } else {
            var status = submission.get('status');
            if (status != 'inprogress' && status != 'submitted') {
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
    var submissionId = this.get('submissionId', null);
    var that = this;
    if (submissionId === null) {
      return cb('Failed to complete submission. Submission Id not found.');
    }
    var remoteStore = this.getRemoteStore();
    var completeSubmission = new appForm.models.FormSubmissionComplete(this);
    remoteStore.create(completeSubmission, function (err, res) {
      //if status is not "completed", then handle the completion err
      res = res || {};
      if (res.status !== 'complete') {
        return that.handleCompletionError(err, res, cb);
      }
      //Completion is now completed sucessfully.. we can make the progress further.
      that.increProgress();
      cb(null);
    });
  };
  /**
   * the upload task is successfully completed. This will be called when all uploading process finished successfully.
   * @return {[type]} [description]
   */
  UploadTask.prototype.success = function (cb) {
    var that = this;
    this.set('completed', true);
    this.saveLocal(function (err) {
      if (err) {
        console.error(err);
        console.error('Upload task save failed');
      }
    });
    this.submissionModel(function (_err, model) {
      if (_err) {
        cb(_err);
      } else {
        model.submitted(cb);
      }
    });
  };
  /**
   * the upload task is failed. It will not complete the task but will set error with error returned.
   * @param  {[type]}   err [description]
   * @param  {Function} cb  [description]
   * @return {[type]}       [description]
   */
  UploadTask.prototype.error = function (err, cb) {
    this.set('error', err);
    this.saveLocal(function (err) {
      if (err) {
        console.error(err);
        console.error('Upload task save failed');
      }
    });
    this.submissionModel(function (_err, model) {
      if (_err) {
        cb(_err);
      } else {
        model.error(err, function () {
        });
        cb(err);
      }
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
    if (!this.isFileCompleted()) {
      return false;
    } else {
      var curTask = this.getCurrentTask();
      if (curTask > this.get('fileTasks', []).length) {
        //change offset if completion bit is changed
        return true;
      } else {
        return false;
      }
    }
  };
  UploadTask.prototype.getProgress = function () {
    var rtn = {
        'formJSON': false,
        'currentFileIndex': 0,
        'totalFiles': this.get('fileTasks').length,
        'totalSize': this.getTotalSize(),
        'uploaded': this.getUploadedSize(),
        'retryAttempts': this.getRetryAttempts()
      };
    var progress = this.getCurrentTask();
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
        console.error(err);
      }

      console.log('successfully updated form the form with id ' + updatedForm._id);
      cb();
    });
  };
  UploadTask.prototype.submissionModel = function (cb) {
    appForm.models.submission.fromLocal(this.get('submissionLocalId'), function (err, submission) {
      if (err) {
        console.error(err);
      }
      cb(err, submission);
    });
  };
  return module;
}(appForm.models || {});
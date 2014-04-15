appForm.models = function(module) {
  module.submission = {
    newInstance: newInstance,
    fromLocal: fromLocal
  };
  //implmenetation
  var _submissions = {};
  //cache in mem for single reference usage.
  var Model = appForm.models.Model;
  var statusMachine = {
    'new': [
      'draft',
      'pending'
    ],
    'draft': [
      'pending',
      'draft'
    ],
    'pending': [
      'inprogress'
    ],
    'inprogress': [
      'submitted',
      'pending',
      'error',
      'inprogress',
      'downloaded'
    ],
    'submitted': [],
    'error': [
      'draft',
      'pending',
      'inprogress',
      'error'
    ]
  };

  function newInstance(form, params) {
    params = params ? params : {};

    return new Submission(form, params);
  }

  function fromLocal(localId, cb) {
    $fh.forms.log.d("Submission fromLocal: ", localId);
    if (_submissions[localId]) {
      $fh.forms.log.d("Submission fromLocal from cache: ", localId);
      //already loaded
      cb(null, _submissions[localId]);
    } else {
      //load from storage
      $fh.forms.log.d("Submission fromLocal not in cache. Loading from local storage.: ", localId);
      var submissionObject = new Submission();
      submissionObject.setLocalId(localId);
      submissionObject.loadLocal(function(err, submission) {
        if (err) {
          $fh.forms.log.e("Submission fromLocal. Error loading from local: ", localId, err);
          cb(err);
        } else {
          $fh.forms.log.d("Submission fromLocal. Load from local sucessfull: ", localId);
          submission.reloadForm(function(err, res) {
            if (err) {
              $fh.forms.log.e("Submission fromLocal. reloadForm. Error re-loading form: ", localId, err);
              cb(err);
            } else {
              $fh.forms.log.d("Submission fromLocal. reloadForm. Re-loading form successfull: ", localId);
              _submissions[localId] = submission;
              cb(null, submission);
            }
          });
        }
      });
    }
  }

  function Submission(form, params) {
    $fh.forms.log.d("Submission: ");
    Model.call(this, {
      '_type': 'submission'
    });
    if (typeof form != 'undefined' && form) {
      this.set('formName', form.get('name'));
      this.set('formId', form.get('_id'));
      this.set('deviceFormTimestamp', form.getLastUpdate());
      this.set('createDate', appForm.utils.getTime());
      this.set('timezoneOffset', appForm.utils.getTime(true));
      this.set('appId', appForm.config.get('appId'));
      this.set('appEnvironment', appForm.config.get('env'));
      this.set('appCloudName', '');
      this.set('comments', []);
      this.set('formFields', []);
      this.set('saveDate', null);
      this.set('submitDate', null);
      this.set('uploadStartDate', null);
      this.set('submittedDate', null);
      this.set('userId', null);
      this.set('filesInSubmission', {});
      this.set('deviceId', appForm.config.get('deviceId'));
      this.transactionMode = false;
    } else {
      this.set('appId', appForm.config.get('appId'));
      if(params.submissionId){
        this.set('downloadSubmission', true);
        this.setRemoteSubmissionId(params.submissionId);
      } else {
        this.set('status', 'new');
      }
    }
    this.set('status', 'new');
    this.genLocalId();
    var localId = this.getLocalId();
    _submissions[localId] = this;
  }
  appForm.utils.extend(Submission, Model);
  /**
   * save current submission as draft
   * @return {[type]} [description]
   */
  Submission.prototype.saveDraft = function(cb) {
    $fh.forms.log.d("Submission saveDraft: ");
    var targetStatus = 'draft';
    var that = this;
    this.set('timezoneOffset', appForm.utils.getTime(true));
    this.set('saveDate', appForm.utils.getTime());
    this.changeStatus(targetStatus, function(err) {
      if (err) {
        return cb(err);
      } else {
        that.emit('savedraft');
        cb(null, null);
      }
    });
  };
  Submission.prototype.validateField = function(fieldId, cb) {
    $fh.forms.log.d("Submission validateField: ", fieldId);
    var that = this;
    this.getForm(function(err, form) {
      if (err) {
        cb(err);
      } else {
        var submissionData = that.getProps();
        var ruleEngine = form.getRuleEngine();
        ruleEngine.validateField(fieldId, submissionData, cb);
      }
    });
  };
  Submission.prototype.checkRules = function(cb) {
    $fh.forms.log.d("Submission checkRules: ");
    var self = this;
    this.getForm(function(err, form) {
      if (err) {
        cb(err);
      } else {
        var submission = self.getProps();
        var ruleEngine = form.getRuleEngine();
        ruleEngine.checkRules(submission, cb);
      }
    });
  };
  /**
   * submit current submission to remote
   * @param  {Function} cb [description]
   * @return {[type]}      [description]
   */
  Submission.prototype.submit = function(cb) {
    $fh.forms.log.d("Submission submit: ");
    var targetStatus = 'pending';
    var validateResult = true;
    var that = this;
    this.set('timezoneOffset', appForm.utils.getTime(true));
    this.getForm(function(err, form) {
      if(err) $fh.forms.log.e("Submission submit: Error getting form ", err);
      var ruleEngine = form.getRuleEngine();
      var submission = that.getProps();
      ruleEngine.validateForm(submission, function(err, res) {
        if (err) {
          $fh.forms.log.e("Submission submit validateForm: Error validating form ", err);
          cb(err);
        } else {
          $fh.forms.log.d("Submission submit: validateForm. Completed result", res);
          var validation = res.validation;
          if (validation.valid) {
            $fh.forms.log.d("Submission submit: validateForm. Completed Form Valid", res);
            that.set('submitDate', new Date());
            that.changeStatus(targetStatus, function(error) {
              if (error) {
                cb(error);
              } else {
                that.emit('submit');
                cb(null, null);
              }
            });
          } else {
            $fh.forms.log.d("Submission submit: validateForm. Completed Validation error", res);
            cb('Validation error');
            that.emit('validationerror', validation);
          }
        }
      });
    });
  };
  Submission.prototype.getUploadTask = function(cb) {
    var taskId = this.getUploadTaskId();
    if (taskId) {
      appForm.models.uploadManager.getTaskById(taskId, cb);
    } else {
      cb(null, null);
    }
  };
  Submission.prototype.cancelUploadTask = function(cb) {
    var targetStatus = 'submit';
    var that = this;
    appForm.models.uploadManager.cancelSubmission(this, function(err) {
      if (err) {
        console.error(err);
      }
      that.changeStatus(targetStatus, cb);
    });
  };
  Submission.prototype.getUploadTaskId = function() {
    return this.get('uploadTaskId');
  };
  Submission.prototype.setUploadTaskId = function(utId) {
    this.set('uploadTaskId', utId);
  };
  Submission.prototype.submitted = function(cb) {
    var targetStatus = 'submitted';
    var that = this;
    this.set('submittedDate', appForm.utils.getTime());
    this.changeStatus(targetStatus, function(err) {
      if (err) {
        cb(err);
      } else {
        that.emit('submitted', that.get('submissionId'));
        cb(null, null);
      }
    });
  };
  //joint form id and submissions timestamp.
  Submission.prototype.genLocalId = function() {
    var lid = appForm.utils.localId(this);
    var formId = this.get('formId') || Math.ceil(Math.random() * 100000);
    this.setLocalId(formId + '_' + lid);
  };
  /**
   * change status and save the submission locally and register to submissions list.
   * @param {[type]} status [description]
   */
  Submission.prototype.changeStatus = function(status, cb) {
    if (this.isStatusValid(status)) {
      var that = this;
      this.set('status', status);
      this.saveToList(function(err) {
        if (err) {
          console.error(err);
        }
      });
      this.saveLocal(cb);
    } else {
      throw 'Target status is not valid: ' + status;
    }
  };
  Submission.prototype.upload = function(cb) {
    var targetStatus = "inprogress";
    var that = this;
    if (this.isStatusValid(targetStatus)) {
      this.set("status", targetStatus);
      this.set("uploadStartDate", appForm.utils.getTime());
      appForm.models.submissions.updateSubmissionWithoutSaving(this);
      appForm.models.uploadManager.queueSubmission(that, function(err, ut) {
        if (err) {
          cb(err);
        } else {
          ut.set("error", null);
          ut.saveLocal(function(err) {
            if (err) $fh.forms.log.e("Error saving upload task: " + err);
          });
          that.emit("inprogress", ut);
          ut.on("progress", function(progress) {
            $fh.forms.log.d("Emitting upload progress for submission: " + that.getLocalId() + JSON.stringify(progress));
            that.emit("progress", progress);
          });
          cb(null, ut);
        }
      });

    } else {
      return cb("Invalid Status to upload a form submission.");
    }
  };
  Submission.prototype.download = function(cb){
    var that = this;
    $fh.forms.log.d("Starting download for submission: " + that.getLocalId());
    var targetStatus = "pending";
    if(this.isStatusValid(targetStatus)){
      this.set("status", targetStatus);
      targetStatus = "inprogress";
      if(this.isStatusValid(targetStatus)){
        //Status is valid, add the submission to the
        appForm.models.uploadManager.queueSubmission(that, function(err, downloadTask) {
          if(err){
            return cb(err);
          }
          downloadTask.set("error", null);
          downloadTask.saveLocal(function(err) {
            if (err) $fh.forms.log.e("Error saving download task: " + err);
          });
          that.emit("inprogress", downloadTask);
          downloadTask.on("progress", function(progress) {
            $fh.forms.log.d("Emitting download progress for submission: " + that.getLocalId() + JSON.stringify(progress));
            that.emit("progress", progress);
          });
          return cb(null, downloadTask);
        });
      } else {
        return cb("Invalid Status to dowload a form submission");
      }
    } else {
      return cb("Invalid Status to download a form submission.");
    }
  };
  Submission.prototype.saveToList = function(cb) {
    appForm.models.submissions.saveSubmission(this, cb);
  };
  Submission.prototype.error = function(errorMsg, cb) {
    this.set('errorMessage', errorMsg);
    var targetStatus = 'error';
    this.changeStatus(targetStatus, cb);
    this.emit('submitted', errorMsg);
  };
  Submission.prototype.getStatus = function() {
    return this.get('status');
  };
  /**
   * check if a target status is valid
   * @param  {[type]}  targetStatus [description]
   * @return {Boolean}              [description]
   */
  Submission.prototype.isStatusValid = function(targetStatus) {
    var status = this.get('status').toLowerCase();
    var nextStatus = statusMachine[status];
    if (nextStatus.indexOf(targetStatus) > -1) {
      return true;
    } else {
      return false;
    }
  };
  Submission.prototype.addComment = function(msg, user) {
    var now = appForm.utils.getTime();
    var ts = now.getTime();
    var newComment = {
      'madeBy': typeof user == 'undefined' ? '' : user.toString(),
      'madeOn': now,
      'value': msg,
      'timeStamp': ts
    };
    this.getComments().push(newComment);
    return ts;
  };
  Submission.prototype.getComments = function() {
    return this.get('comments');
  };
  Submission.prototype.removeComment = function(timeStamp) {
    var comments = this.getComments();
    for (var i = 0; i < comments.length; i++) {
      var comment = comments[i];
      if (comment.timeStamp == timeStamp) {
        comments.splice(i, 1);
        return;
      }
    }
  };
  Submission.prototype.addSubmissionFile = function(fileHash) {
    var filesInSubmission = this.get('filesInSubmission', {});
    filesInSubmission[fileHash] = true;
    this.set('filesInSubmission', filesInSubmission);
    this.saveLocal(function(err) {
      if (err)
        console.error(err);
    });
  };
  /**
   * Add a value to submission.
   * This will not cause the field been validated.
   * Validation should happen:
   * 1. onblur (field value)
   * 2. onsubmit (whole submission json)
   *
   * @param {[type]} params   {"fieldId","value","index":optional}
   * @param {} cb(err,res) callback function when finished
   * @return true / error message
   */
  Submission.prototype.addInputValue = function(params, cb) {
    var that = this;
    var fieldId = params.fieldId;
    var inputValue = params.value;
    var index = params.index === undefined ? -1 : params.index;
    this.getForm(function(err, form) {
      var fieldModel = form.getFieldModelById(fieldId);
      if (that.transactionMode) {
        if (!that.tmpFields[fieldId]) {
          that.tmpFields[fieldId] = [];
        }
        fieldModel.processInput(params, function(err, result) {
          if (err) {
            cb(err);
          } else {
            if (index > -1) {
              that.tmpFields[fieldId][index] = result;
            } else {
              that.tmpFields[fieldId].push(result);
            }
            if (result != null && result.hashName) {
              that.addSubmissionFile(result.hashName);
            }
            cb(null, result);
          }
        });
      } else {
        var target = that.getInputValueObjectById(fieldId);
        fieldModel.processInput(params, function(err, result) {
          if (err) {
            cb(err);
          } else {
            if (index > -1) {
              target.fieldValues[index] = result;
            } else {
              target.fieldValues.push(result);
            }
            if (result != null && result.hashName) {
              that.addSubmissionFile(result.hashName);
            }
            cb(null, result);
          }
        });
      }
    });
  };
  Submission.prototype.getInputValueByFieldId = function(fieldId, cb) {
    var values = this.getInputValueObjectById(fieldId).fieldValues;
    this.getForm(function(err, form) {
      var fieldModel = form.getFieldModelById(fieldId);
      fieldModel.convertSubmission(values, cb);
    });
  };
  /**
   * Reset submission
   * @return {[type]} [description]
   */
  Submission.prototype.reset = function(cb) {
    this.set('formFields', []);
  };
  Submission.prototype.clearLocalSubmissionFiles = function(cb) {
    var filesInSubmission = this.get('filesInSubmission', {});
    for (var fileHashName in filesInSubmission) {
      appForm.utils.fileSystem.remove(fileHashName, function(err) {
        if (err)
          console.error(err);
      });
    }
    cb();
  };
  Submission.prototype.startInputTransaction = function() {
    this.transactionMode = true;
    this.tmpFields = {};
  };
  Submission.prototype.endInputTransaction = function(succeed) {
    this.transactionMode = false;
    if (succeed) {
      var targetArr = this.get('formFields');
      var tmpFields = this.tmpFields;
      for (var fieldId in tmpFields) {
        var target = this.getInputValueObjectById(fieldId);
        var valArr = tmpFields[fieldId];
        for (var i = 0; i < valArr.length; i++) {
          var val = valArr[i];
          target.fieldValues.push(val);
        }
      }
      this.tmpFields = {};
    } else {
      this.tmpFields = {};
    }
  };
  /**
   * remove an input value from submission
   * @param  {[type]} fieldId field id
   * @param  {[type]} index (optional) the position of the value will be removed if it is repeated field.
   * @return {[type]}         [description]
   */
  Submission.prototype.removeFieldValue = function(fieldId, index) {
    var targetArr = [];
    if (this.transactionMode) {
      targetArr = this.tmpFields.fieldId;
    } else {
      targetArr = this.getInputValueObjectById(fieldId).fieldId;
    }
    if (typeof index == 'undefined') {
      targetArr.splice(0, targetArr.length);
    } else {
      if (targetArr.length > index) {
        targetArr.splice(index, 1);
      }
    }
  };
  Submission.prototype.getInputValueObjectById = function(fieldId) {
    var formFields = this.get('formFields', []);
    for (var i = 0; i < formFields.length; i++) {
      var formField = formFields[i];
      if (formField.fieldId == fieldId) {
        return formField;
      }
    }
    var newField = {
      'fieldId': fieldId,
      'fieldValues': []
    };
    formFields.push(newField);
    return newField;
  };
  /**
   * get form model related to this submission.
   * @return {[type]} [description]
   */
  Submission.prototype.getForm = function(cb) {
    var Form = appForm.models.Form;
    var formId = this.get('formId');
    new Form({
      'formId': formId,
      'rawMode': true
    }, cb);
  };
  Submission.prototype.reloadForm = function(cb) {
    var Form = appForm.models.Form;
    var formId = this.get('formId');
    var self = this;
    new Form({
      formId: formId,
      'rawMode': true
    }, function(err, form) {
      if (err) {
        cb(err);
      } else {
        self.form = form;
        if (!self.get('deviceFormTimestamp', null)) {
          self.set('deviceFormTimestamp', form.getLastUpdate());
        }
        cb(null, form);
      }
    });
  };
  /**
   * Retrieve all file fields related value
   * If the submission has been downloaded, there is no gurantee that the form is  on-device.
   * @return {[type]} [description]
   */
  Submission.prototype.getFileInputValues = function() {
    var self = this;
    var fileFieldIds = self.getFileFieldsId();

    return self.getInputValueArray(fileFieldIds);
  };

  Submission.prototype.getFileFieldsId = function(){
    var self = this;
    var formFieldIds = [];

    if(self.get("downloadSubmission") === true){
      //For Submission downloads, there needs to be a scan through the formFields param
      var formFields = self.get("formFields", []);

      for(var formFieldIndex = 0; formFieldIndex < formFields.length; formFieldIndex++){
        var formFieldEntry = formFields[formFieldIndex].fieldId || {};
        if(formFieldEntry.type === 'file' || formFieldEntry.type === 'photo'){
          if(formFieldEntry._id){
            formFieldIds.push(formFieldEntry._id);
          }
        }
      }
    } else {
      formFieldIds = self.form.getFileFieldsId();
    }

    return formFieldIds;
  };

  Submission.prototype.updateFileLocalURI = function(fileDetails, newLocalFileURI, cb){
    var self = this;
    fileDetails = fileDetails || {};
    var fileInputValues = self.getFileInputValues();

    if(fileDetails.fileName && newLocalFileURI){
      //Search for the file placeholder name.
      var fieldDetails = self.findFilePlaceholderFieldId(fileDetails.fileName);
      if(fieldDetails.fieldId){
        var tmpObj = self.getInputValueObjectById(fieldDetails.fieldId)[fieldDetails.valueIndex];
        tmpObj.localURI = newLocalFileURI;
        self.getInputValueObjectById(fieldDetails.fieldId)[fieldDetails.valueIndex] = tmpObj;
        self.saveLocal(cb);
      } else {
        $fh.forms.log.e("No file field matches the placeholder name " + fileDetails.fileName);
        return cb("No file field matches the placeholder name " + fileDetails.fileName);
      }
    } else {
      $fh.forms.log.e("Submission: updateFileLocalURI : No fileName for submissionId : "+ JSON.stringify(fileDetails));
      return cb("Submission: updateFileLocalURI : No fileName for submissionId : "+ JSON.stringify(fileDetails));
    }
  };

  Submission.prototype.findFilePlaceholderFieldId = function(filePlaceholderName){
    var self = this;
    var fieldDetails = {};
    var fieldIds = self.getFileFieldsId();
    for (var i = 0; i< fieldIds.length; i++) {
      var fieldId = fieldIds[i];
      var inputValue = self.getInputValueObjectById(fieldId);
      for (var j = 0; j < inputValue.fieldValues.length; j++) {
        var tmpObj = inputValue.fieldValues[j];
        if (tmpObj) {
          if(tmpObj.fileName !== null && tmpObj.fileName === filePlaceholderName){
            fieldDetails.fieldId = fieldId;
            fieldDetails.valueIndex = j;
          }
        }
      }
    }

    return fieldId;
  };

  Submission.prototype.getInputValueArray = function(fieldIds) {
    var rtn = [];
    for (var i = 0; i< fieldIds.length; i++) {
      var  fieldId = fieldIds[i];
      var inputValue = this.getInputValueObjectById(fieldId);
      for (var j = 0; j < inputValue.fieldValues.length; j++) {
        var tmpObj = inputValue.fieldValues[j];
        if (tmpObj) {
          tmpObj.fieldId = fieldId;
          rtn.push(tmpObj);
        }
      }
    }
    return rtn;
  };
  Submission.prototype.clearLocal = function(cb) {
    var self = this;
    //remove from uploading list
    appForm.models.uploadManager.cancelSubmission(self, function(err, uploadTask) {
      if (err) {
        console.error(err);
        return cb(err);
      }
      //remove from submission list
      appForm.models.submissions.removeSubmission(self.getLocalId(), function(err) {
        if (err) {
          console.err(err);
          return cb(err);
        }
        self.clearLocalSubmissionFiles(function() {
          Model.prototype.clearLocal.call(self, function(err) {
            if (err) {
              console.error(err);
              return cb(err);
            }
            cb(null, null);
          });
        });
      });
    });
  };
  Submission.prototype.getRemoteSubmissionId = function() {
    return this.get("submissionId", "");
  };
  Submission.prototype.setRemoteSubmissionId = function(submissionId){
    if(submissionId){
      this.set("submissionId", submissionId);
    }
  };
  return module;
}(appForm.models || {});
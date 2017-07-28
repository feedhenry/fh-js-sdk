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
      'inprogress',
      'error',
      'draft'
    ],
    'inprogress': [
      'pending',
      'error',
      'inprogress',
      'downloaded',
      'queued'
    ],
    'submitted': [],
    'error': [
      'draft',
      'pending',
      'error'
    ],
    'downloaded' : [],
    'queued' : ['error', 'submitted']
  };

  function newInstance(form, params) {
    params = params ? params : {};
    var sub = new Submission(form, params);

    if(params.submissionId){
      appForm.models.submissions.updateSubmissionWithoutSaving(sub);
    }
    return sub;
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
          if(submission.isDownloadSubmission()){
            return cb(null, submission);
          } else {
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

        }
      });
    }
  }

  function Submission(form, params) {
    params = params || {};
    $fh.forms.log.d("Submission: ", params);
    Model.call(this, {
      '_type': 'submission'
    });
    if (typeof form !== 'undefined' && form) {
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
      this.set('filesInSubmission', []);
      this.set('deviceId', appForm.config.get('deviceId'));
      this.transactionMode = false;

      //Applying default values from the form definition.
      this.applyDefaultValues(form);
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

  Submission.prototype.performValidation = function(cb){
    var self = this;
    self.getForm(function(err, form) {
      if (err) {
        $fh.forms.log.e("Submission submit: Error getting form ", err);
        return cb(err);
      }
      var ruleEngine = form.getRuleEngine();
      var submission = self.getProps();
      ruleEngine.validateForm(submission, cb);
    });
  };

  /**
   * Validate the submission only.
   */
  Submission.prototype.validateSubmission = function(cb){
    var self = this;

    self.performValidation(function(err, res){
      if(err){
        return cb(err);
      }
      var validation = res.validation;
      if (validation.valid) {
        return cb(null, validation.valid);
      } else {
        self.emit('validationerror', validation);
        cb(null, validation.valid);
      }
    });
  };

  /**
   * Function for removing any values from a submisson that in hidden fields.
   *
   * @param {function} cb  -- Callback function
   */
  Submission.prototype.removeHiddenFieldValues = function(cb) {
    var self = this;
    async.waterfall([
      function checkSubmissionRules(callback) {
        self.checkRules(callback);
      },
      function getForm(ruleState, callback) {
        self.getForm(function(err, formModel) {
          return callback(err, ruleState, formModel);
        });
      },
      function pruneHiddenFields(ruleState, formModel, callback) {
        //Getting hidden pages and fields.

        var actions = ruleState.actions;

        var ruleTypes = ["fields", "pages"];

        //For page and field rule actions, find the hidden fields.
        var allHiddenFieldIds = _.map(ruleTypes, function(ruleType) {
          var fieldIds = [];

          var hidden = _.map(actions[ruleType] || {}, function(ruleAction, fieldOrPageId) {
            if (ruleAction.action === 'hide') {
              return fieldOrPageId;
            } else {
              return null;
            }
          });

          //If it is a hidden page, need to check for all fields that are in the page.
          //All of these fields are considered hidden.
          if(ruleType === 'pages') {
            fieldIds = _.map(hidden, function(pageId) {
              var pageModel = formModel.getPageModelById(pageId) || {};

              return pageModel.fieldsIds;
            });
          } else {
            fieldIds = hidden;
          }

          return _.compact(_.flatten(fieldIds));
        });

        allHiddenFieldIds = _.flatten(allHiddenFieldIds);

        //Now remove any values from from the submission containing hidden fields
        async.forEachSeries(allHiddenFieldIds, function(fieldId, cb) {
          self.removeFieldValue(fieldId, null, cb);
        }, function(err){
          if(err) {
            $fh.forms.log.e("Error removing fields", err);
          }

          return callback(err);
        });

      }
    ], cb);
  };

  /**
   * submit current submission to remote
   * @param  {Function} cb [description]
   * @return {[type]}      [description]
   */
  Submission.prototype.submit = function(cb) {
    var self = this;
    $fh.forms.log.d("Submission submit: ");
    var targetStatus = 'pending';

    self.set('timezoneOffset', appForm.utils.getTime(true));
    self.pruneNullValues();

    async.waterfall([
      function(callback) {
        self.removeHiddenFieldValues(callback);
      },
      function(callback) {
        self.pruneRemovedFields(callback);
      },
      function(callback) {
        self.performValidation(function(err, validationResult) {
          if (err) {
            $fh.forms.log.e("Submission submit validateForm: Error validating form ", err);
          }

          return callback(err, validationResult);
        });
      },
      function(validationResult, callback) {
        $fh.forms.log.d("Submission submit: validateForm. Completed result", validationResult);
        var validation = validationResult.validation || {};
        if (validation.valid) {
          $fh.forms.log.d("Submission submit: validateForm. Completed Form Valid", validationResult);
          self.set('submitDate', new Date());
          self.changeStatus(targetStatus, function(error) {
            if (error) {
              callback(error);
            } else {
              self.emit('submit');
              callback(null, null);
            }
          });
        } else {
          $fh.forms.log.d("Submission submit: validateForm. Completed Validation error", validationResult);
          self.emit('validationerror', validation);
          callback('Validation error');
        }
      }
    ], cb);
  };
  Submission.prototype.getUploadTask = function(cb) {
    var taskId = this.getUploadTaskId();
    if (taskId) {
      appForm.models.uploadManager.getTaskById(taskId, cb);
    } else {
      cb(null, null);
    }
  };
  Submission.prototype.getFormId = function(){
    return this.get("formId");
  };
  /**
   * If a submission is a download submission, the JSON definition of the form
   * that it was submitted against is contained in the submission.
   */
  Submission.prototype.getFormSubmittedAgainst = function(){
    return this.get("formSubmittedAgainst");
  };
  Submission.prototype.getDownloadTask = function(cb){
    var self = this;
    $fh.forms.log.d("getDownloadTask");
    if(self.isDownloadSubmission()){
      self.getUploadTask(cb);
    } else {
      if(cb && typeof(cb) === 'function'){
        $fh.forms.log.e("Submission is not a download submission");
        return cb("Submission is not a download submission");
      }
    }
  };
  Submission.prototype.cancelUploadTask = function(cb) {
    var targetStatus = 'submit';
    var that = this;
    appForm.models.uploadManager.cancelSubmission(this, function(err) {
      if (err) {
        $fh.forms.log.e(err);
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
  Submission.prototype.isInProgress = function(){
    return this.get("status") === "inprogress";
  };
  Submission.prototype.isDownloaded = function(){
    return this.get("status") === "downloaded";
  };
  Submission.prototype.isSubmitted = function(){
    return this.get("status") === "submitted";
  };
  Submission.prototype.submitted = function(cb) {
    var self = this;
    if(self.isDownloadSubmission()){
      var errMsg = "Downloaded submissions should not call submitted function.";
      $fh.forms.log.e(errMsg);
      return cb(errMsg);
    }
    $fh.forms.log.d("Submission submitted called");

    var targetStatus = 'submitted';

    self.set('submittedDate', appForm.utils.getTime());
    self.changeStatus(targetStatus, function(err) {
      if (err) {
        $fh.forms.log.e("Error setting submitted status " + err);
        cb(err);
      } else {
        $fh.forms.log.d("Submitted status set for submission " + self.get('submissionId') + " with localId " + self.getLocalId());
        self.emit('submitted', self.get('submissionId'));
        cb(null, null);
      }
    });
  };
  Submission.prototype.queued = function(cb){
    var self = this;
    if(self.isDownloadSubmission()){
      var errMsg = "Downloaded submissions should not call queued function.";
      $fh.forms.log.e(errMsg);
      return cb(errMsg);
    }

     var targetStatus = 'queued';
     self.set('queuedDate', appForm.utils.getTime());
     self.changeStatus(targetStatus, function(err) {
      if (err) {
        $fh.forms.log.e("Error setting queued status " + err);
        cb(err);
      } else {
        $fh.forms.log.d("Queued status set for submission " + self.get('submissionId') + " with localId " + self.getLocalId());
        self.emit('queued', self.get('submissionId'));
        cb(null, self);
      }
    });
  };
  Submission.prototype.downloaded = function(cb){
    $fh.forms.log.d("Submission Downloaded called");
    var that = this;
    var targetStatus = 'downloaded';

    that.set('downloadedDate', appForm.utils.getTime());
    that.pruneNullValues();
    that.changeStatus(targetStatus, function(err) {
      if (err) {
        $fh.forms.log.e("Error setting downloaded status " + err);
        cb(err);
      } else {
        $fh.forms.log.d("Downloaded status set for submission " + that.get('submissionId') + " with localId " + that.getLocalId());
        that.emit('downloaded', that.get('submissionId'));
        cb(null, that);
      }
    });
  };


  /**
   * Submission.prototype.pruneNullValues - Pruning null values from the submission
   *
   * @return {type}  description
   */
  Submission.prototype.pruneNullValues = function(){
    var formFields = this.getFormFields();

    for(var formFieldIndex = 0; formFieldIndex < formFields.length; formFieldIndex++){
      formFields[formFieldIndex].fieldValues = formFields[formFieldIndex].fieldValues || [];
      formFields[formFieldIndex].fieldValues = formFields[formFieldIndex].fieldValues.filter(function(fieldValue){
        return fieldValue !== null && typeof(fieldValue) !== "undefined";
      });
    }

    this.setFormFields(formFields);
  };

  /**
   * Submission.prototype.pruneRemovedFields - Pruning fields that have been deleted or removed from the form
   *
   * @return {type}  description
   */
  Submission.prototype.pruneRemovedFields = function(cb) {
    var that = this;
    var formFields = this.getFormFields();
    var newFields = [];
    var filesTobeRemoved = [];
    this.getForm(function(err, form) {
      if (err) {
        return cb(err);
      }
      //Loop and push matching fields
      _.each(formFields, function(field) {
        var fieldId = field.fieldId;
        if (form.fields.hasOwnProperty(fieldId)) {
          newFields.push(field);
        } else {
          //Only push field ID
          filesTobeRemoved.push(fieldId);
        }
      });

      //Delete files any left over files.
      async.forEach(filesTobeRemoved, function(fieldId, callback) {
        that.removeFieldValue(fieldId, null, callback);
      }, function(err) {
        //Update new set of formFields after deleting files
        that.set('formFields', newFields);
        cb(err);
      });
    });
  };


  /**
   *
   * Applying default values to a submission based on the form assigned to it.
   *
   * @param form - The form model to apply default values from
   */
  Submission.prototype.applyDefaultValues = function(form) {
    var formFields = this.getFormFields();

    //Have the form, need to apply default values to each of the fields.
    _.each(form.fields, function(field, fieldId) {
      var defaultValue = field.getDefaultValue();

      //No default values for this field, don't need to do anything.
      if(!defaultValue) {
        return;
      }

      var formFieldEntry = _.findWhere(formFields, {fieldId: fieldId});

      //If there is already an entry for this field, don't apply default values
      //Otherwise, create a new entry and add the default values.
      if(!formFieldEntry) {
        formFields.push({
          fieldId: fieldId,
          fieldValues: [defaultValue]
        });
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
          $fh.forms.log.e(err);
        }
      });
      this.saveLocal(cb);
    } else {
      $fh.forms.log.e('Target status is not valid: ' + status);
      cb('Target status is not valid: ' + status);
    }
  };
  Submission.prototype.upload = function(cb) {
    var targetStatus = "inprogress";
    var self = this;
    if (this.isStatusValid(targetStatus)) {
      this.set("status", targetStatus);
      this.set("uploadStartDate", appForm.utils.getTime());
      appForm.models.submissions.updateSubmissionWithoutSaving(this);
      appForm.models.uploadManager.queueSubmission(self, function(err, ut) {
        if (err) {
          cb(err);
        } else {
          ut.set("error", null);
          ut.saveLocal(function(err) {
            if (err) {
              $fh.forms.log.e("Error saving upload task: " + err);
            }
          });
          self.emit("inprogress", ut);
          ut.on("progress", function(progress) {
            $fh.forms.log.d("Emitting upload progress for submission: " + self.getLocalId() + JSON.stringify(progress));
            self.emit("progress", progress);
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
        this.set("status", targetStatus);
        //Status is valid, add the submission to the
        appForm.models.uploadManager.queueSubmission(that, function(err, downloadTask) {
          if(err){
            return cb(err);
          }
          downloadTask.set("error", null);
          downloadTask.saveLocal(function(err) {
            if (err) {
              $fh.forms.log.e("Error saving download task: " + err);
            }
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
    this.emit('error', errorMsg);
  };
  Submission.prototype.getStatus = function() {
    return this.get('status');
  };
  Submission.prototype.getErrorMessage = function(){
    return this.get('errorMessage', 'No Error');
  };
  /**
   * check if a target status is valid
   * @param  {[type]}  targetStatus [description]
   * @return {Boolean}              [description]
   */
  Submission.prototype.isStatusValid = function(targetStatus) {
    $fh.forms.log.d("isStatusValid. Target Status: " + targetStatus + " Current Status: " + this.get('status').toLowerCase());
    var status = this.get('status').toLowerCase();
    var nextStatus = statusMachine[status];
    if (nextStatus.indexOf(targetStatus) > -1) {
      return true;
    } else {
      this.set('status', 'error');
      return false;
    }
  };
  Submission.prototype.addComment = function(msg, user) {
    var now = appForm.utils.getTime();
    var ts = now.getTime();
    var newComment = {
      'madeBy': typeof user === 'undefined' ? '' : user.toString(),
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
      if (comment.timeStamp === timeStamp) {
        comments.splice(i, 1);
        return;
      }
    }
  };

  Submission.prototype.populateFilesInSubmission = function() {
    var self = this;
    var tmpFileNames = [];

    var submissionFiles = self.getSubmissionFiles();
    for (var fieldValIndex = 0; fieldValIndex < submissionFiles.length; fieldValIndex++) {
      if(submissionFiles[fieldValIndex].fileName){
        tmpFileNames.push(submissionFiles[fieldValIndex].fileName);
      } else if(submissionFiles[fieldValIndex].hashName){
        tmpFileNames.push(submissionFiles[fieldValIndex].hashName);
      }
    }

    self.set("filesInSubmission", submissionFiles);
  };

  Submission.prototype.getSubmissionFiles = function() {
    var self = this;
    $fh.forms.log.d("In getSubmissionFiles: " + self.getLocalId());
    var submissionFiles = [];

    var formFields = self.getFormFields();

    for (var formFieldIndex = 0; formFieldIndex < formFields.length; formFieldIndex++) {
      var tmpFieldValues = formFields[formFieldIndex].fieldValues || [];
      for (var fieldValIndex = 0; fieldValIndex < tmpFieldValues.length; fieldValIndex++) {
        if(tmpFieldValues[fieldValIndex] && tmpFieldValues[fieldValIndex].fileName){
          submissionFiles.push(tmpFieldValues[fieldValIndex]);
        } else if(tmpFieldValues[fieldValIndex] && tmpFieldValues[fieldValIndex].hashName){
          submissionFiles.push(tmpFieldValues[fieldValIndex]);
        }
      }

    }

    return submissionFiles;
  };

  /**
   * Add a value to submission.
   * This will not cause the field been validated.
   * Validation should happen:
   * 1. onblur (field value)
   * 2. onsubmit (whole submission json)
   *
   * @param {object} params   {"fieldId", "value", "index":optional, "sectionIndex":optional}
   * @param {string}  params.fieldId - if of the field
   * @param {string}  params.value - value for the field
   * @param {number}  [params.index] - field index for repeating fields.
   * @param {number}  [params.sectionIndex] - Section index for a field in a repeating section.
   */
  Submission.prototype.addInputValue = function(params, cb) {
    $fh.forms.log.d("Adding input value: ", JSON.stringify(params || {}));
    var that = this;
    var fieldId = params.fieldId;
    var inputValue = params.value;
    var index = params.index === undefined ? -1 : params.index;
    var sectionIndex = params.sectionIndex ? params.sectionIndex : 0;

    // concat. of fieldId and index in the section - this will provide unique mapping for fields
    // additional identifier for a field as in case of repeating sections fieldId is no longer sufficient
    var fieldIdentifier = fieldId + ':' + sectionIndex;

    if(!fieldId){
      return cb("Invalid parameters. fieldId is required");
    }

    //Transaction entries are not saved to memory, they are only saved when the transaction has completed.
    function processTransaction(form, fieldModel){
      if (!that.tmpFields[fieldIdentifier]) {
        that.tmpFields[fieldIdentifier] = [];
      }

      params.isStore = false;//Don't store the files until the transaction is complete
      fieldModel.processInput(params, function(err, result) {
        if (err) {
          return cb(err);
        } else {
          if (index > -1) {
            that.tmpFields[fieldIdentifier][index] = result;
          } else {
            that.tmpFields[fieldIdentifier].push(result);
          }
          return cb(null, result);
        }
      });
    }

    //Direct entries are saved immediately to local storage when they are input.
    function processDirectStore(form, fieldModel){
      var target = that.getInputValueObjectById(fieldId, sectionIndex);

      //File already exists for this input, overwrite rather than create a new file
      //If pushing the value to the end of the list, then there will be no previous value
      if(index > -1 && target.fieldValues[index]){
        if(typeof(target.fieldValues[index].hashName) === "string"){
          params.previousFile = target.fieldValues[index];
        } else {
          params.previousValue = target.fieldValues[index];
        }
      }

      fieldModel.processInput(params, function(err, result) {
        if (err) {
          return cb(err);
        } else {
          if (index > -1) {
            target.fieldValues[index] = result;
          } else {
            target.fieldValues.push(result);
          }

          if(result && typeof(result.hashName) === "string"){
            that.pushFile(result.hashName);
          }

          return cb(null, result);
        }
      });
    }

    function gotForm(err, form) {
      var fieldModel = form.getFieldModelById(fieldId);

      if(!fieldModel){
        return cb("No field model found for fieldId " + fieldId);
      }

      if (that.transactionMode) {
        processTransaction(form, fieldModel);
      } else {
        processDirectStore(form, fieldModel);
      }
    }

    this.getForm(gotForm);
  };

  Submission.prototype.pushFile = function(hashName){
    var subFiles = this.get('filesInSubmission', []);
    if(typeof(hashName) === "string"){
      if(subFiles.indexOf(hashName) === -1){
        subFiles.push(hashName);
        this.set('filesInSubmission', subFiles);
      }
    }
  };

  Submission.prototype.removeFileValue = function(hashName){
    var subFiles = this.get('filesInSubmission', []);
    if(typeof(hashName) === "string" && subFiles.indexOf(hashName) > -1){
      subFiles.splice(subFiles.indexOf(hashName),1);
      this.set('filesInSubmission', subFiles);
    }
  };

  /**
   * Returns input value for a field with a given id
   * @param {string} fieldId - id of the field
   * @param {number} [sectionIndex] - optional section id in case field is in repeating section
   * @param {function} cb - callback
   */
  Submission.prototype.getInputValueByFieldId = function(fieldId, sectionIndex, cb) {
    //Back compatibility
    if(!cb && _.isFunction(sectionIndex)){
      cb = sectionIndex;
      sectionIndex = 0;
    }

    var self = this;
    var values = this.getInputValueObjectById(fieldId, sectionIndex).fieldValues;
    this.getForm(function(err, form) {
      var fieldModel = form.getFieldModelById(fieldId);
      fieldModel.convertSubmission(values, cb);
    });
  };

  /**
   * Reset submission
   * @return {[type]} [description]
   */
  Submission.prototype.reset = function() {
    var self = this;
    self.clearLocalSubmissionFiles(function(err){
      self.set('formFields', []);
    });
  };
  Submission.prototype.isDownloadSubmission = function(){
    return this.get("downloadSubmission") === true;
  };

  Submission.prototype.getSubmissionFile = function(fileName, cb){
    appForm.stores.localStorage.readFile(fileName, cb);
  };
  Submission.prototype.clearLocalSubmissionFiles = function(cb) {
    $fh.forms.log.d("In clearLocalSubmissionFiles");
    var self = this;
    var filesInSubmission = self.get("filesInSubmission", []);
    $fh.forms.log.d("Files to clear ", filesInSubmission);
    var localFileName = "";

    for (var fileMetaObject in filesInSubmission) {
      $fh.forms.log.d("Clearing file " + filesInSubmission[fileMetaObject]);
      appForm.stores.localStorage.removeEntry(filesInSubmission[fileMetaObject], function(err) {
        if (err) {
          $fh.forms.log.e("Error removing files from " + err);
        }
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
    var tmpFields = {};

    // additional identifier for a field as in case of repeating sections fieldId is no longer sufficient
    // used as a key on tmpFields, also used in processTransaction submission.addinputvalue().processTransaction()
    var fieldIdentifier = "";

    var valIndex = 0;
    var valArr = [];
    var val = "";
    if (succeed) {
      tmpFields = this.tmpFields;
      for (fieldIdentifier in tmpFields) {
        var fieldIdentifierSplit = fieldIdentifier.split(':');
        var target = this.getInputValueObjectById(fieldIdentifierSplit[0], parseInt(fieldIdentifierSplit[1]));
        valArr = tmpFields[fieldIdentifier];
        for (valIndex = 0; valIndex < valArr.length; valIndex++) {
          val = valArr[valIndex];
          target.fieldValues.push(val);
          if (typeof(val.hashName) === "string") {
            this.pushFile(val.hashName);
          }
        }
      }
      this.tmpFields = {};
    } else {
      //clear any files set as part of the transaction
      tmpFields = this.tmpFields;
      this.tmpFields = {};
      for (fieldIdentifier in tmpFields) {
        valArr = tmpFields[fieldIdentifier];
        for (valIndex = 0; valIndex < valArr.length; valIndex++) {
          val = valArr[valIndex];
          if(typeof(val.hashName) === "string"){
            //This is a file, needs to be removed
            appForm.stores.localStorage.removeEntry(val.hashName, function(err){
              $fh.forms.log.e("Error removing file from transaction ", err);
            });
          }
        }
      }
    }
  };
  /**
   * remove an input value from submission
   * @param  {[type]} fieldId field id
   * @param  {[type]} index (optional) the position of the value will be removed if it is repeated field.
   * @param  {function} [Optional callback]
   * @return {[type]}         [description]
   */
  Submission.prototype.removeFieldValue = function(fieldId, index, sectionIndex, callback) {
    //Back compatibility
    if(!callback && _.isFunction(sectionIndex)){
      callback = sectionIndex;
      sectionIndex = 0;
    }

    callback = callback || function(){};
    var self = this;
    var targetArr = [];
    var valsRemoved = {};
    if (this.transactionMode) {
      // field identifier, check function addInputValue() for more information.
      targetArr = this.tmpFields[fieldId + ':' + sectionIndex];
    } else {
      targetArr = this.getInputValueObjectById(fieldId, sectionIndex).fieldValues;
    }
    //If no index is supplied, all values are removed.
    if (index === null || typeof index === 'undefined') {
      valsRemoved = targetArr.splice(0, targetArr.length);
    } else {
      if (targetArr.length > index) {
        valsRemoved = targetArr.splice(index, 1, null);
      }
    }

    //Clearing up any files from local storage.
    async.forEach(valsRemoved, function(valRemoved, cb){
      if(valRemoved && valRemoved.hashName){
        appForm.stores.localStorage.removeEntry(valRemoved.hashName, function(err){
          if(err){
            $fh.forms.log.e("Error removing file: ", err, valRemoved);
          } else {
            self.removeFileValue(valRemoved.hashName);
          }
          return cb(null, valRemoved);
        });
      } else {
        return cb();
      }
    }, function(err){
      callback(err);
    });
  };

  /**
   * Returns object representing the field along with its values.
   * @param {string} fieldId - id of the field
   * @param {number} sectionIndex - optional section id in case field is in repeating section
   * @returns {object} field definition with input values and section index
   */
  Submission.prototype.getInputValueObjectById = function(fieldId, sectionIndex) {
    if (_.isUndefined(sectionIndex)) {
      sectionIndex = 0;
    }
    var formFields = this.getFormFields();

    for (var i = 0; i < formFields.length; i++) {
      var formField = formFields[i];

      //field is matching another field if their section index is the same or if it is missing section index(older entries).
      var sectionIndexOk = _.isUndefined(formField.sectionIndex) || formField.sectionIndex === sectionIndex;

      if (formField.fieldId._id && (formField.fieldId._id === fieldId) && sectionIndexOk) {
        return formField;
      }
      else if (formField.fieldId === fieldId && sectionIndexOk) {
        return formField;
      }


    }
    var newField = {
      'fieldId': fieldId,
      'fieldValues': [],
      'sectionIndex': sectionIndex || 0
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

    if(formId){
      $fh.forms.log.d("FormId found for getForm: " + formId);
      new Form({
        'formId': formId,
        'rawMode': true
      }, cb);
    } else {
      $fh.forms.log.e("No form Id specified for getForm");
      return cb("No form Id specified for getForm");
    }
  };
  Submission.prototype.reloadForm = function(cb) {
    $fh.forms.log.d("Submission reload form");
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
  Submission.prototype.getFileInputValues = function(cb) {
    var self = this;
    self.getFileFieldsId(function(err, fileFieldIds){
      if(err){
        return cb(err);
      }
      return cb(null, self.getInputValueArray(fileFieldIds));
    });
  };


  /**
   * Submission.prototype.getFormFields - Get the form field input values
   *
   * @return {type}                   description
   */
  Submission.prototype.getFormFields = function(){
    return this.get("formFields", []);
  };

  /**
   * Submission.prototype.getFormFields - Set the form field input values
   *
   * @param  {boolean} includeNullValues flag on whether to include null values or not.
   * @return {type}                   description
   */
  Submission.prototype.setFormFields = function(values){
    return this.get("formFields", values);
  };

  Submission.prototype.getFileFieldsId = function(cb){
    var self = this;
    var formFieldIds = [];

    if(self.isDownloadSubmission()){
      //For Submission downloads, there needs to be a scan through the formFields param
      var formFields = self.getFormFields();

      for(var formFieldIndex = 0; formFieldIndex < formFields.length; formFieldIndex++){
        var formFieldEntry = formFields[formFieldIndex].fieldId || {};
        if(formFieldEntry.type === 'file' || formFieldEntry.type === 'photo'  || formFieldEntry.type === 'signature'){
          if(formFieldEntry._id){
            formFieldIds.push(formFieldEntry._id);
          }
        }
      }
      return cb(null, formFieldIds);
    } else {
      self.getForm(function(err, form){
        if(err){
          $fh.forms.log.e("Error getting form for getFileFieldsId" + err);
          return cb(err);
        }
        return cb(err, form.getFileFieldsId());
      });
    }
  };

  Submission.prototype.updateFileLocalURI = function(fileDetails, newLocalFileURI, cb){
    $fh.forms.log.d("updateFileLocalURI: " + newLocalFileURI);
    var self = this;
    fileDetails = fileDetails || {};

    if(fileDetails.fileName && newLocalFileURI){
      //Search for the file placeholder name.
      self.findFilePlaceholderFieldId(fileDetails.fileName, function(err, fieldDetails){
        if(err){
          return cb(err);
        }
        if(fieldDetails.fieldId){
          var tmpObj = self.getInputValueObjectById(fieldDetails.fieldId).fieldValues[fieldDetails.valueIndex];
          tmpObj.localURI = newLocalFileURI;
          self.getInputValueObjectById(fieldDetails.fieldId).fieldValues[fieldDetails.valueIndex] = tmpObj;
          self.saveLocal(cb);
        } else {
          $fh.forms.log.e("No file field matches the placeholder name " + fileDetails.fileName);
          return cb("No file field matches the placeholder name " + fileDetails.fileName);
        }
      });
    } else {
      $fh.forms.log.e("Submission: updateFileLocalURI : No fileName for submissionId : "+ JSON.stringify(fileDetails));
      return cb("Submission: updateFileLocalURI : No fileName for submissionId : "+ JSON.stringify(fileDetails));
    }
  };

  Submission.prototype.findFilePlaceholderFieldId = function(filePlaceholderName, cb){
    var self = this;
    var fieldDetails = {};
    self.getFileFieldsId(function(err, fieldIds){
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
      return cb(null, fieldDetails);
    });
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
        $fh.forms.log.e(err);
        return cb(err);
      }
      //remove from submission list
      appForm.models.submissions.removeSubmission(self.getLocalId(), function(err) {
        if (err) {
          $fh.forms.log.e(err);
          return cb(err);
        }
        self.clearLocalSubmissionFiles(function() {
          Model.prototype.clearLocal.call(self, function(err) {
            if (err) {
              $fh.forms.log.e(err);
              return cb(err);
            }
            cb(null, null);
          });
        });
      });
    });
  };
  Submission.prototype.getRemoteSubmissionId = function() {
    return this.get("submissionId") || this.get('_id');
  };
  Submission.prototype.setRemoteSubmissionId = function(submissionId){
    if(submissionId){
      this.set("submissionId", submissionId);
      this.set("_id", submissionId);
    }
  };

  /**
   * Removes field values for fields within the section and at given sectionIndex
   * @param sectionId
   * @param sectionIndex
   * @param callback
   */
  Submission.prototype.removeSection = function(sectionId, sectionIndex, callback) {
    var self = this;
    callback = callback || function() {};
    var removeError = null;

    async.waterfall([
      function(removeCallback) {
        self.getForm(removeCallback);
      },
      function(form, removeCallback) {
        var fieldsInSection = form.getFieldsInSection(sectionId);
        async.forEachSeries(
          fieldsInSection, function(fieldDef, eachCb) {
            self.removeFieldValue(fieldDef._id, null, sectionIndex, eachCb);
          }, function(err) {
            removeCallback(err);
          });
      },
      function(removeCallback) {
        self.pruneRemovedFields(removeCallback);
      }
    ], callback);
  };



  return module;
}(appForm.models || {});

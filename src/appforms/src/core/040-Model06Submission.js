appForm.models = (function(module) {

    module.submission = {
        newInstance: newInstance,
        fromLocal: fromLocal
    };

    //implmenetation
    var _submissions = {}; //cache in mem for single reference usage.
    var Model = appForm.models.Model;
    var statusMachine = {
        "new": ["draft", "pending"],
        "draft": ["pending", "draft"],
        "pending": ["inprogress"],
        "inprogress": ["submitted", "pending", "error", "inprogress"],
        "submitted": [],
        "error": []
    };

    function newInstance(form) {
        return new Submission(form);
    }

    function fromLocal(localId, cb) {
        if (_submissions[localId]) { //already loaded
            cb(null, _submissions[localId]);
        } else { //load from storage
            var obj = new Submission();
            obj.setLocalId(localId);
            obj.loadLocal(function(err, submission) {
                if (err) {
                    cb(err);
                } else {
                    submission.reloadForm(function(err, res) {
                        if (err) {
                            cb(err);
                        } else {
                            _submissions[localId]=submission;
                            cb(null, submission);
                        }
                    });
                }
            });
        }

    }

    function Submission(form) {
        Model.call(this, {
            "_type": "submission"
        });
        if (typeof form != "undefined" && form) {
            this.set("formName", form.get("name"));
            this.set("formId", form.get("_id"));

            this.set("deviceFormTimestamp", form.getLastUpdate());
            this.form = form;
            //TODO may contain whole form definition in props.
        }
        this.set("status", "new");
        this.set("createDate", new Date());
        this.set("appId", appForm.config.get("appId"));
        this.set("appEnvironment", appForm.config.get("env"));
        this.set("appCloudName", ""); //TODO check with eng
        this.set("comments", []);
        this.set("formFields", []);
        this.set("saveDate", null);
        this.set("submitDate", null);
        this.set("uploadStartDate", null);
        this.set("submittedDate", null);
        this.transactionMode = false;
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
        var targetStatus = "draft";
        var that=this;
        this.set("timezoneOffset", new Date().getTimezoneOffset());
        this.set("saveDate", new Date());
        this.changeStatus(targetStatus, function(err) {
            if (err) {
                return cb(err);
            } else {
                that.emit("savedraft");
                cb(null, null);
            }
        });


    }
    /**
     * submit current submission to remote
     * @param  {Function} cb [description]
     * @return {[type]}      [description]
     */
    Submission.prototype.submit = function(cb) {
        var targetStatus = "pending";
        var validateResult = true;
        var that = this;
        this.set("timezoneOffset", new Date().getTimezoneOffset());
        //TODO overall validate here

        if (validateResult === true) {
            that.set("submitDate", new Date());
            that.changeStatus(targetStatus, function(error) {
                if (error) {
                    cb(error);
                } else {

                    that.emit("submit");
                    cb(null, null);
                }
            });
        } else {
            return "This should not happen!!";
        }
    }

    Submission.prototype.getUploadTask = function(cb) {
        var taskId = this.getUploadTaskId();
        if (taskId) {
            appForm.models.uploadManager.getTaskById(taskId, cb);
        } else {
            cb(null, null);
        }
    }
    Submission.prototype.cancelUploadTask = function(cb) {
        var targetStatus = "submit";
        var that=this;
        appForm.models.uploadManager.cancelSubmission(this, function(err) {
            if (err) {
                console.error(err);
            }
            that.changeStatus(targetStatus,cb);
        });
    }
    Submission.prototype.getUploadTaskId = function() {
        return this.get("uploadTaskId");
    }
    Submission.prototype.setUploadTaskId = function(utId) {
        this.set("uploadTaskId", utId);
    }
    Submission.prototype.submitted = function(cb) {
        var targetStatus = "submitted";
        var that=this;
        this.set("submittedDate", new Date());
        this.changeStatus(targetStatus, function(err){
            if (err){
                cb(err);
            }else{
                that.emit("submitted");        
                cb(null,null);
            }
        });
        
        

    }
    //joint form id and submissions timestamp.
    Submission.prototype.genLocalId = function() {
        var lid = appForm.utils.localId(this);
        var formId = this.get("formId") || Math.ceil(Math.random() * 100000);
        this.setLocalId(formId + "_" + lid);
    }
    /**
     * change status and save the submission locally and register to submissions list.
     * @param {[type]} status [description]
     */
    Submission.prototype.changeStatus = function(status, cb) {
        if (this.isStatusValid(status)) {
            var that = this;
            this.set("status", status);

            this.saveLocal(function(err, res) {
                that.saveToList(function() {
                    cb(err, res);
                });
            });
        } else {
            throw ("Target status is not valid: " + status);
        }
    }
    Submission.prototype.upload = function(cb) {
        var targetStatus = "inprogress";
        var that = this;
        if (this.isStatusValid(targetStatus)) {
            this.set("status", targetStatus);
            this.set("uploadStartDate",new Date());
            appForm.models.submissions.updateSubmissionWithoutSaving(this);
            appForm.models.uploadManager.queueSubmission(this, function(err, ut) {
                if (err) {
                    cb(err);
                } else {
                    that.emit("inprogress",ut);
                    cb(null, ut);
                }
            });

        }
    }
    Submission.prototype.saveToList = function(cb) {
        appForm.models.submissions.saveSubmission(this, cb);
    }
    Submission.prototype.error = function(errorMsg, cb) {
        this.set("errorMessage", errorMsg);
        var targetStatus = "error";
        this.changeStatus(targetStatus, cb);
        this.emit("submitted", errorMsg);
    }
    Submission.prototype.getStatus = function() {
        return this.get("status");
    }
    /**
     * check if a target status is valid
     * @param  {[type]}  targetStatus [description]
     * @return {Boolean}              [description]
     */
    Submission.prototype.isStatusValid = function(targetStatus) {
        var status = this.get("status").toLowerCase();
        var nextStatus = statusMachine[status];
        if (nextStatus.indexOf(targetStatus) > -1) {
            return true;
        } else {
            return false;
        }
    }

    Submission.prototype.addComment = function(msg, user) {
        var now = new Date();
        var ts = now.getTime();
        var newComment = {
            "madeBy": typeof user == "undefined" ? "" : user.toString(),
            "madeOn": now,
            "value": msg,
            "timeStamp": ts
        };
        this.getComments().push(newComment);
        return ts;
    }
    Submission.prototype.getComments = function() {
        return this.get("comments");
    }
    Submission.prototype.removeComment = function(timeStamp) {
        var comments = this.getComments();
        for (var i = 0; i < comments.length; i++) {
            var comment = comments[i];
            if (comment.timeStamp == timeStamp) {
                comments.splice(i, 1);
                return;
            }
        }
    }
    /**
     * Add a value to submission.
     * This will cause the value been validated
     *
     * @param {[type]} fieldId    [description]
     * @param {[type]} inputValue [description]
     * @param {} cb(err,res) callback function when finished
     * @return true / error message
     */
    Submission.prototype.addInputValue = function(fieldId, inputValue, cb) {
        var that = this;
        this.getForm(function(err, form) {
            var fieldModel = form.getFieldModelById(fieldId);
            var validateRes = fieldModel.validate(inputValue);
            if (validateRes === true) {
                if (that.transactionMode) {
                    if (!that.tmpFields[fieldId]) {
                        that.tmpFields[fieldId] = [];
                    }
                    fieldModel.processInput(inputValue, function(err, result) {
                        if (err) {
                            cb(err);
                        } else {
                            if (result) {
                                that.tmpFields[fieldId].push(result);
                            }
                            cb(null, result);
                        }
                    });
                } else {
                    var target = that.getInputValueObjectById(fieldId);
                    fieldModel.processInput(inputValue, function(err, result) {
                        if (err) {
                            cb(err);
                        } else {
                            if (result) {
                                target.fieldValues.push(result);
                            }
                            cb(null, result);
                        }
                    });
                }
            } else {
                cb(validateRes);
            }
        });

    }
    Submission.prototype.getInputValueByFieldId = function(fieldId, cb) {
        var values = this.getInputValueObjectById(fieldId).fieldValues;
        this.getForm(function(err, form) {
            var fieldModel = form.getFieldModelById(fieldId);
            fieldModel.convertSubmission(values, cb);
        });

    }
    /**
     * Reset submission
     * @return {[type]} [description]
     */
    Submission.prototype.reset = function() {
        this.set("formFields", []);
    }
    Submission.prototype.startInputTransaction = function() {
        this.transactionMode = true;
        this.tmpFields = {};
    }
    Submission.prototype.endInputTransaction = function(succeed) {
        this.transactionMode = false;
        if (succeed) {
            var targetArr = this.get("formFields");
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
    }
    /**
     * remove an input value from submission
     * @param  {[type]} fieldId field id
     * @param  {[type]} index (optional) the position of the value will be removed if it is repeated field.
     * @return {[type]}         [description]
     */
    Submission.prototype.removeFieldValue = function(fieldId, index) {
        var targetArr = [];
        if (this.transactionMode) {
            targetArr = this.tmpFields["fieldId"];
        } else {
            targetArr = this.getInputValueObjectById(fieldId)["fieldId"];
        }
        if (typeof index == "undefined") {
            targetArr.splice(0, targetArr.length);
        } else {
            if (targetArr.length > index) {
                targetArr.splice(index, 1);
            }
        }

    }
    Submission.prototype.getInputValueObjectById = function(fieldId) {
        var formFields = this.get("formFields", []);
        for (var i = 0; i < formFields.length; i++) {
            var formField = formFields[i];
            if (formField.fieldId == fieldId) {
                return formField;
            }
        }
        var newField = {
            "fieldId": fieldId,
            "fieldValues": []
        }
        formFields.push(newField);
        return newField;
    }
    /**
     * get form model related to this submission.
     * @return {[type]} [description]
     */
    Submission.prototype.getForm = function(cb) {
        var Form = appForm.models.Form;
        var formId = this.get("formId");
        new Form({
            "formId": formId
        }, cb);

    }
    Submission.prototype.reloadForm = function(cb) {
        var Form = appForm.models.Form;
        var formId = this.get("formId");
        this.form = new Form({
            formId: formId
        }, cb);
    }
    /**
     * Retrieve all file fields related value
     * @return {[type]} [description]
     */
    Submission.prototype.getFileInputValues = function() {
        var rtn = [];
        var fileFieldIds = this.form.getFileFieldsId();
        for (var i = 0, fieldId; fieldId = fileFieldIds[i]; i++) {
            var inputValue = this.getInputValueObjectById(fieldId);
            var tmp;
            for (var j = 0, tmp; tmp = inputValue.fieldValues[j]; j++) {
                tmp.fieldId = fieldId;
                rtn.push(tmp);
            }
        }
        return rtn;
    }

    Submission.prototype.clearLocal = function(cb) {
        var self = this;
        Model.prototype.clearLocal.call(this, function(err) {
            if (err) {
                return cb(err);
            }
            //remove from submission list
            appForm.models.submissions.removeSubmission(self.getLocalId(), function(err) {
                if (err) {
                    return cb(err);
                }
                //remove from uploading list
                appForm.models.uploadManager.cancelSubmission(self, cb);
            });
        });
    }

    return module;
})(appForm.models || {});
/**
 * Uploading task for each submission
 */

appForm.models = (function(module) {
    module.uploadTask={
        "newInstance":newInstance,
        "fromLocal":fromLocal
    }
    var _uploadTasks={}; //mem cache for singleton.
    var Model = appForm.models.Model;
    function newInstance(submissionModel){
        var utObj=new UploadTask();
        utObj.init(submissionModel);
        _uploadTasks[utObj.getLocalId()]=utObj;
        return utObj;
    }

    function fromLocal(localId,cb){
        if (_uploadTasks[localId]){
            return cb(null,_uploadTasks[localId]);
        }
        var utObj=new UploadTask();
        utObj.setLocalId(localId);
        _uploadTasks[localId]=utObj;
        utObj.loadLocal(cb);
    }

    function UploadTask() {
        Model.call(this, {
            "_type": "uploadTask"
        });
    }
    appForm.utils.extend(UploadTask, Model);
    UploadTask.prototype.init = function(submissionModel) {
        var json = submissionModel.getProps();
        var files = submissionModel.getFileInputValues();
        var submissionLocalId = submissionModel.getLocalId();
        this.setLocalId(submissionLocalId + "_" + "uploadTask");
        this.set("submissionLocalId", submissionLocalId);
        this.set("jsonTask", json);
        this.set("fileTasks", []);
        this.set("currentTask", null);
        this.set("completed", false);
        this.set("formId", submissionModel.get("formId"));
        var files = submissionModel.getFileInputValues();
        for (var i = 0, file; file = files[i]; i++) {
            this.addFileTask(file);
        }

    }
    UploadTask.prototype.getTotalSize = function() {
        var jsonSize = JSON.stringify(this.get("jsonTask")).length;
        var fileTasks = this.get("fileTasks");
        var fileSize = 0;
        for (var i = 0, fileTask; fileTask = fileTasks[i]; i++) {
            fileSize += fileTask.fileSize;
        }
        return jsonSize + fileSize;
    }
    UploadTask.prototype.getUploadedSize = function() {
        var currentTask = this.getCurrentTask();
        if (currentTask === null) {
            return 0;
        } else {
            var jsonSize = JSON.stringify(this.get("jsonTask")).length;
            var fileTasks = this.get("fileTasks");
            var fileSize = 0;
            for (var i = 0, fileTask; (fileTask = fileTasks[i]) && (i<currentTask); i++) {
                fileSize += fileTask.fileSize;
            }
            return jsonSize+fileSize;
        }
    }
    UploadTask.prototype.getRemoteStore = function() {
        return appForm.stores.mBaaS;
    }
    UploadTask.prototype.addFileTask = function(fileDef) {
        this.get("fileTasks").push(fileDef);
    }
    /**
     * get current uploading task
     * @return {[type]} [description]
     */
    UploadTask.prototype.getCurrentTask = function() {
        return this.get("currentTask")
    }

    UploadTask.prototype.isStarted = function() {
        return this.get("currentTask", null) == null ? false : true;
    }
    /**
     * upload form submission
     * @param  {Function} cb [description]
     * @return {[type]}      [description]
     */
    UploadTask.prototype.uploadForm = function(cb) {
        var formSub = this.get("jsonTask");
        var that = this;
        var formSubmissionModel = new appForm.models.FormSubmission(formSub);
        this.getRemoteStore().create(formSubmissionModel, function(err, res) {
            if (err) {
                console.error(err);
                cb(err);
            } else {
                var submissionId = res.submissionId;
                var updatedFormDefinition = res.updatedFormDefinition;
                if (updatedFormDefinition) { // remote form definition is updated 
                    that.refreshForm(function() { //refresh related form definition
                        that.submissionModel(function(err, submission) {
                            if (submission) {
                                var err = "Form definition is out of date.";
                                that.completed(err);
                                cb(err);
                            }
                        });
                    });
                } else { // form data submitted successfully.
                    formSub.lastUpdate = new Date();
                    that.set("submissionId", submissionId);
                    that.set("currentTask", 0);
                    that.emit("progress", that.getProgress());
                    cb(null);
                }
            }

        });
    }
    UploadTask.prototype.uploadFile = function(cb) {
        if (this.get("fileTasks").length == 0) {
            this.completed();
            return cb(null, null);
        }
        var submissionId = this.get("submissionId");
        var that = this;
        if (submissionId) {
            var progress = this.get("currentTask");
            if (progress == null) {
                progress = 0;
            }
            var fileTask = this.get("fileTasks", [])[progress];
            if (!fileTask) {
                return cb("cannot find file task");
            }
            var fileSubmissionModel = new appForm.models.FileSubmission(fileTask);
            fileSubmissionModel.setSubmissionId(submissionId);

            fileSubmissionModel.loadFile(function(err) {
                if (err) {
                    cb(err);
                } else {
                    that.getRemoteStore().create(fileSubmissionModel, function(err, res) {
                        if (err) {
                            cb(err);
                        } else {
                            if (res.status == "ok") {
                                var curTask = that.get("currentTask");
                                fileTask.updateDate = new Date();

                                curTask++;
                                that.set("currentTask", curTask);
                                that.emit("progress", that.getProgress());
                                if (that.get("fileTasks").length <= curTask) {
                                    that.completed();
                                }
                                cb(null);
                            } else {
                                cb("File uploading failed.");
                            }
                        }
                    });
                }
            });
        } else {
            this.completed("Failed to upload file. Submission Id not found.");
            cb("Failed to upload file. Submission Id not found.");
        }
    }
    UploadTask.prototype.uploadTick = function(cb) {
        if (this.isCompleted()) {
            return cb(null, null);
        }
        var currentTask = this.get("currentTask", null);
        if (currentTask === null) { //not started yet
            // console.log("upload form data");
            this.uploadForm(cb);
        } else { //upload file
            // console.log("upload file data");
            this.uploadFile(cb);
        }
    }
    /**
     * the upload task is completed
     * @return {[type]} [description]
     */
    UploadTask.prototype.completed = function(err) {
        this.set("completed", true);
        if (err) {
            this.set("error", err);
        }
        this.submissionModel(function(_err,model){
            if (err){
                model.error(err,function(){});
            }else{
                model.submitted(function(){});    
            }
        });
    }
    UploadTask.prototype.isCompleted = function() {
        return this.get("completed", false);
    }
    UploadTask.prototype.getProgress = function() {
        var rtn = {
            "formJSON": false,
            "currentFileIndex": 0,
            "totalFiles": this.get("fileTasks").length,
            "totalSize":this.getTotalSize(),
            "uploaded":this.getUploadedSize()
        };
        var progress = this.get("currentTask");
        if (progress === null) {
            return rtn;
        } else {
            rtn.formJSON = true;
            rtn.currentFileIndex = progress;
        }
        return rtn;
    }

    /**
     * Refresh related form definition.
     * @param  {Function} cb [description]
     * @return {[type]}      [description]
     */
    UploadTask.prototype.refreshForm = function(cb) {
        var formId = this.get("formId");
        new appForm.models.Form({
            "formId": formId
        }, function(err, form) {
            if (err) {
                console.error(err);
            }
            form.refresh(true, function(err) {
                if (err) {
                    console.error(err);
                }
                cb();
            });
        });
    }

    UploadTask.prototype.submissionModel = function(cb) {
        appForm.models.submission.fromLocal(this.get("submissionLocalId"), function(err, submission) {
            if (err) {
                console.error(err);
            }
            cb(err, submission);
        });
    }
    return module;
})(appForm.models || {});
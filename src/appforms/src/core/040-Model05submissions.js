appForm.models = (function(module) {
    var Model = appForm.models.Model;


    function Submissions() {
        Model.call(this, {
            "_type": "submissions",
            "_ludid": "submissions_list",
            "submissions": []
        });
    }
    appForm.utils.extend(Submissions, Model);

    Submissions.prototype.setLocalId = function() {
        throw ("It is not allowed to set local id programmly for submissions model.");
    }
    /**
     * save a submission to list and store it immediately
     * @param  {[type]}   submission [description]
     * @param  {Function} cb         [description]
     * @return {[type]}              [description]
     */
    Submissions.prototype.saveSubmission = function(submission, cb) {
        this.updateSubmissionWithoutSaving(submission);
        this.saveLocal(cb);
    }
    Submissions.prototype.updateSubmissionWithoutSaving = function(submission) {
        var pruneData = this.pruneSubmission(submission);
        var localId = pruneData['_ludid'];
        if (localId) {
            var meta = this.findMetaByLocalId(localId);
            var submissions = this.get("submissions");
            if (meta) { //existed, remove the old meta and save the new one.
                submissions.splice(submissions.indexOf(meta), 1);
                submissions.push(pruneData);
            } else { // not existed, insert to the tail.
                submissions.push(pruneData);
            }
            
        } else { // invalid local id.
            console.error("Invalid submission:" + JSON.stringify(submission));
        }
    }
    Submissions.prototype.findByFormId = function(formId) {
        var rtn = [];
        var submissions = this.get("submissions");
        for (var i = 0; i < submissions.length; i++) {
            var obj = submissions[i];
            if (submissions[i]['formId'] == formId) {
                rtn.push(obj);
            }
        }
        return rtn;
    }
    Submissions.prototype.getSubmissions = function() {
        return this.get("submissions");
    }
    Submissions.prototype.getSubmissionMetaList = Submissions.prototype.getSubmissions; //function alias
    Submissions.prototype.findMetaByLocalId = function(localId) {
        var submissions = this.get("submissions");
        for (var i = 0; i < submissions.length; i++) {
            var obj = submissions[i];
            if (submissions[i]['_ludid'] == localId) {
                return obj;
            }
        }
        return null;
    }
    Submissions.prototype.pruneSubmission = function(submission) {
        var fields = ["_id", "_ludid", "status", "formName", "formId", "_localLastUpdate", "createDate", "submitDate", "deviceFormTimestamp"];
        var data = submission.getProps();

        var rtn = {};
        for (var i = 0; i < fields.length; i++) {
            var key = fields[i];
            rtn[key] = data[key];
        }
        return rtn;
    }
    /**
     * Validate current submission before submit
     * 1. Input Value
     * 2. Field
     * 3. Rules
     * @return {[type]} [description]
     */
    Submissions.prototype.validateBeforeSubmission = function() {
        //TODO add validation
        return true;
    }
    Submissions.prototype.clear = function(cb) {
        var that = this;
        this.clearLocal(function(err) {
            if (err) {
                console.error(err);
                cb(err);
            } else {
                that.set("submissions", []);
                cb(null, null);
            }
        });
    }
    Submissions.prototype.getDrafts = function() {
        return this.findByStatus("draft");
    }
    Submissions.prototype.getPending = function() {
        return this.findByStatus("pending");
    }
    Submissions.prototype.getSubmitted = function() {
        return this.findByStatus("submitted");
    }
    Submissions.prototype.getError = function() {
        return this.findByStatus("error");
    }
    Submissions.prototype.getInProgress = function() {
        return this.findByStatus("inprogress");
    }
    Submissions.prototype.findByStatus = function(status) {
        var submissions = this.get("submissions");
        var rtn = [];
        for (var i = 0; i < submissions.length; i++) {
            if (submissions[i].status == status) {
                rtn.push(submissions[i]);
            }
        }
        return rtn;
    }
    /**
     * return a submission model object by the meta data passed in.
     * @param  {[type]}   meta [description]
     * @param  {Function} cb   [description]
     * @return {[type]}        [description]
     */
    Submissions.prototype.getSubmissionByMeta = function(meta, cb) {
        var localId = meta["_ludid"];
        if (localId) {
            appForm.models.submission.fromLocal(localId, cb);
        } else {
            throw ("local id not found for retrieving submission.")
        }
    }

    Submissions.prototype.removeSubmission = function(localId, cb) {
        var index = this.indexOf(localId);
        if (index > -1) {
            this.get("submissions").splice(index, 1);
        }
        this.saveLocal(cb);
    }
    Submissions.prototype.indexOf = function(localId, cb) {
        var submissions = this.get("submissions");
        for (var i = 0; i < submissions.length; i++) {
            var obj = submissions[i];
            if (submissions[i]['_ludid'] == localId) {
                return i;
            }
        }
        return -1;
    }
    module.submissions = new Submissions();

    return module;
})(appForm.models || {});
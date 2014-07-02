appForm.models = function(module) {
    var Model = appForm.models.Model;

    function Submissions() {
        Model.call(this, {
            '_type': 'submissions',
            '_ludid': 'submissions_list',
            'submissions': []
        });
    }
    appForm.utils.extend(Submissions, Model);
    Submissions.prototype.setLocalId = function() {
        $fh.forms.log.e("Submissions setLocalId. Not Permitted for submissions.");
    };
    /**
     * save a submission to list and store it immediately
     * @param  {[type]}   submission [description]
     * @param  {Function} cb         [description]
     * @return {[type]}              [description]
     */
    Submissions.prototype.saveSubmission = function(submission, cb) {
        $fh.forms.log.d("Submissions saveSubmission");
        var self = this;
        this.updateSubmissionWithoutSaving(submission);
        this.clearSentSubmission(function() {
            self.saveLocal(cb);
        });
    };
    Submissions.prototype.updateSubmissionWithoutSaving = function(submission) {
        $fh.forms.log.d("Submissions updateSubmissionWithoutSaving");
        var pruneData = this.pruneSubmission(submission);
        var localId = pruneData._ludid;
        if (localId) {
            var meta = this.findMetaByLocalId(localId);
            var submissions = this.get('submissions');
            if (meta) {
                //existed, remove the old meta and save the new one.
                submissions.splice(submissions.indexOf(meta), 1);
                submissions.push(pruneData);
            } else {
                // not existed, insert to the tail.
                submissions.push(pruneData);
            }
        } else {
            // invalid local id.
            $fh.forms.log.e('Invalid submission for localId:', localId, JSON.stringify(submission));
        }
    };
    Submissions.prototype.clearSentSubmission = function(cb) {
        $fh.forms.log.d("Submissions clearSentSubmission");
        var self = this;
        var maxSent = $fh.forms.config.get("max_sent_saved") ? $fh.forms.config.get("max_sent_saved") : $fh.forms.config.get("sent_save_min");
        var submissions = this.get("submissions");
        var sentSubmissions = this.getSubmitted();


        if (sentSubmissions.length > maxSent) {
            $fh.forms.log.d("Submissions clearSentSubmission pruning sentSubmissions.length>maxSent");
            sentSubmissions = sentSubmissions.sort(function(a, b) {
                if (Date(a.submittedDate) < Date(b.submittedDate)) {
                    return 1;
                } else {
                    return -1;
                }
            });
            var toBeRemoved = [];
            while (sentSubmissions.length > maxSent) {
                toBeRemoved.push(sentSubmissions.pop());
            }
            var count = toBeRemoved.length;
            for (var i = 0; i < toBeRemoved.length; i++) {
                var subMeta = toBeRemoved[i];
                self.getSubmissionByMeta(subMeta, function(err, submission) {
                    submission.clearLocal(function(err) {
                        if (err) {
                            $fh.forms.log.e("Submissions clearSentSubmission submission clearLocal", err);
                        }
                        count--;
                        if (count === 0) {
                            cb(null, null);
                        }
                    });
                });
            }
        } else {
            cb(null, null);
        }
    };
    Submissions.prototype.findByFormId = function(formId) {
        $fh.forms.log.d("Submissions findByFormId", formId);
        var rtn = [];
        var submissions = this.get('submissions');
        for (var i = 0; i < submissions.length; i++) {
            var obj = submissions[i];
            if (submissions[i].formId === formId) {
                rtn.push(obj);
            }
        }
        return rtn;
    };
    Submissions.prototype.getSubmissions = function() {
        return this.get('submissions');
    };
    Submissions.prototype.getSubmissionMetaList = Submissions.prototype.getSubmissions;
    //function alias
    Submissions.prototype.findMetaByLocalId = function(localId) {
        $fh.forms.log.d("Submissions findMetaByLocalId", localId);
        var submissions = this.get('submissions');
        for (var i = 0; i < submissions.length; i++) {
            var obj = submissions[i];
            if (submissions[i]._ludid === localId) {
                return obj;
            }
        }

        //$fh.forms.log.e("Submissions findMetaByLocalId: No submissions for localId: ", localId);
        return null;
    };

    /**
     * Finding a submission object by it's remote Id
     * @param remoteId
     * @returns {*}
     */
    Submissions.prototype.findMetaByRemoteId = function(remoteId) {
        remoteId = remoteId || "";

        $fh.forms.log.d("Submissions findMetaByRemoteId: " + remoteId);
        var submissions = this.get('submissions');
        for (var i = 0; i < submissions.length; i++) {
            var obj = submissions[i];
            if (submissions[i].submissionId) {
                if (submissions[i].submissionId === remoteId) {
                    return obj;
                }
            }
        }

        return null;
    };
    Submissions.prototype.pruneSubmission = function(submission) {
        $fh.forms.log.d("Submissions pruneSubmission");
        var fields = [
            '_id',
            '_ludid',
            'status',
            'formName',
            'formId',
            '_localLastUpdate',
            'createDate',
            'submitDate',
            'deviceFormTimestamp',
            'errorMessage',
            'submissionStartedTimestamp',
            'submittedDate',
            'submissionId',
            'saveDate',
            'uploadStartDate'
        ];
        var data = submission.getProps();
        var rtn = {};
        for (var i = 0; i < fields.length; i++) {
            var key = fields[i];
            rtn[key] = data[key];
        }
        return rtn;
    };

    Submissions.prototype.clear = function(cb) {
        $fh.forms.log.d("Submissions clear");
        var that = this;
        this.clearLocal(function(err) {
            if (err) {
                $fh.forms.log.e(err);
                cb(err);
            } else {
                that.set("submissions", []);
                cb(null, null);
            }
        });
    };
    Submissions.prototype.getDrafts = function(params) {
        $fh.forms.log.d("Submissions getDrafts: ", params);
        if (!params) {
            params = {};
        }
        params.status = "draft";
        return this.findByStatus(params);
    };
    Submissions.prototype.getPending = function(params) {
        $fh.forms.log.d("Submissions getPending: ", params);
        if (!params) {
            params = {};
        }
        params.status = "pending";
        return this.findByStatus(params);
    };
    Submissions.prototype.getSubmitted = function(params) {
        $fh.forms.log.d("Submissions getSubmitted: ", params);
        if (!params) {
            params = {};
        }
        params.status = "submitted";
        return this.findByStatus(params);
    };
    Submissions.prototype.getError = function(params) {
        $fh.forms.log.d("Submissions getError: ", params);
        if (!params) {
            params = {};
        }
        params.status = "error";
        return this.findByStatus(params);
    };
    Submissions.prototype.getInProgress = function(params) {
        $fh.forms.log.d("Submissions getInProgress: ", params);
        if (!params) {
            params = {};
        }
        params.status = "inprogress";
        return this.findByStatus(params);
    };
    Submissions.prototype.getDownloaded = function(params) {
        $fh.forms.log.d("Submissions getDownloaded: ", params);
        if (!params) {
            params = {};
        }
        params.status = "downloaded";
        return this.findByStatus(params);
    };
    Submissions.prototype.findByStatus = function(params) {
        $fh.forms.log.d("Submissions findByStatus: ", params);
        if (!params) {
            params = {};
        }
        if (typeof params === "string") {
            params = {
                status: params
            };
        }
        if (params.status === null) {
            return [];
        }

        var status = params.status;
        var formId = params.formId;
        var sortField = params.sortField || "createDate";

        var submissions = this.get("submissions", []);
        var rtn = [];
        for (var i = 0; i < submissions.length; i++) {
            if (status.indexOf(submissions[i].status) > -1) {
                if (formId != null) {
                    if (submissions[i].formId === formId) {
                        rtn.push(submissions[i]);
                    }
                } else {
                    rtn.push(submissions[i]);
                }

            }
        }

        rtn = rtn.sort(function(a, b) {
            if (Date(a[sortField]) < Date(b[sortField])) {
                return -1;
            } else {
                return 1;
            }
        });

        return rtn;
    };
    /**
     * return a submission model object by the meta data passed in.
     * @param  {[type]}   meta [description]
     * @param  {Function} cb   [description]
     * @return {[type]}        [description]
     */
    Submissions.prototype.getSubmissionByMeta = function(meta, cb) {
        $fh.forms.log.d("Submissions getSubmissionByMeta: ", meta);
        var localId = meta._ludid;
        if (localId) {
            appForm.models.submission.fromLocal(localId, cb);
        } else {
            $fh.forms.log.e("Submissions getSubmissionByMeta: local id not found for retrieving submission.", localId, meta);
            cb("local id not found for retrieving submission");
        }
    };
    Submissions.prototype.removeSubmission = function(localId, cb) {
        $fh.forms.log.d("Submissions removeSubmission: ", localId);
        var index = this.indexOf(localId);
        if (index > -1) {
            this.get('submissions').splice(index, 1);
        }
        this.saveLocal(cb);
    };
    Submissions.prototype.indexOf = function(localId, cb) {
        $fh.forms.log.d("Submissions indexOf: ", localId);
        var submissions = this.get('submissions');
        for (var i = 0; i < submissions.length; i++) {
            var obj = submissions[i];
            if (submissions[i]._ludid === localId) {
                return i;
            }
        }
        return -1;
    };
    module.submissions = new Submissions();
    return module;
}(appForm.models || {});
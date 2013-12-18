/**
 * FeedHenry License
 */
appForm.api = (function(module) {
    module.getForms=getForms;
    module.getForm=getForm;
    module.getTheme=getTheme;
//    module.saveDraft=saveDraft;
    module.submitForm=submitForm;
//    module.getPending=getPending;
    module.getSubmissions=getSubmissions;
//    module.getSubmissionData=getSubmissionData;
//    module.getFailed=getFailed;
//    module.getDrafts=getDrafts;
    module.init=appForm.init;
    module.config=appForm.models.config;
    

    var _submissions = null;

    /**
     * Retrieve forms model. It contains forms list. check forms model usage
     * @param  {[type]}   params {fromRemote:boolean}
     * @param  {Function} cb    (err, formsModel)
     * @return {[type]}          [description]
     */
    function getForms(params, cb) {
      var fromRemote = params.fromRemote;
      if (fromRemote == undefined) {
        fromRemote = false;
      }
      appForm.models.forms.refresh(fromRemote, cb);
    }

    /**
     * Retrieve form model with specified form id.
     * @param  {[type]}   params {formId: string, fromRemote:boolean}
     * @param  {Function} cb     (err, formModel)
     * @return {[type]}          [description]
     */
    function getForm(params, cb) {
        new appForm.models.Form(params, cb);
    }

    /**
     * Find a theme definition for this app.
     * @param params {fromRemote:boolean(false)}
     * @param {Function} cb {err, themeData} . themeData = {"json" : {<theme json definition>}, "css" : "css" : "<css style definition for this app>"}
     */
    function getTheme(params,cb){
      var theme = appForm.models.theme;

      if(!params.fromRemote){
        params.fromRemote = false;
      }

      theme.refresh(params.fromRemote, function(err, updatedTheme){
        if(err) return cb(err);

        if(updatedTheme === null){
          return cb(new Error("No theme defined for this app"));
        }

        if(params.css === true){
          return cb(null, theme.getCSS());
        } else {
          return cb(null, theme);
        }
      });
    }

  /**
   * Get submissions that are in draft mode. I.e. saved but not submitted
   * @param params {}
   * @param {Function} cb     (err, draftsArray)
   */
//    function getDrafts(params, cb){
//      //Only getting draft details -- not draft data
//      var submissions = appForm.models.submissions;
//      var drafts = submissions.getDrafts();
//      var returnDrafts = [];
//      if(drafts){
//        drafts.forEach(function(draft){
//          draft.localSubmissionId = draft._ludid;
//          returnDrafts.push(draft);
//        });
//      }
//      return cb(null, returnDrafts);
//    }

    /**
     * Get submissions that are pending. I.e. submitted but not complete.
     * Pending can be either "pending" or "inprogress"
     * @param params {}
     * @param {Function} cb     (err, pendingArray)
     */
//    function getPending(params, cb){
//      var submissions = appForm.models.submissions;
//
//      var pending = submissions.getPending();
//      var inProgress = submissions.getInProgress();
//      var returnPending = [];
//
//      if(pending){
//        pending.forEach(function(pendingSubmission){
//          pendingSubmission.localSubmissionId = pendingSubmission._ludid;
//          pendingSubmission.dateSubmissionStarted = new Date(pendingSubmission.submissionStartedTimestamp);
//          returnPending.push(pendingSubmission);
//        });
//      }
//
//      if(inProgress){
//        inProgress.forEach(function())
//      }
//
//      return cb(null, returnPending);
//    }

    /**
     * Get submissions that are submitted. I.e. submitted and complete.
     * @param params {}
     * @param {Function} cb     (err, submittedArray)
     */
    function getSubmissions(params, cb){
      //Getting submissions that have been completed.
      var submissions = appForm.models.submissions;

      if (_submissions==null){
        appForm.models.submissions.loadLocal(function(err){
          if (err){
            console.error(err);
            cb(err);
          }else{
            _submissions=appForm.models.submissions;
            cb(null,_submissions);
          }
        });
      }else{
        setTimeout(function(){
          cb(null,_submissions);
        },0);
      }
    }

      /**
      * Get submission object from that are submitted. I.e. submitted and complete.
      * @param params {localSubmissionId : <localIdOfSubmission>}
      * @param {Function} cb     (err, submittedArray)
      */
//      function getSubmissionData(params, cb){
//        if(!params || !params.localSubmissionId){
//         return cb(new Error("Invalid params to getSubmissionData: localSubmission must be a parameter"));
//        }
//
//        var submission = appForm.models.submission;
//
//        submission.fromLocal(params.localSubmissionId, cb);
//      }

    /**
     * Get submissions that have failed. I.e. submitted and and error occurred.
     * @param params {}
     * @param {Function} cb     (err, failedArray)
     */
//    function getFailed(params, cb){
//      var submissions = appForm.models.submissions;
//
//      var failedSubmissions = submissions.getError();
//      var returnFailedSubmissions = [];
//
//      if(failedSubmissions){
//        failedSubmissions.forEach(function(failedSubmission){
//          failedSubmission.localSubmissionId = failedSubmission._ludid;
//          failedSubmission.dateSubmissionStarted = new Date(failedSubmission.submissionStartedTimestamp);
//          returnFailedSubmissions.push(failedSubmission);
//        });
//      }
//
//      return cb(null, returnFailedSubmissions);
//    }

    function submitForm(submission, cb){

      if(submission){
        submission.submit(function(err){
          if(err) return cb(err);

          //Submission finished and validated. Now upload the form
          submission.upload(cb);
        });
      } else {
        return cb("Invalid submission object.");
      }
    }

//    function saveDraft(submission, cb){
//      if(submission.get("_type") !== "submission"){
//        return cb(new Error("Expected submission parameter to be of type Submission"));
//      }
//
//      submission.saveDraft(cb);
//    }
    

    return module;
})(appForm.api || {});
//mockup $fh apis for Addons.
if (typeof $fh == "undefined"){
    $fh={};
}
if ($fh.forms==undefined){
    $fh.forms=appForm.api;
}


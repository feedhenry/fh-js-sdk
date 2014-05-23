/**
 * FeedHenry License
 */
appForm.api = function (module) {
  module.getForms = getForms;
  module.getForm = getForm;
  module.getTheme = getTheme;
  module.submitForm = submitForm;
  module.getSubmissions = getSubmissions;
  module.downloadSubmission = downloadSubmission;
  module.init = appForm.init;
  module.log=appForm.models.log;
  var _submissions = null;
  var formConfig = appForm.models.config;
  var defaultFunction = function(err){
    err = err ? err : "";
    $fh.forms.log.w("Default Function Called " + err);
  };

  /**
   * Get and set config values. Can only set a config value if you are an config_admin_user
   */
  var configInterface = {
    "editAllowed" : function(){
      var defaultConfigValues = formConfig.get("defaultConfigValues", {});
      return defaultConfigValues["config_admin_user"] === true;
    },
    "get" : function(key){
      var self = this;
      if(key){
        var userConfigValues = formConfig.get("userConfigValues", {});
        var defaultConfigValues = formConfig.get("defaultConfigValues", {});


        if(userConfigValues[key]){
          return userConfigValues[key];
        } else {
          return defaultConfigValues[key];
        }

      }
    },
    "getDeviceId": function(){
      return formConfig.get("deviceId", "Not Set");
    },
    "set" : function(key, val){
      var self = this;
      if(!key || !val){
        return;
      }

      if(self.editAllowed() || key === "max_sent_saved"){
        var userConfig = formConfig.get("userConfigValues", {});
        userConfig[key] = val;
        formConfig.set("userConfigValues", userConfig);
      }

    },
    "getConfig" : function(){
      var self = this;
      var defaultValues = formConfig.get("defaultConfigValues", {});
      var userConfigValues = formConfig.get("userConfigValues", {});
      var returnObj = {};

      if(self.editAllowed()){
        for(var defKey in defaultValues){
          if(userConfigValues[defKey]){
            returnObj[defKey] = userConfigValues[defKey];
          } else {
            returnObj[defKey] = defaultValues[defKey];
          }
        }
        return returnObj;
      } else {
        return defaultValues;
      }
    },
    "saveConfig": function(cb){
      var self = this;
      formConfig.saveLocal(function(err, configModel){
        if(err){
          $fh.forms.log.e("Error saving a form config: ", err);
        }else{
          $fh.forms.log.l("Form config saved sucessfully.");
        }

        if(typeof(cb) ==='function'){
          cb();
        }
      });
    },
    "offline": function(){
      formConfig.setOffline();
    },
    "online": function(){
      formConfig.setOnline();
    },
    "mbaasOnline": function(cb){
      if(typeof(cb) === "function"){
        formConfig.on('online', cb);
      }
    },
    "mbaasOffline": function(cb){
      if(typeof(cb) === "function"){
        formConfig.on('offline', cb);
      }
    },
    "isOnline": function(){
      return formConfig.isOnline();
    },
    "isStudioMode": function(){
      return formConfig.isStudioMode();
    }
  };

  module.config = configInterface;


  /**
     * Retrieve forms model. It contains forms list. check forms model usage
     * @param  {[type]}   params {fromRemote:boolean}
     * @param  {Function} cb    (err, formsModel)
     * @return {[type]}          [description]
     */
  function getForms(params, cb) {
    if(typeof(params) === 'function'){
      cb = params;
      params = {};
    }

    params = params ? params : {};
    cb = cb ? cb : defaultFunction;
    var fromRemote = params.fromRemote;
    if (fromRemote === undefined) {
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
    if(typeof(params) === 'function'){
      cb = params;
      params = {};
    }

    params = params ? params : {};
    cb = cb ? cb : defaultFunction;
    new appForm.models.Form(params, cb);
  }
  /**
     * Find a theme definition for this app.
     * @param params {fromRemote:boolean(false)}
     * @param {Function} cb {err, themeData} . themeData = {"json" : {<theme json definition>}, "css" : "css" : "<css style definition for this app>"}
     */
  function getTheme(params, cb) {
    if(typeof(params) === 'function'){
      cb = params;
      params = {};
    }

    params = params ? params : {};
    cb = cb ? cb : defaultFunction;
    var theme = appForm.models.theme;
    if (!params.fromRemote) {
      params.fromRemote = false;
    }
    theme.refresh(params.fromRemote, function (err, updatedTheme) {
      if (err) {
        return cb(err);
      }
      if (updatedTheme === null) {
        return cb(new Error('No theme defined for this app'));
      }
      if (params.css === true) {
        return cb(null, theme.getCSS());
      } else {
        return cb(null, theme);
      }
    });
  }
  /**
     * Get submissions that are submitted. I.e. submitted and complete.
     * @param params {}
     * @param {Function} cb     (err, submittedArray)
     */
  function getSubmissions(params, cb) {
    if(typeof(params) === 'function'){
      cb = params;
      params = {};
    }

    params = params ? params : {};
    cb = cb ? cb : defaultFunction;

    //Getting submissions that have been completed.
    var submissions = appForm.models.submissions;
    if (_submissions === null) {
      appForm.models.submissions.loadLocal(function (err) {
        if (err) {
          $fh.forms.log.e(err);
          cb(err);
        } else {
          _submissions = appForm.models.submissions;
          cb(null, _submissions);
        }
      });
    } else {
      cb(null, _submissions);
    }
  }
  function submitForm(submission, cb) {
    if (submission) {
      submission.submit(function (err) {
        if (err){
          return cb(err);
        }

        //Submission finished and validated. Now upload the form
        submission.upload(cb);
      });
    } else {
      return cb('Invalid submission object.');
    }
  }

  /*
  * Function for downloading a submission stored on the remote server.
  *
  * @param params {}
  * @param {function} cb (err, downloadTask)
  * */
  function downloadSubmission(params, cb){
    params = params ? params : {};
    cb = cb ? cb : defaultFunction;

    $fh.forms.log.d("downloadSubmission called", params);

    if(params.submissionId){
      $fh.forms.log.d("downloadSubmission SubmissionId exists" + params.submissionId);
      var submissionAlreadySaved = appForm.models.submissions.findMetaByRemoteId(params.submissionId);

      if(submissionAlreadySaved === null){

        $fh.forms.log.d("downloadSubmission submission does not exist, downloading", params);
        var submissionToDownload = new appForm.models.submission.newInstance(null, {submissionId: params.submissionId});

        submissionToDownload.on('error', function(err){
          $fh.forms.log.e("Error downloading submission with id " + params.submissionId);
          return cb(err);
        });

        submissionToDownload.on('downloaded', function(){
          $fh.forms.log.l("Download of submission with id " + params.submissionId + " completed successfully");
          return cb(null, submissionToDownload);
        });

        submissionToDownload.download(function(err){
          if(err){
            $fh.forms.log.e("Error queueing submission for download " + err);
            return cb(err);
          }
        });
      } else {
        $fh.forms.log.d("downloadSubmission submission exists", params);

        //Submission was created, but not finished downloading
        if(submissionAlreadySaved.status !== "downloaded"){
          appForm.models.submissions.getSubmissionByMeta(submissionAlreadySaved, function(err, submission){
            if(err){
              return cb(err);
            }
            submission.on('error', function(err){
              $fh.forms.log.e("Error downloading submission with id " + params.submissionId);
              return cb(err);
            });

            submission.on('downloaded', function(){
              $fh.forms.log.l("Download of submission with id " + params.submissionId + " completed successfully after");
              return cb(null, submission);
            });

          });
        } else {
          appForm.models.submissions.getSubmissionByMeta(submissionAlreadySaved, cb);
        }

      }
    } else {
      $fh.forms.log.e("No submissionId passed to download a submission");
      return cb("No submissionId passed to download a submission");
    }
  }
  return module;
}(appForm.api || {});
//mockup $fh apis for Addons.
if (typeof $fh === 'undefined') {
  $fh = {};
}
if ($fh.forms === undefined) {
  $fh.forms = appForm.api;
}
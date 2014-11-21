var model = require("./forms/model");
var formConfig = require("./forms/config");
var forms = require("./forms/forms");
var Form = require("./forms/form");
var theme = require("./forms/theme");
var submissions = require("./forms/submissions");
var submission = require("./forms/submission");
var log = require("./forms/log");
var init = require("./forms/init");

var _submissions = null;
var waitOnSubmission = {};
var defaultFunction = function(err) {
    err = err ? err : "";
    log.w("Default Function Called " + err);
};

/**
 * Get and set config values. Can only set a config value if you are an config_admin_user
 */
var configInterface = {
    editAllowed: function() {
        var defaultConfigValues = formConfig.get("defaultConfigValues", {});
        return defaultConfigValues["config_admin_user"] === true;
    },
    "get": function(key) {
        var self = this;
        if (key) {
            var userConfigValues = formConfig.get("userConfigValues", {});
            var defaultConfigValues = formConfig.get("defaultConfigValues", {});


            if (userConfigValues[key]) {
                return userConfigValues[key];
            } else {
                return defaultConfigValues[key];
            }

        }
    },
    "getDeviceId": function() {
        return formConfig.get("deviceId", "Not Set");
    },
    "set": function(key, val) {
        var self = this;
        if (typeof(key) !== "string" || typeof(val) === "undefined" || val === null) {
            return;
        }

        if (self.editAllowed() || key === "max_sent_saved") {
            var userConfig = formConfig.get("userConfigValues", {});
            userConfig[key] = val;
            formConfig.set("userConfigValues", userConfig);
        }

    },
    "getConfig": function() {
        var self = this;
        var defaultValues = formConfig.get("defaultConfigValues", {});
        var userConfigValues = formConfig.get("userConfigValues", {});
        var returnObj = {};

        if (self.editAllowed()) {
            for (var defKey in defaultValues) {
                if (userConfigValues[defKey]) {
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
    "saveConfig": function(cb) {
        var self = this;
        formConfig.saveLocal(function(err, configModel) {
            if (err) {
                log.e("Error saving a form config: ", err);
            } else {
                log.l("Form config saved sucessfully.");
            }

            if (typeof(cb) === 'function') {
                cb();
            }
        });
    },
    "offline": function() {
        formConfig.setOffline();
    },
    "online": function() {
        formConfig.setOnline();
    },
    "mbaasOnline": function(cb) {
        if (typeof(cb) === "function") {
            formConfig.on('online', cb);
        }
    },
    "mbaasOffline": function(cb) {
        if (typeof(cb) === "function") {
            formConfig.on('offline', cb);
        }
    },
    "isOnline": function() {
        return formConfig.isOnline();
    },
    "isStudioMode": function() {
        return formConfig.isStudioMode();
    },
    refresh: function(cb) {
        formConfig.refresh(true, cb);
    }
};


/**
 * Retrieve forms model. It contains forms list. check forms model usage
 * @param  {[type]}   params {fromRemote:boolean}
 * @param  {Function} cb    (err, formsModel)
 * @return {[type]}          [description]
 */
var getForms = function(params, cb) {
    if (typeof(params) === 'function') {
        cb = params;
        params = {};
    }

    params = params ? params : {};
    cb = cb ? cb : defaultFunction;
    var fromRemote = params.fromRemote;
    if (fromRemote === undefined) {
        fromRemote = false;
    }
    forms.refresh(fromRemote, cb);
};
/**
 * Retrieve form model with specified form id.
 * @param  {[type]}   params {formId: string, fromRemote:boolean}
 * @param  {Function} cb     (err, formModel)
 * @return {[type]}          [description]
 */
var getForm = function(params, cb) {
    if (typeof(params) === 'function') {
        cb = params;
        params = {};
    }

    params = params ? params : {};
    cb = cb ? cb : defaultFunction;
    Form(params, cb);
};

/**
 * Find a theme definition for this app.
 * @param params {fromRemote:boolean(false)}
 * @param {Function} cb {err, themeData} . themeData = {"json" : {<theme json definition>}, "css" : "css" : "<css style definition for this app>"}
 */
var getTheme = function(params, cb) {
    if (typeof(params) === 'function') {
        cb = params;
        params = {};
    }

    params = params ? params : {};
    cb = cb ? cb : defaultFunction;
    if (!params.fromRemote) {
        params.fromRemote = false;
    }
    theme.refresh(params.fromRemote, function(err, updatedTheme) {
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
};

/**
 * Get submissions that are submitted. I.e. submitted and complete.
 * @param params {}
 * @param {Function} cb     (err, submittedArray)
 */
var getSubmissions = function(params, cb) {
    if (typeof(params) === 'function') {
        cb = params;
        params = {};
    }

    params = params ? params : {};
    cb = cb ? cb : defaultFunction;

    //Getting submissions that have been completed.
    submissions.loadLocal(function(err) {
        if (err) {
            log.e(err);
            cb(err);
        } else {
            cb(null, _submissions);
        }
    });
};

var submitForm = function(submission, cb) {
    if (submission) {
        submission.submit(function(err) {
            if (err) {
                return cb(err);
            }

            //Submission finished and validated. Now upload the form
            submission.upload(cb);
        });
    } else {
        return cb('Invalid submission object.');
    }
};

/*
 * Function for downloading a submission stored on the remote server.
 *
 * @param params {}
 * @param {function} cb (err, downloadTask)
 * */
var downloadSubmission = function(params, cb) {
    params = params ? params : {};
    //cb = cb ? cb : defaultFunction;
    var submissionToDownload = null;

    if (typeof(cb) !== 'function') {
        return null;
    }

    function finishSubmissionDownload(err) {
        err = typeof(err) === "string" && err.length === 24 ? null : err;
        log.d("finishSubmissionDownload ", err, submissionToDownload);
        var subCBId = submissionToDownload.getRemoteSubmissionId();
        var subsCbsWatiting = waitOnSubmission[subCBId];
        if (subsCbsWatiting) {
            var subCB = subsCbsWatiting.pop();
            while (typeof(subCB) === 'function') {
                subCB(err, submissionToDownload);
                subCB = subsCbsWatiting.pop();
            }

            if (submissionToDownload.clearEvents) {
                submissionToDownload.clearEvents();
            }
        } else {
            submissionToDownload.clearEvents();
            return cb(err, submissionToDownload);
        }
    }

    log.d("downloadSubmission called", params);

    if (params.submissionId) {
        log.d("downloadSubmission SubmissionId exists" + params.submissionId);
        var submissionAlreadySaved = submissions.findMetaByRemoteId(params.submissionId);

        if (submissionAlreadySaved === null) {

            log.d("downloadSubmission submission does not exist, downloading", params);
            submissionToDownload = new submission.newInstance(null, {
                submissionId: params.submissionId
            });

            submissionToDownload.on('error', finishSubmissionDownload);

            submissionToDownload.on('downloaded', finishSubmissionDownload);

            if (typeof(params.updateFunction) === 'function') {
                submissionToDownload.on('progress', params.updateFunction);
            }


            if (typeof(cb) === "function") {
                if (waitOnSubmission[params.submissionId]) {
                    waitOnSubmission[params.submissionId].push(cb);
                } else {
                    waitOnSubmission[params.submissionId] = [];
                    waitOnSubmission[params.submissionId].push(cb);
                }
            }

            submissionToDownload.download(function(err) {
                if (err) {
                    log.e("Error queueing submission for download " + err);
                    return cb(err);
                }
            });
        } else {
            log.d("downloadSubmission submission exists", params);

            //Submission was created, but not finished downloading
            if (submissionAlreadySaved.status !== "downloaded" && submissionAlreadySaved.status !== "submitted") {
                if (typeof(cb) === "function") {
                    if (waitOnSubmission[params.submissionId]) {
                        waitOnSubmission[params.submissionId].push(cb);
                    } else {
                        waitOnSubmission[params.submissionId] = [];
                        waitOnSubmission[params.submissionId].push(cb);
                    }
                }
            } else {
                submissions.getSubmissionByMeta(submissionAlreadySaved, cb);
            }

        }
    } else {
        log.e("No submissionId passed to download a submission");
        return cb("No submissionId passed to download a submission");
    }
};

module.exports = {
    getForms: getForms,
    getForm: getForm,
    getTheme: getTheme,
    getSubmissions: getSubmissions,
    downloadSubmission: downloadSubmission,
    submitForm: submitForm,
    config: configInterface,
    log: log,
    init: init
}
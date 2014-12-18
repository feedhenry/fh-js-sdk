/*jshint expr: true*/
var chai = require('chai');
var expect = chai.expect;
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
var assert = chai.assert;
chai.use(sinonChai);

var getFormsData = require("./sampleData/getForms.json");
var allForms = require("./sampleData/getForm.json");
var theme = require("./sampleData/getTheme.json");
var sampleConfig = require("./sampleData/getConfig.json");
var submissionFile = require("./sampleData/submissionFile.json");
var submissionData = require("./sampleData/submissionData.json");
var submissionStatusFileHash = "";
var failedFileUploadFileHash = "";
var submissionStatusCounter = 0;
var responseDelay = 1000;

var staticConfig = {
    "sent_save_min": 5,
    "sent_save_max": 1000,
    "targetWidth": 640,
    "targetHeight": 480,
    "quality": 50,
    "debug_mode": false,
    "logger": false,
    "max_retries": 3,
    "timeout": 7,
    "log_line_limit": 5000,
    "log_email": "test@example.com",
    "log_level": 3,
    "log_levels": ["error", "warning", "log", "debug"],
    "config_admin_user": true,
    "picture_source": "both",
    "saveToPhotoAlbum": true,
    "encodingType": "jpeg",
    "sent_items_to_keep_list": [5, 10, 20, 30, 40, 50, 100],
    "mBaaSBaseUrl": "",
    "formUrls": {
        'forms': 'forms',
        'form': 'form',
        'theme': 'theme',
        'formSubmission': 'submitFormData',
        'fileSubmission': 'submitFormFile',
        'base64fileSubmission': 'submitFormFileBase64',
        'submissionStatus': 'submissionStatus',
        'formSubmissionDownload': 'formSubmissionDownload',
        'fileSubmissionDownload': 'fileSubmissionDownload',
        'completeSubmission': 'completeSubmission',
        'config': 'config'
    }
};

var config = {
    get: function(param) {
        console.log("getting config value: " + param);
        return staticConfig[param];
    },
    getCloudHost: function() {
        return "";
    }
};
var web = {
    get: function(url, params, cb) {
        console.log("FAKE GET: ", url, params);

        function _ping(params, cb) {
            console.log("In _ping, ", url);
            cb(null, "OK");
        }

        function _getTheme(params, cb) {
            console.log("In _getTheme, ", url);
            cb(null, theme);
        }

        function _getConfig(params, cb) {
            console.log("In _getConfig, ");

            cb(null, JSON.stringify(sampleConfig));
        }

        function _getSubmissionData(params, cb) {
            var submissionId = params.submissionId;
            console.log("In _getSubmissionData", url);
            var retVal = {};

            if (submissionId === "submissionData") {
                retVal = submissionData;
            } else if (submissionId === "submissionFile") {
                retVal = submissionFile;
            } else { //If it is not either of these, send back an error
                retVal = {
                    error: "No submission matches id: " + submissionId
                };
            }
            cb(null, retVal);
        }

        function _getSubmissionFile(params, cb) {
            console.log("In _getSubmissionData", url);

            cb(null, "some/path/to/file");
        }

        function _getForms(params, cb) {
            console.log("In _getForms, ", url);
            cb(null, getFormsData);
        }

        function _getForm(params, cb) {
            console.log("In _getForm, ", url);
            var formId = params.formId;

            if (allForms[formId]) {
                console.log("Form Found");
                cb(nulll, allForms[formId]);
            } else {
                cb("Cannot find specified form");
            }
        }

        function _getSubmissionStatus(params, cb) {
            var submissionId = params.submissionId;
            console.log("In _getSubmissionStatus, ", submissionId);

            var responseJSON = {
                "status": "complete"
            };

            if (submissionId === "submissionStatus") {
                if (submissionStatusCounter === 0) {
                    responseJSON = {
                        "status": "pending",
                        "pendingFiles": [submissionStatusFileHash]
                    };
                    submissionStatusCounter++;
                } else {
                    responseJSON = {
                        "status": "complete"
                    };
                }
            } else if (submissionId === "failedFileUpload") {
                responseJSON = {
                    "status": "pending",
                    "pendingFiles": [failedFileUploadFileHash]
                };
            } else if (submissionId === "submissionError") {
                responseJSON = {
                    "status": "pending",
                    "pendingFiles": ["filePlaceHolder123456"]
                };
            }

            setTimeout(function() {
                cb(null, responseJSON);
            }, responseDelay);
        }

        var urlMap = {
            forms: _getForms,
            form: _getForm,
            theme: _getTheme,
            submissionStatus: _getSubmissionStatus,
            config: _getConfig,
            formSubmissionDownload: _getSubmissionData,
            fileSubmissionDownload: _getSubmissionFile,
            ping: _ping
        };

        setTimeout(function() {
            urlMap[url](params, cb);
        }, responseDelay);
    },
    post: function(url, body, cb) {
        console.log("FAKE POST: ", url, body);

        function _completeSubmission(body, cb) {
            var submissionId = body.submissionId;
            console.log("In _completeSubmission, ", submissionId);
            var resJSON = {
                "status": "complete"
            };
            if (submissionId === "submissionNotComplete") {
                resJSON = {
                    "status": "pending",
                    "pendingFiles": ["filePlaceHolder123456"]
                };
            } else if (submissionId === "submissionError") {
                resJSON = {
                    "status": "error"
                };
            } else if (submissionId === "submissionStatus") {
                submissionStatusFileHash = "";
                submissionStatusCounter = 0;
            }
            console.log(resJSON);
            setTimeout(function() {
                cb(null, resJSON);
            }, responseDelay);
        }

        function _postFormSubmission(body, cb) {
            console.log("In _postFormSubmission, ", body);

            var submissionId = "123456";

            if (body.testText === "failedFileUpload") {
                submissionId = "failedFileUpload";
            } else if (body.testText === "submissionNotComplete") {
                submissionId = "submissionNotComplete";
            } else if (body.testText === "submissionError") {
                submissionId = "submissionError";
            } else if (body.testText === "submissionStatus") {
                submissionId = "submissionStatus";
            } else {
                submissionId = Math.floor((Math.random() * 1000) + 1).toString();
            }

            var rtn = {
                "submissionId": submissionId,
                "ori": body
            };
            if (body.outOfDate) {
                rtn.updatedFormDefinition = allForms['52efeb30538082e229000002'];
            }
            setTimeout(function() {
                console.log("Returning: ", body.testText);
                console.log("submissionId: ", submissionId);
                cb(null, rtn);
            }, responseDelay);
        }

        var urlMap = {
            formSubmission: _postFormSubmission,
            completeSubmission: _completeSubmission
        };

        setTimeout(function() {
            urlMap[url](body, cb);
        }, responseDelay);
    },
    uploadFile: function(url, fileProps, cb) {
        function _appFileSubmissionBase64(fileProps, cb) {
            console.log('In base64FileUploaded');

            _appFileSubmission();
        }

        function _appFileSubmission(fileProps, cb) {
            console.log("In _appFileSubmission");
            var resJSON = {
                "status": 200
            };

            if (req.params.submissionId === "failedFileUpload") {
                resJSON = {
                    "status": "error"
                };
                failedFileUploadFileHash = req.params.hashName;
            } else if (req.params.submissionId === "submissionStatus") {
                console.log(submissionStatusCounter);
                if (submissionStatusCounter === 0) {
                    resJSON = {
                        "status": "error"
                    };
                    submissionStatusFileHash = req.params.hashName;
                } else {
                    resJSON = {
                        "status": "ok"
                    };
                }
                submissionStatusCounter = 0;
            } else if (req.params.submissionId === "submissionError") {
                resJSON = {
                    "status": "error"
                };
                submissionStatusFileHash = req.params.hashName;
            }
            console.log(resJSON, req.params.submissionId);
            setTimeout(function() {
                res.json(resJSON);
            }, responseDelay);
        }

        var urlMap = {
            fileSubmission: _appFileSubmission,
            base64fileSubmission: _appFileSubmissionBase64
        };

        setTimeout(function() {
            urlMap[url](fileProps, cb);
        }, responseDelay);
    },
    downloadFile: function(url, fileMetaData, cb) {
        return cb(null, "some/file/path");
    }
};

var MBaaS = {};

MBaaS.checkStudio = function() {
    return false;
};
MBaaS.create = function(model, cb) {
    var self = this;
    if (self.checkStudio()) {
        cb("Studio mode mbaas not supported");
    } else {
        var url = _getUrl(model).url;
        if (self.isFileAndPhoneGap(model)) {
            web.uploadFile(url, model.getProps(), cb);
        } else {
            web.post(url, model.getProps(), cb);
        }
    }
};
MBaaS.isFileAndPhoneGap = function(model) {
    false;
};
MBaaS.isFileTransfer = function(model) {
    return (model.get("_type") === "fileSubmission" || model.get("_type") === "base64fileSubmission" || model.get("_type") === "fileSubmissionDownload");
};
MBaaS.isPhoneGap = function() {
    return false;
};
MBaaS.read = function(model, cb) {
    var self = this;
    if (self.checkStudio()) {
        cb("Studio mode mbaas not supported");
    } else {
        if (model.get("_type") === "offlineTest") {
            cb("offlinetest. ignore");
        } else {
            var getDetails = _getUrl(model);
            var url = getDetails.url;

            if (self.isFileTransfer(model) && self.isPhoneGap()) {
                web.downloadFile(url, model.getFileMetaData(), cb);
            } else if (self.isFileTransfer(model)) { //Trying to download a file without phone. No need as the direct web urls can be used
                return cb(null, model.getRemoteFileURL());
            } else {
                web.get(url, getDetails.params, cb);
            }
        }
    }
};

MBaaS.completeSubmission = function(submissionToComplete, cb) {
    if (this.checkStudio()) {
        return cb("Studio mode mbaas not supported");
    }
    var postDetails = _getUrl(submissionToComplete);
    var url = postDetails.url;
    web.post(url, postDetails.params, cb);
};
MBaaS.submissionStatus = function(submission, cb) {
    if (this.checkStudio()) {
        return cb("Studio mode mbaas not supported");
    }
    var getDetails = _getUrl(submission);
    var url = getDetails.url;
    web.get(url, getDetails.params, cb);
};
MBaaS.isOnline = function(cb) {
    return cb(true);
};

function _getUrl(model) {
    var type = model.get('_type');
    var host = config.getCloudHost();
    var mBaaSBaseUrl = config.get('mbaasBaseUrl');
    var formUrls = config.get('formUrls');

    console.log("FORM URLS ", formUrls, type);

    var relativeUrl = "";
    if (formUrls[type]) {
        relativeUrl = formUrls[type];
    } else {}
    var url = relativeUrl;

    var props = {};
    props.appId = config.get('appId');
    //Theme and forms do not require any parameters that are not in _fh
    switch (type) {
        case 'config':
            props.appid = model.get("appId");
            props.deviceId = model.get("deviceId");
            break;
        case 'form':
            props.formId = model.get('_id');
            break;
        case 'formSubmission':
            props.formId = model.getFormId();
            break;
        case 'fileSubmission':
            props.submissionId = model.getSubmissionId();
            props.hashName = model.getHashName();
            props.fieldId = model.getFieldId();
            break;
        case 'base64fileSubmission':
            props.submissionId = model.getSubmissionId();
            props.hashName = model.getHashName();
            props.fieldId = model.getFieldId();
            break;
        case 'submissionStatus':
            props.submissionId = model.get('submissionId');
            break;
        case 'completeSubmission':
            props.submissionId = model.get('submissionId');
            break;
        case 'formSubmissionDownload':
            props.submissionId = model.getSubmissionId();
            break;
        case 'fileSubmissionDownload':
            props.submissionId = model.getSubmissionId();
            props.fileGroupId = model.getFileGroupId();
            break;
        case 'offlineTest':
            return "http://127.0.0.1:8453";
    }
    for (var key in props) {
        url = url.replace(':' + key, props[key]);
    }
    console.log("Returning URL: ", url);
    return {
        url: url,
        params: props
    };
}

console.log("EXPORTED FAKE MBAAS");

module.exports = MBaaS;

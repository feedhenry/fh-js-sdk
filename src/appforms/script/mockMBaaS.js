module.exports = applyServer;

var getFormsData = require("./sampleData/getForms.json");
var allForms = require("./sampleData/getForm.json");
var theme = require("./sampleData/getTheme.json");
var submissionStatusFileHash = "";
var failedFileUploadFileHash = "";
var submissionStatusCounter = 0;

function applyServer(app) {
  app.use(function(req, res, next) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "X-Request-With, Content-Type");
    next();
  });
  app.get("/mbaas/forms", _getForms);
  app.get("/mbaas/forms/theme", _getTheme);
  app.get("/mbaas/forms/:formId", _getForm);
  app.post("/mbaas/forms", _postForms);
  app.post("/box/srv/1.1/app/init", _postInit);
  app.post("/mbaas/forms/:formId/submitFormData", _postFormSubmission);
  app.post("/mbaas/forms/:submissionId/:fieldId/:hashName/submitFormFile", _appFileSubmission);
  app.post("/mbaas/forms/:submissionId/:fieldId/:hashName/submitFormFileBase64", _appFileSubmissionBase64);
  app.get("/mbaas/forms/:submissionId/status", _getSubmissionStatus);
  app.post("/mbaas/forms/:submissionId/completeSubmission", _completeSubmission);
}

function _postInit(req, res) {
  console.log("In _getForms, ", req.params);
  res.json({
    "status": "ok"
  });
}

function _getForms(req, res) {
  console.log("In _getForms, ", req.params);
  res.json(getFormsData);
}

function _postForms(req, res) {
  console.log("In _postForms, ");

  setTimeout(function() {
    res.json({
      "status": "ok",
      "body": req.body
    });
  }, 1000);
}

function _getSubmissionStatus(req, res) {
  console.log("In _getSubmissionStatus, ", req.params);

  var responseJSON = {
    "status": "complete"
  };

  if (req.params.submissionId === "submissionStatus") {
    if (submissionStatusCounter == 0) {
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
  } else if (req.params.submissionId === "failedFileUpload") {
    responseJSON = {
      "status": "pending",
      "pendingFiles": [failedFileUploadFileHash]
    }
  } else if (req.params.submissionId === "submissionError") {
    responseJSON = {
      "status": "pending",
      "pendingFiles": ["filePlaceHolder123456"]
    }
  }

  setTimeout(function() {
    res.json(responseJSON);
  }, 1000);

}

function _completeSubmission(req, res) {
  console.log("In _completeSubmission, ", req.params);
  var resJSON = {
    "status": "complete"
  };
  if (req.params.submissionId === "submissionNotComplete") {
    resJSON = {
      "status": "pending",
      "pendingFiles": ["filePlaceHolder123456"]
    };
  } else if (req.params.submissionId === "submissionError") {
    resJSON = {
      "status": "error"
    };
  } else if (req.params.submissionId == "submissionStatus") {
    submissionStatusFileHash = "";
    submissionStatusCounter = 0;
  }
  console.log(resJSON);
  setTimeout(function() {
    res.json(resJSON);
  }, 1000);

}

function _postFormSubmission(req, res) {
  console.log("In _postFormSubmission, ", req.params);

  var submissionId = "123456";

  var body = req.body;
  console.log(body);

  if (body.testText === "failedFileUpload") {
    submissionId = "failedFileUpload"
  } else if (body.testText === "submissionNotComplete") {
    submissionId = "submissionNotComplete"
  } else if (body.testText === "submissionError") {
    submissionId = "submissionError"
  } else if (body.testText === "submissionStatus") {
    submissionId = "submissionStatus";
  } else {
    submissionId = Math.floor((Math.random() * 1000) + 1).toString();
  }

  var body = req.body;
  var rtn = {
    "submissionId": submissionId,
    "ori": body
  };
  if (body.outOfDate) {
    rtn.updatedFormDefinition = allForms;
  }
  setTimeout(function() {
    console.log("Returning: ", body.testText);
    console.log("submissionId: ", submissionId);
    res.json(rtn);
  }, 1000);

}

function _getForm(req, res) {
  console.log("In _getForm, ", req.params);
  var formId = req.params.formId;
  if (allForms._id === formId) {
    res.json(allForms);
  } else {
    res.status(404).end("Cannot find specified form");
  }
}

function _appFileSubmissionBase64(req, res) {
  console.log('In base64FileUploaded');

  _appFileSubmission(req, res);
}

function _appFileSubmission(req, res) {
  console.log("In _appFileSubmission", req.files, req.params);
  var resJSON = {
    "status": 200
  };

  if (req.params.submissionId === "failedFileUpload") {
    resJSON = {
      "status": "error"
    };
    failedFileUploadFileHash = req.params.hashName;
  } else if (req.params.submissionId == "submissionStatus") {
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
  } else if (req.params.submissionId == "submissionError") {
    resJSON = {
      "status": "error"
    };
    submissionStatusFileHash = req.params.hashName;
  }
  console.log(resJSON, req.params.submissionId);
  setTimeout(function() {
    res.json(resJSON);
  }, 1000);
}

function _getTheme(req, res) {
  console.log("In _getTheme, ", req.params);
  res.json(theme);
}
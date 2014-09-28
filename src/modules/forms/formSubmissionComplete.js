var Model = require("./model");
var log = require("./log");
var config = require("./config");

function FormSubmissionComplete(submissionTask) {
    Model.call(this, {
        '_type': 'completeSubmission',
        'submissionId': submissionTask.get('submissionId'),
        'localSubmissionId': submissionTask.get('localSubmissionId')
    });
}
utils.extend(FormSubmissionComplete, Model);

module.exports = FormSubmissionComplete;
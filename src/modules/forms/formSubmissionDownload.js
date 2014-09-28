var Model = require("./model");
var log = require("./log");
var config = require("./config");

function FormSubmissionDownload(uploadTask) {
    Model.call(this, {
        '_type': 'formSubmissionDownload',
        'data': uploadTask
    });
}
utils.extend(FormSubmissionDownload, Model);
FormSubmission.prototype.getSubmissionId = function() {
    return this.get('data').get("submissionId", "not-set");
};

module.exports = FormSubmissionDownload;
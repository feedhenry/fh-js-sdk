var Model = require("./model");
var log = require("./log");
var config = require("./config");
var utils = require("./utils");

function FormSubmissionDownload(uploadTask) {
    Model.call(this, {
        '_type': 'formSubmissionDownload',
        'data': uploadTask
    });
}
FormSubmissionDownload.prototype.getSubmissionId = function() {
    return this.get('data').get("submissionId", "not-set");
};

utils.extend(FormSubmissionDownload, Model);

module.exports = FormSubmissionDownload;
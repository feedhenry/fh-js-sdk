var Model = require("./model");
var log = require("./log");
var config = require("./config");
var localStorage = require("./localStorage");
var FileSubmission = require("./fileSubmission");

function Base64FileSubmission(fileData) {
    FileSubmission.call(this, fileData);
    this.set('_type', 'base64fileSubmission');
}

utils.extend(Base64FileSubmission, FileSubmission);
module.exports = Base64FileSubmission;
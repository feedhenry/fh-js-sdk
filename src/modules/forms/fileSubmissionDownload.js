// var Model = require("./model");
// var log = require("./log");
// var config = require("./config");
// var localStorage = require("./localStorage");
// var FileSubmission = require("./fileSubmission");
// var utils = require("./utils");


// function FileSubmissionDownload(fileData) {
//     log.d("FileSubmissionDownload ", fileData);
//     Model.call(this, {
//         '_type': 'fileSubmissionDownload',
//         'data': fileData
//     });
// }

// utils.extend(FileSubmissionDownload, Model);

// FileSubmissionDownload.prototype.setSubmissionId = function(submissionId) {
//     log.d("FileSubmission setSubmissionId.", submissionId);
//     this.set('submissionId', submissionId);
// };
// FileSubmissionDownload.prototype.getSubmissionId = function() {
//     log.d("FileSubmission getSubmissionId: ", this.get('submissionId'));
//     return this.get('submissionId', "");
// };
// FileSubmissionDownload.prototype.getHashName = function() {
//     log.d("FileSubmission getHashName: ", this.get('data').hashName);
//     return this.get('data', {}).hashName;
// };
// FileSubmissionDownload.prototype.getFieldId = function() {
//     log.d("FileSubmission getFieldId: ", this.get('data').fieldId);
//     return this.get('data', {}).fieldId;
// };
// FileSubmissionDownload.prototype.getFileMetaData = function() {
//     log.d("FileSubmission getFileMetaData: ", this.get('data'));
//     if (this.get('data')) {
//         log.d("FileSubmission getFileMetaData: data found", this.get('data'));
//     } else {
//         log.e("FileSubmission getFileMetaData: No data found");
//     }
//     return this.get('data', {});
// };
// FileSubmissionDownload.prototype.getFileGroupId = function() {
//     log.d("FileSubmission getFileGroupId: ", this.get('data'));
//     return this.get('data', {}).groupId || "notset";
// };
// FileSubmissionDownload.prototype.getRemoteFileURL = function() {
//     var self = this;
//     log.d("FileSubmission getRemoteFileURL: ");

//     //RemoteFileUrl = cloudHost + /mbaas/forms/submission/:submissionId/file/:fileGroupId
//     //Returned by the mbaas.
//     function buildRemoteFileUrl() {
//         var submissionId = self.getSubmissionId();
//         var fileGroupId = self.getFileGroupId();
//         var urlTemplate = config.get('formUrls', {}).fileSubmissionDownload;
//         if (urlTemplate) {
//             urlTemplate = urlTemplate.replace(":submissionId", submissionId);
//             urlTemplate = urlTemplate.replace(":fileGroupId", fileGroupId);
//             urlTemplate = urlTemplate.replace(":appId", config.get('appId', "notSet"));
//             return config.getCloudHost() + "/mbaas" + urlTemplate;
//         } else {
//             return "notset";
//         }
//     }

//     return buildRemoteFileUrl();
// };

// module.exports = FileSubmissionDownload;
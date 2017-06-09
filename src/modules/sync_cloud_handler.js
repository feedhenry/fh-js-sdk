var cloudAPI = require("./api_cloud");

module.exports = function (params, success, failure) {
    cloudAPI({
        'path': '/mbaas/sync/' + params.dataset_id,
        'method': 'post',
        'data': params.req
    }, function (res) {
        success(res);
    }, function (msg, err) {
        failure(msg, err);
    });
};
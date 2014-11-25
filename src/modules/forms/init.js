var log = require("./log");
var config = require("./config");
var submissions = require("./submissions");
var uploadManager = require("./uploadManager");
var theme = require("./theme");
var forms = require("./forms");
var async = require('../../../libs/async');

console.log("INIT CALLED");

var init = function(params, cb) {
    var def = {
        'updateForms': true
    };
    if (typeof cb === 'undefined') {
        cb = params;
    } else {
        for (var key in params) {
            def[key] = params[key];
        }
    }

    //init config module
    var config = def.config || {};

    async.series([
        function(cb) {
            log.loadLocal(cb);
        },
        function(cb) {
            log.l("Loading Config");
            config.init(config, cb);
        },
        function(cb) {
            log.l("Loading Submissions");
            submissions.loadLocal(cb);
        },
        function(cb) {
            log.l("Loading Upload Tasks");
            uploadManager.loadLocal(cb);
        }
    ], function(err) {
        if(err){
            log.e("Error Initialising Forms: " + err);
            return cb(err);
        }

        log.l("Initialisation Complete. Starting Upload Manager");
        //Starting any uploads that are queued
        uploadManager.start();
        //init forms module

        return cb();
    });
};

module.exports = init;
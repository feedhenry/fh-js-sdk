var log = require("./log");
var config = require("./config");
var submissions = require("./submissions");
var uploadManager = require("./uploadManager");
var theme = require("./theme");
var forms = require("./forms");

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
    config.init(config, function(err) {
        if (err) {
            log.e("Form config loading error: ", err);
        }
        log.loadLocal(function(err) {
            if (err) {
                console.error("Error loading config from local storage");
            }

            submissions.loadLocal(function(err) {
                if (err) {
                    console.error("Error loading submissions");
                }

                //Loading the current state of the uploadManager for any upload tasks that are still in progress.
                uploadManager.loadLocal(function(err) {
                    log.d("Upload Manager loaded from memory.");
                    if (err) {
                        log.e("Error loading upload manager from memory ", err);
                    }

                    //Starting any uploads that are queued
                    uploadManager.start();
                    //init forms module
                    log.l("Refreshing Theme.");
                    theme.refresh(true, function(err) {
                        if (err) {
                            log.e("Error refreshing theme ", err);
                        }
                        if (def.updateForms === true) {
                            log.l("Refreshing Forms.");
                            forms.refresh(true, function(err) {
                                if (err) {
                                    log.e("Error refreshing forms: ", err);
                                }
                                cb();
                            });
                        } else {
                            cb();
                        }
                    });
                });
            });

        });
    });
}

module.exports = init;
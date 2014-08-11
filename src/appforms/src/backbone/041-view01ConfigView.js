var ConfigView = Backbone.View.extend({
    templates: {

    },
    "_events": {
        "click #_viewLogsBtn": "viewLogs",
        "click #_clearLogsBtn": "clearLogs",
        "click #_sendLogsBtn": "sendLogs",
        "click #_closeViewBtn": "closeViewLogs",
        "click #fh_appform_show_deviceId": "showDeviceId",
        "click #logger": "toggleLogging"
    },
    toggleLogging: function() {
        var loggingEnabled = $fh.forms.config.getConfig().logger;
        loggingEnabled = !loggingEnabled;
        $fh.forms.config.set("logger", loggingEnabled);

        var loggingMessage = loggingEnabled ? "Logging Enabled" : "Logging Disabled";
        var checkedClass = loggingEnabled ? "active" : "";

        if (loggingEnabled) {
            this.$el.find('.choice_icon').addClass('icon-circle');
            this.$el.find('.choice_icon').removeClass('icon-circle-blank');
        } else {
            this.$el.find('.choice_icon').addClass('icon-circle-blank');
            this.$el.find('.choice_icon').removeClass('icon-circle');
        }

        this.$el.find('#logger_message').html(loggingMessage);
    },
    showDeviceId: function() {
        this.$el.find("#logsModalLabelBody").html("Device Id: " + $fh.forms.config.getDeviceId());
        this.$el.find("#logsModal").modal();
    },
    viewLogs: function() {
        var logs = this.getPolishedLogs();
        this.$el.find("#logsModalLabelBody").html(logs);
        this.$el.find("#logsModal").modal();
    },
    getPolishedLogs: function() {
        var arr = [];
        var logs = $fh.forms.log.getLogs();
        var patterns = [{
            reg: /^.+\sERROR\s.*/,
            classStyle: "list-group-item-danger"
        }, {
            reg: /^.+\sWARNING\s.*/,
            classStyle: "list-group-item-warning"
        }, {
            reg: /^.+\sLOG\s.*/,
            classStyle: "list-group-item-info"
        }, {
            reg: /^.+\sDEBUG\s.*/,
            classStyle: "list-group-item-success"
        }, {
            reg: /^.+\sUNKNOWN\s.*/,
            classStyle: "list-group-item-warning"
        }];


        var listStr = "";

        for (var i = 0; i < logs.length; i++) {
            var log = logs[i];
            for (var j = 0; j < patterns.length; j++) {
                var p = patterns[j];
                if (p.reg.test(log)) {
                    listStr += _.template($('#temp_config_log_item').html(), {
                        logClass: p.classStyle,
                        message: log
                    });
                    break;
                }
            }
        }
        var listGroup = _.template($('#temp_config_log').html(), {
            listStr: listStr
        });
        return listGroup;
    },

    clearLogs: function() {
        var self = this;
        $fh.forms.log.clearLogs(function() {
            self.$el.find("#_logViewDiv").html("");
            alert("Logs cleared.");
        });
    },
    sendLogs: function() {
        $fh.forms.log.sendLogs(function(err) {
            if (err) {
                alert(err);
            } else {
                alert("Log has been sent to:" + $fh.forms.config.get("log_email"));
            }
        });
    },
    closeViewLogs: function() {
        this.$el.find("#_logsViewPanel").hide();
    },
    initialize: function(options) {
        this.options = options;
        this.events = _.extend({}, this._events, this.events);
    },
    render: function() {
        this.$el.empty();

        this.$el.append("<div id='fh_appform_templates' style='display:none;'>" + FormTemplates + "</div>");
        //Append Logo
        this.$el.append(_.template(this.$el.find('#forms-logo-sdk').html()));
        var props = $fh.forms.config.getConfig();

        var cameraSettingsHtml = _.template(this.$el.find('#temp_config_camera').html(), props);
        var submissionSettingsHtml = _.template(this.$el.find('#temp_config_submissions').html(), props);
        var debuggingSettingsHtml = _.template(this.$el.find('#temp_config_debugging').html(), props);
        var miscSettingsHtml = _.template(this.$el.find('#temp_config_misc').html(), props);

        this.$el.append(miscSettingsHtml);
        this.$el.append(debuggingSettingsHtml);
        this.$el.append(cameraSettingsHtml);
        this.$el.append(submissionSettingsHtml);

        this.$el.find('#sent_items_to_keep_list').tagsinput('items');
        this.$el.find('.bootstrap-tagsinput').addClass('fh_appform_field_input');

        this.$el.find('.panel-heading').click(function(e) {
            console.log(e);

            var field = $(e.currentTarget).data().field;
            $('#' + field).slideToggle();
            $('#' + field + '-icon').toggleClass('icon-chevron-sign-up');
            $('#' + field + '-icon').toggleClass('icon-chevron-sign-down');
        });


        if (!$fh.forms.config.editAllowed()) {
            //Hide sections
            this.$el.find('#camera-settings').hide();
            this.$el.find('#submission-settings').hide();

            //Hide fields
            this.$el.find('#log_level_div').hide();
            this.$el.find('#log_email_div').hide();
            this.$el.find('#log_line_limit_div').hide();
            this.$el.find('#logger_wrapper_div').hide();
        }
        return this;
    },
    save: function(cb) {
        $fh.forms.log.l("Saving config");
        var inputs = this.$el.find("input,select,textarea,button[data-key='logger']");

        if ($fh.forms.config.editAllowed()) {
            inputs.each(function() {
                var key = $(this).data().key;
                var val = $(this).val();

                if (key === "logger") {
                    if ($(this).hasClass("active")) {
                        val = true;
                    } else {
                        val = false;
                    }
                }

                if (key === "sent_items_to_keep_list") {
                    //Parse the strings
                    if (val && val.filter) {
                        val = val.filter(function(selectValue) {
                            selectValue = parseInt(selectValue);
                            return !isNaN(selectValue);
                        });

                        val = _.map(val, function(value) {
                            return parseInt(value);
                        });

                        val.sort(function(a, b) {
                            return a - b;
                        });
                    } else {
                        return;
                    }

                }

                $fh.forms.config.set(key, val);
            });

            $fh.forms.config.saveConfig(cb);
        } else {
            alert("Editing config not permitted.");
        }
    }
});
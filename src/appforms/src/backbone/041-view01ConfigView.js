var ConfigView = Backbone.View.extend({
  "templates": [
    '<div class="fh_appform_field_area config_camera">' +
    '<fieldset>' +
    '<div class="fh_appform_field_title">Camera</div>' +
    '<div class="form-group" style="margin:5px 5px 5px 5px;">' +
    '<label class="fh_appform_field_instructions" style="margin-top: 5px;font-weight: bold;line-height: 2em;">Quality</label>' +
    '<input class="fh_appform_field_input" style="display: inline-block;text-align: center;width: 40%;float: right;" data-key="quality" value="<%= quality%>"/>' +
    '</div>' +
    '<br/>' +
    '<div class="form-group" style="margin:5px 5px 5px 5px;">' +
    '<label class="fh_appform_field_instructions" style="margin-top: 5px;font-weight: bold;line-height: 2em;">Target Width</label>' +
    '<input class="fh_appform_field_input" style="display: inline-block;text-align: center;width: 40%;float: right;" data-key="targetWidth" value="<%= targetWidth%>"/>' +
    '</div><br/><div class="form-group" style="margin:5px 5px 5px 5px;">' +
    '<label class="fh_appform_field_instructions" style="margin-top: 5px;font-weight: bold;line-height: 2em;">Target Height</label>' +
    '<input class="fh_appform_field_input" style="display: inline-block;text-align: center;width: 40%;float: right;" data-key="targetHeight" value="<%= targetHeight%>"/>' +
    '</div>' +
    '<br/>' +
    '</fieldset>' +
    '</div>',
    '<div class="fh_appform_field_area config_submission">' +
    '<fieldset>' +
    '<div class="fh_appform_field_title">Submission</div>' +
    '<div class="form-group" style="margin:5px 5px 5px 5px;">' +
    '<label class="fh_appform_field_instructions" style="margin-top: 5px;font-weight: bold;line-height: 2em;">Max Retries</label>' +
    '<input class="fh_appform_field_input" style="display: inline-block;text-align: center;width: 40%;float: right;" data-key="max_retries" value="<%= max_retries%>"/>' +
    '</div>' +
    '<br/>' +
    '<div class="form-group" style="margin:5px 5px 5px 5px;">' +
    '<label class="fh_appform_field_instructions" style="margin-top: 5px;font-weight: bold;line-height: 2em;">Timeout</label>' +
    '<input class="fh_appform_field_input" style="display: inline-block;text-align: center;width: 40%;float: right;" data-key="timeout" value="<%= timeout%>"/>' +
    '</div><br/><div class="form-group" style="margin:5px 5px 5px 5px;">' +
    '<label class="fh_appform_field_instructions" style="margin-top: 5px;font-weight: bold;line-height: 2em;">Min Sent Items to Save</label>' +
    '<input class="fh_appform_field_input" style="display: inline-block;text-align: center;width: 40%;float: right;" data-key="sent_save_min" value="<%= sent_save_min%>"/>' +
    '</div><br/><div class="form-group" style="margin:5px 5px 5px 5px;">' +
    '<label class="fh_appform_field_instructions" style="margin-top: 5px;font-weight: bold;line-height: 2em;">Max Sent Items to Save</label>' +
    '<input class="fh_appform_field_input" style="display: inline-block;text-align: center;width: 40%;float: right;" data-key="sent_save_max" value="<%= sent_save_max%>"/>' +
    '</div>' +
    '<br/>' +
    '</fieldset>' +
    '</div>',
    '<style type="text/css">'+
  '#_logsViewPanel{'+
    'position:fixed;'+
    'left:10px;'+
    'top:10px;'+
    'right:10px;'+
    'bottom:10px;'+
    'padding:8px;'+
    'background: white;'+
    '-webkit-border-radius: 8px;'+
    'border-radius: 8px;'+
    'overflow: auto;'+
  '}'+
  '#_closeViewBtn{'+
    'border: 1px solid;'+
    'padding:3px;'+
  '}'+
'</style>'+
'<div class="fh_appform_field_area config_debugging">'+
  '<fieldset>'+
    '<div class="fh_appform_field_title">Debugging</div>'+
    '<br/>' +
    '<div class="fh_appform_field_title">DeviceId: <%= deviceId%></div>'+
      '<div id="config_debugging_log_enabled" class="form-group" style="margin:5px 5px 5px 5px;">'+
        '<label class="fh_appform_field_instructions" style="margin-top: 5px;font-weight: bold;line-height: 2em;margin-top:5px;">Log Enabled</label>'+
        '<input class="fh_appform_field_input" style="display: inline-block;text-align: center;width: 40%;float: right;" type="checkbox" data-key="logger"  <%= logger?"checked":"" %> value="true"/>'+
      '</div>'+
      '<br/>' +
      '<div id="config_debugging_log_level" class="form-group" style="margin:5px 5px 5px 5px;">'+
        '<label class="fh_appform_field_instructions" style="margin-top: 5px;font-weight: bold;line-height: 2em;margin-top:5px;">Log Level</label>'+
        '<select class="fh_appform_field_input" style="display: inline-block;text-align: center;width: 40%;float: right;" data-key="log_level">'+
          '<%'+
              'for (var i=0;i<log_levels.length;i++){'+
                'var val=log_levels[i];'+
                'var selected=(i===log_level)?"selected":"";'+
                '%>'+
                  '<option value="<%= i %>" <%= selected%>><%= val%></option>'+
                '<%'+
              '}'+
            '%>'+
        '</select>'+
      '</div><br/><div id="config_debugging_log_line_limit" class="form-group" style="margin:5px 5px 5px 5px;">'+
        '<label class="fh_appform_field_instructions" style="margin-top: 5px;font-weight: bold;line-height: 2em;">Log Line Number</label>'+
        '<input class="fh_appform_field_input" style="display: inline-block;text-align: center;width: 40%;float: right;" data-key="log_line_limit" value="<%= log_line_limit%>"/>'+
      '</div><br/><div id="config_debugging_log_email" class="form-group" style="margin:5px 5px 5px 5px;">'+
        '<label class="fh_appform_field_instructions" style="margin-top: 5px;font-weight: bold;line-height: 2em;">Log Email Address</label>'+
        '<input class="fh_appform_field_input" style="display: inline-block;text-align: center;width: 98%;float: right;" data-key="log_email" value="<%= log_email%>"/>'+
      '</div>'+
      '<div class="log_buttons" style="width:100%;margin: 20px 0px 20px 0px;padding:0px 0px 0px 0px;text-align:center;">'+
        '<button class="fh_appform_button_default" style="width:30%;margin-right:10px" type="button" id="_viewLogsBtn">View Logs</button>'+
        '<button class="fh_appform_button_cancel" style="width:30%;margin-right:10px" type="button" id="_clearLogsBtn">Clear Logs</button>'+
        '<button class="fh_appform_button_action" style="width:30%;" type="button" id="_sendLogsBtn">Send Logs</button>'+
      '</div>'+
  '</fieldset>'+
'</div>'+
'<div class="hidden" id="_logsViewPanel">'+
  '<div><span class="fh_appform_button_cancel" id="_closeViewBtn">Close</span></div>'+
  '<div class="fh_appform_field_area" id="_logViewDiv"></div>'+
'</div>'
  ],
  "_myEvents": {
    "click #_viewLogsBtn": "viewLogs",
    "click #_clearLogsBtn": "clearLogs",
    "click #_sendLogsBtn": "sendLogs",
    "click #_closeViewBtn": "closeViewLogs"
  },
  "viewLogs": function() {
    var logs = $fh.forms.log.getPolishedLogs();
    var logStr = logs.join("");
    this.$el.find("#_logViewDiv").html(logStr);
    this.$el.find("#_logsViewPanel").show();
  },

  "clearLogs":function(){
    var self=this;
    $fh.forms.log.clearLogs(function(){
      self.$el.find("#_logViewDiv").html("");
      alert("Logs cleared.");
    });
  },
  "sendLogs":function(){
    $fh.forms.log.sendLogs(function(err){
      if (err){
        alert(err);
      }else{
        alert("Log has been sent to:"+$fh.forms.config.get("log_email"));
      }
    });
  },  
  "closeViewLogs":function(){
    this.$el.find("#_logsViewPanel").hide();
  },
  "events": {},
  "initialize": function() {
    this.events = _.extend({}, this._myEvents, this.events);
  },
  "render": function() {
    var self = this;
    self.$el.html("");
    var props = $fh.forms.config.getConfig();
    props.deviceId = $fh.forms.config.getDeviceId();
    var html = _.template(self.templates.join(""), props);
    self.$el.append(html);

    if($fh.forms.config.editAllowed() === false){
      self.$el.find(".config_camera").hide();
      self.$el.find(".config_submission").hide();

      self.$el.find("#config_debugging_log_enabled").hide();
      self.$el.find("#config_debugging_log_level").hide();
      self.$el.find("#config_debugging_log_line_limit").hide();
      self.$el.find("#config_debugging_log_email").hide();
    }

    return self;
  },
  "save": function(cb) {
    $fh.forms.log.l("Saving config");
    var inputs = this.$el.find("input,select,textarea");

    if($fh.forms.config.editAllowed()){
      inputs.each(function() {
        var key = $(this).data().key;
        var val = $(this).val();

        if ($(this).attr("type") && $(this).attr("type").toLowerCase() === "checkbox") {
          if (!$(this).attr("checked")) {
            val = false;
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
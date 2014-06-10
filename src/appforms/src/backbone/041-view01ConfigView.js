var ConfigView = Backbone.View.extend({
  templates: {
      camera_options: {
          header: '<div class="fh_appform_field_area config_camera col-xs-10 col-xs-offset-1"><div class="fh_appform_field_title"><h3>Camera</h3></div></div>',
          camera_options_quality: '<div class="form-group col-xs-offset-1 col-xs-11"><label class="fh_appform_field_instructions col-xs-3">Quality</label><input class="fh_appform_field_input col-xs-8 col-xs-offset-1 text-center" type="number" value="<%= quality%>"/></div>',
          camera_options_target_width: '<div class="form-group col-xs-offset-1 col-xs-11"><label class="fh_appform_field_instructions col-xs-3" >Target Width</label><input class="fh_appform_field_input col-xs-8 col-xs-offset-1 text-center" type="number" data-key="targetWidth" value="<%= targetWidth%>"/></div>',
          camera_options_target_height: '<div class="form-group col-xs-offset-1 col-xs-11"><label class="fh_appform_field_instructions col-xs-3">Target Height</label><input class="fh_appform_field_input col-xs-8 col-xs-offset-1 text-center" type="number" data-key="targetHeight" value="<%= targetHeight%>"/></div>',
      },
      submission_options: {
          header: '<div class="fh_appform_field_area config_submission col-xs-10 col-xs-offset-1"><div class="fh_appform_field_title"><h3>Submission</h3></div></div>',
          submission_options_max_retries: '<div class="form-group col-xs-offset-1 col-xs-11"><label class="fh_appform_field_instructions col-xs-3" >Max Retries</label><input class="fh_appform_field_input col-xs-8 col-xs-offset-1 text-center" type="number"  data-key="max_retries" value="<%= max_retries%>"/></div>',
          submission_options_timeout: '<div class="form-group col-xs-offset-1 col-xs-11" ><label class="fh_appform_field_instructions col-xs-3" >Timeout</label><input class="fh_appform_field_input col-xs-8 col-xs-offset-1 text-center" type="number" data-key="timeout" value="<%= timeout%>"/></div>',
          submission_options_sent_save_min: '<div class="form-group col-xs-offset-1 col-xs-11"><label class="fh_appform_field_instructions col-xs-3" >Min Sent Items to Save</label><input class="fh_appform_field_input col-xs-8 col-xs-offset-1 text-center" type="number" data-key="sent_save_min" value="<%= sent_save_min%>"/></div>',
          submission_options_sent_save_max: '<div class="form-group col-xs-offset-1 col-xs-11"><label class="fh_appform_field_instructions col-xs-3">Max Sent Items to Save</label><input class="fh_appform_field_input col-xs-8 col-xs-offset-1 text-center" type="number" data-key="sent_save_max" value="<%= sent_save_max%>"/></div>',
      },
      debugging_options: {
          header: '<div class="fh_appform_field_area config_debugging col-xs-10 col-xs-offset-1"><div class="fh_appform_field_title"><h3>Debugging</h4></div></div>',
          debugging_show_device_id : '<div class="form-group col-xs-offset-1 col-xs-11">' +
              '<label class="fh_appform_field_instructions col-xs-3">Device Id</label>' +
              '<button class="fh_appform_button_action col-xs-4" id="fh_appform_show_deviceId">Show Device Id</button>' +
              '</div>',
          debugging_options_log_enabled: '<div class="form-group col-xs-offset-1 col-xs-11">' +
              '<label class="fh_appform_field_instructions col-xs-3">Log Enabled</label>' +
              '<input class="fh_appform_field_input col-xs-8 col-xs-offset-1" type="checkbox" data-key="logger"  <%= logger?"checked":"" %> value="true"/>' +
              '</div>',
          debugging_options_log_level: '<div class="form-group col-xs-offset-1 col-xs-11">' +
              '<label class="fh_appform_field_instructions col-xs-3">Log Level</label>' +
              '<select class="fh_appform_field_input col-xs-8 col-xs-offset-1" data-key="log_level">' +
              '<%' +
              'for (var i=0;i<log_levels.length;i++){' +
              'var val=log_levels[i];' +
              'var selected=(i==log_level)?"selected":"";' +
              '%>' +
              '<option value="<%= i %>" <%= selected%>><%= val%></option>' +
              '<%' +
              '}' +
              '%>' +
              '</select>' +
              '</div>',
          debugging_options_log_email: '<div class="form-group col-xs-offset-1 col-xs-11">' +
              '<label class="fh_appform_field_instructions col-xs-3">Log Email Address</label>' +
              '<input class="fh_appform_field_input col-xs-8 col-xs-offset-1 text-center" type="email" data-key="log_email" value="<%= log_email%>"/>' +
              '</div>',
          debugging_options_log_line_limit: '<div class="form-group col-xs-offset-1 col-xs-11">' +
              '<label class="fh_appform_field_instructions col-xs-3">Log Line Number</label>' +
              '<input class="fh_appform_field_input col-xs-8 col-xs-offset-1 text-center" type="number" data-key="log_line_limit" value="<%= log_line_limit%>"/>' +
              '</div>',
      },
      log_buttons: '<div class="log_buttons">' +
          '<button class="fh_appform_button_default col-xs-4" type="button" id="_viewLogsBtn">View Logs</button>' +
          '<button class="fh_appform_button_cancel col-xs-4" type="button" id="_clearLogsBtn">Clear Logs</button>' +
          '<button class="fh_appform_button_action col-xs-4" type="button" id="_sendLogsBtn">Send Logs</button>' +
          '</div>',
      log_panel: '<div class="hidden" id="_logsViewPanel">' +
          '<div class="col-xs-12"><button class="fh_appform_button_cancel btn btn-danger col-xs-12" id="_closeViewBtn">Close</button></div>' +
          '<div class="fh_appform_field_area" id="_logViewDiv"></div>' +
          '</div>',
      log_panel_css: '<style type="text/css">' +
          '#_logsViewPanel{' +
          'position:fixed;' +
          'left:10px;' +
          'top:10px;' +
          'right:10px;' +
          'bottom:10px;' +
          'padding:8px;' +
          'background: white;' +
          '-webkit-border-radius: 8px;' +
          'border-radius: 8px;' +
          'overflow: auto;' +
          '}' +
          '#_closeViewBtn{' +
          'border: 1px solid;' +
          'padding:3px;' +
          'margin-top:50px;' +
          '}' +
          '</style>'
  },
  "_myEvents": {
    "click #_viewLogsBtn": "viewLogs",
    "click #_clearLogsBtn": "clearLogs",
    "click #_sendLogsBtn": "sendLogs",
    "click #_closeViewBtn": "closeViewLogs",
    "click #fh_appform_show_deviceId": "showDeviceId"
  },
  showDeviceId: function(){
    alert($fh.forms.config.getDeviceId());  
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
  initialize: function(options) {
    this.options = options;
    this.events = _.extend({}, this._myEvents, this.events);
  },
  "render": function() {
      this.$el.html("");
      var props = $fh.forms.config.getConfig();


      var html = "";

      //camera options
      //submission
      //Debugging Options
      var camera_options_ele = $(this.templates.camera_options.header);
      var submission_options_ele = $(this.templates.submission_options.header);
      var debugging_options_ele = $(this.templates.debugging_options.header);

      _.each(this.templates.camera_options, function(val, key) {
          if (key !== 'header') {
              camera_options_ele.append(_.template(val, props));
          }
      });

      _.each(this.templates.submission_options, function(val, key) {
          if (key !== 'header') {
              submission_options_ele.append(_.template(val, props));
          }
      });

      _.each(this.templates.debugging_options, function(val, key) {
          if (key !== 'header') {
              debugging_options_ele.append(_.template(val, props));
          }
      });


      this.$el.append(camera_options_ele);
      this.$el.append(submission_options_ele);
      this.$el.append(debugging_options_ele);
      this.$el.append(this.templates.log_buttons);
      this.$el.append(this.templates.log_panel);
      this.$el.append(this.templates.log_panel_css);
      return this;
  },
  "save": function(cb) {
    $fh.forms.log.l("Saving config");
    var inputs = this.$el.find("input,select,textarea");

    if($fh.forms.config.editAllowed()){
      inputs.each(function() {
        var key = $(this).data().key;
        var val = $(this).val();

        if ($(this).attr("type") && $(this).attr("type").toLowerCase() === "checkbox") {
          if ($(this).attr("checked")) {
            val = true;
          } else {
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
var ConfigView = Backbone.View.extend({
  "templates": [
    '<div class="config_camera">' +
    '<fieldset>' +
    '<legend>Camera</legend>' +
    '<div class="form-group">' +
    '<label>Quality</label>' +
    '<input data-key="quality" value="<%= quality%>"/>' +
    '</div>' +
    '<div class="form-group">' +
    '<label>Target Width</label>' +
    '<input data-key="targetWidth" value="<%= targetWidth%>"/>' +
    '</div><div class="form-group">' +
    '<label>Target Height</label>' +
    '<input data-key="targetHeight" value="<%= targetHeight%>"/>' +
    '</div>' +
    '</fieldset>' +
    '</div>',
    '<div class="config_submission">' +
    '<fieldset>' +
    '<legend>Submission</legend>' +
    '<div class="form-group">' +
    '<label>Max Retries</label>' +
    '<input data-key="max_retries" value="<%= max_retries%>"/>' +
    '</div>' +
    '<div class="form-group">' +
    '<label>Timeout</label>' +
    '<input data-key="timeout" value="<%= timeout%>"/>' +
    '</div><div class="form-group">' +
    '<label>Min Sent Items to Save</label>' +
    '<input data-key="sent_save_min" value="<%= sent_save_min%>"/>' +
    '</div><div class="form-group">' +
    '<label>Max Sent Items to Save</label>' +
    '<input data-key="sent_save_max" value="<%= sent_save_max%>"/>' +
    '</div>' +
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
'<div class="config_debugging">'+
  '<fieldset>'+
    '<legend>Debugging</legend>'+
      '<div class="form-group">'+
        '<label>Log Enabled</label>'+
        '<input type="checkbox" data-key="logger"  <%= logger?"checked":"" %> value="true"/>'+
      '</div>'+
      '<div class="form-group">'+
        '<label>Log Level</label>'+
        '<select data-key="log_level">'+
          '<%'+
              'for (var i=0;i<log_levels.length;i++){'+
                'var val=log_levels[i];'+
                'var selected=(i==log_level)?"selected":"";'+
                '%>'+
                  '<option value="<%= i %>" <%= selected%>><%= val%></option>'+
                '<%'+
              '}'+
            '%>'+
        '</select>'+
      '</div><div class="form-group">'+
        '<label>Log Line Number</label>'+
        '<input data-key="log_line_limit" value="<%= log_line_limit%>"/>'+
      '</div><div class="form-group">'+
        '<label>Log Email Address</label>'+
        '<input data-key="log_email" value="<%= log_email%>"/>'+
      '</div>'+
      '<div class="log_buttons">'+
        '<button type="button" id="_viewLogsBtn">View Logs</button>'+
        '<button type="button" id="_clearLogsBtn">Clear Logs</button>'+
        '<button type="button" id="_sendLogsBtn">Send Logs</button>'+
      '</div>'+
  '</fieldset>'+
'</div>'+
'<div class="hidden" id="_logsViewPanel">'+
  '<div><span id="_closeViewBtn">Close</span></div>'+
  '<div id="_logViewDiv"></div>'+
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
    this.$el.html("");
    var props = this.getConfigModel().getProps();
    var html = _.template(this.templates.join(""), props);
    this.$el.append(html);
    return this;
  },
  "getConfigModel": function() {
    return $fh.forms.config;
  },
  "save": function(cb) {
    var inputs = this.$el.find("input,select,textarea");
    var data = {};

    inputs.each(function() {
      var key = $(this).data().key;
      var val = $(this).val();
      data[key] = val;
      if ($(this).attr("type") && $(this).attr("type").toLowerCase() == "checkbox") {
        if (!$(this).attr("checked")) {
          data[key] = false;
        }
      }
    });
    var model = this.getConfigModel();
    model.fromJSON(data);
    model.saveLocal(cb);
  }
});
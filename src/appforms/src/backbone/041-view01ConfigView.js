var ConfigView=Backbone.View.extend({
  "templates":[
  '<div class="config_camera">'+
  '<fieldset>'+
    '<legend>Camera</legend>'+
      '<div class="form-group">'+
        '<label>Quality</label>'+
        '<input data-key="quality" value="<%= quality%>"/>'+
      '</div>'+
      '<div class="form-group">'+
        '<label>Target Width</label>'+
        '<input data-key="targetWidth" value="<%= targetWidth%>"/>'+
      '</div><div class="form-group">'+
        '<label>Target Height</label>'+
        '<input data-key="targetHeight" value="<%= targetHeight%>"/>'+
      '</div>'+
  '</fieldset>'+
'</div>',
'<div class="config_submission">'+
  '<fieldset>'+
    '<legend>Submission</legend>'+
      '<div class="form-group">'+
        '<label>Max Retries</label>'+
        '<input data-key="max_retries" value="<%= max_retries%>"/>'+
      '</div>'+
      '<div class="form-group">'+
        '<label>Timeout</label>'+
        '<input data-key="timeout" value="<%= timeout%>"/>'+
      '</div><div class="form-group">'+
        '<label>Min Sent Items to Save</label>'+
        '<input data-key="sent_save_min" value="<%= sent_save_min%>"/>'+
      '</div><div class="form-group">'+
        '<label>Max Sent Items to Save</label>'+
        '<input data-key="sent_save_max" value="<%= sent_save_max%>"/>'+
      '</div>'+
  '</fieldset>'+
'</div>',
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
  '</fieldset>'+
'</div>'],
  "render":function(){
    this.$el.html("");
    var props=this.getConfigModel().getProps();
    var html=_.template(this.templates.join(""),props);
    this.$el.append(html);
    return this;
  },
  "getConfigModel":function(){
    return $fh.forms.config;
  },
  "save":function(cb){
    var inputs=this.$el.find("input,select,textarea");
    var data={};

    inputs.each(function(){
      var key=$(this).data().key;
      var val=$(this).val();
      data[key]=val;
      if ($(this).attr("type") && $(this).attr("type").toLowerCase()=="checkbox"){
        if (!$(this).attr("checked")){
          data[key]=false;
        }
      }
    });
    var model=this.getConfigModel();
    model.fromJSON(data);
    model.saveLocal(cb);
  }
});
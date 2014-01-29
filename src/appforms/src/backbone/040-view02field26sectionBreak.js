FieldSectionBreak = FieldView.extend({
  templates: {
    sectionBreak: '<div class="fh_appform_field_section_break_title"><%= sectionTitle %></div><div class="fh_appform_field_section_break_description"><%= sectionDescription%></div>'
  },
  renderEle:function(){
    this.$el.addClass("fh_appform_field_section_break");
    return _.template(this.templates.sectionBreak, {sectionTitle: this.model.getName(), sectionDescription: this.model.getHelpText()});
  },
  renderTitle: function(){
    return "";
  },
  "renderHelpText": function(){
    return "";
  }
});
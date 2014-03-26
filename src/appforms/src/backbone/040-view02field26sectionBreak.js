FieldSectionBreak = FieldView.extend({
  className: "fh_appform_section_break",
  templates: {
    sectionBreak: '<div class="fh_appform_section_title"><%= sectionTitle %></div><div class="fh_appform_section_description"><%= sectionDescription%></div>'
  },
  renderEle:function(){
    return _.template(this.templates.sectionBreak, {sectionTitle: this.model.getName(), sectionDescription: this.model.getHelpText()});
  },
  renderTitle: function(){
    return "";
  },
  "renderHelpText": function(){
    return "";
  }
});
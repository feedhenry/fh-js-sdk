FieldSectionBreak = FieldView.extend({
  className: "fh_appform_section_break col-xs-12",
  templates: {
      sectionBreak: '<div class="fh_appform_section_title"><h3 class="text-center"><%= sectionTitle %></h3></div><div class="fh_appform_section_description"><h4 class="text-center"><%= sectionDescription%></h4></div>'
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
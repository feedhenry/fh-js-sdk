FieldSectionBreak = FieldView.extend({
  className: "fh_appform_section_break panel panel-default",
  templates: {
    sectionBreak: '<div class="panel-heading"><%= sectionTitle %></div>'
  },
  renderEle: function() {
    return _.template(this.templates.sectionBreak)({
      sectionTitle: this.model.getName(),
      sectionDescription: this.model.getHelpText()
    });
  },
  renderTitle: function() {
    return "";
  },
  renderHelpText: function() {
    return "";
  }
});
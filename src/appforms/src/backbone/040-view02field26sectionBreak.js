FieldSectionBreak = FieldView.extend({
  className: "fh_appform_section_break panel panel-default",
  templates: {
      sectionBreak: '<div class="panel-heading"><%= sectionTitle %></div>'
  },
  renderEle:function(){
    return _.template(this.templates.sectionBreak)( {sectionTitle: this.model.getName(), sectionDescription: this.model.getHelpText()});
  },
  renderTitle: function(){
    return "";
  },
  renderHelpText: function(){
    return "";
  },
  onAddInput: function() {
    this.addElement();
    this.checkActionBar();
  },
  onRemoveInput: function() {
    this.removeElement();
    this.checkActionBar();
  },
  checkActionBar: function() {
    var curNum = this.curRepeat;
    var maxRepeat = this.maxRepeat;
    var minRepeat = this.initialRepeat;
    if (curNum < maxRepeat) {
      this.$fh_appform_fieldActionBar.find(this.addInputButtonClass).show();
    } else {
      this.$fh_appform_fieldActionBar.find(this.addInputButtonClass).hide();
    }

    if (curNum > minRepeat) {
      this.$fh_appform_fieldActionBar.find(this.removeInputButtonClass).show();
    } else {
      this.$fh_appform_fieldActionBar.find(this.removeInputButtonClass).hide();
    }
  },
  removeElement: function() {
    var curRepeat = this.curRepeat;
    var lastIndex = curRepeat - 1;
    this.getWrapper(lastIndex).remove();
    this.curRepeat--;
  },
  renderInput: function(index) {
    var fieldId = this.model.getFieldId();
    var type = this.getHTMLInputType();
    var repeatingClassName = this.model.isRepeating() ? this.repeatingClassName : this.nonRepeatingClassName;

    var inputEle = _.template(this.input);
    inputEle = inputEle({
      "fieldId": fieldId,
      "index": index,
      "inputType": type,
      "repeatingClassName": repeatingClassName,
      "value":this.model.getDefaultValue()
    });

    return $(inputEle);
  }
});
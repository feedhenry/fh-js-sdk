FieldCheckboxView = FieldView.extend({
  choice: '<input data-fieldId="<%= fieldId %>" <%= checked %> data-index="<%= index %>" name="<%= fieldId %>[]" type="checkbox" class="field checkbox fh_appform_field_input" value="<%= value %>" ><label class="choice" ><%= choice %></label><br/>',

  // contentChanged: function(e) {
  //   var self = this;
  //   this.dumpContent();
  //   this.getTopView().trigger('change:field');
  //   // var val = this.value();
  //   // if (this.model.validate(val) === true) {
  //   //   // self.model.set('value', val);
  //   //   this.options.formView.setInputValue(self.model.get("_id"), val);

  //   // } else {
  //   //   alert('Value not valid for this field: ' + this.model.validate(val));
  //   // }
  // },

  renderInput: function(index) {
    var subfields = this.model.getCheckBoxOptions();
    var fieldId=this.model.getFieldId();
    var self=this;
    var html="";
    $.each(subfields, function(i, subfield) {
      html+= _.template(self.choice, {
        "fieldId": fieldId,
        "index": index,
        "choice": subfield.label,
        "value": subfield.label,
        "checked": (subfield.selected) ? "checked='checked'" : ""
      });
    });
    return html;
  },
  // addValidationRules: function() {
  //   if (this.model.get('IsRequired') === '1') {
  //     // special required rule for checkbox fields
  //     this.$el.find('[name="' + this.model.get('_id') + '[]"]').first().rules('add', {
  //       "required": true,
  //       "minlength": 1,
  //       messages: {
  //         required: "Please choose at least 1"
  //       }
  //     });
  //   }
  // },

  // defaultValue: function() {
  //   var defaultValue = {};
  //   var subfields = this.model.get('SubFields');
  //   $.each(subfields, function(i, subfield) {
  //     if (subfield.DefaultVal && subfield.DefaultVal == 1) {
  //       defaultValue[subfield.ID] = subfield.Label;
  //     }
  //   });
  //   return defaultValue;
  // },
  valueFromElement: function(index) {
    var value=[];
    var wrapperObj=this.getWrapper(index);
    var checked=wrapperObj.find("input:checked");
    checked.each(function(){
      value.push($(this).val());
    });
    return value;
  },
  valuePopulateToElement: function(index,value) {
    var wrapperObj=this.getWrapper(index);
    if (!value || !value instanceof Array){
      return;
    }
    for (var i=0;i<value.length;i++){
      var v=value[i];
      wrapperObj.find("input[value='"+v+"']").attr("checked","checked");
    }
  }
});
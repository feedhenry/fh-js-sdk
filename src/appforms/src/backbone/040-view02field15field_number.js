FieldNumberView = FieldView.extend({
    type:"number",
    valueFromElement:function(index){
        var wrapperObj = this.getWrapper(index);
        return parseFloat(wrapperObj.find("input,select,textarea").val()) || 0;
    }
  // addValidationRules: function () {
  //   // call super
  //   FieldView.prototype.addValidationRules.call(this);

  //   // make sure value is a number
  //   this.$el.find('#' + this.model.get('_id')).rules("add", {
  //     "number": true
  //   });
  // }
});
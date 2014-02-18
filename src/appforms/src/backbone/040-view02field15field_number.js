FieldNumberView = FieldView.extend({
    type:"number",
    valueFromElement:function(index){
        var wrapperObj = this.getWrapper(index);
        return parseFloat(wrapperObj.find("input,select,textarea").val()) || 0;
    }
});
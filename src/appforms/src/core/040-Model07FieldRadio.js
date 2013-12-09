/**
 * extension of Field class to support radio field
 */

appForm.models.Field=(function(module){
    module.prototype.getRadioOption=function(){
        var def=this.getFieldDefinition();
        if (def["options"]){
            return def["options"];
        }else{
            throw ("Radio options definition is not found in field definition");
        }
    }
    return module;
})(appForm.models.Field ||{});

/**
 * Validate field value
 * extend this module to add more validations
 */
appForm.models=(function(module){
    var Model=appForm.models.Model;
    function FieldValidate(){
        Model.call(this,{
            "_type":"fieldvalidate"
        });

    }
    appForm.utils.extend(FieldValidate,Model);
    /**
     * Validate input value with field model input constraints  (not definitions)
     * @param  {[type]} fieldModel [description]
     * @return {[type]}            [description]
     */
    FieldValidate.prototype.validate=function(inputValue, fieldModel){
        var isRequired=fieldModel.isRequired();
        var validation=fieldModel.getFieldValidation();
        for (var act in validation){
            if (!this[act] || typeof this[act]!="function"){
                console.error("Validation method is not found:"+act);
            }else{
                var res=this[act](inputValue,validation[act]);
                if (res === true){
                    continue;
                }else{
                    return res;
                }
            }
        }
        return true;
    }

    FieldValidate.prototype.min=function(inputValue, targetVal){
        if (inputValue>=targetVal){
            return true;
        }else{
            return "Min value is "+targetVal+" while input value is "+inputValue;
        }
    }
    FieldValidate.prototype.max=function(inputValue, targetVal){
        if (inputValue<=targetVal){
            return true;
        }else{
            return "Max value is "+targetVal+" while input value is "+inputValue;
        }
    }

    FieldValidate.prototype.minSelected=function(inputValue, targetVal){
        if (typeof inputValue =="array" && inputValue.length>=targetVal){
            return true;
        }else{
            return "Min selected number is "+targetVal;
        }
    }
    FieldValidate.prototype.maxSelected=function(inputValue, targetVal){
        if (typeof inputValue =="array" && inputValue.length<=targetVal){
            return true;
        }else{
            return "Max selected number is "+targetVal;
        }
    }

    module.fieldValidate=new FieldValidate();

    return module;
})(appForm.models || {});
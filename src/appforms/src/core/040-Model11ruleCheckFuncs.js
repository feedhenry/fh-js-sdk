
appForm.models=(function(module){

    module.checkRule=checkRule;
    /**
     * check if an input value meet the expected val in certain condition.
     * @param  {[type]} condition [description]
     * @param  {[type]} expectVal [description]
     * @param  {[type]} InputVal  [description]
     * @return {[type]}           [description]
     */
    function checkRule(condition,expectVal,inputVal){
        var funcName=condition.toLowerCase().replace(/\s/g,"_");
        var func=rules[funcName];
        if (func){
            return func(expectVal,inputVal);
        }else{
            console.error("Rule func not found:"+funcName);
            return false;    
        }
        
    }

    var rules={
        "is_not":function(expectVal,inputVal){
            return expectVal!=inputVal;
        },
        "is_equal_to":function(expectVal,inputVal){
            return expectVal==inputVal;
        },
        "is_greater_than":function(expectVal,inputVal){
            return expectVal<inputVal;
        },
        "is_less_than":function(expectVal,inputVal){
            return expectVal>inputVal;
        },
        "is_on":function(expectVal,inputVal){
            try{
                 return new Date(expectVal).getTime() == new Date(inputVal).getTime();     
            }catch(e){
                console.error(e);
                return false;
            }
        },
        "is_before":function(expectVal,inputVal){
            try{
                 return new Date(expectVal).getTime() > new Date(inputVal).getTime();     
            }catch(e){
                console.error(e);
                return false;
            }
        },
        "is_after":function(expectVal,inputVal){
            try{
                 return new Date(expectVal).getTime() < new Date(inputVal).getTime();     
            }catch(e){
                console.error(e);
                return false;
            }   
        },
        "is":function(expectVal,inputVal){
            return expectVal==inputVal;
        },
        "contains":function(expectVal,inputVal){
            return inputVal.toString().indexOf(expectVal.toString())>-1;
        },
        "does_not_contain":function(expectVal,inputVal){
            return inputVal.toString().indexOf(expectVal.toString())==-1;   
        },
        "begins_with":function(expectVal,inputVal){
            return inputVal.toString().indexOf(expectVal.toString())==0;
        },
        "ends_with":function(expectVal,inputVal){
            return inputVal.toString().length == (inputVal.toString().indexOf(expectVal.toString())+expectVal.toString().length);
        }
    }

    return module;
})(appForm.models || {});
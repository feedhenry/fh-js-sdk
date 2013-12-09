/**
 * extension of Field class to support checkbox field
 */

appForm.models.Field = (function(module) {
    module.prototype.getCheckBoxOptions = function() {
        var def = this.getFieldDefinition();
        if (def["checkboxChoices"]) {
            return def["checkboxChoices"];
        } else {
            throw ("checkbox choice definition is not found in field definition");
        }
    }
    module.prototype.process_checkboxes = function(inputValue, cb) {
        if (!(inputValue instanceof Array)) {
            cb("the input value for processing checkbox field should be like [val1,val2]");
        } else {
            var obj = {
                "selections": inputValue
            };
            cb(null,obj);
        }
    }
    module.prototype.convert_checkboxes = function(value, cb) {
        var rtn = [];
        for (var i = 0; i < value.length; i++) {
            rtn.push(value[i].selections);
        }
        cb(null,rtn);
    }

    return module;
})(appForm.models.Field || {});
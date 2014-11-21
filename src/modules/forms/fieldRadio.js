/**
 * extension of Field class to support radio field
 */

var Model = require("./model");
var log = require("./log");
var config = require("./config");

function getRadioOption() {
    var def = this.getFieldDefinition();
    if (def.options) {
        return def.options;
    } else {
        log.e('Radio options definition is not found in field definition');
    }
}

module.exports = {
    getRadioOption: getRadioOption
};
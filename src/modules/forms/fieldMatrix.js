/**
 * extension of Field class to support matrix field
 */

var Model = require("./model");
var log = require("./log");
var config = require("./config");

function getMatrixRows() {
    var def = this.getFieldDefinition();
    if (def.rows) {
        return def.rows;
    } else {
        log.e('matrix rows definition is not found in field definition');
        return null;
    }
}

function getMatrixCols() {
    var def = this.getFieldDefinition();
    if (def.columns) {
        return def.columns;
    } else {
        log.e('matrix columns definition is not found in field definition');
        return null;
    }
}

module.exports = {
    getMatrixRows: getMatrixRows,
    getMatrixCols: getMatrixCols
};
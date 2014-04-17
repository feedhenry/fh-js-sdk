/**
 * extension of Field class to support matrix field
 */
appForm.models.Field = function (module) {
  module.prototype.getMatrixRows = function () {
    var def = this.getFieldDefinition();
    if (def.rows) {
      return def.rows;
    } else {
      throw 'matrix rows definition is not found in field definition';
    }
  };
  module.prototype.getMatrixCols = function () {
    var def = this.getFieldDefinition();
    if (def.columns) {
      return def.columns;
    } else {
      throw 'matrix columns definition is not found in field definition';
    }
  };
  return module;
}(appForm.models.Field || {});
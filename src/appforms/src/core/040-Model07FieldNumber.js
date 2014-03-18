/**
 * extension of Field class to support number field
 */
appForm.models.Field = function (module) {
  /**
     * Format: [{lat: number, long: number}]
     * @param  {[type]} inputValues [description]
     * @return {[type]}             [description]
     */
  module.prototype.process_number = function (params, cb) {
    var inputValue = params.value;
    var ret = parseFloat(inputValue) || 0;
    cb(null, ret);
  };
  return module;
}(appForm.models.Field || {});

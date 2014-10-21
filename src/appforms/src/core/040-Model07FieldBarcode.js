/**
 * extension of Field class to support barcode field
 */
appForm.models.Field = function (module) {

  //Processing barcode values to the submission format
  //
  module.prototype.process_barcode = function (params, cb) {
    var inputValue = params.value || {};

    /**
     * Barcode value:
     *
     * {
     *   text: "<<Value of the scanned barcode>>",
     *   format: "<<Format of the scanned barcode>>"
     * }
     */
    if(typeof(inputValue.text) === "string" && typeof(inputValue.format) === "string"){
      return cb(null, {text: inputValue.text, format: inputValue.format});
    } else {
      return cb("Invalid barcode parameters.");
    }
  };
  return module;
}(appForm.models.Field || {});

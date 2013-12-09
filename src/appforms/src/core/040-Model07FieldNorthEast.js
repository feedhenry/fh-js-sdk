/**
 * extension of Field class to support north east field
 */

appForm.models.Field = (function(module) {
    /**
     * Format: 
     *  [{
         "zone": "11U",
         "eastings": "594934",
         "northings": "5636174"
      }, {
         "zone": "12U",
         "eastings": "594934",
         "northings": "5636174"
      }]
     * @param  {[type]} inputValues [description]
     * @return {[type]}             [description]
     */
    module.prototype.process_locationNorthEast = function(inputValue, cb) {
        if (!inputValue["zone"] || !inputValue["eastings"] || !inputValue["northings"]) {
            cb("the input values for northeast field is {zone: text, eastings: text, northings:text}");
        } else {
            var obj = {
                "zone": inputValue.zone,
                "eastings": inputValue.eastings,
                "northings": inputValue.northings
            }
            cb(null,obj);
        }
    }
    return module;
})(appForm.models.Field || {});
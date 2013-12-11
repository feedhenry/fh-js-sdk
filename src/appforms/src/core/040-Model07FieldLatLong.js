/**
 * extension of Field class to support latitude longitude field
 */

appForm.models.Field = (function(module) {
    /**
     * Format: [{lat: number, long: number}]
     * @param  {[type]} inputValues [description]
     * @return {[type]}             [description]
     */
    module.prototype.process_locationLatLong = function(inputValue, cb) {
        if (!inputValue["lat"] || !inputValue["long"]) {
            cb("the input values for latlong field is {lat: number, long: number}");
        } else {
            var obj = {
                "lat": inputValue.lat,
                "long": inputValue.long
            }
            cb(null,obj);
        }
    }
    return module;
})(appForm.models.Field || {});
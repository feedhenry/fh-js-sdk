/**
 * extension of Field class to support latitude longitude field
 */
appForm.models.Field = function (module) {
  /**
     * Format: [{lat: number, long: number}]
     * @param  {[type]} inputValues [description]
     * @return {[type]}             [description]
     */
  module.prototype.process_location = function (params, cb) {
    var inputValue = params.value;
    var def = this.getFieldDefinition();
    var obj={};
    switch (def.locationUnit) {
    case 'latLong':
      if (!inputValue.lat || !inputValue["long"]) {
        cb('the input values for latlong field is {lat: number, long: number}');
      } else {
        obj = {
            'lat': inputValue.lat,
            'long': inputValue["long"]
          };
        cb(null, obj);
      }
      break;
    case 'eastnorth':
      if (!inputValue.zone || !inputValue.eastings || !inputValue.northings) {
        cb('the input values for northeast field is {zone: text, eastings: text, northings:text}');
      } else {
        obj = {
            'zone': inputValue.zone,
            'eastings': inputValue.eastings,
            'northings': inputValue.northings
          };
        cb(null, obj);
      }
      break;
    default:
      cb('Invalid subtype type of location field, allowed types: latLong and eastnorth, was: ' + def.locationUnit);
      break;
    }
  };
  return module;
}(appForm.models.Field || {});
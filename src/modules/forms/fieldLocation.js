/**
 * extension of Field class to support latitude longitude field
 */

var Model = require("./model");
var log = require("./log");
var config = require("./config");

function process_location(params, cb) {
    var inputValue = params.value;
    var def = this.getFieldDefinition();
    var obj = {};
    switch (def.locationUnit) {
        case 'latlong':
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
            cb('Invalid subtype type of location field, allowed types: latlong and eastnorth, was: ' + def.locationUnit);
            break;
    }
}

module.exports = {
    process_location: process_location
};

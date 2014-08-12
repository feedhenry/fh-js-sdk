/**
 * FeedHenry License
 */

//if (typeof window =="undefined"){
//    var window={};
//}
//this is a partial js file which defines the start of appform SDK closure
(function(_scope){
    
    //start module

/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/*  Geodesy representation conversion functions (c) Chris Veness 2002-2012                        */
/*   - www.movable-type.co.uk/scripts/latlong.html                                                */
/*                                                                                                */
/*  Sample usage:                                                                                 */
/*    var lat = Geo.parseDMS('51Â° 28â€² 40.12â€³ N');                                                 */
/*    var lon = Geo.parseDMS('000Â° 00â€² 05.31â€³ W');                                                */
/*    var p1 = new LatLon(lat, lon);                                                              */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
var Geo = {};
// Geo namespace, representing static class
/**
 * Parses string representing degrees/minutes/seconds into numeric degrees
 *
 * This is very flexible on formats, allowing signed decimal degrees, or deg-min-sec optionally
 * suffixed by compass direction (NSEW). A variety of separators are accepted (eg 3Âº 37' 09"W) 
 * or fixed-width format without separators (eg 0033709W). Seconds and minutes may be omitted. 
 * (Note minimal validation is done).
 *
 * @param   {String|Number} dmsStr: Degrees or deg/min/sec in variety of formats
 * @returns {Number} Degrees as decimal number
 * @throws  {TypeError} dmsStr is an object, perhaps DOM object without .value?
 */
Geo.parseDMS = function (dmsStr) {
  if (typeof deg == 'object')
    throw new TypeError('Geo.parseDMS - dmsStr is [DOM?] object');
  // check for signed decimal degrees without NSEW, if so return it directly
  if (typeof dmsStr === 'number' && isFinite(dmsStr))
    return Number(dmsStr);
  // strip off any sign or compass dir'n & split out separate d/m/s
  var dms = String(dmsStr).trim().replace(/^-/, '').replace(/[NSEW]$/i, '').split(/[^0-9.,]+/);
  if (dms[dms.length - 1] === '')
    dms.splice(dms.length - 1);
  // from trailing symbol
  if (dms === '')
    return NaN;
  // and convert to decimal degrees...
  var deg;
  switch (dms.length) {
  case 3:
    // interpret 3-part result as d/m/s
    deg = dms[0] / 1 + dms[1] / 60 + dms[2] / 3600;
    break;
  case 2:
    // interpret 2-part result as d/m
    deg = dms[0] / 1 + dms[1] / 60;
    break;
  case 1:
    // just d (possibly decimal) or non-separated dddmmss
    deg = dms[0];
    // check for fixed-width unseparated format eg 0033709W
    //if (/[NS]/i.test(dmsStr)) deg = '0' + deg;  // - normalise N/S to 3-digit degrees
    //if (/[0-9]{7}/.test(deg)) deg = deg.slice(0,3)/1 + deg.slice(3,5)/60 + deg.slice(5)/3600; 
    break;
  default:
    return NaN;
  }
  if (/^-|[WS]$/i.test(dmsStr.trim()))
    deg = -deg;
  // take '-', west and south as -ve
  return Number(deg);
};
/**
 * Convert decimal degrees to deg/min/sec format
 *  - degree, prime, double-prime symbols are added, but sign is discarded, though no compass
 *    direction is added
 *
 * @private
 * @param   {Number} deg: Degrees
 * @param   {String} [format=dms]: Return value as 'd', 'dm', 'dms'
 * @param   {Number} [dp=0|2|4]: No of decimal places to use - default 0 for dms, 2 for dm, 4 for d
 * @returns {String} deg formatted as deg/min/secs according to specified format
 * @throws  {TypeError} deg is an object, perhaps DOM object without .value?
 */
Geo.toDMS = function (deg, format, dp) {
  if (typeof deg == 'object')
    throw new TypeError('Geo.toDMS - deg is [DOM?] object');
  if (isNaN(deg))
    return null;
  // give up here if we can't make a number from deg
  // default values
  if (typeof format == 'undefined')
    format = 'dms';
  if (typeof dp == 'undefined') {
    switch (format) {
    case 'd':
      dp = 4;
      break;
    case 'dm':
      dp = 2;
      break;
    case 'dms':
      dp = 0;
      break;
    default:
      format = 'dms';
      dp = 0;  // be forgiving on invalid format
    }
  }
  deg = Math.abs(deg);
  // (unsigned result ready for appending compass dir'n)
  var d;
  var m;
  var s;
  switch (format) {
  case 'd':
    d = deg.toFixed(dp);
    // round degrees
    if (d < 100)
      d = '0' + d;
    // pad with leading zeros
    if (d < 10)
      d = '0' + d;
    var dms = d + '\xb0';
    // add Âº symbol
    break;
  case 'dm':
    var min = (deg * 60).toFixed(dp);
    // convert degrees to minutes & round
     d = Math.floor(min / 60);
    // get component deg/min
     m = (min % 60).toFixed(dp);
    // pad with trailing zeros
    if (d < 100)
      d = '0' + d;
    // pad with leading zeros
    if (d < 10)
      d = '0' + d;
    if (m < 10)
      m = '0' + m;
    dms = d + '\xb0' + m + '\u2032';
    // add Âº, ' symbols
    break;
  case 'dms':
    var sec = (deg * 3600).toFixed(dp);
    // convert degrees to seconds & round
     d = Math.floor(sec / 3600);
    // get component deg/min/sec
     m = Math.floor(sec / 60) % 60;
     s = (sec % 60).toFixed(dp);
    // pad with trailing zeros
    if (d < 100)
      d = '0' + d;
    // pad with leading zeros
    if (d < 10)
      d = '0' + d;
    if (m < 10)
      m = '0' + m;
    if (s < 10)
      s = '0' + s;
    dms = d + '\xb0' + m + '\u2032' + s + '\u2033';
    // add Âº, ', " symbols
    break;
  }
  return dms;
};
/**
 * Convert numeric degrees to deg/min/sec latitude (suffixed with N/S)
 *
 * @param   {Number} deg: Degrees
 * @param   {String} [format=dms]: Return value as 'd', 'dm', 'dms'
 * @param   {Number} [dp=0|2|4]: No of decimal places to use - default 0 for dms, 2 for dm, 4 for d
 * @returns {String} Deg/min/seconds
 */
Geo.toLat = function (deg, format, dp) {
  var lat = Geo.toDMS(deg, format, dp);
  return lat == null ? '\xe2\u20ac\u201c' : lat.slice(1) + (deg < 0 ? 'S' : 'N');  // knock off initial '0' for lat!
};
/**
 * Convert numeric degrees to deg/min/sec longitude (suffixed with E/W)
 *
 * @param   {Number} deg: Degrees
 * @param   {String} [format=dms]: Return value as 'd', 'dm', 'dms'
 * @param   {Number} [dp=0|2|4]: No of decimal places to use - default 0 for dms, 2 for dm, 4 for d
 * @returns {String} Deg/min/seconds
 */
Geo.toLon = function (deg, format, dp) {
  var lon = Geo.toDMS(deg, format, dp);
  return lon == null ? '\xe2\u20ac\u201c' : lon + (deg < 0 ? 'W' : 'E');
};
/**
 * Convert numeric degrees to deg/min/sec as a bearing (0Âº..360Âº)
 *
 * @param   {Number} deg: Degrees
 * @param   {String} [format=dms]: Return value as 'd', 'dm', 'dms'
 * @param   {Number} [dp=0|2|4]: No of decimal places to use - default 0 for dms, 2 for dm, 4 for d
 * @returns {String} Deg/min/seconds
 */
Geo.toBrng = function (deg, format, dp) {
  deg = (Number(deg) + 360) % 360;
  // normalise -ve values to 180Âº..360Âº
  var brng = Geo.toDMS(deg, format, dp);
  return brng == null ? '\xe2\u20ac\u201c' : brng.replace('360', '0');  // just in case rounding took us up to 360Âº!
};
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
if (!window.console)
  window.console = {
    log: function () {
    }
  };
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/*  Latitude/longitude spherical geodesy formulae & scripts (c) Chris Veness 2002-2012            */
/*   - www.movable-type.co.uk/scripts/latlong.html                                                */
/*                                                                                                */
/*  Sample usage:                                                                                 */
/*    var p1 = new LatLon(51.5136, -0.0983);                                                      */
/*    var p2 = new LatLon(51.4778, -0.0015);                                                      */
/*    var dist = p1.distanceTo(p2);          // in km                                             */
/*    var brng = p1.bearingTo(p2);           // in degrees clockwise from north                   */
/*    ... etc                                                                                     */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/*  Note that minimal error checking is performed in this example code!                           */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/**
 * @requires Geo
 */
/**
 * Creates a point on the earth's surface at the supplied latitude / longitude
 *
 * @constructor
 * @param {Number} lat: latitude in numeric degrees
 * @param {Number} lon: longitude in numeric degrees
 * @param {Number} [rad=6371]: radius of earth if different value is required from standard 6,371km
 */
function LatLon(lat, lon, rad) {
  if (typeof rad == 'undefined')
    rad = 6371;
  // earth's mean radius in km
  // only accept numbers or valid numeric strings
  this._lat = typeof lat === 'number' ? lat : typeof lat === 'string' && lat.trim() !== '' ? +lat : NaN;
  this._lon = typeof lon === 'number' ? lon : typeof lon === 'string' && lon.trim() !=='' ? +lon : NaN;
  this._radius = typeof rad === 'number' ? rad : typeof rad === 'string' && trim(lon) !== '' ? +rad : NaN;
}
/**
 * Returns the distance from this point to the supplied point, in km 
 * (using Haversine formula)
 *
 * from: Haversine formula - R. W. Sinnott, "Virtues of the Haversine",
 *       Sky and Telescope, vol 68, no 2, 1984
 *
 * @param   {LatLon} point: Latitude/longitude of destination point
 * @param   {Number} [precision=4]: no of significant digits to use for returned value
 * @returns {Number} Distance in km between this point and destination point
 */
LatLon.prototype.distanceTo = function (point, precision) {
  // default 4 sig figs reflects typical 0.3% accuracy of spherical model
  if (typeof precision == 'undefined')
    precision = 4;
  var R = this._radius;
  var lat1 = this._lat.toRad(), lon1 = this._lon.toRad();
  var lat2 = point._lat.toRad(), lon2 = point._lon.toRad();
  var dLat = lat2 - lat1;
  var dLon = lon2 - lon1;
  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c;
  return d.toPrecisionFixed(precision);
};
/**
 * Returns the (initial) bearing from this point to the supplied point, in degrees
 *   see http://williams.best.vwh.net/avform.htm#Crs
 *
 * @param   {LatLon} point: Latitude/longitude of destination point
 * @returns {Number} Initial bearing in degrees from North
 */
LatLon.prototype.bearingTo = function (point) {
  var lat1 = this._lat.toRad(), lat2 = point._lat.toRad();
  var dLon = (point._lon - this._lon).toRad();
  var y = Math.sin(dLon) * Math.cos(lat2);
  var x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  var brng = Math.atan2(y, x);
  return (brng.toDeg() + 360) % 360;
};
/**
 * Returns final bearing arriving at supplied destination point from this point; the final bearing 
 * will differ from the initial bearing by varying degrees according to distance and latitude
 *
 * @param   {LatLon} point: Latitude/longitude of destination point
 * @returns {Number} Final bearing in degrees from North
 */
LatLon.prototype.finalBearingTo = function (point) {
  // get initial bearing from supplied point back to this point...
  var lat1 = point._lat.toRad(), lat2 = this._lat.toRad();
  var dLon = (this._lon - point._lon).toRad();
  var y = Math.sin(dLon) * Math.cos(lat2);
  var x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  var brng = Math.atan2(y, x);
  // ... & reverse it by adding 180Â°
  return (brng.toDeg() + 180) % 360;
};
/**
 * Returns the midpoint between this point and the supplied point.
 *   see http://mathforum.org/library/drmath/view/51822.html for derivation
 *
 * @param   {LatLon} point: Latitude/longitude of destination point
 * @returns {LatLon} Midpoint between this point and the supplied point
 */
LatLon.prototype.midpointTo = function (point) {
  var lat1 = this._lat.toRad();
  var lon1 = this._lon.toRad();
  var lat2 = point._lat.toRad();
  var dLon = (point._lon - this._lon).toRad();
  var Bx = Math.cos(lat2) * Math.cos(dLon);
  var By = Math.cos(lat2) * Math.sin(dLon);
  var lat3 = Math.atan2(Math.sin(lat1) + Math.sin(lat2), Math.sqrt((Math.cos(lat1) + Bx) * (Math.cos(lat1) + Bx) + By * By));
  var lon3 = lon1 + Math.atan2(By, Math.cos(lat1) + Bx);
  lon3 = (lon3 + 3 * Math.PI) % (2 * Math.PI) - Math.PI;
  // normalise to -180..+180Âº
  return new LatLon(lat3.toDeg(), lon3.toDeg());
};
/**
 * Returns the destination point from this point having travelled the given distance (in km) on the 
 * given initial bearing (bearing may vary before destination is reached)
 *
 *   see http://williams.best.vwh.net/avform.htm#LL
 *
 * @param   {Number} brng: Initial bearing in degrees
 * @param   {Number} dist: Distance in km
 * @returns {LatLon} Destination point
 */
LatLon.prototype.destinationPoint = function (brng, dist) {
  dist = typeof dist === 'number' ? dist : typeof dist === 'string' && dist.trim() !== '' ? +dist : NaN;
  dist = dist / this._radius;
  // convert dist to angular distance in radians
  brng = brng.toRad();
  // 
  var lat1 = this._lat.toRad(), lon1 = this._lon.toRad();
  var lat2 = Math.asin(Math.sin(lat1) * Math.cos(dist) + Math.cos(lat1) * Math.sin(dist) * Math.cos(brng));
  var lon2 = lon1 + Math.atan2(Math.sin(brng) * Math.sin(dist) * Math.cos(lat1), Math.cos(dist) - Math.sin(lat1) * Math.sin(lat2));
  lon2 = (lon2 + 3 * Math.PI) % (2 * Math.PI) - Math.PI;
  // normalise to -180..+180Âº
  return new LatLon(lat2.toDeg(), lon2.toDeg());
};
/**
 * Returns the point of intersection of two paths defined by point and bearing
 *
 *   see http://williams.best.vwh.net/avform.htm#Intersection
 *
 * @param   {LatLon} p1: First point
 * @param   {Number} brng1: Initial bearing from first point
 * @param   {LatLon} p2: Second point
 * @param   {Number} brng2: Initial bearing from second point
 * @returns {LatLon} Destination point (null if no unique intersection defined)
 */
LatLon.intersection = function (p1, brng1, p2, brng2) {
  brng1 = typeof brng1 === 'number' ? brng1 : typeof brng1 === 'string' && trim(brng1) !== '' ? +brng1 : NaN;
  brng2 = typeof brng2 === 'number' ? brng2 : typeof brng2 === 'string' && trim(brng2) !== '' ? +brng2 : NaN;
  var lat1 = p1._lat.toRad(), lon1 = p1._lon.toRad();
  var lat2 = p2._lat.toRad(), lon2 = p2._lon.toRad();
  var brng13 = brng1.toRad(), brng23 = brng2.toRad();
  var dLat = lat2 - lat1, dLon = lon2 - lon1;
  var dist12 = 2 * Math.asin(Math.sqrt(Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2)));
  var brng12;
  var brng21;
  var alpha1;
  var alpha2;
  if (dist12 === 0)
    return null;
  // initial/final bearings between points
  var brngA = Math.acos((Math.sin(lat2) - Math.sin(lat1) * Math.cos(dist12)) / (Math.sin(dist12) * Math.cos(lat1)));
  if (isNaN(brngA))
    brngA = 0;
  // protect against rounding
  var brngB = Math.acos((Math.sin(lat1) - Math.sin(lat2) * Math.cos(dist12)) / (Math.sin(dist12) * Math.cos(lat2)));
  if (Math.sin(lon2 - lon1) > 0) {
    brng12 = brngA;
    brng21 = 2 * Math.PI - brngB;
  } else {
    brng12 = 2 * Math.PI - brngA;
    brng21 = brngB;
  }
  alpha1 = (brng13 - brng12 + Math.PI) % (2 * Math.PI) - Math.PI;
  // angle 2-1-3
  alpha2 = (brng21 - brng23 + Math.PI) % (2 * Math.PI) - Math.PI;
  // angle 1-2-3
  if (Math.sin(alpha1) === 0 && Math.sin(alpha2) === 0)
    return null;
  // infinite intersections
  if (Math.sin(alpha1) * Math.sin(alpha2) < 0)
    return null;
  // ambiguous intersection
  //alpha1 = Math.abs(alpha1);
  //alpha2 = Math.abs(alpha2);
  // ... Ed Williams takes abs of alpha1/alpha2, but seems to break calculation?
  var alpha3 = Math.acos(-Math.cos(alpha1) * Math.cos(alpha2) + Math.sin(alpha1) * Math.sin(alpha2) * Math.cos(dist12));
  var dist13 = Math.atan2(Math.sin(dist12) * Math.sin(alpha1) * Math.sin(alpha2), Math.cos(alpha2) + Math.cos(alpha1) * Math.cos(alpha3));
  var lat3 = Math.asin(Math.sin(lat1) * Math.cos(dist13) + Math.cos(lat1) * Math.sin(dist13) * Math.cos(brng13));
  var dLon13 = Math.atan2(Math.sin(brng13) * Math.sin(dist13) * Math.cos(lat1), Math.cos(dist13) - Math.sin(lat1) * Math.sin(lat3));
  var lon3 = lon1 + dLon13;
  lon3 = (lon3 + 3 * Math.PI) % (2 * Math.PI) - Math.PI;
  // normalise to -180..+180Âº
  return new LatLon(lat3.toDeg(), lon3.toDeg());
};
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/**
 * Returns the distance from this point to the supplied point, in km, travelling along a rhumb line
 *
 *   see http://williams.best.vwh.net/avform.htm#Rhumb
 *
 * @param   {LatLon} point: Latitude/longitude of destination point
 * @returns {Number} Distance in km between this point and destination point
 */
LatLon.prototype.rhumbDistanceTo = function (point) {
  var R = this._radius;
  var lat1 = this._lat.toRad(), lat2 = point._lat.toRad();
  var dLat = (point._lat - this._lat).toRad();
  var dLon = Math.abs(point._lon - this._lon).toRad();
  var dPhi = Math.log(Math.tan(lat2 / 2 + Math.PI / 4) / Math.tan(lat1 / 2 + Math.PI / 4));
  var q = isFinite(dLat / dPhi) ? dLat / dPhi : Math.cos(lat1);
  // E-W line gives dPhi=0
  // if dLon over 180Â° take shorter rhumb across anti-meridian:
  if (Math.abs(dLon) > Math.PI) {
    dLon = dLon > 0 ? -(2 * Math.PI - dLon) : 2 * Math.PI + dLon;
  }
  var dist = Math.sqrt(dLat * dLat + q * q * dLon * dLon) * R;
  return dist.toPrecisionFixed(4);  // 4 sig figs reflects typical 0.3% accuracy of spherical model
};
/**
 * Returns the bearing from this point to the supplied point along a rhumb line, in degrees
 *
 * @param   {LatLon} point: Latitude/longitude of destination point
 * @returns {Number} Bearing in degrees from North
 */
LatLon.prototype.rhumbBearingTo = function (point) {
  var lat1 = this._lat.toRad(), lat2 = point._lat.toRad();
  var dLon = (point._lon - this._lon).toRad();
  var dPhi = Math.log(Math.tan(lat2 / 2 + Math.PI / 4) / Math.tan(lat1 / 2 + Math.PI / 4));
  if (Math.abs(dLon) > Math.PI)
    dLon = dLon > 0 ? -(2 * Math.PI - dLon) : 2 * Math.PI + dLon;
  var brng = Math.atan2(dLon, dPhi);
  return (brng.toDeg() + 360) % 360;
};
/**
 * Returns the destination point from this point having travelled the given distance (in km) on the 
 * given bearing along a rhumb line
 *
 * @param   {Number} brng: Bearing in degrees from North
 * @param   {Number} dist: Distance in km
 * @returns {LatLon} Destination point
 */
LatLon.prototype.rhumbDestinationPoint = function (brng, dist) {
  var R = this._radius;
  var d = parseFloat(dist) / R;
  // d = angular distance covered on earthâ€™s surface
  var lat1 = this._lat.toRad(), lon1 = this._lon.toRad();
  brng = brng.toRad();
  var dLat = d * Math.cos(brng);
  // nasty kludge to overcome ill-conditioned results around parallels of latitude:
  if (Math.abs(dLat) < 1e-10)
    dLat = 0;
  // dLat < 1 mm
  var lat2 = lat1 + dLat;
  var dPhi = Math.log(Math.tan(lat2 / 2 + Math.PI / 4) / Math.tan(lat1 / 2 + Math.PI / 4));
  var q = isFinite(dLat / dPhi) ? dLat / dPhi : Math.cos(lat1);
  // E-W line gives dPhi=0
  var dLon = d * Math.sin(brng) / q;
  // check for some daft bugger going past the pole, normalise latitude if so
  if (Math.abs(lat2) > Math.PI / 2)
    lat2 = lat2 > 0 ? Math.PI - lat2 : -Math.PI - lat2;
  lon2 = (lon1 + dLon + 3 * Math.PI) % (2 * Math.PI) - Math.PI;
  return new LatLon(lat2.toDeg(), lon2.toDeg());
};
/**
 * Returns the loxodromic midpoint (along a rhumb line) between this point and the supplied point.
 *   see http://mathforum.org/kb/message.jspa?messageID=148837
 *
 * @param   {LatLon} point: Latitude/longitude of destination point
 * @returns {LatLon} Midpoint between this point and the supplied point
 */
LatLon.prototype.rhumbMidpointTo = function (point) {
  var lat1 = this._lat.toRad();
  var lon1 = this._lon.toRad();
  var lat2 = point._lat.toRad();
  var lon2 = point._lon.toRad();
  if (Math.abs(lon2 - lon1) > Math.PI)
    lon1 += 2 * Math.PI;
  // crossing anti-meridian
  var lat3 = (lat1 + lat2) / 2;
  var f1 = Math.tan(Math.PI / 4 + lat1 / 2);
  var f2 = Math.tan(Math.PI / 4 + lat2 / 2);
  var f3 = Math.tan(Math.PI / 4 + lat3 / 2);
  var lon3 = ((lon2 - lon1) * Math.log(f3) + lon1 * Math.log(f2) - lon2 * Math.log(f1)) / Math.log(f2 / f1);
  if (!isFinite(lon3))
    lon3 = (lon1 + lon2) / 2;
  // parallel of latitude
  lon3 = (lon3 + 3 * Math.PI) % (2 * Math.PI) - Math.PI;
  // normalise to -180..+180Âº
  return new LatLon(lat3.toDeg(), lon3.toDeg());
};
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/**
 * Returns the latitude of this point; signed numeric degrees if no format, otherwise format & dp 
 * as per Geo.toLat()
 *
 * @param   {String} [format]: Return value as 'd', 'dm', 'dms'
 * @param   {Number} [dp=0|2|4]: No of decimal places to display
 * @returns {Number|String} Numeric degrees if no format specified, otherwise deg/min/sec
 */
LatLon.prototype.lat = function (format, dp) {
  if (typeof format == 'undefined')
    return this._lat;
  return Geo.toLat(this._lat, format, dp);
};
/**
 * Returns the longitude of this point; signed numeric degrees if no format, otherwise format & dp 
 * as per Geo.toLon()
 *
 * @param   {String} [format]: Return value as 'd', 'dm', 'dms'
 * @param   {Number} [dp=0|2|4]: No of decimal places to display
 * @returns {Number|String} Numeric degrees if no format specified, otherwise deg/min/sec
 */
LatLon.prototype.lon = function (format, dp) {
  if (typeof format == 'undefined')
    return this._lon;
  return Geo.toLon(this._lon, format, dp);
};
/**
 * Returns a string representation of this point; format and dp as per lat()/lon()
 *
 * @param   {String} [format]: Return value as 'd', 'dm', 'dms'
 * @param   {Number} [dp=0|2|4]: No of decimal places to display
 * @returns {String} Comma-separated latitude/longitude
 */
LatLon.prototype.toString = function (format, dp) {
  if (typeof format == 'undefined')
    format = 'dms';
  return Geo.toLat(this._lat, format, dp) + ', ' + Geo.toLon(this._lon, format, dp);
};
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
// ---- extend Number object with methods for converting degrees/radians
/** Converts numeric degrees to radians */
if (typeof Number.prototype.toRad == 'undefined') {
  Number.prototype.toRad = function () {
    return this * Math.PI / 180;
  };
}
/** Converts radians to numeric (signed) degrees */
if (typeof Number.prototype.toDeg == 'undefined') {
  Number.prototype.toDeg = function () {
    return this * 180 / Math.PI;
  };
}
/** 
 * Formats the significant digits of a number, using only fixed-point notation (no exponential)
 * 
 * @param   {Number} precision: Number of significant digits to appear in the returned string
 * @returns {String} A string representation of number which contains precision significant digits
 */
if (typeof Number.prototype.toPrecisionFixed == 'undefined') {
  Number.prototype.toPrecisionFixed = function (precision) {
    // use standard toPrecision method
    var n = this.toPrecision(precision);
    // ... but replace +ve exponential format with trailing zeros
    n = n.replace(/(.+)e\+(.+)/, function (n, sig, exp) {
      sig = sig.replace(/\./, '');
      // remove decimal from significand
      l = sig.length - 1;
      while (exp-- > l)
        sig = sig + '0';
      // append zeros from exponent
      return sig;
    });
    // ... and replace -ve exponential format with leading zeros
    n = n.replace(/(.+)e-(.+)/, function (n, sig, exp) {
      sig = sig.replace(/\./, '');
      // remove decimal from significand
      while (exp-- > 1)
        sig = '0' + sig;
      // prepend zeros from exponent
      return '0.' + sig;
    });
    return n;
  };
}
/** Trims whitespace from string (q.v. blog.stevenlevithan.com/archives/faster-trim-javascript) */
if (typeof String.prototype.trim == 'undefined') {
  String.prototype.trim = function () {
    return String(this).replace(/^\s\s*/, '').replace(/\s\s*$/, '');
  };
}
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
if (!window.console)
  window.console = {
    log: function () {
    }
  };
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/*  Ordnance Survey Grid Reference functions  (c) Chris Veness 2005-2012                          */
/*   - www.movable-type.co.uk/scripts/gridref.js                                                  */
/*   - www.movable-type.co.uk/scripts/latlon-gridref.html                                         */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/**
 * @requires LatLon
 */
/**
 * Creates a OsGridRef object
 *
 * @constructor
 * @param {Number} easting:  Easting in metres from OS false origin
 * @param {Number} northing: Northing in metres from OS false origin
 */
function OsGridRef(easting, northing) {
  this.easting = parseInt(easting, 10);
  this.northing = parseInt(northing, 10);
}
/**
 * Convert (OSGB36) latitude/longitude to Ordnance Survey grid reference easting/northing coordinate
 *
 * @param {LatLon} point: OSGB36 latitude/longitude
 * @return {OsGridRef} OS Grid Reference easting/northing
 */
OsGridRef.latLongToOsGrid = function (point) {
  var lat = point.lat().toRad();
  var lon = point.lon().toRad();
  var a = 6377563.396, b = 6356256.91;
  // Airy 1830 major & minor semi-axes
  var F0 = 0.9996012717;
  // NatGrid scale factor on central meridian
  var lat0 = (49).toRad(),
    lon0 = (-2).toRad();
  // NatGrid true origin is 49ºN,2ºW
  var N0 = -100000, E0 = 400000;
  // northing & easting of true origin, metres
  var e2 = 1 - b * b / (a * a);
  // eccentricity squared
  var n = (a - b) / (a + b), n2 = n * n, n3 = n * n * n;
  var cosLat = Math.cos(lat), sinLat = Math.sin(lat);
  var nu = a * F0 / Math.sqrt(1 - e2 * sinLat * sinLat);
  // transverse radius of curvature
  var rho = a * F0 * (1 - e2) / Math.pow(1 - e2 * sinLat * sinLat, 1.5);
  // meridional radius of curvature
  var eta2 = nu / rho - 1;
  var Ma = (1 + n + 5 / 4 * n2 + 5 / 4 * n3) * (lat - lat0);
  var Mb = (3 * n + 3 * n * n + 21 / 8 * n3) * Math.sin(lat - lat0) * Math.cos(lat + lat0);
  var Mc = (15 / 8 * n2 + 15 / 8 * n3) * Math.sin(2 * (lat - lat0)) * Math.cos(2 * (lat + lat0));
  var Md = 35 / 24 * n3 * Math.sin(3 * (lat - lat0)) * Math.cos(3 * (lat + lat0));
  var M = b * F0 * (Ma - Mb + Mc - Md);
  // meridional arc
  var cos3lat = cosLat * cosLat * cosLat;
  var cos5lat = cos3lat * cosLat * cosLat;
  var tan2lat = Math.tan(lat) * Math.tan(lat);
  var tan4lat = tan2lat * tan2lat;
  var I = M + N0;
  var II = nu / 2 * sinLat * cosLat;
  var III = nu / 24 * sinLat * cos3lat * (5 - tan2lat + 9 * eta2);
  var IIIA = nu / 720 * sinLat * cos5lat * (61 - 58 * tan2lat + tan4lat);
  var IV = nu * cosLat;
  var V = nu / 6 * cos3lat * (nu / rho - tan2lat);
  var VI = nu / 120 * cos5lat * (5 - 18 * tan2lat + tan4lat + 14 * eta2 - 58 * tan2lat * eta2);
  var dLon = lon - lon0;
  var dLon2 = dLon * dLon, dLon3 = dLon2 * dLon, dLon4 = dLon3 * dLon, dLon5 = dLon4 * dLon, dLon6 = dLon5 * dLon;
  var N = I + II * dLon2 + III * dLon4 + IIIA * dLon6;
  var E = E0 + IV * dLon + V * dLon3 + VI * dLon5;
  return new OsGridRef(E, N);
};
/**
 * Convert Ordnance Survey grid reference easting/northing coordinate to (OSGB36) latitude/longitude
 *
 * @param {OsGridRef} easting/northing to be converted to latitude/longitude
 * @return {LatLon} latitude/longitude (in OSGB36) of supplied grid reference
 */
OsGridRef.osGridToLatLong = function (gridref) {
  var E = gridref.easting;
  var N = gridref.northing;
  var a = 6377563.396, b = 6356256.91;
  // Airy 1830 major & minor semi-axes
  var F0 = 0.9996012717;
  // NatGrid scale factor on central meridian
  var lat0 = 49 * Math.PI / 180, lon0 = -2 * Math.PI / 180;
  // NatGrid true origin
  var N0 = -100000, E0 = 400000;
  // northing & easting of true origin, metres
  var e2 = 1 - b * b / (a * a);
  // eccentricity squared
  var n = (a - b) / (a + b), n2 = n * n, n3 = n * n * n;
  var lat = lat0, M = 0;
  do {
    lat = (N - N0 - M) / (a * F0) + lat;
    var Ma = (1 + n + 5 / 4 * n2 + 5 / 4 * n3) * (lat - lat0);
    var Mb = (3 * n + 3 * n * n + 21 / 8 * n3) * Math.sin(lat - lat0) * Math.cos(lat + lat0);
    var Mc = (15 / 8 * n2 + 15 / 8 * n3) * Math.sin(2 * (lat - lat0)) * Math.cos(2 * (lat + lat0));
    var Md = 35 / 24 * n3 * Math.sin(3 * (lat - lat0)) * Math.cos(3 * (lat + lat0));
    M = b * F0 * (Ma - Mb + Mc - Md);  // meridional arc
  } while (N - N0 - M >= 0.00001);
  // ie until < 0.01mm
  var cosLat = Math.cos(lat), sinLat = Math.sin(lat);
  var nu = a * F0 / Math.sqrt(1 - e2 * sinLat * sinLat);
  // transverse radius of curvature
  var rho = a * F0 * (1 - e2) / Math.pow(1 - e2 * sinLat * sinLat, 1.5);
  // meridional radius of curvature
  var eta2 = nu / rho - 1;
  var tanLat = Math.tan(lat);
  var tan2lat = tanLat * tanLat, tan4lat = tan2lat * tan2lat, tan6lat = tan4lat * tan2lat;
  var secLat = 1 / cosLat;
  var nu3 = nu * nu * nu, nu5 = nu3 * nu * nu, nu7 = nu5 * nu * nu;
  var VII = tanLat / (2 * rho * nu);
  var VIII = tanLat / (24 * rho * nu3) * (5 + 3 * tan2lat + eta2 - 9 * tan2lat * eta2);
  var IX = tanLat / (720 * rho * nu5) * (61 + 90 * tan2lat + 45 * tan4lat);
  var X = secLat / nu;
  var XI = secLat / (6 * nu3) * (nu / rho + 2 * tan2lat);
  var XII = secLat / (120 * nu5) * (5 + 28 * tan2lat + 24 * tan4lat);
  var XIIA = secLat / (5040 * nu7) * (61 + 662 * tan2lat + 1320 * tan4lat + 720 * tan6lat);
  var dE = E - E0, dE2 = dE * dE, dE3 = dE2 * dE, dE4 = dE2 * dE2, dE5 = dE3 * dE2, dE6 = dE4 * dE2, dE7 = dE5 * dE2;
  lat = lat - VII * dE2 + VIII * dE4 - IX * dE6;
  var lon = lon0 + X * dE - XI * dE3 + XII * dE5 - XIIA * dE7;
  return new LatLon(lat.toDeg(), lon.toDeg());
};
/**
 * Converts standard grid reference ('SU387148') to fully numeric ref ([438700,114800]);
 *   returned co-ordinates are in metres, centred on supplied grid square;
 *
 * @param {String} gridref: Standard format OS grid reference
 * @returns {OsGridRef}     Numeric version of grid reference in metres from false origin
 */
OsGridRef.parse = function (gridref) {
  gridref = gridref.trim();
  // get numeric values of letter references, mapping A->0, B->1, C->2, etc:
  var l1 = gridref.toUpperCase().charCodeAt(0) - 'A'.charCodeAt(0);
  var l2 = gridref.toUpperCase().charCodeAt(1) - 'A'.charCodeAt(0);
  // shuffle down letters after 'I' since 'I' is not used in grid:
  if (l1 > 7)
    l1--;
  if (l2 > 7)
    l2--;
  // convert grid letters into 100km-square indexes from false origin (grid square SV):
  var e = (l1 - 2) % 5 * 5 + l2 % 5;
  var n = 19 - Math.floor(l1 / 5) * 5 - Math.floor(l2 / 5);
  if (e < 0 || e > 6 || n < 0 || n > 12)
    return new OsGridRef(NaN, NaN);
  // skip grid letters to get numeric part of ref, stripping any spaces:
  gridref = gridref.slice(2).replace(/ /g, '');
  // append numeric part of references to grid index:
  e += gridref.slice(0, gridref.length / 2);
  n += gridref.slice(gridref.length / 2);
  // normalise to 1m grid, rounding up to centre of grid square:
  switch (gridref.length) {
  case 0:
    e += '50000';
    n += '50000';
    break;
  case 2:
    e += '5000';
    n += '5000';
    break;
  case 4:
    e += '500';
    n += '500';
    break;
  case 6:
    e += '50';
    n += '50';
    break;
  case 8:
    e += '5';
    n += '5';
    break;
  case 10:
    break;
  // 10-digit refs are already 1m
  default:
    return new OsGridRef(NaN, NaN);
  }
  return new OsGridRef(e, n);
};
/**
 * Converts this numeric grid reference to standard OS grid reference
 *
 * @param {Number} [digits=6] Precision of returned grid reference (6 digits = metres)
 * @return {String) This grid reference in standard format
 */
OsGridRef.prototype.toString = function (digits) {
  digits = typeof digits == 'undefined' ? 10 : digits;
  var e = this.easting,
  n = this.northing;
  if (isNaN(e) || isNaN(n))
    return '??';
  // get the 100km-grid indices
  var e100k = Math.floor(e / 100000), n100k = Math.floor(n / 100000);
  if (e100k < 0 || e100k > 6 || n100k < 0 || n100k > 12)
    return '';
  // translate those into numeric equivalents of the grid letters
  var l1 = 19 - n100k - (19 - n100k) % 5 + Math.floor((e100k + 10) / 5);
  var l2 = (19 - n100k) * 5 % 25 + e100k % 5;
  // compensate for skipped 'I' and build grid letter-pairs
  if (l1 > 7)
    l1++;
  if (l2 > 7)
    l2++;
  var letPair = String.fromCharCode(l1 + 'A'.charCodeAt(0), l2 + 'A'.charCodeAt(0));
  // strip 100km-grid indices from easting & northing, and reduce precision
  e = Math.floor(e % 100000 / Math.pow(10, 5 - digits / 2));
  n = Math.floor(n % 100000 / Math.pow(10, 5 - digits / 2));
  var gridRef = letPair + ' ' + e.padLz(digits / 2) + ' ' + n.padLz(digits / 2);
  return gridRef;
};
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/** Trims whitespace from string (q.v. blog.stevenlevithan.com/archives/faster-trim-javascript) */
if (typeof String.prototype.trim == 'undefined') {
  String.prototype.trim = function () {
    return this.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
  };
}
/** Pads a number with sufficient leading zeros to make it w chars wide */
if (typeof String.prototype.padLz == 'undefined') {
  Number.prototype.padLz = function (w) {
    var n = this.toString();
    var l = n.length;
    for (var i = 0; i < w - l; i++)
      n = '0' + n;
    return n;
  };
}
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
if (!window.console)
  window.console = {
    log: function () {
    }
  };
/**
 * @preserve SignaturePad: A jQuery plugin for assisting in the creation of an HTML5 canvas
 * based signature pad. Records the drawn signature in JSON for later regeneration.
 *
 * Dependencies: FlashCanvas/1.5, json2.js, jQuery/1.3.2+
 *
 * @project ca.thomasjbradley.applications.signaturepad
 * @author Thomas J Bradley <hey@thomasjbradley.ca>
 * @link http://thomasjbradley.ca/lab/signature-pad
 * @link http://github.com/thomasjbradley/signature-pad
 * @copyright Copyright MMXI, Thomas J Bradley
 * @license New BSD License
 * @version {{version}}
 */
/**
 * Usage for accepting signatures:
 *  $('.sigPad').signaturePad()
 *
 * Usage for displaying previous signatures:
 *  $('.sigPad').signaturePad({displayOnly:true}).regenerate(sig)
 *  or
 *  var api = $('.sigPad').signaturePad({displayOnly:true})
 *  api.regenerate(sig)
 */
(function ($) {
  function SignaturePad(selector, options) {
    /**
   * Reference to the object for use in public methods
   *
   * @private
   *
   * @type {Object}
   */
    var self = this, settings = $.extend({}, $.fn.signaturePad.defaults, options), context = $(selector), canvas = $(settings.canvas, context), element = canvas.get(0), canvasContext = null, previous = {
        'x': null,
        'y': null
      }, output = [], mouseLeaveTimeout = false, touchable = false, eventsBound = false;
    /**
   * Draws a line on canvas using the mouse position
   * Checks previous position to not draw over top of previous drawing
   *  (makes the line really thick and poorly anti-aliased)
   *
   * @private
   *
   * @param {Object} e The event object
   * @param {Number} newYOffset A pixel value for drawing the newY, used for drawing a single dot on click
   */
    function drawLine(e, newYOffset) {
      var offset = $(e.target).offset(), newX, newY;
      clearTimeout(mouseLeaveTimeout);
      mouseLeaveTimeout = false;
      if (typeof e.changedTouches !== 'undefined') {
        newX = Math.floor(e.changedTouches[0].pageX - offset.left);
        newY = Math.floor(e.changedTouches[0].pageY - offset.top);
      } else {
        newX = Math.floor(e.pageX - offset.left);
        newY = Math.floor(e.pageY - offset.top);
      }
      if (previous.x === newX && previous.y === newY)
        return true;
      if (previous.x === null)
        previous.x = newX;
      if (previous.y === null)
        previous.y = newY;
      if (newYOffset)
        newY += newYOffset;
      canvasContext.beginPath();
      canvasContext.moveTo(previous.x, previous.y);
      canvasContext.lineTo(newX, newY);
      canvasContext.lineCap = settings.penCap;
      canvasContext.stroke();
      canvasContext.closePath();
      output.push({
        'lx': newX,
        'ly': newY,
        'mx': previous.x,
        'my': previous.y
      });
      previous.x = newX;
      previous.y = newY;
    }
    /**
   * Callback registered to mouse/touch events of the canvas
   * Stops the drawing abilities
   *
   * @private
   *
   * @param {Object} e The event object
   */
    function stopDrawing() {
      if (touchable) {
        canvas.each(function () {
          this.ontouchmove = null;
        });
      } else {
        canvas.unbind('mousemove.signaturepad');
      }
      previous.x = null;
      previous.y = null;
      if (output.length > 0)
        $(settings.output, context).val(JSON.stringify(output));
    }
    /**
   * Draws the signature line
   *
   * @private
   */
    function drawSigLine() {
      if (!settings.lineWidth)
        return false;
      canvasContext.beginPath();
      canvasContext.lineWidth = settings.lineWidth;
      canvasContext.strokeStyle = settings.lineColour;
      canvasContext.moveTo(settings.lineMargin, settings.lineTop);
      canvasContext.lineTo(element.width - settings.lineMargin, settings.lineTop);
      canvasContext.stroke();
      canvasContext.closePath();
    }
    /**
   * Clears all drawings off the canvas and redraws the signature line
   *
   * @private
   */
    function clearCanvas() {
      stopDrawing();
      canvasContext.clearRect(0, 0, element.width, element.height);
      canvasContext.fillStyle = settings.bgColour;
      canvasContext.fillRect(0, 0, element.width, element.height);
      if (!settings.displayOnly)
        drawSigLine();
      canvasContext.lineWidth = settings.penWidth;
      canvasContext.strokeStyle = settings.penColour;
      $(settings.output, context).val('');
      output = [];
    }
    /**
   * Callback registered to mouse/touch events of canvas
   * Triggers the drawLine function
   *
   * @private
   *
   * @param {Object} e The event object
   * @param {Object} o The object context registered to the event; canvas
   */
    function startDrawing(e, o) {
      if (touchable) {
        canvas.each(function () {
          this.addEventListener('touchmove', drawLine, false);
        });
      } else {
        canvas.bind('mousemove.signaturepad', drawLine);
      }
      // Draws a single point on initial mouse down, for people with periods in their name
      drawLine(e, 1);
    }
    /**
   * Removes all the mouse events from the canvas
   *
   * @private
   */
    function disableCanvas() {
      eventsBound = false;
      if (touchable) {
        canvas.each(function () {
          this.removeEventListener('touchstart', stopDrawing);
          this.removeEventListener('touchend', stopDrawing);
          this.removeEventListener('touchmove', drawLine);
        });
      } else {
        canvas.unbind('mousedown.signaturepad');
        canvas.unbind('mouseup.signaturepad');
        canvas.unbind('mousemove.signaturepad');
        canvas.unbind('mouseleave.signaturepad');
      }
      $(settings.clear, context).unbind('click.signaturepad');
    }
    /**
   * Lazy touch event detection
   * Uses the first press on the canvas to detect either touch or mouse reliably
   * Will then bind other events as needed
   *
   * @private
   *
   * @param {Object} e The event object
   */
    function initDrawEvents(e) {
      if (eventsBound)
        return false;
      eventsBound = true;
      if (typeof e.changedTouches !== 'undefined')
        touchable = true;
      if (touchable) {
        canvas.each(function () {
          this.addEventListener('touchend', stopDrawing, false);
          this.addEventListener('touchcancel', stopDrawing, false);
        });
        canvas.unbind('mousedown.signaturepad');
      } else {
        canvas.bind('mouseup.signaturepad', function (e) {
          stopDrawing();
        });
        canvas.bind('mouseleave.signaturepad', function (e) {
          if (!mouseLeaveTimeout) {
            mouseLeaveTimeout = setTimeout(function () {
              stopDrawing();
              clearTimeout(mouseLeaveTimeout);
              mouseLeaveTimeout = false;
            }, 500);
          }
        });
        canvas.each(function () {
          this.ontouchstart = null;
        });
      }
    }
    /**
   * Triggers the abilities to draw on the canvas
   * Sets up mouse/touch events, hides and shows descriptions and sets current classes
   *
   * @private
   */
    function drawIt() {
      $(settings.typed, context).hide();
      clearCanvas();
      canvas.each(function () {
        this.ontouchstart = function (e) {
          e.preventDefault();
          initDrawEvents(e);
          startDrawing(e, this);
        };
      });
      canvas.bind('mousedown.signaturepad', function (e) {
        initDrawEvents(e);
        startDrawing(e, this);
      });
      $(settings.clear, context).bind('click.signaturepad', function (e) {
        e.preventDefault();
        clearCanvas();
      });
      $(settings.typeIt, context).bind('click.signaturepad', function (e) {
        e.preventDefault();
        typeIt();
      });
      $(settings.drawIt, context).unbind('click.signaturepad');
      $(settings.drawIt, context).bind('click.signaturepad', function (e) {
        e.preventDefault();
      });
      $(settings.typeIt, context).removeClass(settings.currentClass);
      $(settings.drawIt, context).addClass(settings.currentClass);
      $(settings.sig, context).addClass(settings.currentClass);
      $(settings.typeItDesc, context).hide();
      $(settings.drawItDesc, context).show();
      $(settings.clear, context).show();
    }
    /**
   * Triggers the abilities to type in the input for generating a signature
   * Sets up mouse events, hides and shows descriptions and sets current classes
   *
   * @private
   */
    function typeIt() {
      clearCanvas();
      disableCanvas();
      $(settings.typed, context).show();
      $(settings.drawIt, context).bind('click.signaturepad', function (e) {
        e.preventDefault();
        drawIt();
      });
      $(settings.typeIt, context).unbind('click.signaturepad');
      $(settings.typeIt, context).bind('click.signaturepad', function (e) {
        e.preventDefault();
      });
      $(settings.output, context).val('');
      $(settings.drawIt, context).removeClass(settings.currentClass);
      $(settings.typeIt, context).addClass(settings.currentClass);
      $(settings.sig, context).removeClass(settings.currentClass);
      $(settings.drawItDesc, context).hide();
      $(settings.clear, context).hide();
      $(settings.typeItDesc, context).show();
    }
    /**
   * Callback registered on key up and blur events for input field
   * Writes the text fields value as Html into an element
   *
   * @private
   *
   * @param {String} val The value of the input field
   */
    function type(val) {
      $(settings.typed, context).html(val.replace(/>/g, '&gt;').replace(/</g, '&lt;'));
      while ($(settings.typed, context).width() > element.width) {
        var oldSize = $(settings.typed, context).css('font-size').replace(/px/, '');
        $(settings.typed, context).css('font-size', oldSize - 1 + 'px');
      }
    }
    /**
   * Default onBeforeValidate function to clear errors
   *
   * @private
   *
   * @param {Object} context current context object
   * @param {Object} settings provided settings
   */
    function onBeforeValidate(context, settings) {
      $('p.' + settings.errorClass, context).remove();
      context.removeClass(settings.errorClass);
      $('input, label', context).removeClass(settings.errorClass);
    }
    /**
   * Default onFormError function to show errors
   *
   * @private
   *
   * @param {Object} errors object contains validation errors (e.g. nameInvalid=true)
   * @param {Object} context current context object
   * @param {Object} settings provided settings
   */
    function onFormError(errors, context, settings) {
      if (errors.nameInvalid) {
        context.prepend([
          '<p class="',
          settings.errorClass,
          '">',
          settings.errorMessage,
          '</p>'
        ].join(''));
        $(settings.name, context).focus();
        $(settings.name, context).addClass(settings.errorClass);
        $('label[for=' + $(settings.name).attr('id') + ']', context).addClass(settings.errorClass);
      }
      if (errors.drawInvalid)
        context.prepend([
          '<p class="',
          settings.errorClass,
          '">',
          settings.errorMessageDraw,
          '</p>'
        ].join(''));
    }
    /**
   * Validates the form to confirm a name was typed in the field
   * If drawOnly also confirms that the user drew a signature
   *
   * @private
   *
   * @return {Boolean}
   */
    function validateForm() {
      var valid = true, errors = {
          drawInvalid: false,
          nameInvalid: false
        }, onBeforeArguments = [
          context,
          settings
        ], onErrorArguments = [
          errors,
          context,
          settings
        ];
      if (settings.onBeforeValidate && typeof settings.onBeforeValidate === 'function') {
        settings.onBeforeValidate.apply(self, onBeforeArguments);
      } else {
        onBeforeValidate.apply(self, onBeforeArguments);
      }
      if (settings.drawOnly && output.length < 1) {
        errors.drawInvalid = true;
        valid = false;
      }
      if ($(settings.name, context).val() === '') {
        errors.nameInvalid = true;
        valid = false;
      }
      if (settings.onFormError && typeof settings.onFormError === 'function') {
        settings.onFormError.apply(self, onErrorArguments);
      } else {
        onFormError.apply(self, onErrorArguments);
      }
      return valid;
    }
    /**
   * Redraws the signature on a specific canvas
   *
   * @private
   *
   * @param {Array} paths the signature JSON
   * @param {Object} context the canvas context to draw on
   * @param {Boolean} saveOutput whether to write the path to the output array or not
   */
    function drawSignature(paths, context, saveOutput) {
      for (var i in paths) {
        if (typeof paths[i] === 'object') {
          context.beginPath();
          context.moveTo(paths[i].mx, paths[i].my);
          context.lineTo(paths[i].lx, paths[i].ly);
          context.lineCap = settings.penCap;
          context.stroke();
          context.closePath();
          if (saveOutput) {
            output.push({
              'lx': paths[i].lx,
              'ly': paths[i].ly,
              'mx': paths[i].mx,
              'my': paths[i].my
            });
          }
        }
      }
    }
    /**
   * Initialisation function, called immediately after all declarations
   * Technically public, but only should be used internally
   *
   * @private
   */
    function init() {
      // Fixes the jQuery.fn.offset() function for Mobile Safari Browsers i.e. iPod Touch, iPad and iPhone
      // https://gist.github.com/661844
      // http://bugs.jquery.com/ticket/6446
      if (parseFloat((/CPU.+OS ([0-9_]{3}).*AppleWebkit.*Mobile/i.exec(navigator.userAgent) || [
          0,
          '4_2'
        ])[1].replace('_', '.')) < 4.1) {
        $.fn.Oldoffset = $.fn.offset;
        $.fn.offset = function () {
          var result = $(this).Oldoffset();
          result.top -= window.scrollY;
          result.left -= window.scrollX;
          return result;
        };
      }
      // Disable selection on the typed div and canvas
      $(settings.typed, context).bind('selectstart.signaturepad', function (e) {
        return $(e.target).is(':input');
      });
      canvas.bind('selectstart.signaturepad', function (e) {
        return $(e.target).is(':input');
      });
      if (!element.getContext && FlashCanvas)
        FlashCanvas.initElement(element);
      if (element.getContext) {
        canvasContext = element.getContext('2d');
        $(settings.sig, context).show();
        if (!settings.displayOnly) {
          if (!settings.drawOnly) {
            $(settings.name, context).bind('keyup.signaturepad', function () {
              type($(this).val());
            });
            $(settings.name, context).bind('blur.signaturepad', function () {
              type($(this).val());
            });
            $(settings.drawIt, context).bind('click.signaturepad', function (e) {
              e.preventDefault();
              drawIt();
            });
          }
          if (settings.drawOnly || settings.defaultAction === 'drawIt') {
            drawIt();
          } else {
            typeIt();
          }
          if (settings.validateFields) {
            if ($(selector).is('form')) {
              $(selector).bind('submit.signaturepad', function () {
                return validateForm();
              });
            } else {
              $(selector).parents('form').bind('submit.signaturepad', function () {
                return validateForm();
              });
            }
          }
          $(settings.sigNav, context).show();
        }
      }
    }
    $.extend(self, {
      init: function () {
        init();
      }  /**
     * Regenerates a signature on the canvas using an array of objects
     * Follows same format as object property
     * @see var object
     *
     * @param {Array} paths An array of the lines and points
     */,
      regenerate: function (paths) {
        self.clearCanvas();
        $(settings.typed, context).hide();
        if (typeof paths === 'string')
          paths = JSON.parse(paths);
        drawSignature(paths, canvasContext, true);
        if ($(settings.output, context).length > 0)
          $(settings.output, context).val(JSON.stringify(output));
      }  /**
     * Clears the canvas
     * Redraws the background colour and the signature line
     */,
      clearCanvas: function () {
        clearCanvas();
      }  /**
     * Returns the signature as a Js array
     *
     * @return {Array}
     */,
      getSignature: function () {
        return output;
      }  /**
     * Returns the signature as a Json string
     *
     * @return {String}
     */,
      getSignatureString: function () {
        return JSON.stringify(output);
      }  /**
     * Returns the signature as an image
     * Re-draws the signature in a shadow canvas to create a clean version
     *
     * @return {String}
     */,
      getSignatureImage: function () {
        var tmpCanvas = document.createElement('canvas'), tmpContext = null, data = null;
        tmpCanvas.style.position = 'absolute';
        tmpCanvas.style.top = '-999em';
        tmpCanvas.width = element.width;
        tmpCanvas.height = element.height;
        document.body.appendChild(tmpCanvas);
        if (!tmpCanvas.getContext && FlashCanvas)
          FlashCanvas.initElement(tmpCanvas);
        tmpContext = tmpCanvas.getContext('2d');
        tmpContext.fillStyle = settings.bgColour;
        tmpContext.fillRect(0, 0, element.width, element.height);
        tmpContext.lineWidth = settings.penWidth;
        tmpContext.strokeStyle = settings.penColour;
        drawSignature(output, tmpContext);
        data = tmpCanvas.toDataURL.apply(tmpCanvas, arguments);
        document.body.removeChild(tmpCanvas);
        tmpCanvas = null;
        return data;
      }
    });
  }
  /**
 * Create the plugin
 * Returns an Api which can be used to call specific methods
 *
 * @param {Object} options The options array
 *
 * @return {Object} The Api for controlling the instance
 */
  $.fn.signaturePad = function (options) {
    var api = null;
    this.each(function () {
      api = new SignaturePad(this, options);
      api.init();
    });
    return api;
  };
  /**
 * Expose the defaults so they can be overwritten for multiple instances
 *
 * @type {Object}
 */
  $.fn.signaturePad.defaults = {
    defaultAction: 'typeIt',
    displayOnly: false,
    drawOnly: false,
    canvas: 'canvas',
    sig: '.sig',
    sigNav: '.sigNav',
    bgColour: '#ffffff',
    penColour: '#145394',
    penWidth: 2,
    penCap: 'round',
    lineColour: '#ccc',
    lineWidth: 2,
    lineMargin: 5,
    lineTop: 35,
    name: '.name',
    typed: '.typed',
    clear: '.clearButton',
    typeIt: '.typeIt a',
    drawIt: '.drawIt a',
    typeItDesc: '.typeItDesc',
    drawItDesc: '.drawItDesc',
    output: '.output',
    currentClass: 'current',
    validateFields: true,
    errorClass: 'error',
    errorMessage: 'Please enter your name',
    errorMessageDraw: 'Please sign the document',
    onBeforeValidate: null,
    onFormError: null
  };
}(jQuery));
var toBitmapURL = function ($fromCharCode, FF, MAX_LENGTH) {
    /**
     * (C) WebReflection - Mit Style License
     *      given a canvas, returns BMP 32bit with alpha channel data uri representation
     *
     * Why ?
     *      because many canvas implementation may not support toDataURL
     *      ( HTMLCanvasElement.prototype.toDataURL || HTMLCanvasElement.prototype.toDataURL = function () {return toBitmapURL(this)}; )
     *
     * I mean ... Why BMP 32 rather than PNG ?!!!
     *      because JavaScript size matter as well as computation time.
     *      PNG requires DEFLATE compression and multiple pass over the data.
     *      BMP is straight forward
     *
     * Fine, but which browser supports BMP in 2011 ?
     *      pretty much all of them, except some version of Chrome. Safari and Webkit are fine as well as Firefox, Opera and of course IE
     *
     * Sure, but why on earth should I use BMP as data uri ?
     *      this method is about creation of canvas snapshots. If toDataURL is not presemt
     *      there is still a way to create a portable, NOT COMPRESSED, bitmap image
     *      that could be optionally sent to the server and at that point converted into proper PNG
     *      Bitmap format was fast enough to parse (on mobile as well) and it was RGBA compatible plus widely supported.
     *
     * I think this was a wasteof time
     *      well, if you still think so, I can say that was actually fun to create a proper
     *      32 bit image format via JavaScript on the fly.
     *      However, please share your own toDataURL version with full mime type support in JavaScript :P
     *      Moreover, have you ever tried to use native toDataURL("image/bmp") ?
     *      Most likely you gonna have max 24bit bitmap with all alpha channel info lost.
     */
    function fromCharCode(code) {
      for (var result = [], i = 0, length = code.length; i < length; i += MAX_LENGTH) {
        result.push($fromCharCode.apply(null, code.slice(i, i + MAX_LENGTH)));
      }
      return result.join('');
    }
    function numberToInvertedBytes(number) {
      return [
        number & FF,
        number >> 8 & FF,
        number >> 16 & FF,
        number >> 24 & FF
      ];
    }
    function swapAndInvertY(data, width, height) {
      /**
         * Bitmap pixels array is stored "pseudo inverted"
         * RGBA => BGRA (read as Alpha + RGB)
         * in few words this canvas pixels array
         * [
         *   0, 1,  2,  3,  4,  5,  6,  7,
         *   8, 9, 10, 11, 12, 13, 14, 15
         * ]
         * is stored as bitmap one like
         * [
         *   10, 9, 8, 11, 14, 13, 12, 15,
         *   2, 1, 0,  3,  6,  5,  4,  7
         * ]
         */
      for (var i, j, x0, x1, y0, y1, sizeX = 4 * width, sizeY = height - 1, result = []; height--;) {
        y0 = sizeX * (sizeY - height);
        y1 = sizeX * height;
        for (i = 0; i < width; i++) {
          j = i * 4;
          x0 = y0 + j;
          x1 = y1 + j;
          result[x0] = data[x1 + 2];
          result[x0 + 1] = data[x1 + 1];
          result[x0 + 2] = data[x1];
          result[x0 + 3] = data[x1 + 3];
        }
      }
      return result;
    }
    function toBitmapURL(canvas) {
      var width = canvas.width, height = canvas.height, header = [].concat(numberToInvertedBytes(width), numberToInvertedBytes(height), 1, 0, 32, 0, 3, 0, 0, 0, numberToInvertedBytes(width * height * 4), 19, 11, 0, 0, 19, 11, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, FF, 0, 0, FF, 0, 0, FF, 0, 0, 0, 0, 0, 0, FF, 32, 110, 105, 87), data = swapAndInvertY(canvas.getContext('2d').getImageData(0, 0, width, height).data, width, height), offset;
      header = numberToInvertedBytes(header.length).concat(header);
      offset = 14 + header.length;
      return 'data:image/bmp;base64,' + btoa(fromCharCode([
        66,
        77
      ].concat(numberToInvertedBytes(offset + data.length), 0, 0, 0, 0, numberToInvertedBytes(offset), header, data)));
    }
    return toBitmapURL;
  }(String.fromCharCode, 255, 32767);
// Namespace
var App=(function(module){
    module.views={};
    module.models={};
    module.collections={};
    module.config={};

    return module;
})(App || {});
var BaseView=Backbone.View.extend({
    "onLoad":function(){},
    "onLoadEnd":function(){}
}); 
var FormTemplates = '<script type="text/template" id="temp_form_structure"><div id="fh_appform_container" class="fh_appform_form_area col-xs-12 fh_appform_container">  <div class="fh_appform_logo_container  col-xs-12">    <div class="fh_appform_logo">    </div>  </div>  <div class="fh_appform_form_title col-xs-12 text-center">    <%= title%>  </div></div></script><script type="text/template" id="temp_form_buttons"><div id="fh_appform_navigation_buttons" class="fh_appform_button_bar btn-group btn-group-justified col-xs-12">  <div class="btn-group">    <button class="fh_appform_button_saveDraft fh_appform_button_main fh_appform_button_action btn btn-primary">Save Draft</button>  </div>  <div class="btn-group">    <button class="fh_appform_button_previous fh_appform_button_default btn btn-default">Previous</button>  </div>  <div class="btn-group">    <button class="fh_appform_button_next fh_appform_button_default btn btn-default">Next</button>  </div>  <div class="btn-group">    <button class="fh_appform_button_submit fh_appform_button_action btn btn-primary">Submit</button>  </div>  </div></script><script type="text/template" id="temp_page_structure"><div id="fh_appform_<%= sectionId %>" class="fh_appform_section_area panel panel-default">  <div class="panel-heading text-center col-xs-12 fh_appform_section_title" data-field="fh_appform_<%= sectionId %>_body">    <i id="fh_appform_<%= sectionId %>_body_icon" class="pull-right <%= index === 0 ? \"icon-chevron-sign-down\" : \"icon-chevron-sign-up\"%> section_icon" ></i><%=title%>  </div>  <div id="fh_appform_<%= sectionId %>_body" class="panel-body col-xs-12" style="<%= index === 0 ? \"\" : \"display:none;\"%>">  </div></div></script><script type="text/template" id="temp_field_structure"><div class="fh_appform_input_wrapper col-xs-12">    <% if(repeating === true){ %>    <div class="fh_appform_field_title col-xs-12">      <i class="<%= field_icon %>"><%= icon_content %></i>      <%= title %>    </div>  <%} else {%>    <div class="fh_appform_field_title col-xs-12 <%= required %>">      <i class="<%= field_icon %>"><%= icon_content %></i>      <%= title %>    </div>  <% } %>    <% if(helpText){ %>    <p class="fh_appform_field_instructions col-xs-12">      <%= helpText %>    </p>  <% } %></div><div class="fh_appform_field_button_bar col-xs-12" >  <button class="fh_appform_removeInputBtn special_button fh_appform_button_action btn btn-primary col-xs-offset-1 col-xs-5">-</button>  <button class="special_button fh_appform_addInputBtn fh_appform_button_action btn btn-primary col-xs-offset-1 col-xs-5 pull-right">+</button></div></script><script type="text/template" id="temp_field_wrapper"><div id="wrapper_<%= fieldId %>_<%= index %>" class="col-xs-12 fh_appform_field_wrapper">  <% if(repeating === true){ %>    <div class="<%= required %> fh_appform_field_title fh_appform_field_numbering col-xs-2">      <%=d_index%>.    </div>  <% } %>    <div class="fh_appform_field_input_container repeating <%= repeating === true ? \"col-xs-10\" : \"col-xs-12\"%>" >    <div class="fh_appform_field_error_container col-xs-12 fh_appform_hidden">    </div>  </div></div></script><script type="text/template" id="temp_config_camera"><div class="panel panel-default fh_appform_section_area col-xs-12" id="camera-settings">  <div class="panel-heading" data-field="camera-settings-body">    <h3 class="panel-title fh_appform_section_title"><i id="camera-settings-body-icon" class="pull-right icon-chevron-sign-down" > </i>Camera Settings</h3>  </div>  <div class="panel-body" id="camera-settings-body">    <div class="col-xs-12 fh_appform_section_area">       <div class="form-group fh_appform_field_area">        <label class="fh_appform_field_title col-xs-12" for="targetWidth">Width (px)</label>        <input type="number" class="form-control fh_appform_field_input text-center" id="targetWidth" value="<%= targetWidth %>" data-key="targetWidth">      </div>      <div class="form-group fh_appform_field_area">        <label class="fh_appform_field_title col-xs-12" for="targetHeight">Height (px)</label>        <input type="number" class="form-control fh_appform_field_input text-center" id="targetHeight" value="<%= targetHeight %>" data-key="targetHeight">      </div>      <div class="form-group fh_appform_field_area">        <label class="fh_appform_field_title col-xs-12" for="quality">Quality (%)</label>        <input type="number" class="form-control fh_appform_field_input text-center" id="quality" value="<%= quality %>" data-key="quality" min="0" max="100">      </div>    </div>  </div></div></script><script type="text/template" id="temp_config_submissions"><div class="panel panel-default fh_appform_section_area col-xs-12" id="submission-settings">  <div class="panel-heading" data-field="submission-settings-body">    <h3 class="panel-title fh_appform_section_title"><i id="submission-settings-body-icon" class="pull-right icon-chevron-sign-down" > </i>Submission Settings</h3>  </div>  <div class="panel-body" id="submission-settings-body">    <div class="col-xs-12 fh_appform_section_area">       <div class="form-group fh_appform_field_area">        <label class="fh_appform_field_title col-xs-12" for="max_retries">Max Retries</label>        <input type="number" class="form-control fh_appform_field_input text-center" id="max_retries" value="<%= max_retries %>" data-key="max_retries">      </div>      <div class="form-group fh_appform_field_area">        <label class="fh_appform_field_title col-xs-12" for="timeout">Timeout (s)</label>        <input type="number" class="form-control fh_appform_field_input text-center" id="timeout" value="<%= timeout %>" data-key="timeout">      </div>      <div class="form-group fh_appform_field_area">        <label class="fh_appform_field_title col-xs-12" for="sent_items_to_keep_list">Number of sent submissions to keep.</label>        <select id="sent_items_to_keep_list" multiple data-role="tagsinput" data-key="sent_items_to_keep_list">          <% for(var sent_item_index = 0; sent_item_index < sent_items_to_keep_list.length; sent_item_index++){ %>            <option value="<%= sent_items_to_keep_list[sent_item_index] %>"><%= sent_items_to_keep_list[sent_item_index] %></option>          <%}%>        </select>      </div>    </div>    </div></div><div class="modal fade" id="logsModal" tabindex="-1" role="dialog" aria-labelledby="logsModalLabel" aria-hidden="true">  <div class="modal-dialog">    <div class="modal-content fh_appform_section_area">      <div class="modal-header">        <h4 class="modal-title fh_appform_section_title text-center" id="logsModalLabel">Info</h4>      </div>      <div class="modal-body" id="logsModalLabelBody">      </div>      <div class="modal-footer">        <button type="button" class="btn btn-default fh_appform_button_cancel" data-dismiss="modal">Close</button>      </div>    </div>  </div></div></script><script type="text/template" id="temp_config_log"><ul class="list-group col-xs-12">  <%= listStr%>  </ul></script><script type="text/template" id="temp_config_log_item">  <li class="list-group-item <%= logClass %>" style="overflow:auto;"><%= message%></li></script><script type="text/template" id="temp_config_debugging"><div class="panel panel-default fh_appform_section_area col-xs-12" id="debugging-settings">  <div class="panel-heading" data-field="debugging-settings-body">    <h3 class="panel-title fh_appform_section_title"><i id="debugging-settings-body-icon" class="pull-right icon-chevron-sign-down" > </i>Debugging Options</h3>  </div>  <div class="panel-body" id="debugging-settings-body">      <div class="col-xs-12 fh_appform_section_area">          <div class="form-group fh_appform_field_area" id="log_level_div">              <label class="fh_appform_field_title col-xs-12" for="log_level">Log Level</label>              <select class="form-control fh_appform_field_input text-center" id="log_level" value="<%= log_level %>" data-key="log_level" >                <% for (var i=0;i<log_levels.length;i++){                  var val=log_levels[i];                  var selected=(i==log_level)?"selected":""; %>                  <option value="<%= i %>" <%= selected%>><%= val%></option>              <%}%>              </select>          </div>          <div class="form-group fh_appform_field_area" id="log_email_div">              <label class="fh_appform_field_title col-xs-12" for="log_email">Log Reporting Email</label>              <input type="email" class="form-control fh_appform_field_input text-center" id="log_email" value="<%= log_email %>" data-key="logger" value="<%= log_email%>">          </div>          <div class="form-group fh_appform_field_area" id="log_line_limit_div">              <label class="fh_appform_field_title col-xs-12" for="log_line_limit">Log Line Limit</label>              <input type="number" class="form-control fh_appform_field_input text-center" id="log_line_limit" value="<%= log_line_limit %>" data-key="log_line_limit" value="<%= log_line_limit%>" min="0">          </div>          <div class="btn-group-vertical col-xs-12">              <div class="btn-group" data-toggle="buttons" id="logger_wrapper_div">                <button class="btn btn-primary text-left fh_appform_button_action <%= logger?"active":"" %>" type="button" data-key="logger" id="logger"><i class="<%= logger?"icon-circle":"icon-circle-blank" %> choice_icon"></i><div id="logger_message"> <%= logger?"Logging Enabled":"Logging Disabled" %> </div>                </button>              </div>              <button class="btn btn-primary fh_appform_button_action" id="fh_appform_show_deviceId">Show Device Id</button>              <button type="button" class="btn btn-default fh_appform_button_action" id="_viewLogsBtn">View Logs</button>              <button type="button" class="btn btn-default fh_appform_button_action" id="_sendLogsBtn">Send Logs</button>              <button type="button" class="btn btn-default fh_appform_button_cancel" id="_clearLogsBtn">Clear Logs</button>          </div>      </div>  </div></div></script><script type="text/template" id="temp_config_misc">  <div class="panel panel-default fh_appform_section_area  col-xs-12 first" id="misc-settings">  <div class="panel-heading" data-field="misc-settings-body">    <h3 class="panel-title fh_appform_section_title"><i id="misc-settings-body-icon" class="pull-right icon-chevron-sign-down" > </i>Misc Settings</h3>  </div>  <div class="panel-body" id="misc-settings-body">      <div class="col-xs-12 fh_appform_section_area">          <div class="btn-group-vertical col-xs-12">              <button type="button" class="btn btn-default fh_appform_button_action" id="_refreshFormsButton">Refresh Forms</button>          </div>      </div>  </div></div></script><script type="text/template" id="forms-logo-sdk"><div class="fh_appform_logo_container  col-xs-12">  <div class="fh_appform_logo">  </div></div></script>';
var FormListView = BaseView.extend({
    events: {
        'click button#formlist_reload': 'reload'
    },

    templates: {
        list: '<ul class="form_list fh_appform_body"></ul>',
        header: '<h2>Your Forms</h2><h4>Choose a form from the list below</h4>',
        error: '<li><button id="formlist_reload" class="button-block <%= enabledClass %> <%= dataClass %> fh_appform_button_default"><%= name %><div class="loading"></div></button></li>'
    },

    initialize: function(options) {
        this.options = options;
        $fh.forms.log.l("Initialize Form List");
        _.bindAll(this, 'render', 'appendForm');
        this.views = [];

        App.collections.forms.bind('reset', function(collection, options) {
            if (options == null || !options.noFetch) {
                App.collections.forms.each(function(form) {
                    form.fetch();
                });
            }
        });

        App.collections.forms.bind('add remove reset error', this.render, this);
        this.model.on("updated", this.render);
    },

    reload: function() {
        $fh.forms.log.l("Reload Form List");
        var that = this;
        this.onLoad();
        this.model.refresh(true, function(err, formList) {
            this.onLoadEnd();
            that.model = formList;
            that.render();
        });
    },

    show: function() {
        $(this.$el).show();
    },

    hide: function() {
        $(this.$el).hide();
    },

    renderErrorHandler: function(msg) {
        try {
            if (msg == null || msg.match("error_ajaxfail")) {
                msg = "An unexpected error occurred.";
            }
        } catch (e) {
            msg = "An unexpected error occurred.";
        }
        var html = _.template(this.templates.error, {
            name: msg + "<br/>Please Retry Later",
            enabledClass: 'fh_appform_button_cancel', //TODO May not be this class. Double check
            dataClass: 'fetched'
        });
        $('ul', this.$el).append(html);

    },

    render: function() {

        // Empty our existing view
        // this.options.parentEl.empty();

        // Add list
        this.options.parentEl.append(this.templates.list);
        var formList = this.model.getFormsList();
        if (formList.length > 0) {
            // Add header
            this.options.parentEl.find('ul').append(this.templates.header);
            _(formList).forEach(function(form) {
                this.appendForm(form);
            }, this);
        } else {
            this.renderErrorHandler(arguments[1]);
        }
    },

    appendForm: function(form) {
        var view = new FormListItemView({
            model: form
        });
        this.views.push(view);
        $('ul', this.options.parentEl).append(view.render().$el);
    },
    initFormList: function(fromRemote, cb) {
        var that = this;
        $fh.forms.getForms({
            fromRemote: fromRemote
        }, function(err, formsModel) {
            if (err) {
                cb(err);
            } else {
                that.model = formsModel;
                cb(null, that);
            }
        });
    }
});
var FormListItemView = BaseView.extend({
    events: {
      'click button.show.fetched': 'show',
      'click button.show.fetch_error': 'fetch'
    },
    templates: { form_button: '<li><button class="show button-block <%= enabledClass %> <%= dataClass %>"><%= name %><div class="loading"></div></button></li>' },
    render: function () {
      var html;
      // var errorLoading = this.model.get('fh_error_loading');
      var enabled = true;
      html = _.template(this.templates.form_button, {
        name: this.model.name,
        enabledClass: enabled ? 'button-main' : '',
        dataClass: 'fetched'
      });
      this.$el.html(html);
      this.$el.find('button').not('.fh_full_data_loaded');
      return this;
    },
    unrender: function () {
      $(this.$el).remove();
    },
    show: function () {
      var formId = this.model._id;
      // this will init and render formView
      var formView = new FormView({ parentEl: $('#backbone #page') });
      formView.loadForm({ formId: formId }, function () {
        formView.render();
        Backbone.history.navigate('form', true);
      });
    },
    fetch: function () {
    }
  });
var FieldView = Backbone.View.extend({

    className: 'fh_appform_field_area col-xs-12',
    errMessageContainer: ".fh_appform_field_error_container",
    requiredClassName: "fh_appform_field_required",
    errorClassName: "fh_appform_field_error",
    repeatingClassName: "repeating",
    nonRepeatingClassName: "non_repeating",
    addInputButtonClass: ".fh_appform_addInputBtn",
    removeInputButtonClass: ".fh_appform_removeInputBtn",
    fieldWrapper: '<div class="fh_appform_input_wrapper"></div>',
    input: "<input class='fh_appform_field_input <%= repeatingClassName%> col-xs-12' data-field='<%= fieldId %>' data-index='<%= index %>' value='<%= value %>' type='<%= inputType %>' />",
    inputTemplate: "<div id='wrapper_<%= fieldId %>_<%= index %>' class='col-xs-12'> <div class='fh_appform_field_input_container non_repeating' >  <%= inputHtml %> <div class='fh_appform_field_error_container fh_appform_hidden col-xs-12 text-center' ></div></div><br class='clearfix'/>    </div>",
    inputTemplateRepeating: "<div id='wrapper_<%= fieldId %>_<%= index %>' class='col-xs-12'> <div class='<%= required %> fh_appform_field_title fh_appform_field_numbering col-xs-2'> <%=index + 1%>.  </div> <div class='fh_appform_field_input_container repeating col-xs-10' >  <%= inputHtml %> <div class='fh_appform_field_error_container fh_appform_hidden col-xs-12'></div></div></div>",


    fh_appform_fieldActionBar: "<div class='fh_appform_field_button_bar col-xs-12' ><button class='fh_appform_removeInputBtn special_button fh_appform_button_action btn btn-primary col-xs-offset-1 col-xs-5'>-</button><button class='special_button fh_appform_addInputBtn fh_appform_button_action btn btn-primary col-xs-offset-1 col-xs-5 pull-right'>+</button></div>",
    title: '<div class="fh_appform_field_title"><h3 class="text-left  <%= required%>"><%= title %></h3></div>',
    titleRepeating: '<div class="fh_appform_field_title"><h3 class="text-left"><%= title %></h3></div>',
    instructions: '',
    fieldIconNames: {
        text: "icon-font",
        textarea: "icon icon-align-justify",
        url: "icon-link",
        number: "icon-number",
        emailAddress: "icon-envelope-alt",
        dropdown: "icon-caret-down",
        checkboxes: "icon-check",
        location: "icon-location-arrow",
        locationMap: "icon-map-marker",
        photo: "icon-camera",
        signature: "icon-pencil",
        file: "icon-cloud-upload",
        dateTime: "icon-calendar",
        sectionBreak: "icon-minus",
        radio: "icon-circle-blank"
    },
    events: {
        "change": "contentChanged",
        "blur input,select,textarea": "validate",
        "click .fh_appform_addInputBtn": "onAddInput",
        "click .fh_appform_removeInputBtn": "onRemoveInput"
    },
    onAddInput: function() {
        this.addElement();
        this.checkActionBar();
    },
    onRemoveInput: function() {
        this.removeElement();
        this.checkActionBar();
    },
    checkActionBar: function() {
        var curNum = this.curRepeat;
        var maxRepeat = this.maxRepeat;
        var minRepeat = this.initialRepeat;
        if (curNum < maxRepeat) {
            this.$fh_appform_fieldActionBar.find(this.addInputButtonClass).show();
        } else {
            this.$fh_appform_fieldActionBar.find(this.addInputButtonClass).hide();
        }

        if (curNum > minRepeat) {
            this.$fh_appform_fieldActionBar.find(this.removeInputButtonClass).show();
        } else {
            this.$fh_appform_fieldActionBar.find(this.removeInputButtonClass).hide();
        }
    },
    removeElement: function() {
        var curRepeat = this.curRepeat;
        var lastIndex = curRepeat - 1;
        this.getWrapper(lastIndex).remove();
        this.curRepeat--;
    },
    renderInput: function(index) {
        var fieldId = this.model.getFieldId();
        var type = this.getHTMLInputType();
        var repeatingClassName = this.model.isRepeating() ? this.repeatingClassName : this.nonRepeatingClassName;

        var inputEle = _.template(this.input, {
            "fieldId": fieldId,
            "index": index,
            "inputType": type,
            "repeatingClassName": repeatingClassName,
            "value":this.model.getDefaultValue()
        });

        return $(inputEle);
    },
    getHTMLInputType: function() {
        return this.type || "text";
    },
    /**
    * Repeating fields can have required and non-required repeating inputs depending on the minRepeat and maxRepeat values defined for the field
    **/
    getFieldRequired: function(index) {
        var required = "";
        if(this.model.isRequired()){
            if(index < this.initialRepeat){
                required = this.requiredClassName;
            } else {

            }
        } else {

        }
        return required;
    },
    renderHelpText: function() {
        var helpText = this.model.getHelpText();

        if (typeof helpText === "string" && helpText.length > 0) {
            return _.template(this.instructions, {
                "helpText": helpText
            });
        } else {
            return "";
        }
    },
    addElement: function() {
        var self = this;
        var index = this.curRepeat;
        var inputHtml = this.renderInput(index);

        var eleTemplate = _.template(self.options.formView.$el.find("#temp_field_wrapper").html(), {
            index: index,
            d_index: index + 1,
            required: this.model.isRequired() ? self.requiredClassName : "",
            fieldId: this.model.getFieldId(),
            repeating: this.model.isRepeating()  
        });

        eleTemplate = $(eleTemplate);
        eleTemplate.find('.fh_appform_field_input_container').prepend(inputHtml);

        this.$fieldWrapper.append(eleTemplate);
        this.curRepeat++;
        this.onElementShow(index);
    },
    onElementShow: function(index) {
        $fh.forms.log.d("Show done for field " + index);
    },
    render: function() {
        var self = this;
        this.initialRepeat = 1;
        this.maxRepeat = 1;
        this.curRepeat = 0;

        var fieldTemplate = $(_.template(self.options.formView.$el.find("#temp_field_structure").html(), {
            title: this.model.getName(),
            helpText: this.model.getHelpText(),
            required: this.model.isRequired() ? self.requiredClassName : "",
            repeating: this.model.isRepeating(),
            field_icon: this.fieldIconNames[this.model.getType()],
            icon_content: this.model.getType() === "number" ? 123 : ""
        }));

        this.$fieldWrapper = $(fieldTemplate[0]);
        this.$fh_appform_fieldActionBar = $(fieldTemplate[1]);

        if(this.readonly){
            this.$fh_appform_fieldActionBar.hide();   
        }

        if (this.model.isRepeating()) {
            this.initialRepeat = this.model.getMinRepeat();
            this.maxRepeat = this.model.getMaxRepeat();
        }

        for (var i = 0; i < this.initialRepeat; i++) {
            this.addElement();
        }

        this.$el.append(fieldTemplate);
        this.$el.attr("data-field", this.model.getFieldId());

        this.options.parentEl.append(this.$el);

        // force the element to be initially hidden
        if (this.$el.hasClass("hide")) {
            this.hide(true);
        }
        // populate field if Submission obj exists
        var submission = this.options.formView.getSubmission();
        if (submission) {
            this.submission = submission;
            this.submission.getInputValueByFieldId(this.model.get('_id'), function(err, res) {
                self.value(res);
            });
        }


        this.show();
        this.checkActionBar();
        this.onRender();
    },
    onRender: function() {

    },
    // TODO: cache the input element lookup?
    initialize: function(options) {
        this.options = options;
        this.readonly = options.formView.readonly;
        _.bindAll(this, 'dumpContent', 'clearError', 'onAddInput', 'onRemoveInput');

        
        this.render();
    },

    dumpContent: function() {
        $fh.forms.log.d("Value changed :: " + JSON.stringify(this.value()));
    },

    getTopView: function() {
        var view = this.options.parentView;
        var parent;
        do {
            parent = view.options.parentView;
            if (parent) {
                view = parent;
            }
        } while (parent);
        return view;
    },
    validateElement: function(index, element, cb) {
        var self = this;
        var fieldId = self.model.getFieldId();
        self.model.validate(element, index, function(err, res) {
            if (err) {
                self.setErrorText(index, "Error validating field: " + err);
                if (cb) {
                    cb(err);
                }
            } else {
                var result = res["validation"][fieldId];
                if (!result.valid) {
                    var errorMessages = result.errorMessages.join(", ");
                    self.setErrorText(index, errorMessages);
                    if (cb) {
                        cb(errorMessages);
                    }
                } else {
                    self.clearError(index);
                    if (cb) {
                        cb();
                    }
                }
            }
        });
    },
    validate: function(e) {
        var self = this;
        this.options.formView.markFormEdited();
        var target = $(e.currentTarget);
        var index = target.data().index;
        var val = self.valueFromElement(index);
        self.validateElement(index, val);
        self.trigger("checkrules");
    },
    setErrorText: function(index, text) {
        var wrapperObj = this.getWrapper(index);
        wrapperObj.find(this.errMessageContainer).text(text);
        wrapperObj.find(this.errMessageContainer).show();
        wrapperObj.find(this.errMessageContainer).addClass(this.errorClassName);

        if(wrapperObj.find("input[type='checkbox']").length === 0){
            wrapperObj.find("input,textarea,select").addClass(this.errorClassName);    
        }
        
    },
    contentChanged: function(e) {
        this.options.formView.markFormEdited();
        e.preventDefault();
        this.validate(e);
    },

    isRequired: function() {
        return this.model.isRequired();
    },

    // force a hide , defaults to false
    hide: function(force) {
        this.$el.hide();
    },
    renderButton: function(index, label, extension_type) {
        var button = $('<button>');
        button.addClass('special_button fh_appform_button_action col-xs-12');
        button.addClass(extension_type);
        button.attr("data-index", index);
        button.html(' ' + label);

        return this.htmlFromjQuery(button);
    },
    //deprecated
    addButton: function(input, extension_type, label) {
        var self = this;
        var button = $('<button>');
        button.addClass('special_button fh_appform_button_action col-xs-12');
        button.addClass(extension_type);
        button.html(' ' + label);


        button.click(function(e) {
            self.action(this);
            e.preventDefault();
            return false;
        });

        input.append(button);
        return button;
    },

    show: function() {
        this.$el.show();
    },

    defaultValue: function() {
        var defaultValue = {};
        defaultValue[this.model.get('_id')] = this.model.get('DefaultVal');
        return defaultValue;
    },
    htmlFromjQuery: function(jqObj) {
        return $('<div>').append(jqObj.clone()).html();
    },
    // Gets or Set the value for this field
    // set value should be an array which contains repeated value for this field.
    value: function(value) {
        var self = this;
        if (value && !_.isEmpty(value)) {
          self.valuePopulate(value);
        }
        return self.getValue();
    },
    getValue: function() {
        var value = [];
        var repeatNum = this.curRepeat;
        for (var i = 0; i < repeatNum; i++) {
            value[i] = this.valueFromElement(i);
        }
        return value;
    },
    valueFromElement: function(index) {
        var wrapperObj = this.getWrapper(index);
        return wrapperObj.find("input,select,textarea").val() || "";
    },
    valuePopulate: function(value) {
        var number = value.length;
        while (number > this.curRepeat) {
            this.addElement();
        }

        for (var i = 0; i < value.length; i++) {
            var v = value[i];
            this.valuePopulateToElement(i, v);
        }
    },
    valuePopulateToElement: function(index, value) {
        var wrapperObj = this.getWrapper(index);
        wrapperObj.find("input,select,textarea").val(value);
    },
    getWrapper: function(index) {
        var fieldId = this.model.getFieldId();
        return this.$fieldWrapper.find("#wrapper_" + fieldId + "_" + index);
    },
    fillArray: function(array, filler) {
        for (var i = 0; i < array.length; i++) {
            if (!array[i]) {
                array[i] = filler;
            }
        }
    },

    clearError: function(index) {
        var wrapperObj = this.getWrapper(index);
        wrapperObj.find(this.errMessageContainer).hide();
        wrapperObj.find("." + this.errorClassName).removeClass(this.errorClassName);
    }

});
FieldCameraView = FieldView.extend({
    input: "<img class='imageThumb' width='100%' data-field='<%= fieldId %>' data-index='<%= index %>'  type='<%= inputType %>'>",
    html5Cam: '<div class="html5Cam">' +
        '<div class="camActionBar"><button class="camCancel camBtn fh_appform_button_cancel">Cancel</button><button class="camOk camBtn fh_appform_button_action">Ok</button></div>' +
        '<div class="cam"></div>' +
        '</div>',
    onElementShow: function(index) {
        var captureBtn = $(this.renderButton(index, "<i class='icon-camera'></i>&nbsp;Capture Photo From Camera", "fhcam"));
        var libBtn = $(this.renderButton(index, "<i class='icon-folder-open'></i>&nbsp;Choose Photo from Library", "fhcam_lib"));
        var rmBtn = $(this.renderButton(index, "<i class='icon-remove-circle'></i>&nbsp;Remove Photo", "remove"));

      if(!this.readonly){
        this.getWrapper(index).append(captureBtn);
        this.getWrapper(index).append(libBtn);
        this.getWrapper(index).append(rmBtn);
        var self = this;
        captureBtn.on('click', function(e) {
            self.addFromCamera(e, index);
        });
        libBtn.on('click', function(e) {
            self.addFromLibrary(e, index);
        });
        rmBtn.on('click', function(e) {
            self.removeThumb(e, index);
        });
        rmBtn.hide();

        if($fh.forms.config.get("picture_source") === "library"){
          captureBtn.hide();
        } else if ($fh.forms.config.get("picture_source") === "camera"){
          libBtn.hide();
        }
      }
    },
    setImage: function(index, base64Img) {
        var wrapper = this.getWrapper(index);
        var img = wrapper.find('img.imageThumb');
        img.attr('src', base64Img).show();
        wrapper.find('button').hide();
        wrapper.find('.remove').show();
    },
    getImageThumb: function(index) {
        var wrapper = this.getWrapper(index);
        var img = wrapper.find('img.imageThumb');
        return img;
    },
    getCameraBtn: function(index) {
        var wrapper = this.getWrapper(index);
        return wrapper.find('button.fhcam');
    },
    getLibBtn: function(index) {
        var wrapper = this.getWrapper(index);
        return wrapper.find('button.fhcam_lib');
    },
    getRemoveBtn: function(index) {
        var wrapper = this.getWrapper(index);
        return wrapper.find('button.remove');
    },
    removeThumb: function(e, index) {
        e.preventDefault();
        var img = this.getImageThumb(index);
        img.removeAttr('src').hide();
        this.getLibBtn(index).show();
        this.getCameraBtn(index).show();
        this.getRemoveBtn(index).hide(); // this.trigger('imageRemoved'); // trigger events used by grouped camera fields NOTE: don't move to setImageData fn, could result in infinite event callback triggering as group camera field may call into setImageData()
    },
    addFromCamera: function(e, index) {
        e.preventDefault();
        var self = this;
        var params = {};

        params = this.model.getPhotoOptions();

        if (this.model.utils.isPhoneGapCamAvailable()) {
            this.model.utils.takePhoto(params, function(err, imageURI) {
                if (err) {
                    $fh.forms.log.e("Error Taking Photo", err);
                } else {
                    self.setImage(index, imageURI);
                }
            });
        } else if (this.model.utils.isHtml5CamAvailable()) {
            var camObj = $(self.html5Cam);
            var actionBar = camObj.find('.camActionBar');
            camObj.css({
                'position': 'fixed',
                'top': 0,
                'bottom': 0,
                'left': 0,
                'right': 0,
                'background': '#000',
                'z-index': 9999
            });
            actionBar.css({
                'text-align': 'center',
                'padding': '10px',
                'background': '#999'
            });
            actionBar.find('button').css({
                'width': '80px',
                'height': '30px',
                'margin-right': '8px',
                'font-size': '1.3em'
            });
            self.$el.append(camObj);
            actionBar.find('.camCancel').on('click', function() {
                self.model.utils.cancelHtml5Camera();
                camObj.remove();
            });
            this.model.utils.initHtml5Camera(params, function(err, video) {
                if (err) {
                    $fh.forms.log.e(err);
                    camObj.remove();
                } else {
                    $(video).css('width', '100%');
                    camObj.find('.cam').append(video);
                    actionBar.find('.camOk').on('click', function() {
                        self.model.utils.takePhoto(params, function(err, base64Image) {//The image that comes from the html5 camera is base64
                            camObj.remove();
                            if (err) {
                                $fh.forms.log.e(err);
                            } else {
                                self.setImage(index, base64Image);
                            }
                        });
                    });
                }
            });
        }
    },
    addFromLibrary: function(e, index) {
        var self = this;
        var params = {};
        if (self.model.utils.isPhoneGapCamAvailable()) {
            e.preventDefault();
            params.sourceType = Camera.PictureSourceType.PHOTOLIBRARY;
            self.model.utils.takePhoto(params, function(err, imageURI) {
                if (err) {
                    $fh.forms.log.e("error occured with take photo ", JSON.stringify(err));
                }
                if (imageURI) {
                    self.setImage(index, imageURI);
                }
            });
        } else {
            var file = document.createElement('input');
            file.type = 'file';
            var fileObj = $(file);
            fileObj.hide();

            if(self.$el.find('input[type="file"]').length > 0){
                fileObj = $(self.$el.find('input[type="file"]')[0]);
            } else {
                self.$el.append(fileObj);    
                fileObj = $(self.$el.find('input[type="file"]')[0]);
            }

            fileObj.off('click');
            fileObj.on('click', function(e){
                console.log("File CLicked ", e);
            });

            fileObj.off('change');
            fileObj.on('change', function() {
                var file = fileObj[0];
                if (file.files && file.files.length > 0) {
                    file = file.files[0];
                    fileObj.remove();
                    self.model.utils.fileSystem.fileToBase64(file, function(err, base64Img) {
                        if (err) {
                            $fh.forms.log.e(err);
                        } else {
                            self.setImage(index, base64Img, true);
                        }
                    });
                }
            });
            fileObj.trigger('click');
        }
    },
    valueFromElement: function(index) {
        var img = this.getImageThumb(index);
        return img.attr('src');
    },
    valuePopulateToElement: function(index, value) {
        if (value) {
            var imageData = null;
            if(value.imgHeader){
              imageData = value.data;
              var base64Img = value.imgHeader + imageData;
              this.setImage(index, base64Img);
            } else {
              this.setImage(index, value.data);
            }
        }
    }
});
FieldCheckboxView = FieldView.extend({
  checkboxes: '<div class="btn-group-vertical fh_appform_field_input col-xs-12 <%= repeatingClassName%>" data-toggle="buttons-checkbox"></div>',
  choice: '<button class="btn btn-primary text-left fh_appform_button_action col-xs-12" type="button" value="<%= value %>" name="<%= fieldId %>[]" data-field="<%= fieldId %>" data-index="<%= index %>"><i class="icon-check-empty choice_icon"></i><%= choice %></button>',


  renderInput: function(index) {
    var self=this;
    var subfields = this.model.getCheckBoxOptions();
    var fieldId=this.model.getFieldId();
    var choicesHtml = "";
    var checkboxesHtml = "";
    var html = "";
    var required = this.getFieldRequired(index);
    
    var repeatingClassName = this.model.isRepeating() ? this.repeatingClassName : this.nonRepeatingClassName;
    checkboxesHtml = _.template(this.checkboxes, {"repeatingClassName": repeatingClassName});
    checkboxesHtml = $(checkboxesHtml);

    $.each(subfields, function(i, subfield) {
      var choice = _.template(self.choice, {
        "fieldId": fieldId,
        "index": index,
        "choice": subfield.label,
        "value": subfield.label,
        "checked": (subfield.checked) ? "checked='checked'" : ""
      });
      choice = $(choice);
      choice.off('click');
      choice.on('click', function(e){
        $(this).find('.choice_icon').toggleClass('icon-check-empty');
        $(this).find('.choice_icon').toggleClass('icon-check');
      });

      checkboxesHtml.append(choice);
    });
    
    return checkboxesHtml;
  },
  valueFromElement: function(index) {
    var value = {
      selections: []
    };
    var wrapperObj=this.getWrapper(index);
    var checked=wrapperObj.find("button.active");
    checked.each(function(){
      value.selections.push($(this).val());
    });
    return value;
  },
  valuePopulateToElement: function(index,value) {
    var wrapperObj=this.getWrapper(index);
    if (!value || !(value instanceof Array)){
      return;
    }
    for (var i=0; i < value.length; i++){
      var v=value[i];
      wrapperObj.find("button[value='"+v+"']").addClass("active");
      wrapperObj.find("button[value='"+v+"'] .choice_icon").removeClass("icon-check-empty");
      wrapperObj.find("button[value='"+v+"'] .choice_icon").addClass("icon-check");
    }
  }
});

FieldEmailView = FieldView.extend({
   type:"email"
});
FieldFileView = FieldView.extend({
    input: "<button data-field='<%= fieldId %>' class='special_button fh_appform_button_action select col-xs-12' data-index='<%= index %>'  type='<%= inputType %>'><i class='icon-folder-openSelect'></i> A File</button>" +
        "<button data-field='<%= fieldId %>' class='special_button fh_appform_button_action remove col-xs-12' data-index='<%= index %>'  type='<%= inputType %>'><i class='icon-remove-circle'></i>&nbsp;Remove File Entry</button>" +
        "<input class='fh_appform_field_input' data-field='<%= fieldId %>' data-index='<%= index %>' type='<%= inputType %>' style=''/>",
    type: "file",
    initialize: function() {
        var self = this;

        self.fileObjs = [];
        FieldView.prototype.initialize.apply(self, arguments);
    },
    contentChanged: function(e) {
        var self = this;
        var fileEle = e.target;
        var filejQ = $(fileEle);
        var index = filejQ.data().index;
        var file = fileEle.files ? fileEle.files[0] : null;
        if (file) {
            self.validateElement(index, file, function(err) {
                //File Needs to be validated.
                if (!err) { //Validation of file is valid
                    var fileObj = {
                        "fileName": file.name,
                        "fileSize": file.size,
                        "fileType": file.type
                    };
                    self.showButton(index, fileObj);
                } else {
                    filejQ.val("");
                    self.showButton(index, null);
                }
            });
        } else { //user cancelled file selection
            self.showButton(index, null);
        }
    },
    valueFromElement: function(index) {
        var wrapperObj = this.getWrapper(index);
        var fileEle = wrapperObj.find(".fh_appform_field_input")[0];
        if (fileEle.files && fileEle.files.length > 0) { //new file
            return fileEle.files[0];
        } else { //sandboxed file
            return this.fileObjs[index];
        }
    },
    showButton: function(index, fileObj) {
        var self = this;
        var wrapperObj = this.getWrapper(index);
        var button = wrapperObj.find("button.select");
        var button_remove = wrapperObj.find("button.remove");
        var fileEle = wrapperObj.find(".fh_appform_field_input");

        button.show();

        if (fileObj == null) {
            button.text("Select A File");
            button_remove.hide();
        } else {
            button.text(fileObj.fileName + "(" + fileObj.fileSize + ")");
            button_remove.show();
        }

        if (this.readonly) {
            button_remove.hide();
        }

        //Some operating systems do not support opening a file select browser
        //http://viljamis.com/blog/2012/file-upload-support-on-mobile/
        if (navigator.userAgent.match(/(Android (1.0|1.1|1.5|1.6|2.0|2.1))|(Windows Phone (OS 7|8.0))|(XBLWP)|(ZuneWP)|(w(eb)?OSBrowser)|(webOS)|(Kindle\/(1.0|2.0|2.5|3.0))/)) {
            //If not supported, show a warning on-device. There is also a warning in the studio when creating the form.
           $(button).text("File upload not supported");
           $(button).attr("disabled", true);
           button.off("click");
         }

        button_remove.off("click");
        button_remove.on("click", function() {
            var index = $(this).data().index;
            if (self.fileObjs && self.fileObjs[index]) {
                self.fileObjs[index] = null;
            }
            self.resetFormElement(fileEle);
            self.showButton(index, null); // remove file entry
        });

    },
    resetFormElement: function(e) {
        e.wrap("<form>").closest("form").get(0).reset();
        e.unwrap();
    },
    valuePopulateToElement: function(index, value) {
        if (value) {
            this.fileObjs[index] = value;
            this.showButton(index, value);
        }
    },
    onElementShow: function(index) {
        this.showButton(index, null);
    }
});
FieldGeoView = FieldView.extend({
    input: "<input class='fh_appform_field_input col-xs-12 text-center <%= repeatingClassName%>' data-field='<%= fieldId %>' data-index='<%= index %>'  type='<%= inputType %>' disabled/>",
    buttonHtml: "<i class='icon-location-arrow'></i>&nbsp<%= buttonText %>",
    type: "text",
    initialize: function() {
        this.geoValues = [];
        this.locationUnit = this.model.getFieldDefinition().locationUnit;
        FieldView.prototype.initialize.apply(this, arguments);
    },
    renderInput: function(index) {
        var repeatingClassName = this.model.isRepeating() ? this.repeatingClassName : this.nonRepeatingClassName;
        var html = _.template(this.input, {
            "fieldId": this.model.getFieldId(),
            "index": index,
            "inputType": "text",
            "repeatingClassName": repeatingClassName
        });

        return $(html);
    },
    onElementShow: function(index) {
        var self = this;
        var rmBtn = $(this.renderButton(index, "<i class='icon-remove-circle'></i>&nbsp;Remove Location", "remove"));
        var btnLabel = this.locationUnit === "latlong" ? 'Capture Location (Lat/Lon)' : 'Capture Location (East/North)';
        btnLabel = _.template(this.buttonHtml, {
            "buttonText": btnLabel
        });
        var geoButton = $(this.renderButton(index, btnLabel, "fhgeo"));

        if (!this.readonly) {
            this.getWrapper(index).append(geoButton);
            this.getWrapper(index).append(rmBtn);

            geoButton.on("click", function(e) {
                self.getLocation(e, index);
            });

            rmBtn.on("click", function(e) {
                self.clearLocation(e, index);
                rmBtn.hide();
            });

            rmBtn.hide();
        }


    },
    clearLocation: function(e, index) {
        var textInput = this.getWrapper(index).find(".fh_appform_field_input");
        textInput.val("");
        this.geoValues.splice(index, 1); // Remove the geo value from the field
    },
    convertLocation: function(location) {
        var lat = location.lat;
        var lon = location.lon;
        var params = {
            lat: function() {
                return lat;
            },
            lon: function() {
                return lon;
            }
        };
        return OsGridRef.latLongToOsGrid(params);
    },
    renderElement: function(index) {
        var location = this.geoValues[index];
        var locStr = "";
        var wrapper = this.getWrapper(index);
        var textInput = wrapper.find(".fh_appform_field_input");
        if (location) {
            if (this.locationUnit === "latlong") {
                locStr = '(' + location.lat + ', ' + location["long"] + ')';
                wrapper.find(".remove").show();
            } else if (this.locationUnit === "eastnorth") {
                locStr = '(' + location.zone + ' ' + location.eastings + ', ' + location.northings + ')';
                wrapper.find(".remove").show();
            } else {
                $fh.forms.log.e("FieldGeo: Invalid location unit: " + locStr);
            }
            textInput.val(locStr);
        } else {
            wrapper.find(".remove").hide();
        }
        textInput.blur();
    },
    valuePopulateToElement: function(index, value) {
        this.geoValues[index] = value;
        this.renderElement(index);
    },
    valueFromElement: function(index) {
        return this.geoValues[index];
    },
    getLocation: function(e, index) {
        var that = this;
        e.preventDefault();
        var wrapper = that.getWrapper(index);
        var textInput = wrapper.find(".fh_appform_field_input");


        //$fh.geo does not exist on the theme preview.
        if ($fh.geo) {
            $fh.geo(function(res) {
                var location;

                res.lat = Number(Number(res.lat).toFixed(4));
                res.lon = Number(Number(res.lon).toFixed(4));
                if (that.locationUnit === "latlong") {
                    that.geoValues[index] = {
                        "lat": res.lat,
                        "long": res.lon
                    };
                } else if (that.locationUnit === "eastnorth") {
                    var en_location = that.convertLocation(res);
                    var locArr = en_location.toString().split(" ");
                    that.geoValues[index] = {
                        "zone": locArr[0],
                        "eastings": locArr[1],
                        "northings": locArr[2]
                    };
                } else {
                    $fh.forms.log.e("FieldGeo: Invalid location unit: " + locStr);
                }
                that.renderElement(index);
            }, function(msg, err) {
                textInput.attr('placeholder', 'Location could not be determined');
            });
        }

        return false;
    }
});
FieldMapView = FieldView.extend({
  extension_type: 'fhmap',
  input: "<div data-index='<%= index %>' id='<%= id%>' class='fh_map_canvas' style='width:<%= width%>; height:<%= height%>;'></div>",
  initialize: function() {
    this.mapInited = 0;
    this.maps = [];
    this.mapData = [];
    this.markers = [];
    this.allMapInitFunc = [];
    this.mapSettings = {
      mapWidth: '100%',
      mapHeight: '300px',
      defaultZoom: 16,
      location: {
        lon: -5.80078125,
        lat: 53.12040528310657
      }
    };
    FieldView.prototype.initialize.apply(this, arguments);
  },
  renderInput: function(index) {
    var inputEle = _.template(this.input, {
      width: this.mapSettings.mapWidth,
      height: this.mapSettings.mapHeight,
      'index': index,
      'id':Math.random()
    });
    return $(inputEle);
  },
  show: function() {
    this.$el.show();
    this.mapResize();
  },
  onMapInit: function(index) {
    this.mapInited++;
    if (this.mapInited === this.curRepeat) {
      // all map initialised
      this.allMapInit();
    }
  },
  allMapInit: function() {
    var func = this.allMapInitFunc.shift();
    while (typeof(func) !== "undefined") {
      if(typeof(func) === "function"){
        func();
        func = this.allMapInitFunc.shift();
      } else {
        func = this.allMapInitFunc.shift();
      }
    }
    this.mapResize();
  },
  onAllMapInit: function(func) {
    if (this.mapInited === this.curRepeat) {
      func();
      this.mapResize();
    } else {
      if (this.allMapInitFunc.indexOf(func) === -1) {
        this.allMapInitFunc.push(func);
      }
    }
  },
  onElementShow: function(index) {
    var wrapperObj = this.getWrapper(index);
    var self = this;

    var mapCanvas = wrapperObj.find('.fh_map_canvas')[0];

    if($fh.geo){
      $fh.geo({
        interval: 0
      }, function(geoRes) {
        // Override with geo, otherwise use defaults
        var location = {
          lat: geoRes.lat,
          lon: geoRes.lon
        };
        $fh.map({
          target: mapCanvas,
          lon: location.lon,
          lat: location.lat,
          zoom: self.mapSettings.defaultZoom,
          draggable: !self.readonly
        }, function(res) {
          self.maps[index] = res.map;

          var marker = new google.maps.Marker({
            position: self.maps[index].getCenter(),
            map: self.maps[index],
            draggable: !self.readonly,
            animation: google.maps.Animation.DROP,
            title: 'Drag this to set position'
          });
          self.markers[index] = marker;
          self.mapData[index] = {
            'lat': marker.getPosition().lat(),
            'long': marker.getPosition().lng(),
            'zoom': self.mapSettings.defaultZoom
          };
          self.onMapInit(index);
        }, function(err) {
          $fh.forms.log.e("Error getting map: ", err);
          self.onMapInit(index);
        });
      });
    }
  },
  mapResize: function() {
    var self = this;
    if (self.maps.length > 0) {
      for (var i = 0; i < self.maps.length; i++) {
        var map = this.maps[i];
        if (map) {
          google.maps.event.trigger(map, 'resize');
          map.setCenter(new google.maps.LatLng(self.mapData[i].lat, self.mapData[i]["long"]));
        }
      }
    }
  },
  onRender: function(){
    this.mapResize();
  },
  valueFromElement: function(index) {
    var map = this.maps[index];
    var marker = this.markers[index];
    if (map && marker) {
      return {
        'lat': marker.getPosition().lat(),
        'long': marker.getPosition().lng(),
        'zoom': map.getZoom()
      };
    } else {
      return null;
    }
  },
  valuePopulateToElement: function(index, value) {
    var that = this;
    function _handler() {
      var map = that.maps[index];
      var pt = new google.maps.LatLng(value.lat, value["long"]);
      that.mapData[index].lat = value.lat;
      that.mapData[index]["long"] = value["long"];
      map.setCenter(pt);
      map.setZoom(value.zoom);
      that.markers[index].setPosition(pt);
    }
    if (value){
      this.onAllMapInit(_handler);
    }

  }
});
FieldNumberView = FieldView.extend({
    type:"number",
    getHTMLInputType: function() {
      return "number";
    }
});

// We only capture this as text
// NOTE: validate plugin has a 'phoneUS' type. Could use this if needed
FieldPhoneView = FieldView.extend({
  type:"tel"
});
FieldRadioView = FieldView.extend({
  choice: '<button class="btn btn-primary text-left fh_appform_button_action" type="button" data-field="<%= fieldId %>" data-index="<%= index %>" data-value="<%= choice %>"><i class="icon-circle-blank choice_icon"></i><%= choice %></button>',
  radio: '<div class="btn-group-vertical fh_appform_field_input col-xs-12 <%= repeatingClassName%>" data-toggle="buttons-radio"></div>',

  renderInput: function(index) {
    var choices = this.model.getRadioOption();
    var self = this;
    var radioChoicesHtml = "";
    var fullRadioHtml = "";
    var html = "";
    var repeatingClassName = this.model.isRepeating() ? this.repeatingClassName : this.nonRepeatingClassName;
    var inputElement = _.template(self.radio, { "repeatingClassName": repeatingClassName});
    inputElement = $(inputElement);

    var fieldId = this.model.getFieldId();
    $.each(choices, function(i, choice) {
      var jQObj = _.template(self.choice, {
        "fieldId": fieldId,
        "choice": choice.label,
        "value": choice.label,
        "index": index
      });

      jQObj = $(jQObj);

      if (choice.checked === true) {
        jQObj.addClass('active');
        jQObj.removeClass('icon-circle-blank');
        jQObj.addClass('icon-circle');
      }

      jQObj.off('click');
      jQObj.on('click', function(e){
        $(this).parent().find('.choice_icon').removeClass('icon-circle');
        $(this).parent().find('.choice_icon').addClass('icon-circle-blank');

        $(this).find('.choice_icon').removeClass('icon-circle-blank');
        $(this).find('.choice_icon').addClass('icon-circle');  
      });

      inputElement.append(jQObj);
    });

    return inputElement;
  },
  valuePopulateToElement: function (index, value) {
    var wrapperObj = this.getWrapper(index);
    var opt = wrapperObj.find('button[data-value=\'' + value + '\']');
    if (opt.length === 0) {
      opt = wrapperObj.find('button:first-child');
    }
    opt.addClass("active");
    opt.find('.choice_icon').removeClass('icon-circle-blank');
    opt.find('.choice_icon').addClass('icon-circle');
  },
  valueFromElement: function (index) {
    var wrapperObj = this.getWrapper(index);

    var data = wrapperObj.find('button.active').data();
    if(data){
      return wrapperObj.find('button.active').data().value;  
    } else {
      return this.model.getRadioOption()[0].label;
    }
  },
  onElementShow: function(index){
    
  }
});
FieldSelectView = FieldView.extend({
  select: "<select class='fh_appform_field_input form-control <%= repeatingClassName%> col-xs-12' data-field='<%= fieldId %>' data-index='<%= index %>'><%= options %></select>",
  option: '<option value="<%= value %>" <%= selected %>><%= value %></option>',

  renderInput: function(index) {
    var fieldId=this.model.getFieldId();
    var choices = this.model.get('fieldOptions');
    choices = choices.definition.options;
    var options="";
    var selectHtml = "";
    var html = "";
    var repeatingClassName = this.model.isRepeating() ? this.repeatingClassName : this.nonRepeatingClassName;

    var self=this;
    $.each(choices, function(i, choice) {
      options += _.template(self.option, {
        "value": choice.label,
        "selected": (choice.checked) ? "selected='selected'" : ""
      });
    });

    return $(_.template(this.select, {
      "fieldId":fieldId,
      "index":index,
      "options":options,
      "repeatingClassName": repeatingClassName
    }));
  }
});
FieldSignatureView = FieldView.extend({
    extension_type: 'fhsig',
    input: "<img class='sigImage img-responsive' data-field='<%= fieldId %>' data-index='<%= index %>'/>",
    templates: {
        signaturePad: ['<div class="sigPad">', '<div class="sigPad_header col-xs-12">', '<button class="clearButton fh_appform_button_cancel btn btn-danger col-xs-5 col-xs-offset-1">Clear</button><button class="cap_sig_done_btn fh_appform_button_action btn btn-primary col-xs-5 col-xs-offset-1 pull-right">Done</button>', '<br style="clear:both;" />', '</div>', '<div class="sig sigWrapper">', '<canvas class="pad" width="<%= canvasWidth %>" height="<%= canvasHeight %>"></canvas>', '</div>', '</div>']
    },

    initialize: function(options) {
        FieldView.prototype.initialize.call(this, options);
        this.on('visible', this.clearError);
    },
    onElementShow: function(index) {
        if (!this.readonly) {
            var html = $(this.renderButton(index, "<i class='icon-pencil'></i>&nbsp;Capture Signature", this.extension_type));
            this.getWrapper(index).append(html);
            var self = this;
            html.on("click", function() {
                self.showSignatureCapture(index);
            });
        }

    },
    validate: function(e) {
        this.trigger("checkrules");
    },
    showSignatureCapture: function(index) {
        var self = this;
        var winHeight = $(window).height();
        var winWidth = $(window).width();
        var canvasHeight = winHeight - 70;
        var canvasWidth = winWidth - 2;
        var lineTop = canvasHeight - 20;

        this.$el.append(_.template(this.templates.signaturePad.join(''), {
            "canvasHeight": canvasHeight,
            "canvasWidth": canvasWidth
        }));
        var signaturePad = $('.sigPad', this.$el);

        var diff = $(window).height() - window.outerHeight;
        var diffpx = "" + diff + "px";
        signaturePad.css({
            position: 'fixed',
            'z-index': 9999,
            'bottom': '0px',
            'right': '0px',
            top: diffpx,
            left: '0px',
            'background-color': '#fff'
        });

        var navHeight = $('.sigNav', this.$el).outerHeight();
        $('.sigPad', this.$el).css({
            width: '100%',
            height: winHeight + 'px'
        });
        $('.sigWrapper', this.$el).css({
            height: (winHeight - navHeight - 20) + "px"
        });
        sigPad = $('.sigPad', this.$el).signaturePad({
            drawOnly: true,
            lineTop: lineTop
        });

        $(this.$el).data('sigpadInited', true);
        // Bind capture
        $('.cap_sig_done_btn', this.$el).unbind('click').bind('click', function(e) {
            // var loadingView = new LoadingView();
            // loadingView.show("generating signature");
            e.preventDefault();
            var sig = sigPad.getSignature(); // get the default image type
            if (sig && sig.length) {
                var sigData = sigPad.getSignatureImage();
                if (self.isEmptyImage(sigData)) { //toDataUrl not supported by current browser. fallback use bmp encoder
                    sigData = self.toBmp();
                }
                self.setSignature(index, sigData);
            }
            $('.sigPad', self.$el).hide();
        });
    },
    setSignature: function(index, base64Img) {
        var wrapper = this.getWrapper(index);
        wrapper.find("img.sigImage").attr("src", base64Img);
    },
    valueFromElement: function(index) {
        var wrapper = this.getWrapper(index);
        var img = wrapper.find("img.sigImage");
        return img.attr("src");
    },
    valuePopulateToElement: function(index, value) {
        if (value) {
            var base64Data = value.data;
            var base64Img = value.imgHeader + base64Data;
            var wrapper = this.getWrapper(index);
            var img = wrapper.find("img.sigImage");
            img.attr("src", base64Img);
        }

    },
    dbgImage: function(msg, image) {
        $fh.forms.log.d(msg + (image ? (image.substring(0, image.indexOf(",")) + "[len=" + image.length + "]") : " empty"));
    },

    toBmp: function(image) {
        image = _.extend({}, image || {}, {
            quality: 100,
            width: 248,
            height: 100
        });
        var sigData;
        var cnvs = $('.sigPad', self.$el).find('canvas')[0];

        var oScaledCanvas = this.scaleCanvas(cnvs, image.width, image.height);
        var oData = this.readCanvasData(oScaledCanvas);
        var strImgData = this.createBMP(oData);

        sigData = this.makeDataURI(strImgData, "image/bmp");
        return sigData;
    },

    // bitMap handling code
    readCanvasData: function(canvas) {
        var iWidth = parseInt(canvas.width, 10);
        var iHeight = parseInt(canvas.height, 10);
        return canvas.getContext("2d").getImageData(0, 0, iWidth, iHeight);
    },

    encodeData: function(data) {
        var strData = "";
        if (typeof data === "string") {
            strData = data;
        } else {
            var aData = data;
            for (var i = 0; i < aData.length; i++) {
                strData += String.fromCharCode(aData[i]);
            }
        }
        return btoa(strData);
    },

    createBMP: function(oData) {
        var aHeader = [];

        var iWidth = oData.width;
        var iHeight = oData.height;

        aHeader.push(0x42); // magic 1
        aHeader.push(0x4D);

        var iFileSize = iWidth * iHeight * 3 + 54; // total header size = 54
        // bytes
        aHeader.push(iFileSize % 256);
        iFileSize = Math.floor(iFileSize / 256);
        aHeader.push(iFileSize % 256);
        iFileSize = Math.floor(iFileSize / 256);
        aHeader.push(iFileSize % 256);
        iFileSize = Math.floor(iFileSize / 256);
        aHeader.push(iFileSize % 256);

        aHeader.push(0); // reserved
        aHeader.push(0);
        aHeader.push(0); // reserved
        aHeader.push(0);

        aHeader.push(54); // dataoffset
        aHeader.push(0);
        aHeader.push(0);
        aHeader.push(0);

        var aInfoHeader = [];
        aInfoHeader.push(40); // info header size
        aInfoHeader.push(0);
        aInfoHeader.push(0);
        aInfoHeader.push(0);

        var iImageWidth = iWidth;
        aInfoHeader.push(iImageWidth % 256);
        iImageWidth = Math.floor(iImageWidth / 256);
        aInfoHeader.push(iImageWidth % 256);
        iImageWidth = Math.floor(iImageWidth / 256);
        aInfoHeader.push(iImageWidth % 256);
        iImageWidth = Math.floor(iImageWidth / 256);
        aInfoHeader.push(iImageWidth % 256);

        var iImageHeight = iHeight;
        aInfoHeader.push(iImageHeight % 256);
        iImageHeight = Math.floor(iImageHeight / 256);
        aInfoHeader.push(iImageHeight % 256);
        iImageHeight = Math.floor(iImageHeight / 256);
        aInfoHeader.push(iImageHeight % 256);
        iImageHeight = Math.floor(iImageHeight / 256);
        aInfoHeader.push(iImageHeight % 256);

        aInfoHeader.push(1); // num of planes
        aInfoHeader.push(0);

        aInfoHeader.push(24); // num of bits per pixel
        aInfoHeader.push(0);

        aInfoHeader.push(0); // compression = none
        aInfoHeader.push(0);
        aInfoHeader.push(0);
        aInfoHeader.push(0);

        var iDataSize = iWidth * iHeight * 3;
        aInfoHeader.push(iDataSize % 256);
        iDataSize = Math.floor(iDataSize / 256);
        aInfoHeader.push(iDataSize % 256);
        iDataSize = Math.floor(iDataSize / 256);
        aInfoHeader.push(iDataSize % 256);
        iDataSize = Math.floor(iDataSize / 256);
        aInfoHeader.push(iDataSize % 256);

        for (var i = 0; i < 16; i++) {
            aInfoHeader.push(0); // these bytes not used
        }

        var iPadding = (4 - ((iWidth * 3) % 4)) % 4;

        var aImgData = oData.data;

        var strPixelData = "";
        var y = iHeight;
        do {
            var iOffsetY = iWidth * (y - 1) * 4;
            var strPixelRow = "";
            for (var x = 0; x < iWidth; x++) {
                var iOffsetX = 4 * x;

                strPixelRow += String.fromCharCode(aImgData[iOffsetY + iOffsetX + 2]);
                strPixelRow += String.fromCharCode(aImgData[iOffsetY + iOffsetX + 1]);
                strPixelRow += String.fromCharCode(aImgData[iOffsetY + iOffsetX]);
            }
            for (var c = 0; c < iPadding; c++) {
                strPixelRow += String.fromCharCode(0);
            }
            strPixelData += strPixelRow;
        } while (--y);

        var strEncoded = this.encodeData(aHeader.concat(aInfoHeader)) + this.encodeData(strPixelData);

        return strEncoded;
    },
    makeDataURI: function(strData, strMime) {
        return "data:" + strMime + ";base64," + strData;
    },
    scaleCanvas: function(canvas, iWidth, iHeight) {
        if (iWidth && iHeight) {
            var oSaveCanvas = document.createElement("canvas");
            oSaveCanvas.width = iWidth;
            oSaveCanvas.height = iHeight;
            oSaveCanvas.style.width = iWidth + "px";
            oSaveCanvas.style.height = iHeight + "px";

            var oSaveCtx = oSaveCanvas.getContext("2d");

            oSaveCtx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, iWidth, iHeight);
            return oSaveCanvas;
        }
        return canvas;
    },
    isEmptyImage: function(image) {
        return image === null || image === "" || image === "data:,";
    },
    splitImage: function(image) {
        var PREFIX = "data:";
        var ENCODING = ";base64,";
        var start = image.indexOf(PREFIX);
        var content_type = "image/bmp";
        var ext = "bmp";
        if (start >= 0) {
            var end = image.indexOf(ENCODING, start) + 1;
            content_type = image.substring(start, end - 1);
            ext = content_type.split("/")[1];
        }
        return [content_type, ext];
    }

});
FieldTextView = FieldView.extend({

});
FieldTextareaView = FieldView.extend({
    input: "<textarea class='fh_appform_field_input col-xs-12' data-field='<%= fieldId %>' data-index='<%= index %>'  ></textarea>"
});
FieldSectionBreak = FieldView.extend({
  className: "fh_appform_section_break panel panel-default",
  templates: {
      sectionBreak: '<div class="panel-heading"><%= sectionTitle %></div>'
  },
  renderEle:function(){
    return _.template(this.templates.sectionBreak, {sectionTitle: this.model.getName(), sectionDescription: this.model.getHelpText()});
  },
  renderTitle: function(){
    return "";
  },
  renderHelpText: function(){
    return "";
  }
});
FieldDateTimeView = FieldView.extend({
  extension_type: 'fhdate',
  inputTime: "<input class='fh_appform_field_input col-xs-12 text-center <%= repeatingClassName%>' data-field='<%= fieldId %>' data-index='<%= index %>' type='time'>",
  inputDate: "<input class='fh_appform_field_input col-xs-12 text-center   <%= repeatingClassName%>' data-field='<%= fieldId %>' data-index='<%= index %>' type='date'>",
  inputDateTime: "<input class='fh_appform_field_input col-xs-12 text-center   <%= repeatingClassName%>' data-field='<%= fieldId %>' data-index='<%= index %>' type='text'>",
  renderInput:function(index){
    var fieldId = this.model.getFieldId();
    var repeatingClassName = this.model.isRepeating() ? this.repeatingClassName : this.nonRepeatingClassName;

    var unit=this.getUnit();
    var template="";
    var buttonLabel="";
    if (unit==="datetime"){
      template=this.inputDateTime;
      buttonLabel="<i class='icon-calendar'></i> <i class='icon-time'></i>&nbspGet Current Date & Time";
    }else if (unit==="date"){
      template=this.inputDate;
      buttonLabel="<i class='icon-calendar'></i>&nbspGet Current Date";
    }else if (unit==="time"){
      template=this.inputTime;
      buttonLabel="<i class='icon-time'></i>&nbspGet Current Time";
    }
    var html=_.template(template,{
      "fieldId":fieldId,
      "index":index,
      "repeatingClassName": repeatingClassName
    });

    if(!this.readonly){
      html+=this.renderButton(index,buttonLabel,"fhdate");   
    }
    

    return $(html);
  },
  getUnit:function(){
    var def=this.model.getFieldDefinition();
    return def.datetimeUnit;
  },
  onRender:function(){
    var that=this;

    if(!this.readonly){
      this.$el.on("click","button",function(){
        that.action(this);
      });  
    }
  },
  action: function(el) {
    var index=$(el).data().index;
    var self = this;
    var now=new Date();
    if (self.getUnit() === "datetime") {
      $('input[data-index="'+index+'"]', this.$el).val(self.getDate(now)+" "+self.getTime(now)).blur();
    } else if (self.getUnit() === "date") {
      $('input[data-index="'+index+'"]', this.$el).val(self.getDate(now)).blur();
    } else if (self.getUnit() === "time") {
      $('input[data-index="'+index+'"]', this.$el).val(self.getTime(now)).blur();
    }
  },
  getDate:function(d){
    return "YYYY-MM-DD".replace("YYYY",d.getFullYear()).replace("MM",this.twoDigi(d.getMonth()+1)).replace("DD",this.twoDigi(d.getDate()));
  },
  getTime:function(d){
    return "HH:mm".replace("HH",this.twoDigi(d.getHours())).replace("mm",this.twoDigi(d.getMinutes()));
  },
  twoDigi:function(num){
    if (num<10){
      return "0"+num.toString();
    }else{
      return num.toString();
    }
  }
});
FieldUrlView = FieldView.extend({
  type: "url"
});
var PageView=BaseView.extend({

  viewMap: {
    "text": FieldTextView,
    "number": FieldNumberView,
    "textarea": FieldTextareaView,
    "radio": FieldRadioView,
    "checkboxes": FieldCheckboxView,
    "dropdown": FieldSelectView,
    "file": FieldFileView,
    "emailAddress": FieldEmailView,
    "phone": FieldPhoneView,
    "location": FieldGeoView,
    "photo": FieldCameraView,
    "signature": FieldSignatureView,
    "locationMap": FieldMapView,
    "dateTime":FieldDateTimeView,
    "sectionBreak":FieldSectionBreak,
    "url":FieldUrlView
  },
  templates : {
    pageTitle: '<div class="fh_appform_page_title text-center"><%= pageTitle %></div>',
    pageDescription: '<div class="fh_appform_page_description text-center"><h4><%= pageDescription%></h4></div>',
    section: ''
  },

  initialize: function(options) {
    this.options = options;
    var self = this;
    _.bindAll(this, 'render',"show","hide");
    // Page Model will emit events if user input meets page rule to hide / show the page.
    this.model.on("visible",self.show);
    this.model.on("hidden",self.hide);
    this.render();
  },

  render: function() {
    var self = this;
    this.fieldViews = {};
    this.sectionViews = {};
    // all pages hidden initially
    this.$el.empty().addClass('fh_appform_page fh_appform_hidden col-xs-12');

    // add to parent before init fields so validation can work
    this.options.parentEl.append(this.$el);

    var fieldModelList=this.model.getFieldModelList();

    var sections = this.model.getSections();

    function toggleSection(fieldTarget){
      if(fieldTarget){
        $('#' + fieldTarget).slideToggle(600);
        $('#' + fieldTarget + "_icon").toggleClass('icon-chevron-sign-up');
        $('#' + fieldTarget + "_icon").toggleClass('icon-chevron-sign-down');
      } 
    }

    if(sections != null){
      var sectionKey;
      var sectionIndex = 0;

      var sectionGroup = $('<div class="panel-group" id="accordion"></div>');
      

      //Add the section fields
      for(sectionKey in sections){
        var sectionEl = $(_.template(self.options.formView.$el.find('#temp_page_structure').html(), {"sectionId": sectionKey, title: sections[sectionKey].title, index: sectionIndex}));
        var sectionDivId = '#fh_appform_' + sectionKey + '_body_icon';
        sectionIndex++;
        sectionEl.find('.panel-heading').off('click');
        sectionEl.find(sectionDivId).off('click');

        sectionEl.find(sectionDivId).on('click', function(e){
          var fieldTarget = $(this).parent().data().field;
          toggleSection(fieldTarget);
        });

        sectionEl.find('.panel-heading').on('click', function(e){
          if($(e.target).data()){
            if($(e.target).data().field){
              toggleSection($(e.target).data().field);
            }  
          }
        });
        sectionGroup.append(sectionEl);
        sections[sectionKey].fields.forEach(function(field, index){
          var fieldType = field.getType();
          if (self.viewMap[fieldType]) {

            $fh.forms.log.l("*- "+fieldType);

            if(fieldType !== "sectionBreak"){
                self.fieldViews[field.get('_id')] = new self.viewMap[fieldType]({
                parentEl: sectionEl.find('.panel-body'),
                parentView: self,
                model: field,
                formView: self.options.formView,
                sectionName: sectionKey
              });  
            } 
          } else {
            $fh.forms.log.w('FIELD NOT SUPPORTED:' + fieldType);
          }
        });
      }

      this.$el.append(sectionGroup);
    } else {
      fieldModelList.forEach(function (field, index) {
        if(!field) {
          return;
        }
        var fieldType = field.getType();
        if (self.viewMap[fieldType]) {

          $fh.forms.log.l("*- "+fieldType);

          self.fieldViews[field.get('_id')] = new self.viewMap[fieldType]({
            parentEl: self.$el,
            parentView: self,
            model: field,
            formView: self.options.formView
          });
        } else {
          console.warn('FIELD NOT SUPPORTED:' + fieldType);
        }
      });
    }
  },

  expandSection: function(fieldId){
    var sections = this.model.getSections();
    var sectionFound = false;
    var sectionId = "";
    for(var sectionKey in sections){
      sections[sectionKey].fields.forEach(function(field, index){
        if(field.get("_id") === fieldId){
          sectionFound = true;
          sectionId = sectionKey;
        }
      });
    }

    if(sectionFound){
      $("#fh_appform_" + sectionId + "_body").slideDown(20);
      $("#fh_appform_" + sectionId + "_body_icon").removeClass('icon-minus');

      if(!$("#fh_appform_" + sectionId + "_body_icon").hasClass('icon-plus')){
         $("#fh_appform_" + sectionId + "_body_icon").addClass('icon-plus');
      }
    }
  },

  show: function () {
    var self = this;
    self.$el.show();

    for(var fieldViewId in self.fieldViews){
      if(self.fieldViews[fieldViewId].mapResize){
        self.fieldViews[fieldViewId].mapResize();
      }
    }
  },

  hide: function () {

    this.$el.hide();
  },

  showField: function (id) {
    // show field if it's on this page
    if (this.fieldViews[id]) {
      this.fieldViews[id].show();
    }
  },

  hideField: function (id) {
    // hide field if it's on this page
    if (this.fieldViews[id]) {
      this.fieldViews[id].hide();
    }
  },

  isValid: function () {
    // only validate form inputs on this page that are visible or type=hidden, or have validate_ignore class
    var validateEls = this.$el.find('.fh_appform_field_input').not('.validate_ignore]:hidden');
    return validateEls.length ? validateEls.valid() : true;
  }

});
var FormView = BaseView.extend({
  "pageNum": 0,
  "pageCount": 0,
  "pageViews": [],
  "submission": null,
  "fieldValue": [],
  templates: {
    formLogo: '<div class="fh_appform_logo_container col-xs-12"><div class="fh_appform_logo"></div></div>',
    formTitle: '<div class="fh_appform_form_title col-xs-12 text-center"><h1><%= title %></h1></div>'
  },
  events: {},
  elementNames: {
    formContainer: "#fh_appform_container"
  },

  initialize: function(options) {
    this.formEdited = false;
    this.options = this.options || options;
    this.readonly = this.options.readOnly;
    var self = this;
    _.bindAll(this, "checkRules", "onValidateError");
    this.$el = this.options.parentEl;
    this.fieldModels = [];
    this.pageViewStatus = {};
    this.$el.empty();
  },
  loadForm: function(params, cb) {
    var self = this;

    if (params.formId) {
      self.onLoad();
      $fh.forms.getForm(params, function(err, form) {
        if (err) {
          throw (err.body);
        }
        self.form = form;
        self.params = params;
        self.initWithForm(form, params);
        cb();
      });
    } else if (params.form) {
      self.form = params.form;
      self.params = params;
      self.initWithForm(params.form, params);
      cb();
    }
  },
  readOnly: function() {
    this.readonly = true;
    for (var i = 0; i < this.fieldViews.length; i++) {
      var fieldView = this.fieldViews[i];
      fieldView.$el.find("button,input,textarea,select").attr("disabled", "disabled");
    }
    this.$el.find("button.fh_appform_button_saveDraft").hide();
    this.$el.find(" button.fh_appform_button_submit").hide();
  },
  markFormEdited: function(){
    this.formEdited = true;
  },
  isFormEdited: function(){
    return this.formEdited;
  },
  onValidateError: function(res) {
    var self = this;
    var firstView = null;
    var invalidFieldId = null;
    var invalidPageNum = null;

    //Clear validate errors

    self.fieldViews.forEach(function(v) {
        var fieldId = v.model.getFieldId();
        if(res.hasOwnProperty(fieldId)){
          var result = res[fieldId];
          result.errorMessages = result.errorMessages || [];
          result.fieldErrorMessage = result.fieldErrorMessage || [];
          if (!result.valid) {
            if(invalidFieldId === null){
              invalidFieldId = fieldId;
              invalidPageNum = self.form.getPageNumberByFieldId(invalidFieldId);
            }
            for (var i = 0; i < result.errorMessages.length; i++) {
              if (result.errorMessages[i]) {
                v.setErrorText(i, result.errorMessages[i]);
              }
            }

            for (i = 0; i < result.fieldErrorMessage.length; i++) {
              if (result.fieldErrorMessage[i]) {
                v.setErrorText(i, result.fieldErrorMessage[i]);
              }
            }
          }
        }
    });

    if(invalidFieldId !== null && invalidPageNum !== null){
      var displayedIndex = this.getDisplayIndex(invalidPageNum) + 1;
      self.goToPage(invalidPageNum, false);

      self.pageViews[invalidPageNum].expandSection(invalidFieldId);

      $('html, body').animate({
          scrollTop: $("[data-field='" + invalidFieldId + "']").offset().top - 100
      }, 1000);



      this.$el.find("#fh_appform_page_error").html("Unable to submit form. Validation error on page " + displayedIndex);
      this.$el.find("#fh_appform_page_error").show();
    }
  },
  initWithForm: function(form, params) {
    var self = this;
    var pageView;
    self.formId = form.getFormId();

    self.$el.empty();
    self.$el.append("<div id='fh_appform_templates' style='display:none;'>" + FormTemplates + "</div>");
    self.model = form;

    //Page views are always added before anything else happens, need to render the form title first

    var formHtml = _.template(self.$el.find('#temp_form_structure').html(), {title: self.model.getName()});

    self.$el.append(formHtml);

    if (!params.submission) {
      params.submission = self.model.newSubmission();
    }
    self.submission = params.submission;
    self.submission.on("validationerror", self.onValidateError);

    // Init Pages --------------
    var pageModelList = form.getPageModelList();
    var pageViews = [];

    self.steps = new StepsView({
      parentEl: self.$el.find(this.elementNames.formContainer),
      parentView: self,
      model: self.model
    });

    for (var i = 0; i < pageModelList.length; i++) {
      var pageModel = pageModelList[i];
      var pageId = pageModel.getPageId();

      self.pageViewStatus[pageId] = {
        "targetId": pageId,
        "action": "show"
      };

      // get fieldModels
      var list = pageModel.getFieldModelList();
      self.fieldModels = self.fieldModels.concat(list);

      pageView = new PageView({
        model: pageModel,
        parentEl: self.$el.find(this.elementNames.formContainer),
        formView: self
      });
      pageViews.push(pageView);
    }
    var fieldViews = [];
    for (i = 0; i < pageViews.length; i++) {
      pageView = pageViews[i];
      var pageFieldViews = pageView.fieldViews;
      for (var key in pageFieldViews) {
        var fView = pageFieldViews[key];
        fieldViews.push(fView);
        fView.on("checkrules", self.checkRules);
        if (self.readonly) {
          fView.$el.find("input,button,textarea,select").attr("disabled", "disabled");
        }
      }
    }

    self.fieldViews = fieldViews;
    self.pageViews = pageViews;
    self.pageCount = pageViews.length;
    var buttonsHtml = _.template(self.$el.find('#temp_form_buttons').html());
    this.$el.find("#fh_appform_container.fh_appform_form_area").append(buttonsHtml);
  },
  checkRules: function(params) {
    var self = this;
    var submission = self.submission;
    params = params || {};

    function checkSubmissionRules() {
      submission.checkRules(function(err, res) {
        if (err) {
          console.error(err);
        } else {
          var actions = res.actions;
          var targetId;
          for (targetId in actions.pages) {
            self.pageViewStatus[targetId] = actions.pages[targetId];
          }

          var fields = actions.fields;

          for (targetId in fields) {
            self.performRuleAction("field", targetId, fields[targetId]["action"]);
          }
        }
        self.checkPages();
        self.steps.activePageChange(self);
      });
    }

    if (params.initialising) {
      checkSubmissionRules();
    } else {
      self.populateFieldViewsToSubmission(false, function() {
        checkSubmissionRules();
      });
    }
  },
  performRuleAction: function(type, targetId, action) {
    var target = null;
    if (type === "field") {
      target = this.getFieldViewById(targetId);
    }
    if (target === null) {
      console.error("cannot find target with id:" + targetId);
      return;
    }
    switch (action) {
      case "show":
        target.$el.show();
        break;
      case "hide":
        target.$el.hide();
        break;
      default:
        console.error("action not defined:" + action);
    }
  },
  rebindButtons: function() {
    var self = this;
    this.$el.find("button.fh_appform_button_next").unbind().bind("click", function() {
      self.nextPage();
    });

    this.$el.find("button.fh_appform_button_previous").unbind().bind("click", function() {
      self.prevPage();
    });

    this.$el.find("button.fh_appform_button_saveDraft").unbind().bind("click", function() {
      if($fh.forms.config.isStudioMode()){//Studio mode does not submit.
        alert("Please create a project and interact with the form there.");
      } else {
        self.saveToDraft();
      }
    });
    this.$el.find("button.fh_appform_button_submit").unbind().bind("click", function() {
      if($fh.forms.config.isStudioMode()){//Studio mode does not submit.
        alert("Please create a project and interact with the form there.");
      } else {
        self.submit();
      }
    });
  },
  setSubmission: function(sub) {
    this.submission = sub;
  },
  getSubmission: function() {
    return this.submission;
  },
  getPageIndexById: function(pageId){
    for (var i = 0; i < this.pageViews.length; i++) {
      var pageView = this.pageViews[i];
      var pId = pageView.model.getPageId();
      if (pId === pageId) {
        return i;
      }
    }
    return null;
  },
  getPageViewById: function(pageId) {
    for (var i = 0; i < this.pageViews.length; i++) {
      var pageView = this.pageViews[i];
      var pId = pageView.model.getPageId();
      if (pId === pageId) {
        return pageView;
      }
    }
    return null;
  },
  getFieldViewById: function(fieldId) {
    for (var i = 0; i < this.fieldViews.length; i++) {
      var fieldView = this.fieldViews[i];
      var pId = fieldView.model.getFieldId();
      if (pId === fieldId) {
        return fieldView;
      }
    }
    return null;
  },
  checkPages: function() {

    var displayedPages = this.getNumDisplayedPages();
    var displayedIndex = this.getDisplayIndex();

    var prevButton = this.$el.find("button.fh_appform_button_previous").parent();
    var nextButton = this.$el.find("button.fh_appform_button_next").parent();
    var submitButton = this.$el.find(" button.fh_appform_button_submit").parent();
    var saveDraftButton = this.$el.find("button.fh_appform_button_saveDraft").parent();
    

    if (displayedIndex === 0 && displayedIndex === displayedPages - 1) {
        prevButton.hide();
        nextButton.hide();
        saveDraftButton.show();
        submitButton.show();
        if(this.readonly){
          this.$el.find("#fh_appform_navigation_buttons").hide();  
        }
        
    } else if (displayedIndex === 0) {
        prevButton.hide();
        nextButton.show();
        saveDraftButton.show();
        submitButton.hide();
    } else if (displayedIndex === displayedPages - 1) {
        prevButton.show();
        nextButton.hide();
        saveDraftButton.show();
        submitButton.show();
    } else {
        prevButton.show();
        nextButton.show();
        saveDraftButton.show();
        submitButton.hide();
    }

    if (this.readonly) {
        saveDraftButton.hide();
        submitButton.hide();
    }
  },
  render: function() {
    this.rebindButtons();
    this.hideAllPages();
    this.pageViews[0].show();
    this.pageNum = 0;
    this.steps.activePageChange(this);
    this.checkRules({
      initialising: false
    });
    return this;
  },
  getNextPageIndex: function(currentPageIndex) {
    var self = this;

    if(pageIndex >= this.pageViews.length){
      return this.pageViews.length -1;
    }

    for (var pageIndex = currentPageIndex + 1; pageIndex < this.pageViews.length; pageIndex += 1) {
      var pageId = this.pageViews[pageIndex].model.getPageId();
      var pageAction = self.pageViewStatus[pageId].action;

      if (pageAction === "show") {
        return pageIndex;
      }
    }
  },
  getPrevPageIndex: function(currentPageIndex) {
    var self = this;
    if(currentPageIndex <= 0){//Can't display pages before 0.
      return 0;
    }

    for (var pageIndex = currentPageIndex - 1; pageIndex >= 0; pageIndex--) {
      var pageId = self.pageViews[pageIndex].model.getPageId();
      var pageAction = self.pageViewStatus[pageId].action;

      if (pageAction === "show") {
        return pageIndex;
      }
    }
  },
  getDisplayIndex: function(pageNum) {
    var self = this;
    var currentIndex = (pageNum === null || typeof(pageNum) === 'undefined') ? this.pageNum: pageNum;

    for (var pageIndex = this.pageNum; pageIndex > 0; pageIndex--) {
      var pageId = this.pageViews[pageIndex].model.getPageId();
      var pageAction = self.pageViewStatus[pageId].action;

      if (pageAction === "hide") {
        currentIndex -= 1;
      }
    }

    return currentIndex;
  },
  getNumDisplayedPages: function() {
    return this.getDisplayedPages().length;
  },
  getDisplayedPages: function() {
    var self = this;
    var displayedPages = [];
    for (var pageIndex = 0; pageIndex < self.pageViews.length; pageIndex++) {
      var pageId = this.pageViews[pageIndex].model.getPageId();
      var pageAction = self.pageViewStatus[pageId].action;

      if (pageAction === "show") {
        displayedPages.push(pageId);
      }
    }

    return displayedPages;
  },
  displayCurrentPage: function(scroll){
    this.hideAllPages();
    this.pageViews[this.pageNum].show();
    this.steps.activePageChange(this);
    this.checkPages();
    if(scroll){
      this.scrollToTop();  
    }
  },
  goToPage: function(pageNum, scroll){
    if(_.isFinite(pageNum)){
      this.pageNum = parseInt(pageNum);
      this.displayCurrentPage(scroll);
    } else {
      $fh.forms.log.e("Error switching page: Invalid argument ", pageNum);
    }     
  },
  nextPage: function() {
    this.pageNum = this.getNextPageIndex(this.pageNum);
    this.displayCurrentPage(true);
  },
  prevPage: function() {
    this.pageNum = this.getPrevPageIndex(this.pageNum);
    this.displayCurrentPage(true);
  },
  scrollToTop: function(){
    //Positioning the window to the top of the form container
    $('html, body').animate({
          scrollTop: 0
    }, 500, function() { 
        window.scrollTo(0, 0);
    });
  },
  backEvent: function(){
    var self = this;
    if(this.pageNum <= 0){ // Already at the first page, exiting the form. Up to the client what to do with this result.
      return false;
    } 
    self.prevPage();
    return true;
  },
  hideAllPages: function() {
    this.pageViews.forEach(function(view) {
      //make sure to use $el when calling jquery func
      view.hide();
    });
  },
  validateForm: function(cb){
    var self = this;
    this.populateFieldViewsToSubmission(function() {
      self.submission.validateSubmission(cb);
    });
  },
  submit: function(cb) {
    var self = this;
    this.populateFieldViewsToSubmission(function() {
      self.submission.submit(function(err, res) {
        if (err) {
          $fh.forms.log.e("Error Submitting Form:", err);
          if(typeof(cb) === "function"){
            cb(err);
          }
        } else {
          self.submission.upload(function(err, uploadTask) {
            if (err) {
              $fh.forms.log.e("Error Uploading Form:", err);
            }

            if(typeof(cb) === "function"){
              cb();
            }

            self.$el.empty();
          });
        }
      });
    });
  },
  saveToDraft: function(cb) {
    var self = this;
    this.populateFieldViewsToSubmission(function() {
      self.submission.saveDraft(function(err, res) {
        if (err) {
          $fh.forms.log.e(err);
        } else {
          self.formEdited = false;  
        }
        
        if(typeof(cb) === "function"){
          cb(err);
        }
      });
    });
  },
  populateFieldViewsToSubmission: function(isStore, cb) {
    if (typeof cb === "undefined") {
      cb = isStore;
      isStore = true;
    }
    var submission = this.submission;
    var fieldViews = this.fieldViews;
    var fieldId;
    var tmpObj = [];
    for (var i = 0; i < fieldViews.length; i++) {
      var fieldView = fieldViews[i];
      var val = fieldView.value();
      fieldId = fieldView.model.getFieldId();
      var fieldType = fieldView.model.getType();

      if (fieldType !== "sectionBreak") {
        for (var j = 0; j < val.length; j++) {
          var v = val[j];
          tmpObj.push({
            id: fieldId,
            value: v,
            index: j
          });
        }
      }
    }
    var count = tmpObj.length;
    for (i = 0; i < tmpObj.length; i++) {
      var item = tmpObj[i];
      fieldId = item.id;
      var value = item.value;
      var index = item.index;

      if (value !== null || typeof(value) !== 'undefined') {
        submission.addInputValue({
          fieldId: fieldId,
          value: value,
          index: index,
          isStore: isStore
        }, function(err, res) {
          if (err) {
            console.error(err);
          }
          count--;
          if (count === 0) {
            cb();
          }
        });
      } else {
        $fh.forms.log.e("Input value for fieldId " + fieldId + " was not defined");
        count--;
        if (count === 0) {
          cb();
        }
      }
    }
  },

  setInputValue: function(fieldId, value) {
    var self = this;
    for (var i = 0; i < this.fieldValue.length; i++) {
      var item = this.fieldValue[i];
      if (item.id === fieldId) {
        this.fieldValue.splice(i, 1);
      }
    }
    for (i = 0; i < value.length; i++) {
      var v = value[i];
      this.fieldValue.push({
        id: fieldId,
        value: v
      });
    }
  }
});
var FromJsonView = BaseView.extend({
    events: {
        'click button#convert': 'convert'
    },
    templates: {
        body: '<h1>Insert JSON</h1><textarea id="jsonBox" rows="30" cols="50"></textarea><button id="convert">Convert</button><div id="resultArea"></div>'
    },
    el: '#jsonPage',
    initialize: function(options) {
        this.options = options;
        _.bindAll(this, 'render');
    },
    show: function() {
        $(this.$el).show();
    },
    hide: function() {
        $(this.$el).hide();
    },
    render: function() {
        $(this.$el).html(this.templates.body);
        this.show();
    },
    convert: function() {
        var json = $('#jsonBox').val();
        var jsonData;
        try {
            jsonData = JSON.parse(json);
        } catch (e) {
            $fh.forms.log.d("Error parsing json: ", e);
            throw 'Invalid JSON object';
        }
        var params = {
            formId: new Date().getTime(),
            rawMode: true,
            rawData: jsonData
        };
        var formView = new FormView({
            parentEl: $('#backbone #resultArea')
        });
        formView.loadForm(params, function(err) {
            formView.render();
        });
    }
});
SectionView=BaseView.extend({

  initialize: function(options) {
    this.options = options;
    _.bindAll(this, 'render');
  },
  render: function(){
    this.options.parentEl.append(this.$el);
  }

});
StepsView = Backbone.View.extend({
  className: 'fh_appform_progress_steps col-xs-12',

  templates: {
      table: '<ul class="pagination pagination-lg col-xs-12"></ul>',
      step: '<li data-index="<%= index %>"><span class="number_container text-center" style="width: <%= width %>%;"><%= step_num %></span></li>',
      page_title: '<div class="col-xs-12 text-center"><h3 class="fh_appform_page_title"></h3></div>'
  },
  events: {
    'click li': 'switchPage'
  },

  initialize: function(options) {
    this.options = options;
    var self = this;

    _.bindAll(this, 'render');
    this.parentView = this.options.parentView;
    this.options.parentEl.append(this.$el);
  },

  render: function() {
    var self = this;
    this.$el.empty();
    var table = $(self.templates.table);

    var displayedPages = this.parentView.getDisplayedPages();
    var width = 100;

    if(displayedPages.length > 0){
      width = 100 / displayedPages.length;
    }

    displayedPages.forEach(function(pageId, index) {
      var pageModel = self.parentView.getPageViewById(pageId).model;
      var item = $(_.template(self.templates.step, {
          step_name: pageModel.getName(),
          step_num: index + 1,
          index: self.parentView.getPageIndexById(pageId),
          width: width
      }));
      $(table).append(item);
    });

    this.$el.append(table);
    this.$el.append(self.templates.page_title);
    return this;
  },
  switchPage: function(e){
    var index = 0;

    if(e && $(e.currentTarget).data()){
      index = $(e.currentTarget).data().index;
      if(typeof(index) !== "undefined"){
        this.parentView.goToPage(index, false);
      }
    }
  },

  activePageChange: function() {
    var self = this;
    self.render();
    self.$el.find('li').removeClass('active');

    var displayIndex = self.parentView.getDisplayIndex();
    var pageModel = self.parentView.pageViews[self.parentView.pageNum].model;
    var pageName = pageModel.getName();

    self.$el.find('li:eq(' + displayIndex + ')').addClass('active');

    if(pageName.length === 0){
      pageName = "Page " + (displayIndex + 1);
    }

    self.$el.find('.fh_appform_page_title').html(pageName);
  }

});
var ConfigView = Backbone.View.extend({
    templates: {

    },
    "_events": {
        "click #_viewLogsBtn": "viewLogs",
        "click #_clearLogsBtn": "clearLogs",
        "click #_sendLogsBtn": "sendLogs",
        "click #_closeViewBtn": "closeViewLogs",
        "click #fh_appform_show_deviceId": "showDeviceId",
        "click #logger": "toggleLogging"
    },
    toggleLogging: function() {
        var loggingEnabled = $fh.forms.config.getConfig().logger;
        loggingEnabled = !loggingEnabled;
        $fh.forms.config.set("logger", loggingEnabled);

        var loggingMessage = loggingEnabled ? "Logging Enabled" : "Logging Disabled";
        var checkedClass = loggingEnabled ? "active" : "";

        if (loggingEnabled) {
            this.$el.find('.choice_icon').addClass('icon-circle');
            this.$el.find('.choice_icon').removeClass('icon-circle-blank');
        } else {
            this.$el.find('.choice_icon').addClass('icon-circle-blank');
            this.$el.find('.choice_icon').removeClass('icon-circle');
        }

        this.$el.find('#logger_message').html(loggingMessage);
    },
    showDeviceId: function() {
        this.$el.find("#logsModalLabelBody").html("Device Id: " + $fh.forms.config.getDeviceId());
        this.$el.find("#logsModal").modal();
    },
    viewLogs: function() {
        var logs = this.getPolishedLogs();
        this.$el.find("#logsModalLabelBody").html(logs);
        this.$el.find("#logsModal").modal();
    },
    getPolishedLogs: function() {
        var arr = [];
        var logs = $fh.forms.log.getLogs();
        var patterns = [{
            reg: /^.+\sERROR\s.*/,
            classStyle: "list-group-item-danger"
        }, {
            reg: /^.+\sWARNING\s.*/,
            classStyle: "list-group-item-warning"
        }, {
            reg: /^.+\sLOG\s.*/,
            classStyle: "list-group-item-info"
        }, {
            reg: /^.+\sDEBUG\s.*/,
            classStyle: "list-group-item-success"
        }, {
            reg: /^.+\sUNKNOWN\s.*/,
            classStyle: "list-group-item-warning"
        }];


        var listStr = "";

        for (var i = 0; i < logs.length; i++) {
            var log = logs[i];
            for (var j = 0; j < patterns.length; j++) {
                var p = patterns[j];
                if (p.reg.test(log)) {
                    listStr += _.template($('#temp_config_log_item').html(), {
                        logClass: p.classStyle,
                        message: log
                    });
                    break;
                }
            }
        }
        var listGroup = _.template($('#temp_config_log').html(), {
            listStr: listStr
        });
        return listGroup;
    },

    clearLogs: function() {
        var self = this;
        $fh.forms.log.clearLogs(function() {
            self.$el.find("#_logViewDiv").html("");
            alert("Logs cleared.");
        });
    },
    sendLogs: function() {
        $fh.forms.log.sendLogs(function(err) {
            if (err) {
                alert(err);
            } else {
                alert("Log has been sent to:" + $fh.forms.config.get("log_email"));
            }
        });
    },
    closeViewLogs: function() {
        this.$el.find("#_logsViewPanel").hide();
    },
    initialize: function(options) {
        this.options = options;
        this.events = _.extend({}, this._events, this.events);
    },
    render: function() {
        this.$el.empty();

        this.$el.append("<div id='fh_appform_templates' style='display:none;'>" + FormTemplates + "</div>");
        //Append Logo
        this.$el.append(_.template(this.$el.find('#forms-logo-sdk').html()));
        var props = $fh.forms.config.getConfig();

        var cameraSettingsHtml = _.template(this.$el.find('#temp_config_camera').html(), props);
        var submissionSettingsHtml = _.template(this.$el.find('#temp_config_submissions').html(), props);
        var debuggingSettingsHtml = _.template(this.$el.find('#temp_config_debugging').html(), props);
        var miscSettingsHtml = _.template(this.$el.find('#temp_config_misc').html(), props);

        this.$el.append(miscSettingsHtml);
        this.$el.append(debuggingSettingsHtml);
        this.$el.append(cameraSettingsHtml);
        this.$el.append(submissionSettingsHtml);

        this.$el.find('#sent_items_to_keep_list').tagsinput('items');
        this.$el.find('.bootstrap-tagsinput').addClass('fh_appform_field_input');

        this.$el.find('.panel-heading').click(function(e) {
            console.log(e);

            var field = $(e.currentTarget).data().field;
            $('#' + field).slideToggle();
            $('#' + field + '-icon').toggleClass('icon-chevron-sign-up');
            $('#' + field + '-icon').toggleClass('icon-chevron-sign-down');
        });


        if (!$fh.forms.config.editAllowed()) {
            //Hide sections
            this.$el.find('#camera-settings').hide();
            this.$el.find('#submission-settings').hide();

            //Hide fields
            this.$el.find('#log_level_div').hide();
            this.$el.find('#log_email_div').hide();
            this.$el.find('#log_line_limit_div').hide();
            this.$el.find('#logger_wrapper_div').hide();
        }
        return this;
    },
    save: function(cb) {
        $fh.forms.log.l("Saving config");
        var inputs = this.$el.find("input,select,textarea,button[data-key='logger']");

        if ($fh.forms.config.editAllowed()) {
            inputs.each(function() {
                var key = $(this).data().key;
                var val = $(this).val();

                if (key === "logger") {
                    if ($(this).hasClass("active")) {
                        val = true;
                    } else {
                        val = false;
                    }
                }

                if (key === "sent_items_to_keep_list") {
                    //Parse the strings
                    if (val && val.filter) {
                        val = val.filter(function(selectValue) {
                            selectValue = parseInt(selectValue);
                            return !isNaN(selectValue);
                        });

                        val = _.map(val, function(value) {
                            return parseInt(value);
                        });

                        val.sort(function(a, b) {
                            return a - b;
                        });
                    } else {
                        return;
                    }

                }

                $fh.forms.config.set(key, val);
            });

            $fh.forms.config.saveConfig(cb);
        } else {
            alert("Editing config not permitted.");
        }
    }
});
if (typeof $fh === 'undefined') {
  $fh = {};
}
if (!$fh.forms) {
  $fh.forms = {};
}
$fh.forms.renderForm = function (params, cb) {
  var parentEl = params.container;
  var formId = params.formId;
  var fromRemote = params.fromRemote || false;
  var type = params.type || 'backbone';
  var form = new FormView({ parentEl: parentEl });
  form.loadForm(params, function () {
    if (type === 'backbone') {
      cb(null, form);
    } else if (type === 'html') {
      //TODO convert backbone view to html.
      cb(null, form);
    }
  });
};
/**
 *
 * @param params Object {"formId":String,"rawMode":Boolean,"rawMode":Boolean}
 * no io being done so no need for callback
 */
$fh.forms.renderFormFromJSON = function (params) {
  if (!params){
    throw new Error('params cannot be empty');
  }
  if (!params.rawData) {
    throw new Error('raw json data must be passed in the params.rawData');
  }
  if (!params.container) {
    throw new Error('a container element must be passed in the params.container');
  }

  params.formId = new Date().getTime();
  params.rawMode = true;
  var formView = new FormView({ parentEl: params.container });
  formView.loadForm(params, function (err) {
    if (err) {
      console.error('error loading form for renderFormFromJSON ', err);
    }
    formView.render();
  });
};
$fh.forms.renderFormList = function (params, cb) {
  var fromRemote = params.fromRemote || false;
  var parentEl = params.parentEl;
  $fh.forms.getForms({ fromRemote: fromRemote }, function (err, forms) {
    formListView = new FormListView({
      'model': forms,
      'parentEl': parentEl
    });
    formListView.render();
  });
};
$fh.forms.backbone = {};
$fh.forms.backbone.FormView = FormView;
$fh.forms.backbone.ConfigView=ConfigView;


//end  module;

//this is partial file which define the end of closure
})(window || module.exports);
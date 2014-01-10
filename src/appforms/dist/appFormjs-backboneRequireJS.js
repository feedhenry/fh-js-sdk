define([
  "underscore", "jquery", "backbone", "appFormCore"
], function(_, jQuery, Backbone){

/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/*  Geodesy representation conversion functions (c) Chris Veness 2002-2012                        */
/*   - www.movable-type.co.uk/scripts/latlong.html                                                */
/*                                                                                                */
/*  Sample usage:                                                                                 */
/*    var lat = Geo.parseDMS('51Â° 28â€² 40.12â€³ N');                                                 */
/*    var lon = Geo.parseDMS('000Â° 00â€² 05.31â€³ W');                                                */
/*    var p1 = new LatLon(lat, lon);                                                              */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */


var Geo = {};  // Geo namespace, representing static class


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
Geo.parseDMS = function(dmsStr) {
  if (typeof deg == 'object') throw new TypeError('Geo.parseDMS - dmsStr is [DOM?] object');
  
  // check for signed decimal degrees without NSEW, if so return it directly
  if (typeof dmsStr === 'number' && isFinite(dmsStr)) return Number(dmsStr);
  
  // strip off any sign or compass dir'n & split out separate d/m/s
  var dms = String(dmsStr).trim().replace(/^-/,'').replace(/[NSEW]$/i,'').split(/[^0-9.,]+/);
  if (dms[dms.length-1]=='') dms.splice(dms.length-1);  // from trailing symbol
  
  if (dms == '') return NaN;
  
  // and convert to decimal degrees...
  switch (dms.length) {
    case 3:  // interpret 3-part result as d/m/s
      var deg = dms[0]/1 + dms[1]/60 + dms[2]/3600; 
      break;
    case 2:  // interpret 2-part result as d/m
      var deg = dms[0]/1 + dms[1]/60; 
      break;
    case 1:  // just d (possibly decimal) or non-separated dddmmss
      var deg = dms[0];
      // check for fixed-width unseparated format eg 0033709W
      //if (/[NS]/i.test(dmsStr)) deg = '0' + deg;  // - normalise N/S to 3-digit degrees
      //if (/[0-9]{7}/.test(deg)) deg = deg.slice(0,3)/1 + deg.slice(3,5)/60 + deg.slice(5)/3600; 
      break;
    default:
      return NaN;
  }
  if (/^-|[WS]$/i.test(dmsStr.trim())) deg = -deg; // take '-', west and south as -ve
  return Number(deg);
}


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
Geo.toDMS = function(deg, format, dp) {
  if (typeof deg == 'object') throw new TypeError('Geo.toDMS - deg is [DOM?] object');
  if (isNaN(deg)) return null;  // give up here if we can't make a number from deg
  
    // default values
  if (typeof format == 'undefined') format = 'dms';
  if (typeof dp == 'undefined') {
    switch (format) {
      case 'd': dp = 4; break;
      case 'dm': dp = 2; break;
      case 'dms': dp = 0; break;
      default: format = 'dms'; dp = 0;  // be forgiving on invalid format
    }
  }
  
  deg = Math.abs(deg);  // (unsigned result ready for appending compass dir'n)
  
  switch (format) {
    case 'd':
      d = deg.toFixed(dp);     // round degrees
      if (d<100) d = '0' + d;  // pad with leading zeros
      if (d<10) d = '0' + d;
      dms = d + '\u00B0';      // add Âº symbol
      break;
    case 'dm':
      var min = (deg*60).toFixed(dp);  // convert degrees to minutes & round
      var d = Math.floor(min / 60);    // get component deg/min
      var m = (min % 60).toFixed(dp);  // pad with trailing zeros
      if (d<100) d = '0' + d;          // pad with leading zeros
      if (d<10) d = '0' + d;
      if (m<10) m = '0' + m;
      dms = d + '\u00B0' + m + '\u2032';  // add Âº, ' symbols
      break;
    case 'dms':
      var sec = (deg*3600).toFixed(dp);  // convert degrees to seconds & round
      var d = Math.floor(sec / 3600);    // get component deg/min/sec
      var m = Math.floor(sec/60) % 60;
      var s = (sec % 60).toFixed(dp);    // pad with trailing zeros
      if (d<100) d = '0' + d;            // pad with leading zeros
      if (d<10) d = '0' + d;
      if (m<10) m = '0' + m;
      if (s<10) s = '0' + s;
      dms = d + '\u00B0' + m + '\u2032' + s + '\u2033';  // add Âº, ', " symbols
      break;
  }
  
  return dms;
}


/**
 * Convert numeric degrees to deg/min/sec latitude (suffixed with N/S)
 *
 * @param   {Number} deg: Degrees
 * @param   {String} [format=dms]: Return value as 'd', 'dm', 'dms'
 * @param   {Number} [dp=0|2|4]: No of decimal places to use - default 0 for dms, 2 for dm, 4 for d
 * @returns {String} Deg/min/seconds
 */
Geo.toLat = function(deg, format, dp) {
  var lat = Geo.toDMS(deg, format, dp);
  return lat==null ? 'â€“' : lat.slice(1) + (deg<0 ? 'S' : 'N');  // knock off initial '0' for lat!
}


/**
 * Convert numeric degrees to deg/min/sec longitude (suffixed with E/W)
 *
 * @param   {Number} deg: Degrees
 * @param   {String} [format=dms]: Return value as 'd', 'dm', 'dms'
 * @param   {Number} [dp=0|2|4]: No of decimal places to use - default 0 for dms, 2 for dm, 4 for d
 * @returns {String} Deg/min/seconds
 */
Geo.toLon = function(deg, format, dp) {
  var lon = Geo.toDMS(deg, format, dp);
  return lon==null ? 'â€“' : lon + (deg<0 ? 'W' : 'E');
}


/**
 * Convert numeric degrees to deg/min/sec as a bearing (0Âº..360Âº)
 *
 * @param   {Number} deg: Degrees
 * @param   {String} [format=dms]: Return value as 'd', 'dm', 'dms'
 * @param   {Number} [dp=0|2|4]: No of decimal places to use - default 0 for dms, 2 for dm, 4 for d
 * @returns {String} Deg/min/seconds
 */
Geo.toBrng = function(deg, format, dp) {
  deg = (Number(deg)+360) % 360;  // normalise -ve values to 180Âº..360Âº
  var brng =  Geo.toDMS(deg, format, dp);
  return brng==null ? 'â€“' : brng.replace('360', '0');  // just in case rounding took us up to 360Âº!
}


/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
if (!window.console) window.console = { log: function() {} };



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
  if (typeof(rad) == 'undefined') rad = 6371;  // earth's mean radius in km
  // only accept numbers or valid numeric strings
  this._lat = typeof(lat)=='number' ? lat : typeof(lat)=='string' && lat.trim()!='' ? +lat : NaN;
  this._lon = typeof(lon)=='number' ? lon : typeof(lon)=='string' && lon.trim()!='' ? +lon : NaN;
  this._radius = typeof(rad)=='number' ? rad : typeof(rad)=='string' && trim(lon)!='' ? +rad : NaN;
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
LatLon.prototype.distanceTo = function(point, precision) {
  // default 4 sig figs reflects typical 0.3% accuracy of spherical model
  if (typeof precision == 'undefined') precision = 4;
  
  var R = this._radius;
  var lat1 = this._lat.toRad(), lon1 = this._lon.toRad();
  var lat2 = point._lat.toRad(), lon2 = point._lon.toRad();
  var dLat = lat2 - lat1;
  var dLon = lon2 - lon1;

  var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(lat1) * Math.cos(lat2) * 
          Math.sin(dLon/2) * Math.sin(dLon/2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  var d = R * c;
  return d.toPrecisionFixed(precision);
}


/**
 * Returns the (initial) bearing from this point to the supplied point, in degrees
 *   see http://williams.best.vwh.net/avform.htm#Crs
 *
 * @param   {LatLon} point: Latitude/longitude of destination point
 * @returns {Number} Initial bearing in degrees from North
 */
LatLon.prototype.bearingTo = function(point) {
  var lat1 = this._lat.toRad(), lat2 = point._lat.toRad();
  var dLon = (point._lon-this._lon).toRad();

  var y = Math.sin(dLon) * Math.cos(lat2);
  var x = Math.cos(lat1)*Math.sin(lat2) -
          Math.sin(lat1)*Math.cos(lat2)*Math.cos(dLon);
  var brng = Math.atan2(y, x);
  
  return (brng.toDeg()+360) % 360;
}


/**
 * Returns final bearing arriving at supplied destination point from this point; the final bearing 
 * will differ from the initial bearing by varying degrees according to distance and latitude
 *
 * @param   {LatLon} point: Latitude/longitude of destination point
 * @returns {Number} Final bearing in degrees from North
 */
LatLon.prototype.finalBearingTo = function(point) {
  // get initial bearing from supplied point back to this point...
  var lat1 = point._lat.toRad(), lat2 = this._lat.toRad();
  var dLon = (this._lon-point._lon).toRad();

  var y = Math.sin(dLon) * Math.cos(lat2);
  var x = Math.cos(lat1)*Math.sin(lat2) -
          Math.sin(lat1)*Math.cos(lat2)*Math.cos(dLon);
  var brng = Math.atan2(y, x);
          
  // ... & reverse it by adding 180Â°
  return (brng.toDeg()+180) % 360;
}


/**
 * Returns the midpoint between this point and the supplied point.
 *   see http://mathforum.org/library/drmath/view/51822.html for derivation
 *
 * @param   {LatLon} point: Latitude/longitude of destination point
 * @returns {LatLon} Midpoint between this point and the supplied point
 */
LatLon.prototype.midpointTo = function(point) {
  lat1 = this._lat.toRad(), lon1 = this._lon.toRad();
  lat2 = point._lat.toRad();
  var dLon = (point._lon-this._lon).toRad();

  var Bx = Math.cos(lat2) * Math.cos(dLon);
  var By = Math.cos(lat2) * Math.sin(dLon);

  lat3 = Math.atan2(Math.sin(lat1)+Math.sin(lat2),
                    Math.sqrt( (Math.cos(lat1)+Bx)*(Math.cos(lat1)+Bx) + By*By) );
  lon3 = lon1 + Math.atan2(By, Math.cos(lat1) + Bx);
  lon3 = (lon3+3*Math.PI) % (2*Math.PI) - Math.PI;  // normalise to -180..+180Âº
  
  return new LatLon(lat3.toDeg(), lon3.toDeg());
}


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
LatLon.prototype.destinationPoint = function(brng, dist) {
  dist = typeof(dist)=='number' ? dist : typeof(dist)=='string' && dist.trim()!='' ? +dist : NaN;
  dist = dist/this._radius;  // convert dist to angular distance in radians
  brng = brng.toRad();  // 
  var lat1 = this._lat.toRad(), lon1 = this._lon.toRad();

  var lat2 = Math.asin( Math.sin(lat1)*Math.cos(dist) + 
                        Math.cos(lat1)*Math.sin(dist)*Math.cos(brng) );
  var lon2 = lon1 + Math.atan2(Math.sin(brng)*Math.sin(dist)*Math.cos(lat1), 
                               Math.cos(dist)-Math.sin(lat1)*Math.sin(lat2));
  lon2 = (lon2+3*Math.PI) % (2*Math.PI) - Math.PI;  // normalise to -180..+180Âº

  return new LatLon(lat2.toDeg(), lon2.toDeg());
}


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
LatLon.intersection = function(p1, brng1, p2, brng2) {
  brng1 = typeof brng1 == 'number' ? brng1 : typeof brng1 == 'string' && trim(brng1)!='' ? +brng1 : NaN;
  brng2 = typeof brng2 == 'number' ? brng2 : typeof brng2 == 'string' && trim(brng2)!='' ? +brng2 : NaN;
  lat1 = p1._lat.toRad(), lon1 = p1._lon.toRad();
  lat2 = p2._lat.toRad(), lon2 = p2._lon.toRad();
  brng13 = brng1.toRad(), brng23 = brng2.toRad();
  dLat = lat2-lat1, dLon = lon2-lon1;
  
  dist12 = 2*Math.asin( Math.sqrt( Math.sin(dLat/2)*Math.sin(dLat/2) + 
    Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLon/2)*Math.sin(dLon/2) ) );
  if (dist12 == 0) return null;
  
  // initial/final bearings between points
  brngA = Math.acos( ( Math.sin(lat2) - Math.sin(lat1)*Math.cos(dist12) ) / 
    ( Math.sin(dist12)*Math.cos(lat1) ) );
  if (isNaN(brngA)) brngA = 0;  // protect against rounding
  brngB = Math.acos( ( Math.sin(lat1) - Math.sin(lat2)*Math.cos(dist12) ) / 
    ( Math.sin(dist12)*Math.cos(lat2) ) );
  
  if (Math.sin(lon2-lon1) > 0) {
    brng12 = brngA;
    brng21 = 2*Math.PI - brngB;
  } else {
    brng12 = 2*Math.PI - brngA;
    brng21 = brngB;
  }
  
  alpha1 = (brng13 - brng12 + Math.PI) % (2*Math.PI) - Math.PI;  // angle 2-1-3
  alpha2 = (brng21 - brng23 + Math.PI) % (2*Math.PI) - Math.PI;  // angle 1-2-3
  
  if (Math.sin(alpha1)==0 && Math.sin(alpha2)==0) return null;  // infinite intersections
  if (Math.sin(alpha1)*Math.sin(alpha2) < 0) return null;       // ambiguous intersection
  
  //alpha1 = Math.abs(alpha1);
  //alpha2 = Math.abs(alpha2);
  // ... Ed Williams takes abs of alpha1/alpha2, but seems to break calculation?
  
  alpha3 = Math.acos( -Math.cos(alpha1)*Math.cos(alpha2) + 
                       Math.sin(alpha1)*Math.sin(alpha2)*Math.cos(dist12) );
  dist13 = Math.atan2( Math.sin(dist12)*Math.sin(alpha1)*Math.sin(alpha2), 
                       Math.cos(alpha2)+Math.cos(alpha1)*Math.cos(alpha3) )
  lat3 = Math.asin( Math.sin(lat1)*Math.cos(dist13) + 
                    Math.cos(lat1)*Math.sin(dist13)*Math.cos(brng13) );
  dLon13 = Math.atan2( Math.sin(brng13)*Math.sin(dist13)*Math.cos(lat1), 
                       Math.cos(dist13)-Math.sin(lat1)*Math.sin(lat3) );
  lon3 = lon1+dLon13;
  lon3 = (lon3+3*Math.PI) % (2*Math.PI) - Math.PI;  // normalise to -180..+180Âº
  
  return new LatLon(lat3.toDeg(), lon3.toDeg());
}


/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

/**
 * Returns the distance from this point to the supplied point, in km, travelling along a rhumb line
 *
 *   see http://williams.best.vwh.net/avform.htm#Rhumb
 *
 * @param   {LatLon} point: Latitude/longitude of destination point
 * @returns {Number} Distance in km between this point and destination point
 */
LatLon.prototype.rhumbDistanceTo = function(point) {
  var R = this._radius;
  var lat1 = this._lat.toRad(), lat2 = point._lat.toRad();
  var dLat = (point._lat-this._lat).toRad();
  var dLon = Math.abs(point._lon-this._lon).toRad();
  
  var dPhi = Math.log(Math.tan(lat2/2+Math.PI/4)/Math.tan(lat1/2+Math.PI/4));
  var q = (isFinite(dLat/dPhi)) ? dLat/dPhi : Math.cos(lat1);  // E-W line gives dPhi=0
  
  // if dLon over 180Â° take shorter rhumb across anti-meridian:
  if (Math.abs(dLon) > Math.PI) {
    dLon = dLon>0 ? -(2*Math.PI-dLon) : (2*Math.PI+dLon);
  }
  
  var dist = Math.sqrt(dLat*dLat + q*q*dLon*dLon) * R; 
  
  return dist.toPrecisionFixed(4);  // 4 sig figs reflects typical 0.3% accuracy of spherical model
}

/**
 * Returns the bearing from this point to the supplied point along a rhumb line, in degrees
 *
 * @param   {LatLon} point: Latitude/longitude of destination point
 * @returns {Number} Bearing in degrees from North
 */
LatLon.prototype.rhumbBearingTo = function(point) {
  var lat1 = this._lat.toRad(), lat2 = point._lat.toRad();
  var dLon = (point._lon-this._lon).toRad();
  
  var dPhi = Math.log(Math.tan(lat2/2+Math.PI/4)/Math.tan(lat1/2+Math.PI/4));
  if (Math.abs(dLon) > Math.PI) dLon = dLon>0 ? -(2*Math.PI-dLon) : (2*Math.PI+dLon);
  var brng = Math.atan2(dLon, dPhi);
  
  return (brng.toDeg()+360) % 360;
}

/**
 * Returns the destination point from this point having travelled the given distance (in km) on the 
 * given bearing along a rhumb line
 *
 * @param   {Number} brng: Bearing in degrees from North
 * @param   {Number} dist: Distance in km
 * @returns {LatLon} Destination point
 */
LatLon.prototype.rhumbDestinationPoint = function(brng, dist) {
  var R = this._radius;
  var d = parseFloat(dist)/R;  // d = angular distance covered on earthâ€™s surface
  var lat1 = this._lat.toRad(), lon1 = this._lon.toRad();
  brng = brng.toRad();

  var dLat = d*Math.cos(brng);
  // nasty kludge to overcome ill-conditioned results around parallels of latitude:
  if (Math.abs(dLat) < 1e-10) dLat = 0; // dLat < 1 mm
  
  var lat2 = lat1 + dLat;
  var dPhi = Math.log(Math.tan(lat2/2+Math.PI/4)/Math.tan(lat1/2+Math.PI/4));
  var q = (isFinite(dLat/dPhi)) ? dLat/dPhi : Math.cos(lat1);  // E-W line gives dPhi=0
  var dLon = d*Math.sin(brng)/q;
  
  // check for some daft bugger going past the pole, normalise latitude if so
  if (Math.abs(lat2) > Math.PI/2) lat2 = lat2>0 ? Math.PI-lat2 : -Math.PI-lat2;
  
  lon2 = (lon1+dLon+3*Math.PI)%(2*Math.PI) - Math.PI;
 
  return new LatLon(lat2.toDeg(), lon2.toDeg());
}

/**
 * Returns the loxodromic midpoint (along a rhumb line) between this point and the supplied point.
 *   see http://mathforum.org/kb/message.jspa?messageID=148837
 *
 * @param   {LatLon} point: Latitude/longitude of destination point
 * @returns {LatLon} Midpoint between this point and the supplied point
 */
LatLon.prototype.rhumbMidpointTo = function(point) {
  lat1 = this._lat.toRad(), lon1 = this._lon.toRad();
  lat2 = point._lat.toRad(), lon2 = point._lon.toRad();
  
  if (Math.abs(lon2-lon1) > Math.PI) lon1 += 2*Math.PI; // crossing anti-meridian
  
  var lat3 = (lat1+lat2)/2;
  var f1 = Math.tan(Math.PI/4 + lat1/2);
  var f2 = Math.tan(Math.PI/4 + lat2/2);
  var f3 = Math.tan(Math.PI/4 + lat3/2);
  var lon3 = ( (lon2-lon1)*Math.log(f3) + lon1*Math.log(f2) - lon2*Math.log(f1) ) / Math.log(f2/f1);
  
  if (!isFinite(lon3)) lon3 = (lon1+lon2)/2; // parallel of latitude
  
  lon3 = (lon3+3*Math.PI) % (2*Math.PI) - Math.PI;  // normalise to -180..+180Âº
  
  return new LatLon(lat3.toDeg(), lon3.toDeg());
}


/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */


/**
 * Returns the latitude of this point; signed numeric degrees if no format, otherwise format & dp 
 * as per Geo.toLat()
 *
 * @param   {String} [format]: Return value as 'd', 'dm', 'dms'
 * @param   {Number} [dp=0|2|4]: No of decimal places to display
 * @returns {Number|String} Numeric degrees if no format specified, otherwise deg/min/sec
 */
LatLon.prototype.lat = function(format, dp) {
  if (typeof format == 'undefined') return this._lat;
  
  return Geo.toLat(this._lat, format, dp);
}

/**
 * Returns the longitude of this point; signed numeric degrees if no format, otherwise format & dp 
 * as per Geo.toLon()
 *
 * @param   {String} [format]: Return value as 'd', 'dm', 'dms'
 * @param   {Number} [dp=0|2|4]: No of decimal places to display
 * @returns {Number|String} Numeric degrees if no format specified, otherwise deg/min/sec
 */
LatLon.prototype.lon = function(format, dp) {
  if (typeof format == 'undefined') return this._lon;
  
  return Geo.toLon(this._lon, format, dp);
}

/**
 * Returns a string representation of this point; format and dp as per lat()/lon()
 *
 * @param   {String} [format]: Return value as 'd', 'dm', 'dms'
 * @param   {Number} [dp=0|2|4]: No of decimal places to display
 * @returns {String} Comma-separated latitude/longitude
 */
LatLon.prototype.toString = function(format, dp) {
  if (typeof format == 'undefined') format = 'dms';
  
  return Geo.toLat(this._lat, format, dp) + ', ' + Geo.toLon(this._lon, format, dp);
}

/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

// ---- extend Number object with methods for converting degrees/radians

/** Converts numeric degrees to radians */
if (typeof Number.prototype.toRad == 'undefined') {
  Number.prototype.toRad = function() {
    return this * Math.PI / 180;
  }
}

/** Converts radians to numeric (signed) degrees */
if (typeof Number.prototype.toDeg == 'undefined') {
  Number.prototype.toDeg = function() {
    return this * 180 / Math.PI;
  }
}

/** 
 * Formats the significant digits of a number, using only fixed-point notation (no exponential)
 * 
 * @param   {Number} precision: Number of significant digits to appear in the returned string
 * @returns {String} A string representation of number which contains precision significant digits
 */
if (typeof Number.prototype.toPrecisionFixed == 'undefined') {
  Number.prototype.toPrecisionFixed = function(precision) {
    
    // use standard toPrecision method
    var n = this.toPrecision(precision);
    
    // ... but replace +ve exponential format with trailing zeros
    n = n.replace(/(.+)e\+(.+)/, function(n, sig, exp) {
      sig = sig.replace(/\./, '');       // remove decimal from significand
      l = sig.length - 1;
      while (exp-- > l) sig = sig + '0'; // append zeros from exponent
      return sig;
    });
    
    // ... and replace -ve exponential format with leading zeros
    n = n.replace(/(.+)e-(.+)/, function(n, sig, exp) {
      sig = sig.replace(/\./, '');       // remove decimal from significand
      while (exp-- > 1) sig = '0' + sig; // prepend zeros from exponent
      return '0.' + sig;
    });
    
    return n;
  }
}

/** Trims whitespace from string (q.v. blog.stevenlevithan.com/archives/faster-trim-javascript) */
if (typeof String.prototype.trim == 'undefined') {
  String.prototype.trim = function() {
    return String(this).replace(/^\s\s*/, '').replace(/\s\s*$/, '');
  }
}


/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
if (!window.console) window.console = { log: function() {} };


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
OsGridRef.latLongToOsGrid = function(point) {
  var lat = point.lat().toRad(); 
  var lon = point.lon().toRad(); 
  
  var a = 6377563.396, b = 6356256.910;          // Airy 1830 major & minor semi-axes
  var F0 = 0.9996012717;                         // NatGrid scale factor on central meridian
  var lat0 = (49).toRad(), lon0 = (-2).toRad();  // NatGrid true origin is 49ºN,2ºW
  var N0 = -100000, E0 = 400000;                 // northing & easting of true origin, metres
  var e2 = 1 - (b*b)/(a*a);                      // eccentricity squared
  var n = (a-b)/(a+b), n2 = n*n, n3 = n*n*n;

  var cosLat = Math.cos(lat), sinLat = Math.sin(lat);
  var nu = a*F0/Math.sqrt(1-e2*sinLat*sinLat);              // transverse radius of curvature
  var rho = a*F0*(1-e2)/Math.pow(1-e2*sinLat*sinLat, 1.5);  // meridional radius of curvature
  var eta2 = nu/rho-1;

  var Ma = (1 + n + (5/4)*n2 + (5/4)*n3) * (lat-lat0);
  var Mb = (3*n + 3*n*n + (21/8)*n3) * Math.sin(lat-lat0) * Math.cos(lat+lat0);
  var Mc = ((15/8)*n2 + (15/8)*n3) * Math.sin(2*(lat-lat0)) * Math.cos(2*(lat+lat0));
  var Md = (35/24)*n3 * Math.sin(3*(lat-lat0)) * Math.cos(3*(lat+lat0));
  var M = b * F0 * (Ma - Mb + Mc - Md);              // meridional arc

  var cos3lat = cosLat*cosLat*cosLat;
  var cos5lat = cos3lat*cosLat*cosLat;
  var tan2lat = Math.tan(lat)*Math.tan(lat);
  var tan4lat = tan2lat*tan2lat;

  var I = M + N0;
  var II = (nu/2)*sinLat*cosLat;
  var III = (nu/24)*sinLat*cos3lat*(5-tan2lat+9*eta2);
  var IIIA = (nu/720)*sinLat*cos5lat*(61-58*tan2lat+tan4lat);
  var IV = nu*cosLat;
  var V = (nu/6)*cos3lat*(nu/rho-tan2lat);
  var VI = (nu/120) * cos5lat * (5 - 18*tan2lat + tan4lat + 14*eta2 - 58*tan2lat*eta2);

  var dLon = lon-lon0;
  var dLon2 = dLon*dLon, dLon3 = dLon2*dLon, dLon4 = dLon3*dLon, dLon5 = dLon4*dLon, dLon6 = dLon5*dLon;

  var N = I + II*dLon2 + III*dLon4 + IIIA*dLon6;
  var E = E0 + IV*dLon + V*dLon3 + VI*dLon5;

  return new OsGridRef(E, N);
}


/**
 * Convert Ordnance Survey grid reference easting/northing coordinate to (OSGB36) latitude/longitude
 *
 * @param {OsGridRef} easting/northing to be converted to latitude/longitude
 * @return {LatLon} latitude/longitude (in OSGB36) of supplied grid reference
 */
OsGridRef.osGridToLatLong = function(gridref) {
  var E = gridref.easting;
  var N = gridref.northing;

  var a = 6377563.396, b = 6356256.910;              // Airy 1830 major & minor semi-axes
  var F0 = 0.9996012717;                             // NatGrid scale factor on central meridian
  var lat0 = 49*Math.PI/180, lon0 = -2*Math.PI/180;  // NatGrid true origin
  var N0 = -100000, E0 = 400000;                     // northing & easting of true origin, metres
  var e2 = 1 - (b*b)/(a*a);                          // eccentricity squared
  var n = (a-b)/(a+b), n2 = n*n, n3 = n*n*n;

  var lat=lat0, M=0;
  do {
    lat = (N-N0-M)/(a*F0) + lat;

    var Ma = (1 + n + (5/4)*n2 + (5/4)*n3) * (lat-lat0);
    var Mb = (3*n + 3*n*n + (21/8)*n3) * Math.sin(lat-lat0) * Math.cos(lat+lat0);
    var Mc = ((15/8)*n2 + (15/8)*n3) * Math.sin(2*(lat-lat0)) * Math.cos(2*(lat+lat0));
    var Md = (35/24)*n3 * Math.sin(3*(lat-lat0)) * Math.cos(3*(lat+lat0));
    M = b * F0 * (Ma - Mb + Mc - Md);                // meridional arc

  } while (N-N0-M >= 0.00001);  // ie until < 0.01mm

  var cosLat = Math.cos(lat), sinLat = Math.sin(lat);
  var nu = a*F0/Math.sqrt(1-e2*sinLat*sinLat);              // transverse radius of curvature
  var rho = a*F0*(1-e2)/Math.pow(1-e2*sinLat*sinLat, 1.5);  // meridional radius of curvature
  var eta2 = nu/rho-1;

  var tanLat = Math.tan(lat);
  var tan2lat = tanLat*tanLat, tan4lat = tan2lat*tan2lat, tan6lat = tan4lat*tan2lat;
  var secLat = 1/cosLat;
  var nu3 = nu*nu*nu, nu5 = nu3*nu*nu, nu7 = nu5*nu*nu;
  var VII = tanLat/(2*rho*nu);
  var VIII = tanLat/(24*rho*nu3)*(5+3*tan2lat+eta2-9*tan2lat*eta2);
  var IX = tanLat/(720*rho*nu5)*(61+90*tan2lat+45*tan4lat);
  var X = secLat/nu;
  var XI = secLat/(6*nu3)*(nu/rho+2*tan2lat);
  var XII = secLat/(120*nu5)*(5+28*tan2lat+24*tan4lat);
  var XIIA = secLat/(5040*nu7)*(61+662*tan2lat+1320*tan4lat+720*tan6lat);

  var dE = (E-E0), dE2 = dE*dE, dE3 = dE2*dE, dE4 = dE2*dE2, dE5 = dE3*dE2, dE6 = dE4*dE2, dE7 = dE5*dE2;
  lat = lat - VII*dE2 + VIII*dE4 - IX*dE6;
  var lon = lon0 + X*dE - XI*dE3 + XII*dE5 - XIIA*dE7;
  
  return new LatLon(lat.toDeg(), lon.toDeg());
}


/**
 * Converts standard grid reference ('SU387148') to fully numeric ref ([438700,114800]);
 *   returned co-ordinates are in metres, centred on supplied grid square;
 *
 * @param {String} gridref: Standard format OS grid reference
 * @returns {OsGridRef}     Numeric version of grid reference in metres from false origin
 */
OsGridRef.parse = function(gridref) {
  gridref = gridref.trim();
  // get numeric values of letter references, mapping A->0, B->1, C->2, etc:
  var l1 = gridref.toUpperCase().charCodeAt(0) - 'A'.charCodeAt(0);
  var l2 = gridref.toUpperCase().charCodeAt(1) - 'A'.charCodeAt(0);
  // shuffle down letters after 'I' since 'I' is not used in grid:
  if (l1 > 7) l1--;
  if (l2 > 7) l2--;

  // convert grid letters into 100km-square indexes from false origin (grid square SV):
  var e = ((l1-2)%5)*5 + (l2%5);
  var n = (19-Math.floor(l1/5)*5) - Math.floor(l2/5);
  if (e<0 || e>6 || n<0 || n>12) return new OsGridRef(NaN, NaN);

  // skip grid letters to get numeric part of ref, stripping any spaces:
  gridref = gridref.slice(2).replace(/ /g,'');

  // append numeric part of references to grid index:
  e += gridref.slice(0, gridref.length/2);
  n += gridref.slice(gridref.length/2);

  // normalise to 1m grid, rounding up to centre of grid square:
  switch (gridref.length) {
    case 0: e += '50000'; n += '50000'; break;
    case 2: e += '5000'; n += '5000'; break;
    case 4: e += '500'; n += '500'; break;
    case 6: e += '50'; n += '50'; break;
    case 8: e += '5'; n += '5'; break;
    case 10: break; // 10-digit refs are already 1m
    default: return new OsGridRef(NaN, NaN);
  }

  return new OsGridRef(e, n);
}


/**
 * Converts this numeric grid reference to standard OS grid reference
 *
 * @param {Number} [digits=6] Precision of returned grid reference (6 digits = metres)
 * @return {String)           This grid reference in standard format
 */
OsGridRef.prototype.toString = function(digits) {
  digits = (typeof digits == 'undefined') ? 10 : digits;
  e = this.easting, n = this.northing;
  if (e==NaN || n==NaN) return '??';
  
  // get the 100km-grid indices
  var e100k = Math.floor(e/100000), n100k = Math.floor(n/100000);
  
  if (e100k<0 || e100k>6 || n100k<0 || n100k>12) return '';

  // translate those into numeric equivalents of the grid letters
  var l1 = (19-n100k) - (19-n100k)%5 + Math.floor((e100k+10)/5);
  var l2 = (19-n100k)*5%25 + e100k%5;

  // compensate for skipped 'I' and build grid letter-pairs
  if (l1 > 7) l1++;
  if (l2 > 7) l2++;
  var letPair = String.fromCharCode(l1+'A'.charCodeAt(0), l2+'A'.charCodeAt(0));

  // strip 100km-grid indices from easting & northing, and reduce precision
  e = Math.floor((e%100000)/Math.pow(10,5-digits/2));
  n = Math.floor((n%100000)/Math.pow(10,5-digits/2));

  var gridRef = letPair + ' ' + e.padLz(digits/2) + ' ' + n.padLz(digits/2);

  return gridRef;
}


/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

/** Trims whitespace from string (q.v. blog.stevenlevithan.com/archives/faster-trim-javascript) */
if (typeof String.prototype.trim == 'undefined') {
  String.prototype.trim = function() {
    return this.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
  }
}

/** Pads a number with sufficient leading zeros to make it w chars wide */
if (typeof String.prototype.padLz == 'undefined') {
  Number.prototype.padLz = function(w) {
    var n = this.toString();
    var l = n.length;
    for (var i=0; i<w-l; i++) n = '0' + n;
    return n;
  }
}


/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
if (!window.console) window.console = { log: function() {} };
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

function SignaturePad (selector, options) {
  /**
   * Reference to the object for use in public methods
   *
   * @private
   *
   * @type {Object}
   */
  var self = this

  /**
   * Holds the merged default settings and user passed settings
   *
   * @private
   *
   * @type {Object}
   */
  , settings = $.extend({}, $.fn.signaturePad.defaults, options)

  /**
   * The current context, as passed by jQuery, of selected items
   *
   * @private
   *
   * @type {Object}
   */
  , context = $(selector)

  /**
   * jQuery reference to the canvas element inside the signature pad
   *
   * @private
   *
   * @type {Object}
   */
  , canvas = $(settings.canvas, context)

  /**
   * Dom reference to the canvas element inside the signature pad
   *
   * @private
   *
   * @type {Object}
   */
  , element = canvas.get(0)

  /**
   * The drawing context for the signature canvas
   *
   * @private
   *
   * @type {Object}
   */
  , canvasContext = null

  /**
   * Holds the previous point of drawing
   * Disallows drawing over the same location to make lines more delicate
   *
   * @private
   *
   * @type {Object}
   */
  , previous = {'x': null, 'y': null}

  /**
   * An array holding all the points and lines to generate the signature
   * Each item is an object like:
   * {
   *   mx: moveTo x coordinate
   *   my: moveTo y coordinate
   *   lx: lineTo x coordinate
   *   lx: lineTo y coordinate
   * }
   *
   * @private
   *
   * @type {Array}
   */
  , output = []

  /**
   * Stores a timeout for when the mouse leaves the canvas
   * If the mouse has left the canvas for a specific amount of time
   * Stops drawing on the canvas
   *
   * @private
   *
   * @type {Object}
   */
  , mouseLeaveTimeout = false

  /**
   * Whether the browser is a touch event browser or not
   *
   * @private
   *
   * @type {Boolean}
   */
  , touchable = false

  /**
   * Whether events have already been bound to the canvas or not
   *
   * @private
   *
   * @type {Boolean}
   */
  , eventsBound = false


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
  function drawLine (e, newYOffset) {
    var offset = $(e.target).offset(), newX, newY

    clearTimeout(mouseLeaveTimeout)
    mouseLeaveTimeout = false

    if (typeof e.changedTouches !== 'undefined') {
      newX = Math.floor(e.changedTouches[0].pageX - offset.left)
      newY = Math.floor(e.changedTouches[0].pageY - offset.top)
    } else {
      newX = Math.floor(e.pageX - offset.left)
      newY = Math.floor(e.pageY - offset.top)
    }

    if (previous.x === newX && previous.y === newY)
      return true

    if (previous.x === null)
      previous.x = newX

    if (previous.y === null)
      previous.y = newY

    if (newYOffset)
      newY += newYOffset

    canvasContext.beginPath()
    canvasContext.moveTo(previous.x, previous.y)
    canvasContext.lineTo(newX, newY)
    canvasContext.lineCap = settings.penCap
    canvasContext.stroke()
    canvasContext.closePath()

    output.push({
      'lx': newX
      ,'ly': newY
      ,'mx': previous.x
      ,'my': previous.y
    })

    previous.x = newX
    previous.y = newY
  }

  /**
   * Callback registered to mouse/touch events of the canvas
   * Stops the drawing abilities
   *
   * @private
   *
   * @param {Object} e The event object
   */
  function stopDrawing () {
    if (touchable) {
      canvas.each(function () {
        this.ontouchmove = null
      })
    } else {
      canvas.unbind('mousemove.signaturepad')
    }

    previous.x = null
    previous.y = null

    if (output.length > 0)
      $(settings.output, context).val(JSON.stringify(output))
  }

  /**
   * Draws the signature line
   *
   * @private
   */
  function drawSigLine () {
    if (!settings.lineWidth)
      return false

    canvasContext.beginPath()
    canvasContext.lineWidth = settings.lineWidth
    canvasContext.strokeStyle = settings.lineColour
    canvasContext.moveTo(settings.lineMargin, settings.lineTop)
    canvasContext.lineTo(element.width - settings.lineMargin, settings.lineTop)
    canvasContext.stroke()
    canvasContext.closePath()
  }

  /**
   * Clears all drawings off the canvas and redraws the signature line
   *
   * @private
   */
  function clearCanvas () {
    stopDrawing()

    canvasContext.clearRect(0, 0, element.width, element.height)
    canvasContext.fillStyle = settings.bgColour
    canvasContext.fillRect(0, 0, element.width, element.height)

    if (!settings.displayOnly)
      drawSigLine()

    canvasContext.lineWidth = settings.penWidth
    canvasContext.strokeStyle = settings.penColour

    $(settings.output, context).val('')
    output = []
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
  function startDrawing (e, o) {
    if (touchable) {
      canvas.each(function () {
        this.addEventListener('touchmove', drawLine, false)
      })
    } else {
      canvas.bind('mousemove.signaturepad', drawLine)
    }

    // Draws a single point on initial mouse down, for people with periods in their name
    drawLine(e, 1)
  }

  /**
   * Removes all the mouse events from the canvas
   *
   * @private
   */
  function disableCanvas () {
    eventsBound = false

    if (touchable) {
      canvas.each(function () {
        this.removeEventListener('touchstart', stopDrawing)
        this.removeEventListener('touchend', stopDrawing)
        this.removeEventListener('touchmove', drawLine)
      })
    } else {
      canvas.unbind('mousedown.signaturepad')
      canvas.unbind('mouseup.signaturepad')
      canvas.unbind('mousemove.signaturepad')
      canvas.unbind('mouseleave.signaturepad')
    }

    $(settings.clear, context).unbind('click.signaturepad')
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
  function initDrawEvents (e) {
    if (eventsBound)
      return false

    eventsBound = true

    if (typeof e.changedTouches !== 'undefined')
      touchable = true

    if (touchable) {
      canvas.each(function () {
        this.addEventListener('touchend', stopDrawing, false)
        this.addEventListener('touchcancel', stopDrawing, false)
      })

      canvas.unbind('mousedown.signaturepad')
    } else {
      canvas.bind('mouseup.signaturepad', function (e) { stopDrawing() })
      canvas.bind('mouseleave.signaturepad', function (e) {
        if (!mouseLeaveTimeout) {
          mouseLeaveTimeout = setTimeout(function () {
            stopDrawing()
            clearTimeout(mouseLeaveTimeout)
            mouseLeaveTimeout = false
          }, 500)
        }
      })

      canvas.each(function () {
        this.ontouchstart = null
      })
    }
  }

  /**
   * Triggers the abilities to draw on the canvas
   * Sets up mouse/touch events, hides and shows descriptions and sets current classes
   *
   * @private
   */
  function drawIt () {
    $(settings.typed, context).hide()
    clearCanvas()

    canvas.each(function () {
      this.ontouchstart = function (e) {
        e.preventDefault()
        initDrawEvents(e)
        startDrawing(e, this)
      }
    })

    canvas.bind('mousedown.signaturepad', function (e) {
      initDrawEvents(e)
      startDrawing(e, this)
    })

    $(settings.clear, context).bind('click.signaturepad', function (e) { e.preventDefault(); clearCanvas() })

    $(settings.typeIt, context).bind('click.signaturepad', function (e) { e.preventDefault(); typeIt() })
    $(settings.drawIt, context).unbind('click.signaturepad')
    $(settings.drawIt, context).bind('click.signaturepad', function (e) { e.preventDefault() })

    $(settings.typeIt, context).removeClass(settings.currentClass)
    $(settings.drawIt, context).addClass(settings.currentClass)
    $(settings.sig, context).addClass(settings.currentClass)

    $(settings.typeItDesc, context).hide()
    $(settings.drawItDesc, context).show()
    $(settings.clear, context).show()
  }

  /**
   * Triggers the abilities to type in the input for generating a signature
   * Sets up mouse events, hides and shows descriptions and sets current classes
   *
   * @private
   */
  function typeIt () {
    clearCanvas()
    disableCanvas()
    $(settings.typed, context).show()

    $(settings.drawIt, context).bind('click.signaturepad', function (e) { e.preventDefault(); drawIt() })
    $(settings.typeIt, context).unbind('click.signaturepad')
    $(settings.typeIt, context).bind('click.signaturepad', function (e) { e.preventDefault() })

    $(settings.output, context).val('')

    $(settings.drawIt, context).removeClass(settings.currentClass)
    $(settings.typeIt, context).addClass(settings.currentClass)
    $(settings.sig, context).removeClass(settings.currentClass)

    $(settings.drawItDesc, context).hide()
    $(settings.clear, context).hide()
    $(settings.typeItDesc, context).show()
  }

  /**
   * Callback registered on key up and blur events for input field
   * Writes the text fields value as Html into an element
   *
   * @private
   *
   * @param {String} val The value of the input field
   */
  function type (val) {
    $(settings.typed, context).html(val.replace(/>/g, '&gt;').replace(/</g, '&lt;'))

    while ($(settings.typed, context).width() > element.width) {
      var oldSize = $(settings.typed, context).css('font-size').replace(/px/, '')
      $(settings.typed, context).css('font-size', oldSize-1+'px')
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
  function onBeforeValidate (context, settings) {
    $('p.' + settings.errorClass, context).remove()
    context.removeClass(settings.errorClass)
    $('input, label', context).removeClass(settings.errorClass)
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
  function onFormError (errors, context, settings) {
    if (errors.nameInvalid) {
      context.prepend(['<p class="', settings.errorClass, '">', settings.errorMessage, '</p>'].join(''))
      $(settings.name, context).focus()
      $(settings.name, context).addClass(settings.errorClass)
      $('label[for=' + $(settings.name).attr('id') + ']', context).addClass(settings.errorClass)
    }

    if (errors.drawInvalid)
      context.prepend(['<p class="', settings.errorClass, '">', settings.errorMessageDraw, '</p>'].join(''))
  }

  /**
   * Validates the form to confirm a name was typed in the field
   * If drawOnly also confirms that the user drew a signature
   *
   * @private
   *
   * @return {Boolean}
   */
  function validateForm () {
    var valid = true
      , errors = {drawInvalid: false, nameInvalid: false}
      , onBeforeArguments = [context, settings]
      , onErrorArguments = [errors, context, settings]

    if (settings.onBeforeValidate && typeof settings.onBeforeValidate === 'function') {
      settings.onBeforeValidate.apply(self,onBeforeArguments)
    } else {
      onBeforeValidate.apply(self, onBeforeArguments)
    }

    if (settings.drawOnly && output.length < 1) {
      errors.drawInvalid = true
      valid = false
    }

    if ($(settings.name, context).val() === '') {
      errors.nameInvalid = true
      valid = false
    }

    if (settings.onFormError && typeof settings.onFormError === 'function') {
      settings.onFormError.apply(self,onErrorArguments)
    } else {
      onFormError.apply(self, onErrorArguments)
    }

    return valid
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
  function drawSignature (paths, context, saveOutput) {
    for(var i in paths) {
      if (typeof paths[i] === 'object') {
        context.beginPath()
        context.moveTo(paths[i].mx, paths[i].my)
        context.lineTo(paths[i].lx, paths[i].ly)
        context.lineCap = settings.penCap
        context.stroke()
        context.closePath()

        if (saveOutput) {
          output.push({
            'lx': paths[i].lx
            ,'ly': paths[i].ly
            ,'mx': paths[i].mx
            ,'my': paths[i].my
          })
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
  function init () {
    // Fixes the jQuery.fn.offset() function for Mobile Safari Browsers i.e. iPod Touch, iPad and iPhone
    // https://gist.github.com/661844
    // http://bugs.jquery.com/ticket/6446
    if (parseFloat(((/CPU.+OS ([0-9_]{3}).*AppleWebkit.*Mobile/i.exec(navigator.userAgent)) || [0,'4_2'])[1].replace('_','.')) < 4.1) {
       $.fn.Oldoffset = $.fn.offset;
       $.fn.offset = function () {
          var result = $(this).Oldoffset()
          result.top -= window.scrollY
          result.left -= window.scrollX

          return result
       }
    }

    // Disable selection on the typed div and canvas
    $(settings.typed, context).bind('selectstart.signaturepad', function (e) { return $(e.target).is(':input') })
    canvas.bind('selectstart.signaturepad', function (e) { return $(e.target).is(':input') })

    if (!element.getContext && FlashCanvas)
      FlashCanvas.initElement(element)

    if (element.getContext) {
      canvasContext = element.getContext('2d')

      $(settings.sig, context).show()

      if (!settings.displayOnly) {
        if (!settings.drawOnly) {
          $(settings.name, context).bind('keyup.signaturepad', function () {
            type($(this).val())
          })

          $(settings.name, context).bind('blur.signaturepad', function () {
            type($(this).val())
          })

          $(settings.drawIt, context).bind('click.signaturepad', function (e) {
            e.preventDefault()
            drawIt()
          })
        }

        if (settings.drawOnly || settings.defaultAction === 'drawIt') {
          drawIt()
        } else {
          typeIt()
        }

        if (settings.validateFields) {
          if ($(selector).is('form')) {
            $(selector).bind('submit.signaturepad', function () { return validateForm() })
          } else {
            $(selector).parents('form').bind('submit.signaturepad', function () { return validateForm() })
          }
        }

        $(settings.sigNav, context).show()
      }
    }
  }

  $.extend(self, {
    /**
     * Initializes SignaturePad
     */
    init: function () { init() }

    /**
     * Regenerates a signature on the canvas using an array of objects
     * Follows same format as object property
     * @see var object
     *
     * @param {Array} paths An array of the lines and points
     */
    , regenerate: function (paths) {
      self.clearCanvas()
      $(settings.typed, context).hide()

      if (typeof paths === 'string')
        paths = JSON.parse(paths)

      drawSignature(paths, canvasContext, true)

      if ($(settings.output, context).length > 0)
        $(settings.output, context).val(JSON.stringify(output))
    }

    /**
     * Clears the canvas
     * Redraws the background colour and the signature line
     */
    , clearCanvas: function () { clearCanvas() }

    /**
     * Returns the signature as a Js array
     *
     * @return {Array}
     */
    , getSignature: function () { return output }

    /**
     * Returns the signature as a Json string
     *
     * @return {String}
     */
    , getSignatureString: function () { return JSON.stringify(output) }

    /**
     * Returns the signature as an image
     * Re-draws the signature in a shadow canvas to create a clean version
     *
     * @return {String}
     */
    , getSignatureImage: function () {
      var tmpCanvas = document.createElement('canvas')
        , tmpContext = null
        , data = null

      tmpCanvas.style.position = 'absolute'
      tmpCanvas.style.top = '-999em'
      tmpCanvas.width = element.width
      tmpCanvas.height = element.height
      document.body.appendChild(tmpCanvas)

      if (!tmpCanvas.getContext && FlashCanvas)
        FlashCanvas.initElement(tmpCanvas)

      tmpContext = tmpCanvas.getContext('2d')

      tmpContext.fillStyle = settings.bgColour
      tmpContext.fillRect(0, 0, element.width, element.height)
      tmpContext.lineWidth = settings.penWidth
      tmpContext.strokeStyle = settings.penColour

      drawSignature(output, tmpContext)
      data = tmpCanvas.toDataURL.apply(tmpCanvas, arguments)

      document.body.removeChild(tmpCanvas)
      tmpCanvas = null

      return data
    }
  })
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
  var api = null

  this.each(function () {
    api = new SignaturePad(this, options)
    api.init()
  })

  return api
}

/**
 * Expose the defaults so they can be overwritten for multiple instances
 *
 * @type {Object}
 */
$.fn.signaturePad.defaults = {
  defaultAction: 'typeIt' // What action should be highlighted first: typeIt or drawIt
  , displayOnly: false // Initialize canvas for signature display only; ignore buttons and inputs
  , drawOnly: false // Whether the to allow a typed signature or not
  , canvas: 'canvas' // Selector for selecting the canvas element
  , sig: '.sig' // Parts of the signature form that require Javascript (hidden by default)
  , sigNav: '.sigNav' // The TypeIt/DrawIt navigation (hidden by default)
  , bgColour: '#ffffff' // The colour fill for the background of the canvas
  , penColour: '#145394' // Colour of the drawing ink
  , penWidth: 2 // Thickness of the pen
  , penCap: 'round' // Determines how the end points of each line are drawn (values: 'butt', 'round', 'square')
  , lineColour: '#ccc' // Colour of the signature line
  , lineWidth: 2 // Thickness of the signature line
  , lineMargin: 5 // Margin on right and left of signature line
  , lineTop: 35 // Distance to draw the line from the top
  , name: '.name' // The input field for typing a name
  , typed: '.typed' // The Html element to accept the printed name
  , clear: '.clearButton' // Button for clearing the canvas
  , typeIt: '.typeIt a' // Button to trigger name typing actions (current by default)
  , drawIt: '.drawIt a' // Button to trigger name drawing actions
  , typeItDesc: '.typeItDesc' // The description for TypeIt actions
  , drawItDesc: '.drawItDesc' // The description for DrawIt actions (hidden by default)
  , output: '.output' // The hidden input field for remembering line coordinates
  , currentClass: 'current' // The class used to mark items as being currently active
  , validateFields: true // Whether the name, draw fields should be validated
  , errorClass: 'error' // The class applied to the new error Html element
  , errorMessage: 'Please enter your name' // The error message displayed on invalid submission
  , errorMessageDraw: 'Please sign the document' // The error message displayed when drawOnly and no signature is drawn
  , onBeforeValidate: null // Pass a callback to be used instead of the built-in function
  , onFormError: null // Pass a callback to be used instead of the built-in function
}
}(jQuery));

var toBitmapURL = (function ($fromCharCode, FF, MAX_LENGTH) {
    
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
        for (var
            result = [],
            i = 0,
            length = code.length;
            i < length; i += MAX_LENGTH
        ) {
            result.push($fromCharCode.apply(null, code.slice(i, i + MAX_LENGTH)));
        }
        return result.join("");
    }
    
    function numberToInvertedBytes(number) {
        return [
            number & FF,
            (number >> 8) & FF,
            (number >> 16) & FF,
            (number >> 24) & FF
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
        for (var
            i, j, x0, x1, y0, y1,
            sizeX = 4 * width,
            sizeY = height - 1,
            result = [];
            height--;
        ) {
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
        var
            width = canvas.width,
            height = canvas.height,
            header = [].concat(
                numberToInvertedBytes(width),
                numberToInvertedBytes(height),
                1, 0,
                32, 0,
                3, 0, 0, 0,
                numberToInvertedBytes(
                    width * height * 4
                ),
                19, 11, 0, 0,
                19, 11, 0, 0,
                0, 0, 0, 0,
                0, 0, 0, 0,
                0, 0, FF, 0,
                0, FF, 0, 0,
                FF, 0, 0, 0,
                0, 0, 0, FF,
                32, 110, 105, 87
            ),
            data = swapAndInvertY(
                canvas.getContext("2d").getImageData(
                    0, 0, width, height
                ).data,
                width,
                height
            ),
            offset
        ;
        header = numberToInvertedBytes(header.length).concat(header);
        offset = 14 + header.length;
        return "data:image/bmp;base64," + btoa(fromCharCode(
            [66, 77].concat(
                numberToInvertedBytes(offset + data.length),
                0, 0, 0, 0,
                numberToInvertedBytes(offset),
                header,
                data
            )
        ));
    }
    
    return toBitmapURL;
    
}(String.fromCharCode, 0xFF, 0x7FFF));


// Namespace
var App=(function(module){
    module.views={};
    module.models={};
    module.collections={};
    module.config={};

    // ---- App Configs --------
    module.config.validationOn = true;

    // TODO - get this to read from field definition
    module.config.getValueOrDefault = function(key){
        switch(key){
            case "cam_quality":
            return 50;

            case "cam_targetWidth":
            return 300;

            case "cam_targetHeight":
            return 200;
        }
    };

    return module;
})(App || {});
var BaseView=Backbone.View.extend({
    "onLoad":function(){},
    "onLoadEnd":function(){}
}); 
var FormListView = BaseView.extend({
  events: {
    'click button#formlist_reload': 'reload'
  },

  templates: {
    list: '<ul class="form_list fh_appform_body"></ul>',
    header: '<h2>Your Forms</h2><h4>Choose a form from the list below</h4>',
    error: '<li><button id="formlist_reload" class="button-block <%= enabledClass %> <%= dataClass %> fh_appform_button_action"><%= name %><div class="loading"></div></button></li>'
  },

  initialize: function() {
    _.bindAll(this, 'render', 'appendForm');
    this.views = [];

    App.collections.forms.bind('reset', function (collection, options) {
       if (options == null || !options.noFetch) {
         $fh.logger.debug('reset forms collection');
         App.collections.forms.each(function (form) {
           form.fetch();
         });
       }
    });

    App.collections.forms.bind('add remove reset error', this.render, this);
    this.model.on("updated",this.render);
  },

  reload: function() {
    var that=this;
    this.onLoad();
    this.model.refresh(true,function(err,formList){
      this.onLoadEnd();
      that.model=formList;
      that.render();
    });
  },

  show: function () {
    $(this.el).show();
  },

  hide: function () {
    $(this.el).hide();
  },

  renderErrorHandler: function(msg) {
    try {
      if(msg == null || msg.match("error_ajaxfail")) {
        msg = "An unexpected error occurred.";
      }
    } catch(e) {
      msg = "An unexpected error occurred.";
    }
    var html = _.template(this.templates.error, {
      name: msg + "<br/>Please Retry Later",
      enabledClass: 'button-negative',
      dataClass: 'fetched'
    });
    $('ul', this.el).append(html);

  },

  render: function() {
    
    // Empty our existing view
    // this.options.parentEl.empty();

    // Add list
    this.options.parentEl.append(this.templates.list);
    var formList=this.model.getFormsList();
    if(formList.length>0) {
      // Add header
      this.options.parentEl.find('ul').append(this.templates.header);
      _(formList).forEach(function(form) {this.appendForm(form);}, this);
    } else {
      this.renderErrorHandler(arguments[1]);
    }
  },

  appendForm: function(form) {
    // this.options.parentEl.find('ul').append("<li>"+form.name+"("+form.description+")"+"</li>");
    // console.log(form);
    var view = new FormListItemView({model: form});
    this.views.push(view);
    $('ul', this.options.parentEl).append(view.render().el);
  },
  initFormList: function(fromRemote,cb){
    var that=this;
    $fh.forms.getForms({fromRemote:fromRemote},function(err,formsModel){
      if (err){
        cb(err);
      }else{
        that.model=formsModel;
        cb(null,that);  
      }
    });
  }
});
 var FormListItemView=BaseView.extend({
  events: {
    'click button.show.fetched': 'show',
    'click button.show.fetch_error': 'fetch'
  },

  templates: {
    form_button: '<li><button class="show button-block <%= enabledClass %> <%= dataClass %> fh_appform_button_action"><%= name %><div class="loading"></div></button></li>'
  },

  render: function() {
    var html;
    // var errorLoading = this.model.get('fh_error_loading');
    var enabled = true;
    html = _.template(this.templates.form_button, {
      name: this.model.name,
      enabledClass: enabled ? 'button-main' : '',
      // dataClass: errorLoading ? 'fetch_error' : fullyLoaded ? 'fetched' : 'fetching'
      dataClass:"fetched"
    });

    this.$el.html(html);
    this.$el.find('button').not('.fh_full_data_loaded');

    return this;
  },

  unrender: function() {
    $(this.el).remove();
  },

  show: function() {

    var formId=this.model._id;
    // this will init and render formView
    var formView = new FormView({parentEl:$("#backbone #page")});
    formView.loadForm({formId:formId}, function(){
      formView.render();
      Backbone.history.navigate('form',true);
    })
  },

  fetch: function () {
    // show loading view
    
    // var loadingView = new LoadingView(this.model);
    // loadingView.show('Syncing form');
    // this.model.fetch();
  }
});
FieldView = Backbone.View.extend({

  className: 'field_container fh_appform_field_area',
  fieldWrapper: "<div />",
  wrapper: '<div id="wrapper_<%= fieldId %>_<%= index %>" title="<%= helpText %>"><%= title %><%= input %><label class="error errorMsg"></label></div>',
  title: '<label class="<%= required %> fh_appform_field_title"><%= title %> </label><%= helpText %>',
  input: "<input class='fh_appform_field_input' data-field='<%= fieldId %>' data-index='<%= index %>' type='<%= inputType %>'/> ",
  instructions: '<p class="instruct fh_appform_field_instructions"><%= helpText %></p>',
  fieldActionBar: "<div class='fieldActionBar'><button class='addInputBtn special_button two_button fh_appform_button_action'>Add Input</button><button class='special_button two_button removeInputBtn fh_appform_button_action'>Remove Input</button></div>",
  events: {
    "change": "contentChanged",
    "blur input,select,textarea": "validate",
    "click .addInputBtn": "onAddInput",
    "click .removeInputBtn": "onRemoveInput"
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
      this.$fieldActionBar.find(".addInputBtn").show();
    } else {
      this.$fieldActionBar.find(".addInputBtn").hide();
    }

    if (curNum > minRepeat) {
      this.$fieldActionBar.find(".removeInputBtn").show();
    } else {
      this.$fieldActionBar.find(".removeInputBtn").hide();
    }
  },
  removeElement: function() {
    var curRepeat = this.curRepeat;
    var lastIndex = curRepeat - 1;
    this.getWrapper(lastIndex).remove();
    this.curRepeat--;
  },
  renderTitle: function(index) {
    var name = this.model.getName();
    var title = name;
    var required = "";
    var helpText = "";
    if (this.model.isRepeating()) {
      title += " (" + (index + 1) + ") ";
    }
    if (this.initialRepeat > 1) {
      if (index < this.initialRepeat) {
        required = "required";
      }
    } else {
      if (this.model.isRequired()) {
        required = "required";
      }
    }
    if (this.model.isRequired() && index < this.initialRepeat) {
      required = "required";
    }
    if (index == 0) {
      helpText = this.renderHelpText();
    }
    return _.template(this.title, {
      "title": title,
      "helpText": helpText,
      "required": required
    });
  },
  renderInput: function(index) {
    var fieldId = this.model.getFieldId();
    var type = this.type || "text";
    return _.template(this.input, {
      "fieldId": fieldId,
      "index": index,
      "inputType": type
    });
  },
  renderEle: function(titleHtml, inputHtml, index) {
    var helpText = this.model.getHelpText();
    var fieldId = this.model.getFieldId();
    return _.template(this.wrapper, {
      "fieldId": fieldId,
      "index": index,
      "helpText": helpText,
      "title": titleHtml,
      "input": inputHtml
    });
  },
  renderHelpText: function() {
    var helpText = this.model.getHelpText();
    return _.template(this.instructions, {
      "helpText": helpText
    });
  },
  addElement: function() {
    var index = this.curRepeat;
    var titleHtml = this.renderTitle(index);
    var inputHtml = this.renderInput(index);
    var eleHtml = this.renderEle(titleHtml, inputHtml, index);
    this.$fieldWrapper.append(eleHtml);
    this.curRepeat++;
    this.onElementShow(index);

  },
  onElementShow: function(index) {

  },
  render: function() {
    var self = this;
    this.initialRepeat = 1;
    this.maxRepeat = 1;
    this.curRepeat = 0;
    if (this.model.isRepeating()) {
      this.initialRepeat = this.model.getMinRepeat();
      this.maxRepeat = this.model.getMaxRepeat();
    }
    for (var i = 0; i < this.initialRepeat; i++) {
      this.addElement();
    }

    this.$el.append(this.$fieldWrapper);
    this.$el.append(this.$fieldActionBar);
    this.$el.attr("data-field", this.model.getFieldId());

    // var instructions = this.model.get('Instructions');

    // if (instructions && instructions !== '') {
    //   $('label:first', this.el).after(_.template(this.templates.instructions, {
    //     instructions: this.model.get('Instructions')
    //   }));
    // }

    // add to dom
    this.options.parentEl.append(this.$el);

    this.show();

    // force the element to be initially hidden
    if (this.$el.hasClass("hide")) {
      this.hide(true);
    }
    // populate field if Submission obj exists
    var submission = this.options.formView.getSubmission();
    if (submission) {
      this.submission = submission;
      this.submission.getInputValueByFieldId(this.model.get('_id'), function(err, res) {
        console.log(err, res);
        self.value(res);
      });
    }
    this.checkActionBar();
    this.onRender();
  },
  onRender: function() {

  },
  // TODO: cache the input element lookup?
  initialize: function() {
    _.bindAll(this, 'dumpContent', 'clearError', 'onAddInput', 'onRemoveInput');

    // if (this.model.isRequired()) {
    //   this.$el.addClass('required');
    // }
    this.$fieldWrapper = $(this.fieldWrapper);
    this.$fieldActionBar = $(this.fieldActionBar);
    // only call render once. model will never update
    this.render();
  },

  dumpContent: function() {
    console.log("Value changed :: " + JSON.stringify(this.value()));

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

  validate: function(e) {
    if (App.config.validationOn) {
      var self = this;
      var target = $(e.currentTarget);
      var index = target.data().index;
      var val = this.valueFromElement(index);
      var fieldId = this.model.getFieldId();
      this.model.validate(val, function(err, res) { //validation
        if (err) {
          console.error(err);
        } else {
          var result = res["validation"][fieldId];
          if (!result.valid) {
            var errorMessages = result.errorMessages.join(", ");
            self.setErrorText(index, errorMessages);
          } else {
            self.clearError(index);
          }
        }
      });
      this.trigger("checkrules");
    }
  },
  setErrorText: function(index, text) {
    var wrapperObj = this.getWrapper(index);
    wrapperObj.find("label.errorMsg").text(text);
    wrapperObj.find("label.errorMsg").show();
    wrapperObj.find("label.errorMsg").addClass("error");
    wrapperObj.find("input,textarea,select").addClass("error"); //TODO Error to be added to css.
  },
  contentChanged: function(e) {
    var target = $(e.currentTarget);
    var changedValue = target.val();
    var self = this;
    this.dumpContent();
    // this.getTopView().trigger('change:field');
    // var val = this.value();
    // if (this.model.validate(changedValue) === true) {
    //   var val = this.value();
    //   this.options.formView.setInputValue(self.model.getFieldId(), val);
    //   // self.model.set('value', val[self.model.get("_id")]);
    // }
  },


  addRules: function() {
    // this.addValidationRules();
    // this.addSpecialRules();
  },

  isRequired: function() {
    return this.model.isRequired();
  },

  addValidationRules: function() {
    if (this.model.get('IsRequired') === '1') {
      this.$el.find('#' + this.model.get('ID')).rules('add', {
        "required": true
      });
    }
  },

  addSpecialRules: function() {
    var self = this;

    var rules = {
      'Show': function(rulePasses, params) {
        var fieldId = 'Field' + params.Setting.FieldName;
        if (rulePasses) {
          App.views.form.showField(fieldId);
        } else {
          App.views.form.hideField(fieldId);
        }
      },
      'Hide': function(rulePasses, params) {
        var fieldId = 'Field' + params.Setting.FieldName;
        if (rulePasses) {
          App.views.form.hideField(fieldId);
        } else {
          App.views.form.showField(fieldId);
        }
      }
    };

    // also apply any special rules
    _(this.model.get('Rules') || []).each(function(rule) {
      var ruleConfig = _.clone(rule);
      ruleConfig.pageView = self.options.parentView;
      ruleConfig.fn = rules[rule.Type];
      self.$el.find('#' + self.model.get('ID')).wufoo_rules('add', ruleConfig);
    });
  },

  removeRules: function() {
    this.$el.find('#' + this.model.get('ID')).rules('remove');
  },

  // force a hide , defaults to false
  hide: function(force) {
    if (force || this.$el.is(':visible')) {
      this.$el.hide();
    }
  },
  renderButton: function(index, label, extension_type) {
    var button = $('<button>');
    button.addClass('special_button fh_appform_button_action');
    button.addClass(extension_type);
    button.attr("data-index", index);
    button.text(' ' + label);
    var img = $('<img>');
    img.attr('src', './img/' + extension_type + '.png');
    img.css('height', '28px');
    img.css('width', '28px');
    button.prepend(img);
    return this.htmlFromjQuery(button);
  },
  //deprecated
  addButton: function(input, extension_type, label) {
    var self = this;
    var button = $('<button>');
    button.addClass('special_button fh_appform_button_action');
    button.addClass(extension_type);
    button.text(' ' + label);
    var img = $('<img>');
    img.attr('src', './img/' + extension_type + '.png');
    img.css('height', '28px');
    img.css('width', '28px');
    button.prepend(img);

    button.click(function(e) {
      self.action(this);
      e.preventDefault();
      return false;
    });

    input.append(button);
    return button;
  },

  show: function() {
    if (!this.$el.is(':visible')) {
      this.$el.show();
      // add rules too
      //this.addRules();
      //set the form value from model
      //this.value(this.model.serialize());
    }
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
      this.valuePopulate(value);
    }
    return this.getValue();
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
    wrapperObj.find("label.errorMsg").hide();
    wrapperObj.find(".error").removeClass("error");
  }

});
FieldCameraView = FieldView.extend({
  input: '<img class="imageThumb" width="100%" data-field="<%= fieldId %>" data-index="<%= index %>">',
  html5Cam: '<div class="html5Cam">' +
    '<div class="camActionBar"><button class="camCancel camBtn fh_appform_button_cancel">Cancel</button><button class="camOk camBtn fh_appform_button_action">Ok</button></div>' +
    '<div class="cam"></div>' +
    '</div>',
  // initialize: function() {
  //   FieldView.prototype.initialize.call(this);
  //   //Make sure 'this' is bound for setImageData, was incorrect on device!
  //   _.bindAll(this, 'setImageData', 'imageSelected');
  //   this.on('visible',this.clearError);
  // },

  onElementShow: function(index) {
    var captureBtn = $(this.renderButton(index, "Capture Signature", "fhcam"));
    var libBtn = $(this.renderButton(index, "Choose Photo from Library", "fhcam_lib"));
    var rmBtn = $(this.renderButton(index, "Remove Photo", "remove"));

    this.getWrapper(index).append(captureBtn);
    this.getWrapper(index).append(libBtn);
    this.getWrapper(index).append(rmBtn);

    var self = this;
    captureBtn.on("click", function(e) {
      self.addFromCamera(e, index);
    });
    libBtn.on("click", function(e) {
      self.addFromLibrary(e, index);
    });
    rmBtn.on("click", function(e) {
      self.removeThumb(e, index);
    });
    rmBtn.hide();
  },
  // render: function() {
  //   var self = this;
  //   // construct field html
  //   this.$el.append(_.template(this.template.join(''), {
  //     "id": this.model.get('_id'),
  //     "title": this.model.get('name')
  //   }));

  //   this.addButton(this.$el, 'fhcam', 'Capture Photo from Camera');
  //   this.addButton(this.$el, 'fhcam_lib', 'Choose Photo from Library');
  //   this.addButton(this.$el, 'remove', 'Remove Photo', 'uploaded');

  //   this.setImageData(null, true);

  //   // add to dom hidden
  //   this.$el.hide();
  //   this.options.parentEl.append(this.$el);

  //   // populate field if Submission obj exists
  //   var submission = this.options.formView.getSubmission();
  //   if(submission){
  //     this.submission = submission;
  //     this.submission.getInputValueByFieldId(this.model.get('_id'),function(err,res){
  //       console.log(err,res);
  //       self.value(res);
  //     });
  //   }

  //   this.show();
  // },

  // contentChanged: function(e) {
  //   FieldView.prototype.contentChanged.apply(this,arguments);
  //   this.clearError();
  // },

  // addButton: function(input, img_file, label, classes, action) {
  //   var self = this;
  //   var button = $('<button>');
  //   button.addClass('special_button');
  //   button.addClass(img_file);
  //   button.text(' ' + label);
  //   var img = $('<img>');
  //   img.attr('src', './img/' + img_file + '.png');
  //   img.css('height', '28px');
  //   img.css('width', '28px');
  //   button.prepend(img);

  //   if (typeof action !== 'undefined') {
  //     button.click(function(e) {
  //       action();
  //       e.preventDefault();
  //       return false;
  //     });
  //   }

  //   if (classes) {
  //     button.addClass(classes);
  //   }

  //   input.append(button);
  //   return button;
  // },

  // getOrder: function() {
  //   return this.options.order;
  // },
  setImage: function(index, base64Img) {
    var wrapper = this.getWrapper(index);
    var img = wrapper.find("img.imageThumb");
    img.attr("src", base64Img);
    wrapper.find("button").hide();
    wrapper.find(".remove").show();
  },
  // setImageData: function(imageData, dontCallContentChanged) {
  //   var target = this.$el.find('#' + this.model.get('_id'));

  //   if (imageData) {
  //     console.debug('setting imageData:', imageData.length);
  //     // prepend dataUri if not already there
  //     var dataUri = imageData;
  //     if (!/\bdata\:image\/.+?\;base64,/.test(dataUri)) {
  //       dataUri = 'data:image/jpeg;base64,' + imageData;
  //     }
  //     target.val(dataUri);
  //     this.$el.find('.imageThumb').attr('src', dataUri);
  //     this.$el.find('.upload').hide();
  //     this.$el.find('.uploaded').show();
  //     this.fileData = {};
  //     this.fileData.fileBase64 = dataUri;
  //     this.fileData.filename = "photo";
  //     this.fileData.content_type = "image/jpeg";
  //   } else {
  //     target.val(null);
  //     this.$el.find('.imageThumb').removeAttr('src');
  //     this.$el.find('.upload').show();
  //     this.$el.find('.uploaded').hide();
  //     delete this.fileData;
  //   }

  //   // manually call contentChanged as 'change' event doesn't get triggered when we manipulate fields programatically
  //   if (!dontCallContentChanged) {
  //     this.contentChanged();
  //   }
  // },

  // dumpContent: function() {
  //   FieldFileView.prototype.dumpContent.call(this);
  // },

  // hasImageData: function() {
  //   return this.$el.find('#' + this.model.get('_id')).val().length > 0;
  // },

  // getImageData: function() {
  //   return this.$el.find('#' + this.model.get('_id')).val();
  // },
  getImageThumb: function(index) {
    var wrapper = this.getWrapper(index);
    var img = wrapper.find("img.imageThumb");
    return img;
  },
  getCameraBtn: function(index) {
    var wrapper = this.getWrapper(index);
    return wrapper.find("button.fhcam");
  },
  getLibBtn: function(index) {
    var wrapper = this.getWrapper(index);
    return wrapper.find("button.fhcam_lib");
  },
  getRemoveBtn: function(index) {
    var wrapper = this.getWrapper(index);
    return wrapper.find("button.remove");
  },
  removeThumb: function(e, index) {
    e.preventDefault();
    var img = this.getImageThumb(index);
    img.removeAttr("src");
    this.getLibBtn(index).show();
    this.getCameraBtn(index).show();
    this.getRemoveBtn(index).hide();
    // this.trigger('imageRemoved'); // trigger events used by grouped camera fields NOTE: don't move to setImageData fn, could result in infinite event callback triggering as group camera field may call into setImageData()
  },

  addFromCamera: function(e, index) {
    e.preventDefault();
    var self = this;
    var params = {
      width: App.config.getValueOrDefault('cam_targetWidth'),
      height: App.config.getValueOrDefault('cam_targetHeight')
    }
    if (this.model.utils.isPhoneGapCamAvailable()) {
      this.model.utils.takePhoto(params, function(err, base64Img) {
        if (err) {
          console.error(err);
        } else {
          self.setImage(index, base64Img);
        }
      });
    } else if (this.model.utils.isHtml5CamAvailable()) {
      var camObj = $(self.html5Cam);
      var actionBar = camObj.find(".camActionBar");
      camObj.css({
        "position": "fixed",
        "top": 0,
        "bottom": 0,
        "left": 0,
        "right": 0,
        "background": "#000",
        "z-index": 9999
      });
      actionBar.css({
        "text-align": "center",
        "padding": "10px",
        "background": "#999"

      });
      actionBar.find("button").css({
        "width": "80px",
        "height": "30px",
        "margin-right": "8px",
        "font-size": "1.3em"
      });
      self.$el.append(camObj);
      actionBar.find(".camCancel").on("click", function() {
        self.model.utils.cancelHtml5Camera();
        camObj.remove();
      });
      this.model.utils.initHtml5Camera(params, function(err, video) {
        if (err) {
          console.error(err);
          alert(err);
          camObj.remove();
        } else {
          $(video).css("width", "100%");
          camObj.find(".cam").append(video);

          actionBar.find(".camOk").on("click", function() {
            self.model.utils.takePhoto(params, function(err, base64Img) {
              camObj.remove();
              if (err) {
                console.error(err);
              } else {
                self.setImage(index, base64Img);
              }
            });

          });
        }
      });
    } else {
      var sampleImg = self.sampleImage();
      self.setImage(index, sampleImage);
    }
  },
  // imageSelected: function(imageData) {
  //   this.setImageData(imageData);
  //   this.trigger('imageAdded'); // trigger events used by grouped camera fields
  // },

  // parseCssClassCameraOptions: function() {
  //   var options = {
  //     targetHeight: null,
  //     targetWidth: null,
  //     quality: null
  //   };

  //   // TODO - review if this is needed
  //   // var classNames = this.model.get('ClassNames'),
  //   //   parts, val;
  //   // if (classNames !== '') {
  //   //   var classes = classNames.split(' ');
  //   //   _(classes).forEach(function(className) {
  //   //     if (className.indexOf("fhdimensions") != -1) {
  //   //       parts = className.split('=');
  //   //       val = parts[1].split('x');

  //   //       // Retry
  //   //       if (val.length == 2) {
  //   //         // Validity check
  //   //         if (val[0] < 10000 && val[1] < 10000) {
  //   //           options.targetWidth = val[0];
  //   //           options.targetHeight = val[1];
  //   //         } else {
  //   //           console.error('Invalid camera resolution, using defaults');
  //   //         }
  //   //       }
  //   //     } else if (className.indexOf("fhcompression") != -1) {
  //   //       parts = className.split('=');
  //   //       val = parts[1].split('%');

  //   //       options.quality = val[0];
  //   //     }
  //   //   });
  //   // }

  //   return options;
  // },
  addFromLibrary: function(e, index) {
    var self = this;
    var params = {
      width: App.config.getValueOrDefault('cam_targetWidth'),
      height: App.config.getValueOrDefault('cam_targetHeight')
    }
    if (self.model.utils.isPhoneGapCamAvailable()) {
      e.preventDefault();
      params.sourceType = Camera.PictureSourceType.PHOTOLIBRARY;
      self.model.utils.takePhoto(params, function(err, base64Img) {
        self.setImage(index, base64Img);
      });
    } else {
      var file = document.createElement("input");
      file.type = "file";
      var fileObj = $(file);
      fileObj.hide();
      self.$el.append(fileObj);

      fileObj.on("change", function() {
        var file=fileObj[0];
        if (file.files && file.files.length>0){
          var file=file.files[0];
          fileObj.remove();
          self.model.utils.fileSystem.fileToBase64(file,function(err,base64Img){
            if (err){
              console.error(err);
              alser(err);
            }else{
              self.setImage(index,base64Img);
            }
          });  
        }
        
      });
      fileObj.click();
    }
  },
  // addImage: function(fromLibrary) {
  //   // TODO: move this to cloud config, synced to client on startup
  //   var camOptions = {
  //     quality: App.config.getValueOrDefault('cam_quality'),
  //     targetWidth: App.config.getValueOrDefault('cam_targetWidth'),
  //     targetHeight: App.config.getValueOrDefault('cam_targetHeight')
  //   };

  //   var options = this.parseCssClassCameraOptions();
  //   // Merge
  //   camOptions = _.defaults(options, camOptions);

  //   if (typeof navigator.camera === 'undefined') {
  //     this.imageSelected(this.sampleImage());
  //   } else {
  //     if (fromLibrary) {
  //       camOptions.sourceType = Camera.PictureSourceType.PHOTOLIBRARY;
  //     }
  //     // turn off refetch on resume from pic taking, necessary as pic/cam sends app in background
  //     App.resumeFetchAllowed = false;
  //     navigator.camera.getPicture(this.imageSelected, function(err) {
  //       alert('Camera Error: ' + err);
  //     }, camOptions);
  //   }
  // },

  // show: function() {
  //   // only perform check once
  //   if (this.options.initHidden) {
  //     this.options.initHidden = false;
  //   } else {
  //     FieldView.prototype.show.call(this);
  //   }
  // },

  valueFromElement: function(index) {

    var img = this.getImageThumb(index);
    return img.attr("src");
  },
  valuePopulateToElement: function(index, value) {
    if (value) {
      var base64Data = value.data;
      var base64Img = value.imgHeader + base64Data;
      this.setImage(index, base64Img);
    }

  },
  sampleImages: ['/9j/4QAYRXhpZgAASUkqAAgAAAAAAAAAAAAAAP/sABFEdWNreQABAAQAAAAAAAD/4QMraHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLwA8P3hwYWNrZXQgYmVnaW49Iu+7vyIgaWQ9Ilc1TTBNcENlaGlIenJlU3pOVGN6a2M5ZCI/PiA8eDp4bXBtZXRhIHhtbG5zOng9ImFkb2JlOm5zOm1ldGEvIiB4OnhtcHRrPSJBZG9iZSBYTVAgQ29yZSA1LjAtYzA2MCA2MS4xMzQ3NzcsIDIwMTAvMDIvMTItMTc6MzI6MDAgICAgICAgICI+IDxyZGY6UkRGIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+IDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSIiIHhtbG5zOnhtcD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLyIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bXA6Q3JlYXRvclRvb2w9IkFkb2JlIFBob3Rvc2hvcCBDUzUgTWFjaW50b3NoIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjVEMzgyQjRCMTU1MjExRTJBNzNDQzMyMEE5ODI5OEU0IiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOjVEMzgyQjRDMTU1MjExRTJBNzNDQzMyMEE5ODI5OEU0Ij4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6NUQzODJCNDkxNTUyMTFFMkE3M0NDMzIwQTk4Mjk4RTQiIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6NUQzODJCNEExNTUyMTFFMkE3M0NDMzIwQTk4Mjk4RTQiLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz7/7gAOQWRvYmUAZMAAAAAB/9sAhAAbGhopHSlBJiZBQi8vL0JHPz4+P0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHAR0pKTQmND8oKD9HPzU/R0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0f/wAARCAAyADIDASIAAhEBAxEB/8QATQABAQAAAAAAAAAAAAAAAAAAAAQBAQEBAAAAAAAAAAAAAAAAAAAEBRABAAAAAAAAAAAAAAAAAAAAABEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AiASt8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAB//9k=', 'iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAALklEQVQYV2NkwAT/oUKMyFIoHKAETBFIDU6FIEUgSaJMBJk0MhQihx2W8IcIAQBhewsKNsLKIgAAAABJRU5ErkJggg==', 'iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAYUlEQVQYV2NkQAJlM1X/g7hd6bdBFCOyHCNIEigBppElkNkgeYIKYBrwKoQ6A+wEuDtwOQHmLLgbQbqQ3YnubhSfwRTj9DUu3+J0I7oGkPVwXwMZKOEHdCdcPdQJILczAAACnDmkK8T25gAAAABJRU5ErkJggg=='],

  sampleImage: function() {
    window.sampleImageNum = (window.sampleImageNum += 1) % this.sampleImages.length;
    return this.sampleImages[window.sampleImageNum];
  }

});
window.sampleImageNum = -1;
FieldCameraGroupView = FieldCameraView.extend({
  initialize: function() {
    FieldCameraView.prototype.initialize.call(this);
    //Make sure 'this' is bound for setImageData, was incorrect on device!
    // pass visible event down to all fields
    var parent = this;
    this.on('visible', function () {
      $fh.logger.debug('group visible');
      var subviews = this.subviews;
      _(subviews).forEach(function (fieldView) {
        // this group is a camera view and contains itself
        // we've already triggered visible on the group, so skip
        if(parent !== fieldView){
          fieldView.trigger('visible');
        }
      });
    });
  },

  render: function () {
    var self = this;
    // this view subclasses camera view, so render it for first camera item
    FieldCameraView.prototype.render.call(this);
    this.options.order = 0;

    this.subviews = [this]; // this is the first field i.e. this extends FieldCameraView
    this.bind('imageAdded imageRemoved', this.updateFields, this);

    // initialilse subsequent camera views from subfields
    var options = this.model.get("fieldOptions").definition;
    for(var i=1;i<options.maxRepeat;i++){
      var subview = new FieldCameraView({
        parentEl: self.options.parentEl,
        parentView: self.options.parentView,
        model: self.model,
        order: i + 1,
        formView: self.options.formView,
        initHidden: self.model.IsRequired === '1' ? false: true // hide camera fields initially if they're not required
      });
      // bind event handler for whenever image is added/remove from field
      subview.bind('imageAdded imageRemoved', self.updateFields, self); // purposely pass in self here as subviews need to be iterated over no matter which field changed
      self.subviews.push(subview);
    }

    //ToDo subviews should probably be added in initialize?
    // this.value(this.model.serialize());

    // if restoring from a draft, may need to show some additional fields
    this._optimiseVisibleFields();
  },

  updateFields: function () {
    this._fillBlanks();
    this._optimiseVisibleFields();
  },

  _fillBlanks: function () {
    var groups = this._getGroupedFields();

    // move any optional filled fields into empty required field spots
    // NOTE: could move all filled fields here,
    //       but not necessary as required fields that are filled is what we want (and are always visible anyways).
    //       Only thing is, may have a blank required above a filled required. minor UI preference
    _(groups.optFilled).forEach(function (optField, index) {
      // get next empty field
      var nextEmptyField = groups.empty[0];
      // if field exists & is before the field we're trying to move, move it. Otherwise, do nothing
      if (nextEmptyField && (nextEmptyField.getOrder() < optField.getOrder())) {
        // remove entry from empty list as we'll be filling it here
        groups.empty.shift();
        // move image data to reqField
        nextEmptyField.setImageData(optField.getImageData(), true);
        // empty image data from optField
        optField.setImageData(null, false);
        groups.empty.push(optField); // field is now empty, add to end of empty list
      }
    });
  },

  _optimiseVisibleFields: function () {
    // get groups again as they may have changed above (optional filled moved to req filled)
    var groups = this._getGroupedFields();

    // all fields image data in order. See how many optional fields we should show, if any
    var amountToShow = groups.reqFilled.length >= groups.req.length ? Math.min(groups.opt.length, Math.max(0, groups.optFilled.length + 1)) : 0;
    _(groups.opt).forEach(function (optField, index) {
      if (index < amountToShow) {
        optField.show();
      } else {
        optField.hide();
      }
    });
    // this.contentChanged(); //Call contentChanged so all image data is set on the group model
  },

    // group fields based on required status and whether or not image data is filled
  _getGroupedFields: function () {
    var groups = {
      req: [], // required fields
      reqEmpty: [], // required empty fields
      reqFilled: [], // required filled fields
      opt: [], // optional fields
      optEmpty: [], // optional empty fields
      optFilled: [], // optional filled fields
      empty: [] // empty fields
    };

    _(this.subviews).forEach(function (subview, index) {
      if (subview.isRequired()) { // required field
        groups.req.push(subview);
        if (subview.hasImageData()) { // filled in
          groups.reqFilled.push(subview);
        } else { // empty
          groups.reqEmpty.push(subview);
          groups.empty.push(subview);
        }
      } else { // optional field
        groups.opt.push(subview);
        if (subview.hasImageData()) { // filled in
          groups.optFilled.push(subview);
        } else { // empty
          groups.optEmpty.push(subview);
          groups.empty.push(subview);
        }
      }
    });
    return groups;
  },

  value: function(value) {
    if (value && !_.isEmpty(value)) {
      _(this.subviews).forEach(function (subview, index) {
        //subview might be the group, so we call value on FieldCameraView
        FieldCameraView.prototype.value.call(subview, value);
      });
    }
    value = {};
    _(this.subviews).forEach(function (subview, index) {
      $.extend(value, FieldCameraView.prototype.value.call(subview));
    });
    return value;
  }
});
FieldCheckboxView = FieldView.extend({
  choice: '<input data-fieldId="<%= fieldId %>" <%= checked %> data-index="<%= index %>" name="<%= fieldId %>[]" type="checkbox" class="field checkbox fh_appform_field_input" value="<%= value %>" ><label class="choice" ><%= choice %></label><br/>',

  // contentChanged: function(e) {
  //   var self = this;
  //   this.dumpContent();
  //   this.getTopView().trigger('change:field');
  //   // var val = this.value();
  //   // if (this.model.validate(val) === true) {
  //   //   // self.model.set('value', val);
  //   //   this.options.formView.setInputValue(self.model.get("_id"), val);

  //   // } else {
  //   //   alert('Value not valid for this field: ' + this.model.validate(val));
  //   // }
  // },

  renderInput: function(index) {
    var subfields = this.model.getCheckBoxOptions();
    var fieldId=this.model.getFieldId();
    var self=this;
    var html="";
    $.each(subfields, function(i, subfield) {
      html+= _.template(self.choice, {
        "fieldId": fieldId,
        "index": index,
        "choice": subfield.label,
        "value": subfield.label,
        "checked": (subfield.selected) ? "checked='checked'" : ""
      });
    });
    return html;
  },
  // addValidationRules: function() {
  //   if (this.model.get('IsRequired') === '1') {
  //     // special required rule for checkbox fields
  //     this.$el.find('[name="' + this.model.get('_id') + '[]"]').first().rules('add', {
  //       "required": true,
  //       "minlength": 1,
  //       messages: {
  //         required: "Please choose at least 1"
  //       }
  //     });
  //   }
  // },

  // defaultValue: function() {
  //   var defaultValue = {};
  //   var subfields = this.model.get('SubFields');
  //   $.each(subfields, function(i, subfield) {
  //     if (subfield.DefaultVal && subfield.DefaultVal == 1) {
  //       defaultValue[subfield.ID] = subfield.Label;
  //     }
  //   });
  //   return defaultValue;
  // },
  valueFromElement: function(index) {
    var value=[];
    var wrapperObj=this.getWrapper(index);
    var checked=wrapperObj.find("input:checked");
    checked.each(function(){
      value.push($(this).val());
    });
    return value;
  },
  valuePopulateToElement: function(index,value) {
    var wrapperObj=this.getWrapper(index);
    if (!value || !value instanceof Array){
      return;
    }
    for (var i=0;i<value.length;i++){
      var v=value[i];
      wrapperObj.find("input[value='"+v+"']").attr("checked","checked");
    }
  }
});
FieldEmailView = FieldView.extend({
   type:"email"
  // addValidationRules: function () {
  //   // call super
  //   FieldView.prototype.addValidationRules.call(this);

  //   // email validation
  //   this.$el.find('#' + this.model.get('_id')).rules('add', {
  //     "email": true
  //   });
  // }
});
FieldFileView = FieldView.extend({
  input: "<button style='display:none' data-field='<%= fieldId %>' class='special_button fh_appform_button_action' data-index='<%= index %>'></button>" +
    "<input data-field='<%= fieldId %>' data-index='<%= index %>' type='<%= inputType %>'/> ",
  type: "file",
  // dumpContent: function() {
  //   var tmp = "<empty>";
  //   if (this.fileData) {
  //     var size = this.fileData.fileBase64.length + " bytes";
  //     if (this.fileData.fileBase64.length > 1024) {
  //       size = (Math.floor((this.fileData.fileBase64.length / 1024) * 1000) / 1000) + " Kilo bytes";
  //     }
  //     tmp = {
  //       content_type: this.fileData.content_type,
  //       filename: this.fileData.filename,
  //       size: size
  //     };
  //   }
  //   console.debug("Value changed :: " + JSON.stringify(tmp));
  // },
  initialize:function(){
    this.fileObjs=[];
    FieldView.prototype.initialize.apply(this,arguments);
  },
  // validate: function(e) {
  //   if (App.config.validationOn) {
  //     this.trigger("checkrules");
  //   }
  // },
  contentChanged: function(e) {

    var self = this;
    var fileEle =e.target;
    var filejQ=$(fileEle);
    var index =filejQ.data().index;
    var file =fileEle.files? fileEle.files[0]:null;
    if (file) {
      var fileObj = {
        "fileName": file.name,
        "fileSize": file.size,
        "fileType": file.type
      };
      self.showButton(index, fileObj);
    }else{ //user cancelled file selection
      self.showFile(index);
    }

  },


  valueFromElement: function(index) {
    var wrapperObj = this.getWrapper(index);
    var fileEle = wrapperObj.find("input[type='file']")[0];
    if (fileEle.files && fileEle.files.length > 0) { //new file
      return fileEle.files[0];
    } else { //sandboxed file
      return this.fileObjs[index];
    }
  },
  showButton: function(index, fileObj) {
    var wrapperObj = this.getWrapper(index);
    var button = wrapperObj.find("button");
    var fileEle = wrapperObj.find("input[type='file']");
    fileEle.hide();
    button.show();
    button.text(fileObj.fileName + "(" + fileObj.fileSize + ")");
    button.off("click");
    button.on("click", function() {
      var index = $(this).data().index;
      fileEle.click();
    });
  },
  showFile: function(index) {
    var wrapperObj = this.getWrapper(index);
    var button = wrapperObj.find("button");
    var fileEle = wrapperObj.find("input[type='file']");
    button.off("click");
    button.hide();
    fileEle.show();
    if (this.fileObjs[index]) {
      this.fileObjs[index] = null;
    }
  },
  valuePopulateToElement: function(index, value) {
    if (value) {
      this.fileObjs[index] = value;
      this.showButton(index, value);
    }
  }
});
FieldGeoView = FieldView.extend({
  input: "<input data-field='<%= fieldId %>' data-index='<%= index %>' type='<%= inputType %>' disabled/> ",
  type: "text",
  initialize: function() {
    this.geoValues=[];
    this.locationUnit = this.model.getFieldDefinition().locationUnit;
    FieldView.prototype.initialize.apply(this, arguments);
  },
  renderInput: function(index) {
    var btnLabel = this.locationUnit === "latLong" ? 'Capture Location (Lat/Lon)' : 'Capture Location (East/North)';
    var html = _.template(this.input, {
      "fieldId": this.model.getFieldId(),
      "index": index,
      "inputType": "text"
    });
    html += this.renderButton(index, btnLabel, "fhgeo");
    return html;
  },
  onRender: function() {
    var that = this;
    this.$el.find("button").on("click", function(e) {
      e.preventDefault();
      var btn = $(this);
      var index = btn.data().index;
      var wrapper = that.getWrapper(index);
      var textInput = wrapper.find("input[type='text']");
      $fh.geo(function(res) {
        var location;
        if (that.locationUnit === "latLong") {
          that.geoValues[index] = {
            "lat": res.lat,
            "long": res.lon
          };
        }else if (that.locationUnit==="northEast"){
          var en_location = that.convertLocation(res);
          var locArr=en_location.toString().split(" ");
          that.geoValues[index]={
            "zone":locArr[0],
            "eastings":locArr[1],
            "northings":locArr[2]
          }
        }
        that.renderElement(index);
      }, function(msg, err) {
        textInput.attr('placeholder', 'Location could not be determined');
      });
      return false;
    });
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
    var textInput = this.getWrapper(index).find("input[type='text']");
    if (location) {
      if (this.locationUnit === "latLong") {
        locStr = '(' + location.lat + ', ' + location.long + ')';
      } else if (this.locationUnit === "northEast") {
        locStr = '(' + location.zone+' '+location.eastings + ', ' + location.northings + ')';
      }
      textInput.val(locStr);
    }
    textInput.blur();
  },
  valuePopulateToElement: function(index, value) {
    this.geoValues[index] = value;
    this.renderElement(index);
  },
  valueFromElement: function(index) {
    return this.geoValues[index];
  }
});
FieldMapView = FieldView.extend({
  extension_type: 'fhmap',
  input: "<div data-index='<%= index %>' class='fh_map_canvas' style='width:<%= width%>; height:<%= height%>;'></div>",

  // parseCssOptions: function() {
  //   var options = {
  //     defaultZoom: null
  //   };

  //   var classNames = this.model.get('ClassNames'),
  //     parts, val;
  //   if (classNames !== '') {
  //     var classes = classNames.split(' ');
  //     _(classes).forEach(function(className) {
  //       if (className.indexOf("fhzoom") != -1) {
  //         parts = className.split('=');
  //         val = parseInt(parts[1], 10);

  //         if (_.isNumber(val)) {
  //           options.defaultZoom = val;
  //         }
  //       }
  //     });
  //   }

  //   return options;
  // },
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
    }
    FieldView.prototype.initialize.apply(this, arguments);
  },
  renderInput: function(index) {
    return _.template(this.input, {
      width: this.mapSettings.mapWidth,
      height: this.mapSettings.mapHeight,
      "index": index
    });
  },
  onMapInit: function(index) {
    this.mapInited++;
    if (this.mapInited == this.curRepeat) { // all map initialised
      this.allMapInit();
    }
  },
  allMapInit: function() {
    while (func = this.allMapInitFunc.shift()) {
      func();
    }
  },
  onAllMapInit: function(func) {
    if (this.mapInited == this.curRepeat) {
      func();
    } else {
      if (this.allMapInitFunc.indexOf(func) == -1) {
        this.allMapInitFunc.push(func);
      }
    }

  },
  onElementShow: function(index) {
    var wrapperObj = this.getWrapper(index);
    var self = this;
    var mapCanvas = wrapperObj.find('.fh_map_canvas')[0];
    // var options = this.parseCssOptions();

    // // Merge
    // this.mapSettings = _.defaults(options, this.mapSettings);

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
        zoom: self.mapSettings.defaultZoom
      }, function(res) {
        self.maps[index] = res.map;
        var marker = new google.maps.Marker({
          position: self.maps[index].getCenter(),
          map: self.maps[index],
          draggable: true,
          animation: google.maps.Animation.DROP,
          title: "Drag this to set position"
        });
        self.markers[index] = marker;
        self.mapData[index] = {
          "lat": marker.getPosition().lat(),
          "long": marker.getPosition().lng(),
          "zoom": self.mapSettings.defaultZoom
        }
        // google.maps.event.addListener(marker, "dragend", function() {
        //   self.mapData[index].lat = marker.getPosition().lat();
        //   self.mapData[index].long = marker.getPosition().lng();
        //   self.mapData[index].zoom=zoomLevel;
        //   // self.contentChanged();
        // });
        // google.maps.event.addListener(res.map, 'zoom_changed', function() {
        //   var zoomLevel = res.map.getZoom();
        //   self.mapData[index].zoom=zoomLevel;
        //   self.mapData[index].lat = marker.getPosition().lat();
        //   self.mapData[index].long = marker.getPosition().lng();
        // });
        self.onMapInit(index);
      }, function(err) {
        console.error(err);
        self.onMapInit(index);
      });
    });
  },
  mapResize: function() {
    if (this.maps.length > 0) {
      for (var i = 0; i < this.maps.length; i++) {
        var map = this.maps[i];
        if (map) {
          google.maps.event.trigger(map, 'resize');
          map.setCenter(new google.maps.LatLng(this.latLongs[i].lat, this.latLongs[i].long));
        }
      }
    }
  },

  addValidationRules: function() {
    // You can't have a required map, since there's no input. Also there's always a default location set.
  },

  valueFromElement: function(index) {
    var map = this.maps[index];
    var marker = this.markers[index];
    if (map && marker) {
      return {
        "lat": marker.getPosition().lat(),
        "long": marker.getPosition().lng(),
        "zoom": map.getZoom()
      };
    } else {
      return null;
    }

  },
  valuePopulateToElement: function(index, value) {
    if (value){
      var that = this;

      function _handler() {
        var map = that.maps[index];
        var pt = new google.maps.LatLng(value.lat, value.long);
        map.setCenter(pt);
        map.setZoom(value.zoom);
        that.markers[index].setPosition(pt);
      }

      this.onAllMapInit(_handler);
    }

  }
});
FieldNumberView = FieldView.extend({
    type:"number",
    valueFromElement:function(index){
        var wrapperObj = this.getWrapper(index);
        return parseFloat(wrapperObj.find("input,select,textarea").val()) || 0;
    }
  // addValidationRules: function () {
  //   // call super
  //   FieldView.prototype.addValidationRules.call(this);

  //   // make sure value is a number
  //   this.$el.find('#' + this.model.get('_id')).rules("add", {
  //     "number": true
  //   });
  // }
});
// We only capture this as text
// NOTE: validate plugin has a 'phoneUS' type. Could use this if needed
FieldPhoneView = FieldView.extend({
  type:"tel"
});
FieldRadioView = FieldView.extend({
  hidden_field: '<input id="radio<%= id %>" type="hidden" value="" data-type="radio">',
  choice: '<input data-field="<%= fieldId %>" data-index="<%= index %>" name="<%= fieldId %>_<%= index %>" type="radio" class="field radio fh_appform_field_input" value="<%= value %>" ><label class="choice" ><%= choice %></label><br/>',
  renderInput: function(index) {
    var choices = this.model.getRadioOption();
    var self = this;
    var html = "";
    var fieldId = this.model.getFieldId();
    $.each(choices, function(i, choice) {
      var jQObj = $(_.template(self.choice, {
        "fieldId": fieldId,
        "choice": choice.label,
        "value": choice.label,
        "index": index
      }));

      if (choice.checked == true) {
        jQObj.attr('checked', 'checked');
      }
      html += self.htmlFromjQuery(jQObj);
    });
    return html;
  },
  // addValidationRules: function() {
  //   // first radio is always initially checked, so no need to do 'required' validation on this field
  // },
  valuePopulateToElement: function(index, value) {
    var wrapperObj=this.getWrapper(index);
    var opt=wrapperObj.find("input[value='"+value+"']");
    if (opt.length==0){
      opt=wrapperObj.find("input:first-child");
      
    }
    opt.attr("checked","checked");  
  },
  valueFromElement: function(index) {
    var wrapperObj=this.getWrapper(index);
    return wrapperObj.find("input:checked").val() || this.model.getRadioOption()[0].label;
  }
});
FieldSelectView = FieldView.extend({
  select: "<select data-field='<%= fieldId %>' data-index='<%= index %>'><%= options %></select>",
  option: '<option value="<%= value %>" <%= selected %>><%= value %></option>',
  renderInput: function(index) {
    var fieldId=this.model.getFieldId();
    var choices = this.model.get('fieldOptions');
    choices = choices.definition.options;
    var options="";
    var self=this;
    $.each(choices, function(i, choice) {
      options += _.template(self.option, {
        "value": choice.label,
        "selected": (choice.checked) ? "selected='selected'" : ""
      });
    });
   return _.template(this.select, {
      "fieldId":fieldId,
      "index":index,
      "options":options
    });
  }
});
FieldSignatureView = FieldView.extend({
  extension_type: 'fhsig',

  input: "<img class='sigImage' data-field='<%= fieldId %>' data-index='<%= index %>'/>",
  signaturePadStyle: "@font-face{font-family:Journal;src:url(journal.eot);src:url(journal.eot?#iefix) format('embedded-opentype'),url(journal.woff) format('woff'),url(journal.ttf) format('truetype'),url(journal.svg#JournalRegular) format('svg');font-weight:400;font-style:normal}.sigPad{margin:0;padding:0;width:250px;height:200px}.sigPad label{display:block;margin:0 0 .515em;padding:0;color:#000;font:italic normal 1em/1.375 Georgia,Times,serif}.sigPad label.error{color:#f33}.sigPad input{margin:0;padding:.2em 0;width:198px;border:1px solid #666;font-size:1em}.sigPad input.error{border-color:#f33}.sigPad button{margin:1em 0 0;padding:.6em .6em .7em;background-color:#ccc;border:0;-moz-border-radius:8px;-webkit-border-radius:8px;border-radius:8px;cursor:pointer;color:#555;font:700 1em/1.375 sans-serif;text-align:left}.sigPad button:hover{background-color:#333;color:#fff}.sig{display:none}.sigNav{display:none;height:2.25em;margin:0;padding:0;position:relative;list-style-type:none}.sigNav li{display:inline;float:left;margin:0;padding:0}.sigNav a,.sigNav a:link,.sigNav a:visited{display:block;margin:0;padding:0 .6em;border:0;color:#333;font-weight:700;line-height:2.25em;text-decoration:underline}.sigNav a.current,.sigNav a.current:link,.sigNav a.current:visited{background-color:#666;-moz-border-radius-topleft:8px;-moz-border-radius-topright:8px;-webkit-border-top-left-radius:8px;-webkit-border-top-right-radius:8px;border-radius:8px 8px 0 0;color:#fff;text-decoration:none}.sigNav .typeIt a.current,.sigNav .typeIt a.current:link,.sigNav .typeIt a.current:visited{background-color:#ccc;color:#555}.sigWrapper{clear:both;height:100px;border:1px solid #ccc}.sigWrapper.current{border-color:#666}.signed .sigWrapper{border:0}.pad{position:relative}.typed{height:55px;margin:0;padding:0 5px;position:absolute;z-index:90;cursor:default;color:#145394;font:400 1.875em/50px Journal,Georgia,Times,serif}.drawItDesc,.typeItDesc{display:none;margin:.75em 0 .515em;padding:.515em 0 0;border-top:3px solid #ccc;color:#000;font:italic normal 1em/1.375 Georgia,Times,serif}",
  templates: {
    signaturePad: ['<div class="sigPad">', '<ul class="sigNav">', '<button class="clearButton">Clear</button><button class="cap_sig_done_btn">Done</button>', '</ul>', '<div class="sig sigWrapper">', '<canvas class="pad" width="<%= canvasWidth %>" height="<%= canvasHeight %>"></canvas>', '</div>', '</div>']
  },

  initialize: function() {
    FieldView.prototype.initialize.call(this);
    this.on('visible', this.clearError);
  },

  // dumpContent: function() {
  //   FieldFileView.prototype.dumpContent.call(this);
  // },
  onElementShow: function(index) {
    var html = $(this.renderButton(index, "Capture Signature", this.extension_type));
    this.getWrapper(index).append(html);
    var self = this;
    html.on("click", function() {
      self.showSignatureCapture(index);
    });
  },
  validate: function(e) {
    if (App.config.validationOn) {
      this.trigger("checkrules");
    }
  },
  // render: function() {
  //   var self = this;
  //   this.$el.append(_.template(this.templates.input, {
  //     "id": this.model.get('_id'),
  //     "title": this.model.get('Title')
  //   }));

  //   // Add button
  //   var button = this.addButton(this.$el, this.extension_type, 'Capture Signature');

  //   // add to dom
  //   this.options.parentEl.append(this.$el);
  //   console.debug("render html=" + this.$el.html());
  //   this.show();
  // },

  // contentChanged: function(e) {
  //   FieldView.prototype.contentChanged.apply(this,arguments);
  //   this.clearError();
  // },

  // TODO horrible hack
  // clearError: function(){
  //   var id = this.model.get('_id');
  //   var val = this.model.get("value");
  //   if(val && val.hasOwnProperty(id) && !this.isEmptyImage(val[id].fileBase64)) {
  //     FieldView.prototype.clearError.call(this);
  //   }
  // },

  // action: function(el, e) {
  //   $('input', this.$el);
  //   this.showSignatureCapture();
  // },
  onRender: function() {
    var style = $("<style />");
    style.text(this.signaturePadStyle);

    this.$el.append(style);
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
    // console.debug("showSignatureCapture html=" + this.$el.html());

    var signaturePad = $('.sigPad', this.$el);
    signaturePad.css({
      position: 'fixed',
      'z-index': 9999,
      'bottom': '0px',
      'right': '0px',
      top: '0px',
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
        // var img = $('.sigImage', self.$el)[0];
        // img.src = sigData;
        // $('input', self.$el).val(sigData);

        // self.fileData = {};
        // self.fileData.fileBase64 = sigData;
        // var parts = self.splitImage(sigData);
        // self.fileData.content_type = parts[0];
        // self.fileData.filename = "signature." +  parts[1];
      }
      $('.sigPad', self.$el).hide();
      // loadingView.hide();
      // self.contentChanged();
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
    console.log(msg + (image ? (image.substring(0, image.indexOf(",")) + "[len=" + image.length + "]") : " empty"));
  },
  // toJpg: function(image) {
  //   image = _.extend({}, image || {}, {
  //     quality: 100,
  //     width: 248,
  //     height: 100
  //   });
  //   var cnvs = $('.sigPad', self.$el).find('canvas')[0];

  //   var canvas = this.scaleCanvas(cnvs, image.width, image.height);
  //   var myEncoder = new JPEGEncoder(image.quality);
  //   return myEncoder.encode(canvas.getContext("2d").getImageData(0, 0, image.width, image.height));
  // },

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
    if (typeof data == "string") {
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
  template: ['<label class="desc" for="<%= id %>"><%= title %></label>', '<input class="field text medium fh_appform_field_input" maxlength="255" id="<%= id %>" name="<%= id %>" type="text" value="<%= defaultVal %>">']
});
FieldTextareaView = FieldView.extend({
    input:"<textarea class='fh_appform_field_input' data-field='<%= fieldId %>' data-index='<%= index %>'  ></textarea>"
});
FieldSectionBreak = FieldView.extend({
  renderEle:function(){
    return "<hr/>";
  }
});
FieldDateTimeView = FieldView.extend({
  extension_type: 'fhdate',
  inputTime:"<input data-field='<%= fieldId %>' data-index='<%= index %>' type='time'>",
  inputDate:"<input data-field='<%= fieldId %>' data-index='<%= index %>' type='date'>",
  inputDateTime:"<input data-field='<%= fieldId %>' data-index='<%= index %>' type='text'>",

  renderInput:function(index){
    var fieldId = this.model.getFieldId();

    var unit=this.getUnit();
    var template="";
    var buttonLabel="";
    if (unit=="dateTime"){
      template=this.inputDateTime;
      buttonLabel="Get Current Date & Time";
    }else if (unit=="date"){
      template=this.inputDate;
      buttonLabel="Get Current Date";
    }else if (unit=="time"){
      template=this.inputTime;
      buttonLabel="Get Current Time";
    }
    var html=_.template(template,{
      "fieldId":fieldId,
      "index":index
    });
    html+=this.renderButton(index,buttonLabel,"fhdate");
    return html;
  },
  getUnit:function(){
    var def=this.model.getFieldDefinition();
    return def.dateTimeUnit;
  },
  onRender:function(){
    var that=this;
    this.$el.on("click","button",function(){
      that.action(this);
    });
  },
  action: function(el) {
    var index=$(el).data().index;
    var self = this;
    var now=new Date();
    if (self.getUnit() === "dateTime") {
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
    return "HH:mm:ss".replace("HH",this.twoDigi(d.getHours())).replace("mm",this.twoDigi(d.getMinutes())).replace("ss",this.twoDigi(d.getSeconds()));
  },
  twoDigi:function(num){
    if (num<10){
      return "0"+num.toString();
    }else{
      return num.toString();
    }
  }
});
PageView=BaseView.extend({

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
    "sectionBreak":FieldSectionBreak
  },

  initialize: function() {
    var self = this;
    _.bindAll(this, 'render',"show","hide");
    // Page Model will emit events if user input meets page rule to hide / show the page.
    this.model.on("visible",self.show);
    this.model.on("hidden",self.hide);
    // // pass visible event down to all fields
    // this.on('visible', function () {
    //   _(self.fieldViews).forEach(function (fieldView) {
    //         fieldView.trigger('visible');
    //   });
    // });
    this.render();
  },

  render: function() {
    var self = this;
    this.fieldViews = {};
    // all pages hidden initially
    this.$el.empty().addClass('page fh_appform_body hidden');
    // add to parent before init fields so validation can work
    this.options.parentEl.append(this.$el);

    var fieldModelList=this.model.getFieldModelList();
    
    fieldModelList.forEach(function (field, index) {
      var fieldType = field.getType();
      if (self.viewMap[fieldType]) {

        console.log("*- "+fieldType);

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
  },

  show: function () {
    var self = this;
    this.$el.removeClass('hidden');
  },

  hide: function () {
    this.$el.addClass('hidden');
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
    var validateEls = this.$el.find('input,select,option,textarea').not('.validate_ignore,[type!="hidden"]:hidden');
    return validateEls.length ? validateEls.valid() : true;
  },

  checkRules: function () {
    var self = this;
    var result = {};

    var rules = {
      SkipToPage: function (rulePasses, params) {
        var pageToSkipTo = params.Setting.Page;
        if (rulePasses) {
          result.skipToPage = pageToSkipTo;
        }
      }
    };

    // iterate over page rules, if any, calling relevant rule function
    _(this.model.get('Rules') || []).forEach(function (rule, index) {
      // get element that rule condition is based on
      var jqEl = self.$el.find('#Field' + rule.condition.FieldName + ',' + '#radioField' + rule.condition.FieldName);
      rule.fn = rules[rule.Type];
      if(jqEl.data("type") === 'radio') {
        var rEl = self.$el.find('#Field' + rule.condition.FieldName + '_' + index);
        rEl.wufoo_rules('exec', rule);
      } else {
        jqEl.wufoo_rules('exec', rule);
      }
    });

    return result;
  }

});
var FormView = BaseView.extend({
  "pageNum": 0,
  "pageCount": 0,
  "pageViews": [],
  "submission": null,
  "fieldValue": [],
  templates: {
    buttons: '<div id="buttons" class="fh_action_bar fh_appform_navigation"><button class="saveDraft hidden button button-main fh_appform_button_action">Save Draft</button><button class="previous hidden button fh_appform_button_navigation">Previous</button><button class="next hidden button">Next</button><button class="submit hidden button button-positive fh_appform_button_action">Submit</button></div>'
  },
  events: {
    "click button.next": "nextPage",
    "click button.previous": "prevPage",
    "click button.saveDraft": "saveToDraft",
    "click button.submit": "submit"
  },

  initialize: function() {
    _.bindAll(this, "checkRules", "onValidateError");
    this.el = this.options.parentEl;
    this.fieldModels = [];
    this.el.empty();
  },
  loadForm: function(params, cb) {
    var self = this;
    if (params.formId) {

      this.onLoad();
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
    for (var i = 0, fieldView; fieldView = this.fieldViews[i]; i++) {
      fieldView.$el.find("button,input,textarea,select").attr("disabled", "disabled");
    }
    this.el.find("button.saveDraft").hide();
    this.el.find(" button.submit").hide();
  },
  onValidateError: function(res) {
    var firstView=null;
    for (var fieldId in res) {
      if (res[fieldId]) {
        var fieldView = this.getFieldViewById(fieldId);
        if (firstView==null){
          firstView=fieldView;
        }
        var errorMsgs = res[fieldId].fieldErrorMessage;
        for (var i = 0; i < errorMsgs.length; i++) {
          if (errorMsgs[i]) {
            fieldView.setErrorText(i, errorMsgs[i]);
          }
        }
      }
    }
    
  },
  initWithForm: function(form, params) {
    var self = this;
    self.formId = form.getFormId();

    self.el.empty();
    self.model = form;

    if (!params.submission) {
      params.submission = self.model.newSubmission();
    }
    self.submission = params.submission;
    self.submission.on("validationerror", self.onValidateError);
    // Init Pages --------------
    var pageModelList = form.getPageModelList();
    var pageViews = [];
    for (var i = 0, pageModel; pageModel = pageModelList[i]; i++) {
      // get fieldModels
      var list = pageModel.getFieldModelList()
      self.fieldModels = self.fieldModels.concat(list);

      var pageView = new PageView({
        model: pageModel,
        parentEl: self.el,
        formView: self
      });
      pageViews.push(pageView);
    }
    var fieldViews = [];
    for (var i = 0, pageView; pageView = pageViews[i]; i++) {
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

    self.onLoadEnd();
  },
  checkRules: function() {
    var self = this;
    this.populateFieldViewsToSubmission(false, function() {
      var submission = self.submission;
      submission.checkRules(function(err, res) {
        if (err) {
          console.error(err);
        } else {
          var actions = res.actions;
          var pages = actions.pages;
          var fields = actions.fields;
          for (var targetId in pages) {
            self.performRuleAction("page", targetId, pages[targetId]["action"]);
          }
          for (var targetId in fields) {
            self.performRuleAction("field", targetId, fields[targetId]["action"]);
          }
        }
      });
    });
  },
  performRuleAction: function(type, targetId, action) {
    var target = null;
    if (type == "page") {
      target = this.getPageViewById(targetId);
    } else if (type == "field") {
      target = this.getFieldViewById(targetId);
    }
    if (target == null) {
      console.error("cannot find target with id:" + targetId);
      return;
    }
    switch (action) {
      case "show":
        target.show();
        break;
      case "hide":
        target.hide();
        break;
      default:
        console.error("action not defined:" + action);
    }
  },
  rebindButtons: function() {
    var self = this;
    this.el.find("button.next").unbind().bind("click", function() {
      self.nextPage();
    });

    this.el.find("button.previous").unbind().bind("click", function() {
      self.prevPage();
    });

    this.el.find("button.saveDraft").unbind().bind("click", function() {
      self.saveToDraft();
    });
    this.el.find("button.submit").unbind().bind("click", function() {
      self.submit();
    });
  },
  setSubmission: function(sub) {
    this.submission = sub;
  },
  getSubmission: function() {
    return this.submission;
  },
  getPageViewById: function(pageId) {
    for (var i = 0, pageView; pageView = this.pageViews[i]; i++) {
      var pId = pageView.model.getPageId();
      if (pId == pageId) {
        return pageView;
      }
    }
    return null;
  },
  getFieldViewById: function(fieldId) {
    for (var i = 0, fieldView; fieldView = this.fieldViews[i]; i++) {
      var pId = fieldView.model.getFieldId();
      if (pId == fieldId) {
        return fieldView;
      }
    }
    return null;
  },
  checkPages: function() {
    if (this.pageNum === 0 && this.pageNum === this.pageCount - 1) {
      this.el.find(" button.previous").hide();
      this.el.find("button.next").hide();
      this.el.find("button.saveDraft").show();
      this.el.find(" button.submit").show();
      this.el.find("button").addClass('two_button');
    } else if (this.pageNum === 0) {
      this.el.find(" button.previous").hide();
      this.el.find("button.next").show();
      this.el.find("button.saveDraft").show();
      this.el.find(" button.submit").hide();
      this.el.find("button").addClass('two_button');
    } else if (this.pageNum === this.pageCount - 1) {
      this.el.find(" button.previous").show();
      this.el.find(" button.next").hide();
      this.el.find(" button.saveDraft").show();
      this.el.find(" button.submit").show();
      this.el.find("button").addClass('three_button');
    } else {
      this.el.find(" button.previous").show();
      this.el.find(" button.next").show();
      this.el.find(" button.saveDraft").show();
      this.el.find(" button.submit").hide();
      this.el.find("button").addClass('three_button');
    }
    if (this.readonly) {
      this.el.find("button.saveDraft").hide();
      this.el.find(" button.submit").hide();
    }

  },
  render: function() {

    // this.initWithForm(this.form, this.params);
    this.el.append(this.templates.buttons);
    this.rebindButtons();
    this.pageViews[0].show();
    this.checkPages();
    this.checkRules();
  },
  nextPage: function() {
    this.hideAllPages();
    this.pageViews[this.pageNum + 1].show();
    this.pageNum = this.pageNum + 1;
    this.checkPages();
  },
  prevPage: function() {
    this.hideAllPages();
    this.pageViews[this.pageNum - 1].show();
    this.pageNum = this.pageNum - 1;
    this.checkPages();
  },
  hideAllPages: function() {
    this.pageViews.forEach(function(view) {
      view.hide();
    });
  },
  submit: function() {
    var self = this;
    this.populateFieldViewsToSubmission(function() {
      self.submission.submit(function(err, res) {
        if (err) {
          console.error(err);
        } else {
          self.el.empty();
        }
      });
    });
  },
  saveToDraft: function() {
    var self = this;
    // if ($('.error').length > 0) {
    //   alert('Please resolve all field validation errors');
    //   return;
    // }
    this.populateFieldViewsToSubmission(function() {
      self.submission.saveDraft(function(err, res) {
        // console.log(err, res);
        self.el.empty();
      });
    });
  },
  populateFieldViewsToSubmission: function(isStore, cb) {
    if (typeof cb === "undefined"){
      cb=isStore;
      isStore=true;
    }
    var submission = this.submission;
    var fieldViews = this.fieldViews;
    var tmpObj = [];
    for (var i = 0, fieldView; fieldView = fieldViews[i]; i++) {
      var val = fieldView.value();
      var fieldId = fieldView.model.getFieldId();
      var fieldType = fieldView.model.getType();

      if(fieldType !== "sectionBreak"){
        for (var j = 0; j < val.length; j++) {
          var v = val[j];
          tmpObj.push({
            id: fieldId,
            value: v,
            index:j
          });
        }
      }
    }
    var count = tmpObj.length;
    submission.reset();
    for (var i = 0, item; item = tmpObj[i]; i++) {
      var fieldId = item.id;
      var value = item.value;
      var index=item.index;
      submission.addInputValue({
        fieldId: fieldId,
        value: value,
        index: index,
        isStore:isStore
      }, function(err, res) {
        if (err) {
          console.error(err);
        }
        count--;
        if (count == 0) {
          cb();
        }
      });
    }
  },

  setInputValue: function(fieldId, value) {
    var self = this;
    for (var i = 0, item; item = this.fieldValue[i]; i++) {
      if (item.id == fieldId) {
        this.fieldValue.splice(i, 1);
      }
    }
    for (var i = 0, v; v = value[i]; i++) {
      this.fieldValue.push({
        id: fieldId,
        value: v
      });
    }

    console.log('INPUT VALUE SET', fieldId, value);
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

  initialize: function() {
    _.bindAll(this, 'render');
  },

  show: function () {
    $(this.el).show();
  },

  hide: function () {
    $(this.el).hide();
  },

  render: function() {
    $(this.el).html(this.templates.body);
    this.show();
  },

  convert: function(){
    var json = $('#jsonBox').val();
    try {
      var jsonData = JSON.parse(json);
    } catch(e){
      console.log(e);
      throw ("Invalid JSON object");
    }
    var params = {
      formId : new Date().getTime(), // empty as we are passing in JSON form
      rawMode : true,
      rawData : jsonData
    }
    var formView=new FormView({parentEl:$("#backbone #resultArea")});
    formView.loadForm(params,function(err){
      formView.render();
    });
  }

});
;
if (typeof $fh == "undefined") {
    $fh = {};
}
if (!$fh.forms) {
    $fh.forms={};
}
$fh.forms.renderForm = function(params, cb) {
    var parentEl = params.container;
    var formId = params.formId;
    var fromRemote = params.fromRemote || false;
    var type = params.type || "backbone";
    var form = new FormView({
        parentEl: parentEl
    });
    form.loadForm(params, function() {
        if (type == "backbone") {
            cb(null, form);
        } else if (type == "html") {
            //TODO convert backbone view to html.
            cb(null, form);
        }

    });
}

$fh.forms.renderFormList = function(params, cb) {
    var fromRemote = params.fromRemote || false;
    var parentEl = params.parentEl;
    $fh.forms.getForms({
        fromRemote: fromRemote
    }, function(err, forms) {
        formListView = new FormListView({
            "model": forms,
            "parentEl": parentEl
        });
        formListView.render();
    });
};

$fh.forms.backbone={};
$fh.forms.backbone.FormView=FormView;
$fh.forms.backbone.FormListView=FormListView;

return $fh.forms;

});
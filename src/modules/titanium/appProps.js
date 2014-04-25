var consts = require("../constants");
var ajax = require("../ajax");
var logger = require("../logger");
var qs = require("../queryMap");


var app_props = null;

var load = function(cb) {
 /*
   We use eval here because Titanium also does require to include third party scripts.
   It bypasses browserify's require, but still triggers when in a Titanium app
   */
  app_props = eval("require(\"fhconfig\")");
  return cb(null, app_props);
};

var setAppProps = function(props) {
  app_props = props;
};

var getAppProps = function() {
  return app_props;
};

module.exports = {
  load: load,
  getAppProps: getAppProps,
  setAppProps: setAppProps
};

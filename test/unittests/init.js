/*
 ======== A Handy Little QUnit Reference ========
 http://docs.jquery.com/QUnit

 Test methods:
 expect(numAssertions)
 stop(increment)
 start(decrement)
 Test assertions:
 ok(value, [message])
 equal(actual, expected, [message])
 notEqual(actual, expected, [message])
 deepEqual(actual, expected, [message])
 notDeepEqual(actual, expected, [message])
 strictEqual(actual, expected, [message])
 notStrictEqual(actual, expected, [message])
 raises(block, [expected], [message])
 */

module("$fh.init");
var appid = "123456789012345678901234";
var appkey = "800183c81c341bacc48253ed69c5dc409b0b04e3";
var host = "http://localhost";
var domain = "testing";
var cloudType = "node";
var init = {
  trackId: "1234567890123"
};
var mode = "dev";
var timeout = 20;
var mockAjaxRes = null;

$fh.__ajax = function(p) {
  strictEqual(p.type, "POST", 'request type is POST');
  strictEqual(p.contentType, 'application/json', 'contentType is application/json');
  ok(null != p.success, 'success callback defined');
  ok(null != p.error, 'error callback defined');
  ok(null != p.data, 'request data defined');
  var fhparams = JSON.parse(p.data);
  strictEqual(fhparams.appid, appid);
  strictEqual(fhparams.appkey, appkey);
  ok(null != fhparams.cuid);
  strictEqual(p.timeout, timeout);
  p.success(mockAjaxRes);
};

test("legacy ok", function() {
  mockAjaxRes = {
    status: 'ok',
    domain: domain,
    firstTime: false,
    init: init,
    hosts: {
      debugCloudType: cloudType,
      debugCloudUrl: host,
      releaseCloudType: cloudType,
      releaseCloudUrl: host
    }
  };

  $fh.init({
    appid: appid,
    appkey: appkey,
    host: host,
    mode: mode,
    timeout: timeout
  }, function(res) {
    ok(null != $fh.cloud_props);
    strictEqual($fh.cloud_props.domain, "testing");
    strictEqual($fh.cloud_props.init, init);
    strictEqual($fh.cloud_props.hosts.debugCloudType, "node");
    strictEqual($fh.cloud_props.hosts.releaseCloudType, "node");
  }, function(err) {
    ok(false, err);
  });
});


// test("connection not found", function () {

// });

// test("connection status active", function () {

// });

// test("connection status inactive", function () {

// });

// test("connection status disabled", function () {

// });

// test("connection client app not found", function () {

// });

// test("connection cloud app not found", function () {

// });
test("destinations", function () {


  var appid = '123456789012345678901234';
  var init = {trackId: "1234567890123"};

  $fh.app_props = {mode: 'dev', appid: appid};
  $fh.cloud_props = {domain: 'testing', firstTime: false, hosts: {
    debugCloudType: 'fh',
    debugCloudUrl: 'http://localhost',
    releaseCloudType: 'node',
    releaseCloudUrl: 'http://localhost',
    init: init
  }};
  $fh.__ajax = function (p) {
    var reqdata = JSON.parse(p.data);
    ok(null != reqdata.__fh);
    ok(null != reqdata.__fh.destination);

    var destination = reqdata.__fh.destination;


    p.success({status: 'ok', "testDestination": destination});
  };

  //iPhone/ipad : https://developer.apple.com/library/safari/documentation/appleapplications/reference/safariwebcontent/OptimizingforSafarioniPhone/OptimizingforSafarioniPhone.html
  //blackberry: http://supportforums.blackberry.com/t5/Web-and-WebWorks-Development/How-to-detect-the-BlackBerry-Browser/ta-p/559862 //Blackberry is special. They have 2 formats for their user agents
  //Android: https://developers.google.com/chrome/mobile/docs/user-agent
  //Windows Mobile: https://blogs.windows.com/windows_phone/b/wpdev/archive/2011/08/29/introducing-the-ie9-on-windows-phone-mango-user-agent-string.aspx?Redirected=true, http://developer.nokia.com/community/wiki/User-Agent_headers_for_Nokia_devices
  var testUserAgents = [
    {
      "agentString": "Mozilla/5.0 (iPhone; U; CPU iOS 2_0 like Mac OS X; en-us) AppleWebKit/525.18.1 (KHTML, like Gecko) Version/3.1.1 Mobile/XXXXX Safari/525.20",
      "destination": "iphone"
    },{
      "agentString": "Mozilla/5.0 (iPad; U; CPU iOS 2_0 like Mac OS X; en-us) AppleWebKit/525.18.1 (KHTML, like Gecko) Version/3.1.1 Mobile/XXXXX Safari/525.20",
      "destination": "ipad"
    },{
      "agentString": "Mozilla/5.0 (Linux; Android 4.0.4; Galaxy Nexus Build/IMM76B) AppleWebKit/535.19 (KHTML, like Gecko) Chrome/18.0.1025.133 Mobile Safari/535.19",
      "destination": "android"
    },{
      "agentString": "Mozilla/5.0 (BB10; Touch) AppleWebKit/537.10+ (KHTML, like Gecko) Version/10.0.9.1675 Mobile Safari/537.10+",
      "destination": "blackberry"
    },{
      "agentString": "Mozilla/5.0 (PlayBook; U; RIM Tablet OS 2.0.0; en-US) AppleWebKit/535.8+ (KHTML, like Gecko) Version/7.2.0.0 Safari/535.8+",
      "destination": "blackberry"
    },{
      "agentString": "Mozilla/5.0 (BlackBerry; U; BlackBerry AAAA; en-US) AppleWebKit/534.11+ (KHTML, like Gecko) Version/X.X.X.X Mobile Safari/534.11+",
      "destination": "blackberry"
    },{
      "agentString": "Mozilla/4.0 (compatible; MSIE 7.0; Windows Phone OS 7.0; Trident/3.1; IEMobile/7.0; DeviceManufacturer;DeviceModel)",
      "destination": "windowsphone7"
    },{
      "agentString": "Mozilla/5.0 (compatible; MSIE 10.0; Windows Phone 8.0; Trident/6.0; IEMobile/10.0; ARM; Touch; NOKIA; Lumia 920)",
      "destination": "windowsphone"
    },{
      "agentString": "Mozilla/5.0 (SymbianOS/9.1; U; [en-us]) AppleWebKit/413 (KHTML, like Gecko) Safari/413",
      "destination": "web"
    },{
      "agentString": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_6_8) AppleWebKit/537.13+ (KHTML, like Gecko) Version/5.1.7 Safari/534.57.2",
      "destination": "web"
    },{
      "agentString": "Mozilla/5.0 (Windows; U; Windows NT 6.1; tr-TR) AppleWebKit/533.20.25 (KHTML, like Gecko) Version/5.0.4 Safari/533.20.27",
      "destination": "web"
    },{
      "agentString": "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:24.0) Gecko/20100101 Firefox/24.0",
      "destination": "web"
    }
  ];

  for(var i = 0; i < testUserAgents.length; i++){
    var userAgentTest = testUserAgents[i];

    navigator.__defineGetter__('userAgent', function(){
      return userAgentTest.agentString; // customized user agent
    });

    $fh.act({act:'testAct', req:{test:'test'}}, function(res){
      ok(res !== null);
      ok(res.testDestination !== null);
      //strictEqual(res.testDestination, userAgentTest.destination);
    }, function(err){
      strictEqual(true, false);
    });
  }
});
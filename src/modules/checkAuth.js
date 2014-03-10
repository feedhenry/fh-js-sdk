var console = require("console");
var queryMap = require("./queryMap");
var JSON = require("JSON");

var checkAuth = function(url) {
  if (/\_fhAuthCallback/.test(url)) {
    var qmap = queryMap(url);
    if (qmap) {
      var fhCallback = qmap["_fhAuthCallback"];
      if (fhCallback) {
        if (qmap['result'] && qmap['result'] === 'success') {
          var sucRes = {'sessionToken': qmap['fh_auth_session'], 'authResponse' : JSON.parse(decodeURIComponent(decodeURIComponent(qmap['authResponse'])))};
          window[fhCallback](null, sucRes);
        } else {
          window[fhCallback]({'message':qmap['message']});
        }
      }
    }
  }
};

var handleAuthResponse = function(endurl, res, success, fail){
  if(res.status && res.status === "ok"){
    //for OAuth, a url will be returned which means the user should be directed to that url to authenticate.
    //we try to use the ChildBrower plugin if it can be found. Otherwise send the url to the success function to allow developer to handle it.
    if(res.url){
      if(window.PhoneGap || window.cordova){
        if(window.plugins && window.plugins.childBrowser){
          //found childbrowser plugin,add the event listener and load it
          //we need to know when the OAuth process is finished by checking for the presence of endurl. If the endurl is found, it means the authentication finished and we should find if it's successful.
          if(typeof window.plugins.childBrowser.showWebPage === "function"){
            window.plugins.childBrowser.onLocationChange = function(new_url){
              if(new_url.indexOf(endurl) > -1){
                window.plugins.childBrowser.close();
                var qmap = _getQueryMap(new_url);
                if(qmap) {
                  if(qmap['result'] && qmap['result'] === 'success'){
                    var sucRes = {'sessionToken': qmap['fh_auth_session'], 'authResponse' : JSON.parse(decodeURIComponent(decodeURIComponent(qmap['authResponse'])))};
                    success(sucRes);
                  } else {
                    if(fail){
                      fail("auth_failed", {'message':qmap['message']});
                    }
                  }
                } else {
                  if(fail){
                      fail("auth_failed", {'message':qmap['message']});
                  }
                }
              }
            };
            window.plugins.childBrowser.showWebPage(res.url);
          }
        } else {
          console.log("ChildBrowser plugin is not intalled.");
          success(res);
        }
      } else {
       document.location.href = res.url;
      }
    } else {
      success(res);
    }
  } else {
    if(fail){
      fail("auth_failed", res);
    }
  }
};

//This is mainly for using $fh.auth inside browsers. If the authentication method is OAuth, at the end of the process, the user will be re-directed to
//a url that we specified for checking if the auth is successful. So we always check the url to see if we are on the re-directed page.
if (window.addEventListener) {
  window.addEventListener('load', function(){
    checkAuth(window.location.href);
  }, false); //W3C
} else {
  window.attachEvent('onload', function(){
    checkAuth(window.location.href);
  }); //IE
}

module.exports = {
  "handleAuthResponse": handleAuthResponse
};

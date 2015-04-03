var logger = require("./logger");
var queryMap = require("./queryMap");
var fhparams = require("./fhparams");
var data = require('./data');

var checkAuth = function(url) {
  if (/\_fhAuthCallback/.test(url)) {
    var qmap = queryMap(url);
    if (qmap) {
      var fhCallback = qmap["_fhAuthCallback"];
      if (fhCallback) {
        if (qmap['result'] && qmap['result'] === 'success') {
          var sucRes = {'sessionToken': qmap['fh_auth_session'], 'authResponse' : JSON.parse(decodeURIComponent(decodeURIComponent(qmap['authResponse'])))};
          fhparams.setAuthSessionToken(qmap['fh_auth_session']);
          data.sessionManager.save(qmap['fh_auth_session']);
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

    var onComplete = function(res){
      if(res.sessionToken){
        fhparams.setAuthSessionToken(res.sessionToken);
        data.sessionManager.save(res.sessionToken, function(){
          return success(res);
        });
      } else {
        return success(res);
      }
    };
    //for OAuth, a url will be returned which means the user should be directed to that url to authenticate.
    //we try to use the ChildBrower plugin if it can be found. Otherwise send the url to the success function to allow developer to handle it.
    if(res.url){
      var inappBrowserWindow = null;
      var locationChange = function(new_url){
        if(new_url.indexOf(endurl) > -1){
          if(inappBrowserWindow){
            inappBrowserWindow.close();
          }
          var qmap = queryMap(new_url);
          if(qmap) {
            if(qmap['result'] && qmap['result'] === 'success'){
              var sucRes = {'sessionToken': qmap['fh_auth_session'], 'authResponse' : JSON.parse(decodeURIComponent(decodeURIComponent(qmap['authResponse'])))};
              onComplete(sucRes);
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
      if(window.PhoneGap || window.cordova){
        if(window.plugins && window.plugins.childBrowser){
          //found childbrowser plugin,add the event listener and load it
          //we need to know when the OAuth process is finished by checking for the presence of endurl. If the endurl is found, it means the authentication finished and we should find if it's successful.
          if(typeof window.plugins.childBrowser.showWebPage === "function"){
            window.plugins.childBrowser.onLocationChange = locationChange;
            window.plugins.childBrowser.showWebPage(res.url);
            inappBrowserWindow = window.plugins.childBrowser;
          }
        } else {
          try {
            inappBrowserWindow = window.open(res.url, "_blank", 'location=yes');
            inappBrowserWindow.addEventListener("loadstart", function(ev){
              locationChange(ev.url);
            });
          } catch(e){
            logger.info("InAppBrowser plugin is not intalled.");
            onComplete(res);
          }
        }
      } else {
       document.location.href = res.url;
      }
    } else {
      onComplete(res);
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
} else if (window.attachEvent) {
  window.attachEvent('onload', function(){
    checkAuth(window.location.href);
  }); //IE
}

module.exports = {
  "handleAuthResponse": handleAuthResponse
};

(function(root){
  var fhconfig = {
    "host": "http://localhost:8100",
    "appid" : "testappid",
    "appkey" : "testappkey",
    "projectid" : "testprojectid",
    "connectiontag" : "testconnectiontag"
  };
  if (typeof define === 'function' && define.amd) {
    define(fhconfig);
  } else if (typeof module !== 'undefined' && module.exports) {
    module.exports =fhconfig;
  } else {
    root.fhconfig = fhconfig;
  }
})(this);


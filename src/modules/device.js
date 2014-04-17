var cookies = require("./cookies");
var uuidModule = require("./uuid");
var logger = require("./logger");

module.exports = {
  //try to get the unique device identifier
  "getDeviceId": function(){
    //check for cordova/phonegap first
    if(typeof window.fhdevice !== "undefined" && typeof window.fhdevice.uuid !== "undefined"){
      return window.fhdevice.uuid;
    } else if(typeof window.device !== "undefined" && typeof window.device.uuid !== "undefined"){
      return window.device.uuid;
    }  else if(typeof navigator.device !== "undefined" && typeof navigator.device.uuid !== "undefined"){
      return navigator.device.uuid;
    } else {
      var _mock_uuid_cookie_name = "mock_uuid";
      var uuid = cookies.readCookieValue(_mock_uuid_cookie_name);
      if(null == uuid){
          uuid = uuidModule.createUUID();
          cookies.createCookie(_mock_uuid_cookie_name, uuid);
      }
      return uuid;
    }
  },

  //this is for fixing analytics issues when upgrading from io6 to ios7. Probably can be deprecated now
  "getCuidMap": function(){
    if(typeof window.fhdevice !== "undefined" && typeof window.fhdevice.cuidMap !== "undefined"){
      return window.fhdevice.cuidMap;
    } else if(typeof window.device !== "undefined" && typeof window.device.cuidMap !== "undefined"){
      return window.device.cuidMap;
    }  else if(typeof navigator.device !== "undefined" && typeof navigator.device.cuidMap !== "undefined"){
      return navigator.device.cuidMap;
    }

    return null;
  },

  "getDestination": function(){
    var destination = null;
    var platformsToTest = require("./platformsMap");


    var userAgent = navigator.userAgent;

    var dest_override = document.location.search.split("fh_destination_code=");
    if (dest_override.length > 1) {
     destination = dest_override[1];
    } else if (typeof window.fh_destination_code !== 'undefined') {
      destination = window.fh_destination_code;
    } else {
      platformsToTest.forEach(function(testDestination){
        testDestination.test.forEach(function(destinationTest){
          if(userAgent.indexOf(destinationTest) > -1){
            destination = testDestination.destination;
          }
        });
      });
    }

    if(destination == null){ //No user agents were found, set to default web
      destination = "web";
    }

    logger.debug("destination = " + destination);

    return destination;
  }
}

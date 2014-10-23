appForm.utils = function (module) {
  module.takePhoto = takePhoto;
  module.isPhoneGapCamAvailable = isPhoneGapAvailable;
  module.isHtml5CamAvailable = isHtml5CamAvailable;
  module.initHtml5Camera = initHtml5Camera;
  module.cancelHtml5Camera = cancelHtml5Camera;
  module.captureBarcode = captureBarcode;

  var isPhoneGap = false;
  var isHtml5 = false;
  var video = null;
  var canvas = null;
  var ctx = null;
  var localMediaStream = null;
  function isHtml5CamAvailable() {
    checkEnv();
    return isHtml5;
  }
  function isPhoneGapAvailable() {
    checkEnv();
    return isPhoneGap;
  }
  function initHtml5Camera(params, cb) {
    checkEnv();
    _html5Camera(params, cb);
  }
  function cancelHtml5Camera() {
    if (localMediaStream) {
      localMediaStream.stop();
      localMediaStream = null;
    }
  }
  function takePhoto(params, cb) {
    params = params || {};
    $fh.forms.log.d("Taking photo ", params, isPhoneGap);
    //use configuration
    var width =  params.targetWidth ? params.targetWidth : $fh.forms.config.get("targetWidth", 640);
    var height = params.targetHeight ? params.targetHeight : $fh.forms.config.get("targetHeight", 480);
    var quality= params.quality ? params.quality : $fh.forms.config.get("quality", 50);
    //For Safety, the default value of saving to photo album is true.
    var saveToPhotoAlbum = typeof(params.saveToPhotoAlbum) !== "undefined" ? params.saveToPhotoAlbum : $fh.forms.config.get("saveToPhotoAlbum");
    var encodingType = params.encodingType ? params.encodingType : $fh.forms.config.get("encodingType", 'jpeg');

    params.targetWidth = width;
    params.targetHeight = height;
    params.quality = quality;
    params.saveToPhotoAlbum = saveToPhotoAlbum;
    params.encodingType = encodingType;

    if ("undefined" === typeof(params.sourceType) && typeof(Camera) !== 'undefined') {
      params.sourceType = Camera.PictureSourceType.CAMERA;
    }

    if (isPhoneGap) {
      _phoneGapPhoto(params, cb);
    } else if (isHtml5) {
      snapshot(params, cb);
    } else {
      cb('Your device does not support camera.');
    }
  }
  function _phoneGapPhoto(params, cb){
    params.encodingType = params.encodingType === 'jpeg' ? Camera.EncodingType.JPEG : Camera.EncodingType.PNG;
    navigator.camera.getPicture(_phoneGapPhotoSuccess(cb), cb, {
      quality: params.quality,
      targetWidth: params.targetWidth,
      targetHeight: params.targetHeight,
      sourceType: params.sourceType,
      saveToPhotoAlbum: params.saveToPhotoAlbum,
      destinationType: Camera.DestinationType.FILE_URI,
      encodingType: params.encodingType
    });
  }
  function _phoneGapPhotoSuccess(cb) {
    return function (imageData) {
      var imageURI = imageData;
      cb(null, imageURI);
    };
  }
  function _html5Camera(params, cb) {
    $fh.forms.log.d("Taking photo _html5Camera", params, isPhoneGap);
    var width = params.targetWidth || $fh.forms.config.get("targetWidth");
    var height = params.targetHeight || $fh.forms.config.get("targetHeight");
    video.width = width;
    video.height = height;
    canvas.width = width;
    canvas.height = height;
    if (!localMediaStream) {
      navigator.getUserMedia({ video: true, audio:false }, function (stream) {
        video.src = window.URL.createObjectURL(stream);
        localMediaStream = stream;
        cb(null, video);
      }, cb);
    } else {
      $fh.forms.log.e('Media device was not released by browser.');
      cb('Media device occupied.');
    }
  }

  /**
   * Capturing a barcode using the PhoneGap barcode plugin
   */
  function _phoneGapBarcode(params, cb){
    if(cordova && cordova.plugins && cordova.plugins.barcodeScanner){
      cordova.plugins.barcodeScanner.scan(
        function (result) {
          $fh.forms.log.d("Barcode Found: " + JSON.stringify(result));
          return cb(null, result);
        },
        function (error) {
          $fh.forms.log.e("Scanning failed: " + error);
          cb("Scanning failed: " + error);
        }
      );
    } else {
      return cb("Barcode plugin not installed");
    }
  }

  /**
   * Capturing a barcode using a webcam and image processors.
   * @param params
   * @param cb
   * @private
   */
  function _webBarcode(params, cb){
    //Initialise the web cam

    //take a snapshot

    //Pass to testing functions

    return cb("Not done yet");
  }

  function captureBarcode(params, cb){
    if(isPhoneGapAvailable()){
      _phoneGapBarcode(params,cb);
    } else {
      _webBarcode(params, cb);
    }
  }
  function checkEnv() {
    $fh.forms.log.d("Checking env");
    if (navigator.camera && navigator.camera.getPicture) {
      // PhoneGap
      isPhoneGap = true;
    } else if (_browserWebSupport()) {
      isHtml5 = true;
      video = document.createElement('video');
      video.autoplay = 'autoplay';
      canvas = document.getElementById('qr-canvas');
      ctx = canvas.getContext('2d');
    } else {
      console.error('Cannot detect usable media API. Camera will not run properly on this device.');
    }
  }
  function _browserWebSupport() {
    if (navigator.getUserMedia) {
      return true;
    }
    if (navigator.webkitGetUserMedia) {
      navigator.getUserMedia = navigator.webkitGetUserMedia;
      return true;
    }
    if (navigator.mozGetUserMedia) {
      navigator.getUserMedia = navigator.mozGetUserMedia;
      return true;
    }
    if (navigator.msGetUserMedia) {
      navigator.getUserMedia = navigator.msGetUserMedia;
      return true;
    }
    return false;
  }

  function snapshot(params, cb) {
    $fh.forms.log.d("Snapshot ", params);
    if (localMediaStream) {
      ctx.drawImage(video, 0, 0, params.targetWidth, params.targetHeight);
      // "image/webp" works in Chrome.
      // Other browsers will fall back to image/png.
      var base64 = canvas.toDataURL('image/png');
      console.log("base64", base64);
      var imageData = ctx.getImageData(0, 0, params.targetWidth, params.targetHeight);

      if(params.cancelHtml5Camera){
        cancelHtml5Camera();
      }



      //Deciding whether to return raw image data or a base64 image.
      //rawData is mainly used for scanning for barcodes.
      if(params.rawData){
        return cb(null, {ctx: ctx, imageData: imageData, width: params.targetWidth, height: params.targetHeight, base64: base64});
      } else {
        return cb(null, base64);
      }
    } else {
      $fh.forms.log.e('Media resource is not available');
      cb('Resource not available');
    }
  }
  return module;
}(appForm.utils || {});

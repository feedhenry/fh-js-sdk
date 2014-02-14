appForm.utils = function (module) {
  module.takePhoto = takePhoto;
  module.isPhoneGapCamAvailable = isPhoneGapAvailable;
  module.isHtml5CamAvailable = isHtml5CamAvailable;
  module.initHtml5Camera = initHtml5Camera;
  module.cancelHtml5Camera = cancelHtml5Camera;
  var isPhoneGap = false;
  var isHtml5 = false;
  var video = null;
  var canvas = null;
  var ctx = null;
  var localMediaStream = null;
  function isHtml5CamAvailable() {
    return isHtml5;
  }
  function isPhoneGapAvailable() {
    return isPhoneGap;
  }
  function initHtml5Camera(params, cb) {
    _html5Camera(params, cb);
  }
  function cancelHtml5Camera() {
    if (localMediaStream) {
      localMediaStream.stop();
      localMediaStream = null;
    }
  }
  function takePhoto(params, cb) {
    //use configuration
    var width = params.width || $fh.forms.config.get("targetWidth");
    var height = params.height || $fh.forms.config.get("targetHeight");
    var quality=params.quality || $fh.forms.config.get("quality");
    if (isPhoneGap) {
      navigator.camera.getPicture(_phoneGapSuccess(cb), cb, {
        quality: quality,
        targetWidth: width,
        targetHeight: height,
        saveToPhotoAlbum: false,
        destinationType: Camera.DestinationType.DATA_URL,
        encodingType: Camera.EncodingType.PNG
      });
    } else if (isHtml5) {
      snapshot(params, cb);
    } else {
      cb('Your device does not support camera.');
    }
  }
  function _phoneGapSuccess(cb) {
    return function (imageData) {
      var base64Img = 'data:image/png;base64,' + imageData;
      cb(null, base64Img);
    };
  }
  function _html5Camera(params, cb) {
    var width = params.width || $fh.forms.config.get("targetWidth");
    var height = params.height || $fh.forms.config.get("targetHeight");
    video.width = 1024;
    //TODO configuration-webcam resolution
    video.height = 768;
    canvas.width = width;
    canvas.height = height;
    if (!localMediaStream) {
      navigator.getUserMedia({ video: true }, function (stream) {
        video.src = window.URL.createObjectURL(stream);
        localMediaStream = stream;
        cb(null, video);
      }, cb);
    } else {
      console.error('Media device was not released.');
      cb('Media device occupied.');
    }
  }
  function checkEnv() {
    if (navigator.camera && navigator.camera.getPicture) {
      // PhoneGap
      isPhoneGap = true;
    } else if (_browserWebSupport()) {
      isHtml5 = true;
      video = document.createElement('video');
      video.autoplay = 'autoplay';
      canvas = document.createElement('canvas');
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
  checkEnv();
  function snapshot(params, cb) {
    if (localMediaStream) {
      ctx.drawImage(video, 0, 0, params.width, params.height);
      // "image/webp" works in Chrome.
      // Other browsers will fall back to image/png.
      var base64 = canvas.toDataURL('image/png');
      cancelHtml5Camera();
      cb(null, base64);
    } else {
      console.error('Media resource is not available');
      cb('Resource not available');
    }
  }
  return module;
}(appForm.utils || {});
appForm.utils = (function(module) {
    module.takePhoto = takePhoto;
    module.isPhoneGapAvailable = isPhoneGapAvailable;
    module.initHtml5Camera = initHtml5Camera;
    var isPhoneGap = false;
    var isHtml5 = false;
    var video = null;
    var canvas = null;
    var ctx = null;
    var localMediaStream = null;

    function isPhoneGapAvailable() {
        return isPhoneGap;
    }

    function initHtml5Camera(params, cb) {
        _html5Camera(params, cb);
    }

    function takePhoto(params, cb) {
        var width = params.width;
        var height = params.height;
        if (isPhoneGap) {
            navigator.camera.getPicture(_phoneGapSuccess(cb), cb, {
                quality: 100,
                targetWidth: width,
                targetHeight: height,
                saveToPhotoAlbum: false,
                destinationType: Camera.DestinationType.DATA_URL,
                encodingType: Camera.EncodingType.PNG
            });
        } else if (isHtml5) {
            
        } else {
            cb("Your device does not support camera.");
        }
    }

    function _phoneGapSuccess(cb) {
        return function(imageData) {
            var base64Img = "data:image/png;base64," + imageData;
            cb(null, base64Img);
        }
    }

    function _html5Camera(params, cb) {
        var width = params.width;
        var height = params.height;
        video.width = width;
        video.height = height;
        canvas.width = width;
        canvas.height = height;
        if (!localMediaStream) {
            navigator.getUserMedia({
                video: true
            }, function(stream) {
                video.src = window.URL.createObjectURL(stream);
                localMediaStream = stream;
                cb(null);
            }, cb);
        }

    }


    function checkEnv() {
        if (navigator.camera && navigator.camera.getPicture) { // PhoneGap
            isPhoneGap = true;
        } else if (_browserWebSupport()) {
            isHtml5 = true;
            video = document.createElement("video");
            canvas = document.createElement('canvas');
            ctx = canvas.getContext('2d');
        }
    }


    function _browserWebSupport() {
        if (navigator.getUserMedia) {
            return true;
        }
        if (navigator.webkitGetUserMedia) {
            navigator.getUserMedia = navigator.webkitGetUserMedia;
            return true
        }
        if (navigator.mozGetUserMedia) {
            navigator.getUserMedia = navigator.mozGetUserMedia;
            return true
        }
        if (navigator.msGetUserMedia) {
            navigator.getUserMedia = navigator.msGetUserMedia;
            return true
        }
        return false;
    }
    //checkEnv();

    function snapshot() {
        if (localMediaStream) {
            ctx.drawImage(video, 0, 0, 800, 600);
            // "image/webp" works in Chrome.
            // Other browsers will fall back to image/png.
            img.src = canvas.toDataURL('image/webp');
        }
    }


    return module;
})(appForm.utils || {});
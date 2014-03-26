appForm.web = function (module) {

  module.uploadFile = function(url, fileProps, cb){
    $fh.forms.log.d("uploadFile ", url, fileProps);
    var filePath = fileProps.fullPath;

    var success = function (r) {
      $fh.forms.log.d("upload to url ", url, " sucessful");
      r.response = r.response || {};
      if(typeof r.response == "string"){
        r.response = JSON.parse(r.response);
      }
      cb(null, r.response);
    };

    var fail = function (error) {
      $fh.forms.log.e("An error uploading a file has occurred: Code = " + error.code);
      $fh.forms.log.d("upload error source " + error.source);
      $fh.forms.log.d("upload error target " + error.target);
      cb(error);
    };

    var options = new FileUploadOptions();
    options.fileName = fileProps.name;
    options.mimeType = fileProps.contentType ? fileProps.contentType : "application/octet-stream";
    options.httpMethod = "https";
    options.chunkedMode = true;
    options.fileKey = "file";

    //http://grandiz.com/phonegap-development/phonegap-file-transfer-error-code-3-solved/
    options.headers = {
      "Connection": "close"
    };

    $fh.forms.log.d("Beginning file upload ",url, options);
    var ft = new FileTransfer();
    ft.upload(filePath, encodeURI(url), success, fail, options);
  };

  return module;
}(appForm.web || {});
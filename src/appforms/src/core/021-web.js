appForm.web = function (module) {

  module.uploadFile = function(url, fileProps, cb){
    var filePath = fileProps.fullPath;

    var success = function (r) {
      console.log("upload to url ", url, " sucessfull");
      r.response = r.response || {};
      if(typeof r.response == "string"){
        r.response = JSON.parse(r.response);
      }
      cb(null, r.response);
    };

    var fail = function (error) {
      console.error("An error uploading a file has occurred: Code = " + error.code);
      console.log("upload error source " + error.source);
      console.log("upload error target " + error.target);
      cb(error);
    };

    var options = new FileUploadOptions();
    options.fileName = fileProps.fileName;
    options.mimeType = fileProps.contentType;

    var ft = new FileTransfer();
    ft.upload(filePath, encodeURI(url), success, fail, options);
  };

  return module;
}(appForm.web || {});
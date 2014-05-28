appForm.web = function (module) {

  module.uploadFile = function(url, fileProps, cb){
    $fh.forms.log.d("Phonegap uploadFile ", url, fileProps);
    var filePath = fileProps.fullPath;

    if(!$fh.forms.config.isOnline()){
      $fh.forms.log.e("Phonegap uploadFile. Not Online.", url, fileProps);
      return cb("No Internet Connection Available.");
    }

    var success = function (r) {
      $fh.forms.log.d("upload to url ", url, " sucessful");
      r.response = r.response || {};
      if(typeof r.response === "string"){
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
    //important - empty fileName will cause file upload fail on WP!!
    options.fileName = (null == fileProps.name || "" === fileProps.name) ? "image.png" : fileProps.name;
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

  module.downloadFile = function(url, fileMetaData, cb){
    $fh.forms.log.d("Phonegap downloadFile ", url, fileMetaData);
    var ft = new FileTransfer();

    if(!$fh.forms.config.isOnline()){
      $fh.forms.log.e("Phonegap downloadFile. Not Online.", url, fileMetaData);
      return cb("No Internet Connection Available.");
    }

    appforms.utils.fileSystem.getBasePath(function(err, basePath){
      if(err){
        $fh.forms.log.e("Error getting base path for file download: " + url);
        return cb(err);
      }

      function success(fileEntry){
        $fh.forms.log.d("File Download Completed Successfully. FilePath: " + fileEntry.fullPath);
        return cb(null, fileEntry.fullPath);
      }

      function fail(error){
        $fh.forms.log.e("Error downloading file " + fileMetaData.fileName + " code: " + error.code);
        return cb("Error downloading file " + fileMetaData.fileName + " code: " + error.code);
      }

      if(fileMetaData.fileName){
        $fh.forms.log.d("File name for file " + fileMetaData.fileName + " found. Starting download");
        var fullPath = basePath + fileMetaData.fileName;
        ft.download(encodeURI(url), fullPath, success, fail, {headers: {
          "Connection": "close"
        }});
      } else {
        $fh.forms.log.e("No file name associated with the file to download");
        return cb("No file name associated with the file to download");
      }
    });
  };

  return module;
}(appForm.web || {});
/**
 * extension of Field class to support file field
 */
appForm.models.Field = function (module) {
  function checkFileObj(obj) {
    return obj.fileName && obj.fileType && obj.hashName;
  }
  module.prototype.process_file = function (params, cb) {
    var inputValue = params.value;
    var isStore = params.isStore === undefined ? true : params.isStore;
    var lastModDate = new Date().getTime();
    var previousFile = params.previousFile || {};
    var hashName = null;
    if (typeof inputValue === 'undefined' || inputValue === null) {
      return cb("No input value to process_file", null);
    }

    function getFileType(fileType, fileNameString){
      fileType = fileType || "";
      fileNameString = fileNameString || "";

      //The type if file is already known. No need to parse it out.
      if(fileType.length > 0){
        return fileType;
      }

      //Camera does not sent file type. Have to parse it from the file name.
      if(fileNameString.indexOf(".png") > -1){
        return "image/png";
      } else if(fileNameString.indexOf(".jpg") > -1){
        return "image/jpeg";
      } else {
        return "application/octet-stream";
      }
    }

    function getFileName(fileNameString, filePathString){
      fileNameString = fileNameString || "";
      if(fileNameString.length > 0){
        return fileNameString;
      } else {
        //Need to extract the name from the file path
        var indexOfName = filePathString.lastIndexOf("/");
        if(indexOfName > -1){
          return filePathString.slice(indexOfName);
        } else {
          return null;
        }
      }
    }

    var file = inputValue;
    if (inputValue instanceof HTMLInputElement) {
      file = inputValue.files[0] || {};  // 1st file only, not support many files yet.
    }

    if(typeof(file.lastModifiedDate) === 'undefined'){
      lastModDate = appForm.utils.getTime().getTime();
    }

    if(file.lastModifiedDate instanceof Date){
      lastModDate = file.lastModifiedDate.getTime();
    }

    var fileName = getFileName(file.name || file.fileName, file.fullPath);

    var fileType = getFileType(file.type || file.fileType, fileName);

    //Placeholder files do not have a file type. It inherits from previous types
    if(fileName === null && !previousFile.fileName){
      return cb("Expected picture to be PNG or JPEG but was null");
    }

    if(previousFile.hashName){
      if(fileName === previousFile.hashName || file.hashName === previousFile.hashName){
        //Submitting an existing file already saved, no need to save.
        return cb(null, previousFile);
      }
      //If the value has no extension and there is a previous, then it is the same file -- just the hashed version.
      if(fileType === "application/octet-stream"){
        return cb(null, previousFile);
      }
    }

    //The file to be submitted is new
    previousFile =  {
      'fileName': fileName,
      'fileSize': file.size,
      'fileType': fileType,
      'fileUpdateTime': lastModDate,
      'hashName': '',
      'imgHeader': '',
      'contentType': 'binary'
    };

    var name = fileName + new Date().getTime() + Math.ceil(Math.random() * 100000);
    appForm.utils.md5(name, function (err, res) {
      hashName = res;
      if (err) {
        hashName = name;
      }

      hashName = 'filePlaceHolder' + hashName;

      if(fileName.length === 0){
        previousFile.fileName = hashName;
      }

      previousFile.hashName = hashName;
      if (isStore) {
        appForm.stores.localStorage.saveFile(hashName, file, function (err, res) {
          if (err) {
            $fh.forms.log.e(err);
            cb(err);
          } else {
            cb(null, previousFile);
          }
        });
      } else {
        cb(null, previousFile);
      }
    });
  };
  return module;
}(appForm.models.Field || {});
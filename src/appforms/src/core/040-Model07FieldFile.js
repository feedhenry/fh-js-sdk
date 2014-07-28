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
    if (typeof inputValue === 'undefined' || inputValue === null) {
      return cb("No input value to process_file", null);
    }

    //Can be either a html input element or a File object
    if(!(inputValue instanceof HTMLInputElement || inputValue instanceof File)){
      return cb('the input value for file field should be a html file input element or a File object');
    }

    var file = inputValue;
    if (inputValue instanceof HTMLInputElement) {
      file = inputValue.files[0];  // 1st file only, not support many files yet.
    }

    if(typeof(file.lastModifiedDate) === 'undefined'){
      lastModDate = appForm.utils.getTime().getTime();
    }

    if(file.lastModifiedDate instanceof Date){
      lastModDate = file.lastModifiedDate.getTime();  
    }
    var rtnJSON = {
        'fileName': file.name,
        'fileSize': file.size,
        'fileType': file.type,
        'fileUpdateTime': lastModDate,
        'hashName': '',
        'contentType': 'binary'
      };
    var name = file.name + new Date().getTime() + Math.ceil(Math.random() * 100000);
    appForm.utils.md5(name, function (err, res) {
      var hashName = res;
      if (err) {
        hashName = name;
      }
      hashName = 'filePlaceHolder' + hashName;
      rtnJSON.hashName = hashName;
      if (isStore) {
        appForm.utils.fileSystem.save(hashName, file, function (err, res) {
          if (err) {
            $fh.forms.log.e(err);
            cb(err);
          } else {
            cb(null, rtnJSON);
          }
        });
      } else {
        cb(null, rtnJSON);
      }
    });
  };
  return module;
}(appForm.models.Field || {});
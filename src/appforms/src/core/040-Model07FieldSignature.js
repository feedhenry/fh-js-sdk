/**
 * extension of Field class to support file field
 */
appForm.models.Field = function (module) {
  function checkFileObj(obj) {
    return obj.fileName && obj.fileType && obj.hashName;
  }

  function imageProcess(params, cb) {
    var self = this;
    var inputValue = params.value;
    var isStore = params.isStore === undefined ? true : params.isStore;
    var previousFile = params.previousFile || {};
    if (typeof(inputValue) !== "string") {
      return cb("Expected base64 string image or file URI but parameter was not a string", null);
    }

    //Input value can be either a base64 String or file uri, the behaviour of upload will change accordingly.

    if(inputValue.length < 1){
      return cb("Expected base64 string or file uri but got string of lenght 0:  " + inputValue, null);
    }

    if(inputValue.indexOf(";base64,") > -1){
      var imgName = '';
      var dataArr = inputValue.split(';base64,');
      var imgType = dataArr[0].split(':')[1];
      var extension = imgType.split('/')[1];
      var size = inputValue.length;
      genImageName(function (err, n) {
        imgName = previousFile.hashName ? previousFile.hashName : 'filePlaceHolder' + n;
        //TODO Abstract this out
        var meta = {
          'fileName': imgName + '.' + extension,
          'hashName': imgName,
          'contentType': 'base64',
          'fileSize': size,
          'fileType': imgType,
          'imgHeader': 'data:' + imgType + ';base64,',
          'fileUpdateTime': new Date().getTime()
        };
        if (isStore) {
          appForm.stores.localStorage.updateTextFile(imgName, dataArr[1], function (err, res) {
            if (err) {
              $fh.forms.log.e(err);
              cb(err);
            } else {
              cb(null, meta);
            }
          });
        } else {
          cb(null, meta);
        }
      });
    } else {
      //Image is a file uri, the file needs to be saved as a file.
      //Can use the process_file function to do this.
      //Need to read the file as a file first
      appForm.utils.fileSystem.readAsFile(inputValue, function(err, file){
        if(err){
          return cb(err);
        }

        params.value = file;
        self.process_file(params, cb);
      });
    }
  }
  function genImageName(cb) {
    var name = new Date().getTime() + '' + Math.ceil(Math.random() * 100000);
    appForm.utils.md5(name, cb);
  }
  function convertImage(value, cb) {
    if (value.length === 0) {
      cb(null, value);
    } else {
      var count = value.length;
      for (var i = 0; i < value.length; i++) {
        var meta = value[i];
        _loadImage(meta, function () {
          count--;
          if (count === 0) {
            cb(null, value);
          }
        });
      }
    }
  }

  //An image can be either a base64 image or a binary image.
  //If base64, need to load the data as text.
  //If binary, just need to load the file uri.
  function _loadImage(meta, cb) {
    if (meta) {

      var name = meta.hashName;
      if(meta.contentType === "base64"){
        appForm.stores.localStorage.readFileText(name, function (err, text) {
          if (err) {
            $fh.forms.log.e(err);
          }
          meta.data = text;
          cb(err, meta);
        });
      } else if(meta.contentType === "binary"){
        appForm.stores.localStorage.readFile(name, function(err, file){
          if(err){
            $fh.forms.log.e("Error reading file " + name, err);
          }

          if(file && file.fullPath){
            meta.data = file.fullPath;
          } else {
            meta.data = "file-not-found";
          }

          cb(err, meta);
        });
      } else {
        $fh.forms.log.e("Error load image with invalid meta" + meta.contentType);
      }
    } else {
      cb(null, meta);
    }
  }
  module.prototype.process_signature = imageProcess;
  module.prototype.convert_signature = convertImage;
  module.prototype.process_photo = imageProcess;
  module.prototype.convert_photo = convertImage;
  return module;
}(appForm.models.Field || {});
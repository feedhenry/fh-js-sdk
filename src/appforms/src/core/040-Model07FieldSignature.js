/**
 * extension of Field class to support file field
 */

appForm.models.Field = (function(module) {
    function checkFileObj(obj) {
        return obj.fileName && obj.fileType && obj.hashName;
    }

    function imageProcess(params, cb) {
        var inputValue = params.value;
        var isStore = params.isStore === undefined ? true : params.isStore;
        if (inputValue == "") {
            return cb(null, null);
        }
        var imgName = "";
        var dataArr = inputValue.split(";base64,");
        var imgType = dataArr[0].split(":")[1];
        var extension=imgType.split("/")[1];
        var size = inputValue.length;
        genImageName(function(err, n) {
            imgName = "filePlaceHolder" + n; //TODO Abstract this out
            var meta = {
                "fileName":imgName+"."+extension,
                "hashName": imgName,
                "contentType":"base64",
                "fileSize": size,
                "fileType": imgType,
                "imgHeader": "data:" + imgType + ";base64,",
                "fileUpdateTime" : new Date().getTime()
            }
            if (isStore) {
                appForm.utils.fileSystem.save(imgName, dataArr[1], function(err, res) {
                    if (err) {
                        console.error(err);
                        cb(err);
                    } else {
                        cb(null, meta);
                    }
                });
            }else{
                cb(null,meta);
            }

        });

    }

    function genImageName(cb) {
        var name = new Date().getTime() + "" + Math.ceil(Math.random() * 100000);
        appForm.utils.md5(name, cb);
    }

    function covertImage(value, cb) {

        if (value.length == 0) {
            cb(null, value);
        } else {
            var count = value.length;
            for (var i = 0; i < value.length; i++) {
                var meta = value[i];
                _loadImage(meta, function() {
                    count--;
                    if (count == 0) {
                        cb(null, value);
                    }
                });
            }
        }

    }

    function _loadImage(meta, cb) {
        if (meta) {
            var name = meta.hashName;
            appForm.utils.fileSystem.readAsText(name, function(err, text) {
                if (err) {
                    console.error(err);
                }
                meta.data = text;
                cb(err, meta);
            });
        } else {
            cb(null, meta);
        }

    }
    module.prototype.process_signature = imageProcess;
    module.prototype.convert_signature = covertImage;
    module.prototype.process_photo = imageProcess;
    module.prototype.convert_photo = covertImage;
    return module;
})(appForm.models.Field || {});
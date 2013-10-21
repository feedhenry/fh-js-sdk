var _cmsFileSystem;
var cmsRootFolder = "FHCMSData";

// init func
//  s called on success
//  f called on error
var initialiseCMSFileSystem = function(s, f){
  // request the persistent file system
  window.requestFileSystem(
    LocalFileSystem.PERSISTENT, 0, 
    function(fileSystem){
      console.log("initialiseFileSystem - fileSystem.name: " + fileSystem.name);
      console.log("initialiseFileSystem - fileSystem.root.name: " + fileSystem.root.name);
      _cmsFileSystem = fileSystem;
      return s();
    }, function(failEvent){
      console.log('initialiseFileSystem - requestFileSystem failure callback called');
      return f("Failed to initialise file system" + failEvent.target.error.code);
    }
  );
  console.log('initialiseFileSystem call returning');
};

// testFileExists
//   fileName - name of file to check
//   s called if file exists
//   f called if file does not exist or if error
var fileExists = function (fileName, s, f) {
  console.log('fileExists() called');
  _cmsFileSystem.root.getDirectory(
    cmsRootFolder, {"create": true},
    function(parent){
      console.log('fileExists() got root');
      parent.getFile(fileName, {"create" : false}, s, f);
    },
    function(error) {
      console.log("in failure handler of getDirectory() - code: " + error.code);
      f(error);
    });
};

// readFile
//   fileName file to load
//   s(fileContents) called when file read - passing file contents
//   f called on error
var readFile = function (fileName, s, f) {
  console.log('readFile() called to read fileName: ' + fileName);
  fileExists(
    fileName,
    function (fileEntry) {
      console.log('readFile() - got fileEntry - fullPath: ' + fileEntry.fullPath);
      console.log('readFile() -     fileEntry - isFile: ' + fileEntry.isFile);
      console.log('readFile() -     fileEntry - toURL: ' + fileEntry.toURL());
      fileEntry.file(
        function(fileObj) {
          console.log('readFile() - got file - fullPath: ' + fileObj.fullPath + ", size: " + fileObj.size);
          var reader = new FileReader();
          reader.onloadend = function (evt) {
            console.log('readFile() - onloadend() - evt.target.result: ' + evt.target.result);
            return s(evt.target.result);
          };
          console.log('readFile() - about to start read');
          reader.readAsText(fileObj);
        }, function(error) {
          console.log('readFile() - error getting file - code: ' + error.code);
          f(error);
        });
    }, function(error){
      console.log('readFile() - error callback from fileExists - code: ' + error.code);
      f(error);
    });
  console.log('readFile() - returning');
};

// writeFile
//   fileName to write
//   fileContents to write into file
//   s called on successful writing
//   f called on failure
var writeFile = function (fileName, fileContents, s, f) {
  console.log('writeFile() called to write to fileName: ' + fileName);
  _cmsFileSystem.root.getDirectory(
    cmsRootFolder, {"create": true},
    function(parent){
      console.log('writeFile() - got dir ' + parent.fullPath);
      parent.getFile(fileName, {"create": true, exclusive: false},
        function (fileEntry) {
          console.log('writeFile() - got File ' + fileEntry.fullPath);
          fileEntry.createWriter(function (writer) {
            console.log('writeFile() in createWriter success callback');
            writer.onwriteend = function(evt) {
              console.log('writeFile() - in onwriteend');
              s();
            };
            writer.write(fileContents);          
          }, function(error) {
            console.log('writeFile() - in createWriter failure callback');
            f(error);
          });
        }, function(error) {
         console.log('writeFile() - in getFile failure callback');
         f(error);
        }
      );
    },
    function(error){
      console.log('writeFile() - in getDirectory failure callback');
      f(error);
    });
};

// deleteFile
//   fileName to write
//   fileContents to write into file
//   s called on successful writing
//   f called on failure
var deleteFile = function (fileName, s, f) {
  console.log('deleteFile() called to write to fileName: ' + fileName);
  _cmsFileSystem.root.getDirectory(
    cmsRootFolder, {"create": true},
    function(parent){
      console.log('deleteFile() - got dir ' + parent.fullPath);
      parent.getFile(fileName, {"create": true, exclusive: false},
        function (fileEntry) {
          console.log('deleteFile() - got File ' + fileEntry.fullPath);
          fileEntry.remove(function () {
            console.log('deleteFile() in remove success callback');
            return s();
          }, function(error) {
            console.log('deleteFile() - in remove failure callback - code: ' + error.code);
            f(error);
          });
        },
        function(error){
          console.log('deleteFile() - in getDirectory failure callback - code: ' + error.code);
          f(error);
        }
      );
    },
    function(error){
      console.log('deleteFile() - in getDirectory failure callback');
      f(error);
    }
  );
};

// downloadFile
//   fileName to write
//   fileURL to download
//   s called on successful writing
//   f called on failure
var downloadFile = function (fileName, fileURL, s, f) {
  console.log('downloadFile() called to download fileName: ' + fileName + 'from: ' + fileURL);
  _cmsFileSystem.root.getDirectory(
    cmsRootFolder, {"create": true},
    function(parent){
      console.log('downloadFile() - got dir ' + parent.fullPath);
      parent.getFile(fileName, {"create": true, exclusive: false},
        function (fileEntry) {
          console.log('downloadFile() - got File ' + fileEntry.fullPath);

          var fileTransfer = new FileTransfer();
          var uri = encodeURI(fileURL);

          fileTransfer.download(
            uri,
            fileEntry.fullPath,
            function(entry) {
              console.log("downloadFile() - download complete: " + entry.fullPath);
              return s();
            },
            function(error) {
              console.log("downloadFile() - download error source " + error.source);
              console.log("downloadFile() - download error target " + error.target);
              console.log("downloadFile() - upload error code" + error.code);
              return f(error);
            }
          );
        },
        function(error){
          console.log('downloadFile() - in getDirectory failure callback - code: ' + error.code);
          f(error);
        }
      );
    },
    function(error){
      console.log('downloadFile() - in getDirectory failure callback');
      f(error);
    }
  );
};

  /*
   * __cmsFileManager (params, cb)
   * 
   *  params:
   *      {
   *         act: actionName (delete|download|fileExists|cmsZipExists|unzipCMS|writeFile|readFile)
   *         params:
   *             action specific params
   *             delete: {"fileHash": fileHash}
   *             download: {"hash" : missingFileHash}}
   *             fileExists: {"fileName": "fh-cms.js"}
   *             cmsZipExists: none
   *             unzipCMS: none
   *             writeFile: {"fileName": "fh-cms.js"}
   *             readFile: {"fileName": "fh-cms.js"}
   *      }
   *
   */
  var __cmsFileManager = function(p, s, f){

    var cmsRootFolder = "FHCMSData"; //Setting the folder for the cms files on device.

    if(!_cmsAvailable){
      return handleError("CMS Not Available", f);
    }

    var acts = {
      "download": function(){

      },
      "delete": function(){

      },
      "clean": function(){

      },
      "fileExists": function(){
        _cmsFileSystem.root.getDirectory(cmsRootFolder, {"create": true}, function(parent){
          parent.getFile(p.fileName, {"create" : false}, function(fileFound){
            s();
          }, function(err){
            //File Not Found
            f();
          });
        }, function(err){
          return handleError(err, f);
        });
      },
      "cmsZipExists": function(){
        //TODO WHERE WILL THE ZIP RESIDE IN THE BINARY?
      },
      "unzipCMS": function(){

      },
      "readFile": function(){

      }
    };

    if(acts[p.act]){
      return acts[p.act]();
    } else {
      return handleError("Invalid CMS File Manager Action Call", f);
    }

  };
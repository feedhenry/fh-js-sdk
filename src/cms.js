(function(root){
  root.$fh = root.$fh || {};
  var $fh = root.$fh;

  var _cmsAvailable = false;
  var _cmsInitialising = false;
  var _cmsData = undefined;
  var _cmsReadyListeners = [];
  var _cmsUpdateInProgress = false;
  var _cmsFileSystem = undefined;
  //Object initialised, need to initialise the cms

  var handleError = function(err, failCallback){
    if(!(failCallback && typeof(failCallback) === "function")){
      failCallback = defaultFail;
    }

    return failCallback(err);
  }

  //When the CMS is ready, process the action queue.
  var _cmsReady = function(success){

    while(_cmsReadyListeners[0]){
      var cms_fun = _cmsReadyListeners.shift();

      if(success){
        $fh.cms(cms_fun.callParameters, cms_fun.success, cms_fun.fail);
      } else {
        handleError("CMS Resume Failed.", cms_fun.fail);
      }
    }
  };

  var cmsInitSuccess = function(cmsData, success){
    _cmsData = cmsData;
    _cmsInitialising = false;
    _cmsReady(true);
    success();
  }

  var cmsInitFailure = function(err, failureCallback){
    _cmsInitialising = false;
    _cmsReady(false); //CMS was not able to initialise so no calls to CMS should execute. Fail all calls.
    return handleError(err, failureCallback);
  }

  var initialiseCMSFileSystem = function(cb){
    // request the persistent file system
    window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fileSystem){
      _cmsFileSystem = fileSystem;
      return cb();
    }, function(failEvent){
      return cb("Failed to initialise file system" + failEvent.target.error.code);
    });
  }

  var initialiseCMS = function(success, failure){
    _cmsInitialising = true;
    if(!isCordovaOrPhonegapWindow()){
      return cmsInitFailure("CMS Only Available for Hybrid Apps.", failure);
    }

    initialiseCMSFileSystem(function(err){
      if(err) return cmsInitFailure(err, failure);


      cmsJSONFileAvailable(function(err, exists){
        if(err){
          return cmsInitFailure(err, failure);
        }

        if(exists){
          readCMSJSON(function(err, cmsData){
            if(err){
              return cmsInitFailure(err, failure);
            }
            return cmsInitSuccess(cmsData, success);
          });
        } else {
          appCMSZipAvailable(function(err, exists){
            if(err){
              return cmsInitFailure(err, failure);
            }

            if(exists){
              unzipCMSData(function(err, cmsData){
                if(err){
                  return cmsInitFailure(err, failure);
                }
                return cmsInitSuccess(cmsData, success);
              });
            } else {
              return cmsInitFailure("No CMS Data Available.", failure); //TODO: This may need to be changed to send a query to the server for the initial cms data if it is not already packaged.....
            }
          });
        }
      });
    });
  }

  var isCordovaOrPhonegapWindow = function(){
    return (typeof window.Phonegap !== "undefined" || typeof window.cordova !== "undefined");
  }

  var cmsJSONFileAvailable = function(cb){
    $fh.__cmsFileManager({"act": "fileExists", "params": {"fileName": "fh-cms.js"}}, cb);//TODO fh-cms.js should be constant or config
  }

  var appCMSZipAvailable = function(cb){
    $fh.__cmsFileManager({"act": "cmsZipExists"}, cb);
  }

  var unzipCMSData = function(cb){
    $fh.__cmsFileManager({"act": "unzipCMS"}, cb);
  }

  var writeCMSDataToFile = function(cb){
    $fh.__cmsFileManager({"act": "writeFile", "params": {"fileName": "fh-cms.js"}}, cb);
  }

  //TODO FileData Should not all reside in RAM -- optimise
  var readCMSJSON = function(cb){
    $fh.__cmsFileManager({"act": "readFile", "params": {"fileName": "fh-cms.js"}}, function(err, cmsJSONString){
      if(err) return cb(err);
      if(!fileData) return cb("No Data Read");

      var cmsJSON = JSON.parse(cmsJSONString); //Parsing CMS Data.
      cb(undefined, cmsJSON);
    });//TODO fh-cms.js should be constant or config
  }

  //TODO move "." to config to allow for splitting using different character
  var splitPathString = function(pathString){
    return pathString.split(".");
  }

  //Parsing a section is always the second last element of the path array. section.section2.field
  var parseSection = function(sectionPathArray){
    return sectionPathArray[sectionPathArray.length - 2]; //indexing from 0 and second last.
  }

  var parseField = function(sectionPathArray){
    return sectionPathArray[sectionPathArray.length - 1]; //indexing from 0 and last.
  }

  var defaultFail = function(err){
    if(console){
      console.log(err);
    }
  };

  //TODO this will change with file handling
  var getFieldValue = function(field, fieldOptions, cb){
    cb(undefined, field.value);
  }

  //TODO Needs some optimisation to avoid constantly traversing the cms structure. SectionName possibly not unique so change to hash
  var findCMSSection = function(sectionName, options, cb){

    if(options.findAllSections){// Just want all of the sections
      return cb(undefined, _cmsData.cms.sections);
    }

    var foundSectionArray = _cmsData.cms.sections.filter(function(sectionEntry){
      return sectionEntry.name === sectionName;
    });

    if(foundSectionArray.length === 1){//TODO duplication here, abstract
      return cb(undefined, foundSectionArray[0]);
    } else if(foundSectionArray.length === 0){
      return cb("No section matching " + sectionName + " found.");
    } else {
      return cb("Unexpected number of sections matching " + sectionName + " found.");
    }
  }

  var findCMSField = function(section, fieldName, fieldOptions, cb){
    var foundFieldArray = section.fields.filter(function(fieldEntry){
      return fieldEntry.fieldName === fieldName;
    });

    if(foundFieldArray.length === 1){//TODO duplication here, abstract. Very heavily nested. Need to be neater

      if(fieldOptions.list){
        if(foundFieldArray[0].fieldType === "list"){
          if(fieldOptions.size){
            return cb(undefined, foundFieldArray[0].listData.length);
          } else {

            if(fieldOptions.index >= foundFieldArray[0].listData.length){
              return cb("Index " + fieldOptions.index + " out of bounds.");
            }
            //Have a list index and fieldName needed,
            //Get the listOptions --> Find the field in the fieldTypes
            var foundListFieldTypeArray = foundFieldArray[0].fieldTypes.filter(function(listFieldTypeEntry){
              return listFieldTypeEntry.name === fieldOptions.listFieldName;
            });

            if(foundListFieldTypeArray.length === 1){
              //Found the list
              var listFieldType = foundListFieldTypeArray[0].type;

              //Now want the actual list data
              //TODO Assuming list items are in order. This may not be true.
              var listFieldData = {};
              listFieldData.value = foundFieldArray[0].listData[fieldOptions.index][fieldOptions.listFieldName];
              listFieldData.fieldType = listFieldType;

              return cb(undefined, listFieldData);

            } else if(foundListFieldTypeArray.length === 0){
              return cb("No list field matches the name " + fieldOptions.listFieldName);
            } else if(foundListFieldTypeArray.length > 1) {
              return cb("More than one list field matches the name " + fieldOptions.listFieldName);
            }
          }
        } else {
          return cb("The field " + fieldName + " is not a list.");
        }
      } else {
        return cb(undefined, foundFieldArray[0]);
      }
    } else if(foundFieldArray.length === 0){
      return cb("No field matching " + fieldName + " found.");
    } else {
      return cb("Unexpected number of fields matching " + fieldName + " found. " + foundFieldArray.length);
    }
  }

  var searchForFieldValue = function(params, options, s, f){
    //Correct Params are there, split the path string
    var pathString = params.path;
    var pathArray = splitPathString(pathString); //Paths are . separated section names. TODO Move "." to config to allow for different separators

    var findCMSFieldOptions = {};

    if(options.list){
      findCMSFieldOptions.list = options.list;
    }

    if(options.size){
      findCMSFieldOptions.size = options.size;
    } else {
      findCMSFieldOptions.index = params.index;
      findCMSFieldOptions.listFieldName = params.listFieldName; // The field within a list entry that user is interested in.
    }
    //As sections are stored flat, only interested in the last entry of the array. section.section2.field
    var sectionOfInterestName = parseSection(pathArray);
    var fieldOfInterestName = parseField(pathArray);

    //Now have the section name and field name of interest, search the cms sections for requested fields
    findCMSSection(sectionOfInterestName, {}, function(err, foundSection){
      if(err) return handleError(err, f);

      //Have the section, now find the field in the section
      findCMSField(foundSection, fieldOfInterestName, findCMSFieldOptions, function(err, foundField){
        if(err) return handleError(err, f);

        //Have the field, now want the value of the field.
        getFieldValue(foundField, findCMSFieldOptions, function(err, fieldValue){
          if(err) return handleError(err, f);

          return returnCMSValue(fieldValue, s);
        });
      });
    });
  }


  //TODO This may change with file handling.
  var returnCMSValue = function(value, successCallback){
    if(successCallback && typeof(successCallback) === "function"){
      successCallback(value);
    } else {
      return value;
    }
  }

  var sanityCheckParams = function(params, options, cb){
    if(options.path){
      if(!params.path){
        return cb("No path specified");
      }
      if(!(String.isString(params.path) && params.path.length > 3 && params.path.indexOf(".") != -1)){//Must exist, be at least 3 characters long and contain at least a single . TODO: REPLACE ". with constant"
        return cb("Incorrect format for path");
      }
    }

    if(options.index){
      if(!params.index){
        return cb("No index specified.");
      }
      if(!(Number.isNumber(params.index))){
        return cb("Index must be a number.");
      }
    }

    if(options.fieldName){
      if(!params.fieldName){
        return cb("No list field name specified.");
      }
      if(!(String.isString(params.fieldName) && params.fieldName.length > 0)){
        return cb("List field name empty.");
      }
    }

    //If it reaches this point, all is good with the params
    cb();
  }



  var buildCMSHashList = function(options, cb){
    //Building a JSON object to send to /mbaas

    var cmsUpdateHashList = {};

    if(options.singleSection){
      findCMSSection(options.sectionName, {}, function(err, foundSection){
        if(err) return cb(err);
        cmsUpdateHashList[foundSection.name] = foundSection.hash;
      });
    } else if(options.allSections) {
      findCMSSection(undefined, {"findAllSections": true}, function(err, foundSections){
        for(var sectionEntry in foundSections){
          cmsUpdateHashList[sectionEntry.name] = sectionEntry.hash;
        }
      });
    } else {
      return cb("Invalid update option " + JSON.toString(options));
    }

    return cb(undefined, cmsUpdateHashList);
  }

  var sendUpdateRequest = function(options, cmsSectionHashes, cb){
    //Now, need to send the hashes to the /cms/mbaas to check for updates

    var payload = JSON.stringify(cmsSectionHashes);
    var url = undefined;

    ///BUILDING URL
    var cloud_host = $fh.cloud_props.hosts.releaseCloudUrl;
    var app_type = $fh.cloud_props.hosts.releaseCloudType;

    if($fh.app_props.mode && $fh.app_props.mode.indexOf("dev") > -1){
      cloud_host = $fh.cloud_props.hosts.debugCloudUrl;
    }
    var url = cloud_host;
    var path = url;

    //END BUILDING URL


    if(options.singleSection){
      path += "/mbaas/cms/section/get";
    } else if(options.allSections){
      path += "/mbaas/cms/getAll";
    } else {
      return cb("Should either be updating a single or all sections.");
    }

    $fh.__ajax({
      "url": path,
      "type": "POST",
      "contentType": "application/json",
      "data": JSON.stringify(payload),
      "timeout": $fh.app_props.timeout || $fh.fh_timeout,
      "success": function(data) {
        return cb(undefined, data);
      },
      "error": function(req, statusText, error) {
        return cb(error);
      }
    });
  }

  var sanityCheckUpdateResponse = function(jsonResponse, cb){

    var updatedSectionArray = jsonResponse.cms;
    var verifiedSections = {};

    if(!(updatedSectionArray && Array.isArray(updatedSectionArray))){
      return cb("Invalid update response. Aborting");
    }

    for(var updatedSectionEntry in updatedSectionArray){
      if(!(updatedSectionEntry.updateFlag && String.isString(updatedSectionEntry.updateFlag) && updatedSectionEntry.name && String.isString(updatedSectionEntry.name))){
        return cb("Invalid update response fields. Aboring.");
      }
    }

    for(var updatedSectionEntry in updatedSectionArray){
      //Check sections changed or deleted actually exist.
      if(updatedSectionEntry.updateFlag === "changed" || updatedSectionEntry.updateFlag === "deleted"){
        findCMSSection(updatedSectionEntry.name, {}, function(err, section){
          if(err) {
            verifiedSections[updatedSectionEntry.name] = err;
          } else {
            verifiedSections[updatedSectionEntry.name] = true;
          }
        });
      } else if(updatedSectionEntry.updateFlag === "added"){
        findCMSSection(updatedSectionEntry.name, {}, function(err, section){
          if(!err){
            verifiedSections[updatedSectionEntry.name] = "Section " + updatedSectionEntry.name + " expected to be added. Should not exist. But it does.";
          } else if(err.indexOf("No section matching" === -1)){
            verifiedSections[updatedSectionEntry.name] = err;
          } else {
            verifiedSections[updatedSectionEntry.name] = true;
          }
        });
      } else {
         verifiedSections[updatedSectionEntry.name] = "Invalid Update Flag For Section " + updatedSectionEntry.name;
      }
    }

    //Checking for any errors with the sections
    var sectionCheckInterval = setInterval(function(){
      if(verifiedSections.length == updatedSectionArray.length){
        //All checks finished, check for errors
        for(var key in verifiedSections){
          if(verifiedSections[key] != true){
            //Section update invalid
            clearInterval(sectionCheckInterval);
            return cb(verifiedSections[key]);
          }
        }

        //Reached this point, no errors.
        clearInterval(sectionCheckInterval);
        return cb();
      }
    }, 500);
  }

  var scanSectionForFiles = function(sectionToScan, cb){
    //Need to find any file references in the section fields.
    //for each field -- check type. If file or image then get fileHash

    var sectionFiles = {};
    sectionFiles[sectionToScan.hash] = [];
    for(var field in sectionToScan.fields){
      var fieldPath = sectionToScan.path + "." + field.name; //Field path === sectionPath.fieldName. (e.g. section1.section2.field1) TODO Abstract out.
      if(field.type === "file" || field.type === "image"){
        var fileEntry = {};
        fileEntry[field.value] = fieldPath; //fileHash : fieldPath.
        sectionFiles[sectionToScan.hash].push(fileEntry);
      } else if(field.type === "list"){

        //Go through each of the fields, check if any are files/images, then go through each of the entries and add to the list
        var listFileEntries = [];
        for(var listField in field.fields){
          if(listField.type === "file" || listField.type === "image"){
            listFileEntries.push(listField.name);
          }
        }

        if(listFileEntries > 0){
          for(var listFileEntry in listFileEntries){
            for(var i = 0; i < field.data.length ; i++){
              var listFieldPath = sectionToScan.path + "." + field.name + "." + String.toString(i) + "." + listFileEntry; //list entry paths are a combination of sectionPath.listName.index.fieldName. TODO Abstract
              var listFile = {};
              listFile[field.data[i][listFileEntry].value] = listFieldPath;
              sectionFiles[sectionToScan.hash].push(listFile);
            }
          }
        } else {
          // None of the list entries are files -- DO nothing
        }
      } else {
        //Not a file or image, do nothing
      }
    }

    //blocking for loop no callbacks-- can return at end
    cb(undefined, sectionFiles);
  }

  var processAddedSection = function(addedSection, cb){
    //A new section will contain the entire field list of the section
    //Insert new section
    //Scan section for files
    //Return file changes
    insertCMSSection(addedSection, function(err){
      if(err) return cb(err);

      scanSectionForFiles(addedSection, cb);
    });
  }

  var processDeletedSection = function(deletedSection, cb){
    //A deleted section must be scanned for files before it is to be deleted.
    //Return list of files to be deleted.

    findCMSSection(deletedSection.name, {}, function(err, foundSection){
      if(err) return cb(err);

      scanSectionForFiles(foundSection, function(err, fileChanges){
        if(err) return cb(err);

        deleteCMSSection(deletedSection, function(err){
          return cb(err, fileChanges);
        });
      });
    });
  }

  var insertCMSSection = function(sectionToInsert, cb){
    _cmsData.cms.sections.push(sectionToInsert);
    return cb();
  }

  //Handy search feature for section Array.
  Array.prototype.indexOfSection = function(sectionName){
    for(var i = 0; i < this.length; i++){
      if(this[i]["name"] === sectionName){
        return i;
      }
    }

    return -1;
  }

  var deleteCMSSection = function(sectionToDelete, cb){
    var indexOfSection = _cmsData.cms.sections.indexOfSection(sectionToDelete.name);

    if(indexOfSection > -1){
      //Found the index of the section
      _cmsData.cms.sections.splice(indexOfSection, 1); // Just want to delete one object
      return cb();
    } else {
      return cb("Section " + sectionToDelete.name + " does not exist");
    }
  }

  var processCMSUpdateResponse = function(response, cb){
    //Right, response object contains a array of sections response.cms.iterate ---
    var jsonResponse = JSON.parse(response);
    var updatedSectionArray = jsonResponse.cms;
    var sectionsUpdated = {};
    var fileChanges = {"added": [], "deleted": []};

    sanityCheckUpdateResponse(jsonResponse, function(err){
      if(err) return cb(err); //If not a sane response, aborting the update. CMS remains the same.

      for(var updatedSectionEntry in updatedSectionArray){

        if(updatedSectionEntry.updateFlag === "changed"){ //TODO extract flags to constants
          processDeletedSection(updatedSectionEntry, function(err, delFileChanges){
            if(err) return cb(err);

            processAddedSection(updatedSectionEntry, function(err, fileChanges){
              if(err){
                sectionsUpdated[updatedSectionEntry.name] = err; //flagged as error
              } else {
                sectionsUpdated[updatedSectionEntry.name] = true; //flags as no error
              }

              fileChanges["added"].push(fileChanges);
              fileChanges["deleted"].push(delFileChanges);
            });
          });
        } else if (updatedSectionEntry.updateFlag === "added"){
          processAddedSection(updatedSectionEntry, function(err, fileChanges){
            if(err){
              sectionsUpdated[updatedSectionEntry.name] = err; //flagged as error
            } else {
              sectionsUpdated[updatedSectionEntry.name] = true; //flags as no error
            }

            fileChanges["added"].push(fileChanges);

          });
        } else if (updatedSectionEntry.updateFlag === "deleted") {
          processDeletedSection(updatedSectionEntry, function(err, fileChanges){
            if(err){
              sectionsUpdated[updatedSectionEntry.name] = err; //flagged as error
            } else {
              sectionsUpdated[updatedSectionEntry.name] = true; //flags as no error
            }

            fileChanges["deleted"].push(fileChanges);

          });
        }
      }

      //Checking when updating is complete.
      var cmsUpdateCheckInterval = setInterval(function(){
        if(sectionsUpdated.length === updatedSectionArray.length){
          //Finished all updates -- check for failures
          for(var sectionKey in sectionsUpdated){
            if(sectionsUpdated[sectionKey] != true){
              clearInterval(cmsUpdateCheckInterval);
              return cb(sectionsUpdated[sectionKey]);
            }
          }

          //No errors, update worked
          clearInterval(cmsUpdateCheckInterval);
          return cmsFilesUpdate(fileChanges, cb);//Finished update for file structure, now need to update the file storage.
        }
      }, 500);
    });
  }

  var cmsFilesUpdate = function(fileChanges, cb){
    //Need to process any changes to files made by updating the cms.
    //Files are either added or deleted.
    var filesNotInFileSystem = []; //Array of file hashes not in storage

    var deletedFileChanges = fileChanges["deleted"];
    var addedFileChanges = fileChanges["added"];
    for(var sectionHash in addedFileChanges){
      var sectionChanges = addedFileChanges[sectionHash];
      for(var fileChange in sectionChanges){
        for(var fileHash in fileChange){ //fileChange[fileHash] is the path of the file.
          if(_cmsData.fileStorage[fileHash]){
            _cmsData.fileStorage[fileHash].push(fileChange[fileHash]);
          } else { //File does not exist in file system. Need to download it.
            _cmsData.fileStorage[fileHash] = [];
            _cmsData.fileStorage[fileHash].push(fileChange[fileHash]);
            filesNotInFileSystem.push(fileHash);
          }

        }
      }
    }

    for(var sectionHash in deletedFileChanges){ //TODO duplicated, can make a function out of this.
      var sectionChanges = deletedFileChanges[sectionHash];
      for(var fileChange in sectionChanges){
        for(var fileHash in fileChange){
          var fileEntryIndex = _cmsData.fileStorage[fileHash].indexOf(fileChange[fileHash]); // Just an array of string so I can compare.
          _cmsData.fileStorage[fileHash].splice(fileEntryIndex, 1);
        }
      }
    }

    //All changes to file storage complete. Need to check if any files have no more references.
    var fileHashes = _cmsData.fileStorage;
    var filesCheckedSuccess = {};
    for(var fileHash in fileHashes){
      if(fileHashes[fileHash].length === 0){
        $fh.__cmsFileManager({"act": "delete", "params": {"fileHash": fileHash}}, function(){
          filesCheckedSuccess = true;
        }, function(err){
          filesCheckedSuccess[fileHash] = err;
        });
      }
    }

    var filesCheckedInterval = setInterval(function(){
      if(filesCheckedSuccess.length === fileHashes.length){
        //Finished -- check for success
        for(var fileCheckHash in filesCheckedSuccess){
          if(!(filesCheckedSuccess[fileCheckHash] === true)){
            clearInterval(filesCheckedInterval);
            return cb(filesCheckedSuccess[fileCheckHash]);// Error, return the error
          }
        }

        //All good, now download any files needed
        clearInterval(filesCheckedInterval);
        downloadMissingFiles(filesNotInFileSystem, cb);
      }
    }, 500); //TODO Set interval as config option.
  }

  var downloadMissingFiles = function(missingFilesHashes, cb){
    var missingFilesCompleted = {};

    for(var missingFileHash in missingFilesHashes){
      $fh.__cmsFileManager({"act" : "download", "params": {"hash" : missingFileHash}}, function(){

        missingFilesCompleted[missingFileHash] = true;
      }, function(err){

        missingFilesCompleted[missingFileHash] = err;
      });
    }

    var downloadedFilesInterval = setInterval(function(){
      if(missingFilesCompleted.length === missingFilesHashes.length){
        for(var downloadResult in missingFilesCompleted){
          if(missingFilesCompleted[downloadResult] != true){
            clearInterval(downloadedFilesInterval);
            return cb(missingFilesCompleted[downloadResult]);
          }
        }

        //No errors,
        clearInterval(downloadedFilesInterval);
        return cb(undefined);
      }

    }, 500);

  }

  var cmsUpdateError = function(err, failCallback){ //TODO Similar to cmsInitFail, can integrate.
    _cmsUpdateInProgress = false;
    return handleError(err, failCallback);
  }

  var updateCMS = function(options, successCallback, failCallback){
    //To update the cms, build hash list needed -- single section or all
    //Make call to /mbaas/cms/getAll or /mbaas/cms/section/get depending on options
    //process cmsUpdateResponse

    _cmsUpdateInProgress = true; //queueing calls until data is updated.
    buildCMSHashList(options, function(err, cmsSectionHashes){
      if(err) return cmsUpdateError(err, failCallback);

      //No error, hash object created.
      sendUpdateRequest(options, cmsSectionHashes, function(err, responseData){
        if(err) return cmsUpdateError(err, failCallback);

        //No error, have the response object
        processCMSUpdateResponse(responseData, function(err){
          if(err) return cmsUpdateError(err, failCallback);

          //All CMS actions are now complete and new structure is saved, ready to continue processing.
          _cmsReady(true);
          _cmsUpdateInProgress = false;
          successCallback();
        });
      });
    });
  }

  $fh.__cmsFileManager = function(p, s, f){

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
          parent.getFile("fh-cms.js", {"create" : false}, function(fileFound){
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
    }

    if(acts[p.act]){
      return acts[p.act]();
    } else {
      return handleError("Invalid CMS File Manager Action Call", f);
    }

  }

  $fh.cms = function(p, s, f){//Parameters, success, failure


    //TODO This init logic should be its own function
    //TODO Success and fail for init should be their own functions.
    if(!_cmsAvailable && !_cmsInitialising){ //CMS Not Available and not initialising, try and init cms
      _cmsInitialising = true; //Immediately set the cms to initialising to block other calls
      initialiseCMS(function(s, f){
        return doCMSAct(p,s,f);
      }, function(err){
        return handleError(err);
      });
    } else if(!_cmsAvailable && _cmsInitialising){ //CMS Initialising -- Add the request to a queue
      return _cmsReadyListeners.push({"callParameters" : p, "success": s, "fail": f});
    } else if(_cmsAvailable && !_cmsInitialising){ //cms is available and not initialising, process request
      return doCMSAct(p,s,f);
    } else { //Any other state is illegal.
      return handleError("CMS Initialisation Illegal State", f);
    }

    if(_cmsUpdateInProgress){
      return _cmsReadyListeners.push({"callParameters" : p, "success": s, "fail": f});
    }

    var acts = {

      "getField": function(){
        //Check getFieldParams
        //getFieldValue
        //If Exists --> Return Value
        //If Not --> Failure
        var params = p.params;
        sanityCheckParams(params, {"path": true}, function(err){
          if(err){
            return handleError(err, f);
          }

          return searchForFieldValue(params, s, {}, f);
        });
      },
      "getListSize": function(){
        var params = p.params;
        sanityCheckParams(params, {"path": true}, function(err){
          if(err){
            return handleError(err, f);
          }

          return searchForFieldValue(params, {"list": true, "size": true}, s, f);
        });
      },
      "getListField": function(){
        var params = p.params;
        sanityCheckParams(params, {"path": true, "index": true, "fieldName": true}, function(err){
          if(err){
            return handleError(err, f);
          }

          return searchForFieldValue(params, {"list": true}, s, f);
        });
      },
      "updateSection": function(){
        var params = p.params;
        sanityCheckParams(params, {"path": true}, function(err){
          if(err){
            return handleError(err, f);
          }

          var sectionPathArray = splitPathString(params.path);
          var sectionName = parseSection(sectionPathArray);
          return updateCMS({"singleSection": true, "sectionName": sectionName}, s, f);
        });
      },
      "updateAll": function(){
        var params = p.params;
        sanityCheckParams(params, {}, function(err){
          if(err){
            return handleError(err, f);
          }

          return updateCMS({"allSections": true}, s, f);
        });
      }
    };

    //Function To do The actual processing --> Can assume the CMS is available at this point
    var doCMSAct = function(p, s, f){
      sanityCheckParams(p, s, f, function(err){
        if(err){
          return handleError(err, f);
        } else {

          if(acts[p.act]){
            return acts[p.act]();
          } else {
            return handleError("Invalid CMS Action Call", f);
          }
        }
      });
    }
  };
})(this);
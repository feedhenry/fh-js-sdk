(function(root){
  /*jshint curly: true, eqeqeq: true, eqnull: true, sub: true, loopfunc: true */
  /* globals { browser: true } */

  root.$fh = root.$fh || {};
  var $fh = root.$fh;

  var EMPTY_CMS = {
    cms: {
      sections: []
    }
  };

  var CMS_API_GETALL     = "/mbaas/cms/sections";  // "/mbaas/cms/getAll";
  var CMS_API_GETSECTION = "/cloud/getSection";  // "/mbaas/cms/section/get";
  var CMS_API_GETFIELD   = "/cloud/getField?fieldid=";   // "/mbaas/cms/field/";
  var CMS_JSON_FILE_NAME = "fh-cms.js";

  var CMS_FIELD_TYPES_TEXT = ['string', 'paragraph'];
  var CMS_FIELD_TYPES_FILE = ['image', 'file'];

  var FILE_ENTRIES = "fileEntry";
  var FILE_PATH = "filePath";
  var FILE_EXTENSION = "fileExtension";

  var _cmsAvailable = false;
  var _cmsInitialising = false;
  var _cmsData;  // _cmsData contains two entries "cms" for the cms structure and "fileStorage" for the files associated with the structure.
  //var testFileStorageStructure = {"fileHash" : {"fileExtension": ".ext", fileEntries: []}};
  var _cmsReadyListeners = [];
  var _cmsUpdateInProgress = false;
  var _cmsFileSystem;
  var _cmsFileSystemEnabled = false;

  //Object initialised, need to initialise the cms

  var handleError = function(err, failCallback){
    if(!(failCallback && typeof(failCallback) === "function")){
      failCallback = defaultFail;
    }

    return failCallback(err);
  };

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
  };

  var cmsInitFailure = function(err, failureCallback){
    _cmsInitialising = false;
    _cmsReady(false); //CMS was not able to initialise so no calls to CMS should execute. Fail all calls.
    return handleError(err, failureCallback);
  };

  var initialiseCMSFileSystem = function(cb){
    // request the persistent file system
    window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fileSystem){
      _cmsFileSystem = fileSystem;
      return cb();
    }, function(failEvent){
      return cb("Failed to initialise file system" + failEvent.target.error.code);
    });
  };

  var initialiseCMS = function (success, failure) {
    console.log("initialiseCMS() begin");
    _cmsInitialising = true;
    if(isCordovaOrPhonegapWindow()){
      _csmFileSystemEnabled = true;
    }

    console.log("initialiseCMS() _cmsFileSystemEnabled:", _cmsFileSystemEnabled);
    if (_cmsFileSystemEnabled) {
      async.waterfall([
        initialiseCMSFileSystem,
        cmsJSONFileAvailable,
        function(exists, cb) {
          if(exists){
            readCMSJSON(cb);
          } else {
            async.waterfall([
              appCMSZipAvailable,
              function (exists, cb) {
                if (exists) {
                  unzipCMSData(cb);
                } else {
                  return cb("No CMS Data Available.", failure);
                }
              }
            ], function (err, cmsData) {
              return cb(err, cmsData);
            });
          }
        }
      ], function (err, cmsData) {
        if(err) {
          return cmsInitFailure(err, failure);
        } else {
          return cmsInitSuccess(cmsData, success);
        }
      });  
    } else {  // no data persisted on filesystem, so will do full refresh
      console.log("initialiseCMS() about to call cmsInitSuccess()");
      return cmsInitSuccess(EMPTY_CMS, success);
    }
  };

  var isCordovaOrPhonegapWindow = function(){
    return (typeof window.Phonegap !== "undefined" || typeof window.cordova !== "undefined");
  };

  //TODO move "." to config to allow for splitting using different character
  var splitPathString = function(pathString){
    return pathString.split(".");
  };

  //Parsing a section is always the second last element of the path array. section.section2.field
  var parseSection = function(sectionPathArray){
    return sectionPathArray[sectionPathArray.length - 2]; //indexing from 0 and second last.
  };

  var parseField = function(sectionPathArray){
    return sectionPathArray[sectionPathArray.length - 1]; //indexing from 0 and last.
  };

  var defaultFail = function(err){
    if(console){
      console.log(err);
    }
  };

  var constructGetFieldURL = function (fieldid) {
    return getCloudUrlPrefix() + CMS_API_GETFIELD + fieldid;
  };

  //TODO this will change with file handling
  var getFieldValue = function(field, fieldOptions, cb){
    var retErr;
    var retVal;
    if (CMS_FIELD_TYPES_TEXT.indexOf(field.type) >=0 ) {
      retVal = field.value;
    } else if (CMS_FIELD_TYPES_FILE.indexOf(field.type) >= 0) {
      retVal = constructGetFieldURL(field.binaryURL);
    } else {
      retErr = "Invalid field type: " + field.type;
    }
    return cb(retErr, retVal);
  };

  //TODO Needs some optimisation to avoid constantly traversing the cms structure. SectionName possibly not unique so change to hash
  var findCMSSection = function(sectionName, options, cb){

    if(options.findAllSections){// Just want all of the sections
      return cb(undefined, _cmsData.cms.sections);
    }

    console.log('findCMSSection() - sections: ', _cmsData.cms.sections);
    var foundSectionArray = _cmsData.cms.sections.filter(function(sectionEntry){
      return sectionEntry.name === sectionName;
    });

    console.log('findCMSSection() - foundSectionArray: ', foundSectionArray);

    if(foundSectionArray.length === 1){//TODO duplication here, abstract
      return cb(undefined, foundSectionArray[0]);
    } else if(foundSectionArray.length === 0){
      return cb("No section matching " + sectionName + " found.");
    } else {
      return cb("Unexpected number of sections matching " + sectionName + " found.");
    }
  };

  var findCMSField = function(section, fieldName, fieldOptions, cb){
    console.log("findCMSField() - fields: ", section.fields);
    var foundFieldArray = section.fields.filter(function(fieldEntry){
      return fieldEntry.name === fieldName;
    });

    console.log("findCMSField() - foundFieldArray: ", foundFieldArray);

    if(foundFieldArray.length === 0) {
      return cb("No field matching " + fieldName + " found.");
    } else if (foundFieldArray.length > 1) {
      return cb("Unexpected number of fields matching " + fieldName + " found. " + foundFieldArray.length);
    }  else {  // (foundFieldArray.length === 1)
      if(fieldOptions.list){
        findCMSFieldList(foundFieldArray[0], fieldOptions, cb);
        return;
      } else {
        return cb(undefined, foundFieldArray[0]);
      }
    }
  };

  var findCMSFieldList = function (field, fieldOptions, cb) {
    if(field.type !== "list"){
      return cb("The field " + fieldName + " is not a list.");
    } else {
      // do list stuff
      if(fieldOptions.size){
        return cb(undefined, field.data.length);
      } else {
        if(fieldOptions.index >= field.data.length){
          return cb("Index " + fieldOptions.index + " out of bounds.");
        }
        //Have a list index and fieldName needed,
        //Get the listOptions --> Find the field in the fieldTypes
        var foundListFieldTypeArray = field.fields.filter(function(listFieldTypeEntry){
          return listFieldTypeEntry.name === fieldOptions.listFieldName;
        });

        if(foundListFieldTypeArray.length === 1){
          //Found the list
          var listFieldType = foundListFieldTypeArray[0].type;

          //Now want the actual list data
          //TODO Assuming list items are in order. This may not be true.
          var listFieldData = {};
          listFieldData.value = field.data[fieldOptions.index][fieldOptions.listFieldName];
          listFieldData.type = listFieldType;

          return cb(undefined, listFieldData);

        } else if(foundListFieldTypeArray.length === 0){
          return cb("No list field matches the name " + fieldOptions.listFieldName);
        } else if(foundListFieldTypeArray.length > 1) {
          return cb("More than one list field matches the name " + fieldOptions.listFieldName);
        }
      }         
    }
  };

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
      if(err) {
        return handleError(err, f);
      }

      console.log("searchForFieldValue() - found section: ", foundSection);

      //Have the section, now find the field in the section
      findCMSField(foundSection, fieldOfInterestName, findCMSFieldOptions, function(err, foundField){
        if (err) {
          return handleError(err, f);
        }

        //Have the field, now want the value of the field.
        getFieldValue(foundField, findCMSFieldOptions, function(err, fieldValue){
          if (err) {
            return handleError(err, f);
          }

          return returnCMSValue(fieldValue, s);
        });
      });
    });
  };

  //TODO This may change with file handling.
  var returnCMSValue = function(value, successCallback){
    if(successCallback && typeof(successCallback) === "function"){
      successCallback(value);
    } else {
      return value;
    }
  };

  function isString(str) {
    return "string" === typeof str;
  }

  var sanityCheckParams = function(params, options, cb){
    if(options.path){
      if(!params.path){
        return cb("No path specified");
      }
      if(!(isString(params.path) && params.path.length > 3 && params.path.indexOf(".") !== -1)){ //Must exist, be at least 3 characters long and contain at least a single . TODO: REPLACE ". with constant"
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
      if(!(isString(params.fieldName) && params.fieldName.length > 0)){
        return cb("List field name empty.");
      }
    }

    //If it reaches this point, all is good with the params
    cb();
  };

  var buildCMSHashList = function(options, cb){
    //Building a JSON object to send to /mbaas

    console.log('in buildCMSHashList: ');
    var cmsUpdateHashList = {};

    if(options.singleSection){
      findCMSSection(options.sectionName, {}, function(err, foundSection){
        if(err) {
          return cb(err);
        }
        cmsUpdateHashList[foundSection.name] = foundSection.hash;
        return cb(undefined, cmsUpdateHashList);
      });
    } else if(options.allSections) {
      findCMSSection(undefined, {"findAllSections": true}, function(err, foundSections){
        var i, l;
        var sectionEntry;

        for(i = 0, l = foundSections.length; i < l; i += 1){
          sectionEntry = foundSections[i]; 
          cmsUpdateHashList[sectionEntry.name] = sectionEntry.hash;
        }
        return cb(undefined, cmsUpdateHashList);
      });

    } else {
      return cb("Invalid update option " + JSON.toString(options));
    }
  };

  function getCloudUrlPrefix() {
    var cloud_host = $fh.cloud_props.hosts.releaseCloudUrl;

    if($fh.app_props.mode && $fh.app_props.mode.indexOf("dev") > -1){
      cloud_host = $fh.cloud_props.hosts.debugCloudUrl;
    }

    return cloud_host;
  }

  var sendUpdateRequest = function(options, cmsSectionHashes, cb){
    //Now, need to send the hashes to the /cms/mbaas to check for updates

    if ("function" === typeof cmsSectionHashes) {
      cb = cmsSectionHashes;
      cmsSectionHashes = {};
    }

    var payload = JSON.stringify(cmsSectionHashes);

    var path = getCloudUrlPrefix();

    if(options.singleSection){
      path += CMS_API_GETSECTION;
    } else if(options.allSections){
      path += CMS_API_GETALL;
    } else {
      return cb("Should either be updating a single or all sections.");
    }

    $fh.__ajax({
      "url": path,
      "type": "GET",
      "contentType": "application/json",
//TODO      "data": JSON.stringify(payload),
      "timeout": $fh.app_props.timeout || $fh.fh_timeout,
      "success": function(data) {
        console.log(typeof data);
        console.log(data);
        return cb(undefined, data);
      },
      "error": function(req, statusText, error) {
        return cb(error);
      }
    });
  };

  var sanityCheckUpdateResponse = function(jsonResponse, cb) {
    var updatedSectionArray = jsonResponse.cms;

    if(!(updatedSectionArray && Array.isArray(updatedSectionArray))){
      return cb("Invalid update response. Aborting");
    }

    async.each(updatedSectionArray, function (updatedSectionEntry, cb) {
      if(!(updatedSectionEntry.updateFlag && isString(updatedSectionEntry.updateFlag) && updatedSectionEntry.name && isString(updatedSectionEntry.name))) {
        console.log("updatedSectionEntry", updatedSectionEntry);
        return cb("Invalid update response fields. Aborting.");
      }

      //Check sections changed or deleted actually exist.
      if(updatedSectionEntry.updateFlag === "changed" || updatedSectionEntry.updateFlag === "deleted"){
        findCMSSection(updatedSectionEntry.name, {}, cb);
      } else if(updatedSectionEntry.updateFlag === "added"){
        findCMSSection(updatedSectionEntry.name, {}, function(err, section){
          console.log("after find - err: ", err);
          // should be a not found error from "find" so if no error, or if error not "no section found" then callback with error
          if(!err){
            return cb("Section " + updatedSectionEntry.name + " expected to be added. Should not exist. But it does.");
          } else if(err.indexOf("No section matching") === -1){
            return cb(err);
          }
          return cb();
        });
      } else {
        return cb("Invalid Update Flag For Section " + updatedSectionEntry.name);
      }
    }, function (err) {
      return cb(err);
    });
  };

  var getFileExtension = function(fileName){
    //Extract the file extension from the name
    var splitFileName = fileName.split(".");
    return splitFileName[1];//TODO, needs to be a bit more sophisticated.
  }

  var scanSectionForFiles = function(sectionToScan, cb){
    //Need to find any file references in the section fields.
    //for each field -- check type. If file or image then get fileHash

    //sectionFiles = {"sectionHash" : [{"fileHash" : {FILE_PATH : "path.to.file", FILE_EXTENSION: ".ext"}}]}
    var sectionFiles = {};
    sectionFiles[sectionToScan.hash] = [];
    for(var field in sectionToScan.fields){
      var fieldPath = sectionToScan.path + "." + field.name; //Field path === sectionPath.fieldName. (e.g. section1.section2.field1) TODO Abstract out.
      if(field.type === "file" || field.type === "image"){
        var fileEntry = {FILE_PATH: "", FILE_EXTENSION: ""};
        fileEntry[field.fileHash][FILE_PATH] = fieldPath;
        fileEntry[field.fileHash][FILE_EXTENSION] = getFileExtension(field.binaryFileName);
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
              var listFile = {FILE_PATH: "", FILE_EXTENSION: ""};
              listFile[field.data[i][listFileEntry].fileHash][FILE_PATH] = listFieldPath;
              listFile[field.data[i][listFileEntry].fileHash][FILE_EXTENSION] =  getFileExtension(field.data[i][listFileEntry].binaryFileName);
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
  };

  var processAddedSection = function(addedSection, cb){
    //A new section will contain the entire field list of the section
    //Insert new section
    //Scan section for files
    //Return file changes
    insertCMSSection(addedSection, function(err){
      if (err) {
        return cb(err);
      }

      scanSectionForFiles(addedSection, cb);
    });
  };

  var processDeletedSection = function(deletedSection, cb){
    //A deleted section must be scanned for files before it is to be deleted.
    //Return list of files to be deleted.

    findCMSSection(deletedSection.name, {}, function(err, foundSection){
      if (err) {
        return cb(err);
      }

      scanSectionForFiles(foundSection, function(err, fileChanges){
        if (err) {
          return cb(err);
        }

        deleteCMSSection(deletedSection, function(err){
          return cb(err, fileChanges);
        });
      });
    });
  };

  var insertCMSSection = function(sectionToInsert, cb){
    _cmsData.cms.sections.push(sectionToInsert);
    return cb();
  };

  //Handy search feature for section Array.
  Array.prototype.indexOfSection = function(sectionName){
    for(var i = 0; i < this.length; i++){
      if(this[i].name === sectionName){
        return i;
      }
    }
    return -1;
  };

  var deleteCMSSection = function(sectionToDelete, cb){
    var indexOfSection = _cmsData.cms.sections.indexOfSection(sectionToDelete.name);

    if(indexOfSection > -1){
      //Found the index of the section
      _cmsData.cms.sections.splice(indexOfSection, 1); // Just want to delete one object
      return cb();
    } else {
      return cb("Section " + sectionToDelete.name + " does not exist");
    }
  };

  var processCMSUpdateResponse = function(jsonResponse, cb){
    //Right, response object contains a array of sections response.cms.iterate ---
    var updatedSectionArray = jsonResponse.sections; // TODO  .cms;
    var fileChanges = {"added": [], "deleted": []};

    var processors = {
      "changed": function (entry, cb) {
        processDeletedSection(entry, function (err, delFileChanges) {
          if (err) {
            return cb(err);
          }
          processAddedSection(entry, function (err, addFileChanges) {
            if(err) {
              return cb(err);
            }
            fileChanges.added.push(addFileChanges);
            fileChanges.deleted.push(delFileChanges);
            return cb();
          });
        });
      },
      "added": function (entry, cb) {
        processAddedSection(entry, function (err, addFileChanges) {
          if (err) {
            return cb(err);
          }
          fileChanges.added.push(addFileChanges);
          return cb();
        });
      },
      "deleted": function (entry, cb) {
        processDeletedSection(entry, function (err, delFileChanges) {
          if (err) {
            return cb(err);
          }
          fileChanges.deleted.push(delFileChanges);
          return cb();
        });
      }
    };

    console.log("processCMSUpdateResponse() - processing response: ", updatedSectionArray);
    async.series([
      //TODO async.apply(sanityCheckUpdateResponse, jsonResponse),
      async.apply(async.eachSeries, updatedSectionArray,
        function(updatedSectionEntry, cb) {
          console.log("processCMSUpdateResponse() - processing: ", updatedSectionEntry);
          if (processors[updatedSectionEntry.updateFlag]) {
            processors[updatedSectionEntry.updateFlag](updatedSectionEntry, cb);
          } else {
            processors["added"](updatedSectionEntry, cb);   // TODO remove this when updateAll ith hashes implemented in server
            //TODO return cb(new Error("Invalid updateFlag"));
          }
        }
      )
    ], function (err) {
        //No errors, update worked
        console.log('avoid handling updated files, err: ', err);
        return cb(err);
        return cmsFilesUpdate(fileChanges, cb);//Finished update for file structure, now need to update the file storage.
    });
  };

  var cmsUpdateError = function(err, failCallback){ //TODO Similar to cmsInitFail, can integrate.
    _cmsUpdateInProgress = false;
    return handleError(err, failCallback);
  };

  var updateCMS = function(options, successCallback, failCallback){
    //To update the cms, build hash list needed -- single section or all
    //Make call to /mbaas/cms/getAll or /mbaas/cms/section/get depending on options
    //process cmsUpdateResponse

    _cmsUpdateInProgress = true; //queueing calls until data is updated.
    async.waterfall([
      function (cb) {  // TODO not currently sending the hash list for updates, initialising instead
        // TODO when server-side updated replace with:    async.apply(buildCMSHashList, options),
        initialiseCMS(function() {
          return cb(undefined, {});
        }, function () {
          return cb("failure initialising");
        });
      },
      async.apply(sendUpdateRequest, options),
      processCMSUpdateResponse
    ], function (err) {
      if (err) {
        return cmsUpdateError(err, failCallback);
      } else {
        _cmsReady(true);
        _cmsUpdateInProgress = false;
        successCallback();
      }
    });
  };

  function doNothing() {
    // this is the default callback function
  }

  $fh.cms = {
    /*
     * Initialise CMS
     *   s - success callback - funciton () {}
     *   f - failure callback - function (error) {}
     */
    init: function (s, f) {
      _cmsInitialising = true; //Immediately set the cms to initialising to block other calls
      if (!f) {
        f = doNothing;
      }
      if (!s) {
        s = doNothing;
      }
      return initialiseCMS(s, f);
    },

    /*
     * Update CMS from server
     *   s - success callback - funciton () {}
     *   f - failure callback - function (error) {}
     */    
    updateAll: function (s, f) {
      if (!f) {
        f = doNothing;
      }
      if (!s) {
        s = doNothing;
      }
      return updateCMS({"allSections": true}, s, f);
    },

    /*     
     * get CMS Field value
     *   p - params - {"path": dot.seperated.path.section.field.name}
     *   s - success callback - funciton (value) {}
     *   f - failure callback - function (error) {}
     *
     * Function: $fh.cms.getField(params)

     * Params:
     *   path - dot separated name of section & field to return
     * Response: 
     *   Non Blocking. Returns requested field from CMS content as response
     * Errors: 
     *   No CMS
     */           
    getField: function(params, s, f){
      if (!f) {
        f = doNothing;
      }
      if (!s) {
        s = doNothing;
      }
      alert('getField() called');
      console.log("getField() called with params: ", params);
      sanityCheckParams(params, {"path": true}, function(err){
        if(err){
          return handleError(err, f);
        }

        return searchForFieldValue(params, {}, s, f);
      });
    },

     "getListSize": function(params, s, f){
        sanityCheckParams(params, {"path": true}, function(err){
          if(err){
            return handleError(err, f);
          }

          return searchForFieldValue(params, {"list": true, "size": true}, s, f);
        });
      },
      "getListField": function(params, s, f){
        sanityCheckParams(params, {"path": true, "index": true, "fieldName": true}, function(err){
          if(err){
            return handleError(err, f);
          }

          return searchForFieldValue(params, {"list": true}, s, f);
        });
      }

  };

  $fh.cms2 = function(p, s, f){//Parameters, success, failure
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

          return searchForFieldValue(params, {}, s, f);
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
    };
  };
  ///////////////TODO SHOULD CMS FILE STORAGE HAVE SUCCESS AND FAIL CALLBACKS?
  var cmsJSONFileAvailable = function(cb){
    $fh.__cmsFileManager({"act": "fileExists", "params": {"fileName": CMS_JSON_FILE_NAME}}, function(){

      return cb(undefined, true);
    }, function(){
      //File does not exist
      return cb(undefined, false); //TODO This should also handle an error reading the file system...
    });
  };

  var appCMSZipAvailable = function(cb){
    $fh.__cmsFileManager({"act": "cmsZipExists"}, function(){return cb(undefined, true)}, function(){return cb(undefined, false)}); // TODO: This will change to checking for files in the binary
  };

  var unzipCMSData = function(cb){
    $fh.__cmsFileManager({"act": "unzipCMS"}, function(){}, function(){});   // TODO: This will change to copying files in the binary to local file system.
  };

  var writeCMSDataToFile = function(cb){
    $fh.__cmsFileManager({"act": "writeFile", "params": {"fileName": CMS_JSON_FILE_NAME}}, function(){}, function(){});
  };

  //TODO FileData Should not all reside in RAM -- optimise
  //TODO Miight read binary so might be an option in future. If media, probably not worth it. Use the media plugin instead
  var readCMSJSON = function(cb){
    $fh.__cmsFileManager({"act": "readFile", "params": {"fileName": CMS_JSON_FILE_NAME}}, function(cmsJSONString){

      var cmsJSON = JSON.parse(cmsJSONString); //Parsing CMS Data.
      return cb(undefined, cmsJSON);

    }, function(err){

      return cb(err);

    });
  };

  var cmsFilesUpdate = function(fileChanges, cb){
    //Need to process any changes to files made by updating the cms.
    //Files are either added or deleted.
    var filesNotInFileSystem = []; //Array of file hashes not in storage
    var addedSectionChanges, deletedSectionChanges;
    var deletedFileChanges = fileChanges.deleted;
    var addedFileChanges = fileChanges.added;
    var fileChange;
    var fileHash;
    var sectionHash;
    var fileEntryIndex;
    var fileHashes;
    var filesCheckedSuccess;

    for(sectionHash in addedFileChanges){
      addedSectionChanges = addedFileChanges[sectionHash];
      for(fileChange in addedSectionChanges){
        for(fileHash in fileChange){ //fileChange[fileHash][FILE_PATH] is the path of the file.  fileChange[fileHash][FILE_EXTENSION] is the file extension e.g. .pdf
          if(_cmsData.fileStorage[fileHash]){
            _cmsData.fileStorage[fileHash][FILE_ENTRIES].push(fileChange[fileHash][FILE_PATH]);
          } else { //File does not exist in file system. Need to download it.
            _cmsData.fileStorage[fileHash] = {};
            _cmsData.fileStorage[fileHash][FILE_ENTRIES] = [];
            //Need to also get the file extension for the file added
            _cmsData.fileStorage[fileHash][FILE_EXTENSION] = fileChange[fileHash][FILE_EXTENSION]; //TODO Assuming that the file extension for all files with the same hash will be the same. This seems valid.
            _cmsData.fileStorage[fileHash][FILE_ENTRIES].push(fileChange[fileHash][FILE_PATH]);
            filesNotInFileSystem.push(fileHash);
          }
        }
      }
    }

    for (sectionHash in deletedFileChanges){ //TODO duplicated, can make a function out of this.
      deletedSectionChanges = deletedFileChanges[sectionHash];
      for (fileChange in deletedSectionChanges){
        for (fileHash in fileChange){
          fileEntryIndex = _cmsData.fileStorage[fileHash][FILE_ENTRIES].indexOf(fileChange[fileHash][FILE_PATH]); // Just an array of strings so I can compare.
          _cmsData.fileStorage[fileHash][FILE_ENTRIES].splice(fileEntryIndex, 1);
        }
      }
    }

    //All changes to file storage complete. Need to check if any files have no more references.
    fileHashes = _cmsData.fileStorage;
    filesCheckedSuccess = {};
    for(fileHash in fileHashes){
      if(fileHashes[fileHash][FILE_ENTRIES].length === 0){
        $fh.__cmsFileManager({"act": "delete", "params": {"fileHash": fileHash}}, function () { //TODO also delete the entry in fileEntries

          filesCheckedSuccess = true;

        }, function(err){
          filesCheckedSuccess[fileHash] = err;
        });
      }
    }

    var filesCheckedInterval = setInterval(function(){
      var fileCheckHash;
      if(filesCheckedSuccess.length === fileHashes.length){
        //Finished -- check for success
        for(fileCheckHash in filesCheckedSuccess){
          if(filesCheckedSuccess[fileCheckHash] !== true){
            clearInterval(filesCheckedInterval);
            return cb(filesCheckedSuccess[fileCheckHash]);// Error, return the error
          }
        }

        //All good, now download any files needed
        clearInterval(filesCheckedInterval);
        downloadMissingFiles(filesNotInFileSystem, cb);
      }
    }, 500); //TODO Set interval as config option.
  };

  var  downloadMissingFiles = function(missingFilesHashes, cb){
    var missingFilesCompleted = {};
    var missingFileHash;

    for(missingFileHash in missingFilesHashes){
      $fh.__cmsFileManager({"act" : "download", "params": {"hash" : missingFileHash}}, function(){
        missingFilesCompleted[missingFileHash] = true;
      }, function(err){
        missingFilesCompleted[missingFileHash] = err;
      });
    }

    var downloadedFilesInterval = setInterval(function(){
      if(missingFilesCompleted.length === missingFilesHashes.length){
        for(var downloadResult in missingFilesCompleted){
          if(missingFilesCompleted[downloadResult] !== true){
            clearInterval(downloadedFilesInterval);
            return cb(missingFilesCompleted[downloadResult]);
          }
        }

        //No errors,
        clearInterval(downloadedFilesInterval);
        return cb(undefined);
      }

    }, 500);

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
   *             fileExists: {"fileName": CMS_JSON_FILE_NAME}
   *             cmsZipExists: none
   *             unzipCMS: none
   *             writeFile: {"fileName": CMS_JSON_FILE_NAME}
   *             readFile: {"fileName": CMS_JSON_FILE_NAME}
   *      }
   *
   */
  $fh.__cmsFileManager = function(p, s, f){


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

    var cmsRootFolder = "FHCMSData"; //Setting the folder for the cms files on device. TODO: Should be config, not hard-coded

    if(!_cmsAvailable){
      return handleError("CMS Not Available", f);
    }

    var acts = {
      "download": function(){ //TODO This should probably change in the cmsFileManager to be download by hash, fileName or some other criteria. For now, has is required.
        //Want to download a file based on a hash
        //First, create the full file url
          var fullPathForDownloadedFile = parent.fullPath + p.hash;
          var fhParams = _getFhParams();
          var fhAppId = fhParams.appid;
          var downloadUrl = FH_DOWNLOAD_FILE_URL; //TODO This should be a constant or config. Construct

          //Download url constructed, now need to call the download function
          var fileTransfer = new FileTransfer();

          downloadFile(p.hash, downloadUrl, function(){
            //File download a success -- can now
            return s();

          }, function(error){
            //Error downloading the file, send back the error
            return handleError(error);
          });

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
        //TODO: Looks likely to change to copying the data from the files bundled with the app to the CMS_DATA_FOLDER
      },
      "unzipCMS": function(){
        //TODO: Looks likely to change to copying the data from the files bundled with the app to the CMS_DATA_FOLDER
      },
      "readFile": function(){
        //Want to read a text file -- TODO Do we need to read binary files?
        _cmsFileSystem.root.getDirectory(cmsRootFolder, {"create": false}, function(cmsParentDir){
          //In the CMS parent directory, we want to read the contents of the file. Should not create the file if it does not exist.
          cmsParentDir.getFile(p.fileName, {create: false}, function(foundFile){
            //File has been found, now can read the file,
            var reader = new FileReader();

            //When finished loading the file content,
            reader.onloadend = function(loadedEvent){
              console.log("File " + p.fileName + " loaded successfully.");
              s(loadedEvent.target.result);
            };

            reader.onerror = function(loadError){
              console.log("Error Reading File " + p.fileName + "."); // TODO better error handling needed.
              return handleError("Error Reading File " + p.fileName + ".", f);
            }

            reader.readAsText(foundFile);


          }, function(error){
            //File not found.
            cb("File " + p.fileName + " not found in cms data directory."); // TODO better error handling needed.

          });
        });
      }
    };

    if(acts[p.act]){
      return acts[p.act]();
    } else {
      return handleError("Invalid CMS File Manager Action Call", f);
    }

  };


})(this);
//Testing scripts for testing the client-side CMS functionality

//First -- mock data

//Simple section with simple string field

var cmsUpdateObjectChanged = {"cms" : [{
    "hash": "123456789",
    "name": "simpleSection",
    "updateFlag": "changed",
    "modifiedDate": "12/12/12",
    "modifiedBy": "example@example.com",
    "parent": "",
    "children": ["section1", "section2"],
    "path": "",
    "fields": [{
      "hash": "654154",
      "modifiedDate": "13/12/12",
      "modifiedBy": "example2@example.com",
      "fieldName": "exampleField",
      "fieldType": "string",
      "value": "I am a changed example."
    }]
  }
]}

var cmsUpdateObjectAdded = {"cms" : [{
  "hash": "123456789",
  "name": "simpleSectionAdded",
  "updateFlag": "changed",
  "modifiedDate": "12/12/12",
  "modifiedBy": "example@example.com",
  "parent": "",
  "children": ["section1", "section2"],
  "path": "",
  "fields": [{
    "hash": "654154",
    "modifiedDate": "13/12/12",
    "modifiedBy": "example2@example.com",
    "fieldName": "exampleField",
    "fieldType": "string",
    "value": "I am a changed example."
  }]
}
]}

var cmsUpdateObjectDeleted = {"cms" : [{
  "name": "simpleSectionAdded",
  "updateFlag": "deleted"
  }
]}

var basicCMSStructure = {"cms": {"sections": [{
  "hash": "123456789",
  "name": "simpleSection",
  "modifiedDate": "12/12/12",
  "modifiedBy": "example@example.com",
  "parent": "",
  "children": [],
  "path": "",
  "fields": [{
    "hash": "654154",
    "modifiedDate": "13/12/12",
    "modifiedBy": "example2@example.com",
    "fieldName": "exampleField",
    "fieldType": "string",
    "value": "I am an example."
  }]
}]}};

var singleSectionSingleField = {"cms": {"sections": [{
  "hash": "123456789",
  "name": "simpleSection",
  "modifiedDate": "12/12/12",
  "modifiedBy": "example@example.com",
  "parent": "",
  "children": [],
  "path": "",
  "fields": [{
    "hash": "654154",
    "modifiedDate": "13/12/12",
    "modifiedBy": "example2@example.com",
    "fieldName": "exampleField",
    "fieldType": "string",
    "value": "I am an example."
  }]
}]}};

var singleSectionMultipleFields = {"cms": {"sections":[{
  "hash": "123456789",
  "name": "simpleSection",
  "modifiedDate": "12/12/12",
  "modifiedBy": "example@example.com",
  "parent": "",
  "children": [],
  "path": "",
  "fields": [{
    "hash": "4615745",
    "modifiedDate": "13/12/12",
    "modifiedBy": "example2@example.com",
    "fieldName": "exampleField",
    "fieldType": "string",
    "value": "fieldValue"
  },
  {
    "hash": "field2Hash",
    "modifiedDate": "field2ModifiedDate",
    "modifiedBy": "field2ModifiedBy",
    "fieldName": "someField2Name",
    "fieldType": "string",
    "value": "I am a second example."
  }
  ]
}]}};

var multipleSectionsSingleField = {"cms": {"sections":[
  {
    "hash": "123456789",
    "name": "simpleSection",
    "modifiedDate": "12/12/12",
    "modifiedBy": "example@example.com",
    "parent": "",
    "children": ["12343456789"],
    "path": "simpleSection",
    "fields": [{
      "hash": "654154",
      "modifiedDate": "13/12/12",
      "modifiedBy": "example2@example.com",
      "fieldName": "exampleField",
      "fieldType": "string",
      "value": "I am an example."
    }]
  },
  {
    "hash": "12343456789",
    "name": "simpleSection2",
    "modifiedDate": "1/3/12",
    "modifiedBy": "example2@example.com",
    "parent": "simpleSection",
    "children": [],
    "path": "simpleSection.simpleSection2",
    "fields": [{
      "hash": "456114",
      "modifiedDate": "13/8/02",
      "modifiedBy": "example3@example.com",
      "fieldName": "exampleField",
      "fieldType": "string",
      "value": "I am another example."
    }]
  },
  {
    "hash": "817684645",
    "name": "simpleSection3",
    "modifiedDate": "1/3/12",
    "modifiedBy": "example2@example.com",
    "parent": "simpleSection2",
    "children": [],
    "path": "simpleSection.simpleSection2.simpleSection3",
    "fields": [{
      "hash": "456114",
      "modifiedDate": "13/8/02",
      "modifiedBy": "example3@example.com",
      "fieldName": "exampleField",
      "fieldType": "string",
      "value": "I am another example."
    }]
  }
]}};

var singleSectionList = {"cms": {"sections":[{
  "hash": "79754542352",
  "name": "simpleSectionList",
  "modifiedDate": "3/1/12",
  "modifiedBy": "example5@example.com",
  "parent": "",
  "children": [],
  "path": "simpleSectionList",
  "fields": [{
    "hash": "978654345",
    "modifiedDate": "13/12/12",
    "modifiedBy": "example2@example.com",
    "fieldName": "exampleListField",
    "fieldType": "list",
    "fieldTypes": [
      {
        "name": "listField1",
        "type": "string"
      },
      {
        "name": "listField2",
        "type": "paragraph"
      },
      {
        "name": "listField3",
        "type": "image"
      },
      {
        "name": "listField4",
        "type": "file"
      }
    ],
    "listData": [{
      "hash": "546345264236",
      "modifiedDate": "31/2/12",
      "modifiedBy": "example2@example.com",
      "listIndex": "1",
      "listField1": "This is a string",
      "listField2": "This is a paragraph",
      "listField3": {
        "binaryFileName": "testImage.jpg",
        "binaryType": "image/jpeg",
        "fileHash": "78951287456"
      },
      "listField4": {
        "binaryFileName": "testPdf.pdf",
        "binaryType": "application/pdf",
        "fileHash": "56812442456"
      }
    },
    {
      "hash": "4563547457",
      "modifiedDate": "31/2/14",
      "modifiedBy": "example3@example.com",
      "listIndex": "2",
      "listField1": "This is another string",
      "listField2": "This is another paragraph",
      "listField3": {
        "binaryFileName": "testImage2.jpg",
        "binaryType": "image/jpeg",
        "fileHash": "9768566345"
      },
      "listField4": {
        "binaryFileName": "testPdf2.pdf",
        "binaryType": "application/pdf",
        "fileHash": "345346"
      }
    }
    ]
  }]
}]}};


//Test Functions

test('testCMSNoFields', function(){
  $fh.cms();
});


test('testGetField', function(){

  $fh.cms({"act": "getField", "params": {"path": "somePath.to.field"}}, function(data){}, function(err){});

});

test('testGetFieldNoParams', function(){

  $fh.cms({"act": "getField"}, function(data){}, function(err){});

});

test('testGetFieldNoPath', function(){

  $fh.cms({"act": "getField", "params": {"path": ""}}, function(data){}, function(err){});

});

test('testGetFieldBadPath', function(){

  $fh.cms({"act": "getField", "params": {"path": "so/m5eP.ath.t.o.fie.ld"}}, function(data){}, function(err){});

});

test('testGetFieldDoesNotExist', function(){

  $fh.cms({"act": "getField", "params": {"path": "somePath.to.field.that.does.not.exist"}}, function(data){}, function(err){});

});

test('testGetFieldImage', function(){

  $fh.cms({"act": "getField", "params": {"path": "somePath.to.field.to.Image"}}, function(data){}, function(err){});

});

test('testGetFieldFile', function(){

  $fh.cms({"act": "getField", "params": {"path": "somePath.to.field.to.File"}}, function(data){}, function(err){});

});


test('testGetListSize', function(){

  $fh.cms({"act": "getListSize", "params": {"path": "somePath.to.list"}}, function(data){}, function(err){});

});

test('testGetListSizeNoParams', function(){

  $fh.cms({"act": "getListSize"}, function(data){}, function(err){});

});

test('testGetListSizeNoPath', function(){

  $fh.cms({"act": "getListSize", "params": {"path": ""}}, function(data){}, function(err){});

});

test('testGetListSizeBadPath', function(){

  $fh.cms({"act": "getListSize", "params": {"path": "somePath.jun.g.a.ses[hio n54dfs `.list"}}, function(data){}, function(err){});

});

test('testGetListSizeDoesNotExist', function(){

  $fh.cms({"act": "getListSize", "params": {"path": "somePath.to.list.that.does.not.exist"}}, function(data){}, function(err){});

});

test('testGetListField', function(){

  $fh.cms({"act": "getListField", "params": {"path": "somePath.to.list", "index": 1, "fieldName": "testField"}}, function(data){}, function(err){});

});

test('testGetListFieldImage', function(){

  $fh.cms({"act": "getListField", "params": {"path": "somePath.to.list", "index": 1}}, function(data){}, function(err){});

});

test('testGetListFieldFile', function(){

  $fh.cms({"act": "getListField", "params": {"path": "somePath.to.list", "index": 1}}, function(data){}, function(err){});

});

test('testGetListFieldNoParams', function(){

  $fh.cms({"act": "getListField"}, function(data){}, function(err){});

});

test('testGetListFieldNoPath', function(){

  $fh.cms({"act": "getListField", "params": {"path": "", "index": 1}}, function(data){}, function(err){});

});

test('testGetListFieldNoIndex', function(){

  $fh.cms({"act": "getListField", "params": {"path": "somePath.to.list"}}, function(data){}, function(err){});

});

test('testGetListFieldInvalidIndex', function(){

  $fh.cms({"act": "getListField", "params": {"path": "somePath.to.list", "index": "one"}}, function(data){}, function(err){});

});

test('testGetListFieldBadPath', function(){

  $fh.cms({"act": "getListField", "params": {"path": "junk.gsd.g.dfg.erg.erg.4r3g 454 £$%^&*(654we 6 ew", "index": 1}}, function(data){}, function(err){});

});

test('testGetListFieldDoesNotExist', function(){

  $fh.cms({"act": "getListField", "params": {"path": "somePath.to.list.that.does.not.exist", "index": 1}}, function(data){}, function(err){});

});

test('testGetListFieldIndexOutOfBounds', function(){

  $fh.cms({"act": "getListField", "params": {"path": "somePath.to.list", "index": 987654}}, function(data){}, function(err){});

});


test('testUpdateAllSingleSectionNoUpdates', function(){

  $fh.cms({"act": "updateAll"}, function(field){}, function(err){});

});

test('testUpdateAllSingleSectionChangedFields', function(){

  $fh.cms({"act": "updateAll"}, function(field){}, function(err){});

});

test('testUpdateAllMultipleSectionsNoChanges', function(){

  $fh.cms({"act": "updateAll"}, function(field){}, function(err){});

});

test('testUpdateAllDeleteSection', function(){

  $fh.cms({"act": "updateAll"}, function(field){}, function(err){});

});

test('testUpdateAllAddSection', function(){

  $fh.cms({"act": "updateAll"}, function(field){}, function(err){});

});

test('testUpdateAllAddChildren', function(){

  $fh.cms({"act": "updateAll"}, function(field){}, function(err){});

});

test('testUpdateAllDeleteChildren', function(){

  $fh.cms({"act": "updateAll"}, function(field){}, function(err){});

});

test('testUpdateAllUpdateFails', function(){

  $fh.cms({"act": "updateAll"}, function(field){}, function(err){});

});

test('testUpdateAllUpdateTimesOut', function(){

  $fh.cms({"act": "updateAll"}, function(field){}, function(err){});

});

test('testUpdateSectionNoUpdates', function(){

  $fh.cms({"act": "updateSection", "params": {"path": "path.to.section"}}, function(field){}, function(err){});

});

test('testUpdateSectionChangedFields', function(){

  $fh.cms({"act": "updateSection", "params": {"path": "path.to.section"}}, function(field){}, function(err){});

});

test('testUpdateSectionAddChildren', function(){

  $fh.cms({"act": "updateSection", "params": {"path": "path.to.section"}}, function(field){}, function(err){});

});

test('testUpdateSectionDeleteChildren', function(){

  $fh.cms({"act": "updateSection", "params": {"path": "path.to.section"}}, function(field){}, function(err){});

});

test('testUpdateSectionNoParams', function(){

  $fh.cms({"act": "updateSection"}, function(field){}, function(err){});

});

test('testUpdateSectionNoPath', function(){

  $fh.cms({"act": "updateSection", "params": {"path": ""}}, function(field){}, function(err){});

});

test('testUpdateSectionBadPath', function(){

  $fh.cms({"act": "updateSection", "params": {"path": "^$%$%£gdsg cvxsdf.sd.g sd.g 4te erterrwewe"}}, function(field){}, function(err){});

});


test('testFileSystemDownloadFile', function(){
  $fh.__cmsFileManager({"act": "download", "params": {"hash": "123456", "fieldName": "section.field"}}, function(err){});
});

test('testFileSystemFileExists', function(){
  $fh.__cmsFileManager({"act": "fileExists", "params": {"fileName": "test.json"}}, function(err){});
});

test('testFileSystemDownloadFileNoParams', function(){
  $fh.__cmsFileManager({"act": "download"}, function(){}, function(){});
});

test('testFileSystemDownloadFileNoHash', function(){
  $fh.__cmsFileManager({"act": "download", "params": {"hash": "", "fieldName": "section.field"}}, function(err){});
});

test('testFileSystemDownloadFileNoFieldName', function(){
  $fh.__cmsFileManager({"act": "download", "params": {"hash": "123456", "fieldName": ""}}, function(err){});
});

test('testFileSystemDeleteFile', function(){
  $fh.__cmsFileManager({"act": "delete", "params": {"hash": "123456", "fieldName": "section.field"}}, function(err){});
});

test('testFileSystemDeleteFileNoParams', function(){
  $fh.__cmsFileManager({"act": "delete"}, function(err){});
});

test('testFileSystemDeleteFileNoHash', function(){
  $fh.__cmsFileManager({"act": "delete", "params": {"hash": "", "fieldName": "section.field"}}, function(err){});
});

test('testFileSystemDeleteFileNoFileName', function(){
  $fh.__cmsFileManager({"act": "delete", "params": {"hash": 123456, "fieldName": ""}}, function(err){});
});

test('testFileSystemCleanFileSystem', function(){
  $fh.__cmsFileManager({"act": "cleanFileSystem"}, function(err){});
});
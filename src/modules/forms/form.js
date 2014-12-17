
// // var Page = require("./page");
// // var Field = require("./field");
// // var RulesEngine = require("./rulesEngine");
// // var utils = require("./utils");
// // var log = require("./log");
// // var submission = require("./submission");
// var Model = require("./model");
// // var forms = require("./forms");

// var _forms = {};
// //cache of all forms. single instance for 1 formid
// /**
//  * [Form description]
//  * @param {[type]}   params  {formId: string, fromRemote:boolean(false), rawMode:false, rawData:JSON}
//  * @param {Function} cb         [description]
//  */
// function Form(params, cb) {
//     var that = this;
//     var rawMode = params.rawMode || false;
//     var rawData = params.rawData || null;
//     var formId = params.formId;
//     var fromRemote = params.fromRemote;
//     log.d("Form: ", rawMode, rawData, formId, fromRemote);

//     if (typeof fromRemote === 'function' || typeof cb === 'function') {
//         if (typeof fromRemote === 'function') {
//             cb = fromRemote;
//             fromRemote = false;
//         }
//     } else {
//         return log.e('a callback function is required for initialising form data. new Form (formId, [isFromRemote], cb)');
//     }

//     if (!formId) {
//         return cb('Cannot initialise a form object without an id. id:' + formId, null);
//     }


//     Model.call(that, {
//         '_id': formId,
//         '_type': 'form'
//     });
//     that.set('_id', formId);
//     that.setLocalId(that.genLocalId(formId));


//     function loadFromLocal() {
//         log.d("Form: loadFromLocal ", rawMode, rawData, formId, fromRemote);
//         if (_forms[formId]) {
//             //found form object in mem return it.
//             cb(null, _forms[formId]);
//             return _forms[formId];
//         }

//         function processRawFormJSON() {
//             that.fromJSON(rawData);
//             that.initialise();

//             _forms[that.getFormId()] = that;
//             return cb(null, that);
//         }

//         if (rawData) {
//             return processRawFormJSON();
//         } else {

//             /**
//              * No Form JSON object to process into Models, load the form from local
//              * storage.
//              */
//             that.refresh(false, function(err, form) {
//                 if (err) {
//                     return cb(err);
//                 }

//                 form.initialise();

//                 _forms[formId] = form;
//                 return cb(null, form);
//             });
//         }
//     }


//     function loadFromRemote() {
//         log.d("Form: loadFromRemote", rawMode, rawData, formId, fromRemote);

//         function checkForUpdate(form) {
//             log.d("Form: checkForUpdate", rawMode, rawData, formId, fromRemote);
//             form.refresh(false, function(err, obj) {
//                 if (err) {
//                     log.e("Error refreshing form from local: ", err);
//                 }
//                 if (forms.isFormUpdated(form)) {
//                     form.refresh(true, function(err, obj1) {
//                         if (err) {
//                             return cb(err, null);
//                         }
//                         form.initialise();

//                         _forms[formId] = obj1;
//                         return cb(err, obj1);
//                     });
//                 } else {
//                     form.initialise();
//                     _forms[formId] = obj;
//                     cb(err, obj);
//                 }
//             });
//         }

//         if (_forms[formId]) {
//             log.d("Form: loaded from cache", rawMode, rawData, formId, fromRemote);
//             //found form object in mem return it.
//             if (!forms.isFormUpdated(_forms[formId])) {
//                 cb(null, _forms[formId]);
//                 return _forms[formId];
//             }
//         }

//         checkForUpdate(that);
//     }

//     //Raw mode is for avoiding interaction with the mbaas
//     if (rawMode === true) {
//         loadFromLocal();
//     } else {
//         loadFromRemote();
//     }
// }

// utils.extend(Form, Model);

// Form.prototype.getLastUpdate = function() {
//     log.d("Form: getLastUpdate");
//     return this.get('lastUpdatedTimestamp');
// };
// Form.prototype.genLocalId = function(formId) {
//     formId = typeof(formId) === 'string' ? formId : this.get("_id", "");
//     return "form_" + formId;
// };
// /**
//  * Initiliase form json to objects
//  * @return {[type]} [description]
//  */
// Form.prototype.initialise = function() {
//     this.filterAdminFields();
//     this.initialisePage();
//     this.initialiseFields();
//     this.initialiseRules();
// };
// /**
//  * Admin fields should not be part of the form.
//  */
// Form.prototype.filterAdminFields = function() {
//     var pages = this.getPagesDef();
//     var newFieldRef = {};

//     for (var pageIndex = 0; pageIndex < pages.length; pageIndex++) {
//         var page = pages[pageIndex];
//         var pageFields = page.fields;
//         var filteredFields = [];
//         var fieldInPageIndex = 0;

//         for (var fieldIndex = 0; fieldIndex < pageFields.length; fieldIndex++) {
//             var field = pageFields[fieldIndex];

//             if (!field.adminOnly) {
//                 newFieldRef[field._id] = {
//                     page: pageIndex,
//                     field: fieldInPageIndex
//                 };
//                 fieldInPageIndex++;
//                 filteredFields.push(field);
//             }
//         }

//         pages[pageIndex].fields = filteredFields;
//     }

//     this.set("pages", pages);
//     this.set("fieldRef", newFieldRef);
// };

// Form.prototype.initialiseFields = function() {
//     log.d("Form: initialiseFields");
//     var fieldsRef = this.getFieldRef();
//     this.fields = {};
//     for (var fieldId in fieldsRef) {
//         var fieldRef = fieldsRef[fieldId];
//         var pageIndex = fieldRef.page;
//         var fieldIndex = fieldRef.field;
//         if (pageIndex === undefined || fieldIndex === undefined) {
//             throw 'Corruptted field reference';
//         }
//         var fieldDef = this.getFieldDefByIndex(pageIndex, fieldIndex);
//         if (fieldDef) {
//             this.fields[fieldId] = new Field(fieldDef, this);
//         } else {
//             throw 'Field def is not found.';
//         }
//     }
// };
// Form.prototype.initialisePage = function() {
//     log.d("Form: initialisePage");
//     var pages = this.getPagesDef();
//     this.pages = [];
//     for (var i = 0; i < pages.length; i++) {
//         var pageDef = pages[i];
//         var pageModel = new Page(pageDef, this);
//         this.pages.push(pageModel);
//     }
// };
// Form.prototype.getPageNumberByFieldId = function(fieldId) {
//     if (fieldId) {
//         return this.getFieldRef()[fieldId].page;
//     } else {
//         return null;
//     }
// };
// Form.prototype.getPageModelList = function() {
//     return this.pages;
// };
// Form.prototype.getName = function() {
//     return this.get('name', '');
// };
// Form.prototype.getDescription = function() {
//     return this.get('description', '');
// };
// Form.prototype.getPageRules = function() {
//     return this.get('pageRules', []);
// };
// Form.prototype.getFieldRules = function() {
//     return this.get('fieldRules', []);
// };
// Form.prototype.getFieldRef = function() {
//     return this.get('fieldRef', {});
// };
// Form.prototype.getPagesDef = function() {
//     return this.get('pages', []);
// };
// Form.prototype.getPageRef = function() {
//     return this.get('pageRef', {});
// };
// Form.prototype.getFieldModelById = function(fieldId) {
//     return this.fields[fieldId];
// };
// /**
//  * Finding a field model by the Field Code specified in the studio if it exists
//  * Otherwise return null;
//  * @param code - The code of the field that is being searched for
//  */
// Form.prototype.getFieldModelByCode = function(code) {
//     var self = this;
//     if (!code || typeof(code) !== "string") {
//         return null;
//     }

//     for (var fieldId in self.fields) {
//         var field = self.fields[fieldId];
//         if (field.getCode() !== null && field.getCode() === code) {
//             return field;
//         }
//     }

//     return null;
// };
// Form.prototype.getFieldDefByIndex = function(pageIndex, fieldIndex) {
//     log.d("Form: getFieldDefByIndex: ", pageIndex, fieldIndex);
//     var pages = this.getPagesDef();
//     var page = pages[pageIndex];
//     if (page) {
//         var fields = page.fields ? page.fields : [];
//         var field = fields[fieldIndex];
//         if (field) {
//             return field;
//         }
//     }
//     log.e("Form: getFieldDefByIndex: No field found for page and field index: ", pageIndex, fieldIndex);
//     return null;
// };
// Form.prototype.getPageModelById = function(pageId) {
//     log.d("Form: getPageModelById: ", pageId);
//     var index = this.getPageRef()[pageId];
//     if (typeof index === 'undefined') {
//         log.e('page id is not found in pageRef: ' + pageId);
//     } else {
//         return this.pages[index];
//     }
// };
// Form.prototype.newSubmission = function() {
//     log.d("Form: newSubmission");
//     return submission.newInstance(this);
// };
// Form.prototype.getFormId = function() {
//     return this.get('_id');
// };
// Form.prototype.removeFromCache = function() {
//     log.d("Form: removeFromCache");
//     if (_forms[this.getFormId()]) {
//         delete _forms[this.getFormId()];
//     }
// };
// Form.prototype.getFileFieldsId = function() {
//     log.d("Form: getFileFieldsId");
//     var fieldsId = [];
//     for (var fieldId in this.fields) {
//         var field = this.fields[fieldId];
//         if (field.getType() === 'file' || field.getType() === 'photo' || field.getType() === 'signature') {
//             fieldsId.push(fieldId);
//         }
//     }
//     return fieldsId;
// };

// Form.prototype.getRuleEngine = function() {
//     log.d("Form: getRuleEngine");
//     if (this.rulesEngine) {
//         return this.rulesEngine;
//     } else {
//         var formDefinition = this.getProps();
//         this.rulesEngine = new RulesEngine(formDefinition);
//         return this.rulesEngine;
//     }
// };


// module.exports = Form;
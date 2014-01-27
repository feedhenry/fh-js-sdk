appForm.models = function (module) {
  var Model = appForm.models.Model;
  module.Form = Form;
  var _forms = {};
  //cache of all forms. single instance for 1 formid
  /**
     * [Form description]
     * @param {[type]}   params  {formId: string, fromRemote:boolean(false), rawMode:false, rawData:JSON}
     * @param {Function} cb         [description]
     */
  function Form(params, cb) {
    var rawMode = params.rawMode;
    var rawData = params.rawData;
    var formId = params.formId;
    if (!formId) {
      throw 'Cannot initialise a form object without an id. id:' + formId;
    }
    Model.call(this, {
      '_id': formId,
      '_type': 'form'
    });
    if (_forms[formId]) {
      //found form object in mem return it.
      cb(null, _forms[formId]);
      return _forms[formId];
    }
    if (rawMode === true) {
      this.fromJSON(rawData);
      try {
        this.initialise();
      } catch (e) {
        console.error('Failed to initialise form.');
        console.error(e);  //TODO throw the error if in dev mode.
      }
      _forms[formId] = this;
      cb(null, this);
    } else {
      var fromRemote = params.fromRemote;
      if (typeof fromRemote == 'function' || typeof cb == 'function') {
        if (typeof fromRemote == 'function') {
          cb = fromRemote;
          fromRemote = false;
        }
        var that = this;
        this.refresh(fromRemote, function (err, obj) {
          try {
            that.initialise();
          } catch (e) {
            console.error('Failed to initialise form.');
            console.error(e);  //TODO throw the error if in dev mode.
          }
          _forms[formId] = obj;
          if (appForm.models.forms.isFormUpdated(that)) {
            that.refresh(true, function (err, obj1) {
              try {
                that.initialise();
              } catch (e) {
                console.error(e);
                cb(err, obj);
              }
              _forms[formId] = obj1;
              cb(err, obj1);
            });
          } else {
            cb(err, obj);
          }
        });
      } else {
        throw 'a callback function is required for initialising form data. new Form (formId, [isFromRemote], cb)';
      }
    }
  }
  appForm.utils.extend(Form, Model);
  Form.prototype.getLastUpdate = function () {
    return this.get('lastUpdatedTimestamp');
  };
  /**
     * Initiliase form json to objects
     * @return {[type]} [description]
     */
  Form.prototype.initialise = function () {
    this.initialisePage();
    this.initialiseFields();
    this.initialiseRules();
  };
  Form.prototype.initialiseFields = function () {
    var fieldsRef = this.getFieldRef();
    this.fields = {};
    console.log('field Ref', fieldRef);
    for (var fieldId in fieldsRef) {
      var fieldRef = fieldsRef[fieldId];
      var pageIndex = fieldRef.page;
      var fieldIndex = fieldRef.field;
      if (pageIndex === undefined || fieldIndex === undefined) {
        throw 'Corruptted field reference';
      }
      var fieldDef = this.getFieldDefByIndex(pageIndex, fieldIndex);
      if (fieldDef) {
        this.fields[fieldId] = new appForm.models.Field(fieldDef, this);
      } else {
        throw 'Field def is not found.';
      }
    }
  };
  Form.prototype.initialiseRules = function () {
    this.rules = {};
    var pageRules = this.getPageRules();
    var fieldRules = this.getFieldRules();
    var constructors = [];
    for (var i = 0; i<pageRules.length ; i++) {
      var pageRule = pageRules[i];
      constructors.push({
        'type': 'page',
        'definition': pageRule
      });
    }
    for (i = 0; i<fieldRules.length; i++) {
      var fieldRule = fieldRules[i];
      constructors.push({
        'type': 'field',
        'definition': fieldRule
      });
    }
    for (i = 0; i<constructors.length ; i++) {
      var constructor = constructors[i];
      var ruleObj = new appForm.models.Rule(constructor);
      var fieldIds = ruleObj.getRelatedFieldId();
      for (var j = 0; i<fieldIds.length; j++) {
        var  fieldId = fieldIds[j];
        if (!this.rules[fieldId]) {
          this.rules[fieldId] = [];
        }
        this.rules[fieldId].push(ruleObj);
      }
    }
  };
  Form.prototype.getRulesByFieldId = function (fieldId) {
    return this.rules[fieldId];
  };
  Form.prototype.initialisePage = function () {
    var pages = this.getPagesDef();
    this.pages = [];
    for (var i = 0; i < pages.length; i++) {
      var pageDef = pages[i];
      var pageModel = new appForm.models.Page(pageDef, this);
      this.pages.push(pageModel);
    }
  };
  Form.prototype.getPageModelList = function () {
    return this.pages;
  };
  Form.prototype.getName = function () {
    return this.get('name', '');
  };
  Form.prototype.getDescription = function () {
    return this.get('description', '');
  };
  Form.prototype.getPageRules = function () {
    return this.get('pageRules', []);
  };
  Form.prototype.getFieldRules = function () {
    return this.get('fieldRules', []);
  };
  Form.prototype.getFieldRef = function () {
    return this.get('fieldRef', {});
  };
  Form.prototype.getPagesDef = function () {
    return this.get('pages', []);
  };
  Form.prototype.getPageRef = function () {
    return this.get('pageRef', {});
  };
  Form.prototype.getFieldModelById = function (fieldId) {
    return this.fields[fieldId];
  };
  Form.prototype.getFieldDefByIndex = function (pageIndex, fieldIndex) {
    var pages = this.getPagesDef();
    var page = pages[pageIndex];
    if (page) {
      var fields = page.fields ? page.fields : [];
      var field = fields[fieldIndex];
      if (field) {
        return field;
      }
    }
    return null;
  };
  Form.prototype.getPageModelById = function (pageId) {
    var index = this.getPageRef()[pageId];
    if (typeof index == 'undefined') {
      throw 'page id is not found';
    } else {
      return this.pages[index];
    }
  };
  Form.prototype.newSubmission = function () {
    return appForm.models.submission.newInstance(this);
  };
  Form.prototype.getFormId = function () {
    return this.get('_id');
  };
  Form.prototype.removeFromCache = function () {
    if (_forms[this.getFormId()]) {
      delete _forms[this.getFormId()];
    }
  };
  Form.prototype.getFileFieldsId = function () {
    var fieldsId = [];
    for (var fieldId in this.fields) {
      var field = this.fields[fieldId];
      if (field.getType() == 'file' || field.getType() == 'photo' || field.getType() == 'signature') {
        fieldsId.push(fieldId);
      }
    }
    return fieldsId;
  };
  // Form.prototype.getImageFieldsId=function(){
  //     var fieldsId=[]
  //     for (var fieldId in this.fields){
  //         var field=this.fields[fieldId];
  //         if (field.getType()=="photo" || field.getType()=="signature"  ){
  //             fieldsId.push(fieldId);
  //         }
  //     }
  //     return fieldsId;
  // }
  Form.prototype.getRuleEngine = function () {
    if (this.rulesEngine) {
      return this.rulesEngine;
    } else {
      var formDefinition = this.getProps();
      this.rulesEngine = new appForm.RulesEngine(formDefinition);
      // //DEBUG ONLY  BY PASS VALIDATE FORM
      // this.rulesEngine.validateForm=function(a,cb){
      //     cb(null,{
      //         validation:{
      //             valid:true    
      //         }
      //     });
      // }
      // //END OF DEBUG
      return this.rulesEngine;
    }
  };
  return module;
}(appForm.models || {});
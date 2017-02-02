/**
 * One form contains multiple pages
 */
appForm.models = function (module) {

  var Model = appForm.models.Model;
  function Page(opt, parentForm) {
    if (typeof opt === 'undefined' || typeof parentForm === 'undefined') {
      throw 'Page initialise failed: new Page(pageDefinitionJSON, parentFormModel)';
    }
    Model.call(this, { '_type': 'page' });
    this.fromJSON(opt);
    this.form = parentForm;
    this.initialise();
  }
  appForm.utils.extend(Page, Model);
  Page.prototype.initialise = function () {
    var fieldsDef = this.getFieldDef();
    this.fieldsIds = [];
    for (var i = 0; i < fieldsDef.length; i++) {
      this.fieldsIds.push(fieldsDef[i]._id);
    }
  };
  Page.prototype.setVisible = function (isVisible) {
    this.set('visible', isVisible);
    if (isVisible) {
      this.emit('visible');
    } else {
      this.emit('hidden');
    }
  };
  Page.prototype.getFieldDef=function(){
    return this.get("fields",[]);
  };
  Page.prototype.getFieldDef=function(){
      return this.get("fields",[]);
  };
  Page.prototype.getFieldModelList=function(){
      var list=[];
      for (var i=0;i<this.fieldsIds.length;i++){
          list.push(this.form.getFieldModelById(this.fieldsIds[i]));
      }
      return list;
  };
  Page.prototype.checkForSectionBreaks=function(){ //Checking for any sections
    for (var i=0;i<this.fieldsIds.length;i++){
      var fieldModel = this.form.getFieldModelById(this.fieldsIds[i]);
      if(fieldModel && fieldModel.getType() === "sectionBreak"){
        return true;
      }
    }
    return false;
  };


  /**
   * Getting a list of sections for this page if the page contains any section breaks.
   *
   *
   * @returns {*}
   */
  Page.prototype.getSections=function(){ //Checking for any sections
    var sectionList={};
    var currentSectionId = null;
    var sectionBreaksExist = this.checkForSectionBreaks();
    var insertSectionBreak = false;

    var pageId = this.get("_id");

    //If there is a single section break in the page, then we need to render section breaks.
    if(sectionBreaksExist){
      //If there are section breaks, the first field in the form must be a section break. If not, add a placeholder
      var firstField = this.form.getFieldModelById(this.fieldsIds[0]);

      if(firstField.getType() !== "sectionBreak"){
        insertSectionBreak = true;
      }
    } else {
      //No section breaks exist in the page, so no need to render any section breaks.
      //We can just render the fields.
      return null;
    }

    //Iterating through the fields in the page and building a list of section breaks as required.
    for (var fieldModelIndex = 0; fieldModelIndex < this.fieldsIds.length; fieldModelIndex++){
      var fieldModel = this.form.getFieldModelById(this.fieldsIds[fieldModelIndex]);

      if(insertSectionBreak && fieldModelIndex === 0){ //Adding a first section.
        currentSectionId = "sectionBreak" + pageId + "0";
        sectionList[currentSectionId] = sectionList[currentSectionId] ? sectionList[currentSectionId] : {fields: []};
        sectionList[currentSectionId].title = "Section " + (fieldModelIndex+1);
      }

      if(currentSectionId !== null && fieldModel.getType() !== "sectionBreak"){
        sectionList[currentSectionId].fields.push(fieldModel);
      }

      if(fieldModel.getType() === "sectionBreak"){
        currentSectionId = fieldModel.get('_id');
        sectionList[currentSectionId] = sectionList[currentSectionId] ? sectionList[currentSectionId] : {fields: []};
        sectionList[currentSectionId].title = fieldModel.get('name', "Section " + (fieldModelIndex+1));
        sectionList[currentSectionId].description = fieldModel.get('helpText', "Section " + (fieldModelIndex+1));
      }
    }

    return sectionList;
  };
  Page.prototype.getFieldModelById=function(fieldId){
    return this.form.getFieldModelById(fieldId);
  };
  Page.prototype.getPageId=function(){
    return this.get("_id","");
  };
  Page.prototype.getName = function () {
    return this.get('name', '');
  };
  Page.prototype.getDescription = function () {
    return this.get('description', '');
  };
  Page.prototype.getFieldDef = function () {
    return this.get('fields', []);
  };
  Page.prototype.getFieldModelList = function () {
    var list = [];
    for (var i = 0; i < this.fieldsIds.length; i++) {
      list.push(this.form.getFieldModelById(this.fieldsIds[i]));
    }

    return list;
  };

    module.Page=Page;

    return module;
}(appForm.models || {});

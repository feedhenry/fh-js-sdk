/**
 * One form contains multiple pages
 */
var Model = require("./model");
var log = require("./log");
var config = require("./config");

function Page(opt, parentForm) {
    if (typeof opt === 'undefined' || typeof parentForm === 'undefined') {
        log.e('Page initialise failed: new Page(pageDefinitionJSON, parentFormModel)');
        return;
    }
    Model.call(this, {
        '_type': 'page'
    });
    this.fromJSON(opt);
    this.form = parentForm;
    this.initialise();
};

Page.prototype.initialise = function() {
    var fieldsDef = this.getFieldDef();
    this.fieldsIds = [];
    for (var i = 0; i < fieldsDef.length; i++) {
        this.fieldsIds.push(fieldsDef[i]._id);
    }
};
Page.prototype.setVisible = function(isVisible) {
    this.set('visible', isVisible);
    if (isVisible) {
        this.emit('visible');
    } else {
        this.emit('hidden');
    }
};
Page.prototype.getFieldDef = function() {
    return this.get("fields", []);
};
Page.prototype.getFieldDef = function() {
    return this.get("fields", []);
};
Page.prototype.getFieldModelList = function() {
    var list = [];
    for (var i = 0; i < this.fieldsIds.length; i++) {
        list.push(this.form.getFieldModelById(this.fieldsIds[i]));
    }
    return list;
};
Page.prototype.checkForSectionBreaks = function() { //Checking for any sections
    for (var i = 0; i < this.fieldsIds.length; i++) {
        var fieldModel = this.form.getFieldModelById(this.fieldsIds[i]);
        if (fieldModel && fieldModel.getType() === "sectionBreak") {
            return true;
        }
    }
    return false;
};
Page.prototype.getSections = function() { //Checking for any sections
    var sectionList = {};
    var currentSection = null;
    var sectionBreaksExist = this.checkForSectionBreaks();
    var insertSectionBreak = false;

    if (sectionBreaksExist) {
        //If there are section breaks, the first field in the form must be a section break. If not, add a placeholder
        var firstField = this.form.getFieldModelById(this.fieldsIds[0]);

        if (firstField.getType() !== "sectionBreak") {
            insertSectionBreak = true;
        }
    } else {
        return null;
    }

    for (var i = 0; i < this.fieldsIds.length; i++) {
        var fieldModel = this.form.getFieldModelById(this.fieldsIds[i]);

        if (insertSectionBreak && i === 0) { //Adding a first section.
            currentSection = "sectionBreak" + i;
            sectionList[currentSection] = sectionList[currentSection] ? sectionList[currentSection] : {
                fields: []
            };
            sectionList[currentSection].title = "Section " + (i + 1);
        }

        if (currentSection !== null && fieldModel.getType() !== "sectionBreak") {
            sectionList[currentSection].fields.push(fieldModel);
        }

        if (fieldModel.getType() === "sectionBreak") {
            currentSection = "sectionBreak" + i;
            sectionList[currentSection] = sectionList[currentSection] ? sectionList[currentSection] : {
                fields: []
            };
            sectionList[currentSection].title = fieldModel.get('name', "Section " + (i + 1));
            sectionList[currentSection].fields.push(fieldModel);
        }
    }

    return sectionList;
};
Page.prototype.getFieldModelById = function(fieldId) {
    return this.form.getFieldModelById(fieldId);
};
Page.prototype.getPageId = function() {
    return this.get("_id", "");
};
Page.prototype.getName = function() {
    return this.get('name', '');
};
Page.prototype.getDescription = function() {
    return this.get('description', '');
};
Page.prototype.getFieldDef = function() {
    return this.get('fields', []);
};
Page.prototype.getFieldModelList = function() {
    var list = [];
    for (var i = 0; i < this.fieldsIds.length; i++) {
        list.push(this.form.getFieldModelById(this.fieldsIds[i]));
    }

    return list;
};

module.exports = Page;
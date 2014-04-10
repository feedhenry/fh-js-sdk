var FormView = BaseView.extend({
  "pageNum": 0,
  "pageCount": 0,
  "pageViews": [],
  "submission": null,
  "fieldValue": [],
  templates: {
    formLogo: '<div class="fh_appform_logo_container"><div class="fh_appform_logo"></div></div>',
    formTitle: '<div class="fh_appform_form_title"><%= title %></div>',
    formDescription: '<div class="fh_appform_form_description"><%= description %></div>',
    formContainer: '<div id="fh_appform_container" class="fh_appform_form_area fh_appform_container"></div>',
    buttons: '<div id="fh_appform_navigation_buttons" class="fh_appform_button_bar"><button class="fh_appform_button_saveDraft fh_appform_hidden fh_appform_button_main fh_appform_button_action">Save Draft</button><button class="fh_appform_button_previous fh_appform_hidden fh_appform_button_default">Previous</button><button class="fh_appform_button_next fh_appform_hidden fh_appform_button_default">Next</button><button class="fh_appform_button_submit fh_appform_hidden fh_appform_button_action">Submit</button></div>'
  },
  events: {
    "click button.fh_appform_button_next": "nextPage",
    "click button.fh_appform_button_previous": "prevPage",
    "click button.fh_appform_button_saveDraft": "saveToDraft",
    "click button.fh_appform_button_submit": "submit"
  },
  elementNames: {
    formContainer: "#fh_appform_container"
  },

  initialize: function() {
    var self = this;
    _.bindAll(this, "checkRules", "onValidateError");
    this.el = this.options.parentEl;
    this.fieldModels = [];
    this.pageViewStatus = {};
    this.el.empty();
  },
  loadForm: function(params, cb) {
    var self = this;

    if (params.formId) {
      self.onLoad();
      $fh.forms.getForm(params, function(err, form) {
        if (err) {
          throw (err.body);
        }
        self.form = form;
        self.params = params;
        self.initWithForm(form, params);
        cb();
      });
    } else if (params.form) {
      self.form = params.form;
      self.params = params;
      self.initWithForm(params.form, params);
      cb();
    }
  },
  readOnly: function() {
    this.readonly = true;
    for (var i = 0; i<this.fieldViews.length; i++) {
      var fieldView=this.fieldViews[i];
      fieldView.$el.find("button,input,textarea,select").attr("disabled", "disabled");
    }
    this.el.find("button.fh_appform_button_saveDraft").hide();
    this.el.find(" button.fh_appform_button_submit").hide();
  },
  onValidateError: function(res) {
    var firstView=null;
    for (var fieldId in res) {
      if (res[fieldId]) {
        var fieldView = this.getFieldViewById(fieldId);
        if (firstView==null){
          firstView=fieldView;
        }
        var errorMsgs = res[fieldId].fieldErrorMessage;
        for (var i = 0; i < errorMsgs.length; i++) {
          if (errorMsgs[i]) {
            fieldView.setErrorText(i, errorMsgs[i]);
          }
        }
      }
    }
    
  },
  initWithForm: function(form, params) {
    var self = this;
    var pageView;
    self.formId = form.getFormId();

    self.el.empty();
    self.model = form;

    //Page views are always added before anything else happens, need to render the form title first
    this.el.append(this.templates.formContainer);
    self.el.find(this.elementNames.formContainer).append(_.template(this.templates.formLogo, {}));
    self.el.find(this.elementNames.formContainer).append(_.template(this.templates.formTitle, {title: this.model.getName()}));
    self.el.find(this.elementNames.formContainer).append(_.template(this.templates.formDescription, {description: this.model.getDescription()}));

    if (!params.submission) {
      params.submission = self.model.newSubmission();
    }
    self.submission = params.submission;
    self.submission.on("validationerror", self.onValidateError);

    // Init Pages --------------
    var pageModelList = form.getPageModelList();
    var pageViews = [];

    self.steps = new StepsView({
      parentEl: self.el.find(this.elementNames.formContainer),
      parentView: self,
      model: self.model
    });

    for (var i = 0; i<pageModelList.length; i++) {
      var pageModel = pageModelList[i];
      var pageId = pageModel.getPageId();

      self.pageViewStatus[pageId] = {"targetId" : pageId, "action" : "show"};

      // get fieldModels
      var list = pageModel.getFieldModelList();
      self.fieldModels = self.fieldModels.concat(list);

      pageView = new PageView({
        model: pageModel,
        parentEl: self.el.find(this.elementNames.formContainer),
        formView: self
      });
      pageViews.push(pageView);
    }
    var fieldViews = [];
    for ( i = 0; i<pageViews.length; i++) {
      pageView = pageViews[i];
      var pageFieldViews = pageView.fieldViews;
      for (var key in pageFieldViews) {
        var fView = pageFieldViews[key];
        fieldViews.push(fView);
        fView.on("checkrules", self.checkRules);
        if (self.readonly) {
          fView.$el.find("input,button,textarea,select").attr("disabled", "disabled");
        }
      }
    }

    self.fieldViews = fieldViews;
    self.pageViews = pageViews;
    self.pageCount = pageViews.length;

    self.checkRules();
  },
  checkRules: function() {
    var self = this;
    self.populateFieldViewsToSubmission(false, function() {
      var submission = self.submission;
      submission.checkRules(function(err, res) {
        if (err) {
          console.error(err);
        } else {
          var actions = res.actions;
          var targetId;
          for (targetId in actions.pages) {
            self.pageViewStatus[targetId] = actions.pages[targetId];
          }

          var fields = actions.fields;

          for (targetId in fields) {
            self.performRuleAction("field", targetId, fields[targetId]["action"]);
          }
        }
        self.checkPages();
      });
    });
  },
  performRuleAction: function(type, targetId, action) {
    var target = null;
    if (type == "field") {
      target = this.getFieldViewById(targetId);
    }
    if (target == null) {
      console.error("cannot find target with id:" + targetId);
      return;
    }
    switch (action) {
      case "show":
        target.show();
        break;
      case "hide":
        target.hide();
        break;
      default:
        console.error("action not defined:" + action);
    }
  },
  rebindButtons: function() {
    var self = this;
    this.el.find("button.fh_appform_button_next").unbind().bind("click", function() {
      self.nextPage();
    });

    this.el.find("button.fh_appform_button_previous").unbind().bind("click", function() {
      self.prevPage();
    });

    this.el.find("button.fh_appform_button_saveDraft").unbind().bind("click", function() {
      self.saveToDraft();
    });
    this.el.find("button.fh_appform_button_submit").unbind().bind("click", function() {
      self.submit();
    });
  },
  setSubmission: function(sub) {
    this.submission = sub;
  },
  getSubmission: function() {
    return this.submission;
  },
  getPageViewById: function(pageId) {
    for (var i = 0; i< this.pageViews.length ; i++) {
      var pageView = this.pageViews[i];
      var pId = pageView.model.getPageId();
      if (pId == pageId) {
        return pageView;
      }
    }
    return null;
  },
  getFieldViewById: function(fieldId) {
    for (var i = 0; i<this.fieldViews.length; i++) {
      var fieldView = this.fieldViews[i];
      var pId = fieldView.model.getFieldId();
      if (pId == fieldId) {
        return fieldView;
      }
    }
    return null;
  },
  checkPages: function() {

    var displayedPages = this.getNumDisplayedPages();
    var displayedIndex = this.getDisplayIndex();

    if (displayedIndex === 0 && displayedIndex === displayedPages - 1) {
      this.el.find(" button.fh_appform_button_previous").hide();
      this.el.find("button.fh_appform_button_next").hide();
      this.el.find("button.fh_appform_button_saveDraft").show();
      this.el.find(" button.fh_appform_button_submit").show();
      this.el.find(".fh_appform_button_bar button").removeClass('fh_appform_three_button');
      this.el.find(".fh_appform_button_bar button").addClass('fh_appform_two_button');
    } else if (displayedIndex === 0) {
      this.el.find(" button.fh_appform_button_previous").hide();
      this.el.find("button.fh_appform_button_next").show();
      this.el.find("button.fh_appform_button_saveDraft").show();
      this.el.find(" button.fh_appform_button_submit").hide();
      this.el.find(".fh_appform_button_bar button").removeClass('fh_appform_three_button');
      this.el.find(".fh_appform_button_bar button").addClass('fh_appform_two_button');
    } else if (displayedIndex === displayedPages - 1) {
      this.el.find(" button.fh_appform_button_previous").show();
      this.el.find(" button.fh_appform_button_next").hide();
      this.el.find(" button.fh_appform_button_saveDraft").show();
      this.el.find(" button.fh_appform_button_submit").show();
      this.el.find(".fh_appform_button_bar button").removeClass('fh_appform_two_button');
      this.el.find(".fh_appform_button_bar button").addClass('fh_appform_three_button');
    } else {
      this.el.find(" button.fh_appform_button_previous").show();
      this.el.find(" button.fh_appform_button_next").show();
      this.el.find(" button.fh_appform_button_saveDraft").show();
      this.el.find(" button.fh_appform_button_submit").hide();
      this.el.find(".fh_appform_button_bar button").removeClass('fh_appform_two_button');
      this.el.find(".fh_appform_button_bar button").addClass('fh_appform_three_button');
    }
    if (this.readonly) {
      this.el.find("button.fh_appform_button_saveDraft").hide();
      this.el.find(" button.fh_appform_button_submit").hide();
    }

  },
  render: function() {
    this.el.find("#fh_appform_container.fh_appform_form_area").append(this.templates.buttons);
    this.rebindButtons();
    this.pageViews[0].show();
    this.pageNum = 0;
    this.steps.activePageChange(this);
    this.checkRules();
  },
  getNextPageIndex: function(currentPageIndex){
    var self = this;
    for(var pageIndex = currentPageIndex + 1; pageIndex < this.pageViews.length; pageIndex += 1){
      var pageId = this.pageViews[pageIndex].model.getPageId();
      var pageAction = self.pageViewStatus[pageId].action;

      if(pageAction == "show"){
        return pageIndex;
      }
    }
  },
  getPrevPageIndex: function(currentPageIndex){
    var self = this;
    for(var pageIndex = currentPageIndex - 1; pageIndex >= 0; pageIndex--){
      var pageId = self.pageViews[pageIndex].model.getPageId();
      var pageAction = self.pageViewStatus[pageId].action;

      if(pageAction == "show"){
        return pageIndex;
      }
    }
  },
  getDisplayIndex: function(){
    var self = this;
    var currentIndex = this.pageNum;

    for(var pageIndex = this.pageNum; pageIndex > 0; pageIndex--){
      var pageId = this.pageViews[pageIndex].model.getPageId();
      var pageAction = self.pageViewStatus[pageId].action;

      if(pageAction == "hide"){
        currentIndex -= 1;
      }
    }

    return currentIndex;
  },
  getNumDisplayedPages : function(){
     return this.getDisplayedPages().length;
  },
  getDisplayedPages : function(){
    var self = this;
    var displayedPages = [];
    for(var pageIndex = 0; pageIndex < self.pageViews.length; pageIndex++){
      var pageId = this.pageViews[pageIndex].model.getPageId();
      var pageAction = self.pageViewStatus[pageId].action;

      if(pageAction == "show"){
        displayedPages.push(pageId);
      }
    }

    return displayedPages;
  },
  nextPage: function() {
    this.hideAllPages();
    this.pageNum = this.getNextPageIndex(this.pageNum);
    this.pageViews[this.pageNum].show();
    this.steps.activePageChange(this);
    this.checkPages();
  },
  prevPage: function() {
    this.hideAllPages();
    this.pageNum = this.getPrevPageIndex(this.pageNum);
    this.pageViews[this.pageNum].show();
    this.steps.activePageChange(this);
    this.checkPages();
  },
  hideAllPages: function() {
    this.pageViews.forEach(function(view) {
      view.hide();
    });
  },
  submit: function() {
    var self = this;
    this.populateFieldViewsToSubmission(function() {
      self.submission.submit(function(err, res) {
        if (err) {
          console.error(err);
        } else {
          self.submission.upload(function(err, uploadTask) {
            if(err){
              console.error(err);
            }

            self.el.empty();
          });
        }
      });
    });
  },
  saveToDraft: function() {
    var self = this;
    this.populateFieldViewsToSubmission(function() {
      self.submission.saveDraft(function(err, res) {
        if(err) console.error(err, res);
        self.el.empty();
      });
    });
  },
  populateFieldViewsToSubmission: function(isStore, cb) {
    if (typeof cb === "undefined"){
      cb=isStore;
      isStore=true;
    }
    var submission = this.submission;
    var fieldViews = this.fieldViews;
    var fieldId;
    var tmpObj = [];
    for (var i = 0; i<fieldViews.length ; i++) {
      var fieldView = fieldViews[i];
      var val = fieldView.value();
      fieldId = fieldView.model.getFieldId();
      var fieldType = fieldView.model.getType();

      if(fieldType !== "sectionBreak"){
        for (var j = 0; j < val.length; j++) {
          var v = val[j];
          tmpObj.push({
            id: fieldId,
            value: v,
            index:j
          });
        }
      }
    }
    var count = tmpObj.length;
    submission.reset();
    for (i = 0; i<tmpObj.length ; i++) {
      var item = tmpObj[i];
      fieldId = item.id;
      var value = item.value;
      var index=item.index;
      submission.addInputValue({
        fieldId: fieldId,
        value: value,
        index: index,
        isStore:isStore
      }, function(err, res) {
        if (err) {
          console.error(err);
        }
        count--;
        if (count === 0) {
          cb();
        }
      });
    }
  },

  setInputValue: function(fieldId, value) {
    var self = this;
    for (var i = 0; i<this.fieldValue.length; i++) {
      var item = this.fieldValue[i];
      if (item.id == fieldId) {
        this.fieldValue.splice(i, 1);
      }
    }
    for (i = 0; i<value.length; i++) {
      var v = value[i];
      this.fieldValue.push({
        id: fieldId,
        value: v
      });
    }
  }
});
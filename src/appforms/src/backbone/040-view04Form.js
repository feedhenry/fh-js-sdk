var FormView = BaseView.extend({
  "pageNum": 0,
  "pageCount": 0,
  "pageViews": [],
  "submission": null,
  "fieldValue": [],
  templates: {
    buttons: '<div id="buttons" class="fh_action_bar fh_appform_navigation"><button class="saveDraft hidden button button-main fh_appform_button_action">Save Draft</button><button class="previous hidden button fh_appform_button_navigation">Previous</button><button class="next hidden button fh_appform_button_navigation">Next</button><button class="submit hidden button button-positive fh_appform_button_action">Submit</button></div>'
  },
  events: {
    "click button.next": "nextPage",
    "click button.previous": "prevPage",
    "click button.saveDraft": "saveToDraft",
    "click button.submit": "submit"
  },

  initialize: function() {
    _.bindAll(this, "checkRules", "onValidateError");
    this.el = this.options.parentEl;
    this.fieldModels = [];
    this.el.empty();
  },
  loadForm: function(params, cb) {
    var self = this;
    if (params.formId) {

      this.onLoad();
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
    for (var i = 0, fieldView; fieldView = this.fieldViews[i]; i++) {
      fieldView.$el.find("button,input,textarea,select").attr("disabled", "disabled");
    }
    this.el.find("button.saveDraft").hide();
    this.el.find(" button.submit").hide();
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
    self.formId = form.getFormId();

    self.el.empty();
    self.model = form;

    if (!params.submission) {
      params.submission = self.model.newSubmission();
    }
    self.submission = params.submission;
    self.submission.on("validationerror", self.onValidateError);
    // Init Pages --------------
    var pageModelList = form.getPageModelList();
    var pageViews = [];
    for (var i = 0, pageModel; pageModel = pageModelList[i]; i++) {
      // get fieldModels
      var list = pageModel.getFieldModelList()
      self.fieldModels = self.fieldModels.concat(list);

      var pageView = new PageView({
        model: pageModel,
        parentEl: self.el,
        formView: self
      });
      pageViews.push(pageView);
    }
    var fieldViews = [];
    for (var i = 0, pageView; pageView = pageViews[i]; i++) {
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

    self.onLoadEnd();
  },
  checkRules: function() {
    var self = this;
    this.populateFieldViewsToSubmission(false, function() {
      var submission = self.submission;
      submission.checkRules(function(err, res) {
        if (err) {
          console.error(err);
        } else {
          var actions = res.actions;
          var pages = actions.pages;
          var fields = actions.fields;
          for (var targetId in pages) {
            self.performRuleAction("page", targetId, pages[targetId]["action"]);
          }
          for (var targetId in fields) {
            self.performRuleAction("field", targetId, fields[targetId]["action"]);
          }
        }
      });
    });
  },
  performRuleAction: function(type, targetId, action) {
    var target = null;
    if (type == "page") {
      target = this.getPageViewById(targetId);
    } else if (type == "field") {
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
    this.el.find("button.next").unbind().bind("click", function() {
      self.nextPage();
    });

    this.el.find("button.previous").unbind().bind("click", function() {
      self.prevPage();
    });

    this.el.find("button.saveDraft").unbind().bind("click", function() {
      self.saveToDraft();
    });
    this.el.find("button.submit").unbind().bind("click", function() {
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
    for (var i = 0, pageView; pageView = this.pageViews[i]; i++) {
      var pId = pageView.model.getPageId();
      if (pId == pageId) {
        return pageView;
      }
    }
    return null;
  },
  getFieldViewById: function(fieldId) {
    for (var i = 0, fieldView; fieldView = this.fieldViews[i]; i++) {
      var pId = fieldView.model.getFieldId();
      if (pId == fieldId) {
        return fieldView;
      }
    }
    return null;
  },
  checkPages: function() {
    if (this.pageNum === 0 && this.pageNum === this.pageCount - 1) {
      this.el.find(" button.previous").hide();
      this.el.find("button.next").hide();
      this.el.find("button.saveDraft").show();
      this.el.find(" button.submit").show();
      this.el.find("button").addClass('two_button');
    } else if (this.pageNum === 0) {
      this.el.find(" button.previous").hide();
      this.el.find("button.next").show();
      this.el.find("button.saveDraft").show();
      this.el.find(" button.submit").hide();
      this.el.find("button").addClass('two_button');
    } else if (this.pageNum === this.pageCount - 1) {
      this.el.find(" button.previous").show();
      this.el.find(" button.next").hide();
      this.el.find(" button.saveDraft").show();
      this.el.find(" button.submit").show();
      this.el.find("button").addClass('three_button');
    } else {
      this.el.find(" button.previous").show();
      this.el.find(" button.next").show();
      this.el.find(" button.saveDraft").show();
      this.el.find(" button.submit").hide();
      this.el.find("button").addClass('three_button');
    }
    if (this.readonly) {
      this.el.find("button.saveDraft").hide();
      this.el.find(" button.submit").hide();
    }

  },
  render: function() {

    // this.initWithForm(this.form, this.params);
    this.el.append(this.templates.buttons);
    this.rebindButtons();
    this.pageViews[0].show();
    this.checkPages();
    this.checkRules();
  },
  nextPage: function() {
    this.hideAllPages();
    this.pageViews[this.pageNum + 1].show();
    this.pageNum = this.pageNum + 1;
    this.checkPages();
  },
  prevPage: function() {
    this.hideAllPages();
    this.pageViews[this.pageNum - 1].show();
    this.pageNum = this.pageNum - 1;
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
          self.el.empty();
        }
      });
    });
  },
  saveToDraft: function() {
    var self = this;
    // if ($('.error').length > 0) {
    //   alert('Please resolve all field validation errors');
    //   return;
    // }
    this.populateFieldViewsToSubmission(function() {
      self.submission.saveDraft(function(err, res) {
        // console.log(err, res);
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
    var tmpObj = [];
    for (var i = 0, fieldView; fieldView = fieldViews[i]; i++) {
      var val = fieldView.value();
      var fieldId = fieldView.model.getFieldId();
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
    for (var i = 0, item; item = tmpObj[i]; i++) {
      var fieldId = item.id;
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
        if (count == 0) {
          cb();
        }
      });
    }
  },

  setInputValue: function(fieldId, value) {
    var self = this;
    for (var i = 0, item; item = this.fieldValue[i]; i++) {
      if (item.id == fieldId) {
        this.fieldValue.splice(i, 1);
      }
    }
    for (var i = 0, v; v = value[i]; i++) {
      this.fieldValue.push({
        id: fieldId,
        value: v
      });
    }

    console.log('INPUT VALUE SET', fieldId, value);
  }
});
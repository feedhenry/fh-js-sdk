PageView=BaseView.extend({

  viewMap: {
    "text": FieldTextView,
    "number": FieldNumberView,
    "textarea": FieldTextareaView,
    "radio": FieldRadioView,
    "checkboxes": FieldCheckboxView,
    "dropdown": FieldSelectView,
    "file": FieldFileView,
    "emailAddress": FieldEmailView,
    "phone": FieldPhoneView,
    "location": FieldGeoView,
    "photo": FieldCameraView,
    "signature": FieldSignatureView,
    "locationMap": FieldMapView,
    "dateTime":FieldDateTimeView,
    "sectionBreak":FieldSectionBreak,
    "url":FieldUrlView
  },
  templates : {
    pageTitle : '<div class="fh_appform_page_title"><%= pageTitle %></div>',
    pageDescription: '<div class="fh_appform_page_description"><%= pageDescription%></div>',
    section: '<div id="fh_appform_<%= sectionId %>" class="fh_appform_section_area"></div>'
  },

  initialize: function() {
    var self = this;
    _.bindAll(this, 'render',"show","hide");
    // Page Model will emit events if user input meets page rule to hide / show the page.
    this.model.on("visible",self.show);
    this.model.on("hidden",self.hide);
    // // pass visible event down to all fields
    // this.on('visible', function () {
    //   _(self.fieldViews).forEach(function (fieldView) {
    //         fieldView.trigger('visible');
    //   });
    // });
    this.render();
  },

  render: function() {
    var self = this;
    this.fieldViews = {};
    this.sectionViews = {};
    // all pages hidden initially
    this.$el.empty().addClass('fh_appform_page fh_appform_hidden');

    //Need to add the page title and description
//    this.$el.append(_.template(this.templates.pageTitle, {pageTitle: this.model.getName()}));
    this.$el.append(_.template(this.templates.pageDescription, {pageDescription: this.model.getDescription()}));

    // add to parent before init fields so validation can work
    this.options.parentEl.append(this.$el);

    var fieldModelList=this.model.getFieldModelList();

    var sections = this.model.getSections();

    if(sections != null){
      for(var sectionKey in sections){
        this.$el.append(_.template(this.templates.section, {"sectionId": sectionKey}));
      }

      //Add the section fields
      for(var sectionKey in sections){
        sections[sectionKey].forEach(function(field, index){
          var fieldType = field.getType();
          if (self.viewMap[fieldType]) {

            console.log("*- "+fieldType);

            self.fieldViews[field.get('_id')] = new self.viewMap[fieldType]({
              parentEl: self.$el,
              parentView: self,
              model: field,
              formView: self.options.formView,
              sectionName: sectionKey
            });
          } else {
            console.warn('FIELD NOT SUPPORTED:' + fieldType);
          }
        });
      }
    } else {
      fieldModelList.forEach(function (field, index) {
        var fieldType = field.getType();
        if (self.viewMap[fieldType]) {

          console.log("*- "+fieldType);

          self.fieldViews[field.get('_id')] = new self.viewMap[fieldType]({
            parentEl: self.$el,
            parentView: self,
            model: field,
            formView: self.options.formView
          });
        } else {
          console.warn('FIELD NOT SUPPORTED:' + fieldType);
        }
      });
    }
  },

  show: function () {
    var self = this;
    this.$el.removeClass('fh_appform_hidden');
  },

  hide: function () {
    this.$el.addClass('fh_appform_hidden');
  },

  showField: function (id) {
    // show field if it's on this page
    if (this.fieldViews[id]) {
      this.fieldViews[id].show();
    }
  },

  hideField: function (id) {
    // hide field if it's on this page
    if (this.fieldViews[id]) {
      this.fieldViews[id].hide();
    }
  },

  isValid: function () {
    // only validate form inputs on this page that are visible or type=hidden, or have validate_ignore class
    var validateEls = this.$el.find('.fh_appform_field_input').not('.validate_ignore]:hidden');
    return validateEls.length ? validateEls.valid() : true;
  },

  checkRules: function () {
    var self = this;
    var result = {};

    var rules = {
      SkipToPage: function (rulePasses, params) {
        var pageToSkipTo = params.Setting.Page;
        if (rulePasses) {
          result.skipToPage = pageToSkipTo;
        }
      }
    };

    // iterate over page rules, if any, calling relevant rule function
    _(this.model.get('Rules') || []).forEach(function (rule, index) {
      // get element that rule condition is based on
      var jqEl = self.$el.find('#Field' + rule.condition.FieldName + ',' + '#radioField' + rule.condition.FieldName);
      rule.fn = rules[rule.Type];
      if(jqEl.data("type") === 'radio') {
        var rEl = self.$el.find('#Field' + rule.condition.FieldName + '_' + index);
        rEl.wufoo_rules('exec', rule);
      } else {
        jqEl.wufoo_rules('exec', rule);
      }
    });

    return result;
  }

});
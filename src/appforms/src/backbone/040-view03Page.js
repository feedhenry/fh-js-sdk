var PageView=BaseView.extend({

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
    _.bindAll(self, 'render',"show","hide");
    // Page Model will emit events if user input meets page rule to hide / show the page.
    self.model.on("visible",self.show);
    self.model.on("hidden",self.hide);
    self.render();
  },

  render: function() {
    var self = this;
    self.fieldViews = {};
    self.sectionViews = {};
    // all pages hidden initially
    self.$el.empty().addClass('fh_appform_page fh_appform_hidden');

    //Need to add the page title and description
    self.$el.append(_.template(self.templates.pageDescription, {pageDescription: self.model.getDescription()}));

    // add to parent before init fields so validation can work
    self.options.parentEl.append(self.$el);

    var fieldModelList=self.model.getFieldModelList();

    var sections = self.model.getSections();

    if(sections != null){
      var sectionKey;
      for(sectionKey in sections){
        this.$el.append(_.template(self.templates.section, {"sectionId": sectionKey}));
      }

      //Add the section fields
      for(sectionKey in sections){
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
        if(!field) return;
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
    self.$el.removeClass('fh_appform_hidden');
    for(var fieldId in self.fieldViews){
      self.fieldViews[fieldId].refreshElements();
    }
  },

  hide: function () {
    var self = this;
    self.$el.addClass('fh_appform_hidden');
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
  }
});
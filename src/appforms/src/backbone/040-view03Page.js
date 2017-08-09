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
    "url":FieldUrlView,
    "barcode": FieldBarcodeView,
    "sliderNumber": FieldSliderNumberView,
    "readOnly": FieldReadOnlyView
  },
  templates : {
    pageTitle: '<div class="fh_appform_page_title text-center"><%= pageTitle %></div>',
    pageDescription: '<div class="fh_appform_page_description text-center"><h4><%= pageDescription%></h4></div>',
    section: ''
  },

  initialize: function(options) {
    this.options = options;
    var self = this;
    _.bindAll(this, 'render',"show","hide");
    // Page Model will emit events if user input meets page rule to hide / show the page.
    this.model.on("visible",self.show);
    this.model.on("hidden",self.hide);
    this.render();
  },

  render: function() {
    var self = this;
    this.fieldViews = {};
    this.sectionViews = {};
    // all pages hidden initially
    this.$el.empty().addClass('fh_appform_page fh_appform_hidden col-xs-12');

    // add to parent before init fields so validation can work
    this.options.parentEl.append(this.$el);

    var fieldModelList=this.model.getFieldModelList();

    var sections = this.model.getSections();

    function toggleSection(fieldTarget){
      if(fieldTarget){
        $('#' + fieldTarget).slideToggle(600);
        $('#' + fieldTarget + "_icon").toggleClass('icon-chevron-sign-up');
        $('#' + fieldTarget + "_icon").toggleClass('icon-chevron-sign-down');
      }
    }

    if(sections != null){
      var sectionKey;
      var index = 0;

      var sectionGroup = $('<div class="panel-group" id="accordion"></div>');


      //Add the section fields
      for(sectionKey in sections){

        var sectionView = new SectionView({
          model: self.model,
          parentEl: sectionGroup,
          formView: self.options.formView,
          sectionKey: sectionKey,
          title: sections[sectionKey].title,
          description: sections[sectionKey].description,
          index: index,
          repeating: sections[sectionKey].repeating,
          minRepeat: sections[sectionKey].minRepeat,
          maxRepeat: sections[sectionKey].maxRepeat,
          fields: sections[sectionKey].fields,
          parentView: self
        });

        index++;
      }

      this.$el.append(sectionGroup);
    } else {
      fieldModelList.forEach(function (field, index) {
        if(!field) {
          return;
        }
        var fieldType = field.getType();
        if (self.viewMap[fieldType]) {

          $fh.forms.log.l("*- "+fieldType);

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

  expandSection: function(fieldId, sectionIndex){
    var sections = this.model.getSections();
    var sectionFound = false;
    var sectionId = "";
    for(var sectionKey in sections){
      sections[sectionKey].fields.forEach(function(field, index){
        if(field.get("_id") === fieldId){
          sectionFound = true;
          sectionId = sectionKey;
        }
      });
    }

    if(sectionFound){
      var sectionIdentifier = sectionId + (sectionIndex >= 0 ? ('_' + sectionIndex) : '');
      $("#fh_appform_" + sectionIdentifier + "_body").slideDown(20);
      $("#fh_appform_" + sectionIdentifier + "_body_icon").removeClass('icon-minus');

      if(!$("#fh_appform_" + sectionIdentifier + "_body_icon").hasClass('icon-plus')){
         $("#fh_appform_" + sectionIdentifier + "_body_icon").addClass('icon-plus');
      }
    }
  },

  show: function () {
    var self = this;
    self.$el.show();

    for(var fieldViewId in self.fieldViews){
      if(self.fieldViews[fieldViewId].mapResize){
        self.fieldViews[fieldViewId].mapResize();
      }
    }
  },

  hide: function () {

    this.$el.hide();
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

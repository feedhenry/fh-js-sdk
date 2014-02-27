var FieldView = Backbone.View.extend({

  className: 'fh_appform_field_area',
  errMessageContainer: ".fh_appform_errorMsg",
  requiredClassName: "fh_appform_field_required",
  errorClassName: "fh_appform_error",
  addInputButtonClass: ".fh_appform_addInputBtn", //TODO Need to remove hard-coded strings for these names
  removeInputButtonClass: ".fh_appform_removeInputBtn",
  fieldWrapper: '<div class="fh_appform_input_wrapper"></div>',
  input: "<input class='fh_appform_field_input' data-field='<%= fieldId %>' data-index='<%= index %>' type='<%= inputType %>' />",
  inputTemplate: "<div id='wrapper_<%= fieldId %>_<%= index %>' style='width:100%;margin-top: 10px;'> <div class='<%= required %> fh_appform_field_title fh_appform_field_numbering'> <%=index + 1%>.  </div> <div class='fh_appform_field_input_container' style='display: inline-block;float: right;width: 80%;margin-right:15px'>  <%= inputHtml %> <div class='fh_appform_errorMsg fh_appform_hidden' style='border-radius: 5px;margin-top: 5px;'></div>  </div><br style='clear:both'/>    </div>",


  fh_appform_fieldActionBar: "<div class='fh_appform_fieldActionBar' style='text-align: right;'><button class='fh_appform_removeInputBtn special_button fh_appform_button_action'>-</button><button class='special_button fh_appform_addInputBtn fh_appform_button_action'>+</button></div>",
  title: '<label class="fh_appform_field_title"><%= title %> </label>',
  instructions: '<p class="fh_appform_field_instructions"><%= helpText %></p>',
  events: {
    "change": "contentChanged",
    "blur input,select,textarea": "validate",
    "click .fh_appform_addInputBtn": "onAddInput",
    "click .fh_appform_removeInputBtn": "onRemoveInput"
  },
  refreshElements: function(){
    console.log("Refreshing Field Elements");
  },
  onAddInput: function() {
    this.addElement();
    this.checkActionBar();
  },
  onRemoveInput: function() {
    this.removeElement();
    this.checkActionBar();
  },
  checkActionBar: function() {
    var curNum = this.curRepeat;
    var maxRepeat = this.maxRepeat;
    var minRepeat = this.initialRepeat;
    if (curNum < maxRepeat) {
      this.$fh_appform_fieldActionBar.find(this.addInputButtonClass).show();
    } else {
      this.$fh_appform_fieldActionBar.find(this.addInputButtonClass).hide();
    }

    if (curNum > minRepeat) {
      this.$fh_appform_fieldActionBar.find(this.removeInputButtonClass).show();
    } else {
      this.$fh_appform_fieldActionBar.find(this.removeInputButtonClass).hide();
    }
  },
  removeElement: function() {
    var curRepeat = this.curRepeat;
    var lastIndex = curRepeat - 1;
    this.getWrapper(lastIndex).remove();
    this.curRepeat--;
  },
  renderTitle: function() {
    var name = this.model.getName();
    var title = name;
    return _.template(this.title, {
      "title": title
    });
  },
  renderInput: function(index) {
    var fieldId = this.model.getFieldId();
    var type = this.type || "text";
    return _.template(this.input, {
      "fieldId": fieldId,
      "index": index,
      "inputType": type
    });
  },
  "getFieldRequired" : function(index){
    var required = "";
    if (this.initialRepeat > 1) {
      if (index < this.initialRepeat) {
        required = this.requiredClassName;
      }
    } else {
      if (this.model.isRequired()) {
        required = this.requiredClassName;
      }
    }
    if (this.model.isRequired() && index < this.initialRepeat) {
      required = this.requiredClassName;
    }
    return required;
  },
  renderEle: function(titleHtml, inputHtml, index) {
    var fieldId = this.model.getFieldId();

    return _.template(this.inputTemplate, {
      "fieldId": fieldId,
      "index": index,
      "inputHtml": inputHtml,
      "required": this.getFieldRequired(index)
    });
  },
  renderHelpText: function() {
    var helpText = this.model.getHelpText();

    if(typeof helpText == "string" && helpText.length > 0){
      return _.template(this.instructions, {
        "helpText": helpText
      });
    } else {
      return "";
    }

  },
  addElement: function() {
    var self = this;
    var index = self.curRepeat;
    var inputHtml = self.renderInput(index);
    var eleHtml = self.renderEle("", inputHtml, index);
    self.$fieldWrapper.append(eleHtml);
    self.curRepeat++;
    self.onElementShow(index);
  },
  onElementShow: function(index) {
    console.log("Show done for field " + index);
  },
  render: function() {
    var self = this;
    self.initialRepeat = 1;
    self.maxRepeat = 1;
    self.curRepeat = 0;

    self.$fieldWrapper.append(self.renderTitle());
    self.$fieldWrapper.append(self.renderHelpText());

    if (self.model.isRepeating()) {
      self.initialRepeat = self.model.getMinRepeat();
      self.maxRepeat = self.model.getMaxRepeat();
    }
    for (var i = 0; i < this.initialRepeat; i++) {
      self.addElement();
    }

    self.$el.append(self.$fieldWrapper);
    self.$el.append(self.$fh_appform_fieldActionBar);
    self.$el.attr("data-field", self.model.getFieldId());


    if(self.options.sectionName){
      //This field belongs to a section
      self.options.parentEl.find('#fh_appform_' + self.options.sectionName).append(self.$el);
    } else {
      self.options.parentEl.append(self.$el);
    }

    self.show();

    // force the element to be initially hidden
    if (self.$el.hasClass("hide")) {
      self.hide(true);
    }
    // populate field if Submission obj exists
    var submission = self.options.formView.getSubmission();
    if (submission) {
      self.submission = submission;
      self.submission.getInputValueByFieldId(self.model.get('_id'), function(err, res) {
        //console.log(err, res);
        self.value(res);
      });
    }
    self.checkActionBar();
    self.onRender();
  },
  onRender: function() {

  },
  initialize: function() {
    _.bindAll(this, 'dumpContent', 'clearError', 'onAddInput', 'onRemoveInput');

    this.$fieldWrapper = $(this.fieldWrapper);
    this.$fh_appform_fieldActionBar = $(this.fh_appform_fieldActionBar);
    // only call render once. model will never update
    this.render();
  },

  dumpContent: function() {
    console.log("Value changed :: " + JSON.stringify(this.value()));
  },

  getTopView: function() {
    var view = this.options.parentView;
    var parent;
    do {
      parent = view.options.parentView;
      if (parent) {
        view = parent;
      }
    } while (parent);
    return view;
  },

  validate: function(e) {
    if (!$fh.forms.config.get("studioMode")) {
      var self = this;
      var target = $(e.target);
      var index = target.data().index;
      var val = self.valueFromElement(index);
      var fieldId = self.model.getFieldId();
      this.model.validate(val, function(err, res) { //validation
        if (err) {
          console.error(err);
        } else {
          var result = res["validation"][fieldId];
          if (!result.valid) {
            var errorMessages = result.errorMessages.join(", ");
            self.setErrorText(index, errorMessages);
          } else {
            self.clearError(index);
          }
        }
      });
      self.trigger("checkrules");
    }
  },
  setErrorText: function(index, text) {
    var wrapperObj = this.getWrapper(index);
    wrapperObj.find(this.errMessageContainer).text(text);
    wrapperObj.find(this.errMessageContainer).show();
    wrapperObj.find(this.errMessageContainer).addClass(this.errorClassName);
    wrapperObj.find("input,textarea,select").addClass(this.errorClassName);
  },
  contentChanged: function(e) {
    this.validate(e);
  },
  isRequired: function() {
    return this.model.isRequired();
  },
  // force a hide , defaults to false
  hide: function(force) {
    if (force || this.$el.is(':visible')) {
      this.$el.hide();
    }
  },
  renderButton: function(index, label, extension_type) {
    var button = $('<button>');
    button.addClass('special_button fh_appform_button_action');
    button.addClass(extension_type);
    button.attr("data-index", index);
    button.html(' ' + label);

    return this.htmlFromjQuery(button);
  },
  //deprecated
  addButton: function(input, extension_type, label) {
    var self = this;
    var button = $('<button>');
    button.addClass('special_button fh_appform_button_action');
    button.addClass(extension_type);
    button.html(' ' + label);


    button.click(function(e) {
      self.action(this);
      e.preventDefault();
      return false;
    });

    input.append(button);
    return button;
  },

  show: function() {
    if (!this.$el.is(':visible')) {
      this.$el.show();
      // add rules too
      //this.addRules();
      //set the form value from model
      //this.value(this.model.serialize());
    }
  },

  defaultValue: function() {
    var defaultValue = {};
    defaultValue[this.model.get('_id')] = this.model.get('DefaultVal');
    return defaultValue;
  },
  htmlFromjQuery: function(jqObj) {
    return $('<div>').append(jqObj.clone()).html();
  },
  // Gets or Set the value for this field
  // set value should be an array which contains repeated value for this field.
  value: function(value) {
    var self = this;
    if (value && !_.isEmpty(value)) {
      self.valuePopulate(value);
    }
    return self.getValue();
  },
  getValue: function() {
    var value = [];
    var repeatNum = this.curRepeat;
    for (var i = 0; i < repeatNum; i++) {
      value[i] = this.valueFromElement(i);
    }
    return value;
  },
  valueFromElement: function(index) {
    var wrapperObj = this.getWrapper(index);
    return wrapperObj.find("input,select,textarea").val() || "";
  },
  valuePopulate: function(value) {
    var number = value.length;
    while (number > this.curRepeat) {
      this.addElement();
    }

    for (var i = 0; i < value.length; i++) {
      var v = value[i];
      this.valuePopulateToElement(i, v);
    }
  },
  valuePopulateToElement: function(index, value) {
    var wrapperObj = this.getWrapper(index);
    wrapperObj.find("input,select,textarea").val(value);
  },
  getWrapper: function(index) {
    var fieldId = this.model.getFieldId();
    return this.$fieldWrapper.find("#wrapper_" + fieldId + "_" + index);
  },
  fillArray: function(array, filler) {
    for (var i = 0; i < array.length; i++) {
      if (!array[i]) {
        array[i] = filler;
      }
    }
  },

  clearError: function(index) {
    var wrapperObj = this.getWrapper(index);
    wrapperObj.find(this.errMessageContainer).hide();
    wrapperObj.find("." + this.errorClassName).removeClass(this.errorClassName);
  }

});
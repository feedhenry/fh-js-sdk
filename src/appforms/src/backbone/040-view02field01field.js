var FieldView = Backbone.View.extend({

    className: 'fh_appform_field_area col-xs-12',
    errMessageContainer: ".fh_appform_field_error_container",
    requiredClassName: "fh_appform_field_required",
    errorClassName: "fh_appform_field_error",
    repeatingClassName: "repeating",
    nonRepeatingClassName: "non_repeating",
    addInputButtonClass: ".fh_appform_addInputBtn",
    removeInputButtonClass: ".fh_appform_removeInputBtn",
    fieldWrapper: '<div class="fh_appform_input_wrapper"></div>',
    input: "<input class='fh_appform_field_input <%= repeatingClassName%> col-xs-12' data-field='<%= fieldId %>' data-index='<%= index %>' value='<%= value %>' type='<%= inputType %>' />",
    fieldIconNames: {
      text: "icon-font",
      textarea: "icon icon-align-justify",
      url: "icon-link",
      number: "icon-number",
      emailAddress: "icon-envelope-alt",
      dropdown: "icon-caret-down",
      checkboxes: "icon-check",
      location: "icon-location-arrow",
      locationMap: "icon-map-marker",
      photo: "icon-camera",
      signature: "icon-pencil",
      file: "icon-cloud-upload",
      dateTime: "icon-calendar",
      sectionBreak: "icon-minus",
      radio: "icon-circle-blank",
      barcode: "icon-barcode",
      sliderNumber: "icon-number",
      readOnly: "icon-comment"
    },
    events: {
        "change": "contentChanged",
        "blur input,select,textarea": "validate",
        "click .fh_appform_addInputBtn": "onAddInput",
        "click .fh_appform_removeInputBtn": "onRemoveInput"
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
    renderInput: function(index) {
        var fieldId = this.model.getFieldId();
        var type = this.getHTMLInputType();
        var repeatingClassName = this.model.isRepeating() ? this.repeatingClassName : this.nonRepeatingClassName;

        var inputEle = _.template(this.input);
        inputEle = inputEle({
              "fieldId": fieldId,
              "index": index,
              "inputType": type,
              "repeatingClassName": repeatingClassName,
              "value":this.model.getDefaultValue()
          });

        return $(inputEle);
    },
    getHTMLInputType: function() {
        return this.type || "text";
    },
    /**
    * Repeating fields can have required and non-required repeating inputs depending on the minRepeat and maxRepeat values defined for the field
    **/
    getFieldRequired: function(index) {
        var required = "";
        if(this.model.isRequired()){
            if(index < this.initialRepeat){
                required = this.requiredClassName;
            } else {

            }
        } else {

        }
        return required;
    },
    addElement: function() {
        var self = this;
        var index = this.curRepeat;
        var inputHtml = this.renderInput(index);

        var eleTemplate = _.template(self.options.formView.$el.find("#temp_field_wrapper").html());
        eleTemplate = eleTemplate({
            index: index,
            d_index: index + 1,
            required: this.model.isRequired() ? self.requiredClassName : "",
            fieldId: this.model.getFieldId(),
            repeating: this.model.isRepeating()
        });

        eleTemplate = $(eleTemplate);
        eleTemplate.find('.fh_appform_field_input_container').prepend(inputHtml);

        this.$fieldWrapper.append(eleTemplate);
        this.curRepeat++;
        this.onElementShow(index);
    },
    onElementShow: function(index) {
        $fh.forms.log.d("Show done for field " + index);
    },
    render: function() {
        var self = this;
        this.initialRepeat = 1;
        this.maxRepeat = 1;
        this.curRepeat = 0;

        var fieldTemplate = _.template(self.options.formView.$el.find("#temp_field_structure").html());
        fieldTemplate = fieldTemplate({
            title: this.model.getName(),
            helpText: this.model.getHelpText(),
            required: this.model.isRequired() ? self.requiredClassName : "",
            repeating: this.model.isRepeating(),
            field_icon: this.fieldIconNames[this.model.getType()],
            icon_content: this.model.getType() === "number" ? 123 : ""
        });


        fieldTemplate = $(fieldTemplate);

        this.$fieldWrapper = $(fieldTemplate[0]);
        this.$fh_appform_fieldActionBar = $(fieldTemplate[1]);

        if(this.readonly){
            this.$fh_appform_fieldActionBar.hide();
        }

        if (this.model.isRepeating()) {
            this.initialRepeat = this.model.getMinRepeat();
            this.maxRepeat = this.model.getMaxRepeat();
        }

        for (var i = 0; i < this.initialRepeat; i++) {
            this.addElement();
        }

        this.$el.append(fieldTemplate);
        this.$el.attr("data-field", this.model.getFieldId());

        this.options.parentEl.append(this.$el);

        // force the element to be initially hidden
        if (this.$el.hasClass("hide")) {
            this.hide(true);
        }
        // populate field if Submission obj exists
        var submission = this.options.formView.getSubmission();
        if (submission) {
            this.submission = submission;
            this.submission.getInputValueByFieldId(this.model.get('_id'), function(err, res) {
                self.value(res);
            });
        }


        this.show();
        this.checkActionBar();
        this.onRender();
    },
    onRender: function() {

    },
    // TODO: cache the input element lookup?
    initialize: function(options) {
        this.options = options;
        this.readonly = options.formView.readonly;
        _.bindAll(this, 'dumpContent', 'clearError', 'onAddInput', 'onRemoveInput', 'contentChanged');


        this.render();
    },

    dumpContent: function() {
        $fh.forms.log.d("Value changed :: " + JSON.stringify(this.value()));
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
    validate: function () {},
    validateElement: function(index, element, cb) {
        var self = this;
        var fieldId = self.model.getFieldId();
        self.model.validate(element, index, function(err, res) {
            if (err) {
                self.setErrorText(index, "Error validating field: " + err);
                if (cb) {
                    cb(err);
                }
            } else {
                var result = res["validation"][fieldId];
                if (!result.valid) {
                    var errorMessages = result.errorMessages.join(", ");
                    self.setErrorText(index, errorMessages);
                    if (cb) {
                        cb(errorMessages);
                    }
                } else {
                    self.clearError(index);
                    if (cb) {
                        cb();
                    }
                }
            }
        });
    },
    setValueToSubmission: function(params, cb) {
        var self = this;
        //Adding the field value to the submission.
        self.options.formView.addFieldInputValue(params, cb);
    },
    removeValueFromSubmission: function(params) {
        this.options.formView.removeFieldInputValue(params);
    },
    setErrorText: function(index, text) {
        var wrapperObj = this.getWrapper(index);
        wrapperObj.find(this.errMessageContainer).text(text);
        wrapperObj.find(this.errMessageContainer).show();
        wrapperObj.find(this.errMessageContainer).addClass(this.errorClassName);

        if(wrapperObj.find("input[type='checkbox']").length === 0){
            wrapperObj.find("input,textarea,select").addClass(this.errorClassName);
        }
    },
    //The content of the field has changed, ensure the new value is persisted to the submission
    contentChanged: function(e) {
        var self = this;
        e.preventDefault();
        self.options.formView.markFormEdited();
        var currentTarget = $(e.currentTarget);
        var target = $(e.target);
        var index = currentTarget.data().index || target.data().index;
        var val = self.valueFromElement(index);

        self.validateElement(index, val);

        self.updateOrRemoveValue({
            index: index,
            value: val,
            isStore: true,
            fieldId: self.model.getFieldId()
        }, function() {
            //Value has been persisted, now check for any rule changes.
            self.checkRules();
        });
    },

    checkRules: function() {
        this.trigger('checkrules');
    },

    updateOrRemoveValue: function(params, cb) {
        var self = this;
        //Ensuring that if the field value was removed from the element, that it is removed from the submission also
        if(!params.value) {
            self.removeValueFromSubmission(params);
            return cb();
        } else {
            self.setValueToSubmission(params, cb);
        }
    },

    isRequired: function() {
        return this.model.isRequired();
    },

    // force a hide , defaults to false
    hide: function(force) {
        this.$el.hide();
    },
    renderButton: function(index, label, extension_type) {
        var button = $('<button>');
        button.addClass('special_button fh_appform_button_action col-xs-12');
        button.addClass(extension_type);
        button.attr("data-index", index);
        button.html(' ' + label);

        return this.htmlFromjQuery(button);
    },
    //deprecated
    addButton: function(input, extension_type, label) {
        var self = this;
        var button = $('<button>');
        button.addClass('special_button fh_appform_button_action col-xs-12');
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
        this.$el.show();
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
            if(v !== null && typeof(v) !== "undefined"){
              this.valuePopulateToElement(i, v);
            }
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

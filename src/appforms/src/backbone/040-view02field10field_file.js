FieldFileView = FieldView.extend({
    input: "<button data-field='<%= fieldId %>' class='special_button fh_appform_button_action select col-xs-12' data-index='<%= index %>'  type='<%= inputType %>'><i class='icon-folder-openSelect'></i> A File</button>" +
        "<button data-field='<%= fieldId %>' class='special_button fh_appform_button_action remove col-xs-12' data-index='<%= index %>'  type='<%= inputType %>'><i class='icon-remove-circle'></i>&nbsp;Remove File Entry</button>" +
        "<input class='fh_appform_field_input' data-field='<%= fieldId %>' data-index='<%= index %>' type='<%= inputType %>' style=''/>",
    type: "file",
    initialize: function() {
        var self = this;

        self.fileObjs = [];
        FieldView.prototype.initialize.apply(self, arguments);
    },
    //The file has changed, make sure the file is validated and saved to the submission.
    contentChanged: function(e) {
        var self = this;
        var fileEle = e.target;
        var filejQ = $(fileEle);
        var index = filejQ.data().index;
        var file = fileEle.files ? fileEle.files[0] : null;
        var sectionIndex = self.options.sectionIndex;

        self.updateOrRemoveValue({
            fieldId: self.model.getFieldId(),
            value: file,
            isStore: true,
            index: index,
            sectionIndex:sectionIndex
        }, function() {
          self.checkRules();
          if (file) {
            self.validateAndUpdateButtons(index, file);
          } else { //user cancelled file selection
            self.showButton(index, null);
          }
        });
    },
    validateAndUpdateButtons: function(index, file) {
      var self = this;
      self.validateElement(index, file, function(err) {
        //File Needs to be validated.
        if (!err) { //Validation of file is valid
          var fileObj = {
            "fileName": file.name,
            "fileSize": file.size,
            "fileType": file.type
          };
          self.showButton(index, fileObj);
        } else {
          filejQ.val("");
          self.showButton(index, null);
        }
      });
    },
    valueFromElement: function(index) {
        var wrapperObj = this.getWrapper(index);
        var fileEle = wrapperObj.find(".fh_appform_field_input")[0];
        if (fileEle.files && fileEle.files.length > 0) { //new file
            return fileEle.files[0];
        } else { //sandboxed file
            return this.fileObjs[index];
        }
    },
    showButton: function(index, fileObj) {
        var self = this;
        var wrapperObj = this.getWrapper(index);
        var button = wrapperObj.find("button.select");
        var button_remove = wrapperObj.find("button.remove");
        var fileEle = wrapperObj.find(".fh_appform_field_input");

        button.show();

        if (fileObj == null) {
            button.text("Select A File");
            button_remove.hide();
        } else {
            button.text(fileObj.fileName + "(" + fileObj.fileSize + ")");
            button_remove.show();
        }

        if (this.readonly) {
            button_remove.hide();
        }

        //Some operating systems do not support opening a file select browser
        //http://viljamis.com/blog/2012/file-upload-support-on-mobile/
        if (navigator.userAgent.match(/(Android (1.0|1.1|1.5|1.6|2.0|2.1))|(Windows Phone (OS 7|8.0))|(XBLWP)|(ZuneWP)|(w(eb)?OSBrowser)|(webOS)|(Kindle\/(1.0|2.0|2.5|3.0))/)) {
            //If not supported, show a warning on-device. There is also a warning in the studio when creating the form.
           $(button).text("File upload not supported");
           $(button).attr("disabled", true);
           button.off("click");
         }

        button_remove.off("click");
        button_remove.on("click", function() {
            var index = $(this).data().index;
            if (self.fileObjs && self.fileObjs[index]) {
                self.fileObjs[index] = null;
            }
            self.resetFormElement(fileEle);
            self.showButton(index, null); // remove file entry
        });

    },
    resetFormElement: function(e) {
        e.wrap("<form>").closest("form").get(0).reset();
        e.unwrap();
    },
    valuePopulateToElement: function(index, value) {
        if (value) {
            this.fileObjs[index] = value;
            this.showButton(index, value);
        }
    },
    onElementShow: function(index) {
        this.showButton(index, null);
    }
});
FieldFileView = FieldView.extend({
    input: "<button data-field='<%= fieldId %>' class='special_button fh_appform_button_action select' data-index='<%= index %>'  type='<%= inputType %>'>Select A File</button>" +
            "<button data-field='<%= fieldId %>' class='special_button fh_appform_button_action remove' data-index='<%= index %>'  type='<%= inputType %>'><i class='fa fa-times-circle'></i>&nbsp;Remove File Entry</button>" +
            "<input class='fh_appform_field_input' data-field='<%= fieldId %>' data-index='<%= index %>' type='<%= inputType %>'/>",
        type: "file",
    initialize: function() {
        var self = this;

        self.fileObjs = [];
        FieldView.prototype.initialize.apply(self, arguments);
    },
    contentChanged: function(e) {
        var self = this;
        var fileEle = e.target;
        var filejQ = $(fileEle);
        var index = filejQ.data().index;
        var file = fileEle.files ? fileEle.files[0] : null;
        if (file) {
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
        } else { //user cancelled file selection
            self.showButton(index, null);
        }

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

        button.off("click");
        button.on("click", function() {
            var index = $(this).data().index;
            fileEle.click();
        });

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
FieldFileView = FieldView.extend({
  input: "<button style='display:none' data-field='<%= fieldId %>' class='special_button fh_appform_button_action' data-index='<%= index %>'></button>" +
    "<input data-field='<%= fieldId %>' data-index='<%= index %>' type='<%= inputType %>'/>",
  type: "file",
  // dumpContent: function() {
  //   var tmp = "<empty>";
  //   if (this.fileData) {
  //     var size = this.fileData.fileBase64.length + " bytes";
  //     if (this.fileData.fileBase64.length > 1024) {
  //       size = (Math.floor((this.fileData.fileBase64.length / 1024) * 1000) / 1000) + " Kilo bytes";
  //     }
  //     tmp = {
  //       content_type: this.fileData.content_type,
  //       filename: this.fileData.filename,
  //       size: size
  //     };
  //   }
  //   console.debug("Value changed :: " + JSON.stringify(tmp));
  // },
  initialize:function(){
    this.fileObjs=[];
    FieldView.prototype.initialize.apply(this,arguments);
  },
  // validate: function(e) {
  //   if (App.config.validationOn) {
  //     this.trigger("checkrules");
  //   }
  // },
  contentChanged: function(e) {

    var self = this;
    var fileEle =e.target;
    var filejQ=$(fileEle);
    var index =filejQ.data().index;
    var file =fileEle.files? fileEle.files[0]:null;
    if (file) {
      var fileObj = {
        "fileName": file.name,
        "fileSize": file.size,
        "fileType": file.type
      };
      self.showButton(index, fileObj);
    }else{ //user cancelled file selection
      self.showFile(index);
    }

  },


  valueFromElement: function(index) {
    var wrapperObj = this.getWrapper(index);
    var fileEle = wrapperObj.find("input[type='file']")[0];
    if (fileEle.files && fileEle.files.length > 0) { //new file
      return fileEle.files[0];
    } else { //sandboxed file
      return this.fileObjs[index];
    }
  },
  showButton: function(index, fileObj) {
    var wrapperObj = this.getWrapper(index);
    var button = wrapperObj.find("button");
    var fileEle = wrapperObj.find("input[type='file']");
    fileEle.hide();
    button.show();
    button.text(fileObj.fileName + "(" + fileObj.fileSize + ")");
    button.off("click");
    button.on("click", function() {
      var index = $(this).data().index;
      fileEle.click();
    });
  },
  showFile: function(index) {
    var wrapperObj = this.getWrapper(index);
    var button = wrapperObj.find("button");
    var fileEle = wrapperObj.find("input[type='file']");
    button.off("click");
    button.hide();
    fileEle.show();
    if (this.fileObjs[index]) {
      this.fileObjs[index] = null;
    }
  },
  valuePopulateToElement: function(index, value) {
    if (value) {
      this.fileObjs[index] = value;
      this.showButton(index, value);
    }
  }
});
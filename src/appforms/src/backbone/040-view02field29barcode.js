FieldBarcodeView = FieldView.extend({
  type: "barcode",
  input: "<button data-field='<%= fieldId %>' class='special_button fh_appform_button_action select col-xs-12' data-index='<%= index %>'  type='<%= inputType %>'>Scan Barcode</button>" +
    "<button data-field='<%= fieldId %>' class='special_button fh_appform_button_action remove col-xs-12' data-index='<%= index %>'  type='<%= inputType %>'><i class='icon-remove-circle'></i>&nbsp;Remove Barcode Entry</button>" +
    "<input class='fh_appform_field_input col-xs-12' data-field='<%= fieldId %>' data-index='<%= index %>' data-bfield='text' type='text' placeholder='Barcode Value' style='margin-top:5px' disabled/>" +
    "<input class='fh_appform_field_input col-xs-12' data-field='<%= fieldId %>' data-index='<%= index %>' data-bfield='format' type='text' placeholder='Barcode Format' style='margin-top:5px' disabled/>",
  initialize: function() {
    var self = this;

    self.barcodeObjects = [];
    FieldView.prototype.initialize.apply(self, arguments);
  },
  contentChanged: function(e) {
    var self = this;
    e.preventDefault();
    var inputTarget = $(e.target);
    var index = inputTarget.data('index');
    var wrapperObj = self.getWrapper(index);
    var barcodeTextEle = wrapperObj.find("input[data-bfield='text']");
    var barcodeFormatEle = wrapperObj.find("input[data-bfield='format']");

    var result = {
      text: barcodeTextEle.val(),
      format: barcodeFormatEle.val()
    };

    //Dont need to do anything when the content changes.
    self.barcodeObjects[index] = result;
    self.validateElement(index, result);
  },
  valueFromElement: function(index) {
    var self = this;
    return self.barcodeObjects[index] || {};
  },
  showButton: function(index, barcodeObject) {
    var self = this;
    var wrapperObj = self.getWrapper(index);
    var button = wrapperObj.find("button.select");
    var button_remove = wrapperObj.find("button.remove");


    var barcodeTextEle = wrapperObj.find("input[data-bfield='text']");
    var barcodeFormatEle = wrapperObj.find("input[data-bfield='format']");

    //If it is not a phonegap application, then the scan barcode button should not be shown
    if(!self.model.utils.isPhoneGapCamAvailable()){
      //Show the input text fields only instead. The user is allowed to enter values manually.
      wrapperObj.find("input[data-bfield='text']").attr("disabled", false);
      wrapperObj.find("input[data-bfield='format']").attr("disabled", false);
      button.text("Barcode Scanning Not Available");
      button.attr('disabled', true);
      button_remove.hide();
      return;
    }

    button.show();

    if (barcodeObject == null) {
      button_remove.hide();
    } else {
      barcodeTextEle.val(barcodeObject.text);
      barcodeFormatEle.val(barcodeObject.format);
      button_remove.show();
    }

    if (this.readonly) {
      button.hide();
      button_remove.hide();
    }

    button_remove.off('click');

    button_remove.on('click', function(e){
      var index = $(e.target).data('index');
      self.removeBarcode(index);
    });

    button.off('click');

    if(self.model.utils.isPhoneGapCamAvailable()){
      button.on('click', function(e) {
        self.scanBarcode(e, index);
      });
    }
  },
  removeBarcode: function(index){
    var self = this;

    if(typeof(index) === "number"){
      self.barcodeObjects[index] = null;
      var wrapperObj = self.getWrapper(index);
      wrapperObj.find("input[data-bfield='text']").val("");
      wrapperObj.find("input[data-bfield='format']").val("");
      self.showButton(index, null);
    } else {
      $fh.forms.log.e("Error: No index when removing barcode element");
    }
  },
  //Scanning a barcode from the device.
  scanBarcode: function(e, index){
    var self = this;
    $fh.forms.log.d("Scanning barcode");

    //Capturing a barcode using a phonegap plugin.
    function phonegapBarcode(){
      self.model.utils.captureBarcode({}, function(err, result){
        if(err){
          $fh.forms.log.e("Error scanning barcode: " + err);
          self.showButton(index, null);
        } else if(result.text && result.format){
          $fh.forms.log.d("Got Barcode Result: " + JSON.stringify(result));
          self.barcodeObjects[index] = {
            text: result.text.toString(),
            format: result.format.toString()
          };

          self.showButton(index,  self.barcodeObjects[index]);
        } else {
          $fh.forms.log.d("Barcode Scan Cancelled: " + JSON.stringify(result));
          self.showButton(index, null);
        }
      });
    }

    //Capturing a barcode using a webcam and processing
    function webBarcode(){

      //Web barcode decoding is not currently supported.
      //Using A Navigator Alert If Available.
      $fh.forms.backbone.alert("Barcode Decoding Only Available On-Device");

      $fh.forms.log.e("Web barcode decoding not currently supported");
    }


    //Checking for phonegap. This will try to use the plugin if it is available.
    if(self.model.utils.isPhoneGapCamAvailable()){
      phonegapBarcode();
    } else {
      webBarcode();
    }
  },
  valuePopulateToElement: function(index, value) {
    var self = this;
    if (value) {
      self.barcodeObjects[index] = value;
      self.showButton(index, value);
    }
  },
  onElementShow: function(index) {
    this.showButton(index, null);
  }
});
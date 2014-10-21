FieldBarcodeView = FieldView.extend({
  type: "barcode",
  input: "<button data-field='<%= fieldId %>' class='special_button fh_appform_button_action select col-xs-12' data-index='<%= index %>'  type='<%= inputType %>'>Scan Barcode</button>" +
    "<button data-field='<%= fieldId %>' class='special_button fh_appform_button_action remove col-xs-12' data-index='<%= index %>'  type='<%= inputType %>'><i class='icon-remove-circle'></i>&nbsp;Remove Barcode Entry</button>" +
    "Barcode <input class='fh_appform_field_input' data-field='<%= fieldId %>' data-index='<%= index %>' data-bfield='text' type='text' disabled/>" +
    "Format <input class='fh_appform_field_input' data-field='<%= fieldId %>' data-index='<%= index %>' data-bfield='format' type='text' disabled/>",
  initialize: function() {
    var self = this;

    self.barcodeObjects = [];
    FieldView.prototype.initialize.apply(self, arguments);
  },
  contentChanged: function(e) {
    //Dont need to do anything when the content changes.
  },
  valueFromElement: function(index) {
    var self = this;
    return self.barcodeObjects[index] || {};
  },
  showButton: function(index, barcodeObject) {
    var self = this;
    var wrapperObj = this.getWrapper(index);
    var button = wrapperObj.find("button.select");
    var button_remove = wrapperObj.find("button.remove");


    var barcodeTextEle = wrapperObj.find("input[data-bfield='text']")[0];
    var barcodeFormatEle = wrapperObj.find("input[data-bfield='format']")[0];

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
    button.off('click');
    button.on('click', function(e) {
      self.scanBarcode(e, index);
    });

  },
  //Scanning a barcode from the device.
  scanBarcode: function(e, index){
    var self = this;
    $fh.forms.log.d("Scanning barcode");

    self.model.utils.captureBarcode({}, function(err, result){
      if(err){
        $fh.forms.log.e("Error scanning barcode: " + err);
        self.showButton(index, null);
      } else if(result.text && result.format){
        $fh.forms.log.d("Got Barcode Result: " + JSON.stringify(result));
        self.barcodeObjects[index] = {
          text: result.text,
          format: result.format
        };

        self.showButton(index,  self.barcodeObjects[index]);
      } else {
        $fh.forms.log.d("Barcode Scan Cancelled: " + JSON.stringify(result));
        self.showButton(index, null);
      }
    });
  },
  valuePopulateToElement: function(index, value) {
    var self = this;
    if (value) {
      self.barcodeObjects[index] = value;
      this.showButton(index, value);
    }
  },
  onElementShow: function(index) {
    this.showButton(index, null);
  }
});
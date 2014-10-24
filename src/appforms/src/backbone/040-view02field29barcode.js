FieldBarcodeView = FieldView.extend({
  type: "barcode",
  input: "<button data-field='<%= fieldId %>' class='special_button fh_appform_button_action select col-xs-12' data-index='<%= index %>'  type='<%= inputType %>'>Scan Barcode</button>" +
    "<button data-field='<%= fieldId %>' class='special_button fh_appform_button_action remove col-xs-12' data-index='<%= index %>'  type='<%= inputType %>'><i class='icon-remove-circle'></i>&nbsp;Remove Barcode Entry</button>" +
    "Barcode <input class='fh_appform_field_input' data-field='<%= fieldId %>' data-index='<%= index %>' data-bfield='text' type='text' disabled/>" +
    "Format <input class='fh_appform_field_input' data-field='<%= fieldId %>' data-index='<%= index %>' data-bfield='format' type='text' disabled/>",
  html5Cam: '<div class="html5Cam">' +
    '<div class="camActionBar"><button class="camCancel camBtn fh_appform_button_cancel">Cancel</button><button class="camOk camBtn fh_appform_button_action">Ok</button></div>' +
    '<div class="cam"></div>' +
    '</div>',
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
    var wrapperObj = self.getWrapper(index);
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
  setImage: function(index, base64Img) {
    var wrapper = this.getWrapper(index);
    var img = wrapper.find('img.imageThumb');
    img.attr('src', base64Img).show();
    wrapper.find('button').hide();
    wrapper.find('.remove').show();
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
            text: result.text,
            format: result.format
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

      //First, render the html5 camera
      var camObj = $(self.html5Cam);
      var actionBar = camObj.find('.camActionBar');
      camObj.css({
        'position': 'fixed',
        'top': 0,
        'bottom': 0,
        'left': 0,
        'right': 0,
        'background': '#000',
        'z-index': 9999,
        'height': "50px"
      });
      actionBar.css({
        'text-align': 'center',
        'padding': '10px',
        'background': '#999'
      });
      actionBar.find('button').css({
        'width': '80px',
        'height': '30px',
        'margin-right': '8px',
        'font-size': '1.3em'
      });
      self.$el.append(camObj);
      actionBar.find('.camCancel').on('click', function() {
        self.model.utils.cancelHtml5Camera();
        camObj.remove();
      });
      self.model.utils.initHtml5Camera({}, function(err, video) {
        if (err) {
          $fh.forms.log.e(err);
          camObj.remove();
        } else {
          $(video).css('width', '100%');
          camObj.find('.cam').append(video);
          actionBar.find('.camOk').on('click', function() {
            self.model.utils.takePhoto({rawData: true}, function(err, rawImageData) {//The image that comes from the html5 camera is base64
//              camObj.remove();
              if (err) {
                $fh.forms.log.e(err);
              } else {
                self.setImage(index, rawImageData.base64);
                console.log("Got Image: ", rawImageData.base64);

                self.model.utils.decodeBarcode(rawImageData, function(err, result){
                  console.log("DECODE QR CODE: ", err, result);
                });
              }
            });
          });
        }
      });
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
FieldSignatureView = FieldView.extend({
  extension_type: 'fhsig',

  templates: {
    input: '<label for="<%= id %>"><%= title %></label><img class="sigImage"/><input id="<%= id %>" name="<%= id %>" type="hidden">',
    signaturePad: ['<div class="sigPad">', '<ul class="sigNav">', '<button class="clearButton">Clear</button><button class="cap_sig_done_btn">Done</button>', '</ul>', '<div class="sig sigWrapper">', '<canvas class="pad" width="<%= canvasWidth %>" height="<%= canvasHeight %>"></canvas>', '</div>', '</div>']
  },

  initialize: function() {
    FieldView.prototype.initialize.call(this);
    this.on('visible',this.clearError);
  },

  dumpContent: function() {
    FieldFileView.prototype.dumpContent.call(this);
  },

  render: function() {
    var self = this;
    this.$el.append(_.template(this.templates.input, {
      "id": this.model.get('_id'),
      "title": this.model.get('Title')
    }));

    // Add button
    var button = this.addButton(this.$el, this.extension_type, 'Capture Signature');

    // add to dom
    this.options.parentEl.append(this.$el);
    console.debug("render html=" + this.$el.html());
    this.show();
  },

  contentChanged: function(e) {
    FieldView.prototype.contentChanged.apply(this,arguments);
    this.clearError();
  },

  // TODO horrible hack
  clearError: function(){
    var id = this.model.get('_id');
    var val = this.model.get("value");
    if(val && val.hasOwnProperty(id) && !this.isEmptyImage(val[id].fileBase64)) {
      FieldView.prototype.clearError.call(this);
    }
  },

  action: function(el, e) {
    $('input', this.$el);
    this.showSignatureCapture();
  },

  showSignatureCapture: function() {
    var self = this;
    var winHeight = $(window).height();
    var winWidth = $(window).width();
    var canvasHeight = winHeight - 70;
    var canvasWidth = winWidth - 2;
    var lineTop = canvasHeight - 20;

    this.$el.append(_.template(this.templates.signaturePad.join(''), {
      "canvasHeight": canvasHeight,
      "canvasWidth": canvasWidth
    }));
    console.debug("showSignatureCapture html=" + this.$el.html());

    var signaturePad = $('.sigPad', this.$el);
    signaturePad.css({
      position: 'fixed',
      'z-index': 9999,
      'width': winWidth + 'px',
      'height': winHeight + 'px',
      top: '0px',
      left: '0px',
      'background-color': '#fff'
    });

    var navHeight = $('.sigNav', this.$el).outerHeight();
    $('.sigPad', this.$el).css({
      width: '100%',
      height: winHeight + 'px'
    });
    $('.sigWrapper', this.$el).css({
      height: (winHeight - navHeight - 20) + "px"
    });
    sigPad = $('.sigPad', this.$el).signaturePad({
      drawOnly: true,
      lineTop: lineTop
    });

    $(this.$el).data('sigpadInited', true);
    // Bind capture
    $('.cap_sig_done_btn', this.$el).unbind('click').bind('click', function(e) {
      var loadingView = new LoadingView();
      loadingView.show("generating signature");
      e.preventDefault();
      var sig = sigPad.getSignature(); // get the default image type
      if(sig && sig.length) {
        var sigData = sigPad.getSignatureImage();
        self.dbgImage("signature field sig[default]=" ,sigData);
        if(self.isEmptyImage(sigData)) {
          sigData = sigPad.getSignatureImage("image/png");
          self.dbgImage("signature field sig[image/png]=" ,sigData);
        }
        if(self.isEmptyImage(sigData)) {
          sigData = sigPad.getSignatureImage("image/jpeg");
          self.dbgImage("signature field sig[image/jpeg]=" ,sigData);
        }
        if(self.isEmptyImage(sigData)) {
          sigData = self.toJpg();
          self.dbgImage("signature field sig[encoded jpg]=" ,sigData);
        }
        if(self.isEmptyImage(sigData)) {
          sigData = self.toBmp();
          self.dbgImage("signature field sigencoded bmp]=" ,sigData);
        }

        var img = $('.sigImage', self.$el)[0];
        img.src = sigData;
        $('input', self.$el).val(sigData);

        self.fileData = {};
        self.fileData.fileBase64 = sigData;
        var parts = self.splitImage(sigData);
        self.fileData.content_type = parts[0];
        self.fileData.filename = "signature." +  parts[1];
      }
      $('.sigPad', self.$el).hide();
      loadingView.hide();
      self.contentChanged();
    });
  },



  value: function(value) {
    if (value && !_.isEmpty(value)) {
      this.fileData = value[this.model.get('_id')];
      $('.sigImage', this.$el).attr('src', this.fileData.fileBase64);
      $('input', this.$el).val(this.fileData.fileBase64);
    }
    value = {};
    if(this.fileData) {
      value[this.model.get('_id')] = this.fileData;
    }
    console.debug("value html=" + this.$el.html());
    return value;
  },
  dbgImage: function(msg,image) {
    console.log(msg + (image ? (image.substring(0,image.indexOf(",")) + "[len=" + image.length +"]") : " empty"));
  },
  toJpg: function(image) {
    image= _.extend({}, image||{}, {quality : 100, width : 248, height : 100});
    var cnvs = $('.sigPad', self.$el).find('canvas')[0];

    var canvas = this.scaleCanvas(cnvs, image.width, image.height);
    var myEncoder = new JPEGEncoder(image.quality);
    return myEncoder.encode(canvas.getContext("2d").getImageData(0, 0, image.width, image.height));
  },

  toBmp: function(image) {
    image= _.extend({}, image||{}, {quality : 100, width : 248, height : 100});
    var sigData;
    var cnvs = $('.sigPad', self.$el).find('canvas')[0];

    var oScaledCanvas = this.scaleCanvas(cnvs, image.width, image.height);
    var oData = this.readCanvasData(oScaledCanvas);
    var strImgData = this.createBMP(oData);

    sigData = this.makeDataURI(strImgData, "image/bmp");
    return sigData;
  },

  // bitMap handling code
  readCanvasData: function(canvas) {
    var iWidth = parseInt(canvas.width,10);
    var iHeight = parseInt(canvas.height,10);
    return canvas.getContext("2d").getImageData(0, 0, iWidth, iHeight);
  },

  encodeData: function(data) {
    var strData = "";
    if (typeof data == "string") {
      strData = data;
    } else {
      var aData = data;
      for ( var i = 0; i < aData.length; i++) {
        strData += String.fromCharCode(aData[i]);
      }
    }
    return btoa(strData);
  },

  createBMP: function(oData) {
    var aHeader = [];

    var iWidth = oData.width;
    var iHeight = oData.height;

    aHeader.push(0x42); // magic 1
    aHeader.push(0x4D);

    var iFileSize = iWidth * iHeight * 3 + 54; // total header size = 54
    // bytes
    aHeader.push(iFileSize % 256);
    iFileSize = Math.floor(iFileSize / 256);
    aHeader.push(iFileSize % 256);
    iFileSize = Math.floor(iFileSize / 256);
    aHeader.push(iFileSize % 256);
    iFileSize = Math.floor(iFileSize / 256);
    aHeader.push(iFileSize % 256);

    aHeader.push(0); // reserved
    aHeader.push(0);
    aHeader.push(0); // reserved
    aHeader.push(0);

    aHeader.push(54); // dataoffset
    aHeader.push(0);
    aHeader.push(0);
    aHeader.push(0);

    var aInfoHeader = [];
    aInfoHeader.push(40); // info header size
    aInfoHeader.push(0);
    aInfoHeader.push(0);
    aInfoHeader.push(0);

    var iImageWidth = iWidth;
    aInfoHeader.push(iImageWidth % 256);
    iImageWidth = Math.floor(iImageWidth / 256);
    aInfoHeader.push(iImageWidth % 256);
    iImageWidth = Math.floor(iImageWidth / 256);
    aInfoHeader.push(iImageWidth % 256);
    iImageWidth = Math.floor(iImageWidth / 256);
    aInfoHeader.push(iImageWidth % 256);

    var iImageHeight = iHeight;
    aInfoHeader.push(iImageHeight % 256);
    iImageHeight = Math.floor(iImageHeight / 256);
    aInfoHeader.push(iImageHeight % 256);
    iImageHeight = Math.floor(iImageHeight / 256);
    aInfoHeader.push(iImageHeight % 256);
    iImageHeight = Math.floor(iImageHeight / 256);
    aInfoHeader.push(iImageHeight % 256);

    aInfoHeader.push(1); // num of planes
    aInfoHeader.push(0);

    aInfoHeader.push(24); // num of bits per pixel
    aInfoHeader.push(0);

    aInfoHeader.push(0); // compression = none
    aInfoHeader.push(0);
    aInfoHeader.push(0);
    aInfoHeader.push(0);

    var iDataSize = iWidth * iHeight * 3;
    aInfoHeader.push(iDataSize % 256);
    iDataSize = Math.floor(iDataSize / 256);
    aInfoHeader.push(iDataSize % 256);
    iDataSize = Math.floor(iDataSize / 256);
    aInfoHeader.push(iDataSize % 256);
    iDataSize = Math.floor(iDataSize / 256);
    aInfoHeader.push(iDataSize % 256);

    for ( var i = 0; i < 16; i++) {
      aInfoHeader.push(0); // these bytes not used
    }

    var iPadding = (4 - ((iWidth * 3) % 4)) % 4;

    var aImgData = oData.data;

    var strPixelData = "";
    var y = iHeight;
    do {
      var iOffsetY = iWidth * (y - 1) * 4;
      var strPixelRow = "";
      for ( var x = 0; x < iWidth; x++) {
        var iOffsetX = 4 * x;

        strPixelRow += String.fromCharCode(aImgData[iOffsetY + iOffsetX + 2]);
        strPixelRow += String.fromCharCode(aImgData[iOffsetY + iOffsetX + 1]);
        strPixelRow += String.fromCharCode(aImgData[iOffsetY + iOffsetX]);
      }
      for ( var c = 0; c < iPadding; c++) {
        strPixelRow += String.fromCharCode(0);
      }
      strPixelData += strPixelRow;
    } while (--y);

    var strEncoded = this.encodeData(aHeader.concat(aInfoHeader)) + this.encodeData(strPixelData);

    return strEncoded;
  },
  makeDataURI: function(strData, strMime) {
    return "data:" + strMime + ";base64," + strData;
  },
  scaleCanvas: function(canvas, iWidth, iHeight) {
    if (iWidth && iHeight) {
      var oSaveCanvas = document.createElement("canvas");
      oSaveCanvas.width = iWidth;
      oSaveCanvas.height = iHeight;
      oSaveCanvas.style.width = iWidth + "px";
      oSaveCanvas.style.height = iHeight + "px";

      var oSaveCtx = oSaveCanvas.getContext("2d");

      oSaveCtx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, iWidth, iHeight);
      return oSaveCanvas;
    }
    return canvas;
  },
  isEmptyImage: function(image) {
    return image === null || image === "" || image === "data:,";
  },
  splitImage: function(image) {
    var PREFIX = "data:";
    var ENCODING = ";base64,";
    var start = image.indexOf(PREFIX);
    var content_type = "image/bmp";
    var ext = "bmp";
    if(start >= 0) {
      var end = image.indexOf(ENCODING,start) + 1;
      content_type = image.substring(start,end-1);
      ext = content_type.split("/")[1];
    }
    return [content_type,ext];
  }

});
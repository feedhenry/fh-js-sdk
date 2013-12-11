FieldSignatureView = FieldView.extend({
  extension_type: 'fhsig',

  input: "<img class='sigImage' data-field='<%= fieldId %>' data-index='<%= index %>'/>",
  signaturePadStyle: "@font-face{font-family:Journal;src:url(journal.eot);src:url(journal.eot?#iefix) format('embedded-opentype'),url(journal.woff) format('woff'),url(journal.ttf) format('truetype'),url(journal.svg#JournalRegular) format('svg');font-weight:400;font-style:normal}.sigPad{margin:0;padding:0;width:250px;height:200px}.sigPad label{display:block;margin:0 0 .515em;padding:0;color:#000;font:italic normal 1em/1.375 Georgia,Times,serif}.sigPad label.error{color:#f33}.sigPad input{margin:0;padding:.2em 0;width:198px;border:1px solid #666;font-size:1em}.sigPad input.error{border-color:#f33}.sigPad button{margin:1em 0 0;padding:.6em .6em .7em;background-color:#ccc;border:0;-moz-border-radius:8px;-webkit-border-radius:8px;border-radius:8px;cursor:pointer;color:#555;font:700 1em/1.375 sans-serif;text-align:left}.sigPad button:hover{background-color:#333;color:#fff}.sig{display:none}.sigNav{display:none;height:2.25em;margin:0;padding:0;position:relative;list-style-type:none}.sigNav li{display:inline;float:left;margin:0;padding:0}.sigNav a,.sigNav a:link,.sigNav a:visited{display:block;margin:0;padding:0 .6em;border:0;color:#333;font-weight:700;line-height:2.25em;text-decoration:underline}.sigNav a.current,.sigNav a.current:link,.sigNav a.current:visited{background-color:#666;-moz-border-radius-topleft:8px;-moz-border-radius-topright:8px;-webkit-border-top-left-radius:8px;-webkit-border-top-right-radius:8px;border-radius:8px 8px 0 0;color:#fff;text-decoration:none}.sigNav .typeIt a.current,.sigNav .typeIt a.current:link,.sigNav .typeIt a.current:visited{background-color:#ccc;color:#555}.sigWrapper{clear:both;height:100px;border:1px solid #ccc}.sigWrapper.current{border-color:#666}.signed .sigWrapper{border:0}.pad{position:relative}.typed{height:55px;margin:0;padding:0 5px;position:absolute;z-index:90;cursor:default;color:#145394;font:400 1.875em/50px Journal,Georgia,Times,serif}.drawItDesc,.typeItDesc{display:none;margin:.75em 0 .515em;padding:.515em 0 0;border-top:3px solid #ccc;color:#000;font:italic normal 1em/1.375 Georgia,Times,serif}",
  templates: {
    signaturePad: ['<div class="sigPad">', '<ul class="sigNav">', '<button class="clearButton">Clear</button><button class="cap_sig_done_btn">Done</button>', '</ul>', '<div class="sig sigWrapper">', '<canvas class="pad" width="<%= canvasWidth %>" height="<%= canvasHeight %>"></canvas>', '</div>', '</div>']
  },

  initialize: function() {
    FieldView.prototype.initialize.call(this);
    this.on('visible', this.clearError);
  },

  // dumpContent: function() {
  //   FieldFileView.prototype.dumpContent.call(this);
  // },
  onElementShow: function(index) {
    var html = $(this.renderButton(index, "Capture Signature", this.extension_type));
    this.getWrapper(index).append(html);
    var self = this;
    html.on("click", function() {
      self.showSignatureCapture(index);
    });
  },
  // render: function() {
  //   var self = this;
  //   this.$el.append(_.template(this.templates.input, {
  //     "id": this.model.get('_id'),
  //     "title": this.model.get('Title')
  //   }));

  //   // Add button
  //   var button = this.addButton(this.$el, this.extension_type, 'Capture Signature');

  //   // add to dom
  //   this.options.parentEl.append(this.$el);
  //   console.debug("render html=" + this.$el.html());
  //   this.show();
  // },

  // contentChanged: function(e) {
  //   FieldView.prototype.contentChanged.apply(this,arguments);
  //   this.clearError();
  // },

  // TODO horrible hack
  // clearError: function(){
  //   var id = this.model.get('_id');
  //   var val = this.model.get("value");
  //   if(val && val.hasOwnProperty(id) && !this.isEmptyImage(val[id].fileBase64)) {
  //     FieldView.prototype.clearError.call(this);
  //   }
  // },

  // action: function(el, e) {
  //   $('input', this.$el);
  //   this.showSignatureCapture();
  // },
  onRender: function() {
    var style = $("<style />");
    style.text(this.signaturePadStyle);

    this.$el.append(style);
  },
  showSignatureCapture: function(index) {
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
    // console.debug("showSignatureCapture html=" + this.$el.html());

    var signaturePad = $('.sigPad', this.$el);
    signaturePad.css({
      position: 'fixed',
      'z-index': 9999,
      'bottom': '0px',
      'right': '0px',
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
      // var loadingView = new LoadingView();
      // loadingView.show("generating signature");
      e.preventDefault();
      debugger;
      var sig = sigPad.getSignature(); // get the default image type
      if (sig && sig.length) {
        var sigData = sigPad.getSignatureImage();
        if (self.isEmptyImage(sigData)) { //toDataUrl not supported by current browser. fallback use bmp encoder
          sigData = self.toBmp();
        }
        self.setSignature(index, sigData);
        // var img = $('.sigImage', self.$el)[0];
        // img.src = sigData;
        // $('input', self.$el).val(sigData);

        // self.fileData = {};
        // self.fileData.fileBase64 = sigData;
        // var parts = self.splitImage(sigData);
        // self.fileData.content_type = parts[0];
        // self.fileData.filename = "signature." +  parts[1];
      }
      $('.sigPad', self.$el).hide();
      // loadingView.hide();
      // self.contentChanged();
    });
  },
  setSignature: function(index, base64Img) {
    var wrapper = this.getWrapper(index);
    wrapper.find("img.sigImage").attr("src", base64Img);
  },
  value: function(value) {
    if (value && !_.isEmpty(value)) {
      this.fileData = value[this.model.get('_id')];
      $('.sigImage', this.$el).attr('src', this.fileData.fileBase64);
      $('input', this.$el).val(this.fileData.fileBase64);
    }
    value = {};
    if (this.fileData) {
      value[this.model.get('_id')] = this.fileData;
    }
    // console.debug("value html=" + this.$el.html());
    return value;
  },
  dbgImage: function(msg, image) {
    console.log(msg + (image ? (image.substring(0, image.indexOf(",")) + "[len=" + image.length + "]") : " empty"));
  },
  // toJpg: function(image) {
  //   image = _.extend({}, image || {}, {
  //     quality: 100,
  //     width: 248,
  //     height: 100
  //   });
  //   var cnvs = $('.sigPad', self.$el).find('canvas')[0];

  //   var canvas = this.scaleCanvas(cnvs, image.width, image.height);
  //   var myEncoder = new JPEGEncoder(image.quality);
  //   return myEncoder.encode(canvas.getContext("2d").getImageData(0, 0, image.width, image.height));
  // },

  toBmp: function(image) {
    image = _.extend({}, image || {}, {
      quality: 100,
      width: 248,
      height: 100
    });
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
    var iWidth = parseInt(canvas.width, 10);
    var iHeight = parseInt(canvas.height, 10);
    return canvas.getContext("2d").getImageData(0, 0, iWidth, iHeight);
  },

  encodeData: function(data) {
    var strData = "";
    if (typeof data == "string") {
      strData = data;
    } else {
      var aData = data;
      for (var i = 0; i < aData.length; i++) {
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

    for (var i = 0; i < 16; i++) {
      aInfoHeader.push(0); // these bytes not used
    }

    var iPadding = (4 - ((iWidth * 3) % 4)) % 4;

    var aImgData = oData.data;

    var strPixelData = "";
    var y = iHeight;
    do {
      var iOffsetY = iWidth * (y - 1) * 4;
      var strPixelRow = "";
      for (var x = 0; x < iWidth; x++) {
        var iOffsetX = 4 * x;

        strPixelRow += String.fromCharCode(aImgData[iOffsetY + iOffsetX + 2]);
        strPixelRow += String.fromCharCode(aImgData[iOffsetY + iOffsetX + 1]);
        strPixelRow += String.fromCharCode(aImgData[iOffsetY + iOffsetX]);
      }
      for (var c = 0; c < iPadding; c++) {
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
    if (start >= 0) {
      var end = image.indexOf(ENCODING, start) + 1;
      content_type = image.substring(start, end - 1);
      ext = content_type.split("/")[1];
    }
    return [content_type, ext];
  }

});
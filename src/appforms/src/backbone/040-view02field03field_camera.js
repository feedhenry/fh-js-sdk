FieldCameraView = FieldView.extend({
  input: "<img class='imageThumb' width='100%' data-field='<%= fieldId %>' data-index='<%= index %>'  type='<%= inputType %>'>",
  html5Cam: '<div class="html5Cam">' +
    '<div class="camActionBar"><button class="camCancel camBtn fh_appform_button_cancel">Cancel</button><button class="camOk camBtn fh_appform_button_action">Ok</button></div>' +
    '<div class="cam"></div>' +
    '</div>',
  onElementShow: function(index) {
    var captureBtn = $(this.renderButton(index, "<i class='fa fa-camera'></i>&nbsp;Capture Photo From Camera", "fhcam"));
    var libBtn = $(this.renderButton(index, "<i class='fa fa-folder'></i>&nbsp;Choose Photo from Library", "fhcam_lib"));
    var rmBtn = $(this.renderButton(index, "<i class='fa fa-times-circle'></i>&nbsp;Remove Photo", "remove"));

    this.getWrapper(index).append(captureBtn);
    this.getWrapper(index).append(libBtn);
    this.getWrapper(index).append(rmBtn);
    var self = this;
    captureBtn.on('click', function (e) {
      self.addFromCamera(e, index);
    });
    libBtn.on('click', function (e) {
      self.addFromLibrary(e, index);
    });
    rmBtn.on('click', function (e) {
      self.removeThumb(e, index);
    });
    rmBtn.hide();
  },
  setImage: function (index, base64Img) {
    var wrapper = this.getWrapper(index);
    var img = wrapper.find('img.imageThumb');
    img.attr('src', base64Img).show();
    wrapper.find('button').hide();
    wrapper.find('.remove').show();
  },
  getImageThumb: function (index) {
    var wrapper = this.getWrapper(index);
    var img = wrapper.find('img.imageThumb');
    return img;
  },
  getCameraBtn: function (index) {
    var wrapper = this.getWrapper(index);
    return wrapper.find('button.fhcam');
  },
  getLibBtn: function (index) {
    var wrapper = this.getWrapper(index);
    return wrapper.find('button.fhcam_lib');
  },
  getRemoveBtn: function (index) {
    var wrapper = this.getWrapper(index);
    return wrapper.find('button.remove');
  },
  removeThumb: function (e, index) {
    e.preventDefault();
    var img = this.getImageThumb(index);
    img.removeAttr('src').hide();
    this.getLibBtn(index).show();
    this.getCameraBtn(index).show();
    this.getRemoveBtn(index).hide();  // this.trigger('imageRemoved'); // trigger events used by grouped camera fields NOTE: don't move to setImageData fn, could result in infinite event callback triggering as group camera field may call into setImageData()
  },
  addFromCamera: function (e, index) {
    e.preventDefault();
    var self = this;
    var params = {};

    params = this.model.getPhotoOptions();

    if (this.model.utils.isPhoneGapCamAvailable()) {
      this.model.utils.takePhoto(params, function (err, imageURI) {
        if (err) {
          console.error(err);
        } else {
          self.setImage(index, imageURI);
        }
      });
    } else if (this.model.utils.isHtml5CamAvailable()) {
      var camObj = $(self.html5Cam);
      var actionBar = camObj.find('.camActionBar');
      camObj.css({
        'position': 'fixed',
        'top': 0,
        'bottom': 0,
        'left': 0,
        'right': 0,
        'background': '#000',
        'z-index': 9999
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
      actionBar.find('.camCancel').on('click', function () {
        self.model.utils.cancelHtml5Camera();
        camObj.remove();
      });
      this.model.utils.initHtml5Camera(params, function (err, video) {
        if (err) {
          console.error(err);
          camObj.remove();
        } else {
          $(video).css('width', '100%');
          camObj.find('.cam').append(video);
          actionBar.find('.camOk').on('click', function () {
            self.model.utils.takePhoto(params, function (err, base64Img) {
              camObj.remove();
              if (err) {
                console.error(err);
              } else {
                self.setImage(index, base64Img);
              }
            });
          });
        }
      });
    } else {
      var sampleImg = self.sampleImage();
      self.setImage(index, sampleImg);
    }
  },
  addFromLibrary: function (e, index) {
    var self = this;
    var params = {};
    if (self.model.utils.isPhoneGapCamAvailable()) {
      e.preventDefault();
      params.sourceType = Camera.PictureSourceType.PHOTOLIBRARY;
      self.model.utils.takePhoto(params, function (err, base64Image) {
        if(err){
          console.error("error occured with take photo ", JSON.stringify(err));
        }
        if(base64Image) {
          self.setImage(index, base64Image);
        }
      });
    } else {
      var file = document.createElement('input');
      file.type = 'file';
      var fileObj = $(file);
      fileObj.hide();
      self.$el.append(fileObj);
      fileObj.on('change', function () {
        var file = fileObj[0];
        if (file.files && file.files.length > 0) {
          file = file.files[0];
          fileObj.remove();
          self.model.utils.fileSystem.fileToBase64(file, function (err, base64Img) {
            if (err) {
              console.error(err);
            } else {
              self.setImage(index, base64Img);
            }
          });
        }
      });
      fileObj.click();
    }
  },
  valueFromElement: function (index) {
    var img = this.getImageThumb(index);
    return img.attr('src');
  },
  valuePopulateToElement: function (index, value) {
    if (value) {
      var base64Data = value.data;
      var base64Img = value.imgHeader + base64Data;
      this.setImage(index, base64Img);
    }
  },
  sampleImages: [
    '/9j/4QAYRXhpZgAASUkqAAgAAAAAAAAAAAAAAP/sABFEdWNreQABAAQAAAAAAAD/4QMraHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLwA8P3hwYWNrZXQgYmVnaW49Iu+7vyIgaWQ9Ilc1TTBNcENlaGlIenJlU3pOVGN6a2M5ZCI/PiA8eDp4bXBtZXRhIHhtbG5zOng9ImFkb2JlOm5zOm1ldGEvIiB4OnhtcHRrPSJBZG9iZSBYTVAgQ29yZSA1LjAtYzA2MCA2MS4xMzQ3NzcsIDIwMTAvMDIvMTItMTc6MzI6MDAgICAgICAgICI+IDxyZGY6UkRGIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+IDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSIiIHhtbG5zOnhtcD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLyIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bXA6Q3JlYXRvclRvb2w9IkFkb2JlIFBob3Rvc2hvcCBDUzUgTWFjaW50b3NoIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjVEMzgyQjRCMTU1MjExRTJBNzNDQzMyMEE5ODI5OEU0IiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOjVEMzgyQjRDMTU1MjExRTJBNzNDQzMyMEE5ODI5OEU0Ij4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6NUQzODJCNDkxNTUyMTFFMkE3M0NDMzIwQTk4Mjk4RTQiIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6NUQzODJCNEExNTUyMTFFMkE3M0NDMzIwQTk4Mjk4RTQiLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz7/7gAOQWRvYmUAZMAAAAAB/9sAhAAbGhopHSlBJiZBQi8vL0JHPz4+P0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHAR0pKTQmND8oKD9HPzU/R0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0f/wAARCAAyADIDASIAAhEBAxEB/8QATQABAQAAAAAAAAAAAAAAAAAAAAQBAQEBAAAAAAAAAAAAAAAAAAAEBRABAAAAAAAAAAAAAAAAAAAAABEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AiASt8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAB//9k=',
    'iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAALklEQVQYV2NkwAT/oUKMyFIoHKAETBFIDU6FIEUgSaJMBJk0MhQihx2W8IcIAQBhewsKNsLKIgAAAABJRU5ErkJggg==',
    'iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAYUlEQVQYV2NkQAJlM1X/g7hd6bdBFCOyHCNIEigBppElkNkgeYIKYBrwKoQ6A+wEuDtwOQHmLLgbQbqQ3YnubhSfwRTj9DUu3+J0I7oGkPVwXwMZKOEHdCdcPdQJILczAAACnDmkK8T25gAAAABJRU5ErkJggg=='
  ],
  sampleImage: function () {
    window.sampleImageNum = (window.sampleImageNum += 1) % this.sampleImages.length;
    return this.sampleImages[window.sampleImageNum];
  }
});
window.sampleImageNum = -1;

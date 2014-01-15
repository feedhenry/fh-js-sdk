FieldCameraView = FieldView.extend({
  input: '<img class="imageThumb" width="100%" data-field="<%= fieldId %>" data-index="<%= index %>">',
  html5Cam: '<div class="html5Cam">' +
    '<div class="camActionBar"><button class="camCancel camBtn fh_appform_button_cancel">Cancel</button><button class="camOk camBtn fh_appform_button_action">Ok</button></div>' +
    '<div class="cam"></div>' +
    '</div>',
  // initialize: function() {
  //   FieldView.prototype.initialize.call(this);
  //   //Make sure 'this' is bound for setImageData, was incorrect on device!
  //   _.bindAll(this, 'setImageData', 'imageSelected');
  //   this.on('visible',this.clearError);
  // },

  onElementShow: function(index) {
    var captureBtn = $(this.renderButton(index, "Capture Photo From Camera", "fhcam"));
    var libBtn = $(this.renderButton(index, "Choose Photo from Library", "fhcam_lib"));
    var rmBtn = $(this.renderButton(index, "Remove Photo", "remove"));

    this.getWrapper(index).append(captureBtn);
    this.getWrapper(index).append(libBtn);
    this.getWrapper(index).append(rmBtn);

    var self = this;
    captureBtn.on("click", function(e) {
      self.addFromCamera(e, index);
    });
    libBtn.on("click", function(e) {
      self.addFromLibrary(e, index);
    });
    rmBtn.on("click", function(e) {
      self.removeThumb(e, index);
    });
    rmBtn.hide();
  },
  // render: function() {
  //   var self = this;
  //   // construct field html
  //   this.$el.append(_.template(this.template.join(''), {
  //     "id": this.model.get('_id'),
  //     "title": this.model.get('name')
  //   }));

  //   this.addButton(this.$el, 'fhcam', 'Capture Photo from Camera');
  //   this.addButton(this.$el, 'fhcam_lib', 'Choose Photo from Library');
  //   this.addButton(this.$el, 'remove', 'Remove Photo', 'uploaded');

  //   this.setImageData(null, true);

  //   // add to dom hidden
  //   this.$el.hide();
  //   this.options.parentEl.append(this.$el);

  //   // populate field if Submission obj exists
  //   var submission = this.options.formView.getSubmission();
  //   if(submission){
  //     this.submission = submission;
  //     this.submission.getInputValueByFieldId(this.model.get('_id'),function(err,res){
  //       console.log(err,res);
  //       self.value(res);
  //     });
  //   }

  //   this.show();
  // },

  // contentChanged: function(e) {
  //   FieldView.prototype.contentChanged.apply(this,arguments);
  //   this.clearError();
  // },

  // addButton: function(input, img_file, label, classes, action) {
  //   var self = this;
  //   var button = $('<button>');
  //   button.addClass('special_button');
  //   button.addClass(img_file);
  //   button.text(' ' + label);
  //   var img = $('<img>');
  //   img.attr('src', './img/' + img_file + '.png');
  //   img.css('height', '28px');
  //   img.css('width', '28px');
  //   button.prepend(img);

  //   if (typeof action !== 'undefined') {
  //     button.click(function(e) {
  //       action();
  //       e.preventDefault();
  //       return false;
  //     });
  //   }

  //   if (classes) {
  //     button.addClass(classes);
  //   }

  //   input.append(button);
  //   return button;
  // },

  // getOrder: function() {
  //   return this.options.order;
  // },
  setImage: function(index, base64Img) {
    var wrapper = this.getWrapper(index);
    var img = wrapper.find("img.imageThumb");
    img.attr("src", base64Img);
    wrapper.find("button").hide();
    wrapper.find(".remove").show();
  },
  // setImageData: function(imageData, dontCallContentChanged) {
  //   var target = this.$el.find('#' + this.model.get('_id'));

  //   if (imageData) {
  //     console.debug('setting imageData:', imageData.length);
  //     // prepend dataUri if not already there
  //     var dataUri = imageData;
  //     if (!/\bdata\:image\/.+?\;base64,/.test(dataUri)) {
  //       dataUri = 'data:image/jpeg;base64,' + imageData;
  //     }
  //     target.val(dataUri);
  //     this.$el.find('.imageThumb').attr('src', dataUri);
  //     this.$el.find('.upload').hide();
  //     this.$el.find('.uploaded').show();
  //     this.fileData = {};
  //     this.fileData.fileBase64 = dataUri;
  //     this.fileData.filename = "photo";
  //     this.fileData.content_type = "image/jpeg";
  //   } else {
  //     target.val(null);
  //     this.$el.find('.imageThumb').removeAttr('src');
  //     this.$el.find('.upload').show();
  //     this.$el.find('.uploaded').hide();
  //     delete this.fileData;
  //   }

  //   // manually call contentChanged as 'change' event doesn't get triggered when we manipulate fields programatically
  //   if (!dontCallContentChanged) {
  //     this.contentChanged();
  //   }
  // },

  // dumpContent: function() {
  //   FieldFileView.prototype.dumpContent.call(this);
  // },

  // hasImageData: function() {
  //   return this.$el.find('#' + this.model.get('_id')).val().length > 0;
  // },

  // getImageData: function() {
  //   return this.$el.find('#' + this.model.get('_id')).val();
  // },
  getImageThumb: function(index) {
    var wrapper = this.getWrapper(index);
    var img = wrapper.find("img.imageThumb");
    return img;
  },
  getCameraBtn: function(index) {
    var wrapper = this.getWrapper(index);
    return wrapper.find("button.fhcam");
  },
  getLibBtn: function(index) {
    var wrapper = this.getWrapper(index);
    return wrapper.find("button.fhcam_lib");
  },
  getRemoveBtn: function(index) {
    var wrapper = this.getWrapper(index);
    return wrapper.find("button.remove");
  },
  removeThumb: function(e, index) {
    e.preventDefault();
    var img = this.getImageThumb(index);
    img.removeAttr("src");
    this.getLibBtn(index).show();
    this.getCameraBtn(index).show();
    this.getRemoveBtn(index).hide();
    // this.trigger('imageRemoved'); // trigger events used by grouped camera fields NOTE: don't move to setImageData fn, could result in infinite event callback triggering as group camera field may call into setImageData()
  },

  addFromCamera: function(e, index) {
    e.preventDefault();
    var self = this;
    var params = {
      width: App.config.getValueOrDefault('cam_targetWidth'),
      height: App.config.getValueOrDefault('cam_targetHeight')
    }
    if (this.model.utils.isPhoneGapCamAvailable()) {
      this.model.utils.takePhoto(params, function(err, base64Img) {
        if (err) {
          console.error(err);
        } else {
          self.setImage(index, base64Img);
        }
      });
    } else if (this.model.utils.isHtml5CamAvailable()) {
      var camObj = $(self.html5Cam);
      var actionBar = camObj.find(".camActionBar");
      camObj.css({
        "position": "fixed",
        "top": 0,
        "bottom": 0,
        "left": 0,
        "right": 0,
        "background": "#000",
        "z-index": 9999
      });
      actionBar.css({
        "text-align": "center",
        "padding": "10px",
        "background": "#999"

      });
      actionBar.find("button").css({
        "width": "80px",
        "height": "30px",
        "margin-right": "8px",
        "font-size": "1.3em"
      });
      self.$el.append(camObj);
      actionBar.find(".camCancel").on("click", function() {
        self.model.utils.cancelHtml5Camera();
        camObj.remove();
      });
      this.model.utils.initHtml5Camera(params, function(err, video) {
        if (err) {
          console.error(err);
          alert(err);
          camObj.remove();
        } else {
          $(video).css("width", "100%");
          camObj.find(".cam").append(video);

          actionBar.find(".camOk").on("click", function() {
            self.model.utils.takePhoto(params, function(err, base64Img) {
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
      self.setImage(index, sampleImage);
    }
  },
  // imageSelected: function(imageData) {
  //   this.setImageData(imageData);
  //   this.trigger('imageAdded'); // trigger events used by grouped camera fields
  // },

  // parseCssClassCameraOptions: function() {
  //   var options = {
  //     targetHeight: null,
  //     targetWidth: null,
  //     quality: null
  //   };

  //   // TODO - review if this is needed
  //   // var classNames = this.model.get('ClassNames'),
  //   //   parts, val;
  //   // if (classNames !== '') {
  //   //   var classes = classNames.split(' ');
  //   //   _(classes).forEach(function(className) {
  //   //     if (className.indexOf("fhdimensions") != -1) {
  //   //       parts = className.split('=');
  //   //       val = parts[1].split('x');

  //   //       // Retry
  //   //       if (val.length == 2) {
  //   //         // Validity check
  //   //         if (val[0] < 10000 && val[1] < 10000) {
  //   //           options.targetWidth = val[0];
  //   //           options.targetHeight = val[1];
  //   //         } else {
  //   //           console.error('Invalid camera resolution, using defaults');
  //   //         }
  //   //       }
  //   //     } else if (className.indexOf("fhcompression") != -1) {
  //   //       parts = className.split('=');
  //   //       val = parts[1].split('%');

  //   //       options.quality = val[0];
  //   //     }
  //   //   });
  //   // }

  //   return options;
  // },
  addFromLibrary: function(e, index) {
    var self = this;
    var params = {
      width: App.config.getValueOrDefault('cam_targetWidth'),
      height: App.config.getValueOrDefault('cam_targetHeight')
    }
    if (self.model.utils.isPhoneGapCamAvailable()) {
      e.preventDefault();
      params.sourceType = Camera.PictureSourceType.PHOTOLIBRARY;
      self.model.utils.takePhoto(params, function(err, base64Img) {
        self.setImage(index, base64Img);
      });
    } else {
      var file = document.createElement("input");
      file.type = "file";
      var fileObj = $(file);
      fileObj.hide();
      self.$el.append(fileObj);

      fileObj.on("change", function() {
        var file=fileObj[0];
        if (file.files && file.files.length>0){
          var file=file.files[0];
          fileObj.remove();
          self.model.utils.fileSystem.fileToBase64(file,function(err,base64Img){
            if (err){
              console.error(err);
              alser(err);
            }else{
              self.setImage(index,base64Img);
            }
          });  
        }
        
      });
      fileObj.click();
    }
  },
  // addImage: function(fromLibrary) {
  //   // TODO: move this to cloud config, synced to client on startup
  //   var camOptions = {
  //     quality: App.config.getValueOrDefault('cam_quality'),
  //     targetWidth: App.config.getValueOrDefault('cam_targetWidth'),
  //     targetHeight: App.config.getValueOrDefault('cam_targetHeight')
  //   };

  //   var options = this.parseCssClassCameraOptions();
  //   // Merge
  //   camOptions = _.defaults(options, camOptions);

  //   if (typeof navigator.camera === 'undefined') {
  //     this.imageSelected(this.sampleImage());
  //   } else {
  //     if (fromLibrary) {
  //       camOptions.sourceType = Camera.PictureSourceType.PHOTOLIBRARY;
  //     }
  //     // turn off refetch on resume from pic taking, necessary as pic/cam sends app in background
  //     App.resumeFetchAllowed = false;
  //     navigator.camera.getPicture(this.imageSelected, function(err) {
  //       alert('Camera Error: ' + err);
  //     }, camOptions);
  //   }
  // },

  // show: function() {
  //   // only perform check once
  //   if (this.options.initHidden) {
  //     this.options.initHidden = false;
  //   } else {
  //     FieldView.prototype.show.call(this);
  //   }
  // },

  valueFromElement: function(index) {

    var img = this.getImageThumb(index);
    return img.attr("src");
  },
  valuePopulateToElement: function(index, value) {
    if (value) {
      var base64Data = value.data;
      var base64Img = value.imgHeader + base64Data;
      this.setImage(index, base64Img);
    }

  },
  sampleImages: ['/9j/4QAYRXhpZgAASUkqAAgAAAAAAAAAAAAAAP/sABFEdWNreQABAAQAAAAAAAD/4QMraHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLwA8P3hwYWNrZXQgYmVnaW49Iu+7vyIgaWQ9Ilc1TTBNcENlaGlIenJlU3pOVGN6a2M5ZCI/PiA8eDp4bXBtZXRhIHhtbG5zOng9ImFkb2JlOm5zOm1ldGEvIiB4OnhtcHRrPSJBZG9iZSBYTVAgQ29yZSA1LjAtYzA2MCA2MS4xMzQ3NzcsIDIwMTAvMDIvMTItMTc6MzI6MDAgICAgICAgICI+IDxyZGY6UkRGIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+IDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSIiIHhtbG5zOnhtcD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLyIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bXA6Q3JlYXRvclRvb2w9IkFkb2JlIFBob3Rvc2hvcCBDUzUgTWFjaW50b3NoIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjVEMzgyQjRCMTU1MjExRTJBNzNDQzMyMEE5ODI5OEU0IiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOjVEMzgyQjRDMTU1MjExRTJBNzNDQzMyMEE5ODI5OEU0Ij4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6NUQzODJCNDkxNTUyMTFFMkE3M0NDMzIwQTk4Mjk4RTQiIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6NUQzODJCNEExNTUyMTFFMkE3M0NDMzIwQTk4Mjk4RTQiLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz7/7gAOQWRvYmUAZMAAAAAB/9sAhAAbGhopHSlBJiZBQi8vL0JHPz4+P0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHAR0pKTQmND8oKD9HPzU/R0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0f/wAARCAAyADIDASIAAhEBAxEB/8QATQABAQAAAAAAAAAAAAAAAAAAAAQBAQEBAAAAAAAAAAAAAAAAAAAEBRABAAAAAAAAAAAAAAAAAAAAABEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AiASt8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAB//9k=', 'iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAALklEQVQYV2NkwAT/oUKMyFIoHKAETBFIDU6FIEUgSaJMBJk0MhQihx2W8IcIAQBhewsKNsLKIgAAAABJRU5ErkJggg==', 'iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAYUlEQVQYV2NkQAJlM1X/g7hd6bdBFCOyHCNIEigBppElkNkgeYIKYBrwKoQ6A+wEuDtwOQHmLLgbQbqQ3YnubhSfwRTj9DUu3+J0I7oGkPVwXwMZKOEHdCdcPdQJILczAAACnDmkK8T25gAAAABJRU5ErkJggg=='],

  sampleImage: function() {
    window.sampleImageNum = (window.sampleImageNum += 1) % this.sampleImages.length;
    return this.sampleImages[window.sampleImageNum];
  }

});
window.sampleImageNum = -1;
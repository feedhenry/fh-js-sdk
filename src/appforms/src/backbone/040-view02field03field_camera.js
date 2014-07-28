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
        captureBtn.on('click', function(e) {
            self.addFromCamera(e, index);
        });
        libBtn.on('click', function(e) {
            self.addFromLibrary(e, index);
        });
        rmBtn.on('click', function(e) {
            self.removeThumb(e, index);
        });
        rmBtn.hide();
    },
    setImage: function(index, base64Img, isBase64) {
        var wrapper = this.getWrapper(index);
        var img = wrapper.find('img.imageThumb');
        img.attr('src', base64Img).show();
        wrapper.find('button').hide();
        wrapper.find('.remove').show();
    },
    getImageThumb: function(index) {
        var wrapper = this.getWrapper(index);
        var img = wrapper.find('img.imageThumb');
        return img;
    },
    getCameraBtn: function(index) {
        var wrapper = this.getWrapper(index);
        return wrapper.find('button.fhcam');
    },
    getLibBtn: function(index) {
        var wrapper = this.getWrapper(index);
        return wrapper.find('button.fhcam_lib');
    },
    getRemoveBtn: function(index) {
        var wrapper = this.getWrapper(index);
        return wrapper.find('button.remove');
    },
    removeThumb: function(e, index) {
        e.preventDefault();
        var img = this.getImageThumb(index);
        img.removeAttr('src').hide();
        this.getLibBtn(index).show();
        this.getCameraBtn(index).show();
        this.getRemoveBtn(index).hide(); // this.trigger('imageRemoved'); // trigger events used by grouped camera fields NOTE: don't move to setImageData fn, could result in infinite event callback triggering as group camera field may call into setImageData()
    },
    addFromCamera: function(e, index) {
        e.preventDefault();
        var self = this;
        var params = {};

        params = this.model.getPhotoOptions();

        if (this.model.utils.isPhoneGapCamAvailable()) {
            this.model.utils.takePhoto(params, function(err, imageURI) {
                if (err) {
                    $fh.forms.log.e("Error Taking Photo", err);
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
            actionBar.find('.camCancel').on('click', function() {
                self.model.utils.cancelHtml5Camera();
                camObj.remove();
            });
            this.model.utils.initHtml5Camera(params, function(err, video) {
                if (err) {
                    $fh.forms.log.e(err);
                    camObj.remove();
                } else {
                    $(video).css('width', '100%');
                    camObj.find('.cam').append(video);
                    actionBar.find('.camOk').on('click', function() {
                        self.model.utils.takePhoto(params, function(err, base64Image) {//The image that comes from the html5 camera is base64
                            camObj.remove();
                            if (err) {
                                $fh.forms.log.e(err);
                            } else {
                                self.setImage(index, base64Image, true);
                            }
                        });
                    });
                }
            });
        }
    },
    addFromLibrary: function(e, index) {
        var self = this;
        var params = {};
        if (self.model.utils.isPhoneGapCamAvailable()) {
            e.preventDefault();
            params.sourceType = Camera.PictureSourceType.PHOTOLIBRARY;
            self.model.utils.takePhoto(params, function(err, imageURI) {
                if (err) {
                    $fh.forms.log.e("error occured with take photo ", JSON.stringify(err));
                }
                if (imageURI) {
                    self.setImage(index, imageURI);
                }
            });
        } else {
            var file = document.createElement('input');
            file.type = 'file';
            var fileObj = $(file);
            fileObj.hide();
            self.$el.append(fileObj);
            fileObj.on('change', function() {
                var file = fileObj[0];
                if (file.files && file.files.length > 0) {
                    file = file.files[0];
                    fileObj.remove();
                    self.model.utils.fileSystem.fileToBase64(file, function(err, base64Img) {
                        if (err) {
                            $fh.forms.log.e(err);
                        } else {
                            self.setImage(index, base64Img, true);
                        }
                    });
                }
            });
            fileObj.click();
        }
    },
    valueFromElement: function(index) {
        var img = this.getImageThumb(index);
        return img.attr('src');
    },
    valuePopulateToElement: function(index, value) {
        if (value) {
            var imageData = null;
            if(value.imgHeader){
              imageData = value.data;
              var base64Img = value.imgHeader + imageData;
              this.setImage(index, base64Img);
            } else {
              this.setImage(index, value.data);
            }
        }
    }
});
appForm.models = function(module) {
  var Model = appForm.models.Model;
  var online = true;
  var cloudHost = "notset";

  function Config() {
    Model.call(this, {
      '_type': 'config',
      "_ludid": "config"
    });

  }
  appForm.utils.extend(Config, Model);
  //call in appForm.init
  Config.prototype.init = function(config, cb) {
    if (config.studioMode) { //running in studio
      this.set("studioMode", true);
      this.fromJSON(config);
      cb();
    } else {
      this.set("studioMode", false);
      //load hard coded static config first
      this.staticConfig(config);
      //attempt to load config from mbaas then local storage.
      this.refresh(true, cb); 
    }
  };
  Config.prototype.isStudioMode = function(){
    return this.get("studioMode");
  };
  Config.prototype.refresh = function (fromRemote, cb) {
    var dataAgent = this.getDataAgent();
    var self = this;
    if (typeof cb === 'undefined') {
      cb = fromRemote;
      fromRemote = false;
    }

    function _handler(err, res) {
      var configObj = {};

      if (!err && res) {
        if(typeof(res) === "string"){
          try{
            configObj = JSON.parse(res);
          } catch(error){
            $fh.forms.log.e("Invalid json config defintion from remote", error);
            configObj = {};
            return cb(error, null);
          }
        } else {
          configObj = res;
        }

        self.set("defaultConfigValues", configObj);
        self.saveLocal(function(err, updatedConfigJSON){
          cb(err, self);
        });
      } else {
        cb(err, self);
      }
    }
    self.loadLocal(function(err, localConfig){
      if(err) {
        $fh.forms.log.e("Config loadLocal ", err);
      }

      dataAgent.remoteStore.read(self, _handler);
    });
  };
  Config.prototype.getCloudHost = function(){
    return cloudHost;  
  };
  Config.prototype.staticConfig = function(config) {
    var self = this;
    var defaultConfig = {"defaultConfigValues": {}, "userConfigValues": {}};
    //If user already has set values, don't want to overwrite them
    if(self.get("userConfigValues")){
      defaultConfig.userConfigValues = self.get("userConfigValues");
    }
    var appid = $fh && $fh.app_props ? $fh.app_props.appid : config.appid;
    var mode = $fh && $fh.app_props ? $fh.app_props.mode : 'dev';
    self.set('appId', appid);
    self.set('env', mode);

    if($fh && $fh._getDeviceId){
      self.set('deviceId', $fh._getDeviceId());
    } else {
      self.set('deviceId', "notset");
    }


    self._initMBaaS(config);
    //Setting default retry attempts if not set in the config
    if (!config) {
      config = {};
    }

    //config_admin_user can not be set by the user.
    if(config.config_admin_user){
      delete config.config_admin_user;
    }

    defaultConfig.defaultConfigValues = config;
    var staticConfig = {
      "sent_save_min": 5,
      "sent_save_max": 1000,
      "targetWidth": 640,
      "targetHeight": 480,
      "quality": 50,
      "debug_mode": false,
      "logger": false,
      "max_retries": 3,
      "timeout": 7,
      "log_line_limit": 5000,
      "log_email": "test@example.com",
      "log_level": 3,
      "log_levels": ["error", "warning", "log", "debug"],
      "config_admin_user": true,
      "picture_source": "both",
      "saveToPhotoAlbum": true,
      "encodingType": "jpeg"
    };

    for(var key in staticConfig){
      defaultConfig.defaultConfigValues[key] = staticConfig[key];
    }

    self.fromJSON(defaultConfig);
  };
  Config.prototype._initMBaaS = function(config) {
    var self = this;
    config = config || {};
    var cloud_props = $fh.cloud_props;
    var app_props = $fh.app_props;
    var mode = 'dev';
    if (app_props) {
      cloudHost = app_props.host;
    }
    if (cloud_props && cloud_props.hosts) {
      cloudHost = cloud_props.hosts.url;
    }

    if(typeof(config.cloudHost) === 'string'){
      cloudHost = config.cloudHost;
    }

    
    self.set('mbaasBaseUrl', '/mbaas');
    var appId = self.get('appId');
    self.set('formUrls', {
      'forms': '/forms/:appId',
      'form': '/forms/:appId/:formId',
      'theme': '/forms/:appId/theme',
      'formSubmission': '/forms/:appId/:formId/submitFormData',
      'fileSubmission': '/forms/:appId/:submissionId/:fieldId/:hashName/submitFormFile',
      'base64fileSubmission': '/forms/:appId/:submissionId/:fieldId/:hashName/submitFormFileBase64',
      'submissionStatus': '/forms/:appId/:submissionId/status',
      'formSubmissionDownload': '/forms/:appId/submission/:submissionId',
      'fileSubmissionDownload': '/forms/:appId/submission/:submissionId/file/:fileGroupId',
      'completeSubmission': '/forms/:appId/:submissionId/completeSubmission',
      'config': '/forms/:appid/config/:deviceId'
    });
    self.set('statusUrl', '/sys/info/ping');
  };
  Config.prototype.setOnline = function(){
    online = true;
    this.emit('online');
  };
  Config.prototype.setOffline = function(){
    online = false;
    this.emit('offline');
  };
  Config.prototype.isOnline = function(){
    var self = this;
    if(appForm.utils.isPhoneGap()){
      if(navigator.connection.type){
        return online === true && navigator.connection.type !== Connection.NONE;
      } else {
        return online === true;
      }
    } else {
      return online === true;
    }

  };
  Config.prototype.isStudioMode = function(){
    return this.get("studioMode", false);
  };

  module.config = new Config();
  return module;
}(appForm.models || {});
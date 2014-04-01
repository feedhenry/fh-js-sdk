appForm.models = function(module) {
  var Model = appForm.models.Model;

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
      //load hard coded static config first
      this.staticConfig();
      //attempt load config from mbaas then local storage.
      this.refresh(true, cb);
    }
  };
  Config.prototype.refresh = function (fromRemote, cb) {
    var dataAgent = this.getDataAgent();
    var self = this;
    if (typeof cb == 'undefined') {
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
      if(err) $fh.forms.log.e("Config loadLocal ", err);

      dataAgent.remoteStore.read(self, _handler);
    });
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
      "config_admin_user": true
    };

    for(var key in staticConfig){
      defaultConfig.defaultConfigValues[key] = staticConfig[key];
    }

    self.fromJSON(defaultConfig);
    self._initMBaaS();
  };
  Config.prototype._initMBaaS = function() {
    var cloud_props = $fh.cloud_props;
    var app_props = $fh.app_props;
    var cloudUrl;
    var mode = 'dev';
    if (app_props) {
      cloudUrl = app_props.host;
      mode = app_props.mode ? app_props.mode : 'dev';
    }
    if (cloud_props && cloud_props.hosts) {
      cloudUrl = cloud_props.hosts.url;
    }
    this.set('cloudHost', cloudUrl);
    this.set('mbaasBaseUrl', '/mbaas');
    var appId = this.get('appId');
    //ebaas url definition https://docs.google.com/a/feedhenry.com/document/d/1_bd4kZMm7q6C1htNJBTSA2X4zi1EKx0hp_4aiJ-N5Zg/edit#
    this.set('formUrls', {
      'forms': '/forms/:appId',
      'form': '/forms/:appId/:formId',
      'theme': '/forms/:appId/theme',
      'formSubmission': '/forms/:appId/:formId/submitFormData',
      'fileSubmission': '/forms/:appId/:submissionId/:fieldId/:hashName/submitFormFile',
      'base64fileSubmission': '/forms/:appId/:submissionId/:fieldId/:hashName/submitFormFileBase64',
      'submissionStatus': '/forms/:appId/:submissionId/status',
      'completeSubmission': '/forms/:appId/:submissionId/completeSubmission',
      "config": '/forms/:appid/config/:deviceId'
    });
  };

  module.config = new Config();
  return module;
}(appForm.models || {});
var Model = require("./model");
var utils = require("./utils");
var dataAgent = require('./dataAgent');
var appProps = require("../appProps");
var device = require("../device");
var waitForCloud = require("../waitForCloud");
var log = require("./log");
var online = true;
var cloudHost = "notset";

function Config() {
    Model.call(this, {
      '_type': 'config',
      "_ludid": "config"
    });
  }
  utils.extend(Config, Model);
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
            log.e("Invalid json config defintion from remote", error);
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
        log.e("Config loadLocal ", err);
      }

      dataAgent.refreshRead(self, _handler);
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
    var appId = appProps.getAppProps().appId || config.appId;
    var mode = appProps.getAppProps().mode || 'dev';
    self.set('appId', appId);
    self.set('env', mode);

	self.set('deviceId', device.getDeviceId());


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
      "encodingType": "jpeg",
      "sent_items_to_keep_list": [5, 10, 20, 30, 40, 50, 100]
    };

    for(var key in staticConfig){
      defaultConfig.defaultConfigValues[key] = staticConfig[key];
    }

    self.fromJSON(defaultConfig);
  };
  Config.prototype._initMBaaS = function(config) {
    var self = this;
    config = config || {};
    cloudHost = waitForCloud.getCloudHostUrl(); 
    
    self.set('mbaasBaseUrl', '/mbaas');
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
    var wasOnline = online;
    online = true;

    if(!wasOnline){
      this.emit('online');
    }
  };
  Config.prototype.setOffline = function(){
    var wasOnline = online;
    online = false;

    if(wasOnline){
      this.emit('offline');  
    }
  };
  Config.prototype.isOnline = function(){
    var self = this;
    if(utils.isPhoneGap()){
      if(navigator.connection && navigator.connection.type){
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

console.log("Finishe Config Model Export");

module.exports = new Config();
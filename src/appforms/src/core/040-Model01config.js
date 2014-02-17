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
      this.refresh(cb);
    }

  };
  Config.prototype.staticConfig = function(config) {
    var appid = $fh && $fh.app_props ? $fh.app_props.appid : config.appid;
    var mode = $fh && $fh.app_props ? $fh.app_props.mode : 'dev';
    this.set('appId', appid);
    this.set('env', mode);
    this.set('timeoutTime', 30000);
    var self = this;
    if ($fh && 'function' === typeof $fh.env) {
      $fh.env(function(env) {
        self.set('deviceId', env.uuid);
      });
    }
    this._initMBaaS();
    //Setting default retry attempts if not set in the config
    if (config === undefined) {
      config = {};
    }
    if (typeof config.submissionRetryAttempts === 'undefined') {
      config.submissionRetryAttempts = 2;
    }

    if (config.submissionTimeout == null) {
      config.submissionTimeout = 20; //Default 20 seconds timeout
    }
    this.fromJSON(config);
    this.fromJSON({
      "sent_save_min": 5,
      "sent_save_max": 1000,
      "targetWidth": 100,
      "targetHeight": 100,
      "quality": 75,
      "debug_mode": false,
      "logger": false,
      "max_retries": 0,
      "timeout": 30,
      "log_line_limit": 300,
      "log_email": "logs.enterpriseplc@feedhenry.com",
      "log_level": 2,
      "log_levels": ["error", "warning", "log", "debug"],
      "config_admin_user": true
    });
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
      if (mode.indexOf('dev') > -1) {
        //dev mode
        cloudUrl = cloud_props.hosts.debugCloudUrl;
      } else {
        //live mode
        cloudUrl = cloud_props.hosts.releaseCloudUrl;
      }
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
      "config": '/forms/:appid/config'
    });
  };
  Config.prototype.saveLocal = function(cb){
    if(this.get("config_admin_user") === true){
      Model.prototype.saveLocal.call(this, cb);
    } else {
      cb("Must be an admin user to change client settings.");
    }
  };
  Config.prototype.set = function(key, value){
    if(this.get("config_admin_user") === true){
      Model.prototype.set.call(this, key, value);
    }
  };
  module.config = new Config();
  return module;
}(appForm.models || {});
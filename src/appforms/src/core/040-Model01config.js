appForm.models = function (module) {
  var Model = appForm.models.Model;
  function Config() {
    Model.call(this, { '_type': 'config' });
  }
  appForm.utils.extend(Config, Model);
  //call in appForm.init
  Config.prototype.init = function (config, cb) {
    var appid = $fh && $fh.app_props ? $fh.app_props.appid : config.appid;
    var mode = $fh && $fh.app_props ? $fh.app_props.mode : 'dev';
    this.set('appId', appid);
    this.set('env', mode);
    this.set('timeoutTime', 30000);
    var self = this;
    if ($fh && 'function' === typeof $fh.env) {
      $fh.env(function (env) {
        self.set('deviceId', env.uuid);
      });
    }
    this._initMBaaS();
    //Setting default retry attempts if not set in the config
    if (typeof config.submissionRetryAttempts === 'undefined') {
      config.submissionRetryAttempts = 2;
    }

    if(config.submissionTimeout == null){
      config.submissionTimeout = 20;//Default 20 seconds timeout
    }
    
    this.fromJSON(config);
    cb();
  };
  Config.prototype._initMBaaS = function () {
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
      'forms': '/forms',
      'form': '/forms/:formId',
      'theme': '/forms/theme',
      'formSubmission': '/forms/:formId/submitFormData',
      'fileSubmission': '/forms/:submissionId/:fieldId/:hashName/submitFormFile',
      'base64fileSubmission': '/forms/:submissionId/:fieldId/:hashName/submitFormFileBase64',
      'submissionStatus': '/forms/:submissionId/status',
      'completeSubmission': '/forms/:submissionId/completeSubmission'
    });
  };
  module.config = new Config();
  return module;
}(appForm.models || {});
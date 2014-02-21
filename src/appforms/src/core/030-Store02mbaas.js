appForm.stores = function(module) {
  var Store = appForm.stores.Store;
  module.mBaaS = new MBaaS();

  function MBaaS() {
    Store.call(this, 'MBaaS');
  }
  appForm.utils.extend(MBaaS, Store);
  MBaaS.prototype.checkStudio = function() {
    return appForm.config.get("studioMode");
  };
  MBaaS.prototype.create = function(model, cb) {
    if (this.checkStudio()) {
      cb("Studio mode not supported");
    } else {
      var url = _getUrl(model);
      if((model.get("_type") == "fileSubmission" || model.get("_type") == "base64fileSubmission") && (typeof window.Phonegap !== "undefined" || typeof window.cordova !== "undefined")){
        appForm.web.uploadFile(url, model.getProps(), cb);
      } else {
        appForm.web.ajax.post(url, model.getProps(), cb);
      }
    }
  };
  MBaaS.prototype.read = function(model, cb) {
    if (this.checkStudio()) {
      cb("Studio mode not supported");
    } else {
      if (model.get("_type") == "offlineTest") {
        cb("offlinetest. ignore");
      } else {
        var url = _getUrl(model);
        appForm.web.ajax.get(url, cb);
      }
    }
  };
  MBaaS.prototype.update = function(model, cb) {};
  MBaaS.prototype["delete"] = function(model, cb) {};
  //@Deprecated use create instead
  MBaaS.prototype.completeSubmission = function(submissionToComplete, cb) {
    var url = _getUrl(submissionToComplete);
    appForm.web.ajax.post(url, {}, cb);
  };
  MBaaS.prototype.submissionStatus = function(submission, cb) {
    var url = _getUrl(submission);
    appForm.web.ajax.get(url, cb);
  };

  function _getUrl(model) {
    $fh.forms.log.d("_getUrl ", model);
    var type = model.get('_type');
    var host = appForm.config.get('cloudHost');
    var mBaaSBaseUrl = appForm.config.get('mbaasBaseUrl');
    var formUrls = appForm.config.get('formUrls');
    var relativeUrl = "";
    if (formUrls[type]) {
      relativeUrl = formUrls[type];
    } else {
      $fh.forms.log.e('type not found to get url:' + type);
    }
    var url = host + mBaaSBaseUrl + relativeUrl;
    var props = {};
    props.appId = appForm.config.get('appId');
    //Theme and forms do not require any parameters that are not in _fh
    switch (type) {
      case 'config':
        props.appid = model.get("appId");
        break;
      case 'form':
        props.formId = model.get('_id');
        break;
      case 'formSubmission':
        props.formId = model.getFormId();
        break;
      case 'fileSubmission':
        props.submissionId = model.getSubmissionId();
        props.hashName = model.getHashName();
        props.fieldId = model.getFieldId();
        break;
      case 'base64fileSubmission':
        props.submissionId = model.getSubmissionId();
        props.hashName = model.getHashName();
        props.fieldId = model.getFieldId();
        break;
      case 'submissionStatus':
        props.submissionId = model.get('submissionId');
        break;
      case 'completeSubmission':
        props.submissionId = model.get('submissionId');
        break;
      case 'offlineTest':
        return "http://127.0.0.1:8453";
    }
    for (var key in props) {
      url = url.replace(':' + key, props[key]);
    }
    return url;
  }
  return module;
}(appForm.stores || {});
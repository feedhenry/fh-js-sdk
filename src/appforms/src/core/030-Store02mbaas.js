appForm.stores = function (module) {
  var Store = appForm.stores.Store;
  module.mBaaS = new MBaaS();
  function MBaaS() {
    Store.call(this, 'MBaaS');
  }
  appForm.utils.extend(MBaaS, Store);
  MBaaS.prototype.create = function (model, cb) {
    var url = _getUrl(model);
    appForm.web.ajax.post(url, model.getProps(), cb);
  };
  MBaaS.prototype.read = function (model, cb) {
    var url = _getUrl(model);
    appForm.web.ajax.get(url, cb);
  };
  MBaaS.prototype.update = function (model, cb) {
  };
  MBaaS.prototype["delete"] = function (model, cb) {
  };
  //@Deprecated use create instead
  MBaaS.prototype.completeSubmission = function (submissionToComplete, cb) {
    var url = _getUrl(submissionToComplete);
    appForm.web.ajax.post(url, {}, cb);
  };
  MBaaS.prototype.submissionStatus = function (submission, cb) {
    var url = _getUrl(submission);
    appForm.web.ajax.get(url, cb);
  };
  function _getUrl(model) {
    var type = model.get('_type');
    var host = appForm.config.get('cloudHost');
    var mBaaSBaseUrl = appForm.config.get('mbaasBaseUrl');
    var formUrls = appForm.config.get('formUrls');
    var relativeUrl="";
    if (formUrls[type]) {
      relativeUrl = formUrls[type];
    } else {
      throw 'type not found to get url:' + type;
    }
    var url = host + mBaaSBaseUrl + relativeUrl;
    var props = {};
    //Theme and forms do not require any parameters that are not in _fh
    switch (type) {
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
    }
    for (var key in props) {
      url = url.replace(':' + key, props[key]);
    }
    return url;
  }
  return module;
}(appForm.stores || {});
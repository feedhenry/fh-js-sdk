appForm.utils = function(module) {
  module.extend = extend;
  module.localId = localId;
  module.md5 = md5;
  module.getTime = getTime;
  module.send=send;
  module.isPhoneGap = isPhoneGap;
  module.generateGlobalEventName = function(type, eventName){
    return "" + type + ":" + eventName;
  };

  function isPhoneGap() {
    return (typeof window.Phonegap !== "undefined" || typeof window.cordova !== "undefined");
  }

  function extend(child, parent) {

    if (parent.constructor && parent.constructor === Function) {
      for (var mkey in parent.prototype) {
        child.prototype[mkey] = parent.prototype[mkey];
      }
    } else {
      for (var key in parent) {
        child.prototype[key] = parent[key];
      }
    }
  }

  function getTime(timezoneOffset) {
    var now = new Date();
    if (timezoneOffset) {
      return now.getTimezoneOffset();
    } else {
      return now;
    }
  }

  function localId(model) {
    var props = model.getProps();
    var _id = props._id;
    var _type = props._type;
    var ts = getTime().getTime();
    if (_id && _type) {
      return _id + '_' + _type + '_' + ts;
    } else if (_id) {
      return _id + '_' + ts;
    } else if (_type) {
      return _type + '_' + ts;
    } else {
      return ts;
    }
  }
  /**
   * md5 hash a string
   * @param  {[type]}   str [description]
   * @param  {Function} cb  (err,md5str)
   * @return {[type]}       [description]
   */
  function md5(str, cb) {
    if (typeof $fh !== 'undefined' && $fh.hash) {
      $fh.hash({
        algorithm: 'MD5',
        text: str
      }, function(result) {
        if (result && result.hashvalue) {
          cb(null, result.hashvalue);
        } else {
          cb('Crypto failed.');
        }
      });
    } else {
      cb('Crypto not found');
    }
  }

  function send(params,cb){
    $fh.forms.log.d("Sending mail: ", params);
    $fh.send(params,function(){
      cb(null);
    },function(msg){
      cb(msg);
    });
  }
  return module;
}(appForm.utils || {});

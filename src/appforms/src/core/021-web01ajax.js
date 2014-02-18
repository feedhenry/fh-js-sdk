appForm.web.ajax = function (module) {
  module = typeof $fh != 'undefined' && $fh.__ajax ? $fh.__ajax : _myAjax;
  module.get = get;
  module.post = post;
  var _ajax = module;
  function _myAjax() {
  }
  function get(url, cb) {
    console.log(url);
    _ajax({
      'url': url,
      'type': 'GET',
      'success': function (data, text) {
        cb(null, data);
      },
      'error': function (xhr, status, err) {
        cb(xhr);
      }
    });
  }
  function post(url, body, cb) {
    var file = false;
    var formData;
    if (typeof body == 'object') {
      if (body instanceof File) {
        file = true;
        formData = new FormData();
        var name = body.name;
        formData.append(name, body);
        body = formData;
      } else {
        body = JSON.stringify(body);
      }
    }
    var param = {
        'url': url,
        'type': 'POST',
        'data': body,
        'dataType': 'json',
        'success': function (data, text) {
          cb(null, data);
        },
        'error': function (xhr, status, err) {
          cb(xhr);
        }
      };
    if (file === false) {
      param.contentType = 'application/json';
    }
    _ajax(param);
  }
  return module;
}(appForm.web.ajax || {});
appForm.web.ajax = function (module) {
  module = typeof $fh !== 'undefined' && $fh.__ajax ? $fh.__ajax : _myAjax;
  module.get = get;
  module.post = post;
  var _ajax = module;
  function _myAjax() {
  }
  function get(url, cb) {
    $fh.forms.log.d("Ajax get ", url);
    _ajax({
      'url': url,
      'type': 'GET',
      'dataType': 'json',
      'success': function (data, text) {
        $fh.forms.log.d("Ajax get", url, "Success");
        cb(null, data);
      },
      'error': function (xhr, status, err) {
        $fh.forms.log.e("Ajax get", url, "Fail", xhr, status, err);
        cb(xhr);
      }
    });
  }
  function post(url, body, cb) {
    $fh.forms.log.d("Ajax post ", url, body);
    var file = false;
    var formData;
    if (typeof body === 'object') {
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
          $fh.forms.log.d("Ajax post ", url, " Success");
          cb(null, data);
        },
        'error': function (xhr, status, err) {
          $fh.forms.log.e("Ajax post ", url, " Fail ", xhr, status, err);
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
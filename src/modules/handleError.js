var JSON = require("JSON");

module.exports = function(fail, req, resStatus){
  var errraw;
  if(req){
    try{
      var res = JSON.parse(req.responseText);
      errraw = res.error || res.msg;
      if (errraw instanceof Array) {
        errraw = errraw.join('\n');
      }
    } catch(e){
      errraw = req.responseText;
    }
  }
  if(fail){
    fail('error_ajaxfail', {
      status: req.status,
      message: resStatus,
      error: errraw
    });
  }
};

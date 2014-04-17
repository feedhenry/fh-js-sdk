//$fh.ready(function() {
(function () {

  Function.prototype.getName = function()
  {
    if(this.name)
      return this.name;
    var definition = this.toString().split("\n")[0];
    var exp = /^function ([^\s(]+).+/;
    if(exp.test(definition))
      return definition.split("\n")[0].replace(exp, "$1") || "anonymous";
    return "anonymous";
  }

  var _dbg = function(){
    var clazz = arguments[0];
    var self = arguments[1];
    var func = arguments[2];
    var args = Array.prototype.slice.call(arguments,3)[0];

    var strArr = _stringify.apply(this,args);
    strArr.unshift(new Date().toUTCString() + ' ::');
    var str = strArr.join(' ');

    $("#logger .logs").prepend($("<p>").addClass(clazz).text(str));
    if (typeof App.config.getValueOrDefault('log_line_limit') !== 'undefined') {
      $('#logger .logs p:gt(' + (App.config.getValueOrDefault('log_line_limit') - 1) + ')').remove();
    }

    // output to console
    try{
      func.call(self, str);
    }catch(e){
      if(console && console.log){
        console.log("Failed to log message. Error: " + e.message);
      }
    }
  };

  var _stringify = function(){
    var self = this;
    return _.collect(arguments, function (arg){
      if(_.isArray(arg)) {
        return _.collect(arg, function (v,k){
          return _stringify.call(self,v);
        },this);
      }
      if(_.isFunction(arg)) {
        //return "<func>";
        return Utils.truncate(arg.getName(),150);
      }
      if(!_.isString(arg)   && !_.isNumber(arg)) {
        if(arg instanceof Error) {
          return JSON.stringify(arg);
        } else {
          return Utils.truncate(JSON.stringify(arg),150);
        }
      }
      return arg;
    },this);
  };

  var _getLogsAsString = function () {
    var str = '';
    $('#logger .logs p').each(function () {
      str += $(this).text() + '\n';
    });
    return str;
  };

  if (!$fh.logger) {
    $fh.logger = {
      clear : function (){
        $("#logger .logs").empty();
      },
      send: function () {
        var str = _getLogsAsString();

        $fh.env(function (env) {
          $fh.send({
            "type": "email",
            "to": App.config.getValueOrDefault('log_email') || 'test@example.com',
            "subject": "App Forms App Logs",
            "body": "Device Environment:\n" + JSON.stringify(env, null, 2) + "\n\nApp Logs:\n" + str
          }, function () {
            $fh.logger.debug('LOGS SENT OK');
          }, function (msg) {
            $fh.logger.warn('ERROR SENDING LOGS (1200): msg=' + JSON.stringify(msg));
          });
        });
      },
      store : function () {
        var str = _getLogsAsString();

        $fh.env(function (env) {
          $fh.act({
            "act": "fh_logger_store",
            "req": {
              "env": env,
              "logs": str
            }
          }, function (res) {
            if (res && res.status === 'ok') {
              $fh.logger.debug('LOGS STORED OK: ID=' + res.id + ' res=' + JSON.stringify(res));
            } else {
              $fh.logger.warn('ERROR STORING LOGS (1100): res=' + JSON.stringify(res));
            }
          }, function (msg, err) {
            $fh.logger.warn('ERROR STORING LOGS (1101): msg=' + msg + ', err=' + JSON.stringify(err));
          });
        });
      },
      trace : function (){
        _dbg.call(this,"trace",console,console.debug,arguments);
      },
      silly : function (){
        _dbg.call(this,"silly",console,console.trace,arguments);
      },
      debug : function (){
        _dbg.call(this,"debug",console,console.debug,arguments);
      },
      info : function (){
        _dbg.call(this,"info",console,console.debug,arguments);
      },
      error : function (){
        _dbg.call(this,"error",console,console.error,arguments);
      },
      warn : function (){
        _dbg.call(this,"warn",console,console.debug,arguments);
      }
    };
  }
})();


/**
 * Async log module
 * @param  {[type]} module [description]
 * @return {[type]}        [description]
 */
appForm.models = (function(module) {
  var Model = appForm.models.Model;

  function Log() {
    Model.call(this, {
      '_type': 'log',
      "_ludid": "log"
    });
    this.set("logs", []);
    this.isWriting = false;
    this.moreToWrite = false;
    //    appForm.
    //    this.loadLocal(function() {});
  }
  appForm.utils.extend(Log, Model);

  Log.prototype.info = function(logLevel, msgs) {
    if(logLevel === 'error'){
      console.error(msgs);
    }
    if ($fh.forms.config.get("logger") === "true") {
      var levelString = "";
      var curLevel = $fh.forms.config.get("log_level");
      var log_levels = $fh.forms.config.get("log_levels");
      var self = this;
      if (typeof logLevel === "string") {
        levelString = logLevel;
        logLevel = log_levels.indexOf(logLevel.toLowerCase());
      } else {
        levelString = log_levels[logLevel];
        if (logLevel >= log_levels.length) {
          levelString = "Unknown";
        }
      }
      if (curLevel < logLevel) {
        return;
      } else {
        var args = Array.prototype.splice.call(arguments, 0);
        var logs = self.get("logs");
        args.shift();
        while (args.length > 0) {
          logs.push(self.wrap(args.shift(), levelString));
          if (logs.length > $fh.forms.config.get("log_line_limit")) {
            logs.shift();
          }
        }
        if (self.isWriting) {
          self.moreToWrite = true;
        } else {
          var _recursiveHandler = function() {
            if (self.moreToWrite) {
              self.moreToWrite = false;
              self.write(_recursiveHandler);
            }
          };
          self.write(_recursiveHandler);
        }
      }
    }
  };
  Log.prototype.wrap = function(msg, levelString) {
    var now = new Date();
    var dateStr = now.toISOString();
    if (typeof msg === "object") {
      msg = JSON.stringify(msg);
    }
    var finalMsg = dateStr + " " + levelString.toUpperCase() + " " + msg;
    return finalMsg;
  };
  Log.prototype.getPolishedLogs = function() {
    var arr = [];
    var logs = this.getLogs();
    var patterns = [{
      reg: /^.+\sERROR\s.*/,
      color: $fh.forms.config.get('color_error') || "#FF0000"
    }, {
      reg: /^.+\sWARNING\s.*/,
      color: $fh.forms.config.get('color_warning') || "#FF9933"
    }, {
      reg: /^.+\sLOG\s.*/,
      color: $fh.forms.config.get('color_log') || "#009900"
    }, {
      reg: /^.+\sDEBUG\s.*/,
      color: $fh.forms.config.get('color_debug') || "#3366FF"
    }, {
      reg: /^.+\sUNKNOWN\s.*/,
      color: $fh.forms.config.get('color_unknown') || "#000000"
    }];
    for (var i = 0; i < logs.length; i++) {
      var log = logs[i];
      for (var j = 0; j < patterns.length; j++) {
        var p = patterns[j];
        if (p.reg.test(log)) {
          arr.unshift("<div style='color:" + p.color + ";'>" + log + "</div>");
          break;
        }
      }
    }
    return arr;
  };
  Log.prototype.write = function(cb) {
    var self = this;
    self.isWriting = true;
    self.saveLocal(function() {
      self.isWriting = false;
      cb();
    });
  };
  Log.prototype.e = function() {
    var args = Array.prototype.splice.call(arguments, 0);
    args.unshift("error");
    this.info.apply(this, args);
  };
  Log.prototype.w = function() {
    var args = Array.prototype.splice.call(arguments, 0);
    args.unshift("warning");
    this.info.apply(this, args);
  };
  Log.prototype.l = function() {
    var args = Array.prototype.splice.call(arguments, 0);
    args.unshift("log");
    this.info.apply(this, args);
  };
  Log.prototype.d = function() {
    var args = Array.prototype.splice.call(arguments, 0);
    args.unshift("debug");
    this.info.apply(this, args);
  };
  Log.prototype.getLogs = function() {
    return this.get("logs");
  };
  Log.prototype.clearLogs = function(cb) {
    this.set("logs", []);
    this.saveLocal(function() {
      if (cb) {
        cb();
      }
    });
  };
  Log.prototype.sendLogs = function(cb) {
    var email = $fh.forms.config.get("log_email");
    var config = appForm.config.getProps();
    var logs = this.getLogs();
    var params = {
      "type": "email",
      "to": email,
      "subject": "App Forms App Logs",
      "body": "Configuration:\n" + JSON.stringify(config) + "\n\nApp Logs:\n" + logs.join("\n")
    };
    appForm.utils.send(params, cb);
  };
  module.log = new Log();
  appForm.log = module.log;
  return module;
})(appForm.models || {});
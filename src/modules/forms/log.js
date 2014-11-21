/**
 * Async log module
 * @param  {[type]} module [description]
 * @return {[type]}        [description]
 */

var utils = require("./utils");
var config = require("./config");

function Log() {
    console.log("Init Log");
    this.logs = [];
    this.isWriting = false;
    this.moreToWrite = false;
}


Log.prototype.info = function(logLevel, msgs) {
    var self = this;
    if (config.get("logger") === true) {
        var levelString = "";
        var curLevel = config.get("log_level");
        var log_levels = config.get("log_levels");
        
        if (typeof logLevel === "string") {
            levelString = logLevel;
            logLevel = log_levels.indexOf(logLevel.toLowerCase());
        } else {
            logLevel = 0;
        }

        curLevel = isNaN(parseInt(curLevel, 10)) ? curLevel : parseInt(curLevel, 10);
        logLevel = isNaN(parseInt(logLevel, 10)) ? logLevel : parseInt(logLevel, 10);

        if (curLevel < logLevel) {
            return;
        } else {
            var args = Array.splice.call(arguments, 0);
            var logs = self.get("logs");
            args.shift();
            var logStr = "";
            while (args.length > 0) {
                logStr += JSON.stringify(args.shift()) + " ";
            }
            logs.push(self.wrap(logStr, levelString));
            if (logs.length > config.get("log_line_limit")) {
                logs.shift();
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

Log.prototype.write = function(cb) {
    var self = this;
    self.isWriting = true;
    self.saveLocal(function() {
        self.isWriting = false;
        cb();
    });
};
Log.prototype.e = function() {
    var args = Array.splice.call(arguments, 0);
    args.unshift("error");
    this.info.apply(this, args);
};
Log.prototype.w = function() {
    var args = Array.splice.call(arguments, 0);
    args.unshift("warning");
    this.info.apply(this, args);
};
Log.prototype.l = function() {
    var args = Array.splice.call(arguments, 0);
    args.unshift("log");
    this.info.apply(this, args);
};
Log.prototype.d = function() {
    var args = Array.splice.call(arguments, 0);
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
    var email = config.get("log_email");
    var configJSON = config.getProps();
    var logs = this.getLogs();
    var params = {
        "type": "email",
        "to": email,
        "subject": "App Forms App Logs",
        "body": "Configuration:\n" + JSON.stringify(configJSON) + "\n\nApp Logs:\n" + logs.join("\n")
    };
    utils.send(params, cb);
};


module.exports = new Log();
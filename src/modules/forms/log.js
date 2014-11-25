/**
 * Async log module
 * @param  {[type]} module [description]
 * @return {[type]}        [description]
 */

var utils = require("./utils");
var config = require("./config");
var currentLog;

var Log = {
    logs: [],
    isWriting: false,
    moreToWrite: false
};

Log.info = function(logLevel, msgs) {
     var args = Array.prototype.slice.call(arguments);
    console.log("LOG: ", args);
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
                // var _recursiveHandler = function() {
                //     if (self.moreToWrite) {
                //         self.moreToWrite = false;
                //         self.write(_recursiveHandler);
                //     }
                // };
                // self.write(_recursiveHandler);
            }
        }
    }
};
Log.wrap = function(msg, levelString) {
    var now = new Date();
    var dateStr = now.toISOString();
    if (typeof msg === "object") {
        msg = JSON.stringify(msg);
    }
    var finalMsg = dateStr + " " + levelString.toUpperCase() + " " + msg;
    return finalMsg;
};

// Log.write = function(cb) {
//     var self = this;
//     self.isWriting = true;
//     self.saveLocal(function() {
//         self.isWriting = false;
//         cb();
//     });
// };
Log.e = function() {
    var args = Array.prototype.slice.call(arguments);
    args.unshift("error");
    this.info.apply(this, args);
};
Log.w = function() {
    var args = Array.prototype.slice.call(arguments);
    args.unshift("warning");
    this.info.apply(this, args);
};
Log.l = function() {
    var args = Array.prototype.slice.call(arguments);
    args.unshift("log");
    this.info.apply(this, args);
};
Log.d = function() {
    var args = Array.prototype.slice.call(arguments);
    args.unshift("debug");
    this.info.apply(this, args);
};
Log.getLogs = function() {
    return this.get("logs");
};
Log.clearLogs = function(cb) {
    this.set("logs", []);
    this.saveLocal(function() {
        if (cb) {
            cb();
        }
    });
};
Log.sendLogs = function(cb) {
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

console.log("Finished Exporting log");


module.exports = Log;
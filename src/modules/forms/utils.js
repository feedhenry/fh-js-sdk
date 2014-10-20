var hash = require('../api_hash');
var _ = require('../../../libs/underscore.js');

function isPhoneGap() {
    return (typeof window.Phonegap !== "undefined" || typeof window.cordova !== "undefined");
}

function extend(child, parent) {
    console.log(" ************* EXTEND ****************", JSON.stringify(child), JSON.stringify(parent));
    _.extend(child, parent);
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
    hash({
        algorithm: 'MD5',
        text: str
    }, function(result) {
        if (result && result.hashvalue) {
            cb(null, result.hashvalue);
        } else {
            cb('Crypto failed.');
        }
    });
}

function send(params, cb) {
    log.d("Sending mail: ", params);
    if (isPhoneGap() && window.plugin.email) {
        window.plugin.email.isServiceAvailable(function(emailAvailable) {
            if (emailAvailable) {
                window.plugin.email.open(params);
                return cb();
            } else {
                return cb("Email Not Available");
            }
        });
    } else {
        return cb("Email Not Supported");
    }
}

module.exports = {
    extend: extend,
    localId: localId,
    md5: md5,
    getTime: getTime,
    send: send,
    isPhoneGap: isPhoneGap
};
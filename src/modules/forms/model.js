console.log("Exporting Model");

var Event = require('../../../libs/events');
var utils = require("./utils");

var Model = function(options) {
    this.props = options || {};
    this.events = {};
    this.touch();
};

utils.extend(Model, Event);

Model.prototype.getProps = function() {
    return this.props;
};
Model.prototype.get = function(key, def) {
    return typeof this.props[key] === 'undefined' ? def : this.props[key];
};
Model.prototype.set = function(key, val) {
    this.props[key] = val;
};
Model.prototype.setLocalId = function(localId) {
    this.set('_ludid', localId);
};
Model.prototype.getLocalId = function() {
    return this.get('_ludid');
};
Model.prototype.toJSON = function() {
    var retJSON = {};
    for (var key in this.props) {
        retJSON[key] = this.props[key];
    }
    return retJSON;
};
Model.prototype.fromJSON = function(json) {
    if (typeof json === 'string') {
        this.fromJSONStr(json);
    } else {
        for (var key in json) {
            this.set(key, json[key]);
        }
    }
    this.touch();
};
Model.prototype.fromJSONStr = function(jsonStr) {
    try {
        var json = JSON.parse(jsonStr);
        this.fromJSON(json);
    } catch (e) {
        console.error("Error parsing JSON", e);
    }
};

Model.prototype.touch = function() {
    this.set('_localLastUpdate', utils.getTime());
};
Model.prototype.getLocalUpdateTimeStamp = function() {
    return this.get('_localLastUpdate');
};
Model.prototype.genLocalId = function() {
    return utils.localId(this);
};
// *
//  * retrieve model from local or remote with data agent store.
//  * @param {boolean} fromRemote optional true--force from remote
//  * @param  {Function} cb (err,currentModel)
//  * @return {[type]}      [description]

Model.prototype.refresh = function(fromRemote, cb) {
    var that = this;
    if (typeof cb === 'undefined') {
        cb = fromRemote;
        fromRemote = false;
    }
    if (fromRemote) {
        dataAgent.attemptRead(this, _handler);
    } else {
        dataAgent.read(this, _handler);
    }

    function _handler(err, res) {
        if (!err && res) {
            that.fromJSON(res);
            cb(null, that);
        } else {
            cb(err, that);
        }
    }
};
Model.prototype.attemptRefresh = function(cb) {
    var self = this;
    dataAgent.attemptRead(this, function(err, res) {
        if (!err && res) {
            self.fromJSON(res);
            cb(null, self);
        } else {
            cb(err, self);
        }
    });
};
/**
 * Retrieve model from local storage store
 * @param  {Function} cb (err, curModel)
 * @return {[type]}      [description]
 */
Model.prototype.loadLocal = function(cb) {
    var that = this;
    localStorage.read(this, function(err, res) {
        if (err) {
            cb(err);
        } else {
            if (res) {
                that.fromJSON(res);
            }
            cb(err, that);
        }
    });
};
/**
 * save current model to local storage store
 * @param  {Function} cb [description]
 * @return {[type]}      [description]
 */
Model.prototype.saveLocal = function(cb) {
    localStorage.upsert(this, cb);
};
/**
 * Remove current model from local storage store
 * @param  {Function} cb [description]
 * @return {[type]}      [description]
 */
Model.prototype.clearLocal = function(cb) {
    localStorage.removeEntry(this, cb);
};

console.log("EXPORTED MODEL");

module.exports = Model;


var localStorage = require("./localStorage");
var dataAgent = require("./dataAgent");
var _ = require('../../../libs/underscore.js');

var Store = require("./store");
var Model = require("./model");
var log = require("./log");
var config = require("./config");
var storeMbaas = require("./storeMbaas");
var localStorage = require("./localStorage");

//default data agent uses mbaas as remote store, localstorage as local store
function DataAgent(remoteStore, localStore) {
    Store.call(this, 'DataAgent');
    this.remoteStore = remoteStore;
    this.localStore = localStore;
}

utils.extend(DataAgent, Store);
/**
 * Read from local store first,
 if not exists, read from remote store and store locally
 * @param  {[type]}   model [description]
 * @param  {Function} cb    (err,res,isFromRemote)
 * @return {[type]}         [description]
 */
DataAgent.prototype.read = function(model, cb) {
    log.d("DataAgent read ", model);
    var that = this;
    this.localStore.read(model, function(err, locRes) {
        if (err || !locRes) {
            //local loading failed

            log.d("Error reading model from localStore ", model, err);

            that.refreshRead(model, cb);
        } else {
            //local loading succeed
            cb(null, locRes, false);
        }
    });
};
/**
 * Read from remote store and store the content locally.
 * @param  {[type]}   model [description]
 * @param  {Function} cb    [description]
 * @return {[type]}         [description]
 */
DataAgent.prototype.refreshRead = function(model, cb) {
    log.d("DataAgent refreshRead ", model);
    var that = this;
    this.remoteStore.read(model, function(err, res) {
        if (err) {
            log.e("Error reading model from remoteStore ", model, err);
            cb(err);
        } else {
            log.d("Model refresh successfull from remoteStore ", model, res);
            //update model from remote response
            model.fromJSON(res);
            //update local storage for the model
            that.localStore.upsert(model, function() {
                var args = Array.slice.call(arguments, 0);
                args.push(true);
                cb.apply({}, args);
            });
        }
    });
};

/**
 * Attempt to run refresh read first, if failed, run read.
 * @param  {[type]}   model [description]
 * @param  {Function} cb    [description]
 * @return {[type]}         [description]
 */
DataAgent.prototype.attemptRead = function(model, cb) {
    log.d("DataAgent attemptRead ", model);
    var self = this;


    self.checkOnlineStatus(function(online) {
        if ($fh.forms.config.isOnline()) {
            self.refreshRead(model, function(err) {
                if (err) {
                    self.read(model, cb);
                } else {
                    cb.apply({}, arguments);
                }
            });
        } else {
            self.read(model, cb);
        }
    });
};

/**
 * Check online status of the remote store.
 * @param  {Function} cb    [description]
 * @return {[type]}         [description]
 */
DataAgent.prototype.checkOnlineStatus = function(cb) {
    log.d("DataAgent check online status ");
    var self = this;

    if (utils.isPhoneGap()) {
        if (navigator.connection.type) {
            if (navigator.connection.type === Connection.NONE) {
                //No connection availabile, no need to ping.
                $fh.forms.config.offline();
                return cb(false);
            }
        }
    }


    self.remoteStore.isOnline(function(online) {
        if (online === false) {
            $fh.forms.config.offline();
        } else {
            $fh.forms.config.online();
        }

        cb(null, online);
    });
};

//DataAgent is read only store
module.exports = {
    DataAgent: DataAgent,
    dataAgent: new DataAgent(storeMbaas, localStorage)
};
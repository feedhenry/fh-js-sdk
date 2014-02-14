appForm.stores = function (module) {
  var Store = appForm.stores.Store;
  //DataAgent is read only store
  module.DataAgent = DataAgent;
  module.dataAgent = new DataAgent(appForm.stores.mBaaS, appForm.stores.localStorage);
  //default data agent uses mbaas as remote store, localstorage as local store
  function DataAgent(remoteStore, localStore) {
    Store.call(this, 'DataAgent');
    this.remoteStore = remoteStore;
    this.localStore = localStore;
  }
  appForm.utils.extend(DataAgent, Store);
  /**
     * Read from local store first, if not exists, read from remote store and store locally
     * @param  {[type]}   model [description]
     * @param  {Function} cb    (err,res,isFromRemote)
     * @return {[type]}         [description]
     */
  DataAgent.prototype.read = function (model, cb) {
    var that = this;
    this.localStore.read(model, function (err, locRes) {
      if (err || !locRes) {
        //local loading failed
        if (err) {
          console.error(err);
        }
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
  DataAgent.prototype.refreshRead = function (model, cb) {
    var that = this;
    this.remoteStore.read(model, function (err, res) {
      if (err) {
        console.error(err);
        cb(err);
      } else {
        //update model from remote response
        model.fromJSON(res);
        //update local storage for the model
        that.localStore.upsert(model, function () {
          var args = Array.prototype.slice.call(arguments, 0);
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
  DataAgent.prototype.attemptRead=function(model,cb){
    var self=this;
    self.refreshRead(model,function(err){
      if (err){
        self.read(model,cb);
      }else{
        cb.apply({},arguments);
      }
    });
  };
  return module;
}(appForm.stores || {});
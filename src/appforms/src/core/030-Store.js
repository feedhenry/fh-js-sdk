appForm.stores = function (module) {
  module.Store = Store;
  function Store(name) {
    this.name = name;
  }
  Store.prototype.create = function (model, cb) {
    throw 'Create not implemented:' + this.name;
  };
  /**
     * Read a model data from store
     * @param  {[type]} model          [description]
     * @param  {[type]} cb(error, data);
     */
  Store.prototype.read = function (model, cb) {
    throw 'Read not implemented:' + this.name;
  };
  Store.prototype.update = function (model, cb) {
    throw 'Update not implemented:' + this.name;
  };
  Store.prototype.delete = function (model, cb) {
    throw 'Delete not implemented:' + this.name;
  };
  Store.prototype.upsert = function (model, cb) {
    throw 'Upsert not implemented:' + this.name;
  };
  return module;
}(appForm.stores || {});
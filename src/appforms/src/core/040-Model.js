appForm.models = (function(module) {
    function Model(opt) {
        this.props = {
            "_id": null, // model id
            "_type": null, // model type
            "_ludid": null //local unique id
        };
        this.utils=appForm.utils;
        this.events={};
        if (typeof opt != "undefined") {
            for (var key in opt) {
                this.props[key] = opt[key];
            }
        }
        this.touch();
    }
    Model.prototype.on=function(name,func){
        if (!this.events[name]){
            this.events[name]=[]
        }
        if (this.events[name].indexOf(func)<0){
            this.events[name].push(func);
        }
    }
    Model.prototype.off=function(name,func){
        if (this.events[name]){
            if (this.events[name].indexOf(func)>=0){
                this.events[name].splice(this.events[name].indexOf(func),1);
            }
        }
    }
    Model.prototype.emit=function(){
        var args=Array.prototype.slice.call(arguments,0);
        var e=args.shift();
        var funcs=this.events[e];
        if (funcs && funcs.length>0){
            for (var i=0;i<funcs.length;i++){
                var func=funcs[i];
                func.apply(this,args);
            }
        }
    }
    Model.prototype.getProps = function() {
        return this.props;
    }

    Model.prototype.get = function(key,def) {
        return typeof this.props[key]=="undefined"?def:this.props[key];
    }

    Model.prototype.set = function(key, val) {
        this.props[key] = val;
    }

    Model.prototype.setLocalId = function(localId) {
        this.set("_ludid", localId);
    }
    Model.prototype.getLocalId = function() {
        return this.get("_ludid");
    }
    Model.prototype.fromJSON = function(json) {
        if (typeof json == "string") {
            this.fromJSONStr(json);
        } else {
            for (var key in json) {
                this.set(key, json[key]);
            }
        }
        this.touch();

    }
    Model.prototype.fromJSONStr = function(jsonStr) {
        try {
            var json = JSON.parse(jsonStr);
            this.fromJSON(json);
        } catch (e) {
            console.error(e);
        }
    }
    // not working properly for nested model data.
    // Model.prototype.equalTo = function(model) {
    //     var props = model.getProps();
    //     for (var key in this.props) {
    //         if (key=="_localLastUpdate"){
    //             continue;
    //         }
    //         if (this.props[key] != props[key]) {
    //             return false;
    //         }
    //     }
    //     for (var key in props) {
    //         if (key=="_localLastUpdate"){
    //             continue;
    //         }
    //         if (this.props[key] != props[key]) {
    //             return false;
    //         }
    //     }
    //     return true;
    // }
    Model.prototype.touch=function(){
        this.set("_localLastUpdate", appForm.utils.getTime());
    }
    Model.prototype.getLocalUpdateTimeStamp=function(){
        return this.get("_localLastUpdate");
    }
    Model.prototype.genLocalId=function(){
        return appForm.utils.localId(this);
    }
    /**
     * retrieve model from local or remote with data agent store.
     * @param {boolean} fromRemote optional true--force from remote
     * @param  {Function} cb (err,currentModel)
     * @return {[type]}      [description]
     */
    Model.prototype.refresh=function(fromRemote,cb){
        var dataAgent=this.getDataAgent();
        var that=this;
        if (typeof cb=="undefined"){
            cb=fromRemote;
            fromRemote=false;
        }
        if (fromRemote){
            dataAgent.refreshRead(this,_handler);
        }else{
            dataAgent.read(this,_handler);
        }

        function _handler(err,res){
            if (!err && res){
                that.fromJSON(res);
                cb(null,that);
            }else{
                cb(err,that);
            }
        }

    }
    /**
     * Retrieve model from local storage store
     * @param  {Function} cb (err, curModel)
     * @return {[type]}      [description]
     */
    Model.prototype.loadLocal=function(cb){
        var localStorage=appForm.stores.localStorage;
        var that=this;
        localStorage.read(this,function(err,res){
            if (err){
                cb(err);
            }else{
                if (res){
                    that.fromJSON(res);    
                }
                cb(err,that);
            }
        });
    }
    /**
     * save current model to local storage store
     * @param  {Function} cb [description]
     * @return {[type]}      [description]
     */
    Model.prototype.saveLocal=function(cb){
        var localStorage=appForm.stores.localStorage;
        localStorage.upsert(this,cb);
    }
    /**
     * Remove current model from local storage store
     * @param  {Function} cb [description]
     * @return {[type]}      [description]
     */
    Model.prototype.clearLocal=function(cb){
        var localStorage=appForm.stores.localStorage;
        localStorage.delete(this,cb);
    }
    Model.prototype.getDataAgent=function(){
        if (!this.dataAgent){
            this.setDataAgent(appForm.stores.dataAgent);
        }
        return this.dataAgent;
    }
    Model.prototype.setDataAgent=function(dataAgent){
        this.dataAgent=dataAgent;
    }
    module.Model = Model;

    return module;
    
})(appForm.models || {});
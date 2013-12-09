appForm.utils = (function(module) {
    module.extend = extend;
    module.localId = localId;
    module.md5 = md5;

    function extend(child, parent) {
        if (parent.constructor && parent.constructor == Function) {
            for (var key in parent.prototype) {
                child.prototype[key] = parent.prototype[key];
            }
        } else {
            for (var key in parent) {
                child.prototype[key] = parent[key];
            }
        }
    }

    function localId(model) {
        var props = model.getProps();
        var _id = props._id;
        var _type = props._type;
        var ts = (new Date()).getTime();
        if (_id && _type) {
            return _id + "_" + _type + "_" + ts;
        } else if (_id) {
            return _id + "_" + ts;
        } else if (_type) {
            return _type + "_" + ts;
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
        if (typeof $fh != "undefined" && $fh.hash) {
            $fh.hash({
                algorithm: "MD5",
                text: str
            }, function(result) {
                if (result && result.hashvalue){
                    cb(null,result.hashvalue);
                }else{
                    cb("Crypto failed.");
                }

            });
        }else{
            cb("Crypto not found");
        }
    }

    return module;
})(appForm.utils || {});
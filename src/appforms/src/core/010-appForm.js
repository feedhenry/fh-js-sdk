var appForm=(function(module){
    module.init=init;

    function init(params, cb){
        if (typeof cb =="undefined"){
            cb=params;
        }
        var config=params.config || {};
        appForm.config=appForm.models.config;
        appForm.config.init(config,function(){
            cb();
        });
    }
    
    // $fh.ready({}, function() {
    //     appForms.init({},function(){
    //         console.log("appForm is inited");
    //     });
    // });
    return module;
})(appForm || {});


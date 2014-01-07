var appForm = (function(module) {
    module.init = init;

    function init(params, cb) {
        var def = {
            "updateForms": true
        }

        if (typeof cb == "undefined") {
            cb = params;
        } else {
            for (var key in params) {
                def[key] = params[key];
            }
        }
        var count=0;
        function _handle(){
            setTimeout(function(){
              cb();
            },1);
        }
        //init config module
        count++;
        var config = def.config || {};
        appForm.config = appForm.models.config;
        appForm.config.init(config, function(){
          //Loading the current state of the uploadManager for any upload tasks that are still in progress.
          appForm.models.uploadManager.loadLocal(function(err){
            if(err) console.log(err);

            //init forms module
            if (def.updateForms==true){
              count++
              appForm.models.forms.refresh(true,_handle);
            } else {
              _handle();
            }
          });
        });
    }

    // $fh.ready({}, function() {
    //     appForms.init({},function(){
    //         console.log("appForm is inited");
    //     });
    // });
    return module;
})(appForm || {});
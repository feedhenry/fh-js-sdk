var appForm = function (module) {
    module.init = init;
    function init(params, cb) {
      var def = { 'updateForms': true };
      if (typeof cb == 'undefined') {
        cb = params;
      } else {
        for (var key in params) {
          def[key] = params[key];
        }
      }
      //init config module
      var config = def.config || {};
      appForm.config = appForm.models.config;
      appForm.config.init(config, function () {
        //Loading the current state of the uploadManager for any upload tasks that are still in progress.
        appForm.models.uploadManager.loadLocal(function (err) {
          if (err)
            console.error(err);
          //init forms module
          appForm.models.theme.refresh(true, function (err) {
            if (err)
              console.error(err);
            if (def.updateForms === true) {
              appForm.models.forms.refresh(true, function (err) {
                if (err)
                  console.error(err);
                appForm.models.log.loadLocal(function(){
                  cb();
                });

              });
            } else {
              cb();
            }
          });
        });
      });
    }

    // $fh.ready({}, function() {
    //     appForms.init({},function(){
    //         console.log("appForm is inited");
    //     });
    // });
    return module;
  }(appForm || {});
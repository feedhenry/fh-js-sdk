// Namespace
var App=(function(module){
    module.views={};
    module.models={};
    module.collections={};
    module.config={};

    // ---- App Configs --------
    module.config.validationOn = false;

    // TODO - get this to read from field definition
    module.config.getValueOrDefault = function(key){
        switch(key){
            case "cam_quality":
            return 50;

            case "cam_targetWidth":
            return 300;

            case "cam_targetHeight":
            return 200;
        }
    };

    return module;
})(App || {});
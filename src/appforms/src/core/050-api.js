/**
 * FeedHenry License
 */

appForm.api = (function(module) {
    module.getForms = getForms;
    module.getForm = getForm;
    module.getSubmissions = getSubmissions;

    var _submissions=null;
    /**
     * Retrieve forms model. It contains forms list. check forms model usage
     * @param  {[type]}   params {fromRemote:boolean(false)}
     * @param  {Function} cb    (err, formsModel)
     * @return {[type]}          [description]
     */
    function getForms(params, cb) {
        var fromRemote = params.fromRemote;
        if (fromRemote == undefined) {
            fromRemote = false;
        }
        appForm.models.forms.refresh(fromRemote, cb);    
    }
    /**
     * Retrieve form model with specified form id.
     * @param  {[type]}   params {formId: string, fromRemote:boolean(false)}
     * @param  {Function} cb     (err, formModel)
     * @return {[type]}          [description]
     */
    function getForm(params, cb) {
        new appForm.models.Form(params, cb);
    }
    /**
     * Retrieve submissions list model from local storage
     * @param  {[type]}   params {}
     * @param  {Function} cb     (err,submissionsModel)
     * @return {[type]}          [description]
     */
    function getSubmissions(params, cb) {
        // if (_submissions==null){}
        // appForm.models.submissions.loadLocal(cb);
         if (_submissions==null){
            appForm.models.submissions.loadLocal(function(err){
                if (err){
                    console.error(err);
                    cb(err);
                }else{
                    _submissions=appForm.models.submissions;
                    cb(null,_submissions);
                }
            });    
        }else{
            setTimeout(function(){
                cb(null,_submissions);    
            },0);
            
        }
    }


    //mockup $fh apis for Addons.
    if (typeof $fh == "undefined") {
        $fh = {};
    }
        $fh.forms = module;
        $fh.forms.config=appForm.models.config;
        $fh.forms.init=appForm.init;


    return module;
})(appForm.api || {});
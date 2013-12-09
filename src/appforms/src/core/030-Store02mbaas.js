appForm.stores=(function(module){
    var Store=appForm.stores.Store;
    
    module.mBaaS=new MBaaS();
    
    function MBaaS(){
        Store.call(this,"MBaaS");
    }
    appForm.utils.extend(MBaaS,Store);
    MBaaS.prototype.create=function(model,cb){
        var url=_getUrl(model);
        appForm.web.ajax.post(url,model.getProps(),cb);

    }
    MBaaS.prototype.read=function(model,cb){
        var url=_getUrl(model);
        appForm.web.ajax.get(url,cb);
    }
    MBaaS.prototype.update=function(model,cb){
        
    }
    MBaaS.prototype.delete=function(model,cb){
        
    }
    
    function _getUrl(model){
        var type=model.get("_type");
        var host=appForm.config.get("cloudHost");
        var mBaaSBaseUrl=appForm.config.get("mbaasBaseUrl");
        var formUrls=appForm.config.get("formUrls");
        if (formUrls[type]){
            var relativeUrl=formUrls[type];    
        }else{
            throw("type not found to get url:"+type);
        }   
        
        var url= host+mBaaSBaseUrl+relativeUrl;
        var props={};

        switch (type){
            case "form":
                props.formId=model.get("_id");
                break;
            case "formSubmission":
                props.formId=model.getFormId();
                break;
            case "fileSubmission":
                props.submissionId=model.getSubmissionId();
                props.hashName=model.getHashName();
                props.fieldId=model.getFieldId();
                break
        }
        for (var key in props){
            url=url.replace(":"+key,props[key]);
        }
        return url;
    }
    

    return module;
})(appForm.stores || {});
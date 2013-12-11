appForm.models=(function(module){
    var Model=appForm.models.Model;
    module.FormSubmission=FormSubmission;

    function FormSubmission(submissionJSON){
        Model.call(this,{
            "_type":"formSubmission",
            "data":submissionJSON
        });

    }
    appForm.utils.extend(FormSubmission,Model);

    FormSubmission.prototype.getProps=function(){
        return this.get("data");
    }
    FormSubmission.prototype.getFormId=function(){
        return this.get("data")['formId'];
    }
    FormSubmission.prototype.setSubmissionStartedTimestamp=function(){
      var submissionJSON = this.get("data");
      submissionJSON['submissionStartedTimestamp'] = appForm.utils.getTime();
      this.set("data", submissionJSON);
    }

    return module;
})(appForm.models || {});
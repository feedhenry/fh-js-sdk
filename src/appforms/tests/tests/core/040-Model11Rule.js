describe("Rule model",function(){
    var ruleModel;
    before(function(done){
        new appForm.models.Form({"formId":"527d4539639f521e0a000004"},function(err,form){
            ruleModel=form.getRulesByFieldId("527d4539639f521e0a000006")[0];
            done();
        });
    });

    it ("how to get field ids related to a rule", function(){
        var fieldIds=ruleModel.getRelatedFieldId();
        assert (fieldIds);
        assert (fieldIds instanceof Array);
        assert (fieldIds.indexOf("527d4539639f521e0a000006")>-1);
    });

    it ("how to test user input if it meets the rule", function(){
        var userInput={
            "527d4539639f521e0a000006":"Hello World. this is val test"
        }
        assert(ruleModel.test(userInput));
    });

    it ("how to get rule action if user input meets it.",function(){
        var action=ruleModel.getAction();
        assert(action.action=="show");
        assert(action.targetType=="page");
        assert(action.targetId=="527d4539639f521e0a000005");
    });
});
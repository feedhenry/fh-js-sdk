describe ("rule check funcs",function(){
    it ("how to compare expect value and input value",function(){
        var checkRule=appForm.models.checkRule;
    
        assert(checkRule("is not",5,3));
        assert(!checkRule("is not",5,5));
        assert(checkRule("is equal to",5,5));
        assert(!checkRule("is equal to",5,3));
        assert(checkRule("is greater than",3,5));
        assert(!checkRule("is greater than",8,5));
        assert(!checkRule("is less than",3,5));
        assert(checkRule("is less than",5,3));
        var now=new Date();
        assert(checkRule("is on",now,now));
        assert(!checkRule("is on",now,new Date(123456789)));
        assert(!checkRule("is before",12345678,123456789));
        assert(checkRule("is before",now,"2012-12-31"));
        assert(!checkRule("is after",now,"2012-12-31"));
        assert(checkRule("is after","2011-01-01","2012-12-31"));
        assert(checkRule("is","5","5"));
        assert(!checkRule("is","5","56"));

        assert(checkRule("contains","5","abdef5ebfes"));
        assert(!checkRule("contains","5","abcdefg"));
        assert(checkRule("does not contain","5","abcdefg"));
        assert(!checkRule("does not contain","5","561234678"));
        assert(checkRule("begins with","5fd","5fdasfevvdafe"));
        assert(!checkRule("begins with","5sss","56febsf5sss"));
        assert(checkRule("ends with","abcd5","ejvnekalfnekla9ifeabcd5"));
        assert(!checkRule("ends with","5ffff","5ffffeksifjeosk"));
    });
});
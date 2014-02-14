describe("Config module",function(){
    function config(){
        return appForm.config;
    }
    
    it ("how to get config properties",function(){
        assert(config().get("appId"));
        assert(config().get("cloudHost"));
        assert(config().get("mbaasBaseUrl"));
        assert(config().get("formUrls"));
        assert(config().get("env"));
        assert(config().get("submissionRetryAttempts"));
    });

    it ("config should be init before usage. config should get data from mbaas.",function(done){
        config().init({},function(err,config){
            assert(!err);
            assert(config.get("log_email","logs.enterpriseplc@feedhenry.com"));
            done();
        });
    });
});
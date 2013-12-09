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
    });
});
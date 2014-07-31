describe("Store Data agent", function() {
  describe("read", function() {
    it("how to load from local if local exists", function(done) {
      var model = new appForm.models.Model();
      appForm.stores.localStorage.create(model, function(e, r1) {
        appForm.stores.dataAgent.read(model, function(err, res, isRemote) {
          assert(!err);
          assert(res);
          assert(isRemote == false);
          done();
        });
      });
    });

    it("how to load from remote if local does not exists", function(done) {
      var model = appForm.models.forms;
      model.clearLocal(function() {
        appForm.stores.dataAgent.read(model, function(err, res, isRemote) {
          assert(!err);
          assert(res);
          assert(isRemote == true);
          done();
        });
      });

    });

    it("how to forcely load from remote and upsert local storage", function(done) {
      var model = appForm.models.forms;
      appForm.stores.dataAgent.refreshRead(model, function(err, res, isRemote) {
        assert(!err);
        assert(res);
        assert(isRemote == true);
        done();
      });
    });

    it ("how to use attempt read to attempt remote resource first, if failed, attempt retrieve local resource instead.",function(done){
      var model = appForm.models.forms;
      $fh.forms.config.online();
      appForm.stores.dataAgent.attemptRead(model,function(err,res,isRemote){
        assert(!err);
        assert(res);
        assert(isRemote);
        done();
      });
    });
    it ("attemp read should fall back use local resource instead",function(done){
      var model = new appForm.models.Model();
      model.set("_type","offlineTest");
      $fh.forms.config.offline();
      appForm.stores.dataAgent.attemptRead(model,function(err,res,isRemote){
        assert(!err);
        assert(res);
        assert(!isRemote);
        done();
      });
    });
  });

});
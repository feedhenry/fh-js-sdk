describe("Log model", function() {
  before(function(done){
    $fh.forms.config.set("logger", "true");
    appForm.models.log.clearLogs(done);
  });
  it ("how to log error",function(){
    appForm.models.log.e("Error happens");
    assert(appForm.models.log.getLogs()[0].indexOf("Error happens")>-1, "Expected Error happens to be logged");
  });
  it ("how to log debug",function(){
    appForm.models.log.d("Debug happens");
    assert(appForm.models.log.getLogs()[0].indexOf("Debug happens")===-1);
  });
  it ("should solve asynchours IO issue",function(done){
    appForm.models.log.clearLogs(function(err){
      assert(!err);

      for (var i=0;i<100;i++){
        appForm.models.log.l("information");
      }
      setTimeout(function(){
        assert(appForm.models.log.getLogs().length==100);
        appForm.models.log.loadLocal(function(){
          assert(appForm.models.log.getLogs().length==103);
          done();
        });
      },500);
    });
  });
  it ("should under the limitation of configuration",function(done){
    for (var i=0;i<5000;i++){
      appForm.models.log.l("information");
    }
    setTimeout(function(){
      assert(appForm.models.log.getLogs().length==300);
      appForm.models.log.loadLocal(function(){
        assert(appForm.models.log.getLogs().length==300);
        done();
      });
    },500);
  });
  it ("should send logs email ",function(done){
    appForm.models.log.sendLogs(function(err){
      assert(!err || err =="send_nosupport");
      done();
    });
  });
});
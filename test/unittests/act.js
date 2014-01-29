test("$fh.act", function() {
  var appid = '123456789012345678901234';
  var init = {trackId: "1234567890123"};

  $fh.app_props = {mode:'dev', appid:appid};
  $fh.cloud_props = {domain:'testing', firstTime: false, hosts:{
    debugCloudType: 'fh',
    debugCloudUrl:'http://localhost',
    releaseCloudType:'node',
    releaseCloudUrl:'http://localhost',
    init: init
  }};
  $fh.__ajax = function(p){
    var reqdata = JSON.parse(p.data);
    ok(null != reqdata);
    ok(null != reqdata.__fh);
    ok(null != reqdata.__fh.cuid);
    if($fh.app_props.mode === 'dev'){
      strictEqual(p.url, 'http://localhost/box/srv/1.1/act/testing/' + appid + '/testAct/' + appid);
    } else {
      strictEqual(p.url, 'http://localhost/cloud/testAct');
    }
    p.success({status:'ok'});
  };
  $fh.act({act:'testAct', req:{test:'test'}}, function(res){
    strictEqual(res.status, 'ok');
    $fh.app_props = {mode:'live', appid:appid};
    $fh.act({act:'testAct', req:{test:test}}, function(resp){
      strictEqual(res.status, 'ok');
    }, function(err){
      strictEqual(true, false);
    });
  }, function(err){

  });
});
test('fh.act accept', function () {
  var appid = '123456789012345678901234';
  $fh.app_props = {mode:'dev', appid:appid};
  $fh.cloud_props = {domain:'testing', firstTime: false, hosts:{
    debugCloudType: 'node',
    debugCloudUrl:'http://localhost:8001',
    releaseCloudType:'node',
    releaseCloudUrl:'http://localhost:8001'
  }};

  stop();
  console.log('fh.act');
  $fh.act({
    act:'echo',
    req:{
      msg:'testmsg'
    }
  }, function(res){
    console.log('fh.act res:', JSON.stringify(res));
    start();
    strictEqual(res.echo, 'testmsg');
    strictEqual(res.hardcoded, 'hardcodedmsg');
  }, function(err){
    console.log('fh.act err:', err);
    start();
    ok(false);
  });
});
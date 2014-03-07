//when this test is run, we expect $fh is intialiased with fhconfig.js, which should talk to the mock server and thus get the cloud host to be http://localhost:8101
test('fh.act accept', function(){
  stop();
  $fh.act({
    act:'echo',
    req:{
      msg:'testmsg'
    }
  }, function(res){
    console.log('fh.act res:', JSON.stringify(res));
    start();
    strictEqual(res.echo, 'testmsg-8101');
    strictEqual(res.hardcoded, 'hardcodedmsg');
  }, function(err){
    console.log('fh.act err:', err);
    start();
    ok(false);
  });
});


//test for backward compatibility
test('fh.act accept. app/init mode dev', function () {
  var appid = '123456789012345678901234';
  $fh.app_props = {mode:'dev', appid:appid};
  $fh.cloud_props = {domain:'testing', firstTime: false, hosts:{
    debugCloudType: 'node',
    debugCloudUrl:'http://localhost:8101',
    releaseCloudType:'node',
    releaseCloudUrl:'http://localhost:8102'
  }};

  stop();
  $fh.act({
    act:'echo',
    req:{
      msg:'testmsg'
    }
  }, function(res){
    console.log('fh.act res:', JSON.stringify(res));
    start();
    strictEqual(res.echo, 'testmsg-8101');
    strictEqual(res.hardcoded, 'hardcodedmsg');
  }, function(err){
    console.log('fh.act err:', err);
    start();
    ok(false);
  });
});

test('fh.act accept. app/init mode live', function () {
  var appid = '123456789012345678901234';
  $fh.app_props = {mode:'live', appid:appid};
  $fh.cloud_props = {domain:'testing', firstTime: false, hosts:{
    debugCloudType: 'node',
    debugCloudUrl:'http://localhost:8101',
    releaseCloudType:'node',
    releaseCloudUrl:'http://localhost:8102'
  }};

  stop();
  $fh.act({
    act:'echo',
    req:{
      msg:'testmsg'
    }
  }, function(res){
    console.log('fh.act res:', JSON.stringify(res));
    start();
    strictEqual(res.echo, 'testmsg-8102');
    strictEqual(res.hardcoded, 'hardcodedmsg');
  }, function(err){
    console.log('fh.act err:', err);
    start();
    ok(false);
  });
});

test('fh.act accept. app/init connected cloud app response', function () {
  var appid = '123456789012345678901234';
  $fh.app_props = {mode:'dev', appid:appid};
  $fh.cloud_props = {domain:'testing', firstTime: false, hosts:{
    debugCloudType: 'node',
    debugCloudUrl:'http://localhost:8101',
    releaseCloudType:'node',
    releaseCloudUrl:'http://localhost:8102',
    // should only use below url
    type: 'cloud_nodejs',
    url: 'http://localhost:8103'
  }};

  stop();
  $fh.act({
    act:'echo',
    req:{
      msg:'testmsg'
    }
  }, function(res){
    console.log('fh.act res:', JSON.stringify(res));
    start();
    strictEqual(res.echo, 'testmsg-8103');
    strictEqual(res.hardcoded, 'hardcodedmsg');
  }, function(err){
    console.log('fh.act err:', err);
    start();
    ok(false);
  });
});
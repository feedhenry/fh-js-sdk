define(function(require){
  $fh = require("../feedhenry-latest");
  QUnit.test('fh.act accept', function(){
    QUnit.stop();
    $fh.act({
      act:'echo',
      req:{
        msg:'testmsg'
      }
    }, function(res){
      console.log('fh.act res:', JSON.stringify(res));
      QUnit.start();
      QUnit.strictEqual(res.echo, 'testmsg-8101');
      QUnit.strictEqual(res.hardcoded, 'hardcodedmsg');
    }, function(err){
      console.log('fh.act err:', err);
      QUnit.start();
      QUnit.ok(false);
    });
  });
});

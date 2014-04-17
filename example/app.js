var callCloud = function(){
  $fh.act({act:'echo', req:{msg:"hello"}}, function(res){
    alert("response = " + JSON.stringify(res));
  }, function(msg, err){
    alert("act failed. Message = " + msg);
  });
}
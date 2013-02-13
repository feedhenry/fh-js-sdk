test('$fh.sec node',function(){
  var appid = '123456789012345678901234';
  $fh.app_props = {mode:'live', appid:appid};
  $fh.cloud_props = {domain:'testing', firstTime: false, hosts:{
    debugCloudType: 'fh',
    debugCloudUrl:'http://localhost',
    releaseCloudType:'node',
    releaseCloudUrl:'http://localhost'
  }};

  $fh.sec({act:'keygen', params:{algorithm:'AES', keysize: 128}}, function(keys){
    ok(null !== keys.secretkey);
    ok(null !== keys.iv);
    strictEqual(keys.secretkey.length, 128/8*2);
    strictEqual(keys.iv.length, 128/8*2);
  });

  var sk = '75174B7CD709B84F35053B1855107EC6';
  var iv = '92587F0EF7AEDE613CD20725B5499649';
  var plaintext = '2be464fe54ccefa2c9bdc7231275a995';
  var ciphertext = '4fb2a388dabb4f11e71711c9279c5c496aed4f1d75e4115300fb30ff19ec323f9770be1945532377bb99d50bcee29667';

  $fh.sec({act:'encrypt', params:{key: sk, iv: iv, plaintext:plaintext, algorithm:'AES'}}, function(result){
    strictEqual(ciphertext, result.ciphertext);
  });

  $fh.sec({act:'decrypt', params:{key: sk, iv: iv, ciphertext:ciphertext, algorithm:'AES'}}, function(result){
    strictEqual(plaintext, result.plaintext);
  });

  var modulu = "a5261939975948bb7a58dffe5ff54e65f0498f9175f5a09288810b8975871e99\naf3b5dd94057b0fc07535f5f97444504fa35169d461d0d30cf0192e307727c06\n5168c788771c561a9400fb49175e9e6aa4e23fe11af69e9412dd23b0cb6684c4\nc2429bce139e848ab26d0829073351f4acd36074eafd036a5eb83359d2a698d3";
  var plaintext = "This is test";
  $fh.sec({act:'encrypt', params:{algorithm:'RSA', modulu: modulu, plaintext:plaintext}}, function(result){
    var pri = "8e9912f6d3645894e8d38cb58c0db81ff516cf4c7e5a14c7f1eddb1459d2cded\n4d8d293fc97aee6aefb861859c8b6a3d1dfe710463e1f9ddc72048c09751971c\n4a580aa51eb523357a3cc48d31cfad1d4a165066ed92d4748fb6571211da5cb1\n4bc11b6e2df7c1a559e6d5ac1cd5c94703a22891464fba23d0d965086277a161";
    var p = "d090ce58a92c75233a6486cb0a9209bf3583b64f540c76f5294bb97d285eed33\naec220bde14b2417951178ac152ceab6da7090905b478195498b352048f15e7d";
    var q = "cab575dc652bb66df15a0359609d51d1db184750c00c6698b90ef3465c996551\n03edbf0d54c56aec0ce3c4d22592338092a126a0cc49f65a4a30d222b411e58f";
    var dmp1 = "1a24bca8e273df2f0e47c199bbf678604e7df7215480c77c8db39f49b000ce2c\nf7500038acfff5433b7d582a01f1826e6f4d42e1c57f5e1fef7b12aabc59fd25";
    var dmq1 = "3d06982efbbe47339e1f6d36b1216b8a741d410b0c662f54f7118b27b9a4ec9d\n914337eb39841d8666f3034408cf94f5b62f11c402fc994fe15a05493150d9fd";
    var coeff = "3a3e731acd8960b7ff9eb81a7ff93bd1cfa74cbd56987db58b4594fb09c09084\ndb1734c8143f98b602b981aaa9243ca28deb69b5b280ee8dcee0fd2625e53250";
    var rsa = new RSAKey();
    rsa.setPrivateEx(modulu, "10001", pri, p, q, dmp1, dmq1, coeff);
    var decrypted = rsa.decrypt(result.ciphertext);
    strictEqual(plaintext, decrypted);
  });

  var hash_plain_text = "This is to test hash";
  var expected_md5_hash = "ee1d3042dc4d6cc9995665b667f1d45b";
  var expected_sha1_hash = "0f6671c91c659e162815bef002b36a90ba961306";
  var expected_sha256_hash = "77593f2fe4df58d6d11f9b31dcc6e7f55ec63d42ad87ea0df6a94b81b9307941";
  var expected_sha512_hash = "79d598a87aca45e51bd6c644976c20d6f7bb1cc32d635b350b24b2cd16a025e41d30df2a8696916e896c9a98e2b4bc62c05922c7e340c57e14e5d623af77e5b6";

  $fh.hash({algorithm:'md5', text: hash_plain_text}, function(result){
    strictEqual(expected_md5_hash, result.hashvalue);
  });

  $fh.hash({algorithm:'sha1', text: hash_plain_text}, function(result){
    strictEqual(expected_sha1_hash, result.hashvalue);
  });

  $fh.hash({algorithm:'sha256', text: hash_plain_text}, function(result){
    strictEqual(expected_sha256_hash, result.hashvalue);
  });

  $fh.hash({algorithm:'sha512', text: hash_plain_text}, function(result){
    strictEqual(expected_sha512_hash, result.hashvalue);
  });
});

test('$fh.sec legacy', function(){
  var appid = '123456789012345678901234';
  $fh.app_props = {mode:'dev', appid:appid};
  $fh.cloud_props = {domain:'testing', firstTime: false, hosts:{
    debugCloudType: 'fh',
    debugCloudUrl:'http://localhost',
    releaseCloudType:'node',
    releaseCloudUrl:'http://localhost'
  }};

  $fh.sec({act:'keygen', params:{algorithm:'AES', keysize: 16}}, function(keys){
    ok(null !== keys.secretkey);
    ok(null == keys.iv);
    strictEqual(keys.secretkey.length, 32);
  });

  var plaintext = "ZwxG7cpk07N6qSF8j1Lyocb7WRlT3raJZFxLjbtSY2imza3LLqrGNTQQyhcYMjWvVBp26WLnd6CTGhF9A6ZBd4JEL1lu1aTSLRyBe8LoKMvN8a6MRlH8S30NtiybSVN6fiAcXl8xDHBPxs8IwucG7tOpcA5xNtSD04yZYP2Huq1Lp2H9k4okS1NSHUnLY3BDZdx1P7GFMgIm5PDd8UQmPqUZjxQQnIRvs8qOz7OkHKsYzUZD8XQ8E3Dio30xXxNq";
  var secretkey = "4297B42B0D82FD51DC96A5A819D78756";
  $fh.sec({act:'encrypt', params:{algorithm:'AES', key: secretkey, plaintext:plaintext}}, function(result){
    $fh.sec({act:'decrypt', params:{algorithm:'AES', key: secretkey, ciphertext:result.ciphertext}}, function(result){
      strictEqual(result.plaintext, plaintext);
    });
  });

  var text = "Lorem ipsum dolor sit amet amet";
  var e = "010001";
  var d = "0083667c6a4b84293c004edcc1ca1c42530f64cd73c574da1fb84852a9e7de4b1f9bfefa378dbdbbfc21c9d8740301fca6bf123f7719f8b59e16389425029f08134e1474af9db7765ff3bca33f15ff8a55da2e1b346c3cf11664346598703c1c9c93b6d22b1134540f34c4b624f16905066b19ab32f229b1497f958213fcb1d2dc23e4d1245c7155eec96a2cecada67e94bfeac6460fbf1bc72fca02839509d8b1c7445a13f0cb944eb1bac3fcd25da68611b6624113a87348081811c18f4947adaecf245f1cd031927c7e588f746914627d070da500715440f7b4dc1af626579aed2a6ab6bed81166f6ef28940da28e29d830527e233381770d5f39515fc184b5";
  var m = "00914aac426d9ac56958a5414b9a0ae0a2c0b6032c3810aff6e36b9fcbdec72b2d95b3232e85755f1eb42d652f191297aa64b36932d695398349d00f1fb5cc1aaaf83cca7b56d74f4aea81941d7f1a27635229b3f7d365d45d78cc0274f6318fbf9825dc71bf0bcd110f540aa1da8b51f87a01efaf576f68f28848304fcfff07d625b4d66044b49329bfc476f8dce07ab88048b07e74fff1cd902d054751d0c7fc18a12edc5a75a8d0247d975f2a5bd529cd03af5a41cc8c625ba2b150a9ee9cb5f19c9e2cb139965c408c4276bbf76b3a0994eb4432dceaf009ea736472c67b50778e1c3c5dc40ba135403af8dd953342a155badd18f8a394daa633b0b2d83b35";
  $fh.sec({act:'encrypt', params:{algorithm:'RSA', key: e, keysize: 2048, modulu: m, plaintext:text}}, function(result){
    ok(null != result.ciphertext);
    var key = new RSAKeyPair(e, d, m);
    var plaintext = decryptedString(key, result.ciphertext);
    //legacy rsa encryption need to work with Java. However, when the ciphertext encrypted by the javscript library decrypted in Java, the output text is in reverse order.
    var reversed = '';
    for(var i = text.length - 1; i>= 0 ; i--){
      reversed += text.charAt(i);
    }
    strictEqual(reversed, plaintext);
  });

  var hashtext = "Un1UOEWzxM0AV1VoCJ2uifP3O5E1eLzn";
  var expected_md5_value = "5154b447b9aa352464ff979a3056375b";
  $fh.hash({algorithm:'MD5', text:hashtext}, function(result){
    strictEqual(expected_md5_value, result.hashvalue);
  });

  $fh.hash({text: hashtext}, function(result){
    strictEqual(expected_md5_value, result.hashvalue);
  }, function(err){
    equal(err,null);
  });
});
module('$fh.sec');
test('legacy', function(){
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
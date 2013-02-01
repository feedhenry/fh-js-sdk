$fh = $fh || {};
$fh.sec = function(p, s, f){
  if (!p.act) {
    f('bad_act', {}, p);
    return;
  }
  if (!p.params) {
    f('no_params', {}, p);
    return;
  }
  if (!p.params.algorithm) {
    f('no_params_algorithm', {}, p);
    return;
  }
  var isNodeApp = function(){
    if($fh && $fh.cloud_props && $fh.cloud_props.hosts && $fh.app_props){
      var appType = $fh.cloud_props.hosts.releaseCloudType;
      if($fh.app_props.mode && $fh.app_props.mode.indexOf("dev") > -1){
        appType = $fh.cloud_props.hosts.debugCloudType;
      }
      if(appType === "fh"){
        return false;
      }
    }
    return true;
  };

  var load_security_module = function(cb){
    if(typeof __Crypto !== "undefined"){
      //__Crypto only exists in the legacy security library. If it exists, it's alreay loaded
      return cb();
    } else {
      $fh.__load_script('fhext/js/security.js', cb);
    }
  };

  var acts = {
    'keygen': function () {
      if (!p.params.keysize) {
        f('no_params_keysize', {}, p);
        return;
      }
      if (p.params.algorithm.toLowerCase() != "aes") {
        f('keygen_bad_algorithm', {}, p);
        return;
      }
      var keysize = parseInt(p.params.keysize);
      //keysize is in bit, need to convert to bytes to generate random key
      //but the legacy code has a bug, it doesn't do the convert, so if the keysize is 16 or 32, don't convert
      if(keysize !== 16 && keysize !== 32){
        keysize = keysize/8;
      }
      if(typeof SecureRandom === "undefined"){
        return f("security library is not loaded.");
      }
      var generateRandomKey = function(keysize){
        var r = new SecureRandom();
        var key = new Array(keysize);
        r.nextBytes(key);
        var result = "";
        for(var i=0;i<key.length;i++){
          result += byte2Hex(key[i]);
        }
        return result;
      }

      if(isNodeApp()){
        return s({
          'algorithm': 'AES',
          'secretkey': generateRandomKey(keysize),
          'iv': generateRandomKey(keysize)
        });
      } else {
        return s({
          'algorithm':'AES',
          'secretkey': generateRandomKey(keysize)
        })
      }
    },

    'encrypt': function () {
      var found_err = false;
      var fields = {
        'aes': ['key', 'plaintext'],
        'rsa': ['modulu', 'plaintext']
      };
      if(!isNodeApp()){
        fields.rsa.push('keysize');
        fields.rsa.push('key');
      } else {
        fields.aes.push('iv');
      }
      var required = fields[p.params.algorithm.toLowerCase()];
      if (!required) {
        f('encrypt_bad_algorithm', {}, p);
        return;
      }
      for (var i = 0; i < required; i++) {
        var field = required[i];
        if (!p.params[field]) {
          found_err = true;
          f('no_params_' + field, {}, p);
          break;
        }
      }
      if (found_err) {
        return;
      }
      var rsa_encrypt, aes_encrypt;
      if(isNodeApp()){
        rsa_encrypt = function(p, s, f){
          if(typeof RSAKey === "undefined"){
            return f("security library is missing.Error: can not find RSAKey.");
          }
          var key = new RSAKey();
          key.setPublic(p.params.modulu, "10001");
          var ori_text = p.params.plaintext;
          cipher_text = key.encrypt(ori_text);
          s({ciphertext:cipher_text});
        };
        aes_encrypt = function(p, s, f){
          if(typeof CryptoJS === "undefined"){
            return f("security library is missing.Error: can not find CryptoJS.");
          }
          var encrypted = CryptoJS.AES.encrypt(p.params.plaintext, CryptoJS.enc.Hex.parse(p.params.key), {iv: CryptoJS.enc.Hex.parse(p.params.iv)});
          cipher_text = CryptoJS.enc.Hex.stringify(encrypted.ciphertext);
          s({ciphertext: cipher_text});
        }
      } else {
        rsa_encrypt = function(p, s, f){
          load_security_module(function(){
            if(typeof RSAKeyPair === "undefined"){
              return f('legacy security library is missing. Error: can not find RSAKeyPair.');
            }
            var key_size = parseInt(p.params.keysize);
            var max = parseInt(key_size * 2 / 16 + 2);
            setMaxDigits(max);
            var key = new RSAKeyPair(p.params.key, p.params.key, p.params.modulu);
            var ori_text = p.params.plaintext;
            var input = '';
            for (var i = ori_text.length - 1; i >= 0; i--) {
              input += ori_text.charAt(i);
            }
            cipher_text = encryptedString(key, input);
            s({ciphertext: cipher_text});
          });
        };
        aes_encrypt = function(p, s, f){
          load_security_module(function(){
            if(typeof __Crypto === "undefined"){
              return f("legacy security library is missing. Error: can not find __Crypto.");
            }
            if (typeof $fh.Cipher == "undefined") {
              $fh.Cipher = __Crypto.__import(__Crypto, "titaniumcore.crypto.Cipher");
            }
            var data = __Crypto.str2utf8(p.params.plaintext);
            var key = __Crypto.base16_decode(p.params.key);
            var cipher = $fh.Cipher.create($fh.Cipher.RIJNDAEL, $fh.Cipher.ENCRYPT, $fh.Cipher.ECB, $fh.Cipher.ISO10126);
            cipher_text = __Crypto.base16_encode(cipher.execute(key, data));
            s({ciphertext: cipher_text});
          });
        }
      }

      if (p.params.algorithm.toLowerCase() == "rsa") {
        return rsa_encrypt(p, s, f);
      } else if (p.params.algorithm.toLowerCase() == "aes") {
        return aes_encrypt(p, s, f);
      } else {
        f('encrypt_bad_algorithm', {}, p);
        return;
      }
    },

    'decrypt': function () {
      var found_err = false;
      var fields = {
        'aes': ['key', 'ciphertext']
      };
      if(isNodeApp()){
        fields.aes.push('iv');
      }
      var required = fields[p.params.algorithm.toLowerCase()];
      if (!required) {
        f('decrypt_bad_algorithm', {}, p);
        return;
      }
      for (var i = 0; i < required; i++) {
        var field = required[i];
        if (!p.params[field]) {
          found_err = true;
          f('no_params_' + field, {}, p);
          break;
        }
      }
      if (found_err) {
        return;
      }
      var aes_decrypt;
      if(isNodeApp()){
        aes_decrypt = function(p, s, f){
          if(typeof CryptoJS === "undefined"){
            return f("security library is missing.Error: can not find CryptoJS.");
          }
          var data = CryptoJS.enc.Hex.parse(p.params.ciphertext);
          var encodeData = CryptoJS.enc.Base64.stringify(data);
          var decrypted = CryptoJS.AES.decrypt(encodeData, CryptoJS.enc.Hex.parse(p.params.key), {iv: CryptoJS.enc.Hex.parse(p.params.iv)});
          plain_text = decrypted.toString(CryptoJS.enc.Utf8);
          s({plaintext:plain_text});
        }
      } else {
        aes_decrypt = function(p, s, f){
          load_security_module(function(){
            if(typeof __Crypto === "undefined"){
              return f("legacy security library is missing. Error: can not find __Crypto.");
            }
            if (typeof $fh.Cipher == "undefined") {
              $fh.Cipher = __Crypto.__import(__Crypto, "titaniumcore.crypto.Cipher");
            }
            var data = __Crypto.base16_decode(p.params.ciphertext);
            var key = __Crypto.base16_decode(p.params.key);
            var cipher = $fh.Cipher.create($fh.Cipher.RIJNDAEL, $fh.Cipher.DECRYPT, $fh.Cipher.ECB, $fh.Cipher.ISO10126);
            plain_text = __Crypto.utf82str(cipher.execute(key, data));
            s({plaintext:plain_text});
          });
        }
      }

      if (p.params.algorithm.toLowerCase() == "aes") {
        aes_decrypt(p, s, f);
      } else {
        f('decrypt_bad_algorithm', {}, p);
        return;
      }
    },

    'hash': function () {
      if (!p.params.text) {
        f('hash_no_text', {}, p);
        return;
      }
      if(typeof CryptoJS === "undefined"){
        return f("security library is missing.Error: can not find CryptoJS.");
      }
      var hashValue;
      if (p.params.algorithm.toLowerCase() === "md5") {
        hashValue = CryptoJS.MD5(p.params.text);
      } else if(p.params.algorithm.toLowerCase() === "sha1"){
        hashValue = CryptoJS.SHA1(p.params.text);
      } else if(p.params.algorithm.toLowerCase() === "sha256"){
        hashValue = CryptoJS.SHA256(p.params.text);
      } else if(p.params.algorithm.toLowerCase() === "sha512"){
        hashValue = CryptoJS.SHA512(p.params.text);
      } else if(p.params.algorithm.toLowerCase() === "sha3"){
        hashValue = CryptoJS.SHA3(p.params.text);
      } else {
        return f("hash_unsupported_algorithm: " + p.params.algorithm);
      }
      s({"hashvalue": hashValue});
    }
  };

  acts[p.act] ? acts[p.act]() : f('data_badact', p);
};

$fh.hash = function(p, s, f){
  p.act = "hash";
  $fh.sec(p, s, f);
}
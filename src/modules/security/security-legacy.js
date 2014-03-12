//TODO: move this to somewhere else
(function(root){
  var generateRandomKey = function(keysize){
    var r = new SecureRandom();
    var key = new Array(keysize);
    r.nextBytes(key);
    var result = "";
    for(var i=0;i<key.length;i++){
      result += byte2Hex(key[i]);
    }
    return result;
  };

  var aes_keygen = function(p, s, f){
    if (!p.params.keysize) {
      f('no_params_keysize', {}, p);
      return;
    }
    if (p.params.algorithm.toLowerCase() !== "aes") {
      f('keygen_bad_algorithm', {}, p);
      return;
    }
    var keysize = parseInt(p.params.keysize, 10);
    //keysize is in bit, need to convert to bytes to generate random key
    //but the legacy code has a bug, it doesn't do the convert, so if the keysize is less than 100, don't convert
    if(keysize > 100){
      keysize = keysize/8;
    }
    if(typeof SecureRandom === "undefined"){
      return f("security library is not loaded.");
    }
    return s({
      'algorithm':'AES',
      'secretkey': generateRandomKey(keysize)
    }); 
  };

  var rsa_encrypt = function(p, s, f){
    var fields = ['modulu', 'plaintext', 'keysize', 'key'];
    if(p.params.algorithm.toLowerCase() !== "rsa"){
      return f('encrypt_bad_algorithm', {}, p);
    }
    for (var i = 0; i < fields; i++) {
      var field = fields[i];
      if (!p.params[field]) {
        return f('no_params_' + field, {}, p);
      }
    }
    if(typeof RSAKeyPair === "undefined"){
      return f('legacy security library is missing. Error: can not find RSAKeyPair.');
    }
    var key_size = parseInt(p.params.keysize, 10);
    var max = parseInt(key_size * 2 / 16 + 2, 10);
    setMaxDigits(max);
    var key = new RSAKeyPair(p.params.key, p.params.key, p.params.modulu);
    var ori_text = p.params.plaintext;
    var input = '';
    for (var i = ori_text.length - 1; i >= 0; i--) {
      input += ori_text.charAt(i);
    }
    cipher_text = encryptedString(key, input);
    return s({ciphertext: cipher_text});
  };

  var fh_cipher;
  var aes_encrypt = function(p, s, f){
    var fields = ['key', 'plaintext'];
    if(p.params.algorithm.toLowerCase() !== "aes"){
      return f('encrypt_bad_algorithm', {}, p);
    }
    for (var i = 0; i < fields; i++) {
      var field = fields[i];
      if (!p.params[field]) {
        return f('no_params_' + field, {}, p);
      }
    }

    if(typeof __Crypto === "undefined"){
      return f("legacy security library is missing. Error: can not find __Crypto.");
    }
    if (typeof fh_cipher === "undefined") {
      fh_cipher = __Crypto.__import(__Crypto, "titaniumcore.crypto.Cipher");
    }
    var data = __Crypto.str2utf8(p.params.plaintext);
    var key = __Crypto.base16_decode(p.params.key);
    var cipher = fh_cipher.create(fh_cipher.RIJNDAEL, fh_cipher.ENCRYPT, fh_cipher.ECB, fh_cipher.ISO10126);
    cipher_text = __Crypto.base16_encode(cipher.execute(key, data));
    return s({ciphertext: cipher_text});
  }

  var aes_decrypt = function(p, s, f){
    var fields = ['key', 'ciphertext'];
    if(p.params.algorithm.toLowerCase() !== "aes"){
      return f('decrypt_bad_algorithm', {}, p);
    }
    for (var i = 0; i < fields; i++) {
      var field = fields[i];
      if (!p.params[field]) {
        return f('no_params_' + field, {}, p);
      }
    }
    if(typeof __Crypto === "undefined"){
      return f("legacy security library is missing. Error: can not find __Crypto.");
    }
    if (typeof fh_cipher === "undefined") {
      fh_cipher = __Crypto.__import(__Crypto, "titaniumcore.crypto.Cipher");
    }
    var data = __Crypto.base16_decode(p.params.ciphertext);
    var key = __Crypto.base16_decode(p.params.key);
    var cipher = fh_cipher.create(fh_cipher.RIJNDAEL, fh_cipher.DECRYPT, fh_cipher.ECB, fh_cipher.ISO10126);
    plain_text = __Crypto.utf82str(cipher.execute(key, data));
    return s({plaintext:plain_text});
  }

  //override $fh.sec, with legacy implementations
  var $fh = root.$fh || {};
  var hash = $fh.hash;

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
    p.params.algorithm = p.params.algorithm.toLowerCase();

    if(p.act === "hash"){
      if(typeof hash === "function"){
        return hash(p,s,f);
      } else {
        return f("hash_not_implemented");
      }
    } else if(p.act === "encrypt"){
      if(p.params.algorithm === "aes"){
        return aes_encrypt(p, s, f);
      } else if(p.params.algorithm === "rsa"){
        return rsa_encrypt(p, s, f);
      } else {
        return f('encrypt_bad_algorithm:' + p.params.algorithm, {}, p);
      }
    } else if(p.act === "decrypt"){
      if(p.params.algorithm === "aes"){
        return aes_decrypt(p, s, f);
      } else {
        return f('decrypt_bad_algorithm:' + p.params.algorithm, {}, p);
      }
    } else if(p.act === "keygen"){
      if(p.params.algorithm === "aes"){
        return aes_keygen(p, s, f);
      } else {
        return f('keygen_bad_algorithm:' + p.params.algorithm, {}, p);
      }
    }
  }

  root.$fh = $fh;

})(this);
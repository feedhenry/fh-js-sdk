var rsa = require("../../../libs/rsa");
var SecureRandom = rsa.SecureRandom;
var byte2Hex = rsa.byte2Hex;

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
    'algorithm': 'AES',
    'secretkey': generateRandomKey(keysize),
    'iv': generateRandomKey(keysize)
  });
}

module.exports = aes_keygen;
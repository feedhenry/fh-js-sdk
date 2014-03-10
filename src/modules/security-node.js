var rsa = require("../../libs/rsa");
var CryptoJS = require("Crypto");

var SecureRandom = rsa.SecureRandom;
var byte2Hex = rsa.byte2Hex;
var RSAKey = rsa.RSAKey;


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

var rsa_encrypt = function(p, s, f){
  var fields = ['modulu', 'plaintext'];
  if(p.params.algorithm.toLowerCase() !== "rsa"){
    return f('encrypt_bad_algorithm', {}, p);
  }
  for (var i = 0; i < fields; i++) {
    var field = fields[i];
    if (!p.params[field]) {
      return f('no_params_' + field, {}, p);
    }
  }
  if(typeof RSAKey === "undefined"){
    return f("security library is missing.Error: can not find RSAKey.");
  }
  var key = new RSAKey();
  key.setPublic(p.params.modulu, "10001");
  var ori_text = p.params.plaintext;
  cipher_text = key.encrypt(ori_text);
  return s({ciphertext:cipher_text});
}

var aes_encrypt = function(p, s, f){
  var fields = ['key', 'plaintext', 'iv'];
  if(p.params.algorithm.toLowerCase() !== "aes"){
    return f('encrypt_bad_algorithm', {}, p);
  }
  for (var i = 0; i < fields; i++) {
    var field = fields[i];
    if (!p.params[field]) {
      return f('no_params_' + field, {}, p);
    }
  }
  var encrypted = CryptoJS.AES.encrypt(p.params.plaintext, CryptoJS.enc.Hex.parse(p.params.key), {iv: CryptoJS.enc.Hex.parse(p.params.iv)});
  cipher_text = CryptoJS.enc.Hex.stringify(encrypted.ciphertext);
  return s({ciphertext: cipher_text});
}

var aes_decrypt = function(p, s, f){
  var fields = ['key', 'ciphertext', 'iv'];
  if(p.params.algorithm.toLowerCase() !== "aes"){
    return f('decrypt_bad_algorithm', {}, p);
  }
  for (var i = 0; i < fields; i++) {
    var field = fields[i];
    if (!p.params[field]) {
      return f('no_params_' + field, {}, p);
    }
  }
  var data = CryptoJS.enc.Hex.parse(p.params.ciphertext);
  var encodeData = CryptoJS.enc.Base64.stringify(data);
  var decrypted = CryptoJS.AES.decrypt(encodeData, CryptoJS.enc.Hex.parse(p.params.key), {iv: CryptoJS.enc.Hex.parse(p.params.iv)});
  plain_text = decrypted.toString(CryptoJS.enc.Utf8);
  return s({plaintext:plain_text});
}

var hash = function(p, s, f){
  if (!p.params.text) {
    f('hash_no_text', {}, p);
    return;
  }
  var hashValue;
  if (p.params.algorithm.toLowerCase() === "md5") {
    hashValue = CryptoJS.MD5(p.params.text).toString(CryptoJS.enc.Hex);
  } else if(p.params.algorithm.toLowerCase() === "sha1"){
    hashValue = CryptoJS.SHA1(p.params.text).toString(CryptoJS.enc.Hex);
  } else if(p.params.algorithm.toLowerCase() === "sha256"){
    hashValue = CryptoJS.SHA256(p.params.text).toString(CryptoJS.enc.Hex);
  } else if(p.params.algorithm.toLowerCase() === "sha512"){
    hashValue = CryptoJS.SHA512(p.params.text).toString(CryptoJS.enc.Hex);
  } else {
    return f("hash_unsupported_algorithm: " + p.params.algorithm);
  }
  return s({"hashvalue": hashValue});
}

var sec = function(p, s, f){
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
  if(p.act === "hash"){
    return hash(p, s, f);
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

module.exports = {
  sec: sec,
  hash: hash
}


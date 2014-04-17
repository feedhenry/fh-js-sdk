var rsa = require("../../../libs/rsa");
var RSAKey = rsa.RSAKey;

var encrypt = function(p, s, f){
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
  var key = new RSAKey();
  key.setPublic(p.params.modulu, "10001");
  var ori_text = p.params.plaintext;
  cipher_text = key.encrypt(ori_text);
  return s({ciphertext:cipher_text});
}

module.exports = {
  encrypt: encrypt
}
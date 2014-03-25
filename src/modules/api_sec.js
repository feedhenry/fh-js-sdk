var keygen = require("./security/aes-keygen");
var aes = require("./security/aes-node");
var rsa = require("./security/rsa-node");
var hash = require("./security/hash");

module.exports = function(p, s, f){
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
    return hash(p, s, f);
  } else if(p.act === "encrypt"){
    if(p.params.algorithm === "aes"){
      return aes.encrypt(p, s, f);
    } else if(p.params.algorithm === "rsa"){
      return rsa.encrypt(p, s, f);
    } else {
      return f('encrypt_bad_algorithm:' + p.params.algorithm, {}, p);
    }
  } else if(p.act === "decrypt"){
    if(p.params.algorithm === "aes"){
      return aes.decrypt(p, s, f);
    } else {
      return f('decrypt_bad_algorithm:' + p.params.algorithm, {}, p);
    }
  } else if(p.act === "keygen"){
    if(p.params.algorithm === "aes"){
      return keygen(p, s, f);
    } else {
      return f('keygen_bad_algorithm:' + p.params.algorithm, {}, p);
    }
  }
}
var CryptoJS = require("Crypto");

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

module.exports = hash;
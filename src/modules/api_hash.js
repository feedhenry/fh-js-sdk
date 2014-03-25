var hashImpl = require("./security/hash");

module.exports = function(p, s, f){
  var params = {};
  if(typeof p.algorithm === "undefined"){
    p.algorithm = "MD5";
  }
  params.act = "hash";
  params.params = p;
  hashImpl(params, s, f);
};
//make this module AMD friendly. Make sure this is the last file when concating
(function(root){
  var $fh = root.$fh || {};
  if (typeof define === 'function' && define.amd) {
    //require js
    define(function() {
      return $fh;
    });
  } else if (typeof module !== 'undefined' && module.exports) {
    //common js
    module.exports = $fh;
  } else {
    root.$fh = $fh;
  }
})(this);

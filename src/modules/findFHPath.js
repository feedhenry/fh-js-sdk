module.exports = function(){
  var path = null;
  var scripts = document.getElementsByTagName('script');
  var term = /(feedhenry.*?\.js)/;
  for (var n = scripts.length-1; n>-1; n--) {
      //trim query parameters
      var src = scripts[n].src.replace(/\?.*$/, '');
      //find feedhenry*.js file
      var matches = src.match(term);
      if(matches && matches.length === 2){
        var fhjs = matches[1];
        if (src.indexOf(fhjs) === (src.length - fhjs.length)) {
          path = src.substring(0, src.length - fhjs.length);
          break;
        }
      }
  }
  return path;
};

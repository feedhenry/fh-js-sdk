(function(){

  QUnit.config.autostart = false;

  var testModules = ['./accepttests/act-require.js'];

  require(testModules, QUnit.start);

})();
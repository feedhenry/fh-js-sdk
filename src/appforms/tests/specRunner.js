require.config({
  baseUrl: 'tests/',
  paths: {
    'jquery': '/app/libs/jquery',
    'underscore': 'vendor/underscore',
    'async': 'vendor/async',
    'mocha': 'vendor/mocha',
    'chai': 'vendor/chai',
    'chai-jquery': 'libs/chai-jquery',
    'models': '/app/models'
  }

});



var requiredFiles = [];
var coreModules = modules.core;
var backboneModules = modules.backbone;

coreModules.forEach(function(name) {
  //source file
  requiredFiles.push("./src/core/" + name + ".js");
  //test file
  requiredFiles.push("./tests/core/" + name + ".js");
});

backboneModules.forEach(function(name) {
  //source file
  requiredFiles.push("./src/backbone/" + name + ".js");
  //test file
  requiredFiles.push("./tests/backbone/" + name + ".js");
});

/*globals mocha */
mocha.setup('bdd');
var assert = chai.assert;

function loader(fileName) {
  require([fileName]);
}
var offset = 0;

function recursiveLoad() {
  if (offset == requiredFiles.length) {
    appForm.init({updateForms:true},function() {
      mocha.run();
    });
    return;
  }
  var name = requiredFiles[offset];
  loader(name);
  offset++;

  setTimeout(function() {
    recursiveLoad();
  }, 5);
}
recursiveLoad();
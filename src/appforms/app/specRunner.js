require.config({
  baseUrl: 'tests/',
  paths: {
    'jquery': '/app/libs/jquery',
    'underscore': 'vendor/underscore',
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
});

backboneModules.forEach(function(name) {
  //source file
  requiredFiles.push("./src/backbone/" + name + ".js");
});


function loader(fileName) {
  require([fileName]);
}
var offset = 0;

function recursiveLoad() {
  if (offset == requiredFiles.length) {
    appForm.init(function() {
      Backbone.history.start();
    });
    return;
  }
  var name = requiredFiles[offset];
  loader(name);
  offset++;

  setTimeout(function() {
    recursiveLoad();
  }, 40);
}
recursiveLoad();
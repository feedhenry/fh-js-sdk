require.config({
  baseUrl: './',
  paths: {
    'mocha'         : 'libs/mocha/mocha',
    'chai'          : 'libs/chai/chai',
    'sinonChai'    : 'libs/sinon-chai/sinon-chai',
    'sinon'         : 'libs/sinon/sinon',
    'feedhenry'     : '../../dist/feedhenry'
  },
  urlArgs: 'bust=' + (new Date()).getTime()
});
 
require(['require', 'chai', 'sinon', 'mocha', 'sinonChai', 'feedhenry'], function(require, chai, sinon, mocha, sinonChai, feedhenry){

  /*globals mocha */
  window.mocha.setup('bdd');
 
  require([
    'requirejs/specs/act-test.js',
  ], function(require) {
    if (window.mochaPhantomJS) {
      window.mochaPhantomJS.run()
    } else {
      window.mocha.run()
    }
  });
 
});
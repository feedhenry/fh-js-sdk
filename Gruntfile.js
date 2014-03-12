var path = require('path');
var fs = require("fs");
var exists = fs.existsSync || path.existsSync;
var async = require("async");

module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    meta: {},
    jshint: {
      all: ['src/*.js'],
      options: {
        curly: true,
        eqeqeq: true,
        eqnull: true,
        sub: true,
        loopfunc: true
      },
      globals: {
        browser: true
      }
    },
    concat: {
      lawnchair: {
        src: [
          "libs/lawnchair/lawnchair.js",
          "libs/lawnchair/lawnchairWindowNameStorageAdapter.js",
          "libs/lawnchair/lawnchairLocalStorageAdapter.js",
          "libs/lawnchair/lawnchairWebkitSqlAdapter.js"
        ],
        dest: "libs/generated/lawnchair.js"
      },
      crypto: {
        src:[
          "libs/cryptojs/cryptojs-core.js",
          "libs/cryptojs/cryptojs-enc-base64.js",
          "libs/cryptojs/cryptojs-cipher-core.js",
          "libs/cryptojs/cryptojs-aes.js",
          "libs/cryptojs/cryptojs-md5.js",
          "libs/cryptojs/cryptojs-sha1.js",
          "libs/cryptojs/cryptojs-x64-core.js",
          "libs/cryptojs/cryptojs-sha256.js",
          "libs/cryptojs/cryptojs-sha512.js",
          "libs/cryptojs/cryptojs-sha3.js"
        ],
        dest: "libs/generated/crypto.js"
      }
    },
    'mocha_phantomjs': {
      all: {
        options: {
          urls: [
            "http://127.0.0.1:8100/test/browser/index.html",
            "http://127.0.0.1:8100/test/browser/index-require.html"
          ]
        }
      }
    },
    connect: {
      server: {
        options: {
          hostname: "*",
          port: 8100,
          base: '.'
        }
      }
    },
    browserify: {
      // This browserify build be used by users of the module. It contains a
      // UMD (universal module definition) and can be used via an AMD module
      // loader like RequireJS or by simply placing a script tag in the page,
      // which registers feedhenry as a global var (the module itself registers as $fh as well).
      dist:{
        //shim is defined inside package.json
        src:['src/feedhenry.js'],
        dest: 'dist/feedhenry-latest.js',
        options: {
          standalone: 'feedhenry'
        }
      },
      // This browserify build can be required by other browserify modules that
      // have been created with an --external parameter.
      require: {
        src:['src/feedhenry.js'],
        dest: 'test/browser/feedhenry-latest-require.js',
        options: {
          alias:['./src/feedhenry.js']
        }
      },
      // These are the browserified tests. We need to browserify the tests to be
      // able to run the mocha tests while writing the tests as clean, simple
      // CommonJS mocha tests (that is, without cross-platform boilerplate
      // code). This build will also include the testing libs chai, sinon and
      // sinon-chai but must not include the module under test.
      test: {
        src: [ './test/browser/suite.js' ],
        dest: './test/browser/browserified_tests.js',
        options: {
          external: [ './src/feedhenry.js' ],
          // Embed source map for tests
          debug: true
        }
      }
    },
    watch: {
      browserify: {
        files: ['src/modules/**/*.js', 'test/tests/*.js'],
        tasks: ['browserify'],
        options: {
          spawn: false
        }
      }
    },
    uglify: {
      dist: {
        'dist/feedhenry-latest.min.js': ['dist/feedhenry-latest.js']
      }
    },
    zip: {
      zipall: {
        router: function(filepath) {
          grunt.log.writeln(filepath);
          var filename = path.basename(filepath);
          return 'feedhenry-js-sdk/' + filename;
        },
        dest: 'dist/fh-starter-project-latest.zip',
        src: ['src/index.html', 'dist/feedhenry-latest.js']
      }
    }
  });

  grunt.loadNpmTasks('grunt-zip');
  grunt.loadNpmTasks('grunt-contrib-qunit');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-mocha-phantomjs');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.registerTask('test', ['jshint', 'browserify', 'connect:server', 'mocha_phantomjs']);

  grunt.registerTask('default', 'jshint concat test uglify:dist zip');
};
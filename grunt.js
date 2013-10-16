var path = require('path');

module.exports = function(grunt) {
  grunt.initConfig({
    meta: {},
    lint: {
      files: ['src/*.js']
    },
    jshint: {
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
      dist: {
        src: ["libs/json2.js",
             "libs/cryptojs-core.js",
             "libs/cryptojs-enc-base64.js",
             "libs/cryptojs-cipher-core.js",
             "libs/cryptojs-aes.js",
             "libs/cryptojs-md5.js",
             "libs/cryptojs-sha1.js",
             "libs/cryptojs-x64-core.js",
             "libs/cryptojs-sha256.js",
             "libs/cryptojs-sha512.js",
             "libs/cryptojs-sha3.js",
             "libs/rsa.js",
             "libs/lawnchair/lawnchair.js",
             "libs/lawnchair/lawnchairWindowNameStorageAdapter.js",
             "libs/lawnchair/lawnchairLocalStorageAdapter.js",
             "libs/lawnchair/lawnchairLocalFileStorageAdapter.js",
             "libs/lawnchair/lawnchairWebkitSqlAdapter.js",
             "libs/async.js",
             "src/feedhenry.js",
             "src/sync-cli.js",
             "src/security.js",
          "src/cms.js"],
        dest: 'dist/feedhenry-latest.js'
      }
    },
    qunit: {
      unit: ['test/unit.html'],
      accept: ['test/accept.html']
    },
    min: {
      dist: {
        src: ['dist/feedhenry-latest.js'],
        dest: 'dist/feedhenry-latest.min.js'
      }
    },
    zip: {
      zipall: {
        router: function(filepath) {
          console.log(filepath);
          var filename = path.basename(filepath);
          return 'feedhenry-js-sdk/' + filename;
        },
        dest: 'dist/fh-starter-project-latest.zip',
        src: ['src/index.html', 'dist/feedhenry-latest.js']
      }
    }
  });

  grunt.loadNpmTasks('grunt-zip');

  grunt.registerTask('unit', function() {
    grunt.task.run('qunit:unit');
  });

  grunt.registerTask('accept', function() {
    var cloudApp = require('./accept.js');
    grunt.task.run('qunit:accept');
  });

  grunt.registerTask('default', 'lint concat unit accept min zip');
};

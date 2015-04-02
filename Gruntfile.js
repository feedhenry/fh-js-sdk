var path = require('path');
var fs = require("fs");
var exists = fs.existsSync || path.existsSync;
var async = require("async");
var through = require('through');

module.exports = function(grunt) {
  var pkg = grunt.file.readJSON('package.json');
  grunt.initConfig({
    pkg: pkg,
    meta: {},
    jshint: {
      all: ['src/*.js', 'src/appforms/src/core/*.js', 'src/appforms/src/backbone/*.js', '!src/appforms/src/core/000*.js', '!src/appforms/src/core/060*.js', '!src/appforms/src/core/999*.js', '!src/appforms/src/backbone/000*.js', '!src/appforms/src/backbone/001*.js', '!src/appforms/src/backbone/999*.js'],
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
          "libs/lawnchair/lawnchairWebkitSqlAdapter.js",
          "libs/lawnchair/lawnchairHtml5FileSystem.js",
          "libs/lawnchair/lawnchairMemoryAdapter.js"
        ],
        dest: "libs/generated/lawnchair.js"
      },
      lawnchair_titanium: {
        src: [
          "libs/generated/lawnchair.js",
          "libs/lawnchair/lawnchairTitanium.js",
        ],
        dest: "libs/generated/lawnchair.js"
      },
      titanium_globals : {
        src : ["src/modules/titanium/ti.js", "dist/feedhenry-titanium.js"],
        dest : "dist/feedhenry-titanium.js"
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
      },
      forms_core: {
        "src": "src/appforms/src/core/*.js",
        "dest": "libs/generated/appForms/appForms-core.js"
      },
      forms_core_no_v2: {
        "src": ["src/appforms/src/core/*.js", "!src/appforms/src/core/000-api-v2.js"],
        "dest": "libs/generated/appForms/appForms-core-no-v2.js"
      },
      forms_backbone: {
        "src": ["src/appforms/src/backbone/*.js", "!src/appforms/src/backbone/000-closureStartRequireJS.js", "!src/appforms/src/backbone/999-closureEndRequireJS.js", "!src/appforms/src/backbone/templates.js"],
        "dest": "dist/appForms-backbone.js"
      },
      forms_backboneRequireJS: {
        "src": ["src/appforms/src/backbone/*.js", "!src/appforms/src/backbone/000-closureStart.js", "!src/appforms/src/backbone/999-closureEnd.js", "!src/appforms/src/backbone/templates.js"],
        "dest": "libs/generated/appForms/appForms-backboneRequireJS.js"
      },
      forms_sdk :{
        "src": ["dist/feedhenry.js", "libs/generated/appForms/appForms-core.js"],
        "dest": "dist/feedhenry-forms.js"
      },
      forms_appFormsTest: {
        "src": ["dist/feedhenry.js"],
        "dest": "src/appforms/tests/feedhenry.js"
      }
    },
    'mocha_phantomjs': {
      test: {
        options: {
          urls: [
            "http://127.0.0.1:8200/test/browser/index.html?url=http://localhost:9999",
            "http://127.0.0.1:8200/test/browser/index-require.html"
          ]
        }
      },
      test_coverage: {
        options:{
          reporter: "json-cov",
          file: 'rep/coverage.json',
          urls: [
            "http://127.0.0.1:8200/test/browser/index.html?url=http://localhost:9999&coverage=1"
          ]
        }
      }
    },
    connect: {
      server: {
        options: {
          hostname: "*",
          port: 8200,
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
        dest: 'dist/feedhenry.js',
        options: {
          standalone: 'feedhenry',
          transform: [function(file){
            var data = '';

            function write (buf) { data += buf }
            function end () {
              var t = data;
              if(file.indexOf("constants.js") >= 0){
                var version = pkg.version;
                console.log("found current version = " + version);
                if(process.env.BUILD_NUMBER){
                  console.log("found BUILD_NUMBER in process.env " + process.env.BUILD_NUMBER);
                  version = version.replace(/BUILD\-NUMBER/g, process.env.BUILD_NUMBER);
                }
                console.log("Version to inject is " + version);
                t = data.replace("BUILD_VERSION", version);
              }
              this.queue(t);
              this.queue(null);
            }
            return through(write, end);
          }]
        }
      },
      dist_titanium:{
        //shim is defined inside package.json
        src:['src/feedhenry.js'],
        dest: 'dist/feedhenry-titanium.js',
        options: {
          standalone: 'feedhenry',
          transform: [function(file){
            var data = '';

            function write (buf) { data += buf }
            function end () {
              var t = data;
              if(file.indexOf("constants.js") >= 0){
                var version = pkg.version;
                console.log("found current version = " + version);
                if(process.env.BUILD_NUMBER){
                  console.log("found BUILD_NUMBER in process.env " + process.env.BUILD_NUMBER);
                  version = version.replace(/BUILD\-NUMBER/g, process.env.BUILD_NUMBER);
                }
                console.log("Version to inject is " + version);
                t = data.replace("BUILD_VERSION", version);
              }
              this.queue(t);
              this.queue(null);
            }
            return through(write, end);
          }],
          alias: ['./src/modules/titanium/cookies.js:./cookies',
                  './src/modules/titanium/appProps.js:./appProps',
                  './src/modules/titanium/appProps.js:./modules/appProps'
                 ]
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
          ignore: ['../../src-cov/modules/ajax', '../../src-cov/modules/events', '../../src-cov/modules/queryMap', '../../src-cov/modules/sync-cli', '../../src-cov/feedhenry'],
          // Embed source map for tests
          debug: true
        }
      },
      require_cov: {
        src:['src-cov/feedhenry.js'],
        dest: 'test/browser/feedhenry-latest-require.js',
        options: {
          alias:['./src-cov/feedhenry.js']
        }
      },
      test_cov: {
        src: [ './test/browser/suite.js' ],
        dest: './test/browser/browserified_tests.js',
        options: {
          external: [ './src-cov/feedhenry.js' ],
          // Embed source map for tests
          debug: true,
          add: {
            "LIB_COV": 1
          }
        }
      }
    },
    replace: {
      forms_templates: {
        src: ["src/appforms/src/backbone/templates.js"],
        dest: "src/appforms/src/backbone/040-view00Templates.js",
        options: {
          processTemplates: false
        },
        replacements: [{
          from: '************TEMPLATES***************',                   // string replacement
          to: function(){
            return grunt.file.read("src/appforms/src/backbone/040-view00Templates.html", {encoding: 'utf8'}).replace(/(\r\n|\n|\r)/gm,""); 
          }
        }]
      }
    },
    watch: {
      browserify: {
        files: ['src/**/*.js', 'test/tests/*.js'],
        tasks: ['browserify'],
        options: {
          spawn: false
        }
      }
    },
    uglify: {
      dist: {
        "files": {
          'dist/feedhenry.min.js': ['dist/feedhenry.js'],
          'dist/feedhenry-forms.min.js': ['dist/feedhenry-forms.js'],
          'dist/feedhenry-titanium.min.js': ['dist/feedhenry-titanium.js']
        }
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
        src: ['src/index.html', 'src/fhconfig.json', 'dist/feedhenry.min.js']
      }
    },
    shell: {
      jscov: {
        //NOTE: install node-jscoverage first from here: https://github.com/visionmedia/node-jscoverage
        command: 'jscoverage src/ src-cov/ --exclude=appforms',
        options: { 
          stdout: true
        }
      },
      htmlcov: {
        //NOTE: install jsoncov2htmlcov first from here: https://github.com/plasticine/json2htmlcov
        command: 'json2htmlcov rep/coverage.json > rep/coverage.html',
        options: {   
          stdout: true
        }
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
  grunt.loadNpmTasks('grunt-shell');
  grunt.loadNpmTasks('grunt-text-replace');

  var spawns = [];
  grunt.registerTask('start-local-servers', function () {
    var done = this.async();
    var spawn = require('child_process').spawn;

    var spawnTestCloudServer = function (port, script, cb) {
      grunt.log.writeln('Spawning server on port ' + port + ' in cwd ' + __dirname + ' using file ' + __dirname + '/' + script);
      var env = {};
      env.FH_PORT = port;
      var server = spawn('node', [__dirname + './bin/' + script], {
        cwd: __dirname,
        env: env
      }).on('exit', function (code) {
        grunt.log.writeln('Exiting server on port ' + port + ' with exit code ' + code);
      });
      server.stdout.on('data', function (data) {
        grunt.log.writeln('Spawned Server port ' + port + ' stdout:' + data);
        if(data.toString("utf8").indexOf("started") !== -1){
          cb(null, null);
        }
      });
      server.stderr.on('data', function (data) {
        grunt.log.writeln('Spawned Server port ' + port + ' stderr:' + data);
        if(data.toString("utf8").indexOf("Error:") !== -1){
          cb(data.toString("utf8"), null);
        }
      });
      grunt.log.writeln('Spawned server on port ' + port);
      spawns.push(server);
    };

    var servers = [{port: 8100, file:"bin/appinit.js"}, {port: 8101, file:"bin/appcloud.js"}];
    async.map(servers, function(conf, cb){
      spawnTestCloudServer(conf.port, conf.file, cb);
    }, function(err){
      if(err) {
        grunt.log.writeln("Failed to start server. Error: " + err);
        return done(false);
      }
      return done();
    });

  });

  var stopLocalServers = function(){
    spawns.forEach(function (server) {
      grunt.log.writeln("Killing process " + server.pid);
      server.kill();
    });
  }

  process.on('exit', function() {
    console.log('killing spawned servers if there are any');
    stopLocalServers();
  });

  grunt.registerTask('stop-local-servers', function(){
    stopLocalServers();
  });

  //use this task for local development. Load example/index.html file in the browser after server started.
  //can run grunt watch as well in another terminal to auto generate the combined js file
  grunt.registerTask('local', ['start-local-servers', 'connect:server:keepalive']);

  //run tests in phatomjs
  grunt.registerTask('test', ['jshint:all', 'browserify:dist', 'browserify:require', 'browserify:test', 'connect:server', 'mocha_phantomjs:test']);

  grunt.registerTask('concat-forms-backbone', ['jshint', 'replace:forms_templates', 'concat:forms_backbone', 'concat:forms_backboneRequireJS']);

  grunt.registerTask('concat-core-sdk', ['jshint',  'concat:lawnchair', 'concat:crypto', 'browserify:dist', 'concat:forms_core', 'concat:forms_sdk','concat:forms_core_no_v2', 'concat-forms-backbone']);


  grunt.registerTask('concat-titanium', ['concat:lawnchair', 'concat:lawnchair_titanium', 'concat:crypto']);

  // We need to ensure that the Titanium globals (definition of window, document, navigator) are at the very top of the file
  grunt.registerTask('concat-titanium-globals', ['concat:titanium_globals']);

  grunt.registerTask('titanium', 'concat-titanium browserify:dist_titanium concat-titanium-globals');

  grunt.registerTask('coverage', ['shell:jscov', 'browserify:require_cov', 'browserify:test_cov', 'connect:server', 'mocha_phantomjs:test_coverage', 'shell:htmlcov']);

  grunt.registerTask('default', 'jshint concat-core-sdk concat:forms_appFormsTest test titanium uglify:dist zip');
};

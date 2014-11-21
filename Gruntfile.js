var path = require('path');
var fs = require("fs");
var exists = fs.existsSync || path.existsSync;
var async = require("async");
var through = require('through');
var proxyquire = require('proxyquireify');

module.exports = function(grunt) {
  var pkg = grunt.file.readJSON('package.json');
  grunt.initConfig({
    pkg: pkg,
    meta: {},
    jshint: {
      all: ['src/feedhenry.js', 'src/modules/forms/*.js', '!src/modules/forms/rulesEngine.js'],
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
    'mocha_phantomjs': {
      test: {
        options: {
          urls: [
            "http://127.0.0.1:8200/test/browser/index.html?url=http://localhost:9999"
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
      test: {
        src: [ './test/browser/suite.js' ],
        dest: './test/browser/browserified_tests.js',
        options: {
          external: [ './src/feedhenry.js' ],
          ignore: ['../../src-cov/modules/ajax', '../../src-cov/modules/events', '../../src-cov/modules/queryMap', '../../src-cov/modules/sync-cli', '../../src-cov/feedhenry'],
          // Embed source map for tests
          debug: true,
          preBundleCB: function (b) {
            console.log("ASFSFGASFASFSAF");
            b.plugin(proxyquire.plugin);
          }
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
  grunt.registerTask('test', ['clean', 'jshint', 'browserify:dist', 'browserify:test', 'connect:server', 'mocha_phantomjs:test']);

  grunt.registerTask('concat-forms-backbone', ['jshint', 'replace:forms_templates', 'concat:forms_backbone', 'concat:forms_backboneRequireJS']);

  grunt.registerTask('concat-core-sdk', ['jshint',  'concat:lawnchair', 'concat:crypto']);


  grunt.registerTask('concat-titanium', ['concat:lawnchair', 'concat:lawnchair_titanium', 'concat:crypto']);

  // We need to ensure that the Titanium globals (definition of window, document, navigator) are at the very top of the file
  grunt.registerTask('concat-titanium-globals', ['concat:titanium_globals']);

  grunt.registerTask('titanium', 'concat-titanium browserify:dist_titanium concat-titanium-globals');

  grunt.registerTask('coverage', ['shell:jscov', 'browserify:require_cov', 'browserify:test_cov', 'connect:server', 'mocha_phantomjs:test_coverage', 'shell:htmlcov']);

  grunt.registerTask('clean', function(){
    if(fs.existsSync('./test/browser/browserified_tests.js')){
      fs.unlinkSync('./test/browser/browserified_tests.js');
    }

  });


  grunt.registerTask('default', 'concat-core-sdk test');
};

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
        dest: "tmp/lawnchair.js"
      },
      crypto: {
        src:[
          "libs/cryptojs-core.js",
          "libs/cryptojs-enc-base64.js",
          "libs/cryptojs-cipher-core.js",
          "libs/cryptojs-aes.js",
          "libs/cryptojs-md5.js",
          "libs/cryptojs-sha1.js",
          "libs/cryptojs-x64-core.js",
          "libs/cryptojs-sha256.js",
          "libs/cryptojs-sha512.js",
          "libs/cryptojs-sha3.js"
        ],
        dest: "tmp/crypto.js"
      }
    },
    qunit: {
      unit: {
        options: {
          urls: ["http://localhost:8008/test/unit.html"]
        }
      },
      accept: {
        options: {
          urls: ["http://localhost:8008/test/accept-require.html"]
        }
      }
    },
    connect: {
      server: {
        options: {
          port: 8008,
          base: '.'
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
    },
    browserify: {
      build:{
        src:['src/feedhenry.js'],
        dest: 'test/feedhenry-latest.js',
        options: {
          standalone: '$fh',
          shim: {
            Lawnchair: {
              path: 'tmp/lawnchair.js',
              exports: 'Lawnchair'
            },
            JSON: {
              path: "libs/json2.js",
              exports: "JSON"
            },
            Crypto: {
              path: "tmp/crypto.js",
              exports: "Crypto"
            }
          }
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

  grunt.registerTask('unit', ['connect', 'qunit:unit']);

  var spawns = [];

  grunt.registerTask('start-servers', function () {
    var done = this.async();
    var spawn = require('child_process').spawn;

    var spawnTestCloudServer = function (port, script, cb) {
      grunt.log.writeln('Spawning server on port ' + port + ' in cwd ' + __dirname + ' using file ' + __dirname + '/' + script);
      var env = {};
      env.FH_PORT = port;
      var server = spawn('/usr/bin/env', ['node', __dirname + '/' + script], {
        cwd: __dirname,
        env: env
      }).on('exit', function (code) {
        grunt.log.writeln('Exiting server on port ' + port + ' with exit code ' + code);
      });
      server.stdout.on('data', function (data) {
        grunt.log.writeln('Spawned Server port ' + port + ' stdout:' + data);
        if(data.toString("utf8").indexOf("Server started") !== -1){
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

    var servers = [{port: 8100, file:"test/server.js"}, {port: 8101, file:"test/appcloud.js"}, {port: 8102, file:"test/appcloud.js"}, {port: 8103, file:"test/appcloud.js"}];
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
  
  var stopServers = function(){
    spawns.forEach(function (server) {
      grunt.log.writeln("Killing process " + server.pid);
      server.kill();
    });
  }

  grunt.registerTask('stop-servers', function () {
    stopServers();
  });

  grunt.registerTask('copy-lib', function(){
    var done = this.async();
    var src = path.join(__dirname, "dist", "feedhenry-latest.js");
    var target = path.join(__dirname, "test", "feedhenry-latest.js");
    var r = fs.createReadStream(src, "utf8");
    var w = fs.createWriteStream(target, "utf8");
    r.pipe(w);
    w.on("close", function(){
      done();
    });
  });

  grunt.event.on("qunit.fail.timeout", function(){
    grunt.log.writeln("qunit failed with timeout. Kill servers...");
    stopServers();
  });

  grunt.event.on("qunit.error.onError", function(message, stack){
    grunt.log.writeln("qunit failed with error. Message = " +message+" :: Stack = "+stack+". Kill servers...");
    stopServers();
  });

  grunt.registerTask('accept', ['connect', 'start-servers', 'qunit:accept', 'stop-servers']);

  grunt.registerTask('default', 'jshint concat copy-lib connect qunit:unit start-servers qunit:accept stop-servers uglify:dist zip');
};
var path = require('path');
var fs = require("fs");
var exists = fs.existsSync || path.existsSync;

module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
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
             "src/feedhenry.js",
             "src/sync-cli.js",
             "src/security.js"],
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

  grunt.registerTask('before-concat', 'update version number in feedhenry.js', function(){
    var sdkversion = grunt.config.get('pkg.version');
    var fhjs = path.join(__dirname, 'src', 'feedhenry.js');
    var fhjs_bak = path.join(__dirname, 'src', 'feedhenry_no_version.js');
    grunt.log.writeln("Current sdk version is " + sdkversion);
    grunt.log.writeln("Update version number in feedhenry.js before concating files...");
    var content = fs.readFileSync(fhjs, 'utf8');
    content = content.replace(/sdk_version = '(BUILD_VERSION)'/, "sdk_version = '"+sdkversion+"'");
    fs.renameSync(fhjs, fhjs_bak);
    fs.writeFileSync(fhjs, content, "utf8");
  });

  grunt.registerTask('after-concat', function(){
    var fhjs = path.join(__dirname, 'src', 'feedhenry.js');
    var fhjs_bak = path.join(__dirname, 'src', 'feedhenry_no_version.js');
    if(exists(fhjs_bak)){
      grunt.log.writeln("Remove temporary file.");
      fs.unlinkSync(fhjs);
      fs.renameSync(fhjs_bak, fhjs);
    }
  })

  grunt.registerTask('unit', function() {
    grunt.task.run('qunit:unit');
  });

  var spawns = [];

  grunt.registerTask('start-servers', function () {
    var spawn = require('child_process').spawn;
    var spawnTestCloudServer = function (port) {
      grunt.log.writeln('Spawning server on port ' + port + ' in cwd ' + __dirname + ' using file ' + __dirname + '/accept.js');
      var env = JSON.parse(JSON.stringify(process.env));
      env.FH_PORT = port;
      var server = spawn('/usr/bin/env', ['node', __dirname + '/accept.js'], {
        cwd: __dirname,
        env: env
      }).on('exit', function (code) {
        grunt.log.writeln('Exiting server on port ' + port + ' with exit code ' + code);
      });
      server.stdout.on('data', function (data) {
        grunt.log.writeln('Spawned Server port ' + port + ' stdout:' + data);
      });
      server.stderr.on('data', function (data) {
        grunt.log.writeln('Spawned Server port ' + port + ' stderr:' + data);
      });
      grunt.log.writeln('Spawned server on port ' + port);
      spawns.push(server);
    };

    ['8101', '8102', '8103'].forEach(function (port) {
      spawnTestCloudServer(port);
    });
  });
  
  grunt.registerTask('stop-servers', function () {
    spawns.forEach(function (server) {
      server.kill();
    });
  });

  grunt.registerTask('accept', function() {
    grunt.task.run('start-servers');
    grunt.task.run('qunit:accept');
    grunt.task.run('stop-servers');
  });

  grunt.registerTask('default', 'lint before-concat concat after-concat unit accept min zip');
};
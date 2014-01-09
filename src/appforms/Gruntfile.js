module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),
        // linkCore:{
        //     "coreSrc":"<%= pkg.coreDir %>/",
        //     "distFile":"<%= pkg.distDir %>/<%= pkg.distFile %>"
        // },
        uglify: {
            core: {
                options: {
                    "compress": true,
                    "report": "min"
                },
                files: {
                    "<%= pkg.distDir %>/<%= pkg.name %>-core.min.js": "<%= pkg.distDir %>/<%= pkg.name %>-core.js"
                }
            },
            backbone: {
                options: {
                    "compress": true,
                    "report": "min"
                },
                files: {
                    "<%= pkg.distDir %>/<%= pkg.name %>-backbone.min.js": "<%= pkg.distDir %>/<%= pkg.name %>-backbone.js"
                }
            },
            backboneRequireJS: {
              options: {
                "compress": true,
                "report": "min"
              },
              files: {
                "<%= pkg.distDir %>/<%= pkg.name %>-backboneRequireJS.min.js": "<%= pkg.distDir %>/<%= pkg.name %>-backboneRequireJS.js"
              }
            }
        },
        concat: {
            core: {
                "src": "<%= pkg.sourceDir %>/core/*.js",
                "dest": "<%= pkg.distDir %>/<%= pkg.name %>-core.js"
            },
            backbone: {
                "src": ["<%= pkg.sourceDir %>/backbone/*.js", "!<%= pkg.sourceDir %>/backbone/000-closureStartRequireJS.js", "!<%= pkg.sourceDir %>/backbone/999-closureEndRequireJS.js"],
                "dest": "<%= pkg.distDir %>/<%= pkg.name %>-backbone.js"
            },
            backboneRequireJS: {
              "src": ["<%= pkg.sourceDir %>/backbone/*.js", "!<%= pkg.sourceDir %>/backbone/000-closureStart.js", "!<%= pkg.sourceDir %>/backbone/999-closureEnd.js"],
              "dest": "<%= pkg.distDir %>/<%= pkg.name %>-backboneRequireJS.js"
            }
        }
    });

    grunt.registerTask("testServer", require("./script/webServer.js"));
    grunt.registerTask("app", require("./script/appServer.js"));
    // grunt.registerTask("linkCore",require("./script/linkCore.js")(grunt));
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.registerTask("build",["buildCore","buildBackbone", "buildBackboneRequireJS"]);
    grunt.registerTask("buildCore",["concat:core","uglify:core"]);
    grunt.registerTask("buildBackbone",["concat:backbone","uglify:backbone"]);
    grunt.registerTask("buildBackboneRequireJS",["concat:backboneRequireJS","uglify:backboneRequireJS"]);
}
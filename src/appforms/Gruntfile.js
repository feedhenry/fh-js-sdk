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
            }
        },
        concat: {
            core: {
                "src": "<%= pkg.sourceDir %>/core/*.js",
                "dest": "<%= pkg.distDir %>/<%= pkg.name %>-core.js"
            },
            backbone: {
                "src": "<%= pkg.sourceDir %>/backbone/*.js",
                "dest": "<%= pkg.distDir %>/<%= pkg.name %>-backbone.js"
            }
        }
    });

    grunt.registerTask("testServer", require("./script/webServer.js"));
    grunt.registerTask("app", require("./script/appServer.js"));
    // grunt.registerTask("linkCore",require("./script/linkCore.js")(grunt));
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.registerTask("build",["buildCore","buildBackbone"]);
    grunt.registerTask("buildCore",["concat:core","uglify:core"]);
    grunt.registerTask("buildBackbone",["concat:backbone","uglify:backbone"]);
}
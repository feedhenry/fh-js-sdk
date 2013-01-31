module.exports = function (grunt){
  grunt.initConfig({
    meta:{},
    concat:{
      dist:{
        src:["libs/json2.js","libs/sha1.js","src/feedhenry.js","src/sync-cli.js"],
        dest:'dist/feedhenry-latest.js'
      }
    }
  });
};
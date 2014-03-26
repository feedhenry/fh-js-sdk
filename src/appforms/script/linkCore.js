module.exports=linkCore;

var linkFunc=require("./linkFunc.js");
function linkCore(grunt){
    return function(){
        var config=grunt.config().linkCore;
        var srcDir=config.coreSrc;
        var distFile=config.distFile;
        linkFunc(srcDir,distFile);
    }
    
}


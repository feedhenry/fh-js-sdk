module.exports=_export;

//finished in hurry. for god sake .
var fs=require("fs");
var async=require("async");
var dirPath=__dirname+"/../src/core";
function _export(dest){
    if (typeof dest =="undefined"){
        dest=__dirname+"/../out/cms.js";
    }
    var files=fs.readdirSync(dirPath);
    files.sort();
    var content="";
    async.eachSeries(files,function(file,cb){
        var fullPath=dirPath+"/"+file;
        console.log("Stage file:"+fullPath);
        content+=fs.readFileSync(fullPath);
        content+="\n";
        cb(null);
    },function(){
        console.log("stage file finished");
        console.log("write content to:"+distPath);
        fs.writeFileSync(distPath,content);
        console.log("done");
    });
}



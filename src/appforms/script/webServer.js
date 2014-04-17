module.exports=initServer;

var express = require('express');
var app = express();

var srcDir=__dirname+"/../src";
var testDir=__dirname+"/../tests/tests";
var rootDir=__dirname+"/../tests";

function initServer(){
    var done=this.async();
    app.use(express.bodyParser());
    app.use("/src",express.static(srcDir));
    app.use("/test",express.static(testDir));
    app.use("/",express.static(rootDir));
    require("./mockMBaaS.js")(app);

    app.listen(3001);
    console.log("Web server started at port 3001");
    console.log("Visit: http://127.0.0.1:3001");
}


var express = require("express");

var app = express();

var hosturl = "http://localhost:8101";
app.use(express.bodyParser());
app.use(app.router);

var initData = {
  domain: "testing",
  firstTime: false,
  hosts: {
    "url": hosturl
  },
  init: {
    "trackId": "testtrackid"
  }
}

/*app.all('*', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With, X-Request-With, Content-Type");
  next();
 });*/

app.get("/box/:servlet/:version/app/init", function(req, res){
  console.log("Got GET request for app init");
  if(req.query._callback){
    res.send(req.query._callback + "(" + JSON.stringify(initData) + ")");
  } else {
    res.send("no callbackId");
  }
});

app.post("/box/:servlet/:version/app/init", function(req, res){
  console.log("Got POST request for app init");
  res.send(initData);
});

app.listen(8100);
console.log('Server started on port ' + 8100);
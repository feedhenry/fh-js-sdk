var express = require("express");

var app = express();

app.use(express.bodyParser());
app.use(app.router);

app.all('*', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With, X-Request-With, Content-Type");
  next();
 });

app.post("/box/:servlet/:version/app/init", function(req, res){
  console.log("Got request for app host.");
  var data = {
    domain: "testing",
    firstTime: false,
    hosts: {
      "url": process.env.HOST_URL || "http://localhost:8101"
    },
    init: {
      "trackId": "testtrackid"
    }
  }
  res.send(data);
});

app.listen(8100);
console.log('Server started');
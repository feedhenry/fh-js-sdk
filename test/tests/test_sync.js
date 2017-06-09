var chai = require('chai');
var expect = chai.expect;
var sinonChai = require('sinon-chai');
var _ = require("underscore");

var syncClient =  require("../../src/feedhenry").sync;

chai.use(sinonChai);

//work around phantomjs's issue: https://github.com/ariya/phantomjs/issues/10647
var fakeNavigator = {};
for (var i in navigator) {
  fakeNavigator[i] = navigator[i];
}
fakeNavigator.onLine = true;
navigator = fakeNavigator;

var dataSetId = "myShoppingList";
var onSync = function(cb){
  syncClient.forceSync(dataSetId, function(){
    setTimeout(function(){
      cb();
    }, 600);
  });
}

describe("test sync framework cloud handler", function(){
  this.timeout(10000);
  var header = { "Content-Type": "application/json" };
  var xhr, requests;
  before(function(done){
    syncClient.init({
      do_console_log: true,
      sync_frequency: 1,
      sync_active: false,
      storage_strategy: ['memory'],
      crashed_count_wait: 0
    });
    syncClient.manage(dataSetId, {"sync_active": false, "has_custom_sync": false}, {}, {}, done);
  });

  beforeEach(function(done){
    xhr = sinon.useFakeXMLHttpRequest();
    requests = [];

    xhr.onCreate = function(req){
      console.log("Got sync request", req);
      requests.push(req);
    }
    syncClient.manage(dataSetId, {}, {}, {}, function(){
      syncClient.clearPending(dataSetId, function(){
        done();
      });
    });

  });

  afterEach(function(done){
    xhr.restore();
    syncClient.notify(undefined);
    syncClient.stopSync(dataSetId, done, done);
  });

  it("load initial dataset from remote", function(done){
    //since we want to check what requests have been sent and their data,
    //we turn off sync and use forceSync to control sync loop
    onSync(function(){
      //verify there is one request is in the queue
      expect(requests.length).to.equal(1);

      var reqObj = requests[0];
      expect(reqObj.url).to.have.string("/mbaas/sync/" + dataSetId);
      expect(reqObj.method.toLowerCase()).to.equal("post");
      var reqBody = JSON.parse(reqObj.requestBody);
      expect(reqBody.fn).to.equal("sync");
      expect(reqBody.pending).is.empty;

      //return hash
      var mockHash = "97d170e1550eee4afc0af065b78cda302a97674c";
      reqObj.respond(200, header, JSON.stringify({
        "hash": mockHash,
        "updates": {}
      }));

      var syncRecorsReq = requests[1];
      reqBody = JSON.parse(syncRecorsReq.requestBody);
      expect(reqBody.fn).to.equal("syncRecords");
      syncRecorsReq.respond(200, header, JSON.stringify({
        "hash": mockHash
      }));


      //server turned empty dataset, then the client dataset should be empty as well
      syncClient.getDataset(dataSetId, function(dataset){
        expect(dataset.data).is.empty;
        done();
      });
    });
  });
});
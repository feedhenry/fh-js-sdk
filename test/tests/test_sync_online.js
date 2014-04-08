var process = require("process");
if(document && document.location){
  if(document.location.href.indexOf("coverage=1") > -1){
    process.env.LIB_COV = 1;
  }
}
var syncClient = process.env.LIB_COV? require("../../src-cov/modules/sync-cli") : require("../../src/modules/sync-cli");
var chai = require('chai');
var expect = chai.expect;
var sinonChai = require('sinon-chai');
var _ = require("underscore");

chai.use(sinonChai);

//work around phantomjs's issue: https://github.com/ariya/phantomjs/issues/10647
var fakeNavigator = {};
for (var i in navigator) { 
    fakeNavigator[i] = navigator[i];
}
fakeNavigator.onLine = true;
navigator = fakeNavigator;

syncClient.init({
  do_console_log: true,
  sync_frequency: 1,
  sync_active: false,
  storage_strategy: ['memory'],
  crashed_count_wait: 0
});

describe("test sync framework online with fake XMLHttpRequest", function(){
  this.timeout(10000);
  var dataSetId = "myShoppingList";
  var header = { "Content-Type": "application/json" };
  var xhr, requests;
  before(function(done){
    syncClient.manage(dataSetId, {"sync_active": false}, {}, {}, done);
  });

  beforeEach(function(){
    xhr = sinon.useFakeXMLHttpRequest();
    requests = [];

    xhr.onCreate = function(req){
      console.log("Got sync request", req);
      requests.push(req);
    }
  });

  afterEach(function(done){
    xhr.restore();
    syncClient.notify(undefined);
    syncClient.stopSync(dataSetId, done, done);
  });

  it("load initial dataset from remote", function(done){
    //since we want to check what requests have been sent and their data,
    //we turn off sync and use forceSync to control sync loop
    syncClient.forceSync(dataSetId, function(){

      setTimeout(function(){
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
          "records": {},
          "updates": {}
        }));

        //server turned empty dataset, then the client dataset should be empty as well
        syncClient.getDataset(dataSetId, function(dataset){
          expect(dataset.data).is.empty;
          expect(dataset.hash).to.equal(mockHash);
          done();
        });
        

      }, 501);
    });
  });

  it("try create a new record", function(done){

    var record = {"name":"item1", "created": 1396537178817};

    syncClient.forceSync(dataSetId, function(){
      setTimeout(function(){
        expect(requests.length).to.equal(1);
        var reqObj = requests[0];
        var reqBody = JSON.parse(reqObj.requestBody);
        var mockHash = "97d170e1550eee4afc0af065b78cda302a97674c";
        expect(reqBody.dataset_hash).to.equal(mockHash);

        reqObj.respond(200, header, JSON.stringify({
          "updates": {}
        }));

        //server turned empty dataset, then the client dataset should be empty as well
        syncClient.getDataset(dataSetId, function(dataset){
          expect(dataset.data).is.empty;
          expect(dataset.hash).to.equal(mockHash);

          //now add a new record
          
          var fail = sinon.spy();
          syncClient.doCreate(dataSetId, record, function(){
            expect(fail).to.have.not.been.called;
            //force sync and check the request params
            syncClient.forceSync(dataSetId, function(){
              setTimeout(function(){
                checkUpdateRequest();
              }, 501);
            });

          }, fail);
        });

      }, 501);
    });

    var checkUpdateRequest = function(){
      expect(requests.length).to.equal(2);
      var reqObj = requests[1];
      var reqBody = JSON.parse(reqObj.requestBody);
      expect(reqBody.pending.length).to.equal(1);

      var pendingObj = reqBody.pending[0];
      expect(pendingObj.inFlight).to.be.true;
      expect(pendingObj.action).to.equal("create");
      expect(JSON.stringify(pendingObj.post)).to.equal(JSON.stringify(record));

      var pendingHash = pendingObj.hash;

      var mockRes = {
        "hash": "424e4dff5aa27c2fb7bf0fc74d39b94dae4572eb",
        "updates": {
            "hashes": {
            },
            "applied": {
            }
        }
      }

      mockRes.updates.hashes[pendingHash] = {
        "cuid": "9F3930FE2A434E0BA0AD6F5A40C77CD7",
        "type": "applied",
        "action": "create",
        "hash": "22870dd40b175292b3e60d63240d57b4b8b5a623",
        "uid": "533d775a8e8159d9c6000001",
        "msg": "''"
      }

      mockRes.updates.applied[pendingHash] = {
        "cuid": "9F3930FE2A434E0BA0AD6F5A40C77CD7",
        "type": "applied",
        "action": "create",
        "hash": "22870dd40b175292b3e60d63240d57b4b8b5a623",
        "uid": "533d775a8e8159d9c6000001",
        "msg": "''"
      }

      reqObj.respond(200, header, JSON.stringify(mockRes));
      //the sync client should try to syncRecords immediately
      
      expect(requests.length).to.equal(3);
      var reqObj1 = requests[2];
      var reqBody1 = JSON.parse(reqObj1.requestBody);

      expect(reqObj1.url).to.have.string("/mbaas/sync/" + dataSetId);
      expect(reqBody1.fn).to.equal("syncRecords");
      expect(_.size(reqBody1.clientRecs)).to.equal(1); //there is one record in the client

      var mockRes1 = {
        "create": {
            "533d775a8e8159d9c6000001": {
                "data": {
                    "name": "item1",
                    "created": 1396537178817
                },
                "hash": "9cd301d6d51d038249dd7cfaf3ac88e4f76dfeb2"
            }
        },
        "update": {},
        "delete": {
            "9cd301d6d51d038249dd7cfaf3ac88e4f76dfeb2": {}
        },
        "hash": "424e4dff5aa27c2fb7bf0fc74d39b94dae4572eb"
      }

      reqObj1.respond(200, header, JSON.stringify(mockRes1));
      //verify local dataset contains the same data as server
      syncClient.getDataset(dataSetId, function(dataset){
        expect(_.size(dataset.data)).to.equal(1);
        console.log(dataset);
        expect(_.keys(dataset.data)[0]).to.equal("533d775a8e8159d9c6000001");
        expect(_.values(dataset.data)[0].hash).to.equal("9cd301d6d51d038249dd7cfaf3ac88e4f76dfeb2");
        expect(JSON.stringify(_.values(dataset.data)[0].data)).to.equal(JSON.stringify(record));
        expect(dataset.hash).to.equal("424e4dff5aa27c2fb7bf0fc74d39b94dae4572eb");
        done();
      });
      
    }
  });

  it("try to update an existing record ", function(done){
    var pre = {"name":"item1", "created": 1396537178817};
    var record = { "name": "item1_updat_failed", "created": 1396537178817};
    var update = { "name": "item1_updated", "created": 1396537178817};
    var uid = "533d775a8e8159d9c6000001";
    syncClient.doUpdate(dataSetId, uid, record, function(){

      syncClient.forceSync(dataSetId, function(){
        setTimeout(function(){
          expect(requests.length).to.equal(1);
          var reqObj = requests[0];
          var reqBody = JSON.parse(reqObj.requestBody);
          expect(reqBody.pending.length).to.equal(1);

          var pendingObj = reqBody.pending[0];
          expect(pendingObj.inFlight).to.be.true;
          expect(pendingObj.action).to.equal("update");
          expect(JSON.stringify((pendingObj.pre))).to.equal(JSON.stringify((pre)));
          expect(JSON.stringify(pendingObj.post)).to.equal(JSON.stringify(record));

          //pretend to be offline or bad network
          reqObj.respond(0, null, null);
          //verify the data is marked with crashed
          syncClient.getDataset(dataSetId, function(dataset){
            console.log(dataset.pending);
            expect(_.size(dataset.pending)).to.equal(1);
            expect(_.values(dataset.pending)[0].crashed).to.be.true;

            //now update an already crashed record:
            syncClient.doUpdate(dataSetId, uid, update, function(){
              syncClient.getDataset(dataSetId, function(dataset){
                //at this point, there should be 2 pending objects
                expect(_.size(dataset.pending)).to.equal(2);

                var delayed = _.findWhere(dataset.pending, {delayed: true});
                var crashed = _.findWhere(dataset.pending, {crashed: true});
                expect(delayed).not.null;

                syncClient.forceSync(dataSetId, function(){
                  setTimeout(function(){
                    expect(requests.length).to.equal(2);
                    var reqObj1 = requests[1];
                    var reqBody1 = JSON.parse(reqObj1.requestBody);
                    expect(reqBody1.pending.length).to.equal(0); //one is crashed and the other is delayed

                    reqObj1.respond(200, header, JSON.stringify({hash: dataset.hash})); //increase the crash count

                    expect(crashed.crashedCount).to.equal(1);

                    syncClient.forceSync(dataSetId, function(){
                      setTimeout(function(){
                        console.log("wait for response 1");
                        //do another sync, this time the crash data should be sent again
                        //as the crashCount is greater than the threshold
                        expect(requests.length).to.equal(3);
                        var reqObj2 = requests[2];
                        var reqBody2 = JSON.parse(reqObj2.requestBody);
                        //expect(reqBody2.pending.length).to.equal(1);
                        done();
                      }, 501);
                    });
                    
                  }, 501);
                });
              });
            });
          });
        }, 501);
      });
    });
  });


});
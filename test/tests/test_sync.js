var syncClient = require("../../src/modules-cov/sync-cli");
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

describe("test sync framework offline", function(){
  var dataSetId = "testDataset";
  before(function(done){
    syncClient.manage(dataSetId, null, null, null, done);
  });

  beforeEach(function(){

  });

  afterEach(function(done){
    syncClient.notify(undefined);
    syncClient.stopSync(dataSetId, done, done);
  });

  it("sync.manage", function(done){
    var opts = {"file_system_quota": 1*1024*1024, crashed_count_wait: 5};
    var qp = {"query":"test"};
    var meta_data = {"user": "test"};
    syncClient.manage(dataSetId, opts, qp, meta_data, function(){
      syncClient.getDataset(dataSetId, function(dataset){
        expect(dataset.config.file_system_quota).to.equal(1*1024*1024);
        expect(dataset.config.crashed_count_wait).to.equal(5);
        expect(dataset.config.do_console_log).to.equal(true);
        expect(dataset.query_params).equal(qp);
        expect(dataset.meta_data).equal(meta_data);

        expect(dataset.meta).to.be.empty;
        done();
      });
    });
  });

  it("sync.setConfig/getConfig", function(done){
    var opts = {"file_system_quota": 10*1024*1024, crashed_count_wait: 10};
    var fail = sinon.spy();
    syncClient.setConfig(dataSetId, opts, function(conf){
      expect(fail).to.have.not.been.called;

      syncClient.getConfig(dataSetId, function(config){
        expect(conf.file_system_quota).to.equal(10*1024*1024);
        expect(conf.crashed_count_wait).to.equal(10);

        expect(conf.do_console_log).to.equal(true);
        done();
      });
    }, fail);
  });

  it("sync.getQueryParams/setQueryParams", function(done){
    var qp = {"q":"t"};
    var fail = sinon.spy();

    syncClient.setQueryParams(dataSetId, qp, function(){
      expect(fail).have.not.been.called;

      syncClient.getQueryParams(dataSetId, function(query){
        expect(query).equal(qp);
        done();
      });

    }, fail);
  });

  it("sync.getMetaData/setMetaData", function(done){
    var mdata = {meta:"test"};

    var fail = sinon.spy();
    syncClient.setMetaData(dataSetId, mdata, function(){
      expect(fail).have.not.been.called;
      syncClient.getMetaData(dataSetId, function(meta){
        expect(meta).equal(mdata);
        done();
      });
    }, fail);
  });



  it("sync.notify", function(done){
    var startCallback = sinon.spy();
    var failCallback = sinon.spy();
    var compCallback = sinon.spy();


    syncClient.notify(function(e){
      switch(e.code){
        case "sync_started":
          startCallback(e.code);
          break;
        case "sync_failed":
          failCallback(e.code);
          break;
        case "sync_complete":
          compCallback();
          break;
        default:
          break;
      }
    });

    syncClient.startSync(dataSetId, function(){

      setTimeout(function(){
        expect(startCallback).to.have.been.called;
        expect(failCallback).to.have.been.called;
        expect(failCallback).to.have.been.calledWith('sync_failed');

        expect(compCallback).to.have.not.been.called;

        syncClient.stopSync(dataSetId, function(){
          done();
        });

      }, 600);

    });
  });

  var uid;

  it("sync.doCreate", function(done){
    var success = sinon.spy();
    var fail = sinon.spy();

    var updateCB = sinon.spy();

    var data = {"name": "item1"};
    var hash = syncClient.generateHash(data);
    uid = hash;

    syncClient.notify(function(e){
      switch(e.code){
        case 'local_update_applied':
          updateCB(e.dataset_id, e.uid, e.code, e.message);
          break;
        default:
          break;
      }
    })

    syncClient.doCreate(dataSetId, data, function(){

      expect(fail).to.have.not.been.called;
      //now the new data should be in the dataset as well as the pending set
      var getFail = sinon.spy();
      syncClient.getDataset(dataSetId, function(dataset){
        expect(getFail).to.have.not.been.called;

        //the current dataset should have the new data entry
        expect(dataset.data).to.have.keys(hash);
        expect(JSON.stringify(dataset.data[hash].data)).to.equal(JSON.stringify(data));

        //the new data entry should be added to the pending data
        expect(_.size(dataset.pending)).to.equal(1);
        var pendingObj = _.values(dataset.pending)[0];
        console.log(pendingObj);
        expect(pendingObj.action).to.equal("create");
        expect(pendingObj.inFlight).to.be.false;
        expect(pendingObj.uid).to.equal(hash);
        expect(JSON.stringify(pendingObj.post)).to.equal(JSON.stringify(data));
        expect(pendingObj.postHash).to.equal(hash);
        expect(pendingObj.pre).to.be.undefined;

        var meta = dataset.meta[hash];
        expect(meta.fromPending).to.be.true;
        expect(meta.pendingUid).to.equal(pendingObj.hash);

        //the notification function is called inside a setTimeout wrapper, so need to wait another 1ms to make sure
        //the notification does get invoked.
        setTimeout(function(){
          expect(updateCB).to.have.been.called;
          expect(updateCB).to.have.been.calledWith(dataSetId, null, "local_update_applied", "create");
          done();
        }, 1);
        
      }, getFail);

    }, fail);

  });


  it("sync.doUpdate", function(done){
    var success = sinon.spy();
    var fail = sinon.spy();

    var updateCB = sinon.spy();

    var data = {"name": "item1_updated"};
    var hash = syncClient.generateHash(data);

    syncClient.notify(function(e){
      switch(e.code){
        case 'local_update_applied':
          updateCB(e.dataset_id, e.uid, e.code, e.message);
          break;
        default:
          break;
      }
    });

    syncClient.doUpdate(dataSetId, uid, data, function(){
      expect(fail).to.have.not.been.called;

      var getFail = sinon.spy();

      syncClient.getDataset(dataSetId, function(dataset){
        expect(getFail).to.have.not.been.called;

        //now the dataset should have the updated data
        expect(JSON.stringify(dataset.data[uid].data)).to.equal(JSON.stringify(data));

        //check pending records, since we are updating a pending data record,
        //there should still only one pending data entry
        expect(_.size(dataset.pending)).to.equal(1);
        var pendingObj = _.values(dataset.pending)[0];

        console.log(pendingObj);
        //it should still be "create" action
        expect(pendingObj.action).to.equal("create");
        expect(pendingObj.inFlight).to.be.false;
        expect(pendingObj.uid).to.equal(uid);
        expect(JSON.stringify(pendingObj.post)).to.equal(JSON.stringify(data));
        expect(pendingObj.postHash).to.equal(hash);
        expect(pendingObj.pre).to.be.undefined;

        //the notification function is called inside a setTimeout wrapper, so need to wait another 1ms to make sure
        //the notification does get invoked.
        setTimeout(function(){
          expect(updateCB).to.have.been.called;
          expect(updateCB).to.have.been.calledWith(dataSetId, uid, "local_update_applied", "update");
          syncClient.notify(undefined);
          done();
        }, 1);

      }, getFail);

    }, fail);
  });

  it("sync.doList success", function(done){ 
    var fail = sinon.spy();

    syncClient.doList(dataSetId, function(data){
      expect(fail).to.have.not.been.called;

      expect(_.size(data)).to.equal(1);
      expect(data[uid].data.name).to.equal("item1_updated");
      done();
    }, fail);

  });

  it("sync.doList fail", function(done){
    var success = sinon.spy();

    syncClient.doList("invalidDataSet", success, function(err){
      expect(err).to.equal("unknown_dataset invalidDataSet");
      done();
    });
  });

  it("sync.doRead success", function(done){
    var fail = sinon.spy();

    syncClient.doRead(dataSetId, uid, function(data){
      expect(fail).to.have.not.been.called;
      expect(data.data.name).equal("item1_updated");
      done();
    }, fail);
  });

  it("sync.doRead fail", function(done){
    var success = sinon.spy();

    syncClient.doRead(dataSetId, "invalidid", success, function(err){
      expect(success).to.have.not.been.called;
      expect(err).to.equal("unknown_uid");
      done();
    });
  });

  it("sync.getPending", function(done){
    var fail = sinon.spy();

    syncClient.getPending(dataSetId, function(pending){
      expect(fail).have.not.been.called;
      expect(_.size(pending)).to.equal(1);
      done();
    }, fail);
  });

  it("sync.stopSync/startSync", function(done){

    var cb1 = sinon.spy();
    var cb2 = sinon.spy();

    syncClient.stopSync(dataSetId);

    syncClient.notify(function(e){
      console.log(e);
      switch(e.code){
        case "sync_started":
          cb1(e.code);
          break;
        case "sync_failed":
          cb2(e.code);
          break;
        default:
          break;
      }
    });

    setTimeout(function(){
      //a syncLoop should already be run, but since we stopped sync,
      //none of the notifications should be fired
      expect(cb1).not.have.been.called;
      expect(cb2).not.have.been.called;

      //start sync
      syncClient.startSync(dataSetId, function(){
        setTimeout(function(){
          expect(cb1).have.been.calledOnce;
          expect(cb2).have.been.calledOnce;

          done();
        }, 1001);
      });
      
    }, 1001);
  });

  it("sync.doDelete", function(done){
    var fail = sinon.spy();

    syncClient.doDelete(dataSetId, uid, function(dataset){
      expect(fail).to.have.not.been.called;

      //the data should be gone now
      expect(_.size(dataset.data)).to.equal(0);
      //the pending data should be gone as well
      expect(_.size(dataset.pending)).to.equal(0);
      done();
    }, fail);
  });

  it("sync.doSync", function(done){

    var cb1 = sinon.spy();
    var cb2 = sinon.spy();


    syncClient.notify(function(e){
      console.log(e);
      switch(e.code){
        case "sync_started":
          cb1(e.code);
          break;
        case "sync_failed":
          cb2(e.code);
          break;
        default:
          break;
      }
    });

    //start sync
    syncClient.startSync(dataSetId, function(){
      syncClient.doSync(dataSetId, function(){
        //once doSync is called, a sync loop should happen in next 500ms
        //no matter what the value of sync freqency
        setTimeout(function(){
          expect(cb1).have.been.calledOnce;
          expect(cb2).have.been.calledOnce;

          done();
        }, 501);
      });
    });
  });

  it("sync.forceSync", function(done){
    var cb1 = sinon.spy();
    var cb2 = sinon.spy();


    syncClient.notify(function(e){
      console.log(e);
      switch(e.code){
        case "sync_started":
          cb1(e.code);
          break;
        case "sync_failed":
          cb2(e.code);
          break;
        default:
          break;
      }
    });

    //sync is stopped, but if forceSync is called, a sync loop will still happen
    syncClient.forceSync(dataSetId, function(){
      //once doSync is called, a sync loop should happen in next 500ms
      //no matter what the value of sync freqency
      setTimeout(function(){
        expect(cb1).have.been.calledOnce;
        expect(cb2).have.been.calledOnce;

        done();
      }, 501);
    });
  });
});


describe("test sync framework online with fake XMLHttpRequest", function(){
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
                console.log("current dataset", dataset);
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
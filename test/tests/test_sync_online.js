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

var dataSetId = "myShoppingList";
var onSync = function(cb){
  syncClient.forceSync(dataSetId, function(){
    setTimeout(function(){
      cb();
    }, 501);
  });
}

describe("test sync framework online with fake XMLHttpRequest", function(){
  this.timeout(10000);
  var header = { "Content-Type": "application/json" };
  var xhr, requests;
  before(function(done){
    syncClient.init({
      do_console_log: true,
      sync_frequency: 1,
      sync_active: false,
      storage_strategy: ['memory'],
      crashed_count_wait: 0,
      custom_sync: false
    });
    syncClient.manage(dataSetId, {"sync_active": false}, {}, {}, done);
  });

  beforeEach(function(done){
    xhr = sinon.useFakeXMLHttpRequest();
    requests = [];

    xhr.onCreate = function(req){
      console.log("Got sync request", req);
      requests.push(req);
    }

    syncClient.setHasCustomSync(false);

    syncClient.clearPending(dataSetId, function(){
      done(); 
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
        "records": {},
        "updates": {}
      }));

      //server turned empty dataset, then the client dataset should be empty as well
      syncClient.getDataset(dataSetId, function(dataset){
        expect(dataset.data).is.empty;
        expect(dataset.hash).to.equal(mockHash);
        done();
      });
    });
  });

  it("try create a new record", function(done){

    var record = {"name":"item1", "created": 1396537178817};

    onSync(function(){
      expect(requests.length).to.equal(1);
      var reqObj = requests[0];
      var reqBody = JSON.parse(reqObj.requestBody);
      var mockHash = "97d170e1550eee4afc0af065b78cda302a97674c";
      expect(reqBody.dataset_hash).to.equal(mockHash);

      reqObj.respond(200, header, JSON.stringify({
        "updates": {}
      }));

      //server returned empty dataset, then the client dataset should be empty as well
      syncClient.getDataset(dataSetId, function(dataset){
        expect(dataset.data).is.empty;
        expect(dataset.hash).to.equal(mockHash);

        //now add a new record
        
        var fail = sinon.spy();
        syncClient.doCreate(dataSetId, record, function(){
          //try to create the same record multiple times will generate the same hash, 
          //which will only create one pending request
          syncClient.doCreate(dataSetId, record, function(){
            expect(fail).to.have.not.been.called;
            //force sync and check the request params
            onSync(function(){
              checkUpdateRequest();
            });
          });

        }, fail);
      });
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

      onSync(function(){
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
          expect(dataset.data[uid].data.name).to.equal("item1_updat_failed");
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

              onSync(function(){
                expect(requests.length).to.equal(2);
                var reqObj1 = requests[1];
                var reqBody1 = JSON.parse(reqObj1.requestBody);
                expect(reqBody1.pending.length).to.equal(0); //one is crashed and the other is delayed

                reqObj1.respond(200, header, JSON.stringify({hash: dataset.hash})); //increase the crash count

                expect(crashed.crashedCount).to.equal(1);

                onSync(function(){

                  //do another sync, this time the crash data should be sent again
                  //as the crashCount is greater than the threshold
                  expect(requests.length).to.equal(3);
                  var reqObj2 = requests[2];
                  var reqBody2 = JSON.parse(reqObj2.requestBody);
                  expect(reqBody2.pending.length).to.equal(1);
                  var pendingHash = reqBody2.pending[0].hash;
                  var predata = reqBody2.pending[0].pre;
                  var prehash = reqBody2.pending[0].preHash;


                  var mockRes = {
                    "hash": "424e4dff5aa27c2fb7bf0fc74d39b94dae4572eb",
                    "updates": {
                      "hashes": {
                      },
                      "collisions": {
                      }
                    }, 
                    "records": {

                    }
                  }

                   mockRes.updates.hashes[pendingHash] = mockRes.updates.collisions[pendingHash] = {
                    "cuid": "9F3930FE2A434E0BA0AD6F5A40C77CD7",
                    "type": "collision",
                    "action": "update",
                    "hash": pendingHash,
                    "uid": "533d775a8e8159d9c6000001",
                    "msg": "''"
                  }
                  
                  mockRes.records[uid] = {
                    data: predata,
                    hash: prehash
                  }


                  reqObj2.respond(200, header, JSON.stringify(mockRes));

                  expect(_.size(dataset.pending)).to.equal(1);

                  expect(_.values(dataset.pending)[0].pre.name).to.equal("item1");

                  onSync(function(){
                    expect(requests.length).to.equal(4);
                    var reqObj3 = requests[3];
                    var reqBody3 = JSON.parse(reqObj3.requestBody);

                    expect(reqBody3.pending.length).to.equal(1);
                    var pendingHash = reqBody3.pending[0].hash;
                    var predata = reqBody3.pending[0].pre;
                    var prehash = reqBody3.pending[0].preHash;

                    var mockRes = {
                      "hash": "932b0b7e6862d4634dc6f418da717c78c1a1d742",
                      "updates": {
                        "hashes": {
                        },
                        "applied": {
                        }
                      }
                    }

                     mockRes.updates.hashes[pendingHash] = mockRes.updates.applied[pendingHash] = {
                      "cuid": "9F3930FE2A434E0BA0AD6F5A40C77CD7",
                      "type": "applied",
                      "action": "update",
                      "hash": pendingHash,
                      "uid": "533d775a8e8159d9c6000001",
                      "msg": "''"
                    }

                    reqObj3.respond(200, header, JSON.stringify(mockRes));

                    //should start syncRecords
                    expect(requests.length).to.equal(5);

                    var reqObj4 = requests[4];
                    var mockRes1 = {
                        "create": {},
                        "update": {
                          '533d775a8e8159d9c6000001': {
                            "data": reqBody3.pending[0].post,
                            "hash": reqBody3.pending[0].postHash
                          }
                        },
                        "delete": {},
                        "hash": "932b0b7e6862d4634dc6f418da717c78c1a1d742"
                    }
                    reqObj4.respond(200, header, JSON.stringify(mockRes1));

                    expect(dataset.hash).to.equal("932b0b7e6862d4634dc6f418da717c78c1a1d742");
                    expect(_.size(dataset.pending)).to.equal(0);
                    expect(dataset.data[uid].data.name).to.equal("item1_updated");

                    done();
                  });
                });
              });
            });
          });
        });
      });
    });
  });

  it("test create & delete", function(done){
    var record = {name:"item3"};
    syncClient.doCreate(dataSetId, record, function(res){
      syncClient.getDataset(dataSetId, function(dataset){
        expect(_.size(dataset.pending)).to.equal(1);
        var uid = res.uid;
        syncClient.doDelete(dataSetId, uid, function(res){
          expect(_.size(dataset.pending)).to.equal(0);
          done();
        });
      });
    });
  });

  it("test remote data change", function(done){
    onSync(function(){
      expect(requests.length).to.equal(1);

      var reqObj = requests[0];
      var reqBody = JSON.parse(reqObj.requestBody);

      expect(reqBody.pending.length).to.equal(0);

      var mockRes = {
        hash : "21daec303c7d93b7d806823eaaaab6b82f036097"
      }

      reqObj.respond(200, header, JSON.stringify(mockRes));

      expect(requests.length).to.equal(2);

      var reqObj1 = requests[1];
      var reqBody1 = JSON.parse(reqObj1.requestBody);
      expect(_.size(reqBody1.clientRecs)).to.equal(1);

      var mockRes1 = {
        hash : "21daec303c7d93b7d806823eaaaab6b82f036097",
        create: {
          "533d77a38e8159d9c6000003": {
            "data": {
                "name": "item2",
                "created": 1396537250692
            },
            "hash": "9f37f46126a1c18ff3b13de06d8fc6a8f4fd1167"
          }
        }
      }

      reqObj1.respond(200, header, JSON.stringify(mockRes1));

      syncClient.getDataset(dataSetId, function(dataset){
        expect(_.size(dataset.data)).to.equal(2);
        expect(dataset.data['533d77a38e8159d9c6000003'].data.name).to.equal("item2");
        done();
      });
    });
  });

  it("test delete existing data", function(done){
    var uid = "533d77a38e8159d9c6000003";
    var record = {name:"item_updated_again"};
    syncClient.doUpdate(dataSetId, uid, record, function(){
      syncClient.getDataset(dataSetId, function(dataset){
        expect(_.size(dataset.pending)).to.equal(1);

        syncClient.doDelete(dataSetId, uid, function(){

          expect(_.size(dataset.pending)).to.equal(1);
          expect(_.values(dataset.pending)[0].pre.name).to.equal("item2");

          onSync(function(){
            expect(requests.length).to.equal(1);

            var reqObj = requests[0];
            var reqBody = JSON.parse(reqObj.requestBody);

            expect(reqBody.pending.length).to.equal(1);
            expect(reqBody.pending[0].uid).to.equal(uid);

            var pendingHash = reqBody.pending[0].hash;

            var mockRes = {
                "hash": "f9f17defccf22d9bf1d0fb73e1f6af6b67c266e8",
                "updates": {
                  "hashes": {},
                  "applied": {}
                }
            }

            mockRes.updates.hashes[pendingHash] = mockRes.updates.applied[pendingHash] = {
              "cuid": "9F3930FE2A434E0BA0AD6F5A40C77CD7",
              "type": "applied",
              "action": "delete",
              "hash": pendingHash,
              "uid": "533d77a38e8159d9c6000003",
              "msg": "''"
            }

            reqObj.respond(200, header, JSON.stringify(mockRes));

            expect(requests.length).to.equal(2);
            
            var reqObj1 = requests[1];
            var reqBody1 = JSON.parse(reqObj1.requestBody);
            expect(reqBody1.fn).to.equal("syncRecords");

            expect(_.size(reqBody1.clientRecs)).to.equal(1);

            var mockRes1 = {
              "create": {},
              "update": {},
              "delete": {},
              "hash": "f9f17defccf22d9bf1d0fb73e1f6af6b67c266e8"
            }

            reqObj1.respond(200, header, JSON.stringify(mockRes1));

            syncClient.getDataset(dataSetId, function(dataset){
              expect(dataset.hash).to.equal("f9f17defccf22d9bf1d0fb73e1f6af6b67c266e8");
              expect(_.size(dataset.data)).to.equal(1);
              expect(_.size(dataset.pending)).to.equal(0);
              done();
            });
          });
        });
      });
    });
  });

  it("test update pending data", function(done){
    var record = {name:"item4"};
    var updated = {name:"item4_updated"};
    syncClient.doCreate(dataSetId, record, function(res){
      onSync(function(){
        expect(requests.length).to.equal(1);
        var reqObj = requests[0];
        var reqBody = JSON.parse(reqObj.requestBody);

        var pendingObj = reqBody.pending[0];
        var pendingHash = pendingObj.hash;

        //at this point, the new record should be inflight, try to update it
        syncClient.doUpdate(dataSetId, res.uid, updated, function(){
          //then got response for the update
          var mockRes = {
            "hash": "424e4dff5aa27c2fb7bf0fc74d39b944823234832",
            "updates": {
                "hashes": {
                },
                "applied": {
                }
            },
            records: {
              "533d775a8e8159d9c6000005": {
                "data": {
                  "cuid": "9F3930FE2A434E0BA0AD6F5A40C77CD7",
                  "type": "applied",
                  "action": "create",
                  "hash": pendingHash,
                  "uid": "533d775a8e8159d9c6000005",
                  "msg": "''"
                },
                "hash": pendingHash
              }
            }
          }

          mockRes.updates.hashes[pendingHash] = {
            "cuid": "9F3930FE2A434E0BA0AD6F5A40C77CD7",
            "type": "applied",
            "action": "create",
            "hash": pendingHash,
            "uid": "533d775a8e8159d9c6000005",
            "msg": "''"
          }

          mockRes.updates.applied[pendingHash] = {
            "cuid": "9F3930FE2A434E0BA0AD6F5A40C77CD7",
            "type": "applied",
            "action": "create",
            "hash": pendingHash,
            "uid": "533d775a8e8159d9c6000005",
            "msg": "''"
          }

          reqObj.respond(200, header, JSON.stringify(mockRes));

          syncClient.getDataset(dataSetId, function(dataset){
            var pending = dataset.pending;
            expect(_.size(pending)).to.equal(1);
            var pendingObj = _.values(pending)[0];
            expect(pendingObj.preHash).to.equal(pendingHash);
            expect(pendingObj.uid).to.equal("533d775a8e8159d9c6000005");
            done();
          });
        });
      });
    });
  });

  it("test create pending data", function(done){
    var record = {name:"item5"};
    onSync(function(){
      var reqObj = requests[0];
      var reqBody = JSON.parse(reqObj.requestBody);

      syncClient.doCreate(dataSetId, record, function(res){
        //at this point, there is one pending create, 
        syncClient.getDataset(dataSetId, function(dataset){
          var pendings = dataset.pending;
          console.log("pending", pendings);
          var pendingObj = _.values(pendings)[0];
          expect(pendingObj.action).to.equal("create");
          var pendingHash = pendingObj.hash;
          var mockRes = {
            "updates": {
                "hashes": {
                },
                "applied": {
                }
            },
            records: {
              "533d775a8e8159d9c6000006": {
                "data": {
                  "cuid": "9F3930FE2A434E0BA0AD6F5A40C77CD7",
                  "type": "applied",
                  "action": "create",
                  "hash": pendingHash,
                  "uid": "533d775a8e8159d9c6000006",
                  "msg": "''"
                },
                "hash": pendingHash
              }
            }
          }

          mockRes.updates.hashes[pendingHash] = {
            "cuid": "9F3930FE2A434E0BA0AD6F5A40C77CD7",
            "type": "applied",
            "action": "create",
            "hash": pendingHash,
            "uid": "533d775a8e8159d9c6000006",
            "msg": "''"
          }

          mockRes.updates.applied[pendingHash] = {
            "cuid": "9F3930FE2A434E0BA0AD6F5A40C77CD7",
            "type": "applied",
            "action": "create",
            "hash": pendingHash,
            "uid": "533d775a8e8159d9c6000006",
            "msg": "''"
          }

          reqObj.respond(200, header, JSON.stringify(mockRes));

          expect(pendingObj.action).to.equal("update");

          done();

        });
      });
    });
  });

  it("test updateNewDataFromInFlight create/update", function(done){
    var record = {name:"item7"};
    syncClient.doCreate(dataSetId, record, function(res){
      onSync(function(){
        var reqObj = requests[0];
        var reqBody = JSON.parse(reqObj.requestBody);
        var pendingObj = reqBody.pending[0];
        var mockRes = {
          records : {

          }
        }

        reqObj.respond(200, header, JSON.stringify(mockRes));
        
        syncClient.getDataset(dataSetId, function(dataset){
          expect(dataset.data[pendingObj.uid].data.name).to.equal("item7");
          
          syncClient.clearPending(dataSetId, function(){
            syncClient.doUpdate(dataSetId, res.uid, {name:"item8"}, function(){
              onSync(function(){
                var reqObj1 = requests[1];
                var reqBody1 = JSON.parse(reqObj1.requestBody);
                var pendingObj1 = reqBody1.pending[0];
                
                var mockRes1 = {
                  records : {

                  }
                }
                mockRes1.records[pendingObj1.uid] = {
                   data: {
                     name: "item9"
                   },
                   hash: "424e4dff5aa27c2fb7bf0fc74d39b944823asdfhfj"
                }
                reqObj1.respond(200, header, JSON.stringify(mockRes1));

                expect(dataset.data[pendingObj1.uid].data.name).to.equal("item8");

                syncClient.clearPending(dataSetId, function(){
                  syncClient.doDelete(dataSetId, res.uid, function(){
                    onSync(function(){
                      var reqObj2 = requests[2];
                      var reqBody2 = JSON.parse(reqObj2.requestBody);
                      var pendingObj2 = reqBody2.pending[0];
                      
                      var mockRes2 = {
                        records : {

                        }
                      }
                      mockRes2.records[pendingObj2.uid] = {
                         data: {
                           name: "item10"
                         },
                         hash: "424e4dff5aa27c2fb7bf0fc74d39b94482adfesfef"
                      }
                      reqObj2.respond(200, header, JSON.stringify(mockRes1));

                      expect(dataset.data[pendingObj2.uid]).to.be.empty;

                      done();
                    });
                  });
                });

              });
            });
          });
        });
      });
    });
  });

  it("test updateNewDataFromPending", function(done){
    onSync(function(){
      var reqObj = requests[0];
      syncClient.doCreate(dataSetId, {name:"item12"}, function(res){
        var mockRes = {
          records : {

          }
        }
        reqObj.respond(200, header, JSON.stringify(mockRes));

        syncClient.getDataset(dataSetId, function(dataset){
          expect(dataset.data[res.uid].data.name).to.equal("item12");
          syncClient.clearPending(dataSetId, function(){
            onSync(function(){
              var reqObj1 = requests[1];
              syncClient.doDelete(dataSetId, res.uid, function(){
                var mockRes1 = {
                  records:{

                  }
                }
                mockRes1.records[res.uid] = {
                  data:{
                    name:"item13"
                  },
                  hash: "424e4dff5aa27c2fb7bf0fc74dasdfsefsdfsef"
                }

                reqObj1.respond(200, header, JSON.stringify(mockRes1));

                expect(dataset.data[res.uid]).to.be.empty;

                done();
              });
            });
          });
        });
      });
    });
  });

  it("test updateCrashedInFlightFromNewData create", function(done){
    syncClient.setConfig(dataSetId, {crashed_count_wait: 10}, function(){
      var createRecord = {name:'item13'};
      syncClient.doCreate(dataSetId, createRecord, function(){
        onSync(function(){
           var reqObj = requests[0];
           var reqBody = JSON.parse(reqObj.requestBody);
           reqObj.respond(500, header, null);

           syncClient.getDataset(dataSetId, function(dataset){
            expect(_.size(dataset.pending)).to.equal(1);
            var pendingObj = _.values(dataset.pending)[0];
            
            expect(pendingObj.crashed).to.be.true;

            onSync(function(){
              var reqObj1 = requests[1];
              var reqBody1 = JSON.parse(reqObj1.requestBody);

              //this time return success but without updates of the crashed records
              var mockRes = {
                "updates": {
                    "hashes": {
                    },
                    "applied": {
                    }
                }
              }

              reqObj1.respond(200, header, JSON.stringify(mockRes));

              expect(pendingObj.crashedCount).to.equal(1);
              
              //do another one
              onSync(function(){
                var reqObj2 = requests[2];
                var reqBody2 = JSON.parse(reqObj2.requestBody);

                //this time return success but without updates of the crashed records
                var mockRes2 = {
                  "updates": {
                      "hashes": {
                      },
                      "applied": {
                      }
                  }
                }

                reqObj2.respond(200, header, JSON.stringify(mockRes2));

                expect(pendingObj.crashedCount).to.equal(2);

                onSync(function(){
                  var reqObj3 = requests[3];
                  var reqBody3 = JSON.parse(reqObj3.requestBody);

                  //this time return success but without updates
                  var mockRes3 = {
                  }

                  reqObj3.respond(200, header, JSON.stringify(mockRes3));

                  expect(pendingObj.crashedCount).to.equal(3);

                  onSync(function(){
                    var reqObj4 = requests[4];
                    var reqBody4 = JSON.parse(reqObj4.requestBody);

                    //this time return success but without updates
                    var mockRes4 = {
                      "updates": {
                        "hashes": {}
                      }
                    }
                    mockRes4.updates.hashes[pendingObj.hash] = {
                      "cuid": "9F3930FE2A434E0BA0AD6F5A40C77CD7",
                      "type": "failed",
                      "action": "create",
                      "hash": pendingObj.hash,
                      "uid": pendingObj.postHash,
                      "msg": "''"
                    }

                    reqObj4.respond(200, header, JSON.stringify(mockRes4));

                    expect(dataset.data[pendingObj.uid]).to.be.empty;

                    done();
                  });
                });

              });
            });
           });
        });
      });
    });

  });

  it("test updateCrashedInFlightFromNewData update", function(done){
    syncClient.getDataset(dataSetId, function(dataset){
      //fake an existing record
      dataset.data = dataset.data || {};
      var uid = "533d775a8e8159d9c6000007";
      var record = {name:"item14"}
      dataset.data[uid] = {
        hash: "424e4dff5aa27c2fb7bf0fc74dasej3ojfj",
        data: record
      }

      //do update
      syncClient.doUpdate(dataSetId, uid, {name:"item15"}, function(){
        expect(dataset.data[uid].data.name).to.equal("item15");

        onSync(function(){
          var reqObj = requests[0];
          var reqBody = JSON.parse(reqObj.requestBody);

          reqObj.respond(500, header, null);

          var pendings = dataset.pending;
          expect(_.size(pendings)).to.equal(1);
          var pendingObj = _.values(pendings)[0];
          expect(pendingObj.crashed).to.be.true;

          onSync(function(){
            var reqObj1 = requests[1];
            var reqBody1 = JSON.parse(reqObj1.requestBody);

            var mockRes1 = {
              "updates": {
                "hashes": {}
              }
            }
            mockRes1.updates.hashes[pendingObj.hash] = {
              "cuid": "9F3930FE2A434E0BA0AD6F5A40C77CD7",
              "type": "failed",
              "action": "update",
              "hash": pendingObj.hash,
              "uid": uid,
              "msg": "''"
            }

            reqObj1.respond(200, header, JSON.stringify(mockRes1));

            expect(dataset.data[uid].data.name).to.equal("item14");

            done();

          });
        });
      });
    });
  });

  it("test updateCrashedInFlightFromNewData resend", function(done){
    syncClient.setConfig(dataSetId, {"resend_crashed_updates": false, "crashed_count_wait": 0}, function(){
      syncClient.doCreate(dataSetId, {name: "item16"}, function(){
        onSync(function(){
          var reqObj = requests[0];
          var reqBody = JSON.parse(reqObj.requestBody);

          reqObj.respond(500, header, null);

          syncClient.getDataset(dataSetId, function(dataset){
            var pendings = dataset.pending;
            expect(_.size(pendings)).to.equal(1);
            var pendingObj = _.values(pendings)[0];
            expect(pendingObj.crashed).to.be.true;

            onSync(function(){
              var reqObj1 = requests[1];
              var reqBody1 = JSON.parse(reqObj1.requestBody);

              var mockRes1 = {
                "updates": {
                  "hashes": {}
                }
              }

              reqObj1.respond(200, header, JSON.stringify(mockRes1));

              expect(_.size(pendings)).to.equal(0);

              done();

            });
          });
        });
      });
    });
  });

  it("test listCollisions", function(done){
    var success = sinon.spy();
    var fail = sinon.spy();
    syncClient.listCollisions(dataSetId, success, fail);
    expect(requests.length).to.equal(1);
    var reqObj = requests[0];
    reqObj.respond(500, header, null);
    expect(fail).to.have.been.called;
    done();
  });

  it("test removeCollision", function(done){
    var success = sinon.spy();
    var fail = sinon.spy();
    syncClient.removeCollision(dataSetId, null, success, fail);
    expect(requests.length).to.equal(1);
    var reqObj = requests[0];
    reqObj.respond(500, header, null);
    expect(fail).to.have.been.called;
    done();
  });


  it("test checkHasCustomSync", function(done){
    syncClient.setHasCustomSync(null);
    syncClient.checkHasCustomSync(dataSetId, function(){});
    expect(requests.length).to.equal(1);
    var reqObj = requests[0];
    reqObj.respond(200, header, null);
    expect(syncClient.getHasCustomSync()).to.be.true;

    syncClient.setHasCustomSync(null);
    syncClient.checkHasCustomSync(dataSetId, function(){});
    expect(requests.length).to.equal(2);
    var reqObj1 = requests[1];
    reqObj1.respond(500, header, null);
    expect(syncClient.getHasCustomSync()).to.be.true;

    syncClient.setHasCustomSync(null);
    syncClient.checkHasCustomSync(dataSetId, function(){});
    expect(requests.length).to.equal(3);
    var reqObj2 = requests[2];
    reqObj2.respond(404, header, null);
    expect(syncClient.getHasCustomSync()).to.be.false;

    done();

  });


});
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
navigator.network = {connection: {type: "WIFI"}};

syncClient.init({
  do_console_log: true,
  sync_frequency: 1,
  sync_active: false,
  storage_strategy: ['memory'],
  crashed_count_wait: 0
});

describe("test sync framework offline", function(){
  this.timeout(5000);
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
    syncClient.loadDataSet(dataSetId, function(){
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

  it("test failures", function(done){
    var success = sinon.spy();

    var fail = sinon.spy();

    syncClient.doList("invalid_dataset", success);
    syncClient.doCreate("invalid_dataset", null, success);

    syncClient.doRead("invalid_dataset", "invaliduid", success);

    syncClient.doUpdate("invalid_dataset", "invaliduid", null, success);

    syncClient.doDelete("invalid_dataset", "invaliduid", success);

    syncClient.getQueryParams("invalid_dataset", success);

    syncClient.setQueryParams("invalid_dataset", success);

    syncClient.getMetaData("invalid_dataset", success);

    syncClient.setMetaData("invalid_dataset", {}, success);

    syncClient.getConfig("invalid_dataset", success);

    syncClient.setConfig("invalid_dataset", {}, success);

    syncClient.doSync("invalid_dataset", success);

    syncClient.forceSync("invalid_dataset", success);

    syncClient.doList("invalid_dataset", success, fail);
    syncClient.doCreate("invalid_dataset", null, success, fail);
    syncClient.doRead("invalid_dataset", "invaliduid", success, fail);
    syncClient.doUpdate("invalid_dataset", "invaliduid", null, success, fail);
    syncClient.doDelete("invalid_dataset", "invaliduid", success, fail);
    syncClient.getQueryParams("invalid_dataset", success, fail);
    syncClient.setQueryParams("invalid_dataset",{}, success, fail);
    syncClient.getMetaData("invalid_dataset", success, fail);
    syncClient.setMetaData("invalid_dataset", {}, success, fail);
    syncClient.getConfig("invalid_dataset", success, fail);
    syncClient.setConfig("invalid_dataset", {}, success, fail);
    syncClient.doSync("invalid_dataset", success, fail);
    syncClient.forceSync("invalid_dataset", success, fail);

    expect(fail.callCount).to.equal(13);

    done();

  });
});
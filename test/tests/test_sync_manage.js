var process = require("process");
if (document && document.location) {
  if (document.location.href.indexOf("coverage=1") > -1) {
    process.env.LIB_COV = 1;
  }
}

var syncClient = process.env.LIB_COV ? require("../../src-cov/modules/sync-cli") : require("../../src/modules/sync-cli");
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

var dataSetId = "myMockDataset";

var defaultConfig = {
  do_console_log: true,
  sync_frequency: 1,
  sync_active: false,
  storage_strategy: ['memory'],
  crashed_count_wait: 0
};

var customTimeConfig = {sync_frequency: 11};

describe("test sync manage", function() {
  before(function() {
    syncClient.init({
      do_console_log: true,
      sync_frequency: 1,
      sync_active: false,
      storage_strategy: ['memory'],
      crashed_count_wait: 0
    });
  });


  afterEach(function(done) {
    syncClient.notify(undefined);
    syncClient.stopSync(dataSetId, done, done);
  });

  it("should use default values when config is invalid", function(done) {
    syncClient.manage(dataSetId, {}, {}, {});
    syncClient.getConfig(dataSetId,
      function(config) {
        expect(config.sync_frequency).to.be.equal(defaultConfig.sync_frequency);
        done();
      }, function(message) {
        expect(message).to.not.exist;
        done(message);
      }
    );
  });

  it("should set custom config", function(done) {
    syncClient.manage(dataSetId, customTimeConfig, {}, {});
    syncClient.getConfig(dataSetId,
      function(config) {
        expect(config.sync_frequency).to.be.equal(customTimeConfig.sync_frequency);
        done();
      }, function(message) {
        expect(message).to.not.exist;
        done(message);
      }
    );
  });

  it("syncClient.setConfig should only set values that are passed", function(done) {
    var customOption =  {"custom_option": true};

    syncClient.manage(dataSetId, customTimeConfig, {}, {});
    syncClient.setConfig(dataSetId, customOption);

    syncClient.getConfig(dataSetId,
      function(config) {
        expect(config.sync_frequency).to.be.equal(customTimeConfig.sync_frequency);
        expect(config.custom_option).to.be.equal(true);
        done();
      }, function(message) {
        expect(message).to.not.exist;
        done(message);
      }
    );
  });

  it("syncClient.startSync should not change dataset config back to the default global", function(done) {

    syncClient.manage(dataSetId, customTimeConfig, {}, {});
    syncClient.startSync(dataSetId);

    syncClient.getConfig(dataSetId,
      function(config) {
        expect(config.sync_frequency).to.be.equal(customTimeConfig.sync_frequency);
        expect(config.sync_active).to.be.equal(true);
        done();
      }, function(message) {
        expect(message).to.not.exist;
        done(message);
      }
    );
  });

});
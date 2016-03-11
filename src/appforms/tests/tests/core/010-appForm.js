var assert = chai.assert;


describe("appForm", function() {
    describe("Initialisation", function() {
    	before(function(done){
	      if (appForm.utils.fileSystem.isFileSystemAvailable()) {
	        appForm.utils.fileSystem.clearFileSystem(done);
	      } else {
	        done();
	      }
	    });
        it("how to init appForm", function(done) {
            appForm.init(function(err) {
                assert(!err, "Expected no error: " + err);
                done();
            });
        });
    });

});
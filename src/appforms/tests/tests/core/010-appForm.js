var assert = chai.assert;


describe("appForm", function() {
    describe("Initialisation", function() {
        it("how to init appForm", function(done) {
            appForm.init(function(err) {
                assert(!err);
                done();
            });
        });
    });

});
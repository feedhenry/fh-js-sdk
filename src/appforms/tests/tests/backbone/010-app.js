var assert = chai.assert;


describe("Backbone - App", function() {
    it("check Namespace has been created", function(done) {
        assert.ok(App);
        assert.ok(App.models);
        assert.ok(App.views);
        assert.ok(App.collections);
        done();
    });
});
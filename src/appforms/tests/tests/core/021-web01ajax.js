describe("Ajax", function() {
    it("should do a GET request", function(done) {
        appForm.web.ajax.get('mbaas/forms', function(err, res) {
            assert(!err);
            assert(res);
            assert(res.forms);
            assert(res.forms.length === 1);
            done();
        });
    });

    it("should handle a failed GET request", function(done) {
        appForm.web.ajax.get('idontexsist', function(err, res) {
            assert(err);
            assert(!res);
            assert(err.status === 404);
            assert(err.response === "Cannot GET /idontexsist");
            done();
        });
    });

    it("should do a POST request", function(done) {
        appForm.web.ajax.post('mbaas/forms', { "Name": "Foo", "Id": 1234, "Rank": 7 }, function(err, res) {
            assert(!err);
            assert(res);
            var response = res;
            assert(response.body);
            assert(response.body.Name === "Foo");
            assert(response.body.Id === 1234);
            assert(response.body.Rank === 7);
            done();
        });
    });

    it("should handle a failed POST request", function(done) {
        appForm.web.ajax.post('idontexsist', { "Name": "Foo", "Id": 1234, "Rank": 7 }, function(err, res) {
            assert(err);
            assert(!res);
            assert(err.status === 404);
            assert(err.response === "Cannot POST /idontexsist");
            done();
        });
    });
});
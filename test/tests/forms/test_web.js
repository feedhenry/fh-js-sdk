var chai = require('chai');
var expect = chai.expect;
var sinonChai = require('sinon-chai');
chai.use(sinonChai);

describe("Ajax", function() {
    it("should do a GET request", function(done) {
        appForm.web.ajax.get('mbaas/forms/fdsfas', function(err, res) {
            assert(!err);
            assert(res);
            assert(res.forms);
            assert(res.forms.length > 0);
            done();
        });
    });

    it("should handle a failed GET request", function(done) {
        appForm.web.ajax.get('idontexsist', function(err, res) {
            assert(err);
            assert(!res);
            assert(err.status === 404);
            assert(err.response.indexOf("Cannot GET /idontexsist") > -1);
            done();
        });
    });

    it("should do a POST request", function(done) {
        appForm.web.ajax.post('mbaas/forms/fdsfas', {
            "Name": "Foo",
            "Id": 1234,
            "Rank": 7
        }, function(err, res) {
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
        appForm.web.ajax.post('idontexsist', {
            "Name": "Foo",
            "Id": 1234,
            "Rank": 7
        }, function(err, res) {
            assert(err);
            assert(!res);
            assert(err.status === 404);
            assert(err.response.indexOf("Cannot POST /idontexsist") > -1);
            done();
        });
    });
});
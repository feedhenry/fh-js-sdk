describe("File system", function() {
    if (appForm.utils.fileSystem.isFileSystemAvailable()) {
        it("how to check if filesystem available", function() {
            var fileSystem = appForm.utils.fileSystem;
            assert(fileSystem.isFileSystemAvailable());
        });
        it("how to save a file with content", function(done) {
            var fileSystem = appForm.utils.fileSystem;
            fileSystem.save("mytestfile.txt", "This param could be string, json object or File object", function(err, res) {
                assert(!err);
                assert(res);
                done();
            });
        });
        it("how to read a file as text", function(done) {
            var fileSystem = appForm.utils.fileSystem;
            fileSystem.readAsText("mytestfile.txt", function(err, res) {
                assert(!err);
                assert(res);
                assert(res == "This param could be string, json object or File object");
                done();
            });
        });
        it("how to read a file as base64 encoded", function(done) {
            var fileSystem = appForm.utils.fileSystem;
            fileSystem.readAsBase64Encoded("mytestfile.txt", function(err, res) {
                assert(!err);
                assert(res);
                done();
            });
        });
        it("how to read a file as blob", function(done) {
            var fileSystem = appForm.utils.fileSystem;
            fileSystem.readAsBlob("mytestfile.txt", function(err, res) {
                assert(!err);
                assert(res);
                done();
            });
        });
        it("how to remove a file", function(done) {
            var fileSystem = appForm.utils.fileSystem;
            fileSystem.remove("mytestfile.txt", function(err, res) {
                assert(!err);
                assert(!res);
                done();
            });
        });
    }


});
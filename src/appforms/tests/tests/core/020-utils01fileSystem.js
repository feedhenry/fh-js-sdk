describe("File system", function() {
    if (appForm.utils.fileSystem.isFileSystemAvailable()) {
        it("how to check if filesystem available", function() {
            var fileSystem = appForm.utils.fileSystem;
            assert(fileSystem.isFileSystemAvailable());
        });
        it("how to save a file with content", function(done) {
            var fileSystem = appForm.utils.fileSystem;
            fileSystem.save("mytestfile.txt", "This param could be string, json object or File object", function(err, res) {
                assert(!err, "Expected no error: " + err);
                assert(res);
                done();
            });
        });
        it("how to read a file as text", function(done) {
            var fileSystem = appForm.utils.fileSystem;
            fileSystem.readAsText("mytestfile.txt", function(err, res) {
                assert(!err, "Expected no error: " + err);
                assert(res);
                assert(res == "This param could be string, json object or File object");
                done();
            });
        });
        it("how to read a file as base64 encoded", function(done) {
            var fileSystem = appForm.utils.fileSystem;
            fileSystem.readAsBase64Encoded("mytestfile.txt", function(err, res) {
                assert(!err, "Expected no error: " + err);
                assert(res);
                done();
            });
        });
        it("how to read a file as blob", function(done) {
            var fileSystem = appForm.utils.fileSystem;
            fileSystem.readAsBlob("mytestfile.txt", function(err, res) {
                assert(!err, "Expected no error: " + err);
                assert(res);
                done();
            });
        });
        it("how to remove a file", function(done) {
            var fileSystem = appForm.utils.fileSystem;
            fileSystem.remove("mytestfile.txt", function(err, res) {
                assert(!err, "Expected no error: " + err);
                assert(!res);
                done();
            });
        });

        it("how to clear the file system", function(done){
          var fileSystem = appForm.utils.fileSystem;
          var testFileName = "mytestfile2.txt";
          async.series([
            function saveTestFile(cb){
              //Save A Test File
              fileSystem.save(testFileName, "This param could be string, json object or File object", function(err) {
                  assert(!err, "Expected No Error " + err);
                  cb();
              });
            },
            function checkFileIsThere(cb){
              fileSystem.readAsText(testFileName, function(err, res) {
                  assert(!err, "Expected No Error " + err);
                  assert.equal(res, "This param could be string, json object or File object");
                  cb();
              });
            },
            function clearFileSystem(cb){
              fileSystem.clearFileSystem(function(err){
                assert.ok(!err, "Expected No Error");

                cb();
              });
            },
            function checkFileIsRemoved(cb){
              fileSystem.readAsText(testFileName, function(err, res) {
                  assert(err, "Expected An Error");
                  assert.equal(res, undefined);
                  cb();
              });
            }
          ], done);
        });
    }
});

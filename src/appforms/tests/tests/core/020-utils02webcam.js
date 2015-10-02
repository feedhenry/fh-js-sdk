describe("Webcam", function() {
  it("how to scan a barcode", function(done) {

    appForm.utils.captureBarcode({}, function(err, barcodeObject){
      assert.ok(err, "Expected Error ");
      assert.ok(err.indexOf("not supported yet") > -1);
      assert.ok(!barcodeObject);

      done();
    });
  });
});
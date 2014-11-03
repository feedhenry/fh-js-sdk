describe("Webcam", function() {
  it("how to scan a barcode", function(done) {

    appForm.utils.captureBarcode({}, function(err, barcodeObject){
      assert.ok(err, "Expected Error ");
      assert.ok(err.indexOf("not supported yet") > -1);
      assert.ok(!barcodeObject);

      //Fake barcode scanner
      window.cordova = {
        plugins: {
          barcodeScanner: {
            scan: function(success, error){
              return success({
                format: "BarcodeFormat",
                text: "BarcodeText"
              });
            }
          }
        }
      };

      appForm.utils.captureBarcode({}, function(err, barcodeObject){
        assert.ok(!err, "Unexpected Error " + err);
        assert.ok(barcodeObject, "Expected a barcode object");
        assert.ok(barcodeObject.format, "Expected a barcode object format");
        assert.ok(barcodeObject.text, "Expected a barcode object text");

        window.cordova = undefined;

        done();
      });
    });
  });
});
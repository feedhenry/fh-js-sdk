describe("Theme model", function(done) {
  it("how to initialise a theme", function(done) {
    var theme = appForm.models.theme;

    assert(theme.get("_type") === "theme");
    done();
  });
  it("how to refresh a theme", function(done) {
    var theme = appForm.models.theme;

    theme.refresh(true, function(err, theme){
      assert(!err, "Expected no error: " + err);
      assert(theme.get("name") === testData.themeName);
      done();
    });
  });
});
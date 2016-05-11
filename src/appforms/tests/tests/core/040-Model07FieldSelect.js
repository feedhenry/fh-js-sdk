describe("Dropdown Field Model", function() {

  function getMockDrowdownFieldData(include_blank_option){
    return {
      "required": true,
      "type": "dropdown",
      "name": "Dropdown",
      "fieldCode": null,
      "_id": "572b7c7c398524923d6343ac",
      "adminOnly": false,
      "fieldOptions": {
        "validation": {
          "validateImmediately": true
        },
        "definition": {
          "options": [
            {
              "label": "Option 1",
              "checked": false
            },
            {
              "label": "Option 2",
              "checked": false
            }
          ],
          "include_blank_option": include_blank_option
        }
      },
      "repeating": false
    };
  }

  it("Get Options, no blank option included", function() {
    var dropdownField = new appForm.models.Field(getMockDrowdownFieldData(true));

    var dropdownOptions = dropdownField.getDropdownOptions();
    assert.equal(3, dropdownOptions.length, "Expected 3 dropdown options");
    //The first label should be an empty string if the blank option is included
    assert.equal("", dropdownOptions[0].label, "Expected the first option to be an empty string.");
  });

  it("Get Options, blank option included", function() {
    var dropdownField = new appForm.models.Field(getMockDrowdownFieldData(false));

    var dropdownOptions = dropdownField.getDropdownOptions();
    assert.equal(2, dropdownOptions.length, "Expected 2 dropdown options");
    //The first label should be the first option in the dropdown list.
    assert.equal("Option 1", dropdownField.getDropdownOptions()[0].label, "Expected the first option to be the first option available");
  });

});
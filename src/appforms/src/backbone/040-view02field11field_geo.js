FieldGeoView = FieldView.extend({
  input: "<input data-field='<%= fieldId %>' data-index='<%= index %>' type='<%= inputType %>' disabled/> ",
  type: "text",
  renderInput: function(index) {
    this.locationUnit = this.model.getFieldDefinition().locationUnit;
    var btnLabel = this.locationUnit === "latLong" ? 'Capture Location (Lat/Lon)' : 'Capture Location (East/North)';
    var html = _.template(this.input, {
      "fieldId": this.model.getFieldId(),
      "index": index,
      "inputType": "text"
    });
    html+=this.renderButton(index,btnLabel,"fhgeo");
    return html;
  },
  onRender: function() {
    var that = this;
    this.$el.find("button").on("click", function(e) {
      e.preventDefault();
      var btn = $(this);
      var index = btn.data().index;
      var wrapper = that.getWrapper(index);
      var textInput = wrapper.find("input[type='text']");
      $fh.geo(function(res) {
        var location;

        // check unit
        if (that.locationUnit === "latLong") {
          location = '(' + res.lat + ', ' + res.lon + ')';
        } else if (that.locationUnit === "northEast") {
          var en_location = that.convertLocation(res);
          location = '(' + en_location.easting + ', ' + en_location.northing + ')';
        }

        textInput.val(location);
      }, function(msg, err) {
        textInput.attr('placeholder', 'Location could not be determined');
      });
      textInput.blur();
      return false;
    });
  },
  convertLocation: function(location) {
    var lat = location.lat;
    var lon = location.lon;
    var params = {
      lat: function() {
        return lat;
      },
      lon: function() {
        return lon;
      }
    };
    return OsGridRef.latLongToOsGrid(params);
  }
});
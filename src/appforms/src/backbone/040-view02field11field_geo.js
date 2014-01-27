FieldGeoView = FieldView.extend({
  input: '<input data-field=\'<%= fieldId %>\' data-index=\'<%= index %>\' type=\'<%= inputType %>\' disabled/> ',
  type: 'text',
  initialize: function () {
    this.geoValues = [];
    this.locationUnit = this.model.getFieldDefinition().locationUnit;
    FieldView.prototype.initialize.apply(this, arguments);
  },
  renderInput: function (index) {
    var btnLabel = this.locationUnit === 'latLong' ? 'Capture Location (Lat/Lon)' : 'Capture Location (East/North)';
    var html = _.template(this.input, {
        'fieldId': this.model.getFieldId(),
        'index': index,
        'inputType': 'text'
      });
    html += this.renderButton(index, btnLabel, 'fhgeo');
    return html;
  },
  onRender: function () {
    var that = this;
    this.$el.find('button').on('click', function (e) {
      e.preventDefault();
      var btn = $(this);
      var index = btn.data().index;
      var wrapper = that.getWrapper(index);
      var textInput = wrapper.find('input[type=\'text\']');
      $fh.geo(function (res) {
        var location;
        if (that.locationUnit === 'latLong') {
          that.geoValues[index] = {
            'lat': res.lat,
            'long': res.lon
          };
        } else if (that.locationUnit === 'northEast') {
          var en_location = that.convertLocation(res);
          var locArr = en_location.toString().split(' ');
          that.geoValues[index] = {
            'zone': locArr[0],
            'eastings': locArr[1],
            'northings': locArr[2]
          };
        }
        that.renderElement(index);
      }, function (msg, err) {
        textInput.attr('placeholder', 'Location could not be determined');
      });
      return false;
    });
  },
  convertLocation: function (location) {
    var lat = location.lat;
    var lon = location.lon;
    var params = {
        lat: function () {
          return lat;
        },
        lon: function () {
          return lon;
        }
      };
    return OsGridRef.latLongToOsGrid(params);
  },
  renderElement: function (index) {
    var location = this.geoValues[index];
    var locStr = '';
    var textInput = this.getWrapper(index).find('input[type=\'text\']');
    if (location) {
      if (this.locationUnit === 'latLong') {
        locStr = '(' + location.lat + ', ' + location.long + ')';
      } else if (this.locationUnit === 'northEast') {
        locStr = '(' + location.zone + ' ' + location.eastings + ', ' + location.northings + ')';
      }
      textInput.val(locStr);
    }
    textInput.blur();
  },
  valuePopulateToElement: function (index, value) {
    this.geoValues[index] = value;
    this.renderElement(index);
  },
  valueFromElement: function (index) {
    return this.geoValues[index];
  }
});
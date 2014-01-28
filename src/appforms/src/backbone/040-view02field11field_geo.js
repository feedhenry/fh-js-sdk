FieldGeoView = FieldView.extend({
  input: "<input class='fh_appform_field_input' data-field='<%= fieldId %>' data-index='<%= index %>'  type='<%= inputType %>' disabled/>",
  buttonHtml: "<i class='fa fa-map-marker'></i>&nbsp<%= buttonText %>",
  type: "text",
  initialize: function() {
    this.geoValues=[];
    this.locationUnit = this.model.getFieldDefinition().locationUnit;
    FieldView.prototype.initialize.apply(this, arguments);
  },
  renderInput: function(index) {
    var html = _.template(this.input, {
      "fieldId": this.model.getFieldId(),
      "index": index,
      "inputType": "text"
    });


    return html;
  },
  onElementShow: function(index){
    var self = this;
    var btnLabel = this.locationUnit === "latlong" ? 'Capture Location (Lat/Lon)' : 'Capture Location (East/North)';
    btnLabel = _.template(this.buttonHtml, {"buttonText": btnLabel});
    var geoButton = $(this.renderButton(index, btnLabel, "fhgeo"));

    this.getWrapper(index).append(geoButton);

    geoButton.on("click", function(e){
      self.getLocation(e, index);
    });
  },
  onRender: function() {
    var that = this;
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
  },
  renderElement: function(index) {
    var location = this.geoValues[index];
    var locStr = "";
    var textInput = this.getWrapper(index).find(".fh_appform_field_input");
    if (location) {
      if (this.locationUnit === "latlong") {
        locStr = '(' + location.lat + ', ' + location.long + ')';
      } else if (this.locationUnit === "eastnorth") {
        locStr = '(' + location.zone+' '+location.eastings + ', ' + location.northings + ')';
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
  },
  getLocation: function(e, index) {
    var that = this;
    e.preventDefault();
    var wrapper = that.getWrapper(index);
    var textInput = wrapper.find(".fh_appform_field_input");


    //$fh.geo does not exist on the theme preview.
    if($fh.geo){
      $fh.geo(function(res) {
        var location;
        if (that.locationUnit === "latlong") {
          that.geoValues[index] = {
            "lat": res.lat,
            "long": res.lon
          };
        }else if (that.locationUnit==="eastnorth"){
          var en_location = that.convertLocation(res);
          var locArr=en_location.toString().split(" ");
          that.geoValues[index]={
            "zone":locArr[0],
            "eastings":locArr[1],
            "northings":locArr[2]
          }
        }
        that.renderElement(index);
      }, function(msg, err) {
        textInput.attr('placeholder', 'Location could not be determined');
      });
    }

    return false;
  }
});
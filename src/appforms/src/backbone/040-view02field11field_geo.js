FieldGeoView = FieldView.extend({
    input: "<input class='fh_appform_field_input col-xs-12 text-center <%= repeatingClassName%>' data-field='<%= fieldId %>' data-index='<%= index %>'  type='<%= inputType %>' disabled/>",
    buttonHtml: "<i class='icon-location-arrow'></i>&nbsp<%= buttonText %>",
    type: "text",
    initialize: function() {
        this.geoValues = [];
        this.locationUnit = this.model.getFieldDefinition().locationUnit;
        FieldView.prototype.initialize.apply(this, arguments);
    },
    renderInput: function(index) {
        var repeatingClassName = this.model.isRepeating() ? this.repeatingClassName : this.nonRepeatingClassName;
        var html = _.template(this.input, {
            "fieldId": this.model.getFieldId(),
            "index": index,
            "inputType": "text",
            "repeatingClassName": repeatingClassName
        });

        return $(html);
    },
    onElementShow: function(index) {
        var self = this;
        var rmBtn = $(this.renderButton(index, "<i class='icon-remove-circle'></i>&nbsp;Remove Location", "remove"));
        var btnLabel = this.locationUnit === "latlong" ? 'Capture Location (Lat/Lon)' : 'Capture Location (East/North)';
        btnLabel = _.template(this.buttonHtml, {
            "buttonText": btnLabel
        });
        var geoButton = $(this.renderButton(index, btnLabel, "fhgeo"));

        if (!this.readonly) {
            this.getWrapper(index).append(geoButton);
            this.getWrapper(index).append(rmBtn);

            geoButton.on("click", function(e) {
                self.getLocation(e, index);
            });

            rmBtn.on("click", function(e) {
                self.clearLocation(e, index);
                rmBtn.hide();
            });

            rmBtn.hide();
        }


    },
    clearLocation: function(e, index) {
        var textInput = this.getWrapper(index).find(".fh_appform_field_input");
        textInput.val("");
        this.geoValues.splice(index, 1); // Remove the geo value from the field
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
        var wrapper = this.getWrapper(index);
        var textInput = wrapper.find(".fh_appform_field_input");
        if (location) {
            if (this.locationUnit === "latlong") {
                locStr = '(' + location.lat + ', ' + location["long"] + ')';
                wrapper.find(".remove").show();
            } else if (this.locationUnit === "eastnorth") {
                locStr = '(' + location.zone + ' ' + location.eastings + ', ' + location.northings + ')';
                wrapper.find(".remove").show();
            } else {
                $fh.forms.log.e("FieldGeo: Invalid location unit: " + locStr);
            }
            textInput.val(locStr);
        } else {
            wrapper.find(".remove").hide();
        }
        textInput.blur();
    },
    valuePopulateToElement: function(index, value) {
        this.geoValues[index] = value;
        this.renderElement(index);
    },
    valueFromElement: function(index) {
        return this.geoValues[index];
    },
    getLocation: function(e, index) {
        var that = this;
        e.preventDefault();
        var wrapper = that.getWrapper(index);
        var textInput = wrapper.find(".fh_appform_field_input");


        //$fh.geo does not exist on the theme preview.
        if ($fh.geo) {
            $fh.geo(function(res) {
                var location;

                res.lat = Number(Number(res.lat).toFixed(4));
                res.lon = Number(Number(res.lon).toFixed(4));
                if (that.locationUnit === "latlong") {
                    that.geoValues[index] = {
                        "lat": res.lat,
                        "long": res.lon
                    };
                } else if (that.locationUnit === "eastnorth") {
                    var en_location = that.convertLocation(res);
                    var locArr = en_location.toString().split(" ");
                    that.geoValues[index] = {
                        "zone": locArr[0],
                        "eastings": locArr[1],
                        "northings": locArr[2]
                    };
                } else {
                    $fh.forms.log.e("FieldGeo: Invalid location unit: " + locStr);
                }
                that.renderElement(index);
            }, function(msg, err) {
                textInput.attr('placeholder', 'Location could not be determined');
            });
        }

        return false;
    }
});
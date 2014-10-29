FieldMapView = FieldView.extend({
  extension_type: 'fhmap',
  input: "<div data-index='<%= index %>' id='<%= id%>' class='fh_map_canvas' style='width:<%= width%>; height:<%= height%>;'></div>",
  initialize: function() {
    this.mapInited = 0;
    this.maps = [];
    this.mapData = [];
    this.markers = [];
    this.allMapInitFunc = [];
    this.mapSettings = {
      mapWidth: '100%',
      mapHeight: '300px',
      defaultZoom: 16,
      location: {
        lon: -5.80078125,
        lat: 53.12040528310657
      }
    };
    FieldView.prototype.initialize.apply(this, arguments);
  },
  renderInput: function(index) {
    var inputEle = _.template(this.input);
    return $(inputEle({
      width: this.mapSettings.mapWidth,
      height: this.mapSettings.mapHeight,
      'index': index,
      'id':Math.random()
    }));
  },
  show: function() {
    this.$el.show();
    this.mapResize();
  },
  onMapInit: function(index) {
    this.mapInited++;
    if (this.mapInited === this.curRepeat) {
      // all map initialised
      this.allMapInit();
    }
  },
  allMapInit: function() {
    var func = this.allMapInitFunc.shift();
    while (typeof(func) !== "undefined") {
      if(typeof(func) === "function"){
        func();
        func = this.allMapInitFunc.shift();
      } else {
        func = this.allMapInitFunc.shift();
      }
    }
    this.mapResize();
  },
  onAllMapInit: function(func) {
    if (this.mapInited === this.curRepeat) {
      func();
      this.mapResize();
    } else {
      if (this.allMapInitFunc.indexOf(func) === -1) {
        this.allMapInitFunc.push(func);
      }
    }
  },
  onElementShow: function(index) {
    var wrapperObj = this.getWrapper(index);
    var self = this;

    var mapCanvas = wrapperObj.find('.fh_map_canvas')[0];

    if($fh.geo){
      $fh.geo({
        interval: 0
      }, function(geoRes) {
        // Override with geo, otherwise use defaults
        var location = {
          lat: geoRes.lat,
          lon: geoRes.lon
        };
        $fh.map({
          target: mapCanvas,
          lon: location.lon,
          lat: location.lat,
          zoom: self.mapSettings.defaultZoom,
          draggable: !self.readonly
        }, function(res) {
          self.maps[index] = res.map;

          var marker = new google.maps.Marker({
            position: self.maps[index].getCenter(),
            map: self.maps[index],
            draggable: !self.readonly,
            animation: google.maps.Animation.DROP,
            title: 'Drag this to set position'
          });
          self.markers[index] = marker;
          self.mapData[index] = {
            'lat': marker.getPosition().lat(),
            'long': marker.getPosition().lng(),
            'zoom': self.mapSettings.defaultZoom
          };
          self.onMapInit(index);
        }, function(err) {
          $fh.forms.log.e("Error getting map: ", err);
          self.onMapInit(index);
        });
      });
    }
  },
  mapResize: function() {
    var self = this;
    if (self.maps.length > 0) {
      for (var i = 0; i < self.maps.length; i++) {
        var map = this.maps[i];
        if (map) {
          google.maps.event.trigger(map, 'resize');
          map.setCenter(new google.maps.LatLng(self.mapData[i].lat, self.mapData[i]["long"]));
        }
      }
    }
  },
  onRender: function(){
    this.mapResize();
  },
  valueFromElement: function(index) {
    var map = this.maps[index];
    var marker = this.markers[index];
    if (map && marker) {
      return {
        'lat': marker.getPosition().lat(),
        'long': marker.getPosition().lng(),
        'zoom': map.getZoom()
      };
    } else {
      return null;
    }
  },
  valuePopulateToElement: function(index, value) {
    var that = this;
    function _handler() {
      var map = that.maps[index];
      var pt = new google.maps.LatLng(value.lat, value["long"]);
      that.mapData[index].lat = value.lat;
      that.mapData[index]["long"] = value["long"];
      map.setCenter(pt);
      map.setZoom(value.zoom);
      that.markers[index].setPosition(pt);
    }
    if (value){
      this.onAllMapInit(_handler);
    }

  }
});
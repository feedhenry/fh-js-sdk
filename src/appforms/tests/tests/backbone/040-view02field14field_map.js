var assert = chai.assert;


describe("Backbone Map View", function() {

  var oldGeolocation = navigator.geolocation;

  var mapForm = {
    "_id": "58a6d7f8ed4560ba675e31c7",
    "createdBy": "ndonnell@redhat.com",
    "description": "Blank form with no fields",
    "name": "testniallmap",
    "updatedBy": "ndonnell@redhat.com",
    "dataTargets": [],
    "dataSources": {"formDataSources": []},
    "subscribers": [],
    "pageRules": [],
    "fieldRules": [],
    "pages": [{
      "_id": "58a6d7f8ed4560ba675e31c6",
      "fields": [{
        "required": true,
        "type": "locationMap",
        "name": "Map",
        "fieldCode": null,
        "_id": "58a6d800b73a4cb067d73809",
        "adminOnly": false,
        "fieldOptions": {"validation": {"validateImmediately": true}},
        "repeating": false,
        "dataSourceType": "static"
      }]
    }],
    "lastUpdated": "2017-02-17T11:01:20.600Z",
    "dateCreated": "2017-02-17T11:01:12.419Z",
    "lastDataRefresh": "2017-02-17T11:01:20.600Z",
    "pageRef": {"58a6d7f8ed4560ba675e31c6": 0},
    "fieldRef": {"58a6d800b73a4cb067d73809": {"page": 0, "field": 0}},
    "lastUpdatedTimestamp": 1487329280600
  };

  var mockError = {
    code: "PERMISSION_DENIED",
    message: "Map Permission Denied"
  };

  var changeGeolocation = function(object) {
    if (Object.defineProperty) {
      Object.defineProperty(navigator, 'geolocation', {
        get: function() {
          return object;
        },
        configurable: true
      });
    } else if (navigator.__defineGetter__) {
      navigator.__defineGetter__('geolocation', function() {
        return object;
      });
    } else {
      throw new Error('Cannot change navigator.geolocation method');
    }
  };
  var mockCoordinates = {
    coords: {
      latitude: 22,
      longitude: 11
    }
  };

  var mockGeolocation = {
    getCurrentPosition: function(success, failure, parameters) {
      chai.expect(parameters.timeout).to.be.a('number');
      chai.expect(success).to.be.a('function');
      chai.expect(failure).to.be.a('function');

      return success(mockCoordinates);
    }
  };

  var mockGeolocationError = {
    getCurrentPosition: function(success, failure, parameters) {
      chai.expect(parameters.timeout).to.be.a('number');
      chai.expect(success).to.be.a('function');
      chai.expect(failure).to.be.a('function');

      return failure(mockError);
    }
  };

  changeGeolocation(mockGeolocation);

  before(function(done) {
    var self = this;
    var Form = appForm.models.Form;
    new Form({
      formId: "58a6d7f8ed4560ba675e31c7",
      rawMode: true,
      rawData: mapForm
    }, function(err, form) {
      assert.ok(!err, "Expected No Error");
      assert.ok(form, "Expected a form  model");

      self.form = form;

      self.formView = new FormView({
        parentEl: $("<div></div>")
      });

      self.formView.loadForm({
        form: form
      }, function(err) {
        assert.ok(!err, "Expected no error");
        self.formView.render();

        done();
      });
    });
  });

  after(function() {
    changeGeolocation(oldGeolocation);
  });

  it("It should get a map location", function(done) {
    var mapField = this.form.getFieldModelById("58a6d800b73a4cb067d73809");


    // create backbone dropdown field View
    var parentView = new Backbone.View();
    var mapView = new FieldMapView({
      parentEl: parentView.$el,
      formView: this.formView,
      model: mapField
    });

    mapView.getPosition(function(err, position) {
      chai.expect(err).to.be.an('null');
      chai.expect(position).to.deep.equal(mockCoordinates);

      done();
    });
  });

  it("It should display an error", function(done) {
    var mapField = this.form.getFieldModelById("58a6d800b73a4cb067d73809");

    changeGeolocation(mockGeolocationError);

    // create backbone dropdown field View
    var parentView = new Backbone.View();
    var mapView = new FieldMapView({
      parentEl: parentView.$el,
      formView: this.formView,
      model: mapField
    });

    mapView.getPosition(function(err, position) {
      chai.expect(position).to.be.an('undefined');
      chai.expect(err).to.deep.equal(mockError);

      done();
    });
  });
});
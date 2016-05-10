var assert = assert;

describe("Backbone - Step View", function() {

  it("should not display page number if there is only one page", function(done) {
    var stepsView = new StepsView(pages(1).displayIndex(0).createOptions());
    stepsView.activePageChange();
    assert.notOk(findPageTitle(stepsView));
    assert.lengthOf(pagination(stepsView), 0, "There should be no pagination if there is only one page.");
    done();
  });

  it("should display page number if there is more than one page", function(done) {
    var stepsView = new StepsView(pages(2).displayIndex(1).createOptions());
    stepsView.activePageChange();
    assert.equal(findPageTitle(stepsView), "Page 2");
    assert.lengthOf(pagination(stepsView), 2);
    done();
  });

  it("should not display 'Page 1' if there is only a single page and no page title", function(done) {
    var stepsView = new StepsView(pages(2).displayIndex(0).createOptions());
    stepsView.activePageChange();
    assert.equal(findPageTitle(stepsView), "Page 1");
    assert.lengthOf(pagination(stepsView), 2, "There should be no pagination if there is only one page.");
    done();
  });

  it("should display custom page name if one was defined on the model but only one page to display", function(done) {
    var stepsView = new StepsView(pages(1).displayIndex(0).modelName("Custom").createOptions());
    stepsView.activePageChange();
    assert.equal(findPageTitle(stepsView), "Custom");
    assert.lengthOf(pagination(stepsView), 0, "There should be no pagination if there is only one page.");
    done();
  });

  it("should display custom page name independant of the number of pages", function(done) {
    var stepsView = new StepsView(pages(2).displayIndex(2).modelName("Custom Page name").createOptions());
    stepsView.activePageChange();
    assert.equal(findPageTitle(stepsView), "Custom Page name");
    assert.lengthOf(pagination(stepsView), 2);
    done();
  });

});

function pages(p) {
  var pages = p, displayIndex = 0, modelName = '';
  return {
    displayIndex: function(index) {
      displayIndex = index;
      return this;
    },
    modelName: function(name) {
      modelName = name;
      return this;
    },
    createOptions: function() {
      return createOptions(pages, displayIndex, modelName);
    }
  }
}

function createOptions(pages, displayIndex, modelName) {
  var pageModel = {
    getName: function() {
      return modelName;
    },
    getDescription: function() {
      return '';
    }
  };
  var parentEl = {
    append: function() {}
  };
  var parentView = {
    pageNum: 0,
    getDisplayedPages: function() {
      var arr = [];
      for (var i = 0; i < pages; i++) {
        arr[i] = i;
      }
      return arr;
    },
    getDisplayIndex: function() {
      return displayIndex;
    },
    getPageViewById: function(pageId) {
      return {model: pageModel};
    },
    getPageIndexById: function(pageId) {
      return displayIndex;
    },
    pageViews: [{model: pageModel}]
  };
  return {parentView: parentView, parentEl: parentEl};
}

function findPageTitle(stepsView) {
  return stepsView.$el.find('.fh_appform_page_title').html();
}

function pagination(stepsView) {
  return stepsView.$el.find('ul.pagination li');
}

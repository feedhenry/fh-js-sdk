StepsView = Backbone.View.extend({
  className: 'fh_appform_progress_steps col-xs-12',

  templates: {
      table: '<ul class="pagination pagination-lg col-xs-12"></ul>',
      step: '<li data-index="<%= index %>"><span class="number_container text-center" style="width: <%= width %>%;"><%= step_num %></span></li>',
      page_title: '<div class="col-xs-12 text-center"><h3 class="fh_appform_page_title"></h3></div>'
  },
  events: {
    'click li': 'switchPage'
  },

  initialize: function(options) {
    this.options = options;
    var self = this;

    _.bindAll(this, 'render');
    this.parentView = this.options.parentView;
    this.options.parentEl.append(this.$el);
  },

  render: function() {
    var self = this;
    this.$el.empty();
    var table = $(self.templates.table);

    var displayedPages = this.parentView.getDisplayedPages();
    var width = 100;

    if(displayedPages.length > 0){
      width = 100 / displayedPages.length;
    }

    displayedPages.forEach(function(pageId, index) {
      var pageModel = self.parentView.getPageViewById(pageId).model;
      var item = $(_.template(self.templates.step, {
          step_name: pageModel.getName(),
          step_num: index + 1,
          index: self.parentView.getPageIndexById(pageId),
          width: width
      }));
      $(table).append(item);
    });

    this.$el.append(table);
    return this;
  },
  switchPage: function(e){
    var index = 0;

    if(e && $(e.currentTarget).data()){
      index = $(e.currentTarget).data().index;
      if(typeof(index) !== "undefined"){
        this.parentView.goToPage(index);
      }
    }
  },

  activePageChange: function() {
    var self = this;
    self.render();
    self.$el.find('li').removeClass('active');

    var displayIndex = self.parentView.getDisplayIndex();
    var pageModel = self.parentView.pageViews[self.parentView.pageNum].model;

    self.$el.find('li:eq(' + displayIndex + ')').addClass('active');
    self.$el.find('.fh_appform_page_title').html(pageModel.getName());
  }

});
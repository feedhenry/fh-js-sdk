StepsView = Backbone.View.extend({
  className: 'fh_appform_steps',

  templates: {
    table: '<div class="fh_appform_progress_wrapper"><table class="fh_appform_progress_steps" cellspacing="0"><tr></tr></table></div>',
    step: '<td><span class="number_container" style="padding: 0px 10px 2px 9px;"><div class="number"><%= step_num %></div></span><br style="clear:both"/><span class="fh_appform_page_title"><%= step_name %></span></td>'
  },

  initialize: function() {
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
        step_num: index + 1
      }));
      item.css('width', width + '%');
      $('tr:first', table).append(item);
    });

    this.$el.append(table);
  },

  activePageChange: function() {
    var self = this;
    self.render();
    self.$el.find('td').removeClass('active');
    self.$el.find('.fh_appform_page_title').hide();
    self.$el.find('td:eq(' + self.parentView.getDisplayIndex() + ')').addClass('active');
    self.$el.find('td:eq(' + self.parentView.getDisplayIndex() + ') .fh_appform_page_title').show();
  }

});
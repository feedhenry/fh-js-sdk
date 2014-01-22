StepsView = Backbone.View.extend({
  className: 'fh_appform_steps',

  templates: {
    table: '<div class="fh_appform_progress_wrapper"><table class="fh_appform_progress_steps" cellspacing="0"><tr></tr></table></div>',
    step: '<td><span class="number_container"><div class="number"><%= step_num %></div></span><span class="fh_appform_page_title"><%= step_name %></span></td>'
  },

  initialize: function() {
    var self = this;

    _.bindAll(this, 'render');
    this.render();
  },

  render: function() {
    var self = this;
    var table = $(self.templates.table);

    var width = 100 / this.model.pages.length;

    this.model.pages.forEach(function(page, index) {
      var item = $(_.template(self.templates.step, {
        step_name: page.getName(),
        step_num: index + 1
      }));
      item.css('width', width + '%');
      $('tr:first', table).append(item);
    });

    this.$el.append(table);
    this.options.parentEl.append(this.$el);
    //$('#fh_appform_container', this.options.parentEl).after(self.$el);
  },

  activePageChange: function(model, pageIndex) {
    this.$el.find('td').removeClass('active');
    this.$el.find('td:eq(' + pageIndex + ')').addClass('active');
  }

});
SectionsView=BaseView.extend({

  initialize: function(options) {
    this.options = options;
    _.bindAll(this, 'render');
  },
  render: function(){
    this.options.parentEl.append(this.$el);
  }

});
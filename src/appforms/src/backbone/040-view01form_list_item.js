 var FormListItemView=BaseView.extend({
  events: {
    'click button.show.fetched': 'show',
    'click button.show.fetch_error': 'fetch'
  },

  templates: {
    form_button: '<li><button class="show button-block <%= enabledClass %> <%= dataClass %> fh_appform_button_navigation"><%= name %><div class="loading"></div></button></li>'
  },

  render: function() {
    var html;
    // var errorLoading = this.model.get('fh_error_loading');
    var enabled = true;
    html = _.template(this.templates.form_button, {
      name: this.model.name,
      enabledClass: enabled ? 'fh_appform_button_main' : '',
      // dataClass: errorLoading ? 'fetch_error' : fullyLoaded ? 'fetched' : 'fetching'
      dataClass:"fetched"
    });

    this.$el.html(html);
    this.$el.find('button').not('.fh_full_data_loaded');

    return this;
  },

  unrender: function() {
    $(this.el).remove();
  },

  show: function() {

    var formId=this.model._id;
    // this will init and render formView
    var formView = new FormView({parentEl:$("#backbone #page")});
    formView.loadForm({formId:formId}, function(){
      formView.render();
      Backbone.history.navigate('form',true);
    })
  },

  fetch: function () {
    // show loading view
    
    // var loadingView = new LoadingView(this.model);
    // loadingView.show('Syncing form');
    // this.model.fetch();
  }
});
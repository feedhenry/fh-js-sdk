var FormListView = BaseView.extend({
    events: {
        'click button#formlist_reload': 'reload'
    },

    templates: {
        list: '<ul class="form_list fh_appform_body"></ul>',
        header: '<h2>Your Forms</h2><h4>Choose a form from the list below</h4>',
        error: '<li><button id="formlist_reload" class="button-block <%= enabledClass %> <%= dataClass %> fh_appform_button_default"><%= name %><div class="loading"></div></button></li>'
    },

    initialize: function(options) {
        this.options = options || {};
        $fh.forms.log.l("Initialize Form List");
        _.bindAll(this, 'render', 'appendForm');
        this.views = [];

        App.collections.forms.bind('reset', function(collection, options) {
            if (options == null || !options.noFetch) {
                App.collections.forms.each(function(form) {
                    form.fetch();
                });
            }
        });

        App.collections.forms.bind('add remove reset error', this.render, this);
        this.model.on("updated", this.render);
    },

    reload: function() {
        $fh.forms.log.l("Reload Form List");
        var that = this;
        this.onLoad();
        this.model.refresh(true, function(err, formList) {
            this.onLoadEnd();
            that.model = formList;
            that.render();
        });
    },

    show: function() {
        $(this.el).show();
    },

    hide: function() {
        $(this.el).hide();
    },

    renderErrorHandler: function(msg) {
        try {
            if (msg == null || msg.match("error_ajaxfail")) {
                msg = "An unexpected error occurred.";
            }
        } catch (e) {
            msg = "An unexpected error occurred.";
        }
        var html = _.template(this.templates.error, {
            name: msg + "<br/>Please Retry Later",
            enabledClass: 'fh_appform_button_cancel', //TODO May not be this class. Double check
            dataClass: 'fetched'
        });
        $('ul', this.el).append(html);

    },

    render: function() {

        // Empty our existing view
        // this.options.parentEl.empty();

        // Add list
        this.options.parentEl.append(this.templates.list);
        var formList = this.model.getFormsList();
        if (formList.length > 0) {
            // Add header
            this.options.parentEl.find('ul').append(this.templates.header);
            _(formList).forEach(function(form) {
                this.appendForm(form);
            }, this);
        } else {
            this.renderErrorHandler(arguments[1]);
        }
    },

    appendForm: function(form) {
        // this.options.parentEl.find('ul').append("<li>"+form.name+"("+form.description+")"+"</li>");
        // console.log(form);
        var view = new FormListItemView({
            model: form
        });
        this.views.push(view);
        $('ul', this.options.parentEl).append(view.render().el);
    },
    initFormList: function(fromRemote, cb) {
        var that = this;
        $fh.forms.getForms({
            fromRemote: fromRemote
        }, function(err, formsModel) {
            if (err) {
                cb(err);
            } else {
                that.model = formsModel;
                cb(null, that);
            }
        });
    }
});
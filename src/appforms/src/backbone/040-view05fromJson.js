var FromJsonView = BaseView.extend({
    events: {
        'click button#convert': 'convert'
    },
    templates: {
        body: '<h1>Insert JSON</h1><textarea id="jsonBox" rows="30" cols="50"></textarea><button id="convert">Convert</button><div id="resultArea"></div>'
    },
    el: '#jsonPage',
    initialize: function() {
        _.bindAll(this, 'render');
    },
    show: function() {
        $(this.$el).show();
    },
    hide: function() {
        $(this.$el).hide();
    },
    render: function() {
        $(this.$el).html(this.templates.body);
        this.show();
    },
    convert: function() {
        var json = $('#jsonBox').val();
        var jsonData;
        try {
            jsonData = JSON.parse(json);
        } catch (e) {
            $fh.forms.log.d(e);
            throw 'Invalid JSON object';
        }
        var params = {
            formId: new Date().getTime(),
            rawMode: true,
            rawData: jsonData
        };
        var formView = new FormView({
            parentEl: $('#backbone #resultArea')
        });
        formView.loadForm(params, function(err) {
            formView.render();
        });
    }
});
;
if (typeof $fh == "undefined") {
    $fh = {};
}
if (!$fh.forms) {
    $fh.forms={};
}
$fh.forms.renderForm = function(params, cb) {
    var parentEl = params.container;
    var formId = params.formId;
    var fromRemote = params.fromRemote || false;
    var type = params.type || "backbone";
    var form = new FormView({
        parentEl: parentEl
    });
    form.loadForm(params, function() {
        if (type == "backbone") {
            cb(null, form);
        } else if (type == "html") {
            //TODO convert backbone view to html.
            cb(null, form);
        }

    });
}

$fh.forms.renderFormList = function(params, cb) {
    var fromRemote = params.fromRemote || false;
    var parentEl = params.parentEl;
    $fh.forms.getForms({
        fromRemote: fromRemote
    }, function(err, forms) {
        formListView = new FormListView({
            "model": forms,
            "parentEl": parentEl
        });
        formListView.render();
    });
};

$fh.forms.backbone={};
$fh.forms.backbone.FormView=FormView;
$fh.forms.backbone.FormListView=FormListView;
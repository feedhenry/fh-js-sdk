if (typeof $fh === 'undefined') {
  $fh = {};
}
if (!$fh.forms) {
  $fh.forms = {};
}
$fh.forms.renderForm = function (params, cb) {
  var parentEl = params.container;
  var formId = params.formId;
  var fromRemote = params.fromRemote || false;
  var type = params.type || 'backbone';
  var form = new FormView({ parentEl: parentEl });
  form.loadForm(params, function () {
    if (type === 'backbone') {
      cb(null, form);
    } else if (type === 'html') {
      //TODO convert backbone view to html.
      cb(null, form);
    }
  });
};
/**
 *
 * @param params Object {"formId":String,"rawMode":Boolean,"rawMode":Boolean}
 * no io being done so no need for callback
 */
$fh.forms.renderFormFromJSON = function (params) {
  if (!params){
    throw new Error('params cannot be empty');
  }
  if (!params.rawData) {
    throw new Error('raw json data must be passed in the params.rawData');
  }
  if (!params.container) {
    throw new Error('a container element must be passed in the params.container');
  }

  params.formId = new Date().getTime();
  params.rawMode = true;
  var formView = new FormView({ parentEl: params.container });
  formView.loadForm(params, function (err) {
    if (err) {
      console.error('error loading form for renderFormFromJSON ', err);
    }
    formView.render();
  });
};
$fh.forms.renderFormList = function (params, cb) {
  var fromRemote = params.fromRemote || false;
  var parentEl = params.parentEl;
  $fh.forms.getForms({ fromRemote: fromRemote }, function (err, forms) {
    formListView = new FormListView({
      'model': forms,
      'parentEl': parentEl
    });
    formListView.render();
  });
};
$fh.forms.backbone = {};
$fh.forms.backbone.FormView = FormView;
$fh.forms.backbone.ConfigView=ConfigView;
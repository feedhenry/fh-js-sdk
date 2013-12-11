appForm.models=(function(module){
  var Model=appForm.models.Model;

  function Theme(){
    Model.call(this,{
      "_type":"theme"
    });
  }

  appForm.utils.extend(Theme, Model);

  module.theme = new Theme();
  return module;
})(appForm.models||{});
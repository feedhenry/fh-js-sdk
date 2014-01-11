appForm.models=(function(module){
  var Model=appForm.models.Model;

  function Theme(){
    Model.call(this,{
      "_type":"theme",
      "_ludid": "theme_object"
    });
  }

  Theme.prototype.getCSS = function(){
    return this.get("css", "");
  }

  appForm.utils.extend(Theme, Model);

  module.theme = new Theme();
  return module;
})(appForm.models||{});
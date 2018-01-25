module.exports = {
  readCookieValue  : function (cookie_name) {
    if (typeof Titanium !== 'undefined'){
      return Titanium.App.Properties.getObject(cookie_name);
    }
    return null;
  },

  createCookie : function (cookie_name, cookie_value) {
    if (typeof Titanium !== 'undefined'){
      return Titanium.App.Properties.setObject(cookie_name, cookie_value);
    }
  }
};
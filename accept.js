var nodeapp = require("fh-nodeapp");
nodeapp.HostApp.init();
nodeapp.HostApp.serveApp({
  echo: function(params, callback) {
    return callback(null, {
      echo: params.msg,
      hardcoded: 'hardcodedmsg'
    });
  }
});
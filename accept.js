var nodeapp = require("fh-nodeapp");

console.log('Initing hostapp on port ' + process.env.FH_PORT);
nodeapp.HostApp.init();
nodeapp.HostApp.serveApp({
  echo: function(params, callback) {
    return callback(null, {
      echo: params.msg + '-' + process.env.FH_PORT,
      hardcoded: 'hardcodedmsg'
    });
  }
});
console.log('Inited hostapp on port ' + process.env.FH_PORT);
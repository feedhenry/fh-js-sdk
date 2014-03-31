module.exports = function(url) {
  var qmap = {};
  var i = url.split("?");
  if (i.length === 2) {
    var queryString = i[1];
    var pairs = queryString.split("&");
    qmap = {};
    for (var p = 0; p < pairs.length; p++) {
      var q = pairs[p];
      var qp = q.split("=");
      qmap[qp[0]] = qp[1];
    }
  }
  return qmap;
};
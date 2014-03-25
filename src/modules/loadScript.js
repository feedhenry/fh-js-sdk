module.exports = function (url, callback) {
  var script;
  var head = document.head || document.getElementsByTagName("head")[0] || document.documentElement;
  script = document.createElement("script");
  script.async = "async";
  script.src = url;
  script.type = "text/javascript";
  script.onload = script.onreadystatechange = function () {
    if (!script.readyState || /loaded|complete/.test(script.readyState)) {
      script.onload = script.onreadystatechange = null;
      if (head && script.parentNode) {
        head.removeChild(script);
      }
      script = undefined;
      if (callback && typeof callback === "function") {
        callback();
      }
    }
  };
  head.insertBefore(script, head.firstChild);
};

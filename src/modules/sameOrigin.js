module.exports = function(url) {
  var loc = window.location;
  // http://blog.stevenlevithan.com/archives/parseuri-split-url
  var uriParts = new RegExp("^(?:([^:/?#.]+):)?(?://)?(([^:/?#]*)(?::(\\d*))?)((/(?:[^?#](?![^?#/]*\\.[^?#/.]+(?:[\\?#]|$)))*/?)?([^?#/]*))?(?:\\?([^#]*))?(?:#(.*))?");

  var locParts = uriParts.exec(loc);
  var urlParts = uriParts.exec(url);

  return ((urlParts[1] == null || urlParts[1] === '') && // no protocol }
          (urlParts[3] == null || urlParts[3] === '') && // no domain   } - > relative url
          (urlParts[4] == null || urlParts[4] === ''))|| // no port       }
          (locParts[1] === urlParts[1] && // protocol matches }
          locParts[3] === urlParts[3] && // domain matches   }-> absolute url
          locParts[4] === urlParts[4]); // port matches      }
};

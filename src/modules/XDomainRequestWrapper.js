var XDomainRequestWrapper = function(xdr){
  this.xdr = xdr;
  this.isWrapper = true;
  this.readyState = 0;
  this.onreadystatechange = null;
  this.status = 0;
  this.statusText = "";
  this.responseText = "";
  var self = this;
  this.xdr.onload = function(){
      self.readyState = 4;
      self.status = 200;
      self.statusText = "";
      self.responseText = self.xdr.responseText;
      if(self.onreadystatechange){
          self.onreadystatechange();
      }
  };
  this.xdr.onerror = function(){
      if(self.onerror){
          self.onerror();
      }
      self.readyState = 4;
      self.status = 0;
      self.statusText = "";
      if(self.onreadystatechange){
          self.onreadystatechange();
      }
  };
  this.xdr.ontimeout = function(){
      self.readyState = 4;
      self.status = 408;
      self.statusText = "timeout";
      if(self.onreadystatechange){
          self.onreadystatechange();
      }
  };
};

XDomainRequestWrapper.prototype.open = function(method, url, asyn){
  this.xdr.open(method, url);
};

XDomainRequestWrapper.prototype.send = function(data){
  this.xdr.send(data);
};

XDomainRequestWrapper.prototype.abort = function(){
  this.xdr.abort();
};

XDomainRequestWrapper.prototype.setRequestHeader = function(n, v){
  //not supported by xdr
  //Good doc on limitations of XDomainRequest http://blogs.msdn.com/b/ieinternals/archive/2010/05/13/xdomainrequest-restrictions-limitations-and-workarounds.aspx
  //XDomainRequest doesn't allow setting custom request headers. But it is the only available option to do CORS requests in IE8 & 9. In IE10, they finally start to use standard XMLHttpRequest.
  //To support FH auth tokens in IE8&9, we have to find a different way of doing it.
};

XDomainRequestWrapper.prototype.getResponseHeader = function(n){
  //not supported by xdr
};

module.exports = XDomainRequestWrapper;

if (typeof Titanium === 'undefined'){
  if (typeof window === 'undefined'){
    window = { top : {}, location : { protocol : '', href : '' } };
  }
  if (typeof document === 'undefined'){
    document = { location : { href : '', search : '' } };
  }
  if (typeof navigator === 'undefined'){
    navigator = { userAgent : 'Titanium' };
  }
}

module.exports = {};
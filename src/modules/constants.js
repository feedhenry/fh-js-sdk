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
module.exports = {
  "boxprefix": "/box/srv/1.1/",
  "sdk_version": "BUILD_VERSION",
  "config_js": "fhconfig.json",
  "INIT_EVENT": "fhinit"
};

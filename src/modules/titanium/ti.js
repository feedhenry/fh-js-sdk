if (typeof Titanium !== 'undefined') {
  if (typeof window === 'undefined') {
    window = { top: {}, location: { protocol: '', href: '' } };
  }
  if (typeof document === 'undefined') {
    document = { location: { href: '', search: '' } };
  }
  if (typeof navigator === 'undefined') {
    navigator = { userAgent: 'Titanium' };
  }

  window.push = {
    register: function (onNotification, success, fail, config) {
      var push = require('AeroGearPush').init(config);
      push.registerDevice({
        extraOptions: {
          categories: config.categories,
          alias: config.alias
        },
        onReceive: function (event) {
          onNotification(event);
        },
        onTokenSuccess: function () {
          success();
        }
      });
    }
  };
}

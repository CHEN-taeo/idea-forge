App({
  globalData: {
    serverUrl: '',
  },
  onLaunch() {
    const config = require('./utils/config');
    this.globalData.serverUrl = config.SERVER_URL;
  },
});

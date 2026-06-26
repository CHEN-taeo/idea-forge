const brand = require('../../utils/brand');
const { fetchHealth, fetchAiStatus, SERVER_URL } = require('../../utils/api');
const { PROD_SERVER_URL } = require('../../utils/config');
const { loadSession } = require('../../utils/storage');

Page({
  data: {
    brand,
    serverOk: false,
    aiEnabled: false,
    checking: true,
    serverHint: '',
    serverUrl: SERVER_URL,
  },

  onLoad(options) {
    if (options.room) {
      wx.redirectTo({ url: `/pages/room-entry/room-entry?room=${options.room}` });
      return;
    }
    this.tryResumeRoom();
  },

  onShow() {
    this.checkServer();
    this.checkProdConfig();
  },

  checkProdConfig() {
    if (PROD_SERVER_URL) return;
    try {
      const { envVersion } = wx.getAccountInfoSync().miniProgram;
      if (envVersion === 'release' || envVersion === 'trial') {
        this.setData({
          serverHint: '发布前请在 config.prod.js 配置 HTTPS 后端域名',
        });
      }
    } catch {
      // ignore
    }
  },

  checkServer() {
    this.setData({ checking: true, serverHint: '' });
    fetchHealth()
      .then(() => fetchAiStatus())
      .then((s) => {
        this.setData({
          serverOk: true,
          aiEnabled: !!s.enabled,
          checking: false,
          serverHint: '',
        });
      })
      .catch((err) => {
        this.setData({
          serverOk: false,
          aiEnabled: false,
          checking: false,
          serverHint: (err && err.message) || '后端未启动',
        });
      });
  },

  tryResumeRoom() {
    const saved = loadSession();
    if (!saved || !saved.roomCode || !saved.playerName) return;
    wx.showModal({
      title: '恢复围炉',
      content: `继续加入房间 ${saved.roomCode}？`,
      confirmText: '继续',
      success: (res) => {
        if (res.confirm) {
          wx.navigateTo({
            url: `/pages/room/room?room=${saved.roomCode}&name=${encodeURIComponent(saved.playerName)}&playerId=${saved.playerId || ''}`,
          });
        }
      },
    });
  },

  tapRoom() {
    if (!this.data.serverOk) {
      wx.showModal({
        title: '后端未连接',
        content: `在项目根目录运行：\nnpm run server\n\n地址：${SERVER_URL}`,
        showCancel: false,
      });
      return;
    }
    wx.navigateTo({ url: '/pages/room-entry/room-entry' });
  },

  tapSpark() {
    wx.navigateTo({ url: '/pages/spark/spark' });
  },

  tapRoundtable() {
    if (!this.data.serverOk) {
      wx.showModal({
        title: '后端未连接',
        content: `名士围炉需要后端在线。\n\n开发：npm run server\n地址：${SERVER_URL}`,
        showCancel: false,
      });
      return;
    }
    wx.navigateTo({ url: '/pages/roundtable/roundtable' });
  },
});

const brand = require('../../utils/brand');
const { fetchHealth, fetchAiStatus } = require('../../utils/api');
const { loadSession } = require('../../utils/storage');

Page({
  data: {
    brand,
    serverOk: false,
    aiEnabled: false,
    checking: true,
  },

  onLoad(options) {
    if (options.room) {
      wx.redirectTo({ url: `/pages/join/join?room=${options.room}` });
      return;
    }
    this.tryResumeRoom();
  },

  onShow() {
    this.checkServer();
  },

  checkServer() {
    this.setData({ checking: true });
    fetchHealth()
      .then(() => fetchAiStatus())
      .then((s) => {
        this.setData({ serverOk: true, aiEnabled: !!s.enabled, checking: false });
      })
      .catch(() => {
        this.setData({ serverOk: false, aiEnabled: false, checking: false });
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

  tapCreate() {
    if (!this.data.serverOk) {
      wx.showToast({ title: '请先启动后端 npm run server', icon: 'none' });
      return;
    }
    wx.navigateTo({ url: '/pages/create/create' });
  },

  tapJoin() {
    if (!this.data.serverOk) {
      wx.showToast({ title: '请先启动后端 npm run server', icon: 'none' });
      return;
    }
    wx.navigateTo({ url: '/pages/join/join' });
  },

  tapSolo() {
    wx.navigateTo({ url: '/pages/solo/solo' });
  },

  tapRoundtable() {
    wx.navigateTo({ url: '/pages/roundtable/roundtable' });
  },
});

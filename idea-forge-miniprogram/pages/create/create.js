const brand = require('../../utils/brand');
const { getGameSocket } = require('../../utils/gameSocket');

Page({
  data: {
    brand,
    playerName: '',
    problemStatement: '',
    template: 'quick',
    submitting: false,
  },

  onUnload() {
    wx.hideLoading();
  },

  onNameInput(e) { this.setData({ playerName: e.detail.value }); },
  onProblemInput(e) { this.setData({ problemStatement: e.detail.value }); },

  setTemplate(e) {
    this.setData({ template: e.currentTarget.dataset.t });
  },

  async submit() {
    const playerName = this.data.playerName.trim();
    const problemStatement = this.data.problemStatement.trim();
    if (!playerName) {
      wx.showToast({ title: '请输入名字', icon: 'none' });
      return;
    }
    if (!problemStatement) {
      wx.showToast({ title: '请输入讨论主题', icon: 'none' });
      return;
    }
    if (this.data.submitting) return;

    this.setData({ submitting: true });
    wx.showLoading({ title: '创建中…', mask: true });

    const socket = getGameSocket();
    try {
      await socket.connect();
      const res = await socket.emitAsync('create_room', {
        playerName,
        problemStatement,
        template: this.data.template,
      });
      wx.hideLoading();
      this.setData({ submitting: false });
      wx.redirectTo({
        url: `/pages/room/room?room=${res.roomCode}&name=${encodeURIComponent(playerName)}&host=1&playerId=${res.playerId || ''}`,
      });
    } catch (err) {
      wx.hideLoading();
      this.setData({ submitting: false });
      wx.showModal({
        title: '创建失败',
        content: (err && err.message) || '请确认已运行 npm run server',
        showCancel: false,
      });
    }
  },
});

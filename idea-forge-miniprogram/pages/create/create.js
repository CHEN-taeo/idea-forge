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

  onNameInput(e) { this.setData({ playerName: e.detail.value }); },
  onProblemInput(e) { this.setData({ problemStatement: e.detail.value }); },

  setTemplate(e) {
    this.setData({ template: e.currentTarget.dataset.t });
  },

  submit() {
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
    wx.showLoading({ title: '创建中…' });

    const socket = getGameSocket();
    socket.disconnect();
    socket.connect()
      .then(() => {
        socket.emit('create_room', {
          playerName,
          problemStatement,
          template: this.data.template,
        }, (res) => {
          wx.hideLoading();
          this.setData({ submitting: false });
          if (!res || res.error) {
            wx.showToast({ title: (res && res.error) || '创建失败', icon: 'none' });
            return;
          }
          wx.redirectTo({
            url: `/pages/room/room?room=${res.roomCode}&name=${encodeURIComponent(playerName)}&host=1&playerId=${res.playerId || ''}`,
          });
        });
      })
      .catch((err) => {
        wx.hideLoading();
        this.setData({ submitting: false });
        wx.showToast({ title: err.message || '连接失败', icon: 'none' });
      });
  },
});

const brand = require('../../utils/brand');
const { getGameSocket } = require('../../utils/gameSocket');

Page({
  data: {
    brand,
    playerName: '',
    roomCode: '',
    submitting: false,
  },

  onUnload() {
    wx.hideLoading();
  },

  onLoad(options) {
    if (options.room) {
      this.setData({ roomCode: options.room.toUpperCase() });
    }
  },

  onNameInput(e) { this.setData({ playerName: e.detail.value }); },
  onRoomInput(e) {
    this.setData({ roomCode: e.detail.value.toUpperCase().replace(/[^A-Z0-9]/g, '') });
  },

  async submit() {
    const playerName = this.data.playerName.trim();
    const roomCode = this.data.roomCode.trim();
    if (!playerName) {
      wx.showToast({ title: '请输入名字', icon: 'none' });
      return;
    }
    if (!roomCode) {
      wx.showToast({ title: '请输入房间码', icon: 'none' });
      return;
    }
    if (this.data.submitting) return;

    this.setData({ submitting: true });
    wx.showLoading({ title: '加入中…', mask: true });

    const socket = getGameSocket();
    try {
      await socket.connect();
      const res = await socket.emitAsync('join_room', { playerName, roomCode });
      wx.hideLoading();
      this.setData({ submitting: false });
      wx.redirectTo({
        url: `/pages/room/room?room=${roomCode}&name=${encodeURIComponent(playerName)}&playerId=${res.playerId || ''}`,
      });
    } catch (err) {
      wx.hideLoading();
      this.setData({ submitting: false });
      wx.showModal({
        title: '加入失败',
        content: (err && err.message) || '请检查房间码与后端',
        showCancel: false,
      });
    }
  },
});

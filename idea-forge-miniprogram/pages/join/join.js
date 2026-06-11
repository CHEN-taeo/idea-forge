const brand = require('../../utils/brand');
const { getGameSocket } = require('../../utils/gameSocket');

Page({
  data: {
    brand,
    playerName: '',
    roomCode: '',
    submitting: false,
  },

  onLoad(options) {
    if (options.room) {
      this.setData({ roomCode: options.room.toUpperCase() });
    }
  },

  onNameInput(e) { this.setData({ playerName: e.detail.value }); },
  onRoomInput(e) { this.setData({ roomCode: e.detail.value.toUpperCase().replace(/[^A-Z0-9]/g, '') }); },

  submit() {
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
    wx.showLoading({ title: '加入中…' });

    const socket = getGameSocket();
    socket.disconnect();
    socket.connect()
      .then(() => {
        socket.emit('join_room', { playerName, roomCode }, (res) => {
          wx.hideLoading();
          this.setData({ submitting: false });
          if (!res || res.error) {
            wx.showToast({ title: (res && res.error) || '加入失败', icon: 'none' });
            return;
          }
          wx.redirectTo({
            url: `/pages/room/room?room=${roomCode}&name=${encodeURIComponent(playerName)}&playerId=${res.playerId || ''}`,
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

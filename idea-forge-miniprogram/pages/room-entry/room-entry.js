const brand = require('../../utils/brand');
const { getGameSocket } = require('../../utils/gameSocket');

function parseRoomFromScan(raw) {
  if (!raw) return '';
  const text = String(raw).trim();
  const m = text.match(/[?&]room=([A-Za-z0-9]+)/i) || text.match(/room[/=]([A-Za-z0-9]+)/i);
  if (m) return m[1].toUpperCase();
  const code = text.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  return code.length >= 4 && code.length <= 6 ? code : '';
}

Page({
  data: {
    brand,
    playerName: '',
    roomCode: '',
    problemStatement: '',
    template: 'quick',
    isJoining: false,
    submitLabel: brand.roomHostButton,
    submitting: false,
  },

  onUnload() {
    wx.hideLoading();
  },

  onLoad(options) {
    wx.setNavigationBarTitle({ title: brand.roomEntryTitle });
    if (options.room) {
      const roomCode = options.room.toUpperCase();
      this.setData({ roomCode, isJoining: true, submitLabel: brand.roomJoinButton });
    }
  },

  onNameInput(e) {
    this.setData({ playerName: e.detail.value });
  },

  onRoomInput(e) {
    const roomCode = e.detail.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const isJoining = roomCode.length > 0;
    this.setData({
      roomCode,
      isJoining,
      submitLabel: isJoining ? brand.roomJoinButton : brand.roomHostButton,
    });
  },

  onProblemInput(e) {
    this.setData({ problemStatement: e.detail.value });
  },

  setTemplate(e) {
    this.setData({ template: e.currentTarget.dataset.t });
  },

  scanCode() {
    wx.scanCode({
      onlyFromCamera: false,
      success: (res) => {
        const roomCode = parseRoomFromScan(res.result || res.path || '');
        if (!roomCode) {
          wx.showToast({ title: '未识别房间码', icon: 'none' });
          return;
        }
        this.setData({ roomCode, isJoining: true, submitLabel: brand.roomJoinButton });
      },
    });
  },

  async submit() {
    const playerName = this.data.playerName.trim();
    const roomCode = this.data.roomCode.trim();
    const isJoining = roomCode.length > 0;

    if (!playerName) {
      wx.showToast({ title: '请输入名字', icon: 'none' });
      return;
    }
    if (!isJoining && !this.data.problemStatement.trim()) {
      wx.showToast({ title: '请输入讨论主题', icon: 'none' });
      return;
    }
    if (this.data.submitting) return;

    this.setData({ submitting: true });
    wx.showLoading({ title: isJoining ? '加入中…' : '创建中…', mask: true });

    const socket = getGameSocket();
    try {
      await socket.connect();
      if (isJoining) {
        const res = await socket.emitAsync('join_room', { playerName, roomCode });
        wx.hideLoading();
        this.setData({ submitting: false });
        wx.redirectTo({
          url: `/pages/room/room?room=${roomCode}&name=${encodeURIComponent(playerName)}&playerId=${res.playerId || ''}`,
        });
      } else {
        const res = await socket.emitAsync('create_room', {
          playerName,
          problemStatement: this.data.problemStatement.trim(),
          template: this.data.template,
        });
        wx.hideLoading();
        this.setData({ submitting: false });
        wx.redirectTo({
          url: `/pages/room/room?room=${res.roomCode}&name=${encodeURIComponent(playerName)}&host=1&playerId=${res.playerId || ''}`,
        });
      }
    } catch (err) {
      wx.hideLoading();
      this.setData({ submitting: false });
      wx.showModal({
        title: isJoining ? '加入失败' : '创建失败',
        content: (err && err.message) || '请确认已运行 npm run server',
        showCancel: false,
      });
    }
  },
});

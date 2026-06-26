Page({
  onLoad(options) {
    const q = options.room ? `?room=${options.room}` : '';
    wx.redirectTo({ url: `/pages/room-entry/room-entry${q}` });
  },
});

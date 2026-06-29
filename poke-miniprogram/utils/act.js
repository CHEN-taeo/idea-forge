// 卡片操作：复制链接
const store = require('./store.js');

async function handle(page, e) {
  const { act, url } = e.currentTarget.dataset;

  if (act === 'copylink' && url) {
    wx.setClipboardData({ data: url, success: () => wx.showToast({ title: '链接已复制', icon: 'none' }) });
  }
}

module.exports = { handle };

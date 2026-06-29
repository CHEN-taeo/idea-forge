const store = require('../../utils/store.js');
const api = require('../../utils/api.js');
const act = require('../../utils/act.js');

Page({
  data: {
    loading: true,
    ready: false,
    item: null,
    missing: false,
    rawOpen: false,
    metaOpen: false,
    coverLoaded: false,
    shareId: '',
    statusBarHeight: 20
  },

  onLoad(options) {
    let statusBarHeight = 20;
    if (wx.getWindowInfo) {
      statusBarHeight = wx.getWindowInfo().statusBarHeight || 20;
    } else if (wx.getSystemInfoSync) {
      statusBarHeight = wx.getSystemInfoSync().statusBarHeight || 20;
    }
    this.setData({ statusBarHeight });
    this.load(options.id || '');
  },

  async load(id) {
    if (!id) {
      this.setData({ loading: false, missing: true });
      return;
    }

    this.setData({ loading: true, missing: false, ready: false, coverLoaded: false });
    const S = store.load();
    let raw = store.allItemsById(S, id);

    if (api.enabled()) {
      const remote = await api.item(id, S.uid);
      if (remote && remote.id) {
        store.cacheItems(S, [remote]);
        store.save(S);
        raw = remote;
      }
    }

    if (!raw) {
      this.setData({ loading: false, missing: true });
      return;
    }

    this.setData({
      loading: false,
      item: store.detailVM(raw),
      shareId: id
    });
    wx.nextTick(() => this.setData({ ready: true }));
  },

  onCoverLoad() {
    this.setData({ coverLoaded: true });
  },

  toggleRaw() {
    this.setData({ rawOpen: !this.data.rawOpen });
  },

  toggleMeta() {
    this.setData({ metaOpen: !this.data.metaOpen });
  },

  onCopyLink(e) {
    act.handle(this, e);
  },

  onCopyRaw() {
    const text = this.data.item && this.data.item.rawText;
    if (!text) return;
    wx.setClipboardData({ data: text, success: () => wx.showToast({ title: '原文已复制', icon: 'none' }) });
  },

  onShare() {
    const id = this.data.shareId;
    if (!id) return;
    wx.navigateTo({ url: '/pages/share/share?id=' + encodeURIComponent(id) });
  },

  onBack() {
    wx.navigateBack({ delta: 1, fail: () => wx.switchTab({ url: '/pages/today/today' }) });
  }
});

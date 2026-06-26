const store = require('../../utils/store.js');
const api = require('../../utils/api.js');

const INTEREST_OPTS = ['竞赛', '创业', '展览', '讲座', '专业相关', '机会嗅探'];

Page({
  data: { items: [], online: false, interestOpts: INTEREST_OPTS, interests: [] },

  onShow() { this.refresh(); },
  onPullDownRefresh() { this.refresh().then(() => wx.stopPullDownRefresh()); },

  async refresh() {
    const S = store.load();
    this.setData({ interests: S.interests || [] });
    const iq = store.interestQuery(S);
    const data = await api.me(S.uid, iq);
    const online = Array.isArray(data);
    if (online) {
      store.cacheItems(S, data); store.save(S);
      this.setData({ online, items: data.map(store.serverCardVM) });
    } else {
      const ids = Object.keys(S.eng).filter(id => S.eng[id].go || S.eng[id].buddy);
      const items = ids.map(id => store.allItemsById(S, id)).filter(Boolean).map(it => store.cardVM(S, it));
      this.setData({ online, items });
    }
  },

  toggleInterest(e) {
    const key = e.currentTarget.dataset.key;
    const S = store.load();
    const set = new Set(S.interests || []);
    if (set.has(key)) set.delete(key); else set.add(key);
    S.interests = [...set];
    store.save(S);
    this.setData({ interests: S.interests });
    if (this.data.online) this.refresh();
  },

  goInsider() { wx.navigateTo({ url: '/pages/insider/insider' }); },

  onAct(e) { return require('../../utils/act.js').handle(this, e); }
});

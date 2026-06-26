const store = require('../../utils/store.js');
const api = require('../../utils/api.js');

const FILTERS = ['全部', '讲座', '竞赛', '展览', '峰会', '活动', '机会'];

Page({
  data: {
    items: [], gapItems: [], online: false,
    filters: FILTERS, filterIndex: 0
  },

  onShow() { this.refresh(); },
  onPullDownRefresh() { this.refresh().then(() => wx.stopPullDownRefresh()); },

  onFilter(e) {
    this.setData({ filterIndex: Number(e.detail.value) }, () => this.refresh());
  },

  async refresh() {
    const S = store.load();
    const iq = store.interestQuery(S);
    const eventType = FILTERS[this.data.filterIndex];
    const extra = Object.assign({}, iq);
    if (eventType !== '全部') extra.eventType = eventType;

    const [radar, gap] = await Promise.all([
      api.radar(S.uid, extra),
      api.gap(S.uid, iq)
    ]);
    const online = Array.isArray(radar);
    if (online) {
      store.cacheItems(S, radar);
      store.cacheItems(S, gap);
      store.save(S);
      this.setData({
        online,
        items: radar.map(store.serverCardVM),
        gapItems: (gap || []).slice(0, 3).map(store.serverCardVM)
      });
    } else {
      this.setData({ online: false, items: [], gapItems: [] });
    }
  },

  onAct(e) { return require('../../utils/act.js').handle(this, e); }
});

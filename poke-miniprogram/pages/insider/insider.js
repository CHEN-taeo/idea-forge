const store = require('../../utils/store.js');
const api = require('../../utils/api.js');

const EVENT_TYPES = ['讲座', '竞赛', '展览', '峰会', '活动', '通知', '机会', '其他'];

Page({
  data: {
    items: [], online: false,
    showEdit: false,
    edit: { id: '', title: '', insiderNote: '', eventType: '讲座', eventIndex: 0 },
    eventTypes: EVENT_TYPES
  },

  onShow() { this.refresh(); },

  async refresh() {
    if (!api.enabled()) return this.setData({ online: false, items: [] });
    const S = store.load();
    const raw = await api.items();
    if (!Array.isArray(raw)) return this.setData({ online: false, items: [] });
    const iq = store.interestQuery(S);
    const enriched = await api.gap(S.uid, iq);
    const gapMap = {};
    (enriched || []).forEach(it => { if (it && it.id) gapMap[it.id] = it; });
    const items = raw.filter(it => it.cat !== '噪音').slice(0, 30).map(it => store.serverCardVM(gapMap[it.id] || it));
    store.cacheItems(S, raw);
    store.save(S);
    this.setData({ online: true, items });
  },

  openEdit(e) {
    const it = this.data.items.find(x => x.id === e.currentTarget.dataset.id);
    if (!it) return;
    const ei = EVENT_TYPES.indexOf(it.eventType || '其他');
    this.setData({
      showEdit: true,
      edit: {
        id: it.id, title: it.title,
        insiderNote: it.insiderNote || '',
        eventType: it.eventType || '其他',
        eventIndex: ei >= 0 ? ei : EVENT_TYPES.length - 1
      }
    });
  },

  onInsiderInput(e) { this.setData({ 'edit.insiderNote': e.detail.value }); },

  onEventType(e) {
    const i = Number(e.detail.value);
    this.setData({ 'edit.eventIndex': i, 'edit.eventType': EVENT_TYPES[i] });
  },

  async saveInsider() {
    const ed = this.data.edit;
    const S = store.load();
    const r = await api.insider(S.uid, ed.id, ed.insiderNote, ed.eventType);
    if (!r) return wx.showToast({ title: '保存失败', icon: 'none' });
    this.setData({ showEdit: false });
    wx.showToast({ title: '已保存', icon: 'success' });
    this.refresh();
  },

  closeEdit() { this.setData({ showEdit: false }); },
  noop() {}
});

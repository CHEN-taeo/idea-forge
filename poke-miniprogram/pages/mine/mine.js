const store = require('../../utils/store.js');
const api = require('../../utils/api.js');

const INTEREST_OPTS = ['竞赛', '创业', '展览', '讲座', '专业相关', '机会嗅探'];
const AI_INTEREST_OPTS = ['Agent', 'Cursor/IDE', '开源项目', '播客', '模型'];

Page({
  data: {
    heroData: {
      title: '我的',
      subtitle: '兴趣偏好，影响信息差排序'
    },
    online: false, interestOpts: INTEREST_OPTS, interests: [], aiInterestOpts: AI_INTEREST_OPTS, aiInterests: []
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 3 });
    }
    this.refresh();
  },
  onPullDownRefresh() { this.refresh().then(() => wx.stopPullDownRefresh()); },

  async refresh() {
    const S = store.load();
    this.setData({ interests: S.interests || [], aiInterests: S.aiInterests || [] });
    const health = await api.health();
    this.setData({ online: !!(health && health.ok) });
  },

  toggleInterest(e) {
    const key = e.currentTarget.dataset.key;
    const S = store.load();
    const set = new Set(S.interests || []);
    if (set.has(key)) set.delete(key); else set.add(key);
    S.interests = Array.from(set);
    store.save(S);
    this.setData({ interests: S.interests });
  },

  toggleAiInterest(e) {
    const key = e.currentTarget.dataset.key;
    const S = store.load();
    const set = new Set(S.aiInterests || []);
    if (set.has(key)) set.delete(key); else set.add(key);
    S.aiInterests = Array.from(set);
    store.save(S);
    this.setData({ aiInterests: S.aiInterests });
  },

  goInsider() { wx.navigateTo({ url: '/pages/insider/insider' }); },
  goForward() { wx.navigateTo({ url: '/pages/forward/forward' }); }
});

const store = require('../../utils/store.js');
const api = require('../../utils/api.js');
const motion = require('../../utils/motion.js');

Page({
  data: {
    heroData: {
      toolbar: true,
      showMark: true,
      title: '破壳',
      subtitle: '晨光里的校园通知栏',
      meta: '连接中…',
      metaOnline: false,
      actionMuted: '运营',
      actionPrimary: '导入'
    },
    dateLabel: '', heroMeta: '', normal: [], poke: [], online: false, statusText: '连接中…'
  },
  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 });
    }
    this.refresh();
  },
  onPullDownRefresh() { this.refresh().then(() => wx.stopPullDownRefresh()); },

  async refresh() {
    const S = store.load();
    const iq = store.interestQuery(S);
    const results = await Promise.all([
      api.feed(S.uid, iq),
      api.poke(S.uid, iq),
      api.health()
    ]);
    const feed = results[0];
    const poke = results[1];
    const health = results[2];
    const online = Array.isArray(feed);
    const llmOn = health && health.llm === 'on';
    let statusText = '离线示例';
    if (online) {
      statusText = llmOn ? 'DeepSeek · 实时整理' : '规则引擎 · 已连接';
    }

    let normal, pokeArr;
    if (online) {
      store.cacheItems(S, feed);
      if (Array.isArray(poke)) store.cacheItems(S, poke);
      store.save(S);
      normal = motion.withEnter(feed.map(store.serverCardVM));
      pokeArr = motion.withEnter((Array.isArray(poke) ? poke : []).map(it => store.serverCardVM(Object.assign({}, it, { poke: true }))));
    } else {
      const normalRaw = (S.days[store.todayStr()] || []);
      const p = S.pokeOfDay[store.todayStr()];
      normal = motion.withEnter(normalRaw.map(it => store.cardVM(S, it)));
      pokeArr = p ? motion.withEnter([store.cardVM(S, Object.assign({}, p, { poke: true }))]) : [];
    }

    const dateLabel = store.fmtDate();
    this.setData({
      dateLabel,
      heroMeta: dateLabel + ' · ' + statusText,
      heroData: {
        toolbar: true,
        showMark: true,
        title: '破壳',
        subtitle: '晨光里的校园通知栏',
        meta: dateLabel + ' · ' + statusText,
        metaOnline: online,
        actionMuted: '运营',
        actionPrimary: '导入'
      },
      online,
      statusText,
      normal,
      poke: pokeArr
    });
  },

  onAct(e) { return require('../../utils/act.js').handle(this, e); },
  onCardTap(e) { require('../../utils/cardNav.js').onCardTap(e); },
  onHeroPrimary() { this.goForward(); },
  onHeroMuted() { this.goOperator(); },
  goOperator() { wx.navigateTo({ url: '/pages/operator/operator' }); },
  goForward() { wx.navigateTo({ url: '/pages/forward/forward' }); },
  goRadar() { wx.switchTab({ url: '/pages/radar/radar' }); }
});

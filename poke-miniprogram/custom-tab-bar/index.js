Component({
  data: {
    selected: 0,
    list: [
      { pagePath: '/pages/today/today', text: '今天', icon: '今' },
      { pagePath: '/pages/radar/radar', text: '机会', icon: '机' },
      { pagePath: '/pages/ai-pulse/ai-pulse', text: 'AI脉动', icon: 'AI' },
      { pagePath: '/pages/mine/mine', text: '我的', icon: '我' }
    ]
  },
  methods: {
    switchTab(e) {
      const idx = Number(e.currentTarget.dataset.index);
      const item = this.data.list[idx];
      wx.switchTab({ url: item.pagePath });
      this.setData({ selected: idx });
    }
  }
});

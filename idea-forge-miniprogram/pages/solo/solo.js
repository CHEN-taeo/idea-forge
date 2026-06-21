const brand = require('../../utils/brand');
const { fetchSoloAngles, fetchSmartAction } = require('../../utils/api');

function nid() {
  return `s_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

Page({
  data: {
    brand,
    phase: 'setup',
    name: '',
    problem: '',
    angles: [],
    anglesLoading: false,
    anglesTitle: '',
    ideas: [],
    ideaText: '',
    canAddIdea: false,
    commitment: null,
    actionLoading: false,
  },

  onLoad(options) {
    if (options.problem) {
      try {
        const problem = decodeURIComponent(options.problem);
        if (problem) this.setData({ problem });
      } catch { /* ignore */ }
    }
  },

  onNameInput(e) { this.setData({ name: e.detail.value }); },
  onProblemInput(e) { this.setData({ problem: e.detail.value }); },
  onIdeaInput(e) {
    const ideaText = e.detail.value;
    this.setData({ ideaText, canAddIdea: !!ideaText.trim() });
  },

  startSolo() {
    const name = (this.data.name || '我').trim();
    const problem = this.data.problem.trim();
    if (!problem) {
      wx.showToast({ title: '请输入问题', icon: 'none' });
      return;
    }
    this.setData({ name, problem, phase: 'angles', anglesLoading: true, angles: [] });
    fetchSoloAngles(problem)
      .then(({ angles, mode }) => {
        const anglesTitle = mode === 'ai' ? `${brand.hostName}的 AI 教练` : '离线提示';
        this.setData({ angles, anglesTitle, anglesLoading: false });
      })
      .catch(() => {
        this.setData({
          angles: [
            '谁最痛苦？这个问题让谁夜不能寐？',
            '如果只有一周时间和零预算，你会怎么做？',
            '5 年后回看，你会后悔没做什么？',
          ],
          anglesTitle: '离线提示',
          anglesLoading: false,
        });
      });
  },

  toBrainstorm() {
    this.setData({ phase: 'brainstorm' });
  },

  addIdea() {
    const text = this.data.ideaText.trim();
    if (!text) return;
    const ideas = [...this.data.ideas, { id: nid(), text, votes: 0, selected: false }];
    this.setData({ ideas, ideaText: '', canAddIdea: false });
  },

  toCurate() {
    if (this.data.ideas.length < 3) {
      wx.showToast({ title: '至少写 3 条想法', icon: 'none' });
      return;
    }
    this.setData({ phase: 'curate' });
  },

  toggleVote(e) {
    const id = e.currentTarget.dataset.id;
    const ideas = this.data.ideas.map(i => {
      if (i.id !== id) return i;
      const selected = !i.selected;
      return { ...i, votes: selected ? 1 : 0, selected };
    });
    this.setData({ ideas });
  },

  toCommit() {
    const selected = this.data.ideas.filter(i => i.selected);
    if (!selected.length) {
      wx.showToast({ title: '请至少选 1 条', icon: 'none' });
      return;
    }
    this.setData({ phase: 'commit', actionLoading: true, commitment: null });
    const top = selected[0];
    fetchSmartAction(top.text, this.data.problem, this.data.name)
      .then(({ action }) => {
        this.setData({ commitment: { ideaText: top.text, action }, actionLoading: false });
      })
      .catch(() => {
        this.setData({
          commitment: {
            ideaText: top.text,
            action: `在 7 天内，针对「${top.text.slice(0, 20)}…」做一件最小验证动作。`,
          },
          actionLoading: false,
        });
      });
  },

  finish() {
    this.setData({ phase: 'finish' });
  },

  copyReport() {
    const { name, problem, angles, ideas, commitment, brand: b } = this.data;
    const date = new Date().toISOString().split('T')[0];
    const md = `# ${b.soloName} — ${name}\n> ${date}\n\n## 问题\n${problem}\n\n## 角度\n${angles.map(a => `- ${a}`).join('\n')}\n\n## 想法\n${ideas.map((i, n) => `${n + 1}. ${i.text}${i.selected ? ' ★' : ''}`).join('\n')}\n\n## 承诺\n${commitment.action}`;
    wx.setClipboardData({ data: md });
  },

  backHome() {
    wx.navigateBack();
  },
});

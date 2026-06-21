const brand = require('../../utils/brand');
const { PERSONAS } = require('../../data/personas');
const { PRESETS, STARTER_PROMPTS } = require('../../data/game-data');
const {
  fetchAiStatus,
  fetchPersonaReply,
  fetchPersonaDispatch,
  fetchRoundtableSummary,
  fetchSmartAction,
} = require('../../utils/api');

function nid() {
  return `rt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

function buildPersonaList(selectedIds) {
  return PERSONAS.map(p => ({
    ...p,
    selected: selectedIds.indexOf(p.id) >= 0,
  }));
}

function buildPresets() {
  return PRESETS.map(p => ({
    ...p,
    idsStr: p.ids.join(','),
  }));
}

Page({
  data: {
    brand,
    phase: 'setup',
    userName: '',
    topic: '',
    personaList: buildPersonaList([]),
    selectedIds: [],
    presets: buildPresets(),
    starters: STARTER_PROMPTS,
    messages: [],
    input: '',
    canSend: false,
    busy: false,
    thinkingName: '',
    aiOnline: false,
    dispatchNote: '',
    summary: null,
    smartAction: '',
    scrollInto: '',
  },

  onLoad(options) {
    wx.setNavigationBarTitle({ title: brand.roundtableName });
    if (options && options.topic) {
      try {
        const topic = decodeURIComponent(options.topic);
        if (topic) this.setData({ topic });
      } catch { /* ignore */ }
    }
    fetchAiStatus().then(s => this.setData({ aiOnline: !!s.enabled }));
    this.history = [];
  },

  onNameInput(e) { this.setData({ userName: e.detail.value }); },
  onTopicInput(e) { this.setData({ topic: e.detail.value }); },
  onInput(e) {
    const input = e.detail.value;
    this.setData({ input, canSend: !!input.trim() && !this.data.busy });
  },

  syncPersonas(selectedIds) {
    this.setData({
      selectedIds,
      personaList: buildPersonaList(selectedIds),
    });
  },

  togglePersona(e) {
    const id = e.currentTarget.dataset.id;
    let selectedIds = [...this.data.selectedIds];
    if (selectedIds.indexOf(id) >= 0) {
      selectedIds = selectedIds.filter(x => x !== id);
    } else if (selectedIds.length < 3) {
      selectedIds.push(id);
    } else {
      wx.showToast({ title: '最多选 3 位嘉宾', icon: 'none' });
      return;
    }
    this.syncPersonas(selectedIds);
  },

  applyPreset(e) {
    const ids = e.currentTarget.dataset.ids.split(',').filter(Boolean);
    this.syncPersonas(ids);
  },

  startTable() {
    const userName = (this.data.userName || '我').trim();
    const topic = this.data.topic.trim();
    if (!topic) {
      wx.showToast({ title: '请输入话题', icon: 'none' });
      return;
    }
    if (!this.data.selectedIds.length) {
      wx.showToast({ title: '请至少选 1 位嘉宾', icon: 'none' });
      return;
    }
    this.history = [];
    this.setData({ userName, topic, phase: 'chat', messages: [] });
  },

  useStarter(e) {
    this.sendMessage(e.currentTarget.dataset.text);
  },

  sendMessage(textOverride) {
    const raw = (textOverride || this.data.input).trim();
    if (!raw || this.data.busy) return;
    const userName = this.data.userName;
    const msg = { id: nid(), speakerId: 'me', name: userName, text: raw, mine: true };
    const messages = [...this.data.messages, msg];
    this.history = [...(this.history || []), { speaker: userName, text: raw }];
    this.setData({ messages, input: '', canSend: false, busy: true, scrollInto: msg.id });
    this.runRound(raw);
  },

  onSend() {
    this.sendMessage();
  },

  runAnotherRound() {
    if (this.data.busy) return;
    this.setData({ busy: true, canSend: false });
    this.runRound('');
  },

  runRound(userMessage = '') {
    const { selectedIds, topic, userName } = this.data;
    fetchPersonaDispatch(selectedIds, topic, (this.history || []).slice(-8), userMessage, userName)
      .then(({ order, note }) => {
        if (note) this.setData({ dispatchNote: note });
        const ids = order.length ? order : selectedIds.slice(0, Math.min(2, selectedIds.length));
        return this.speakSequence(ids, userMessage, userName);
      })
      .catch(() => {
        this.setData({ dispatchNote: '调度失败 · 离线兜底' });
        return this.speakSequence(selectedIds.slice(0, 1), userMessage, userName);
      })
      .finally(() => {
        this.setData({ busy: false, thinkingName: '', canSend: !!this.data.input.trim() });
      });
  },

  speakSequence(ids, userMessage, userName) {
    let last = userMessage.trim() ? userName : ((this.history || []).slice(-1)[0] || {}).speaker || userName;
    let messages = this.data.messages;
    return ids.reduce((p, pid) => p.then(() => {
      const pObj = PERSONAS.find(x => x.id === pid);
      if (!pObj) return Promise.resolve();
      this.setData({ thinkingName: pObj.name });
      return fetchPersonaReply(pid, this.data.topic, (this.history || []).slice(-8), userMessage, userName, last)
        .then(({ reply }) => {
          const msg = { id: nid(), speakerId: pid, name: pObj.name, text: reply, mine: false };
          this.history = [...(this.history || []), { speaker: pObj.name, text: reply }];
          messages = [...messages, msg];
          this.setData({ messages, scrollInto: msg.id });
          last = pObj.name;
        })
        .catch(() => {
          const msg = { id: nid(), speakerId: pid, name: pObj.name, text: '（一时语塞，没接上话）', mine: false };
          messages = [...messages, msg];
          this.setData({ messages, scrollInto: msg.id });
          last = pObj.name;
        });
    }), Promise.resolve());
  },

  endRoundtable() {
    if (this.data.messages.length < 2) {
      wx.showToast({ title: '先聊几句再总结', icon: 'none' });
      return;
    }
    wx.showLoading({ title: '围炉总结中…' });
    const history = (this.history || []).map(h => ({ speaker: h.speaker, text: h.text }));
    fetchRoundtableSummary(this.data.topic, history, this.data.selectedIds)
      .then((summary) => {
        wx.hideLoading();
        this.setData({ phase: 'summary', summary });
        const topIdea = summary.nextStep || summary.consensus || this.data.topic;
        return fetchSmartAction(topIdea, this.data.topic, this.data.userName);
      })
      .then((res) => {
        if (res && res.action) this.setData({ smartAction: res.action });
      })
      .catch(() => {
        wx.hideLoading();
        this.setData({
          phase: 'summary',
          summary: {
            consensus: '讨论已有初步轮廓',
            disagreement: '（离线模式）',
            gap: '（离线模式）',
            nextStep: this.data.topic,
          },
        });
      });
  },

  copyExport() {
    const { userName, topic, messages, summary, brand: b, smartAction } = this.data;
    const date = new Date().toISOString().split('T')[0];
    let md = `# ${b.roundtableName} — ${userName}\n> ${date} · ${b.productName}\n\n## 话题\n${topic}\n\n`;
    messages.forEach(m => { md += `\n**${m.name}：** ${m.text}\n`; });
    if (summary) {
      md += `\n## 共识\n${summary.consensus}\n\n## 分歧\n${summary.disagreement}\n\n## 下一步\n${summary.nextStep}\n`;
    }
    if (smartAction) md += `\n## 建议行动\n${smartAction}\n`;
    wx.setClipboardData({ data: md });
  },

  backHome() {
    wx.navigateBack();
  },
});

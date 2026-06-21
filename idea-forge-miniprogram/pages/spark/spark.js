const brand = require('../../utils/brand');
const { loadNotes, addNote, deleteNote, formatSparkTime } = require('../../utils/sparkNotes');
const { buildWeeklyReview } = require('../../utils/sparkReview');

const AUTOSAVE_MS = 1500;

Page({
  data: {
    brand,
    tab: 'capture',
    text: '',
    notes: [],
    showList: false,
    savedHint: false,
    focusInput: true,
    review: {
      empty: true,
      weekLabel: '',
      headline: '',
      hint: '',
      themes: [],
      connections: [],
      notes: [],
      openQuestion: '',
    },
  },

  _saveTimer: null,

  onShow() {
    wx.setNavigationBarTitle({ title: brand.sparkName });
    this.refresh();
  },

  onUnload() {
    if (this._saveTimer) clearTimeout(this._saveTimer);
  },

  refresh() {
    const notes = loadNotes().map((n) => ({
      ...n,
      timeLabel: formatSparkTime(n.createdAt),
    }));
    const review = buildWeeklyReview(loadNotes());
    this.setData({ notes, review });
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ tab });
    if (tab === 'review') this.refresh();
  },

  onInput(e) {
    const text = e.detail.value;
    this.setData({ text });
    if (this._saveTimer) clearTimeout(this._saveTimer);
    const trimmed = text.trim();
    if (!trimmed) return;
    this._saveTimer = setTimeout(() => this.commitNote(trimmed, true), AUTOSAVE_MS);
  },

  onBlurSave() {
    if (this._saveTimer) clearTimeout(this._saveTimer);
    const text = this.data.text.trim();
    if (text) this.commitNote(text, true);
  },

  commitNote(text, silent) {
    addNote(text);
    this.setData({ text: '', focusInput: true });
    this.refresh();
    if (!silent) {
      wx.showToast({ title: brand.sparkSavedToast, icon: 'success', duration: 1200 });
    } else {
      this.setData({ savedHint: true });
      setTimeout(() => this.setData({ savedHint: false }), 1200);
    }
  },

  toggleList() {
    this.setData({ showList: !this.data.showList });
  },

  removeNote(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: brand.sparkDeleteTitle,
      content: '删除后无法恢复',
      confirmColor: '#9b2226',
      success: (res) => {
        if (res.confirm) {
          deleteNote(id);
          this.refresh();
        }
      },
    });
  },

  toRoundtable(e) {
    const text = e.currentTarget.dataset.text;
    if (!text) return;
    wx.navigateTo({
      url: `/pages/roundtable/roundtable?topic=${encodeURIComponent(text)}`,
    });
  },
});

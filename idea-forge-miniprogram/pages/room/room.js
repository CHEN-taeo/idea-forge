const brand = require('../../utils/brand');
const { INSPIRATION_CARDS, ROLE_LABELS } = require('../../data/game-data');
const { getGameSocket } = require('../../utils/gameSocket');
const { saveSession, clearSession } = require('../../utils/storage');

function buildGuessCards(ideasR1, playersArray, playerId) {
  return ideasR1
    .filter(idea => idea.authorId !== playerId)
    .map(idea => ({
      ...idea,
      candidates: playersArray.filter(pl => pl.id !== playerId),
    }));
}

Page({
  data: {
    brand,
    roomCode: '',
    playerName: '',
    playerId: '',
    isHost: false,
    gameState: null,
    ready: false,
    connectionStatus: 'connecting',
    ideaText: '',
    selectedCard: null,
    inspirationCards: INSPIRATION_CARDS,
    playersArray: [],
    playerCount: 0,
    ideasR1: [],
    guessCards: [],
    myRole: '',
    phaseLabel: '',
    flatIdeas: [],
  },

  onLoad(options) {
    const roomCode = (options.room || '').toUpperCase();
    const playerName = decodeURIComponent(options.name || '');
    const playerId = options.playerId || '';
    const isHost = options.host === '1';
    this.setData({ roomCode, playerName, playerId, isHost });
    saveSession({ roomCode, playerName, playerId });

    const socket = getGameSocket();
    this._socket = socket;
    this._onState = (state) => this.applyState(state);
    socket.on('game_state', this._onState);

    socket.connect()
      .then(() => {
        this.setData({ connectionStatus: 'connected' });
        socket.emit('rejoin_room', { roomCode, playerName, playerId }, (res) => {
          if (res && res.error && !isHost) {
            wx.showToast({ title: res.error, icon: 'none' });
          } else if (res && res.playerId) {
            this.setData({ playerId: res.playerId });
          }
        });
      })
      .catch((err) => {
        this.setData({ connectionStatus: 'error' });
        wx.showToast({ title: err.message || '连接失败', icon: 'none' });
      });
  },

  onUnload() {
    if (this._socket && this._onState) {
      this._socket.off('game_state', this._onState);
    }
  },

  applyState(state) {
    if (!state) return;
    const roleLabels = ROLE_LABELS;
    const playersArray = Object.values(state.players || {});
    const playerId = this.data.playerId;
    const me = state.players[playerId] || playersArray.find(p => p.name === this.data.playerName);
    const pid = me ? me.id : playerId;
    const isHost = state.hostId === pid;
    const ready = me ? !!me.ready : false;
    const myRole = me && me.role ? (roleLabels[me.role] || me.role) : '';
    const ideasR1 = (state.ideas || []).filter(i => i.round === 1);
    const guessCards = buildGuessCards(ideasR1, playersArray, pid);
    const phaseLabels = {
      lobby: '等候室',
      r1_submit: '第一轮 · 构思',
      r1_guess: '第一轮 · 竞猜',
      r2_adapt: '第二轮 · 改编',
      r3_challenge: '第三轮 · 挑战',
      commitment: '认领行动',
      finished: '已结束',
    };

    this.setData({
      gameState: state,
      playerId: pid,
      isHost,
      ready,
      playersArray,
      playerCount: playersArray.length,
      ideasR1,
      guessCards,
      myRole,
      phaseLabel: phaseLabels[state.phase] || state.phase,
      flatIdeas: state.ideas || [],
    });
    saveSession({ roomCode: state.roomCode, playerName: this.data.playerName, playerId: pid });
  },

  copyRoomCode() {
    wx.setClipboardData({ data: this.data.roomCode });
  },

  toggleReady() {
    this._socket.emit('player_ready', { ready: !this.data.ready });
  },

  startGame() {
    this._socket.emit('start_game');
  },

  onIdeaInput(e) { this.setData({ ideaText: e.detail.value }); },

  pickCard(e) {
    this.setData({ selectedCard: Number(e.currentTarget.dataset.i) });
  },

  submitIdea() {
    const { ideaText, selectedCard } = this.data;
    if (!ideaText.trim() || selectedCard === null) {
      wx.showToast({ title: '请写想法并选灵感卡', icon: 'none' });
      return;
    }
    this._socket.emit('submit_idea', { text: ideaText.trim(), inspirationCard: selectedCard });
    this.setData({ ideaText: '', selectedCard: null });
    wx.showToast({ title: '已提交', icon: 'success' });
  },

  pickGuess(e) {
    const { ideaid, authorid } = e.currentTarget.dataset;
    this._socket.emit('guess_author', { ideaId: ideaid, guessedAuthorId: authorid });
    wx.showToast({ title: '已猜', icon: 'success' });
  },

  nextPhase() {
    this._socket.emit('next_phase');
  },

  leaveRoom() {
    clearSession();
    wx.navigateBack({ delta: 10 });
  },
});

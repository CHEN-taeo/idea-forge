const brand = require('../../utils/brand');
const { INSPIRATION_CARDS, ROLE_LABELS } = require('../../data/game-data');
const { getGameSocket } = require('../../utils/gameSocket');
const { saveSession, clearSession } = require('../../utils/storage');
const { fetchSmartAction } = require('../../utils/api');
const { DUE_DAY_OPTIONS, formatSmartAction, validateSmartCommitment } = require('../../utils/smartCommitment');

function buildGuessCards(ideasR1, playersArray, playerId) {
  return ideasR1
    .filter(idea => idea.authorId !== playerId)
    .map(idea => ({
      ...idea,
      candidates: playersArray.filter(pl => pl.id !== playerId),
    }));
}

function topAliveIdeas(ideas, n = 5) {
  return [...ideas]
    .filter(i => i.alive)
    .sort((a, b) => b.votes - a.votes)
    .slice(0, n);
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
    connectionError: '',
    ideaText: '',
    selectedCard: null,
    inspirationCards: INSPIRATION_CARDS,
    playersArray: [],
    playerCount: 0,
    ideasR1: [],
    guessCards: [],
    myRole: '',
    myRoleKey: '',
    phaseLabel: '',
    flatIdeas: [],
    // R2
    r2TopIdeas: [],
    adaptText: '',
    selectedAdaptId: '',
    myAdaptation: null,
    pendingEndorse: [],
    // R3
    aliveIdeas: [],
    challengingId: '',
    challengeReason: '',
    myChallenged: [],
    defensesToVote: [],
    defendId: '',
    defendText: '',
    defendAccept: false,
    r3Tab: 'ideas',
    // Commitment
    topIdeas: [],
    commitments: [],
    myCommitted: false,
    selectedCommitIdeaId: '',
    smartWhat: '',
    dueDays: 14,
    dueDayOptions: DUE_DAY_OPTIONS,
    previewAction: '',
    commitSubmitting: false,
    aiLoading: false,
    // Timer
    timerDisplay: '',
    timerUrgent: false,
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

    this._timerTick = () => this.updateTimer();
    this._timerInterval = setInterval(this._timerTick, 1000);

    this._joinRoom(roomCode, playerName, playerId, isHost);
  },

  async _joinRoom(roomCode, playerName, playerId, isHost) {
    const socket = this._socket;
    try {
      await socket.connect();
      this.setData({ connectionStatus: 'connected', connectionError: '' });
      const res = await socket.emitAsync('rejoin_room', { roomCode, playerName, playerId }, 10000);
      if (res && res.playerId) {
        this.setData({ playerId: res.playerId });
      }
    } catch (err) {
      const msg = err.message || '连接失败';
      this.setData({ connectionStatus: 'error', connectionError: msg });
      if (!isHost) {
        wx.showModal({ title: '无法进入房间', content: msg, showCancel: false });
      }
    }
  },

  onUnload() {
    if (this._timerInterval) clearInterval(this._timerInterval);
    if (this._socket && this._onState) {
      this._socket.off('game_state', this._onState);
    }
  },

  updateTimer() {
    const { gameState } = this.data;
    if (!gameState || !gameState.timerEnd) {
      if (this.data.timerDisplay) this.setData({ timerDisplay: '', timerUrgent: false });
      return;
    }
    const rem = Math.max(0, Math.ceil((gameState.timerEnd - Date.now()) / 1000));
    const m = String(Math.floor(rem / 60)).padStart(2, '0');
    const s = String(rem % 60).padStart(2, '0');
    const urgent = rem > 0 && rem <= 10;
    if (urgent && rem <= 5 && this._lastVibrateSec !== rem) {
      this._lastVibrateSec = rem;
      wx.vibrateShort({ type: 'light' });
    }
    if (!urgent) this._lastVibrateSec = null;
    this.setData({ timerDisplay: `${m}:${s}`, timerUrgent: urgent });
  },

  applyState(state) {
    if (!state) return;
    const playersArray = Object.values(state.players || {});
    const playerId = this.data.playerId;
    const me = state.players[playerId] || playersArray.find(p => p.name === this.data.playerName);
    const pid = me ? me.id : playerId;
    const isHost = state.hostId === pid;
    const ready = me ? !!me.ready : false;
    const myRoleKey = me && me.role ? me.role : '';
    const myRole = myRoleKey ? (ROLE_LABELS[myRoleKey] || myRoleKey) : '';
    const ideas = state.ideas || [];
    const ideasR1 = ideas.filter(i => i.round === 1);
    const guessCards = buildGuessCards(ideasR1, playersArray, pid);
    const aliveIdeas = ideas.filter(i => i.alive);
    const r2TopIdeas = topAliveIdeas(ideas.filter(i => i.round === 1), 5);
    const r2Ideas = ideas.filter(i => i.round === 2);
    const myAdaptation = r2Ideas.find(i => i.authorId === pid) || null;
    const pendingEndorse = r2Ideas.filter(i => i.originalAuthorId === pid && !i.endorsed);
    const myChallenged = aliveIdeas.filter(i => i.authorId === pid && i.challengedBy && !i.defenseResponse);
    const defensesToVote = aliveIdeas.filter(
      i => i.defenseResponse &&
        i.authorId !== pid &&
        i.challengedBy !== pid &&
        !(i.defenseVotes && i.defenseVotes[pid])
    );
    const commitments = state.commitments || [];
    const myCommitted = commitments.some(
      c => c.playerName && me && c.playerName.toLowerCase() === me.name.toLowerCase()
    );
    const topIdeas = topAliveIdeas(ideas, 5);
    const claimedIds = commitments.map(c => c.ideaId).filter(Boolean);

    let r3Tab = this.data.r3Tab;
    if (myChallenged.length > 0) r3Tab = 'defend';
    else if (defensesToVote.length > 0) r3Tab = 'vote';

    const phaseLabels = {
      lobby: '等候室',
      r1_submit: '第一轮 · 构思',
      r1_guess: '第一轮 · 竞猜',
      r2_adapt: '第二轮 · 改编',
      r3_challenge: '第三轮 · 挑战',
      commitment: '认领行动',
      finished: '已结束',
    };

    const smartWhat = this.data.smartWhat;
    const dueDays = this.data.dueDays;
    const previewAction = smartWhat.trim()
      ? formatSmartAction(me ? me.name : this.data.playerName, smartWhat, dueDays)
      : '';

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
      myRoleKey,
      phaseLabel: phaseLabels[state.phase] || state.phase,
      flatIdeas: ideas,
      aliveIdeas,
      r2TopIdeas,
      myAdaptation,
      pendingEndorse,
      myChallenged,
      defensesToVote,
      r3Tab,
      topIdeas: topIdeas.map(i => ({ ...i, claimed: claimedIds.indexOf(i.id) >= 0 })),
      commitments,
      myCommitted,
      previewAction,
      connectionStatus: 'connected',
    });
    saveSession({ roomCode: state.roomCode, playerName: this.data.playerName, playerId: pid });
    this.updateTimer();
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

  selectAdapt(e) {
    this.setData({ selectedAdaptId: e.currentTarget.dataset.id });
  },

  onAdaptInput(e) {
    this.setData({ adaptText: e.detail.value });
  },

  submitAdapt() {
    const { selectedAdaptId, adaptText, myAdaptation } = this.data;
    if (myAdaptation) {
      wx.showToast({ title: '你已提交改造', icon: 'none' });
      return;
    }
    if (!selectedAdaptId || !adaptText.trim()) {
      wx.showToast({ title: '选择构想并填写改造', icon: 'none' });
      return;
    }
    this._socket.emit('adapt_idea', { originalIdeaId: selectedAdaptId, adaptedText: adaptText.trim() });
    this.setData({ adaptText: '', selectedAdaptId: '' });
    wx.showToast({ title: '改造已提交', icon: 'success' });
  },

  endorseAdapt(e) {
    this._socket.emit('endorse_adaptation', { ideaId: e.currentTarget.dataset.id });
    wx.showToast({ title: '已认可', icon: 'success' });
  },

  setR3Tab(e) {
    this.setData({ r3Tab: e.currentTarget.dataset.tab });
  },

  startChallenge(e) {
    this.setData({ challengingId: e.currentTarget.dataset.id, challengeReason: '' });
  },

  onChallengeInput(e) {
    this.setData({ challengeReason: e.detail.value });
  },

  submitChallenge() {
    const { challengingId, challengeReason } = this.data;
    if (!challengeReason.trim()) {
      wx.showToast({ title: '请填写质询理由', icon: 'none' });
      return;
    }
    this._socket.emit('challenge_idea', { ideaId: challengingId, reason: challengeReason.trim() });
    this.setData({ challengingId: '', challengeReason: '' });
    wx.showToast({ title: '已质询', icon: 'success' });
  },

  startDefend(e) {
    this.setData({ defendId: e.currentTarget.dataset.id, defendText: '', defendAccept: false });
  },

  onDefendInput(e) {
    this.setData({ defendText: e.detail.value });
  },

  toggleDefendAccept() {
    this.setData({ defendAccept: !this.data.defendAccept });
  },

  submitDefend() {
    const { defendId, defendText, defendAccept } = this.data;
    if (!defendAccept && !defendText.trim()) {
      wx.showToast({ title: '请填写辩护或选择接受', icon: 'none' });
      return;
    }
    this._socket.emit('defend_idea', {
      ideaId: defendId,
      response: defendAccept ? '接受质询，将改进此构想' : defendText.trim(),
      accepted: defendAccept,
    });
    this.setData({ defendId: '', defendText: '' });
    wx.showToast({ title: '已提交辩护', icon: 'success' });
  },

  voteDefense(e) {
    const { id, ok } = e.currentTarget.dataset;
    this._socket.emit('vote_on_defense', { ideaId: id, successful: ok === '1' });
    wx.showToast({ title: '已表决', icon: 'success' });
  },

  selectCommitIdea(e) {
    if (this.data.myCommitted) return;
    const id = e.currentTarget.dataset.id;
    if (e.currentTarget.dataset.claimed === '1') return;
    this.setData({
      selectedCommitIdeaId: this.data.selectedCommitIdeaId === id ? '' : id,
      smartWhat: '',
    });
  },

  onSmartWhatInput(e) {
    const smartWhat = e.detail.value;
    const { playerName, dueDays } = this.data;
    const previewAction = smartWhat.trim()
      ? formatSmartAction(playerName, smartWhat, dueDays)
      : '';
    this.setData({ smartWhat, previewAction });
  },

  pickDueDays(e) {
    const dueDays = Number(e.currentTarget.dataset.d);
    const { smartWhat, playerName } = this.data;
    const previewAction = smartWhat.trim()
      ? formatSmartAction(playerName, smartWhat, dueDays)
      : '';
    this.setData({ dueDays, previewAction });
  },

  async aiSuggestCommit() {
    const { selectedCommitIdeaId, topIdeas, gameState, playerName } = this.data;
    const idea = topIdeas.find(i => i.id === selectedCommitIdeaId);
    if (!idea || this.data.aiLoading) return;
    this.setData({ aiLoading: true });
    try {
      const res = await fetchSmartAction(idea.text, gameState.problemStatement, playerName);
      const what = (res.action || '').replace(/^[^：]+将在 \d+ 天内：/, '') || res.action;
      this.setData({
        smartWhat: what,
        previewAction: formatSmartAction(playerName, what, this.data.dueDays),
        aiLoading: false,
      });
    } catch (err) {
      this.setData({ aiLoading: false });
      wx.showToast({ title: 'AI 暂不可用', icon: 'none' });
    }
  },

  async submitCommitment() {
    const { smartWhat, dueDays, selectedCommitIdeaId, playerName, myCommitted, commitSubmitting } = this.data;
    if (myCommitted || commitSubmitting) return;
    const err = validateSmartCommitment(smartWhat, dueDays);
    if (err) {
      wx.showToast({ title: err, icon: 'none' });
      return;
    }
    if (!selectedCommitIdeaId) {
      wx.showToast({ title: '请先选择构想', icon: 'none' });
      return;
    }
    const action = formatSmartAction(playerName, smartWhat, dueDays);
    this.setData({ commitSubmitting: true });
    try {
      await this._socket.emitAsync('create_commitment', {
        action,
        smartWhat: smartWhat.trim(),
        ideaId: selectedCommitIdeaId,
        dueDays,
      }, 15000);
      this.setData({
        commitSubmitting: false,
        selectedCommitIdeaId: '',
        smartWhat: '',
        previewAction: '',
      });
      wx.showToast({ title: '承诺已认领', icon: 'success' });
    } catch (e) {
      this.setData({ commitSubmitting: false });
      wx.showToast({ title: e.message || '提交失败', icon: 'none' });
    }
  },

  nextPhase() {
    this._socket.emit('next_phase');
  },

  retryConnect() {
    const { roomCode, playerName, playerId, isHost } = this.data;
    this.setData({ connectionStatus: 'connecting', connectionError: '' });
    this._joinRoom(roomCode, playerName, playerId, isHost);
  },

  leaveRoom() {
    clearSession();
    wx.navigateBack({ delta: 10 });
  },
});

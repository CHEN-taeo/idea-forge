import { createServer } from 'http';
import { Server } from 'socket.io';
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { exec } from 'child_process';
import { getDb, saveSession, getSession, createCommitment, getCommitmentByToken, getCommitmentsBySession, getAllSessions, saveActiveRoom, loadActiveRoom, loadAllActiveRooms, deleteActiveRoom, logEvent, recordEchoOpen, getMetrics } from './db.js';
import { generatePrompts, expandIdea, analyzeRound, generateSmartAction, soloChallengeIdea, personaReply, pickPersonaResponders, summarizeRoundtable, getStatus } from './ai.js';
import { validateSmartCommitment, formatSmartAction } from './smartCommitment.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = process.env.PORT || 3001;
const IS_PRODUCTION = process.env.NODE_ENV === 'production' || !process.env.NODE_ENV;

// ---------------------------------------------------------------------------
// Express for static files + REST API
// ---------------------------------------------------------------------------
const app = express();
app.use(express.json());

// In production, serve the built Vite frontend
const distPath = join(__dirname, 'dist');
app.use(express.static(distPath));

// ---------------------------------------------------------------------------
// REST API: Echo URL for commitment reminders
// ---------------------------------------------------------------------------
app.get('/echo/:token', (req, res) => {
  const commitment = getCommitmentByToken(req.params.token);
  if (!commitment) {
    return res.status(404).send(`
      <!DOCTYPE html><html lang="zh"><head><meta charset="utf-8"><title>链接失效</title>
      <meta name="viewport" content="width=device-width,initial-scale=1">
      <style>body{font-family:system-ui,'PingFang SC','Microsoft YaHei',sans-serif;background:#1a130c;color:#fff5e6;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:20px;text-align:center} h1{font-size:1.5rem;font-weight:300;color:rgba(255,240,215,.6)} p{color:rgba(255,240,215,.3)}</style>
      </head><body><div><h1>⏳ 此链接已失效</h1><p>承诺记录可能已被删除或链接过期。</p></div></body></html>`);
  }

  recordEchoOpen(req.params.token);

  res.send(`
    <!DOCTYPE html><html lang="zh"><head><meta charset="utf-8"><title>承诺回声 · Idea Forge</title>
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <style>
      *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
      body{font-family:system-ui,'PingFang SC','Microsoft YaHei',sans-serif;background:#1a130c;color:#fff5e6;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:40px 20px}
      .card{max-width:480px;width:100%;background:rgba(255,235,200,.04);border:1px solid rgba(251,191,36,.12);border-radius:16px;padding:32px 28px}
      .badge{display:inline-block;background:rgba(251,191,36,.12);border:1px solid rgba(251,191,36,.2);border-radius:8px;padding:4px 12px;font-size:.72rem;color:rgba(252,211,77,.8);margin-bottom:20px}
      h1{font-size:1.1rem;font-weight:400;color:rgba(255,240,215,.7);margin-bottom:24px;line-height:1.5}
      .field{margin-bottom:14px}
      .label{font-size:.65rem;text-transform:uppercase;letter-spacing:.1em;color:rgba(255,240,215,.25);margin-bottom:4px}
      .value{font-size:.88rem;color:rgba(255,245,230,.75);line-height:1.5}
      .idea-text{background:rgba(255,235,200,.04);border-radius:8px;padding:12px 14px;font-size:.8rem;color:rgba(255,240,215,.5);margin-bottom:20px;line-height:1.5}
      .footer{font-size:.7rem;color:rgba(255,240,215,.2);margin-top:24px;padding-top:16px;border-top:1px solid rgba(255,235,200,.06)}
      .echo-badge{display:flex;align-items:center;gap:6px;font-size:.75rem;color:rgba(107,203,119,.7);margin-top:20px;padding:10px 14px;background:rgba(107,203,119,.06);border-radius:10px}
    </style></head><body>
    <div class="card">
      <div class="badge">🔔 承诺回声</div>
      <h1><strong>${escapeHtml(commitment.player_name)}</strong>，${commitment.due_days}天前你做出了一项承诺。</h1>
      ${commitment.idea_text ? `<div class="idea-text">💡 ${escapeHtml(commitment.idea_text)}</div>` : ''}
      <div class="field"><div class="label">你承诺要做</div><div class="value">${escapeHtml(commitment.action)}</div></div>
      <div class="field"><div class="label">截止日期</div><div class="value">${commitment.due_date}</div></div>
      <div class="echo-badge">✅ 承诺已于 ${commitment.created_at} 记录在案</div>
      <div class="footer">Idea Forge · 让每次讨论产生有人负责的决策</div>
    </div></body></html>`);
});

// API: Get session summary
app.get('/api/session/:roomCode', (req, res) => {
  const session = getSession(req.params.roomCode);
  if (!session) return res.status(404).json({ error: '会话不存在' });
  res.json(session);
});

// API: List recent sessions
app.get('/api/sessions', (req, res) => {
  const sessions = getAllSessions();
  res.json(sessions);
});

// API: P0 metrics — commitment conversion, echo opens, template breakdown
app.get('/api/metrics', (req, res) => {
  res.json(getMetrics());
});

// API: Get commitments for a session
app.get('/api/commitments/:sessionId', (req, res) => {
  const commitments = getCommitmentsBySession(req.params.sessionId);
  res.json(commitments);
});

// API: AI (used by 独思 solo mode + commitment SMART suggestions)
app.get('/api/ai/status', (_req, res) => {
  res.json(getStatus());
});

app.post('/api/ai/solo/angles', async (req, res) => {
  const { problem } = req.body || {};
  if (!problem?.trim()) return res.status(400).json({ error: '请填写要思考的问题' });
  try {
    const angles = await generatePrompts(problem.trim());
    res.json({ angles, mode: getStatus().mode });
  } catch (err) {
    res.status(500).json({ error: err.message || '生成失败' });
  }
});

app.post('/api/ai/smart-action', async (req, res) => {
  const { ideaText, problem, playerName } = req.body || {};
  if (!ideaText?.trim() || !problem?.trim()) {
    return res.status(400).json({ error: '缺少构想或问题描述' });
  }
  try {
    const action = await generateSmartAction(ideaText.trim(), problem.trim(), playerName?.trim());
    res.json({ action, mode: getStatus().mode });
  } catch (err) {
    res.status(500).json({ error: err.message || '生成失败' });
  }
});

app.post('/api/ai/solo/challenge', async (req, res) => {
  const { ideaText, problem } = req.body || {};
  if (!ideaText?.trim() || !problem?.trim()) {
    return res.status(400).json({ error: '缺少构想或问题描述' });
  }
  try {
    const question = await soloChallengeIdea(ideaText.trim(), problem.trim());
    res.json({ question, mode: getStatus().mode });
  } catch (err) {
    res.status(500).json({ error: err.message || '生成失败' });
  }
});

app.post('/api/ai/persona/reply', async (req, res) => {
  const { personaId, topic, history, userMessage, userName, lastSpeaker } = req.body || {};
  if (!personaId?.trim() || !topic?.trim()) {
    return res.status(400).json({ error: '缺少人物或主题' });
  }
  try {
    const { reply, mode } = await personaReply(
      personaId.trim(),
      topic.trim(),
      Array.isArray(history) ? history : [],
      typeof userMessage === 'string' ? userMessage : '',
      userName?.trim() || '我',
      typeof lastSpeaker === 'string' ? lastSpeaker : ''
    );
    res.json({ reply, mode });
  } catch (err) {
    res.status(500).json({ error: err.message || '生成失败' });
  }
});

app.post('/api/ai/persona/dispatch', async (req, res) => {
  const { personaIds, topic, history, userMessage, userName, targetPersonaId } = req.body || {};
  if (!Array.isArray(personaIds) || !personaIds.length || !topic?.trim()) {
    return res.status(400).json({ error: '缺少嘉宾或主题' });
  }
  try {
    const { order, mode, note } = await pickPersonaResponders(
      personaIds.map(String),
      topic.trim(),
      Array.isArray(history) ? history : [],
      typeof userMessage === 'string' ? userMessage : '',
      userName?.trim() || '我',
      targetPersonaId?.trim() || ''
    );
    res.json({ order, mode, note: note || '' });
  } catch (err) {
    res.status(500).json({ error: err.message || '调度失败' });
  }
});

app.post('/api/ai/persona/summarize', async (req, res) => {
  const { topic, history, personaIds } = req.body || {};
  if (!topic?.trim()) return res.status(400).json({ error: '缺少主题' });
  try {
    const summary = await summarizeRoundtable(
      topic.trim(),
      Array.isArray(history) ? history : [],
      Array.isArray(personaIds) ? personaIds.map(String) : []
    );
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: err.message || '总结失败' });
  }
});

// SPA fallback: serve index.html for non-API/non-static routes
app.use((req, res, next) => {
  if (req.path.startsWith('/api/') || req.path.startsWith('/echo/') || req.path.startsWith('/socket.io/')) {
    return next();
  }
  // Only serve index.html for GET requests that would 404
  if (req.method === 'GET') {
    res.sendFile(join(distPath, 'index.html'));
  } else {
    next();
  }
});

// ---------------------------------------------------------------------------
// HTTP + Socket.IO server
// ---------------------------------------------------------------------------
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: true,
    methods: ['GET', 'POST']
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling']
});

// ---------------------------------------------------------------------------
// In-memory game storage
// ---------------------------------------------------------------------------
const rooms = new Map();

const ROLES = [
  'Visionary', 'Pragmatist', 'Contrarian', 'Connector',
  'Analyst', 'Storyteller', 'Builder', 'Wildcard'
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function generatePlayerId() {
  return `p_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
}

/** WeChat mini program client may not pass a callback as final arg (ack id as number). */
function parseSocketPayload(...args) {
  const last = args[args.length - 1];
  if (typeof last === 'function') {
    return { data: args.length >= 2 ? args[0] : {}, ack: last };
  }
  return { data: args[0] && typeof args[0] === 'object' ? args[0] : {}, ack: null };
}

function socketReply(socket, event, ack, payload) {
  if (typeof ack === 'function') {
    ack(payload);
    return;
  }
  socket.emit(`${event}:ack`, payload);
}

function generateIdeaId() {
  return `idea_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
}

function generateChallengeId() {
  return `ch_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
}

function getRoomBySocket(io, socket) {
  for (const [roomCode, gameState] of rooms) {
    if (gameState.players[socket.playerId]) {
      return { roomCode, gameState };
    }
  }
  return null;
}

function sanitizeGameStateForPlayer(gameState, playerId) {
  return {
    ...gameState,
    currentPlayerId: playerId
  };
}

const FULL_PHASE_ORDER = ['lobby', 'r1_submit', 'r1_guess', 'r2_adapt', 'r3_challenge', 'commitment', 'finished'];
const QUICK_PHASE_ORDER = ['lobby', 'r1_submit', 'r1_guess', 'r2_adapt', 'commitment', 'finished'];

function getPhaseOrder(gameState) {
  return gameState.template === 'quick' ? QUICK_PHASE_ORDER : FULL_PHASE_ORDER;
}

function getOrLoadRoom(roomCode) {
  const normalized = roomCode.toUpperCase().trim();
  let gameState = rooms.get(normalized);
  if (!gameState) {
    gameState = loadActiveRoom(normalized);
    if (gameState) rooms.set(normalized, gameState);
  }
  return { normalized, gameState };
}

function persistRoom(roomCode, gameState) {
  try {
    if (gameState.phase === 'finished') {
      deleteActiveRoom(roomCode);
    } else {
      saveActiveRoom(gameState);
    }
  } catch (err) {
    console.error('[DB] Failed to persist room:', err.message);
  }
}

function broadcastGameState(io, roomCode, gameState) {
  const room = rooms.get(roomCode);
  if (!room) return;
  persistRoom(roomCode, gameState);
  for (const playerId of Object.keys(room.players)) {
    const playerSocket = findSocketByPlayerId(io, playerId);
    if (playerSocket) {
      playerSocket.emit('game_state', sanitizeGameStateForPlayer(room, playerId));
    }
  }
}

function attachPlayerSocket(socket, roomCode, player) {
  socket.playerId = player.id;
  socket.playerName = player.name;
  socket.roomCode = roomCode;
  player.connected = true;
  socket.join(roomCode);
}

function findSocketByPlayerId(io, playerId) {
  for (const [, socket] of io.sockets.sockets) {
    if (socket.playerId === playerId) return socket;
  }
  return null;
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ---------------------------------------------------------------------------
// Socket.IO handlers
// ---------------------------------------------------------------------------
io.on('connection', (socket) => {
  console.log(`[Socket] Connected: ${socket.id}`);

  socket.on('create_room', (...raw) => {
    const { data: { playerName, problemStatement, template }, ack } = parseSocketPayload(...raw);
    try {
      if (!playerName || !playerName.trim()) return socketReply(socket, 'create_room', ack, { error: '请输入你的名字' });
      if (!problemStatement || !problemStatement.trim()) return socketReply(socket, 'create_room', ack, { error: '请填写讨论问题' });

      const sessionTemplate = template === 'quick' ? 'quick' : 'full';
      const roomCode = generateRoomCode();
      const playerId = generatePlayerId();
      attachPlayerSocket(socket, roomCode, { id: playerId, name: playerName.trim() });

      const player = {
        id: playerId, name: playerName.trim(), score: 0,
        role: null, inspirationCards: [], goldCards: [], ready: false, connected: true
      };

      const gameState = {
        phase: 'lobby', round: 1,
        players: { [playerId]: player },
        ideas: [], challenges: [], commitments: [],
        currentPlayerId: null, roomCode, hostId: playerId,
        problemStatement: problemStatement.trim(), timerEnd: null,
        template: sessionTemplate
      };

      rooms.set(roomCode, gameState);
      persistRoom(roomCode, gameState);
      console.log(`[Room] Created: ${roomCode} by ${playerName} (${sessionTemplate})`);
      socketReply(socket, 'create_room', ack, { success: true, roomCode, playerId });
      socket.emit('game_state', sanitizeGameStateForPlayer(gameState, playerId));
    } catch (err) {
      console.error('[Error] create_room:', err);
      socketReply(socket, 'create_room', ack, { error: '创建房间失败' });
    }
  });

  socket.on('join_room', (...raw) => {
    const { data: { playerName, roomCode }, ack } = parseSocketPayload(...raw);
    try {
      if (!playerName || !playerName.trim()) return socketReply(socket, 'join_room', ack, { error: '请输入你的名字' });
      if (!roomCode) return socketReply(socket, 'join_room', ack, { error: '请输入房间码' });

      const { normalized: normalizedCode, gameState } = getOrLoadRoom(roomCode);
      if (!gameState) return socketReply(socket, 'join_room', ack, { error: '房间不存在，请检查房间码' });

      const trimmedName = playerName.trim();
      const existingPlayer = Object.values(gameState.players).find(
        p => p.name.toLowerCase() === trimmedName.toLowerCase()
      );

      // Rejoin in-progress session with same name
      if (gameState.phase !== 'lobby' && existingPlayer) {
        attachPlayerSocket(socket, normalizedCode, existingPlayer);
        console.log(`[Room] ${trimmedName} rejoined ${normalizedCode}`);
        socketReply(socket, 'join_room', ack, { success: true, playerId: existingPlayer.id, rejoined: true });
        socket.emit('game_state', sanitizeGameStateForPlayer(gameState, existingPlayer.id));
        broadcastGameState(io, normalizedCode, gameState);
        return;
      }

      if (gameState.phase !== 'lobby') return socketReply(socket, 'join_room', ack, { error: '游戏已开始，请用相同名字重新加入' });
      if (existingPlayer) return socketReply(socket, 'join_room', ack, { error: '该名称已被使用' });

      if (Object.keys(gameState.players).length >= 8) {
        return socketReply(socket, 'join_room', ack, { error: '房间已满（最多8人）' });
      }

      const playerId = generatePlayerId();
      const player = {
        id: playerId, name: trimmedName, score: 0,
        role: null, inspirationCards: [], goldCards: [], ready: false, connected: true
      };

      gameState.players[playerId] = player;
      attachPlayerSocket(socket, normalizedCode, player);
      console.log(`[Room] ${trimmedName} joined ${normalizedCode}`);
      socketReply(socket, 'join_room', ack, { success: true, playerId });
      broadcastGameState(io, normalizedCode, gameState);
    } catch (err) {
      console.error('[Error] join_room:', err);
      socketReply(socket, 'join_room', ack, { error: '加入房间失败' });
    }
  });

  socket.on('rejoin_room', (...raw) => {
    const { data: { playerName, roomCode, playerId }, ack } = parseSocketPayload(...raw);
    try {
      if (!playerName || !playerName.trim()) return socketReply(socket, 'rejoin_room', ack, { error: '请输入你的名字' });
      if (!roomCode) return socketReply(socket, 'rejoin_room', ack, { error: '请输入房间码' });

      const { normalized: normalizedCode, gameState } = getOrLoadRoom(roomCode);
      if (!gameState) return socketReply(socket, 'rejoin_room', ack, { error: '房间不存在或已结束' });

      let player = playerId ? gameState.players[playerId] : null;
      if (!player) {
        player = Object.values(gameState.players).find(
          p => p.name.toLowerCase() === playerName.trim().toLowerCase()
        );
      }
      if (!player) return socketReply(socket, 'rejoin_room', ack, { error: '未找到该玩家，请重新加入房间' });
      if (player.name.toLowerCase() !== playerName.trim().toLowerCase()) {
        return socketReply(socket, 'rejoin_room', ack, { error: '名称与房间记录不匹配' });
      }

      attachPlayerSocket(socket, normalizedCode, player);
      console.log(`[Room] ${player.name} reconnected to ${normalizedCode}`);
      socketReply(socket, 'rejoin_room', ack, { success: true, playerId: player.id });
      socket.emit('game_state', sanitizeGameStateForPlayer(gameState, player.id));
      broadcastGameState(io, normalizedCode, gameState);
    } catch (err) {
      console.error('[Error] rejoin_room:', err);
      socketReply(socket, 'rejoin_room', ack, { error: '重新连接失败' });
    }
  });

  socket.on('player_ready', ({ ready }) => {
    const result = getRoomBySocket(io, socket);
    if (!result) return;
    const { roomCode, gameState } = result;
    if (gameState.players[socket.playerId]) {
      gameState.players[socket.playerId].ready = ready;
      broadcastGameState(io, roomCode, gameState);
    }
  });

  socket.on('start_game', () => {
    const result = getRoomBySocket(io, socket);
    if (!result) return;
    const { roomCode, gameState } = result;

    if (gameState.hostId !== socket.playerId) {
      return socket.emit('error', { message: '只有房主可以开始游戏' });
    }

    const playerIds = Object.keys(gameState.players);
    if (playerIds.length < 1) {
      return socket.emit('error', { message: '至少需要 1 名玩家才能开始' });
    }

    const allReady = playerIds.every(id => gameState.players[id].ready);
    if (!allReady) {
      return socket.emit('error', { message: '所有玩家都需要点击准备' });
    }

    playerIds.forEach((pid, index) => {
      gameState.players[pid].role = ROLES[index % ROLES.length];
      gameState.players[pid].inspirationCards = Array.from(
        { length: 3 }, () => Math.floor(Math.random() * 20)
      );
    });

    gameState.phase = 'r1_submit';
    gameState.round = 1;
    gameState.timerEnd = Date.now() + 300000;
    console.log(`[Room ${roomCode}] Game started!`);
    logEvent('session_started', {
      roomCode,
      meta: {
        template: gameState.template || 'full',
        playerCount: playerIds.length
      }
    });
    broadcastGameState(io, roomCode, gameState);
  });

  socket.on('submit_idea', ({ text, inspirationCard }) => {
    const result = getRoomBySocket(io, socket);
    if (!result) return;
    const { roomCode, gameState } = result;

    if (gameState.phase !== 'r1_submit') {
      return socket.emit('error', { message: '当前不在构思提交阶段' });
    }
    if (!text || !text.trim()) {
      return socket.emit('error', { message: '请输入构思内容' });
    }

    const idea = {
      id: generateIdeaId(), text: text.trim(),
      authorId: socket.playerId, authorName: gameState.players[socket.playerId]?.name,
      round: gameState.round, votes: 0, guesses: {}, alive: true,
      inspirationCard: inspirationCard ?? undefined
    };

    gameState.ideas.push(idea);
    gameState.players[socket.playerId].score += 1;
    broadcastGameState(io, roomCode, gameState);
  });

  socket.on('vote_idea', ({ ideaId }) => {
    const result = getRoomBySocket(io, socket);
    if (!result) return;
    const { roomCode, gameState } = result;

    if (gameState.phase !== 'r1_guess') {
      return socket.emit('error', { message: '当前不在投票阶段' });
    }

    const idea = gameState.ideas.find(i => i.id === ideaId);
    if (idea) {
      idea.votes += 1;
      gameState.players[socket.playerId].score += 1;
      broadcastGameState(io, roomCode, gameState);
    }
  });

  socket.on('guess_author', ({ ideaId, guessedAuthorId }) => {
    const result = getRoomBySocket(io, socket);
    if (!result) return;
    const { roomCode, gameState } = result;

    if (gameState.phase !== 'r1_guess') {
      return socket.emit('error', { message: '当前不在竞猜阶段' });
    }

    const idea = gameState.ideas.find(i => i.id === ideaId);
    if (idea) {
      idea.guesses[socket.playerId] = guessedAuthorId;
      if (guessedAuthorId === idea.authorId) {
        gameState.players[socket.playerId].score += 2;
      }
      broadcastGameState(io, roomCode, gameState);
    }
  });

  socket.on('adapt_idea', ({ originalIdeaId, adaptedText }) => {
    const result = getRoomBySocket(io, socket);
    if (!result) return;
    const { roomCode, gameState } = result;

    if (gameState.phase !== 'r2_adapt') {
      return socket.emit('error', { message: '当前不在改造阶段' });
    }
    if (!adaptedText || !adaptedText.trim()) {
      return socket.emit('error', { message: '请输入改造内容' });
    }

    const original = gameState.ideas.find(i => i.id === originalIdeaId);
    if (!original) return socket.emit('error', { message: '未找到原始构思' });

    const newIdea = {
      id: generateIdeaId(), text: adaptedText.trim(),
      authorId: socket.playerId, authorName: gameState.players[socket.playerId]?.name,
      round: gameState.round, votes: 0, guesses: {}, alive: true,
      adaptedFrom: originalIdeaId, originalAuthorId: original.authorId, endorsed: false
    };

    gameState.ideas.push(newIdea);
    gameState.players[socket.playerId].score += 1;
    broadcastGameState(io, roomCode, gameState);
  });

  socket.on('endorse_adaptation', ({ ideaId }) => {
    const result = getRoomBySocket(io, socket);
    if (!result) return;
    const { roomCode, gameState } = result;

    if (gameState.phase !== 'r2_adapt') {
      return socket.emit('error', { message: '当前不在改造阶段' });
    }

    const idea = gameState.ideas.find(i => i.id === ideaId);
    if (!idea) return socket.emit('error', { message: '未找到构思' });
    if (idea.originalAuthorId !== socket.playerId) {
      return socket.emit('error', { message: '只有原作者可以认可' });
    }

    idea.endorsed = true;
    gameState.players[socket.playerId].score += 2;
    gameState.players[idea.authorId].score += 2;
    broadcastGameState(io, roomCode, gameState);
  });

  socket.on('challenge_idea', ({ ideaId, reason }) => {
    const result = getRoomBySocket(io, socket);
    if (!result) return;
    const { roomCode, gameState } = result;

    if (gameState.phase !== 'r3_challenge') {
      return socket.emit('error', { message: '当前不在挑战阶段' });
    }
    if (!reason || !reason.trim()) {
      return socket.emit('error', { message: '请输入质询理由' });
    }

    const idea = gameState.ideas.find(i => i.id === ideaId);
    if (!idea) return socket.emit('error', { message: '未找到构思' });
    if (idea.authorId === socket.playerId) {
      return socket.emit('error', { message: '不能质询自己的构思' });
    }

    const challenge = {
      id: generateChallengeId(), ideaId,
      challengerId: socket.playerId,
      challengerName: gameState.players[socket.playerId]?.name || '',
      reason: reason.trim(), timestamp: Date.now()
    };

    gameState.challenges.push(challenge);
    idea.challengedBy = socket.playerId;
    broadcastGameState(io, roomCode, gameState);
  });

  socket.on('defend_idea', ({ ideaId, response, accepted }) => {
    const result = getRoomBySocket(io, socket);
    if (!result) return;
    const { roomCode, gameState } = result;

    if (gameState.phase !== 'r3_challenge') {
      return socket.emit('error', { message: '当前不在挑战阶段' });
    }

    const idea = gameState.ideas.find(i => i.id === ideaId);
    if (!idea) return socket.emit('error', { message: '未找到构思' });
    if (idea.authorId !== socket.playerId) {
      return socket.emit('error', { message: '只有构思作者可以答辩' });
    }

    idea.defenseResponse = response?.trim() || '';
    idea.defenseAccepted = !!accepted;
    idea.defenseVotes = {};

    if (!accepted) {
      gameState.players[socket.playerId].score += 2;
    }

    broadcastGameState(io, roomCode, gameState);
  });

  socket.on('vote_on_defense', ({ ideaId, successful }) => {
    const result = getRoomBySocket(io, socket);
    if (!result) return;
    const { roomCode, gameState } = result;

    if (gameState.phase !== 'r3_challenge') {
      return socket.emit('error', { message: '当前不在挑战阶段' });
    }

    const idea = gameState.ideas.find(i => i.id === ideaId);
    if (!idea) return socket.emit('error', { message: '未找到构思' });
    if (idea.authorId === socket.playerId) {
      return socket.emit('error', { message: '不能对自己的答辩投票' });
    }

    const challenger = gameState.challenges.find(c => c.ideaId === ideaId);
    if (challenger && challenger.challengerId === socket.playerId) {
      return socket.emit('error', { message: '质询者不能对答辩投票' });
    }

    idea.defenseVotes = idea.defenseVotes || {};
    idea.defenseVotes[socket.playerId] = successful;

    if (successful && idea.challengedBy && gameState.players[idea.challengedBy]) {
      gameState.players[idea.challengedBy].score += 1;
    }

    broadcastGameState(io, roomCode, gameState);
  });

  // -----------------------------------------------------------------------
  // COMMITMENT CEREMONY — persist commitments on game finish
  // -----------------------------------------------------------------------
  socket.on('create_commitment', (...raw) => {
    const { data: { action, ideaId, dueDays, smartWhat }, ack } = parseSocketPayload(...raw);
    const result = getRoomBySocket(io, socket);
    if (!result) return socketReply(socket, 'create_commitment', ack, { error: '未加入房间' });

    const { roomCode, gameState } = result;
    const playerId = socket.playerId;
    const playerName = gameState.players[playerId]?.name || socket.playerName || '';

    const what = (smartWhat || action || '').trim();
    const days = dueDays || 14;
    const smartErr = validateSmartCommitment(what, days);
    if (smartErr) {
      return socketReply(socket, 'create_commitment', ack, { error: smartErr });
    }

    if (gameState.phase !== 'commitment' && gameState.phase !== 'finished') {
      return socketReply(socket, 'create_commitment', ack, { error: '当前不在承诺阶段' });
    }

    const finalAction = action && action.trim().length >= 8 ? action.trim() : formatSmartAction(playerName, what, days);
    const idea = ideaId ? gameState.ideas.find(i => i.id === ideaId) : null;
    const sessionId = saveSession(gameState);

    const commitment = createCommitment({
      playerName,
      action: finalAction,
      ideaId: ideaId || null,
      ideaText: idea?.text || null,
      sessionId,
      dueDays: days,
      template: gameState.template || 'full'
    });

    const commitmentRecord = {
      id: commitment.id,
      playerName,
      action: finalAction,
      ideaId: ideaId || null,
      echoUrl: commitment.echoUrl,
      dueDate: commitment.dueDate,
      dueDays: days,
      createdAt: Date.now()
    };

    if (!gameState.commitments) gameState.commitments = [];
    gameState.commitments.push(commitmentRecord);

    io.to(roomCode).emit('new_commitment', commitmentRecord);

    logEvent('commitment_created', {
      roomCode,
      sessionId,
      playerName,
      meta: {
        template: gameState.template || 'full',
        dueDays: days,
        ideaId: ideaId || null
      }
    });

    console.log(`[Room ${roomCode}] Commitment from ${playerName}: ${finalAction.substring(0, 40)}...`);
    broadcastGameState(io, roomCode, gameState);
    socketReply(socket, 'create_commitment', ack, { success: true, ...commitment });
  });

  // -----------------------------------------------------------------------
  // NEXT PHASE
  // -----------------------------------------------------------------------
  socket.on('next_phase', () => {
    const result = getRoomBySocket(io, socket);
    if (!result) return;
    const { roomCode, gameState } = result;

    const phaseOrder = getPhaseOrder(gameState);
    const currentIndex = phaseOrder.indexOf(gameState.phase);
    const next = phaseOrder[currentIndex + 1] || 'finished';

    gameState.phase = next;
    gameState.timerEnd = (next === 'finished' || next === 'commitment') ? null : (Date.now() + 300000);

    if (next === 'commitment') {
      logEvent('phase_entered', {
        roomCode,
        meta: {
          phase: 'commitment',
          playerCount: Object.keys(gameState.players).length,
          template: gameState.template || 'full'
        }
      });
    }

    // R2: underdog gold card
    if (next === 'r2_adapt') {
      const players = Object.values(gameState.players);
      if (players.length > 0) {
        const minScore = Math.min(...players.map(p => p.score));
        const underdogs = players.filter(p => p.score === minScore);
        const underdog = underdogs[Math.floor(Math.random() * underdogs.length)];
        underdog.goldCards.push('underdog');
      }
    }

    // Auto-save session when game finishes
    if (next === 'finished') {
      try {
        const sessionId = saveSession(gameState);
        console.log(`[Room ${roomCode}] Session auto-saved: ${sessionId}`);
      } catch (err) {
        console.error('[DB] Failed to auto-save session:', err.message);
      }
    }

    console.log(`[Room ${roomCode}] Phase -> ${next}`);
    broadcastGameState(io, roomCode, gameState);
  });

  // -----------------------------------------------------------------------
  // AI — Inspiration prompts, idea expansion, round analysis
  // -----------------------------------------------------------------------
  socket.on('ai_status', (_, ack) => {
    ack?.(getStatus());
  });

  socket.on('ai_generate_prompts', async ({ problem }, ack) => {
    if (!problem) return ack?.({ error: '请填写讨论问题' });
    try {
      const prompts = await generatePrompts(problem);
      ack?.({ prompts, mode: getStatus().mode });
    } catch (err) {
      ack?.({ error: err.message });
    }
  });

  socket.on('ai_expand', async ({ ideaText }, ack) => {
    if (!ideaText) return ack?.({ error: '请输入构想内容' });
    try {
      const expansions = await expandIdea(ideaText);
      ack?.({ expansions, mode: getStatus().mode });
    } catch (err) {
      ack?.({ error: err.message });
    }
  });

  socket.on('ai_round_summary', async ({ roundNum }, ack) => {
    const result = getRoomBySocket(io, socket);
    if (!result) return ack?.({ error: '未加入房间' });
    try {
      const ideas = result.gameState.ideas.filter(i => i.round === (roundNum || result.gameState.round));
      const summary = await analyzeRound(ideas, roundNum || result.gameState.round);
      ack?.({ summary, mode: getStatus().mode });
    } catch (err) {
      ack?.({ error: err.message });
    }
  });

  // -----------------------------------------------------------------------
  // DISCONNECT
  // -----------------------------------------------------------------------
  socket.on('disconnect', () => {
    console.log(`[Socket] Disconnected: ${socket.id}`);
    if (socket.roomCode && socket.playerId) {
      const gameState = rooms.get(socket.roomCode);
      if (gameState && gameState.players[socket.playerId]) {
        gameState.players[socket.playerId].connected = false;
        broadcastGameState(io, socket.roomCode, gameState);

        // Don't remove the player immediately — they might reconnect
        // Player cleanup happens when room is empty for 5 minutes (TODO: add cleanup timer)
      }
    }
  });
});

// ---------------------------------------------------------------------------
// Startup
// ---------------------------------------------------------------------------
getDb(); // Initialize DB on startup

for (const state of loadAllActiveRooms()) {
  if (state?.roomCode) {
    if (!state.commitments) state.commitments = [];
    rooms.set(state.roomCode, state);
    console.log(`[Room] Restored from checkpoint: ${state.roomCode} (${state.phase})`);
  }
}

httpServer.listen(PORT, () => {
  const url = `http://localhost:${PORT}`;
  console.log(`\n========================================`);
  console.log(`  Idea Forge Server v4.1.0`);
  console.log(`  ${url}`);
  console.log(`  DB: ideaforge.db`);
  console.log(`  AI: ${getStatus().mode === 'ai' ? `enabled (${getStatus().model})` : 'template mode (no key)'}`);
  console.log(`========================================\n`);

  // Auto-open browser
  const cmd = process.platform === 'win32' ? `start "" "${url}"` :
              process.platform === 'darwin' ? `open "${url}"` : `xdg-open "${url}"`;
  exec(cmd, () => {});
});

process.on('SIGTERM', () => {
  console.log('Shutting down...');
  io.close();
  httpServer.close();
  process.exit(0);
});

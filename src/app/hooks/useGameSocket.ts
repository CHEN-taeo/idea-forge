import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { GameState, Player } from '../types/game';
import { brand, reportFooter } from '../lib/brand';

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

interface UseGameSocketReturn {
  socket: Socket | null;
  gameState: GameState | null;
  currentPlayer: Player | null;
  connectionStatus: ConnectionStatus;
  playerId: string | null;
  joinGame: (playerName: string, roomCode: string) => void;
  createGame: (playerName: string, problemStatement: string, template?: 'full' | 'quick') => void;
  updatePlayerReady: (ready: boolean) => void;
  startGame: () => void;
  submitIdea: (text: string, inspirationCard?: number) => void;
  voteForIdea: (ideaId: string) => void;
  guessAuthor: (ideaId: string, authorId: string) => void;
  adaptIdea: (originalIdeaId: string, adaptedText: string) => void;
  endorseAdaptation: (ideaId: string) => void;
  challengeIdea: (ideaId: string, reason: string) => void;
  defendIdea: (ideaId: string, response: string, accepted: boolean) => void;
  voteOnDefense: (ideaId: string, successful: boolean) => void;
  nextPhase: () => void;
  exportSession: () => string;
  lastError: string | null;
  createCommitment: (action: string, ideaId: string, dueDays: number | undefined, onSuccess: (result: any) => void) => void;
  aiStatus: () => void;
  aiGeneratePrompts: (problem: string, callback: (result: any) => void) => void;
  aiExpand: (ideaText: string, callback: (result: any) => void) => void;
  aiRoundSummary: (roundNum: number, callback: (result: any) => void) => void;
}

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';
const SESSION_KEY = 'idea-forge-session';

function saveSessionMeta(roomCode: string, playerId: string, playerName: string) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ roomCode, playerId, playerName }));
  } catch {
    // ignore storage errors
  }
}

function loadSessionMeta(): { roomCode: string; playerId: string; playerName: string } | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function clearSessionMeta() {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
}

export function useGameSocket(): UseGameSocketReturn {
  const socketRef = useRef<Socket | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  // -----------------------------------------------------------------------
  // Connect to server
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (socketRef.current?.connected) return;

    setConnectionStatus('connecting');

    const socket = io(SERVER_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log(`[Socket] Connected: ${socket.id}`);
      setConnectionStatus('connected');
      setLastError(null);

      const saved = loadSessionMeta();
      if (saved?.roomCode && saved?.playerName) {
        socket.emit('rejoin_room', saved, (response: any) => {
          if (response?.error) {
            console.warn('[rejoin_room]', response.error);
            clearSessionMeta();
          }
        });
      }
    });

    socket.on('game_state', (state: GameState) => {
      setGameState(state);
      if (state.currentPlayerId && state.players[state.currentPlayerId]) {
        const player = state.players[state.currentPlayerId];
        setCurrentPlayer(player);
        setPlayerId(state.currentPlayerId);
        saveSessionMeta(state.roomCode, state.currentPlayerId, player.name);
      }
    });

    socket.on('new_commitment', (commitment: import('../types/game').Commitment) => {
      setGameState(prev => {
        if (!prev) return prev;
        const existing = prev.commitments || [];
        if (existing.some(c => c.id === commitment.id)) return prev;
        return { ...prev, commitments: [...existing, commitment] };
      });
    });

    socket.on('error', ({ message }: { message: string }) => {
      console.error('[Socket] Server error:', message);
      setLastError(message);
    });

    socket.on('disconnect', (reason: string) => {
      console.log(`[Socket] Disconnected: ${reason}`);
      setConnectionStatus('disconnected');
    });

    socket.on('connect_error', (err: Error) => {
      console.error('[Socket] Connection error:', err.message);
      setConnectionStatus('error');
      setLastError(`无法连接服务器：${err.message}`);
    });

    socket.on('reconnect', (attemptNumber: number) => {
      console.log(`[Socket] Reconnected after ${attemptNumber} attempts`);
      setConnectionStatus('connected');
      setLastError(null);

      const saved = loadSessionMeta();
      if (saved?.roomCode && saved?.playerName) {
        socket.emit('rejoin_room', saved, (response: any) => {
          if (response?.error) {
            setLastError(response.error);
          }
        });
      }
    });

    socket.on('reconnect_error', () => {
      setConnectionStatus('error');
      setLastError('重新连接失败，请检查服务器是否运行');
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setGameState(null);
      setCurrentPlayer(null);
      setPlayerId(null);
      setConnectionStatus('disconnected');
    };
  }, []);

  // -----------------------------------------------------------------------
  // CREATE GAME
  // -----------------------------------------------------------------------
  const createGame = useCallback((playerName: string, problemStatement: string, template: 'full' | 'quick' = 'full') => {
    const socket = socketRef.current;
    if (!socket?.connected) {
      setLastError('未连接到服务器');
      return;
    }

    socket.emit('create_room', { playerName, problemStatement, template }, (response: any) => {
      if (response?.error) {
        setLastError(response.error);
        console.error('[createGame]', response.error);
      } else if (response?.roomCode && response?.playerId) {
        saveSessionMeta(response.roomCode, response.playerId, playerName.trim());
      }
    });
  }, []);

  // -----------------------------------------------------------------------
  // JOIN GAME
  // -----------------------------------------------------------------------
  const joinGame = useCallback((playerName: string, roomCode: string) => {
    const socket = socketRef.current;
    if (!socket?.connected) {
      setLastError('未连接到服务器');
      return;
    }

    socket.emit('join_room', { playerName, roomCode: roomCode.toUpperCase().trim() }, (response: any) => {
      if (response?.error) {
        setLastError(response.error);
        console.error('[joinGame]', response.error);
      } else if (response?.playerId) {
        saveSessionMeta(roomCode.toUpperCase().trim(), response.playerId, playerName.trim());
      }
    });
  }, []);

  // -----------------------------------------------------------------------
  // PLAYER READY
  // -----------------------------------------------------------------------
  const updatePlayerReady = useCallback((ready: boolean) => {
    const socket = socketRef.current;
    if (!socket?.connected) return;
    socket.emit('player_ready', { ready });
  }, []);

  // -----------------------------------------------------------------------
  // START GAME
  // -----------------------------------------------------------------------
  const startGame = useCallback(() => {
    const socket = socketRef.current;
    if (!socket?.connected) return;
    socket.emit('start_game');
  }, []);

  // -----------------------------------------------------------------------
  // SUBMIT IDEA
  // -----------------------------------------------------------------------
  const submitIdea = useCallback((text: string, inspirationCard?: number) => {
    const socket = socketRef.current;
    if (!socket?.connected) return;
    socket.emit('submit_idea', { text, inspirationCard });
  }, []);

  // -----------------------------------------------------------------------
  // VOTE FOR IDEA
  // -----------------------------------------------------------------------
  const voteForIdea = useCallback((ideaId: string) => {
    const socket = socketRef.current;
    if (!socket?.connected) return;
    socket.emit('vote_idea', { ideaId });
  }, []);

  // -----------------------------------------------------------------------
  // GUESS AUTHOR
  // -----------------------------------------------------------------------
  const guessAuthor = useCallback((ideaId: string, authorId: string) => {
    const socket = socketRef.current;
    if (!socket?.connected) return;
    socket.emit('guess_author', { ideaId, guessedAuthorId: authorId });
  }, []);

  // -----------------------------------------------------------------------
  // ADAPT IDEA
  // -----------------------------------------------------------------------
  const adaptIdea = useCallback((originalIdeaId: string, adaptedText: string) => {
    const socket = socketRef.current;
    if (!socket?.connected) return;
    socket.emit('adapt_idea', { originalIdeaId, adaptedText });
  }, []);

  // -----------------------------------------------------------------------
  // ENDORSE ADAPTATION
  // -----------------------------------------------------------------------
  const endorseAdaptation = useCallback((ideaId: string) => {
    const socket = socketRef.current;
    if (!socket?.connected) return;
    socket.emit('endorse_adaptation', { ideaId });
  }, []);

  // -----------------------------------------------------------------------
  // CHALLENGE IDEA
  // -----------------------------------------------------------------------
  const challengeIdea = useCallback((ideaId: string, reason: string) => {
    const socket = socketRef.current;
    if (!socket?.connected) return;
    socket.emit('challenge_idea', { ideaId, reason });
  }, []);

  // -----------------------------------------------------------------------
  // DEFEND IDEA
  // -----------------------------------------------------------------------
  const defendIdea = useCallback((ideaId: string, response: string, accepted: boolean) => {
    const socket = socketRef.current;
    if (!socket?.connected) return;
    socket.emit('defend_idea', { ideaId, response, accepted });
  }, []);

  // -----------------------------------------------------------------------
  // VOTE ON DEFENSE
  // -----------------------------------------------------------------------
  const voteOnDefense = useCallback((ideaId: string, successful: boolean) => {
    const socket = socketRef.current;
    if (!socket?.connected) return;
    socket.emit('vote_on_defense', { ideaId, successful });
  }, []);

  // -----------------------------------------------------------------------
  // NEXT PHASE
  // -----------------------------------------------------------------------
  const nextPhase = useCallback(() => {
    const socket = socketRef.current;
    if (!socket?.connected) return;
    socket.emit('next_phase');
  }, []);

  // -----------------------------------------------------------------------
  // CREATE COMMITMENT
  // -----------------------------------------------------------------------
  const createCommitment = useCallback((action: string, ideaId: string, dueDays: number | undefined, onSuccess: (result: any) => void) => {
    const socket = socketRef.current;
    if (!socket?.connected) {
      setLastError('未连接到服务器');
      return;
    }
    socket.emit('create_commitment', { action, ideaId, dueDays: dueDays || 14, smartWhat: action }, (response: any) => {
      if (response?.error) {
        setLastError(response.error);
        onSuccess({ error: response.error });
      } else if (response?.success) {
        onSuccess({
          id: response.id,
          playerName: currentPlayer?.name || '',
          action,
          ideaId,
          echoUrl: response.echoUrl,
          dueDate: response.dueDate
        });
      } else {
        onSuccess({ error: '服务器无响应' });
      }
    });
  }, [currentPlayer]);

  // -----------------------------------------------------------------------
  // AI FUNCTIONS
  // -----------------------------------------------------------------------
  const aiStatus = useCallback(() => {
    const socket = socketRef.current;
    if (!socket?.connected) return;
    socket.emit('ai_status', {}, (res: any) => {
      console.log('[AI] Status:', res);
    });
  }, []);

  const aiGeneratePrompts = useCallback((problem: string, callback: (result: any) => void) => {
    const socket = socketRef.current;
    if (!socket?.connected) { callback({ error: '未连接' }); return; }
    socket.emit('ai_generate_prompts', { problem }, (res: any) => {
      callback(res);
    });
  }, []);

  const aiExpand = useCallback((ideaText: string, callback: (result: any) => void) => {
    const socket = socketRef.current;
    if (!socket?.connected) { callback({ error: '未连接' }); return; }
    socket.emit('ai_expand', { ideaText }, (res: any) => {
      callback(res);
    });
  }, []);

  const aiRoundSummary = useCallback((roundNum: number, callback: (result: any) => void) => {
    const socket = socketRef.current;
    if (!socket?.connected) { callback({ error: '未连接' }); return; }
    socket.emit('ai_round_summary', { roundNum }, (res: any) => {
      callback(res);
    });
  }, []);

  // -----------------------------------------------------------------------
  // EXPORT SESSION — professional structured report
  // -----------------------------------------------------------------------
  const exportSession = useCallback(() => {
    if (!gameState) return '';

    const players = Object.values(gameState.players);
    const sorted = [...players].sort((a, b) => b.score - a.score);
    const survivingIdeas = gameState.ideas.filter(i => i.alive);
    const mvpIdea = [...survivingIdeas].sort((a, b) => b.votes - a.votes)[0];
    const r1 = gameState.ideas.filter(i => i.round === 1);
    const r2 = gameState.ideas.filter(i => i.round === 2);

    const date = new Date().toISOString().split('T')[0];

    const commitments = gameState.commitments || [];

    return `# ${brand.productName} — 会议报告
> ${date} · ${players.length} 人 · ${gameState.ideas.length} 条想法 · ${gameState.challenges.length} 次质询

---

## 讨论问题
**${gameState.problemStatement}**

---

## 团队承诺
${commitments.length > 0 ? commitments.map(c => `- **${c.playerName}**：${c.action}`).join('\n') : '_（本场暂无认领记录）_'}

---

## 第一轮 · 构思（${r1.length} 条）
${r1.sort((a, b) => b.votes - a.votes).map((idea, i) => {
  const author = gameState.players[idea.authorId];
  return `### ${i + 1}. ${idea.text}
- **作者：** ${author?.name || '未知'} · **票数：** ${idea.votes} · **角色：** ${author?.role || '—'}`;
}).join('\n\n') || '_无_'}

---

## 第二轮 · 改造（${r2.length} 条）
${r2.length > 0 ? r2.map(idea => {
  const author = gameState.players[idea.authorId];
  return `### ${idea.text}
- **作者：** ${author?.name || '未知'}${idea.endorsed ? ' · ✅ 已获原作者认可' : ''}`;
}).join('\n\n') : '本场无改造记录。'}

---

## 第三轮 · 风险登记
${gameState.challenges.length > 0 ? gameState.challenges.map(c => {
  const idea = gameState.ideas.find(i => i.id === c.ideaId);
  const status = idea?.defenseAccepted ? '已接受并改进' : idea?.defenseResponse ? '辩护通过' : '未决';
  return `### ⚠️ ${idea?.text?.substring(0, 60) ?? '未知'}…
- **质询者：** ${c.challengerName}
- **风险：** ${c.reason}
- **状态：** ${status}`;
}).join('\n\n') : '本场无质询记录。'}

---

## 积分排行（参考）
${sorted.map((p, i) => `${i + 1}. ${p.name} — ${p.score} 分`).join('\n')}

${mvpIdea ? `\n### 最高票构想\n**${mvpIdea.text}**\n` : ''}${reportFooter(date)}`;
  }, [gameState]);

  return {
    socket: socketRef.current,
    gameState,
    currentPlayer,
    connectionStatus,
    playerId,
    joinGame,
    createGame,
    updatePlayerReady,
    startGame,
    submitIdea,
    voteForIdea,
    guessAuthor,
    adaptIdea,
    endorseAdaptation,
    challengeIdea,
    defendIdea,
    voteOnDefense,
    nextPhase,
    exportSession,
    lastError,
    createCommitment,
    aiStatus,
    aiGeneratePrompts,
    aiExpand,
    aiRoundSummary
  };
}

import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { GameState, Player } from '../types/game';

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

interface UseGameSocketReturn {
  socket: Socket | null;
  gameState: GameState | null;
  currentPlayer: Player | null;
  connectionStatus: ConnectionStatus;
  playerId: string | null;
  joinGame: (playerName: string, roomCode: string) => void;
  createGame: (playerName: string, problemStatement: string) => void;
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
    });

    socket.on('game_state', (state: GameState) => {
      setGameState(state);
      if (state.currentPlayerId && state.players[state.currentPlayerId]) {
        setCurrentPlayer(state.players[state.currentPlayerId]);
        setPlayerId(state.currentPlayerId);
      }
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
      setLastError(`Cannot connect to server: ${err.message}`);
    });

    socket.on('reconnect', (attemptNumber: number) => {
      console.log(`[Socket] Reconnected after ${attemptNumber} attempts`);
      setConnectionStatus('connected');
      setLastError(null);
    });

    socket.on('reconnect_error', () => {
      setConnectionStatus('error');
      setLastError('Reconnection failed. Please check the server.');
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
  const createGame = useCallback((playerName: string, problemStatement: string) => {
    const socket = socketRef.current;
    if (!socket?.connected) {
      setLastError('Not connected to server');
      return;
    }

    socket.emit('create_room', { playerName, problemStatement }, (response: any) => {
      if (response?.error) {
        setLastError(response.error);
        console.error('[createGame]', response.error);
      }
    });
  }, []);

  // -----------------------------------------------------------------------
  // JOIN GAME
  // -----------------------------------------------------------------------
  const joinGame = useCallback((playerName: string, roomCode: string) => {
    const socket = socketRef.current;
    if (!socket?.connected) {
      setLastError('Not connected to server');
      return;
    }

    socket.emit('join_room', { playerName, roomCode: roomCode.toUpperCase().trim() }, (response: any) => {
      if (response?.error) {
        setLastError(response.error);
        console.error('[joinGame]', response.error);
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
      setLastError('Not connected to server');
      return;
    }
    socket.emit('create_commitment', { action, ideaId, dueDays: dueDays || 14 }, (response: any) => {
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
        onSuccess({ error: 'No response from server' });
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
    if (!socket?.connected) { callback({ error: 'Not connected' }); return; }
    socket.emit('ai_generate_prompts', { problem }, (res: any) => {
      callback(res);
    });
  }, []);

  const aiExpand = useCallback((ideaText: string, callback: (result: any) => void) => {
    const socket = socketRef.current;
    if (!socket?.connected) { callback({ error: 'Not connected' }); return; }
    socket.emit('ai_expand', { ideaText }, (res: any) => {
      callback(res);
    });
  }, []);

  const aiRoundSummary = useCallback((roundNum: number, callback: (result: any) => void) => {
    const socket = socketRef.current;
    if (!socket?.connected) { callback({ error: 'Not connected' }); return; }
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
    const challenged = gameState.ideas.filter(i => i.challengedBy);
    const defended = challenged.filter(i => i.defenseResponse && !i.defenseAccepted);
    const accepted = challenged.filter(i => i.defenseAccepted);

    const date = new Date().toISOString().split('T')[0];

    return `# Idea Forge — Session Report
> ${date} · ${players.length} participants · ${gameState.ideas.length} ideas · ${gameState.challenges.length} challenges

---

## Problem
**${gameState.problemStatement}**

---

## Round 1 — Brainstorm (${r1.length} ideas)
${r1.sort((a, b) => b.votes - a.votes).map((idea, i) => {
  const author = gameState.players[idea.authorId];
  return `### ${i + 1}. ${idea.text}
- **Author:** ${author?.name || 'Unknown'} · **Votes:** ${idea.votes} · **Role:** ${author?.role || '—'}
${idea.inspirationCard !== undefined ? `- Inspiration: ${idea.inspirationCard}` : ''}`;
}).join('\n\n')}

---

## Round 2 — Remixes (${r2.length} adaptations)
${r2.length > 0 ? r2.map(idea => {
  const author = gameState.players[idea.authorId];
  const original = gameState.ideas.find(i => i.id === idea.adaptedFrom);
  return `### ${idea.text}
- **Author:** ${author?.name || 'Unknown'} · **Votes:** ${idea.votes}
- Adapted from: ${original?.text?.substring(0, 80) ?? '—'}…
${idea.endorsed ? '- ✅ Endorsed by original author' : ''}`;
}).join('\n\n') : 'No remixes were created in this session.'}

---

## Round 3 — Challenges & Risk Register
${gameState.challenges.length > 0 ? gameState.challenges.map(c => {
  const idea = gameState.ideas.find(i => i.id === c.ideaId);
  const status = idea?.defenseAccepted ? 'ACCEPTED (improved)' : idea?.defenseResponse ? 'REFUTED (defense passed)' : 'UNRESOLVED';
  return `### ⚠️ ${idea?.text?.substring(0, 60) ?? 'Unknown idea'}…
- **Challenger:** ${c.challengerName}
- **Risk identified:** ${c.reason}
- **Status:** ${status}
${idea?.defenseResponse ? `- **Response:** ${idea.defenseResponse}` : ''}`;
}).join('\n\n') : 'No challenges were raised in this session.'}

**Risk Summary:**
- Confirmed risks (accepted): ${accepted.length}
- Mitigated risks (defended): ${defended.length}
- Unresolved: ${challenged.length - accepted.length - defended.length}

---

## Final Standings
${sorted.map((p, i) => `### ${i + 1}. ${p.name} — ${p.score} pts
- **Role:** ${p.role || '—'}`).join('\n')}

${mvpIdea ? `### 🏆 Top Idea
**${mvpIdea.text}**
- Author: ${gameState.players[mvpIdea.authorId]?.name || 'Unknown'} · ${mvpIdea.votes} votes` : ''}

---

## Next Steps
> Each participant should pick ONE action item from the discussion above.

| Owner | Action | Deadline |
|-------|--------|----------|
${sorted.map(p => `| ${p.name} | _[fill in]_ | _[date]_ |`).join('\n')}

---

*Generated by Idea Forge · Every discussion ends with a decision someone owns.*`;
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

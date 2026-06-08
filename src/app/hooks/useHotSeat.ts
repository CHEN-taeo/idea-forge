// ---------------------------------------------------------------------------
// Hot Seat — local-only game state engine. No server, no sockets.
// One facilitator, one screen, everybody debates face-to-face.
// ---------------------------------------------------------------------------
import { useState, useCallback } from 'react';
import { GameState, Player, Idea, Challenge } from '../types/game';

const ROLES = [
  'Visionary', 'Pragmatist', 'Contrarian', 'Connector',
  'Analyst', 'Storyteller', 'Builder', 'Wildcard'
] as const;

let _counter = 0;
function uid(prefix: string) {
  return `${prefix}_${++_counter}_${Math.random().toString(36).substring(2, 6)}`;
}

// Immutable score update helper — prevents React state mutation bugs
function addScore(players: Record<string, Player>, playerId: string, amount: number) {
  const p = players[playerId];
  if (!p) return players;
  return { ...players, [playerId]: { ...p, score: p.score + amount } };
}

export function useHotSeat() {
  const [gameState, setGameState] = useState<GameState | null>(null);

  const createSession = useCallback((playerNames: string[], problemStatement: string) => {
    const players: Record<string, Player> = {};
    playerNames.forEach((name, i) => {
      const id = uid('p');
      players[id] = {
        id, name, score: 0,
        role: ROLES[i % ROLES.length],
        inspirationCards: Array.from({ length: 3 }, () => Math.floor(Math.random() * 20)),
        goldCards: [],
        ready: true,
        connected: true
      };
    });

    setGameState({
      phase: 'r1_submit', round: 1,
      players, ideas: [], challenges: [],
      currentPlayerId: Object.keys(players)[0],
      roomCode: 'HOTSEAT', hostId: Object.keys(players)[0],
      problemStatement, timerEnd: Date.now() + 300000
    });
  }, []);

  const submitIdea = useCallback((playerId: string, text: string, inspirationCard?: number) => {
    setGameState(prev => {
      if (!prev) return prev;
      const idea: Idea = {
        id: uid('idea'), text: text.trim(),
        authorId: playerId, authorName: prev.players[playerId]?.name,
        round: prev.round, votes: 0, guesses: {}, alive: true, inspirationCard
      };
      return {
        ...prev,
        players: addScore(prev.players, playerId, 1),
        ideas: [...prev.ideas, idea]
      };
    });
  }, []);

  const voteIdea = useCallback((ideaId: string) => {
    setGameState(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        ideas: prev.ideas.map(i => i.id === ideaId ? { ...i, votes: i.votes + 1 } : i)
      };
    });
  }, []);

  const adaptIdea = useCallback((playerId: string, originalIdeaId: string, adaptedText: string) => {
    setGameState(prev => {
      if (!prev) return prev;
      const original = prev.ideas.find(i => i.id === originalIdeaId);
      const idea: Idea = {
        id: uid('idea'), text: adaptedText.trim(),
        authorId: playerId, authorName: prev.players[playerId]?.name,
        round: prev.round, votes: 0, guesses: {}, alive: true,
        adaptedFrom: originalIdeaId, originalAuthorId: original?.authorId, endorsed: false
      };
      return {
        ...prev,
        players: addScore(prev.players, playerId, 1),
        ideas: [...prev.ideas, idea]
      };
    });
  }, []);

  const endorseAdaptation = useCallback((ideaId: string, endorserId: string) => {
    setGameState(prev => {
      if (!prev) return prev;
      const idea = prev.ideas.find(i => i.id === ideaId);
      if (!idea) return prev;
      return {
        ...prev,
        players: addScore(addScore(prev.players, endorserId, 2), idea.authorId, 2),
        ideas: prev.ideas.map(i => i.id === ideaId ? { ...i, endorsed: true } : i)
      };
    });
  }, []);

  const challengeIdea = useCallback((challengerId: string, ideaId: string, reason: string) => {
    setGameState(prev => {
      if (!prev) return prev;
      const challenge: Challenge = {
        id: uid('ch'), ideaId, challengerId,
        challengerName: prev.players[challengerId]?.name || '',
        reason: reason.trim(), timestamp: Date.now()
      };
      return {
        ...prev,
        ideas: prev.ideas.map(i => i.id === ideaId ? { ...i, challengedBy: challengerId } : i),
        challenges: [...prev.challenges, challenge]
      };
    });
  }, []);

  const defendIdea = useCallback((ideaId: string, response: string, accepted: boolean, defenderId: string) => {
    setGameState(prev => {
      if (!prev) return prev;
      const players = accepted ? prev.players : addScore(prev.players, defenderId, 2);
      return {
        ...prev,
        players,
        ideas: prev.ideas.map(i => i.id === ideaId
          ? { ...i, defenseResponse: response.trim(), defenseAccepted: accepted, defenseVotes: {} }
          : i)
      };
    });
  }, []);

  const nextPhase = useCallback(() => {
    setGameState(prev => {
      if (!prev) return prev;
      const order = ['lobby', 'r1_submit', 'r1_guess', 'r2_adapt', 'r3_challenge', 'finished'];
      const idx = order.indexOf(prev.phase);
      const next = order[idx + 1] || 'finished';
      return { ...prev, phase: next as GameState['phase'], timerEnd: next === 'finished' ? null : Date.now() + 300000 };
    });
  }, []);

  const resetSession = useCallback(() => setGameState(null), []);

  return {
    gameState, createSession, submitIdea, voteIdea, adaptIdea,
    endorseAdaptation, challengeIdea, defendIdea, nextPhase, resetSession
  };
}

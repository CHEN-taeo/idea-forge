// ---------------------------------------------------------------------------
// ScreenView — Projection-optimized display for the shared room screen.
// No controls. No forms. Just the ideas wall, timer, and standings.
// Designed to be readable from across the room.
// ---------------------------------------------------------------------------
import { GameState, Player } from '../types/game';
import { PhaseTimer } from './PhaseTimer';
import { cn } from './ui/utils';

interface ScreenViewProps {
  gameState: GameState;
  currentPlayer: Player;
  isHost: boolean;
}

const PLAYER_COLORS = ['#5eb3e6', '#e59bb3', '#7cd992', '#f0c674', '#c084fc', '#fb923c', '#4ecdc4', '#f87171'];

export function ScreenView({ gameState, currentPlayer, isHost }: ScreenViewProps) {
  const players = Object.values(gameState.players);
  const sorted = [...players].sort((a, b) => b.score - a.score);
  const allIdeas = gameState.ideas.filter(i => i.alive);
  const survivors = allIdeas.filter(i => i.alive);
  const phase = gameState.phase;

  const phaseConfig: Record<string, { emoji: string; label: string; hint: string }> = {
    'lobby':        { emoji: '👋', label: 'Waiting',        hint: `Room ${gameState.roomCode} · Share the QR code to invite` },
    'r1_submit':    { emoji: '💡', label: 'Brainstorm',     hint: 'Everyone: submit your ideas silently on your phone' },
    'r1_guess':     { emoji: '🔍', label: 'Vote & Guess',   hint: 'Vote for the best. Guess who wrote what.' },
    'r2_adapt':     { emoji: '⚗️', label: 'Remix',          hint: 'Take the best ideas and make them sharper' },
    'r3_challenge': { emoji: '⚔️', label: 'Challenge',      hint: 'Stress-test every idea. Defend or improve.' },
    'finished':     { emoji: '🏆', label: 'Results',        hint: 'What got decided today?' },
  };

  const config = phaseConfig[phase] || phaseConfig['lobby'];
  const r1Ideas = allIdeas.filter(i => i.round === 1);

  return (
    <div className="min-h-screen p-8 flex flex-col" style={{ fontFamily: 'system-ui, sans-serif' }}>
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/[0.06]">
        <div className="flex items-center gap-4">
          <span className="text-4xl">{config.emoji}</span>
          <div>
            <h1 className="text-3xl font-light text-white/80 tracking-tight">{config.label}</h1>
            <p className="text-lg text-white/25 mt-1">{config.hint}</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          {/* Timer — large */}
          {phase !== 'lobby' && phase !== 'finished' && (
            <PhaseTimer
              duration={phase === 'r1_submit' ? 300 : phase === 'r2_adapt' ? 480 : 600}
              className="scale-150"
            />
          )}
          {/* Player count */}
          <div className="text-center">
            <p className="text-4xl font-light text-white/50 tabular-nums">{players.length}</p>
            <p className="text-sm text-white/20">players</p>
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="flex-1 grid grid-cols-[1fr_280px] gap-8">
        {/* ── Ideas Wall — the shared canvas ── */}
        <div>
          {phase === 'lobby' && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-6xl mb-6">📺</p>
                <p className="text-3xl font-light text-white/50 mb-4">Waiting for players...</p>
                <div className="inline-block bg-white rounded-2xl p-4 shadow-xl">
                  <p className="text-4xl font-light tracking-[0.3em] text-gray-900">{gameState.roomCode}</p>
                </div>
                <p className="text-lg text-white/20 mt-4">Scan the QR code or enter this code on your phone</p>
              </div>
            </div>
          )}

          {phase !== 'lobby' && (
            <div className="space-y-3">
              {/* R1 ideas — the brainstorm wall */}
              {r1Ideas.length > 0 && (
                <div className="mb-6">
                  <p className="text-sm uppercase tracking-[0.15em] text-white/15 mb-3">
                    Round 1 · {r1Ideas.length} ideas
                  </p>
                  <div className="grid gap-3">
                    {r1Ideas.sort((a, b) => b.votes - a.votes).map((idea, i) => {
                      const author = gameState.players[idea.authorId];
                      const colorIdx = players.findIndex(p => p.id === idea.authorId) % 8;
                      const isChallenged = !!idea.challengedBy;
                      return (
                        <div key={idea.id} className={cn(
                          'flex items-start gap-4 p-5 rounded-2xl border transition-all',
                          isChallenged
                            ? 'bg-red-500/[0.03] border-red-500/[0.08]'
                            : i === 0 ? 'bg-amber-300/[0.03] border-amber-300/[0.12]' : 'bg-white/[0.01] border-white/[0.04]'
                        )}>
                          {/* Rank + votes */}
                          <div className="flex flex-col items-center min-w-[48px]">
                            <span className={cn('text-2xl font-light tabular-nums', i === 0 ? 'text-amber-200/70' : 'text-white/25')}>
                              {idea.votes}
                            </span>
                            <span className="text-[10px] text-white/10">votes</span>
                          </div>
                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <p className="text-xl text-white/60 leading-relaxed">{idea.text}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <div className="size-6 rounded-full flex items-center justify-center text-[10px] border border-white/[0.08]"
                                style={{ background: `${PLAYER_COLORS[colorIdx]}18`, color: PLAYER_COLORS[colorIdx] }}>
                                {author?.name?.slice(0, 2).toUpperCase()}
                              </div>
                              <span className="text-sm text-white/25">
                                {phase === 'r1_guess' ? '???' : author?.name}
                              </span>
                              {idea.round === 2 && <span className="text-xs px-1.5 py-0.5 rounded bg-white/[0.03] text-white/15">remix</span>}
                              {isChallenged && <span className="text-xs px-1.5 py-0.5 rounded bg-red-500/8 text-red-300/40">challenged</span>}
                              {idea.endorsed && <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-500/8 text-emerald-300/40">endorsed</span>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* R2 remixes */}
              {allIdeas.filter(i => i.round === 2).length > 0 && (
                <div className="mt-6">
                  <p className="text-sm uppercase tracking-[0.15em] text-white/15 mb-3">
                    Remixes · {allIdeas.filter(i => i.round === 2).length}
                  </p>
                  <div className="grid gap-3">
                    {allIdeas.filter(i => i.round === 2).map(idea => {
                      const author = gameState.players[idea.authorId];
                      const colorIdx = players.findIndex(p => p.id === idea.authorId) % 8;
                      const original = gameState.ideas.find(i => i.id === idea.adaptedFrom);
                      return (
                        <div key={idea.id} className="p-5 rounded-2xl bg-white/[0.01] border border-white/[0.04]">
                          <p className="text-lg text-white/50 leading-relaxed">{idea.text}</p>
                          {original && <p className="text-sm text-white/15 mt-2">adapted from: {original.text?.substring(0, 60)}…</p>}
                          <div className="flex items-center gap-2 mt-2">
                            <div className="size-5 rounded-full flex items-center justify-center text-[9px] border border-white/[0.08]"
                              style={{ background: `${PLAYER_COLORS[colorIdx]}18`, color: PLAYER_COLORS[colorIdx] }}>
                              {author?.name?.slice(0, 2).toUpperCase()}
                            </div>
                            <span className="text-sm text-white/25">{author?.name}</span>
                            {idea.endorsed && <span className="text-xs text-emerald-300/40">✓ endorsed</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Finished — results */}
          {phase === 'finished' && (
            <div className="space-y-6">
              <div className="text-center p-8">
                <p className="text-6xl mb-4">🏆</p>
                <p className="text-4xl font-light text-white/80">{sorted[0]?.name}</p>
                <p className="text-2xl text-white/30 mt-2">{sorted[0]?.score} points</p>
              </div>

              <div className="space-y-2">
                {sorted.map((p, i) => (
                  <div key={p.id} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.01] border border-white/[0.04]">
                    <div className="flex items-center gap-3">
                      <span className={cn('text-2xl font-light tabular-nums w-8', i === 0 ? 'text-amber-200/60' : 'text-white/20')}>
                        {i + 1}
                      </span>
                      <div className="size-8 rounded-full flex items-center justify-center text-xs border border-white/[0.08]"
                        style={{ background: `${PLAYER_COLORS[i % 8]}18`, color: PLAYER_COLORS[i % 8] }}>
                        {p.name?.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="text-xl text-white/50">{p.name}</span>
                      <span className="text-sm text-white/15">{p.role}</span>
                    </div>
                    <span className="text-2xl font-light text-white/30 tabular-nums">{p.score} pts</span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-4 gap-4 mt-4">
                {[
                  { label: 'Ideas', value: gameState.ideas.length },
                  { label: 'Survived', value: survivors.length },
                  { label: 'Remixes', value: gameState.ideas.filter(i => i.round === 2).length },
                  { label: 'Challenges', value: gameState.challenges.length },
                ].map(s => (
                  <div key={s.label} className="text-center p-4 rounded-xl bg-white/[0.01] border border-white/[0.04]">
                    <p className="text-3xl font-light text-white/40">{s.value}</p>
                    <p className="text-sm text-white/15">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Sidebar ── */}
        <div className="space-y-4">
          {/* Problem */}
          <div className="rounded-2xl bg-white/[0.01] border border-white/[0.04] p-5">
            <p className="text-xs uppercase tracking-[0.15em] text-white/15 mb-2">Problem</p>
            <p className="text-lg text-white/45 leading-relaxed">{gameState.problemStatement}</p>
          </div>

          {/* Players + Roles */}
          <div className="rounded-2xl bg-white/[0.01] border border-white/[0.04] p-5">
            <p className="text-xs uppercase tracking-[0.15em] text-white/15 mb-3">Players</p>
            <div className="space-y-2">
              {players.map((p, i) => (
                <div key={p.id} className="flex items-center gap-3">
                  <div className={cn('size-2 rounded-full', p.connected ? 'bg-emerald-400/60' : 'bg-white/10')} />
                  <div className="size-7 rounded-full flex items-center justify-center text-[10px] border border-white/[0.08]"
                    style={{ background: `${PLAYER_COLORS[i % 8]}18`, color: PLAYER_COLORS[i % 8] }}>
                    {p.name?.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="text-base text-white/40 flex-1">{p.name}</span>
                  <span className="text-sm text-white/15">{p.role}</span>
                  <span className="text-lg font-light text-white/20 tabular-nums">{p.score}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Phase instructions */}
          {phase !== 'lobby' && phase !== 'finished' && (
            <div className="rounded-2xl bg-white/[0.01] border border-white/[0.04] p-5">
              <p className="text-sm text-white/25 leading-relaxed">
                {phase === 'r1_submit' && 'Everyone gets 3 inspiration cards. Pick one, write your idea on your phone. No idea is too wild. No one sees yours until the reveal.'}
                {phase === 'r1_guess' && 'Vote for ideas you think are best. Guess who wrote each one. The author is hidden — this is where the discussion starts.'}
                {phase === 'r2_adapt' && 'Take the top ideas and make them better. Remix someone else\'s thinking. Original authors: endorse good remixes.'}
                {phase === 'r3_challenge' && 'Challenge weak ideas. Defend strong ones. Attack the idea, not the person. This is where real decisions get made.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Footer bar ── */}
      <div className="mt-6 pt-4 border-t border-white/[0.04] flex items-center justify-between text-xs text-white/15">
        <span>Idea Forge · Every discussion ends with a decision someone owns</span>
        {isHost && <span className="text-amber-300/30">Host view — this screen is being projected</span>}
      </div>
    </div>
  );
}

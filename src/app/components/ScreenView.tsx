// ---------------------------------------------------------------------------
// ScreenView — Projection-optimized display for the shared room screen.
// No controls. No forms. Just the ideas wall, timer, and standings.
// Designed to be readable from across the room.
// ---------------------------------------------------------------------------
import { GameState, Player } from '../types/game';
import { ROLE_LABELS } from '../data/game-data';
import { brand } from '../lib/brand';
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
    'lobby':        { emoji: '👋', label: '等待中',        hint: `房间 ${gameState.roomCode} · 扫码或输入房间码加入` },
    'r1_submit':    { emoji: '💡', label: '构思',     hint: '大家在手机上静默提交构想' },
    'r1_guess':     { emoji: '🔍', label: '投票与竞猜',   hint: '为最佳构想投票，猜猜作者是谁' },
    'r2_adapt':     { emoji: '⚗️', label: '改造',          hint: '把最好的想法改得更精炼' },
    'r3_challenge': { emoji: '⚔️', label: '质询',      hint: '压力测试每条构想，答辩或改进' },
    'commitment':   { emoji: '☯',  label: '承诺',    hint: '每人认领一项具体行动' },
    'finished':     { emoji: '🏆', label: '成果',        hint: '今天做出了什么决定？' },
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
          {phase !== 'lobby' && phase !== 'finished' && phase !== 'commitment' && (
            <PhaseTimer
              duration={phase === 'r1_submit' ? 300 : phase === 'r2_adapt' ? 480 : 600}
              className="scale-150"
            />
          )}
          {/* Player count */}
          <div className="text-center">
            <p className="text-4xl font-light text-white/50 tabular-nums">{players.length}</p>
            <p className="text-sm text-white/20">人</p>
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
                <p className="text-3xl font-light text-white/50 mb-4">等待参与者加入…</p>
                <div className="inline-block bg-white rounded-2xl p-4 shadow-xl">
                  <p className="text-4xl font-light tracking-[0.3em] text-gray-900">{gameState.roomCode}</p>
                </div>
                <p className="text-lg text-white/20 mt-4">扫码或输入房间码加入</p>
              </div>
            </div>
          )}

          {phase !== 'lobby' && (
            <div className="space-y-3">
              {/* R1 ideas — the brainstorm wall */}
              {r1Ideas.length > 0 && (
                <div className="mb-6">
                  <p className="text-sm uppercase tracking-[0.15em] text-white/15 mb-3">
                    第一轮 · {r1Ideas.length} 条构想
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
                            <span className="text-[10px] text-white/10">票</span>
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
                              {idea.round === 2 && <span className="text-xs px-1.5 py-0.5 rounded bg-white/[0.03] text-white/15">改造</span>}
                              {isChallenged && <span className="text-xs px-1.5 py-0.5 rounded bg-red-500/8 text-red-300/40">被质询</span>}
                              {idea.endorsed && <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-500/8 text-emerald-300/40">已认可</span>}
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
                    改造 · {allIdeas.filter(i => i.round === 2).length}
                  </p>
                  <div className="grid gap-3">
                    {allIdeas.filter(i => i.round === 2).map(idea => {
                      const author = gameState.players[idea.authorId];
                      const colorIdx = players.findIndex(p => p.id === idea.authorId) % 8;
                      const original = gameState.ideas.find(i => i.id === idea.adaptedFrom);
                      return (
                        <div key={idea.id} className="p-5 rounded-2xl bg-white/[0.01] border border-white/[0.04]">
                          <p className="text-lg text-white/50 leading-relaxed">{idea.text}</p>
                          {original && <p className="text-sm text-white/15 mt-2">改编自：{original.text?.substring(0, 60)}…</p>}
                          <div className="flex items-center gap-2 mt-2">
                            <div className="size-5 rounded-full flex items-center justify-center text-[9px] border border-white/[0.08]"
                              style={{ background: `${PLAYER_COLORS[colorIdx]}18`, color: PLAYER_COLORS[colorIdx] }}>
                              {author?.name?.slice(0, 2).toUpperCase()}
                            </div>
                            <span className="text-sm text-white/25">{author?.name}</span>
                            {idea.endorsed && <span className="text-xs text-emerald-300/40">✓ 已认可</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {phase === 'commitment' && (
            <div className="space-y-6">
              <div className="text-center p-8">
                <p className="text-6xl mb-4">☯</p>
                <p className="text-3xl font-light text-white/70">认领一项你将负责的行动</p>
                <p className="text-lg text-white/25 mt-3">
                  {(gameState.commitments?.length ?? 0)} / {players.length} 人已承诺
                </p>
              </div>
              {(gameState.commitments?.length ?? 0) > 0 && (
                <div className="space-y-3">
                  {gameState.commitments!.map(c => (
                    <div key={c.id} className="p-4 rounded-xl bg-emerald-400/[0.04] border border-emerald-400/10">
                      <p className="text-sm text-white/35 mb-1">{c.playerName}</p>
                      <p className="text-xl text-white/60 leading-relaxed">{c.action}</p>
                    </div>
                  ))}
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
                <p className="text-2xl text-white/30 mt-2">{sorted[0]?.score} 分</p>
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
                      <span className="text-sm text-white/15">{p.role ? ROLE_LABELS[p.role] : ''}</span>
                    </div>
                    <span className="text-2xl font-light text-white/30 tabular-nums">{p.score} 分</span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-4 gap-4 mt-4">
                {[
                  { label: '构想', value: gameState.ideas.length },
                  { label: '存活', value: survivors.length },
                  { label: '改造', value: gameState.ideas.filter(i => i.round === 2).length },
                  { label: '质询', value: gameState.challenges.length },
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
            <p className="text-xs uppercase tracking-[0.15em] text-white/15 mb-2">讨论问题</p>
            <p className="text-lg text-white/45 leading-relaxed">{gameState.problemStatement}</p>
          </div>

          {/* Players + Roles */}
          <div className="rounded-2xl bg-white/[0.01] border border-white/[0.04] p-5">
            <p className="text-xs uppercase tracking-[0.15em] text-white/15 mb-3">参与者</p>
            <div className="space-y-2">
              {players.map((p, i) => (
                <div key={p.id} className="flex items-center gap-3">
                  <div className={cn('size-2 rounded-full', p.connected ? 'bg-emerald-400/60' : 'bg-white/10')} />
                  <div className="size-7 rounded-full flex items-center justify-center text-[10px] border border-white/[0.08]"
                    style={{ background: `${PLAYER_COLORS[i % 8]}18`, color: PLAYER_COLORS[i % 8] }}>
                    {p.name?.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="text-base text-white/40 flex-1">{p.name}</span>
                  <span className="text-sm text-white/15">{p.role ? ROLE_LABELS[p.role] : ''}</span>
                  <span className="text-lg font-light text-white/20 tabular-nums">{p.score}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Phase instructions */}
          {phase !== 'lobby' && phase !== 'finished' && (
            <div className="rounded-2xl bg-white/[0.01] border border-white/[0.04] p-5">
              <p className="text-sm text-white/25 leading-relaxed">
                {phase === 'r1_submit' && '每人 3 张灵感卡，选一张后在手机上写下构想。想法可以很大胆，揭晓前互不可见。'}
                {phase === 'r1_guess' && '为最好的构想投票，猜猜每条是谁写的。作者隐藏——讨论从这里开始。'}
                {phase === 'r2_adapt' && '拿排名靠前的构想改造升级。原作者可以认可好的改造。'}
                {phase === 'r3_challenge' && '质询弱项，捍卫强项。攻击想法，不攻击人。真正的决策在这里发生。'}
                {phase === 'commitment' && '每人选一条存活构想，承诺一项具体下一步。这是本次会议的真实产出。'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Footer bar ── */}
      <div className="mt-6 pt-4 border-t border-white/[0.04] flex items-center justify-between text-xs text-white/15">
        <span>{brand.productName} · {brand.slogan}</span>
        {isHost && <span className="text-amber-300/30">主持视图 — 正在投屏</span>}
      </div>
    </div>
  );
}

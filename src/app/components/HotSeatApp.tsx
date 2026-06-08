import { useState } from 'react';
import { useHotSeat } from '../hooks/useHotSeat';
import { INSPIRATION_CARDS, ROLE_DESCRIPTIONS } from '../data/game-data';
import { PhaseTimer } from './PhaseTimer';
import { cn } from './ui/utils';

// ─── Sub-components ─────────────────────────────────────────────────────────

function PlayerBadge({ name, role, score, active, color }: { name: string; role: string | null; score: number; active: boolean; color: string }) {
  return (
    <div className={cn(
      'flex items-center gap-3 px-4 py-3 rounded-xl border transition-all',
      active ? 'border-amber-300/40 bg-amber-300/8' : 'border-white/[0.04] bg-white/[0.02]'
    )}>
      <div className={cn(
        'size-10 rounded-full flex items-center justify-center text-sm font-medium border',
        active ? 'border-amber-300/30 text-amber-200' : 'border-white/[0.08] text-white/30'
      )}
      style={{ background: `${color}18` }}
      >
        {name.slice(0, 2).toUpperCase()}
      </div>
      <div>
        <p className={cn('text-sm', active ? 'text-white/80' : 'text-white/40')}>{name}</p>
        <p className="text-[11px] text-white/20">{role ?? ''}</p>
      </div>
      <span className="ml-auto text-lg font-light text-white/30 tabular-nums">{score}</span>
    </div>
  );
}

const PLAYER_COLORS = ['#5eb3e6', '#e59bb3', '#7cd992', '#f0c674', '#c084fc', '#fb923c', '#4ecdc4', '#f87171'];

// ─── Setup screen ────────────────────────────────────────────────────────────

function SetupScreen({ onCreate }: { onCreate: (names: string[], problem: string) => void }) {
  const [problem, setProblem] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [names, setNames] = useState<string[]>([]);

  const addName = () => {
    const n = nameInput.trim();
    if (n && !names.includes(n) && names.length < 8) {
      setNames([...names, n]);
      setNameInput('');
    }
  };

  const removeName = (i: number) => setNames(names.filter((_, idx) => idx !== i));

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-lg">
        <div className="text-center mb-10">
          <div className="text-5xl mb-4">🔥</div>
          <h1 className="text-3xl font-light text-white/80 mb-2">Hot Seat</h1>
          <p className="text-base text-white/30">One screen. Everyone debates. No phones.</p>
        </div>

        <div className="glass rounded-2xl p-6 mb-4">
          <label className="text-sm text-white/40 mb-2 block">What are we discussing today?</label>
          <textarea
            className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl text-white/80 text-lg p-4 resize-none outline-none focus:border-amber-300/30 placeholder:text-white/15"
            placeholder="e.g. How should we prioritize our Q3 roadmap?"
            rows={3}
            value={problem}
            onChange={e => setProblem(e.target.value)}
          />
        </div>

        <div className="glass rounded-2xl p-6 mb-6">
          <label className="text-sm text-white/40 mb-3 block">Who's in the room? ({names.length}/8)</label>
          <div className="flex gap-2 mb-3">
            <input
              className="flex-1 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white/80 text-base px-4 py-2.5 outline-none focus:border-amber-300/30 placeholder:text-white/15"
              placeholder="Name"
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addName()}
            />
            <button onClick={addName} className="px-5 py-2.5 rounded-xl btn-primary text-sm">Add</button>
          </div>
          {names.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {names.map((n, i) => (
                <span key={i} onClick={() => removeName(i)}
                  className="cursor-pointer px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-white/50 text-sm hover:border-red-400/30 hover:text-red-300/70 transition-colors"
                >
                  {n} ✕
                </span>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => onCreate(names, problem)}
          disabled={names.length < 2 || !problem.trim()}
          className="w-full h-14 rounded-2xl btn-primary text-lg font-medium disabled:btn-disabled"
        >
          🔥 Start Hot Seat — {names.length} players
        </button>
      </div>
    </div>
  );
}

// ─── Main game screen ────────────────────────────────────────────────────────

function GameScreen({ game, onNext, onSubmitIdea, onVote, onAdapt, onEndorse, onChallenge, onDefend }: any) {
  const players = Object.values(game.players) as any[];
  const ideas = game.ideas.filter((i: any) => i.round === game.round && i.alive);
  const allIdeas = game.ideas.filter((i: any) => i.alive);
  const [selectedPlayer, setSelectedPlayer] = useState(players[0]?.id || '');
  const [ideaText, setIdeaText] = useState('');
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const [adaptTarget, setAdaptTarget] = useState<string | null>(null);
  const [adaptText, setAdaptText] = useState('');
  const [challengeTarget, setChallengeTarget] = useState<string | null>(null);
  const [challengeReason, setChallengeReason] = useState('');
  const [defendTarget, setDefendTarget] = useState<string | null>(null);
  const [defendText, setDefendText] = useState('');
  const [showBreak, setShowBreak] = useState(false);

  const phase = game.phase;
  const phaseLabel =
    phase === 'r1_submit' ? 'Round 1 · Brainstorm' :
    phase === 'r1_guess' ? 'Round 1 · Vote & Guess' :
    phase === 'r2_adapt' ? 'Round 2 · Remix' :
    phase === 'r3_challenge' ? 'Round 3 · Challenge' : '';
  const topIdeas = [...game.ideas.filter((i: any) => i.round === 1 && i.alive)]
    .sort((a: any, b: any) => b.votes - a.votes).slice(0, 5);

  const player = game.players[selectedPlayer];
  const isHost = true; // Facilitator controls everything

  // ── Discussion break between transitions ──
  if (showBreak) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="text-center animate-scale-in">
          <div className="text-6xl mb-6">
            {phase === 'r1_submit' ? '💡' : phase === 'r2_adapt' ? '⚗️' : phase === 'r3_challenge' ? '⚔️' : '🗣️'}
          </div>
          <h1 className="text-4xl font-light text-white/80 mb-4">
            {phase === 'r1_submit' ? 'Round 1' : phase === 'r2_adapt' ? 'Round 2 · Remix' : phase === 'r3_challenge' ? 'Round 3 · Challenge' : 'Discuss!'}
          </h1>
          <p className="text-xl text-white/30 mb-2">
            {phase === 'r1_submit' ? 'Everyone speaks. Facilitator types.' : phase === 'r2_adapt' ? 'Steal and improve the best ideas.' : phase === 'r3_challenge' ? 'Attack ideas. Defend your own.' : ''}
          </p>
          <p className="text-base text-white/15 mb-8">{game.problemStatement}</p>
          <button onClick={() => setShowBreak(false)}
            className="px-8 py-4 rounded-2xl btn-primary text-xl font-medium">
            Let's Go →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🔥</span>
          <div>
            <h1 className="text-2xl font-light text-white/80">{phaseLabel}</h1>
            <p className="text-sm text-white/20">{game.problemStatement}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <PhaseTimer duration={phase === 'r1_submit' ? 600 : phase === 'r2_adapt' ? 480 : 600}
            onExpire={() => {}} />
          <button onClick={onNext} className="px-5 py-2.5 rounded-xl btn-primary text-base">
            {phase === 'r3_challenge' ? 'Finish' : 'Next Phase →'}
          </button>
        </div>
      </div>

      {/* Player bar */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {players.map((p: any, i: number) => (
          <button key={p.id} onClick={() => setSelectedPlayer(p.id)}
            className={cn(
              'flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all text-base',
              selectedPlayer === p.id ? 'border-amber-300/40 bg-amber-300/8 text-white/70' : 'border-white/[0.04] bg-white/[0.01] text-white/25'
            )}>
            <div className="size-7 rounded-full flex items-center justify-center text-[11px] font-medium border border-white/[0.1]"
              style={{ background: `${PLAYER_COLORS[i % 8]}20`, color: PLAYER_COLORS[i % 8] }}>
              {p.name.slice(0, 2).toUpperCase()}
            </div>
            {p.name}
            <span className="tabular-nums text-white/15 ml-1">{p.score}</span>
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        {/* Main area */}
        <div className="space-y-4">
          {/* R1 Submit */}
          {phase === 'r1_submit' && (
            <div className="glass rounded-2xl p-5">
              <p className="text-sm text-white/30 mb-2">
                <span className="text-amber-300/60">{player?.name}</span> is speaking — facilitator, type their idea:
              </p>
              <div className="flex gap-2 mb-3 flex-wrap">
                {player?.inspirationCards?.map((ci: number) => (
                  <button key={ci} onClick={() => setSelectedCard(ci)}
                    className={cn('px-3 py-1.5 rounded-lg text-sm border transition-all',
                      selectedCard === ci ? 'border-amber-300/40 bg-amber-300/10 text-amber-200/80' : 'border-white/[0.05] bg-white/[0.02] text-white/25 hover:border-white/[0.1]')}>
                    {INSPIRATION_CARDS[ci]?.substring(0, 30)}…
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input className="flex-1 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white/80 text-base px-4 py-3 outline-none focus:border-amber-300/30 placeholder:text-white/15"
                  placeholder="Type what they said..." value={ideaText}
                  onChange={e => setIdeaText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && ideaText.trim()) { onSubmitIdea(selectedPlayer, ideaText, selectedCard ?? undefined); setIdeaText(''); setSelectedCard(null); } }} />
                <button onClick={() => { onSubmitIdea(selectedPlayer, ideaText, selectedCard ?? undefined); setIdeaText(''); setSelectedCard(null); }}
                  disabled={!ideaText.trim()}
                  className="px-6 py-3 rounded-xl btn-primary text-base disabled:btn-disabled">Submit</button>
              </div>
            </div>
          )}

          {/* Ideas wall */}
          <div className="glass rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.04]">
              <span className="text-sm text-white/20 uppercase tracking-[0.15em]">
                {phase === 'r1_guess' ? 'All Ideas · Vote now' : 'The Wall'} · {allIdeas.length}
              </span>
            </div>
            <div className="divide-y divide-white/[0.03]">
              {allIdeas.map((idea: any) => {
                const author = game.players[idea.authorId];
                const isChallenged = !!idea.challengedBy;
                const challenge = game.challenges.find((c: any) => c.ideaId === idea.id);
                return (
                  <div key={idea.id} className={cn('px-5 py-4', isChallenged && 'bg-red-500/[0.03]')}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="size-6 rounded-full flex items-center justify-center text-[10px] border border-white/[0.1]"
                            style={{ background: `${PLAYER_COLORS[players.findIndex((p: any) => p.id === idea.authorId) % 8]}20`, color: PLAYER_COLORS[players.findIndex((p: any) => p.id === idea.authorId) % 8] }}>
                            {author?.name?.slice(0, 2).toUpperCase()}
                          </div>
                          <span className="text-sm text-white/40">
                            {phase === 'r1_guess' ? '???' : author?.name}
                          </span>
                          {idea.round === 2 && <span className="text-[11px] px-1.5 py-0.5 rounded bg-white/[0.04] text-white/15">Remix</span>}
                          {isChallenged && <span className="text-[11px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400/60">Challenged</span>}
                          {idea.endorsed && <span className="text-[11px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400/60">Endorsed</span>}
                        </div>
                        <p className="text-base text-white/60 leading-relaxed">{idea.text}</p>
                        {idea.inspirationCard !== undefined && (
                          <p className="text-xs text-white/12 mt-1">💡 {INSPIRATION_CARDS[idea.inspirationCard]?.substring(0, 40)}…</p>
                        )}
                        {challenge && (
                          <div className="mt-2 p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                            <p className="text-xs text-red-300/50">{challenge.challengerName}: {challenge.reason}</p>
                            {idea.defenseResponse && (
                              <p className="text-xs text-white/40 mt-1">↳ {idea.defenseResponse} {idea.defenseAccepted ? '(Accepted & improved)' : '(Refuted)'}</p>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {/* Vote button */}
                        {(phase === 'r1_guess' || phase === 'r1_submit') && (
                          <button onClick={() => onVote(idea.id)}
                            className="px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-white/40 hover:border-amber-300/30 hover:text-amber-200/70 text-sm transition-colors">
                            ⬆ {idea.votes}
                          </button>
                        )}
                        {/* Adapt button in R2 */}
                        {phase === 'r2_adapt' && idea.round === 1 && idea.authorId !== selectedPlayer && (
                          <button onClick={() => { setAdaptTarget(idea.id); setAdaptText(''); }}
                            className="px-3 py-1.5 rounded-lg btn-ghost text-sm">Remix</button>
                        )}
                        {/* Endorse in R2 */}
                        {phase === 'r2_adapt' && idea.round === 2 && idea.originalAuthorId === selectedPlayer && !idea.endorsed && (
                          <button onClick={() => onEndorse(idea.id, selectedPlayer)}
                            className="px-3 py-1.5 rounded-lg btn-primary text-sm">Endorse ✓</button>
                        )}
                        {/* Challenge in R3 */}
                        {phase === 'r3_challenge' && !isChallenged && idea.authorId !== selectedPlayer && (
                          <button onClick={() => { setChallengeTarget(idea.id); setChallengeReason(''); }}
                            className="px-3 py-1.5 rounded-lg btn-danger text-sm">Challenge</button>
                        )}
                        {/* Defend in R3 */}
                        {phase === 'r3_challenge' && isChallenged && idea.authorId === selectedPlayer && !idea.defenseResponse && (
                          <button onClick={() => { setDefendTarget(idea.id); setDefendText(''); }}
                            className="px-3 py-1.5 rounded-lg btn-primary text-sm">Defend</button>
                        )}
                      </div>
                    </div>

                    {/* Adapt form */}
                    {adaptTarget === idea.id && (
                      <div className="mt-3 flex gap-2">
                        <input className="flex-1 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white/70 text-sm px-3 py-2 outline-none"
                          placeholder="Remix this idea..." value={adaptText}
                          onChange={e => setAdaptText(e.target.value)} />
                        <button onClick={() => { onAdapt(selectedPlayer, idea.id, adaptText); setAdaptTarget(null); }}
                          disabled={!adaptText.trim()} className="px-4 py-2 rounded-lg btn-primary text-sm disabled:btn-disabled">Submit</button>
                        <button onClick={() => setAdaptTarget(null)} className="px-3 py-2 rounded-lg btn-danger text-sm">Cancel</button>
                      </div>
                    )}

                    {/* Challenge form */}
                    {challengeTarget === idea.id && (
                      <div className="mt-3 flex gap-2">
                        <input className="flex-1 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white/70 text-sm px-3 py-2 outline-none"
                          placeholder="The fatal flaw is..." value={challengeReason}
                          onChange={e => setChallengeReason(e.target.value)} />
                        <button onClick={() => { onChallenge(selectedPlayer, idea.id, challengeReason); setChallengeTarget(null); }}
                          disabled={!challengeReason.trim()} className="px-4 py-2 rounded-lg btn-danger text-sm disabled:btn-disabled">Challenge</button>
                        <button onClick={() => setChallengeTarget(null)} className="px-3 py-2 rounded-lg btn-ghost text-sm">Cancel</button>
                      </div>
                    )}

                    {/* Defend form */}
                    {defendTarget === idea.id && (
                      <div className="mt-3 flex gap-2">
                        <input className="flex-1 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white/70 text-sm px-3 py-2 outline-none"
                          placeholder="My defense..." value={defendText}
                          onChange={e => setDefendText(e.target.value)} />
                        <button onClick={() => { onDefend(idea.id, defendText, false, selectedPlayer); setDefendTarget(null); }}
                          disabled={!defendText.trim()} className="px-4 py-2 rounded-lg btn-primary text-sm disabled:btn-disabled">Refute</button>
                        <button onClick={() => { onDefend(idea.id, defendText, true, selectedPlayer); setDefendTarget(null); }}
                          disabled={!defendText.trim()} className="px-4 py-2 rounded-lg bg-emerald-500/15 border border-emerald-500/25 text-emerald-300 text-sm">Accept & Improve</button>
                        <button onClick={() => setDefendTarget(null)} className="px-3 py-2 rounded-lg btn-ghost text-sm">Cancel</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-3">
          {/* Roles */}
          <div className="glass rounded-2xl p-4">
            <p className="text-xs uppercase tracking-[0.15em] text-white/15 mb-3">Roles</p>
            <div className="space-y-1.5">
              {players.map((p: any, i: number) => (
                <div key={p.id} className="flex items-center gap-2 text-sm">
                  <div className="size-5 rounded-full flex items-center justify-center text-[9px] border border-white/[0.1] flex-shrink-0"
                    style={{ background: `${PLAYER_COLORS[i % 8]}20`, color: PLAYER_COLORS[i % 8] }}>
                    {p.name.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="text-white/40">{p.name}</span>
                  <span className="text-white/15 ml-auto">{p.role}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Scoreboard */}
          <div className="glass rounded-2xl p-4">
            <p className="text-xs uppercase tracking-[0.15em] text-white/15 mb-3">Scores</p>
            {[...players].sort((a: any, b: any) => b.score - a.score).map((p: any, i: number) => (
              <div key={p.id} className="flex items-center justify-between py-1.5 text-sm">
                <span className={cn(i === 0 ? 'text-amber-200/60' : 'text-white/30')}>{p.name}</span>
                <span className="text-white/20 tabular-nums">{p.score}</span>
              </div>
            ))}
          </div>

          {/* Phase info */}
          <div className="glass rounded-2xl p-4">
            <p className="text-sm text-white/25 leading-relaxed">
              {phase === 'r1_submit' && 'Everyone gets 3 inspiration cards. Pick one, speak your idea. Facilitator types. No idea is too wild.'}
              {phase === 'r1_guess' && 'Vote for the best ideas. Guess who wrote what. Debate is encouraged.'}
              {phase === 'r2_adapt' && 'Take the top ideas and remix them. Make them better. Original author can endorse for bonus points.'}
              {phase === 'r3_challenge' && 'Attack weak ideas. Defend strong ones. This is where the real discussion happens.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Finished screen ─────────────────────────────────────────────────────────

function FinishedScreen({ game, onReset }: any) {
  const players = Object.values(game.players) as any[];
  const sorted = [...players].sort((a: any, b: any) => b.score - a.score);
  const winner = sorted[0];
  const survivors = game.ideas.filter((i: any) => i.alive);
  const mvp = [...survivors].sort((a: any, b: any) => b.votes - a.votes)[0];

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="text-center max-w-xl animate-scale-in">
        <div className="text-6xl mb-6">🏆</div>
        <h1 className="text-4xl font-light text-white/80 mb-2">{winner?.name}</h1>
        <p className="text-2xl text-white/30 mb-8">{winner?.score} points · MVP</p>

        <div className="glass rounded-2xl p-6 mb-6 text-left">
          <p className="text-xs uppercase tracking-[0.15em] text-white/20 mb-4">Session Results</p>
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Ideas', value: game.ideas.length },
              { label: 'Alive', value: survivors.length },
              { label: 'Remixes', value: game.ideas.filter((i: any) => i.round === 2).length },
              { label: 'Challenges', value: game.challenges.length },
            ].map((s, i) => (
              <div key={i} className="text-center"><p className="text-3xl font-light text-white/40">{s.value}</p><p className="text-xs text-white/15">{s.label}</p></div>
            ))}
          </div>

          <p className="text-xs uppercase tracking-[0.15em] text-white/20 mb-3">Final Standings</p>
          {sorted.map((p: any, i: number) => (
            <div key={p.id} className="flex items-center justify-between py-2 text-base">
              <span className={cn(i === 0 ? 'text-amber-200/70' : 'text-white/35')}>{i + 1}. {p.name} — {p.role}</span>
              <span className="text-white/25 tabular-nums">{p.score} pts</span>
            </div>
          ))}

          {mvp && (
            <div className="mt-4 p-4 rounded-xl bg-amber-300/[0.04] border border-amber-300/[0.08]">
              <p className="text-xs text-white/15 mb-1">Top Idea</p>
              <p className="text-base text-white/50">{mvp.text}</p>
              <p className="text-xs text-white/20 mt-1">{mvp.votes} votes</p>
            </div>
          )}
        </div>

        <div className="glass rounded-2xl p-6 mb-6">
          <p className="text-lg text-white/50 leading-relaxed">
            Now ask everyone: <span className="text-amber-200/70">"What's one thing you'll do about this in the next two weeks?"</span>
          </p>
          <p className="text-sm text-white/20 mt-3">Write their answers somewhere. This is where ideas become action.</p>
        </div>

        <button onClick={onReset}
          className="px-8 py-4 rounded-2xl btn-primary text-xl">
          New Session →
        </button>
      </div>
    </div>
  );
}

// ─── Main HotSeat App ────────────────────────────────────────────────────────

export function HotSeatApp() {
  const hook = useHotSeat();
  const { gameState, createSession, submitIdea, voteIdea, adaptIdea, endorseAdaptation, challengeIdea, defendIdea, nextPhase, resetSession } = hook;

  if (!gameState) {
    return <SetupScreen onCreate={createSession} />;
  }

  if (gameState.phase === 'finished') {
    return <FinishedScreen game={gameState} onReset={resetSession} />;
  }

  return (
    <GameScreen
      game={gameState}
      onNext={nextPhase}
      onSubmitIdea={submitIdea}
      onVote={voteIdea}
      onAdapt={adaptIdea}
      onEndorse={endorseAdaptation}
      onChallenge={challengeIdea}
      onDefend={defendIdea}
    />
  );
}

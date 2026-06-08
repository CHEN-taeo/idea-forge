import { useState } from 'react';
import { cn } from './ui/utils';

// ─── Types ──────────────────────────────────────────────────────────────────

interface SoloIdea {
  id: string;
  text: string;
  votes: number;
  remix?: string;
  weakness?: string;
  fix?: string;
}

type Phase = 'setup' | 'brainstorm' | 'curate' | 'remix' | 'challenge' | 'finish';

let _id = 0;
function nid() { return `s_${++_id}`; }

// ─── Setup ──────────────────────────────────────────────────────────────────

function SetupScreen({ onStart }: { onStart: (name: string, problem: string) => void }) {
  const [name, setName] = useState('');
  const [problem, setProblem] = useState('');

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md animate-scale-in page-card p-8">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🧠</div>
          <h1 className="text-2xl font-light text-white/80 mb-1">Solo Brainstorm</h1>
          <p className="text-sm text-white/25">Structured thinking for one. No server. No pressure.</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[10px] uppercase tracking-[0.15em] text-white/20 mb-2 block">Your name</label>
            <input className="w-full h-10 px-3 rounded-lg glass-input text-sm text-white/80 placeholder:text-white/15 outline-none"
              placeholder="e.g. Chen" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-[0.15em] text-white/20 mb-2 block">What are you thinking about?</label>
            <textarea className="w-full h-24 px-3 py-2 rounded-lg glass-input text-sm text-white/80 placeholder:text-white/15 outline-none resize-none"
              placeholder="e.g. Should I quit my job and start a company?"
              value={problem} onChange={e => setProblem(e.target.value)} />
          </div>
          <button
            onClick={() => onStart(name || 'Me', problem)}
            disabled={!problem.trim()}
            className="w-full h-12 rounded-xl btn-primary text-base disabled:btn-disabled">
            Start Thinking →
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Brainstorm Phase ───────────────────────────────────────────────────────

function BrainstormPhase({ ideas, onAdd, onNext }: {
  ideas: SoloIdea[];
  onAdd: (text: string) => void;
  onNext: () => void;
}) {
  const [text, setText] = useState('');

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/20 mb-2">Phase 1 of 4</p>
          <h1 className="text-3xl font-light text-white/80 mb-2">💡 Brainstorm</h1>
          <p className="text-base text-white/25">Get everything out of your head. Quantity over quality. No idea is too wild.</p>
          <p className="text-xs text-white/15 mt-1">{ideas.length} ideas so far</p>
        </div>

        <div className="glass rounded-2xl p-5 mb-4">
          <textarea
            className="w-full bg-transparent text-white/80 text-base placeholder:text-white/15 outline-none resize-none"
            placeholder="Type an idea and press Enter..."
            rows={3}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey && text.trim()) {
                e.preventDefault();
                onAdd(text.trim());
                setText('');
              }
            }}
            autoFocus
          />
          <div className="flex justify-between items-center mt-2">
            <span className="text-[10px] text-white/15">Enter to add · Shift+Enter for new line</span>
            <button
              onClick={() => { if (text.trim()) { onAdd(text.trim()); setText(''); } }}
              disabled={!text.trim()}
              className="px-4 py-1.5 rounded-lg btn-primary text-sm disabled:btn-disabled">
              Add
            </button>
          </div>
        </div>

        {ideas.length > 0 && (
          <div className="space-y-2">
            {ideas.map((idea, i) => (
              <div key={idea.id} className="glass rounded-xl px-4 py-3 flex items-start gap-3">
                <span className="text-white/15 text-sm tabular-nums mt-0.5">{i + 1}.</span>
                <p className="text-sm text-white/55 leading-relaxed flex-1">{idea.text}</p>
              </div>
            ))}
          </div>
        )}

        {ideas.length >= 3 && (
          <div className="text-center mt-8">
            <button onClick={onNext} className="px-8 py-3 rounded-xl btn-primary text-base">
              Curate Your Ideas →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Curate Phase ───────────────────────────────────────────────────────────

function CuratePhase({ ideas, onVote, onNext }: {
  ideas: SoloIdea[];
  onVote: (id: string) => void;
  onNext: () => void;
}) {
  const topCount = ideas.filter(i => i.votes > 0).length;

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/20 mb-2">Phase 2 of 4</p>
          <h1 className="text-3xl font-light text-white/80 mb-2">🎯 Curate</h1>
          <p className="text-base text-white/25">Pick your top 3-5 ideas. Click to vote. These move forward.</p>
          <p className="text-xs text-white/15 mt-1">{topCount} selected</p>
        </div>

        <div className="space-y-2 mb-8">
          {ideas.map((idea, i) => (
            <button key={idea.id} onClick={() => onVote(idea.id)}
              className={cn(
                'w-full text-left glass rounded-xl px-4 py-3 flex items-start gap-3 transition-all',
                idea.votes > 0 ? 'border-amber-300/30 bg-amber-300/[0.04]' : 'hover:border-white/[0.1]'
              )}>
              <span className={cn('text-sm tabular-nums mt-0.5', idea.votes > 0 ? 'text-amber-200/60' : 'text-white/15')}>
                {i + 1}.
              </span>
              <p className={cn('text-sm leading-relaxed flex-1', idea.votes > 0 ? 'text-white/70' : 'text-white/40')}>
                {idea.text}
              </p>
              {idea.votes > 0 && <span className="text-amber-200/60 text-xs">★</span>}
            </button>
          ))}
        </div>

        <div className="text-center">
          <button onClick={onNext} disabled={topCount === 0}
            className="px-8 py-3 rounded-xl btn-primary text-base disabled:btn-disabled">
            Remix Your Best Ideas →
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Remix Phase ────────────────────────────────────────────────────────────

function RemixPhase({ ideas, onRemix, onNext }: {
  ideas: SoloIdea[];
  onRemix: (id: string, text: string) => void;
  onNext: () => void;
}) {
  const top = ideas.filter(i => i.votes > 0);
  const [active, setActive] = useState<string | null>(null);
  const [text, setText] = useState('');
  const done = top.filter(i => i.remix).length;

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/20 mb-2">Phase 3 of 4</p>
          <h1 className="text-3xl font-light text-white/80 mb-2">⚗️ Remix</h1>
          <p className="text-base text-white/25">Take each top idea and write a better version. Sharper. More specific. More actionable.</p>
          <p className="text-xs text-white/15 mt-1">{done} of {top.length} remixed</p>
        </div>

        <div className="space-y-3 mb-8">
          {top.map((idea, i) => (
            <div key={idea.id} className="glass rounded-xl overflow-hidden">
              <div className="px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-xs text-white/35 mb-1">Original #{i + 1}</p>
                    <p className="text-sm text-white/50 leading-relaxed">{idea.text}</p>
                  </div>
                  {!idea.remix && (
                    <button onClick={() => { setActive(idea.id); setText(''); }}
                      className="px-3 py-1.5 rounded-lg btn-primary text-xs flex-shrink-0">
                      Remix
                    </button>
                  )}
                </div>
                {idea.remix && (
                  <div className="mt-3 pt-3 border-t border-white/[0.04]">
                    <p className="text-xs text-amber-200/40 mb-1">Remixed version</p>
                    <p className="text-sm text-white/60 leading-relaxed">{idea.remix}</p>
                  </div>
                )}
              </div>
              {active === idea.id && (
                <div className="px-4 pb-3">
                  <textarea
                    className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg text-white/80 text-sm p-3 outline-none resize-none"
                    placeholder="Write a sharper, better version..."
                    rows={3}
                    value={text}
                    onChange={e => setText(e.target.value)}
                    autoFocus
                  />
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => setActive(null)} className="px-3 py-1.5 rounded-lg text-xs text-white/25 hover:text-white/45">Cancel</button>
                    <button onClick={() => { if (text.trim()) { onRemix(idea.id, text.trim()); setActive(null); } }}
                      disabled={!text.trim()} className="px-4 py-1.5 rounded-lg btn-primary text-xs disabled:btn-disabled">Save Remix</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {done === top.length && top.length > 0 && (
          <div className="text-center">
            <button onClick={onNext} className="px-8 py-3 rounded-xl btn-primary text-base">
              Challenge Your Thinking →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Challenge Phase ────────────────────────────────────────────────────────

function ChallengePhase({ ideas, onChallenge, onFinish }: {
  ideas: SoloIdea[];
  onChallenge: (id: string, weakness: string, fix: string) => void;
  onFinish: () => void;
}) {
  const top = ideas.filter(i => i.votes > 0);
  const [active, setActive] = useState<string | null>(null);
  const [weakness, setWeakness] = useState('');
  const [fix, setFix] = useState('');
  const done = top.filter(i => i.weakness).length;

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/20 mb-2">Phase 4 of 4</p>
          <h1 className="text-3xl font-light text-white/80 mb-2">⚔️ Challenge Yourself</h1>
          <p className="text-base text-white/25">For each idea: what could go wrong? Then: how would you fix it?</p>
          <p className="text-xs text-white/15 mt-1">{done} of {top.length} challenged</p>
        </div>

        <div className="space-y-3 mb-8">
          {top.map((idea, i) => (
            <div key={idea.id} className="glass rounded-xl overflow-hidden">
              <div className="px-4 py-3">
                <p className="text-xs text-white/35 mb-1">Idea #{i + 1}</p>
                <p className="text-sm text-white/50 leading-relaxed">{idea.remix || idea.text}</p>
                {idea.weakness && (
                  <div className="mt-3 pt-3 border-t border-white/[0.04] space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="text-red-300/40 text-xs mt-0.5">⚠️</span>
                      <p className="text-xs text-red-200/40 leading-relaxed">{idea.weakness}</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-emerald-300/40 text-xs mt-0.5">✅</span>
                      <p className="text-xs text-emerald-200/40 leading-relaxed">{idea.fix}</p>
                    </div>
                  </div>
                )}
                {!idea.weakness && (
                  <button onClick={() => { setActive(idea.id); setWeakness(''); setFix(''); }}
                    className="mt-2 px-3 py-1.5 rounded-lg btn-danger text-xs">
                    Challenge
                  </button>
                )}
              </div>
              {active === idea.id && (
                <div className="px-4 pb-3 space-y-3">
                  <div>
                    <label className="text-[10px] text-white/20 mb-1 block">What's the biggest risk or weakness?</label>
                    <textarea className="w-full bg-white/[0.03] border border-red-500/[0.1] rounded-lg text-white/70 text-sm p-3 outline-none resize-none"
                      placeholder="e.g. This only works if I have savings for 12 months..."
                      rows={2} value={weakness} onChange={e => setWeakness(e.target.value)} autoFocus />
                  </div>
                  <div>
                    <label className="text-[10px] text-white/20 mb-1 block">How would you mitigate that risk?</label>
                    <textarea className="w-full bg-white/[0.03] border border-emerald-500/[0.1] rounded-lg text-white/70 text-sm p-3 outline-none resize-none"
                      placeholder="e.g. I could freelance 2 days a week while building..."
                      rows={2} value={fix} onChange={e => setFix(e.target.value)} />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setActive(null)} className="px-3 py-1.5 rounded-lg text-xs text-white/25 hover:text-white/45">Cancel</button>
                    <button onClick={() => { if (weakness.trim() && fix.trim()) { onChallenge(idea.id, weakness.trim(), fix.trim()); setActive(null); } }}
                      disabled={!weakness.trim() || !fix.trim()} className="px-4 py-1.5 rounded-lg btn-primary text-xs disabled:btn-disabled">Save</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="text-center">
          <button onClick={onFinish}
            className="px-8 py-3 rounded-xl btn-primary text-base">
            See Your Results →
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Finish ─────────────────────────────────────────────────────────────────

function FinishScreen({ ideas, problem, name, onReset, onExport }: {
  ideas: SoloIdea[];
  problem: string;
  name: string;
  onReset: () => void;
  onExport: () => string;
}) {
  const top = ideas.filter(i => i.votes > 0);
  const challenged = top.filter(i => i.weakness);

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10 animate-scale-in">
          <div className="text-6xl mb-4">✨</div>
          <h1 className="text-3xl font-light text-white/80 mb-2">Done, {name}.</h1>
          <p className="text-base text-white/25">{top.length} curated ideas · {challenged.length} stress-tested · 0 meetings</p>
        </div>

        {/* Problem recap */}
        <div className="glass rounded-2xl p-6 mb-6">
          <p className="text-[10px] uppercase tracking-[0.15em] text-white/20 mb-2">You were thinking about</p>
          <p className="text-lg text-white/60 leading-relaxed">{problem}</p>
        </div>

        {/* Top ideas with remixes and challenges */}
        {top.length > 0 && (
          <div className="glass rounded-2xl p-6 mb-6">
            <p className="text-[10px] uppercase tracking-[0.15em] text-white/20 mb-4">Your Best Ideas</p>
            <div className="space-y-4">
              {top.map((idea, i) => (
                <div key={idea.id} className={cn(i < top.length - 1 && 'pb-4 border-b border-white/[0.04]')}>
                  <p className="text-base text-white/60 leading-relaxed mb-1">{idea.remix || idea.text}</p>
                  {idea.remix && <p className="text-xs text-white/20 mb-2">Remixed from: {idea.text.substring(0, 60)}…</p>}
                  {idea.weakness && (
                    <div className="mt-2 grid grid-cols-2 gap-3">
                      <div className="bg-red-500/[0.03] border border-red-500/[0.06] rounded-lg p-3">
                        <p className="text-[10px] text-red-300/40 mb-1">⚠️ Risk</p>
                        <p className="text-xs text-red-200/50 leading-relaxed">{idea.weakness}</p>
                      </div>
                      <div className="bg-emerald-500/[0.03] border border-emerald-500/[0.06] rounded-lg p-3">
                        <p className="text-[10px] text-emerald-300/40 mb-1">✅ Mitigation</p>
                        <p className="text-xs text-emerald-200/50 leading-relaxed">{idea.fix}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* What's next */}
        <div className="glass rounded-2xl p-6 mb-6 text-center">
          <p className="text-sm text-white/40 leading-relaxed mb-1">Now pick ONE idea and do ONE thing about it this week.</p>
          <p className="text-xs text-white/15">The best brainstorm means nothing without action.</p>
        </div>

        <div className="flex gap-3">
          <button onClick={onReset} className="flex-1 h-11 rounded-xl glass-light text-sm text-white/35 hover:text-white/55 transition-colors">
            New Session
          </button>
          <button onClick={() => {
            const report = onExport();
            const blob = new Blob([report], { type: 'text/markdown' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `solo-brainstorm-${new Date().toISOString().split('T')[0]}.md`;
            a.click();
            URL.revokeObjectURL(url);
          }} className="flex-1 h-11 rounded-xl btn-primary text-sm">
            Export Report ↓
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Solo Mode ─────────────────────────────────────────────────────────

export function SoloMode() {
  const [phase, setPhase] = useState<Phase>('setup');
  const [name, setName] = useState('');
  const [problem, setProblem] = useState('');
  const [ideas, setIdeas] = useState<SoloIdea[]>([]);
  const [topIds, setTopIds] = useState<Set<string>>(new Set());

  const handleStart = (n: string, p: string) => {
    setName(n);
    setProblem(p);
    setPhase('brainstorm');
  };

  const handleAddIdea = (text: string) => {
    setIdeas(prev => [...prev, { id: nid(), text, votes: 0 }]);
  };

  const handleVote = (id: string) => {
    setIdeas(prev => prev.map(i => i.id === id ? { ...i, votes: i.votes > 0 ? 0 : 1 } : i));
    setTopIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleRemix = (id: string, text: string) => {
    setIdeas(prev => prev.map(i => i.id === id ? { ...i, remix: text } : i));
  };

  const handleChallenge = (id: string, weakness: string, fix: string) => {
    setIdeas(prev => prev.map(i => i.id === id ? { ...i, weakness, fix } : i));
  };

  const handleExport = () => {
    const top = ideas.filter(i => i.votes > 0);
    const lines = [
      `# Solo Brainstorm — ${name}`,
      `> ${new Date().toISOString().split('T')[0]} · Problem: ${problem}`,
      '',
      '## Curated Ideas',
      ...top.map((idea, i) => [
        `### ${i + 1}. ${idea.remix || idea.text}`,
        idea.remix ? `- Original: ${idea.text}` : '',
        idea.weakness ? `- **Risk:** ${idea.weakness}` : '',
        idea.fix ? `- **Mitigation:** ${idea.fix}` : '',
        '',
      ].filter(Boolean).join('\n')),
      '---',
      '',
      '## Next Steps',
      'Pick ONE idea. Do ONE thing this week.',
      '',
      '| Idea | Action | Deadline |',
      '|------|--------|----------|',
      ...top.map(i => `| ${(i.remix || i.text).substring(0, 40)}… | _[fill in]_ | _[date]_ |`),
    ];
    return lines.join('\n');
  };

  const handleReset = () => {
    setPhase('setup');
    setIdeas([]);
    setTopIds(new Set());
  };

  switch (phase) {
    case 'setup':
      return <SetupScreen onStart={handleStart} />;
    case 'brainstorm':
      return <BrainstormPhase ideas={ideas} onAdd={handleAddIdea} onNext={() => setPhase('curate')} />;
    case 'curate':
      return <CuratePhase ideas={ideas} onVote={handleVote} onNext={() => setPhase('remix')} />;
    case 'remix':
      return <RemixPhase ideas={ideas} onRemix={handleRemix} onNext={() => setPhase('challenge')} />;
    case 'challenge':
      return <ChallengePhase ideas={ideas} onChallenge={handleChallenge} onFinish={() => setPhase('finish')} />;
    case 'finish':
      return <FinishScreen ideas={ideas} problem={problem} name={name} onReset={handleReset} onExport={handleExport} />;
  }
}

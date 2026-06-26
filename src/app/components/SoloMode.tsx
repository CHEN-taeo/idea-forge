import { useState, useEffect } from 'react';
import { cn } from './ui/utils';
import { brand, reportFooter, coachLabel } from '../lib/brand';
import { fetchSoloAngles, fetchSmartAction, fetchSoloChallenge } from '../lib/aiClient';

interface SoloIdea {
  id: string;
  text: string;
  votes: number;
}

type Phase = 'setup' | 'angles' | 'brainstorm' | 'curate' | 'commit' | 'finish';

let _id = 0;
function nid() { return `s_${++_id}`; }

function SetupScreen({ onStart, seedProblem = '' }: { onStart: (name: string, problem: string) => void; seedProblem?: string }) {
  const [name, setName] = useState('');
  const [problem, setProblem] = useState(seedProblem);

  return (
    <div className="if-page px-4 py-8 max-w-md mx-auto">
      <p className="if-eyebrow mb-2">{brand.soloName}</p>
      <h1 className="font-display text-2xl text-[var(--if-ink)] mb-2">一个人，15 分钟想明白</h1>
      <p className="if-lead mb-8">{brand.slogan}</p>

      <div className="if-card--flat p-5 space-y-4 mb-6">
        <div>
          <label className="if-field-label">你的名字</label>
          <input
            className="if-field-input"
            placeholder="例如：小陈"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>
        <div>
          <label className="if-field-label">你在想什么？</label>
          <textarea
            className="if-field-textarea"
            placeholder="例如：该不该辞职创业？Q3 产品方向怎么选？"
            value={problem}
            onChange={e => setProblem(e.target.value)}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={() => onStart(name || '我', problem)}
        disabled={!problem.trim()}
        className="w-full min-h-12 rounded-[var(--radius)] btn-primary text-base disabled:btn-disabled"
      >
        开始{brand.soloName} →
      </button>
    </div>
  );
}

function AnglesPhase({ problem, angles, mode, loading, onNext }: {
  problem: string;
  angles: string[];
  mode: string;
  loading: boolean;
  onNext: () => void;
}) {
  return (
    <div className="if-page px-4 py-8 max-w-2xl mx-auto">
      <p className="if-eyebrow mb-2">第 1 步 · 换角度想</p>
      <h1 className="font-display text-2xl text-[var(--if-ink)] mb-2">💭 {coachLabel(mode)}</h1>
      <p className="if-lead mb-8">{problem}</p>

      {loading ? (
        <div className="if-card--flat p-6 text-center text-sm text-[var(--if-muted)] mb-8">
          正在生成思考角度…
        </div>
      ) : (
        <div className="space-y-3 mb-8">
          {angles.map((angle, i) => (
            <div
              key={i}
              className="if-card--flat px-4 py-3 text-sm text-[var(--if-ink-soft)] leading-relaxed"
            >
              {angle}
            </div>
          ))}
        </div>
      )}

      <p className="text-center text-xs text-[var(--if-muted)] mb-6">
        带着这些角度，先把脑子里的想法都写出来。
      </p>
      <div className="text-center">
        <button
          type="button"
          onClick={onNext}
          disabled={loading || angles.length === 0}
          className="px-8 py-3 rounded-xl btn-primary text-base disabled:btn-disabled"
        >
          开始写想法 →
        </button>
      </div>
    </div>
  );
}

function BrainstormPhase({ ideas, angles, onAdd, onNext }: {
  ideas: SoloIdea[];
  angles: string[];
  onAdd: (text: string) => void;
  onNext: () => void;
}) {
  const [text, setText] = useState('');

  return (
    <div className="if-page px-4 py-8 max-w-2xl mx-auto">
      <p className="if-eyebrow mb-2">第 2 步 · 写想法</p>
      <h1 className="font-display text-2xl text-[var(--if-ink)] mb-1">💡 先把一切写出来</h1>
      <p className="text-xs text-[var(--if-muted)] mb-6">
        数量优先，至少 3 条 · 已有 {ideas.length} 条
      </p>

      {angles.length > 0 && (
        <div className="if-card--flat p-3 mb-4 space-y-1">
          <p className="if-eyebrow mb-1">思考角度</p>
          {angles.map((a, i) => (
            <p key={i} className="text-[11px] text-[var(--if-muted)] leading-relaxed">{a}</p>
          ))}
        </div>
      )}

      <div className="if-card--flat p-5 mb-4">
        <textarea
          className="w-full bg-transparent text-[var(--if-ink)] text-base placeholder:text-[var(--if-muted-soft)] outline-none resize-none"
          placeholder="写一条想法，按 Enter 添加…"
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
          <span className="text-[10px] text-[var(--if-muted-soft)]">Enter 添加</span>
          <button
            type="button"
            onClick={() => { if (text.trim()) { onAdd(text.trim()); setText(''); } }}
            disabled={!text.trim()}
            className="px-4 py-1.5 rounded-lg btn-primary text-sm disabled:btn-disabled"
          >
            添加
          </button>
        </div>
      </div>

      {ideas.length > 0 && (
        <div className="space-y-2 mb-6">
          {ideas.map((idea, i) => (
            <div key={idea.id} className="if-card--flat px-4 py-3 flex gap-3">
              <span className="text-[var(--if-muted-soft)] text-sm">{i + 1}.</span>
              <p className="text-sm text-[var(--if-ink-soft)] leading-relaxed flex-1">{idea.text}</p>
            </div>
          ))}
        </div>
      )}

      {ideas.length >= 3 && (
        <div className="text-center">
          <button type="button" onClick={onNext} className="px-8 py-3 rounded-xl btn-primary text-base">
            筛选最好的 →
          </button>
        </div>
      )}
    </div>
  );
}

function CuratePhase({ ideas, onVote, onNext }: {
  ideas: SoloIdea[];
  onVote: (id: string) => void;
  onNext: () => void;
}) {
  const selected = ideas.filter(i => i.votes > 0).length;

  return (
    <div className="if-page px-4 py-8 max-w-2xl mx-auto">
      <p className="if-eyebrow mb-2">第 3 步 · 筛选</p>
      <h1 className="font-display text-2xl text-[var(--if-ink)] mb-2">🎯 留下 1–3 条</h1>
      <p className="text-sm text-[var(--if-muted)]">点击标记你想深入的那几条</p>
      <p className="text-xs text-[var(--if-muted-soft)] mt-1 mb-8">已选 {selected} 条</p>

      <div className="space-y-2 mb-8">
        {ideas.map((idea, i) => (
          <button
            key={idea.id}
            type="button"
            onClick={() => onVote(idea.id)}
            className={cn(
              'w-full text-left if-card--flat px-4 py-3 flex items-start gap-3 transition-all',
              idea.votes > 0 && 'border-[var(--if-accent)] bg-[var(--if-accent-soft)]'
            )}
          >
            <span className={cn('text-sm', idea.votes > 0 ? 'text-[var(--if-accent)]' : 'text-[var(--if-muted-soft)]')}>
              {i + 1}.
            </span>
            <p className={cn(
              'text-sm leading-relaxed flex-1',
              idea.votes > 0 ? 'text-[var(--if-ink)]' : 'text-[var(--if-ink-soft)]'
            )}>
              {idea.text}
            </p>
            {idea.votes > 0 && <span className="text-[var(--if-accent)] text-xs">★</span>}
          </button>
        ))}
      </div>

      <div className="text-center">
        <button
          type="button"
          onClick={onNext}
          disabled={selected === 0}
          className="px-8 py-3 rounded-xl btn-primary text-base disabled:btn-disabled"
        >
          认领行动 →
        </button>
      </div>
    </div>
  );
}

function CommitPhase({ ideas, problem, name, onFinish }: {
  ideas: SoloIdea[];
  problem: string;
  name: string;
  onFinish: (ideaId: string, action: string) => void;
}) {
  const top = ideas.filter(i => i.votes > 0);
  const [selectedId, setSelectedId] = useState<string | null>(top[0]?.id ?? null);
  const [action, setAction] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [challengeLoading, setChallengeLoading] = useState(false);
  const [aiHint, setAiHint] = useState<string | null>(null);
  const [challengeQ, setChallengeQ] = useState<string | null>(null);

  const selected = top.find(i => i.id === selectedId);

  useEffect(() => {
    setChallengeQ(null);
  }, [selectedId]);

  const runChallenge = async () => {
    if (!selected) return;
    setChallengeLoading(true);
    try {
      const { question } = await fetchSoloChallenge(selected.text, problem);
      setChallengeQ(question);
    } finally {
      setChallengeLoading(false);
    }
  };

  const handleAiAction = async () => {
    if (!selected || aiLoading) return;
    setAiLoading(true);
    setAiHint(null);
    try {
      const { action: suggested, mode } = await fetchSmartAction(selected.text, problem, name);
      setAction(suggested);
      setAiHint(mode === 'ai' ? 'AI 建议（可修改）' : '离线提示（可修改）');
    } catch {
      setAiHint('生成失败，请手动填写');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="if-page px-4 py-8 max-w-2xl mx-auto">
      <p className="if-eyebrow mb-2 text-[var(--if-accent)]">第 4 步 · 认领</p>
      <h1 className="font-display text-2xl text-[var(--if-ink)] mb-2">☯ 选一条，领一件事</h1>
      <p className="text-sm text-[var(--if-muted)] mb-8">14 天内可执行的具体行动</p>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-none">
        {top.map(idea => (
          <button
            key={idea.id}
            type="button"
            onClick={() => { setSelectedId(idea.id); setAction(''); setAiHint(null); setChallengeQ(null); }}
            className={cn(
              'flex-shrink-0 max-w-[200px] text-left rounded-xl p-3 border transition-all',
              selectedId === idea.id
                ? 'bg-[var(--if-accent-soft)] border-[var(--if-accent-border)]'
                : 'if-card--flat'
            )}
          >
            <p className="text-xs text-[var(--if-ink-soft)] line-clamp-3 leading-relaxed">{idea.text}</p>
          </button>
        ))}
      </div>

      {selected && (
        <div className="if-card p-5 space-y-3">
          {challengeQ && (
            <div className="if-card--flat p-3">
              <p className="text-[10px] text-[var(--if-muted)] mb-1">{coachLabel('template')} · 追问</p>
              <p className="text-sm text-[var(--if-ink-soft)] leading-relaxed">{challengeQ}</p>
            </div>
          )}
          <div className="flex gap-3 flex-wrap items-center">
            <button
              type="button"
              onClick={runChallenge}
              disabled={challengeLoading}
              className="text-[11px] text-[var(--if-muted)] hover:text-[var(--if-ink-soft)] disabled:opacity-30"
            >
              {challengeLoading ? '⏳…' : '💬 AI 追问一句'}
            </button>
            <button
              type="button"
              onClick={handleAiAction}
              disabled={aiLoading}
              className="text-[11px] text-[var(--if-accent)] hover:opacity-80 disabled:opacity-30"
            >
              {aiLoading ? '⏳…' : '🤖 AI 写行动'}
            </button>
            {aiHint && <span className="text-[10px] text-[var(--if-muted-soft)]">{aiHint}</span>}
          </div>
          <textarea
            className="if-field-textarea min-h-[80px]"
            placeholder="我承诺在 14 天内做的一件具体的事…"
            value={action}
            onChange={e => setAction(e.target.value)}
            maxLength={200}
          />
          <button
            type="button"
            onClick={() => selectedId && action.trim().length >= 4 && onFinish(selectedId, action.trim())}
            disabled={!action.trim() || action.trim().length < 4}
            className="w-full h-11 rounded-xl btn-primary text-sm disabled:btn-disabled"
          >
            ✍️ 确认认领
          </button>
        </div>
      )}
    </div>
  );
}

function FinishScreen({ ideas, problem, name, commitment, onReset, onExport }: {
  ideas: SoloIdea[];
  problem: string;
  name: string;
  commitment: { ideaText: string; action: string };
  onReset: () => void;
  onExport: () => string;
}) {
  const top = ideas.filter(i => i.votes > 0);

  return (
    <div className="if-page px-4 py-8 max-w-2xl mx-auto">
      <div className="text-center mb-10 animate-scale-in">
        <div className="if-mark text-3xl">☯</div>
        <h1 className="font-display text-2xl text-[var(--if-ink)] mb-2">{name}，这件事你领下了。</h1>
        <p className="text-sm text-[var(--if-muted)]">{top.length} 条筛选 · 1 项承诺 · 0 次会议</p>
      </div>

      <div className="if-card p-6 mb-4">
        <p className="if-field-label">讨论的问题</p>
        <p className="text-base text-[var(--if-ink-soft)] leading-relaxed">{problem}</p>
      </div>

      <div className="if-card p-6 mb-4 border-[rgba(45,106,79,0.25)] bg-[rgba(45,106,79,0.06)]">
        <p className="if-field-label text-[var(--if-success)]">你的承诺</p>
        <p className="text-xs text-[var(--if-muted)] mb-2">基于：{commitment.ideaText}</p>
        <p className="text-base text-[var(--if-ink)] leading-relaxed">{commitment.action}</p>
        <p className="text-[11px] text-[var(--if-muted-soft)] mt-3">📅 14 天后，记得回头看一眼。</p>
      </div>

      {top.length > 0 && (
        <div className="if-card p-6 mb-6">
          <p className="if-field-label">其他候选想法</p>
          <div className="space-y-2">
            {top.filter(i => i.text !== commitment.ideaText).map(idea => (
              <p key={idea.id} className="text-sm text-[var(--if-muted)] leading-relaxed">{idea.text}</p>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <button type="button" onClick={onReset} className="flex-1 h-11 rounded-xl if-btn-secondary text-sm">
          再来一次
        </button>
        <button
          type="button"
          onClick={() => {
            const report = onExport();
            const blob = new Blob([report], { type: 'text/markdown' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${brand.soloName}-${new Date().toISOString().split('T')[0]}.md`;
            a.click();
            URL.revokeObjectURL(url);
          }}
          className="flex-1 h-11 rounded-xl btn-primary text-sm"
        >
          导出报告 ↓
        </button>
      </div>
    </div>
  );
}

export function SoloMode({ seedProblem = '' }: { seedProblem?: string }) {
  const [phase, setPhase] = useState<Phase>('setup');
  const [name, setName] = useState('');
  const [problem, setProblem] = useState('');
  const [ideas, setIdeas] = useState<SoloIdea[]>([]);
  const [angles, setAngles] = useState<string[]>([]);
  const [anglesMode, setAnglesMode] = useState('template');
  const [anglesLoading, setAnglesLoading] = useState(false);
  const [commitment, setCommitment] = useState<{ ideaText: string; action: string } | null>(null);

  const handleStart = async (n: string, p: string) => {
    setName(n);
    setProblem(p);
    setPhase('angles');
    setAnglesLoading(true);
    setAngles([]);
    try {
      const { angles: a, mode } = await fetchSoloAngles(p);
      setAngles(a);
      setAnglesMode(mode);
    } catch {
      setAngles([
        '💭 谁最痛苦？这个问题让谁夜不能寐？',
        '⚡ 如果只有一周时间和零预算，你会怎么做？',
        '🔮 5 年后回看，你会后悔没做什么？',
      ]);
      setAnglesMode('template');
    } finally {
      setAnglesLoading(false);
    }
  };

  const handleExport = () => {
    if (!commitment) return '';
    const date = new Date().toISOString().split('T')[0];
    const top = ideas.filter(i => i.votes > 0);
    return `# ${brand.soloName} — ${name}
> ${date} · ${brand.hostName} · ${brand.productName}

---

## 思考的问题
**${problem}**

---

## 思考角度
${angles.map(a => `- ${a}`).join('\n')}

---

## 写下的想法
${ideas.map((i, n) => `${n + 1}. ${i.text}${i.votes > 0 ? ' ★' : ''}`).join('\n')}

---

## ☯ 我的承诺
**构想：** ${commitment.ideaText}

**行动：** ${commitment.action}

**期限：** 14 天内

---

## 其他候选
${top.filter(i => i.text !== commitment.ideaText).map(i => `- ${i.text}`).join('\n') || '_无_'}
${reportFooter(date)}`;
  };

  const handleReset = () => {
    setPhase('setup');
    setIdeas([]);
    setAngles([]);
    setCommitment(null);
    _id = 0;
  };

  switch (phase) {
    case 'setup':
      return <SetupScreen onStart={handleStart} seedProblem={seedProblem} />;
    case 'angles':
      return (
        <AnglesPhase
          problem={problem}
          angles={angles}
          mode={anglesMode}
          loading={anglesLoading}
          onNext={() => setPhase('brainstorm')}
        />
      );
    case 'brainstorm':
      return (
        <BrainstormPhase
          ideas={ideas}
          angles={angles}
          onAdd={(text) => setIdeas(prev => [...prev, { id: nid(), text, votes: 0 }])}
          onNext={() => setPhase('curate')}
        />
      );
    case 'curate':
      return (
        <CuratePhase
          ideas={ideas}
          onVote={(id) => setIdeas(prev => prev.map(i => i.id === id ? { ...i, votes: i.votes > 0 ? 0 : 1 } : i))}
          onNext={() => setPhase('commit')}
        />
      );
    case 'commit':
      return (
        <CommitPhase
          ideas={ideas}
          problem={problem}
          name={name}
          onFinish={(ideaId, action) => {
            const idea = ideas.find(i => i.id === ideaId);
            if (idea) {
              setCommitment({ ideaText: idea.text, action });
              setPhase('finish');
            }
          }}
        />
      );
    case 'finish':
      return commitment ? (
        <FinishScreen
          ideas={ideas}
          problem={problem}
          name={name}
          commitment={commitment}
          onReset={handleReset}
          onExport={handleExport}
        />
      ) : null;
  }
}

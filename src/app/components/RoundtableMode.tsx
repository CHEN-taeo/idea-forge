import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './ui/utils';
import { brand } from '../lib/brand';
import { BrandMark } from './BrandMark';
import { PERSONAS, getPersona, type Persona } from '../data/personas';
import { fetchPersonaReply, fetchPersonaDispatch, fetchRoundtableSummary, fetchSmartAction, fetchAiStatus, type PersonaTurn, type RoundtableSummary, type AiMode, type DispatchMode } from '../lib/aiClient';
import { PersonaPortrait } from './PersonaPortrait';
import { FireCore } from './FireCore';
import { guestSeats, userSeat, tableEllipse } from '../lib/roundtableLayout';

interface Msg {
  id: string;
  speakerId: string;
  name: string;
  text: string;
  color: string;
  replyMode?: AiMode;
}

const PERSONA_DISCLAIMER = brand.roundtableDisclaimer;

const MAX_PICK = 3;
const USER_COLOR = '#fbbf24';

const PRESETS = [
  { label: '创业三角', desc: '颠覆 × 产品 × 算力', ids: ['musk', 'jobs', 'huang'] },
  { label: '思辨之夜', desc: '诘问 × 批判 × 清醒', ids: ['socrates', 'marx', 'luxun'] },
  { label: '悟道组合', desc: '好奇 × 无为 × 讲清楚', ids: ['feynman', 'laozi', 'socrates'] },
];

const STARTER_PROMPTS = [
  '我目前最纠结的是……',
  '如果只能选一个方向，你会怎么选？',
  '请从各自的角度，给这条路径泼一盆冷水。',
];

const PHRASE_TEMPLATES = [
  { label: '复述', text: '我先复述一下你的观点：' },
  { label: '是的，而且', text: '是的，而且我还想到…' },
  { label: '我不同意', text: '我不同意，因为…' },
  { label: '回到核心', text: '我们似乎跑题了，回到核心问题：' },
  { label: 'Steel-man', text: '如果我理解对你的意思是…' },
];

const DEBRIEF_QUESTIONS = [
  { id: 'speak', text: '这次讨论里，我敢表达不同意见' },
  { id: 'heard', text: '我感到被倾听' },
  { id: 'safe', text: '我不担心因说错而被否定' },
] as const;

let _id = 0;
function nid() { return `rt_${++_id}`; }

function ReplyModeBadge({ mode }: { mode: AiMode }) {
  return (
    <span
      className={cn(
        'inline-flex items-center text-[9px] px-1.5 py-0.5 rounded-md tracking-wide',
        mode === 'ai'
          ? 'text-[var(--if-success)] bg-[rgba(45,106,79,0.1)] border border-[rgba(45,106,79,0.2)]'
          : 'text-[var(--if-muted-soft)] bg-[var(--if-surface)] border border-[var(--if-line)]'
      )}
    >
      {mode === 'ai' ? 'AI · 风格演绎' : '离线模板'}
    </span>
  );
}

function AiStatusChip({ enabled, model }: { enabled: boolean; model?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border',
        enabled
          ? 'text-[var(--if-success)] bg-[rgba(45,106,79,0.08)] border-[rgba(45,106,79,0.2)]'
          : 'text-[var(--if-muted-soft)] bg-[var(--if-surface)] border-[var(--if-line)]'
      )}
      title={enabled ? `AI 在线${model ? ` · ${model}` : ''}` : '未配置 API Key，嘉宾回复使用离线模板'}
    >
      <span className={cn('size-1.5 rounded-full', enabled ? 'bg-[var(--if-success)]' : 'bg-[var(--if-muted-soft)]')} />
      {enabled ? 'AI 在线' : '离线模板模式'}
    </span>
  );
}

function DispatchNoteBar({
  note,
  mode,
  expanded,
  onToggle,
}: {
  note: string;
  mode: DispatchMode;
  expanded: boolean;
  onToggle: () => void;
}) {
  if (!note) return null;
  const prefix =
    mode === 'manual' ? '指定接话' : mode === 'ai' ? 'AI 调度' : '离线调度';

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-lg mb-4"
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left px-3.5 py-2.5 rounded-xl if-card--flat hover:border-[var(--if-accent-border)] transition-colors"
      >
        <div className="flex items-center justify-between gap-2">
          <span className="if-eyebrow">{prefix}</span>
          <span className="text-[10px] text-[var(--if-muted-soft)]">{expanded ? '收起' : '展开'}</span>
        </div>
        <p className={cn('text-[11px] text-[var(--if-muted)] leading-relaxed mt-1', !expanded && 'line-clamp-1')}>
          {note}
        </p>
      </button>
    </motion.div>
  );
}

function PersonaDisclaimer({ className }: { className?: string }) {
  return (
    <p
      className={cn(
        'text-[10px] text-[var(--if-muted-soft)] leading-relaxed px-3 py-2 rounded-xl if-card--flat',
        className
      )}
    >
      {PERSONA_DISCLAIMER}
    </p>
  );
}

function parseMention(text: string, personas: Persona[]): { text: string; targetId?: string } {
  for (const p of personas) {
    if (text.includes(`@${p.name}`)) return { text, targetId: p.id };
  }
  for (const p of personas) {
    if (text.toLowerCase().includes(`@${p.id}`)) return { text, targetId: p.id };
  }
  return { text };
}

function lastSpeakerName(history: PersonaTurn[]): string {
  return history.length ? history[history.length - 1].speaker : '';
}

interface DebriefScores {
  speak: number;
  heard: number;
  safe: number;
  insight: string;
}

// ---------------------------------------------------------------------------
// 消息气泡
// ---------------------------------------------------------------------------
function MessageBubble({ msg, index }: { msg: Msg; index: number }) {
  const mine = msg.speakerId === 'me';
  const persona = mine ? null : getPersona(msg.speakerId);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 420, damping: 32, delay: Math.min(index * 0.04, 0.12) }}
      className={cn('flex gap-3', mine ? 'flex-row-reverse' : 'flex-row')}
    >
      {!mine && persona && (
        <div className="flex-shrink-0 pt-1">
          <PersonaPortrait persona={persona} color={msg.color} size={36} />
        </div>
      )}
      <div className={cn('max-w-[min(78%,420px)]', mine && 'flex flex-col items-end')}>
        <p
          className={cn('text-[10px] mb-1.5 font-medium tracking-wide flex items-center gap-2 flex-wrap', mine ? 'text-[var(--if-accent)] justify-end' : '')}
          style={!mine ? { color: `${msg.color}cc` } : undefined}
        >
          <span>{msg.name}</span>
          {!mine && msg.replyMode && <ReplyModeBadge mode={msg.replyMode} />}
        </p>
        <div
          className={cn(
            'if-bubble',
            mine && 'if-bubble--me rounded-br-md',
            !mine && 'rounded-bl-md'
          )}
        >
          {msg.text}
        </div>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// 配置页
// ---------------------------------------------------------------------------
function SetupScreen({
  onStart,
  seedTopic = '',
}: {
  onStart: (topic: string, name: string, ids: string[]) => void;
  seedTopic?: string;
}) {
  const [topic, setTopic] = useState(seedTopic);
  const [name, setName] = useState('');
  const [picked, setPicked] = useState<string[]>([]);
  const [step, setStep] = useState<1 | 2>(1);

  const toggle = (id: string) => {
    setPicked(prev =>
      prev.includes(id)
        ? prev.filter(x => x !== id)
        : prev.length >= MAX_PICK ? prev : [...prev, id]
    );
  };

  const applyPreset = (ids: string[]) => setPicked(ids.slice(0, MAX_PICK));

  const canNext = topic.trim().length > 0;
  const canStart = canNext && picked.length > 0;

  return (
    <div className="min-h-screen if-page">
      <div className="max-w-xl mx-auto px-5 pb-28 pt-10">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="if-mark mx-auto mb-5 rt-float">
            <span className="text-3xl">🪑</span>
          </div>
          <h1 className="text-[1.65rem] font-light text-[var(--if-ink)] tracking-tight mb-2 font-display">{brand.roundtableName}</h1>
          <p className="text-sm text-[var(--if-muted)] max-w-xs mx-auto leading-relaxed">
            {brand.roundtableDesc}
          </p>
          <PersonaDisclaimer className="max-w-sm mx-auto mt-5 text-left" />
        </motion.div>

        {/* 步骤指示 */}
        <div className="flex items-center justify-center gap-3 mb-8">
          {([1, 2] as const).map(s => (
            <button
              key={s}
              type="button"
              onClick={() => s === 1 ? setStep(1) : canNext && setStep(2)}
              className="flex items-center gap-2 group"
            >
              <span className={cn(
                'size-7 rounded-full text-xs flex items-center justify-center transition-all',
                step === s
                  ? 'bg-[var(--if-accent-soft)] border border-[var(--if-accent-border)] text-[var(--if-accent)]'
                  : step > s
                    ? 'bg-[rgba(45,106,79,0.1)] border border-[rgba(45,106,79,0.25)] text-[var(--if-success)]'
                    : 'bg-[var(--if-surface)] border border-[var(--if-line)] text-[var(--if-muted-soft)]'
              )}>
                {step > s ? '✓' : s}
              </span>
              <span className={cn(
                'text-[11px] hidden sm:inline',
                step === s ? 'text-[var(--if-ink-soft)]' : 'text-[var(--if-muted-soft)]'
              )}>
                {s === 1 ? '定话题' : '选嘉宾'}
              </span>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              className="space-y-5"
            >
              <div className="if-card p-5 space-y-4">
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
                  <label className="if-field-label">{brand.roundtableTopicLabel}</label>
                  <textarea
                    className="if-field-textarea"
                    placeholder="例如：该不该辞职创业？AI 时代我该学什么？"
                    value={topic}
                    onChange={e => setTopic(e.target.value)}
                  />
                </div>
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!canNext}
                className="w-full h-12 rounded-xl btn-primary text-sm disabled:btn-disabled"
              >
                {brand.roundtableNextGuests}
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
            >
              {/* 话题摘要 */}
              <div className="mb-5 px-4 py-3 rounded-xl if-card--flat">
                <p className="if-eyebrow mb-1">话题</p>
                <p className="text-sm text-[var(--if-muted)] leading-relaxed line-clamp-2">{topic}</p>
              </div>

              <div className="mb-5">
                <p className="if-field-label">{brand.roundtablePresetLabel}</p>
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {PRESETS.map(preset => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => applyPreset(preset.ids)}
                      className="flex-shrink-0 px-3.5 py-2 rounded-xl if-card--flat hover:border-[var(--if-accent-border)] transition-all text-left"
                    >
                      <p className="text-xs text-[var(--if-ink-soft)]">{preset.label}</p>
                      <p className="text-[10px] text-[var(--if-muted)] mt-0.5">{preset.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* 迷你圆桌预览 */}
              {picked.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mb-5 overflow-hidden"
                >
                  <p className="if-field-label mb-2">入席预览</p>
                  <div className="relative h-[140px] rounded-2xl if-card--flat overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center opacity-30">
                      <div className="size-20 rounded-full border border-dashed border-amber-300/20" />
                      <span className="absolute"><FireCore size={28} /></span>
                    </div>
                    {picked.map((id, i) => {
                      const p = getPersona(id);
                      if (!p) return null;
                      const pos = guestSeats(picked.length)[i];
                      return (
                        <div
                          key={id}
                          className="absolute"
                          style={{ ...pos, transform: 'translate(-50%, -50%) scale(0.85)' }}
                        >
                          <PersonaPortrait persona={p} color={p.color} size={40} active />
                        </div>
                      );
                    })}
                    <div
                      className="absolute"
                      style={{ ...userSeat(), transform: 'translate(-50%, -50%) scale(0.8)' }}
                    >
                      <PersonaPortrait userInitial={name || '我'} color={USER_COLOR} size={36} />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* 人物卡片 */}
              <div className="mb-4 flex items-center justify-between">
                <p className="if-field-label">
                  选择入席嘉宾
                </p>
                <span className="text-[10px] tabular-nums text-[var(--if-accent)]">{picked.length}/{MAX_PICK}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-6">
                {PERSONAS.map((p, i) => {
                  const on = picked.includes(p.id);
                  const full = !on && picked.length >= MAX_PICK;
                  const seatNum = on ? picked.indexOf(p.id) + 1 : 0;
                  return (
                    <motion.button
                      key={p.id}
                      type="button"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      onClick={() => toggle(p.id)}
                      disabled={full}
                      className={cn(
                        'if-persona-item relative transition-all duration-300',
                        on && 'if-persona-item--on scale-[1.01]',
                        full && 'opacity-35 pointer-events-none'
                      )}
                    >
                      {on && (
                        <span
                          className="absolute top-2.5 right-2.5 size-5 rounded-full text-[10px] font-medium flex items-center justify-center text-[#1c1410]"
                          style={{ background: p.color }}
                        >
                          {seatNum}
                        </span>
                      )}
                      <PersonaPortrait persona={p} color={p.color} size={48} active={on} />
                      <div className="min-w-0 flex-1 pt-0.5">
                        <p className="text-sm text-[var(--if-ink)] font-normal">{p.name}</p>
                        <p className="text-[10px] mt-0.5 text-[var(--if-muted)]">{p.title}</p>
                        <p className="text-[11px] text-[var(--if-muted)] mt-1.5 leading-relaxed line-clamp-2">{p.blurb}</p>
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="h-12 px-5 rounded-xl if-btn-secondary text-sm text-[var(--if-muted)] hover:text-[var(--if-ink-soft)]"
                >
                  返回
                </button>
                <button
                  onClick={() => onStart(topic.trim(), name.trim() || '我', picked)}
                  disabled={!canStart}
                  className="flex-1 h-12 rounded-xl btn-primary text-sm disabled:btn-disabled"
                >
                  {brand.roundtableIgnite}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 圆桌场景 · 环形布局
// ---------------------------------------------------------------------------
function RoundTable({
  personas,
  userName,
  thinkingId,
}: {
  personas: Persona[];
  userName: string;
  thinkingId: string | null;
}) {
  const seats = useMemo(() => guestSeats(personas.length), [personas.length]);
  const ellipse = useMemo(() => tableEllipse(personas.length), [personas.length]);
  const uSeat = userSeat();

  return (
    <div className="relative mx-auto w-full max-w-md aspect-[4/3] min-h-[210px] max-h-[260px]">
      {/* 桌面光晕 — 随人数缩放 */}
      <motion.div
        className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 aspect-square pointer-events-none"
        style={{ top: ellipse.top }}
        animate={{ width: ellipse.w }}
        transition={{ type: 'spring', stiffness: 200, damping: 28 }}
      >
        <div
          className="absolute inset-0 rounded-full opacity-45"
          style={{
            background: 'radial-gradient(circle, rgba(251,146,60,0.28) 0%, rgba(251,191,36,0.1) 42%, transparent 72%)',
          }}
        />
        <div
          className="absolute inset-[16%] rounded-full border border-amber-300/15"
          style={{ boxShadow: 'inset 0 0 48px rgba(251,191,36,0.08), 0 0 24px rgba(251,146,60,0.06)' }}
        />
        {/* 座位连线 — 虚线弧 */}
        <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 100 100" preserveAspectRatio="none">
          <ellipse cx="50" cy="50" rx="38" ry="30" fill="none" stroke="rgba(251,191,36,0.35)" strokeWidth="0.4" strokeDasharray="2 3" />
        </svg>
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rt-fire-core">
          <FireCore size={44} />
        </div>
      </motion.div>

      {/* 嘉宾 — 动画换座 */}
      {personas.map((p, i) => {
        const pos = seats[i];
        const speaking = thinkingId === p.id;
        return (
          <motion.div
            key={p.id}
            className="absolute z-10"
            initial={{ opacity: 0, scale: 0.75 }}
            animate={{
              opacity: 1,
              scale: speaking ? 1.05 : 1,
              left: pos.left,
              top: pos.top,
            }}
            transition={{
              left: { type: 'spring', stiffness: 180, damping: 22 },
              top: { type: 'spring', stiffness: 180, damping: 22 },
              scale: { duration: 0.25 },
              opacity: { delay: 0.1 + i * 0.06 },
            }}
            style={{ transform: 'translate(-50%, -50%)' }}
          >
            <PersonaPortrait
              persona={p}
              color={p.color}
              size={personas.length === 1 ? 58 : personas.length === 2 ? 54 : 50}
              speaking={speaking}
              label={p.name}
              sublabel={speaking ? '思考中…' : undefined}
            />
          </motion.div>
        );
      })}

      {/* 你 */}
      <motion.div
        className="absolute z-10"
        style={{ left: uSeat.left, top: uSeat.top, transform: 'translate(-50%, -50%)' }}
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, type: 'spring', stiffness: 260, damping: 22 }}
      >
        <PersonaPortrait
          userInitial={userName}
          color={USER_COLOR}
          size={46}
          label={userName}
          sublabel="你"
        />
      </motion.div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 对谈页
// ---------------------------------------------------------------------------
function TableScreen({ topic, userName, personas, onExport, onEnd }: {
  topic: string;
  userName: string;
  personas: Persona[];
  onExport: (messages: Msg[]) => void;
  onEnd: (messages: Msg[]) => void;
}) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [thinkingId, setThinkingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [aiOnline, setAiOnline] = useState<{ enabled: boolean; model?: string } | null>(null);
  const [dispatchNote, setDispatchNote] = useState('');
  const [dispatchMode, setDispatchMode] = useState<DispatchMode>('template');
  const [dispatchExpanded, setDispatchExpanded] = useState(true);
  const [exported, setExported] = useState(false);

  const historyRef = useRef<PersonaTurn[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    let cancelled = false;
    fetchAiStatus().then(status => {
      if (!cancelled) setAiOnline({ enabled: status.enabled, model: status.model });
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, thinkingId]);

  const pushMessage = (m: Msg) => {
    setMessages(prev => [...prev, m]);
    historyRef.current = [...historyRef.current, { speaker: m.name, text: m.text }];
  };

  const runRound = async (userMessage = '', targetId?: string) => {
    setBusy(true);
    try {
      const { order, mode, note } = await fetchPersonaDispatch(
        personas.map(p => p.id),
        topic,
        historyRef.current.slice(-8),
        userMessage,
        userName,
        targetId
      );
      if (note) {
        setDispatchNote(note);
        setDispatchMode(mode);
        setDispatchExpanded(true);
      }
      const ids = order.length ? order : personas.map(p => p.id).slice(0, Math.min(2, personas.length));
      let last = userMessage.trim() ? userName : lastSpeakerName(historyRef.current);

      for (const pid of ids) {
        const p = personas.find(x => x.id === pid);
        if (!p) continue;
        setThinkingId(p.id);
        try {
          const { reply, mode: replyMode } = await fetchPersonaReply(
            p.id, topic, historyRef.current.slice(-8), userMessage, userName, last
          );
          pushMessage({ id: nid(), speakerId: p.id, name: p.name, text: reply, color: p.color, replyMode });
          last = p.name;
        } catch {
          pushMessage({
            id: nid(),
            speakerId: p.id,
            name: p.name,
            text: '（一时语塞，没接上话）',
            color: p.color,
            replyMode: 'template',
          });
          last = p.name;
        }
      }
    } catch {
      /* dispatch failed — fallback one speaker */
      const p = personas[0];
      if (p) {
        setDispatchNote('调度失败 · 离线兜底，由第一位嘉宾接话');
        setDispatchMode('template');
        setThinkingId(p.id);
        try {
          const { reply, mode } = await fetchPersonaReply(p.id, topic, historyRef.current.slice(-8), userMessage, userName);
          pushMessage({ id: nid(), speakerId: p.id, name: p.name, text: reply, color: p.color, replyMode: mode });
        } catch { /* ignore */ }
      }
    } finally {
      setThinkingId(null);
      setBusy(false);
      inputRef.current?.focus();
    }
  };

  const handleSend = async (textOverride?: string) => {
    const raw = (textOverride ?? input).trim();
    if (!raw || busy) return;
    const { text, targetId } = parseMention(raw, personas);
    setInput('');
    pushMessage({ id: nid(), speakerId: 'me', name: userName, text, color: USER_COLOR });
    await runRound(text, targetId);
  };

  const thinkingPersona = thinkingId ? personas.find(p => p.id === thinkingId) : null;
  const guestNames = useMemo(() => personas.map(p => p.name).join('、'), [personas]);

  return (
    <div className="min-h-screen flex flex-col if-page">
      {/* 顶栏 + 圆桌 */}
      <div className="flex-shrink-0 sticky top-0 z-20 if-composer border-b border-[var(--if-line)] pb-4 pt-12 px-4">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-1 px-6"
        >
          <div className="flex items-center justify-center gap-2 mb-1.5 flex-wrap">
            <p className="if-eyebrow">{brand.roundtableLive}</p>
            {aiOnline && <AiStatusChip enabled={aiOnline.enabled} model={aiOnline.model} />}
          </div>
          <p className="text-[13px] text-[var(--if-muted)] leading-relaxed line-clamp-2">{topic}</p>
        </motion.div>
        <RoundTable personas={personas} userName={userName} thinkingId={thinkingId} />
      </div>

      {/* 对话区 */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-5 min-h-0">
        {dispatchNote && messages.length > 0 && (
          <DispatchNoteBar
            note={dispatchNote}
            mode={dispatchMode}
            expanded={dispatchExpanded}
            onToggle={() => setDispatchExpanded(v => !v)}
          />
        )}

        {messages.length === 0 && !busy && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center py-6"
          >
            <p className="text-sm text-[var(--if-muted)] mb-1">{brand.roundtableKindle}</p>
            <p className="text-xs text-[var(--if-muted-soft)] mb-4 leading-relaxed">
              {guestNames}
            </p>
            <PersonaDisclaimer className="max-w-sm mx-auto mb-6 text-left" />
            <div className="flex flex-col gap-2 max-w-sm mx-auto">
              {STARTER_PROMPTS.map((prompt, i) => (
                <motion.button
                  key={prompt}
                  type="button"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.08 }}
                  onClick={() => handleSend(prompt)}
                  className="if-starter-btn"
                >
                  {prompt}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {messages.map((m, i) => (
          <MessageBubble key={m.id} msg={m} index={i} />
        ))}

        <AnimatePresence>
          {thinkingPersona && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="flex gap-3"
            >
              <PersonaPortrait persona={thinkingPersona} color={thinkingPersona.color} size={36} speaking />
              <div
                className="rounded-2xl rounded-bl-md px-5 py-3.5 flex items-center gap-1.5 self-end"
                style={{
                  background: `${thinkingPersona.color}14`,
                  border: `1px solid ${thinkingPersona.color}33`,
                }}
              >
                <span className="dot-pulse" style={{ background: thinkingPersona.color }} />
                <span className="dot-pulse" style={{ background: thinkingPersona.color, animationDelay: '0.15s' }} />
                <span className="dot-pulse" style={{ background: thinkingPersona.color, animationDelay: '0.3s' }} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 输入区 */}
      <div className="flex-shrink-0 rt-composer px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {messages.length > 0 && (
          <div className="flex items-center justify-between mb-2.5 px-0.5 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => runRound()}
                disabled={busy}
                className="inline-flex items-center gap-1.5 text-[11px] text-[var(--if-muted)] hover:text-[var(--if-ink-soft)] disabled:opacity-30 transition-colors px-2 py-1 rounded-lg hover:bg-[var(--if-surface)]"
              >
                <span>💬</span> 让他们再聊一轮
              </button>
              {messages.length >= 2 && (
                <button
                  type="button"
                  onClick={() => onEnd(messages)}
                  disabled={busy}
                  className="inline-flex items-center gap-1 text-[11px] text-[var(--if-accent)] hover:opacity-80 px-2 py-1 rounded-lg hover:bg-[var(--if-accent-soft)] disabled:opacity-30"
                >
                  {brand.roundtableEndBtn}
                </button>
              )}
            </div>
            <div className="flex items-center gap-3">
              {aiOnline && <AiStatusChip enabled={aiOnline.enabled} model={aiOnline.model} />}
              <button
                type="button"
                onClick={() => {
                  onExport(messages);
                  setExported(true);
                  setTimeout(() => setExported(false), 2000);
                }}
                className={cn(
                  'text-[11px] transition-colors px-2 py-1 rounded-lg',
                  exported ? 'text-[var(--if-success)]' : 'text-[var(--if-accent)] hover:bg-[var(--if-accent-soft)]'
                )}
              >
                {exported ? '✓ 已导出' : '导出对谈 ↓'}
              </button>
            </div>
          </div>
        )}

        <div className="mb-2 flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {PHRASE_TEMPLATES.map(t => (
            <button
              key={t.label}
              type="button"
              disabled={busy}
              onClick={() => setInput(prev => (prev ? `${prev}${t.text}` : t.text))}
              className="flex-shrink-0 px-2.5 py-1 rounded-lg text-[10px] text-[var(--if-muted)] bg-[var(--if-surface)] border border-[var(--if-line)] hover:border-[var(--if-accent-border)] hover:text-[var(--if-ink-soft)] disabled:opacity-30"
            >
              {t.label}
            </button>
          ))}
        </div>
        <p className="text-[9px] text-[var(--if-muted-soft)] mb-2 px-0.5">输入 @嘉宾名 可指定谁来接话</p>

        <div className="flex gap-2.5 items-end">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              className="w-full if-field-input rounded-2xl text-sm px-4 py-3 resize-none min-h-[48px] max-h-32"
              placeholder={busy ? `${thinkingPersona?.name ?? '嘉宾'}正在思考…` : '说点什么… Enter 发送'}
              rows={1}
              value={input}
              disabled={busy}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
          </div>
          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={() => handleSend()}
            disabled={busy || !input.trim()}
            className="size-12 rounded-2xl btn-primary flex items-center justify-center disabled:btn-disabled flex-shrink-0 text-lg"
            aria-label="发送"
          >
            ↑
          </motion.button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 复盘 · 心理安全 3 题
// ---------------------------------------------------------------------------
function DebriefScreen({ onNext }: { onNext: (scores: DebriefScores) => void }) {
  const [scores, setScores] = useState({ speak: 3, heard: 3, safe: 3 });
  const [insight, setInsight] = useState('');

  return (
    <div className="min-h-screen if-page px-5 py-12 max-w-md mx-auto">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <p className="if-eyebrow mb-2">{brand.roundtableDebrief}</p>
        <h2 className="text-xl font-light text-[var(--if-ink)] mb-2 font-display">聊得怎么样？</h2>
        <p className="text-sm text-[var(--if-muted)] mb-8 leading-relaxed">匿名自评，只保存在本机报告里。1 = 完全不同意，5 = 非常同意</p>

        <div className="space-y-6 mb-8">
          {DEBRIEF_QUESTIONS.map(q => (
            <div key={q.id} className="if-card p-4">
              <p className="text-sm text-[var(--if-ink-soft)] mb-3">{q.text}</p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setScores(s => ({ ...s, [q.id]: n }))}
                    className={cn(
                      'flex-1 h-9 rounded-lg text-sm transition-all',
                      scores[q.id as keyof typeof scores] === n
                        ? 'bg-[var(--if-accent-soft)] border border-[var(--if-accent-border)] text-[var(--if-accent)]'
                        : 'bg-[var(--if-surface)] border border-[var(--if-line)] text-[var(--if-muted)] hover:text-[var(--if-ink-soft)]'
                    )}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mb-8">
          <label className="if-field-label">关于沟通本身，我学到…（可选）</label>
          <textarea
            className="if-field-textarea h-20"
            placeholder="例如：反对意见比我想象中更有帮助"
            value={insight}
            onChange={e => setInsight(e.target.value)}
          />
        </div>

        <button
          onClick={() => onNext({ ...scores, insight: insight.trim() })}
          className="w-full h-12 rounded-xl btn-primary text-sm"
        >
          {brand.roundtableDebriefNext}
        </button>
      </motion.div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 收束 + 认领承诺
// ---------------------------------------------------------------------------
function WrapScreen({
  topic,
  userName,
  personas,
  messages,
  debrief,
  onFinish,
  onExport,
}: {
  topic: string;
  userName: string;
  personas: Persona[];
  messages: Msg[];
  debrief: DebriefScores;
  onFinish: (action: string, summary: RoundtableSummary) => void;
  onExport: (messages: Msg[], summary: RoundtableSummary, debrief: DebriefScores, action: string) => void;
}) {
  const [summary, setSummary] = useState<RoundtableSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const history = useMemo(
    () => messages.map(m => ({ speaker: m.name, text: m.text })),
    [messages]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const s = await fetchRoundtableSummary(topic, history, personas.map(p => p.id));
        if (!cancelled) {
          setSummary(s);
          setAction(s.nextStep || '');
        }
      } catch {
        if (!cancelled) {
          setSummary({
            consensus: '讨论已从多角度展开。',
            disagreement: '嘉宾之间仍有分歧。',
            gap: '还需要结合你的具体情境。',
            nextStep: '选一条方向，14 天内做一件小事验证。',
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [topic, history, personas]);

  const handleAiAction = async () => {
    if (!summary || aiLoading) return;
    setAiLoading(true);
    try {
      const idea = `${summary.consensus} ${summary.nextStep}`.trim();
      const { action: suggested } = await fetchSmartAction(idea, topic, userName);
      setAction(suggested);
    } finally {
      setAiLoading(false);
    }
  };

  if (loading || !summary) {
    return (
      <div className="min-h-screen flex items-center justify-center if-page">
        <p className="text-sm text-[var(--if-muted)]">{brand.roundtableSummarizing}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen if-page px-5 py-12 max-w-md mx-auto pb-16">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <p className="if-eyebrow mb-2">{brand.roundtableWrap}</p>
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <h2 className="text-xl font-light text-[var(--if-ink)] font-display">{userName}，聊完了。</h2>
          {summary.mode === 'template' && (
            <span className="text-[9px] text-[var(--if-muted-soft)] px-2 py-0.5 rounded-md if-card--flat">
              {brand.roundtableOfflineWrap}
            </span>
          )}
        </div>
        <PersonaDisclaimer className="mb-6" />

        <div className="space-y-3 mb-8">
          {[
            { label: '共识', text: summary.consensus },
            { label: '分歧', text: summary.disagreement },
            { label: '还缺什么', text: summary.gap },
          ].map(item => (
            <div key={item.label} className="if-card p-4">
              <p className="if-eyebrow mb-1.5">{item.label}</p>
              <p className="text-sm text-[var(--if-ink-soft)] leading-relaxed">{item.text}</p>
            </div>
          ))}
        </div>

        <div className="if-card p-5 mb-6 border-[var(--if-accent-border)] bg-[var(--if-accent-soft)]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BrandMark size={18} />
              <p className="if-field-label text-[var(--if-accent)] mb-0">认领一件事</p>
            </div>
            <button
              type="button"
              onClick={handleAiAction}
              disabled={aiLoading}
              className="text-[10px] text-[var(--if-accent)] hover:opacity-80 disabled:opacity-30"
            >
              {aiLoading ? '⏳…' : '🤖 AI 写行动'}
            </button>
          </div>
          <p className="text-[11px] text-[var(--if-muted-soft)] mb-2">写下 14 天内可执行的一件具体事，即可收炉定局。</p>
          <p className="text-[11px] text-[var(--if-muted)] mb-3">建议：{summary.nextStep}</p>
          <textarea
            className="if-field-textarea h-24 mb-3"
            placeholder="14 天内我要做的一件具体的事…"
            value={action}
            onChange={e => setAction(e.target.value)}
          />
          <button
            onClick={() => action.trim().length >= 4 && onFinish(action.trim(), summary)}
            disabled={action.trim().length < 4}
            className="w-full h-11 rounded-xl btn-primary text-sm disabled:btn-disabled"
          >
            ✍️ 落契确认
          </button>
        </div>

        <button
          type="button"
          onClick={() => onExport(messages, summary, debrief, action)}
          className="w-full h-10 rounded-xl if-btn-secondary text-sm text-[var(--if-muted)] hover:text-[var(--if-ink-soft)]"
        >
          导出完整报告 ↓
        </button>
      </motion.div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 完成页
// ---------------------------------------------------------------------------
function followUpDateLabel(days = brand.commitmentFollowUpDays) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' });
}

function DoneScreen({
  userName,
  action,
  onReset,
}: {
  userName: string;
  action: string;
  onReset: () => void;
}) {
  const followUp = followUpDateLabel();

  return (
    <div className="min-h-screen flex items-center justify-center if-page px-6">
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-sm">
        <div className="if-mark mx-auto mb-4" aria-hidden>
          <BrandMark size={26} />
        </div>
        <h2 className="text-xl font-light text-[var(--if-ink)] mb-2 font-display">{userName}，这件事你领下了。</h2>
        <p className="text-sm text-[var(--if-muted)] leading-relaxed mb-6 px-4">{action}</p>
        <p className="text-[11px] text-[var(--if-muted-soft)] mb-8">
          📅 {followUp}（{brand.commitmentFollowUpDays}{brand.commitmentFollowUpHint}）
        </p>
        <button onClick={onReset} className="px-8 py-3 rounded-xl btn-primary text-sm">
          {brand.roundtableAgain}
        </button>
      </motion.div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 容器 · 入场过渡
// ---------------------------------------------------------------------------
export function RoundtableMode({ seedTopic = '' }: { seedTopic?: string }) {
  const [phase, setPhase] = useState<'setup' | 'table' | 'debrief' | 'wrap' | 'done'>('setup');
  const [topic, setTopic] = useState('');
  const [userName, setUserName] = useState('我');
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [debrief, setDebrief] = useState<DebriefScores | null>(null);
  const [commitment, setCommitment] = useState('');
  const [summary, setSummary] = useState<RoundtableSummary | null>(null);

  const handleStart = (t: string, n: string, ids: string[]) => {
    setTopic(t);
    setUserName(n);
    setPersonas(ids.map(getPersona).filter(Boolean) as Persona[]);
    setMessages([]);
    setDebrief(null);
    setCommitment('');
    setSummary(null);
    _id = 0;
    setPhase('table');
  };

  const buildReport = (
    msgs: Msg[],
    sum: RoundtableSummary | null,
    db: DebriefScores | null,
    action: string
  ) => {
    const date = new Date().toISOString().split('T')[0];
    const guests = personas.map(p => `${p.name}`).join('、');
    const body = msgs.map(m => {
      const tag = m.replyMode === 'ai' ? ' *(AI · 风格演绎)*' : m.replyMode === 'template' ? ' *(离线模板)*' : '';
      return `**${m.name}：** ${m.text}${tag}`;
    }).join('\n\n');
    const debriefBlock = db
      ? `## 复盘（心理安全 1–5）
- 敢表达不同意见：${db.speak}
- 感到被倾听：${db.heard}
- 不担心因错被否定：${db.safe}
${db.insight ? `- 沟通洞察：${db.insight}` : ''}`
      : '';
    const summaryBlock = sum
      ? `## 收束总结
- **共识：** ${sum.consensus}
- **分歧：** ${sum.disagreement}
- **还缺什么：** ${sum.gap}
- **建议下一步：** ${sum.nextStep}`
      : '';
    const followUp = followUpDateLabel();
    const commitBlock = action
      ? `## 我的承诺
**行动：** ${action}

**回访日：** ${followUp}（认领后 ${brand.commitmentFollowUpDays} 天）`
      : '';

    return `# ${brand.roundtableName} — ${userName}
> ${date} · ${brand.productName}

## 话题
**${topic}**

## 在席
${guests}

---

## 对话记录
${body || '_（无）_'}

---
${summaryBlock}

---
${debriefBlock}

---
${commitBlock}

---
> ${PERSONA_DISCLAIMER}

> 由 ${brand.productName} 圆桌对谈生成 · ${date}`;
  };

  const downloadReport = (content: string) => {
    const date = new Date().toISOString().split('T')[0];
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${brand.roundtableName}-${date}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setPhase('setup');
    setMessages([]);
    setDebrief(null);
    setCommitment('');
    setSummary(null);
    _id = 0;
  };

  return (
    <AnimatePresence mode="wait">
      {phase === 'setup' && (
        <motion.div key="setup" exit={{ opacity: 0, scale: 0.98 }}>
          <SetupScreen onStart={handleStart} seedTopic={seedTopic} />
        </motion.div>
      )}
      {phase === 'table' && (
        <motion.div key="table" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <TableScreen
            topic={topic}
            userName={userName}
            personas={personas}
            onExport={(msgs) => downloadReport(buildReport(msgs, null, null, ''))}
            onEnd={(msgs) => {
              setMessages(msgs);
              setPhase('debrief');
            }}
          />
        </motion.div>
      )}
      {phase === 'debrief' && (
        <motion.div key="debrief" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
          <DebriefScreen onNext={(scores) => {
            setDebrief(scores);
            setPhase('wrap');
          }} />
        </motion.div>
      )}
      {phase === 'wrap' && debrief && (
        <motion.div key="wrap" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
          <WrapScreen
            topic={topic}
            userName={userName}
            personas={personas}
            messages={messages}
            debrief={debrief}
            onFinish={(action, sum) => {
              setCommitment(action);
              setSummary(sum);
              setPhase('done');
            }}
            onExport={(msgs, sum, db, action) => {
              downloadReport(buildReport(msgs, sum, db, action));
            }}
          />
        </motion.div>
      )}
      {phase === 'done' && (
        <motion.div key="done" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}>
          <DoneScreen
            userName={userName}
            action={commitment}
            onReset={handleReset}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

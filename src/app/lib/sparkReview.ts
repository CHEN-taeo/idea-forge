/** 闪念周回顾 · 与 shared/spark-review.js 一致 */

import type { SparkNote } from './sparkNotes';

export interface SparkConnection {
  idA: string;
  idB: string;
  textA: string;
  textB: string;
  reason: string;
}

export interface SparkTheme {
  label: string;
  count: number;
  sample: string;
}

export interface WeeklyReview {
  empty: boolean;
  weekLabel: string;
  headline: string;
  hint: string;
  mode: 'template';
  count?: number;
  notes?: SparkNote[];
  themes?: SparkTheme[];
  connections?: SparkConnection[];
  openQuestion?: string;
}

function startOfWeek(now = new Date()) {
  const d = new Date(now);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfWeek(now = new Date()) {
  const end = startOfWeek(now);
  end.setDate(end.getDate() + 7);
  return end;
}

export function notesThisWeek(notes: SparkNote[], now = new Date()) {
  const start = startOfWeek(now);
  const end = endOfWeek(now);
  return notes.filter((n) => {
    const t = new Date(n.createdAt);
    return !Number.isNaN(t.getTime()) && t >= start && t < end;
  });
}

export function weekLabel(now = new Date()) {
  const start = startOfWeek(now);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${start.getMonth() + 1}.${pad(start.getDate())} – ${end.getMonth() + 1}.${pad(end.getDate())}`;
}

const THEME_HINTS = [
  { key: '产品', label: '产品 / 体验' },
  { key: 'AI', label: 'AI / 技术' },
  { key: '创业', label: '创业 / 方向' },
  { key: '团队', label: '团队 / 协作' },
  { key: '学习', label: '学习 / 成长' },
  { key: '用户', label: '用户 / 需求' },
  { key: '时间', label: '节奏 / 优先级' },
  { key: '钱', label: '资源 / 投入' },
  { key: '家', label: '生活 / 平衡' },
];

function guessThemes(notes: SparkNote[]): SparkTheme[] {
  const hits: SparkTheme[] = [];
  for (const hint of THEME_HINTS) {
    const matched = notes.filter((n) => n.text.includes(hint.key));
    if (matched.length >= 1) {
      hits.push({ label: hint.label, count: matched.length, sample: matched[0].text.slice(0, 48) });
    }
  }
  return hits.slice(0, 3);
}

function sharedSubstring(a: string, b: string, minLen = 2) {
  for (let len = Math.min(a.length, b.length); len >= minLen; len--) {
    for (let i = 0; i <= a.length - len; i++) {
      const sub = a.slice(i, i + len);
      if (/^[\s，。！？、；：""''（）\n]+$/.test(sub)) continue;
      if (b.includes(sub)) return sub;
    }
  }
  return null;
}

function findConnections(notes: SparkNote[], max = 3): SparkConnection[] {
  const out: SparkConnection[] = [];
  for (let i = 0; i < notes.length; i++) {
    for (let j = i + 1; j < notes.length; j++) {
      const sub = sharedSubstring(notes[i].text, notes[j].text, 2);
      if (sub) {
        out.push({
          idA: notes[i].id,
          idB: notes[j].id,
          textA: notes[i].text,
          textB: notes[j].text,
          reason: `都提到了「${sub}」`,
        });
      }
    }
  }
  return out.slice(0, max);
}

const OPEN_QUESTIONS = [
  '如果本周这些念头里只能推进一个，你会选哪条？',
  '哪两条看起来无关，其实可能是一件事？',
  '有什么是你写了但还没告诉任何人的？',
  '哪条闪念最值得请嘉宾入席聊透？',
];

export function buildWeeklyReview(notes: SparkNote[], now = new Date()): WeeklyReview {
  const weekNotes = notesThisWeek(notes, now);
  const label = weekLabel(now);

  if (weekNotes.length === 0) {
    return {
      empty: true,
      weekLabel: label,
      headline: '本周还没有闪念',
      hint: '捕捉页随时记下即可，周末再来看看有什么线索。',
      mode: 'template',
    };
  }

  return {
    empty: false,
    weekLabel: label,
    count: weekNotes.length,
    notes: weekNotes,
    themes: guessThemes(weekNotes),
    connections: findConnections(weekNotes),
    openQuestion: OPEN_QUESTIONS[weekNotes.length % OPEN_QUESTIONS.length],
    headline: `本周 ${weekNotes.length} 条闪念`,
    hint: '以下是离线整理的线索，不一定准确，供你触发联想。',
    mode: 'template',
  };
}

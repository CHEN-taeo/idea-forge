/**
 * 闪念 · 周回顾（离线模板，无需 API）
 */
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

function notesThisWeek(notes, now = new Date()) {
  const start = startOfWeek(now);
  const end = endOfWeek(now);
  return notes.filter((n) => {
    const t = new Date(n.createdAt);
    return !Number.isNaN(t.getTime()) && t >= start && t < end;
  });
}

function weekLabel(now = new Date()) {
  const start = startOfWeek(now);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const pad = (n) => String(n).padStart(2, '0');
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

function guessThemes(notes) {
  const hits = [];
  for (const hint of THEME_HINTS) {
    const matched = notes.filter((n) => n.text.includes(hint.key));
    if (matched.length >= 1) {
      hits.push({ label: hint.label, count: matched.length, sample: matched[0].text.slice(0, 48) });
    }
  }
  return hits.slice(0, 3);
}

function sharedSubstring(a, b, minLen = 2) {
  const sa = String(a);
  const sb = String(b);
  for (let len = Math.min(sa.length, sb.length); len >= minLen; len--) {
    for (let i = 0; i <= sa.length - len; i++) {
      const sub = sa.slice(i, i + len);
      if (/^[\s，。！？、；：""''（）\n]+$/.test(sub)) continue;
      if (sb.includes(sub)) return sub;
    }
  }
  return null;
}

function findConnections(notes, max = 3) {
  const out = [];
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
  '哪一念最值得请诸贤入席论透？',
];

function buildWeeklyReview(notes, now = new Date()) {
  const weekNotes = notesThisWeek(notes, now);
  const label = weekLabel(now);

  if (weekNotes.length === 0) {
    return {
      empty: true,
      weekLabel: label,
      headline: '本周炉边尚空',
      hint: '拾念页随时落笔即可，周末再来看看有什么线索。',
      mode: 'template',
    };
  }

  const themes = guessThemes(weekNotes);
  const connections = findConnections(weekNotes);
  const openQuestion = OPEN_QUESTIONS[weekNotes.length % OPEN_QUESTIONS.length];

  return {
    empty: false,
    weekLabel: label,
    count: weekNotes.length,
    notes: weekNotes,
    themes,
    connections,
    openQuestion,
    headline: `本周炉边 ${weekNotes.length} 念`,
    hint: '以下为离线整理的线索，未必准确，供你触发联想。',
    mode: 'template',
  };
}

module.exports = {
  startOfWeek,
  endOfWeek,
  notesThisWeek,
  weekLabel,
  buildWeeklyReview,
};

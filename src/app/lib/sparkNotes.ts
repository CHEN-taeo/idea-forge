/** 闪念笔记 · Web 本地存储（逻辑与 shared/spark-notes.js 一致） */

export interface SparkNote {
  id: string;
  text: string;
  createdAt: string;
}

const STORAGE_KEY = 'if_spark_notes';
const MAX_NOTES = 200;

function newId() {
  return `sp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeNotes(raw: unknown): SparkNote[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((n): n is SparkNote => !!n && typeof (n as SparkNote).text === 'string')
    .map((n) => ({
      id: String(n.id || newId()),
      text: n.text.trim(),
      createdAt: n.createdAt || new Date().toISOString(),
    }))
    .slice(0, MAX_NOTES);
}

function createNote(text: string): SparkNote | null {
  const t = text.trim();
  if (!t) return null;
  return { id: newId(), text: t.slice(0, 2000), createdAt: new Date().toISOString() };
}

function loadRaw(): SparkNote[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return normalizeNotes(JSON.parse(raw));
  } catch {
    return [];
  }
}

function persist(notes: SparkNote[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

export function formatSparkTime(iso: string, now = new Date()) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  const pad = (n: number) => String(n).padStart(2, '0');
  if (sameDay) return `今天 ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  return `${d.getMonth() + 1}月${d.getDate()}日 ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function loadSparkNotes(): SparkNote[] {
  return loadRaw();
}

export function addSparkNote(text: string): SparkNote | null {
  const note = createNote(text);
  if (!note) return null;
  const next = [note, ...loadRaw().filter((n) => n.id !== note.id)].slice(0, MAX_NOTES);
  persist(next);
  return note;
}

export function deleteSparkNote(id: string): SparkNote[] {
  const next = loadRaw().filter((n) => n.id !== id);
  persist(next);
  return next;
}

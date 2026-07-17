/**
 * 闪念笔记 · 数据结构与工具（单一来源）
 * 本地优先，无需登录；Web / 小程序各自持久化到 storage。
 */
const STORAGE_KEY = 'if_spark_notes';
const MAX_NOTES = 200;

function newId() {
  return `sp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeNotes(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((n) => n && typeof n.text === 'string' && n.text.trim())
    .map((n) => ({
      id: String(n.id || newId()),
      text: n.text.trim(),
      createdAt: n.createdAt || new Date().toISOString(),
    }))
    .slice(0, MAX_NOTES);
}

function createNote(text) {
  const t = String(text || '').trim();
  if (!t) return null;
  return {
    id: newId(),
    text: t.slice(0, 2000),
    createdAt: new Date().toISOString(),
  };
}

function prependNote(notes, note) {
  if (!note) return notes;
  return [note, ...notes.filter((n) => n.id !== note.id)].slice(0, MAX_NOTES);
}

function removeNote(notes, id) {
  return notes.filter((n) => n.id !== id);
}

function formatSparkTime(iso, now = new Date()) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  const pad = (n) => String(n).padStart(2, '0');
  if (sameDay) return `今天 ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  return `${d.getMonth() + 1}月${d.getDate()}日 ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

module.exports = {
  STORAGE_KEY,
  MAX_NOTES,
  newId,
  normalizeNotes,
  createNote,
  prependNote,
  removeNote,
  formatSparkTime,
};

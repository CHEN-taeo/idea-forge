const {
  STORAGE_KEY,
  normalizeNotes,
  createNote,
  prependNote,
  removeNote,
  formatSparkTime,
} = require('../../shared/spark-notes');

function loadNotes() {
  try {
    const raw = wx.getStorageSync(STORAGE_KEY);
    return normalizeNotes(raw);
  } catch {
    return [];
  }
}

function saveNotes(notes) {
  wx.setStorageSync(STORAGE_KEY, notes);
}

function addNote(text) {
  const note = createNote(text);
  if (!note) return null;
  const next = prependNote(loadNotes(), note);
  saveNotes(next);
  return note;
}

function deleteNote(id) {
  const next = removeNote(loadNotes(), id);
  saveNotes(next);
  return next;
}

module.exports = {
  loadNotes,
  addNote,
  deleteNote,
  formatSparkTime,
};

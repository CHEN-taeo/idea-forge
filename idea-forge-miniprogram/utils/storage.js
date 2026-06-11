const SESSION_KEY = 'idea-forge-mp-session';

function saveSession(meta) {
  try { wx.setStorageSync(SESSION_KEY, meta); } catch (e) { /* ignore */ }
}

function loadSession() {
  try { return wx.getStorageSync(SESSION_KEY) || null; } catch (e) { return null; }
}

function clearSession() {
  try { wx.removeStorageSync(SESSION_KEY); } catch (e) { /* ignore */ }
}

module.exports = { saveSession, loadSession, clearSession, SESSION_KEY };

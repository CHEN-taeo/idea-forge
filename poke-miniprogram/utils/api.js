const { API_BASE } = require('./config');

function req(path, method, data) {
  return new Promise((resolve) => {
    if (!API_BASE) return resolve(null);
    wx.request({
      url: API_BASE + path,
      method: method || 'GET',
      data: data || {},
      timeout: 8000,
      success: (r) => resolve(r.statusCode >= 200 && r.statusCode < 300 ? r.data : null),
      fail: () => resolve(null)
    });
  });
}

function q(uid, extra) {
  let s = '?uid=' + encodeURIComponent(uid || '');
  if (extra) {
    Object.keys(extra).forEach((k) => {
      if (extra[k] !== undefined && extra[k] !== '') {
        s += '&' + encodeURIComponent(k) + '=' + encodeURIComponent(extra[k]);
      }
    });
  }
  return s;
}

module.exports = {
  enabled: () => !!API_BASE,
  feed: (uid, extra) => req('/api/feed' + q(uid, extra)),
  radar: (uid, extra) => req('/api/radar' + q(uid, extra)),
  buddy: (uid, extra) => req('/api/buddy' + q(uid, extra)),
  poke: (uid, extra) => req('/api/poke' + q(uid, extra)),
  gap: (uid, extra) => req('/api/gap' + q(uid, extra)),
  calendar: (uid, extra) => req('/api/calendar' + q(uid, extra)),
  me: (uid, extra) => req('/api/me' + q(uid, extra)),
  items: () => req('/api/items'),
  eventTypes: () => req('/api/event-types'),
  health: () => req('/api/health'),
  ingest: (text, room) => req('/api/ingest', 'POST', { text, room: room || '文件传输助手', sender: '我', source: 'forward' }),
  paste: (text, room) => req('/api/ingest/paste', 'POST', { text, room: room || '文件传输助手', mode: 'lines' }),
  engage: (uid, name, itemId, action, value) => req('/api/engage', 'POST', { uid, name, itemId, action, value }),
  insider: (uid, itemId, insiderNote, eventType) => req('/api/items/' + encodeURIComponent(itemId) + '/insider', 'POST', { uid, insiderNote, eventType })
};

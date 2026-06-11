const { SERVER_URL } = require('./config');

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${SERVER_URL}${path}`,
      method: options.method || 'GET',
      data: options.data,
      header: { 'Content-Type': 'application/json', ...(options.header || {}) },
      timeout: 12000,
      success(res) {
        if (res.statusCode >= 200 && res.statusCode < 300) resolve(res.data);
        else reject(new Error((res.data && res.data.error) || `HTTP ${res.statusCode}`));
      },
      fail(err) { reject(err); },
    });
  });
}

/** Server reachable (AI optional) */
function fetchHealth() {
  return request('/api/ai/status').catch(() => request('/api/sessions').then(() => ({})));
}

function fetchAiStatus() {
  return request('/api/ai/status').catch(() => ({ enabled: false, mode: 'template' }));
}

function fetchSoloAngles(problem) {
  return request('/api/ai/solo/angles', { method: 'POST', data: { problem } });
}

function fetchSmartAction(ideaText, problem, playerName) {
  return request('/api/ai/smart-action', { method: 'POST', data: { ideaText, problem, playerName } });
}

function fetchSoloChallenge(ideaText, problem) {
  return request('/api/ai/solo/challenge', { method: 'POST', data: { ideaText, problem } });
}

function fetchPersonaReply(personaId, topic, history, userMessage, userName, lastSpeaker) {
  return request('/api/ai/persona/reply', {
    method: 'POST',
    data: { personaId, topic, history, userMessage, userName, lastSpeaker },
  });
}

function fetchPersonaDispatch(personaIds, topic, history, userMessage, userName, targetPersonaId) {
  return request('/api/ai/persona/dispatch', {
    method: 'POST',
    data: { personaIds, topic, history, userMessage, userName, targetPersonaId },
  });
}

function fetchRoundtableSummary(topic, history, personaIds) {
  return request('/api/ai/persona/summarize', {
    method: 'POST',
    data: { topic, history, personaIds },
  });
}

module.exports = {
  fetchHealth,
  fetchAiStatus,
  fetchSoloAngles,
  fetchSmartAction,
  fetchSoloChallenge,
  fetchPersonaReply,
  fetchPersonaDispatch,
  fetchRoundtableSummary,
};

/**
 * Socket.IO v4 client for WeChat mini program.
 * WebSocket first, falls back to Engine.IO long-polling (more reliable in 开发者工具).
 */
const { SERVER_URL } = require('./config');

let singleton = null;

function httpBase() {
  return SERVER_URL.replace(/\/$/, '');
}

function wsBase() {
  return httpBase().replace(/^http/, 'ws');
}

function toText(data) {
  if (typeof data === 'string') return data;
  if (data instanceof ArrayBuffer) {
    const u8 = new Uint8Array(data);
    let s = '';
    for (let i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i]);
    return s;
  }
  return String(data || '');
}

function wxRequest(options) {
  return new Promise((resolve, reject) => {
    wx.request({
      timeout: options.timeout || 15000,
      ...options,
      success(res) {
        if (res.statusCode >= 200 && res.statusCode < 300) resolve(res);
        else reject(new Error(`HTTP ${res.statusCode}`));
      },
      fail: reject,
    });
  });
}

/** Split Engine.IO polling payload into individual packets */
function splitPollingPayload(body) {
  if (!body) return [];
  // Batch: "96:0{...}5:3" — only when body starts with digit+colon length prefix
  if (/^\d+:/.test(body)) {
    const packets = [];
    let i = 0;
    while (i < body.length) {
      const colon = body.indexOf(':', i);
      if (colon === -1) break;
      const len = parseInt(body.slice(i, colon), 10);
      if (Number.isNaN(len)) break;
      packets.push(body.slice(colon + 1, colon + 1 + len));
      i = colon + 1 + len;
    }
    return packets.filter(Boolean);
  }
  return [body];
}

class GameSocket {
  constructor() {
    this.task = null;
    this.connId = 0;
    this.mode = null; // 'ws' | 'poll'
    this.sid = null;
    this.sioReady = false;
    this.handlers = {};
    this.ackSeq = 0;
    this.pendingAck = {};
    this._connectPromise = null;
    this._pollActive = false;
    this._pollTimer = null;
  }

  get status() {
    if (this.sioReady) return 'connected';
    if (this._connectPromise) return 'connecting';
    return 'disconnected';
  }

  _clearConnectPromise() {
    this._connectPromise = null;
  }

  _hardReset() {
    this.connId += 1;
    this.sioReady = false;
    this.sid = null;
    this.mode = null;
    this._clearConnectPromise();
    this._pollActive = false;
    if (this._pollTimer) {
      clearTimeout(this._pollTimer);
      this._pollTimer = null;
    }
    if (this.task) {
      try { this.task.close({}); } catch (e) { /* ignore */ }
      this.task = null;
    }
  }

  connect() {
    if (this.sioReady) return Promise.resolve();
    if (this._connectPromise) return this._connectPromise;

    this._connectPromise = this._connectWithFallback()
      .then(() => {
        this._clearConnectPromise();
      })
      .catch((err) => {
        this._hardReset();
        throw err;
      });

    return this._connectPromise;
  }

  async _connectWithFallback() {
    try {
      await this._connectWebSocket(8000);
      return;
    } catch (wsErr) {
      console.warn('[GameSocket] WebSocket failed, try polling:', wsErr.message);
    }
    await this._connectPolling();
  }

  _connectWebSocket(timeoutMs) {
    this._hardReset();
    const myConn = this.connId;
    this.mode = 'ws';

    return new Promise((resolve, reject) => {
      let settled = false;
      const url = `${wsBase()}/socket.io/?EIO=4&transport=websocket`;

      const finishOk = () => {
        if (settled || myConn !== this.connId) return;
        settled = true;
        resolve();
      };
      const finishErr = (err) => {
        if (settled || myConn !== this.connId) return;
        settled = true;
        reject(err || new Error('WebSocket 连接失败'));
      };

      try {
        this.task = wx.connectSocket({ url, fail: finishErr });
      } catch (e) {
        finishErr(e);
        return;
      }

      this.task.onMessage((res) => {
        if (myConn !== this.connId) return;
        this._ingestWire(toText(res.data));
        if (this.sioReady) finishOk();
      });

      this.task.onClose(() => {
        if (myConn !== this.connId) return;
        this.sioReady = false;
        this._clearConnectPromise();
        this._fire('disconnect');
        if (!settled) finishErr(new Error('WebSocket 已断开'));
      });

      this.task.onError(() => {
        if (myConn !== this.connId) return;
        finishErr(new Error('WebSocket 错误'));
      });

      setTimeout(() => {
        if (!settled && !this.sioReady) finishErr(new Error('WebSocket 超时'));
      }, timeoutMs);
    });
  }

  async _connectPolling() {
    this._hardReset();
    this.mode = 'poll';
    const myConn = this.connId;

    const openRes = await wxRequest({
      url: `${httpBase()}/socket.io/?EIO=4&transport=polling&t=${Date.now()}`,
      method: 'GET',
    });
    if (myConn !== this.connId) throw new Error('连接已取消');

    const body = toText(openRes.data);
    splitPollingPayload(body).forEach(p => this._ingestWire(p, false));
    if (!this.sid) throw new Error('握手失败，请确认 npm run server 已启动');

    await this._postPoll('40');
    await this._pollOnce();
    if (!this.sioReady) throw new Error('Socket.IO 握手未完成');

    this._pollActive = true;
    this._pollLoop(myConn);
  }

  async _postPoll(packet) {
    if (!this.sid) return;
    await wxRequest({
      url: `${httpBase()}/socket.io/?EIO=4&transport=polling&sid=${encodeURIComponent(this.sid)}`,
      method: 'POST',
      header: { 'content-type': 'text/plain;charset=UTF-8' },
      data: packet,
    });
  }

  async _pollOnce() {
    if (!this.sid) return;
    const res = await wxRequest({
      url: `${httpBase()}/socket.io/?EIO=4&transport=polling&sid=${encodeURIComponent(this.sid)}`,
      method: 'GET',
    });
    splitPollingPayload(toText(res.data)).forEach(p => this._ingestWire(p, false));
  }

  _pollLoop(myConn) {
    if (!this._pollActive || myConn !== this.connId || !this.sid) return;
    wxRequest({
      url: `${httpBase()}/socket.io/?EIO=4&transport=polling&sid=${encodeURIComponent(this.sid)}`,
      method: 'GET',
      timeout: 25000,
    })
      .then((res) => {
        if (myConn !== this.connId) return;
        splitPollingPayload(toText(res.data)).forEach(p => this._ingestWire(p, false));
      })
      .catch(() => { /* poll retry */ })
      .finally(() => {
        if (this._pollActive && myConn === this.connId) {
          this._pollTimer = setTimeout(() => this._pollLoop(myConn), 200);
        }
      });
  }

  _send(raw) {
    if (!raw) return;
    if (this.mode === 'poll') {
      this._postPoll(raw).catch((e) => console.error('[GameSocket] post fail', e));
    } else if (this.task) {
      this.task.send({ data: raw });
    }
  }

  _ingestWire(msg, autoConnectNs = true) {
    if (!msg) return;
    splitPollingPayload(msg).forEach(p => this._onPacket(p, autoConnectNs));
  }

  _onPacket(msg, autoConnectNs) {
    if (!msg) return;
    const engineType = msg[0];
    const rest = msg.slice(1);

    if (engineType === '0') {
      try {
        const j = JSON.parse(rest);
        if (j.sid) this.sid = j.sid;
      } catch (e) { /* ignore */ }
      if (autoConnectNs && this.mode === 'ws') this._send('40');
      return;
    }
    if (engineType === '2') {
      this._send('3');
      return;
    }
    if (engineType !== '4') return;

    const sioType = rest[0];
    const payload = rest.slice(1);

    if (sioType === '0') {
      this.sioReady = true;
      return;
    }
    if (sioType === '2') {
      try {
        const arr = JSON.parse(payload);
        const event = arr[0];
        const args = arr.slice(1);
        this._fire(event, args);
      } catch (e) { /* ignore */ }
      return;
    }
    if (sioType === '3') {
      try {
        const arr = JSON.parse(payload);
        const id = arr[0];
        const data = arr.length > 2 ? arr.slice(1) : arr[1];
        const cb = this.pendingAck[id];
        if (cb) {
          delete this.pendingAck[id];
          cb(Array.isArray(data) && arr.length > 2 ? data[0] : data);
        }
      } catch (e) { /* ignore */ }
    }
  }

  on(event, fn) {
    if (!this.handlers[event]) this.handlers[event] = [];
    this.handlers[event].push(fn);
  }

  off(event, fn) {
    if (!this.handlers[event]) return;
    this.handlers[event] = this.handlers[event].filter(f => f !== fn);
  }

  _fire(event, args = []) {
    (this.handlers[event] || []).forEach(fn => {
      try { fn(...args); } catch (e) { console.error(e); }
    });
  }

  emit(event, data, ack) {
    if (!this.sioReady) {
      if (typeof ack === 'function') ack({ error: '未连接服务器' });
      return;
    }
    if (typeof ack === 'function') {
      const id = ++this.ackSeq;
      this.pendingAck[id] = ack;
      this._send(`42${JSON.stringify([event, data, id])}`);
    } else {
      this._send(`42${JSON.stringify([event, data])}`);
    }
  }

  /** Promise wrapper with ack timeout; also listens for `${event}:ack` fallback */
  emitAsync(event, data, timeoutMs = 12000) {
    return new Promise((resolve, reject) => {
      let settled = false;
      const ackEvent = `${event}:ack`;
      const finish = (res, timedOut) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        this.off(ackEvent, onFallback);
        if (timedOut) reject(new Error('服务器响应超时'));
        else if (res && res.error) reject(new Error(res.error));
        else resolve(res);
      };
      const timer = setTimeout(() => finish(null, true), timeoutMs);
      const onFallback = (res) => finish(res, false);
      this.on(ackEvent, onFallback);
      this.emit(event, data, (res) => finish(res, false));
    });
  }

  disconnect() {
    this._hardReset();
  }
}

function getGameSocket() {
  if (!singleton) singleton = new GameSocket();
  return singleton;
}

module.exports = { getGameSocket, GameSocket };

/**
 * Socket.IO v4 client for WeChat mini program.
 * Handles text + ArrayBuffer frames, reconnect, shared connect promise.
 */
const { SERVER_URL } = require('./config');

let singleton = null;

function wsBase() {
  return SERVER_URL.replace(/^http/, 'ws');
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

class GameSocket {
  constructor() {
    this.task = null;
    this.sioReady = false;
    this.handlers = {};
    this.ackSeq = 0;
    this.pendingAck = {};
    this._connectPromise = null;
  }

  get status() {
    if (this.sioReady) return 'connected';
    if (this._connectPromise) return 'connecting';
    return 'disconnected';
  }

  _reset() {
    this.sioReady = false;
    this._connectPromise = null;
    if (this.task) {
      try { this.task.close({}); } catch (e) { /* ignore */ }
    }
    this.task = null;
  }

  connect() {
    if (this.sioReady) return Promise.resolve();
    if (this._connectPromise) return this._connectPromise;

    this._connectPromise = new Promise((resolve, reject) => {
      const url = `${wsBase()}/socket.io/?EIO=4&transport=websocket`;
      let settled = false;

      const finishOk = () => {
        if (settled) return;
        settled = true;
        resolve();
      };
      const finishErr = (err) => {
        if (settled) return;
        settled = true;
        this._reset();
        reject(err || new Error('连接失败'));
      };

      try {
        this.task = wx.connectSocket({
          url,
          fail: finishErr,
        });
      } catch (e) {
        finishErr(e);
        return;
      }

      this.task.onOpen(() => { /* wait for engine open */ });

      this.task.onMessage((res) => {
        this._onWire(toText(res.data));
        if (this.sioReady) finishOk();
      });

      this.task.onClose(() => {
        this.sioReady = false;
        if (!settled) finishErr(new Error('连接已断开'));
        this._fire('disconnect');
      });

      this.task.onError(() => finishErr(new Error('WebSocket 错误')));

      setTimeout(() => {
        if (!this.sioReady) finishErr(new Error('连接超时，请确认后端已启动'));
      }, 15000);
    });

    return this._connectPromise;
  }

  _send(raw) {
    if (!this.task) return;
    this.task.send({ data: raw });
  }

  _onWire(msg) {
    if (!msg) return;
    const engineType = msg[0];
    const rest = msg.slice(1);

    if (engineType === '0') {
      this._send('40');
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
        const data = arr[1];
        if (this.pendingAck[id]) {
          this.pendingAck[id](data);
          delete this.pendingAck[id];
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

  disconnect() {
    this._reset();
  }
}

function getGameSocket() {
  if (!singleton) singleton = new GameSocket();
  return singleton;
}

module.exports = { getGameSocket, GameSocket };

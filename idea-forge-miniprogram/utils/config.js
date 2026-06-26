/**
 * 炉边小程序 · 后端地址
 *
 * 开发：微信开发者工具勾选「不校验合法域名」，用 DEV_SERVER_URL
 * 发布：填写 PROD_SERVER_URL（HTTPS），并在 mp.weixin.qq.com 配置：
 *   - request 合法域名
 *   - socket 合法域名（多人入炉需要，wss）
 *
 * 仅体验「拾念」可不配后端；名士围炉 / 入炉 需要线上 API。
 */

// 发布：复制 config.prod.example.js → config.prod.js，或在此填写 PROD_SERVER_URL
let PROD_SERVER_URL = '';

try {
  const prod = require('./config.prod.js');
  if (prod && prod.SERVER_URL) PROD_SERVER_URL = prod.SERVER_URL;
} catch {
  // 无 config.prod.js 时使用下方常量
}

// const PROD_SERVER_URL = 'https://api.你的域名.com';

const DEV_SERVER_URL = 'http://127.0.0.1:3001';

function resolveServerUrl() {
  const dev = DEV_SERVER_URL.replace(/\/$/, '');
  const prod = (PROD_SERVER_URL || '').replace(/\/$/, '');

  if (!prod) return dev;

  try {
    const { envVersion } = wx.getAccountInfoSync().miniProgram;
    if (envVersion === 'release' || envVersion === 'trial') return prod;
  } catch {
    // 非小程序运行时
  }
  return dev;
}

const SERVER_URL = resolveServerUrl();

module.exports = {
  SERVER_URL,
  PROD_SERVER_URL,
  DEV_SERVER_URL,
};

# 炉边 · 生产部署（方案 B：HTTPS + WSS）

小程序 `PROD_SERVER_URL` 指向此处配置的 **HTTPS 根地址**（无末尾斜杠），例如 `https://api.example.com`。

## 前置

| 项 | 说明 |
|----|------|
| 域名 | 已 **ICP 备案**（微信国内小程序硬性要求） |
| HTTPS | 有效证书（Let's Encrypt / 云厂商） |
| 服务器 | 1核2G 起，开放 80/443；Node 进程只监听内网 3001 |

## 一、准备环境变量

```bash
# 仓库根目录
cp deploy/.env.production.example .env
# 编辑 .env：至少填 AI_API_KEY
```

## 二、方式 A — Docker（推荐）

```bash
cd deploy
docker compose up -d --build
curl -s http://127.0.0.1:3001/api/ai/status
```

数据库文件默认在容器内；持久化见 `docker-compose.yml` 的 volume（可按需把 `ideaforge.db` 挂到宿主机）。

## 三、方式 B — PM2 直跑

```bash
npm ci
npm run build
export NODE_ENV=production HOST=0.0.0.0 PORT=3001
# 加载 .env 后：
node --env-file=.env server.js
```

生产建议用 [pm2](https://pm2.keymetrics.io/)：

```bash
pm2 start server.js --name lubian --node-args="--env-file=.env"
pm2 save
```

## 四、Nginx + SSL

1. 复制 `deploy/nginx/lubian.conf.example` → 改成你的域名与证书路径  
2. `nginx -t && systemctl reload nginx`  
3. 验证：

```bash
curl https://api.你的域名.com/api/ai/status
```

应返回 JSON：`{"enabled":true,...}` 或 template 模式。

## 五、微信公众平台域名

[mp.weixin.qq.com](https://mp.weixin.qq.com) → 开发 → 开发管理 → 开发设置 → **服务器域名**：

| 类型 | 填写 |
|------|------|
| request | `https://api.你的域名.com` |
| socket | `wss://api.你的域名.com` |

**不要**带路径，不要末尾 `/`。

## 六、小程序指向线上 API

```bash
cd idea-forge-miniprogram/utils
cp config.prod.example.js config.prod.js
# 编辑 config.prod.js 中的 SERVER_URL
```

`config.prod.js` 已 gitignore，不会泄露域名。然后微信开发者工具 **上传**。

或直接在 `config.js` 里写：

```js
const PROD_SERVER_URL = 'https://api.你的域名.com';
```

## 七、上线检查清单

- [ ] `https://你的域名/api/ai/status` 200  
- [ ] 小程序体验版首页绿点「后端已连接」  
- [ ] 名士围炉能收到 AI 回复（或离线模板）  
- [ ] 入炉：创建房间 → 第二台设备加入（测 socket）  
- [ ] 公众平台域名已保存且未满额  

## 八、常见问题

**WebSocket 失败**  
Nginx 必须配置 `Upgrade` / `Connection`（见示例）；socket 域名用 `wss://` 同一主机。

**better-sqlite3 安装失败**  
需 `python3` `make` `g++`（Dockerfile 已包含）。

**仅 HTTP 无备案域名**  
无法用于微信小程序正式 request/socket 域名；可开发阶段用体验版 + 不校验域名调试。

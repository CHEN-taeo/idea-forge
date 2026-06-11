# 从头脑风暴到可执行承诺：Idea Forge 与破壳 Poke 的双产品线实践

> 建议标签：`Node.js` `微信小程序` `Socket.IO` `DeepSeek` `产品设计` `头脑风暴`

## 前言

同一个 monorepo 里，我们维护了两条**互不共享运行时**的产品线：

| 产品 | 定位 | 技术栈 |
|------|------|--------|
| **构想熔炉 Idea Forge** | 结构化头脑风暴 → 可执行承诺 | React + Express + Socket.IO + SQLite |
| **破壳 Poke** | 校园信息过滤 → 行动卡片 | Express + 微信小程序 + JSON 存储 |

本文记录近期落地的工程实践：微信小程序全流程、承诺埋点、Socket 兼容修复，以及破壳的东华 ingest 联调经验。

仓库地址：https://github.com/CHEN-taeo/idea-forge（分支 `feat/poke-campus-agent`）

---

## 一、Idea Forge：不是白板，是决策工具

### 1.1 差异化定位

竞品缺的一环，我们要**同时具备**：

1. **匿名并行发想** — 心理安全感  
2. **游戏化角色** — 参与许可（「我是反对派，可以质询」）  
3. **R3 结构化质询** — 压力测试  
4. **承诺仪式** — 闭环输出  
5. **零门槛加入** — 房间码 / QR，无账号  

一句话：**输出是承诺，不是便签。**

### 1.2 微信小程序：`idea-forge-miniprogram`

Web 端负责大屏投屏，手机端负责输入。小程序实现了完整阶段：

- Lobby → R1 构思/竞猜 → R2 改造 → **R3 质询/辩护/表决** → **SMART 承诺仪式** → 结束页  

关键文件：

- `utils/gameSocket.js` — 自研 Socket.IO v4 客户端（WebSocket + polling fallback）  
- `utils/smartCommitment.js` — 承诺校验（8 字以上 + 7/14/30 天期限）  
- `pages/room/` — 各阶段 UI  

### 1.3 踩坑：微信小程序里的 Socket.IO Ack

**现象：** 创建房间后服务端崩溃 `TypeError: ack is not a function`，小程序卡在「创建中…」。

**原因：** 自研客户端在 polling 模式下，服务端收到的最后一个参数有时是 **ack id（数字）**，不是回调函数；直接 `ack()` 会炸进程。

**修复：**

```javascript
// server.js
function socketReply(socket, event, ack, payload) {
  if (typeof ack === 'function') ack(payload);
  else socket.emit(`${event}:ack`, payload);
}
```

客户端 `emitAsync` 同时监听 `${event}:ack` fallback。

**教训：** 小程序环境不要假设官方 Socket.IO 客户端行为；关键路径要有 **无 ack 也不崩** 的防御。

### 1.4 P0 假设验证：埋点与指标

未验证的核心假设：**有多少人真的在承诺阶段提交了行动？14 天后 echo 链接有多少人打开？**

新增：

- 表 `analytics_events`：`session_started` / `phase_entered` / `commitment_created` / `echo_opened`  
- `GET /api/metrics` — 承诺转化率、echo 打开率、quick/full 模板分桶  

本地查看：

```bash
curl http://127.0.0.1:3001/api/metrics
```

### 1.5 SMART 承诺与计时器「峰终」

- **SMART 表单：** 做什么（≥8 字）+ 7/14/30 天 + 预览合成句；服务端 `smartCommitment.js` 二次校验  
- **计时器：** 大屏 `PhaseTimer` 同步 `timerEnd`，最后 10 秒红脉冲；小程序末 5 秒轻震动  

参考：《游戏感》Peak-End Rule — **时间压力是心流关键**。

---

## 二、破壳 Poke：校园信息 → 行动卡片

### 2.1 架构

```
RSS / mock / wechaty → ingest → AI pipeline → store → Express API (:5701) → 微信小程序
```

- **poke-server：** CommonJS Express，JSON 文件存储，DeepSeek 可选  
- **poke-miniprogram：** 今天 / 机会 / 搭子 / 复盘 / 我的  
- **独立仓库：** https://github.com/CHEN-taeo/poke（与 Idea Forge 代码分离部署时可只用 poke 目录）  

### 2.2 联调注意点

微信开发者工具里 **`127.0.0.1` 比 `localhost` 更稳定**：

```javascript
// poke-miniprogram/utils/config.js
const API_BASE = 'http://127.0.0.1:5701';
```

勾选 **不校验合法域名**；真机调试改局域网 IP。

东华 ingest 源配置在 `poke-server/data/sources.json`，`npm run poll` 可手动拉取。

---

## 三、本地跑起来

### Idea Forge

```bash
# 终端 1
npm run server    # :3001

# 终端 2（Web）
npm run dev       # :5173

# 小程序：打开 idea-forge-miniprogram，config 指向 127.0.0.1:3001
```

### 破壳

```bash
cd poke-server && npm install && npm start   # :5701
# 微信开发者工具打开 poke-miniprogram
```

---

## 四、后续路线图（节选）

完整版见仓库 `docs/IDEA_FORGE_ROADMAP.md`）

| 优先级 | 项 |
|--------|-----|
| P0 | 真实会议跑 Sprint 测试，看 `/api/metrics` |
| P1 | 角色机制化、会话导出、模板问题包 UI |
| P2 | 得分动画、Onboarding、空状态引导 |

---

## 五、总结

1. **双产品线 monorepo** 要分清端口与模块系统（ESM vs CommonJS），避免混改。  
2. **小程序 + Socket.IO** 必须单独验收 ack、polling、断线重连。  
3. **承诺是核心价值**，先埋点再做大功能；数据会告诉你要不要上 CRDT 画布。  
4. **破壳与熔炉** 服务不同场景，但共用「结构化输入 → 可执行输出」的产品哲学。  

如果这篇对你有用，欢迎 Star：https://github.com/CHEN-taeo/idea-forge  

---

*本文为开发日志，代码以 GitHub 仓库为准。*

# Idea Forge 专项改进地图

> Version 1.0 · 与 `PRODUCT_BRIEF.md` 对齐 · 用于优先级决策与假设验证

## 竞争定位

**不是：** 另一个数字白板（Miro/Mural 已占领）  
**不是：** 游戏化的会议（Kahoot 等已占领）  
**是：** 将结构化头脑风暴直接转化为可执行承诺的决策工具

核心差异化（必须同时具备，竞品缺一）：

1. 匿名并行发想（心理安全感）
2. 游戏化角色（参与许可）
3. 结构化压力测试（R3 质询）
4. 强制承诺机制（闭环）
5. 零门槛加入（QR 码，无账号）

对外一句话：

> 同一间屋里，手机静默共创 → 结构化质询 → 每人认领一件事。输出是承诺，不是便签。

---

## 11.1 按优先级排列的未完成工作

### P0（核心价值验证）

| 项 | 依据 | 状态 |
|----|------|------|
| 承诺完成率 / 承诺仪式验证 | 《Sprint》第 5 天测试框架 | 埋点已加：`session_started` / `commitment_created` / `echo_opened` → `GET /api/metrics` |
| 移动端全流程（R3 + CommitmentCeremony） | Jackbox 移动端设计法则 | 小程序 `room` 页已补齐各阶段 UI |
| 计时器体验优化 | 《游戏感》+ Peak-End Rule | `PhaseTimer` 末 10 秒脉冲；大屏同步 `timerEnd` |

### P1（核心玩法强化）

| 项 | 依据 | 状态 |
|----|------|------|
| 角色能力机制化 | 《游戏设计艺术》镜头 #33 | 待做：Contrarian 额外质询等 |
| 承诺模板 SMART 化 | Gollwitzer 1999 | 已做：三栏表单 + 服务端校验 |
| 共享构想画布 | CRDT/Yjs | 待做：当前为 broadcast 刷新 |
| 会话导出 | 《Sprint》会话文档 | 待做 |
| 模板引导问题集 | 《游戏风暴》 | 已加入 `GUIDED_QUESTION_SETS`（`game-data.ts`） |

### P2（体验打磨）

| 项 | 依据 | 状态 |
|----|------|------|
| 得分动画强化 | Kahoot / 峰终定律 | 待做 |
| 空状态 / Onboarding | 产品设计空状态章节 | 待做 |
| 角色介绍时机 | SDT 自主性 | 待做：开局展示而非提交时 |

---

## 11.2 用户研究优先问题

按「最重要的未验证假设」排序：

| # | 假设 | 指标 | 数据来源 |
|---|------|------|----------|
| 1 | 承诺仪式的转化率 | `commitment_created / players_at_commitment` | `/api/metrics` |
| 2 | 14 天后 echo 打开率 | `echo_opened / commitments` | `commitments.echo_opened_at` |
| 3 | 角色让人说得更多 | Contrarian 质询率 vs 其他角色 | `analytics_events` + `challenges` |
| 4 | 分数是否有意义 | 结束页微调查 | 手动 / 待内置 |
| 5 | quick vs full 完成率 | 按 `template` 分桶的承诺率 | `/api/metrics` |

### 如何跑 Sprint Day-5 测试

1. 真实团队 3–8 人，同一房间，大屏 + 手机
2. 记录：进入承诺阶段人数、提交承诺人数、14 天后 echo 打开
3. 访谈 3 题：承诺是否具体？计时是否有压力？角色有没有帮你说出平时不会说的话？

---

## 11.3 内置模板引导问题

见 `src/app/data/game-data.ts` → `GUIDED_QUESTION_SETS`：

- **产品决策**：用户最痛恨什么、只留一个功能、竞品不做的事
- **战略规划**：5 年后被记住什么、最大风险、资源减半先砍什么
- **团队回顾**：上季度骄傲的事、重来会改什么、超能力与盲点

创建房间时可选问题包（后续 UI）。

---

## 11.4 技术债与已知风险

- 小程序 Socket.IO 为自研客户端，ack 走 `${event}:ack` fallback（见 `server.js` `socketReply`）
- 计时器大屏与手机仍可能有几秒视觉差（本地 tick vs `timerEnd`）
- 无 API Key 时 AI 走模板 fallback，SMART 建议质量有限

---

## 相关文档

- [PRODUCT_BRIEF.md](./PRODUCT_BRIEF.md)
- [MOBILE_E2E_CHECKLIST.md](./MOBILE_E2E_CHECKLIST.md)

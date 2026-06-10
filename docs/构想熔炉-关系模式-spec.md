# 构想熔炉 · 关系模式（Relation Mode）功能 Spec

> **状态**：草案 v0.1 · 与 `quick` / `full` 并列的第三套 session 模板  
> **假设**：有结构 + 可见公平 + 低门槛表达 → 「讨论后还愿意合作」分数上升

---

## 1. 定位

| | quick | full | **relation（关系模式）** |
|--|-------|------|-------------------------|
| 目标 | 快决策 | 完整质询 | **讨论透 + 不伤关系 + 有承诺** |
| 积分 | 有 | 有 | **弱化或关闭排名** |
| R3 质询 | 跳过 | 有 | **可选**（默认简化版） |
| 独有 | — | — | 信号按钮、流程角色、复盘问卷 |

**一句话**：不是新 App，是 IF 上「围炉 + 关系护栏」。

---

## 2. MVP 范围（第一版必做）

### 2.1 会前（lobby 扩展，≤90 秒）

- [ ] **议题拆解**：AI 将 `problemStatement` 拆为 3 个子议题 + 建议顺序（事实→价值→政策）
- [ ] **流程角色抽签**：引导者、记录员、质疑者、连接者、计时员（每人 1 个，可重复缺省）
- [ ] **（可选 v1.1）匿名立场**：每人选 agree/neutral/disagree + 一句关注点，聚合展示（去标识）

### 2.2 会中（全阶段浮层 / 侧栏）

- [ ] **信号按钮**（每人可点，全员可见计数或仅引导者可见——默认仅 host/引导者可见明细）  
  - 我想发言  
  - 我们跑题了  
  - 我需要消化一下  
  - 我感到不舒服  
- [ ] **发言均衡提示**（仅引导者/host）：各玩家 message/idea 条数柱状图，无公开排名
- [ ] **话术模板**（一键复制到输入框，5 条）：  
  - 反馈式倾听  
  - 是的，而且…  
  - 我不同意，因为…  
  - 元沟通：回到核心问题  
  - Steel-man：我先复述你的观点…

### 2.3 会后（finished 前插入 `debrief` 或 finished 内嵌）

- [ ] **匿名心理安全 3 题**（1–5 李克特）：敢表达不同意见 / 被倾听 / 不担心因错被笑  
- [ ] **个人一句**：本次讨论关于「沟通本身」的洞察（可选）  
- [ ] **随机感谢**：系统配对，每人写一句对某人的具体感谢（仅对方可见或全员可见——默认全员）  
- [ ] **保留承诺仪式**（现有 `commitment` phase）

### 2.4 明确不做（MVP）

- 语音时长检测、语气 AI 审查  
- 飞书/微信浮层  
- 跨 session 关系图谱  
- 公开积分榜 / MVP 排名  

---

## 3. 阶段流（建议）

```
lobby → [议题+角色] → r1_submit → r1_guess → r2_adapt → [debrief] → commitment → finished
                              ↑ 信号按钮全程可用（socket 事件）
```

- **relation 模板** 可配置：是否包含 `r2_adapt`（默认含，比 quick 多，比 full 少 R3）  
- 或：**relation = quick + debrief + signals**，最快验证

---

## 4. 数据模型（草案）

```typescript
// game.ts 扩展
template: 'full' | 'quick' | 'relation';

type FacilitationRole = 'guide' | 'scribe' | 'challenger' | 'connector' | 'timer';

interface SignalEvent {
  id: string;
  playerId: string;
  type: 'want_speak' | 'off_topic' | 'need_pause' | 'uncomfortable';
  at: number;
}

interface DebriefResponse {
  playerId: string;
  safety: { speakUp: number; heard: number; safeToErr: number };
  insight?: string;
  thanksTo?: { targetPlayerId: string; message: string };
}

interface SessionAgenda {
  subTopics: string[];
  suggestedOrder: string[];
  controversyNotes?: string[];
}
```

**Socket 事件（新增）**  
- `send_signal` / `signal_broadcast`  
- `submit_debrief`  
- `ai_agenda`（lobby，复用 AI REST）

---

## 5. UI 触点

| 屏幕 | 改动 |
|------|------|
| LandingPage | 第三按钮或 create 时 `template: 'relation'`「围炉 · 关系模式」 |
| GameLobby | 展示子议题路线 + 角色分配结果 |
| RoundOne~Two | 底部固定信号条（4 按钮） |
| ScreenView | 引导者看信号计数 + 发言分布 |
| 新 DebriefPhase 或 GameFinished 前置 | 问卷 + 感谢 |
| 导出报告 | 增加：信号统计、心理安全均值（匿名）、感谢摘录 |

---

## 6. 隐私与文案（必写进产品）

- 信号与不舒适 **不通知全员具体是谁点了 uncomfortable**（仅引导者收到「有人需要关注」）  
- 复盘 **不排名、不默认导出给教师**  
- 开场一句：**「质询的是想法，不是人；承诺比得分重要。」**

---

## 7. 成功指标（验证用）

| 指标 | 方式 |
|------|------|
| 主指标 | 会后 1 题：「你还想和这组人讨论吗？」1–5 |
| 辅指标 | debrief 完成率、承诺提交率、信号按钮使用率 |
| 定性 | 3 场试跑用户访谈（各 15 分钟） |

---

## 8. 实现顺序（建议 2 周）

1. **Week 1**：`template: 'relation'` + 信号 socket + 引导者侧栏 + 话术复制  
2. **Week 2**：lobby AI 子议题 + debrief 问卷 + 导出扩展 + 中文文案  

---

## 9. 与知识库文档对照

- [[大学讨论-方法库]] → 议题拆解、方法×场景  
- [[大学讨论-困境诊断]] → 信号按钮对应困境  
- [[大学讨论-主持清单]] → checklist、冷场四步、冲突分型  
- [[小组讨论公约]] → 可嵌入 lobby 展示  

---

*关联产品 brief：`docs/PRODUCT_BRIEF.md` · 完整修订稿：`docs/大学讨论-方法困境与策略-修订稿.md`*

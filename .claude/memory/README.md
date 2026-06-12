# O.P.A.R.E 记忆系统

三层记忆 + 批量进化，配合 agent `opare-evolver`（`.claude/agents/opare-evolver.md`）。

## 目录

| 文件/目录 | 层级 | 用途 |
|-----------|------|------|
| `memory.md` | 热 | 核心规则，每次必载 |
| `projects/*.md` | 温 | 项目约定（如 `idea-forge.md`） |
| `domains/*.md` | 温 | 领域 SOP |
| `archive/` | 冷 | 归档，显式查询 |
| `experience-buffer.md` | — | 反思缓冲，批量进化输入 |
| `evolution-log.md` | — | 变更审计与 rollback |
| `regression-cases.md` | — | 进化后对照用例 |

## 常用操作

**手动记住偏好：** 用户确认后，按格式追加到 `memory.md`，写一条 `evolution-log.md`。

**运行批量进化：** 对 agent 说「运行进化」→ 评审 buffer 中 `已处理：否` → 最多改 3 项 → 对照 regression-cases。

**Pin 规则：** 条目设 `pin: 是` 防止被驱逐。

## v2 相对 v1 的关键修订

1. 外部信号驱动进化，自评不能单独改热记忆  
2. L1/L2/L3 分级，避免轻任务仪式过重  
3. 优先级仲裁：当前指令 > 记忆  
4. 偏好写入须确认；禁止存密钥  
5. 批量进化 + 回归用例 + rollback 日志  

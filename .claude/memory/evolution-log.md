# 进化日志 — 可审计、可回滚

> 每次记忆策略变更必须在此留痕。

<!-- 格式：
## [EVO-2026-06-12-01]
- 触发：外部纠正 | 测试失败 | 批量进化
- 修改：memory.md [M-xxx]
- 预期效果：__
- rollback：删除/恢复条目 …
- 回归对照：regression-cases #1 — 通过
-->

## [EVO-2026-06-12-00]
- 触发：协议 v2 初始化
- 修改：新建 opare-evolver agent + memory 脚手架
- 预期效果：结构化进化，外部信号驱动
- rollback：删除 `.claude/agents/opare-evolver.md` 与 `.claude/memory/`
- 回归对照：全部 — 不适用（初始化）

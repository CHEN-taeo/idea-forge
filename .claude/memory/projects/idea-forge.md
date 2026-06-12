# 温记忆 — 项目：idea-forge (monorepo)

> 按需加载。Idea Forge 与 Poke 共享仓库但无共享运行时。

## 产品线

| 产品 | 路径 | 后端端口 |
|------|------|----------|
| Idea Forge 构想熔炉 | 根目录、`idea-forge-miniprogram/` | 3001 |
| 破壳 Poke | `poke-server/`、`poke-miniprogram/` | 5701 |

## [M-2026-0612-P01]
- 规则：编辑前声明目标产品线；禁止 ESM/CJS 混用跨产品线
- 类型：约定
- 来源：[AGENTS.md]
- 置信度：高
- 状态：活跃
- last_used: 2026-06-12
- use_count: 0
- pin: 否

## [M-2026-0612-P02]
- 规则：小程序 dev 用 127.0.0.1 而非 localhost；微信开发者工具勾选不校验合法域名
- 类型：教训
- 来源：[会话 2026-06-11 连接超时排查]
- 置信度：高
- 状态：活跃
- last_used: 2026-06-12
- use_count: 0
- pin: 否

## [M-2026-0612-P03]
- 规则：小程序 Socket.IO 服务端须用 socketReply 处理非 function ack；客户端 emitAsync 监听 `${event}:ack`
- 类型：教训
- 来源：[server 崩溃 ack is not a function]
- 置信度：高
- 状态：活跃
- last_used: 2026-06-12
- use_count: 0
- pin: 否

## [M-2026-0612-P04]
- 规则：P0 指标见 GET /api/metrics；路线图 docs/IDEA_FORGE_ROADMAP.md
- 类型：SOP
- 来源：[2026-06-11 落地]
- 置信度：高
- 状态：活跃
- last_used: 2026-06-12
- use_count: 0
- pin: 否

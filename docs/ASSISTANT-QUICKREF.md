# 改哪里 → 读什么（助手速查）

| 你要改… | 先读 |
|---------|------|
| 整体架构 / 产品线 | `AGENTS.md` |
| React UI / 游戏流程 | `.cursor/rules/idea-forge-frontend.mdc` · `src/app/App.tsx` |
| 后端 / Socket / REST | `.cursor/rules/idea-forge-backend.mdc` · `server.js` |
| AI 提示词 / 新 AI 能力 | `ai.js` · `docs/AI-SURFACE.md` |
| 小程序 | `.cursor/rules/wechat-miniprogram.mdc` · `idea-forge-miniprogram/` |
| 破壳 Poke | `.cursor/rules/poke-server.mdc` · `poke-server/README.md` |
| 品牌文案 / 视觉 | `src/app/lib/brand.ts` · `docs/构想熔炉-设计语言.md` |
| 名士围炉 | `docs/构想熔炉-围炉群英会.md` · `RoundtableMode.tsx` |
| 移动端验收 | `docs/MOBILE_E2E_CHECKLIST.md` |
| 开发跑通 | `.cursor/skills/idea-forge-dev/SKILL.md` |

## 环境

```bash
cp .env.example .env
npm run server   # :3001
npm run dev      # :5173
```

小程序：`127.0.0.1:3001`，不校验合法域名。

## 铁律

1. 两个产品线无共享运行时 — 改前声明目标
2. 无 API Key 时 AI 必须有中文模板 fallback
3. 无 tsconfig/lint — 改完 `npm run build` 或跑 server 验证

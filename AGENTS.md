# AGENTS.md — Project guide for AI assistants

This repository is a **monorepo with two unrelated product lines**. Read this before making changes so you start with full context.

| Product | Location | What it is |
|---------|----------|------------|
| **Idea Forge** (炉边) | repo **root** (`/`), `idea-forge-miniprogram/` | Collaborative brainstorming game — React SPA + Express/Socket.IO + SQLite, optional Electron desktop; **WeChat mini program** |
| **破壳 / Poke** | `poke-mvp/`, `poke-miniprogram/`, `poke-server/` | Campus info filter → actionable cards |

The two products **share no runtime code**. Confirm which product a request targets before editing.

**Current focus (2026):** **炉边 / Idea Forge** only — `poke-*` is **shelved**; do not expand Poke unless explicitly requested. Primary user funnel: **拾念 → 名士围炉 → 落契**; multiplayer **入炉** is secondary.

---

## 1. Idea Forge (repo root)

### Stack
- **Frontend:** React 18, TypeScript/TSX, Vite 6, Tailwind v4, shadcn/Radix UI, Motion, Socket.IO client
- **Backend:** Node **ESM** (`"type": "module"`) — Express 5, Socket.IO 4, `better-sqlite3`
- **Desktop:** Electron + electron-builder (`electron-main.js` forks `server.js`)
- **WeChat mini program:** `idea-forge-miniprogram/` — WXML/WXSS/JS; `utils/config.js` → `SERVER_URL` (:3001); dev: 不校验合法域名
- **AI:** OpenAI-compatible API (DeepSeek by default), in `ai.js`

### Entry points
- `index.html` → `src/main.tsx` → `src/app/App.tsx` (routes game modes: lobby, rounds, solo, roundtable, hot-seat, screen view)
- `server.js` — HTTP + Socket.IO + REST; serves `dist/` in production (SPA fallback)
- `ai.js` — all server-side AI; `db.js` — SQLite layer (tables: `sessions`, `commitments`, `active_rooms`)
- `electron-main.js` — desktop wrapper; starts `server.js`, loads `http://localhost:3001`

### Commands (run from repo root)
```bash
npm run dev      # Vite dev server (:5173); client talks to VITE_SERVER_URL
npm run server   # node --env-file=.env server.js  (port 3001; alias: npm start)
npm run build    # vite build → dist/
npm run desktop  # electron .
npm run dist     # vite build + electron-builder --win
```
Local dev usually needs **two processes**: `npm run server` (backend :3001) and `npm run dev` (frontend :5173). Mini program only needs `npm run server` + 微信开发者工具打开 `idea-forge-miniprogram/`.

### Conventions
- Import alias `@/` → `src/`. shadcn/ui lives in `src/app/components/ui/`.
- Game types: `src/app/types/game.ts`. Static data: `src/app/data/game-data.ts`.
- Brand/copy strings: `src/app/lib/brand.ts` (driven by `VITE_BRAND_*` env). **Don't hardcode product names** — use brand helpers.
- Visual/brand: **`docs/构想熔炉-设计语言.md`** · `src/styles/theme.css` · `public/personas/` · `FireCore.tsx`
- UI copy is **Chinese**. Match existing tone.
- Client AI calls split by mode:
  - **Multiplayer** (prompts, expand, round summary) → Socket.IO events via `src/app/hooks/useGameSocket.ts`
  - **Solo / commitment** (SMART actions) → REST via `src/app/lib/aiClient.ts`

### AI surface (`ai.js`)
- Functions: `generatePrompts`, `expandIdea`, `analyzeRound`, `generateSmartAction`, `soloChallengeIdea`, `getStatus`
- REST: `/api/ai/status`, `/api/ai/solo/angles`, `/api/ai/smart-action`, `/api/ai/solo/challenge`
- REST: `GET /api/metrics` — P0 假设验证（承诺转化率、echo 打开率、模板分桶）
- REST (围炉群英会): `/api/ai/persona/dispatch`, `/api/ai/persona/reply`, `/api/ai/persona/summarize` — see **`docs/构想熔炉-围炉群英会.md`**
- Socket: `ai_generate_prompts`, `ai_expand`, `ai_round_summary`
- **No API key → hardcoded Chinese template fallback.** Preserve this fallback path in any AI change.

### Env (root `.env`)
Copy from **`.env.example`**. Key vars: `PORT`, `VITE_SERVER_URL`, `AI_API_KEY`, `AI_API_URL`, `AI_MODEL`, `BRAND_COACH_NAME`, `VITE_BRAND_*`.

### Assistant / AI dev assets (repo)
| Path | Purpose |
|------|---------|
| `AGENTS.md` | Architecture map (this file) |
| `.cursor/rules/*.mdc` | Cursor rules (monorepo, frontend, backend, mini program) |
| `.cursor/skills/idea-forge-dev/` | Dev workflow skill |
| `docs/AI-SURFACE.md` | REST + Socket AI quick reference |
| `docs/ASSISTANT-QUICKREF.md` | One-page「改哪里读什么」 |
| `docs/MOBILE_E2E_CHECKLIST.md` | Mini program + web E2E |
| `.claude/memory/projects/idea-forge.md` | Lessons (Socket ack, 127.0.0.1) |

---

## 2. Poke (`poke-server/`, `poke-miniprogram/`, `poke-mvp/`)

### poke-server (`poke-server/`)
- Node **CommonJS** (`require`), Express 4, `dotenv`. Storage = JSON files (`data/db.json`, `data/sources.json`).
- Flow: `RSS / mock / wechaty → src/ingest/* → src/ai/pipeline.js → src/store.js → src/modules.js → Express API (:5700)`
- AI: `src/ai/llm.js` (DeepSeek client) + `src/ai/pipeline.js` (LLM or regex-rule fallback).
- Optional live WeChat ingest via `wechaty` (`src/ingest/wechaty.js`) — high risk, off by default.
- Commands (run inside `poke-server/`):
  ```bash
  npm install && npm start   # http://localhost:5700
  npm run test:llm           # LLM smoke test
  npm run seed               # mock sample data
  npm run source[:list] / npm run poll   # RSS source CLI
  ```
- Env (`poke-server/.env.example`): `PORT`, `INGEST_MODE`, `LLM_API_KEY`, `LLM_BASE_URL`, `LLM_MODEL`, `WECHATY_PUPPET`, `ROOM_WHITELIST`, `INGEST_URLS`. Also used: `AUTO_INGEST`, `AUTO_INTERVAL_MIN`.

### poke-miniprogram (`poke-miniprogram/`)
- **WeChat mini-program** (WXML/WXSS/JS, CommonJS `module.exports`, `wx.*` APIs). Open in 微信开发者工具.
- Tabs: 今天 / 机会 / 搭子 / 复盘 / 我的 (+ `operator`, `forward` pages).
- `utils/config.js` sets `API_BASE` → poke-server. Offline-first: falls back to sample data when backend unreachable.

### poke-mvp (`poke-mvp/`)
- Single-file `index.html`, zero deps, `localStorage` only. Standalone prototype.

---

## 3. Cross-cutting notes & gotchas
- **Module systems differ:** Idea Forge = ESM; poke-server = CommonJS. Don't mix `import`/`require` across them.
- **No `tsconfig.json`** — TSX compiles via Vite + `@vitejs/plugin-react` only. There is no separate typecheck/lint/test step configured; verify changes by building/running.
- **AI fallback pattern** is intentional in both products: code must work without an API key. Keep template/rule fallbacks intact.
- Scaffold is **Figma-origin** (`@figma/my-make-file`, `figma:asset/` resolver in `vite.config.ts`).
- Root `README.md` is partially **stale** (claims frontend-only mock); the real Socket.IO + SQLite backend exists. Trust this file over that README.
- `poke-server/.runtime/` bundles Node 16 for Windows tooling; the app itself targets Node ≥18.
- This is a **Windows** environment; the shell is PowerShell.

---

## 4. Working agreements for assistants
- State which product (Idea Forge vs Poke) a change targets before editing.
- Preserve Chinese UI copy and the no-API-key fallback paths.
- Prefer editing existing files; match the surrounding module system and style.
- After substantive edits, build/run the affected product to verify rather than relying on a typecheck step (there isn't one).
- Only commit when explicitly asked.

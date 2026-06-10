# AGENTS.md — Project guide for AI assistants

This repository is a **monorepo with two unrelated product lines**. Read this before making changes so you start with full context.

| Product | Location | What it is |
|---------|----------|------------|
| **Idea Forge** (构想熔炉) | repo **root** (`/`) | Collaborative brainstorming game — React SPA + Express/Socket.IO + SQLite, optional Electron desktop |
| **破壳 / Poke** | `poke-mvp/`, `poke-miniprogram/`, `poke-server/` | Campus info filter → actionable cards |

The two products **share no runtime code**. Confirm which product a request targets before editing.

---

## 1. Idea Forge (repo root)

### Stack
- **Frontend:** React 18, TypeScript/TSX, Vite 6, Tailwind v4, shadcn/Radix UI, Motion, Socket.IO client
- **Backend:** Node **ESM** (`"type": "module"`) — Express 5, Socket.IO 4, `better-sqlite3`
- **Desktop:** Electron + electron-builder (`electron-main.js` forks `server.js`)
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
Local dev usually needs **two processes**: `npm run server` (backend :3001) and `npm run dev` (frontend :5173).

### Conventions
- Import alias `@/` → `src/`. shadcn/ui lives in `src/app/components/ui/`.
- Game types: `src/app/types/game.ts`. Static data: `src/app/data/game-data.ts`.
- Brand/copy strings: `src/app/lib/brand.ts` (driven by `VITE_BRAND_*` env). **Don't hardcode product names** — use brand helpers.
- UI copy is **Chinese**. Match existing tone.
- Client AI calls split by mode:
  - **Multiplayer** (prompts, expand, round summary) → Socket.IO events via `src/app/hooks/useGameSocket.ts`
  - **Solo / commitment** (SMART actions) → REST via `src/app/lib/aiClient.ts`

### AI surface (`ai.js`)
- Functions: `generatePrompts`, `expandIdea`, `analyzeRound`, `generateSmartAction`, `soloChallengeIdea`, `getStatus`
- REST: `/api/ai/status`, `/api/ai/solo/angles`, `/api/ai/smart-action`, `/api/ai/solo/challenge`
- REST (围炉群英会): `/api/ai/persona/dispatch`, `/api/ai/persona/reply`, `/api/ai/persona/summarize` — see **`docs/构想熔炉-围炉群英会.md`**
- Socket: `ai_generate_prompts`, `ai_expand`, `ai_round_summary`
- **No API key → hardcoded Chinese template fallback.** Preserve this fallback path in any AI change.

### Env (root `.env`)
`PORT`, `VITE_SERVER_URL`, `AI_API_KEY`, `AI_API_URL`, `AI_MODEL`, `BRAND_COACH_NAME`, `VITE_BRAND_*` (HOST_NAME, SLOGAN, SUBTITLE, SOLO, ROOM, PRODUCT).

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

---

## Cursor Cloud specific instructions

This checkout may contain **Idea Forge only** (no `poke-*` directories). Scope cloud setup to repo root unless Poke folders are present.

### Dev startup (two processes)
From repo root, after `npm install` and a root `.env` (see below):

```bash
npm run server          # Express + Socket.IO + SQLite on :3001
npm run dev             # Vite on :5173 (add -- --host 0.0.0.0 if exposing outside localhost)
```

Use **tmux** (or two terminals) for long-running servers. Prod-like single port: `npm run build && npm run server` → browse `:3001`.

### Root `.env` (not committed; create locally)
Minimum for dev:

```env
PORT=3001
VITE_SERVER_URL=http://localhost:3001
```

`AI_API_KEY` is optional — without it, `ai.js` uses Chinese template fallbacks (`/api/ai/status` → `mode: "template"`).

### Verify without a browser
- `curl http://localhost:3001/api/ai/status`
- Socket.IO `create_room` / `join_room` on `:3001` (see `server.js`)

### Lint / test
No ESLint, typecheck, or test script in root `package.json`. Verify with `npm run build` and manual or scripted smoke tests against running servers.

### Node
Use **Node 20+** (22.x works; required by `better-sqlite3` prebuilds). Package manager: **npm** (`package-lock.json`). `postinstall` runs `vite build` — first install takes longer.

### Poke (when present)
`poke-server`: `cd poke-server && npm install && npm start` (:5700). `poke-miniprogram` needs 微信开发者工具; `poke-mvp` is static `index.html` only.

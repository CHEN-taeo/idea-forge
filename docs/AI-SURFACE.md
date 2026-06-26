# AI surface — quick reference for assistants

Idea Forge LLM logic lives in **`ai.js`**. Client split by mode below.

**Rule:** every `ai.js` function must work **without** `AI_API_KEY` (Chinese template fallback).

## Env

| Var | Default | Used by |
|-----|---------|---------|
| `AI_API_KEY` | (empty) | `ai.js` |
| `AI_API_URL` | `https://api.deepseek.com/v1` | `ai.js` |
| `AI_MODEL` | `deepseek-chat` | `ai.js` |
| `BRAND_COACH_NAME` | `陈老师` | prompts in `ai.js` |

Status: `GET /api/ai/status` → `{ enabled, model }`

## REST (`server.js` → `aiClient.ts`)

| Endpoint | `ai.js` fn | Client use |
|----------|------------|------------|
| `POST /api/ai/solo/angles` | `soloChallengeIdea` (angles) | Solo mode |
| `POST /api/ai/smart-action` | `generateSmartAction` | Commitment / 落契 |
| `POST /api/ai/solo/challenge` | `soloChallengeIdea` | Solo challenge |
| `POST /api/ai/persona/dispatch` | persona dispatch | 名士围炉 |
| `POST /api/ai/persona/reply` | persona reply | 名士围炉 |
| `POST /api/ai/persona/summarize` | persona summarize | 名士围炉 |

## Socket.IO (`useGameSocket.ts`)

| Event | `ai.js` fn | Ack payload |
|-------|------------|-------------|
| `ai_generate_prompts` | `generatePrompts` | prompts[] |
| `ai_expand` | `expandIdea` | expanded text |
| `ai_round_summary` | `analyzeRound` | summary |
| `ai_status` | `getStatus` | status |

## Adding a new AI feature

1. Implement in `ai.js` (+ fallback).
2. Wire REST or Socket in `server.js`.
3. Wire client in `aiClient.ts` or `useGameSocket.ts`.
4. Update this file.

## Related docs

- `docs/构想熔炉-围炉群英会.md` — persona roundtable design
- `AGENTS.md` — full architecture
- `GET /api/metrics` — P0 metrics (not AI, but often edited together)

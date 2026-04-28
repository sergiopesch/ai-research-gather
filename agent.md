# Agent Guidelines for AI Research Paper Finder

Guidelines for AI agents working on this proof-of-concept codebase.

## Project Overview

A React + TypeScript frontend with a small Express API that:
- Discovers recent research papers from arXiv
- Generates AI podcast scripts with OpenAI
- Exports scripts for ElevenLabs text-to-speech

## Architecture Constraints

- No database
- No auth
- No saved episode library
- No backend persistence

## Key Files

| File | Purpose |
|------|---------|
| `src/hooks/usePaperSearch.ts` | Frontend paper discovery |
| `src/hooks/usePaperActions.ts` | Local selected-paper state |
| `src/hooks/useScriptGeneration.ts` | Script generation + export |
| `server/research.ts` | arXiv search logic |
| `server/openai.ts` | OpenAI script generation |
| `server/index.ts` | Express API server |

## Development

```bash
cp .env.example .env
# set OPENAI_API_KEY
npm run dev
```

Frontend: `http://localhost:8080`
API: `http://localhost:3001`

## Operational Notes

- Node 20+ is required.
- `.nvmrc` pins the expected local runtime to Node 20.
- The server loads environment variables from `.env` and `.env.local`.
- `npm run check` runs lint, server typecheck, and production build validation.
- `npm run eval:scripts -- --mock` validates local script quality without an OpenAI call.
- `npm run healthcheck` verifies the local API is responding on `/api/health`.
- GitHub Actions runs install, audit, mock script evaluation, check, and a server health smoke test.

## Common Tasks

### Add New Research Area
1. Edit `src/constants/research-areas.ts`
2. Mirror the matching server logic in `server/research.ts`

### Modify Podcast Script
1. Edit `server/openai.ts`

## Git Workflow

- Run `npm run check` before committing.
- Run `npm run eval:scripts -- --mock` when script generation behavior changes.

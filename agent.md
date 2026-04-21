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
OPENAI_API_KEY=your_key_here npm run dev
```

Frontend: `http://localhost:8080`
API: `http://localhost:3001`

## Common Tasks

### Add New Research Area
1. Edit `src/constants/research-areas.ts`
2. Mirror the matching server logic in `server/research.ts`

### Modify Podcast Script
1. Edit `server/openai.ts`

## Git Workflow

- Run `npm run build` before committing
- Run `npm run lint` before committing

# AI Research Paper Finder

A small proof of concept for browsing recent arXiv papers and turning one selected paper into a podcast-style script.

## Architecture

This version intentionally removes Supabase and all database persistence.

- Paper discovery is fetched live from arXiv.
- Search results use the paper abstract directly.
- Script generation happens on demand through a local Node API.
- Nothing is stored. Download the generated script if you want to keep it.

## Stack

- Frontend: React 18, TypeScript, Vite, TanStack Query
- Styling: Tailwind CSS, Radix UI, shadcn/ui
- API: Express
- AI: OpenAI

## Quick Start

```bash
npm install
OPENAI_API_KEY=your_openai_api_key npm run dev
```

Frontend: `http://localhost:8080`
API: `http://localhost:3001`

## Scripts

```bash
npm run dev
npm run build
npm run preview
npm run lint
```

## Environment

```env
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
PORT=3001
```

Only `OPENAI_API_KEY` is required.

## Project Structure

```text
src/
  components/   React UI
  hooks/        Frontend search, selection, and script hooks
  pages/        App routes
  constants/    Research area definitions

server/
  index.ts      Express API entrypoint
  research.ts   arXiv search and filtering
  openai.ts     Podcast script generation
  types.ts      Shared server-side types
```

## POC Constraints

- No auth
- No paper history
- No episode library
- No background jobs
- No database

## License

MIT

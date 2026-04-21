# AI Research Paper Finder

A small proof of concept for browsing recent arXiv papers and turning one selected paper into a podcast-style script.

## Architecture

This version intentionally removes Supabase and all database persistence.

- Paper discovery is fetched live from arXiv.
- Search results use the paper abstract directly.
- Script generation happens on demand through a local Node API.
- Nothing is stored. Download the generated script if you want to keep it.

## Screenshots

### Home

![Home screen](docs/screenshots/home.png)

### Processing Studio

![Processing studio empty state](docs/screenshots/processing-empty.png)

## Stack

- Frontend: React 18, TypeScript, Vite, TanStack Query
- Styling: Tailwind CSS, Radix UI, shadcn/ui
- API: Express
- AI: OpenAI

## Quick Start

```bash
nvm use
npm install
cp .env.example .env
# fill in OPENAI_API_KEY
npm run dev
```

Frontend: `http://localhost:8080`
API: `http://localhost:3001`

## Scripts

```bash
npm run dev
npm run build
npm run preview
npm run lint
npm run check
npm run healthcheck
```

## Tooling Baseline

- Node 20 is the expected local and CI runtime.
- `.nvmrc` is included for local version alignment.
- A lightweight GitHub Actions workflow validates `npm ci`, `npm run lint`, and `npm run build`.

## Environment

```env
HOST=127.0.0.1
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
PORT=3001
ARXIV_USER_AGENT=
```

Only `OPENAI_API_KEY` is required.
`ARXIV_USER_AGENT` is optional and can be used to identify your deployment when calling arXiv RSS.

## Local Operations

- `npm run dev` starts both the Vite frontend and the local API server.
- `npm run preview` builds the frontend and serves the built app through the API server.
- `npm run healthcheck` hits `GET /api/health` on the configured local port.
- The frontend proxies `/api/*` requests to the local server during development.

## Deployment Notes

This repo is optimized for lightweight POC hosting, not a full production platform.

- Build the frontend with `npm run build`.
- Run the server with `npm run start`.
- Set `OPENAI_API_KEY` in the runtime environment.
- Serve the repository as a single Node process. The Express server will serve `dist/` automatically after a build.
- Serverless-style `/api/*` entrypoints are included for Vercel-compatible hosting.

Good fits:
- Vercel
- Railway
- Render
- Fly.io
- A small VPS with Node 20+

Not included on purpose:
- Docker
- CI/CD workflows
- database migrations
- background workers
- secrets management beyond env vars

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

## Health Endpoint

`GET /api/health` returns:

```json
{"ok":true}
```

## License

MIT

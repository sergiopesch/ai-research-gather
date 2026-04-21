# AI Research Paper Finder

Quick reference for development.

## Commands

```bash
nvm use         # Node 20
npm install    # Install dependencies
npm run dev    # Frontend on http://localhost:8080, API on http://localhost:3001
npm run build  # Production build
npm run lint   # ESLint check
npm run check  # Lint + production build
```

## Architecture

```
src/
├── components/
│   ├── research/           # HeroSection, AreaSelector, PaperCard
│   └── ui/                 # shadcn/ui components
├── hooks/
│   ├── usePaperSearch.ts   # Paper discovery
│   ├── usePaperActions.ts  # Paper selection
│   └── useScriptGeneration.ts  # Podcast scripts
├── pages/
│   ├── Index.tsx           # Paper discovery
│   └── ProcessingHub.tsx   # Podcast studio
└── utils/
    └── validation.ts       # API validation helpers

server/
├── index.ts                # Express API
├── research.ts             # arXiv fetching + filtering
├── openai.ts               # OpenAI script generation
└── types.ts                # Shared server-side types
```

## Data Flows

### Paper Discovery
```
AreaSelector -> usePaperSearch -> /api/papers -> arXiv -> PaperCard
```

### Script Generation
```
PaperCard -> usePaperActions -> ProcessingHub -> /api/generate-script -> OpenAI
```

## Environment Variables

- `HOST` - Optional, defaults to `127.0.0.1`
- `OPENAI_API_KEY` - Required
- `OPENAI_MODEL` - Optional model override
- `PORT` - Optional, defaults to `3001`

## CI

GitHub Actions validates `npm ci`, `npm run lint`, and `npm run build` on pushes to `main` and on pull requests.

## Podcast Characters

- **Dr. Rowan Patel** (Aria voice) - Expert researcher
- **Alex Hughes** (Liam voice) - Curious host

## Common Tasks

### Add Research Area
Edit `src/constants/research-areas.ts`
Also update `server/research.ts`

### Modify Podcast Format
Edit `server/openai.ts`

### Local Health Check
Run `npm run healthcheck`

### Change Voice Settings
Edit `src/hooks/useScriptGeneration.ts`

## Validation Utilities

```typescript
import { getApiError, getValidPapers, sanitizeText } from '@/utils/validation';

// Check for API errors
const error = getApiError(response);
if (error) throw new Error(error);

// Get valid papers (filters malformed entries)
const papers = getValidPapers(response);

// Sanitize text input
const clean = sanitizeText(userInput);
```

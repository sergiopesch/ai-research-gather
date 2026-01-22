# AI Research Paper Finder

Quick reference for development.

## Commands

```bash
npm install    # Install dependencies
npm run dev    # Dev server at http://localhost:8080
npm run build  # Production build
npm run lint   # ESLint check
```

## Architecture

```
src/
├── components/
│   ├── research/           # HeroSection, AreaSelector, PaperCard
│   ├── studio/             # EpisodeLibrary
│   └── ui/                 # shadcn/ui components
├── hooks/
│   ├── usePaperSearch.ts   # Paper discovery
│   ├── usePaperActions.ts  # Paper selection
│   ├── useScriptGeneration.ts  # Podcast scripts
│   └── useEpisodes.ts      # Episode CRUD
├── pages/
│   ├── Index.tsx           # Paper discovery
│   └── ProcessingHub.tsx   # Podcast studio
└── utils/
    └── validation.ts       # API validation helpers

supabase/functions/
├── paperFinder/            # arXiv API + AI summaries
├── generatePodcastScript/  # OpenAI script generation
├── processPaper/           # Paper processing
└── selectPaper/            # Paper selection
```

## Data Flows

### Paper Discovery
```
AreaSelector -> usePaperSearch -> paperFinder -> arXiv -> PaperCard
```

### Script Generation
```
PaperCard -> usePaperActions -> ProcessingHub -> generatePodcastScript -> OpenAI
```

## Database Tables

- `papers` - Paper metadata (title, url, doi, source, published_date)
- `paper_assets` - Summaries and scripts
- `episodes` - Saved podcast episodes

## Environment Variables

Supabase Edge Functions:
- `OPENAI_API_KEY` - Required

## Podcast Characters

- **Dr. Rowan Patel** (Aria voice) - Expert researcher
- **Alex Hughes** (Liam voice) - Curious host

## Common Tasks

### Add Research Area
Edit `src/constants/research-areas.ts`

### Modify Podcast Format
Edit `supabase/functions/generatePodcastScript/index.ts`

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

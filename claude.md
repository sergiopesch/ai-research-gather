# The Notebook Pod Studio

AI-powered research paper discovery and podcast production application.

## Quick Start

```bash
npm install    # Install dependencies
npm run dev    # Start dev server on http://localhost:8080
npm run build  # Production build
npm run lint   # Run ESLint
```

## Project Overview

This application allows users to:
1. Discover cutting-edge research papers from arXiv (AI, Robotics, Computer Vision)
2. Transform papers into engaging podcast episodes via AI-generated scripts
3. Download scripts in ElevenLabs-compatible JSON or plain text format

## Architecture

```
src/
├── components/
│   ├── research/           # Paper discovery UI (HeroSection, AreaSelector, PaperCard)
│   ├── studio/             # Podcast production (EpisodeLibrary)
│   └── ui/                 # shadcn/ui components
├── hooks/
│   ├── usePaperSearch.ts   # Fetch papers from arXiv via edge function
│   ├── usePaperActions.ts  # Paper selection & processing workflow
│   ├── useScriptGeneration.ts # Podcast script generation
│   └── useEpisodes.ts      # Episode CRUD operations
├── pages/
│   ├── Index.tsx           # Research paper discovery
│   └── ProcessingHub.tsx   # Podcast production studio
└── integrations/supabase/  # Supabase client & types

supabase/functions/
├── paperFinder/            # Discover papers via arXiv API
├── generatePodcastScript/  # Generate podcast scripts (OpenAI GPT-4.1)
├── processPaper/           # Process paper summaries
└── selectPaper/            # Handle paper selection
```

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, TanStack Query
- **UI**: Tailwind CSS, Radix UI, shadcn/ui
- **Backend**: Supabase (PostgreSQL, Edge Functions)
- **AI**: OpenAI GPT-4.1-2025-04-14
- **TTS Integration**: ElevenLabs voice IDs (Aria, Liam)

## Key Data Flows

### Paper Discovery
```
AreaSelector → usePaperSearch → paperFinder edge function → arXiv API → PaperCard grid
```

### Script Generation
```
PaperCard → usePaperActions → selectPaper → ProcessingHub →
useScriptGeneration → generatePodcastScript → OpenAI → Script Preview
```

## Database Tables

- `papers` - Research papers with metadata
- `paper_assets` - Summaries and generated scripts
- `episodes` - Saved podcast episodes

## Environment Variables

Required in Supabase Edge Functions:
- `OPENAI_API_KEY` - OpenAI API key for script generation

## Podcast Characters

- **Dr. Rowan Patel** (voice: Aria) - Expert researcher, translates technical content
- **Alex Hughes** (voice: Liam) - Curious host, asks listener questions

## Development Notes

- QueryClient configured with 5min stale time, 1 retry
- Error boundaries wrap the entire app
- localStorage persists selected paper across sessions
- All edge functions have `verify_jwt = false` for public access

## Common Tasks

### Add a new research area
1. Edit `src/constants/research-areas.ts`
2. Add area with keywords and display name

### Modify podcast script format
1. Edit `supabase/functions/generatePodcastScript/index.ts`
2. Update `conversationFlow` array with new segments/prompts

### Change voice settings
1. Edit `src/hooks/useScriptGeneration.ts`
2. Update voice IDs in `downloadElevenLabsScript` function

# AI Research Paper Finder

A minimalist React application for discovering research papers from arXiv and transforming them into AI-generated podcast scripts.

## Features

- **Paper Discovery** - Find latest papers from arXiv across Robotics, Computer Vision, and Large Language Models
- **AI Summaries** - Get intelligent summaries powered by OpenAI
- **Podcast Generation** - Transform papers into engaging podcast conversations
- **ElevenLabs Export** - Download scripts in ElevenLabs-compatible format

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, TanStack Query
- **Styling**: Tailwind CSS, Radix UI, shadcn/ui
- **Backend**: Supabase (PostgreSQL, Edge Functions)
- **AI**: OpenAI GPT-4.1

## Quick Start

```bash
npm install     # Install dependencies
npm run dev     # Start dev server at http://localhost:8080
npm run build   # Build for production
npm run lint    # Run ESLint
```

## Project Structure

```
src/
├── components/
│   ├── research/     # Paper discovery components
│   ├── studio/       # Podcast production components
│   └── ui/           # shadcn/ui components
├── hooks/            # Custom React hooks
├── pages/            # Route pages
├── types/            # TypeScript definitions
├── utils/            # Utility functions
└── constants/        # App constants

supabase/functions/
├── paperFinder/      # arXiv API integration
├── generatePodcastScript/  # OpenAI script generation
├── processPaper/     # Paper processing
└── selectPaper/      # Paper selection handler
```

## Configuration

The application uses Supabase for backend services:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Edge Functions require:
- `OPENAI_API_KEY` - For AI summaries and script generation

## Development

### Testing Edge Functions

```bash
# Run Deno tests locally (requires local Supabase)
deno test supabase/functions/paperFinder/test.ts
```

### Adding Research Areas

Edit `src/constants/research-areas.ts` to add new areas with keywords.

### Modifying Podcast Format

Edit `supabase/functions/generatePodcastScript/index.ts` to customize the conversation flow.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with `npm run build`
5. Submit a pull request

## License

MIT License

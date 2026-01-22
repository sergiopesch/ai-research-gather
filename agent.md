# Agent Guidelines for AI Research Paper Finder

Guidelines for AI agents working on this codebase.

## Project Overview

A React + TypeScript application that:
- Discovers research papers from arXiv via Supabase Edge Functions
- Generates AI podcast scripts using OpenAI GPT-4.1
- Exports scripts for ElevenLabs text-to-speech

## Code Conventions

### TypeScript
- Strict TypeScript with explicit types
- Prefer interfaces for objects, types for unions/functions
- Avoid `any` - use `unknown` or generics

### React
- Functional components with hooks only
- Custom hooks in `src/hooks/`
- TanStack Query for server state

### File Organization
```
src/components/{feature}/ComponentName.tsx  # Feature components
src/components/ui/component-name.tsx        # shadcn/ui (kebab-case)
src/hooks/useHookName.ts                    # Hooks (camelCase)
src/pages/PageName.tsx                      # Pages (PascalCase)
```

### Styling
- Tailwind CSS utility classes
- Minimalist monochrome design (white/black/gray)
- shadcn/ui components from `src/components/ui/`

## Key Files

| File | Purpose |
|------|---------|
| `src/hooks/usePaperSearch.ts` | Paper discovery with validation |
| `src/hooks/useScriptGeneration.ts` | Podcast script generation |
| `src/hooks/useEpisodes.ts` | Episode CRUD |
| `src/utils/validation.ts` | API response validation |
| `supabase/functions/paperFinder/index.ts` | arXiv API integration |
| `supabase/functions/generatePodcastScript/index.ts` | OpenAI integration |

## Edge Functions (Deno)

Located in `supabase/functions/`. Each function:
- Uses Deno runtime
- Has CORS headers configured
- Uses Zod for request validation
- Has `verify_jwt = false` in config.toml

### Testing Edge Functions
```bash
deno test supabase/functions/paperFinder/test.ts
```

## Common Tasks

### Add New Research Area
1. Edit `src/constants/research-areas.ts`
2. Add area with `id`, `label`, `keywords`, `icon`

### Modify Podcast Script
1. Edit `supabase/functions/generatePodcastScript/index.ts`
2. Update `conversationFlow` array

### Change Database Schema
1. Create migration in `supabase/migrations/`
2. Update types in `src/integrations/supabase/types.ts`

## Error Handling

- Try/catch in async functions
- User-friendly errors via toast notifications
- Console logging for debugging
- ErrorBoundary for React errors

## Validation

The `src/utils/validation.ts` file provides:
- `getApiError(data)` - Check for API errors
- `getValidPapers(data)` - Filter valid papers from response
- `sanitizeText(text)` - Clean text input

## Security Notes

- Supabase anon key in client (public by design)
- Sensitive keys (OpenAI) in Supabase Edge Function env
- CORS configured on all edge functions

## Git Workflow

- Feature branches from main
- Run `npm run build` before committing
- Run `npm run lint` for issues

# Agent Guidelines for The Notebook Pod Studio

This document provides guidelines for AI agents working on this codebase.

## Project Context

The Notebook Pod Studio is a React + TypeScript application that:
- Discovers research papers from arXiv via Supabase Edge Functions
- Generates AI podcast scripts using OpenAI GPT-4.1
- Exports scripts for ElevenLabs text-to-speech production

## Code Style & Conventions

### TypeScript
- Use strict TypeScript with explicit types
- Prefer interfaces over type aliases for objects
- Use `type` for unions, functions, and mapped types
- Avoid `any` - use `unknown` or proper generics

### React Patterns
- Functional components with hooks only
- Custom hooks in `src/hooks/` for reusable logic
- TanStack Query for server state management
- localStorage for client-side persistence

### File Organization
```
src/components/{feature}/ComponentName.tsx  # Feature components
src/components/ui/component-name.tsx        # shadcn/ui components (kebab-case)
src/hooks/useHookName.ts                    # Custom hooks (camelCase)
src/pages/PageName.tsx                      # Route pages (PascalCase)
src/types/domain.ts                         # Type definitions
```

### Styling
- Tailwind CSS utility classes only
- Design system colors defined in `tailwind.config.ts`
- Apple-inspired minimalist aesthetic (white background, black text)
- Use shadcn/ui components from `src/components/ui/`

## Key Files to Understand

| File | Purpose |
|------|---------|
| `src/App.tsx` | Router setup, providers, QueryClient config |
| `src/hooks/usePaperSearch.ts` | Paper discovery logic |
| `src/hooks/useScriptGeneration.ts` | Podcast script generation |
| `src/hooks/useEpisodes.ts` | Episode CRUD with Supabase |
| `supabase/functions/generatePodcastScript/index.ts` | OpenAI integration |
| `supabase/functions/paperFinder/index.ts` | arXiv API integration |

## Edge Functions (Deno)

Located in `supabase/functions/`. Each function:
- Uses Deno runtime with TypeScript
- Has CORS headers configured
- Uses Zod for request validation
- Has `verify_jwt = false` in config.toml

### Adding a New Edge Function
```bash
# Create function directory
mkdir supabase/functions/newFunction

# Create index.ts with serve() handler
# Add to supabase/config.toml [functions.newFunction]
```

## Testing Changes

```bash
npm run build      # Verify TypeScript compilation
npm run lint       # Check for ESLint issues
npm run dev        # Test locally at http://localhost:8080
```

## Common Modifications

### Add New UI Component
1. Check if shadcn/ui has it: https://ui.shadcn.com/docs/components
2. If custom, create in `src/components/{feature}/`
3. Use Tailwind + Radix primitives

### Modify Podcast Script Format
1. Edit `supabase/functions/generatePodcastScript/index.ts`
2. Update `conversationFlow` array for new segments
3. Adjust OpenAI system prompts as needed

### Add New Research Area
1. Edit `src/constants/research-areas.ts`
2. Add object with `id`, `name`, `keywords`, `color`

### Change Database Schema
1. Create migration in `supabase/migrations/`
2. Update types in `src/integrations/supabase/types.ts`

## Error Handling

- Use try/catch in async functions
- Display user-friendly errors via toast notifications
- Log detailed errors to console for debugging
- ErrorBoundary catches React component errors

## Performance Considerations

- QueryClient uses 5-minute stale time
- Avoid unnecessary re-renders with proper deps arrays
- Keep bundle size minimal (currently ~466KB gzipped: 141KB)
- Lazy load routes if adding more pages

## Security Notes

- Supabase keys in client are public (anon key only)
- Sensitive keys (OpenAI) stored in Supabase Edge Function env
- No user input rendered as HTML without sanitization
- CORS configured on all edge functions

## Git Workflow

- Feature branches from main
- Clear, descriptive commit messages
- Run `npm run build` before committing
- Run `npm run lint` to catch issues early

## Debugging Tips

1. **Edge function errors**: Check Supabase dashboard logs
2. **API failures**: Browser DevTools Network tab
3. **React state issues**: React DevTools extension
4. **Build errors**: Check terminal output from `npm run build`

## Contact Points

- Edge function configs: `supabase/config.toml`
- Tailwind design tokens: `tailwind.config.ts`
- TypeScript config: `tsconfig.json`
- Vite build config: `vite.config.ts`

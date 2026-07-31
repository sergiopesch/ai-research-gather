# Contributing

Thanks for improving Research Notebook.

## Development setup

Requirements: Node.js 24 and npm.

```bash
nvm use
npm ci
cp .env.example .env.local
npm run dev
```

The deterministic demo route makes UI and workflow development possible without provider credentials. Use real providers only when a change specifically requires end-to-end provider validation.

## Required checks

Before opening a pull request:

```bash
npm run check
npm run eval:scripts -- --mock
```

Run `npm run check:ci` when dependencies, deployment, model routing, generation, or CI configuration changed. It adds the dependency audit used by GitHub Actions.

## Change guidelines

- Keep the public, owner, and local execution modes separate.
- Keep provider credentials and subscription tokens out of browser code and logs.
- Treat `server/model-catalog.ts` as the source of truth for selectable routes.
- Validate every provider/model route on the server; never trust a client-supplied model identifier.
- Preserve progressive rendering: finished turns should appear before the full conversation or voice queue completes.
- Keep conversation-turn limits synchronized through `shared/conversation.ts`.
- Add or update tests for request schemas, routing, conversation length, exports, and user-visible state changes.
- Keep the initial browser bundle small; load optional export or provider tooling only when used.
- Do not commit generated evaluation reports, `.env*`, `.vercel/`, audio, or temporary browser artifacts.

## Project map

| Path | Responsibility |
| --- | --- |
| `src/` | React application, Studio components, hooks, playback, and export |
| `shared/` | Browser/server domain types and conversation constraints |
| `server/` | Shared handlers, provider catalogue, generation, auth, quotas, and Express runtime |
| `api/` | Thin Vercel function entrypoints |
| `evals/` | Deterministic and provider-backed conversation quality evaluation |
| `scripts/` | Operator utilities that do not belong in application runtime code |

## Provider changes

When adding or updating a model:

1. Update the explicit allowlist in `server/model-catalog.ts`.
2. Confirm its availability class: free, local key, subscription, or demo.
3. Update the relevant AI SDK adapter only if the provider contract changed.
4. Add catalogue and route-validation coverage.
5. Run mock evaluation and a narrow real-provider test when credentials are available.
6. Document any new environment variable in `.env.example`, `README.md`, and `docs/operations.md`.

## Pull request checklist

- [ ] The change is focused and preserves existing user work
- [ ] Client and server types pass
- [ ] Tests and production build pass
- [ ] Mock script evaluation passes when generation changed
- [ ] Desktop and mobile behavior were checked for UI changes
- [ ] Documentation and environment examples match the implementation
- [ ] No secret or generated artifact is included

Security-sensitive findings should follow [SECURITY.md](SECURITY.md), not a public issue.

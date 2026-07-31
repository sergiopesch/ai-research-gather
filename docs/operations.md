# Operations and deployment

This runbook covers local operations, the canonical Vercel deployment, production verification, rollback, and secret rotation.

## Runtime contract

- Node.js: 24.x
- Package manager: npm with committed `package-lock.json`
- Frontend output: `dist/`
- Local API: Express on `HOST` and `PORT`
- Vercel API: one serverless entrypoint per file in `api/`
- Health endpoint: `GET /api/health` → `{"ok":true}`

Use `npm ci` for deterministic installs. `tsx` is a production dependency because conventional Node hosts run the TypeScript server entrypoint directly.

## Environments

### Local development

```bash
nvm use
npm ci
cp .env.example .env.local
npm run dev
```

`.env.local` overrides `.env` and is ignored by Git. Never add secrets to variables prefixed with `VITE_`; those are compiled into browser code.

### Preview and production

Vercel variables are scoped independently to Development, Preview, and Production. Mark provider keys, Redis tokens, the owner hash, and the session secret as sensitive.

Minimum hosted public studio:

- `PUBLIC_AI_ENABLED=true`
- `PUBLIC_SCRIPT_LIMIT_PER_DAY=1`
- AI Gateway authentication through Vercel OIDC or `AI_GATEWAY_API_KEY`
- `APP_ORIGIN` set to the canonical HTTPS origin

Recommended production additions:

- Upstash REST URL and token for durable quotas and cache entries
- `OWNER_ACCESS_KEY_HASH` and `SESSION_SECRET` for private owner access
- Only the direct provider keys the owner intends to expose after authentication

Do not configure the legacy plaintext `OWNER_ACCESS_KEY`. Generate the hashed setup with:

```bash
npm run owner:secrets
```

## Pre-release verification

Run the same validation used by GitHub Actions:

```bash
npm ci
npm run check:ci
```

For a local server smoke test:

```bash
npm run build
npm run start
```

In another terminal:

```bash
npm run healthcheck
```

Set `HEALTHCHECK_URL` to test a non-local health endpoint.

## Vercel blue/green deployment

Run Vercel commands from the repository root containing `.vercel/project.json`.

```bash
npx vercel --prod --skip-domain --yes
```

Record the candidate URL from the command output, then verify it without disabling deployment protection:

```bash
npx vercel curl /api/health --deployment <candidate-url>
npx vercel curl /api/models --deployment <candidate-url>
npx vercel curl / --deployment <candidate-url>
```

Expected anonymous catalogue properties:

- `mode` is `hosted-free`
- `authenticated` is `false`
- `maxConversationTurns` is `8`
- paid direct providers are not reported as configured

Promote only the verified candidate:

```bash
npx vercel promote <candidate-url> --yes
```

Then verify the canonical URL:

```bash
HEALTHCHECK_URL=https://ai-research-gather.vercel.app/api/health npm run healthcheck
```

Complete one browser smoke test covering paper search, Studio entry, generation, voice when configured, and episode export.

## Rollback

If production verification fails, use the previous known-good deployment URL:

```bash
npx vercel rollback <known-good-deployment-url>
```

After rollback, repeat the canonical health and model-catalogue checks. Do not repair a failing production deployment in place when a verified previous deployment is available.

## Secret rotation

1. Create the replacement secret in the provider or with `npm run owner:secrets`.
2. Update the sensitive Vercel variable for the intended environment. Use the interactive prompt or stdin; never place a secret in a command-line flag.
3. Deploy a new candidate so serverless functions receive the new environment.
4. Verify the affected authenticated route.
5. Promote the candidate.
6. Revoke the old provider credential.

Example interactive update:

```bash
npx vercel env update OPENAI_API_KEY production --sensitive
```

Changing an environment variable does not update an already-running deployment; a redeploy is required.

## Quotas and cost controls

- Keep `PUBLIC_SCRIPT_LIMIT_PER_DAY` deliberately small.
- Configure Upstash before relying on quotas across multiple serverless instances.
- Apply an AI Gateway budget and a Vercel WAF rate-limit rule as defense in depth.
- Keep the public model allowlist limited to verified zero-cost routes.
- Recheck upstream availability and pricing before changing `server/model-catalog.ts`.
- Speech is never public by default; it requires a local or authenticated owner route.

## Monitoring and incident checks

Start with these signals:

1. `GET /api/health`
2. Anonymous `GET /api/models`
3. Vercel function logs for the failing API route
4. Provider status and quota dashboards
5. Upstash connectivity when limits or caching behave unexpectedly

Never log request cookies, provider keys, owner access keys, full authorization headers, or generated audio bytes.

## Conventional Node hosting

Railway, Render, Fly.io, and a small VPS can run the single Express process:

```bash
npm ci
npm run build
npm run start
```

The server serves `dist/` when it exists. Terminate TLS at the hosting platform, set `APP_ORIGIN` to the public HTTPS origin, bind `HOST` as required by the platform, and provide durable Redis storage before enabling shared public quotas.

## Release checklist

- [ ] `npm run check:ci` passes on Node 24
- [ ] No `.env*`, `.vercel/`, reports, or generated audio are staged
- [ ] Candidate health, catalogue, and page checks pass
- [ ] Public mode exposes only intended free routes and an 8-turn maximum
- [ ] Owner mode exposes only configured providers and a 20-turn maximum
- [ ] Conversation, voice, playback, and export smoke tests pass
- [ ] Candidate is promoted only after verification
- [ ] Canonical health check passes after promotion

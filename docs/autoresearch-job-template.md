# AutoResearch Job Template

## Goal

Improve the local podcast script generator so scripts feel like two agents having a grounded, real-time research conversation. Accept only changes that preserve JSON validity, factual grounding, and repository hygiene.

## Editable Files

- `server/openai.ts`
- `server/handlers.ts`
- `server/types.ts`
- `src/hooks/useScriptGeneration.ts`
- `src/pages/ProcessingHub.tsx`
- `package.json`
- `package-lock.json`
- `.gitignore`
- `evals/papers.json`
- `evals/run-script-eval.ts`
- `evals/judge-script.ts`
- `evals/score-schema.ts`
- `.github/workflows/ci.yml`
- `docs/autoresearch-job-template.md`
- Optional prompt file, if it keeps the implementation simpler

## Protected Files

- `.env.local`
- `.autoresearch/`
- `evals/reports/`
- `evals/tmp/`
- Auth, database, queues, and background job code

## Scoring Formula

- 22% factual grounding and no forbidden claims
- 14% relevance to expected topics
- 9% structure: problem, method, contribution, limitation, takeaway
- 10% JSON validity and schema consistency
- 6% TTS readiness
- 10% conversational flow
- 8% turn naturalness
- 6% latency and token efficiency
- 6% agent handoff quality
- 5% low generic filler
- 4% user listenability

## Local Commands

Run mock evaluation:

```bash
npm run eval:scripts -- --mock
```

Run real OpenAI evaluation when `OPENAI_API_KEY` is available:

```bash
npm run eval:scripts -- --real
```

Run available project checks:

```bash
npm run check
npm audit --audit-level=moderate
npm run healthcheck
```

## Acceptance Rule

Accept a change only if:

- `npm run eval:scripts -- --mock` passes.
- `npm run eval:scripts -- --real` passes when `OPENAI_API_KEY` is available.
- Real eval average score improves or stays at or above `85`.
- JSON validity remains `100%`.
- Factual grounding average remains at or above `90`.
- Conversational flow average remains at or above `80`.
- Dialogue naturalness improves or remains clearly conversational in fixture samples.
- Average fixture generation time is reported and does not regress significantly; for now this is report-only unless it becomes extreme.
- No `.env.local`, `evals/reports/`, `evals/tmp/`, or `.autoresearch/` files are staged.
- No auth, database, queue, or persistence code is introduced.
- Generated reports remain gitignored.

## Rollback Rule

If a change lowers the score, breaks JSON validity, introduces broad unrelated edits, or stages protected files, revert only the files touched by that change and rerun the mock evaluation before continuing.

## Files That Must Not Be Staged

- `.env.local`
- `.autoresearch/`
- `evals/reports/`
- `evals/tmp/`
- Any generated report or temporary evaluation artifact

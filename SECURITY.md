# Security policy

## Supported version

Security fixes target the current `main` branch and the canonical Vercel deployment.

## Report a vulnerability

Please use [GitHub's private vulnerability reporting](https://github.com/sergiopesch/ai-research-gather/security/advisories/new). Do not open a public issue for vulnerabilities, exposed credentials, authentication bypasses, quota bypasses, or sensitive logs.

Include the affected route or component, reproduction steps, impact, and any suggested mitigation. Never include a working provider key, owner access key, session cookie, or another person's data in the report.

## Security boundaries

- The hosted authentication model is intentionally single-owner.
- Anonymous users can access only server-approved public routes.
- Premium providers require a signed owner session or a local request.
- Provider keys, session secrets, and CLI login tokens must remain server-side.
- `.env.local` and `.vercel/` are ignored and must never be committed.
- Public quotas require a durable Upstash store to remain consistent across instances.
- Generated conversations and audio are not a private long-term storage system; audio is held in the browser session for playback and export.

If a secret is exposed, revoke it at the provider first, replace the deployment variable, deploy and verify a new candidate, then remove the secret from Git history where applicable.

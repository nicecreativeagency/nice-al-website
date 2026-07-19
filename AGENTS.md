# NICE repository instructions

## Public website

- Preserve the existing NICE landing page and its visual behavior.
- Make public-site changes only when required to integrate Social Hub.
- Reuse the current Next.js App Router and CSS conventions.

## NICE Social Hub

- New application code belongs under `app/hub`, `lib`, `scripts`, `drizzle` or
  `docs` as appropriate.
- Use TypeScript for new Social Hub code.
- Keep the UI premium, restrained and responsive. Avoid generic admin-template
  styling, emoji icons and fake production functionality.
- Public registration stays disabled until the product owner explicitly changes
  that decision.
- Never use client-side UI visibility as authorization.
- Validate sessions, organization membership and client access on the server,
  preferably through `lib/dal.ts`.
- Every future business record must belong to an organization, directly or
  through a client with an organization foreign key.
- Never store social-media passwords. Future platform connections use official
  OAuth and encrypted tokens.
- Keep PGlite development-only. Production uses Neon through `DATABASE_URL`.
- Do not commit `.env.local`, credentials, tokens or other secrets.

## Before handing off changes

Run:

```bash
npm run lint
npm run typecheck
npm run build
```

Update `docs/NICE_SOCIAL_HUB.md` when architecture, setup, roles or milestones
change.

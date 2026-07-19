# NICE Creative Agency

The production NICE website and the authenticated NICE Social Hub live in this
Next.js application.

## Local development

```bash
npm install
npm run db:setup
npm run dev
```

Open [http://localhost:3002](http://localhost:3002). Social Hub starts at
`/hub`.

Copy `.env.example` to `.env.local` and provide development-only account
passwords before running the seed command. When `DATABASE_URL` is omitted in
development, the application uses an ignored local PostgreSQL-compatible
database under `.data/`.

See [`docs/NICE_SOCIAL_HUB.md`](docs/NICE_SOCIAL_HUB.md) for architecture,
roles, routes, environment variables and production setup.

## Quality checks

```bash
npm run lint
npm run typecheck
npm run build
```

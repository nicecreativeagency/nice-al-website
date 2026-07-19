# NICE Social Hub

## Purpose

NICE Social Hub is the authenticated content-operations product inside the
existing NICE Creative Agency website. Its first milestone establishes the
secure foundation for clients, content, approvals, calendar planning and later
social publishing.

The public NICE website is preserved. Its navigation now includes a
`NICE Social Hub` link to `/hub`.

## Implemented milestone

- Next.js 16 App Router application with TypeScript enabled incrementally.
- Premium responsive Social Hub login and application shell.
- Better Auth email/password authentication with database sessions.
- Public registration disabled at the authentication endpoint.
- Development seed for a Super Admin and a Client account.
- Organization-first database model.
- Server-side role and client-membership checks.
- Separate Admin and Client navigation.
- Admin-only `/hub/clients` route with safe client redirect.
- Local PGlite development database and Neon PostgreSQL production driver.
- Initial route placeholders for the planned product milestones.

Direct Facebook, Instagram and LinkedIn integrations are intentionally not part
of this milestone.

## Architecture

### Application

- Next.js 16 and React 19
- App Router and React Server Components
- TypeScript for all new Social Hub code
- CSS Modules for the public site and a scoped Social Hub design system
- Lucide line icons

### Database

- Drizzle ORM
- Neon PostgreSQL when `DATABASE_URL` is configured
- PGlite for zero-configuration local development only
- SQL migrations in `drizzle/`

The ownership hierarchy is:

```text
Organization
└── Clients
    └── Future campaigns and content
```

The first schema contains:

- `users`
- `sessions`
- `accounts`
- `verifications`
- `organizations`
- `organization_members`
- `clients`
- `client_members`

Foreign keys use cascading deletion for dependent memberships and auth data.
Organization/client slugs and memberships have unique constraints and query
indexes.

### Authentication

Better Auth owns users, credentials and database sessions. Passwords use Better
Auth's secure password hashing and are never stored in plaintext in the
database.

Email/password signup is disabled by default. The seed script can temporarily
enable signup only when:

- the process is not production; and
- the script sets the internal development seed flag.

There is no registration page or public registration flow.

### Authorization

Roles supported by the schema:

- `super_admin`
- `organization_admin`
- `team_member`
- `client`

The current seed uses `super_admin` and `client`.

`lib/dal.ts` is the server-side data access layer. Protected layouts call
`requireViewer()`. Admin-only pages additionally call `requireAdmin()`. The
sidebar is role-aware, but hiding links is not treated as authorization.

Client A is assigned only to Demo Client. Admin users receive the organization's
full client list.

## Routes

| Route | Access | Current behavior |
| --- | --- | --- |
| `/hub` | Public redirect | Login or role dashboard |
| `/hub/login` | Public | Invite-only sign in |
| `/hub/dashboard` | Authenticated | Role-specific overview |
| `/hub/clients` | Admin only | Organization client directory |
| `/hub/content` | Admin only | Milestone placeholder |
| `/hub/campaigns` | Admin only | Milestone placeholder |
| `/hub/media` | Admin only | Milestone placeholder |
| `/hub/social-accounts` | Admin only | Future OAuth placeholder |
| `/hub/settings` | Admin only | Settings placeholder |
| `/hub/approvals` | Authenticated | Approval milestone placeholder |
| `/hub/calendar` | Authenticated | Calendar milestone placeholder |
| `/hub/published` | Authenticated | Client publishing-history placeholder |
| `/api/auth/[...all]` | Better Auth | Auth handler |

`proxy.ts` performs a fast optimistic cookie redirect. Every protected page also
validates the real database session and permissions on the server.

## Environment variables

Create `.env.local` from `.env.example`.

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Production | Pooled Neon PostgreSQL connection |
| `BETTER_AUTH_SECRET` | Yes | High-entropy auth secret, 32+ characters |
| `BETTER_AUTH_URL` | Yes | `http://localhost:3002` locally; production origin when deployed |
| `DEV_ADMIN_EMAIL` | Local seed | Admin test email |
| `DEV_ADMIN_PASSWORD` | Local seed | Admin test password, 12+ characters |
| `DEV_CLIENT_EMAIL` | Local seed | Client test email |
| `DEV_CLIENT_PASSWORD` | Local seed | Client test password, 12+ characters |

Never commit `.env.local` or production secrets.

## Local setup and test accounts

```bash
npm install
npm run db:setup
npm run dev
```

Open `http://localhost:3002/hub`.

The local test emails and passwords are read from the `DEV_*` variables in
`.env.local`. Re-running `npm run db:seed` is safe; inserts are idempotent.

Expected access:

- Super Admin sees the full agency navigation and Demo Client.
- Client A sees only Overview, Approvals, Calendar and Published.
- Client A entering `/hub/clients` is redirected to the dashboard with an
  access-denied notice.

## Production setup

1. Create a Neon PostgreSQL project.
2. Configure `DATABASE_URL`, `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL` in the
   deployment environment.
3. Run `npm run db:migrate` against the production database.
4. Deploy the Next.js application.
5. Add an invite/admin user-provisioning workflow before onboarding real users.

Development seed accounts are not intended for production.

## Validation completed

- TypeScript check
- Oxlint
- Next.js production build
- Unauthenticated `/hub` redirect
- Super Admin login and logout
- Client login
- Admin client-directory access
- Client denial from admin-only route
- Responsive dashboard and mobile navigation at 390 px

## Next milestones

1. Client creation and editing.
2. Content items, platform targets, versions and media.
3. Approval requests, comments and guest review links.
4. Month/week/list calendar.
5. Cloudinary media storage and email notifications.
6. Meta OAuth and publishing adapters.
7. LinkedIn connection and publishing after API access approval.

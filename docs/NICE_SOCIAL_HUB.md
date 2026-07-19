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
- Admin-only client directory with workspace creation and editing.
- Database-backed content drafts with client ownership and platform targets.
- Signed image/video uploads to Cloudinary with verified response signatures.
- Local PGlite development database and Neon PostgreSQL production driver.
- Initial route placeholders for the remaining product milestones.

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
- `content_items`
- `content_platform_targets`
- `media_assets`
- `content_media`

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
| `/hub/clients` | Admin only | Create and list organization clients |
| `/hub/clients/[clientId]` | Admin only | Edit an organization client workspace |
| `/hub/content` | Admin only | Create and list content drafts |
| `/hub/content/[contentId]` | Admin only | Edit content, media, versions and approval workflow |
| `/hub/campaigns` | Admin only | Create, edit and inspect grouped content campaigns |
| `/hub/campaigns/[campaignId]` | Admin only | Campaign details and linked content |
| `/hub/media` | Admin only | Organization media library with usage counts |
| `/hub/social-accounts` | Admin only | Future OAuth placeholder |
| `/hub/settings` | Admin only | Settings placeholder |
| `/hub/approvals` | Authenticated | Organization/client-scoped approval queue |
| `/hub/approvals/[approvalId]` | Authenticated | Versioned review, comments and decisions |
| `/review/[token]` | Secure token | Account-free guest approval and feedback |
| `/hub/calendar` | Authenticated | Month, week/list-style planning with client filters |
| `/hub/published` | Authenticated | Client-scoped publishing history |
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
| `CLOUDINARY_CLOUD_NAME` | Media | Cloudinary product environment |
| `CLOUDINARY_API_KEY` | Media | Cloudinary signed-upload key |
| `CLOUDINARY_API_SECRET` | Media | Server-only upload signing secret |
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

The production build also runs the idempotent Drizzle migration step before
Next.js compiles. Vercel therefore applies pending migrations using its existing
`DATABASE_URL` before new application code starts serving traffic.

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

## Content operations release

The pre-publishing workflow now includes:

1. Client and campaign management.
2. Multi-platform content drafts and platform-specific captions.
3. Signed Cloudinary image/video uploads and a reusable media library.
4. Immutable content-version snapshots. Editing content or media invalidates an
   open approval and creates a new version.
5. Internal and secure guest approval flows.
6. Approve, request changes and threaded review comments.
7. Activity history and database-backed in-app notifications.
8. Organization/client-scoped month and list calendar views.
9. Publishing-readiness checks for media, captions, platforms, date and time.
10. Role-scoped dashboard metrics and client portal views.

## Monochrome workflow refinement

The application UI now uses a larger, bolder black-and-white product system.
Client brand colors remain visible only where they help identify a workspace;
uploaded creatives retain their original colors.

Workflow improvements include:

- Advanced content search and URL-based filters for client, content type,
  approval status, platform, schedule state and sort order.
- Agency quick views for waiting approvals, upcoming work, unplanned content and
  requested changes.
- Client workspace switching directly above the admin calendar.
- Click-to-expand creative previews across content, approvals and guest reviews.
- A WordPress-style media inspector with metadata, usage references, direct URL
  copy and a large preview.
- A three-stage approval workflow with a clear next action and readiness issues.
- Separate version and activity timelines.
- Compact distribution controls and tabbed platform-specific captions.
- Whole-field date and time picker activation.
- Draft duplication for repeated formats and recurring campaign work.

Desktop and mobile layouts were checked for horizontal overflow. All new
queries retain organization-level and client-level server authorization.

## Deferred publishing integrations

Direct publishing remains intentionally deferred. The next integration phase is:

1. Resend email delivery for existing notification events.
2. Meta OAuth, Facebook Pages and Instagram professional-account publishing.
3. Reliable scheduled background jobs, retries and publishing logs.
4. LinkedIn OAuth/publishing after product and permission approval.

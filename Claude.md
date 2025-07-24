# VibeQA Development Guide

VibeQA is a modern SaaS QA feedback platform built with Next.js and Supabase that leverages vibe coding principles to help developers streamline their QA process.

## MVP Development Approach

This is an MVP - we prioritize speed while maintaining quality through automated checks. Move fast, but always run code quality checks before committing.

## Project Overview

VibeQA provides:
- Embeddable feedback widget for any web application
- Multi-format feedback support (text, voice, screenshot, video)
- Multi-tenant organization architecture
- Subscription-based billing
- Real-time feedback notifications
- Secure media storage and handling

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Supabase (Auth, Database, Storage, Realtime)
- **Widget**: Shadow DOM, html2canvas, WebRTC
- **Payments**: Stripe/Paddle integration
- **Media**: Supabase Storage, Loom SDK

## Project Structure

```
src/
├── app/                  # App Router routes
│   ├── (auth)/          # Auth pages (login, register)
│   ├── (dashboard)/     # Protected dashboard routes
│   ├── api/             # API endpoints
│   └── widget/          # Widget-specific routes
├── components/          # Reusable UI components
├── lib/                # Utilities and configurations
│   ├── supabase/       # Database client setup
│   └── stripe/         # Payment integration
├── hooks/              # Custom React hooks
├── types/              # TypeScript type definitions
└── docs/               # ALL documentation goes here
    ├── api/            # API documentation
    ├── components/     # Component documentation
    ├── database/       # Database schema docs
    ├── deployment/     # Deployment guides
    └── features/       # Feature documentation
```

## Documentation Rules

**ALL documentation must be placed in the `/docs` folder** organized by category:
- `/docs/api/` - API endpoints and integration guides
- `/docs/components/` - Component usage and props documentation
- `/docs/database/` - Schema, migrations, and RLS policies
- `/docs/deployment/` - Deployment and infrastructure docs
- `/docs/features/` - Feature specifications and guides

Never create documentation files in the root directory or scattered throughout the codebase.

## Key Development Commands

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run start           # Start production server

# Code Quality (ALWAYS run before committing)
npm run typecheck       # Check TypeScript types
npm run lint            # Run ESLint
npm run format          # Format with Prettier
npm run format:check    # Check Prettier formatting
npm run precommit       # Run all checks
```

## CRITICAL: Pre-Commit Requirements

**NEVER commit without running these commands first:**

```bash
# MANDATORY before EVERY commit:
npm run format          # Auto-format code with Prettier
npm run typecheck       # Ensure no TypeScript errors

# Or run both with:
npm run precommit
```

This is non-negotiable. Even for MVP development, we maintain code quality through automated tooling.

## Environment Variables Setup

### Initial Setup

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in your environment variables in `.env.local`

3. **NEVER commit `.env` or `.env.local` files** - they're already in `.gitignore`

### Variable Naming Convention

- **Client-side variables**: Must be prefixed with `NEXT_PUBLIC_`
  - Example: `NEXT_PUBLIC_STRIPE_PUBLIC_KEY`
- **Server-side variables**: No prefix needed
  - Example: `STRIPE_SECRET_KEY`, `DATABASE_URL`

### Required Environment Variables

```bash
# Essential for running the app
SESSION_SECRET              # Random string for session encryption
DATABASE_URL               # Supabase PostgreSQL connection string
NEXT_PUBLIC_SUPABASE_URL   # Your Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY  # Supabase anonymous key
SUPABASE_SERVICE_ROLE_KEY  # Supabase service role key (server-side only)

# Payment processing
STRIPE_SECRET_KEY          # Stripe secret key (use test keys for dev)
NEXT_PUBLIC_STRIPE_PUBLIC_KEY  # Stripe publishable key
```

### Security Notes

- **Rotate keys immediately** if they're ever exposed
- Use different keys for development (test) vs production (live)
- Store production secrets in your hosting platform's environment variables
- Never hardcode secrets in your code

## Database Schema

The application uses Supabase with Row Level Security (RLS) enabled:

- **organizations**: Multi-tenant support
- **organization_members**: User-org relationships with roles
- **projects**: Organization projects for feedback
- **feedback**: All feedback submissions with media support
- **storage buckets**: feedback-media, organization-assets

## Authentication Flow

1. Users register with email/password via Supabase Auth
2. Organization is created and user is linked as owner
3. All subsequent access is scoped to organization context
4. RLS policies ensure data isolation between organizations

## Widget Integration

The feedback widget uses:
- Shadow DOM for CSS isolation
- Project-based authentication tokens
- Multiple activation methods (URL params, session storage)
- Secure file uploads to Supabase Storage

Example embed code:
```html
<script 
  src="https://cdn.vibe.qa/widget.js" 
  data-project-key="proj_abc123"
  data-api-url="https://api.vibe.qa"
  async>
</script>
```

## Media Handling

- **Screenshots**: html2canvas → Supabase Storage
- **Voice**: MediaRecorder API → WebM → Supabase Storage
- **Video**: Loom SDK integration
- All media uses signed URLs for secure access

## Development Workflow

### MVP Fast Development Guidelines

Since this is an MVP, we optimize for speed while maintaining quality:

1. **Move fast** - Don't over-engineer, build what works
2. **Use AI assistance** - Leverage Cursor, Claude, etc. for rapid development
3. **Copy patterns** - Reuse existing code patterns rather than creating new ones
4. **Defer optimization** - Focus on functionality first, optimize later
5. **But ALWAYS** - Run format & typecheck before committing

### Standard Workflow

1. Check existing code patterns before implementing new features
2. Use TypeScript types from `src/types/` for type safety
3. Follow existing component structure and naming conventions
4. Ensure all Supabase queries include proper error handling
5. Test RLS policies when adding new database operations
6. **Before committing**: `npm run format && npm run typecheck`

## Security Best Practices

- Never expose Supabase service role keys in client code
- Use environment variables for all sensitive configuration
- Implement proper CORS policies for widget endpoints
- Validate all user inputs on both client and server
- Use Supabase RLS for data access control

## Deployment Checklist

Before deploying:
1. Run `npm run precommit` to ensure code quality
2. Test all authentication flows
3. Verify RLS policies are working correctly
4. Check environment variables are properly set
5. Test widget embedding on external sites
6. Verify payment webhook endpoints

## Common Tasks

### Adding a new feedback type
1. Update the `FeedbackType` enum in types
2. Add handling in the widget code
3. Update the feedback submission API
4. Add UI components for the new type

### Creating new dashboard pages
1. Add route in `app/(dashboard)/`
2. Use `useUser()` hook for auth context
3. Implement proper loading states
4. Add to navigation menu

### Modifying database schema
1. Update schema in Supabase dashboard
2. Regenerate types: `npx supabase gen types typescript`
3. Update relevant TypeScript interfaces
4. Test RLS policies thoroughly

## Troubleshooting

- **Widget not loading**: Check CORS settings and project key
- **Auth issues**: Verify Supabase URL and anon key
- **Media upload fails**: Check storage bucket policies
- **Type errors**: Regenerate Supabase types after schema changes

## Additional Resources

- Supabase Docs: https://supabase.com/docs
- Next.js App Router: https://nextjs.org/docs/app
- Shadow DOM: https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_shadow_DOM
- Stripe Subscriptions: https://stripe.com/docs/billing/subscriptions/overview
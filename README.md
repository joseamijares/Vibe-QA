# VibeQA

A modern SaaS QA feedback platform built with Next.js and Supabase that helps developers streamline their QA process.

## Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **Backend**: Supabase (Auth, Database, Storage, Realtime)
- **UI Components**: Radix UI with shadcn/ui pattern
- **Routing**: Wouter
- **State Management**: TanStack Query
- **Payments**: Stripe integration (coming soon)

## Getting Started

### Prerequisites

- Node.js (v20.5.0 or higher)
- npm or yarn
- Supabase account

### Environment Setup

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Add your Supabase credentials to `.env.local`:
   ```
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

### Installation

```bash
npm install
```

### Database Setup

1. Create a new Supabase project
2. Run the migration file in `supabase/migrations/20240124_initial_schema.sql` in the Supabase SQL editor
3. Make sure to enable the Row Level Security policies

### Development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to view the application.

### Code Quality

Always run these commands before committing:

```bash
npm run format    # Format code with Prettier
npm run typecheck # Check TypeScript types
```

Or run both with:
```bash
npm run precommit
```

## Features

- 🔐 **Multi-tenant Architecture**: Secure organization-based data isolation
- 📝 **Multiple Feedback Types**: Text, voice, screenshot, and video feedback
- 🔌 **Embeddable Widget**: Easy integration into any web application
- 💳 **Subscription Billing**: Integrated with Stripe for payments
- 📊 **Real-time Updates**: Live feedback notifications
- 🔒 **Secure Storage**: Media files stored securely in Supabase

## Project Structure

```
src/
├── app/                  # Application routes
├── components/          # Reusable UI components
├── contexts/           # React contexts
├── hooks/              # Custom React hooks
├── layouts/            # Layout components
├── lib/                # Utilities and configurations
├── pages/              # Page components
├── styles/             # Global styles
├── types/              # TypeScript type definitions
└── assets/             # Static assets (logos, etc.)
```

## Documentation

See the `/docs` folder for detailed documentation on:
- Database schema
- API endpoints
- Component usage
- Deployment guides
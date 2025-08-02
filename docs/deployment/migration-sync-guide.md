# Migration Sync Guide

## Overview

This guide helps resolve migration sync issues between local development and Supabase remote database.

## Common Issues and Solutions

### Issue 1: "Remote migration versions not found in local migrations directory"

This happens when the remote database has migrations that don't exist locally.

**Solution:**
```bash
# Pull remote migrations
supabase db pull

# Check migration status
supabase migration list
```

### Issue 2: "Found local migration files to be inserted before the last migration on remote"

This occurs when local migrations have timestamps that should run before already-applied remote migrations.

**Solution:**
```bash
# Use --include-all flag to force apply
supabase db push --include-all
```

### Issue 3: Migration conflicts with existing schema

Sometimes migrations fail because objects already exist or columns are missing.

**Solution:**
1. Run the `fix_migration_sync.sql` script in SQL Editor
2. This marks migrations as applied without running them

## Step-by-Step Resolution Process

### 1. Check Current Status
```bash
supabase migration list
```

### 2. Fix Security Issues First
Run in SQL Editor:
- `fix_security_issues.sql` - Enables RLS and fixes security issues
- `apply_function_security.sql` - Adds search_path to functions

### 3. Sync Migration History
Run in SQL Editor:
- `fix_migration_sync.sql` - Marks migrations as applied

### 4. Verify Everything Works
```bash
# Test locally
supabase db reset
npm run dev

# Check Supabase dashboard
# Database → Linter → Should show no critical errors
```

## Best Practices

### 1. Migration Naming
- Use timestamps: `YYYYMMDD_HHMMSS_description.sql`
- Keep descriptions clear and concise
- Group related changes in one migration

### 2. Before Creating Migrations
- Always pull latest changes: `supabase db pull`
- Check migration list: `supabase migration list`
- Test locally first: `supabase db reset`

### 3. Handling Conflicts
- Never modify already-applied migrations
- Create new migrations to fix issues
- Use `IF EXISTS` and `IF NOT EXISTS` clauses
- Make migrations idempotent when possible

### 4. Production Deployments
1. Test in staging first
2. Backup production database
3. Apply during low-traffic periods
4. Have rollback plan ready

## Emergency Rollback

If migrations cause issues:

```sql
-- Rollback specific migration
DELETE FROM supabase_migrations.schema_migrations 
WHERE version = 'MIGRATION_NAME';

-- Then manually undo schema changes
```

## Useful Queries

### Check RLS Status
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
```

### Check Function Security
```sql
SELECT proname, prosecdef, proconfig
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.prosecdef = true;
```

### View Migration History
```sql
SELECT * FROM supabase_migrations.schema_migrations
ORDER BY inserted_at DESC;
```

## Troubleshooting

### Cannot push migrations
1. Check for remote migrations not in local: `supabase migration list`
2. Pull missing migrations: `supabase db pull`
3. Repair if needed: `supabase migration repair --status applied VERSION`

### Migrations fail with "already exists"
1. The schema already has the changes
2. Mark migration as applied: Insert into `schema_migrations` table
3. Or create idempotent migrations with `IF NOT EXISTS`

### Functions missing search_path
1. Run `apply_function_security.sql`
2. Or manually: `ALTER FUNCTION function_name() SET search_path = '';`

## Related Documentation
- [Supabase Migrations Guide](https://supabase.com/docs/guides/cli/local-development#database-migrations)
- [Security Best Practices](./security/supabase-security-fixes.md)
- [RLS Policies Guide](https://supabase.com/docs/guides/auth/row-level-security)
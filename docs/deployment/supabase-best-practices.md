# Supabase Best Practices for VibeQA

This document outlines best practices for using Supabase in the VibeQA project, covering security, performance, and operational excellence.

## Database Best Practices

### 1. Row Level Security (RLS)

**Always Enable RLS**
```sql
-- Enable RLS on every table
ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;
```

**Common RLS Patterns**
```sql
-- Organization-scoped access
CREATE POLICY "Users can view their organization's data" ON feedback
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Owner-only access
CREATE POLICY "Users can update their own records" ON profiles
  FOR UPDATE USING (id = auth.uid());

-- Public read access
CREATE POLICY "Public can view published content" ON blog_posts
  FOR SELECT USING (published = true);
```

### 2. Database Migrations

**Naming Convention**
- Sequential: `001_initial_schema.sql`, `002_add_users.sql`
- Date-based: `20250801_add_feedback_table.sql`

**Migration Structure**
```sql
-- Migration: 001_initial_schema.sql
-- Description: Initial database schema

BEGIN;

-- Your migration SQL here

COMMIT;
```

**Rollback Strategy**
- Keep rollback scripts for critical migrations
- Test rollbacks in staging first
- Document dependencies between migrations

### 3. Performance Optimization

**Indexing Strategy**
```sql
-- Index foreign keys
CREATE INDEX idx_feedback_organization_id ON feedback(organization_id);

-- Index commonly queried columns
CREATE INDEX idx_feedback_created_at ON feedback(created_at DESC);

-- Composite indexes for complex queries
CREATE INDEX idx_feedback_org_status ON feedback(organization_id, status);
```

**Query Optimization**
- Use `EXPLAIN ANALYZE` for slow queries
- Limit result sets with proper pagination
- Use database functions for complex operations

### 4. Data Validation

**Check Constraints**
```sql
ALTER TABLE feedback ADD CONSTRAINT feedback_type_check 
  CHECK (type IN ('bug', 'feature', 'praise', 'other'));

ALTER TABLE organizations ADD CONSTRAINT org_slug_format 
  CHECK (slug ~ '^[a-z0-9-]+$');
```

**Triggers for Data Integrity**
```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

## Authentication Best Practices

### 1. User Management

**Secure User Registration**
```typescript
// Always validate email domains for business accounts
const allowedDomains = ['company.com'];
const emailDomain = email.split('@')[1];

if (!allowedDomains.includes(emailDomain)) {
  throw new Error('Email domain not allowed');
}
```

**Session Management**
```typescript
// Set appropriate session expiry
const { data, error } = await supabase.auth.signIn({
  email,
  password,
}, {
  // 7 days for remember me, 1 hour otherwise
  expiresIn: rememberMe ? 604800 : 3600
});
```

### 2. Multi-Factor Authentication

Enable MFA for sensitive operations:
```typescript
// Require MFA for admin actions
const { data: { factors } } = await supabase.auth.mfa.listFactors();

if (factors.length === 0) {
  // Redirect to MFA setup
  return redirectToMFASetup();
}
```

## Storage Best Practices

### 1. Bucket Configuration

**Security Policies**
```sql
-- Allow authenticated users to upload to their org folder
CREATE POLICY "Organization members can upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'feedback-media' AND
    auth.uid() IN (
      SELECT user_id FROM organization_members
      WHERE organization_id = (storage.foldername(name))[1]
    )
  );
```

**File Type Restrictions**
```typescript
const allowedMimeTypes = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'audio/webm',
  'audio/mp4'
];

if (!allowedMimeTypes.includes(file.type)) {
  throw new Error('File type not allowed');
}
```

### 2. File Upload Optimization

**Client-Side Compression**
```typescript
// Compress images before upload
async function compressImage(file: File): Promise<Blob> {
  const options = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true
  };
  
  return await imageCompression(file, options);
}
```

**Resumable Uploads**
```typescript
// Use resumable uploads for large files
const { data, error } = await supabase.storage
  .from('feedback-media')
  .upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    // Enable resumable uploads
    resumable: true
  });
```

## Edge Functions Best Practices

### 1. Function Structure

**Standard Function Template**
```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse request
    const { data } = await req.json()
    
    // Validate input
    if (!data) {
      throw new Error('Missing required data')
    }
    
    // Process request
    const result = await processData(data)
    
    // Return response
    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    // Error handling
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

### 2. Environment Variables

**Secure Secret Management**
```typescript
// Never hardcode secrets
const STRIPE_KEY = Deno.env.get('STRIPE_SECRET_KEY')
if (!STRIPE_KEY) {
  throw new Error('Missing STRIPE_SECRET_KEY')
}

// Use Supabase client with service role cautiously
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)
```

### 3. Performance Optimization

**Connection Pooling**
```typescript
// Reuse Supabase client
let supabaseClient: SupabaseClient | null = null

function getSupabaseClient() {
  if (!supabaseClient) {
    supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!
    )
  }
  return supabaseClient
}
```

## Realtime Best Practices

### 1. Channel Management

**Proper Channel Naming**
```typescript
// Use consistent channel naming
const channel = supabase
  .channel(`organization:${orgId}:feedback`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'feedback',
    filter: `organization_id=eq.${orgId}`
  }, handleNewFeedback)
  .subscribe()
```

**Cleanup Subscriptions**
```typescript
// Always cleanup subscriptions
useEffect(() => {
  const channel = supabase.channel('my-channel').subscribe()
  
  return () => {
    supabase.removeChannel(channel)
  }
}, [])
```

### 2. Presence Management

**Track User Presence**
```typescript
const channel = supabase.channel('room:123')

// Track presence
channel
  .on('presence', { event: 'sync' }, () => {
    const state = channel.presenceState()
    console.log('Online users:', state)
  })
  .subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      await channel.track({
        user_id: user.id,
        online_at: new Date().toISOString()
      })
    }
  })
```

## Monitoring & Logging

### 1. Application Monitoring

**Track Key Metrics**
```typescript
// Log Supabase operations
async function trackOperation(operation: string, duration: number) {
  await supabase.from('metrics').insert({
    operation,
    duration,
    timestamp: new Date().toISOString(),
    user_id: (await supabase.auth.getUser()).data.user?.id
  })
}
```

### 2. Error Tracking

**Comprehensive Error Handling**
```typescript
// Wrap Supabase calls with error tracking
async function supabaseOperation<T>(
  operation: () => Promise<{ data: T | null; error: any }>
): Promise<T> {
  const start = Date.now()
  
  try {
    const { data, error } = await operation()
    
    if (error) {
      // Log to error tracking service
      console.error('Supabase error:', {
        error,
        duration: Date.now() - start
      })
      throw error
    }
    
    return data!
  } catch (error) {
    // Send to monitoring service
    throw error
  }
}
```

## Security Checklist

### Before Deployment

- [ ] All tables have RLS enabled
- [ ] RLS policies are tested
- [ ] No service role key in client code
- [ ] API keys are in environment variables
- [ ] CORS is properly configured
- [ ] Input validation is implemented
- [ ] Rate limiting is configured
- [ ] Backup strategy is in place

### Regular Audits

- [ ] Review RLS policies monthly
- [ ] Check for unused indexes
- [ ] Monitor slow queries
- [ ] Review storage usage
- [ ] Audit user permissions
- [ ] Update dependencies
- [ ] Review security logs

## Disaster Recovery

### 1. Backup Strategy

**Automated Backups**
- Enable Point-in-Time Recovery (PITR)
- Set appropriate retention period
- Test restore procedures regularly

**Manual Backups**
```bash
# Before major migrations
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 2. Incident Response

**Rollback Procedure**
1. Identify the issue
2. Stop write operations if necessary
3. Restore from backup or previous version
4. Verify data integrity
5. Resume operations
6. Post-mortem analysis

## Cost Optimization

### 1. Database Optimization

- Use appropriate data types
- Archive old data
- Implement data retention policies
- Use materialized views for complex queries

### 2. Storage Optimization

- Implement client-side compression
- Set appropriate cache headers
- Clean up orphaned files
- Use CDN for static assets

### 3. Function Optimization

- Minimize cold starts
- Reuse connections
- Implement caching
- Monitor execution time
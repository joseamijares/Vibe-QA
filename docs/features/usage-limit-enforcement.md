# Usage Limit Enforcement Implementation

**Date**: February 1, 2025  
**Status**: Implemented

## Overview

This document describes the implementation of usage limit enforcement for VibeQA's subscription plans. The system now actively enforces the limits defined for each plan tier.

## Subscription Plan Limits

### Basic Plan ($5/month)
- **Projects**: 3
- **Feedback**: 500 per month
- **Team Members**: 5
- **Storage**: 5GB

### Full Plan ($14/month)
- **Projects**: 10
- **Feedback**: 2,000 per month
- **Team Members**: 20
- **Storage**: 20GB

## Implementation Details

### 1. Database Layer

#### Feedback Count Tracking
- Created `increment_feedback_count()` trigger function
- Automatically increments `organization_usage.feedback_count` when feedback is submitted
- Tracks usage per organization per month

#### Project Limit Enforcement
- Created `check_project_limit()` trigger function
- Prevents project creation when organization reaches plan limit
- Throws exception with descriptive error message

#### Usage Check Functions
- `can_submit_feedback(org_id)`: Returns boolean if organization can submit more feedback
- `can_create_project(org_id)`: Returns boolean if organization can create more projects
- `get_organization_limits(org_id)`: Returns current usage vs limits

### 2. API Layer

#### Submit Feedback Endpoint
The Edge Function now:
1. Checks feedback limits before accepting submission
2. Returns 429 (Too Many Requests) when limit exceeded
3. Provides detailed error message with plan name and limit
4. Includes error code `FEEDBACK_LIMIT_EXCEEDED` for client handling

### 3. Widget Layer

Enhanced error handling:
- Detects `FEEDBACK_LIMIT_EXCEEDED` error code
- Shows user-friendly notification about limit reached
- Advises users to contact their administrator

### 4. Frontend Layer

#### Project Creation
- Uses `useUsageLimits()` hook to check limits
- Shows `LimitExceededModal` when at limit
- Prevents navigation to new project page

#### Real-time Updates
- Subscribes to `organization_usage` table changes
- Updates UI immediately when usage changes
- Shows current usage in billing page

### 5. Trial System

- New organizations start with 7-day trial on Basic plan
- After trial expires, they must pay to continue
- Default plan is now 'basic' (no free tier)

## Migration Guide

### For New Deployments

1. Run the migration:
```bash
supabase migration up
```

2. Deploy the updated Edge Function:
```bash
supabase functions deploy submit-feedback
```

### For Existing Deployments

1. Run the migration to add triggers and functions
2. Initialize existing usage counts:
```sql
-- Run scripts/initialize-usage-counts.sql
```

3. Deploy updated Edge Function
4. Deploy updated widget code

## Testing

### Manual Testing

1. **Test Feedback Limits**:
   - Create organization with Basic plan
   - Submit 500 feedback items
   - Attempt to submit 501st item (should fail)

2. **Test Project Limits**:
   - Create 3 projects on Basic plan
   - Attempt to create 4th project (should fail)

### Automated Testing

Run the test script:
```bash
psql $DATABASE_URL -f scripts/test-usage-limits.sql
```

## Error Handling

### User Experience

1. **Feedback Limit Reached**:
   - Widget shows clear error message
   - Includes current plan name and limit
   - Suggests contacting administrator

2. **Project Limit Reached**:
   - Modal dialog explains limit
   - Shows upgrade options
   - Allows easy navigation to billing

### API Responses

```json
// Feedback limit exceeded
{
  "error": "Feedback limit exceeded",
  "message": "Your Basic plan allows 500 feedback submissions per month. Please upgrade your plan to submit more feedback.",
  "code": "FEEDBACK_LIMIT_EXCEEDED"
}
```

## Monitoring

### Key Metrics

1. **Usage Tracking**:
   ```sql
   SELECT * FROM organization_usage 
   WHERE month = date_trunc('month', now())::date;
   ```

2. **Organizations Near Limits**:
   ```sql
   SELECT o.name, ou.feedback_count, sp.limits->>'feedbackPerMonth' as limit
   FROM organizations o
   JOIN organization_usage ou ON ou.organization_id = o.id
   JOIN subscription_plans sp ON sp.id = o.subscription_plan_id
   WHERE ou.feedback_count::float / (sp.limits->>'feedbackPerMonth')::float > 0.9;
   ```

## Pricing Structure

VibeQA offers two subscription plans:

1. **Basic Plan** - $5/month
   - Perfect for small teams and startups
   - 3 projects, 500 feedback/month
   - Includes 7-day free trial

2. **Full Plan** - $14/month
   - For growing teams that need more
   - 10 projects, 2,000 feedback/month
   - All advanced features included

## Future Enhancements

1. **Grace Period**: Allow small overages with warnings
2. **Usage Alerts**: Email notifications at 80%, 90%, 100%
3. **Storage Tracking**: Implement file size tracking
4. **API Rate Limiting**: Per-minute/hour limits
5. **Usage Analytics**: Dashboard showing usage trends

## Security Considerations

1. All limit checks happen server-side
2. Frontend checks are for UX only
3. Database triggers ensure data integrity
4. RLS policies remain in effect
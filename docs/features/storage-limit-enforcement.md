# Storage Limit Enforcement Implementation

**Date**: February 1, 2025  
**Status**: Implemented

## Overview

This document describes the implementation of storage limit enforcement for VibeQA's subscription plans. The system now actively tracks and enforces storage limits for uploaded media files (screenshots, voice recordings).

## Storage Limits by Plan

### Free Plan
- **Storage**: 1GB

### Basic Plan ($5/month)
- **Storage**: 5GB

### Full Plan ($14/month)
- **Storage**: 20GB

### Enterprise Plan
- **Storage**: Unlimited (-1)

## Implementation Details

### 1. Database Layer

#### Storage Tracking Functions
- `increment_storage_usage()`: Automatically increases storage_bytes when files are uploaded
- `decrement_storage_usage()`: Automatically decreases storage_bytes when files are deleted
- `can_upload_file(org_id, file_size_bytes)`: Checks if organization can upload a file
- `get_organization_storage_usage(org_id)`: Returns current usage statistics

#### Database Triggers
- `on_feedback_media_insert`: Updates storage usage after file upload
- `on_feedback_media_delete`: Updates storage usage after file deletion
- `before_feedback_media_insert`: Prevents uploads that would exceed limits

#### Storage Tracking
- Storage is tracked cumulatively across all months (doesn't reset monthly)
- Stored in `organization_usage.storage_bytes` column
- Automatic conversion to GB for display

### 2. Edge Function Updates

The `submit-feedback` function now:
1. Calculates total size of all uploaded files
2. Checks if upload would exceed storage limits
3. Returns detailed error with current usage when limit exceeded
4. Provides error code `STORAGE_LIMIT_EXCEEDED` for client handling

### 3. Frontend Components

#### StorageLimitExceededModal
- Shows current usage vs limit with visual progress bar
- Provides clear upgrade path
- Lists options to free up space

#### Billing Page Updates
- Shows accurate cumulative storage usage
- Visual indication when approaching limits
- Real-time updates via subscription

### 4. Widget Updates

Enhanced error handling for storage limits:
- Detects `STORAGE_LIMIT_EXCEEDED` error code
- Shows user-friendly notification with usage details
- Advises users to contact their administrator

## Migration Guide

### For New Deployments

1. Run the storage tracking migration:
```bash
supabase migration up
```

2. Deploy the updated Edge Function:
```bash
supabase functions deploy submit-feedback
```

### For Existing Deployments

1. Run the migration to add storage tracking
2. Initialize existing storage usage:
```bash
psql $DATABASE_URL -f scripts/initialize-storage-usage.sql
```
3. Deploy updated Edge Function and widget

## Usage Examples

### Check Organization Storage Usage
```sql
SELECT * FROM get_organization_storage_usage('org-uuid-here');
```

### Monitor Organizations Near Limits
```sql
SELECT 
    o.name,
    round((sum(ou.storage_bytes)::numeric / 1073741824)::numeric, 2) as usage_gb,
    sp.limits->>'storageGB' as limit_gb
FROM organizations o
JOIN organization_usage ou ON ou.organization_id = o.id
JOIN subscription_plans sp ON sp.id = o.subscription_plan_id
GROUP BY o.id, o.name, sp.limits
HAVING sum(ou.storage_bytes) > (sp.limits->>'storageGB')::bigint * 1073741824 * 0.8;
```

## Error Handling

### API Response Format
```json
{
  "error": "Storage limit exceeded",
  "message": "Your Basic plan allows 5GB of storage. You are currently using 4.8GB. Please upgrade your plan or delete old files to upload new content.",
  "code": "STORAGE_LIMIT_EXCEEDED",
  "details": {
    "currentUsageGB": 4.8,
    "limitGB": 5,
    "requestedSizeMB": 250
  }
}
```

## Best Practices

1. **File Size Validation**: Always validate file sizes client-side before upload
2. **Cleanup Policy**: Implement regular cleanup of old/unused media
3. **Warning Thresholds**: Notify users at 80% and 90% usage
4. **Graceful Degradation**: Allow text feedback even when storage is full

## Future Enhancements

1. **Storage Analytics**: Dashboard showing storage usage trends
2. **Automatic Cleanup**: Option to auto-delete old media after X days
3. **Compression**: Automatic image compression for screenshots
4. **Storage Quotas per Project**: Allow per-project storage limits
5. **S3-Compatible Storage**: Option to use external storage providers
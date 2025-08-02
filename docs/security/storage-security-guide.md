# Storage Security Guide (Updated)

## Overview

This guide documents the security measures implemented for the VibeQA feedback media storage system.

## Security Architecture

### 1. Multi-tenant Storage Isolation

All media files are stored with a hierarchical path structure that ensures complete isolation between organizations:

```
feedback-media/
├── {organizationId}/
│   ├── {feedbackId}/
│   │   ├── screenshot-{timestamp}.webp
│   │   ├── voice-{timestamp}.webm
│   │   └── ...
```

This structure ensures:
- Organizations cannot access each other's files
- Files are grouped by feedback for easy management
- Path-based access control is possible

### 2. Row Level Security (RLS) Policies (Simplified)

The storage bucket uses simplified RLS policies following Supabase best practices:

- **Service Role**: Full access for Edge Functions (upload, read, delete, update)
- **Authenticated Users**: Can only read files linked to their organization via feedback_media table
- **Anonymous Users**: No direct access - all operations go through Edge Functions
- **Key Principle**: Authorization logic is handled at the application level, not database level

### 3. Signed URLs with Expiration

Instead of public URLs, the system uses signed URLs that:
- Expire after 1 hour by default
- Are generated only for authenticated users
- Include access validation before generation
- Prevent unauthorized access even if URLs are leaked

### 4. Input Validation and Sanitization

All file operations include:
- UUID validation for organization and feedback IDs
- Filename sanitization to prevent path traversal attacks
- File type validation (only allowed MIME types)
- File size limits (10MB for media files)

### 5. WebP Image Optimization

Screenshots are automatically converted to WebP format:
- 25-85% smaller file sizes compared to PNG
- Maintains visual quality at 85% compression
- Automatic fallback to PNG for unsupported browsers
- Progressive compression for large files

## Implementation Details

### Storage Utils Security Features

```typescript
// Path validation
if (!this.isValidUUID(feedbackId) || !this.isValidUUID(organizationId)) {
  throw new Error('Invalid feedback or organization ID');
}

// Filename sanitization
const sanitizedFilename = this.sanitizeFilename(upload.file.name);

// Signed URL generation
const { data: signedUrlData } = await this.supabase.storage
  .from(this.bucketName)
  .createSignedUrl(fileName, 3600); // 1 hour expiration
```

### Simplified RLS Policies

```sql
-- Service role has full access
CREATE POLICY "Service role full access"
    ON storage.objects FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Users can read via feedback_media table
CREATE POLICY "Authenticated users can read org media"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'feedback-media'
        AND auth.role() = 'authenticated'
        AND EXISTS (
            SELECT 1 FROM feedback_media fm
            JOIN feedback f ON f.id = fm.feedback_id
            JOIN projects p ON p.id = f.project_id
            JOIN organization_members om ON om.organization_id = p.organization_id
            WHERE fm.url LIKE '%' || storage.objects.name
            AND om.user_id = auth.uid()
        )
    );
```

## Security Best Practices

1. **Never expose service role keys** in client-side code
2. **Always validate user permissions** before generating signed URLs
3. **Monitor storage usage** to detect unusual patterns
4. **Implement retention policies** to automatically delete old files
5. **Log all file access** for security auditing

## Migration Guide

To apply the security fixes to an existing deployment:

1. Run the updated migration script:
   ```bash
   ./scripts/apply-storage-security.sh
   ```

2. This will:
   - Remove the old complex migration
   - Apply the simplified RLS policies
   - Deploy updated Edge Functions
   - Show verification steps

3. Test that existing files are still accessible to authorized users

4. Set up periodic cleanup:
   ```sql
   -- Run daily via pg_cron or scheduler
   SELECT cleanup_orphaned_storage_objects();
   ```

## Changes from V1 to V2

Based on security review feedback:

1. **Simplified RLS Policies**: Removed complex path parsing functions
2. **Application-Level Auth**: Moved authorization logic to Edge Functions
3. **Better Performance**: Simpler policies = faster queries
4. **Maintained Security**: All uploads still go through validated Edge Functions
5. **Improved Validation**: Enhanced MIME type and filename sanitization

## Monitoring and Alerts

Set up monitoring for:
- Failed authentication attempts
- Unusual file access patterns
- Storage quota approaching limits
- Expired signed URL access attempts

## Future Enhancements

1. **Virus Scanning**: Integrate with a virus scanning service
2. **Content Moderation**: Add image content analysis
3. **Encryption at Rest**: Enable for sensitive feedback
4. **Geo-replication**: For improved performance and redundancy
5. **Advanced Compression**: Server-side image optimization pipeline
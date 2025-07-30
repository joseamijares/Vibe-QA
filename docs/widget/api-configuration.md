# Widget API Configuration

## Overview

The VibeQA widget submits feedback to a Supabase Edge Function. This document explains how to configure the widget to connect to your backend API.

## API Endpoint

The feedback submission endpoint is deployed as a Supabase Edge Function:

```
https://[YOUR-SUPABASE-PROJECT-ID].supabase.co/functions/v1/submit-feedback
```

## Widget Configuration

### Basic Setup

```html
<script>
window.vibeQAConfig = {
  projectKey: 'YOUR_PROJECT_KEY',
  apiUrl: 'https://[YOUR-SUPABASE-PROJECT-ID].supabase.co/functions/v1',
  // Other configuration options...
};
</script>
<script src="https://cdn.vibeqa.com/widget.js" async></script>
```

### Development Setup

For local development, you can use Supabase local functions:

```javascript
window.vibeQAConfig = {
  projectKey: 'proj_test123456789',
  apiUrl: 'http://localhost:54321/functions/v1', // Supabase local functions URL
  debug: true
};
```

## API Authentication

The widget authenticates using a project API key passed in the `X-Project-Key` header:

```javascript
headers: {
  'X-Project-Key': 'YOUR_PROJECT_KEY'
}
```

## Request Format

### JSON Request (without media)

```json
{
  "type": "bug",
  "title": "Optional title",
  "description": "Required description",
  "reporterEmail": "user@example.com",
  "reporterName": "John Doe",
  "pageUrl": "https://example.com/page",
  "userAgent": "Mozilla/5.0...",
  "browserInfo": {
    "browser": "Chrome",
    "version": "120.0",
    "os": "macOS"
  },
  "deviceInfo": {
    "type": "desktop",
    "os": "macOS",
    "screenResolution": "1920x1080"
  },
  "customData": {
    "userId": "123",
    "plan": "premium"
  }
}
```

### Multipart Request (with media)

When submitting with media files, the request uses `multipart/form-data`:

- `data`: JSON string containing the feedback data
- `screenshot-0`, `screenshot-1`, etc.: Screenshot files
- `recording-0`, `recording-1`, etc.: Voice recording files

## Response Format

### Success Response

```json
{
  "success": true,
  "id": "feedback-uuid",
  "message": "Feedback submitted successfully",
  "mediaUploaded": 2
}
```

### Error Responses

```json
{
  "error": "Error message",
  "details": "Additional error details" // Only in development
}
```

## Error Codes

- `401`: Invalid or missing project key
- `403`: Project inactive or domain not allowed
- `400`: Invalid request data or file validation error
- `500`: Server error

## CORS Configuration

The Edge Function allows all origins by default. Domain restrictions are enforced at the application level based on project settings.

## File Upload Limits

- Maximum file size: 10MB per file
- Maximum attachments: 5 files per submission
- Allowed formats:
  - Screenshots: PNG, JPEG, GIF, WebP
  - Voice: WebM, MP4, OGG, WAV, MP3

## Deployment

1. Deploy the Edge Function:
   ```bash
   supabase functions deploy submit-feedback
   ```

2. Set required environment variables:
   ```bash
   supabase secrets set BREVO_API_KEY='your-api-key'
   supabase secrets set APP_URL='https://your-app.com'
   ```

3. Update widget configuration with your Supabase URL:
   ```javascript
   apiUrl: 'https://your-project.supabase.co/functions/v1'
   ```

## Testing

Test the endpoint with cURL:

```bash
curl -X POST \
  https://your-project.supabase.co/functions/v1/submit-feedback \
  -H "Content-Type: application/json" \
  -H "X-Project-Key: YOUR_PROJECT_KEY" \
  -d '{
    "type": "bug",
    "description": "Test feedback",
    "pageUrl": "https://example.com"
  }'
```

## Monitoring

Monitor function invocations in the Supabase dashboard:
- Functions → submit-feedback → Logs
- Check for errors and performance metrics
- Set up alerts for failed submissions
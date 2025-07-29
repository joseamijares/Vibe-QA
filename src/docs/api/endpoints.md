# VibeQA API Documentation

## Overview

VibeQA provides REST API endpoints for widget integration and future third-party integrations. All API endpoints require proper authentication via API keys or session tokens.

## Base URL

```
Development: http://localhost:5173/api
Production: https://your-domain.com/api
```

## Authentication

### Widget Authentication

Widgets authenticate using project-specific API keys passed in the request headers.

```
X-Project-Key: proj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Dashboard Authentication

Dashboard requests use session-based authentication via Supabase Auth.

## Endpoints

### Widget API

#### Submit Feedback

Submit feedback from an embedded widget.

**Endpoint:** `POST /api/widget/feedback`

**Headers:**

```
Content-Type: application/json
X-Project-Key: proj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Origin: https://allowed-domain.com
```

**Request Body:**

```json
{
  "type": "bug" | "suggestion" | "praise" | "other",
  "message": "string (required)",
  "email": "string (optional)",
  "metadata": {
    "url": "string",
    "userAgent": "string",
    "viewport": {
      "width": "number",
      "height": "number"
    },
    "screen": {
      "width": "number",
      "height": "number"
    }
  },
  "screenshot": "base64 string (optional)"
}
```

**Response (Success):**

```json
{
  "success": true,
  "feedback": {
    "id": "uuid",
    "created_at": "timestamp"
  }
}
```

**Response (Error):**

```json
{
  "success": false,
  "error": "Error message"
}
```

**Status Codes:**

- `200` - Success
- `400` - Bad request (invalid data)
- `401` - Unauthorized (invalid API key)
- `403` - Forbidden (domain not allowed)
- `500` - Server error

**CORS:**
This endpoint supports CORS for cross-origin requests from allowed domains.

## Planned Endpoints (Not Yet Implemented)

### Projects API

#### List Projects

`GET /api/projects`

- Requires dashboard authentication
- Returns projects for the user's organization

#### Get Project Details

`GET /api/projects/:id`

- Requires dashboard authentication
- Returns project details including stats

#### Update Project

`PATCH /api/projects/:id`

- Requires admin/owner role
- Update project settings

### Feedback API

#### List Feedback

`GET /api/feedback`

- Query parameters: `project_id`, `status`, `type`, `limit`, `offset`
- Requires dashboard authentication

#### Get Feedback Details

`GET /api/feedback/:id`

- Includes comments and media
- Requires dashboard authentication

#### Update Feedback

`PATCH /api/feedback/:id`

- Update status, priority, assignee
- Requires member role or higher

#### Add Comment

`POST /api/feedback/:id/comments`

- Add comment to feedback
- Requires member role or higher

### Team API

#### List Team Members

`GET /api/team`

- Returns organization members
- Requires dashboard authentication

#### Invite Team Member

`POST /api/team/invite`

- Send invitation email
- Requires admin/owner role

#### Update Member Role

`PATCH /api/team/:memberId`

- Change member role
- Requires owner role

### Analytics API

#### Get Project Analytics

`GET /api/analytics/project/:id`

- Feedback trends, resolution times
- Requires dashboard authentication

#### Get Organization Analytics

`GET /api/analytics/organization`

- Overall metrics across projects
- Requires dashboard authentication

### Webhooks (Future)

#### Configure Webhook

`POST /api/webhooks`

- Set up webhook for feedback events
- Requires admin/owner role

#### Webhook Events:

- `feedback.created`
- `feedback.updated`
- `feedback.resolved`
- `comment.added`

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": {} // Optional additional information
}
```

Common error codes:

- `INVALID_API_KEY` - Invalid or missing API key
- `DOMAIN_NOT_ALLOWED` - Request origin not in allowed domains
- `RATE_LIMITED` - Too many requests
- `INVALID_INPUT` - Validation error
- `NOT_FOUND` - Resource not found
- `FORBIDDEN` - Insufficient permissions
- `SERVER_ERROR` - Internal server error

## Rate Limiting (Planned)

- Widget API: 100 requests per minute per API key
- Dashboard API: 1000 requests per minute per user
- Webhook delivery: 10 retries with exponential backoff

## SDK Support (Future)

Planned SDK support for:

- JavaScript/TypeScript
- React components
- Vue components
- Python
- Ruby

## Testing

### Widget Integration Test

```javascript
// Test widget feedback submission
const response = await fetch('http://localhost:5173/api/widget/feedback', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Project-Key': 'proj_your_test_key',
  },
  body: JSON.stringify({
    type: 'bug',
    message: 'Test feedback',
    email: 'test@example.com',
    metadata: {
      url: window.location.href,
      userAgent: navigator.userAgent,
    },
  }),
});

const data = await response.json();
console.log('Feedback submitted:', data);
```

## API Versioning

Currently using unversioned API. Future versions will use:

- URL versioning: `/api/v2/...`
- Header versioning: `X-API-Version: 2`

## Support

For API support and questions:

- Documentation: `/docs/api/`
- Issues: GitHub repository
- Email: support@vibeqa.app (future)

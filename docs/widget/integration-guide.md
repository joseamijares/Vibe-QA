# VibeQA Widget Integration Guide

## Table of Contents
1. [Getting Started](#getting-started)
2. [Project Setup](#project-setup)
3. [Basic Integration](#basic-integration)
4. [Advanced Features](#advanced-features)
5. [Backend Integration](#backend-integration)
6. [Best Practices](#best-practices)

## Getting Started

### Prerequisites
- A VibeQA account with an active project
- Your project's API key
- A website where you want to collect feedback

### Quick Integration (2 minutes)

1. **Get your project key** from the VibeQA dashboard
2. **Add the widget script** to your HTML:

```html
<script 
  src="https://cdn.vibeqa.com/widget.js" 
  data-project-key="YOUR_PROJECT_KEY"
  async>
</script>
```

That's it! The widget will automatically appear on your site.

## Project Setup

### 1. Create a Project

In your VibeQA dashboard:
1. Navigate to Projects
2. Click "New Project"
3. Enter project details
4. Copy the API key

### 2. Configure Allowed Domains (Optional)

For security, restrict which domains can use your widget:

1. Go to Project Settings
2. Add allowed domains:
   - `https://app.example.com` (exact match)
   - `*.example.com` (wildcard)
   - `localhost:*` (for development)

### 3. Set Up Email Notifications

Configure where feedback notifications are sent:
1. Go to Project Settings
2. Enable "Email Notifications"
3. Enter notification email address

## Basic Integration

### HTML Integration

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>My Application</title>
</head>
<body>
    <!-- Your application content -->
    
    <!-- VibeQA Widget -->
    <script 
      src="https://cdn.vibeqa.com/widget.js" 
      data-project-key="proj_abc123"
      async>
    </script>
</body>
</html>
```

### With User Context

Pass user information for better feedback tracking:

```html
<script>
  // Set configuration before widget loads
  window.VibeQAConfig = {
    projectKey: 'proj_abc123',
    user: {
      id: '12345',
      email: 'john@example.com',
      name: 'John Doe'
    }
  };
</script>
<script src="https://cdn.vibeqa.com/widget.js" async></script>
```

### Custom Positioning

```javascript
window.VibeQAConfig = {
  projectKey: 'proj_abc123',
  position: 'bottom-left', // bottom-right, bottom-left, top-right, top-left
};
```

## Advanced Features

### Custom Trigger Button

Hide the default button and use your own:

```html
<!-- Your custom button -->
<button id="feedback-btn" class="my-custom-button">
  Send Feedback
</button>

<script>
  window.VibeQAConfig = {
    projectKey: 'proj_abc123',
    triggerType: 'custom' // Hide default button
  };
  
  // Open widget on custom button click
  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('feedback-btn').addEventListener('click', () => {
      if (window.VibeQA) {
        window.VibeQA.open();
      }
    });
  });
</script>
```

### Metadata and Context

Include application context with feedback:

```javascript
window.VibeQAConfig = {
  projectKey: 'proj_abc123',
  metadata: {
    // Application info
    version: '2.1.0',
    environment: 'production',
    
    // User context
    subscription: 'premium',
    accountAge: '2 years',
    
    // Page context
    section: 'dashboard',
    feature: 'analytics',
    
    // Any custom data
    customField: 'value'
  }
};
```

### Event Handlers

React to widget events:

```javascript
window.VibeQAConfig = {
  projectKey: 'proj_abc123',
  
  onOpen: () => {
    // Track event in analytics
    analytics.track('Feedback Widget Opened');
  },
  
  onClose: () => {
    // Resume animations, etc.
    resumeAnimations();
  },
  
  onSuccess: (feedbackId) => {
    // Show custom success message
    showNotification('Thank you for your feedback!');
    
    // Track conversion
    analytics.track('Feedback Submitted', {
      feedbackId: feedbackId
    });
  },
  
  onError: (error) => {
    // Handle errors gracefully
    console.error('Feedback error:', error);
    showNotification('Failed to send feedback. Please try again.');
  }
};
```

### Theme Customization

Match your brand:

```javascript
window.VibeQAConfig = {
  projectKey: 'proj_abc123',
  theme: 'light', // or 'dark', 'auto'
  primaryColor: '#3b82f6', // Your brand color
  buttonText: 'Report Issue' // Custom button text
};
```

### Programmatic Control

Control the widget via JavaScript:

```javascript
// Wait for widget to load
window.addEventListener('load', () => {
  const widget = window.VibeQA;
  
  // Open widget programmatically
  document.querySelector('.help-link').addEventListener('click', (e) => {
    e.preventDefault();
    widget.open();
  });
  
  // Pre-fill feedback based on context
  document.querySelector('.report-bug-btn').addEventListener('click', () => {
    widget.open();
    // Widget will remember the selected type
    widget.updateConfig({
      metadata: {
        triggeredFrom: 'bug-report-button'
      }
    });
  });
  
  // Update user after login
  auth.on('login', (user) => {
    widget.updateConfig({
      user: {
        id: user.id,
        email: user.email,
        name: user.displayName
      }
    });
  });
});
```

## Backend Integration

### API Endpoint Structure

The widget sends feedback to your API endpoint with this structure:

```json
{
  "projectKey": "proj_abc123",
  "type": "bug",
  "title": "Login button not working",
  "description": "When I click the login button, nothing happens...",
  "reporterEmail": "user@example.com",
  "reporterName": "John Doe",
  "pageUrl": "https://app.example.com/login",
  "userAgent": "Mozilla/5.0...",
  "browserInfo": {
    "browser": "Chrome",
    "version": "91.0.4472.124",
    "os": "macOS"
  },
  "deviceInfo": {
    "type": "desktop",
    "os": "macOS",
    "screenResolution": "2560x1440"
  },
  "customData": {
    "version": "2.1.0",
    "environment": "production"
  }
}
```

### File Uploads

When attachments are included, the widget sends multipart form data:

```
POST /api/widget/feedback
Content-Type: multipart/form-data

data: {"projectKey":"proj_abc123","type":"bug",...}
screenshot-0: [binary data]
recording-0: [binary data]
```

### Webhook Integration

Set up webhooks to receive feedback in real-time:

```javascript
// Webhook payload example
{
  "event": "feedback.created",
  "data": {
    "id": "fb_123",
    "projectId": "proj_abc123",
    "type": "bug",
    "title": "Login issue",
    "description": "...",
    "screenshots": ["https://storage.vibeqa.com/..."],
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

## Best Practices

### 1. Performance

**Async Loading**
Always load the widget asynchronously to avoid blocking page load:

```html
<script src="https://cdn.vibeqa.com/widget.js" async></script>
```

**Lazy Loading**
Load the widget only when needed:

```javascript
function loadFeedbackWidget() {
  if (!window.VibeQA) {
    const script = document.createElement('script');
    script.src = 'https://cdn.vibeqa.com/widget.js';
    script.setAttribute('data-project-key', 'proj_abc123');
    script.async = true;
    document.body.appendChild(script);
  }
}

// Load on user interaction
document.querySelector('.help-menu').addEventListener('click', loadFeedbackWidget);
```

### 2. User Experience

**Provide Context**
Help users by providing context:

```javascript
window.VibeQAConfig = {
  projectKey: 'proj_abc123',
  metadata: {
    // Automatic context
    pageTitle: document.title,
    currentUrl: window.location.href,
    timestamp: new Date().toISOString(),
    
    // User journey
    sessionDuration: getSessionDuration(),
    pagesVisited: getPageCount()
  }
};
```

**Custom Prompts**
Guide users based on context:

```javascript
// On error pages
if (window.location.pathname === '/error') {
  window.VibeQAConfig = {
    projectKey: 'proj_abc123',
    buttonText: 'Report This Error'
  };
}

// In help section
if (window.location.pathname.includes('/help')) {
  window.VibeQAConfig = {
    projectKey: 'proj_abc123',
    buttonText: 'Still need help?'
  };
}
```

### 3. Security

**Domain Restrictions**
Always configure allowed domains in production:
- Prevents unauthorized usage
- Protects your feedback quota
- Ensures data integrity

**Sanitize User Input**
The widget sanitizes input, but always validate on the backend:
```javascript
// Backend validation example
const sanitizedFeedback = {
  title: DOMPurify.sanitize(feedback.title),
  description: DOMPurify.sanitize(feedback.description),
  // ... other fields
};
```

### 4. Analytics Integration

Track widget usage:

```javascript
window.VibeQAConfig = {
  projectKey: 'proj_abc123',
  
  onOpen: () => {
    // Google Analytics
    gtag('event', 'feedback_widget_open', {
      event_category: 'engagement'
    });
    
    // Segment
    analytics.track('Feedback Widget Opened');
    
    // Mixpanel
    mixpanel.track('Feedback Widget Open');
  },
  
  onSuccess: (feedbackId) => {
    // Track successful submission
    gtag('event', 'feedback_submitted', {
      event_category: 'engagement',
      event_label: feedbackId
    });
  }
};
```

### 5. A/B Testing

Test different configurations:

```javascript
// A/B test button text
const variant = getABTestVariant('feedback-button-text');

window.VibeQAConfig = {
  projectKey: 'proj_abc123',
  buttonText: variant === 'A' ? 'Feedback' : 'Report Issue',
  metadata: {
    abTestVariant: variant
  }
};
```

## Troubleshooting

### Common Issues

**Widget not appearing**
```javascript
// Debug checklist
console.log('Widget loaded?', window.VibeQA !== undefined);
console.log('Project key set?', window.VibeQAConfig?.projectKey);

// Enable debug mode
window.VibeQAConfig = {
  projectKey: 'proj_abc123',
  debug: true // Shows detailed logs
};
```

**CORS errors**
Ensure your domain is allowed in project settings or API CORS configuration.

**Media capture not working**
- Requires HTTPS (except localhost)
- User must grant permissions
- Check browser compatibility

### Support

- Documentation: https://docs.vibeqa.com
- Email: support@vibeqa.com
- GitHub Issues: https://github.com/vibeqa/widget/issues
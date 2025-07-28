# VibeQA Widget Documentation

## Overview

The VibeQA widget is a powerful, embeddable feedback collection tool that allows your users to submit feedback directly from your application. It features a modern UI, media capture capabilities, and complete style isolation using Shadow DOM.

## Features

- 🎨 **Beautiful UI** - Modern, responsive design with smooth animations
- 📸 **Screenshot Capture** - Automatic page screenshot with html2canvas
- 🎤 **Voice Recording** - Built-in audio recording with MediaRecorder API
- 🔒 **Secure** - API key authentication and domain validation
- ♿ **Accessible** - Full keyboard navigation and ARIA labels
- 🎯 **Type-Safe** - Built with TypeScript for reliability
- 💾 **Auto-Save** - Form data persists across sessions
- 🌓 **Theme Support** - Light, dark, and auto themes

## Installation

### CDN (Recommended)

Add this script tag to your HTML:

```html
<script 
  src="https://cdn.vibeqa.com/widget.js" 
  data-project-key="YOUR_PROJECT_KEY"
  async>
</script>
```

### NPM

```bash
npm install @vibeqa/widget
```

```javascript
import { VibeQAWidget } from '@vibeqa/widget';

const widget = new VibeQAWidget({
  projectKey: 'YOUR_PROJECT_KEY'
});
```

## Quick Start

### Basic Setup

```html
<!DOCTYPE html>
<html>
<head>
  <title>My App</title>
</head>
<body>
  <!-- Your app content -->

  <!-- VibeQA Widget -->
  <script 
    src="https://cdn.vibeqa.com/widget.js" 
    data-project-key="proj_abc123"
    async>
  </script>
</body>
</html>
```

### Advanced Configuration

```html
<script>
  window.VibeQAConfig = {
    projectKey: 'proj_abc123',
    apiUrl: 'https://api.vibeqa.com',
    position: 'bottom-right',
    theme: 'auto',
    primaryColor: '#094765',
    buttonText: 'Send Feedback',
    user: {
      id: 'user123',
      email: 'user@example.com',
      name: 'John Doe'
    },
    metadata: {
      version: '1.2.3',
      environment: 'production',
      customField: 'value'
    },
    onSuccess: function(feedbackId) {
      console.log('Feedback submitted:', feedbackId);
    },
    onError: function(error) {
      console.error('Feedback error:', error);
    }
  };
</script>
<script src="https://cdn.vibeqa.com/widget.js" async></script>
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `projectKey` | string | required | Your project's API key |
| `apiUrl` | string | `https://api.vibeqa.com` | API endpoint URL |
| `position` | string | `bottom-right` | Widget position: `bottom-right`, `bottom-left`, `top-right`, `top-left` |
| `theme` | string | `auto` | Color theme: `light`, `dark`, `auto` |
| `primaryColor` | string | `#094765` | Primary brand color (hex) |
| `triggerType` | string | `button` | Trigger type: `button`, `custom`, `both` |
| `buttonText` | string | `Feedback` | Text for the feedback button |
| `zIndex` | number | `999999` | Z-index for the widget |
| `debug` | boolean | `false` | Enable debug logging |
| `metadata` | object | `{}` | Custom metadata to include with feedback |
| `user` | object | `{}` | User information (id, email, name) |
| `onSuccess` | function | - | Callback after successful submission |
| `onError` | function | - | Callback on error |
| `onOpen` | function | - | Callback when widget opens |
| `onClose` | function | - | Callback when widget closes |

## API Methods

### Programmatic Control

```javascript
// Get widget instance
const widget = window.VibeQA;

// Open the widget
widget.open();

// Close the widget
widget.close();

// Toggle open/close
widget.toggle();

// Update configuration
widget.updateConfig({
  theme: 'dark',
  primaryColor: '#3b82f6'
});

// Submit feedback programmatically
widget.submit({
  type: 'bug',
  title: 'Login issue',
  description: 'Cannot login with Google',
  reporterEmail: 'user@example.com'
});

// Destroy widget
widget.destroy();
```

## Feedback Types

The widget supports four feedback types:

1. **Bug** - Report issues and problems
2. **Suggestion** - Request new features
3. **Praise** - Share positive feedback
4. **Other** - General feedback

Each type has customized placeholders and prompts to guide users.

## Media Attachments

### Screenshots
- Automatically captures the current page
- Excludes the widget from screenshots
- Resizes large images for optimal upload
- Generates thumbnails for preview

### Voice Recording
- Records audio using device microphone
- Shows recording timer and controls
- Supports multiple audio formats (WebM, MP4, OGG, WAV)
- Maximum 5 minute recordings

### Limitations
- Maximum 5 attachments per feedback
- Maximum 10MB per file
- Supported formats: PNG (screenshots), WebM/MP4/OGG/WAV (audio)

## Custom Trigger

Use a custom trigger button instead of the default:

```html
<button id="custom-feedback-btn">Report Issue</button>

<script>
  window.VibeQAConfig = {
    projectKey: 'proj_abc123',
    triggerType: 'custom'
  };
  
  // After widget loads
  document.getElementById('custom-feedback-btn').addEventListener('click', () => {
    window.VibeQA.open();
  });
</script>
```

## Styling

The widget uses Shadow DOM for complete style isolation. Custom styling options:

### Primary Color
```javascript
window.VibeQAConfig = {
  primaryColor: '#3b82f6' // Your brand color
};
```

### Theme Customization
The widget automatically inherits your primary color for:
- Button backgrounds
- Focus states
- Selected states
- Loading indicators

## Security

### Domain Validation
Configure allowed domains in your VibeQA dashboard:
- Exact matches: `https://app.example.com`
- Wildcards: `*.example.com`
- Multiple domains supported

### API Key Security
- Never expose secret keys
- Use project-specific API keys
- Rotate keys regularly
- Set domain restrictions

## Browser Support

- Chrome/Edge 88+
- Firefox 78+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Android)

### Required Features
- Shadow DOM
- FormData API
- Fetch API
- MediaRecorder API (for voice recording)

## Keyboard Shortcuts

- `Ctrl/Cmd + Shift + F` - Toggle widget
- `Esc` - Close widget
- `Tab` - Navigate between fields
- `Enter` - Submit form (in text fields)
- `Ctrl/Cmd + Enter` - Submit form (in textarea)

## Events

Listen to widget events:

```javascript
// Widget opened
window.addEventListener('vibeqa:open', () => {
  console.log('Widget opened');
});

// Widget closed
window.addEventListener('vibeqa:close', () => {
  console.log('Widget closed');
});

// Feedback submitted
window.addEventListener('vibeqa:submit', (event) => {
  console.log('Feedback submitted:', event.detail);
});
```

## Troubleshooting

### Widget not appearing
1. Check browser console for errors
2. Verify project key is correct
3. Ensure domain is allowed (if restricted)
4. Check z-index conflicts

### Media capture not working
1. Ensure HTTPS is used (required for MediaRecorder)
2. Check browser permissions for microphone
3. Verify browser compatibility

### Submission errors
1. Check network tab for API errors
2. Verify project is active
3. Ensure required fields are filled
4. Check file size limits

## Debug Mode

Enable debug logging:

```javascript
window.VibeQAConfig = {
  projectKey: 'proj_abc123',
  debug: true
};
```

Debug logs will appear in the browser console prefixed with `[VibeQA]`.

## Examples

### SPA Integration (React)

```jsx
import { useEffect } from 'react';

function App() {
  useEffect(() => {
    // Load widget
    const script = document.createElement('script');
    script.src = 'https://cdn.vibeqa.com/widget.js';
    script.setAttribute('data-project-key', 'proj_abc123');
    script.async = true;
    document.body.appendChild(script);

    // Cleanup
    return () => {
      if (window.VibeQA) {
        window.VibeQA.destroy();
      }
      script.remove();
    };
  }, []);

  return <div>Your app content</div>;
}
```

### Vue Integration

```vue
<template>
  <div id="app">
    <!-- Your app content -->
  </div>
</template>

<script>
export default {
  mounted() {
    // Configure widget
    window.VibeQAConfig = {
      projectKey: 'proj_abc123',
      user: {
        email: this.$store.state.user.email,
        name: this.$store.state.user.name
      }
    };

    // Load widget
    const script = document.createElement('script');
    script.src = 'https://cdn.vibeqa.com/widget.js';
    script.async = true;
    document.body.appendChild(script);
  },
  
  beforeDestroy() {
    if (window.VibeQA) {
      window.VibeQA.destroy();
    }
  }
}
</script>
```

### Dynamic User Context

Update user information after login:

```javascript
// After user logs in
window.VibeQA.updateConfig({
  user: {
    id: user.id,
    email: user.email,
    name: user.name
  },
  metadata: {
    subscription: user.subscription,
    role: user.role
  }
});
```

## License

The VibeQA widget is proprietary software. Usage requires an active VibeQA subscription.
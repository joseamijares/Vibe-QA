# VibeQA Widget Installation Guide

Welcome to VibeQA! This guide will help you install and configure the feedback widget on your website or application.

## Quick Start (2 minutes)

Add this code to your website's HTML, just before the closing `</body>` tag:

```html
<script>
window.vibeQAConfig = {
  projectKey: 'YOUR_PROJECT_KEY' // Replace with your actual project key
};
</script>
<script src="https://cdn.vibeqa.com/widget.js" async></script>
```

That's it! The feedback button will appear in the bottom-right corner of your website.

## Installation Methods

### Method 1: Script Tag (Recommended)

The simplest way to add VibeQA to your website:

```html
<!-- Basic installation -->
<script 
  src="https://cdn.vibeqa.com/widget.js" 
  data-project-key="YOUR_PROJECT_KEY"
  async>
</script>
```

### Method 2: JavaScript Configuration

For more control over the widget:

```html
<script>
// Configure the widget before loading
window.vibeQAConfig = {
  projectKey: 'YOUR_PROJECT_KEY',
  position: 'bottom-right',
  theme: 'auto',
  primaryColor: '#094765',
  user: {
    email: 'user@example.com',
    name: 'John Doe'
  }
};
</script>
<script src="https://cdn.vibeqa.com/widget.js" async></script>
```

### Method 3: NPM Package (Coming Soon)

```bash
npm install @vibeqa/widget
```

```javascript
import { VibeQA } from '@vibeqa/widget';

VibeQA.init({
  projectKey: 'YOUR_PROJECT_KEY'
});
```

## Configuration Options

### Basic Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `projectKey` | string | required | Your project's unique API key |
| `position` | string | 'bottom-right' | Widget position: 'bottom-right', 'bottom-left', 'top-right', 'top-left' |
| `theme` | string | 'auto' | Color theme: 'light', 'dark', 'auto' |
| `primaryColor` | string | '#094765' | Your brand color (hex format) |
| `buttonText` | string | 'Feedback' | Custom text for the feedback button |
| `zIndex` | number | 999999 | CSS z-index for the widget |

### User Context

Automatically attach user information to feedback:

```javascript
window.vibeQAConfig = {
  projectKey: 'YOUR_PROJECT_KEY',
  user: {
    id: '12345',           // Your internal user ID
    email: 'user@example.com',
    name: 'John Doe',
    // Add any custom properties
    plan: 'premium',
    company: 'Acme Inc'
  }
};
```

### Custom Metadata

Attach additional context to all feedback:

```javascript
window.vibeQAConfig = {
  projectKey: 'YOUR_PROJECT_KEY',
  metadata: {
    version: '2.1.0',
    environment: 'production',
    feature: 'checkout',
    // Any custom data you need
  }
};
```

### Event Callbacks

React to widget events:

```javascript
window.vibeQAConfig = {
  projectKey: 'YOUR_PROJECT_KEY',
  onSuccess: function(feedbackId) {
    console.log('Feedback submitted:', feedbackId);
    // Track in your analytics
    gtag('event', 'feedback_submitted', {
      feedback_id: feedbackId
    });
  },
  onError: function(error) {
    console.error('Feedback error:', error);
    // Handle errors
  },
  onOpen: function() {
    console.log('Widget opened');
  },
  onClose: function() {
    console.log('Widget closed');
  }
};
```

## Framework Integration

### React

```jsx
import { useEffect } from 'react';

function App() {
  useEffect(() => {
    // Load VibeQA widget
    window.vibeQAConfig = {
      projectKey: 'YOUR_PROJECT_KEY',
      user: {
        email: currentUser.email,
        name: currentUser.name
      }
    };

    const script = document.createElement('script');
    script.src = 'https://cdn.vibeqa.com/widget.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      // Cleanup
      if (window.VibeQA) {
        window.VibeQA.destroy();
      }
    };
  }, []);

  return <div>Your app content</div>;
}
```

### Vue.js

```vue
<template>
  <div id="app">
    <!-- Your app content -->
  </div>
</template>

<script>
export default {
  mounted() {
    // Configure VibeQA
    window.vibeQAConfig = {
      projectKey: 'YOUR_PROJECT_KEY',
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
};
</script>
```

### Angular

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit, OnDestroy {
  ngOnInit() {
    // Configure VibeQA
    (window as any).vibeQAConfig = {
      projectKey: 'YOUR_PROJECT_KEY',
      user: {
        email: this.authService.currentUser.email,
        name: this.authService.currentUser.name
      }
    };

    // Load widget
    const script = document.createElement('script');
    script.src = 'https://cdn.vibeqa.com/widget.js';
    script.async = true;
    document.body.appendChild(script);
  }

  ngOnDestroy() {
    if ((window as any).VibeQA) {
      (window as any).VibeQA.destroy();
    }
  }
}
```

## Advanced Usage

### Programmatic Control

Control the widget programmatically:

```javascript
// Open the widget
window.VibeQA.open();

// Close the widget
window.VibeQA.close();

// Toggle open/close
window.VibeQA.toggle();

// Submit feedback programmatically
window.VibeQA.submit({
  type: 'bug',
  description: 'The checkout button is not working',
  screenshot: true // Auto-capture screenshot
});

// Update configuration
window.VibeQA.updateConfig({
  theme: 'dark',
  position: 'bottom-left'
});

// Destroy the widget
window.VibeQA.destroy();
```

### Custom Trigger Button

Use your own button to trigger the widget:

```html
<!-- Hide default button -->
<script>
window.vibeQAConfig = {
  projectKey: 'YOUR_PROJECT_KEY',
  triggerType: 'custom' // Hides the default button
};
</script>
<script src="https://cdn.vibeqa.com/widget.js" async></script>

<!-- Your custom button -->
<button onclick="window.VibeQA.open()">
  Send Feedback
</button>
```

### Dynamic User Updates

Update user context after initialization:

```javascript
// User logs in
function onUserLogin(user) {
  window.VibeQA.updateConfig({
    user: {
      id: user.id,
      email: user.email,
      name: user.name
    }
  });
}

// User logs out
function onUserLogout() {
  window.VibeQA.updateConfig({
    user: null
  });
}
```

## Security & Privacy

### Content Security Policy (CSP)

If you use CSP, add these directives:

```
script-src 'self' https://cdn.vibeqa.com;
connect-src 'self' https://*.supabase.co;
style-src 'self' 'unsafe-inline';
img-src 'self' data: https://*.supabase.co;
```

### Domain Restrictions

Your project can be configured to only accept feedback from specific domains. Contact support to set up domain restrictions.

### Data Privacy

- All feedback is transmitted over HTTPS
- User data is stored securely in compliance with GDPR
- Screenshots are processed client-side before upload
- No third-party tracking or analytics

## Troubleshooting

### Widget Not Appearing

1. **Check Project Key**: Ensure you're using the correct project key
2. **Check Console**: Look for errors in browser console (F12)
3. **Check Network**: Ensure widget.js loads successfully
4. **Check CSP**: Verify Content Security Policy allows our domain

### Feedback Not Submitting

1. **Check Project Status**: Ensure your project is active
2. **Check Domain**: Verify your domain is allowed (if restrictions are set)
3. **Check Network**: Look for failed API calls in Network tab

### Styling Issues

1. **Check z-index**: Increase zIndex if widget appears behind other elements
2. **Check CSS**: Ensure no global styles interfere with the widget
3. **Shadow DOM**: Widget uses Shadow DOM for style isolation

### Common Error Messages

- **"Invalid project key"**: Your project key is incorrect or project is inactive
- **"Domain not allowed"**: Your domain is not in the allowed list
- **"Failed to submit feedback"**: Network error or server issue

## Best Practices

1. **Load Asynchronously**: Always use the `async` attribute to prevent blocking
2. **Configure Early**: Set `window.vibeQAConfig` before loading the script
3. **Handle Errors**: Implement error callbacks for better user experience
4. **Update User Context**: Keep user information current for better tracking
5. **Test Thoroughly**: Test on all target browsers and devices

## Support

Need help? We're here for you:

- 📧 Email: support@vibeqa.com
- 📚 Docs: https://docs.vibeqa.com
- 💬 Chat: Click the VibeQA widget on our website
- 🐛 Issues: https://github.com/vibeqa/widget/issues

## Updates

The widget automatically updates to the latest version. To use a specific version:

```html
<!-- Specific version -->
<script src="https://cdn.vibeqa.com/widget@1.0.0.js"></script>

<!-- Latest version (recommended) -->
<script src="https://cdn.vibeqa.com/widget.js"></script>
```

---

Happy collecting feedback! 🎉
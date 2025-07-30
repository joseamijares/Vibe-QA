# VibeQA Widget Technical Architecture

## Overview

The VibeQA widget is a sophisticated feedback collection tool built with modern web technologies. It's designed to be lightweight, secure, and completely isolated from host applications while providing a rich user experience.

## Architecture Principles

1. **Isolation**: Complete style and script isolation using Shadow DOM
2. **Performance**: Lazy loading, minimal bundle size, async initialization
3. **Security**: API key authentication, domain validation, input sanitization
4. **Extensibility**: Event-driven architecture, plugin system ready
5. **Compatibility**: Works with any web framework or vanilla HTML

## Technology Stack

- **Language**: TypeScript 5.0+
- **Build Tool**: Vite 5.0
- **Bundler**: Rollup (via Vite)
- **Styling**: CSS-in-JS with Shadow DOM encapsulation
- **Media**: html2canvas, MediaRecorder API
- **Target**: ES2020, IIFE format for maximum compatibility

## Component Architecture

```
VibeQAWidget (Main Class)
├── Configuration Manager
├── State Manager
├── UI Manager (WidgetUI)
│   ├── Shadow DOM Container
│   ├── Event Emitter
│   ├── Form Manager
│   └── Navigation Controller
├── Media Manager
│   ├── Screenshot Capture
│   ├── Voice Recorder
│   └── Attachment Storage
└── API Client
    ├── Submission Handler
    └── Error Handler
```

## Core Components

### 1. VibeQAWidget Class

The main entry point that orchestrates all widget functionality.

```typescript
class VibeQAWidget implements WidgetAPI {
  private config: Required<VibeQAWidgetConfig>;
  private state: WidgetState;
  private ui: WidgetUI | null = null;
  
  constructor(config: VibeQAWidgetConfig) {
    // Validate and merge config
    // Initialize state
    // Auto-initialize widget
  }
}
```

**Responsibilities:**
- Configuration validation and management
- State coordination
- API communication
- Lifecycle management
- Error handling

### 2. WidgetUI Class

Manages all UI interactions and DOM manipulation within the Shadow DOM.

```typescript
class WidgetUI extends EventEmitter {
  private shadowRoot: ShadowRoot;
  private state: WidgetState;
  
  render(container: HTMLElement, shadowRoot: ShadowRoot): void {
    // Create and manage UI elements
    // Handle user interactions
    // Emit events for state changes
  }
}
```

**Features:**
- Shadow DOM management
- Event delegation
- Form validation
- Keyboard navigation
- Focus management

### 3. Media Manager

Handles all media capture functionality with a unified interface.

```typescript
class MediaManager {
  async captureScreenshot(options?: ScreenshotOptions): Promise<MediaAttachment>;
  async captureVoice(): Promise<MediaAttachment>;
}
```

**Capabilities:**
- Screenshot capture with html2canvas
- Voice recording with MediaRecorder
- Attachment validation and storage
- Thumbnail generation
- Size optimization

### 4. Event System

Custom event emitter for loose coupling between components.

```typescript
class EventEmitter {
  on(event: string, handler: EventHandler): void;
  off(event: string, handler: EventHandler): void;
  emit(event: string, ...args: any[]): void;
  once(event: string, handler: EventHandler): void;
}
```

**Events:**
- `toggle`, `open`, `close`
- `submit`, `screenshot`, `record`
- `attachment-added`, `attachment-removed`
- `error`, `success`

## Data Flow

### 1. Initialization Flow

```
Window Load → Script Execution → Config Detection → Widget Creation
    ↓              ↓                   ↓                ↓
DOM Ready    Check Config      Validate Keys    Create Shadow DOM
    ↓              ↓                   ↓                ↓
Add Script   Load Settings      API Verify      Render Widget
```

### 2. Feedback Submission Flow

```
User Input → Validation → State Update → API Call → Response
    ↓            ↓            ↓            ↓          ↓
Form Data    Check Required  Save Draft  Submit    Success/Error
    ↓            ↓            ↓            ↓          ↓
Attachments  Show Errors    Update UI   Progress   Update UI
```

### 3. Media Capture Flow

```
User Click → Permission Check → Capture → Process → Attach
    ↓              ↓               ↓         ↓         ↓
Screenshot   Browser Support   html2canvas  Resize  Add to Form
    ↓              ↓               ↓         ↓         ↓
Voice        Microphone       MediaRecorder Encode  Show Preview
```

## Security Architecture

### 1. Input Validation

All user inputs are validated client-side:
- XSS prevention through text sanitization
- File type and size validation
- Email format validation
- Required field enforcement

### 2. API Security

```typescript
// API key in header
headers: {
  'X-Project-Key': projectKey,
  'Content-Type': 'application/json'
}

// Domain validation
if (!allowedDomains.includes(origin)) {
  throw new Error('Domain not allowed');
}
```

### 3. Shadow DOM Isolation

```javascript
// Complete style isolation
this.shadowRoot = container.attachShadow({ mode: 'open' });

// No global style pollution
const styles = document.createElement('style');
styles.textContent = WIDGET_STYLES;
shadowRoot.appendChild(styles);
```

## Performance Optimizations

### 1. Bundle Size

- Tree shaking with Rollup
- Minification with Terser
- Gzip compression: ~60KB
- No external dependencies in core

### 2. Lazy Loading

```javascript
// Load only when needed
if (!window.VibeQA) {
  const script = document.createElement('script');
  script.src = 'widget.js';
  script.async = true;
  document.body.appendChild(script);
}
```

### 3. Resource Management

- Event listener cleanup
- DOM element recycling
- Debounced auto-save
- Efficient render cycles

## Browser Compatibility

### Required APIs
- Shadow DOM v1
- Fetch API
- FormData API
- MediaRecorder API (for voice)
- FileReader API

### Polyfills
None required for modern browsers (2020+)

### Fallbacks
- Graceful degradation for missing features
- Feature detection before use
- Clear error messages

## State Management

### Widget State

```typescript
interface WidgetState {
  isOpen: boolean;
  isMinimized: boolean;
  isLoading: boolean;
  error: string | null;
  feedbackType: FeedbackType;
  currentStep: 'type' | 'details' | 'success';
  attachments?: MediaAttachment[];
}
```

### State Persistence

- Form data: SessionStorage
- User preferences: LocalStorage
- Attachments: In-memory only
- Config: Runtime only

## Build Configuration

### Vite Configuration

```javascript
export default defineConfig({
  build: {
    lib: {
      entry: 'src/widget/loader.ts',
      name: 'VibeQA',
      formats: ['iife']
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true
      }
    }
  }
});
```

### TypeScript Configuration

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "strict": true,
    "esModuleInterop": true
  }
}
```

## Testing Strategy

### Unit Tests
- Component isolation tests
- Utility function tests
- State management tests

### Integration Tests
- API communication
- Media capture flow
- Form submission

### E2E Tests
- Full user journey
- Cross-browser testing
- Performance benchmarks

## Deployment

### CDN Distribution

```nginx
# CDN Headers
Cache-Control: public, max-age=31536000, immutable
Content-Type: application/javascript
Content-Encoding: gzip
```

### Versioning

```javascript
// Semantic versioning
https://cdn.vibeqa.com/widget@1.0.0.js
https://cdn.vibeqa.com/widget@1.js  // Latest v1
https://cdn.vibeqa.com/widget.js     // Latest
```

### Monitoring

- Error tracking with Sentry
- Performance monitoring
- Usage analytics
- A/B testing support

## Future Enhancements

### Planned Features
1. Plugin system for custom fields
2. Offline support with IndexedDB
3. WebRTC for screen recording
4. AI-powered feedback categorization
5. Multi-language support

### Architecture Evolution
1. Web Components migration
2. Module federation for plugins
3. WebAssembly for media processing
4. Service Worker for offline mode
5. Micro-frontend architecture
import { VibeQAWidgetConfig, WidgetState, WidgetAPI, FeedbackSubmission } from './types';
import { WidgetUI } from './components/WidgetUI';
import { detectBrowserInfo, detectDeviceInfo } from './utils/deviceDetection';
import { validateProjectKey } from './utils/validation';
import { WIDGET_STYLES } from './styles/widgetStyles';
import { mediaManager } from './utils/mediaManager';
import { screenshotCapture } from './utils/screenshot';

export class VibeQAWidget implements WidgetAPI {
  private config: Required<VibeQAWidgetConfig>;
  private state: WidgetState;
  private container: HTMLElement | null = null;
  private shadowRoot: ShadowRoot | null = null;
  private ui: WidgetUI | null = null;
  private isInitialized = false;

  constructor(config: VibeQAWidgetConfig) {
    // Validate required config
    if (!config.projectKey) {
      throw new Error('[VibeQA] Project key is required');
    }

    // Set default config values
    this.config = {
      projectKey: config.projectKey,
      apiUrl: config.apiUrl || 'https://api.vibeqa.com',
      position: config.position || 'bottom-right',
      theme: config.theme || 'auto',
      primaryColor: config.primaryColor || '#094765',
      triggerType: config.triggerType || 'button',
      buttonText: config.buttonText || 'Feedback',
      zIndex: config.zIndex || 999999,
      debug: config.debug || false,
      metadata: config.metadata || {},
      user: config.user || {},
      onSuccess: config.onSuccess || (() => {}),
      onError: config.onError || (() => {}),
      onOpen: config.onOpen || (() => {}),
      onClose: config.onClose || (() => {}),
    };

    // Initialize state
    this.state = {
      isOpen: false,
      isMinimized: false,
      isLoading: false,
      error: null,
      feedbackType: 'bug',
      currentStep: 'type',
    };

    // Auto-initialize
    this.init();
  }

  private async init(): Promise<void> {
    try {
      if (this.isInitialized) {
        this.log('Widget already initialized');
        return;
      }

      this.log('Initializing VibeQA widget...');

      // Validate project key format
      if (!validateProjectKey(this.config.projectKey)) {
        throw new Error('[VibeQA] Invalid project key format');
      }

      // Create and inject the widget
      this.createWidget();
      this.setupUI();
      this.isInitialized = true;

      this.log('Widget initialized successfully');
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  private createWidget(): void {
    // Create container element
    this.container = document.createElement('div');
    this.container.id = 'vibeqa-widget-container';
    this.container.style.position = 'fixed';
    this.container.style.zIndex = this.config.zIndex.toString();

    // Set position based on config
    const [vPos, hPos] = this.config.position.split('-');
    this.container.style[vPos as any] = '20px';
    this.container.style[hPos as any] = '20px';

    // Create shadow root for style isolation
    this.shadowRoot = this.container.attachShadow({ mode: 'open' });

    // Inject styles
    const styleSheet = document.createElement('style');
    styleSheet.textContent = WIDGET_STYLES;
    this.shadowRoot.appendChild(styleSheet);

    // Append to body
    document.body.appendChild(this.container);

    // Initialize UI
    this.ui = new WidgetUI(this.config, this.state);
    this.ui.render(this.container, this.shadowRoot);
  }

  private setupUI(): void {
    if (!this.ui) return;

    // Listen to UI events
    this.ui.on('toggle', () => this.toggle());
    this.ui.on('close', () => this.close());
    this.ui.on('submit', (submission: Partial<FeedbackSubmission>) => this.submit(submission));
    this.ui.on('screenshot', (options?: { mode?: 'fullpage' | 'area' }) =>
      this.captureScreenshot(options?.mode)
    );
    this.ui.on('record', () => this.startRecording());

    // Listen for keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + Shift + F to toggle widget
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'F') {
        e.preventDefault();
        this.toggle();
      }
    });
  }

  public open(): void {
    if (!this.isInitialized) {
      this.log('Widget not initialized');
      return;
    }

    this.state.isOpen = true;
    this.ui?.setState({ isOpen: true });
    this.config.onOpen();
    this.log('Widget opened');
  }

  public close(): void {
    if (!this.isInitialized) {
      this.log('Widget not initialized');
      return;
    }

    this.state.isOpen = false;
    this.state.currentStep = 'type';
    this.ui?.setState({ isOpen: false, currentStep: 'type' });
    this.config.onClose();
    this.log('Widget closed');
  }

  public toggle(): void {
    if (this.state.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  public async submit(feedback: Partial<FeedbackSubmission>): Promise<void> {
    try {
      this.state.isLoading = true;
      this.ui?.setState({ isLoading: true });

      // Prepare submission data
      const submission: FeedbackSubmission = {
        projectKey: this.config.projectKey,
        type: feedback.type || this.state.feedbackType,
        title: feedback.title,
        description: feedback.description || '',
        reporterEmail: feedback.reporterEmail || this.config.user.email,
        reporterName: feedback.reporterName || this.config.user.name,
        pageUrl: window.location.href,
        userAgent: navigator.userAgent,
        browserInfo: detectBrowserInfo(),
        deviceInfo: detectDeviceInfo(),
        customData: {
          ...this.config.metadata,
          ...feedback.customData,
        },
        attachments: feedback.attachments,
      };

      // Get attachments
      const attachments = mediaManager.getAttachments();
      const hasAttachments = attachments.length > 0;

      let response: Response;

      if (hasAttachments) {
        // Send as multipart form data with files
        const formData = new FormData();

        // Add JSON data
        const { attachments: _, ...submissionData } = submission;
        formData.append('data', JSON.stringify(submissionData));

        // Add files
        attachments.forEach((attachment, index) => {
          if (attachment.type === 'screenshot') {
            formData.append(`screenshot-${index}`, attachment.blob, attachment.filename);
          } else if (attachment.type === 'voice') {
            formData.append(`recording-${index}`, attachment.blob, attachment.filename);
          }
        });

        response = await fetch(`${this.config.apiUrl}/submit-feedback`, {
          method: 'POST',
          headers: {
            'X-Project-Key': this.config.projectKey,
          },
          body: formData,
        });
      } else {
        // Send as regular JSON
        response = await fetch(`${this.config.apiUrl}/submit-feedback`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Project-Key': this.config.projectKey,
          },
          body: JSON.stringify(submission),
        });
      }

      if (!response.ok) {
        const error = await response.json();

        // Handle specific error codes
        if (response.status === 429 && error.code === 'FEEDBACK_LIMIT_EXCEEDED') {
          // Show a more detailed error for limit exceeded
          this.ui?.showNotification(
            'error',
            'Feedback Limit Reached',
            error.message ||
              'Your organization has reached its monthly feedback limit. Please contact your administrator to upgrade your plan.'
          );
          throw new Error(error.message || 'Feedback limit exceeded');
        }

        if (response.status === 429 && error.code === 'STORAGE_LIMIT_EXCEEDED') {
          // Show a more detailed error for storage limit exceeded
          const details = error.details || {};
          this.ui?.showNotification(
            'error',
            'Storage Limit Reached',
            error.message ||
              `Your organization has reached its storage limit${
                details.currentUsageGB ? ` (${details.currentUsageGB}GB/${details.limitGB}GB)` : ''
              }. Please contact your administrator to upgrade your plan or free up space.`
          );
          throw new Error(error.message || 'Storage limit exceeded');
        }

        throw new Error(error.message || 'Failed to submit feedback');
      }

      const result = await response.json();

      // Show success notification
      this.ui?.showNotification(
        'success',
        'Feedback submitted!',
        `Your feedback has been received. ID: ${result.id}`
      );

      // Clear media manager
      mediaManager.clearAll();

      this.state.currentStep = 'success';
      this.ui?.setState({ currentStep: 'success' });
      this.config.onSuccess(result.id);

      // Auto-close after success
      setTimeout(() => this.close(), 3000);
    } catch (error) {
      this.handleError(error as Error);
    } finally {
      this.state.isLoading = false;
      this.ui?.setState({ isLoading: false });
    }
  }

  public destroy(): void {
    if (this.container) {
      this.ui?.destroy();
      this.container.remove();
      this.container = null;
      this.shadowRoot = null;
      this.ui = null;
      this.isInitialized = false;
      this.log('Widget destroyed');
    }
  }

  public updateConfig(config: Partial<VibeQAWidgetConfig>): void {
    this.config = { ...this.config, ...config };

    if (this.isInitialized) {
      // Re-render widget with new config
      this.destroy();
      this.init();
    }
  }

  private async captureScreenshot(mode: 'fullpage' | 'area' = 'fullpage'): Promise<void> {
    this.log(`Screenshot capture requested - mode: ${mode}`);

    try {
      // Hide widget during screenshot for all modes
      const wasOpen = this.state.isOpen;
      if (wasOpen) {
        // For area selection, temporarily close the widget
        if (mode === 'area') {
          this.state.isOpen = false;
          this.ui?.setState({ isOpen: false });
        } else {
          // For fullpage, just minimize
          this.state.isMinimized = true;
          this.ui?.setState({ isMinimized: true });
        }
      }

      // Wait a bit for UI to update
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Capture screenshot with the selected mode
      const blob = await screenshotCapture.capture({
        mode,
        quality: 1, // Canvas render quality
        maxWidth: 1920,
        maxHeight: 1080,
        format: 'webp', // Use WebP for better compression
        compressionQuality: 0.85, // 85% quality for WebP
      });

      if (blob) {
        // Add to media manager with mode info
        const attachment = await mediaManager.addScreenshot(blob, mode);

        // Update UI to show attachment
        this.ui?.emit('attachment-added', attachment);

        // Show success notification
        this.ui?.showNotification(
          'success',
          'Screenshot captured!',
          `${mode === 'fullpage' ? 'Full page' : 'Selected area'} captured successfully`
        );

        this.log('Screenshot captured successfully', attachment);
      }

      // Restore widget state
      if (wasOpen) {
        this.state.isOpen = true;
        this.state.isMinimized = false;
        this.ui?.setState({ isOpen: true, isMinimized: false });
      }
    } catch (error) {
      this.handleError(error as Error);

      // Make sure to restore widget state on error
      this.state.isOpen = true;
      this.state.isMinimized = false;
      this.ui?.setState({ isOpen: true, isMinimized: false });
    }
  }

  private async startRecording(): Promise<void> {
    this.log('Voice recording requested');

    try {
      const attachment = await mediaManager.captureVoice();

      // Update UI to show attachment
      this.ui?.emit('attachment-added', attachment);

      this.log('Voice recording captured successfully', attachment);
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  private handleError(error: Error): void {
    this.state.error = error.message;
    this.ui?.setState({ error: error.message });

    // Show error notification
    this.ui?.showNotification(
      'error',
      'Error',
      error.message || 'Something went wrong. Please try again.'
    );

    this.config.onError(error);
    console.error('[VibeQA]', error);
  }

  private log(...args: any[]): void {
    if (this.config.debug) {
      console.log('[VibeQA]', ...args);
    }
  }
}

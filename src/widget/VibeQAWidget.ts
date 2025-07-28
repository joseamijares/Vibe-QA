import { VibeQAWidgetConfig, WidgetState, WidgetAPI, FeedbackSubmission } from './types';
import { createWidgetContainer } from './components/WidgetContainer';
import { detectBrowserInfo, detectDeviceInfo } from './utils/deviceDetection';
import { validateProjectKey } from './utils/validation';
import { WIDGET_STYLES } from './styles/widgetStyles';

export class VibeQAWidget implements WidgetAPI {
  private config: Required<VibeQAWidgetConfig>;
  private state: WidgetState;
  private container: HTMLElement | null = null;
  private shadowRoot: ShadowRoot | null = null;
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
      this.attachEventListeners();
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

    // Create widget content
    const widgetContent = createWidgetContainer(this.config, this.state);
    this.shadowRoot.appendChild(widgetContent);

    // Append to body
    document.body.appendChild(this.container);
  }

  private attachEventListeners(): void {
    if (!this.shadowRoot) return;

    // Trigger button click
    const triggerBtn = this.shadowRoot.querySelector('[data-vibeqa-trigger]');
    if (triggerBtn) {
      triggerBtn.addEventListener('click', () => this.toggle());
    }

    // Close button click
    const closeBtn = this.shadowRoot.querySelector('[data-vibeqa-close]');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }

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
    this.updateUI();
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
    this.updateUI();
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
      this.updateUI();

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

      // Send to API
      const response = await fetch(`${this.config.apiUrl}/api/widget/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Project-Key': this.config.projectKey,
        },
        body: JSON.stringify(submission),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit feedback');
      }

      const result = await response.json();
      
      this.state.currentStep = 'success';
      this.updateUI();
      this.config.onSuccess(result.id);

      // Auto-close after success
      setTimeout(() => this.close(), 3000);
    } catch (error) {
      this.handleError(error as Error);
    } finally {
      this.state.isLoading = false;
      this.updateUI();
    }
  }

  public destroy(): void {
    if (this.container) {
      this.container.remove();
      this.container = null;
      this.shadowRoot = null;
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

  private updateUI(): void {
    if (!this.shadowRoot) return;

    // Update widget UI based on current state
    const widget = this.shadowRoot.querySelector('[data-vibeqa-widget]');
    if (widget) {
      widget.setAttribute('data-open', this.state.isOpen.toString());
      widget.setAttribute('data-loading', this.state.isLoading.toString());
      widget.setAttribute('data-step', this.state.currentStep);
    }
  }

  private handleError(error: Error): void {
    this.state.error = error.message;
    this.updateUI();
    this.config.onError(error);
    console.error('[VibeQA]', error);
  }

  private log(...args: any[]): void {
    if (this.config.debug) {
      console.log('[VibeQA]', ...args);
    }
  }
}
import { VibeQAWidgetConfig, WidgetState, FeedbackSubmission } from '../types';
import { EventEmitter } from '../utils/EventEmitter';
import { validateEmail } from '../utils/validation';
import { createWidgetContainer } from './WidgetContainer';
import { mediaManager } from '../utils/mediaManager';

export class WidgetUI extends EventEmitter {
  private config: Required<VibeQAWidgetConfig>;
  private state: WidgetState;
  private shadowRoot: ShadowRoot | null = null;
  private formData: Partial<FeedbackSubmission> = {};
  private screenshotMode: 'fullpage' | 'area' = 'fullpage';
  private dropdownOpen = false;

  constructor(config: Required<VibeQAWidgetConfig>, state: WidgetState) {
    super();
    this.config = config;
    this.state = state;
    this.state.attachments = [];
    this.initializeAutoSave();
    this.setupAttachmentListeners();
  }

  render(_container: HTMLElement, shadowRoot: ShadowRoot): void {
    this.shadowRoot = shadowRoot;
    this.updateUI();
  }

  updateUI(): void {
    if (!this.shadowRoot) return;

    // Clear existing content
    const existingWidget = this.shadowRoot.querySelector('.vibeqa-widget');
    if (existingWidget) {
      existingWidget.remove();
    }

    // Create new widget content
    const widgetContent = createWidgetContainer(this.config, this.state);
    this.shadowRoot.appendChild(widgetContent);

    // Attach event listeners
    this.attachEventListeners();
  }

  private attachEventListeners(): void {
    if (!this.shadowRoot) return;

    // Trigger button
    const triggerBtn = this.shadowRoot.querySelector('[data-vibeqa-trigger]');
    if (triggerBtn) {
      triggerBtn.addEventListener('click', () => this.emit('toggle'));
    }

    // Close button
    const closeBtn = this.shadowRoot.querySelector('[data-vibeqa-close]');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.emit('close'));
    }

    // Modal backdrop click
    const modal = this.shadowRoot.querySelector('.vibeqa-modal');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.emit('close');
        }
      });
    }

    // Handle step-specific listeners
    if (this.state.currentStep === 'type') {
      this.attachTypeListeners();
    } else if (this.state.currentStep === 'details') {
      this.attachFormListeners();
    }

    // Keyboard navigation
    this.attachKeyboardListeners();
  }

  private attachTypeListeners(): void {
    if (!this.shadowRoot) return;

    const typeButtons = this.shadowRoot.querySelectorAll('[data-type]');
    typeButtons.forEach((button) => {
      button.addEventListener('click', (e) => {
        const type = (e.currentTarget as HTMLElement).getAttribute('data-type') as any;
        this.state.feedbackType = type;
        this.formData.type = type;

        // Update UI to show selected state
        typeButtons.forEach((btn) => btn.setAttribute('data-selected', 'false'));
        (e.currentTarget as HTMLElement).setAttribute('data-selected', 'true');

        // Auto-advance to details after selection
        setTimeout(() => {
          this.state.currentStep = 'details';
          this.updateUI();
        }, 300);
      });
    });
  }

  private attachFormListeners(): void {
    if (!this.shadowRoot) return;

    const form = this.shadowRoot.querySelector('.vibeqa-form') as HTMLFormElement;
    if (!form) return;

    // Back button
    const backBtn = this.shadowRoot.querySelector('[data-vibeqa-back]');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        this.state.currentStep = 'type';
        this.updateUI();
      });
    }

    // Form inputs
    const titleInput = form.querySelector('input[name="title"]') as HTMLInputElement;
    const descriptionInput = form.querySelector(
      'textarea[name="description"]'
    ) as HTMLTextAreaElement;
    const emailInput = form.querySelector('input[name="email"]') as HTMLInputElement;

    // Restore form data
    if (titleInput) titleInput.value = this.formData.title || '';
    if (descriptionInput) descriptionInput.value = this.formData.description || '';
    if (emailInput) emailInput.value = this.formData.reporterEmail || this.config.user.email || '';

    // Save form data on change with debounced auto-save
    if (titleInput) {
      titleInput.addEventListener('input', (e) => {
        this.formData.title = (e.target as HTMLInputElement).value;
        this.debouncedAutoSave();
      });
    }

    if (descriptionInput) {
      descriptionInput.addEventListener('input', (e) => {
        this.formData.description = (e.target as HTMLTextAreaElement).value;
        this.debouncedAutoSave();
      });
    }

    if (emailInput) {
      emailInput.addEventListener('input', (e) => {
        this.formData.reporterEmail = (e.target as HTMLInputElement).value;
        this.debouncedAutoSave();
      });
    }

    // Form submission
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (!this.validateForm()) {
        return;
      }

      // Prepare submission data with attachments
      const attachments = mediaManager.getAttachments();
      const submission: Partial<FeedbackSubmission> = {
        ...this.formData,
        reporterName: this.formData.reporterName || this.config.user.name,
        attachments:
          attachments.length > 0
            ? {
                screenshots: attachments.filter((a) => a.type === 'screenshot').map((a) => a.blob),
                recordings: attachments.filter((a) => a.type === 'voice').map((a) => a.blob),
              }
            : undefined,
      };

      // Clear saved data and attachments on successful submission
      this.clearSavedFormData();
      mediaManager.clearAttachments();
      this.emit('submit', submission);
    });

    // Screenshot button and dropdown
    const screenshotBtn = this.shadowRoot.querySelector('[data-vibeqa-screenshot]');
    const screenshotDropdown = this.shadowRoot.querySelector('.vibeqa-screenshot-dropdown');

    if (screenshotBtn && screenshotDropdown) {
      // Toggle dropdown on button click
      screenshotBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.dropdownOpen = !this.dropdownOpen;
        screenshotDropdown.setAttribute('data-open', this.dropdownOpen.toString());
      });

      // Handle screenshot mode selection
      const screenshotModes = this.shadowRoot.querySelectorAll('[data-screenshot-mode]');
      screenshotModes.forEach((modeEl) => {
        modeEl.addEventListener('click', (e) => {
          e.stopPropagation();
          const mode = (e.currentTarget as HTMLElement).getAttribute('data-screenshot-mode') as
            | 'fullpage'
            | 'area';
          this.screenshotMode = mode;
          this.dropdownOpen = false;
          screenshotDropdown.setAttribute('data-open', 'false');
          this.emit('screenshot', { mode });
        });
      });

      // Close dropdown when clicking outside
      document.addEventListener('click', () => {
        if (this.dropdownOpen) {
          this.dropdownOpen = false;
          screenshotDropdown.setAttribute('data-open', 'false');
        }
      });
    }

    const recordBtn = this.shadowRoot.querySelector('[data-vibeqa-record]');
    if (recordBtn) {
      recordBtn.addEventListener('click', () => {
        this.emit('record');
      });
    }

    // Attachment removal listeners are attached separately
    this.attachAttachmentListeners();
  }

  private attachAttachmentListeners(): void {
    if (!this.shadowRoot) return;

    // Attachment removal buttons
    const removeButtons = this.shadowRoot.querySelectorAll('[data-attachment-remove]');
    removeButtons.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const filename = (e.currentTarget as HTMLElement).getAttribute('data-attachment-remove');
        if (filename) {
          this.emit('attachment-removed', filename);
        }
      });
    });
  }

  private attachKeyboardListeners(): void {
    if (!this.shadowRoot) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // ESC to close
      if (e.key === 'Escape' && this.state.isOpen) {
        this.emit('close');
      }

      // Tab navigation
      if (e.key === 'Tab' && this.state.isOpen) {
        this.handleTabNavigation(e);
      }

      // Enter to submit (when in textarea, require Ctrl/Cmd)
      if (e.key === 'Enter' && this.state.currentStep === 'details') {
        const target = e.target as HTMLElement;
        if (target.tagName === 'TEXTAREA' && !(e.ctrlKey || e.metaKey)) {
          return;
        }
        if (target.tagName === 'BUTTON' && target.getAttribute('type') === 'submit') {
          return;
        }
        const form = this.shadowRoot?.querySelector('.vibeqa-form') as HTMLFormElement;
        if (form) {
          form.requestSubmit();
        }
      }
    };

    // Add listener to shadow root
    this.shadowRoot.addEventListener('keydown', handleKeyDown as EventListener);
  }

  private handleTabNavigation(e: KeyboardEvent): void {
    if (!this.shadowRoot) return;

    // Only handle tab navigation when modal is open
    const modal = this.shadowRoot.querySelector('.vibeqa-modal');
    if (!modal || modal.getAttribute('data-open') !== 'true') return;

    const focusableElements = this.shadowRoot.querySelectorAll(
      'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );

    const focusableArray = Array.from(focusableElements) as HTMLElement[];

    // Filter only visible elements
    const visibleFocusable = focusableArray.filter((el) => {
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 && el.offsetParent !== null;
    });

    if (visibleFocusable.length === 0) return;

    const currentIndex = visibleFocusable.indexOf(this.shadowRoot.activeElement as HTMLElement);

    if (e.shiftKey) {
      // Backward navigation
      const nextIndex = currentIndex <= 0 ? visibleFocusable.length - 1 : currentIndex - 1;
      visibleFocusable[nextIndex]?.focus();
      e.preventDefault();
    } else {
      // Forward navigation
      const nextIndex = currentIndex >= visibleFocusable.length - 1 ? 0 : currentIndex + 1;
      visibleFocusable[nextIndex]?.focus();
      e.preventDefault();
    }
  }

  private validateForm(): boolean {
    if (!this.shadowRoot) return false;

    const errors: string[] = [];
    const form = this.shadowRoot.querySelector('.vibeqa-form') as HTMLFormElement;
    if (!form) return false;

    // Clear previous errors
    const errorElements = form.querySelectorAll('.vibeqa-error');
    errorElements.forEach((el) => el.remove());

    // Validate description (required)
    if (!this.formData.description || this.formData.description.trim().length < 10) {
      errors.push('description');
      this.showFieldError('description', 'Please provide at least 10 characters');
    }

    // Validate email if provided
    if (this.formData.reporterEmail && !validateEmail(this.formData.reporterEmail)) {
      errors.push('email');
      this.showFieldError('email', 'Please enter a valid email address');
    }

    return errors.length === 0;
  }

  private showFieldError(fieldName: string, message: string): void {
    if (!this.shadowRoot) return;

    const field = this.shadowRoot.querySelector(`[name="${fieldName}"]`);
    if (!field) return;

    const errorEl = document.createElement('div');
    errorEl.className = 'vibeqa-error';
    errorEl.textContent = message;
    errorEl.style.color = '#dc2626';
    errorEl.style.fontSize = '12px';
    errorEl.style.marginTop = '4px';

    field.parentElement?.appendChild(errorEl);
    field.classList.add('error');
  }

  setState(newState: Partial<WidgetState>): void {
    const previousOpen = this.state.isOpen;
    this.state = { ...this.state, ...newState };
    this.updateUI();

    // Handle focus management for accessibility
    if (newState.isOpen !== undefined && newState.isOpen !== previousOpen) {
      if (newState.isOpen) {
        this.handleModalOpen();
      } else {
        this.handleModalClose();
      }
    }
  }

  private handleModalOpen(): void {
    if (!this.shadowRoot) return;

    // Store current focus
    this.previousFocus = document.activeElement as HTMLElement;

    // Focus first focusable element in modal
    setTimeout(() => {
      const firstFocusable = this.shadowRoot?.querySelector(
        'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      ) as HTMLElement;
      firstFocusable?.focus();
    }, 100);
  }

  private handleModalClose(): void {
    // Restore previous focus
    if (this.previousFocus && this.previousFocus.focus) {
      this.previousFocus.focus();
    }
  }

  private previousFocus: HTMLElement | null = null;
  private autoSaveTimer: NodeJS.Timeout | null = null;

  private initializeAutoSave(): void {
    // Load saved form data from sessionStorage
    const savedData = sessionStorage.getItem('vibeqa-form-data');
    if (savedData) {
      try {
        this.formData = JSON.parse(savedData);
      } catch (e) {
        console.error('[VibeQA] Failed to parse saved form data');
      }
    }
  }

  private saveFormData(): void {
    // Save form data to sessionStorage
    try {
      sessionStorage.setItem('vibeqa-form-data', JSON.stringify(this.formData));
    } catch (e) {
      console.error('[VibeQA] Failed to save form data');
    }
  }

  private clearSavedFormData(): void {
    sessionStorage.removeItem('vibeqa-form-data');
    this.formData = {};
  }

  private debouncedAutoSave(): void {
    // Clear existing timer
    if (this.autoSaveTimer) {
      clearTimeout(this.autoSaveTimer);
    }

    // Set new timer for auto-save (500ms delay)
    this.autoSaveTimer = setTimeout(() => {
      this.saveFormData();
    }, 500);
  }

  private setupAttachmentListeners(): void {
    // Listen for attachment additions
    this.on('attachment-added', () => {
      this.state.attachments = mediaManager.getAttachments();
      this.updateUI();
      this.attachAttachmentListeners();
    });

    // Listen for attachment removals
    this.on('attachment-removed', (filename: string) => {
      mediaManager.removeAttachment(filename);
      this.state.attachments = mediaManager.getAttachments();
      this.updateUI();
      this.attachAttachmentListeners();
    });
  }

  getState(): WidgetState {
    return this.state;
  }

  getScreenshotMode(): 'fullpage' | 'area' {
    return this.screenshotMode;
  }

  showNotification(type: 'success' | 'error', title: string, message?: string): void {
    if (!this.shadowRoot) return;

    // Remove any existing notifications
    const existingNotification = this.shadowRoot.querySelector('.vibeqa-notification');
    if (existingNotification) {
      existingNotification.remove();
    }

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `vibeqa-notification ${type}`;

    notification.innerHTML = `
      <svg class="vibeqa-notification-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        ${
          type === 'success'
            ? '<path d="M20 6L9 17l-5-5" stroke-linecap="round" stroke-linejoin="round"/>'
            : '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>'
        }
      </svg>
      <div class="vibeqa-notification-content">
        <div class="vibeqa-notification-title">${this.escapeHtml(title)}</div>
        ${message ? `<div class="vibeqa-notification-message">${this.escapeHtml(message)}</div>` : ''}
      </div>
      <button class="vibeqa-notification-close" aria-label="Close notification">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    `;

    // Add to shadow root
    this.shadowRoot.appendChild(notification);

    // Show notification with animation
    requestAnimationFrame(() => {
      notification.classList.add('show');
    });

    // Handle close button
    const closeBtn = notification.querySelector('.vibeqa-notification-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.hideNotification(notification);
      });
    }

    // Auto-hide after 5 seconds
    setTimeout(() => {
      this.hideNotification(notification);
    }, 5000);
  }

  private hideNotification(notification: HTMLElement): void {
    notification.classList.remove('show');
    setTimeout(() => {
      notification.remove();
    }, 300);
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  destroy(): void {
    this.removeAllListeners();
    if (this.autoSaveTimer) {
      clearTimeout(this.autoSaveTimer);
    }
    this.shadowRoot = null;
    this.formData = {};
  }
}

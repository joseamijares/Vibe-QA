export const WIDGET_STYLES = `
  /* Reset and base styles */
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  /* CSS Variables for theming */
  :host {
    /* Vibe color palette */
    --vibeqa-primary: #094765;
    --vibeqa-primary-hover: #156c8b;
    --vibeqa-primary-light: #3387a7;
    --vibeqa-primary-pale: #66a5bd;
    --vibeqa-accent: #ff6b35;
    --vibeqa-accent-hover: #e85d2f;
    --vibeqa-accent-light: #ffb39a;
    
    /* Base colors */
    --vibeqa-bg: #ffffff;
    --vibeqa-bg-secondary: #f8fafc;
    --vibeqa-text: #1a1a1a;
    --vibeqa-text-secondary: #64748b;
    --vibeqa-border: #e2e8f0;
    --vibeqa-border-light: rgba(9, 71, 101, 0.1);
    
    /* Effects */
    --vibeqa-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
    --vibeqa-shadow-lg: 0 10px 40px rgba(0, 0, 0, 0.08);
    --vibeqa-radius: 12px;
    --vibeqa-transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    
    /* Glass effect */
    --vibeqa-glass-bg: rgba(255, 255, 255, 0.8);
    --vibeqa-glass-border: rgba(255, 255, 255, 0.3);
    --vibeqa-blur: blur(10px);
  }

  /* Dark theme */
  :host([data-theme="dark"]) {
    --vibeqa-primary: #3387a7;
    --vibeqa-primary-hover: #66a5bd;
    --vibeqa-primary-light: #a3cddd;
    --vibeqa-bg: #0f172a;
    --vibeqa-bg-secondary: #1e293b;
    --vibeqa-text: #f1f5f9;
    --vibeqa-text-secondary: #94a3b8;
    --vibeqa-border: #334155;
    --vibeqa-border-light: rgba(51, 135, 167, 0.2);
    --vibeqa-glass-bg: rgba(15, 23, 42, 0.8);
    --vibeqa-glass-border: rgba(51, 135, 167, 0.2);
  }

  /* Widget container */
  .vibeqa-widget {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    font-size: 14px;
    line-height: 1.5;
    color: var(--vibeqa-text);
  }

  /* Trigger button with modern styling */
  .vibeqa-trigger {
    background: linear-gradient(135deg, var(--vibeqa-primary) 0%, var(--vibeqa-primary-hover) 100%);
    color: white;
    border: none;
    border-radius: 24px;
    padding: 12px 24px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: var(--vibeqa-shadow);
    transition: var(--vibeqa-transition);
    display: flex;
    align-items: center;
    gap: 8px;
    position: relative;
    overflow: hidden;
  }

  .vibeqa-trigger::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    transform: translate(-50%, -50%);
    transition: width 0.6s, height 0.6s;
  }

  .vibeqa-trigger:hover::before {
    width: 300px;
    height: 300px;
  }

  .vibeqa-trigger:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 32px rgba(9, 71, 101, 0.25);
  }

  .vibeqa-trigger:active {
    transform: translateY(0);
  }

  .vibeqa-trigger-icon {
    width: 20px;
    height: 20px;
  }

  /* Main modal with glassmorphism */
  .vibeqa-modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    visibility: hidden;
    transition: var(--vibeqa-transition);
    z-index: 999999;
  }

  .vibeqa-modal[data-open="true"] {
    opacity: 1;
    visibility: visible;
  }

  .vibeqa-modal-content {
    background: var(--vibeqa-glass-bg);
    backdrop-filter: var(--vibeqa-blur) saturate(180%);
    -webkit-backdrop-filter: var(--vibeqa-blur) saturate(180%);
    border: 1px solid var(--vibeqa-glass-border);
    border-radius: var(--vibeqa-radius);
    width: 90%;
    max-width: 500px;
    max-height: 90vh;
    overflow: hidden;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15);
    transform: scale(0.95) translateY(20px);
    transition: var(--vibeqa-transition);
    position: relative;
  }

  .vibeqa-modal-content::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, var(--vibeqa-primary), var(--vibeqa-primary-light), var(--vibeqa-accent));
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  .vibeqa-modal[data-open="true"] .vibeqa-modal-content {
    transform: scale(1) translateY(0);
  }

  .vibeqa-modal[data-open="true"] .vibeqa-modal-content::before {
    opacity: 1;
  }

  /* Modal header with gradient accent */
  .vibeqa-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px;
    border-bottom: 1px solid var(--vibeqa-border-light);
    background: linear-gradient(180deg, var(--vibeqa-bg-secondary) 0%, transparent 100%);
  }

  .vibeqa-header-title {
    font-size: 18px;
    font-weight: 700;
    background: linear-gradient(135deg, var(--vibeqa-primary) 0%, var(--vibeqa-primary-light) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .vibeqa-close {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid var(--vibeqa-border-light);
    width: 32px;
    height: 32px;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: var(--vibeqa-transition);
  }

  .vibeqa-close:hover {
    background: rgba(255, 107, 53, 0.1);
    border-color: var(--vibeqa-accent);
    color: var(--vibeqa-accent);
  }

  /* Modal body */
  .vibeqa-body {
    padding: 20px;
    overflow-y: auto;
    max-height: calc(90vh - 140px);
  }

  /* Minimized state */
  .vibeqa-modal[data-minimized="true"] .vibeqa-modal-content {
    transform: scale(0);
    opacity: 0;
  }

  /* Feedback type selector with modern cards */
  .vibeqa-type-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    margin-bottom: 20px;
    animation: vibeqa-fade-in 0.4s ease;
  }

  .vibeqa-type-button {
    background: var(--vibeqa-glass-bg);
    backdrop-filter: blur(8px);
    border: 1px solid var(--vibeqa-border-light);
    border-radius: 12px;
    padding: 16px;
    cursor: pointer;
    transition: var(--vibeqa-transition);
    text-align: center;
    position: relative;
    overflow: hidden;
  }

  .vibeqa-type-button::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, var(--vibeqa-primary), var(--vibeqa-accent));
    transform: translateX(-100%);
    transition: transform 0.3s ease;
  }

  .vibeqa-type-button:hover {
    border-color: var(--vibeqa-primary-light);
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(9, 71, 101, 0.15);
  }

  .vibeqa-type-button:hover::before {
    transform: translateX(0);
  }

  .vibeqa-type-button[data-selected="true"] {
    background: linear-gradient(135deg, rgba(9, 71, 101, 0.1), rgba(51, 135, 167, 0.05));
    border-color: var(--vibeqa-primary);
    box-shadow: 0 4px 16px rgba(9, 71, 101, 0.2);
    animation: vibeqa-pulse 0.4s ease;
  }

  @keyframes vibeqa-pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.05); }
    100% { transform: scale(1); }
  }

  .vibeqa-type-icon {
    width: 32px;
    height: 32px;
    margin: 0 auto 8px;
  }

  .vibeqa-type-label {
    font-weight: 500;
    color: var(--vibeqa-text);
  }

  /* Form elements with glass effect */
  .vibeqa-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .vibeqa-field {
    display: flex;
    flex-direction: column;
    gap: 8px;
    animation: vibeqa-slide-up 0.3s ease;
  }

  .vibeqa-label {
    font-weight: 600;
    font-size: 13px;
    color: var(--vibeqa-text);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .vibeqa-input,
  .vibeqa-textarea {
    background: rgba(255, 255, 255, 0.5);
    backdrop-filter: blur(10px);
    border: 1px solid var(--vibeqa-border-light);
    border-radius: 10px;
    padding: 12px 16px;
    font-size: 14px;
    color: var(--vibeqa-text);
    transition: var(--vibeqa-transition);
  }

  .vibeqa-input:focus,
  .vibeqa-textarea:focus {
    outline: none;
    background: rgba(255, 255, 255, 0.8);
    border-color: var(--vibeqa-primary-light);
    box-shadow: 0 0 0 3px rgba(51, 135, 167, 0.15), 0 4px 12px rgba(0, 0, 0, 0.05);
  }

  .vibeqa-input::placeholder,
  .vibeqa-textarea::placeholder {
    color: var(--vibeqa-text-secondary);
    opacity: 0.8;
  }

  .vibeqa-input.error,
  .vibeqa-textarea.error {
    border-color: #dc2626;
  }

  .vibeqa-textarea {
    resize: vertical;
    min-height: 100px;
  }

  .vibeqa-error {
    color: #dc2626;
    font-size: 12px;
    margin-top: 4px;
  }

  /* Buttons with modern styling */
  .vibeqa-button {
    background: linear-gradient(135deg, var(--vibeqa-accent) 0%, var(--vibeqa-accent-hover) 100%);
    color: white;
    border: none;
    border-radius: 10px;
    padding: 12px 24px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: var(--vibeqa-transition);
    position: relative;
    overflow: hidden;
  }

  .vibeqa-button::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    transform: translate(-50%, -50%);
    transition: width 0.6s, height 0.6s;
  }

  .vibeqa-button:hover::before {
    width: 300px;
    height: 300px;
  }

  .vibeqa-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(255, 107, 53, 0.3);
  }

  .vibeqa-button:active {
    transform: translateY(0);
  }

  .vibeqa-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }

  .vibeqa-button-secondary {
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(10px);
    border: 1px solid var(--vibeqa-border-light);
    color: var(--vibeqa-primary);
    font-weight: 600;
  }

  .vibeqa-button-secondary:hover {
    background: rgba(255, 255, 255, 0.95);
    border-color: var(--vibeqa-primary);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(9, 71, 101, 0.1);
  }

  /* Loading state */
  .vibeqa-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px;
  }

  .vibeqa-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid var(--vibeqa-border);
    border-top-color: var(--vibeqa-primary);
    border-radius: 50%;
    animation: vibeqa-spin 0.8s linear infinite;
  }

  @keyframes vibeqa-spin {
    to { transform: rotate(360deg); }
  }

  @keyframes vibeqa-fade-in {
    from { 
      opacity: 0;
      transform: translateY(10px);
    }
    to { 
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes vibeqa-slide-up {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Area selection overlay styles */
  .vibeqa-selection-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.3);
    z-index: 999998;
    cursor: crosshair;
  }

  .vibeqa-selection-instructions {
    position: absolute;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: linear-gradient(135deg, var(--vibeqa-primary) 0%, var(--vibeqa-primary-hover) 100%);
    color: white;
    padding: 16px 32px;
    border-radius: 12px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    font-weight: 600;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
    z-index: 999999;
    animation: vibeqa-slide-down 0.3s ease;
  }

  @keyframes vibeqa-slide-down {
    from {
      opacity: 0;
      transform: translateX(-50%) translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  }

  .vibeqa-selection-box {
    position: absolute;
    border: 2px solid var(--vibeqa-accent);
    background: rgba(255, 107, 53, 0.1);
    pointer-events: none;
    transition: none;
  }

  .vibeqa-selection-dimensions {
    position: absolute;
    bottom: -24px;
    right: 0;
    background: var(--vibeqa-primary);
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;
    white-space: nowrap;
  }

  /* Focus styles for accessibility */
  button:focus-visible,
  input:focus-visible,
  textarea:focus-visible {
    outline: 2px solid var(--vibeqa-primary);
    outline-offset: 2px;
  }

  /* Error shake animation */
  @keyframes vibeqa-shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
    20%, 40%, 60%, 80% { transform: translateX(4px); }
  }

  .vibeqa-input.error,
  .vibeqa-textarea.error {
    animation: vibeqa-shake 0.5s ease-in-out;
  }

  /* Form field transitions */
  .vibeqa-field {
    animation: vibeqa-fade-in 0.3s ease;
  }

  /* Button hover effects */
  .vibeqa-button,
  .vibeqa-media-button {
    position: relative;
    overflow: hidden;
  }

  .vibeqa-button::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.3);
    transform: translate(-50%, -50%);
    transition: width 0.6s, height 0.6s;
  }

  .vibeqa-button:active::after {
    width: 300px;
    height: 300px;
  }

  /* Success state with celebration */
  .vibeqa-success {
    text-align: center;
    padding: 40px 20px;
    animation: vibeqa-slide-up 0.4s ease;
    position: relative;
  }

  .vibeqa-success-icon {
    width: 64px;
    height: 64px;
    margin: 0 auto 16px;
    background: linear-gradient(135deg, #10b981, #34d399);
    border-radius: 50%;
    padding: 16px;
    color: white;
    animation: vibeqa-scale-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .vibeqa-success-icon svg {
    width: 100%;
    height: 100%;
  }

  @keyframes vibeqa-scale-in {
    0% {
      transform: scale(0) rotate(-180deg);
      opacity: 0;
    }
    50% {
      transform: scale(1.2) rotate(10deg);
    }
    100% {
      transform: scale(1) rotate(0deg);
      opacity: 1;
    }
  }

  .vibeqa-success-title {
    font-size: 20px;
    font-weight: 600;
    margin-bottom: 8px;
  }

  .vibeqa-success-message {
    color: var(--vibeqa-text-secondary);
  }

  /* Media buttons */
  .vibeqa-media-buttons {
    display: flex;
    gap: 8px;
    margin-top: 12px;
  }

  /* Screenshot mode selector */
  .vibeqa-screenshot-modes {
    position: relative;
    display: inline-block;
  }

  .vibeqa-screenshot-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    margin-top: 4px;
    background: var(--vibeqa-glass-bg);
    backdrop-filter: var(--vibeqa-blur);
    border: 1px solid var(--vibeqa-border-light);
    border-radius: 8px;
    padding: 8px;
    min-width: 200px;
    box-shadow: var(--vibeqa-shadow-lg);
    opacity: 0;
    visibility: hidden;
    transform: translateY(-10px);
    transition: var(--vibeqa-transition);
    z-index: 10;
  }

  .vibeqa-screenshot-dropdown[data-open="true"] {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
  }

  .vibeqa-screenshot-mode {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    border-radius: 6px;
    cursor: pointer;
    transition: var(--vibeqa-transition);
    font-size: 13px;
  }

  .vibeqa-screenshot-mode:hover {
    background: rgba(9, 71, 101, 0.05);
  }

  .vibeqa-screenshot-mode-icon {
    width: 20px;
    height: 20px;
    color: var(--vibeqa-primary);
  }

  .vibeqa-screenshot-mode-text {
    flex: 1;
  }

  .vibeqa-screenshot-mode-title {
    font-weight: 600;
    color: var(--vibeqa-text);
  }

  .vibeqa-screenshot-mode-desc {
    font-size: 11px;
    color: var(--vibeqa-text-secondary);
    margin-top: 2px;
  }

  /* Attachments section */
  .vibeqa-attachments {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid var(--vibeqa-border);
  }

  .vibeqa-attachments-title {
    font-size: 13px;
    font-weight: 500;
    color: var(--vibeqa-text-secondary);
    margin-bottom: 12px;
  }

  .vibeqa-attachment-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .vibeqa-attachment-item {
    display: flex;
    align-items: center;
    gap: 8px;
    background: var(--vibeqa-bg);
    border: 1px solid var(--vibeqa-border);
    border-radius: 6px;
    padding: 6px 12px;
    font-size: 12px;
  }

  .vibeqa-attachment-preview {
    width: 40px;
    height: 40px;
    border-radius: 4px;
    object-fit: cover;
    background: var(--vibeqa-border);
  }

  .vibeqa-attachment-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .vibeqa-attachment-name {
    font-weight: 500;
    color: var(--vibeqa-text);
    max-width: 150px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .vibeqa-attachment-size {
    color: var(--vibeqa-text-secondary);
  }

  .vibeqa-attachment-remove {
    background: none;
    border: none;
    color: var(--vibeqa-text-secondary);
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    transition: var(--vibeqa-transition);
  }

  .vibeqa-attachment-remove:hover {
    background: var(--vibeqa-border);
    color: #dc2626;
  }

  .vibeqa-media-button {
    background: rgba(255, 255, 255, 0.5);
    backdrop-filter: blur(10px);
    border: 1px solid var(--vibeqa-border-light);
    border-radius: 10px;
    padding: 10px 16px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: var(--vibeqa-transition);
    position: relative;
  }

  .vibeqa-media-button:hover {
    background: rgba(255, 255, 255, 0.8);
    border-color: var(--vibeqa-primary);
    color: var(--vibeqa-primary);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(9, 71, 101, 0.1);
  }

  .vibeqa-media-button.has-dropdown::after {
    content: '▼';
    font-size: 10px;
    margin-left: 4px;
    opacity: 0.6;
  }

  .vibeqa-media-icon {
    width: 16px;
    height: 16px;
  }

  /* Notification Toast */
  .vibeqa-notification {
    position: fixed;
    top: 20px;
    right: 20px;
    background: var(--vibeqa-bg);
    border-radius: 8px;
    padding: 16px 20px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    display: flex;
    align-items: center;
    gap: 12px;
    max-width: 400px;
    z-index: 1000000;
    transform: translateX(400px);
    transition: transform 0.3s ease;
  }

  .vibeqa-notification.show {
    transform: translateX(0);
  }

  .vibeqa-notification.success {
    border-left: 4px solid #10b981;
  }

  .vibeqa-notification.error {
    border-left: 4px solid #dc2626;
  }

  .vibeqa-notification-icon {
    width: 24px;
    height: 24px;
    flex-shrink: 0;
  }

  .vibeqa-notification.success .vibeqa-notification-icon {
    color: #10b981;
  }

  .vibeqa-notification.error .vibeqa-notification-icon {
    color: #dc2626;
  }

  .vibeqa-notification-content {
    flex: 1;
  }

  .vibeqa-notification-title {
    font-weight: 600;
    color: var(--vibeqa-text);
    margin-bottom: 2px;
  }

  .vibeqa-notification-message {
    font-size: 13px;
    color: var(--vibeqa-text-secondary);
  }

  .vibeqa-notification-close {
    background: none;
    border: none;
    color: var(--vibeqa-text-secondary);
    cursor: pointer;
    padding: 4px;
    transition: color 0.2s;
  }

  .vibeqa-notification-close:hover {
    color: var(--vibeqa-text);
  }

  /* Recording UI */
  .vibeqa-recording-overlay {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: var(--vibeqa-bg);
    border-radius: 12px;
    padding: 32px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
    text-align: center;
    z-index: 1000001;
  }

  .vibeqa-recording-icon {
    width: 64px;
    height: 64px;
    margin: 0 auto 16px;
    color: #dc2626;
    animation: vibeqa-pulse-recording 1.5s ease-in-out infinite;
  }

  @keyframes vibeqa-pulse-recording {
    0%, 100% { transform: scale(1); opacity: 0.8; }
    50% { transform: scale(1.1); opacity: 1; }
  }

  .vibeqa-recording-title {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 8px;
  }

  .vibeqa-recording-timer {
    font-size: 24px;
    font-weight: 500;
    color: var(--vibeqa-primary);
    margin: 16px 0;
  }

  .vibeqa-recording-button {
    background: #dc2626;
    color: white;
    border: none;
    border-radius: 8px;
    padding: 10px 24px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s;
  }

  .vibeqa-recording-button:hover {
    background: #b91c1c;
  }

  /* Responsive adjustments */
  @media (max-width: 640px) {
    .vibeqa-modal-content {
      width: 100%;
      height: 100%;
      max-width: none;
      max-height: none;
      border-radius: 0;
    }

    .vibeqa-body {
      max-height: calc(100vh - 140px);
    }

    .vibeqa-notification {
      right: 10px;
      left: 10px;
      max-width: none;
    }
  }
`;

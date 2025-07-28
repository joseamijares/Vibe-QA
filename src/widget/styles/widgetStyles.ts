export const WIDGET_STYLES = `
  /* Reset and base styles */
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  /* CSS Variables for theming */
  :host {
    --vibeqa-primary: #094765;
    --vibeqa-primary-hover: #0a5580;
    --vibeqa-bg: #ffffff;
    --vibeqa-text: #1a1a1a;
    --vibeqa-text-secondary: #666666;
    --vibeqa-border: #e5e7eb;
    --vibeqa-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    --vibeqa-radius: 12px;
    --vibeqa-transition: all 0.3s ease;
  }

  /* Dark theme */
  :host([data-theme="dark"]) {
    --vibeqa-primary: #3b82f6;
    --vibeqa-primary-hover: #2563eb;
    --vibeqa-bg: #1f2937;
    --vibeqa-text: #f9fafb;
    --vibeqa-text-secondary: #9ca3af;
    --vibeqa-border: #374151;
  }

  /* Widget container */
  .vibeqa-widget {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    font-size: 14px;
    line-height: 1.5;
    color: var(--vibeqa-text);
  }

  /* Trigger button */
  .vibeqa-trigger {
    background: var(--vibeqa-primary);
    color: white;
    border: none;
    border-radius: 24px;
    padding: 12px 24px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    box-shadow: var(--vibeqa-shadow);
    transition: var(--vibeqa-transition);
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .vibeqa-trigger:hover {
    background: var(--vibeqa-primary-hover);
    transform: translateY(-2px);
    box-shadow: 0 15px 30px rgba(0, 0, 0, 0.15);
  }

  .vibeqa-trigger:active {
    transform: translateY(0);
  }

  .vibeqa-trigger-icon {
    width: 20px;
    height: 20px;
  }

  /* Main modal */
  .vibeqa-modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
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
    background: var(--vibeqa-bg);
    border-radius: var(--vibeqa-radius);
    width: 90%;
    max-width: 500px;
    max-height: 90vh;
    overflow: hidden;
    box-shadow: var(--vibeqa-shadow);
    transform: scale(0.9);
    transition: var(--vibeqa-transition);
  }

  .vibeqa-modal[data-open="true"] .vibeqa-modal-content {
    transform: scale(1);
  }

  /* Modal header */
  .vibeqa-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px;
    border-bottom: 1px solid var(--vibeqa-border);
  }

  .vibeqa-header-title {
    font-size: 18px;
    font-weight: 600;
    color: var(--vibeqa-text);
  }

  .vibeqa-close {
    background: none;
    border: none;
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
    background: var(--vibeqa-border);
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

  /* Feedback type selector */
  .vibeqa-type-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    margin-bottom: 20px;
    animation: vibeqa-fade-in 0.3s ease;
  }

  .vibeqa-type-button {
    background: var(--vibeqa-bg);
    border: 2px solid var(--vibeqa-border);
    border-radius: 8px;
    padding: 16px;
    cursor: pointer;
    transition: var(--vibeqa-transition);
    text-align: center;
  }

  .vibeqa-type-button:hover {
    border-color: var(--vibeqa-primary);
    transform: translateY(-2px);
  }

  .vibeqa-type-button[data-selected="true"] {
    border-color: var(--vibeqa-primary);
    background: rgba(9, 71, 101, 0.05);
    animation: vibeqa-pulse 0.3s ease;
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

  /* Form elements */
  .vibeqa-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .vibeqa-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .vibeqa-label {
    font-weight: 500;
    color: var(--vibeqa-text);
  }

  .vibeqa-input,
  .vibeqa-textarea {
    background: var(--vibeqa-bg);
    border: 1px solid var(--vibeqa-border);
    border-radius: 8px;
    padding: 10px 12px;
    font-size: 14px;
    color: var(--vibeqa-text);
    transition: var(--vibeqa-transition);
  }

  .vibeqa-input:focus,
  .vibeqa-textarea:focus {
    outline: none;
    border-color: var(--vibeqa-primary);
    box-shadow: 0 0 0 3px rgba(9, 71, 101, 0.1);
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

  /* Buttons */
  .vibeqa-button {
    background: var(--vibeqa-primary);
    color: white;
    border: none;
    border-radius: 8px;
    padding: 10px 20px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: var(--vibeqa-transition);
  }

  .vibeqa-button:hover {
    background: var(--vibeqa-primary-hover);
  }

  .vibeqa-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .vibeqa-button-secondary {
    background: var(--vibeqa-border);
    color: var(--vibeqa-text);
  }

  .vibeqa-button-secondary:hover {
    background: #d1d5db;
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

  /* Success state */
  .vibeqa-success {
    text-align: center;
    padding: 40px 20px;
    animation: vibeqa-slide-up 0.4s ease;
  }

  .vibeqa-success-icon {
    width: 64px;
    height: 64px;
    margin: 0 auto 16px;
    color: #10b981;
    animation: vibeqa-scale-in 0.5s ease;
  }

  @keyframes vibeqa-scale-in {
    0% {
      transform: scale(0);
      opacity: 0;
    }
    50% {
      transform: scale(1.1);
    }
    100% {
      transform: scale(1);
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
    background: var(--vibeqa-bg);
    border: 1px solid var(--vibeqa-border);
    border-radius: 8px;
    padding: 8px 16px;
    font-size: 13px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: var(--vibeqa-transition);
  }

  .vibeqa-media-button:hover {
    border-color: var(--vibeqa-primary);
    color: var(--vibeqa-primary);
  }

  .vibeqa-media-icon {
    width: 16px;
    height: 16px;
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
  }
`;

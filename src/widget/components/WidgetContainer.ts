import { VibeQAWidgetConfig, WidgetState } from '../types';

export function createWidgetContainer(config: Required<VibeQAWidgetConfig>, state: WidgetState): HTMLElement {
  const container = document.createElement('div');
  container.className = 'vibeqa-widget';
  container.setAttribute('data-vibeqa-widget', 'true');
  container.setAttribute('data-theme', getTheme(config.theme));

  // Create trigger button
  if (config.triggerType === 'button' || config.triggerType === 'both') {
    const trigger = createTriggerButton(config);
    container.appendChild(trigger);
  }

  // Create modal
  const modal = createModal(config, state);
  container.appendChild(modal);

  return container;
}

function getTheme(theme: 'light' | 'dark' | 'auto'): string {
  if (theme === 'auto') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return theme;
}

function createTriggerButton(config: Required<VibeQAWidgetConfig>): HTMLElement {
  const button = document.createElement('button');
  button.className = 'vibeqa-trigger';
  button.setAttribute('data-vibeqa-trigger', 'true');
  button.setAttribute('aria-label', 'Open feedback widget');

  // Add icon
  const icon = document.createElement('span');
  icon.className = 'vibeqa-trigger-icon';
  icon.innerHTML = getFeedbackIcon();
  button.appendChild(icon);

  // Add text
  const text = document.createElement('span');
  text.textContent = config.buttonText;
  button.appendChild(text);

  return button;
}

function createModal(config: Required<VibeQAWidgetConfig>, state: WidgetState): HTMLElement {
  const modal = document.createElement('div');
  modal.className = 'vibeqa-modal';
  modal.setAttribute('data-open', state.isOpen.toString());
  modal.setAttribute('data-loading', state.isLoading.toString());
  modal.setAttribute('data-step', state.currentStep);

  const modalContent = document.createElement('div');
  modalContent.className = 'vibeqa-modal-content';

  // Header
  const header = createHeader();
  modalContent.appendChild(header);

  // Body
  const body = document.createElement('div');
  body.className = 'vibeqa-body';

  // Add content based on current step
  if (state.isLoading) {
    body.appendChild(createLoadingState());
  } else if (state.currentStep === 'success') {
    body.appendChild(createSuccessState());
  } else if (state.currentStep === 'type') {
    body.appendChild(createTypeSelector());
  } else if (state.currentStep === 'details') {
    body.appendChild(createDetailsForm(config));
  }

  modalContent.appendChild(body);
  modal.appendChild(modalContent);

  return modal;
}

function createHeader(): HTMLElement {
  const header = document.createElement('div');
  header.className = 'vibeqa-header';

  const title = document.createElement('h3');
  title.className = 'vibeqa-header-title';
  title.textContent = 'Send Feedback';
  header.appendChild(title);

  const closeButton = document.createElement('button');
  closeButton.className = 'vibeqa-close';
  closeButton.setAttribute('data-vibeqa-close', 'true');
  closeButton.setAttribute('aria-label', 'Close feedback widget');
  closeButton.innerHTML = getCloseIcon();
  header.appendChild(closeButton);

  return header;
}

function createTypeSelector(): HTMLElement {
  const container = document.createElement('div');
  
  const title = document.createElement('p');
  title.style.marginBottom = '16px';
  title.style.color = 'var(--vibeqa-text-secondary)';
  title.textContent = 'What type of feedback do you have?';
  container.appendChild(title);

  const grid = document.createElement('div');
  grid.className = 'vibeqa-type-grid';

  const types = [
    { value: 'bug', label: 'Bug', icon: getBugIcon() },
    { value: 'suggestion', label: 'Suggestion', icon: getSuggestionIcon() },
    { value: 'praise', label: 'Praise', icon: getPraiseIcon() },
    { value: 'other', label: 'Other', icon: getOtherIcon() },
  ];

  types.forEach(type => {
    const button = document.createElement('button');
    button.className = 'vibeqa-type-button';
    button.setAttribute('data-type', type.value);
    button.setAttribute('data-selected', 'false');

    const icon = document.createElement('div');
    icon.className = 'vibeqa-type-icon';
    icon.innerHTML = type.icon;
    button.appendChild(icon);

    const label = document.createElement('div');
    label.className = 'vibeqa-type-label';
    label.textContent = type.label;
    button.appendChild(label);

    grid.appendChild(button);
  });

  container.appendChild(grid);
  return container;
}

function createDetailsForm(config: Required<VibeQAWidgetConfig>): HTMLElement {
  const form = document.createElement('form');
  form.className = 'vibeqa-form';

  // Title field (optional)
  const titleField = document.createElement('div');
  titleField.className = 'vibeqa-field';
  
  const titleLabel = document.createElement('label');
  titleLabel.className = 'vibeqa-label';
  titleLabel.textContent = 'Title (optional)';
  titleField.appendChild(titleLabel);

  const titleInput = document.createElement('input');
  titleInput.className = 'vibeqa-input';
  titleInput.type = 'text';
  titleInput.placeholder = 'Brief summary of your feedback';
  titleField.appendChild(titleInput);

  form.appendChild(titleField);

  // Description field
  const descField = document.createElement('div');
  descField.className = 'vibeqa-field';
  
  const descLabel = document.createElement('label');
  descLabel.className = 'vibeqa-label';
  descLabel.textContent = 'Description';
  descField.appendChild(descLabel);

  const descTextarea = document.createElement('textarea');
  descTextarea.className = 'vibeqa-textarea';
  descTextarea.placeholder = 'Please describe your feedback in detail...';
  descTextarea.required = true;
  descField.appendChild(descTextarea);

  form.appendChild(descField);

  // Email field (if not provided in config)
  if (!config.user.email) {
    const emailField = document.createElement('div');
    emailField.className = 'vibeqa-field';
    
    const emailLabel = document.createElement('label');
    emailLabel.className = 'vibeqa-label';
    emailLabel.textContent = 'Email (optional)';
    emailField.appendChild(emailLabel);

    const emailInput = document.createElement('input');
    emailInput.className = 'vibeqa-input';
    emailInput.type = 'email';
    emailInput.placeholder = 'your@email.com';
    emailField.appendChild(emailInput);

    form.appendChild(emailField);
  }

  // Media buttons
  const mediaButtons = document.createElement('div');
  mediaButtons.className = 'vibeqa-media-buttons';

  const screenshotBtn = document.createElement('button');
  screenshotBtn.className = 'vibeqa-media-button';
  screenshotBtn.type = 'button';
  screenshotBtn.innerHTML = `<span class="vibeqa-media-icon">${getCameraIcon()}</span> Screenshot`;
  mediaButtons.appendChild(screenshotBtn);

  const recordBtn = document.createElement('button');
  recordBtn.className = 'vibeqa-media-button';
  recordBtn.type = 'button';
  recordBtn.innerHTML = `<span class="vibeqa-media-icon">${getMicIcon()}</span> Record`;
  mediaButtons.appendChild(recordBtn);

  form.appendChild(mediaButtons);

  // Submit button
  const submitBtn = document.createElement('button');
  submitBtn.className = 'vibeqa-button';
  submitBtn.type = 'submit';
  submitBtn.textContent = 'Send Feedback';
  submitBtn.style.marginTop = '20px';
  form.appendChild(submitBtn);

  return form;
}

function createLoadingState(): HTMLElement {
  const container = document.createElement('div');
  container.className = 'vibeqa-loading';
  
  const spinner = document.createElement('div');
  spinner.className = 'vibeqa-spinner';
  container.appendChild(spinner);
  
  return container;
}

function createSuccessState(): HTMLElement {
  const container = document.createElement('div');
  container.className = 'vibeqa-success';
  
  const icon = document.createElement('div');
  icon.className = 'vibeqa-success-icon';
  icon.innerHTML = getCheckIcon();
  container.appendChild(icon);
  
  const title = document.createElement('h3');
  title.className = 'vibeqa-success-title';
  title.textContent = 'Thank you!';
  container.appendChild(title);
  
  const message = document.createElement('p');
  message.className = 'vibeqa-success-message';
  message.textContent = 'Your feedback has been submitted successfully.';
  container.appendChild(message);
  
  return container;
}

// SVG Icons
function getFeedbackIcon(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
  </svg>`;
}

function getCloseIcon(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
  </svg>`;
}

function getBugIcon(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>`;
}

function getSuggestionIcon(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>`;
}

function getPraiseIcon(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  </svg>`;
}

function getOtherIcon(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
  </svg>`;
}

function getCameraIcon(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>`;
}

function getMicIcon(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
  </svg>`;
}

function getCheckIcon(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>`;
}
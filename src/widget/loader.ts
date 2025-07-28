/**
 * VibeQA Widget Loader
 * This script is loaded by websites to initialize the feedback widget
 */

import { VibeQAWidget } from './VibeQAWidget';
import { VibeQAWidgetConfig } from './types';

declare global {
  interface Window {
    VibeQA?: {
      init: (config: VibeQAWidgetConfig) => VibeQAWidget;
      widget?: VibeQAWidget;
    };
    vibeQAConfig?: VibeQAWidgetConfig;
  }
}

(function() {
  // Prevent multiple initializations
  if (window.VibeQA) {
    console.warn('[VibeQA] Widget loader already initialized');
    return;
  }

  // Extract config from script tag
  function getScriptConfig(): Partial<VibeQAWidgetConfig> {
    const script = document.currentScript || document.querySelector('script[src*="vibeqa"]');
    if (!script) return {};

    const config: Partial<VibeQAWidgetConfig> = {};

    // Get data attributes
    const projectKey = script.getAttribute('data-project-key');
    if (projectKey) config.projectKey = projectKey;

    const apiUrl = script.getAttribute('data-api-url');
    if (apiUrl) config.apiUrl = apiUrl;

    const position = script.getAttribute('data-position') as any;
    if (position) config.position = position;

    const theme = script.getAttribute('data-theme') as any;
    if (theme) config.theme = theme;

    const primaryColor = script.getAttribute('data-primary-color');
    if (primaryColor) config.primaryColor = primaryColor;

    const buttonText = script.getAttribute('data-button-text');
    if (buttonText) config.buttonText = buttonText;

    const debug = script.getAttribute('data-debug') === 'true';
    if (debug) config.debug = debug;

    return config;
  }

  // Initialize function
  function init(userConfig?: VibeQAWidgetConfig): VibeQAWidget {
    // Merge configs: script attributes < window.vibeQAConfig < init parameter
    const scriptConfig = getScriptConfig();
    const windowConfig = window.vibeQAConfig || {};
    const config = {
      ...scriptConfig,
      ...windowConfig,
      ...userConfig,
    } as VibeQAWidgetConfig;

    if (!config.projectKey) {
      console.error('[VibeQA] Project key is required. Please provide data-project-key attribute or initialize with config.');
      throw new Error('Project key is required');
    }

    // Create and store widget instance
    const widget = new VibeQAWidget(config);
    window.VibeQA!.widget = widget;

    return widget;
  }

  // Create global API
  window.VibeQA = {
    init,
  };

  // Auto-initialize if project key is provided
  const scriptConfig = getScriptConfig();
  if (scriptConfig.projectKey) {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => init());
    } else {
      init();
    }
  }
})();

// Export for module usage
export { VibeQAWidget };
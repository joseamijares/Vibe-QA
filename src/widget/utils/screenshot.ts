import html2canvas from 'html2canvas';

export interface ScreenshotOptions {
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
  ignoreElements?: string[];
}

export class ScreenshotCapture {
  private isCapturing = false;
  private overlay: HTMLElement | null = null;

  async capture(options: ScreenshotOptions = {}): Promise<Blob | null> {
    if (this.isCapturing) {
      throw new Error('Screenshot capture already in progress');
    }

    this.isCapturing = true;

    try {
      // Hide the widget before capturing
      const widgetContainer = document.getElementById('vibeqa-widget-container');
      if (widgetContainer) {
        widgetContainer.style.display = 'none';
      }

      // Create options for html2canvas
      const html2canvasOptions: any = {
        backgroundColor: null,
        scale: options.quality || 1,
        logging: false,
        useCORS: true,
        allowTaint: true,
        ignoreElements: (element: Element) => {
          // Ignore widget elements
          if (element.id === 'vibeqa-widget-container') return true;
          if (element.classList.contains('vibeqa-screenshot-overlay')) return true;

          // Ignore custom selectors
          if (options.ignoreElements) {
            return options.ignoreElements.some((selector) => element.matches(selector));
          }

          return false;
        },
      };

      // Capture the screenshot
      const canvas = await html2canvas(document.body, html2canvasOptions);

      // Restore widget visibility
      if (widgetContainer) {
        widgetContainer.style.display = '';
      }

      // Resize if needed
      let finalCanvas = canvas;
      if (options.maxWidth || options.maxHeight) {
        finalCanvas = this.resizeCanvas(canvas, options.maxWidth, options.maxHeight);
      }

      // Convert to blob
      return new Promise((resolve) => {
        finalCanvas.toBlob(
          (blob) => {
            resolve(blob);
          },
          'image/png',
          options.quality || 0.9
        );
      });
    } catch (error) {
      console.error('[VibeQA] Screenshot capture failed:', error);
      throw error;
    } finally {
      this.isCapturing = false;

      // Make sure widget is visible
      const widgetContainer = document.getElementById('vibeqa-widget-container');
      if (widgetContainer) {
        widgetContainer.style.display = '';
      }
    }
  }

  async captureWithHighlight(options: ScreenshotOptions = {}): Promise<{
    screenshot: Blob | null;
    highlights: HighlightArea[];
  }> {
    const highlights: HighlightArea[] = [];

    // Show highlight overlay
    this.showHighlightOverlay((areas) => {
      highlights.push(...areas);
    });

    // Wait for user to finish highlighting
    await new Promise<void>((resolve) => {
      const handleKeydown = (e: KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === 'Escape') {
          document.removeEventListener('keydown', handleKeydown);
          this.hideHighlightOverlay();
          resolve();
        }
      };
      document.addEventListener('keydown', handleKeydown);
    });

    // Capture screenshot with highlights
    const screenshot = await this.capture(options);

    return { screenshot, highlights };
  }

  private resizeCanvas(
    canvas: HTMLCanvasElement,
    maxWidth?: number,
    maxHeight?: number
  ): HTMLCanvasElement {
    const { width, height } = canvas;
    let newWidth = width;
    let newHeight = height;

    // Calculate new dimensions maintaining aspect ratio
    if (maxWidth && width > maxWidth) {
      newWidth = maxWidth;
      newHeight = (height * maxWidth) / width;
    }

    if (maxHeight && newHeight > maxHeight) {
      newHeight = maxHeight;
      newWidth = (width * maxHeight) / height;
    }

    // Create new canvas with resized dimensions
    const resizedCanvas = document.createElement('canvas');
    resizedCanvas.width = newWidth;
    resizedCanvas.height = newHeight;

    const ctx = resizedCanvas.getContext('2d');
    if (ctx) {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(canvas, 0, 0, newWidth, newHeight);
    }

    return resizedCanvas;
  }

  private showHighlightOverlay(onHighlight: (areas: HighlightArea[]) => void): void {
    // Create overlay
    this.overlay = document.createElement('div');
    this.overlay.className = 'vibeqa-screenshot-overlay';
    this.overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.3);
      z-index: 999998;
      cursor: crosshair;
    `;

    // Add instructions
    const instructions = document.createElement('div');
    instructions.style.cssText = `
      position: absolute;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      z-index: 999999;
    `;
    instructions.textContent =
      'Click and drag to highlight areas. Press Enter when done, ESC to cancel.';
    this.overlay.appendChild(instructions);

    document.body.appendChild(this.overlay);

    // Handle highlight drawing
    let isDrawing = false;
    let startX = 0;
    let startY = 0;
    let currentHighlight: HTMLElement | null = null;
    const highlights: HighlightArea[] = [];

    this.overlay.addEventListener('mousedown', (e) => {
      isDrawing = true;
      startX = e.clientX;
      startY = e.clientY;

      currentHighlight = document.createElement('div');
      currentHighlight.style.cssText = `
        position: absolute;
        border: 2px solid #f59e0b;
        background: rgba(245, 158, 11, 0.2);
        pointer-events: none;
      `;
      this.overlay?.appendChild(currentHighlight);
    });

    this.overlay.addEventListener('mousemove', (e) => {
      if (!isDrawing || !currentHighlight) return;

      const width = Math.abs(e.clientX - startX);
      const height = Math.abs(e.clientY - startY);
      const left = Math.min(e.clientX, startX);
      const top = Math.min(e.clientY, startY);

      currentHighlight.style.left = `${left}px`;
      currentHighlight.style.top = `${top}px`;
      currentHighlight.style.width = `${width}px`;
      currentHighlight.style.height = `${height}px`;
    });

    this.overlay.addEventListener('mouseup', (e) => {
      if (!isDrawing || !currentHighlight) return;

      isDrawing = false;

      const width = Math.abs(e.clientX - startX);
      const height = Math.abs(e.clientY - startY);

      if (width > 10 && height > 10) {
        highlights.push({
          x: Math.min(e.clientX, startX),
          y: Math.min(e.clientY, startY),
          width,
          height,
        });
        onHighlight(highlights);
      } else {
        currentHighlight.remove();
      }

      currentHighlight = null;
    });
  }

  private hideHighlightOverlay(): void {
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }
  }
}

export interface HighlightArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Singleton instance
export const screenshotCapture = new ScreenshotCapture();

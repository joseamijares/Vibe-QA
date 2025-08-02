import html2canvas from 'html2canvas';

export interface ScreenshotOptions {
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
  ignoreElements?: string[];
  mode?: 'fullpage' | 'area';
  format?: 'png' | 'webp' | 'jpeg';
  compressionQuality?: number; // 0-1 for JPEG/WebP compression
}

export interface ScreenshotResult {
  blob: Blob;
  dimensions?: { width: number; height: number; x?: number; y?: number };
}

export class ScreenshotCapture {
  private isCapturing = false;
  private overlay: HTMLElement | null = null;
  private selectionBox: HTMLElement | null = null;

  async capture(options: ScreenshotOptions = {}): Promise<Blob | null> {
    const mode = options.mode || 'fullpage';

    switch (mode) {
      case 'area':
        return this.captureArea(options);
      case 'fullpage':
      default:
        return this.captureFullPage(options);
    }
  }

  private async captureFullPage(options: ScreenshotOptions = {}): Promise<Blob | null> {
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
        removeContainer: true, // Prevents document.write warning
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

      // Convert to blob with format support
      return this.canvasToBlob(finalCanvas, options);
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

  private async captureArea(options: ScreenshotOptions = {}): Promise<Blob | null> {
    if (this.isCapturing) {
      throw new Error('Screenshot capture already in progress');
    }

    this.isCapturing = true;
    const selection = await this.getUserAreaSelection();

    if (!selection) {
      this.isCapturing = false;
      return null;
    }

    try {
      // Hide the widget before capturing
      const widgetContainer = document.getElementById('vibeqa-widget-container');
      if (widgetContainer) {
        widgetContainer.style.display = 'none';
      }

      // Capture full page first
      const canvas = await html2canvas(document.body, {
        backgroundColor: null,
        scale: options.quality || 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
        removeContainer: true,
      });

      // Crop to selected area
      const croppedCanvas = document.createElement('canvas');
      const scale = options.quality || 2;
      croppedCanvas.width = selection.width * scale;
      croppedCanvas.height = selection.height * scale;

      const ctx = croppedCanvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(
          canvas,
          selection.x * scale,
          selection.y * scale,
          selection.width * scale,
          selection.height * scale,
          0,
          0,
          selection.width * scale,
          selection.height * scale
        );
      }

      // Restore widget visibility
      if (widgetContainer) {
        widgetContainer.style.display = '';
      }

      // Convert to blob with format support
      return this.canvasToBlob(croppedCanvas, options);
    } catch (error) {
      console.error('[VibeQA] Area screenshot capture failed:', error);
      throw error;
    } finally {
      this.isCapturing = false;
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

  private async getUserAreaSelection(): Promise<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null> {
    return new Promise((resolve) => {
      // Create overlay
      this.overlay = document.createElement('div');
      this.overlay.className = 'vibeqa-selection-overlay';

      // Use styles directly to avoid dependency on widget styles
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
      instructions.className = 'vibeqa-selection-instructions';
      instructions.style.cssText = `
        position: absolute;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(135deg, #094765 0%, #156c8b 100%);
        color: white;
        padding: 16px 32px;
        border-radius: 12px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        font-weight: 600;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        z-index: 999999;
      `;
      instructions.textContent =
        'Click and drag to select an area. Press Enter to confirm, ESC to cancel.';
      this.overlay.appendChild(instructions);

      document.body.appendChild(this.overlay);

      let isDrawing = false;
      let startX = 0;
      let startY = 0;
      let currentSelection: { x: number; y: number; width: number; height: number } | null = null;

      const handleMouseDown = (e: MouseEvent) => {
        isDrawing = true;
        startX = e.clientX;
        startY = e.clientY;

        // Remove existing selection box if any
        if (this.selectionBox) {
          this.selectionBox.remove();
        }

        this.selectionBox = document.createElement('div');
        this.selectionBox.className = 'vibeqa-selection-box';
        this.selectionBox.style.cssText = `
          position: absolute;
          border: 2px solid #ff6b35;
          background: rgba(255, 107, 53, 0.1);
          pointer-events: none;
        `;
        this.overlay?.appendChild(this.selectionBox);
      };

      const handleMouseMove = (e: MouseEvent) => {
        if (!isDrawing || !this.selectionBox) return;

        const width = Math.abs(e.clientX - startX);
        const height = Math.abs(e.clientY - startY);
        const left = Math.min(e.clientX, startX);
        const top = Math.min(e.clientY, startY);

        this.selectionBox.style.left = `${left}px`;
        this.selectionBox.style.top = `${top}px`;
        this.selectionBox.style.width = `${width}px`;
        this.selectionBox.style.height = `${height}px`;

        // Show dimensions
        if (width > 10 && height > 10) {
          const dimensions =
            this.selectionBox.querySelector('.vibeqa-selection-dimensions') ||
            (() => {
              const div = document.createElement('div');
              div.className = 'vibeqa-selection-dimensions';
              div.style.cssText = `
                position: absolute;
                bottom: -24px;
                right: 0;
                background: #094765;
                color: white;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 12px;
                font-weight: 600;
                white-space: nowrap;
              `;
              this.selectionBox?.appendChild(div);
              return div;
            })();
          dimensions.textContent = `${Math.round(width)} × ${Math.round(height)}`;
        }
      };

      const handleMouseUp = (e: MouseEvent) => {
        if (!isDrawing) return;

        isDrawing = false;
        const width = Math.abs(e.clientX - startX);
        const height = Math.abs(e.clientY - startY);

        if (width > 10 && height > 10) {
          currentSelection = {
            x: Math.min(e.clientX, startX),
            y: Math.min(e.clientY, startY),
            width,
            height,
          };
        }
      };

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Enter' && currentSelection) {
          cleanup();
          resolve(currentSelection);
        } else if (e.key === 'Escape') {
          cleanup();
          resolve(null);
        }
      };

      const cleanup = () => {
        this.overlay?.removeEventListener('mousedown', handleMouseDown);
        this.overlay?.removeEventListener('mousemove', handleMouseMove);
        this.overlay?.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('keydown', handleKeyDown);
        this.overlay?.remove();
        this.overlay = null;
        this.selectionBox = null;
      };

      this.overlay.addEventListener('mousedown', handleMouseDown);
      this.overlay.addEventListener('mousemove', handleMouseMove);
      this.overlay.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('keydown', handleKeyDown);
    });
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

  private async canvasToBlob(
    canvas: HTMLCanvasElement,
    options: ScreenshotOptions
  ): Promise<Blob | null> {
    const format = options.format || 'webp'; // Default to WebP for better compression
    const quality = options.compressionQuality || 0.85; // Default 85% quality

    // Check WebP support
    const supportsWebP = await this.checkWebPSupport();
    const finalFormat = format === 'webp' && !supportsWebP ? 'png' : format;

    // Map format to MIME type
    const mimeTypes: Record<string, string> = {
      png: 'image/png',
      webp: 'image/webp',
      jpeg: 'image/jpeg',
    };

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (blob && finalFormat === 'webp' && blob.size > 1024 * 1024) {
            // If WebP is still too large (>1MB), try with lower quality
            canvas.toBlob(
              (compressedBlob) => resolve(compressedBlob),
              mimeTypes[finalFormat],
              quality * 0.7 // 70% of original quality
            );
          } else {
            resolve(blob);
          }
        },
        mimeTypes[finalFormat],
        finalFormat === 'png' ? undefined : quality // PNG doesn't support quality parameter
      );
    });
  }

  private checkWebPSupport(): Promise<boolean> {
    return new Promise((resolve) => {
      const webP = new Image();
      webP.onload = webP.onerror = () => {
        resolve(webP.height === 2);
      };
      webP.src =
        'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
    });
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

import { screenshotCapture, ScreenshotOptions } from './screenshot';

export interface MediaAttachment {
  type: 'screenshot' | 'voice';
  blob: Blob;
  filename: string;
  size: number;
  duration?: number; // For audio
  thumbnail?: string; // Base64 thumbnail for preview
}

export class MediaManager {
  private attachments: MediaAttachment[] = [];
  private maxFileSize = 10 * 1024 * 1024; // 10MB
  private maxAttachments = 5;

  async captureScreenshot(options?: ScreenshotOptions): Promise<MediaAttachment> {
    try {
      const blob = await screenshotCapture.capture(options);

      if (!blob) {
        throw new Error('Failed to capture screenshot');
      }

      if (blob.size > this.maxFileSize) {
        throw new Error(
          `Screenshot too large. Maximum size is ${this.maxFileSize / 1024 / 1024}MB`
        );
      }

      const attachment: MediaAttachment = {
        type: 'screenshot',
        blob,
        filename: `screenshot-${Date.now()}.png`,
        size: blob.size,
        thumbnail: await this.generateThumbnail(blob),
      };

      this.addAttachment(attachment);
      return attachment;
    } catch (error) {
      console.error('[VibeQA] Screenshot capture error:', error);
      throw error;
    }
  }

  async captureVoice(): Promise<MediaAttachment> {
    // Check browser support
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Voice recording not supported in this browser');
    }

    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: this.getAudioMimeType(),
      });

      const chunks: Blob[] = [];
      let startTime = Date.now();

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      // Start recording
      mediaRecorder.start();

      // Return promise that resolves when recording stops
      return new Promise((resolve, reject) => {
        // Create recording UI
        const recordingUI = this.createRecordingUI(() => {
          mediaRecorder.stop();
        });

        mediaRecorder.onstop = async () => {
          // Stop all tracks
          stream.getTracks().forEach((track) => track.stop());

          // Remove recording UI
          recordingUI.remove();

          // Create blob from chunks
          const blob = new Blob(chunks, { type: this.getAudioMimeType() });

          if (blob.size > this.maxFileSize) {
            reject(
              new Error(`Recording too large. Maximum size is ${this.maxFileSize / 1024 / 1024}MB`)
            );
            return;
          }

          const duration = Math.round((Date.now() - startTime) / 1000);

          const attachment: MediaAttachment = {
            type: 'voice',
            blob,
            filename: `voice-${Date.now()}.webm`,
            size: blob.size,
            duration,
          };

          this.addAttachment(attachment);
          resolve(attachment);
        };

        mediaRecorder.onerror = (event: any) => {
          stream.getTracks().forEach((track) => track.stop());
          recordingUI.remove();
          reject(new Error(`Recording failed: ${event.error}`));
        };
      });
    } catch (error) {
      console.error('[VibeQA] Voice capture error:', error);
      throw error;
    }
  }

  private addAttachment(attachment: MediaAttachment): void {
    if (this.attachments.length >= this.maxAttachments) {
      throw new Error(`Maximum ${this.maxAttachments} attachments allowed`);
    }
    this.attachments.push(attachment);
  }

  removeAttachment(filename: string): void {
    this.attachments = this.attachments.filter((a) => a.filename !== filename);
  }

  getAttachments(): MediaAttachment[] {
    return [...this.attachments];
  }

  clearAttachments(): void {
    this.attachments = [];
  }

  clearAll(): void {
    this.clearAttachments();
  }

  private async generateThumbnail(blob: Blob): Promise<string> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxSize = 100;

          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxSize) {
              height = (height * maxSize) / width;
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width = (width * maxSize) / height;
              height = maxSize;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/png', 0.7));
          } else {
            resolve('');
          }
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(blob);
    });
  }

  private getAudioMimeType(): string {
    // Check supported audio formats
    const types = ['audio/webm', 'audio/mp4', 'audio/ogg', 'audio/wav'];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    return 'audio/webm'; // Default fallback
  }

  private createRecordingUI(onStop: () => void): HTMLElement {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #dc2626;
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      gap: 12px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      z-index: 999999;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    `;

    // Recording indicator
    const indicator = document.createElement('div');
    indicator.style.cssText = `
      width: 12px;
      height: 12px;
      background: white;
      border-radius: 50%;
      animation: pulse 1.5s ease-in-out infinite;
    `;

    // Add pulse animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.5; transform: scale(1.1); }
        100% { opacity: 1; transform: scale(1); }
      }
    `;
    document.head.appendChild(style);

    // Timer
    const timer = document.createElement('span');
    timer.textContent = '0:00';
    let seconds = 0;
    const interval = setInterval(() => {
      seconds++;
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      timer.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
    }, 1000);

    // Stop button
    const stopButton = document.createElement('button');
    stopButton.textContent = 'Stop Recording';
    stopButton.style.cssText = `
      background: white;
      color: #dc2626;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      font-weight: 500;
      cursor: pointer;
    `;
    stopButton.onclick = () => {
      clearInterval(interval);
      style.remove();
      onStop();
    };

    overlay.appendChild(indicator);
    overlay.appendChild(document.createTextNode('Recording...'));
    overlay.appendChild(timer);
    overlay.appendChild(stopButton);

    document.body.appendChild(overlay);
    return overlay;
  }
}

// Singleton instance
export const mediaManager = new MediaManager();

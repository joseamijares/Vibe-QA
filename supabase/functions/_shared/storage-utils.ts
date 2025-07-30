import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

export interface MediaUpload {
  fieldName: string;
  file: File;
  type: 'screenshot' | 'voice';
}

export class StorageUtils {
  private supabase: any;
  private bucketName = 'feedback-media';

  constructor(supabaseUrl: string, supabaseServiceKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseServiceKey);
  }

  async uploadMedia(
    feedbackId: string,
    organizationId: string,
    uploads: MediaUpload[]
  ): Promise<Array<{ type: string; url: string; filename: string; size: number; thumbnailUrl?: string }>> {
    const results = [];

    for (const upload of uploads) {
      try {
        // Generate unique filename with proper path structure
        const timestamp = Date.now();
        const fileExt = this.getFileExtension(upload.file.name);
        const fileName = `${organizationId}/${feedbackId}/${upload.type}-${timestamp}${fileExt}`;

        console.log(`[storage-utils] Uploading ${upload.type} file: ${fileName}, size: ${upload.file.size} bytes`);

        // Upload to storage
        const { data, error } = await this.supabase.storage
          .from(this.bucketName)
          .upload(fileName, upload.file, {
            contentType: upload.file.type,
            upsert: false,
          });

        if (error) {
          console.error(`[storage-utils] Failed to upload ${upload.type}:`, error);
          continue;
        }

        console.log(`[storage-utils] Successfully uploaded ${upload.type} to: ${fileName}`);

        // Get public URL
        const { data: urlData } = this.supabase.storage
          .from(this.bucketName)
          .getPublicUrl(fileName);

        // Generate thumbnail for images
        let thumbnailUrl = null;
        if (upload.type === 'screenshot' && urlData.publicUrl) {
          // For now, use the same URL. In production, you'd generate actual thumbnails
          thumbnailUrl = urlData.publicUrl;
        }

        results.push({
          type: upload.type,
          url: urlData.publicUrl,
          filename: upload.file.name,
          size: upload.file.size,
          thumbnailUrl,
        });
      } catch (error) {
        console.error(`Error uploading ${upload.type}:`, error);
      }
    }

    return results;
  }

  async createMediaRecords(
    feedbackId: string,
    mediaUploads: Array<{ type: string; url: string; filename: string; size: number; thumbnailUrl?: string }>
  ): Promise<void> {
    const mediaRecords = mediaUploads.map((upload) => ({
      feedback_id: feedbackId,
      type: upload.type,
      url: upload.url,
      thumbnail_url: upload.thumbnailUrl,
      file_size: upload.size,
      metadata: {
        originalName: upload.filename,
      },
    }));

    if (mediaRecords.length > 0) {
      const { error } = await this.supabase
        .from('feedback_media')
        .insert(mediaRecords);

      if (error) {
        console.error('Failed to create media records:', error);
        throw new Error('Failed to save media information');
      }
    }
  }

  private getFileExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.');
    if (lastDot === -1) return '';
    return filename.substring(lastDot);
  }

  validateFileSize(file: File, maxSizeMB: number = 10): boolean {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    return file.size <= maxSizeBytes;
  }

  validateFileType(file: File, type: 'screenshot' | 'voice' | 'video'): boolean {
    const allowedTypes: Record<string, string[]> = {
      screenshot: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'],
      voice: ['audio/webm', 'audio/mp4', 'audio/ogg', 'audio/wav', 'audio/mpeg'],
      video: ['video/mp4', 'video/webm', 'video/ogg'],
    };

    return allowedTypes[type]?.includes(file.type) || false;
  }
}
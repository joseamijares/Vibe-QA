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

    // Validate IDs to prevent directory traversal
    if (!this.isValidUUID(feedbackId) || !this.isValidUUID(organizationId)) {
      throw new Error('Invalid feedback or organization ID');
    }

    for (const upload of uploads) {
      try {
        // Sanitize filename to prevent path injection
        const sanitizedFilename = this.sanitizeFilename(upload.file.name);
        
        // Generate unique filename with proper path structure
        const timestamp = Date.now();
        const fileExt = this.getFileExtension(sanitizedFilename);
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

        // Generate signed URL with 1 hour expiration for immediate use
        const { data: signedUrlData, error: urlError } = await this.supabase.storage
          .from(this.bucketName)
          .createSignedUrl(fileName, 3600); // 1 hour expiration

        if (urlError) {
          console.error(`[storage-utils] Failed to create signed URL:`, urlError);
          // Fallback to public URL if signed URL fails
          const { data: urlData } = this.supabase.storage
            .from(this.bucketName)
            .getPublicUrl(fileName);
          
          results.push({
            type: upload.type,
            url: urlData.publicUrl,
            filename: upload.file.name,
            size: upload.file.size,
            thumbnailUrl: upload.type === 'screenshot' ? urlData.publicUrl : null,
          });
        } else {
          // Use signed URL
          results.push({
            type: upload.type,
            url: signedUrlData.signedUrl,
            filename: upload.file.name,
            size: upload.file.size,
            thumbnailUrl: upload.type === 'screenshot' ? signedUrlData.signedUrl : null,
          });
        }
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

    // First check declared MIME type
    if (!allowedTypes[type]?.includes(file.type)) {
      return false;
    }

    // Additional validation based on file extension
    const extension = this.getFileExtension(file.name).toLowerCase();
    const allowedExtensions: Record<string, string[]> = {
      screenshot: ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
      voice: ['.webm', '.mp4', '.ogg', '.wav', '.mp3'],
      video: ['.mp4', '.webm', '.ogg'],
    };

    return allowedExtensions[type]?.includes(extension) || false;
  }

  private isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  private sanitizeFilename(filename: string): string {
    return filename
      .replace(/[\/\\]/g, '_')           // Replace path separators
      .replace(/\.\./g, '.')             // Remove directory traversal
      .replace(/[^\w\-_.]/g, '_')        // Keep only safe characters
      .replace(/_{2,}/g, '_')            // Remove multiple underscores
      .replace(/^[_.-]+/, '')            // Remove leading dots, dashes, underscores
      .replace(/[_.-]+$/, '')            // Remove trailing dots, dashes, underscores
      .slice(0, 100);                    // Reasonable length limit
  }
}
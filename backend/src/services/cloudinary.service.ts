import { cloudinary, isCloudinaryConfigured } from '../config/cloudinary.js';

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
  secureUrl: string;
  resourceType: 'image' | 'video' | 'raw' | string;
  format?: string;
  width?: number;
  height?: number;
  duration?: number;
}

export class CloudinaryService {
  /**
   * Upload an image or video buffer directly to Cloudinary
   */
  static async uploadBuffer(
    buffer: Buffer,
    folder: string = 'craft-ai/uploads',
    options: Record<string, any> = {}
  ): Promise<CloudinaryUploadResult> {
    if (!isCloudinaryConfigured) {
      // In development fallback, return a mock or local data representation
      const base64 = buffer.toString('base64');
      const dataUri = `data:image/png;base64,${base64}`;
      return {
        url: dataUri,
        secureUrl: dataUri,
        publicId: `dev_${Date.now()}`,
        resourceType: 'image',
      };
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'auto',
          ...options,
        },
        (error, result) => {
          if (error) return reject(error);
          if (!result) return reject(new Error('Cloudinary upload returned empty result'));
          resolve({
            url: result.url,
            secureUrl: result.secure_url,
            publicId: result.public_id,
            resourceType: result.resource_type || 'image',
            format: result.format,
            width: result.width,
            height: result.height,
            duration: result.duration,
          });
        }
      );

      uploadStream.end(buffer);
    });
  }

  /**
   * Generate signature for client-side direct upload
   */
  static generateSignature(folder: string = 'craft-ai/creatives'): {
    signature: string;
    timestamp: number;
    cloudName: string;
    apiKey: string;
  } {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const apiSecret = process.env.CLOUDINARY_API_SECRET || '';
    const apiKey = process.env.CLOUDINARY_API_KEY || '';
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || '';

    const signature = cloudinary.utils.api_sign_request(
      { timestamp, folder },
      apiSecret
    );

    return { signature, timestamp, cloudName, apiKey };
  }

  /**
   * Build personalized transformation URL using Cloudinary URL syntax
   */
  static getTransformedUrl(
    publicId: string,
    transformations: Array<Record<string, any>>
  ): string {
    if (!isCloudinaryConfigured) return publicId;
    return cloudinary.url(publicId, {
      transformation: transformations,
      secure: true,
    });
  }

  /**
   * Generate high quality server-side composite video URL with circular gold user photo
   * Zero frame drops, 100% original quality, original audio, zero client lag, pure MP4
   */
  static generateCompositeVideoUrl(
    videoUrl: string,
    photoUrl?: string,
    isPostFormat: boolean = false,
    slot?: { x?: number; y?: number; width?: number; height?: number },
    filename: string = 'craft-ai-story.mp4'
  ): string | null {
    if (!videoUrl) return null;

    try {
      // Always normalize output format to genuine .mp4 (never .mov or .webm)
      let cleanVideoUrl = videoUrl.replace(/\.(mov|MOV|webm|avi|mkv|flv)$/i, '.mp4');
      if (!cleanVideoUrl.endsWith('.mp4')) {
        cleanVideoUrl = cleanVideoUrl + '.mp4';
      }

      const cleanFilename = filename.replace(/\.(mp4|mov|webm)$/i, '').replace(/[^a-zA-Z0-9_-]/g, '_');

      // If no photo overlay provided, return pure MP4 download URL
      if (!photoUrl) {
        if (cleanVideoUrl.includes('res.cloudinary.com') && cleanVideoUrl.includes('/video/upload/')) {
          return cleanVideoUrl.replace(
            '/video/upload/',
            `/video/upload/fl_attachment:${cleanFilename},f_mp4,vc_h264,ac_aac/`
          );
        }
        return cleanVideoUrl;
      }

      // Extract user photo public ID or base64 fetch
      let layerSpec = '';
      if (photoUrl.includes('res.cloudinary.com') && photoUrl.includes('/upload/')) {
        const afterUpload = photoUrl.split('/upload/')[1];
        const withoutVersion = afterUpload.replace(/^v\d+\//, '').replace(/\.[^/.]+$/, '');
        const formattedPublicId = withoutVersion.replace(/\//g, ':');
        layerSpec = `l_${formattedPublicId}`;
      } else if (photoUrl.startsWith('http')) {
        const base64Url = Buffer.from(photoUrl).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        layerSpec = `l_fetch:${base64Url}`;
      }

      if (layerSpec && cleanVideoUrl.includes('res.cloudinary.com') && cleanVideoUrl.includes('/video/upload/')) {
        let positionTransform = '';
        if (slot && typeof slot.x === 'number' && typeof slot.y === 'number' && slot.x > 0 && slot.y > 0) {
          const wRel = Math.max(0.18, Math.min(0.6, slot.width || 0.28));
          const xRel = Math.max(0, Math.min(0.9, slot.x));
          const yRel = Math.max(0, Math.min(0.9, slot.y));
          positionTransform = `${layerSpec},c_fill,w_${wRel},h_${wRel},fl_relative,r_max,bo_8px_solid_rgb:E5C158/fl_layer_apply,g_north_west,x_${xRel},y_${yRel},fl_relative`;
        } else {
          const yOffset = isPostFormat ? 0.2 : 0.15;
          const sizeRel = isPostFormat ? 0.28 : 0.26;
          positionTransform = `${layerSpec},c_fill,w_${sizeRel},h_${sizeRel},fl_relative,r_max,bo_8px_solid_rgb:E5C158/fl_layer_apply,g_south,y_${yOffset},fl_relative`;
        }

        const overlayTransform = `${positionTransform}/fl_attachment:${cleanFilename},f_mp4,vc_h264,ac_aac`;
        return cleanVideoUrl.replace('/video/upload/', `/video/upload/${overlayTransform}/`);
      }
    } catch (e) {
      console.warn('generateCompositeVideoUrl error:', e);
    }
    return null;
  }
}


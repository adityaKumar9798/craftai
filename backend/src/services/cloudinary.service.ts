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
   * Zero frame drops, 100% original quality, original audio, zero client lag
   */
  static generateCompositeVideoUrl(
    videoUrl: string,
    photoUrl: string,
    isPostFormat: boolean = false
  ): string | null {
    if (!videoUrl || !photoUrl) return null;

    try {
      const yOffset = isPostFormat ? 220 : 250;
      const layerSize = isPostFormat ? 280 : 300;

      // Extract user photo public ID or base64 fetch with PNG alpha channel
      let layerSpec = '';
      if (photoUrl.includes('res.cloudinary.com') && photoUrl.includes('/upload/')) {
        const afterUpload = photoUrl.split('/upload/')[1];
        const withoutVersion = afterUpload.replace(/^v\d+\//, '').replace(/\.[^/.]+$/, '');
        const formattedPublicId = withoutVersion.replace(/\//g, ':');
        layerSpec = `l_${formattedPublicId}.png`;
      } else if (photoUrl.startsWith('http')) {
        const base64Url = Buffer.from(photoUrl).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        layerSpec = `l_fetch:${base64Url}`;
      }

      if (layerSpec && videoUrl.includes('res.cloudinary.com') && videoUrl.includes('/video/upload/')) {
        // f_png ensures transparent alpha channel outside the r_max circle, removing any white box
        const overlayTransform = `${layerSpec}/c_fill,w_${layerSize},h_${layerSize},r_max,bo_10px_solid_rgb:E5C158,f_png/fl_layer_apply,g_south,y_${yOffset}`;
        return videoUrl.replace('/video/upload/', `/video/upload/${overlayTransform}/`);
      }
    } catch (e) {
      console.warn('generateCompositeVideoUrl error:', e);
    }
    return null;
  }
}


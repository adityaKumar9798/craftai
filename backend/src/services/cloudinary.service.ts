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
}

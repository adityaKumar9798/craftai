import { Template } from '../types';

export class CanvasRenderer {
  /**
   * Helper to load an image from URL into an HTMLImageElement
   */
  private static loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = (e) => reject(e);
      img.src = src;
    });
  }

  /**
   * Render a personalized 1080x1920 story on an off-screen HTML5 Canvas
   * and return high quality Data URL or Blob
   */
  static async renderStory(
    template: Template,
    userPhotoUrl: string,
    adjustments?: {
      scale?: number;
      offsetX?: number;
      offsetY?: number;
      rotation?: number;
    }
  ): Promise<string> {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D canvas context');

    // 1. Draw Template Background Image
    try {
      const bgImg = await this.loadImage(template.assetUrl || template.thumbnailUrl);
      ctx.drawImage(bgImg, 0, 0, 1080, 1920);
    } catch (e) {
      console.warn('Could not load template background, drawing gradient backdrop fallback:', e);
      const grad = ctx.createLinearGradient(0, 0, 0, 1920);
      grad.addColorStop(0, '#FFFBEB');
      grad.addColorStop(0.5, '#FCE7F3');
      grad.addColorStop(1, '#E0F2FE');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1080, 1920);
    }

    // 2. Draw Soft Vignette/Backdrop Overlay to ensure contrast
    const vignette = ctx.createLinearGradient(0, 0, 0, 1920);
    vignette.addColorStop(0, 'rgba(0, 0, 0, 0.25)');
    vignette.addColorStop(0.3, 'rgba(0, 0, 0, 0.05)');
    vignette.addColorStop(0.7, 'rgba(0, 0, 0, 0.1)');
    vignette.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, 1080, 1920);

    // 3. Draw Predefined Subject Slot (The User Photo)
    try {
      const userImg = await this.loadImage(userPhotoUrl);
      const slot = template.subjectSlot;

      const slotX = slot.x * 1080;
      const slotY = slot.y * 1920;
      const slotW = slot.width * 1080;
      const slotH = slot.height * 1920;

      const scale = adjustments?.scale || 1.0;
      const offX = (adjustments?.offsetX || 0) * slotW;
      const offY = (adjustments?.offsetY || 0) * slotH;
      const rotation = (slot.rotation || 0) + (adjustments?.rotation || 0);

      const isCircle = slot.shape === 'circle' || slot.borderRadius === 9999 || (!slot.shape && template.category === 'morning') || slot.width > 0;
      const circleW = isCircle ? ((slot.width && slot.width <= 0.8 ? slot.width : 0.28) * 1080) : slotW;
      const circleRadius = circleW / 2;
      const centerX = isCircle ? ((slot.x !== undefined && slot.x > 0 ? slot.x : 0.36) * 1080 + circleRadius) : (slotX + slotW / 2);
      const centerY = isCircle ? ((slot.y !== undefined && slot.y > 0 ? slot.y : 0.67) * 1920 + circleRadius) : (slotY + slotH / 2);
      const slotDrawW = isCircle ? circleW : slotW;
      const slotDrawH = isCircle ? circleW : slotH;

      ctx.save();

      // Rounded photo frame or circular frame mask
      ctx.beginPath();
      if (isCircle) {
        ctx.arc(centerX, centerY, circleRadius, 0, Math.PI * 2);
      } else {
        const radius = 24;
        ctx.roundRect(slotX, slotY, slotW, slotH, [radius]);
      }
      ctx.clip();

      // Shadow behind subject if configured
      ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
      ctx.shadowBlur = 30;
      ctx.shadowOffsetY = 15;

      ctx.translate(centerX + offX, centerY + offY);
      if (rotation !== 0) {
        ctx.rotate((rotation * Math.PI) / 180);
      }

      // Draw user image centered in slot
      const imgAspect = userImg.width / userImg.height;
      const slotAspect = isCircle ? 1 : slotW / slotH;

      let drawW = slotDrawW * scale;
      let drawH = slotDrawH * scale;

      if (slot.fit === 'cover' || isCircle) {
        if (imgAspect > slotAspect) {
          drawW = drawH * imgAspect;
        } else {
          drawH = drawW / imgAspect;
        }
      }

      ctx.drawImage(userImg, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();

      // Subtle decorative border for subject slot (Gold for circle)
      ctx.save();
      if (isCircle) {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
        ctx.shadowBlur = 35;
        ctx.shadowOffsetY = 12;

        // Metallic Gold outer rim
        ctx.strokeStyle = '#E5C158';
        ctx.lineWidth = 12;
        ctx.beginPath();
        ctx.arc(centerX, centerY, circleRadius, 0, Math.PI * 2);
        ctx.stroke();

        // Inner refined gold accent ring
        ctx.strokeStyle = '#B8860B';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(centerX, centerY, circleRadius - 7, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.roundRect(slotX, slotY, slotW, slotH, [24]);
        ctx.stroke();
      }
      ctx.restore();
    } catch (e) {
      console.warn('Failed to draw user photo to canvas:', e);
    }

    // 4. Render Template Typography & Badges
    ctx.save();
    ctx.textAlign = 'center';

    // Top Category / Tag Pill
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = '600 28px Inter, sans-serif';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowBlur = 8;
    ctx.fillText((template.category || 'Story').toUpperCase(), 540, 160);

    // Headline (e.g. "Good Morning" or "Bee Yourself")
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = 16;
    ctx.shadowOffsetY = 6;
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 84px "Plus Jakarta Sans", Inter, sans-serif';
    ctx.fillText(template.headline || template.name, 540, 260);

    // Subheadline
    if (template.subheadline) {
      ctx.font = '500 38px "Great Vibes", cursive, serif';
      ctx.fillStyle = '#FEF08A'; // soft pastel gold
      ctx.shadowBlur = 10;
      ctx.fillText(template.subheadline, 540, 330);
    }

    // Quote or Bottom Caption
    if (template.quote) {
      ctx.font = '600 34px Inter, sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowBlur = 12;
      ctx.fillText(template.quote, 540, 1800);
    }

    // Subtle Craft AI Watermark / Brand Badge
    ctx.font = '500 24px Inter, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.shadowBlur = 6;
    ctx.fillText('Craft AI • Your Photo. Every Story.', 540, 1860);

    ctx.restore();

    return canvas.toDataURL('image/png', 0.95);
  }

  /**
   * Trigger automatic browser file download
   */
  static downloadDataUrl(dataUrl: string, filename: string = 'craft-ai-story.png'): void {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}

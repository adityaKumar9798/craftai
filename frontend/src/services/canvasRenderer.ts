import { Template } from '../types';

export class CanvasRenderer {
  /**
   * Helper to load an image from URL into an HTMLImageElement with fallback to proxy
   */
  private static loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => {
        // If direct CORS fails and it's a remote URL, retry via backend proxy
        if (src.startsWith('http') && !src.includes('/api/upload/proxy-image')) {
          const proxySrc = `http://localhost:5000/api/upload/proxy-image?url=${encodeURIComponent(src)}`;
          const proxyImg = new Image();
          proxyImg.crossOrigin = 'anonymous';
          proxyImg.onload = () => resolve(proxyImg);
          proxyImg.onerror = (e) => reject(e);
          proxyImg.src = proxySrc;
        } else {
          reject(new Error(`Failed to load image: ${src}`));
        }
      };
      img.src = src;
    });
  }

  /**
   * Convert Data URL to a real binary Blob
   */
  static dataUrlToBlob(dataUrl: string): Blob {
    try {
      const parts = dataUrl.split(';base64,');
      const contentType = parts[0].split(':')[1] || 'image/png';
      const raw = window.atob(parts[1]);
      const rawLength = raw.length;
      const uInt8Array = new Uint8Array(rawLength);
      for (let i = 0; i < rawLength; ++i) {
        uInt8Array[i] = raw.charCodeAt(i);
      }
      return new Blob([uInt8Array], { type: contentType });
    } catch {
      return new Blob([], { type: 'image/png' });
    }
  }

  /**
   * Download a Blob directly to user's disk without navigating away
   */
  static downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      if (document.body.contains(a)) {
        document.body.removeChild(a);
      }
      URL.revokeObjectURL(url);
    }, 1500);
  }

  /**
   * Render a personalized story/post on an off-screen HTML5 Canvas
   * Respects exact 3:4 or 9:16 aspect ratio with only the user's photo overlaid in the circular gold frame.
   * Does NOT add any extra text or unwanted overlays over original artwork.
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
    const isPostFormat = template.format === 'post';
    const width = 1080;
    const height = isPostFormat ? 1440 : 1920; // 3:4 for posts (1080x1440), 9:16 for stories (1080x1920)

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D canvas context');

    // 1. Draw Original Template Background Image
    try {
      const bgImg = await this.loadImage(template.assetUrl || template.thumbnailUrl);
      ctx.drawImage(bgImg, 0, 0, width, height);
    } catch (e) {
      console.warn('Could not load template background:', e);
    }

    // 2. Draw User Photo in Circular Gold Frame Slot (matching preview layout exactly)
    if (userPhotoUrl) {
      try {
        const userImg = await this.loadImage(userPhotoUrl);
        const circleW = 0.28 * width;
        const circleRadius = circleW / 2;
        const centerX = 0.36 * width + circleRadius;
        const centerY = (isPostFormat ? 0.64 : 0.67) * height + circleRadius;

        const scale = adjustments?.scale || 1.0;
        const offX = (adjustments?.offsetX || 0) * circleW;
        const offY = (adjustments?.offsetY || 0) * circleW;
        const rotation = (adjustments?.rotation || 0);

        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, centerY, circleRadius, 0, Math.PI * 2);
        ctx.clip();

        ctx.translate(centerX + offX, centerY + offY);
        if (rotation !== 0) {
          ctx.rotate((rotation * Math.PI) / 180);
        }

        // Draw user image centered in circle
        const imgAspect = userImg.width / userImg.height;
        let drawW = circleW * scale;
        let drawH = circleW * scale;
        if (imgAspect > 1) {
          drawW = drawH * imgAspect;
        } else {
          drawH = drawW / imgAspect;
        }
        ctx.drawImage(userImg, -drawW / 2, -drawH / 2, drawW, drawH);
        ctx.restore();

        // 3. Metallic Gold Outer Rim & Inner Ring (Pure clean styling)
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
        ctx.shadowBlur = 20;
        ctx.strokeStyle = '#E5C158';
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.arc(centerX, centerY, circleRadius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = '#B8860B';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(centerX, centerY, circleRadius - 6, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      } catch (e) {
        console.warn('Failed to draw user photo to canvas:', e);
      }
    }

    return canvas.toDataURL('image/png', 0.98);
  }

  /**
   * Helper to pre-render the static user photo and metallic frame overlay once.
   * This completely avoids expensive clipping and shadowBlur calculations during the video recording loop,
   * eliminating video lag and frame drops.
   */
  private static createVideoOverlayCanvas(
    width: number,
    height: number,
    slot: any,
    userImg: HTMLImageElement | null
  ): HTMLCanvasElement {
    const overlay = document.createElement('canvas');
    overlay.width = width;
    overlay.height = height;
    const ctx = overlay.getContext('2d');
    if (!ctx || !userImg) return overlay;

    const circleW = slot && slot.width > 0 && slot.width <= 1 ? slot.width * width : 0.28 * width;
    const circleRadius = circleW / 2;
    const centerX =
      slot && slot.x !== undefined && slot.x >= 0 && slot.x <= 1
        ? slot.x * width + circleRadius
        : 0.36 * width + circleRadius;
    const centerY =
      slot && slot.y !== undefined && slot.y >= 0 && slot.y <= 1
        ? slot.y * height + circleRadius
        : 0.67 * height + circleRadius;

    // 1. Draw User Image centered in Circle Slot
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, circleRadius, 0, Math.PI * 2);
    ctx.clip();

    const imgAspect = userImg.width / userImg.height;
    let drawW = circleW;
    let drawH = circleW;
    if (imgAspect > 1) {
      drawW = drawH * imgAspect;
    } else {
      drawH = drawW / imgAspect;
    }
    ctx.drawImage(userImg, centerX - drawW / 2, centerY - drawH / 2, drawW, drawH);
    ctx.restore();

    // 2. Metallic Gold Outer Rim & Inner Ring with Shadow (Pre-rendered ONCE)
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
    ctx.shadowBlur = 18;
    ctx.strokeStyle = '#E5C158';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(centerX, centerY, circleRadius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#B8860B';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(centerX, centerY, circleRadius - 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    return overlay;
  }

  /**
   * Build a direct Cloudinary video URL with:
   * 1. 100% genuine H.264 / AAC MP4 format (never .mov, never WebM)
   * 2. Direct browser download with fl_attachment header
   * 3. Instant generation with ZERO client lag and exact full duration (10s, 20s, etc.)
   * 4. Circular gold frame overlay with user photo
   */
  static buildCloudinaryVideoUrl(
    template: Template,
    userPhotoUrl?: string,
    filename: string = 'craft-ai-story.mp4'
  ): string | null {
    const rawVideoUrl = template.videoUrl || template.assetUrl;
    if (!rawVideoUrl || !rawVideoUrl.includes('res.cloudinary.com')) {
      return null;
    }

    try {
      const cleanFilename = filename
        .replace(/\.(mp4|mov|webm)$/i, '')
        .replace(/[^a-zA-Z0-9_-]/g, '_');

      // Convert any MOV or WEBM to pure .mp4 container
      let cleanUrl = rawVideoUrl.replace(/\.(mov|MOV|webm|avi|mkv|flv)$/i, '.mp4');
      if (!cleanUrl.endsWith('.mp4')) {
        cleanUrl = cleanUrl + '.mp4';
      }

      // 1. If user photo is provided and is a valid HTTP / Cloudinary URL
      if (userPhotoUrl && userPhotoUrl.startsWith('http')) {
        let layerSpec = '';
        if (userPhotoUrl.includes('res.cloudinary.com') && userPhotoUrl.includes('/upload/')) {
          const afterUpload = userPhotoUrl.split('/upload/')[1];
          const withoutVersion = afterUpload.replace(/^v\d+\//, '').replace(/\.[^/.]+$/, '');
          const formattedPublicId = withoutVersion.replace(/\//g, ':');
          layerSpec = `l_${formattedPublicId}`;
        } else {
          const base64Url = window.btoa(userPhotoUrl).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
          layerSpec = `l_fetch:${base64Url}`;
        }

        const slot = template.subjectSlot || ({} as any);
        const isPost = template.format === 'post';
        let overlayPart = '';

        if (slot && typeof slot.x === 'number' && typeof slot.y === 'number' && slot.x > 0 && slot.y > 0) {
          const wRel = Math.max(0.18, Math.min(0.6, slot.width || 0.28));
          const xRel = Math.max(0, Math.min(0.9, slot.x));
          const yRel = Math.max(0, Math.min(0.9, slot.y));
          overlayPart = `${layerSpec},c_fill,w_${wRel},h_${wRel},fl_relative,r_max,bo_8px_solid_rgb:E5C158/fl_layer_apply,g_north_west,x_${xRel},y_${yRel},fl_relative`;
        } else {
          const yOffset = isPost ? 0.2 : 0.15;
          const sizeRel = isPost ? 0.28 : 0.26;
          overlayPart = `${layerSpec},c_fill,w_${sizeRel},h_${sizeRel},fl_relative,r_max,bo_8px_solid_rgb:E5C158/fl_layer_apply,g_south,y_${yOffset},fl_relative`;
        }

        const trans = `${overlayPart}/fl_attachment:${cleanFilename},f_mp4,vc_h264,ac_aac`;
        if (cleanUrl.includes('/video/upload/')) {
          return cleanUrl.replace('/video/upload/', `/video/upload/${trans}/`);
        } else if (cleanUrl.includes('/upload/')) {
          return cleanUrl.replace('/upload/', `/upload/${trans}/`);
        }
      }

      // 2. No user photo: convert original video to genuine H.264 MP4 with download attachment header
      const trans = `fl_attachment:${cleanFilename},f_mp4,vc_h264,ac_aac`;
      if (cleanUrl.includes('/video/upload/')) {
        return cleanUrl.replace('/video/upload/', `/video/upload/${trans}/`);
      } else if (cleanUrl.includes('/upload/')) {
        return cleanUrl.replace('/upload/', `/upload/${trans}/`);
      }

      return cleanUrl;
    } catch (e) {
      console.warn('[CanvasRenderer] buildCloudinaryVideoUrl notice:', e);
      return null;
    }
  }

  /**
   * Render a personalized video with user photo overlay.
   * - Uses high-speed Cloudinary server compositing when available (0 lag, full 10s/20s duration, pure MP4).
   * - Fallback to in-viewport real-time canvas recorder when offline/local.
   */
  static async renderVideoWithOverlay(
    template: Template,
    userPhotoUrl: string,
    onProgress?: (progress: number) => void
  ): Promise<string> {
    const filename = `craft-ai-${template.category || 'story'}-${Date.now()}.mp4`;

    // 1. High-speed Cloudinary Server Compositing (Zero client lag, full duration, genuine MP4)
    const cldUrl = this.buildCloudinaryVideoUrl(template, userPhotoUrl, filename);
    if (cldUrl) {
      if (onProgress) {
        onProgress(35);
        setTimeout(() => onProgress && onProgress(75), 120);
        setTimeout(() => onProgress && onProgress(100), 250);
      }
      return cldUrl;
    }

    // 2. Client-side Canvas Fallback for non-Cloudinary / offline media
    return new Promise(async (resolve) => {
      let videoEl: HTMLVideoElement | null = null;
      let audioCtx: AudioContext | null = null;
      let vfcHandle: number | null = null;
      let rafHandle: number | null = null;
      let safetyTimeout: any = null;

      try {
        const videoSrc = template.videoUrl || template.assetUrl;
        if (!videoSrc) {
          resolve(template.assetUrl || template.thumbnailUrl);
          return;
        }

        // Load user photo in advance
        let userImg: HTMLImageElement | null = null;
        if (userPhotoUrl) {
          try {
            userImg = await this.loadImage(userPhotoUrl);
          } catch (e) {
            console.warn('Could not load user photo for video overlay:', e);
          }
        }

        // Create and prepare video element
        videoEl = document.createElement('video');
        videoEl.crossOrigin = 'anonymous';
        videoEl.src = videoSrc;
        videoEl.muted = false;
        videoEl.volume = 1.0;
        videoEl.playsInline = true;
        videoEl.preload = 'auto';

        // Keep inside viewport with tiny opacity so Chromium media pipeline never throttles after 4s
        videoEl.style.position = 'fixed';
        videoEl.style.bottom = '0px';
        videoEl.style.right = '0px';
        videoEl.style.width = '320px';
        videoEl.style.height = '180px';
        videoEl.style.opacity = '0.001';
        videoEl.style.pointerEvents = 'none';
        videoEl.style.zIndex = '-9999';
        document.body.appendChild(videoEl);

        // Wait for video metadata & duration
        await new Promise<void>((res, rej) => {
          if (videoEl!.readyState >= 2 && isFinite(videoEl!.duration) && videoEl!.duration > 0) {
            res();
            return;
          }
          const onMeta = () => {
            if (isFinite(videoEl!.duration) && videoEl!.duration > 0) {
              cleanup();
              res();
            }
          };
          const onErr = (e: any) => {
            cleanup();
            rej(e);
          };
          const cleanup = () => {
            videoEl?.removeEventListener('loadedmetadata', onMeta);
            videoEl?.removeEventListener('loadeddata', onMeta);
            videoEl?.removeEventListener('canplay', onMeta);
            videoEl?.removeEventListener('canplaythrough', onMeta);
            videoEl?.removeEventListener('error', onErr);
          };
          videoEl?.addEventListener('loadedmetadata', onMeta);
          videoEl?.addEventListener('loadeddata', onMeta);
          videoEl?.addEventListener('canplay', onMeta);
          videoEl?.addEventListener('canplaythrough', onMeta);
          videoEl?.addEventListener('error', onErr);
          setTimeout(() => {
            cleanup();
            res();
          }, 3000);
        });

        // Determine accurate target duration
        let targetDuration = videoEl.duration;
        if (!isFinite(targetDuration) || isNaN(targetDuration) || targetDuration <= 0) {
          targetDuration = template.duration && template.duration > 0 ? template.duration : 15;
        }

        // Setup rendering canvas (standard 1080x1920 9:16)
        const width = 1080;
        const height = 1920;
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx || typeof MediaRecorder === 'undefined' || !canvas.captureStream) {
          if (videoEl && document.body.contains(videoEl)) document.body.removeChild(videoEl);
          resolve(videoSrc);
          return;
        }

        // Pre-render overlay once
        const overlayCanvas = this.createVideoOverlayCanvas(
          width,
          height,
          template.subjectSlot,
          userImg
        );

        // Visual Stream from Canvas (30 FPS)
        const canvasStream = canvas.captureStream(30);

        // Audio Capture
        let audioTracks: MediaStreamTrack[] = [];
        try {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContextClass) {
            audioCtx = new AudioContextClass();
            if (audioCtx.state === 'suspended') {
              await audioCtx.resume();
            }
            const source = audioCtx.createMediaElementSource(videoEl);
            const destination = audioCtx.createMediaStreamDestination();
            source.connect(destination);
            audioTracks = destination.stream.getAudioTracks();
          }
        } catch (waErr) {
          console.warn('WebAudio capture notice:', waErr);
        }

        if (!audioTracks || audioTracks.length === 0) {
          try {
            const captureFn = (videoEl as any).captureStream || (videoEl as any).mozCaptureStream;
            if (typeof captureFn === 'function') {
              const vs = captureFn.call(videoEl);
              if (vs && vs.getAudioTracks().length > 0) {
                audioTracks = vs.getAudioTracks();
              }
            }
          } catch {}
        }

        const combinedTracks = [
          ...canvasStream.getVideoTracks(),
          ...audioTracks,
        ];
        const combinedStream = new MediaStream(combinedTracks);

        // Select optimal recording codec (Prefer genuine MP4)
        const supportedMimes = [
          'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
          'video/mp4;codecs=avc1',
          'video/mp4',
          'video/webm;codecs=h264,opus',
          'video/webm;codecs=vp9,opus',
          'video/webm;codecs=vp8,opus',
          'video/webm',
        ];

        let mimeType = '';
        for (const m of supportedMimes) {
          if (MediaRecorder.isTypeSupported(m)) {
            mimeType = m;
            break;
          }
        }

        const recorder = new MediaRecorder(combinedStream, {
          ...(mimeType ? { mimeType } : {}),
          videoBitsPerSecond: 6000000,
          ...(audioTracks.length > 0 ? { audioBitsPerSecond: 128000 } : {}),
        });

        const chunks: Blob[] = [];
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) chunks.push(e.data);
        };

        let isFinished = false;
        const finishRecording = () => {
          if (isFinished) return;
          isFinished = true;

          if (safetyTimeout) clearTimeout(safetyTimeout);

          if (vfcHandle !== null && 'cancelVideoFrameCallback' in (videoEl as any)) {
            try {
              (videoEl as any).cancelVideoFrameCallback(vfcHandle);
            } catch {}
          }
          if (rafHandle !== null) {
            cancelAnimationFrame(rafHandle);
          }

          if (videoEl) {
            videoEl.pause();
            if (document.body.contains(videoEl)) {
              document.body.removeChild(videoEl);
            }
          }

          if (onProgress) onProgress(100);

          try {
            if (recorder.state === 'recording') {
              recorder.stop();
            }
          } catch {}

          if (audioCtx && audioCtx.state !== 'closed') {
            audioCtx.close().catch(() => {});
          }
        };

        recorder.onstop = () => {
          const finalMime = mimeType || 'video/mp4';
          const blob = new Blob(chunks, { type: finalMime });
          const url = URL.createObjectURL(blob);
          resolve(url);
        };

        // Prime video at timestamp 0 and render initial frame
        videoEl.currentTime = 0;
        await new Promise<void>((r) => {
          if (videoEl!.currentTime === 0) {
            r();
            return;
          }
          const onSeek = () => {
            videoEl?.removeEventListener('seeked', onSeek);
            r();
          };
          videoEl?.addEventListener('seeked', onSeek);
          setTimeout(r, 200);
        });

        const drawSingleFrame = () => {
          if (!videoEl || !ctx) return;
          const vW = videoEl.videoWidth || width;
          const vH = videoEl.videoHeight || height;
          const videoAspect = vW / vH;
          const targetAspect = width / height;

          let renderW = width;
          let renderH = height;
          let renderX = 0;
          let renderY = 0;

          if (videoAspect > targetAspect) {
            renderW = height * videoAspect;
            renderX = (width - renderW) / 2;
          } else {
            renderH = width / videoAspect;
            renderY = (height - renderH) / 2;
          }

          ctx.drawImage(videoEl, renderX, renderY, renderW, renderH);
          if (userImg) {
            ctx.drawImage(overlayCanvas, 0, 0);
          }
        };

        drawSingleFrame();

        const playPromise = videoEl.play();
        await new Promise<void>((res) => {
          const onPlaying = () => {
            videoEl?.removeEventListener('playing', onPlaying);
            res();
          };
          videoEl?.addEventListener('playing', onPlaying);
          playPromise.catch(() => res());
          setTimeout(res, 400);
        });

        recorder.start(100);

        let lastReportedProgress = -1;
        const loop = () => {
          if (isFinished || !videoEl) return;

          // Accurately verify that video has reached the full duration before finishing
          if (
            videoEl.currentTime >= targetDuration - 0.1 ||
            (videoEl.ended && videoEl.currentTime >= (targetDuration > 0 ? targetDuration * 0.9 : 3))
          ) {
            finishRecording();
            return;
          }

          try {
            drawSingleFrame();

            if (onProgress && targetDuration > 0) {
              const pct = Math.min(99, Math.floor((videoEl.currentTime / targetDuration) * 100));
              if (pct !== lastReportedProgress) {
                lastReportedProgress = pct;
                onProgress(pct);
              }
            }
          } catch (drawErr) {
            console.warn('Frame render notice:', drawErr);
          }

          if ('requestVideoFrameCallback' in videoEl) {
            vfcHandle = (videoEl as any).requestVideoFrameCallback(loop);
          } else {
            rafHandle = requestAnimationFrame(loop);
          }
        };

        videoEl.onended = () => {
          if (videoEl && videoEl.currentTime >= (targetDuration > 0 ? targetDuration * 0.9 : 3)) {
            finishRecording();
          }
        };

        if ('requestVideoFrameCallback' in videoEl) {
          vfcHandle = (videoEl as any).requestVideoFrameCallback(loop);
        } else {
          rafHandle = requestAnimationFrame(loop);
        }

        // Safety Timeout: duration + 6 seconds margin
        safetyTimeout = setTimeout(() => {
          finishRecording();
        }, (targetDuration + 6) * 1000);

      } catch (err) {
        console.warn('Video rendering fallback:', err);
        if (videoEl && document.body.contains(videoEl)) {
          document.body.removeChild(videoEl);
        }
        if (audioCtx && audioCtx.state !== 'closed') {
          audioCtx.close().catch(() => {});
        }
        resolve(template.videoUrl || template.assetUrl || template.thumbnailUrl);
      }
    });
  }

  /**
   * Trigger automatic browser file download safely without navigating away or showing blank screen.
   * - Videos (.mp4): Native attachment download with pure MP4 stream (never .mov, zero lag).
   * - Images (.png): Original canvas blob download logic (100% UNCHANGED).
   */
  static async downloadDataUrl(dataUrlOrUrl: string, filename: string = 'craft-ai-story.png'): Promise<void> {
    try {
      // 1. Data URL (Base64) -> Convert to Blob and trigger download (unchanged for images)
      if (dataUrlOrUrl.startsWith('data:')) {
        const blob = this.dataUrlToBlob(dataUrlOrUrl);
        this.downloadBlob(blob, filename);
        return;
      }

      // 2. Blob URL -> Trigger download directly
      if (dataUrlOrUrl.startsWith('blob:')) {
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = dataUrlOrUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          if (document.body.contains(a)) document.body.removeChild(a);
        }, 1500);
        return;
      }

      // 3. For video downloads (.mp4) from remote CDN (Cloudinary / direct)
      if (filename.toLowerCase().endsWith('.mp4') && (dataUrlOrUrl.startsWith('http://') || dataUrlOrUrl.startsWith('https://'))) {
        let finalVideoUrl = dataUrlOrUrl;

        // Ensure Cloudinary URLs include fl_attachment and target .mp4
        if (finalVideoUrl.includes('res.cloudinary.com')) {
          finalVideoUrl = finalVideoUrl.replace(/\.(mov|MOV|webm|avi|mkv|flv)$/i, '.mp4');
          if (!finalVideoUrl.includes('fl_attachment')) {
            const cleanName = filename.replace(/\.(mp4|mov|webm)$/i, '').replace(/[^a-zA-Z0-9_-]/g, '_');
            const attachFlag = `fl_attachment:${cleanName},f_mp4,vc_h264,ac_aac`;
            if (finalVideoUrl.includes('/video/upload/')) {
              finalVideoUrl = finalVideoUrl.replace('/video/upload/', `/video/upload/${attachFlag}/`);
            } else if (finalVideoUrl.includes('/upload/')) {
              finalVideoUrl = finalVideoUrl.replace('/upload/', `/upload/${attachFlag}/`);
            }
          }
        }

        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = finalVideoUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          if (document.body.contains(a)) document.body.removeChild(a);
        }, 2000);
        return;
      }

      // 4. Remote HTTP/HTTPS URL for Images -> Fetch as blob (Unchanged for images!)
      try {
        const res = await fetch(dataUrlOrUrl, { mode: 'cors' });
        if (res.ok) {
          const blob = await res.blob();
          this.downloadBlob(blob, filename);
          return;
        }
      } catch {}

      // 5. Fallback via backend proxy download endpoint (Unchanged for images!)
      const apiBase = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL)
        ? import.meta.env.VITE_API_BASE_URL
        : 'http://localhost:5000/api';
      const proxyDownloadUrl = `${apiBase}/upload/proxy-download?url=${encodeURIComponent(dataUrlOrUrl)}&filename=${encodeURIComponent(filename)}`;

      try {
        const res = await fetch(proxyDownloadUrl);
        if (res.ok) {
          const blob = await res.blob();
          this.downloadBlob(blob, filename);
          return;
        }
      } catch {}

      // 6. Ultimate fallback: hidden iframe
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = proxyDownloadUrl;
      document.body.appendChild(iframe);
      setTimeout(() => {
        if (document.body.contains(iframe)) document.body.removeChild(iframe);
      }, 5000);
    } catch (e) {
      console.warn('Download error handled:', e);
    }
  }
}


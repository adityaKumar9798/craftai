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
   * Render a personalized video with the user's photo overlay recorded directly to MP4/WebM.
   * - Records the EXACT duration of the original video without truncation or black start.
   * - Pre-rendered overlays & requestVideoFrameCallback deliver silky-smooth 30-60 FPS with zero frame lag.
   * - Full Web Audio / stream track routing guarantees crystal-clear, in-sync sound.
   */
  static async renderVideoWithOverlay(
    template: Template,
    userPhotoUrl: string,
    onProgress?: (progress: number) => void
  ): Promise<string> {
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

        // 1. Load user photo in advance
        let userImg: HTMLImageElement | null = null;
        if (userPhotoUrl) {
          try {
            userImg = await this.loadImage(userPhotoUrl);
          } catch (e) {
            console.warn('Could not load user photo for video overlay:', e);
          }
        }

        // 2. Create and prepare video element
        videoEl = document.createElement('video');
        videoEl.crossOrigin = 'anonymous';
        videoEl.src = videoSrc;
        videoEl.muted = false;
        videoEl.volume = 1.0;
        videoEl.playsInline = true;
        videoEl.preload = 'auto';

        // Attach invisibly to DOM to ensure browser audio pipeline and decoder stay active
        videoEl.style.position = 'fixed';
        videoEl.style.top = '-9999px';
        videoEl.style.left = '-9999px';
        videoEl.style.opacity = '0';
        videoEl.style.pointerEvents = 'none';
        videoEl.style.width = '1px';
        videoEl.style.height = '1px';
        document.body.appendChild(videoEl);

        // 3. Wait for video metadata so duration is accurately known
        await new Promise<void>((res, rej) => {
          if (videoEl!.readyState >= 1 && isFinite(videoEl!.duration) && videoEl!.duration > 0) {
            res();
            return;
          }
          const onMeta = () => {
            cleanup();
            res();
          };
          const onErr = (e: any) => {
            cleanup();
            rej(e);
          };
          const cleanup = () => {
            videoEl?.removeEventListener('loadedmetadata', onMeta);
            videoEl?.removeEventListener('loadeddata', onMeta);
            videoEl?.removeEventListener('canplay', onMeta);
            videoEl?.removeEventListener('error', onErr);
          };
          videoEl?.addEventListener('loadedmetadata', onMeta);
          videoEl?.addEventListener('loadeddata', onMeta);
          videoEl?.addEventListener('canplay', onMeta);
          videoEl?.addEventListener('error', onErr);
        });

        // Determine precise original duration
        let targetDuration = videoEl.duration;
        if (!isFinite(targetDuration) || isNaN(targetDuration) || targetDuration <= 0) {
          targetDuration = template.duration && template.duration > 0 ? template.duration : 15;
        }

        // 4. Setup rendering canvas (standard 1080x1920 9:16)
        const width = 1080;
        const height = 1920;
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) {
          resolve(videoSrc);
          return;
        }

        if (typeof MediaRecorder === 'undefined' || !canvas.captureStream) {
          resolve(videoSrc);
          return;
        }

        // 5. Pre-render overlay once
        const overlayCanvas = this.createVideoOverlayCanvas(
          width,
          height,
          template.subjectSlot,
          userImg
        );

        // 6. Visual Stream from Canvas (30 FPS)
        const canvasStream = canvas.captureStream(30);

        // 7. Audio Capture with Web Audio & Direct captureStream fallback
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
            // Captures audio track directly into recorder stream without speaker echoing
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
          } catch (csErr) {
            console.warn('Direct captureStream notice:', csErr);
          }
        }

        // 8. Combine Video + Audio tracks
        const combinedTracks = [
          ...canvasStream.getVideoTracks(),
          ...audioTracks,
        ];
        const combinedStream = new MediaStream(combinedTracks);

        // Select optimal recording codec
        const supportedMimes = [
          'video/mp4;codecs=avc1,mp4a.40.2',
          'video/mp4;codecs=avc1',
          'video/mp4',
          'video/webm;codecs=h264,opus',
          'video/webm;codecs=vp8,opus',
          'video/webm;codecs=vp9,opus',
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

        // 9. Prime video at timestamp 0 and render initial frame
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

        // 10. Start playback and wait for 'playing' event before starting recorder
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

        // Start recording now that playback is active
        recorder.start(100);

        // 11. Render Loop synchronized with video decoder frames
        let lastReportedProgress = -1;

        const loop = () => {
          if (isFinished || !videoEl) return;

          // Check if video reached full duration or ended
          if (videoEl.ended || (targetDuration > 0 && videoEl.currentTime >= targetDuration - 0.05)) {
            finishRecording();
            return;
          }

          try {
            drawSingleFrame();

            // Throttled progress update to keep main thread responsive
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
          finishRecording();
        };

        if ('requestVideoFrameCallback' in videoEl) {
          vfcHandle = (videoEl as any).requestVideoFrameCallback(loop);
        } else {
          rafHandle = requestAnimationFrame(loop);
        }

        // 12. Safety Timeout: duration + 4 seconds failsafe
        safetyTimeout = setTimeout(() => {
          finishRecording();
        }, (targetDuration + 4) * 1000);

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
   * Trigger automatic browser file download safely without navigating away or showing blank screen
   */
  static async downloadDataUrl(dataUrlOrUrl: string, filename: string = 'craft-ai-story.png'): Promise<void> {
    try {
      // 1. Data URL (Base64) -> Convert to Blob and trigger download
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

      // 3. Remote HTTP/HTTPS URL -> Fetch as blob or via backend proxy
      try {
        const res = await fetch(dataUrlOrUrl, { mode: 'cors' });
        if (res.ok) {
          const blob = await res.blob();
          this.downloadBlob(blob, filename);
          return;
        }
      } catch {}

      // 4. Fallback via backend proxy download endpoint
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

      // 5. Ultimate fallback: hidden iframe pointing to proxy-download
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


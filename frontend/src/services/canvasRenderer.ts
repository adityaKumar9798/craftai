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
   * Render a personalized video with the user's photo overlay recorded directly to MP4/WebM
   * Records the FULL video duration uploaded by admin with seamless frame capture.
   */
  static async renderVideoWithOverlay(
    template: Template,
    userPhotoUrl: string,
    onProgress?: (progress: number) => void
  ): Promise<string> {
    return new Promise(async (resolve) => {
      try {
        const videoSrc = template.videoUrl || template.assetUrl;
        if (!videoSrc) {
          resolve(template.assetUrl || template.thumbnailUrl);
          return;
        }

        const video = document.createElement('video');
        video.crossOrigin = 'anonymous';
        video.src = videoSrc;
        video.muted = false; // Audio enabled for Web Audio / captureStream muxing
        video.volume = 1;
        video.playsInline = true;
        video.preload = 'auto';

        // Load user photo
        let userImg: HTMLImageElement | null = null;
        if (userPhotoUrl) {
          try {
            userImg = await this.loadImage(userPhotoUrl);
          } catch (e) {
            console.warn('Could not load user photo for video overlay:', e);
          }
        }

        const isPostFormat = template.format === 'post';
        const width = 1080;
        const height = isPostFormat ? 1440 : 1920;

        const startRecording = async () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              resolve(videoSrc);
              return;
            }

            if (typeof MediaRecorder === 'undefined' || !canvas.captureStream) {
              resolve(videoSrc);
              return;
            }

            // 1. Visual Stream from Canvas
            const canvasStream = canvas.captureStream(30);

            // 2. Audio Stream from Original Video
            let audioTracks: MediaStreamTrack[] = [];
            let audioCtx: AudioContext | null = null;

            try {
              if ((video as any).captureStream) {
                const vs = (video as any).captureStream();
                audioTracks = vs.getAudioTracks();
              } else if ((video as any).mozCaptureStream) {
                const vs = (video as any).mozCaptureStream();
                audioTracks = vs.getAudioTracks();
              }
            } catch (e) {
              console.warn('Direct captureStream notice:', e);
            }

            if (!audioTracks || audioTracks.length === 0) {
              try {
                const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
                if (AudioContextClass) {
                  audioCtx = new AudioContextClass();
                  const source = audioCtx.createMediaElementSource(video);
                  const destination = audioCtx.createMediaStreamDestination();
                  source.connect(destination);
                  // Routed only to recorder destination stream (silent on speaker while recording)
                  audioTracks = destination.stream.getAudioTracks();
                }
              } catch (e) {
                console.warn('WebAudio capture notice:', e);
              }
            }

            // 3. Combine Video + Audio tracks
            const combinedTracks = [
              ...canvasStream.getVideoTracks(),
              ...audioTracks,
            ];
            const combinedStream = new MediaStream(combinedTracks);

            let mimeType = 'video/mp4';
            if (!MediaRecorder.isTypeSupported('video/mp4')) {
              mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
                ? 'video/webm;codecs=vp9,opus'
                : MediaRecorder.isTypeSupported('video/webm')
                ? 'video/webm'
                : '';
            }

            const recorder = new MediaRecorder(combinedStream, {
              ...(mimeType ? { mimeType } : {}),
              videoBitsPerSecond: 6000000,
            });

            const chunks: Blob[] = [];
            recorder.ondataavailable = (e) => {
              if (e.data && e.data.size > 0) chunks.push(e.data);
            };

            let isFinished = false;
            const finishRecording = () => {
              if (isFinished) return;
              isFinished = true;
              if (onProgress) onProgress(100);
              try {
                if (recorder.state === 'recording') {
                  recorder.stop();
                }
                if (audioCtx && audioCtx.state !== 'closed') {
                  audioCtx.close().catch(() => {});
                }
              } catch {}
            };

            recorder.onstop = () => {
              const blob = new Blob(chunks, { type: mimeType || 'video/mp4' });
              const url = URL.createObjectURL(blob);
              resolve(url);
            };

            // Calculate actual full duration of original uploaded video
            const duration =
              video.duration && !isNaN(video.duration) && isFinite(video.duration) && video.duration > 0
                ? video.duration
                : 15;

            recorder.start(250);
            video.currentTime = 0;

            video.onended = () => {
              finishRecording();
            };

            await video.play().catch((playErr) => {
              console.warn('Video auto-play notice:', playErr);
            });

            const drawFrame = () => {
              if (isFinished) return;

              // Check if original video ended or reached end of duration
              if (video.ended || (duration > 0 && video.currentTime >= duration - 0.05)) {
                finishRecording();
                return;
              }

              try {
                // 1. Draw video frame
                ctx.drawImage(video, 0, 0, width, height);

                // 2. Draw user photo in circular gold slot
                if (userImg) {
                  const circleW = 0.28 * width;
                  const circleRadius = circleW / 2;
                  const centerX = 0.36 * width + circleRadius;
                  const centerY = (isPostFormat ? 0.64 : 0.67) * height + circleRadius;

                  ctx.save();
                  ctx.beginPath();
                  ctx.arc(centerX, centerY, circleRadius, 0, Math.PI * 2);
                  ctx.clip();

                  // Draw user image centered in circle
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

                  // 3. Gold Metallic Border
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
                }

                if (onProgress && duration > 0) {
                  const pct = Math.min(99, Math.round((video.currentTime / duration) * 100));
                  onProgress(pct);
                }
              } catch (drawErr) {
                console.warn('Frame render notice:', drawErr);
              }

              requestAnimationFrame(drawFrame);
            };

            requestAnimationFrame(drawFrame);

            // Safety timeout: full duration + 4 seconds margin
            setTimeout(() => {
              finishRecording();
            }, (duration + 4) * 1000);

          } catch (err) {
            console.warn('Video rendering fallback:', err);
            resolve(videoSrc);
          }
        };

        if (video.readyState >= 2) {
          startRecording();
        } else {
          video.onloadeddata = () => startRecording();
          video.onerror = () => resolve(videoSrc);
        }
      } catch (e) {
        resolve(template.assetUrl || template.thumbnailUrl);
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
      try {
        const proxyUrl = `http://localhost:5000/api/upload/proxy-download?url=${encodeURIComponent(dataUrlOrUrl)}&filename=${encodeURIComponent(filename)}`;
        const res = await fetch(proxyUrl);
        if (res.ok) {
          const blob = await res.blob();
          this.downloadBlob(blob, filename);
          return;
        }
      } catch {}

      // 5. Ultimate fallback: hidden iframe pointing to proxy-download
      const proxyDownloadUrl = `http://localhost:5000/api/upload/proxy-download?url=${encodeURIComponent(dataUrlOrUrl)}&filename=${encodeURIComponent(filename)}`;
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


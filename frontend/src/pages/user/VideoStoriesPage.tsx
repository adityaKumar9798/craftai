import React, { useState } from 'react';
import { Play, Pause, Download, Share2, Heart, X, Info } from 'lucide-react';
import { useCreatives } from '../../contexts/CreativesContext';
import { useAuth } from '../../contexts/AuthContext';
import { Template } from '../../types';
import { ShareModal } from '../../components/modals/ShareModal';
import { CanvasRenderer } from '../../services/canvasRenderer';

export const VideoStoriesPage: React.FC = () => {
  const { templates, isFavorite, toggleFavorite, recordDownload, saveCreation } = useCreatives();
  const { userPhotoUrl } = useAuth();

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedVideo, setSelectedVideo] = useState<Template | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [shareOpen, setShareOpen] = useState<boolean>(false);
  const [downloading, setDownloading] = useState<boolean>(false);
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);

  const videoCategories = [
    { label: 'All', value: 'all' },
    { label: 'Morning', value: 'morning' },
    { label: 'Love', value: 'love' },
    { label: 'Sad', value: 'sad' },
    { label: 'Motivation', value: 'motivation' },
    { label: 'Festival', value: 'festival' },
    { label: 'Trending', value: 'trending' },
  ];

  const videoTemplates = templates.filter((t) => t.type === 'video');

  const filteredVideos = activeCategory === 'all'
    ? videoTemplates
    : videoTemplates.filter((v) => v.category.toLowerCase() === activeCategory.toLowerCase());

  return (
    <div className="space-y-6 select-none">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
          Video Stories
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Cinematic motion stories with dynamic particle effects & animated text
        </p>
      </div>

      {/* Category Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {videoCategories.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setActiveCategory(cat.value)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              activeCategory === cat.value
                ? 'brand-gradient text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Server Rendering Architecture Banner */}
      <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-xs text-blue-900 space-y-1">
          <p className="font-bold">Automated Video Personalization Architecture</p>
          <p className="text-blue-700 leading-relaxed">
            Video templates render high frame-rate motion previews client-side and synchronize with Express + FFmpeg pipeline for 1080x1920 MP4 server-side exports.
          </p>
        </div>
      </div>

      {/* Video Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
        {filteredVideos.map((video) => {
          const favorite = isFavorite(video.id);
          const slot = video.subjectSlot;

          return (
            <div
              key={video.id}
              onClick={() => setSelectedVideo(video)}
              className="group relative cursor-pointer overflow-hidden rounded-2xl bg-gray-900 shadow-md hover:shadow-xl transition-all duration-300 aspect-[9/16]"
            >
              {/* Thumbnail / Video Poster */}
              <img
                src={video.assetUrl || video.thumbnailUrl}
                alt={video.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />

              {/* Slot overlay with user photo */}
              <div
                className="absolute overflow-hidden rounded-xl border border-white/70 shadow-lg"
                style={{
                  left: `${slot.x * 100}%`,
                  top: `${slot.y * 100}%`,
                  width: `${slot.width * 100}%`,
                  height: `${slot.height * 100}%`,
                }}
              >
                <img src={userPhotoUrl} alt="Subject" className="w-full h-full object-cover" />
              </div>

              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 pointer-events-none" />

              {/* Play Button Indicator */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 shadow-xl text-purple-600 group-hover:scale-110 transition-transform">
                  <Play className="w-5 h-5 ml-0.5 fill-current" />
                </div>
              </div>

              {/* Top Icons */}
              <div className="absolute top-3 inset-x-3 flex items-center justify-between z-10">
                <span className="px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-md text-[10px] font-bold text-white uppercase">
                  {video.duration || 15}s
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(video.id);
                  }}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-white/80 text-gray-700 hover:bg-white transition"
                >
                  <Heart
                    className={`w-3.5 h-3.5 ${
                      favorite ? 'fill-[#F72585] text-[#F72585]' : 'text-gray-600'
                    }`}
                  />
                </button>
              </div>

              {/* Bottom Title */}
              <div className="absolute bottom-3 inset-x-3 text-center pointer-events-none">
                <p className="text-white text-xs font-bold drop-shadow truncate">
                  {video.headline || video.name}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Video Preview Modal */}
      {selectedVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-sm rounded-3xl bg-gray-950 p-4 shadow-2xl flex flex-col items-center">
            {/* Close Button */}
            <button
              onClick={() => setSelectedVideo(null)}
              className="absolute top-4 right-4 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/80"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Video Player */}
            <div className="relative w-full aspect-[9/16] rounded-2xl overflow-hidden bg-black">
              {selectedVideo.videoUrl ? (
                <video
                  src={selectedVideo.videoUrl}
                  autoPlay
                  loop
                  playsInline
                  controls
                  className="w-full h-full object-cover"
                />
              ) : (
                <img
                  src={selectedVideo.assetUrl}
                  alt={selectedVideo.name}
                  className="w-full h-full object-cover"
                />
              )}

              {/* Composited Photo in Slot */}
              <div
                className="absolute overflow-hidden rounded-xl border border-white/80 shadow-2xl pointer-events-none"
                style={{
                  left: `${selectedVideo.subjectSlot.x * 100}%`,
                  top: `${selectedVideo.subjectSlot.y * 100}%`,
                  width: `${selectedVideo.subjectSlot.width * 100}%`,
                  height: `${selectedVideo.subjectSlot.height * 100}%`,
                }}
              >
                <img src={userPhotoUrl} alt="Composited Subject" className="w-full h-full object-cover" />
              </div>
            </div>

            {/* Controls */}
            <div className="w-full mt-4 flex items-center gap-3">
              <button
                disabled={downloading}
                onClick={async () => {
                  setDownloading(true);
                  setDownloadProgress(1);
                  try {
                    const filename = `craft-ai-${selectedVideo.category}-${Date.now()}.mp4`;
                    let dlUrl = selectedVideo.videoUrl || selectedVideo.assetUrl;

                    if (userPhotoUrl) {
                      try {
                        dlUrl = await CanvasRenderer.renderVideoWithOverlay(
                          selectedVideo,
                          userPhotoUrl,
                          (pct) => setDownloadProgress(pct)
                        );
                      } catch (err) {
                        console.warn('Personalized video render fallback:', err);
                        dlUrl = CanvasRenderer.buildCloudinaryVideoUrl(selectedVideo, userPhotoUrl, filename) ||
                                (selectedVideo.videoUrl || selectedVideo.assetUrl);
                      }
                    } else {
                      // Ensure video without photo overlay is also served as pure H.264 MP4 (never .mov)
                      const cldMp4 = CanvasRenderer.buildCloudinaryVideoUrl(selectedVideo, undefined, filename);
                      if (cldMp4) {
                        dlUrl = cldMp4;
                      } else if (dlUrl) {
                        dlUrl = dlUrl.replace(/\.(mov|MOV|webm|avi|mkv|flv)$/i, '.mp4');
                      }
                    }
                    await CanvasRenderer.downloadDataUrl(dlUrl, filename);
                    await recordDownload({
                      templateId: selectedVideo.id,
                      templateName: selectedVideo.name,
                      category: selectedVideo.category,
                      type: 'video',
                      format: 'story',
                    });
                    saveCreation({
                      templateId: selectedVideo.id,
                      templateName: selectedVideo.name,
                      category: selectedVideo.category,
                      outputUrl: dlUrl,
                      type: 'video',
                    }).catch(() => {});
                  } catch (e) {
                    console.warn('Video download error:', e);
                  } finally {
                    setDownloading(false);
                    setDownloadProgress(null);
                  }
                }}
                className={`flex-1 py-3 rounded-xl brand-gradient text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md ${
                  downloading ? 'opacity-80 cursor-wait' : 'cursor-pointer hover:opacity-95'
                }`}
              >
                <Download className="w-4 h-4" />
                {downloading
                  ? downloadProgress !== null
                    ? `Processing Video (${downloadProgress}%)...`
                    : 'Downloading...'
                  : 'Download Video'}
              </button>

              <button
                onClick={() => setShareOpen(true)}
                className="p-3 rounded-xl bg-gray-800 text-white hover:bg-gray-700 transition"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <ShareModal
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        title={selectedVideo?.name || 'Craft AI Video Story'}
      />
    </div>
  );
};

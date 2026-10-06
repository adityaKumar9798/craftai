import React, { useState, useRef } from 'react';
import { Heart, Crown, Play, Camera, User, Copy, Download, Share2 } from 'lucide-react';
import { Template } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useCreatives } from '../../contexts/CreativesContext';
import { CanvasRenderer } from '../../services/canvasRenderer';

interface StoryCardProps {
  template: Template;
  onClick?: () => void;
  showDetails?: boolean;
}

export const StoryCard: React.FC<StoryCardProps> = ({
  template,
  onClick,
  showDetails = false,
}) => {
  const { userPhotoUrl } = useAuth();
  const { isFavorite, toggleFavorite, saveCreation, recordDownload } = useCreatives();
  const favorite = isFavorite(template.id);
  const [imgFailed, setImgFailed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const isPostFormat = template.format === 'post';
  const isVideo = template.type === 'video' || (template.assetUrl && /\.(mp4|webm|mov|mkv)$/i.test(template.assetUrl));
  const hasValidPhoto = Boolean(userPhotoUrl && userPhotoUrl.trim() && !imgFailed);

  // Strictly enforce exact same clean size & lower position for both posts and 9:16 stories
  const slotLeft = isPostFormat ? '36%' : '36%';
  const slotTop = isPostFormat ? '64%' : '67%';
  const slotWidth = isPostFormat ? '28%' : '28%';

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const commonPhotoSlot = (
    <div
      className="absolute overflow-hidden rounded-full aspect-square border-[2.5px] sm:border-[3px] border-[#E5C158] ring-2 ring-[#B8860B]/70 shadow-[0_6px_20px_rgba(0,0,0,0.55),inset_0_2px_4px_rgba(255,255,255,0.4)] pointer-events-none transition-transform duration-300 group-hover:scale-105 z-10"
      style={{
        left: slotLeft,
        top: slotTop,
        width: slotWidth,
        transform: template.subjectSlot?.rotation ? `rotate(${template.subjectSlot.rotation}deg)` : undefined,
      }}
    >
      {hasValidPhoto ? (
        <img
          src={userPhotoUrl}
          alt=""
          onError={() => setImgFailed(true)}
          className="h-full w-full object-cover rounded-full"
        />
      ) : (
        <div className="h-full w-full flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px] text-amber-200 rounded-full p-1.5 sm:p-2">
          <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-[#F5D061] drop-shadow" />
          <span className="text-[8px] sm:text-[9px] font-bold text-white drop-shadow mt-0.5 tracking-tight">Your Photo</span>
        </div>
      )}
    </div>
  );

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      let downloadUrl = template.assetUrl || template.thumbnailUrl;
      if (userPhotoUrl) {
        if (isVideo) {
          try {
            downloadUrl = await CanvasRenderer.renderVideoWithOverlay(template, userPhotoUrl);
          } catch {
            downloadUrl = template.videoUrl || template.assetUrl;
          }
        } else {
          try {
            downloadUrl = await CanvasRenderer.renderStory(template, userPhotoUrl);
          } catch {
            downloadUrl = template.assetUrl || template.thumbnailUrl;
          }
        }
      }

      const ext = isVideo ? 'mp4' : 'png';
      const filename = `craft-ai-${template.category}-${Date.now()}.${ext}`;

      await CanvasRenderer.downloadDataUrl(downloadUrl, filename);
      if (recordDownload) {
        recordDownload(template.id, template.name).catch(() => {});
      }

      saveCreation({
        templateId: template.id,
        templateName: template.name,
        category: template.category,
        outputUrl: downloadUrl,
        type: template.type,
      }).catch(() => {});
    } catch (err) {
      console.warn('StoryCard download notice:', err);
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/template/${template.id}`;
    try {
      navigator.clipboard.writeText(shareUrl);
    } catch {}

    if (navigator.share) {
      navigator.share({ 
        title: template.name, 
        text: template.headline || `Check out this creative on Cardt AI!`,
        url: shareUrl 
      }).catch(() => {
        alert('Share link copied to clipboard!');
      });
    } else {
      alert('Share link copied to clipboard!');
    }
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(template.headline || template.quote || template.name);
    alert('Copied to clipboard!');
  };

  if (isPostFormat) {
    // Determine category styling
    const catColors: Record<string, { bg: string, icon: string }> = {
      love: { bg: 'bg-[#ff5272]', icon: '♥' },
      breakup: { bg: 'bg-[#263650]', icon: '💔' },
      romance: { bg: 'bg-[#e83e9c]', icon: '💕' },
      dhoka: { bg: 'bg-[#d93636]', icon: '🥀' },
      festival: { bg: 'bg-[#ff9d25]', icon: '🎉' },
      motivation: { bg: 'bg-[#2385ed]', icon: '🔥' },
    };
    const style = catColors[template.category.toLowerCase()] || { bg: 'bg-purple-500', icon: '✨' };

    return (
      <div 
        className="w-full overflow-hidden rounded-[13px] bg-white border border-[#e9e9ef] shadow-[0_2px_7px_rgba(0,0,0,0.10)] select-none"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Image / Video Section */}
        <div 
          className="relative w-full aspect-[3/4] overflow-hidden cursor-pointer group bg-gray-900"
          onClick={onClick}
        >
          {isVideo ? (
            <video
              ref={videoRef}
              src={template.videoUrl || template.assetUrl}
              poster={template.thumbnailUrl}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <img
              src={template.assetUrl || template.thumbnailUrl}
              alt={template.name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              loading="lazy"
            />
          )}

          {commonPhotoSlot}

          {/* Category Badge */}
          <div
            className={`absolute top-[8px] left-[8px] px-[9px] py-[4px]
            rounded-full flex items-center gap-[4px]
            text-white text-[9px] font-semibold leading-none
            ${style.bg} z-10`}
          >
            {template.isPremium ? <Crown className="w-2.5 h-2.5 text-amber-200 fill-amber-200" /> : <span>{style.icon}</span>}
            {template.category.toUpperCase()}
          </div>

          {/* Favorite Button */}
          <button
            onClick={(e) => { e.stopPropagation(); toggleFavorite(template.id); }}
            className="absolute top-[7px] right-[7px] w-[29px] h-[29px]
            rounded-full bg-white/95 flex items-center justify-center
            shadow-sm transition hover:scale-110 z-10 cursor-pointer"
          >
            <Heart
              size={16}
              strokeWidth={1.8}
              className={favorite
                ? "fill-red-500 text-red-500"
                : "text-[#526078]"}
            />
          </button>

          {/* Video Play Badge if video */}
          {isVideo && (
            <div className="absolute top-2 right-12 z-10 pointer-events-none">
              <span className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-sm text-[9px] text-white font-bold flex items-center gap-1">
                <Play className="w-2.5 h-2.5 fill-white" /> Video
              </span>
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="px-[9px] pt-[7px] pb-[8px]">
          
          {/* Title + Copy */}
          <div className="flex items-center justify-between gap-1">
            <h3 className="text-[11px] font-semibold text-[#202536]
            leading-[15px] truncate">
              {template.name}
            </h3>

            <button
              onClick={handleCopy}
              className="w-[27px] h-[27px] shrink-0 rounded-[9px]
              bg-[#f8f9fc] hover:bg-gray-100 transition flex items-center justify-center"
            >
              <Copy size={14} className="text-[#77849b]" />
            </button>
          </div>

          {/* Category + Type */}
          <p className="text-[9px] text-[#8490a5] leading-[12px] -mt-[2px] capitalize">
            {template.category} • {template.type}
          </p>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-[6px] mt-[8px]">
            <button
              onClick={handleDownload}
              className="h-[30px] rounded-[9px]
              bg-gradient-to-r from-[#7650ff] to-[#8246ef] hover:opacity-90 transition-opacity
              text-white flex items-center justify-center gap-[5px]
              text-[10px] font-semibold shadow-[0_2px_4px_rgba(117,80,255,0.25)]"
            >
              <Download size={14} strokeWidth={2} />
              Download
            </button>

            <button
              onClick={handleShare}
              className="h-[30px] rounded-[9px]
              bg-gradient-to-r from-[#09bd82] to-[#00c98a] hover:opacity-90 transition-opacity
              text-white flex items-center justify-center gap-[5px]
              text-[10px] font-semibold shadow-[0_2px_4px_rgba(0,190,130,0.2)]"
            >
              <Share2 size={14} strokeWidth={2} />
              Share
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`group relative cursor-pointer overflow-hidden rounded-2xl bg-gray-900 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 aspect-[9/16] select-none border border-gray-100`}
    >
      {/* Background Template Asset (Video or Image) */}
      {isVideo ? (
        <video
          ref={videoRef}
          src={template.videoUrl || template.assetUrl}
          poster={template.thumbnailUrl}
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
      ) : (
        <img
          src={template.assetUrl || template.thumbnailUrl}
          alt={template.name}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
        />
      )}

      {/* Dark & Soft Glow Overlays for Contrast */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 pointer-events-none" />

      {commonPhotoSlot}

      {/* Top Floating Icons: Premium Badge & Favorite Heart */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
        {template.isPremium ? (
          <span className="flex items-center gap-1 rounded-full bg-amber-400/95 px-2.5 py-1 text-[11px] font-bold text-gray-900 shadow-sm backdrop-blur-md">
            <Crown className="w-3 h-3 text-gray-900 fill-gray-900" />
            VIP
          </span>
        ) : (
          <span className="rounded-full bg-black/30 backdrop-blur-md px-2 py-0.5 text-[10px] font-medium text-white/90">
            {template.category.toUpperCase()}
          </span>
        )}

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(template.id);
          }}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/80 backdrop-blur-md text-gray-700 transition hover:bg-white hover:scale-110 shadow-sm cursor-pointer"
          title="Favorite"
        >
          <Heart
            className={`w-4 h-4 transition-colors ${
              favorite ? 'fill-[#F72585] text-[#F72585]' : 'text-gray-600'
            }`}
          />
        </button>
      </div>

      {/* Video Indicator if video story */}
      {isVideo && (
        <div className="absolute top-3 left-16 z-10 pointer-events-none">
          <span className="px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-sm text-[9px] text-white font-bold flex items-center gap-1">
            <Play className="w-2.5 h-2.5 fill-white" /> Video
          </span>
        </div>
      )}

      {/* Template Headline & Subheadline Typography */}
      <div className="absolute top-10 left-2 right-2 text-center pointer-events-none px-1">
        <h3 className="text-white font-black text-base sm:text-lg drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] tracking-tight leading-snug">
          {template.headline || 'Good Morning'}
        </h3>
        {template.subheadline && (
          <p className="text-amber-200 text-[11px] sm:text-xs font-medium drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)] mt-0.5 italic line-clamp-1">
            {template.subheadline}
          </p>
        )}
      </div>

      {/* Bottom Quote / Details */}
      <div className="absolute bottom-3 left-3 right-3 text-center pointer-events-none">
        {template.quote && (
          <p className="text-white/90 text-[11px] font-medium drop-shadow truncate">
            {template.quote}
          </p>
        )}
        {showDetails && (
          <p className="text-white/70 text-[10px] mt-0.5">
            Tap to customize
          </p>
        )}
      </div>
    </div>
  );
};

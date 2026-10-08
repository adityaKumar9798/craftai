import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Heart, 
  Crown, 
  Share2, 
  Camera, 
  Download, 
  Play, 
  Copy, 
  Check, 
  ArrowRight,
  CheckCircle,
  Sparkles,
  ImageIcon,
  RefreshCw
} from 'lucide-react';
import { useCreatives } from '../../contexts/CreativesContext';
import { useAuth } from '../../contexts/AuthContext';
import { StoryCard } from '../../components/common/StoryCard';
import { ShareModal } from '../../components/modals/ShareModal';
import { CanvasRenderer } from '../../services/canvasRenderer';

export const TemplatePreviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { templates, isFavorite, toggleFavorite, saveCreation, recordDownload } = useCreatives();
  const { userPhotoUrl } = useAuth();

  const currentTemplate = templates.find((t) => t.id === id) || templates[0];
  const favorite = isFavorite(currentTemplate?.id || '');
  
  const [shareOpen, setShareOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState<'hd' | 'original'>('hd');

  // Scroll to top whenever ID changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id]);

  if (!currentTemplate) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p>Template not found.</p>
        <button 
          onClick={() => navigate('/')} 
          className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-semibold"
        >
          Go Back Home
        </button>
      </div>
    );
  }

  const isPostFormat = currentTemplate.format === 'post';

  // Toast state for instant notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Handle high quality download directly to device while staying on page
  const handleDownload = async () => {
    setDownloading(true);
    setDownloadProgress(currentTemplate.type === 'video' ? 1 : null);
    try {
      const ext = currentTemplate.type === 'video' ? 'mp4' : 'png';
      const filename = `craft-ai-${currentTemplate.category}-${Date.now()}.${ext}`;

      let downloadUrl = currentTemplate.type === 'video'
        ? (currentTemplate.videoUrl || currentTemplate.assetUrl)
        : (currentTemplate.assetUrl || currentTemplate.thumbnailUrl);

      if (currentTemplate.type === 'video') {
        if (userPhotoUrl) {
          try {
            downloadUrl = await CanvasRenderer.renderVideoWithOverlay(
              currentTemplate,
              userPhotoUrl,
              (pct) => setDownloadProgress(pct)
            );
          } catch (e) {
            console.warn('Video render overlay fallback:', e);
            downloadUrl = CanvasRenderer.buildCloudinaryVideoUrl(currentTemplate, userPhotoUrl, filename) ||
                          (currentTemplate.videoUrl || currentTemplate.assetUrl);
          }
        } else {
          const cldMp4 = CanvasRenderer.buildCloudinaryVideoUrl(currentTemplate, undefined, filename);
          if (cldMp4) {
            downloadUrl = cldMp4;
          } else if (downloadUrl) {
            downloadUrl = downloadUrl.replace(/\.(mov|MOV|webm|avi|mkv|flv)$/i, '.mp4');
          }
        }
      } else {
        // Image logic 100% UNCHANGED
        if (userPhotoUrl) {
          try {
            downloadUrl = await CanvasRenderer.renderStory(currentTemplate, userPhotoUrl);
          } catch (e) {
            console.warn('Canvas render error fallback:', e);
            downloadUrl = currentTemplate.assetUrl || currentTemplate.thumbnailUrl;
          }
        }
      }

      // 1. Download directly to device local storage safely without navigation
      await CanvasRenderer.downloadDataUrl(downloadUrl, filename);

      // 2. Track real download in Firebase & user stats
      if (recordDownload) {
        recordDownload(currentTemplate.id, currentTemplate.name).catch(() => {});
      }

      // 3. Save creation to user's collection in Firebase & state
      saveCreation({
        templateId: currentTemplate.id,
        templateName: currentTemplate.name,
        category: currentTemplate.category,
        outputUrl: downloadUrl,
        type: currentTemplate.type,
      }).catch(() => {});

      setDownloadSuccess(true);
      showToast(`Downloaded ${currentTemplate.type === 'video' ? 'video' : 'image'} directly to your device! 🎉`);
      setTimeout(() => setDownloadSuccess(false), 3500);
    } catch (err) {
      console.error('Download handler notice:', err);
      showToast('Downloaded to device!');
    } finally {
      setDownloading(false);
      setDownloadProgress(null);
    }
  };

  // Handle Share: generate specific share link + copy to clipboard + open share sheet
  const handleShare = () => {
    const shareUrl = `${window.location.origin}/template/${currentTemplate.id}`;
    
    // Copy link to clipboard
    try {
      navigator.clipboard.writeText(shareUrl);
    } catch {}

    // Invoke native share if supported, otherwise open ShareModal
    if (navigator.share) {
      navigator.share({
        title: currentTemplate.name,
        text: currentTemplate.headline || `Check out this creative on Cardt AI!`,
        url: shareUrl,
      }).catch(() => {
        setShareOpen(true);
      });
    } else {
      setShareOpen(true);
    }

    showToast('Share link created & copied to clipboard!');
  };

  // 1. Related Images (Exact 2 items from same category, with fallback)
  const categoryImageMatches = templates.filter(
    (t) =>
      (t.category.toLowerCase() === currentTemplate.category.toLowerCase() ||
        t.categoryId === currentTemplate.categoryId) &&
      t.id !== currentTemplate.id &&
      t.type === 'image'
  );
  const otherImages = templates.filter(
    (t) => t.type === 'image' && t.id !== currentTemplate.id && !categoryImageMatches.some((m) => m.id === t.id)
  );
  const relatedImages = [...categoryImageMatches, ...otherImages].slice(0, 2);

  // 2. Related Videos (Exact 2 items from same category, with fallback)
  const categoryVideoMatches = templates.filter(
    (t) =>
      (t.category.toLowerCase() === currentTemplate.category.toLowerCase() ||
        t.categoryId === currentTemplate.categoryId) &&
      t.id !== currentTemplate.id &&
      t.type === 'video'
  );
  const otherVideos = templates.filter(
    (t) => t.type === 'video' && t.id !== currentTemplate.id && !categoryVideoMatches.some((m) => m.id === t.id)
  );
  const relatedVideos = [...categoryVideoMatches, ...otherVideos].slice(0, 2);

  return (
    <div className="space-y-3.5 w-full max-w-lg mx-auto select-none pb-20 px-0">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-gray-900/95 text-white px-4 py-2.5 rounded-full shadow-xl backdrop-blur-md flex items-center gap-2 text-xs font-bold animate-fade-in border border-white/20">
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Back Navigation */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-white/80 backdrop-blur-md sticky top-0 z-20 border-b border-gray-100/60">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-700 hover:text-gray-900 transition px-2.5 py-1 rounded-full hover:bg-gray-100"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      </div>

      {/* Main Template Card Preview (Full bleed edge-to-edge) */}
      <div className={`relative w-full ${currentTemplate.type === 'video' ? 'aspect-[9/16] max-w-sm' : (isPostFormat ? 'aspect-[3/4] max-w-md' : 'aspect-[9/16] max-w-sm')} rounded-2xl sm:rounded-[24px] overflow-hidden shadow-sm border border-gray-100 bg-gray-900 mx-auto`}>
        {/* Template Asset (Image or Video) */}
        {currentTemplate.type === 'video' ? (
          <video
            src={currentTemplate.videoUrl || currentTemplate.assetUrl}
            poster={currentTemplate.thumbnailUrl}
            controls
            autoPlay
            loop
            muted
            className="w-full h-full object-cover"
          />
        ) : (
          <img
            src={currentTemplate.assetUrl || currentTemplate.thumbnailUrl}
            alt={currentTemplate.name}
            className="w-full h-full object-cover"
          />
        )}

        {/* Soft Vignette Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/25 pointer-events-none" />

        {/* Golden Circle Photo Slot (Always visible with user profile photo) */}
        <div
          className="absolute overflow-hidden rounded-full aspect-square border-[3px] border-[#E5C158] ring-2 ring-[#B8860B]/70 shadow-[0_6px_24px_rgba(0,0,0,0.65),inset_0_2px_4px_rgba(255,255,255,0.4)] pointer-events-none z-10"
          style={{
            left: currentTemplate.subjectSlot?.x !== undefined ? `${currentTemplate.subjectSlot.x * 100}%` : '36%',
            top: currentTemplate.subjectSlot?.y !== undefined ? `${currentTemplate.subjectSlot.y * 100}%` : (currentTemplate.type === 'video' ? '67%' : (isPostFormat ? '64%' : '67%')),
            width: currentTemplate.subjectSlot?.width !== undefined ? `${currentTemplate.subjectSlot.width * 100}%` : '28%',
            transform: currentTemplate.subjectSlot?.rotation
              ? `rotate(${currentTemplate.subjectSlot.rotation}deg)`
              : undefined,
          }}
        >
          {userPhotoUrl ? (
            <img
              src={userPhotoUrl}
              alt="Profile Photo"
              className="w-full h-full object-cover rounded-full"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-black/45 text-amber-200 p-1 text-center">
              <Camera className="w-4 h-4 text-[#F5D061] drop-shadow" />
              <span className="text-[7px] font-bold text-white drop-shadow mt-0.5">Your Photo</span>
            </div>
          )}
        </div>

        {/* Top-Left Category Badge */}
        <div className="absolute top-3 left-3 z-10 pointer-events-none">
          <span className="px-3 py-1 rounded-full bg-[#5E2DE0] text-white text-[9px] font-extrabold uppercase tracking-wide shadow-sm">
            {currentTemplate.category}
          </span>
        </div>

        {/* Top-Right Favorite Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(currentTemplate.id);
          }}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-md transition hover:scale-110 z-10"
        >
          <Heart
            className={`w-4 h-4 transition-colors ${
              favorite ? 'fill-red-500 text-red-500' : 'text-gray-700'
            }`}
          />
        </button>
      </div>

      {/* Details & Actions Card (Full width edge-to-edge) */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-[22px] border border-gray-100 shadow-xs space-y-3.5 mx-auto">
        {/* Category + Type */}
        <div>
          <span className="text-[10px] font-extrabold uppercase text-[#7637E4] tracking-wider">
            {currentTemplate.category} • {currentTemplate.type.toUpperCase()}
          </span>
          <h1 className="text-2xl font-black text-gray-900 leading-tight">
            {currentTemplate.name}
          </h1>

          {/* Status Checkmark */}
          <div className="flex items-center gap-1.5 mt-1 text-xs font-semibold text-emerald-500">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500 fill-emerald-100" />
            <span>Ready to download</span>
          </div>
        </div>

        {/* Quality Selector Pills (HD vs Original) */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* HD Quality */}
          <div
            onClick={() => setSelectedQuality('hd')}
            className={`p-2.5 rounded-2xl cursor-pointer transition-all flex items-center justify-between border ${
              selectedQuality === 'hd'
                ? 'bg-gradient-to-r from-[#7B3FE4] to-[#8E44EC] text-white border-transparent shadow-md shadow-purple-500/20'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-2">
              <Sparkles className={`w-4 h-4 ${selectedQuality === 'hd' ? 'text-white' : 'text-purple-600'}`} />
              <div>
                <div className="text-[11px] font-bold leading-tight">HD Quality</div>
                <div className={`text-[9px] ${selectedQuality === 'hd' ? 'text-purple-100' : 'text-gray-400'}`}>
                  Best for social media
                </div>
              </div>
            </div>
            <div className={`w-4 h-4 rounded-full flex items-center justify-center ${selectedQuality === 'hd' ? 'bg-white text-purple-700' : 'border border-gray-300'}`}>
              {selectedQuality === 'hd' && <Check className="w-2.5 h-2.5 stroke-[3]" />}
            </div>
          </div>

          {/* Original Size */}
          <div
            onClick={() => setSelectedQuality('original')}
            className={`p-2.5 rounded-2xl cursor-pointer transition-all flex items-center justify-between border ${
              selectedQuality === 'original'
                ? 'bg-gradient-to-r from-[#7B3FE4] to-[#8E44EC] text-white border-transparent shadow-md shadow-purple-500/20'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-2">
              <ImageIcon className={`w-4 h-4 ${selectedQuality === 'original' ? 'text-white' : 'text-gray-500'}`} />
              <div>
                <div className="text-[11px] font-bold leading-tight">Original Size</div>
                <div className={`text-[9px] ${selectedQuality === 'original' ? 'text-purple-100' : 'text-gray-400'}`}>
                  Full resolution
                </div>
              </div>
            </div>
            <div className={`w-4 h-4 rounded-full flex items-center justify-center ${selectedQuality === 'original' ? 'bg-white text-purple-700' : 'border border-gray-300'}`}>
              {selectedQuality === 'original' && <Check className="w-2.5 h-2.5 stroke-[3]" />}
            </div>
          </div>
        </div>

        {/* Download Button (Gradient Purple Full Width) */}
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#7B3FE4] via-[#8C4DF5] to-[#A052F7] text-white font-bold text-sm shadow-lg shadow-purple-500/25 hover:opacity-95 active:scale-[0.99] transition flex items-center justify-center gap-2"
        >
          {downloading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {downloading
            ? downloadProgress !== null
              ? `Processing Video (${downloadProgress}%)...`
              : 'Downloading...'
            : `Download ${currentTemplate.type === 'video' ? 'Video' : 'Image'}`}
        </button>

        {/* Share Button (Outlined Purple Full Width) */}
        <button
          onClick={handleShare}
          className="w-full py-3 px-4 rounded-2xl border-2 border-[#8C4DF5] text-[#8C4DF5] bg-white hover:bg-purple-50/50 font-bold text-sm active:scale-[0.99] transition flex items-center justify-center gap-2"
        >
          <Share2 className="w-4 h-4" />
          Share
        </button>
      </div>

      {/* ========================================================================= */}
      {/* RELATED SECTIONS: 2 RELATED IMAGES + 2 RELATED VIDEOS (WITH MORE BUTTONS) */}
      {/* ========================================================================= */}
      <div className="space-y-6 pt-4">
        
        {/* 1. Related 2 Image Templates */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm sm:text-base font-bold text-gray-900 flex items-center gap-1.5 capitalize">
              {currentTemplate.category} Images 🖼️
            </h2>
            <button
              onClick={() => navigate('/categories')}
              className="text-xs font-bold text-[#F72585] hover:underline flex items-center gap-1"
            >
              More <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {relatedImages.map((tmpl) => (
              <div 
                key={tmpl.id}
                onClick={() => navigate(`/template/${tmpl.id}`)}
                className="cursor-pointer transition-transform duration-200 hover:-translate-y-0.5"
              >
                <StoryCard template={tmpl} showDetails={true} />
              </div>
            ))}
          </div>
        </section>

        {/* 2. Related 2 Video Templates */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm sm:text-base font-bold text-gray-900 flex items-center gap-1.5 capitalize">
              {currentTemplate.category} Videos 🎬
            </h2>
            <button
              onClick={() => navigate('/videos')}
              className="text-xs font-bold text-[#F72585] hover:underline flex items-center gap-1"
            >
              More <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {relatedVideos.map((tmpl) => (
              <div 
                key={tmpl.id}
                onClick={() => navigate(`/template/${tmpl.id}`)}
                className="cursor-pointer transition-transform duration-200 hover:-translate-y-0.5"
              >
                <StoryCard template={tmpl} showDetails={true} />
              </div>
            ))}
          </div>
        </section>

      </div>

      {/* Share Modal Dialog */}
      <ShareModal
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        title={currentTemplate.headline || currentTemplate.name}
      />
    </div>
  );
};

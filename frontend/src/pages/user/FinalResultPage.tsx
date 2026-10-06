import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Download,
  Share2,
  Sliders,
  Camera,
  Eye,
  PlusCircle,
  CheckCircle,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useCreatives } from '../../contexts/CreativesContext';
import { useAuth } from '../../contexts/AuthContext';
import { CanvasRenderer } from '../../services/canvasRenderer';
import { ShareModal } from '../../components/modals/ShareModal';
import { AdjustModal } from '../../components/modals/AdjustModal';

export const FinalResultPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { templates, saveCreation, recordDownload } = useCreatives();
  const { userPhotoUrl } = useAuth();

  const currentTemplate = templates.find((t) => t.id === id) || templates[0];
  const [renderedDataUrl, setRenderedDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [shareOpen, setShareOpen] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const [adjustments, setAdjustments] = useState({
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    rotation: 0,
  });

  // Render high-res 1080x1920 canvas story
  const renderCanvas = async () => {
    try {
      setLoading(true);
      const dataUrl = await CanvasRenderer.renderStory(
        currentTemplate,
        userPhotoUrl,
        adjustments
      );
      setRenderedDataUrl(dataUrl);

      // Save creative into database / backend
      await saveCreation({
        templateId: currentTemplate.id,
        templateName: currentTemplate.name,
        category: currentTemplate.category,
        outputUrl: dataUrl,
        type: currentTemplate.type,
      });
    } catch (e) {
      console.warn('Canvas render fallback:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    renderCanvas();
    // Celebratory confetti burst on load
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
    });
  }, [id, userPhotoUrl, adjustments]);

  const handleDownload = () => {
    if (renderedDataUrl) {
      CanvasRenderer.downloadDataUrl(
        renderedDataUrl,
        `craft-ai-${currentTemplate.category}-${Date.now()}.png`
      );
      recordDownload(currentTemplate.id, currentTemplate.name);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    }
  };

  const handleApplyAdjustments = (newAdj: typeof adjustments) => {
    setAdjustments(newAdj);
  };

  const slot = currentTemplate.subjectSlot;

  return (
    <div className="space-y-6 max-w-5xl mx-auto select-none">
      {/* Heading (Exact match to storyboard) */}
      <div className="text-center space-y-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center justify-center gap-2">
          Your Story is Ready <span className="text-2xl">✨</span>
        </h1>
        <p className="text-xs sm:text-sm text-gray-500">
          Personalized in high-resolution 1080 × 1920 px ready for Instagram, WhatsApp & Facebook
        </p>
      </div>

      {downloadSuccess && (
        <div className="max-w-md mx-auto p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center justify-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-500" />
          Story downloaded in 1080 × 1920 HD! Check your downloads.
        </div>
      )}

      {/* Main Workspace (Preview + Controls matching Desktop & Mobile) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
        {/* Left Side: Story Preview Display */}
        <div className="md:col-span-6 flex justify-center">
          <div className="relative w-full max-w-xs sm:max-w-sm aspect-[9/16] rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-gray-900">
            {renderedDataUrl ? (
              <img
                src={renderedDataUrl}
                alt="Rendered Story"
                className="w-full h-full object-cover"
              />
            ) : (
              // Live CSS Fallback Preview while canvas generates
              <div className="w-full h-full relative">
                <img
                  src={currentTemplate.assetUrl || currentTemplate.thumbnailUrl}
                  alt={currentTemplate.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40" />
                {slot.shape === 'circle' || slot.borderRadius === 9999 || (!slot.shape && currentTemplate.category === 'morning') || slot.width > 0 ? (
                  <div
                    className="absolute overflow-hidden rounded-full aspect-square border-4 border-[#E5C158] ring-2 ring-[#B8860B]/70 shadow-xl"
                    style={{
                      left: slot?.x !== undefined && slot.x > 0 ? `${slot.x * 100}%` : '36%',
                      top: slot?.y !== undefined && slot.y > 0 ? `${slot.y * 100}%` : '67%',
                      width: slot?.width !== undefined && slot.width > 0 && slot.width <= 0.8 ? `${slot.width * 100}%` : '28%',
                    }}
                  >
                    {userPhotoUrl && (
                      <img src={userPhotoUrl} alt="Subject" className="w-full h-full object-cover rounded-full" />
                    )}
                  </div>
                ) : (
                  <div
                    className="absolute overflow-hidden rounded-2xl border-2 border-white/80 shadow-xl"
                    style={{
                      left: `${slot.x * 100}%`,
                      top: `${slot.y * 100}%`,
                      width: `${slot.width * 100}%`,
                      height: `${slot.height * 100}%`,
                    }}
                  >
                    {userPhotoUrl && (
                      <img src={userPhotoUrl} alt="Subject" className="w-full h-full object-cover" />
                    )}
                  </div>
                )}
              </div>
            )}

            {loading && (
              <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center">
                <div className="px-4 py-2 rounded-full bg-white text-xs font-bold text-gray-800 shadow-lg flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-600 animate-spin" /> Rendering HD Quality...
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Control Panels (Exact match to storyboard) */}
        <div className="md:col-span-6 space-y-4 max-w-md mx-auto md:mx-0 w-full">
          {/* Quick Action Grid */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate('/add-photo')}
              className="p-3.5 rounded-2xl bg-white border border-gray-200 hover:border-purple-300 hover:bg-purple-50/30 text-gray-700 text-xs font-semibold flex items-center justify-center gap-2 transition shadow-2xs"
            >
              <Camera className="w-4 h-4 text-purple-600" /> Change Photo
            </button>

            <button
              onClick={() => setAdjustOpen(true)}
              className="p-3.5 rounded-2xl bg-white border border-gray-200 hover:border-purple-300 hover:bg-purple-50/30 text-gray-700 text-xs font-semibold flex items-center justify-center gap-2 transition shadow-2xs"
            >
              <Sliders className="w-4 h-4 text-purple-600" /> Adjust
            </button>

            <button
              onClick={handleDownload}
              className="p-3.5 rounded-2xl bg-white border border-gray-200 hover:border-purple-300 hover:bg-purple-50/30 text-gray-700 text-xs font-semibold flex items-center justify-center gap-2 transition shadow-2xs"
            >
              <Download className="w-4 h-4 text-purple-600" /> Download
            </button>

            <button
              onClick={() => setShareOpen(true)}
              className="p-3.5 rounded-2xl bg-white border border-gray-200 hover:border-purple-300 hover:bg-purple-50/30 text-gray-700 text-xs font-semibold flex items-center justify-center gap-2 transition shadow-2xs"
            >
              <Share2 className="w-4 h-4 text-purple-600" /> Share
            </button>
          </div>

          {/* Primary High-Impact CTA */}
          <button
            onClick={handleDownload}
            disabled={loading}
            className="w-full py-4 rounded-2xl brand-gradient text-white text-base font-bold shadow-xl shadow-purple-500/25 hover:opacity-95 active:scale-[0.99] transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Download className="w-5 h-5 stroke-[2.5]" /> Download (1080 × 1920)
          </button>

          {/* Secondary Options */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (renderedDataUrl) {
                  window.open(renderedDataUrl, '_blank');
                }
              }}
              className="flex-1 py-3 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold transition flex items-center justify-center gap-1.5"
            >
              <Eye className="w-4 h-4" /> View in HD
            </button>

            <button
              onClick={() => navigate('/home')}
              className="flex-1 py-3 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold transition flex items-center justify-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" /> Create Another
            </button>
          </div>
        </div>
      </div>

      {/* Share & Adjust Modals */}
      <ShareModal
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        title={currentTemplate.name}
        imageUrl={renderedDataUrl || undefined}
      />

      <AdjustModal
        isOpen={adjustOpen}
        onClose={() => setAdjustOpen(false)}
        onApply={handleApplyAdjustments}
        initialValues={adjustments}
      />
    </div>
  );
};

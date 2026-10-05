import React, { useState } from 'react';
import {
  X,
  Share2,
  Copy,
  Download,
  Check,
  Send,
  Camera,
  MessageCircle,
  MoreHorizontal,
} from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  url?: string;
  imageUrl?: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  title = 'Craft AI Story',
  url = window.location.href,
  imageUrl,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: 'Check out my story created with Craft AI!',
          url,
        });
      } catch (err) {
        // User cancelled or share failed
      }
    } else {
      handleCopyLink();
    }
  };

  const shareToWhatsapp = () => {
    const text = encodeURIComponent(`Check out my story created with Craft AI: ${url}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const shareToTelegram = () => {
    const text = encodeURIComponent(`Craft AI Story: ${url}`);
    window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${text}`, '_blank');
  };

  const shareToFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
  };

  const shareToInstagram = () => {
    // Open Instagram web or prompt to copy link
    handleCopyLink();
    window.open('https://www.instagram.com', '_blank');
  };

  const handleSaveToGallery = () => {
    if (imageUrl) {
      const a = document.createElement('a');
      a.href = imageUrl;
      a.download = `craft-ai-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs transition-opacity p-0 sm:p-4 animate-in fade-in duration-200">
      <div
        className="w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-white p-6 shadow-2xl transition-all animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <h3 className="text-xl font-bold text-gray-900">Share to</h3>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Row 1: Direct Social Apps */}
        <div className="grid grid-cols-4 gap-4 py-5 text-center">
          <button
            onClick={shareToWhatsapp}
            className="flex flex-col items-center gap-2 group transition"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-md group-hover:scale-105 transition-transform">
              <MessageCircle className="w-7 h-7 fill-white" />
            </div>
            <span className="text-xs font-medium text-gray-700">WhatsApp</span>
          </button>

          <button
            onClick={shareToInstagram}
            className="flex flex-col items-center gap-2 group transition"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white shadow-md group-hover:scale-105 transition-transform">
              <Camera className="w-7 h-7" />
            </div>
            <span className="text-xs font-medium text-gray-700">Instagram</span>
          </button>

          <button
            onClick={shareToFacebook}
            className="flex flex-col items-center gap-2 group transition"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md group-hover:scale-105 transition-transform">
              <span className="text-2xl font-bold font-serif">f</span>
            </div>
            <span className="text-xs font-medium text-gray-700">Facebook</span>
          </button>

          <button
            onClick={shareToTelegram}
            className="flex flex-col items-center gap-2 group transition"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-500 text-white shadow-md group-hover:scale-105 transition-transform">
              <Send className="w-6 h-6 fill-white ml-0.5" />
            </div>
            <span className="text-xs font-medium text-gray-700">Telegram</span>
          </button>
        </div>

        {/* Row 2: Actions & Utilities */}
        <div className="grid grid-cols-4 gap-4 py-3 text-center border-t border-gray-100">
          <button
            onClick={handleCopyLink}
            className="flex flex-col items-center gap-2 group transition"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-700 shadow-xs group-hover:bg-gray-200 transition">
              {copied ? <Check className="w-6 h-6 text-emerald-600" /> : <Copy className="w-6 h-6" />}
            </div>
            <span className="text-xs font-medium text-gray-700">
              {copied ? 'Copied!' : 'Copy Link'}
            </span>
          </button>

          <button
            onClick={handleNativeShare}
            className="flex flex-col items-center gap-2 group transition"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-700 shadow-xs group-hover:bg-gray-200 transition">
              <Share2 className="w-6 h-6" />
            </div>
            <span className="text-xs font-medium text-gray-700">More Apps</span>
          </button>

          <button
            onClick={handleSaveToGallery}
            className="flex flex-col items-center gap-2 group transition"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-700 shadow-xs group-hover:bg-gray-200 transition">
              <Download className="w-6 h-6" />
            </div>
            <span className="text-xs font-medium text-gray-700">Save to Gallery</span>
          </button>

          <button
            onClick={handleNativeShare}
            className="flex flex-col items-center gap-2 group transition"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-700 shadow-xs group-hover:bg-gray-200 transition">
              <MoreHorizontal className="w-6 h-6" />
            </div>
            <span className="text-xs font-medium text-gray-700">Other</span>
          </button>
        </div>

        {/* Cancel Button */}
        <div className="mt-5 pt-3">
          <button
            onClick={onClose}
            className="w-full py-3.5 rounded-2xl bg-gray-100 text-gray-700 font-semibold text-sm hover:bg-gray-200 transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

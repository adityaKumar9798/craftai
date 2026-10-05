import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Camera, Check, ArrowLeft, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ApiService } from '../../services/api';

export const AddPhotoPage: React.FC = () => {
  const navigate = useNavigate();
  const { userPhotoUrl, updateUserPhoto, token } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [previewUrl, setPreviewUrl] = useState<string>(userPhotoUrl);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setPreviewUrl(base64);
        updateUserPhoto(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProceed = async () => {
    if (previewUrl) {
      updateUserPhoto(previewUrl);
    }
    if (selectedFile) {
      try {
        setUploading(true);
        const res = await ApiService.uploadPhoto(selectedFile, token || undefined);
        if (res && res.photoUrl) {
          updateUserPhoto(res.photoUrl);
        }
      } catch (e) {
        console.warn('Backend upload fallback:', e);
      } finally {
        setUploading(false);
      }
    }

    navigate('/processing');
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between p-5 sm:p-8 max-w-lg mx-auto select-none">
      {/* Top Bar with Back and Skip */}
      <div className="flex items-center justify-between pb-2">
        <button
          onClick={() => navigate(-1)}
          className="flex h-9 w-9 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100 transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <button
          onClick={() => navigate('/home')}
          className="text-xs sm:text-sm font-semibold text-gray-500 hover:text-gray-900 px-2 py-1"
        >
          Skip
        </button>
      </div>

      {/* Main Container */}
      <div className="flex-1 flex flex-col items-center justify-center py-4">
        <div className="text-center mb-6">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Add Your Photo
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-2 max-w-xs mx-auto">
            Upload a clear photo of yourself. We'll use this in all templates.
          </p>
        </div>

        {/* Upload Card / Frame (Exact match to storyboard reference) */}
        <div className="relative my-2">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="w-56 h-64 sm:w-64 sm:h-72 rounded-3xl border-2 border-dashed border-purple-300 p-2 cursor-pointer transition hover:border-purple-500 bg-gradient-to-b from-purple-50/40 to-transparent flex items-center justify-center relative group"
          >
            <div className="w-full h-full rounded-2xl overflow-hidden bg-gray-50 flex items-center justify-center relative shadow-inner">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Selected"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 text-gray-400 p-4">
                  <div className="w-14 h-14 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shadow-xs">
                    <Camera className="w-7 h-7" />
                  </div>
                  <span className="text-xs font-semibold text-gray-700">Choose Your Photo</span>
                  <span className="text-[11px] text-gray-400 text-center">Tap to browse files or gallery</span>
                </div>
              )}
            </div>

            {/* Camera Floating Badge at bottom right */}
            <div className="absolute -bottom-2 -right-2 flex h-12 w-12 items-center justify-center rounded-full brand-gradient text-white shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform">
              <Camera className="w-6 h-6" />
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png, image/jpeg, image/jpg, image/webp"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Action Button */}
        <div className="w-full max-w-xs mt-6 space-y-2.5">
          <button
            onClick={handleProceed}
            disabled={uploading}
            className="w-full py-3.5 rounded-full brand-gradient text-white text-sm font-bold shadow-lg shadow-purple-500/25 hover:opacity-95 active:scale-[0.99] transition disabled:opacity-50"
          >
            {uploading ? 'Uploading Photo...' : 'Upload Photo'}
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-2.5 rounded-full text-xs font-semibold text-gray-600 hover:text-purple-600 transition flex items-center justify-center gap-1.5"
          >
            <ImageIcon className="w-4 h-4" /> Change Photo
          </button>
        </div>

        {/* Tips for Best Results Card (Exact match to storyboard) */}
        <div className="w-full max-w-xs mt-6 bg-gray-50 rounded-2xl p-4 border border-gray-100">
          <h4 className="text-xs font-bold text-gray-800 mb-2.5 tracking-wide">
            Tips for best results
          </h4>
          <ul className="space-y-1.5 text-xs text-gray-600">
            <li className="flex items-center gap-2">
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <Check className="w-2.5 h-2.5 stroke-[3]" />
              </span>
              Use a clear front photo
            </li>
            <li className="flex items-center gap-2">
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <Check className="w-2.5 h-2.5 stroke-[3]" />
              </span>
              Good lighting
            </li>
            <li className="flex items-center gap-2">
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <Check className="w-2.5 h-2.5 stroke-[3]" />
              </span>
              Avoid blurry images
            </li>
            <li className="flex items-center gap-2">
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <Check className="w-2.5 h-2.5 stroke-[3]" />
              </span>
              Only one person in photo
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

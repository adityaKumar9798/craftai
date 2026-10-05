import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';
import { useCreatives } from '../../contexts/CreativesContext';

export const MoodSelectionPage: React.FC = () => {
  const navigate = useNavigate();
  const { categories } = useCreatives();
  const [selectedSlug, setSelectedSlug] = useState<string>('morning');

  const moodCategories = categories.slice(0, 8); // Morning, Love, Sad, Breakup, Motivation, Attitude, Friendship, Festival/Trending

  const handleContinue = () => {
    navigate(`/category/${selectedSlug}`);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between p-5 sm:p-8 max-w-lg mx-auto select-none">
      {/* Top Bar */}
      <div className="flex items-center justify-between pb-2">
        <button
          onClick={() => navigate(-1)}
          className="flex h-9 w-9 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100 transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center py-4">
        <div className="text-center mb-6">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            What are you feeling today?
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-2">
            Choose your favorite category to get started.
          </p>
        </div>

        {/* 2-Column Pastel Mood Cards Grid (Exact match to storyboard reference) */}
        <div className="w-full grid grid-cols-2 gap-3.5 max-w-sm">
          {moodCategories.map((cat) => {
            const isSelected = selectedSlug === cat.slug;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedSlug(cat.slug)}
                className={`relative p-5 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all duration-200 border text-center ${
                  isSelected
                    ? 'ring-2 ring-purple-600 border-transparent shadow-md scale-[1.02]'
                    : 'border-transparent hover:scale-[1.01] hover:shadow-xs'
                }`}
                style={{ backgroundColor: cat.backgroundColor }}
              >
                {isSelected && (
                  <span className="absolute top-2.5 right-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-purple-600 text-white shadow-xs">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </span>
                )}
                <span className="text-3xl filter drop-shadow-xs">{cat.icon}</span>
                <span className="text-xs sm:text-sm font-bold text-gray-800">
                  {cat.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* Primary Continue Button */}
        <div className="w-full max-w-sm mt-8">
          <button
            onClick={handleContinue}
            className="w-full py-4 rounded-full brand-gradient text-white text-sm font-bold shadow-xl shadow-purple-500/25 hover:opacity-95 active:scale-[0.99] transition"
          >
            Continue to Home
          </button>
        </div>
      </div>
    </div>
  );
};

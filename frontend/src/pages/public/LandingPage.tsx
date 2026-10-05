import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Logo } from '../../components/common/Logo';
const DEFAULT_USER_PHOTO = 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=800&q=85';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeSlide, setActiveSlide] = useState(0);

  const previewTemplates = [
    { id: '1', assetUrl: 'https://images.unsplash.com/photo-1542204165-65bf26472b9b?auto=format&fit=crop&w=800&q=80', name: 'Good Morning', headline: 'Start your day right' },
    { id: '2', assetUrl: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=800&q=80', name: 'Bee Yourself', headline: 'Always bee yourself' },
    { id: '3', assetUrl: 'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?auto=format&fit=crop&w=800&q=80', name: 'Life is Beautiful', headline: 'Embrace every moment' },
  ];

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col relative overflow-hidden select-none">
      {/* Background Soft Pastel Accents */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-pink-100 via-purple-50 to-transparent rounded-full blur-3xl pointer-events-none opacity-60" />
      <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] bg-gradient-to-tr from-blue-100 via-purple-50 to-transparent rounded-full blur-3xl pointer-events-none opacity-50" />

      {/* Top Navbar (Desktop & Mobile) */}
      <header className="max-w-7xl w-full mx-auto px-6 h-20 flex items-center justify-between z-20">
        <Logo size="md" />

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-gray-600">
          <a href="#home" className="text-gray-900 hover:text-purple-600 transition">Home</a>
          <a href="#about" className="hover:text-purple-600 transition">About</a>
          <a href="#features" className="hover:text-purple-600 transition">Features</a>
          <a href="#pricing" className="hover:text-purple-600 transition">Pricing</a>
        </nav>

        {/* Top Right CTA */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/login')}
            className="text-sm font-semibold text-gray-700 hover:text-gray-900 px-3 py-2 transition"
          >
            Login
          </button>
          <button
            onClick={() => navigate('/signup')}
            className="px-5 py-2.5 rounded-full brand-gradient text-white text-sm font-bold shadow-md shadow-purple-500/20 hover:opacity-95 transition"
          >
            Get Started
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 md:py-16 flex flex-col md:flex-row items-center justify-between gap-12 z-10">
        {/* Left Column: Heading & CTAs */}
        <div className="flex-1 max-w-xl text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 border border-purple-100 text-purple-700 text-xs font-semibold mb-6">
            <span className="w-2 h-2 rounded-full bg-[#F72585] animate-pulse" />
            Social Media Story & Status Creator
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 tracking-tight leading-[1.1]">
            Create <br />
            <span className="brand-gradient-text">Your Story</span>
          </h1>

          <p className="mt-5 text-base sm:text-lg text-gray-600 leading-relaxed max-w-md mx-auto md:mx-0">
            Add your photo and make every story yours. Over 45+ stylized templates ready to personalize in seconds.
          </p>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 justify-center md:justify-start">
            <button
              onClick={() => navigate('/signup')}
              className="w-full sm:w-auto px-8 py-4 rounded-full brand-gradient text-white text-base font-bold shadow-xl shadow-purple-500/25 hover:scale-[1.02] active:scale-[0.98] transition flex items-center justify-center gap-2"
            >
              Get Started
              <ArrowRight className="w-5 h-5" />
            </button>

            <button
              onClick={() => navigate('/home')}
              className="text-sm font-semibold text-gray-500 hover:text-gray-800 px-4 py-2 transition"
            >
              Skip
            </button>
          </div>

          {/* Carousel Onboarding Dots */}
          <div className="mt-10 flex items-center justify-center md:justify-start gap-2">
            {[0, 1, 2].map((idx) => (
              <button
                key={idx}
                onClick={() => setActiveSlide(idx)}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  activeSlide === idx ? 'w-8 brand-gradient' : 'w-2.5 bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Right Column: Overlapping Story Cards Fan (Desktop & Mobile Match) */}
        <div className="flex-1 flex justify-center items-center relative w-full max-w-md lg:max-w-lg">
          <div className="relative w-72 sm:w-80 h-[460px] sm:h-[500px]">
            {/* Card 1 - Left Angle */}
            <div className="absolute top-6 -left-6 sm:-left-10 w-52 sm:w-56 aspect-[9/16] rounded-2xl overflow-hidden shadow-xl border-2 border-white transform -rotate-12 hover:rotate-0 hover:z-30 transition-all duration-500">
              <img
                src={previewTemplates[1].assetUrl}
                alt="Story preview"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute top-3 inset-x-2 text-center text-white text-xs font-bold">
                {previewTemplates[1].headline}
              </div>
              <div className="absolute inset-x-6 top-24 bottom-20 rounded-xl overflow-hidden border border-white/60">
                <img src={DEFAULT_USER_PHOTO} alt="Subject" className="w-full h-full object-cover" />
              </div>
            </div>

            {/* Card 2 - Right Angle */}
            <div className="absolute top-6 -right-6 sm:-right-10 w-52 sm:w-56 aspect-[9/16] rounded-2xl overflow-hidden shadow-xl border-2 border-white transform rotate-12 hover:rotate-0 hover:z-30 transition-all duration-500">
              <img
                src={previewTemplates[2].assetUrl}
                alt="Story preview"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute top-3 inset-x-2 text-center text-white text-xs font-bold">
                {previewTemplates[2].headline}
              </div>
              <div className="absolute inset-x-6 top-24 bottom-20 rounded-xl overflow-hidden border border-white/60">
                <img src={DEFAULT_USER_PHOTO} alt="Subject" className="w-full h-full object-cover" />
              </div>
            </div>

            {/* Card 3 - Main Center Front */}
            <div className="absolute top-0 inset-x-0 mx-auto w-56 sm:w-64 aspect-[9/16] rounded-2xl overflow-hidden shadow-2xl border-4 border-white z-20 transform hover:scale-105 transition-transform duration-300">
              <img
                src={previewTemplates[0].assetUrl}
                alt="Main story preview"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />
              <div className="absolute top-4 inset-x-2 text-center">
                <p className="text-white text-base sm:text-lg font-black drop-shadow">
                  Good Morning
                </p>
                <p className="text-amber-200 text-xs italic">
                  Have a Beautiful Day
                </p>
              </div>
              <div className="absolute inset-x-8 top-28 bottom-24 rounded-2xl overflow-hidden border-2 border-white/80 shadow-lg">
                <img src={DEFAULT_USER_PHOTO} alt="Subject" className="w-full h-full object-cover" />
              </div>
              <div className="absolute bottom-4 inset-x-3 text-center">
                <span className="text-[11px] font-semibold text-white/90 drop-shadow">
                  Stay Positive • Stay Happy
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

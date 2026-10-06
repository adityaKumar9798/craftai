import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Logo } from '../../components/common/Logo';

interface DeityCard {
  id: string;
  name: string;
  title: string;
  subtitle: string;
  mantra: string;
  badge: string;
  image: string;
  accentColor: string;
  glowColor: string;
  borderColor: string;
  gradient: string;
}

const DEITY_CARDS: DeityCard[] = [
  {
    id: 'shiva',
    name: 'Lord Shiva',
    title: 'Har Har Mahadev',
    subtitle: 'Mount Kailash • Cosmic Meditation',
    mantra: 'ॐ नमः शिवाय',
    badge: '🕉️ Mahadev',
    image: '/assets/deities/shiva.jpg',
    accentColor: 'text-cyan-400',
    glowColor: 'shadow-cyan-500/40',
    borderColor: 'border-cyan-300',
    gradient: 'from-blue-900/80 via-slate-900/60 to-black/80',
  },
  {
    id: 'krishna',
    name: 'Lord Krishna',
    title: 'Jai Shree Krishna',
    subtitle: 'Vrindavan Dham • Divine Bliss & Love',
    mantra: 'राधे राधे • हरे कृष्णा',
    badge: '🦚 Shri Krishna',
    image: '/assets/deities/krishna.jpg',
    accentColor: 'text-amber-300',
    glowColor: 'shadow-amber-500/40',
    borderColor: 'border-amber-300',
    gradient: 'from-amber-950/80 via-yellow-950/60 to-black/80',
  },
  {
    id: 'durga',
    name: 'Maa Durga',
    title: 'Jai Mata Di',
    subtitle: 'Navratri Mahotsav • Supreme Shakti',
    mantra: 'सर्वमंगल मांगल्ये शिवे सर्वार्थ साधिके',
    badge: '🔱 Maa Durga',
    image: '/assets/deities/durga.jpg',
    accentColor: 'text-rose-300',
    glowColor: 'shadow-rose-500/40',
    borderColor: 'border-rose-300',
    gradient: 'from-rose-950/80 via-red-950/60 to-black/80',
  },
];

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Auto-cycle through the 3 deities every 3 seconds
  React.useEffect(() => {
    if (hoveredIndex !== null) return; // Pause auto-rotation when user is hovering

    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % DEITY_CARDS.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [hoveredIndex]);

  // The active display deity index (hover takes precedence over active index)
  const currentIdx = hoveredIndex !== null ? hoveredIndex : activeIndex;

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
            className="text-sm font-semibold text-gray-700 hover:text-gray-900 px-3 py-2 transition cursor-pointer"
          >
            Login
          </button>
          <button
            onClick={() => navigate('/signup')}
            className="px-5 py-2.5 rounded-full brand-gradient text-white text-sm font-bold shadow-md shadow-purple-500/20 hover:opacity-95 transition cursor-pointer"
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
            Create divine devotional stories, status updates, and custom greeting cards. Add your photo or share with loved ones in seconds.
          </p>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 justify-center md:justify-start">
            <button
              onClick={() => navigate('/signup')}
              className="w-full sm:w-auto px-8 py-4 rounded-full brand-gradient text-white text-base font-bold shadow-xl shadow-purple-500/25 hover:scale-[1.02] active:scale-[0.98] transition flex items-center justify-center gap-2 cursor-pointer"
            >
              Get Started
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Right Column: Dynamic Interactive Devotional Story Cards Fan */}
        <div className="flex-1 flex justify-center items-center relative w-full max-w-md lg:max-w-lg select-none">
          <div className="relative w-72 sm:w-80 h-[490px] sm:h-[530px] flex items-center justify-center">
            {DEITY_CARDS.map((deity, idx) => {
              // Calculate relative position based on currentIdx
              const offset = (idx - currentIdx + DEITY_CARDS.length) % DEITY_CARDS.length;
              const isCenter = offset === 0;
              const isLeft = offset === 1 || (DEITY_CARDS.length === 3 && offset === 2 && currentIdx === (idx + 1) % 3);
              const isRight = offset === 2;

              let zIndex = 10;
              let rotate = 0;
              let translateX = 0;
              let scale = 0.88;
              let opacity = 0.85;

              if (isCenter) {
                zIndex = 30;
                rotate = 0;
                translateX = 0;
                scale = 1.04;
                opacity = 1;
              } else if (offset === 1) {
                zIndex = 20;
                rotate = 12;
                translateX = 70;
                scale = 0.9;
                opacity = 0.85;
              } else {
                zIndex = 15;
                rotate = -12;
                translateX = -70;
                scale = 0.9;
                opacity = 0.85;
              }

              return (
                <motion.div
                  key={deity.id}
                  layout
                  initial={false}
                  animate={{
                    rotate: rotate,
                    x: translateX,
                    scale: scale,
                    zIndex: zIndex,
                    opacity: opacity,
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 300,
                    damping: 25,
                  }}
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  onClick={() => setActiveIndex(idx)}
                  className={`absolute top-0 w-60 sm:w-64 aspect-[9/16] rounded-3xl overflow-hidden shadow-2xl border-4 transition-all duration-300 cursor-pointer group ${
                    isCenter ? `${deity.borderColor} ${deity.glowColor}` : 'border-white/80 shadow-lg'
                  }`}
                  style={{
                    transformOrigin: 'bottom center',
                  }}
                >
                  {/* Deity Background Image with Zoom on Hover */}
                  <img
                    src={deity.image}
                    alt={deity.name}
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-out"
                  />

                  {/* Gradient Overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-t ${deity.gradient} transition-opacity duration-300`} />

                  {/* Top Header & Deity Badge */}
                  <div className="absolute top-4 inset-x-3 flex flex-col items-center text-center">
                    <span className="px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-white text-[10px] font-bold border border-white/30 tracking-wide mb-1.5 shadow-sm">
                      {deity.badge}
                    </span>
                    <h3 className="text-white text-base sm:text-lg font-black tracking-wide drop-shadow-md">
                      {deity.title}
                    </h3>
                    <p className={`text-xs font-semibold ${deity.accentColor} drop-shadow italic`}>
                      {deity.subtitle}
                    </p>
                  </div>

                  {/* Sacred Mantra & Footer on Center Card */}
                  <div className="absolute bottom-4 inset-x-3 text-center">
                    <div className="px-3 py-2 rounded-2xl bg-black/40 backdrop-blur-md border border-white/20 shadow-inner">
                      <p className="text-xs font-bold text-amber-200 tracking-wide drop-shadow">
                        {deity.mantra}
                      </p>
                      <div className="mt-1 flex items-center justify-center gap-1 text-[10px] text-white/90 font-medium">
                        <Sparkles className="w-2.5 h-2.5 text-yellow-300" />
                        <span>Craft with your name & photo</span>
                      </div>
                    </div>
                  </div>

                  {/* Hover Sparkle Badge */}
                  <div className="absolute inset-0 border-2 border-white/0 group-hover:border-white/40 rounded-3xl transition-colors duration-300 pointer-events-none" />
                </motion.div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
};


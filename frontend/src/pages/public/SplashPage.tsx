import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Logo } from '../../components/common/Logo';
import { useAuth } from '../../contexts/AuthContext';

export const SplashPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isAuthenticated) {
        navigate('/home');
      } else {
        navigate('/onboarding');
      }
    }, 2400);

    return () => clearTimeout(timer);
  }, [isAuthenticated, navigate]);

  return (
    <div className="relative min-h-screen w-full bg-white flex flex-col items-center justify-between p-8 overflow-hidden select-none">
      {/* Soft Pastel Background Ambient Blobs */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.45, scale: 1 }}
        transition={{ duration: 1.5, ease: 'easeOut' }}
        className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-gradient-to-br from-pink-300 via-purple-200 to-transparent blur-3xl pointer-events-none"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.4, scale: 1 }}
        transition={{ duration: 1.5, delay: 0.3, ease: 'easeOut' }}
        className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-gradient-to-tl from-blue-300 via-pink-200 to-transparent blur-3xl pointer-events-none"
      />

      {/* Top spacer */}
      <div className="w-full h-8" />

      {/* Center Logo with Framer Motion Sequence */}
      <div className="flex flex-col items-center text-center z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.6, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        >
          <Logo size="xl" vertical={true} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6, ease: 'easeOut' }}
          className="mt-3"
        >
          <p className="text-gray-600 font-medium text-base sm:text-lg tracking-wide">
            Your Photo. Every Story.
          </p>
        </motion.div>
      </div>

      {/* Subtle Loading Line at Bottom */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.9 }}
        className="w-full max-w-xs flex flex-col items-center gap-3 z-10 mb-4"
      >
        <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{
              repeat: Infinity,
              duration: 1.4,
              ease: 'easeInOut',
            }}
            className="w-1/2 h-full brand-gradient rounded-full"
          />
        </div>
        <span className="text-xs text-gray-400 font-medium tracking-wide">
          Loading your creative space...
        </span>
      </motion.div>
    </div>
  );
};

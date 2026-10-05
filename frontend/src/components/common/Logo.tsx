import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  vertical?: boolean;
  className?: string;
  dark?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showTagline = false,
  vertical = false,
  className = '',
  dark = false,
}) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-14 h-14',
    xl: 'w-24 h-24',
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl',
    xl: 'text-5xl font-black tracking-tight',
  };

  const taglineSizes = {
    sm: 'text-[11px]',
    md: 'text-xs',
    lg: 'text-base',
    xl: 'text-lg font-medium text-gray-700',
  };

  return (
    <div
      className={`flex ${vertical ? 'flex-col items-center text-center' : 'items-center gap-2.5'} select-none ${className}`}
    >
      {/* Stylized Gradient C Symbol */}
      <div className={`relative ${iconSizes[size]} flex items-center justify-center shrink-0`}>
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-sm"
        >
          <defs>
            <linearGradient id="craftGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F72585" />
              <stop offset="50%" stopColor="#A020F0" />
              <stop offset="100%" stopColor="#3B82F6" />
            </linearGradient>
            <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#A020F0" floodOpacity="0.25" />
            </filter>
          </defs>
          {/* Outer circle with gradient and gap forming a modern stylized C */}
          <path
            d="M 78 30 C 70 16 50 14 34 24 C 18 34 14 56 24 72 C 34 88 56 92 72 82 C 80 76 84 68 86 60"
            stroke="url(#craftGradient)"
            strokeWidth="18"
            strokeLinecap="round"
            filter="url(#softGlow)"
          />
        </svg>
      </div>

      {/* Brand Text */}
      <div className={vertical ? 'mt-4' : 'flex flex-col'}>
        <div className={`font-extrabold tracking-tight ${textSizes[size]} flex items-center leading-none`}>
          <span className={dark ? "text-white" : "text-gray-900"}>Craft</span>
          <span className="ml-1.5 brand-gradient-text font-black">AI</span>
        </div>
        {showTagline && (
          <p className={`${taglineSizes[size]} ${dark ? 'text-gray-400' : 'text-gray-500'} mt-1 font-normal tracking-wide`}>
            Your Photo. Every Story.
          </p>
        )}
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const PhotoProcessingPage: React.FC = () => {
  const navigate = useNavigate();
  const { userPhotoUrl } = useAuth();

  const [progress, setProgress] = useState(20);
  const [activeStep, setActiveStep] = useState(1);

  const steps = [
    { title: 'Uploading photo', step: 1 },
    { title: 'Detecting subject', step: 2 },
    { title: 'Removing background', step: 3 },
    { title: 'Optimizing for templates', step: 4 },
  ];

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setProgress(45);
      setActiveStep(2);
    }, 600);

    const timer2 = setTimeout(() => {
      setProgress(80);
      setActiveStep(3);
    }, 1300);

    const timer3 = setTimeout(() => {
      setProgress(100);
      setActiveStep(4);
    }, 2200);

    const timer4 = setTimeout(() => {
      navigate('/mood-selection');
    }, 2800);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [navigate]);

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
      <div className="flex-1 flex flex-col items-center justify-center py-6">
        {/* Circular Photo with Progress Ring (Exact match to storyboard reference) */}
        <div className="relative w-52 h-52 sm:w-60 sm:h-60 flex items-center justify-center my-4">
          {/* Circular Progress SVG */}
          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
            {/* Background ring */}
            <circle
              cx="50"
              cy="50"
              r="44"
              stroke="#F3F4F6"
              strokeWidth="6"
              fill="transparent"
            />
            {/* Animated Gradient Progress Stroke */}
            <circle
              cx="50"
              cy="50"
              r="44"
              stroke="url(#processGradient)"
              strokeWidth="6"
              fill="transparent"
              strokeDasharray={2 * Math.PI * 44}
              strokeDashoffset={2 * Math.PI * 44 * (1 - progress / 100)}
              strokeLinecap="round"
              className="transition-all duration-700 ease-out"
            />
            <defs>
              <linearGradient id="processGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F72585" />
                <stop offset="50%" stopColor="#A020F0" />
                <stop offset="100%" stopColor="#3B82F6" />
              </linearGradient>
            </defs>
          </svg>

          {/* User Photo in Inner Circle */}
          <div className="absolute inset-5 rounded-full overflow-hidden shadow-md">
            <img
              src={userPhotoUrl}
              alt="Processing Subject"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Progress Percentage Badge at bottom */}
          <div className="absolute -bottom-2 bg-white px-3.5 py-1 rounded-full shadow-md border border-gray-100 flex items-center justify-center">
            <span className="text-xs sm:text-sm font-black brand-gradient-text">
              {progress}%
            </span>
          </div>
        </div>

        {/* Headings */}
        <div className="text-center mt-6 mb-8">
          <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
            Processing Your Photo...
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-xs mx-auto">
            Removing background and detecting subject.
          </p>
        </div>

        {/* Step-by-Step Checklist (Exact match to storyboard) */}
        <div className="w-full max-w-xs space-y-3.5">
          {steps.map((item) => {
            const isCompleted = activeStep >= item.step;
            return (
              <div
                key={item.step}
                className="flex items-center gap-3 transition-all duration-300"
              >
                <div
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors ${
                    isCompleted
                      ? 'bg-emerald-500 text-white shadow-xs'
                      : 'bg-gray-100 text-gray-300'
                  }`}
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
                <span
                  className={`text-xs sm:text-sm font-medium transition-colors ${
                    isCompleted ? 'text-gray-900 font-semibold' : 'text-gray-400'
                  }`}
                >
                  {item.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

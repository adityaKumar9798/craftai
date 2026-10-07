import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export const GuestAccountPage: React.FC = () => {
  const navigate = useNavigate();
  const { createGuestAccount } = useAuth();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      setError('Please enter your first name and last name.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Create guest account
      await createGuestAccount(firstName.trim(), lastName.trim());

      navigate('/home');
    } catch (err: any) {
      setError('Failed to create guest account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-white flex flex-col justify-between select-none">
      <div className="w-full max-w-md mx-auto min-h-screen bg-white flex flex-col justify-between">
        {/* Top Header with Purple-to-Blue Gradient */}
        <div className="relative w-full bg-gradient-to-r from-[#9B26B6] via-[#6339C9] to-[#2188FF] pt-16 pb-28 sm:pb-32 px-6 text-white text-center">
          <h1 className="text-4xl sm:text-[46px] font-black text-white tracking-tight drop-shadow-md pb-1">
            Guest Account
          </h1>
          <div className="absolute -bottom-[1px] left-0 right-0 overflow-hidden leading-none pointer-events-none w-full">
            <svg
              viewBox="0 0 400 85"
              preserveAspectRatio="none"
              className="w-full h-18 sm:h-22 text-white fill-current"
            >
              <path d="M 0 80 C 0 25, 30 8, 85 8 L 400 8 L 400 85 L 0 85 Z" />
            </svg>
          </div>
        </div>

        {/* White Body Section */}
        <div className="px-6 sm:px-8 pt-0 pb-8 flex-1 flex flex-col justify-start items-center w-full -mt-2">
          <div className="w-full max-w-sm space-y-4">
            <div className="text-center pt-1">
              <h2 className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-[#9B26B6] via-[#7B2CBF] to-[#2188FF] bg-clip-text text-transparent tracking-tight text-center">
                Get Started
              </h2>
            </div>

            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} autoComplete="off" className="space-y-3.5 pt-1">
              <div className="space-y-1">
                <input
                  type="text"
                  placeholder="First Name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-5 py-4 rounded-2xl border border-gray-300 bg-white text-base sm:text-lg text-gray-900 placeholder-gray-400 placeholder:text-base focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition shadow-2xs font-medium"
                  required
                />
              </div>

              <div className="space-y-1">
                <input
                  type="text"
                  placeholder="Last Name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-5 py-4 rounded-2xl border border-gray-300 bg-white text-base sm:text-lg text-gray-900 placeholder-gray-400 placeholder:text-base focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition shadow-2xs font-medium"
                  required
                />
              </div>

              <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200">
                <p className="text-sm text-purple-700 font-semibold text-center">
                  Your username will be: <span className="text-purple-900">user{Date.now()}</span>
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#9B26B6] via-[#6339C9] to-[#2188FF] text-white text-lg font-black tracking-wide shadow-md shadow-purple-500/25 hover:opacity-95 active:scale-[0.99] transition disabled:opacity-50 mt-1"
              >
                {loading ? 'Creating Account...' : 'Continue as Guest'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const ForgotPasswordPage: React.FC = () => {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    try {
      setLoading(true);
      setError(null);
      await resetPassword(email.trim());
      setSubmitted(true);
    } catch (err: any) {
      setError(err?.message || 'Failed to send reset link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#6C52EE] via-[#9B51E0] to-[#FF4B91] flex items-center justify-center p-3 sm:p-6 select-none">
      <div className="w-full max-w-[390px] bg-white rounded-[36px] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.25)] border border-white/40 flex flex-col relative min-h-[560px]">
        
        {/* Top Curved Gradient Header */}
        <div className="relative bg-gradient-to-r from-[#8338EC] via-[#6366F1] to-[#3A86FF] pt-14 pb-20 px-6 text-white text-center">
          <h1 className="text-2xl font-black text-white tracking-tight drop-shadow-md">
            Reset Password
          </h1>

          <div className="absolute -bottom-[1px] left-0 right-0 overflow-hidden leading-none pointer-events-none">
            <svg
              viewBox="0 0 400 80"
              preserveAspectRatio="none"
              className="w-full h-14 sm:h-16 text-white fill-current"
            >
              <path d="M 0 75 C 0 25, 30 8, 85 8 L 400 8 L 400 80 L 0 80 Z" />
            </svg>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 sm:px-7 pt-2 pb-7 flex-1 flex flex-col justify-between space-y-4">
          
          <div className="space-y-4 pt-1">
            {/* Craft AI Brand Logo & Name */}
            <div className="flex items-center justify-center gap-2.5 pb-1">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-md shadow-purple-500/15 border border-purple-100">
                <div className="w-5 h-5 rounded-full border-[2.5px] border-t-pink-500 border-r-purple-600 border-b-blue-500 border-l-pink-400 transform -rotate-45" />
              </div>
              <span className="text-2xl font-black tracking-tight text-gray-900 flex items-center gap-1">
                Craft <span className="text-[#8338EC] font-black">AI</span>
              </span>
            </div>

            <div className="text-center space-y-1">
              <h2 className="text-3xl font-black bg-gradient-r from-[#9B26B6] via-[#7B2CBF] to-[#2188FF] bg-clip-text text-transparent text-center">
                Forgot Password?
              </h2>
              <p className="text-xs text-gray-400 font-medium text-center">
                Enter your registered email to receive a recovery link
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold text-center">
                {error}
              </div>
            )}

            {submitted ? (
              <div className="p-5 rounded-3xl bg-emerald-50 border border-emerald-100 text-center space-y-2.5">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                <h4 className="font-bold text-gray-900 text-sm">Reset Link Sent</h4>
                <p className="text-xs text-gray-600 leading-relaxed">
                  We've sent a password reset email to <strong className="text-gray-900">{email}</strong>. Please check your inbox.
                </p>
                <Link
                  to="/login"
                  className="inline-block mt-2 text-xs font-bold text-purple-700 hover:underline"
                >
                  ← Back to Login
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      placeholder="Enter Your Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-11 pr-4 py-3.5 rounded-full border border-gray-200 bg-gray-50/50 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white transition shadow-2xs"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#8338EC] via-[#6366F1] to-[#3A86FF] text-white font-extrabold text-sm shadow-lg shadow-purple-500/25 hover:opacity-95 active:scale-[0.99] transition disabled:opacity-50"
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>
            )}
          </div>

          <p className="text-center text-xs text-gray-500 pt-2">
            Remembered your password?{' '}
            <Link to="/login" className="text-[#8338EC] font-black hover:underline">
              Login
            </Link>
          </p>

        </div>

      </div>
    </div>
  );
};

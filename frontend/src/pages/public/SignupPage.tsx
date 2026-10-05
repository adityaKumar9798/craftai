import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { Logo } from '../../components/common/Logo';
import { useAuth } from '../../contexts/AuthContext';
import { formatAuthError } from '../../utils/authErrors';

export const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, signup, loginWithGoogle } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Automatically navigate as soon as user is authenticated
  useEffect(() => {
    if (user) {
      navigate('/home');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password) {
      setError('Please fill in all fields.');
      return;
    }
    if (!agreeTerms) {
      setError('Please agree to the Terms & Privacy Policy.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await signup(name.trim(), email.trim(), password);
      navigate('/setup-profile');
    } catch (err: any) {
      const msg = formatAuthError(err);
      if (msg) setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('[SignupPage] Initiating Google Sign-In...');
      await loginWithGoogle();
    } catch (err: any) {
      console.error('[SignupPage] Google signup failed:', err);
      const msg = formatAuthError(err);
      if (msg) setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-white flex flex-col justify-between select-none">
      
      {/* Centered full-page container */}
      <div className="w-full max-w-md mx-auto min-h-screen bg-white flex flex-col justify-between">
        
        {/* Top Header with Purple-to-Blue Gradient (Matching Login Page) */}
        <div className="relative w-full bg-gradient-to-r from-[#9B26B6] via-[#6339C9] to-[#2188FF] pt-16 pb-28 sm:pb-32 px-6 text-white text-center">
          
          {/* Centered Large "Sign Up" Title */}
          <h1 className="text-4xl sm:text-[46px] font-black text-white tracking-tight drop-shadow-md pb-1">
            Sign Up
          </h1>

          {/* Exact Matching Cutout Curve */}
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

        {/* White Body Form Section (Centered) */}
        <div className="px-6 sm:px-8 pt-0 pb-8 flex-1 flex flex-col justify-start items-center w-full -mt-2">
          
          <div className="w-full max-w-sm space-y-4">
            
            {/* Official Craft AI Brand Logo & Name */}
            <div className="flex items-center justify-center pt-1">
              <Logo size="md" />
            </div>

            {/* "Get Started" Title in Purple-to-Blue Gradient */}
            <div className="text-center flex items-center justify-center -mt-1">
              <h2 className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-[#9B26B6] via-[#7B2CBF] to-[#2188FF] bg-clip-text text-transparent tracking-tight text-center">
                Get Started
              </h2>
            </div>

            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold text-center">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} autoComplete="off" className="space-y-3.5 pt-1">
              
              {/* Full Name */}
              <div className="space-y-1">
                <input
                  type="text"
                  placeholder="Enter Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-5 py-4 rounded-2xl border border-gray-300 bg-white text-base sm:text-lg text-gray-900 placeholder-gray-400 placeholder:text-base focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition shadow-2xs font-medium"
                  required
                />
              </div>

              {/* Email */}
              <div className="space-y-1">
                <input
                  type="email"
                  placeholder="Enter Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-5 py-4 rounded-2xl border border-gray-300 bg-white text-base sm:text-lg text-gray-900 placeholder-gray-400 placeholder:text-base focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition shadow-2xs font-medium"
                  required
                />
              </div>

              {/* Password */}
              <div className="space-y-1 relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  className="w-full pl-5 pr-14 py-4 rounded-2xl border border-gray-300 bg-white text-base sm:text-lg text-gray-900 placeholder-gray-400 placeholder:text-base focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition shadow-2xs font-medium"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition p-1"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {/* Terms Checkbox */}
              <div className="flex items-center gap-2 pt-1 pl-2">
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="w-4 h-4 rounded text-purple-600 accent-purple-600 focus:ring-purple-500 cursor-pointer"
                />
                <label htmlFor="terms" className="text-xs text-gray-600 cursor-pointer">
                  I agree to the <span className="text-purple-600 font-bold">Terms & Privacy Policy</span>
                </label>
              </div>

              {/* Gradient Sign Up Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#9B26B6] via-[#6339C9] to-[#2188FF] text-white text-lg font-black tracking-wide shadow-md shadow-purple-500/25 hover:opacity-95 active:scale-[0.99] transition disabled:opacity-50 mt-1"
              >
                {loading ? 'Creating Account...' : 'Sign Up'}
              </button>
            </form>

            {/* Social Sign Up Options */}
            <div className="pt-2 flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={handleGoogleSignup}
                className="flex h-12 w-12 items-center justify-center rounded-full border border-gray-200 bg-white hover:bg-gray-50 transition shadow-2xs active:scale-95"
                title="Google Sign Up"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24Z"/>
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15Z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"/>
                </svg>
              </button>

              <button
                type="button"
                onClick={() => alert('Facebook sign-in: Set FACEBOOK_APP_ID in Firebase console for live OAuth.')}
                className="flex h-12 w-12 items-center justify-center rounded-full border border-gray-200 bg-white hover:bg-gray-50 transition shadow-2xs text-[#1877F2] active:scale-95"
                title="Facebook"
              >
                <span className="text-xl font-black">f</span>
              </button>
            </div>
          </div>

          {/* Bottom Login Link */}
          <p className="text-center text-sm text-gray-500 pt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-[#8338EC] font-black hover:underline">
              Login
            </Link>
          </p>

        </div>

      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Eye, EyeOff, CheckCircle2, RefreshCw } from 'lucide-react';
import { Logo } from '../../components/common/Logo';
import { useAuth } from '../../contexts/AuthContext';
import { formatAuthError } from '../../utils/authErrors';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, login, loginWithGoogle, resendVerificationEmail } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Verification handling
  const [isUnverified, setIsUnverified] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [verifiedSuccess, setVerifiedSuccess] = useState(false);

  // Parse URL query params (e.g. ?verified=true&email=...)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const isVerifiedParam = params.get('verified') === 'true';
    const emailParam = params.get('email');

    if (isVerifiedParam) {
      setVerifiedSuccess(true);
    }
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [location.search]);

  // Resend countdown timer
  useEffect(() => {
    let timer: any;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  // Automatically navigate as soon as user state is populated
  useEffect(() => {
    if (user) {
      if (user.religion && user.username) {
        navigate('/home');
      } else {
        navigate('/setup-profile');
      }
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please enter username / email and password');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setIsUnverified(false);
      setResendMessage(null);
      await login(email.trim(), password);
      // navigation is handled by useEffect or fallback here
    } catch (err: any) {
      const msg = formatAuthError(err);
      if (err?.code === 'auth/unverified-email' || (msg && msg.toLowerCase().includes('not verified'))) {
        setIsUnverified(true);
      }
      if (msg) setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || !email.trim()) return;
    try {
      setResendLoading(true);
      setResendMessage(null);
      await resendVerificationEmail(email.trim(), password);
      setResendMessage('Verification link sent! Check your inbox & spam folder.');
      setCountdown(60);
    } catch (err) {
      setResendMessage('Failed to resend. Please try again in a moment.');
    } finally {
      setResendLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true);
      setError(null);
      setIsUnverified(false);
      console.log('[LoginPage] Initiating Google Sign-In...');
      const profile = await loginWithGoogle();
      if (profile) {
        if (profile.religion && profile.username) {
          navigate('/home');
        } else {
          navigate('/setup-profile');
        }
      }
    } catch (err: any) {
      console.error('[LoginPage] Google sign-in failed:', err);
      const msg = formatAuthError(err);
      if (msg) setError(msg);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-white flex flex-col justify-between select-none">
      
      {/* Centered container */}
      <div className="w-full max-w-md mx-auto min-h-screen bg-white flex flex-col justify-between">
        
        {/* Top Header with Purple-to-Blue Gradient */}
        <div className="relative w-full bg-gradient-to-r from-[#9B26B6] via-[#6339C9] to-[#2188FF] pt-16 pb-28 sm:pb-32 px-6 text-white text-center">
          
          {/* Centered Large "Login" Title */}
          <h1 className="text-4xl sm:text-[46px] font-black text-white tracking-tight drop-shadow-md pb-1">
            Login
          </h1>

          {/* Exact Cutout Curve: Swoops up on left and goes flat across to the right */}
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

        {/* White Body Form Section */}
        <div className="px-6 sm:px-8 pt-0 pb-8 flex-1 flex flex-col justify-start items-center w-full -mt-2">
          
          <div className="w-full max-w-sm space-y-4">
            
            {/* Official Craft AI Brand Logo & Name */}
            <div className="flex items-center justify-center pt-1">
              <Logo size="md" />
            </div>

            {/* "Welcome" Title in Purple-to-Blue Gradient */}
            <div className="text-center flex items-center justify-center -mt-1">
              <h2 className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-[#9B26B6] via-[#7B2CBF] to-[#2188FF] bg-clip-text text-transparent tracking-tight text-center">
                Welcome
              </h2>
            </div>

            {/* Email Verified Success Banner */}
            {verifiedSuccess && !error && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>Email verified successfully! Please enter your password to log in.</span>
              </div>
            )}

            {/* Error Message & Verification Resend Action */}
            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold space-y-2">
                <div className="text-center">{error}</div>
                {isUnverified && (
                  <div className="pt-1 flex flex-col items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={countdown > 0 || resendLoading}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-600 text-white hover:bg-purple-700 font-bold transition text-[11px] shadow-xs disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${resendLoading ? 'animate-spin' : ''}`} />
                      <span>{countdown > 0 ? `Resend link (${countdown}s)` : 'Resend Verification Email'}</span>
                    </button>
                    {resendMessage && (
                      <span className="text-[11px] text-purple-700 font-medium">{resendMessage}</span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} autoComplete="off" className="space-y-3.5 pt-1">
              
              {/* Enter Username Input */}
              <div className="space-y-1">
                <input
                  type="text"
                  placeholder="Enter Username or Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
                  className="w-full px-5 py-4 rounded-2xl border border-gray-300 bg-white text-base sm:text-lg text-gray-900 placeholder-gray-400 placeholder:text-base focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition shadow-2xs font-medium"
                  required
                />
              </div>

              {/* Enter Password Input */}
              <div className="space-y-1 relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
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

              {/* Gradient Login Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#9B26B6] via-[#6339C9] to-[#2188FF] text-white text-lg font-black tracking-wide shadow-md shadow-purple-500/25 hover:opacity-95 active:scale-[0.99] transition disabled:opacity-50 mt-1"
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>

            {/* Forget Password ? Centered Bold Link */}
            <div className="text-center pt-1">
              <Link
                to="/forgot-password"
                className="text-base font-black text-gray-900 hover:text-purple-600 transition tracking-tight"
              >
                Forget Password ?
              </Link>
            </div>

            {/* Social Login Options */}
            <div className="pt-1 flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={googleLoading}
                className="flex h-12 w-12 items-center justify-center rounded-full border border-gray-200 bg-white hover:bg-gray-50 transition shadow-2xs active:scale-95 disabled:opacity-50"
                title="Google Sign In"
              >
                {googleLoading ? (
                  <RefreshCw className="w-5 h-5 text-purple-600 animate-spin" />
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"/>
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24Z"/>
                    <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15Z"/>
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"/>
                  </svg>
                )}
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

          {/* Bottom Sign Up Link */}
          <p className="text-center text-sm text-gray-500 pt-4">
            Don't have an account?{' '}
            <Link to="/signup" className="text-[#8338EC] font-black hover:underline">
              Sign Up
            </Link>
          </p>

        </div>

      </div>
    </div>
  );
};

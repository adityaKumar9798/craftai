import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, MailCheck, ArrowRight, RefreshCw, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Logo } from '../../components/common/Logo';
import { useAuth } from '../../contexts/AuthContext';
import { formatAuthError } from '../../utils/authErrors';

export const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, signup, loginWithGoogle, resendVerificationEmail } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [emailLoading, setEmailLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Verification State
  const [verificationSent, setVerificationSent] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  // Timer for resend cooldown
  useEffect(() => {
    let timer: any;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  // Automatically navigate as soon as user is authenticated (e.g. from Google login)
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
      setEmailLoading(true);
      setError(null);
      const res = await signup(name.trim(), email.trim(), password);
      setRegisteredEmail(res.email);
      setVerificationSent(true);
      setCountdown(60);
    } catch (err: any) {
      const msg = formatAuthError(err);
      if (msg) setError(msg);
    } finally {
      setEmailLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || !registeredEmail) return;
    try {
      setResendLoading(true);
      setResendStatus(null);
      await resendVerificationEmail(registeredEmail, password);
      setResendStatus('Verification link resent! Please check your inbox & spam folder.');
      setCountdown(60);
    } catch (err) {
      setResendStatus('Failed to resend. Please try again in a moment.');
    } finally {
      setResendLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      setGoogleLoading(true);
      setError(null);
      console.log('[SignupPage] Initiating Google Sign-In...');
      const profile = await loginWithGoogle();
      if (profile) {
        navigate('/home');
      }
    } catch (err: any) {
      console.error('[SignupPage] Google signup failed:', err);
      const msg = formatAuthError(err);
      if (msg) setError(msg);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-white flex flex-col justify-between select-none">
      
      {/* Centered full-page container */}
      <div className="w-full max-w-md mx-auto min-h-screen bg-white flex flex-col justify-between">
        
        {/* Top Header with Purple-to-Blue Gradient */}
        <div className="relative w-full bg-gradient-to-r from-[#9B26B6] via-[#6339C9] to-[#2188FF] pt-16 pb-28 sm:pb-32 px-6 text-white text-center">
          
          {/* Centered Large "Sign Up" Title */}
          <h1 className="text-4xl sm:text-[46px] font-black text-white tracking-tight drop-shadow-md pb-1">
            {verificationSent ? 'Verify Email' : 'Sign Up'}
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

        {/* White Body Section (Centered) */}
        <div className="px-6 sm:px-8 pt-0 pb-8 flex-1 flex flex-col justify-start items-center w-full -mt-2">
          
          {verificationSent ? (
            /* Email Verification Confirmation Card */
            <div className="w-full max-w-sm space-y-5 pt-2 text-center animate-in fade-in duration-300">
              
              {/* Mail Icon with Glowing Aura */}
              <div className="flex justify-center">
                <div className="relative">
                  <div className="absolute -inset-2 bg-purple-500/20 rounded-full blur-lg animate-pulse"></div>
                  <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-tr from-[#9B26B6] via-[#7B2CBF] to-[#2188FF] flex items-center justify-center text-white shadow-xl shadow-purple-500/25 ring-4 ring-purple-100">
                    <MailCheck className="w-10 h-10 stroke-[2.5]" />
                  </div>
                </div>
              </div>

              {/* Title & Email Display */}
              <div className="space-y-1.5">
                <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                  Check Your Inbox
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed font-normal">
                  We've sent a verification link to:
                </p>
                <div className="inline-block px-4 py-2 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 font-bold text-sm break-all shadow-2xs">
                  {registeredEmail}
                </div>
              </div>

              {/* Steps Card */}
              <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 text-left space-y-2.5 text-xs text-gray-600">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                  <span>Open the email sent from Craft AI.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                  <span>Click the verification link to activate your account.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                  <span>Log in and start creating amazing posts!</span>
                </div>
              </div>

              {resendStatus && (
                <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 text-xs font-semibold">
                  {resendStatus}
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3 pt-1">
                <Link
                  to={`/login?email=${encodeURIComponent(registeredEmail)}`}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#9B26B6] via-[#6339C9] to-[#2188FF] text-white text-base sm:text-lg font-black tracking-wide shadow-md shadow-purple-500/25 hover:opacity-95 active:scale-[0.99] transition flex items-center justify-center gap-2"
                >
                  <span>Proceed to Login</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>

                <button
                  type="button"
                  onClick={handleResend}
                  disabled={countdown > 0 || resendLoading}
                  className="w-full py-3 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-sm font-bold transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-2xs"
                >
                  <RefreshCw className={`w-4 h-4 ${resendLoading ? 'animate-spin' : ''}`} />
                  <span>{countdown > 0 ? `Resend Link (${countdown}s)` : 'Resend Verification Link'}</span>
                </button>
              </div>

              <p className="text-[11px] text-gray-400">
                Didn't receive the email? Check your <strong>Spam folder</strong>.
              </p>

            </div>
          ) : (
            /* Standard Signup Form */
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
                  disabled={emailLoading}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#9B26B6] via-[#6339C9] to-[#2188FF] text-white text-lg font-black tracking-wide shadow-md shadow-purple-500/25 hover:opacity-95 active:scale-[0.99] transition disabled:opacity-50 mt-1"
                >
                  {emailLoading ? 'Sending Verification Link...' : 'Sign Up'}
                </button>
              </form>

              {/* Social Sign Up Options */}
              <div className="pt-2 flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={handleGoogleSignup}
                  disabled={googleLoading}
                  className="flex h-12 w-12 items-center justify-center rounded-full border border-gray-200 bg-white hover:bg-gray-50 transition shadow-2xs active:scale-95 disabled:opacity-50"
                  title="Google Sign Up"
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

              {/* Bottom Login Link */}
              <p className="text-center text-sm text-gray-500 pt-4">
                Already have an account?{' '}
                <Link to="/login" className="text-[#8338EC] font-black hover:underline">
                  Login
                </Link>
              </p>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};

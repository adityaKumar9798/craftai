import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  ArrowRight, 
  ArrowLeft, 
  Sparkles, 
  Check, 
  Lock
} from 'lucide-react';
import { Logo } from '../../components/common/Logo';
import { useAuth } from '../../contexts/AuthContext';
import { ReligionType } from '../../types';

export const ProfileSetupPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateUserProfile } = useAuth();

  const [step, setStep] = useState<1 | 2>(1);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [userId, setUserId] = useState('');
  const [selectedReligion, setSelectedReligion] = useState<ReligionType | null>(null);
  const [privacyAccepted, setPrivacyAccepted] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-fill existing user info if available
  useEffect(() => {
    if (user) {
      if (user.firstName) setFirstName(user.firstName);
      else if (user.name) {
        const parts = user.name.split(' ');
        setFirstName(parts[0] || '');
        setLastName(parts.slice(1).join(' ') || '');
      }
      if (user.lastName) setLastName(user.lastName);
      if (user.username) setUserId(user.username.replace(/^@/, ''));
      else if (user.email) {
        setUserId(user.email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_'));
      }
      if (user.religion) setSelectedReligion(user.religion);
    }
  }, [user]);

  const handleFirstNameChange = (val: string) => {
    setFirstName(val);
    if (!userId || userId === firstName.toLowerCase().replace(/[^a-zA-Z0-9_]/g, '')) {
      const clean = `${val}_${lastName}`.toLowerCase().replace(/[^a-zA-Z0-9_]/g, '').slice(0, 18);
      if (clean && clean !== '_') setUserId(clean);
    }
  };

  const handleLastNameChange = (val: string) => {
    setLastName(val);
    if (!userId || userId.startsWith(firstName.toLowerCase())) {
      const clean = `${firstName}_${val}`.toLowerCase().replace(/[^a-zA-Z0-9_]/g, '').slice(0, 18);
      if (clean && clean !== '_') setUserId(clean);
    }
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim()) {
      setError('Please enter your first name.');
      return;
    }
    if (!userId.trim()) {
      setError('Please choose a User ID / Username.');
      return;
    }
    setError(null);
    setStep(2);
  };

  const handleFinalSubmit = async () => {
    if (!selectedReligion) {
      setError('Please select your community / religion.');
      return;
    }
    if (!privacyAccepted) {
      setError('Please accept the Privacy Policy to personalize your experience.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const cleanUsername = userId.trim().startsWith('@') 
        ? userId.trim() 
        : `@${userId.trim().replace(/[^a-zA-Z0-9_]/g, '')}`;

      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim() || user?.name || 'User';

      await updateUserProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        name: fullName,
        username: cleanUsername,
        religion: selectedReligion,
        privacyAccepted: true,
        onboardingCompleted: true,
      });

      navigate('/home');
    } catch (err: any) {
      setError(err?.message || 'Failed to update profile. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const religions: {
    id: ReligionType;
    title: string;
    icon: string;
    tagline: string;
    description: string;
    borderActiveClass: string;
  }[] = [
    {
      id: 'hindu',
      title: 'Hindu',
      icon: '🕉️',
      tagline: 'Sanatan Dharma & Bhakti',
      description: 'Daily Aarti, Bhagwan Ram, Mahadev, Krishna, Shlokas & Festivals',
      borderActiveClass: 'border-amber-500 ring-2 ring-amber-400/40 bg-amber-50/60 text-amber-900',
    },
    {
      id: 'muslim',
      title: 'Muslim',
      icon: '☪️',
      tagline: 'Islamic Greetings & Duas',
      description: 'Jumma Mubarak, Subah Bakhair, Quranic Ayats, Ramadan & Eid',
      borderActiveClass: 'border-emerald-500 ring-2 ring-emerald-400/40 bg-emerald-50/60 text-emerald-900',
    },
    {
      id: 'sikh',
      title: 'Sikh',
      icon: '☬',
      tagline: 'Waheguru & Gurbani',
      description: 'Golden Temple, Mool Mantar, Gurpurab & Punjabi Spiritual Cards',
      borderActiveClass: 'border-blue-600 ring-2 ring-blue-400/40 bg-blue-50/60 text-blue-900',
    },
    {
      id: 'christian',
      title: 'Christian',
      icon: '✝️',
      tagline: 'Grace & Daily Scripture',
      description: 'Bible Verses, Sunday Blessings, Gospel Status, Christmas & Hope',
      borderActiveClass: 'border-purple-600 ring-2 ring-purple-400/40 bg-purple-50/60 text-purple-900',
    },
  ];

  return (
    <div className="min-h-screen w-full bg-white flex flex-col justify-between select-none">
      <div className="w-full max-w-md mx-auto min-h-screen bg-white flex flex-col justify-between shadow-xs">
        
        {/* Top Header with Purple-to-Blue Gradient (Full bleed to edges) */}
        <div className="relative w-full bg-gradient-to-r from-[#9B26B6] via-[#6339C9] to-[#2188FF] pt-16 pb-26 sm:pb-30 px-6 text-white text-center">
          
          {/* Step Title on Header */}
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight drop-shadow-md">
            {step === 1 ? 'Profile Details' : 'Choose Community'}
          </h1>

          {/* Step Indicator Pills */}
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className={`h-1.5 rounded-full transition-all duration-300 ${step === 1 ? 'w-8 bg-white' : 'w-4 bg-white/40'}`} />
            <span className={`h-1.5 rounded-full transition-all duration-300 ${step === 2 ? 'w-8 bg-white' : 'w-4 bg-white/40'}`} />
          </div>

          {/* Bottom Wave Cutout */}
          <div className="absolute -bottom-[1px] left-0 right-0 overflow-hidden leading-none pointer-events-none w-full">
            <svg
              viewBox="0 0 400 80"
              preserveAspectRatio="none"
              className="w-full h-16 sm:h-20 text-white fill-current"
            >
              <path d="M 0 75 C 0 25, 30 8, 85 8 L 400 8 L 400 80 L 0 80 Z" />
            </svg>
          </div>
        </div>

        {/* Content Body (Full Page) */}
        <div className="px-6 sm:px-8 pt-2 pb-10 flex-1 flex flex-col justify-between space-y-6">
          
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold text-center">
              {error}
            </div>
          )}

          {/* ── STEP 1: Personal Details ──────────────────────────────────────── */}
          {step === 1 && (
            <form onSubmit={handleNextStep} className="space-y-4 pt-1">
              
              {/* Official Craft AI Brand Logo & Name */}
              <div className="flex items-center justify-center pt-1 pb-1">
                <Logo size="md" />
              </div>

              <div className="text-center space-y-1">
                <h2 className="text-3xl font-black bg-gradient-to-r from-[#9B26B6] via-[#7B2CBF] to-[#2188FF] bg-clip-text text-transparent text-center">
                  Personal Details
                </h2>
                <p className="text-xs text-gray-400 font-medium text-center">
                  Please enter your name and choose a unique User ID
                </p>
              </div>

              {/* First Name Input (Exact same styling as login input) */}
              <div className="space-y-1">
                <input
                  type="text"
                  placeholder="Enter First Name"
                  value={firstName}
                  onChange={(e) => handleFirstNameChange(e.target.value)}
                  className="w-full px-5 py-4 rounded-2xl border border-gray-300 bg-white text-base sm:text-lg text-gray-900 placeholder-gray-400 placeholder:text-base focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition shadow-2xs font-medium"
                  required
                />
              </div>

              {/* Last Name Input (Exact same styling as login input) */}
              <div className="space-y-1">
                <input
                  type="text"
                  placeholder="Enter Last Name"
                  value={lastName}
                  onChange={(e) => handleLastNameChange(e.target.value)}
                  className="w-full px-5 py-4 rounded-2xl border border-gray-300 bg-white text-base sm:text-lg text-gray-900 placeholder-gray-400 placeholder:text-base focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition shadow-2xs font-medium"
                />
              </div>

              {/* User ID Input (Exact same styling as login input) */}
              <div className="space-y-1">
                <input
                  type="text"
                  placeholder="Enter User ID (e.g. rohit_01)"
                  value={userId ? (userId.startsWith('@') ? userId : `@${userId}`) : ''}
                  onChange={(e) => setUserId(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                  className="w-full px-5 py-4 rounded-2xl border border-gray-300 bg-white text-base sm:text-lg text-gray-900 placeholder-gray-400 placeholder:text-base focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition shadow-2xs font-medium"
                  required
                />
              </div>

              {/* Next Button (Exact same styling as login button) */}
              <button
                type="submit"
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#9B26B6] via-[#6339C9] to-[#2188FF] text-white text-lg font-black tracking-wide shadow-md shadow-purple-500/25 hover:opacity-95 active:scale-[0.99] transition flex items-center justify-center gap-2 mt-2"
              >
                <span>Next</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </form>
          )}

          {/* ── STEP 2: Religion & Privacy Policy ─────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-4 pt-1">
              <div className="text-center space-y-1">
                <h2 className="text-3xl font-black bg-gradient-to-r from-[#9B26B6] via-[#7B2CBF] to-[#2188FF] bg-clip-text text-transparent text-center">
                  Your Community
                </h2>
                <p className="text-xs text-gray-400 font-medium text-center">
                  We'll tailor devotional & festive templates to your faith
                </p>
              </div>

              {/* 4 Faith Cards */}
              <div className="grid grid-cols-1 gap-2.5">
                {religions.map((rel) => {
                  const isSelected = selectedReligion === rel.id;
                  return (
                    <div
                      key={rel.id}
                      onClick={() => {
                        setSelectedReligion(rel.id);
                        setError(null);
                      }}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? rel.borderActiveClass
                          : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50/60'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="text-2xl w-10 h-10 rounded-xl bg-white shadow-2xs border border-gray-100 flex items-center justify-center">
                          {rel.icon}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-extrabold text-gray-900">{rel.title}</h3>
                            <span className="text-[10px] text-gray-400">({rel.tagline})</span>
                          </div>
                          <p className="text-[11px] text-gray-500 leading-tight mt-0.5 max-w-[240px]">
                            {rel.description}
                          </p>
                        </div>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center border transition ${
                          isSelected
                            ? 'bg-purple-600 border-purple-600 text-white'
                            : 'border-gray-300 bg-white'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Privacy Policy Box */}
              <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200/80 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800">
                  <Lock className="w-3.5 h-3.5 text-purple-600" />
                  <span>Privacy & Personalization Policy</span>
                </div>
                <p className="text-[11px] text-gray-600 leading-relaxed">
                  Your community preference is used exclusively to customize devotional cards & video statuses. Your data is private and secure.
                </p>

                <div className="pt-1.5 flex items-center justify-between border-t border-gray-200/60">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={privacyAccepted}
                      onChange={(e) => setPrivacyAccepted(e.target.checked)}
                      className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 accent-purple-600 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-gray-800">
                      Accept Privacy Policy
                    </span>
                  </label>

                  <button
                    type="button"
                    onClick={() => setPrivacyAccepted(false)}
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-md transition ${
                      !privacyAccepted ? 'bg-rose-100 text-rose-700' : 'text-gray-400'
                    }`}
                  >
                    Reject
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-1/3 py-3.5 rounded-2xl border border-gray-200 text-gray-700 font-bold text-xs hover:bg-gray-50 transition flex items-center justify-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={submitting || !selectedReligion || !privacyAccepted}
                  className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-[#9B26B6] via-[#6339C9] to-[#2188FF] text-white font-bold text-xs shadow-md shadow-purple-500/20 hover:opacity-95 active:scale-[0.99] transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <span>Saving...</span>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Complete & Start</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

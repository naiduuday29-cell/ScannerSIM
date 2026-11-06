import React, { useState } from 'react';
import {
  X,
  Mail,
  Lock,
  User,
  Building,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  KeyRound,
  Flame,
  Check,
  Inbox
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { FirebaseConfigModal } from './FirebaseConfigModal';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
  onOpenPricing?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
  onOpenPricing
}) => {
  const {
    login,
    register,
    checkEmailVerified,
    resendVerificationEmail,
    sendPasswordReset,
    verifyEmailCode,
    resendVerificationCode,
    pendingEmail,
    verificationCodeSent,
    isFirebaseActive
  } = useAuth();

  const [mode, setMode] = useState<'login' | 'register' | 'verify' | 'forgot_password'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [company, setCompany] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isFirebaseModalOpen, setIsFirebaseModalOpen] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setError(null);
      setStatusMessage(null);
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setStatusMessage(null);
    setLoading(true);
    try {
      const res = await login(email, password);
      if (res.success) {
        if (res.requiresVerification) {
          setMode('verify');
          setStatusMessage('Please verify your email to complete registration.');
        } else {
          onClose();
        }
      } else {
        setError(res.error || 'Failed to login');
      }
    } catch (err: any) {
      setError(err?.message || 'Unexpected login error');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setStatusMessage(null);
    setLoading(true);
    try {
      const res = await register(name, email, password, company);
      if (res.success && res.requiresVerification) {
        setMode('verify');
        if (isFirebaseActive) {
          setStatusMessage(`A verification link has been sent to ${email.trim()}.`);
        }
      } else {
        setError(res.error || 'Failed to register');
      }
    } catch (err: any) {
      setError(err?.message || 'Unexpected registration error');
    } finally {
      setLoading(false);
    }
  };

  // Firebase Email Verification Link Check
  const handleCheckFirebaseVerified = async () => {
    setError(null);
    setStatusMessage(null);
    setLoading(true);
    try {
      const isVerified = await checkEmailVerified();
      if (isVerified) {
        setStatusMessage('Email verified successfully! Activating your 15-day trial...');
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setError('Verification not detected yet. Please ensure you clicked the link in your email inbox, then try again.');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to check verification status');
    } finally {
      setLoading(false);
    }
  };

  // Local OTP Code verification (fallback/simulation)
  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setStatusMessage(null);
    setLoading(true);
    try {
      const res = await verifyEmailCode(verificationCode);
      if (res.success) {
        onClose();
      } else {
        setError(res.error || 'Invalid verification code');
      }
    } catch (err: any) {
      setError(err?.message || 'Verification error');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError(null);
    setStatusMessage(null);
    setLoading(true);
    try {
      if (isFirebaseActive) {
        const res = await resendVerificationEmail();
        if (res.success) {
          setStatusMessage('A fresh verification link has been sent to your email.');
        } else {
          setError(res.error || 'Failed to resend email');
        }
      } else {
        const newCode = await resendVerificationCode();
        console.log('[Dev Offline Verification Code]:', newCode);
        setStatusMessage('A fresh verification code has been dispatched. (Note: Connect Firebase for live inbox delivery).');
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to resend verification');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Please enter your account email address first.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await sendPasswordReset(email);
      if (res.success) {
        setStatusMessage(`Password reset link sent to ${email}. Check your inbox.`);
      } else {
        setError(res.error || 'Failed to send password reset');
      }
    } catch (err: any) {
      setError('Error sending password reset email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-150">
        <div className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden text-slate-100 font-sans">
          
          {/* Header */}
          <div className="px-5 py-4 bg-industrial-950 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold font-mono tracking-wide uppercase text-slate-100">
                  {mode === 'verify'
                    ? 'Verify Your Email'
                    : mode === 'forgot_password'
                    ? 'Reset Password'
                    : mode === 'register'
                    ? 'Create Free Account'
                    : 'Engineer Login'}
                </h3>
                <p className="text-[11px] text-cyan-400 font-mono">
                  {mode === 'verify'
                    ? '15-Day Free Trial Activation'
                    : mode === 'register'
                    ? '15 Days Full Access Included'
                    : mode === 'forgot_password'
                    ? 'Recover Access to Your Account'
                    : 'Access Your Scanner Deployments'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Form Body */}
          <div className="p-5 space-y-4">
            
            {/* Mode Switch Tabs (Login vs Register) */}
            {mode !== 'verify' && mode !== 'forgot_password' && (
              <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError(null);
                    setStatusMessage(null);
                  }}
                  className={`py-1.5 rounded-lg font-semibold transition-all ${
                    mode === 'login'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setError(null);
                    setStatusMessage(null);
                  }}
                  className={`py-1.5 rounded-lg font-semibold transition-all flex items-center justify-center gap-1.5 ${
                    mode === 'register'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>Register</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                    15D FREE
                  </span>
                </button>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Success / Status Message */}
            {statusMessage && (
              <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{statusMessage}</span>
              </div>
            )}

            {/* =================================================================
                1. LOGIN VIEW
               ================================================================= */}
            {mode === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold text-[11px]">
                    Work Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      placeholder="engineer@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none text-xs"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-slate-300 font-semibold text-[11px]">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot_password');
                        setError(null);
                        setStatusMessage(null);
                      }}
                      className="text-[11px] text-cyan-400 hover:underline"
                    >
                      Forgot?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none text-xs"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-2 px-4 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-cyan-950/50 border border-cyan-400/40 transition-all cursor-pointer"
                >
                  <span>{loading ? 'Signing in...' : 'Sign In'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            )}

            {/* =================================================================
                2. REGISTRATION VIEW (15-Day Free Plan)
               ================================================================= */}
            {mode === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="space-y-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold text-[11px]">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      placeholder="Jane Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold text-[11px]">
                    Work Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      placeholder="jane@automation-systems.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold text-[11px]">
                    Company / Organization
                  </label>
                  <div className="relative">
                    <Building className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Vision Robotics Ltd"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold text-[11px]">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="password"
                      required
                      placeholder="Minimum 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none text-xs"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-2 px-4 rounded-lg bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-950/50 border border-emerald-400/40 transition-all cursor-pointer"
                >
                  <span>{loading ? 'Creating Account...' : 'Start 15-Day Free Trial'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            )}

            {/* =================================================================
                3. EMAIL VERIFICATION VIEW (Firebase Link or Fallback OTP)
               ================================================================= */}
            {mode === 'verify' && (
              isFirebaseActive ? (
                /* LIVE FIREBASE VERIFICATION VIEW */
                <div className="space-y-4 text-xs font-mono">
                  <div className="text-center space-y-1.5">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto mb-2">
                      <Inbox className="w-6 h-6" />
                    </div>
                    <h4 className="font-bold text-slate-100 text-sm">Verify Your Email Address</h4>
                    <p className="text-[11px] text-slate-400">
                      We have sent a verification link to:
                    </p>
                    <p className="text-cyan-300 font-bold break-all">{pendingEmail || email}</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-300 space-y-1.5">
                    <p className="font-semibold text-white">Instructions:</p>
                    <p>1. Open your inbox and click the verification link in the email from Firebase.</p>
                    <p>2. Once clicked, press the <strong>"I Have Verified"</strong> button below to activate your 15-day trial.</p>
                  </div>

                  <div className="space-y-2 pt-1">
                    <button
                      type="button"
                      disabled={loading}
                      onClick={handleCheckFirebaseVerified}
                      className="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-950/50 border border-emerald-400/40 transition-all cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>{loading ? 'Checking Status...' : 'I Have Verified (Activate Trial)'}</span>
                    </button>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                      <button
                        type="button"
                        onClick={handleResend}
                        disabled={loading}
                        className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Resend Email</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setMode('register')}
                        className="hover:text-slate-200"
                      >
                        Change Email
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* OTP CONFIRMATION VIEW (Offline Fallback) */
                <form onSubmit={handleVerifySubmit} className="space-y-4 text-xs font-mono">
                  <div className="text-center space-y-1.5">
                    <div className="w-12 h-12 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex items-center justify-center mx-auto mb-2">
                      <KeyRound className="w-6 h-6" />
                    </div>
                    <h4 className="font-bold text-slate-100 text-sm">Enter 6-Digit Verification Code</h4>
                    <p className="text-[11px] text-slate-400">
                      Confirmation code dispatched to:
                    </p>
                    <p className="text-cyan-300 font-bold">{pendingEmail || email}</p>
                  </div>

                  {/* Inform user why code wasn't delivered to their email inbox yet */}
                  <div className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-500/40 text-[11px] text-amber-300 flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                      <span>Live email inbox delivery requires Firebase</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsFirebaseModalOpen(true)}
                      className="underline text-amber-200 hover:text-white font-semibold cursor-pointer flex-shrink-0"
                    >
                      Connect Firebase
                    </button>
                  </div>

                  <div>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      placeholder="123456"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.trim())}
                      className="w-full bg-slate-950 border-2 border-cyan-500/60 rounded-xl px-4 py-2.5 text-center text-xl font-mono tracking-widest text-slate-100 focus:border-cyan-400 focus:outline-none shadow-inner"
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <button
                      type="button"
                      onClick={handleResend}
                      className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Resend Code</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode('register')}
                      className="hover:text-slate-200"
                    >
                      Change Email
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || verificationCode.length !== 6}
                    className="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 disabled:opacity-40 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-950/50 border border-emerald-400/40 transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Verify & Activate 15-Day Free Trial</span>
                  </button>
                </form>
              )
            )}

            {/* =================================================================
                4. FORGOT PASSWORD VIEW
               ================================================================= */}
            {mode === 'forgot_password' && (
              <form onSubmit={handleForgotPassword} className="space-y-3">
                <div className="text-xs text-slate-400 mb-2">
                  Enter your email address and we'll send you a link to reset your password.
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold text-[11px]">
                    Work Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      placeholder="engineer@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none text-xs"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-2 px-4 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-cyan-950/50 border border-cyan-400/40 transition-all cursor-pointer"
                >
                  <span>{loading ? 'Sending...' : 'Send Password Reset Link'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setError(null);
                      setStatusMessage(null);
                    }}
                    className="text-[11px] text-slate-400 hover:text-white"
                  >
                    ← Back to Sign In
                  </button>
                </div>
              </form>
            )}

            {/* Pricing Link */}
            {onOpenPricing && mode !== 'verify' && (
              <div className="pt-2 border-t border-slate-800 text-center">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenPricing();
                  }}
                  className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  View Subscription Plans & Pricing ($30/mo, $120/6mo, $199/yr) →
                </button>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Firebase Setup & Configuration Modal */}
      <FirebaseConfigModal
        isOpen={isFirebaseModalOpen}
        onClose={() => setIsFirebaseModalOpen(false)}
      />
    </>
  );
};

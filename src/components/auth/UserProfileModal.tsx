import React, { useState } from 'react';
import {
  X,
  User,
  Mail,
  Building,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Unlock,
  Zap,
  LogOut,
  ArrowRight,
  ShieldCheck,
  Check,
  RotateCcw,
  Sparkles,
  Flame,
  Key,
  Copy,
  Info,
  ShieldAlert,
  Send
} from 'lucide-react';
import { useAuth, SubscriptionPlan } from '../../context/AuthContext';
import { FirebaseConfigModal } from './FirebaseConfigModal';
import { AdminLicenseModal } from './AdminLicenseModal';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'profile' | 'pricing';
  onOpenAuthModal?: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'profile',
  onOpenAuthModal
}) => {
  const {
    user,
    isAuthenticated,
    isSimSetupLocked,
    trialDaysRemaining,
    licenseDaysRemaining,
    isFirebaseActive,
    activateLicenseKey,
    logout,
    upgradePlan,
    simulateTrialExpiry,
    resetTrial
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'profile' | 'pricing'>(defaultTab);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [isFirebaseModalOpen, setIsFirebaseModalOpen] = useState(false);
  const [isAdminLicenseModalOpen, setIsAdminLicenseModalOpen] = useState(false);

  // License Activation State
  const [licenseInput, setLicenseInput] = useState('');
  const [licenseError, setLicenseError] = useState<string | null>(null);
  const [licenseLoading, setLicenseLoading] = useState(false);

  // Manual Order Request Dialog
  const [orderModalPlan, setOrderModalPlan] = useState<{
    tier: 'monthly' | 'half_yearly' | 'yearly';
    name: string;
    price: string;
    days: number;
  } | null>(null);
  const [orderCopied, setOrderCopied] = useState(false);

  // Listen for admin shortcut: Ctrl+Shift+L or ?admin URL parameter to open license generator
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'L' || e.key === 'l')) {
        e.preventDefault();
        setIsAdminLicenseModalOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    if (new URLSearchParams(window.location.search).has('admin')) {
      setIsAdminLicenseModalOpen(true);
    }

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Sync defaultTab when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab);
      setSuccessBanner(null);
      setLicenseError(null);
    }
  }, [isOpen, defaultTab]);

  if (!isOpen) return null;

  const handleActivateLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!licenseInput.trim()) {
      setLicenseError('Please enter a license key.');
      return;
    }

    setLicenseError(null);
    setLicenseLoading(true);
    try {
      const res = await activateLicenseKey(licenseInput.trim());
      if (res.success) {
        setSuccessBanner(
          `License successfully activated! ${res.durationDays} days of full access bound to ${user?.email}.`
        );
        setLicenseInput('');
        setTimeout(() => {
          setSuccessBanner(null);
        }, 5000);
      } else {
        setLicenseError(res.error || 'Failed to activate license key.');
      }
    } catch (err: any) {
      setLicenseError(err?.message || 'Unexpected activation error.');
    } finally {
      setLicenseLoading(false);
    }
  };

  const getPlanBadge = (plan: SubscriptionPlan) => {
    switch (plan) {
      case 'yearly':
        if (licenseDaysRemaining <= 0) {
          return { text: 'Yearly License (Expired)', color: 'bg-rose-500/20 text-rose-300 border-rose-500/40' };
        }
        return { text: `Yearly License (${licenseDaysRemaining}d left)`, color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' };
      case 'half_yearly':
        if (licenseDaysRemaining <= 0) {
          return { text: 'Half-Year License (Expired)', color: 'bg-rose-500/20 text-rose-300 border-rose-500/40' };
        }
        return { text: `Half-Year License (${licenseDaysRemaining}d left)`, color: 'bg-purple-500/20 text-purple-300 border-purple-500/40' };
      case 'monthly':
        if (licenseDaysRemaining <= 0) {
          return { text: 'Monthly License (Expired)', color: 'bg-rose-500/20 text-rose-300 border-rose-500/40' };
        }
        return { text: `Monthly License (${licenseDaysRemaining}d left)`, color: 'bg-blue-500/20 text-blue-300 border-blue-500/40' };
      case 'trial':
      default:
        if (isSimSetupLocked) {
          return { text: '15-Day Free Trial (Expired)', color: 'bg-rose-500/20 text-rose-300 border-rose-500/40' };
        }
        return { text: `15-Day Free Trial (${trialDaysRemaining}d remaining)`, color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' };
    }
  };

  const planInfo = user ? getPlanBadge(user.plan) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden font-sans">
        
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-industrial-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">
                  Account & Licensing Portal
                </h2>
                {planInfo && (
                  <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full border ${planInfo.color}`}>
                    {planInfo.text}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Single-account duration licensing & simulation status
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Modal Tab Switcher */}
            <div className="flex bg-slate-950/80 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setActiveTab('profile')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === 'profile'
                    ? 'bg-cyan-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Account Details
              </button>
              <button
                onClick={() => setActiveTab('pricing')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
                  activeTab === 'pricing'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md'
                    : 'text-amber-400 hover:text-amber-300'
                }`}
              >
                <Key className="w-3.5 h-3.5" />
                <span>Plans & Licenses</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Global Notification Banner */}
        {successBanner && (
          <div className="bg-emerald-950/90 border-b border-emerald-600/60 px-6 py-2.5 flex items-center justify-between text-xs text-emerald-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span className="font-medium">{successBanner}</span>
            </div>
            <button
              onClick={() => setSuccessBanner(null)}
              className="text-emerald-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-950/40">
          {activeTab === 'profile' ? (
            /* TAB 1: USER DETAILS & LICENSE STATUS */
            <div className="space-y-6 max-w-2xl mx-auto">
              
              {/* Profile Card */}
              {user ? (
                <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 shadow-md space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-600 to-blue-700 flex items-center justify-center text-white font-extrabold text-xl shadow-lg border border-cyan-400/30">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-white">{user.name}</h3>
                          <span className="flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            <ShieldCheck className="w-3 h-3" />
                            Email Verified
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <Mail className="w-3.5 h-3.5 text-slate-500" />
                          {user.email}
                        </p>
                        {user.company && (
                          <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <Building className="w-3.5 h-3.5 text-slate-500" />
                            {user.company}
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        logout();
                        onClose();
                        onOpenAuthModal?.();
                      }}
                      className="px-3 py-1.5 rounded-lg border border-slate-700 hover:border-rose-500/50 hover:bg-rose-500/10 text-slate-400 hover:text-rose-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
                      title="Sign Out or Switch Account"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>

                  {/* Registered Timestamp */}
                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>Registered on {new Date(user.registeredAt).toLocaleDateString()}</span>
                    </div>
                    <span className="font-mono text-[11px] text-slate-500">
                      Account ID: {user.id}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-3">
                  <p className="text-sm text-slate-300">You are not currently signed in.</p>
                  <button
                    onClick={() => {
                      onClose();
                      onOpenAuthModal?.();
                    }}
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold"
                  >
                    Open Login / Register Portal
                  </button>
                </div>
              )}

              {/* License / Trial Plan Status Card */}
              <div className={`p-5 rounded-xl border ${
                isSimSetupLocked
                  ? 'bg-rose-950/20 border-rose-500/40'
                  : 'bg-slate-900/80 border-slate-800'
              } space-y-4`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      isSimSetupLocked ? 'bg-rose-500/20 text-rose-400' : 'bg-cyan-500/20 text-cyan-400'
                    }`}>
                      {isSimSetupLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">
                        {user?.plan === 'trial'
                          ? '15-Day Free Evaluation Trial'
                          : `${user?.plan === 'yearly' ? 'Yearly' : user?.plan === 'half_yearly' ? 'Half-Year' : 'Monthly'} Commercial License`}
                      </h4>
                      <p className="text-xs text-slate-400">
                        {user?.plan === 'trial'
                          ? 'Free evaluation period. Once expired, Sim Setup locks until a license is activated.'
                          : `Bound to this account for an assigned duration of ${user?.licenseDurationDays || 30} days.`}
                      </p>
                    </div>
                  </div>

                  <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-md border ${
                    isSimSetupLocked
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                      : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                  }`}>
                    {isSimSetupLocked
                      ? 'EXPIRED'
                      : user?.plan === 'trial'
                      ? `${trialDaysRemaining} DAYS LEFT`
                      : `${licenseDaysRemaining} DAYS LEFT`}
                  </span>
                </div>

                {/* License Key details if assigned */}
                {user?.activeLicenseKey && (
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-xs font-mono">
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-slate-500 block uppercase">Active Bound License Key:</span>
                      <span className="text-cyan-300 font-bold">{user.activeLicenseKey}</span>
                    </div>
                    {user.licenseExpiresAt && (
                      <div className="text-right space-y-0.5">
                        <span className="text-[10px] text-slate-500 block uppercase">Expires on:</span>
                        <span className="text-slate-300">{new Date(user.licenseExpiresAt).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Lockout / Status Explanation */}
                <div className={`p-3.5 rounded-lg border text-xs leading-relaxed ${
                  isSimSetupLocked
                    ? 'bg-rose-950/40 border-rose-600/40 text-rose-200'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300'
                }`}>
                  {isSimSetupLocked ? (
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-white block font-semibold mb-1">
                          Sim Setup Tab is currently locked
                        </strong>
                        Your assigned evaluation or license duration has expired. Sim Setup (Conveyor, Part, and Scanner Deployment) is locked from modifications.
                        <div className="mt-2 text-slate-300">
                          To restore full access, activate a new single-account license key below.
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                      <span>
                        Sim Setup Tab is <strong>100% operational</strong>. All features unlocked for your account.
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-2 flex items-center justify-between gap-3">
                  <button
                    onClick={() => setActiveTab('pricing')}
                    className="flex-1 py-2 px-4 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-orange-950/40 transition-all cursor-pointer"
                  >
                    <Key className="w-4 h-4" />
                    <span>Enter License Key or View Plans</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            </div>
          ) : (
            /* TAB 2: PLANS & LICENSE ACTIVATION */
            <div className="space-y-6 max-w-3xl mx-auto py-2">
              
              {/* Header */}
              <div className="text-center space-y-1">
                <h3 className="text-xl font-extrabold text-white tracking-tight">
                  Commercial Licensing Plans
                </h3>
                <p className="text-xs text-slate-400">
                  Each license key is issued for <strong>1 account</strong> and valid for the <strong>assigned duration</strong>.
                </p>
              </div>

              {/* =================================================================
                  LICENSE KEY ACTIVATION BOX
                 ================================================================= */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-industrial-900 border-2 border-cyan-500/50 shadow-xl space-y-3">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-cyan-400" />
                  <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                    Activate Your License Key
                  </h4>
                </div>

                <form onSubmit={handleActivateLicense} className="flex flex-col sm:flex-row gap-2.5">
                  <input
                    type="text"
                    required
                    placeholder="SIM-M30-XXXX-XXXX (Paste your license key here)"
                    value={licenseInput}
                    onChange={(e) => setLicenseInput(e.target.value.toUpperCase())}
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono text-cyan-200 placeholder-slate-500 tracking-wider focus:outline-none focus:border-cyan-400 shadow-inner"
                  />
                  <button
                    type="submit"
                    disabled={licenseLoading || !licenseInput.trim()}
                    className="py-2.5 px-5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-cyan-950/50 cursor-pointer active:scale-95 transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{licenseLoading ? 'Verifying...' : 'Activate License'}</span>
                  </button>
                </form>

                {licenseError && (
                  <div className="p-2.5 rounded-lg bg-rose-950/50 border border-rose-500/50 flex items-center gap-2 text-xs text-rose-200">
                    <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                    <span>{licenseError}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    Strict 1 License per Account Enforcement
                  </span>
                  <span>Instant Sim Setup Tab Unlocking</span>
                </div>
              </div>

              {/* 3 Pricing / License Tiers */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                
                {/* 1. Monthly Plan (30 Days) */}
                <div className={`relative flex flex-col justify-between p-5 rounded-2xl border transition-all ${
                  user?.plan === 'monthly'
                    ? 'bg-blue-950/40 border-blue-500 shadow-xl shadow-blue-950/50'
                    : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                }`}>
                  {user?.plan === 'monthly' && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-blue-500 text-white text-[10px] font-bold uppercase tracking-wider font-mono">
                      Current Plan
                    </div>
                  )}

                  <div className="space-y-3 mb-6">
                    <span className="text-xs font-mono font-bold text-blue-400 tracking-wider">
                      MONTHLY LICENSE
                    </span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold text-white font-mono">$30</span>
                      <span className="text-xs text-slate-400 font-mono">/ 30 days</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                      <Check className="w-3.5 h-3.5" />
                      <span>Full Access for 30 Days</span>
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      setOrderModalPlan({
                        tier: 'monthly',
                        name: 'Monthly License',
                        price: '$30',
                        days: 30
                      })
                    }
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/40 cursor-pointer active:scale-95 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Order License ($30)</span>
                  </button>
                </div>

                {/* 2. Half-Year Plan (180 Days) */}
                <div className={`relative flex flex-col justify-between p-5 rounded-2xl border transition-all ${
                  user?.plan === 'half_yearly'
                    ? 'bg-purple-950/40 border-purple-500 shadow-xl shadow-purple-950/50'
                    : 'bg-gradient-to-b from-slate-900/90 to-slate-900/60 border-purple-500/60 shadow-lg shadow-purple-950/20'
                }`}>
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-[10px] font-bold uppercase tracking-wider font-mono shadow-md">
                    {user?.plan === 'half_yearly' ? 'Current Plan' : 'SAVE 33%'}
                  </div>

                  <div className="space-y-3 mb-6">
                    <span className="text-xs font-mono font-bold text-purple-400 tracking-wider">
                      HALF YEAR LICENSE
                    </span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold text-white font-mono">$120</span>
                      <span className="text-xs text-slate-400 font-mono">/ 180 days</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                      <Check className="w-3.5 h-3.5" />
                      <span>Full Access for 180 Days</span>
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      setOrderModalPlan({
                        tier: 'half_yearly',
                        name: 'Half-Year License',
                        price: '$120',
                        days: 180
                      })
                    }
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-900/50 cursor-pointer active:scale-95 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Order License ($120)</span>
                  </button>
                </div>

                {/* 3. Yearly Plan (365 Days) */}
                <div className={`relative flex flex-col justify-between p-5 rounded-2xl border transition-all ${
                  user?.plan === 'yearly'
                    ? 'bg-amber-950/40 border-amber-500 shadow-xl shadow-amber-950/50'
                    : 'bg-slate-900/90 border-amber-500/50 hover:border-amber-400 shadow-lg shadow-amber-950/20'
                }`}>
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-bold uppercase tracking-wider font-mono shadow-md">
                    {user?.plan === 'yearly' ? 'Current Plan' : 'SAVE 45%'}
                  </div>

                  <div className="space-y-3 mb-6">
                    <span className="text-xs font-mono font-bold text-amber-400 tracking-wider">
                      YEARLY LICENSE
                    </span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold text-white font-mono">$199</span>
                      <span className="text-xs text-slate-400 font-mono">/ 365 days</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                      <Check className="w-3.5 h-3.5" />
                      <span>Full Access for 365 Days</span>
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      setOrderModalPlan({
                        tier: 'yearly',
                        name: 'Yearly Enterprise License',
                        price: '$199',
                        days: 365
                      })
                    }
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white shadow-lg shadow-orange-900/50 cursor-pointer active:scale-95 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Order License ($199)</span>
                  </button>
                </div>

              </div>

              {/* Single Account Policy Notice */}
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-200 font-semibold block">Non-Automated Manual Purchase Workflow:</span>
                  1. Click <strong>"Order License"</strong> on any tier to copy your account details for manual invoice/payment.
                  <br />
                  2. After payment is received, the administrator will provide your unique license key.
                  <br />
                  3. Enter the key above. The key is cryptographically bound to your account and remains active for the assigned duration.
                </div>
              </div>

            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-industrial-900/80 flex items-center justify-between text-xs text-slate-400">
          <span className="font-mono text-[11px]">
            ScannerSIM Industrial Architecture v1.4
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
          >
            Close
          </button>
        </div>

      </div>

      {/* Manual Order Request Dialog */}
      {orderModalPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4 font-sans text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm text-white">License Order Request</h3>
              </div>
              <button
                onClick={() => setOrderModalPlan(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Purchases are processed manually (Invoice, Bank Transfer, PayPal). Please send the following details to sales or the administrator to issue your license:
            </p>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs font-mono">
              <div>
                <span className="text-slate-500">Plan:</span>{' '}
                <strong className="text-cyan-300">{orderModalPlan.name} ({orderModalPlan.price})</strong>
              </div>
              <div>
                <span className="text-slate-500">Duration:</span>{' '}
                <strong className="text-white">{orderModalPlan.days} Days</strong>
              </div>
              <div>
                <span className="text-slate-500">Account Email:</span>{' '}
                <strong className="text-white">{user?.email || 'unregistered@user.com'}</strong>
              </div>
              <div>
                <span className="text-slate-500">Account ID:</span>{' '}
                <strong className="text-slate-300">{user?.id || 'N/A'}</strong>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2">
              <button
                onClick={() => {
                  const text = `ScannerSIM License Order Request:\nPlan: ${orderModalPlan.name} (${orderModalPlan.price})\nDuration: ${orderModalPlan.days} Days\nAccount Email: ${user?.email}\nAccount ID: ${user?.id}`;
                  navigator.clipboard.writeText(text);
                  setOrderCopied(true);
                  setTimeout(() => setOrderCopied(false), 2500);
                }}
                className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-700"
              >
                {orderCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-300" />
                    <span>Copy Order Details</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setOrderModalPlan(null)}
                className="py-2 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-bold text-white"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin License Key Generator Modal */}
      <AdminLicenseModal
        isOpen={isAdminLicenseModalOpen}
        onClose={() => setIsAdminLicenseModalOpen(false)}
        onSelectKeyToActivate={(key) => {
          setLicenseInput(key);
          setActiveTab('pricing');
        }}
      />

      {/* Firebase Setup & Configuration Modal */}
      <FirebaseConfigModal
        isOpen={isFirebaseModalOpen}
        onClose={() => setIsFirebaseModalOpen(false)}
      />
    </div>
  );
};

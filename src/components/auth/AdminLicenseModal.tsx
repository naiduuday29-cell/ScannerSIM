import React, { useState } from 'react';
import {
  X,
  Key,
  Copy,
  Check,
  Sparkles,
  ShieldAlert,
  UserCheck,
  RefreshCw,
  Clock,
  Calendar,
  Flame
} from 'lucide-react';
import {
  generateLicenseKey,
  getRedeemedLicenses,
  SAMPLE_LICENSE_KEYS,
  RedeemedLicenseRecord
} from '../../services/licenseService';
import { isFirebaseConfigured } from '../../services/firebase';
import { FirebaseConfigModal } from './FirebaseConfigModal';

interface AdminLicenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectKeyToActivate?: (key: string) => void;
}

export const AdminLicenseModal: React.FC<AdminLicenseModalProps> = ({
  isOpen,
  onClose,
  onSelectKeyToActivate
}) => {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'half_yearly' | 'yearly'>('monthly');
  const [customDays, setCustomDays] = useState(30);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [redeemedList, setRedeemedList] = useState<Record<string, RedeemedLicenseRecord>>({});
  const [isFirebaseModalOpen, setIsFirebaseModalOpen] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setRedeemedList(getRedeemedLicenses());
      setCopiedKey(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePlanChange = (plan: 'monthly' | 'half_yearly' | 'yearly') => {
    setSelectedPlan(plan);
    if (plan === 'monthly') setCustomDays(30);
    else if (plan === 'half_yearly') setCustomDays(180);
    else if (plan === 'yearly') setCustomDays(365);
  };

  const handleGenerate = () => {
    const key = generateLicenseKey(selectedPlan, customDays);
    setGeneratedKey(key);
  };

  const handleCopy = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey(null);
    }, 2500);
  };

  const redeemedArray = Object.values(redeemedList);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden font-sans">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-industrial-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Key className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">
                  License Key Generator & Manager
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  ADMIN TOOL
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Issue single-account licenses with assigned duration (30, 180, or 365 days)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">

          {/* Firebase Connection & Live Email Status */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                isFirebaseConfigured() ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
              }`}>
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">Firebase & Live Email Verification</span>
                  <span className={`text-[10px] font-mono px-2 py-0.2 rounded-full border ${
                    isFirebaseConfigured()
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  }`}>
                    {isFirebaseConfigured() ? 'Connected (Live)' : 'Not Connected (Demo Mode)'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {isFirebaseConfigured()
                    ? 'Firebase is active. Real verification emails are sent to corporate inboxes.'
                    : 'Connect your Firebase project to send real verification emails to users.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsFirebaseModalOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-xs font-semibold text-cyan-300 transition-colors"
            >
              Configure Firebase
            </button>
          </div>
          
          {/* Key Generator Section */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-4">
            <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Issue New Single-Account License</span>
            </h3>

            {/* Plan Selector */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handlePlanChange('monthly')}
                className={`py-2 px-3 rounded-lg border text-xs font-semibold transition-all ${
                  selectedPlan === 'monthly'
                    ? 'bg-blue-600/30 border-blue-500 text-blue-200 shadow-sm'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Monthly (30 Days)
              </button>
              <button
                type="button"
                onClick={() => handlePlanChange('half_yearly')}
                className={`py-2 px-3 rounded-lg border text-xs font-semibold transition-all ${
                  selectedPlan === 'half_yearly'
                    ? 'bg-purple-600/30 border-purple-500 text-purple-200 shadow-sm'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Half-Year (180 Days)
              </button>
              <button
                type="button"
                onClick={() => handlePlanChange('yearly')}
                className={`py-2 px-3 rounded-lg border text-xs font-semibold transition-all ${
                  selectedPlan === 'yearly'
                    ? 'bg-amber-600/30 border-amber-500 text-amber-200 shadow-sm'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Yearly (365 Days)
              </button>
            </div>

            {/* Custom Days Input */}
            <div className="flex items-center gap-3 text-xs">
              <span className="text-slate-400 font-mono">Assigned Duration:</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={1}
                  max={3650}
                  value={customDays}
                  onChange={(e) => setCustomDays(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-700 text-xs font-mono text-white text-center focus:outline-none focus:border-amber-500"
                />
                <span className="text-slate-400">days</span>
              </div>

              <button
                type="button"
                onClick={handleGenerate}
                className="ml-auto px-4 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold text-xs shadow-md shadow-orange-950/40 cursor-pointer"
              >
                Generate License Key
              </button>
            </div>

            {/* Generated Key Display */}
            {generatedKey && (
              <div className="p-3.5 rounded-xl bg-slate-900 border border-amber-500/40 flex items-center justify-between gap-3 animate-in fade-in duration-150">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider block">
                    Generated License Key ({customDays} Days):
                  </span>
                  <span className="text-sm font-mono font-bold text-white tracking-wider select-all">
                    {generatedKey}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopy(generatedKey)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 flex items-center gap-1.5 border border-slate-700"
                  >
                    {copiedKey === generatedKey ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400 font-semibold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>

                  {onSelectKeyToActivate && (
                    <button
                      type="button"
                      onClick={() => {
                        onSelectKeyToActivate(generatedKey);
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold"
                    >
                      Use to Activate
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sample Ready-to-Test Keys */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
              Ready-to-Test Pre-Generated Keys:
            </h4>
            <div className="space-y-2">
              {SAMPLE_LICENSE_KEYS.map((item) => (
                <div
                  key={item.key}
                  className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs font-mono"
                >
                  <div className="space-y-0.5">
                    <span className="text-[11px] text-slate-400 font-sans block">{item.name}</span>
                    <span className="text-cyan-300 font-bold tracking-wider">{item.key}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleCopy(item.key)}
                      className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
                      title="Copy Key"
                    >
                      {copiedKey === item.key ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    {onSelectKeyToActivate && (
                      <button
                        type="button"
                        onClick={() => {
                          onSelectKeyToActivate(item.key);
                          onClose();
                        }}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-200"
                      >
                        Auto-Fill
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Redeemed Licenses Registry (Proof of 1 License = 1 Account) */}
          <div className="space-y-2.5 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Active Account Bindings ({redeemedArray.length})</span>
              </h4>
              <span className="text-[10px] text-slate-500 font-mono">
                1 License = 1 Account Enforced
              </span>
            </div>

            {redeemedArray.length === 0 ? (
              <p className="text-xs text-slate-500 italic p-3 rounded-lg bg-slate-950/40 border border-slate-800/60 text-center">
                No licenses redeemed yet. Once an account activates a license key, it will be strictly bound to that email address here.
              </p>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {redeemedArray.map((rec) => (
                  <div
                    key={rec.licenseKey}
                    className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-cyan-300 font-bold">{rec.licenseKey}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 font-mono border border-purple-500/30">
                          {rec.durationDays}d
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        Bound to: <strong className="text-slate-200">{rec.boundToEmail}</strong>
                      </span>
                    </div>

                    <span className="text-[10px] font-mono text-slate-500">
                      {new Date(rec.redeemedAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-industrial-900/80 flex items-center justify-between text-xs text-slate-400">
          <span className="font-mono text-[11px]">
            Single-Account Cryptographic Signature Engine
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium"
          >
            Close
          </button>
        </div>

      </div>

      {/* Firebase Setup Modal */}
      <FirebaseConfigModal
        isOpen={isFirebaseModalOpen}
        onClose={() => setIsFirebaseModalOpen(false)}
      />
    </div>
  );
};

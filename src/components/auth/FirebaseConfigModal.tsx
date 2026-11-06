import React, { useState } from 'react';
import {
  X,
  Flame,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  Save,
  RotateCcw,
  ShieldCheck,
  HelpCircle
} from 'lucide-react';
import {
  getStoredFirebaseConfig,
  saveFirebaseConfig,
  clearFirebaseConfig,
  isFirebaseConfigured,
  FirebaseConfig
} from '../../services/firebase';

interface FirebaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FirebaseConfigModal: React.FC<FirebaseConfigModalProps> = ({
  isOpen,
  onClose
}) => {
  const currentConfig = getStoredFirebaseConfig();
  const isConfigured = isFirebaseConfigured();

  const [apiKey, setApiKey] = useState(currentConfig?.apiKey || '');
  const [projectId, setProjectId] = useState(currentConfig?.projectId || '');
  const [authDomain, setAuthDomain] = useState(currentConfig?.authDomain || '');
  const [appId, setAppId] = useState(currentConfig?.appId || '');
  const [jsonConfig, setJsonConfig] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleJsonPaste = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setJsonConfig(val);
    setError(null);
    try {
      // Support pasting whole firebaseConfig object e.g. const firebaseConfig = { ... }
      const cleanJson = val.replace(/^[^{]*/, '').replace(/[^}]*$/, '');
      const parsed = JSON.parse(cleanJson);
      if (parsed.apiKey) setApiKey(parsed.apiKey);
      if (parsed.projectId) setProjectId(parsed.projectId);
      if (parsed.authDomain) setAuthDomain(parsed.authDomain);
      if (parsed.appId) setAppId(parsed.appId);
    } catch {
      // Not yet complete JSON, ignore while user is typing
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim() || !projectId.trim()) {
      setError('API Key and Project ID are required.');
      return;
    }

    const newConfig: FirebaseConfig = {
      apiKey: apiKey.trim(),
      projectId: projectId.trim(),
      authDomain: authDomain.trim() || `${projectId.trim()}.firebaseapp.com`,
      appId: appId.trim() || ''
    };

    saveFirebaseConfig(newConfig);
    onClose();
  };

  const handleClear = () => {
    if (confirm('Are you sure you want to remove the current Firebase configuration?')) {
      clearFirebaseConfig();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden font-sans">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-industrial-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">
                  Firebase Authentication Setup
                </h2>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                  isConfigured
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                }`}>
                  {isConfigured ? 'LIVE CONNECTED' : 'DEMO MODE'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                50,000 monthly active users completely free with real email delivery
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
        <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          
          {error && (
            <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-500/50 flex items-center gap-2 text-xs text-rose-200">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick instructions */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300 space-y-2">
            <div className="font-semibold text-white flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                How to get your free Firebase keys:
              </span>
              <a
                href="https://console.firebase.google.com"
                target="_blank"
                rel="noreferrer"
                className="text-cyan-400 hover:underline flex items-center gap-1 text-[11px]"
              >
                <span>Firebase Console</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-slate-400 text-[11px]">
              <li>Create a free project at <strong>console.firebase.google.com</strong></li>
              <li>Go to <strong>Build → Authentication</strong>, click <strong>Get Started</strong>, and enable <strong>Email/Password</strong></li>
              <li>Under Project Settings → General → <em>Your apps</em>, add a Web app and copy your <strong>firebaseConfig</strong> keys below</li>
            </ol>
          </div>

          {/* Quick Paste JSON */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
              <span>Quick Paste (Paste full firebaseConfig JSON):</span>
              <span className="text-[10px] text-slate-500 font-mono">Auto-fills fields</span>
            </label>
            <textarea
              value={jsonConfig}
              onChange={handleJsonPaste}
              placeholder={`{ "apiKey": "AIzaSy...", "authDomain": "...", "projectId": "..." }`}
              rows={2}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="space-y-1">
              <label className="text-[11px] font-mono text-slate-400">API Key *</label>
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                required
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-mono text-slate-400">Project ID *</label>
              <input
                type="text"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                placeholder="scanner-sim-prod"
                required
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-mono text-slate-400">Auth Domain</label>
              <input
                type="text"
                value={authDomain}
                onChange={(e) => setAuthDomain(e.target.value)}
                placeholder="scanner-sim-prod.firebaseapp.com"
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-mono text-slate-400">App ID</label>
              <input
                type="text"
                value={appId}
                onChange={(e) => setAppId(e.target.value)}
                placeholder="1:123456789:web:abcdef..."
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
            {currentConfig ? (
              <button
                type="button"
                onClick={handleClear}
                className="px-3 py-2 rounded-lg border border-rose-500/40 hover:bg-rose-500/10 text-rose-300 text-xs font-medium transition-colors"
              >
                Disconnect Firebase
              </button>
            ) : (
              <span className="text-[11px] text-slate-500">
                Leaves in local simulation mode
              </span>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-orange-950/40 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save & Connect</span>
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};

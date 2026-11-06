import React, { useRef, useState } from 'react';
import {
  Scan,
  Download,
  Upload,
  FileText,
  User,
  Sparkles,
  Lock,
  Zap,
  Crown
} from 'lucide-react';
import { useSimulator } from '../../context/SimulatorContext';
import { useAuth } from '../../context/AuthContext';
import { CadReportModal } from '../common/CadReportModal';
import { UserProfileModal } from '../auth/UserProfileModal';
import { AuthModal } from '../auth/AuthModal';

export const Header: React.FC = () => {
  const {
    scanners,
    conveyor,
    units,
    exportConfiguration,
    importConfiguration
  } = useSimulator();

  const {
    user,
    isAuthenticated,
    isSimSetupLocked,
    trialDaysRemaining,
    licenseDaysRemaining
  } = useAuth();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCadModalOpen, setIsCadModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileModalTab, setProfileModalTab] = useState<'profile' | 'pricing'>('profile');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isAuthenticated) {
      openAuth('login');
      e.target.value = '';
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const ok = importConfiguration(content);
        if (ok) {
          alert('Configuration imported successfully!');
        } else {
          alert('Invalid configuration file.');
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleImportClick = () => {
    if (!isAuthenticated) {
      openAuth('login');
      return;
    }
    fileInputRef.current?.click();
  };

  const handleExportClick = () => {
    if (!isAuthenticated) {
      openAuth('login');
      return;
    }
    exportConfiguration();
  };

  const openUserProfile = (tab: 'profile' | 'pricing' = 'profile') => {
    setProfileModalTab(tab);
    setIsProfileModalOpen(true);
  };

  const openAuth = (mode: 'login' | 'register' = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  return (
    <>
      <header className="h-14 bg-industrial-900/95 border-b border-slate-800/80 px-4 flex items-center justify-between z-40 select-none shadow-md">
        {/* Brand & Subtitle */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Scan className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm tracking-wider text-slate-100 font-mono">
                SCANNER<span className="text-cyan-400">SIM</span>
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800 font-semibold">
                ENTERPRISE 3D
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Multi-Scanner Array & Motion Coverage Validation Studio
            </p>
          </div>
        </div>

        {/* Actions: Import / Export / Report / Pricing / User Details */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".json"
            className="hidden"
          />

          {/* Import Configuration Button */}
          <button
            onClick={handleImportClick}
            title={isAuthenticated ? "Import JSON Configuration" : "Import Configuration (Log in required)"}
            className={`p-1.5 sm:px-2.5 sm:py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 border transition-all cursor-pointer ${
              isAuthenticated
                ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700'
                : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 border-slate-800 hover:border-amber-500/40'
            }`}
          >
            {isAuthenticated ? (
              <Upload className="w-3.5 h-3.5 text-slate-400" />
            ) : (
              <Lock className="w-3.5 h-3.5 text-amber-400" />
            )}
            <span className="hidden sm:inline">Import</span>
            {!isAuthenticated && (
              <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                Lock
              </span>
            )}
          </button>

          {/* Export Configuration Button */}
          <button
            onClick={handleExportClick}
            title={isAuthenticated ? "Export JSON Configuration" : "Export Configuration (Log in required)"}
            className={`p-1.5 sm:px-2.5 sm:py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 border transition-all cursor-pointer ${
              isAuthenticated
                ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700'
                : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 border-slate-800 hover:border-amber-500/40'
            }`}
          >
            {isAuthenticated ? (
              <Download className="w-3.5 h-3.5 text-slate-400" />
            ) : (
              <Lock className="w-3.5 h-3.5 text-amber-400" />
            )}
            <span className="hidden sm:inline">Export</span>
            {!isAuthenticated && (
              <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                Lock
              </span>
            )}
          </button>

          {/* Report Button: Opens CAD Drawing Sheet Viewer & PDF Exporter */}
          <button
            onClick={() => setIsCadModalOpen(true)}
            title="View & Download Mechanical Installation CAD Drawings with Mounting Dimensions"
            className="p-1.5 sm:px-3 sm:py-1 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm shadow-cyan-950/50 border border-cyan-400/40 transition-all cursor-pointer active:scale-95"
          >
            <FileText className="w-3.5 h-3.5 text-cyan-200" />
            <span>Report</span>
          </button>

          {/* Pricing Quick Button */}
          <button
            onClick={() => openUserProfile('pricing')}
            title="View Pricing Plans: $30/mo, $120/6mo, $199/yr"
            className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-300 text-xs font-semibold flex items-center gap-1.5 border border-amber-500/40 shadow-sm transition-all cursor-pointer active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">Pricing</span>
          </button>

          <div className="h-6 w-px bg-slate-800 mx-0.5 hidden sm:block" />

          {/* USER DETAILS BUTTON (Top-Right Corner) */}
          {isAuthenticated && user ? (
            <button
              onClick={() => openUserProfile('profile')}
              title="Open User Profile & Subscription Management"
              className={`flex items-center gap-2 py-1 px-2.5 rounded-xl border transition-all text-xs cursor-pointer ${
                isSimSetupLocked
                  ? 'bg-rose-950/50 hover:bg-rose-900/60 border-rose-500/60 text-rose-200'
                  : user.plan !== 'trial'
                  ? 'bg-purple-950/50 hover:bg-purple-900/60 border-purple-500/60 text-purple-200'
                  : 'bg-slate-800/90 hover:bg-slate-700 border-slate-700 text-slate-200'
              }`}
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white text-[11px] font-bold shadow-sm">
                {user.name.charAt(0).toUpperCase()}
              </div>

              <div className="hidden md:flex flex-col text-left leading-tight">
                <span className="font-semibold text-xs text-white max-w-[110px] truncate">
                  {user.name}
                </span>
                <span className="text-[10px] text-slate-400 truncate max-w-[110px]">
                  {user.company || user.email}
                </span>
              </div>

              {/* Status Pill Badge */}
              {user.plan === 'trial' ? (
                isSimSetupLocked ? (
                  <span className="flex items-center gap-1 font-mono text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold">
                    <Lock className="w-2.5 h-2.5" />
                    Locked
                  </span>
                ) : (
                  <span className="flex items-center gap-1 font-mono text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold">
                    <Zap className="w-2.5 h-2.5 text-cyan-400" />
                    {trialDaysRemaining}d left
                  </span>
                )
              ) : isSimSetupLocked ? (
                <span className="flex items-center gap-1 font-mono text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold">
                  <Lock className="w-2.5 h-2.5" />
                  Expired
                </span>
              ) : (
                <span className="flex items-center gap-1 font-mono text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                  <Crown className="w-2.5 h-2.5 text-amber-400" />
                  {licenseDaysRemaining}d left
                </span>
              )}
            </button>
          ) : (
            <button
              onClick={() => openAuth('register')}
              title="Sign In or Register for 15-Day Free Trial"
              className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs shadow-md shadow-cyan-950/40 transition-all cursor-pointer"
            >
              <User className="w-3.5 h-3.5" />
              <span>15-Day Free Trial</span>
            </button>
          )}

        </div>
      </header>

      {/* Mechanical CAD Drawing Sheet Viewer & PDF Generator Modal */}
      <CadReportModal
        isOpen={isCadModalOpen}
        onClose={() => setIsCadModalOpen(false)}
        conveyor={conveyor}
        scanners={scanners}
        units={units}
      />

      {/* User Details & Pricing Portal Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        defaultTab={profileModalTab}
        onOpenAuthModal={() => openAuth('login')}
      />

      {/* Authentication & Email Verification Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
        onOpenPricing={() => openUserProfile('pricing')}
      />
    </>
  );
};
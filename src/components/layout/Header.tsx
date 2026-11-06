import React, { useRef, useState, useEffect } from 'react';
import {
  Scan,
  Download,
  Upload,
  FileText,
  User,
  Sparkles,
  Lock,
  Zap,
  Crown,
  LogIn,
  LogOut,
  ChevronDown
} from 'lucide-react';
import { useSimulator } from '../../context/SimulatorContext';
import { useAuth } from '../../context/AuthContext';
import { CadReportModal } from '../common/CadReportModal';
import { UserProfileModal } from '../auth/UserProfileModal';
import { AuthModal } from '../auth/AuthModal';

// Circular user avatar matching user uploaded reference icon
const ProfileAvatarIcon: React.FC<{ className?: string }> = ({ className = "w-8 h-8" }) => (
  <svg
    viewBox="0 0 100 100"
    className={`${className} rounded-full select-none flex-shrink-0 shadow-sm`}
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <clipPath id="avatarClip">
        <circle cx="50" cy="50" r="50" />
      </clipPath>
    </defs>
    <g clipPath="url(#avatarClip)">
      <circle cx="50" cy="50" r="50" fill="#4B63FA" />
      <circle cx="50" cy="38" r="18" fill="#D8E1FF" />
      <ellipse cx="50" cy="86" rx="33" ry="24" fill="#D8E1FF" />
    </g>
  </svg>
);

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
    licenseDaysRemaining,
    logout
  } = useAuth();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const [isCadModalOpen, setIsCadModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileModalTab, setProfileModalTab] = useState<'profile' | 'pricing'>('profile');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Close dropdown menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserMenuOpen]);

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

          {/* USER DETAILS / AUTH BUTTON (Top-Right Corner) */}
          {isAuthenticated && user ? (
            <div className="relative" ref={userMenuRef}>
              {/* Profile Avatar Icon (Image 2) */}
              <button
                onClick={() => setIsUserMenuOpen((prev) => !prev)}
                title={user.name || user.email}
                className="relative rounded-full focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-all cursor-pointer hover:opacity-90 active:scale-95 flex items-center justify-center p-0.5"
              >
                <ProfileAvatarIcon className="w-8 h-8" />
                <span className={`absolute bottom-0.5 right-0.5 w-2.5 h-2.5 rounded-full border-2 border-industrial-900 ${
                  isSimSetupLocked ? 'bg-rose-500' : 'bg-emerald-400'
                }`} />
              </button>

              {/* Dropdown Menu (Image 3: Account, Pricing, Sign Out - 100% Opaque Solid Background) */}
              {isUserMenuOpen && (
                <div
                  style={{ backgroundColor: '#0f172a' }}
                  className="absolute right-0 top-full mt-2 w-64 bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150 font-sans"
                >
                  
                  {/* Header: Avatar + User Name & Email */}
                  <div className="p-2.5 flex items-center gap-3 border-b border-slate-800">
                    <ProfileAvatarIcon className="w-10 h-10 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-white truncate">
                        {user.name}
                      </h4>
                      <p className="text-[11px] text-slate-400 truncate">
                        {user.email}
                      </p>
                      <div className="mt-1">
                        {user.plan === 'trial' ? (
                          isSimSetupLocked ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
                              <Lock className="w-2.5 h-2.5" />
                              Trial Expired
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                              <Zap className="w-2.5 h-2.5 text-cyan-400" />
                              {trialDaysRemaining}d trial left
                            </span>
                          )
                        ) : isSimSetupLocked ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
                            <Lock className="w-2.5 h-2.5" />
                            License Expired
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            <Crown className="w-2.5 h-2.5 text-amber-400" />
                            {licenseDaysRemaining}d left
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Menu Options (Image 3: Account, Pricing, Sign Out) */}
                  <div className="py-1.5 space-y-0.5">
                    
                    {/* 1. Account Option */}
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        openUserProfile('profile');
                      }}
                      className="w-full px-3 py-2 rounded-xl text-left text-xs font-medium text-slate-200 hover:text-white hover:bg-slate-800/80 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <User className="w-4 h-4 text-cyan-400" />
                      <span>Account</span>
                    </button>

                    {/* 2. Pricing Option */}
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        openUserProfile('pricing');
                      }}
                      className="w-full px-3 py-2 rounded-xl text-left text-xs font-medium text-slate-200 hover:text-white hover:bg-slate-800/80 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>Pricing</span>
                    </button>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-slate-800 my-1" />

                  {/* 3. Sign Out Option */}
                  <div className="pt-0.5">
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        logout();
                      }}
                      className="w-full px-3 py-2 rounded-xl text-left text-xs font-medium text-rose-300 hover:text-rose-200 hover:bg-rose-500/10 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-rose-400" />
                      <span>Sign out</span>
                    </button>
                  </div>

                </div>
              )}
            </div>
          ) : (
            /* Login Button (Image 1) */
            <button
              onClick={() => openAuth('login')}
              title="Sign In to Your Account or Register"
              className="flex items-center gap-1.5 py-1.5 px-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs shadow-md shadow-cyan-950/40 transition-all cursor-pointer active:scale-95"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Login</span>
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
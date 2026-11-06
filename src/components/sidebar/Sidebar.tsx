import React, { useState } from 'react';
import {
  PanelLeftClose,
  PanelLeftOpen,
  SlidersHorizontal,
  Settings2,
  Wrench,
  Lock,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  User
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ConveyorSettingsCard } from './ConveyorSettingsCard';
import { PartSettingsCard } from './PartSettingsCard';
import { ScannerDeploymentCard } from './ScannerDeploymentCard';
import { EnvironmentSettingsCard } from './EnvironmentSettingsCard';
import { UserProfileModal } from '../auth/UserProfileModal';
import { AuthModal } from '../auth/AuthModal';

type SidebarTab = 'hardware' | 'environment';

export const Sidebar: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<SidebarTab>('hardware');
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const { user, isSimSetupLocked, isAuthenticated } = useAuth();

  return (
    <>
      {/* Floating Toggle button when collapsed */}
      {isCollapsed && (
        <button
          onClick={() => setIsCollapsed(false)}
          className="absolute top-16 left-4 z-30 p-2 bg-industrial-900/90 text-cyan-400 hover:text-cyan-300 rounded-lg border border-slate-700 shadow-xl backdrop-blur-md transition-all hover:scale-105"
          title="Open Configuration Sidebar"
        >
          <PanelLeftOpen className="w-5 h-5" />
        </button>
      )}

      {/* Main Left Sidebar */}
      <aside
        className={`relative z-20 h-full flex flex-col bg-industrial-950/95 border-r border-slate-800/80 backdrop-blur-xl transition-all duration-300 ${
          isCollapsed ? 'w-0 -translate-x-full overflow-hidden' : 'w-80 md:w-96 translate-x-0'
        }`}
      >
        {/* Sidebar Header & Tab Switcher */}
        <div className="border-b border-slate-800/80 flex-shrink-0 bg-industrial-900/70">
          <div className="h-11 px-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-300 tracking-wider">
              <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
              <span>CONFIGURATION ENGINE</span>
            </div>
            <button
              onClick={() => setIsCollapsed(true)}
              className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              title="Collapse Sidebar"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </div>

          {/* Subtabs: Hardware Array vs Environment & Units */}
          <div className="grid grid-cols-2 px-3 pb-2 gap-1.5 text-xs font-mono">
            <button
              onClick={() => setActiveTab('hardware')}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg border font-semibold transition-all ${
                activeTab === 'hardware'
                  ? isSimSetupLocked
                    ? 'bg-rose-500/20 border-rose-500/70 text-rose-300 shadow-sm'
                    : 'bg-cyan-500/20 border-cyan-500/70 text-cyan-300 shadow-sm'
                  : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {isSimSetupLocked ? (
                <Lock className="w-3.5 h-3.5 text-rose-400" />
              ) : (
                <Wrench className="w-3.5 h-3.5" />
              )}
              <span>Sim Setup {isSimSetupLocked && '(Locked)'}</span>
            </button>

            <button
              onClick={() => setActiveTab('environment')}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg border font-semibold transition-all ${
                activeTab === 'environment'
                  ? 'bg-purple-500/20 border-purple-500/70 text-purple-300 shadow-sm'
                  : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>Environment & Units</span>
            </button>
          </div>
        </div>

        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {activeTab === 'hardware' ? (
            isSimSetupLocked ? (
              /* SIM SETUP LOCKED PAYWALL / AUTH SCREEN */
              <div className="p-5 rounded-2xl bg-gradient-to-b from-rose-950/40 via-slate-900/90 to-slate-900 border border-rose-500/40 shadow-xl text-center space-y-4">
                <div className={`w-12 h-12 mx-auto rounded-2xl border flex items-center justify-center shadow-lg ${
                  !isAuthenticated
                    ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400 shadow-cyan-950/50'
                    : 'bg-rose-500/20 border-rose-500/40 text-rose-400 shadow-rose-950/50'
                }`}>
                  <Lock className="w-6 h-6" />
                </div>

                {!isAuthenticated ? (
                  /* Case 1: NOT LOGGED IN */
                  <>
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-mono font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                        Sign In Required
                      </span>
                      <h3 className="text-base font-bold text-white tracking-wide">
                        Sim Setup is Locked
                      </h3>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Please sign in or register for your 15-day free evaluation trial to customize conveyor geometry, part dimensions, and optical scanner positioning.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 text-[11px] text-slate-400 text-left space-y-1">
                      <div className="text-slate-200 font-semibold mb-1 flex items-center gap-1.5">
                        <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" />
                        Still Unlocked & Fully Operational:
                      </div>
                      <div>• 3D Viewport camera & orbit navigation</div>
                      <div>• Environment lighting, floor & unit toggles</div>
                      <div>• Mechanical CAD Drawing Sheet exports</div>
                      <div>• Real-time raycasting inspection & telemetry</div>
                    </div>

                    <button
                      onClick={() => setIsAuthModalOpen(true)}
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-950/50 transition-all cursor-pointer active:scale-95"
                    >
                      <User className="w-4 h-4" />
                      <span>Sign In / Register for Free Trial</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  /* Case 2: LOGGED IN BUT TRIAL / LICENSE EXPIRED */
                  <>
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-mono font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
                        {user?.plan === 'trial' ? '15-Day Free Trial Expired' : 'Commercial License Expired'}
                      </span>
                      <h3 className="text-base font-bold text-white tracking-wide">
                        Sim Setup is Locked
                      </h3>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Your assigned evaluation or license duration has expired. Access to conveyor geometry, package & barcode settings, and optical scanner deployment is locked from modifications.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 text-[11px] text-slate-400 text-left space-y-1">
                      <div className="text-slate-200 font-semibold mb-1 flex items-center gap-1.5">
                        <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" />
                        Still Unlocked & Fully Operational:
                      </div>
                      <div>• 3D Viewport camera & orbit navigation</div>
                      <div>• Environment lighting, floor & unit toggles</div>
                      <div>• Mechanical CAD Drawing Sheet exports</div>
                      <div>• Real-time raycasting inspection & telemetry</div>
                    </div>

                    <button
                      onClick={() => setIsPricingModalOpen(true)}
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-orange-950/50 transition-all cursor-pointer active:scale-95"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Unlock Sim Setup — View Plans</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            ) : (
              /* UNLOCKED SIM SETUP: All 3 Cards */
              <>
                <ConveyorSettingsCard />
                <PartSettingsCard />
                <ScannerDeploymentCard />
              </>
            )
          ) : (
            /* ENVIRONMENT & UNITS: Always Accessible */
            <EnvironmentSettingsCard />
          )}
        </div>
      </aside>

      {/* Pricing Modal opened from locked card */}
      <UserProfileModal
        isOpen={isPricingModalOpen}
        onClose={() => setIsPricingModalOpen(false)}
        defaultTab="pricing"
      />

      {/* Auth Modal opened from locked card when not logged in */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode="register"
      />
    </>
  );
};
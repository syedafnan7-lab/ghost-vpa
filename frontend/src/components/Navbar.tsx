import React, { useState, useRef, useEffect } from 'react';
import { 
  Activity, 
  ShieldAlert, 
  Share2, 
  FileText, 
  Target, 
  BarChart3, 
  Lock, 
  Clock, 
  Play, 
  Pause, 
  UserCheck,
  ChevronDown,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  GitFork,
  Radio
} from 'lucide-react';
import { ActiveTab, UserRole } from '../types';
import { Mark } from './Mark';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  role: UserRole;
  setRole: (role: UserRole) => void;
  isPaused: boolean;
  speed: number;
  simTime: string;
  onTogglePlay: () => void;
  onSetSpeed: (speed: number) => void;
  onRunScenario: (scenario: 'A' | 'B' | 'C' | 'D') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  role,
  setRole,
  isPaused,
  speed,
  simTime,
  onTogglePlay,
  onSetSpeed,
  onRunScenario
}) => {
  const [scenarioMenuOpen, setScenarioMenuOpen] = useState(false);
  const scenarioMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (scenarioMenuRef.current && !scenarioMenuRef.current.contains(e.target as Node)) {
        setScenarioMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const tabs: { id: ActiveTab; hotkey: string; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'operations', hotkey: '1', label: 'Operations', icon: Activity },
    { id: 'monitor', hotkey: '2', label: 'Live Stream', icon: Radio },
    { id: 'network', hotkey: '3', label: 'Graph Explorer', icon: Share2 },
    { id: 'workbench', hotkey: '4', label: 'Case Dossiers', icon: FileText },
    { id: 'canaries', hotkey: '5', label: 'Honeypots', icon: Target },
    { id: 'benchmarks', hotkey: '6', label: 'ML Benchmark', icon: BarChart3 },
    { id: 'audit', hotkey: '7', label: 'Audit Trail', icon: Lock },
  ];

  const scenarios: { 
    id: 'A' | 'B' | 'C' | 'D'; 
    label: string; 
    badge: string; 
    icon: React.ComponentType<{ className?: string }>; 
    color: string; 
    border: string;
    desc: string 
  }[] = [
    {
      id: 'A',
      label: 'Canary Probe Tripwire',
      badge: 'Tripwire Intercept',
      icon: ShieldAlert,
      color: 'text-alarm bg-alarm/10',
      border: 'hover:border-alarm/50',
      desc: 'Synthetic mule attempts ₹5,000 transfer to registered canary; instant review flag with ₹0.00 posted.'
    },
    {
      id: 'B',
      label: 'Shared Feeder Unmasking',
      badge: 'Feeder Trace',
      icon: GitFork,
      color: 'text-feeder bg-feeder/10',
      border: 'hover:border-feeder/50',
      desc: 'Three distinct mules target canaries; backward graph propagation unmasks mastermind FEEDER_SYNTH_007.'
    },
    {
      id: 'C',
      label: 'Benign Merchant Lookalike',
      badge: 'False-Positive Guard',
      icon: CheckCircle2,
      color: 'text-benign bg-benign/10',
      border: 'hover:border-benign/50',
      desc: 'High-burst QR merchant flagged by tabular rules is verified with 0 canary links—preventing wrongful freeze!'
    },
    {
      id: 'D',
      label: 'Multi-Hop Layering Chain',
      badge: 'Syndicate Chain',
      icon: Share2,
      color: 'text-device bg-device/10',
      border: 'hover:border-device/50',
      desc: '4-hop syndicate transfer chain revealing velocity & amount conservation across intermediate hops.'
    }
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-void/85 backdrop-blur-md">
      {/* Top Precision Bar */}
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between gap-4 border-b border-line/60">
        {/* Brand & Platform Identity */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="group relative flex items-center justify-center p-1 rounded-panel bg-panel border border-line hover:border-canary/40 transition-colors cursor-pointer">
            <Mark size={24} className="group-hover:rotate-12 transition-transform duration-normal ease-out" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-display text-[15px] font-semibold tracking-[-0.02em] text-ink">
                Ghost-VPA
              </span>
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-canary/10 border border-canary/20 text-canary text-[10px] font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-canary animate-pulse" />
                <span>CANARY RAIL ACTIVE</span>
              </span>
            </div>
            <span className="font-mono text-[11px] text-ink3 leading-none mt-0.5 hidden sm:inline">
              Pre-Routing Interdiction • RBI 2026 Annex III SOP
            </span>
          </div>
        </div>

        {/* Right Tools: Telemetry Clock, Speed Controls, Scenario Launcher, RBAC & Showcase Bridge */}
        <div className="flex items-center gap-2">
          {/* Sim Clock */}
          <div className="flex items-center gap-1.5 bg-panel/80 px-2.5 py-1 rounded-chip border border-line text-caption font-mono">
            <Clock className="w-3.5 h-3.5 text-canary animate-pulse" />
            <span className="text-ink font-medium tabular-nums">
              {simTime ? new Date(simTime).toLocaleTimeString() : '09:00:00 UTC'}
            </span>
          </div>

          {/* Simulation Controls (Play/Pause & Speed) */}
          <div className="flex items-center gap-0.5 bg-panel/80 p-0.5 rounded-chip border border-line">
            <button
              onClick={onTogglePlay}
              className={`px-2 py-1 rounded text-caption font-mono flex items-center gap-1 active:scale-95 transition-all ${
                isPaused
                  ? 'bg-canary text-void font-bold shadow-sm'
                  : 'text-ink2 hover:text-ink hover:bg-raised'
              }`}
              title={isPaused ? 'Resume simulation' : 'Pause simulation'}
            >
              {isPaused ? <Play className="w-3 h-3 fill-current" /> : <Pause className="w-3 h-3" />}
              <span className="text-micro font-medium">{isPaused ? 'RUN' : 'PAUSE'}</span>
            </button>
            <div className="flex items-center border-l border-line/60 pl-0.5">
              {[1, 5, 20].map((s) => (
                <button
                  key={s}
                  onClick={() => onSetSpeed(s)}
                  className={`px-1.5 py-0.5 rounded text-micro font-mono active:scale-95 transition-all ${
                    speed === s
                      ? 'bg-raised text-canary font-bold shadow-sm'
                      : 'text-ink3 hover:text-ink2'
                  }`}
                  title={`Run simulation at ${s}x speed`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>

          {/* Tactical Scenarios Quick Launcher */}
          <div className="relative" ref={scenarioMenuRef}>
            <button
              onClick={() => setScenarioMenuOpen(!scenarioMenuOpen)}
              className="group flex items-center gap-1.5 bg-panel/80 hover:bg-raised text-ink2 hover:text-ink px-2.5 py-1 rounded-chip border border-line hover:border-canary/40 text-caption font-mono active:scale-95 transition-all shadow-sm"
              title="Launch deterministic attack scenarios"
            >
              <Sparkles className="w-3.5 h-3.5 text-canary group-hover:rotate-12 transition-transform duration-normal ease-out" />
              <span className="text-micro font-semibold uppercase">Scenarios</span>
              <ChevronDown className={`w-3 h-3 text-ink3 transition-transform duration-fast ${scenarioMenuOpen ? 'rotate-180 text-canary' : ''}`} />
            </button>

            {scenarioMenuOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-panel/95 backdrop-blur-xl border border-line-strong rounded-panel shadow-panel p-2.5 z-50 animate-fade-in">
                <div className="flex items-center justify-between px-2 py-1 border-b border-line mb-1.5">
                  <span className="font-mono text-micro text-ink3 uppercase tracking-wider">
                    Deterministic Test Vectors
                  </span>
                  <span className="font-mono text-[10px] text-canary font-medium">Fixed Random Seeds</span>
                </div>
                <div className="space-y-1">
                  {scenarios.map((sc) => {
                    const ScIcon = sc.icon;
                    return (
                      <button
                        key={sc.id}
                        onClick={() => {
                          onRunScenario(sc.id);
                          setScenarioMenuOpen(false);
                        }}
                        className={`w-full text-left p-2.5 rounded-card hover:bg-raised/80 border border-transparent ${sc.border} active:scale-[0.99] transition-all group`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`p-1 rounded-chip ${sc.color} group-hover:scale-110 transition-transform duration-fast`}>
                              <ScIcon className="w-3.5 h-3.5" />
                            </div>
                            <span className="font-mono text-caption font-semibold text-ink group-hover:text-canary transition-colors">
                              Scenario {sc.id}
                            </span>
                          </div>
                          <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded-chip border ${sc.color}`}>
                            {sc.badge}
                          </span>
                        </div>
                        <p className="font-sans text-micro text-ink2 mt-1 line-clamp-2 leading-relaxed">
                          {sc.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Demo role selector (not authentication) */}
          <div 
            className="flex items-center gap-1.5 bg-panel/80 px-2 py-1 rounded-chip border border-line text-caption font-mono"
            title="Demo label only; it does not authenticate or authorize a user"
          >
            <UserCheck className="w-3.5 h-3.5 text-canary" />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="bg-transparent text-micro text-ink font-medium focus:outline-none cursor-pointer"
            >
              <option value="Analyst" className="bg-panel text-ink">Analyst</option>
              <option value="Supervisor" className="bg-panel text-ink">Supervisor (demo)</option>
              <option value="Auditor" className="bg-panel text-ink">Auditor (Read-Only)</option>
            </select>
          </div>

          {/* Cross-Link to Public Showcase Website */}
          <a
            href="http://localhost:5174"
            target="_blank"
            rel="noreferrer"
            className="group hidden xl:flex items-center gap-1 px-2.5 py-1 text-micro font-mono text-ink2 hover:text-ink border border-line hover:border-canary/40 rounded-chip bg-panel/80 hover:bg-raised active:scale-95 transition-all"
            title="Open public technical showcase website on Port 5174"
          >
            <span>Showcase</span>
            <ExternalLink className="w-3 h-3 text-canary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-fast" />
          </a>
        </div>
      </div>

      {/* Primary Instrument Tabs */}
      <div className="max-w-7xl mx-auto px-4">
        <nav className="flex items-center space-x-1 overflow-x-auto no-scrollbar py-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group flex items-center gap-2 px-3 py-1.5 text-caption font-mono rounded-chip transition-all duration-fast whitespace-nowrap active:scale-[0.98] ${
                  isActive
                    ? 'bg-raised text-ink border border-canary/40 font-medium shadow-[0_1px_8px_rgba(245,165,36,0.15)]'
                    : 'text-ink2 hover:text-ink hover:bg-raised/40 border border-transparent'
                }`}
              >
                <kbd className={`text-[10px] px-1 py-0.2 rounded font-mono ${isActive ? 'bg-canary/20 text-canary font-bold' : 'text-ink3 group-hover:text-ink2'}`}>
                  {tab.hotkey}
                </kbd>
                <Icon className={`w-3.5 h-3.5 transition-transform duration-fast group-hover:-translate-y-0.5 ${
                  isActive ? 'text-canary scale-105' : 'text-ink3 group-hover:text-ink2'
                }`} />
                <span className="font-sans text-caption font-medium">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};

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
  ExternalLink
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

  const tabs: { id: ActiveTab; index: string; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'operations', index: '01', label: 'Operations', icon: Activity },
    { id: 'monitor', index: '02', label: 'Live Monitor', icon: ShieldAlert },
    { id: 'network', index: '03', label: 'Network Explorer', icon: Share2 },
    { id: 'workbench', index: '04', label: 'Investigation Cases', icon: FileText },
    { id: 'canaries', index: '05', label: 'Honeypots', icon: Target },
    { id: 'benchmarks', index: '06', label: 'Model Benchmark', icon: BarChart3 },
    { id: 'audit', index: '07', label: 'Security & Audit', icon: Lock },
  ];

  const scenarios: { id: 'A' | 'B' | 'C' | 'D'; label: string; badge: string; color: string; desc: string }[] = [
    {
      id: 'A',
      label: 'Canary Probe Tripwire',
      badge: 'Tripwire',
      color: 'border-alarm/40 text-alarm hover:bg-alarm/10',
      desc: 'Synthetic mule attempts ₹5,000 transfer to registered canary; instant review flag.'
    },
    {
      id: 'B',
      label: 'Shared Feeder Unmasking',
      badge: 'Feeder',
      color: 'border-feeder/40 text-feeder hover:bg-feeder/10',
      desc: '3 mules target canaries; graph propagation unmasks upstream feeder.'
    },
    {
      id: 'C',
      label: 'Benign Merchant Lookalike',
      badge: 'False-Positive Guard',
      color: 'border-benign/40 text-benign hover:bg-benign/10',
      desc: 'High-burst legitimate QR merchant verified with 0 canary links (no hold).'
    },
    {
      id: 'D',
      label: 'Multi-Hop Layering Chain',
      badge: 'Layering',
      color: 'border-device/40 text-device hover:bg-device/10',
      desc: '4-hop syndicate transfer chain revealing velocity & amount conservation.'
    }
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-void/90 backdrop-blur-md">
      {/* Top Console Bar */}
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between gap-4 border-b border-line">
        {/* Brand & Platform Identity */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="relative flex items-center justify-center p-1 rounded-panel bg-panel border border-line">
            <Mark size={24} />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-display text-[15px] font-semibold tracking-[-0.02em] text-ink">
                Ghost-VPA
              </span>
              <span className="font-mono text-micro uppercase tracking-wider px-1.5 py-0.5 rounded-chip bg-canary/10 text-canary border border-canary/20">
                Analyst Console
              </span>
              <span className="hidden sm:inline-flex font-mono text-micro uppercase tracking-wider px-1.5 py-0.5 rounded-chip bg-benign/10 text-benign border border-benign/20">
                Zero Fund Movement
              </span>
            </div>
            <span className="font-mono text-[11px] text-ink3 leading-none mt-0.5 hidden md:inline">
              Simulated Cyber-Deception &amp; Canary-Seeded Interdiction • RBI 2026 Draft SOP
            </span>
          </div>
        </div>

        {/* Right Tools: Clock, Simulation Controls, Scenarios, Role, Showcase Bridge */}
        <div className="flex items-center gap-2.5">
          {/* Sim Clock */}
          <div className="flex items-center gap-1.5 bg-panel px-2.5 py-1 rounded-chip border border-line text-caption font-mono">
            <Clock className="w-3.5 h-3.5 text-canary" />
            <span className="text-ink3 hidden sm:inline">SIM:</span>
            <span className="text-ink font-medium tabular-nums">
              {simTime ? new Date(simTime).toLocaleTimeString() : '09:00:00 UTC'}
            </span>
          </div>

          {/* Sim Controls (Play/Pause & Speed) */}
          <div className="flex items-center gap-1 bg-panel p-0.5 rounded-chip border border-line">
            <button
              onClick={onTogglePlay}
              className={`px-2 py-1 rounded text-caption font-mono flex items-center gap-1 transition-colors ${
                isPaused
                  ? 'bg-canary text-void font-semibold'
                  : 'text-ink2 hover:text-ink hover:bg-raised'
              }`}
              title={isPaused ? 'Resume simulation' : 'Pause simulation'}
            >
              {isPaused ? <Play className="w-3 h-3 fill-current" /> : <Pause className="w-3 h-3" />}
              <span className="text-micro font-medium">{isPaused ? 'RUN' : 'PAUSE'}</span>
            </button>
            <div className="flex items-center border-l border-line pl-1">
              {[1, 5, 20].map((s) => (
                <button
                  key={s}
                  onClick={() => onSetSpeed(s)}
                  className={`px-1.5 py-0.5 rounded text-micro font-mono transition-colors ${
                    speed === s
                      ? 'bg-raised text-canary font-bold'
                      : 'text-ink3 hover:text-ink2'
                  }`}
                  title={`Run simulation at ${s}x speed`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>

          {/* Scenario Trigger Quick Menu */}
          <div className="relative" ref={scenarioMenuRef}>
            <button
              onClick={() => setScenarioMenuOpen(!scenarioMenuOpen)}
              className="flex items-center gap-1.5 bg-panel hover:bg-raised text-ink2 hover:text-ink px-2.5 py-1 rounded-chip border border-line text-caption font-mono transition-colors"
              title="Launch deterministic demonstration scenarios"
            >
              <Sparkles className="w-3.5 h-3.5 text-canary" />
              <span className="text-micro font-medium uppercase">Scenarios</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${scenarioMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {scenarioMenuOpen && (
              <div className="absolute right-0 mt-1.5 w-72 bg-panel border border-line-strong rounded-panel shadow-panel p-2 z-50 animate-fade-in">
                <div className="px-2 py-1 border-b border-line mb-1">
                  <span className="font-mono text-micro text-ink3 uppercase tracking-wider">
                    Demonstration Scenarios
                  </span>
                </div>
                <div className="space-y-1">
                  {scenarios.map((sc) => (
                    <button
                      key={sc.id}
                      onClick={() => {
                        onRunScenario(sc.id);
                        setScenarioMenuOpen(false);
                      }}
                      className="w-full text-left p-2 rounded-card hover:bg-raised/70 border border-transparent hover:border-line transition-all group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-caption font-semibold text-ink group-hover:text-canary">
                          Scenario {sc.id}
                        </span>
                        <span className={`font-mono text-micro px-1.5 py-0.5 rounded-chip border ${sc.color}`}>
                          {sc.badge}
                        </span>
                      </div>
                      <p className="font-sans text-micro text-ink2 mt-0.5 line-clamp-1">
                        {sc.label}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Role Switcher (Simulated RBAC) */}
          <div 
            className="flex items-center gap-1.5 bg-panel px-2 py-1 rounded-chip border border-line text-caption font-mono"
            title="Demonstration Role-Based Action Gating (Simulated RBAC)"
          >
            <UserCheck className="w-3.5 h-3.5 text-ink3" />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="bg-transparent text-micro text-ink font-medium focus:outline-none cursor-pointer"
            >
              <option value="Analyst" className="bg-panel text-ink">Analyst</option>
              <option value="Supervisor" className="bg-panel text-ink">Supervisor (Hold Auth)</option>
              <option value="Auditor" className="bg-panel text-ink">Auditor (Read-Only)</option>
            </select>
          </div>

          {/* Cross-Link to Public Showcase Website */}
          <a
            href="http://localhost:5174"
            target="_blank"
            rel="noreferrer"
            className="hidden xl:flex items-center gap-1 px-2.5 py-1 text-micro font-mono text-ink2 hover:text-ink border border-line hover:border-canary/40 rounded-chip bg-panel hover:bg-raised transition-all"
            title="Open public technical showcase website on Port 5174"
          >
            <span>Showcase Site</span>
            <ExternalLink className="w-3 h-3 text-canary" />
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
                className={`flex items-center gap-2 px-3 py-1.5 text-caption font-mono rounded-chip transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-raised text-ink border border-canary/40 font-medium shadow-sm'
                    : 'text-ink2 hover:text-ink hover:bg-raised/40 border border-transparent'
                }`}
              >
                <span className={`text-micro ${isActive ? 'text-canary font-semibold' : 'text-ink3'}`}>
                  {tab.index}
                </span>
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-canary' : 'text-ink3'}`} />
                <span className="font-sans text-caption">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};

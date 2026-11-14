import React from 'react';
import { 
  ShieldAlert, 
  Activity, 
  Share2, 
  FileText, 
  Target, 
  BarChart3, 
  Lock, 
  Clock, 
  Play, 
  Pause, 
  UserCheck 
} from 'lucide-react';
import { ActiveTab, UserRole } from '../types';

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
  const tabs = [
    { id: 'operations', label: 'Operations Overview', icon: Activity },
    { id: 'monitor', label: 'Live Rail Monitor', icon: ShieldAlert },
    { id: 'network', label: 'Network Explorer', icon: Share2 },
    { id: 'workbench', label: 'Investigation Cases', icon: FileText },
    { id: 'canaries', label: 'Honeypot Registry', icon: Target },
    { id: 'benchmarks', label: 'Model Benchmark', icon: BarChart3 },
    { id: 'audit', label: 'Security & Audit', icon: Lock },
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between border-b border-slate-800/60">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-tr from-amber-500 to-red-600 p-2 rounded-lg shadow-md shadow-amber-500/10">
            <ShieldAlert className="w-5 h-5 text-slate-950 font-bold" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-amber-400 via-amber-200 to-white bg-clip-text text-transparent">
                Ghost-VPA
              </span>
              <span className="text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Active Cyber-Deception
              </span>
              <span className="text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Zero Fund Movement
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Bank-Controlled Canary Intelligence for Pre-Cash-Out Mule Interdiction (RBI 2026 SOP)
            </p>
          </div>
        </div>

        {/* Live Simulation Controls & Clock */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800 text-xs">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-400 font-mono">Sim Time:</span>
            <span className="text-slate-200 font-mono font-semibold">
              {simTime ? new Date(simTime).toLocaleTimeString() : '09:00:00 UTC'}
            </span>
          </div>

          <div className="flex items-center space-x-1 bg-slate-950/80 p-1 rounded-lg border border-slate-800">
            <button
              onClick={onTogglePlay}
              className={`p-1.5 rounded text-xs font-medium flex items-center space-x-1 transition ${
                isPaused 
                  ? 'bg-amber-500 text-black font-semibold' 
                  : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
              }`}
            >
              {isPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5" />}
              <span>{isPaused ? 'Resume' : 'Pause'}</span>
            </button>
            {[1, 5, 20].map((s) => (
              <button
                key={s}
                onClick={() => onSetSpeed(s)}
                className={`px-2 py-1 rounded text-xs font-mono transition ${
                  speed === s ? 'bg-slate-700 text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          {/* Quick Scenario Triggers */}
          <div className="hidden lg:flex items-center space-x-1 border-l border-slate-800 pl-4">
            <span className="text-[11px] text-slate-400 uppercase font-semibold mr-1">Scenarios:</span>
            <button
              onClick={() => onRunScenario('A')}
              className="px-2 py-1 bg-red-950/50 hover:bg-red-900/60 border border-red-800/40 text-red-300 rounded text-xs font-medium transition"
              title="Scenario A: Immediate Canary Tripwire"
            >
              A: Canary
            </button>
            <button
              onClick={() => onRunScenario('B')}
              className="px-2 py-1 bg-purple-950/50 hover:bg-purple-900/60 border border-purple-800/40 text-purple-300 rounded text-xs font-medium transition"
              title="Scenario B: Shared Upstream Feeder Unmasking"
            >
              B: Feeder
            </button>
            <button
              onClick={() => onRunScenario('C')}
              className="px-2 py-1 bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-800/40 text-emerald-300 rounded text-xs font-medium transition"
              title="Scenario C: Benign Merchant Lookalike"
            >
              C: Benign
            </button>
            <button
              onClick={() => onRunScenario('D')}
              className="px-2 py-1 bg-blue-950/50 hover:bg-blue-900/60 border border-blue-800/40 text-blue-300 rounded text-xs font-medium transition"
              title="Scenario D: Multi-Hop Layering Chain"
            >
              D: Multi-Hop
            </button>
          </div>

          {/* Role Switcher */}
          <div className="flex items-center space-x-2 bg-slate-950/80 px-2.5 py-1 rounded-lg border border-slate-800">
            <UserCheck className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="bg-transparent text-xs text-slate-200 font-medium focus:outline-none cursor-pointer"
            >
              <option value="Analyst" className="bg-slate-900 text-slate-100">Analyst</option>
              <option value="Supervisor" className="bg-slate-900 text-slate-100">Supervisor (Hold Auth)</option>
              <option value="Auditor" className="bg-slate-900 text-slate-100">Auditor (Read-Only)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4">
        <nav className="flex space-x-1 overflow-x-auto py-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ActiveTab)}
                className={`flex items-center space-x-2 px-3.5 py-2 text-xs font-medium rounded-lg transition whitespace-nowrap ${
                  isActive
                    ? 'bg-slate-800 text-amber-400 shadow-sm border border-slate-700 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};

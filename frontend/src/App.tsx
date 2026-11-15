import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { OperationsDashboard } from './components/OperationsDashboard';
import { LiveEventMonitor } from './components/LiveEventMonitor';
import { NetworkExplorer } from './components/NetworkExplorer';
import { InvestigationWorkbench } from './components/InvestigationWorkbench';
import { HoneypotRegistry } from './components/HoneypotRegistry';
import { ModelBenchmarking } from './components/ModelBenchmarking';
import { SecurityAuditLogs } from './components/SecurityAuditLogs';
import { ActiveTab, UserRole, CanaryItem, CaseDossier, PaymentAttempt, TripwireAlert } from './types';
import { api } from './services/api';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('operations');
  const [role, setRole] = useState<UserRole>('Analyst');
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1);
  const [simTime, setSimTime] = useState<string>('');

  const [canaries, setCanaries] = useState<CanaryItem[]>([]);
  const [cases, setCases] = useState<CaseDossier[]>([]);
  const [events, setEvents] = useState<PaymentAttempt[]>([]);
  const [alerts, setAlerts] = useState<TripwireAlert[]>([]);
  const [focalGraphEntity, setFocalGraphEntity] = useState<string>('ACCT_SYNTH_HDFX_9912');

  const wsRef = useRef<WebSocket | null>(null);

  // Initial Data Fetch
  const refreshCanaries = async () => {
    try {
      const data = await api.getCanaries();
      setCanaries(data);
    } catch (e) {
      console.error(e);
    }
  };

  const refreshCases = async () => {
    try {
      const data = await api.getCases();
      setCases(data);
    } catch (e) {
      console.error(e);
    }
  };

  const refreshSimStatus = async () => {
    try {
      const status = await api.getSimStatus();
      setIsPaused(status.is_paused);
      setSpeed(status.speed_multiplier);
      setSimTime(status.current_sim_time);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    refreshCanaries();
    refreshCases();
    refreshSimStatus();

    // WebSocket connection for real-time live events
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/live-stream`;
    const socket = new WebSocket(wsUrl);
    wsRef.current = socket;

    socket.onmessage = (msg) => {
      try {
        const payload = JSON.parse(msg.data);
        if (payload.type === 'PAYMENT_ATTEMPT') {
          setEvents((prev) => [payload.data, ...prev.slice(0, 99)]);
          setSimTime(payload.data.timestamp);
        } else if (payload.type === 'TRIPWIRE_ALERT') {
          setAlerts((prev) => [payload.data, ...prev.slice(0, 29)]);
          refreshCanaries();
          refreshCases();
        } else if (payload.type === 'CLOCK_TICK') {
          setSimTime(payload.data.sim_time);
          setIsPaused(payload.data.is_paused);
          setSpeed(payload.data.speed_multiplier);
        }
      } catch (err) {
        console.error('WS Parse Error', err);
      }
    };

    const statusInterval = setInterval(refreshSimStatus, 4000);

    return () => {
      socket.close();
      clearInterval(statusInterval);
    };
  }, []);

  const handleTogglePlay = async () => {
    try {
      await api.controlSim(isPaused ? 'resume' : 'pause');
      setIsPaused(!isPaused);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSetSpeed = async (newSpeed: number) => {
    try {
      await api.controlSim('set_speed', newSpeed);
      setSpeed(newSpeed);
    } catch (e) {
      console.error(e);
    }
  };

  const handleRunScenario = async (scenario: 'A' | 'B' | 'C' | 'D') => {
    try {
      await api.controlSim('run_scenario', speed, scenario);
      refreshCanaries();
      refreshCases();
      if (scenario === 'A') {
        setActiveTab('monitor');
      } else if (scenario === 'B' || scenario === 'D') {
        setFocalGraphEntity(scenario === 'B' ? 'FEEDER_SYNTH_007' : 'FEEDER_SYNTH_009');
        setActiveTab('network');
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-void text-ink flex flex-col font-sans selection:bg-canary selection:text-void">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        role={role}
        setRole={setRole}
        isPaused={isPaused}
        speed={speed}
        simTime={simTime}
        onTogglePlay={handleTogglePlay}
        onSetSpeed={handleSetSpeed}
        onRunScenario={handleRunScenario}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6">
        {activeTab === 'operations' && (
          <OperationsDashboard
            canaries={canaries}
            cases={cases}
            alerts={alerts}
            setActiveTab={setActiveTab}
            onRunScenario={handleRunScenario}
          />
        )}

        {activeTab === 'monitor' && (
          <LiveEventMonitor
            events={events}
            alerts={alerts}
            setActiveTab={setActiveTab}
            onSelectEntityForGraph={(id) => {
              setFocalGraphEntity(id);
              setActiveTab('network');
            }}
          />
        )}

        {activeTab === 'network' && (
          <NetworkExplorer
            initialEntityId={focalGraphEntity}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'workbench' && (
          <InvestigationWorkbench
            cases={cases}
            role={role}
            onRefreshCases={refreshCases}
          />
        )}

        {activeTab === 'canaries' && (
          <HoneypotRegistry
            canaries={canaries}
            onRefreshCanaries={refreshCanaries}
          />
        )}

        {activeTab === 'benchmarks' && <ModelBenchmarking />}

        {activeTab === 'audit' && <SecurityAuditLogs />}
      </main>

      <footer className="border-t border-line bg-void/90 py-4 px-6 text-center text-caption font-mono text-ink3">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-display font-medium text-ink2">Ghost-VPA</span>
            <span>•</span>
            <span>St Aloysius × RBIH FinTech Innovation Hackathon 2026</span>
          </div>
          <span className="text-micro text-ink3">
            Zero Real Funds Movement • Pure Synthetic Regulatory Simulation Rail
          </span>
        </div>
      </footer>
    </div>
  );
};

export default App;

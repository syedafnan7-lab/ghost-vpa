import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { CanaryBackground } from './components/CanaryBackground';
import { OperationsDashboard } from './components/OperationsDashboard';
import { LiveEventMonitor } from './components/LiveEventMonitor';
import { NetworkExplorer } from './components/NetworkExplorer';
import { InvestigationWorkbench } from './components/InvestigationWorkbench';
import { HoneypotRegistry } from './components/HoneypotRegistry';
import { ModelBenchmarking } from './components/ModelBenchmarking';
import { SecurityAuditLogs } from './components/SecurityAuditLogs';
import { ActiveTab, UserRole, CanaryItem, CaseDossier, PaymentAttempt, TripwireAlert, GraphOverview } from './types';
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
  const [graphOverview, setGraphOverview] = useState<GraphOverview | null>(null);
  const [preferredCaseId, setPreferredCaseId] = useState<string | null>(null);

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

  const refreshAlerts = async () => {
    try {
      setAlerts(await api.getAlerts());
    } catch (e) {
      console.error(e);
    }
  };

  const refreshGraphOverview = async () => {
    try {
      setGraphOverview(await api.getGraphOverview());
    } catch (e) {
      console.error(e);
    }
  };

  const refreshCases = async () => {
    try {
      const data = await api.getCases();
      setCases(data);
      // Start the graph on a persisted entity. The old sample ID is absent
      // from fresh databases, so it produced a blank graph despite existing cases.
      if (data.length > 0 && focalGraphEntity === 'ACCT_SYNTH_HDFX_9912') {
        const graphCase = data.find((item) => item.upstream_feeder_account || item.connected_mule_count > 0) || data[0];
        setFocalGraphEntity(graphCase.target_account_id);
      }
      return data;
    } catch (e) {
      console.error(e);
      return [];
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
    refreshAlerts();
    refreshCases();
    refreshGraphOverview();
    refreshSimStatus();

    // WebSocket connection for real-time live events
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/live-stream`;
    const socket = new WebSocket(wsUrl);
    wsRef.current = socket;

    socket.onmessage = (msg) => {
      try {
        const payload = JSON.parse(msg.data);
        if (['IDENTIFIER_DISCOVERY', 'BENEFICIARY_VALIDATION', 'PAYMENT_ATTEMPT', 'CREDIT_CONFIRMED', 'PAYMENT_DECLINED', 'PAYMENT_REVERSED'].includes(payload.type)) {
          setEvents((prev) => [{ ...payload.data, event_type: payload.type }, ...prev.slice(0, 99)]);
          setSimTime(payload.data.timestamp);
        } else if (payload.type === 'TRIPWIRE_ALERT') {
          setAlerts((prev) => [payload.data, ...prev.filter((item) => item.alert_id !== payload.data.alert_id).slice(0, 29)]);
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

  // Keyboard navigation shortcuts (1-7 for tabs)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input or textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      const tabKeys: Record<string, ActiveTab> = {
        '1': 'operations',
        '2': 'monitor',
        '3': 'network',
        '4': 'workbench',
        '5': 'canaries',
        '6': 'benchmarks',
        '7': 'audit',
      };
      if (tabKeys[e.key]) {
        setActiveTab(tabKeys[e.key]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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

  const handleRunScenario = async (scenario: 'A' | 'B' | 'C' | 'D' | 'E') => {
    try {
      const result = await api.controlSim('run_scenario', speed, scenario);
      await Promise.all([refreshCanaries(), refreshAlerts(), refreshGraphOverview()]);
      if (scenario === 'A') {
        setActiveTab('monitor');
      } else if (scenario === 'B' || scenario === 'D') {
        setFocalGraphEntity(scenario === 'B' ? 'FEEDER_SYNTH_007' : 'FEEDER_SYNTH_009');
        setActiveTab('network');
      } else if (scenario === 'E') {
        const refreshed = await refreshCases();
        const primaryCaseId: string | undefined = result?.result?.primary_case_id;
        const scenarioCaseIds: string[] = result?.result?.case_ids ?? [];
        const nextCase = refreshed.find((item) => item.case_id === primaryCaseId)
          || refreshed.find((item) => scenarioCaseIds.includes(item.case_id))
          || refreshed.find((item) => item.target_account_id === 'MULE_SYNTH_101');
        setPreferredCaseId(nextCase?.case_id ?? null);
        setFocalGraphEntity('MULE_SYNTH_101');
        setActiveTab('workbench');
      } else {
        await refreshCases();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="relative min-h-screen bg-void text-ink flex flex-col font-sans selection:bg-canary selection:text-void overflow-x-hidden">
      {/* Living Dynamic Background (Canary constellation field with gentle mouse parallax) */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-40">
        <CanaryBackground activeTab={activeTab} />
      </div>

      {/* Main Foreground Interface */}
      <div className="relative z-10 flex flex-col min-h-screen">
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

        <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 transition-all duration-normal ease-out">
          <div key={activeTab} className="animate-fade-in">
            {activeTab === 'operations' && (
              <OperationsDashboard
                canaries={canaries}
                cases={cases}
                alerts={alerts}
                graphOverview={graphOverview}
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
                preferredCaseId={preferredCaseId}
                onOpenGraph={(entityId) => {
                  setFocalGraphEntity(entityId);
                  setActiveTab('network');
                }}
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
          </div>
        </main>

        <footer className="border-t border-line bg-void/80 backdrop-blur-md py-4 px-6 text-center text-caption font-mono text-ink3">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-display font-medium text-ink2">Ghost-VPA</span>
              <span>•</span>
              <span>Bank-Controlled Cyber-Deception Fraud Intelligence</span>
            </div>
            <div className="flex items-center gap-3 text-micro text-ink3">
              <span>Press <kbd className="px-1.5 py-0.5 rounded bg-raised border border-line text-ink2">1</kbd>–<kbd className="px-1.5 py-0.5 rounded bg-raised border border-line text-ink2">7</kbd> to switch tabs</span>
              <span>•</span>
              <span className="text-canary font-semibold">Zero Real Funds Moved</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default App;

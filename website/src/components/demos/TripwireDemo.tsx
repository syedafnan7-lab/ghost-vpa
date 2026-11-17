import { useEffect, useRef, useState } from 'react';
import { SCENARIO_A } from '@/data/scenarios';
import { inr2 } from '@/lib/format';
import { useReducedMotion } from '@/lib/hooks';

const STEPS_A = [
  { phase: 1, title: 'Payment attempt received', detail: 'A UPI P2P attempt enters the bank’s ingress.' },
  { phase: 2, title: 'O(1) canary registry lookup', detail: 'The sidecar checks the beneficiary VPA against the in-memory registry.' },
  { phase: 3, title: 'Simulated tripwire match', detail: 'The synthetic event is marked as a canary interaction; no payment instruction is sent.' },
  { phase: 4, title: 'Sender flagged REVIEW_REQUIRED', detail: 'An operational triage flag. Not a freeze, not an accusation.' },
  { phase: 5, title: 'Interaction added to the graph', detail: 'The synthetic interaction is an investigation signal, not proof of criminality.' },
];

const STEPS_C = [
  { phase: 1, title: 'Retail payment received', detail: 'Customer transfer to a busy MSME grocery merchant.' },
  { phase: 2, title: 'O(1) canary registry lookup', detail: 'Checking freshfoods.merchant@icixbank against the honeypot registry.' },
  { phase: 3, title: 'No match (regular account)', detail: 'Destination is NOT a honeypot. No pre-routing blockage.' },
  { phase: 4, title: 'Normal posting completed', detail: 'Funds credit to merchant normally. Zero customer friction.' },
  { phase: 5, title: 'Zero canary connectivity', detail: 'Temporal graph analysis confirms zero link to any canary ring.' },
];

const SCENARIO_C_DEMO = {
  eventId: 'TXN-SCEN-C-0001',
  senderId: 'ACCT_SYNTH_RETAIL_100',
  senderVpa: 'customer.100@sbinxbank',
  benefVpa: 'freshfoods.merchant@icixbank',
  amount: 18500,
  deviceToken: 'DEV_TOK_CUST_100',
};

const PACKET_POSITIONS_A = [
  { x: 90, y: 190 },
  { x: 300, y: 190 },
  { x: 470, y: 190 },
  { x: 470, y: 190 }, // Intercepted at sidecar
  { x: 470, y: 190 },
  { x: 470, y: 190 },
];

const PACKET_POSITIONS_C = [
  { x: 90, y: 190 },
  { x: 300, y: 190 },
  { x: 470, y: 190 },
  { x: 550, y: 190 },
  { x: 640, y: 190 }, // Completes to merchant
  { x: 640, y: 190 },
];

interface ReadoutRow {
  label: string;
  value: string;
  tone?: 'default' | 'canary' | 'alarm' | 'benign';
}

export function TripwireDemo() {
  const reduced = useReducedMotion();
  const [activeScenario, setActiveScenario] = useState<'A' | 'C'>('A');
  const [phase, setPhase] = useState(0);
  const [running, setRunning] = useState(false);
  const [latency, setLatency] = useState<string>('—');
  const timers = useRef<number[]>([]);

  const clearTimers = () => {
    for (const id of timers.current) window.clearTimeout(id);
    timers.current = [];
  };

  useEffect(() => clearTimers, []);

  const run = () => {
    clearTimers();
    setPhase(0);
    setRunning(true);
    setLatency('—');
    const measured = (3.1 + Math.random() * 1.6).toFixed(1);
    if (reduced) {
      setLatency(`${measured} ms`);
      setPhase(5);
      setRunning(false);
      return;
    }
    setLatency(`${measured} ms`);
    [1, 2, 3, 4, 5].forEach((p, i) => {
      timers.current.push(window.setTimeout(() => setPhase(p), 450 + i * 780));
    });
    timers.current.push(window.setTimeout(() => setRunning(false), 450 + 5 * 780));
  };

  const reset = () => {
    clearTimers();
    setPhase(0);
    setRunning(false);
    setLatency('—');
  };

  const isA = activeScenario === 'A';
  const steps = isA ? STEPS_A : STEPS_C;
  const currentTxn = isA ? SCENARIO_A : SCENARIO_C_DEMO;
  const positions = isA ? PACKET_POSITIONS_A : PACKET_POSITIONS_C;
  const packet = positions[phase] ?? positions[0];
  const activeStep = steps.find((s) => s.phase === phase);

  const readout: ReadoutRow[] = isA
    ? [
        { label: 'Event', value: currentTxn.eventId },
        { label: 'Target VPA', value: currentTxn.benefVpa },
        { label: 'Amount', value: inr2(currentTxn.amount) },
        {
          label: 'Registry',
          value: phase >= 2 ? 'MATCH — canary endpoint' : '—',
          tone: phase >= 2 ? 'canary' : 'default',
        },
        {
          label: 'Status',
          value: phase >= 3 ? 'TRIPWIRE_TRIGGERED' : phase >= 1 ? 'ATTEMPT_RECEIVED' : 'ARMED',
          tone: phase >= 3 ? 'alarm' : 'default',
        },
        { label: 'Ingestion latency', value: latency, tone: phase >= 2 ? 'canary' : 'default' },
        {
          label: 'Sender',
          value: phase >= 4 ? 'REVIEW_REQUIRED' : '—',
          tone: phase >= 4 ? 'alarm' : 'default',
        },
        {
          label: 'Funds posted',
          value: phase >= 3 ? '₹0.00 — posting blocked' : '—',
          tone: phase >= 3 ? 'benign' : 'default',
        },
        {
          label: 'Graph seed',
          value: phase >= 5 ? 'event metadata enqueued' : '—',
          tone: phase >= 5 ? 'canary' : 'default',
        },
      ]
    : [
        { label: 'Event', value: currentTxn.eventId },
        { label: 'Target VPA', value: currentTxn.benefVpa },
        { label: 'Amount', value: inr2(currentTxn.amount) },
        {
          label: 'Registry',
          value: phase >= 2 ? 'NO MATCH — regular account' : '—',
          tone: phase >= 2 ? 'benign' : 'default',
        },
        {
          label: 'Status',
          value: phase >= 4 ? 'SETTLED_NORMALLY' : phase >= 1 ? 'PROCESSING' : 'IDLE',
          tone: phase >= 4 ? 'benign' : 'default',
        },
        { label: 'Ingestion latency', value: latency, tone: phase >= 2 ? 'benign' : 'default' },
        {
          label: 'Sender status',
          value: phase >= 4 ? 'CLEARED (No Flag)' : '—',
          tone: phase >= 4 ? 'benign' : 'default',
        },
        {
          label: 'Funds posted',
          value: phase >= 4 ? `${inr2(currentTxn.amount)} — credited` : '—',
          tone: phase >= 4 ? 'benign' : 'default',
        },
        {
          label: 'Graph seed',
          value: phase >= 5 ? 'Zero canary connectivity' : '—',
          tone: phase >= 5 ? 'benign' : 'default',
        },
      ];

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.15fr]">
      <div className="panel flex flex-col">
        {/* Scenario Toggle */}
        <div className="flex border-b border-line bg-void/50">
          <button
            type="button"
            onClick={() => {
              setActiveScenario('A');
              reset();
            }}
            className={`flex-1 py-3 px-3 font-mono text-caption text-center transition-colors border-b-2 ${
              isA ? 'border-canary bg-canary/5 text-canary font-semibold' : 'border-transparent text-ink3 hover:text-ink2'
            }`}
          >
            Scenario A: Canary Probe
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveScenario('C');
              reset();
            }}
            className={`flex-1 py-3 px-3 font-mono text-caption text-center transition-colors border-b-2 ${
              !isA ? 'border-benign bg-benign/5 text-benign font-semibold' : 'border-transparent text-ink3 hover:text-ink2'
            }`}
          >
            Scenario C: Benign Merchant
          </button>
        </div>

        <div className="space-y-2.5 px-5 py-4 font-mono text-caption">
          <div className="flex justify-between gap-4">
            <span className="text-ink3">sender</span>
            <span className="text-right text-ink">{currentTxn.senderId}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-ink3">sender VPA</span>
            <span className="text-right text-ink2">{currentTxn.senderVpa}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-ink3">beneficiary</span>
            <span className={`text-right ${isA ? 'text-canary' : 'text-benign'}`}>{currentTxn.benefVpa}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-ink3">amount</span>
            <span className="text-right text-ink">{inr2(currentTxn.amount)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-ink3">device</span>
            <span className="text-right text-ink2">{currentTxn.deviceToken}</span>
          </div>
        </div>

        <ol className="space-y-2 border-t border-line px-5 py-4">
          {steps.map((step) => {
            const isActive = phase === step.phase;
            const isDone = phase > step.phase;
            return (
              <li
                key={step.phase}
                className={`border-l-2 pl-3 transition-colors duration-normal ${
                  isActive
                    ? isA
                      ? 'border-canary'
                      : 'border-benign'
                    : isDone
                    ? 'border-benign/60'
                    : 'border-line'
                }`}
              >
                <div className="flex items-baseline gap-2">
                  <span
                    className={`font-mono text-micro ${
                      isActive ? (isA ? 'text-canary' : 'text-benign') : isDone ? 'text-benign' : 'text-ink3'
                    }`}
                  >
                    {step.phase}
                  </span>
                  <span
                    className={`text-caption ${
                      isActive ? 'text-ink font-semibold' : isDone ? 'text-ink2' : 'text-ink3'
                    }`}
                  >
                    {step.title}
                  </span>
                </div>
                {isActive ? <p className="mt-1 text-micro text-ink3">{step.detail}</p> : null}
              </li>
            );
          })}
        </ol>

        <div className="mt-auto flex gap-3 border-t border-line px-5 py-4">
          <button
            type="button"
            className="btn-primary !py-2.5 active:scale-[0.98] transition-transform"
            onClick={run}
            disabled={running}
          >
            {running ? 'Simulating…' : phase >= 5 ? 'Run again' : 'Simulate Attempt'}
          </button>
          <button
            type="button"
            className="btn-ghost !py-2.5 active:scale-[0.98] transition-transform"
            onClick={reset}
            disabled={running && !reduced}
          >
            Reset
          </button>
        </div>
      </div>

      <div className="panel">
        <div className="flex items-baseline justify-between border-b border-line px-4 py-3">
          <span className="font-mono text-caption text-ink2">Figure 03 — Probe to interception</span>
          <span className="font-mono text-micro text-ink3">{isA ? 'canary tripwire' : 'benign pass-through'}</span>
        </div>

        <div className="px-4 pt-4">
          <svg viewBox="0 0 720 300" className="h-auto w-full select-none" role="img" aria-label="Diagram of a payment probe and interception">
            <path d="M 90 190 L 300 190 L 470 190 L 640 190" fill="none" stroke="rgba(148,163,184,0.25)" strokeWidth="1" />
            <path d="M 470 190 L 470 78" fill="none" stroke="rgba(148,163,184,0.18)" strokeWidth="1" strokeDasharray="3 5" />
            <path
              d={isA ? 'M 90 190 L 300 190 L 470 190' : 'M 90 190 L 300 190 L 470 190 L 640 190'}
              fill="none"
              stroke={isA ? '#F5A524' : '#2DD4A7'}
              strokeWidth="1.5"
              className="march"
              style={{ opacity: phase >= 1 && phase <= (isA ? 3 : 4) ? 1 : 0 }}
            />

            {/* registry */}
            <circle cx="470" cy="70" r="7" fill="#0A0F17" stroke="#9AA7B8" strokeWidth="1" />
            <circle
              cx="470"
              cy="70"
              r="7"
              fill="none"
              stroke={isA ? '#F5A524' : '#2DD4A7'}
              strokeWidth="1.5"
              style={{ opacity: phase === 2 ? 1 : 0, transition: 'opacity 200ms ease' }}
            />
            <text x="470" y="48" textAnchor="middle" fill="#9AA7B8" fontSize="11" fontFamily="JetBrains Mono, monospace">
              canary registry
            </text>

            {/* sender */}
            <circle
              cx="90"
              cy="190"
              r="7"
              fill="#0A0F17"
              stroke={phase >= 4 ? (isA ? '#F04438' : '#2DD4A7') : '#5C6B7E'}
              strokeWidth="1.2"
              style={{ transition: 'stroke 250ms ease' }}
            />
            <text x="90" y="222" textAnchor="middle" fill="#9AA7B8" fontSize="11" fontFamily="JetBrains Mono, monospace">
              sender
            </text>
            <text x="90" y="236" textAnchor="middle" fill="#5C6B7E" fontSize="9" fontFamily="JetBrains Mono, monospace">
              {currentTxn.senderId}
            </text>

            {/* rail */}
            <circle cx="300" cy="190" r="7" fill="#0A0F17" stroke="#5C6B7E" strokeWidth="1.2" />
            <text x="300" y="222" textAnchor="middle" fill="#9AA7B8" fontSize="11" fontFamily="JetBrains Mono, monospace">
              payment rail
            </text>

            {/* sidecar */}
            <rect
              x="452"
              y="172"
              width="36"
              height="36"
              fill="#0A0F17"
              stroke={phase >= 2 ? (isA ? '#F5A524' : '#2DD4A7') : '#5C6B7E'}
              strokeWidth="1.2"
              style={{ transition: 'stroke 250ms ease' }}
            />
            <text x="470" y="222" textAnchor="middle" fill="#9AA7B8" fontSize="11" fontFamily="JetBrains Mono, monospace">
              CBS sidecar
            </text>

            {/* destination */}
            {isA ? (
              <>
                <circle cx="640" cy="190" r="10" fill="none" stroke="#F5A524" strokeWidth="1" opacity="0.4" />
                <circle cx="640" cy="190" r="6" fill="#F5A524" />
                <circle
                  cx="640"
                  cy="190"
                  r="14"
                  fill="none"
                  stroke="#F04438"
                  strokeWidth="1.5"
                  style={{ opacity: phase >= 3 ? 1 : 0, transition: 'opacity 250ms ease' }}
                />
                <text x="640" y="222" textAnchor="middle" fill="#F5A524" fontSize="11" fontFamily="JetBrains Mono, monospace">
                  canary
                </text>
                <text x="640" y="236" textAnchor="middle" fill="#5C6B7E" fontSize="9" fontFamily="JetBrains Mono, monospace">
                  canary.trap.01@icixbank
                </text>
              </>
            ) : (
              <>
                <circle cx="640" cy="190" r="10" fill="none" stroke="#2DD4A7" strokeWidth="1" opacity="0.4" />
                <circle cx="640" cy="190" r="6" fill="#2DD4A7" />
                <circle
                  cx="640"
                  cy="190"
                  r="14"
                  fill="none"
                  stroke="#2DD4A7"
                  strokeWidth="1.5"
                  style={{ opacity: phase >= 4 ? 1 : 0, transition: 'opacity 250ms ease' }}
                />
                <text x="640" y="222" textAnchor="middle" fill="#2DD4A7" fontSize="11" fontFamily="JetBrains Mono, monospace">
                  merchant
                </text>
                <text x="640" y="236" textAnchor="middle" fill="#5C6B7E" fontSize="9" fontFamily="JetBrains Mono, monospace">
                  freshfoods.merchant
                </text>
              </>
            )}

            {/* packet */}
            <g
              style={{
                transform: `translate(${packet.x}px, ${packet.y}px)`,
                opacity: phase >= 1 ? 1 : 0,
                transition: 'transform 640ms cubic-bezier(0.23,1,0.32,1), opacity 200ms ease',
              }}
            >
              <circle r="5" fill={isA ? '#F5A524' : '#2DD4A7'} />
              <circle r="10" fill="none" stroke={isA ? '#F5A524' : '#2DD4A7'} strokeWidth="1" opacity="0.35" />
            </g>
          </svg>
        </div>

        <div className="grid grid-cols-1 gap-px border-t border-line bg-line sm:grid-cols-2">
          {readout.map((row) => (
            <div key={row.label} className="bg-panel px-4 py-3">
              <div className="font-mono text-micro text-ink3">{row.label}</div>
              <div
                className={`mt-1 font-mono text-caption ${
                  row.tone === 'canary'
                    ? 'text-canary'
                    : row.tone === 'alarm'
                      ? 'text-alarm'
                      : row.tone === 'benign'
                        ? 'text-benign'
                        : 'text-ink2'
                }`}
              >
                {row.value}
              </div>
            </div>
          ))}
        </div>

        <div className="figure-caption">
          <span>{activeStep ? activeStep.title : 'Ready — run the simulation attempt.'}</span>
          <span>record: rail.py · scenario {activeScenario}</span>
        </div>
      </div>
    </div>
  );
}

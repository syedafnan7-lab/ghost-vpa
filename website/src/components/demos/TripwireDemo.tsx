import { useEffect, useRef, useState } from 'react';
import { SCENARIO_A } from '@/data/scenarios';
import { inr2 } from '@/lib/format';
import { useReducedMotion } from '@/lib/hooks';

const STEPS = [
  { phase: 1, title: 'Payment attempt received', detail: 'A UPI P2P attempt enters the bank’s ingress.' },
  { phase: 2, title: 'O(1) canary registry lookup', detail: 'The sidecar checks the beneficiary VPA against the in-memory registry.' },
  { phase: 3, title: 'Pre-routing intercept', detail: 'Match: the posting instruction is stopped. No debit, no credit.' },
  { phase: 4, title: 'Sender flagged REVIEW_REQUIRED', detail: 'An operational triage flag. Not a freeze, not an accusation.' },
  { phase: 5, title: 'Metadata seeded into the graph', detail: 'The event enters temporal analytics as a high-confidence seed.' },
];

const PACKET_POSITIONS = [
  { x: 90, y: 190 },
  { x: 300, y: 190 },
  { x: 470, y: 190 },
  { x: 640, y: 190 },
  { x: 640, y: 190 },
  { x: 640, y: 190 },
];

interface ReadoutRow {
  label: string;
  value: string;
  tone?: 'default' | 'canary' | 'alarm' | 'benign';
}

export function TripwireDemo() {
  const reduced = useReducedMotion();
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
    if (reduced) {
      setLatency(`${(3.1 + Math.random() * 1.6).toFixed(1)} ms`);
      setPhase(5);
      setRunning(false);
      return;
    }
    setLatency(`${(3.1 + Math.random() * 1.6).toFixed(1)} ms`);
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

  const packet = PACKET_POSITIONS[phase] ?? PACKET_POSITIONS[0];
  const activeStep = STEPS.find((s) => s.phase === phase);

  const readout: ReadoutRow[] = [
    { label: 'Event', value: SCENARIO_A.eventId },
    { label: 'Target VPA', value: SCENARIO_A.benefVpa },
    { label: 'Amount', value: inr2(SCENARIO_A.amount) },
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
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.15fr]">
      <div className="panel flex flex-col">
        <div className="border-b border-line px-5 py-4">
          <span className="font-mono text-caption text-ink2">Scenario A — the attempt on record</span>
        </div>
        <div className="space-y-3 px-5 py-5 font-mono text-caption">
          <div className="flex justify-between gap-4">
            <span className="text-ink3">sender</span>
            <span className="text-right text-ink">{SCENARIO_A.senderId}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-ink3">sender VPA</span>
            <span className="text-right text-ink2">{SCENARIO_A.senderVpa}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-ink3">beneficiary</span>
            <span className="text-right text-canary">{SCENARIO_A.benefVpa}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-ink3">amount</span>
            <span className="text-right text-ink">{inr2(SCENARIO_A.amount)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-ink3">device</span>
            <span className="text-right text-ink2">{SCENARIO_A.deviceToken}</span>
          </div>
        </div>

        <ol className="space-y-2 border-t border-line px-5 py-5">
          {STEPS.map((step) => {
            const isActive = phase === step.phase;
            const isDone = phase > step.phase;
            return (
              <li
                key={step.phase}
                className={`border-l-2 pl-3 transition-colors duration-normal ${
                  isActive ? 'border-canary' : isDone ? 'border-benign/60' : 'border-line'
                }`}
              >
                <div className="flex items-baseline gap-2">
                  <span
                    className={`font-mono text-micro ${
                      isActive ? 'text-canary' : isDone ? 'text-benign' : 'text-ink3'
                    }`}
                  >
                    {step.phase}
                  </span>
                  <span
                    className={`text-caption ${
                      isActive ? 'text-ink' : isDone ? 'text-ink2' : 'text-ink3'
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
          <button type="button" className="btn-primary" onClick={run} disabled={running}>
            {running ? 'Running…' : phase >= 5 ? 'Run again' : 'Run the attempt'}
          </button>
          <button type="button" className="btn-ghost" onClick={reset} disabled={running && !reduced}>
            Reset
          </button>
        </div>
      </div>

      <div className="panel">
        <div className="flex items-baseline justify-between border-b border-line px-4 py-3">
          <span className="font-mono text-caption text-ink2">Figure 03 — Probe to interception</span>
          <span className="font-mono text-micro text-ink3">simulated</span>
        </div>

        <div className="px-4 pt-4">
          <svg viewBox="0 0 720 300" className="h-auto w-full" role="img" aria-label="Diagram of a canary probe being intercepted at the CBS sidecar">
            <path d="M 90 190 L 300 190 L 470 190 L 640 190" fill="none" stroke="rgba(148,163,184,0.25)" strokeWidth="1" />
            <path d="M 470 190 L 470 78" fill="none" stroke="rgba(148,163,184,0.18)" strokeWidth="1" strokeDasharray="3 5" />
            <path
              d="M 90 190 L 300 190 L 470 190"
              fill="none"
              stroke="#F5A524"
              strokeWidth="1.5"
              className="march"
              style={{ opacity: phase >= 1 && phase <= 2 ? 1 : 0 }}
            />

            {/* registry */}
            <circle cx="470" cy="70" r="7" fill="#0A0F17" stroke="#9AA7B8" strokeWidth="1" />
            <circle
              cx="470"
              cy="70"
              r="7"
              fill="none"
              stroke="#F5A524"
              strokeWidth="1.5"
              style={{ opacity: phase === 2 ? 1 : 0, transition: 'opacity 200ms ease' }}
            />
            <text x="470" y="48" textAnchor="middle" fill="#9AA7B8" fontSize="11" fontFamily="JetBrains Mono, monospace">
              canary registry
            </text>

            {/* sender */}
            <circle cx="90" cy="190" r="7" fill="#0A0F17" stroke={phase >= 4 ? '#F04438' : '#5C6B7E'} strokeWidth="1.2" style={{ transition: 'stroke 250ms ease' }} />
            <text x="90" y="222" textAnchor="middle" fill="#9AA7B8" fontSize="11" fontFamily="JetBrains Mono, monospace">
              sender
            </text>
            <text x="90" y="236" textAnchor="middle" fill="#5C6B7E" fontSize="9" fontFamily="JetBrains Mono, monospace">
              ACCT_SYNTH_HDFX_9912
            </text>

            {/* rail */}
            <circle cx="300" cy="190" r="7" fill="#0A0F17" stroke="#5C6B7E" strokeWidth="1.2" />
            <text x="300" y="222" textAnchor="middle" fill="#9AA7B8" fontSize="11" fontFamily="JetBrains Mono, monospace">
              payment rail
            </text>

            {/* sidecar */}
            <rect x="452" y="172" width="36" height="36" fill="#0A0F17" stroke={phase >= 2 ? '#F5A524' : '#5C6B7E'} strokeWidth="1.2" style={{ transition: 'stroke 250ms ease' }} />
            <text x="470" y="222" textAnchor="middle" fill="#9AA7B8" fontSize="11" fontFamily="JetBrains Mono, monospace">
              CBS sidecar
            </text>

            {/* canary */}
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

            {/* packet */}
            <g
              style={{
                transform: `translate(${packet.x}px, ${packet.y}px)`,
                opacity: phase >= 1 ? 1 : 0,
                transition: 'transform 640ms cubic-bezier(0.23,1,0.32,1), opacity 200ms ease',
              }}
            >
              <circle r="5" fill="#F5A524" />
              <circle r="10" fill="none" stroke="#F5A524" strokeWidth="1" opacity="0.35" />
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
          <span>{activeStep ? activeStep.title : 'Ready — run the attempt.'}</span>
          <span>record: rail.py · scenario A</span>
        </div>
      </div>
    </div>
  );
}

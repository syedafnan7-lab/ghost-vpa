import { Section } from '@/components/ui/Section';
import { Reveal } from '@/components/ui/Reveal';
import { REPO_URL } from '@/data/nav';
import { Mark } from '@/components/ui/Mark';

const INVARIANTS = [
  {
    title: 'Zero real funds movement',
    body: 'No live UPI/IMPS switch, no penny-drop, no escrow cash movement. Every event runs on the deterministic internal simulation rail.',
  },
  {
    title: 'No synthetic KYC',
    body: 'No fabricated PAN, Aadhaar or identity documents. All entities are pseudonymous synthetic identifiers such as ACCT_SYNTH_XXXX.',
  },
  {
    title: 'No automatic guilt',
    body: 'A canary interaction sets REVIEW_REQUIRED. Formal holds are disabled. The September 2026 RBI KYC amendment directions remain a draft proposal.',
  },
  {
    title: 'Zero NPCI switch changes',
    body: 'The prototype has no live switch connection or production change. A CBS/PSP sidecar is only a proposed architecture that requires formal review.',
  },
];

const STATUS_ROWS = [
  { capability: 'Simulated multi-bank rail & scenarios A–D', status: 'Implemented', tone: 'text-benign' },
  { capability: 'Canary registry & pre-routing tripwire', status: 'Implemented (simulated)', tone: 'text-benign' },
  { capability: 'Temporal graph, motifs & CS-LP', status: 'Implemented (in-memory)', tone: 'text-benign' },
  { capability: 'Comparative detection benchmark', status: 'Withdrawn pending valid evaluation', tone: 'text-canary' },
  { capability: 'Analyst workbench & D3 explorer', status: 'Implemented', tone: 'text-benign' },
  { capability: 'Live CBS / PSP event mirror', status: 'Proposed pilot', tone: 'text-feeder' },
  { capability: 'GL lien / suspense routing', status: 'Proposed pilot', tone: 'text-feeder' },
  { capability: 'NCRP-CFCFRMS & FIU-IND filing connectors', status: 'Prototype format only', tone: 'text-canary' },
  { capability: 'STIX / TAXII cross-bank sharing', status: 'Prototype format only', tone: 'text-canary' },
  { capability: 'Regulatory approval or sandbox admission', status: 'Not obtained', tone: 'text-alarm' },
];

const GOVERNANCE = [
  { name: 'Board Risk Management Committee', detail: 'Authorises active cyber-deception endpoints.' },
  { name: 'Chief Compliance Officer', detail: 'Signs off the 20-day explanation SOP alignment.' },
  { name: 'CISO / Cyber Threat Intelligence', detail: 'Validates canary namespace isolation.' },
  { name: 'NPCI / RBI sandbox filing', detail: 'Formal notification for cross-bank canary intelligence.' },
];

export function Boundaries() {
  return (
    <Section
      id="boundaries"
      index="08"
      kicker="The boundaries"
      title="The boundaries are the product"
      lede="A deception instrument inside a bank is only acceptable if its safety limits are explicit, verifiable and never quietly relaxed."
    >
      <Reveal stagger className="grid gap-4 md:grid-cols-2">
        {INVARIANTS.map((invariant) => (
          <article key={invariant.title} className="panel p-5">
            <div className="flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-benign" />
              <h3 className="font-display text-xl font-semibold tracking-[-0.02em]">{invariant.title}</h3>
            </div>
            <p className="mt-3 text-body text-ink2">{invariant.body}</p>
          </article>
        ))}
      </Reveal>

      <Reveal className="mt-6">
        <div className="border border-line bg-panel/60 px-5 py-5">
          <span className="chip border-canary/50 text-canary">REGULATORY TRUTHFULNESS</span>
          <p className="mt-3 max-w-4xl text-body text-ink2">
            The RBI September 2026 KYC Amendment Directions are a{' '}
            <span className="text-ink">draft proposal</span> published for consultation on
            11 September 2026. They are not an enacted,
            active statutory mandate. The prototype's 60-day and 20-day values are illustrative fields,
            not current obligations, legal advice, or an approval.
          </p>
        </div>
      </Reveal>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Reveal>
          <div className="panel overflow-x-auto">
            <div className="border-b border-line px-4 py-3">
              <span className="font-mono text-caption text-ink2">Implemented vs proposed</span>
            </div>
            <table className="w-full min-w-[520px] text-left">
              <tbody>
                {STATUS_ROWS.map((row) => (
                  <tr key={row.capability} className="border-b border-line/60 last:border-0">
                    <td className="px-4 py-3 text-caption text-ink2">{row.capability}</td>
                    <td className={`px-4 py-3 text-right font-mono text-caption ${row.tone}`}>
                      {row.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Reveal>

        <Reveal>
          <div className="panel">
            <div className="border-b border-line px-4 py-3">
              <span className="font-mono text-caption text-ink2">Governance checklist before any pilot</span>
            </div>
            <ul className="divide-y divide-line">
              {GOVERNANCE.map((item) => (
                <li key={item.name} className="px-5 py-4">
                  <h3 className="font-display text-base font-semibold tracking-[-0.02em]">{item.name}</h3>
                  <p className="mt-1 text-caption text-ink2">{item.detail}</p>
                </li>
              ))}
            </ul>
            <div className="figure-caption">
              <span>No partnership, approval or deployment is claimed.</span>
            </div>
          </div>
        </Reveal>
      </div>

      <Reveal className="mt-12">
        <div className="flex flex-col items-start gap-6 border border-line bg-panel/70 px-6 py-8 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <Mark size={34} />
            <div>
              <h3 className="font-display text-2xl font-semibold tracking-[-0.03em]">
                Read the mechanism, not the marketing.
              </h3>
              <p className="mt-2 max-w-xl text-body text-ink2">
                The scenarios, graph records, benchmark artifact and remediation history are all in the
                repository. Verify every claim against the code.
              </p>
            </div>
          </div>
          <a href={REPO_URL} target="_blank" rel="noreferrer" className="btn-primary shrink-0">
            Open the repository
          </a>
        </div>
      </Reveal>
    </Section>
  );
}

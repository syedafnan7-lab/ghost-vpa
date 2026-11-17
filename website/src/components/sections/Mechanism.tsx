import { Section } from '@/components/ui/Section';
import { Reveal } from '@/components/ui/Reveal';
import { TripwireDemo } from '@/components/demos/TripwireDemo';

const NOTES = [
  {
    title: 'What this is',
    body: 'A deterministic simulated interaction against a registered synthetic canary. The demo records a triage event; it does not connect to a switch or control a ledger posting instruction.',
  },
  {
    title: 'What this is not',
    body: 'Not a live bank, not a real transfer, not a penny-drop on UPI, and not a customer account. The sender is a pseudonymous synthetic identifier; no KYC record exists or is created.',
  },
  {
    title: 'Why it is fast',
    body: 'The canary set lives in memory, so matching is a deterministic registry check rather than model inference. No bank-side latency or payment-switch timing has been measured.',
  },
];

export function Mechanism() {
  return (
    <Section
      id="mechanism"
      index="03"
      kicker="The mechanism"
      title="The tripwire, step by step"
      lede="Run a synthetic event. Watch the registry match the destination and create a review flag. The prototype does not intercept or post a real payment."
    >
      <Reveal>
        <TripwireDemo />
      </Reveal>

      <Reveal stagger className="mt-6 grid gap-4 md:grid-cols-3">
        {NOTES.map((note) => (
          <article key={note.title} className="panel p-5">
            <h3 className="font-display text-lg font-semibold tracking-[-0.02em]">{note.title}</h3>
            <p className="mt-2 text-body text-ink2">{note.body}</p>
          </article>
        ))}
      </Reveal>
    </Section>
  );
}

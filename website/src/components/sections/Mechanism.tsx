import { Section } from '@/components/ui/Section';
import { Reveal } from '@/components/ui/Reveal';
import { TripwireDemo } from '@/components/demos/TripwireDemo';

const NOTES = [
  {
    title: 'What this is',
    body: 'A deterministic simulated attempt against a registered canary, processed by the same record shape the workbench uses. The registry lookup is an in-memory set check performed before any ledger posting instruction.',
  },
  {
    title: 'What this is not',
    body: 'Not a live bank, not a real transfer, not a penny-drop on UPI, and not a customer account. The sender is a pseudonymous synthetic identifier; no KYC record exists or is created.',
  },
  {
    title: 'Why it is fast',
    body: 'The canary set lives in memory, so recognition is a hash lookup rather than a model inference. The tripwire is a rule, not a prediction — which is why it can fire in under five milliseconds.',
  },
];

export function Mechanism() {
  return (
    <Section
      id="mechanism"
      index="03"
      kicker="The mechanism"
      title="The tripwire, step by step"
      lede="Run the attempt. Watch the registry recognise the destination, the sidecar stop the posting, and the sender become a review flag rather than a suspect."
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

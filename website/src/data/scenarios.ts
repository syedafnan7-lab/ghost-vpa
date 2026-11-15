// Event shapes mirror backend/app/schemas/events.py and the Scenario A-D
// records in backend/app/simulator/rail.py. `minutesAgo` is relative to the
// scenario's simulation-now, so the website reproduces the same topology and
// timestamps without a backend.
import { ACTIVE_CANARY_VPAS } from './canaries';

export interface PaymentRecord {
  eventId: string;
  senderId: string;
  senderVpa: string;
  senderBank: string;
  benefId: string | null;
  benefVpa: string;
  benefBank: string;
  amount: number;
  rail: 'UPI' | 'IMPS';
  attemptType: string;
  deviceToken: string;
  ipSubnet: string;
  minutesAgo: number;
  isCanary: boolean;
}

export type ScenarioId = 'A' | 'B' | 'C' | 'D';

export interface ScenarioMeta {
  id: ScenarioId;
  name: string;
  short: string;
  question: string;
  answer: string;
}

export const SCENARIOS: ScenarioMeta[] = [
  {
    id: 'A',
    name: 'Honeypot Tripwire',
    short: 'Tripwire',
    question: 'What happens when a mule probes a registered canary VPA?',
    answer: 'The attempt is intercepted before ledger posting; the sender is flagged for review, not punished.',
  },
  {
    id: 'B',
    name: 'Shared Upstream Feeder',
    short: 'Feeder',
    question: 'Three mules hit two different canaries. Who is behind all three?',
    answer: 'A single upstream feeder, unmasked by backward graph propagation and a shared device token.',
  },
  {
    id: 'C',
    name: 'Benign Merchant Lookalike',
    short: 'Lookalike',
    question: 'A busy MSME looks exactly like a mule on transaction rules. Who is right?',
    answer: 'The graph is: zero canary connectivity, so the account is cleared instead of frozen.',
  },
  {
    id: 'D',
    name: 'Multi-Hop Layering Chain',
    short: 'Layering',
    question: 'Four hops in under half an hour. Can the chain be read in time?',
    answer: 'Inter-hop velocity under 15 minutes and near-perfect amount conservation expose the layering pattern.',
  },
];

// --- Scenario A -------------------------------------------------------------
export const SCENARIO_A: PaymentRecord = {
  eventId: 'TXN-SCEN-A-0001',
  senderId: 'ACCT_SYNTH_HDFX_9912',
  senderVpa: 'sender.mule01@hdfxbank',
  senderBank: 'HDFX',
  benefId: null,
  benefVpa: 'canary.trap.01@icixbank',
  benefBank: 'ICIX',
  amount: 5000,
  rail: 'UPI',
  attemptType: 'P2P',
  deviceToken: 'DEV_TOK_CRIMSON_88',
  ipSubnet: '10.240.10.0/24',
  minutesAgo: 0,
  isCanary: true,
};

// --- Scenario B -------------------------------------------------------------
export const SCENARIO_B: PaymentRecord[] = [
  {
    eventId: 'TXN-FEED-0001',
    senderId: 'FEEDER_SYNTH_007',
    senderVpa: 'master.feeder@hdfxbank',
    senderBank: 'HDFX',
    benefId: 'ACCT_SYNTH_ICIX_4401',
    benefVpa: 'mule.alpha@icixbank',
    benefBank: 'ICIX',
    amount: 45000,
    rail: 'IMPS',
    attemptType: 'P2P',
    deviceToken: 'DEV_TOK_FEEDER_99',
    ipSubnet: '10.100.5.0/24',
    minutesAgo: 24,
    isCanary: false,
  },
  {
    eventId: 'TXN-FEED-0002',
    senderId: 'FEEDER_SYNTH_007',
    senderVpa: 'master.feeder@hdfxbank',
    senderBank: 'HDFX',
    benefId: 'ACCT_SYNTH_HDFX_4402',
    benefVpa: 'mule.beta@hdfxbank',
    benefBank: 'HDFX',
    amount: 45000,
    rail: 'IMPS',
    attemptType: 'P2P',
    deviceToken: 'DEV_TOK_FEEDER_99',
    ipSubnet: '10.100.5.0/24',
    minutesAgo: 22,
    isCanary: false,
  },
  {
    eventId: 'TXN-FEED-0003',
    senderId: 'FEEDER_SYNTH_007',
    senderVpa: 'master.feeder@hdfxbank',
    senderBank: 'HDFX',
    benefId: 'ACCT_SYNTH_SBINX_4403',
    benefVpa: 'mule.gamma@sbinxbank',
    benefBank: 'SBINX',
    amount: 45000,
    rail: 'IMPS',
    attemptType: 'P2P',
    deviceToken: 'DEV_TOK_FEEDER_99',
    ipSubnet: '10.100.5.0/24',
    minutesAgo: 18,
    isCanary: false,
  },
  {
    eventId: 'TXN-SCEN-B-0001',
    senderId: 'ACCT_SYNTH_ICIX_4401',
    senderVpa: 'mule.alpha@icixbank',
    senderBank: 'ICIX',
    benefId: null,
    benefVpa: 'canary.trap.01@icixbank',
    benefBank: 'ICIX',
    amount: 42000,
    rail: 'UPI',
    attemptType: 'PENNY_DROP_PROBE',
    deviceToken: 'DEV_TOK_SYND_SHARED_44',
    ipSubnet: '10.100.5.0/24',
    minutesAgo: 0,
    isCanary: true,
  },
  {
    eventId: 'TXN-SCEN-B-0002',
    senderId: 'ACCT_SYNTH_HDFX_4402',
    senderVpa: 'mule.beta@hdfxbank',
    senderBank: 'HDFX',
    benefId: null,
    benefVpa: 'canary.alert.02@hdfxbank',
    benefBank: 'HDFX',
    amount: 42000,
    rail: 'UPI',
    attemptType: 'P2P',
    deviceToken: 'DEV_TOK_SYND_SHARED_44',
    ipSubnet: '10.100.5.0/24',
    minutesAgo: 0,
    isCanary: true,
  },
];

// --- Scenario C -------------------------------------------------------------
export const SCENARIO_C: PaymentRecord[] = [
  ['ACCT_SYNTH_RETAIL_100', 'customer.100@sbinxbank', 1250, 0],
  ['ACCT_SYNTH_RETAIL_101', 'customer.101@sbinxbank', 3400, 0.1],
  ['ACCT_SYNTH_RETAIL_102', 'customer.102@sbinxbank', 890, 0.2],
  ['ACCT_SYNTH_RETAIL_103', 'customer.103@sbinxbank', 4200, 0.3],
  ['ACCT_SYNTH_RETAIL_104', 'customer.104@sbinxbank', 2750, 0.4],
].map(([senderId, senderVpa, amount, minutesAgo], i) => ({
  eventId: `TXN-SCEN-C-${i + 1}`,
  senderId: senderId as string,
  senderVpa: senderVpa as string,
  senderBank: 'SBINX',
  benefId: 'MERCHANT_MSME_901',
  benefVpa: 'freshfoods.merchant@icixbank',
  benefBank: 'ICIX',
  amount: amount as number,
  rail: 'UPI' as const,
  attemptType: 'P2M',
  deviceToken: `DEV_TOK_CUST_${i}`,
  ipSubnet: `172.16.${i}.0/24`,
  minutesAgo: minutesAgo as number,
  isCanary: false,
}));

// --- Scenario D -------------------------------------------------------------
export const SCENARIO_D: PaymentRecord[] = [
  {
    eventId: 'TXN-SCEN-D-0001',
    senderId: 'FEEDER_SYNTH_009',
    senderVpa: 'feeder_synth_009@bank',
    senderBank: 'SBINX',
    benefId: 'ACCT_SYNTH_MULE_HOP1',
    benefVpa: 'acct_synth_mule_hop1@bank',
    benefBank: 'SBINX',
    amount: 75000,
    rail: 'UPI',
    attemptType: 'P2P',
    deviceToken: 'DEV_TOK_MULTIHOP_CHAIN',
    ipSubnet: '192.168.1.0/24',
    minutesAgo: 25,
    isCanary: false,
  },
  {
    eventId: 'TXN-SCEN-D-0002',
    senderId: 'ACCT_SYNTH_MULE_HOP1',
    senderVpa: 'acct_synth_mule_hop1@bank',
    senderBank: 'SBINX',
    benefId: 'ACCT_SYNTH_MULE_HOP2',
    benefVpa: 'acct_synth_mule_hop2@bank',
    benefBank: 'SBINX',
    amount: 73500,
    rail: 'UPI',
    attemptType: 'P2P',
    deviceToken: 'DEV_TOK_MULTIHOP_CHAIN',
    ipSubnet: '192.168.1.0/24',
    minutesAgo: 18,
    isCanary: false,
  },
  {
    eventId: 'TXN-SCEN-D-0003',
    senderId: 'ACCT_SYNTH_MULE_HOP2',
    senderVpa: 'acct_synth_mule_hop2@bank',
    senderBank: 'SBINX',
    benefId: 'ACCT_SYNTH_MULE_HOP3',
    benefVpa: 'acct_synth_mule_hop3@bank',
    benefBank: 'SBINX',
    amount: 72000,
    rail: 'UPI',
    attemptType: 'P2P',
    deviceToken: 'DEV_TOK_MULTIHOP_CHAIN',
    ipSubnet: '192.168.1.0/24',
    minutesAgo: 10,
    isCanary: false,
  },
  {
    eventId: 'TXN-SCEN-D-0004',
    senderId: 'ACCT_SYNTH_MULE_HOP3',
    senderVpa: 'acct_synth_mule_hop3@bank',
    senderBank: 'SBINX',
    benefId: null,
    benefVpa: 'canary.tripwire.03@sbinxbank',
    benefBank: 'SBINX',
    amount: 70000,
    rail: 'UPI',
    attemptType: 'P2P',
    deviceToken: 'DEV_TOK_MULTIHOP_CHAIN',
    ipSubnet: '192.168.1.0/24',
    minutesAgo: 2,
    isCanary: true,
  },
];

// Illustrative ambient traffic so the 72-hour temporal slider has something to
// prune. These are not part of the four judge scenarios; they represent the
// ordinary background edges that a real ego view would also contain.
export const AMBIENT_TRAFFIC: PaymentRecord[] = [
  ['ACCT_SYNTH_AMB_01', 'ACCT_SYNTH_AMB_02', 1200, 90],
  ['ACCT_SYNTH_AMB_03', 'ACCT_SYNTH_AMB_04', 2600, 300],
  ['ACCT_SYNTH_AMB_05', 'ACCT_SYNTH_AMB_06', 800, 720],
  ['ACCT_SYNTH_AMB_02', 'ACCT_SYNTH_AMB_07', 3400, 1680],
  ['ACCT_SYNTH_AMB_08', 'ACCT_SYNTH_AMB_01', 1900, 2820],
  ['ACCT_SYNTH_AMB_04', 'ACCT_SYNTH_AMB_09', 4100, 3840],
].map(([senderId, benefId, amount, minutesAgo], i) => ({
  eventId: `TXN-AMB-${i + 1}`,
  senderId: senderId as string,
  senderVpa: `${(senderId as string).toLowerCase()}@bank`,
  senderBank: 'SBINX',
  benefId: benefId as string,
  benefVpa: `${(benefId as string).toLowerCase()}@bank`,
  benefBank: 'ICIX',
  amount: amount as number,
  rail: 'UPI' as const,
  attemptType: 'P2P',
  deviceToken: `DEV_TOK_AMB_${i}`,
  ipSubnet: `10.20.${i}.0/24`,
  minutesAgo: minutesAgo as number,
  isCanary: false,
}));

export function recordsFor(scenario: ScenarioId): PaymentRecord[] {
  switch (scenario) {
    case 'A':
      return [SCENARIO_A];
    case 'B':
      return SCENARIO_B;
    case 'C':
      return SCENARIO_C;
    case 'D':
      return SCENARIO_D;
  }
}

export function isCanaryVpa(vpa: string): boolean {
  return ACTIVE_CANARY_VPAS.has(vpa.toLowerCase());
}

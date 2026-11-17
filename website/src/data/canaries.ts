// Records mirror backend/app/core/honeypot_registry.py default seed data.
export type CanaryType = 'SYNTHETIC_DEMO_CANARY';

export interface CanaryRecord {
  id: string;
  vpa: string;
  bank: string;
  type: CanaryType;
  status: 'ACTIVE';
  purpose: string;
  region: string;
}

export const CANARIES: CanaryRecord[] = [
  {
    id: 'CANARY-BLR-001',
    vpa: 'canary.trap.01@icixbank',
    bank: 'ICIX',
    type: 'SYNTHETIC_DEMO_CANARY',
    status: 'ACTIVE',
    purpose: 'Synthetic demo identifier.',
    region: 'South',
  },
  {
    id: 'CANARY-MUM-002',
    vpa: 'canary.alert.02@hdfxbank',
    bank: 'HDFX',
    type: 'SYNTHETIC_DEMO_CANARY',
    status: 'ACTIVE',
    purpose: 'Synthetic demo identifier.',
    region: 'West',
  },
  {
    id: 'CANARY-DEL-003',
    vpa: 'canary.tripwire.03@sbinxbank',
    bank: 'SBINX',
    type: 'SYNTHETIC_DEMO_CANARY',
    status: 'ACTIVE',
    purpose: 'Synthetic demo identifier.',
    region: 'North',
  },
  {
    id: 'CANARY-SOP-004',
    vpa: 'turncoat.surrender.04@axsxbank',
    bank: 'AXSX',
    type: 'SYNTHETIC_DEMO_CANARY',
    status: 'ACTIVE',
    purpose: 'Synthetic demo identifier.',
    region: 'East',
  },
];

export const ACTIVE_CANARY_VPAS = new Set(CANARIES.map((c) => c.vpa.toLowerCase()));

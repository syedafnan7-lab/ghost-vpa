// Records mirror backend/app/core/honeypot_registry.py default seed data.
export type CanaryType = 'REGULATORY_TRIPWIRE' | 'CONSENTED_TURNOAT';

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
    type: 'REGULATORY_TRIPWIRE',
    status: 'ACTIVE',
    purpose: 'Regulatory honeypot for southern-region mule detection.',
    region: 'South',
  },
  {
    id: 'CANARY-MUM-002',
    vpa: 'canary.alert.02@hdfxbank',
    bank: 'HDFX',
    type: 'REGULATORY_TRIPWIRE',
    status: 'ACTIVE',
    purpose: 'Layering trap for high-velocity rapid splits.',
    region: 'West',
  },
  {
    id: 'CANARY-DEL-003',
    vpa: 'canary.tripwire.03@sbinxbank',
    bank: 'SBINX',
    type: 'REGULATORY_TRIPWIRE',
    status: 'ACTIVE',
    purpose: 'Canary for micro-transfer penny-drop probing.',
    region: 'North',
  },
  {
    id: 'CANARY-SOP-004',
    vpa: 'turncoat.surrender.04@axsxbank',
    bank: 'AXSX',
    type: 'CONSENTED_TURNOAT',
    status: 'ACTIVE',
    purpose: 'Consented surrendered VPA under the RBI 20-day explanation window.',
    region: 'East',
  },
];

export const ACTIVE_CANARY_VPAS = new Set(CANARIES.map((c) => c.vpa.toLowerCase()));

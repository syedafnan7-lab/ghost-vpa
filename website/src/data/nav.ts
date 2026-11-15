export interface NavItem {
  id: string;
  index: string;
  label: string;
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'problem', index: '01', label: 'Problem' },
  { id: 'shift', index: '02', label: 'Shift' },
  { id: 'mechanism', index: '03', label: 'Tripwire' },
  { id: 'graph', index: '04', label: 'Graph' },
  { id: 'evidence', index: '05', label: 'Evidence' },
  { id: 'benchmark', index: '06', label: 'Benchmark' },
  { id: 'architecture', index: '07', label: 'Architecture' },
  { id: 'boundaries', index: '08', label: 'Boundaries' },
];

export const REPO_URL = 'https://github.com/syedafnan7-lab/ghost-vpa/tree/gems-ghost';
export const WORKBENCH_URL = 'http://localhost:5173';
export const API_BASE_URL = 'http://127.0.0.1:8000';

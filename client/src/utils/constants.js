// Furniture categories
export const FURNITURE_CATEGORIES = [
  { id: 'all',       label: 'All' },
  { id: 'seating',   label: 'Seating' },
  { id: 'tables',    label: 'Tables' },
  { id: 'storage',   label: 'Storage' },
  { id: 'beds',      label: 'Beds' },
  { id: 'lighting',  label: 'Lighting' },
  { id: 'decor',     label: 'Decor' },
];

// Default room dimensions (in meters)
export const DEFAULT_ROOM = {
  width:  5,
  length: 6,
  height: 2.8,
};

// Canvas config (pixels per meter for 2D view)
export const PX_PER_METER = 60;

// Three.js scene defaults — dark theme
export const SCENE_DEFAULTS = {
  ambientIntensity:     0.5,
  directionalIntensity: 0.9,
  backgroundColor:      '#0d0d0d',
  gridSize:             20,
  gridDivisions:        20,
};

// Colour palette used in 3D/2D canvas — dark theme
export const COLORS = {
  wall:    '#1a1a1a',
  floor:   '#141414',
  ceiling: '#111111',
  accent:  '#e8d5b7',
  grid:    '#ffffff08',
  gridSection: '#ffffff14',
  selectionBox: '#e8d5b7',
};

// Error messages
export const ERRORS = {
  network: 'Network error. Please check your connection.',
  auth:    'Your session has expired. Please log in again.',
  generic: 'Something went wrong. Please try again.',
};

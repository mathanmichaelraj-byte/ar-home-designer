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

// Three.js scene defaults
export const SCENE_DEFAULTS = {
  ambientIntensity: 0.6,
  directionalIntensity: 0.8,
  backgroundColor: '#1A1A2E',
  gridSize: 20,
  gridDivisions: 20,
};

// Colour palette used in 3D/2D canvas
export const COLORS = {
  wall:    '#263447',
  floor:   '#1F2B3E',
  accent:  '#E94560',
  grid:    '#ffffff11',
};

// Error messages
export const ERRORS = {
  network: 'Network error. Please check your connection.',
  auth:    'Your session has expired. Please log in again.',
  generic: 'Something went wrong. Please try again.',
};

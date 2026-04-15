// ─── Grid / canvas ────────────────────────────────────────────────────────────
export const GRID_SIZE   = 40;   // px per grid cell in 2D floor plan
export const MIN_ROOM_SIZE = 2;  // minimum room dimension in metres
export const G2M = 1 / 40;      // grid-units → metres conversion

// ─── Default room dimensions (metres) ────────────────────────────────────────
export const DEFAULT_ROOM = { width: 5, length: 5, height: 2.8 };

// ─── 3D scene ─────────────────────────────────────────────────────────────────
export const SCENE = {
  bg:           '#0d0d0d',
  floorColor:   '#2a2a2a',
  wallColor:    '#1a1a1a',
  ceilingColor: '#111111',
  gridCell:     '#333333',
  gridSection:  '#444444',
  selectionCol: '#ffffff',
  floorH:       3.5,   // metres per floor in 3D house view
};

// ─── Room types ───────────────────────────────────────────────────────────────
export const ROOM_TYPES = [
  { value: 'living',   label: 'Living Room', emoji: '🛋️' },
  { value: 'bedroom',  label: 'Bedroom',     emoji: '🛏️' },
  { value: 'office',   label: 'Office',      emoji: '💼' },
  { value: 'dining',   label: 'Dining Room', emoji: '🍽️' },
  { value: 'kitchen',  label: 'Kitchen',     emoji: '🍳' },
  { value: 'bathroom', label: 'Bathroom',    emoji: '🚿' },
  { value: 'other',    label: 'Other',       emoji: '🏠' },
];

export const ROOM_EMOJI = Object.fromEntries(
  ROOM_TYPES.map(r => [r.value, r.emoji])
);

// 2D floor-plan colour palette per room type
export const ROOM_PAL_2D = {
  living:   { bg: '#1e3a5f', border: '#4f6ef7', label: '#93bbff' },
  bedroom:  { bg: '#2d1b3d', border: '#9b59b6', label: '#d4a0f0' },
  office:   { bg: '#1a3a2a', border: '#27ae60', label: '#82d9a0' },
  dining:   { bg: '#3d2a1a', border: '#e67e22', label: '#f4b97a' },
  kitchen:  { bg: '#3d1a1a', border: '#e74c3c', label: '#f4928a' },
  bathroom: { bg: '#1a2d3d', border: '#1abc9c', label: '#7de8d4' },
  other:    { bg: '#252a3d', border: '#7f8c8d', label: '#b0b8c1' },
};

// 3D house-plan colour palette per room type
export const ROOM_PAL_3D = {
  living:   { fill: '#1e3a6e', line: '#4a72c8' },
  bedroom:  { fill: '#3d1e6e', line: '#8c52cc' },
  office:   { fill: '#1a4a28', line: '#2eaa55' },
  dining:   { fill: '#5a2008', line: '#cc5a1a' },
  kitchen:  { fill: '#5a1a1a', line: '#cc3030' },
  bathroom: { fill: '#08383e', line: '#0a9898' },
  other:    { fill: '#222630', line: '#5a6270' },
};

// Tailwind classes for room type badges (HouseDashboard)
export const ROOM_BADGE_CLS = {
  living:   'bg-blue-500/10   border-blue-500/20',
  bedroom:  'bg-purple-500/10 border-purple-500/20',
  office:   'bg-green-500/10  border-green-500/20',
  dining:   'bg-orange-500/10 border-orange-500/20',
  kitchen:  'bg-red-500/10    border-red-500/20',
  bathroom: 'bg-teal-500/10   border-teal-500/20',
  other:    'bg-gray-800      border-gray-700',
};

// Floor-badge colours for 2D plan
export const FLOOR_BADGE_COLORS = ['', '#4f6ef7', '#27ae60', '#e67e22', '#e74c3c', '#9b59b6'];

export const FLOOR_OPTIONS = [
  { v: 1, l: 'Ground Floor' },
  { v: 2, l: '1st Floor'    },
  { v: 3, l: '2nd Floor'    },
  { v: 4, l: '3rd Floor'    },
];

// ─── Furniture ────────────────────────────────────────────────────────────────
export const FURNITURE_CATEGORIES = [
  { id: 'all',      label: 'All'      },
  { id: 'sofa',     label: 'Sofa'     },
  { id: 'chair',    label: 'Chair'    },
  { id: 'table',    label: 'Table'    },
  { id: 'bed',      label: 'Bed'      },
  { id: 'shelf',    label: 'Shelf'    },
  { id: 'desk',     label: 'Desk'     },
  { id: 'lamp',     label: 'Lamp'     },
  { id: 'cabinet',  label: 'Cabinet'  },
  { id: 'plant',    label: 'Plant'    },
];

// Keywords that indicate a ceiling-mounted item
export const CEILING_KEYWORDS = ['ceiling', 'fan', 'chandelier', 'pendant'];

// ─── AI room styles ───────────────────────────────────────────────────────────
export const AI_STYLES = [
  { style: 'living',   emoji: '🛋️', label: 'Living Room' },
  { style: 'bedroom',  emoji: '🛏️', label: 'Bedroom'     },
  { style: 'office',   emoji: '💼', label: 'Office'       },
  { style: 'dining',   emoji: '🍽️', label: 'Dining Room' },
  { style: 'kitchen',  emoji: '🍳', label: 'Kitchen'      },
  { style: 'bathroom', emoji: '🚿', label: 'Bathroom'     },
];

// ─── Error messages ───────────────────────────────────────────────────────────
export const ERRORS = {
  network: 'Network error. Please check your connection.',
  auth:    'Your session has expired. Please log in again.',
  generic: 'Something went wrong. Please try again.',
};

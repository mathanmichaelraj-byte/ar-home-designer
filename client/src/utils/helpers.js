import { CEILING_KEYWORDS, FLOOR_OPTIONS, ROOM_TYPES } from './constants';

// ─── 2D canvas ────────────────────────────────────────────────────────────────

/** Snap a pixel value to the nearest grid cell. */
export const snapToGrid = (v, grid = 40) => Math.round(v / grid) * grid;

// ─── Furniture / objects ──────────────────────────────────────────────────────

/**
 * Build a new scene object from a furniture catalogue item.
 * Ceiling-mounted items (fan, chandelier, etc.) start at y = 2.5.
 */
export const buildNewObject = (item) => {
  const isCeiling = CEILING_KEYWORDS.some(k =>
    item.name.toLowerCase().includes(k)
  );
  return {
    furnitureId: item._id,
    name:        item.name,
    modelUrl:    item.modelUrl,
    position:    { x: 0, y: isCeiling ? 2.5 : 0, z: 0 },
    rotation:    { x: 0, y: 0, z: 0 },
    scale:       { x: 1, y: 1, z: 1 },
    color:       '#cccccc',
  };
};

// ─── Date / time ──────────────────────────────────────────────────────────────

/**
 * Returns a human-readable relative time string.
 * e.g. "Just now", "5m ago", "3h ago", "2d ago"
 */
export const formatAgo = (date) => {
  const diff  = Date.now() - new Date(date).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins  < 1)  return 'Just now';
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};

// ─── Password ─────────────────────────────────────────────────────────────────

/**
 * Returns a strength descriptor for a password string.
 * Returns null when the password is empty.
 */
export const passwordStrength = (password) => {
  if (!password) return null;
  if (password.length < 6)  return { label: 'Too short', color: 'bg-red-500',   textColor: 'text-gray-500', w: 'w-1/4' };
  if (password.length < 8)  return { label: 'Weak',      color: 'bg-gray-500',  textColor: 'text-gray-400', w: 'w-2/4' };
  if (password.length < 12) return { label: 'Good',      color: 'bg-gray-300',  textColor: 'text-gray-300', w: 'w-3/4' };
  return                           { label: 'Strong',    color: 'bg-white',     textColor: 'text-white',    w: 'w-full' };
};

// ─── Floor / room helpers ─────────────────────────────────────────────────────

/**
 * Returns a display label for a floor number.
 * e.g. 1 → "Ground", 2 → "1st Fl.", 3 → "2nd Fl."
 */
export const floorLabel = (n) => {
  if (n === 1) return 'Ground';
  if (n === 2) return '1st Fl.';
  if (n === 3) return '2nd Fl.';
  return `${n - 1}th Fl.`;
};

/**
 * Returns the full floor option object for a given floor number.
 */
export const getFloorOption = (n) =>
  FLOOR_OPTIONS.find(f => f.v === n) ?? FLOOR_OPTIONS[0];

/**
 * Returns the ROOM_TYPES entry for a given type value.
 */
export const getRoomType = (value) =>
  ROOM_TYPES.find(r => r.value === value) ?? ROOM_TYPES[ROOM_TYPES.length - 1];

// ─── Number formatting ────────────────────────────────────────────────────────

/** Clamp a number between min and max. */
export const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

/** Round to a given number of decimal places. */
export const round = (val, decimals = 3) =>
  +val.toFixed(decimals);

/**
 * AI Layout Suggestion Service — Zone-based smart placement
 */

const STYLE_CONFIGS = {
  living: {
    zones: [
      { name: 'seating', types: ['sofa', 'chair'], anchor: 'center', offset: { x: 0, z: 0.5 } },
      { name: 'table',   types: ['table'],          anchor: 'front',  offset: { x: 0, z: -0.5 } },
      { name: 'storage', types: ['shelf', 'other'], anchor: 'wall',   offset: { x: 0, z: 0 } },
      { name: 'lamp',    types: ['lamp'],            anchor: 'corner', offset: { x: 0, z: 0 } },
      { name: 'plant',   types: ['plant', 'rug'],    anchor: 'corner', offset: { x: 0, z: 0 } },
    ],
    tip: 'Place the sofa facing the focal point (TV or fireplace). Use a rug to anchor the seating zone.',
  },
  bedroom: {
    zones: [
      { name: 'bed',     types: ['bed'],             anchor: 'back',   offset: { x: 0,    z: 0 } },
      { name: 'storage', types: ['other', 'shelf'],  anchor: 'wall',   offset: { x: 0,    z: 0 } },
      { name: 'desk',    types: ['desk'],             anchor: 'side',   offset: { x: 0,    z: 0 } },
      { name: 'lamp',    types: ['lamp'],             anchor: 'beside', offset: { x: 0.6,  z: 0 } },
      { name: 'plant',   types: ['plant'],            anchor: 'corner', offset: { x: 0,    z: 0 } },
    ],
    tip: 'Center the bed on the longest wall. Keep walkways at least 0.9m wide on each side.',
  },
  office: {
    zones: [
      { name: 'desk',    types: ['desk'],             anchor: 'window', offset: { x: 0, z: 0 } },
      { name: 'chair',   types: ['chair'],            anchor: 'desk',   offset: { x: 0, z: 0.6 } },
      { name: 'storage', types: ['shelf'],            anchor: 'wall',   offset: { x: 0, z: 0 } },
      { name: 'lamp',    types: ['lamp'],             anchor: 'corner', offset: { x: 0, z: 0 } },
      { name: 'plant',   types: ['plant'],            anchor: 'corner', offset: { x: 0, z: 0 } },
    ],
    tip: 'Face the desk toward a wall or window. Add shelving behind you for easy access.',
  },
  dining: {
    zones: [
      { name: 'table',  types: ['table'],             anchor: 'center', offset: { x: 0, z: 0 } },
      { name: 'chairs', types: ['chair'],             anchor: 'around', offset: { x: 0, z: 0 } },
      { name: 'storage',types: ['other', 'shelf'],    anchor: 'wall',   offset: { x: 0, z: 0 } },
      { name: 'lamp',   types: ['lamp'],              anchor: 'center', offset: { x: 0, z: 0 } },
    ],
    tip: 'Leave at least 1m clearance around the dining table for comfortable movement.',
  },
  kitchen: {
    zones: [
      { name: 'appliances', types: ['other'],         anchor: 'wall',   offset: { x: 0, z: 0 } },
      { name: 'storage',    types: ['shelf'],         anchor: 'wall',   offset: { x: 0, z: 0 } },
      { name: 'seating',    types: ['chair'],         anchor: 'island', offset: { x: 0, z: 0 } },
    ],
    tip: 'Follow the kitchen work triangle: fridge, sink, and stove should form a triangle for efficiency.',
  },
  bathroom: {
    zones: [
      { name: 'bath',    types: ['other'],            anchor: 'wall',   offset: { x: 0, z: 0 } },
      { name: 'storage', types: ['shelf', 'other'],   anchor: 'wall',   offset: { x: 0, z: 0 } },
      { name: 'plant',   types: ['plant'],            anchor: 'corner', offset: { x: 0, z: 0 } },
    ],
    tip: 'Keep wet zones (shower/bath) away from the door. Add storage above the toilet.',
  },
};

/**
 * Calculate position based on anchor type and room dimensions
 * All positions are returned in room-origin space (0→W, 0→L)
 * to match the Three.js scene coordinate system.
 */
const getPosition = (anchor, index, total, width, length, dimensions) => {
  const hw = width / 2;
  const hl = length / 2;
  const itemW = dimensions?.width || 0.8;
  const itemD = dimensions?.depth || 0.8;
  const wallGap = 0.1;
  const y = 0;

  // Compute centered position (relative to room center = 0,0)
  let cx = 0, cz = 0;

  switch (anchor) {
    case 'center':
      cx = 0; cz = 0;
      break;

    case 'front':
      cx = (index - (total - 1) / 2) * (itemW + 0.2);
      cz = hl * 0.3;
      break;

    case 'back':
      cx = (index - (total - 1) / 2) * (itemW + 0.2);
      cz = -(hl - itemD / 2 - wallGap);
      break;

    case 'wall': {
      const spread = width * 0.7;
      const step = total > 1 ? spread / (total - 1) : 0;
      cx = (-spread / 2) + index * step;
      cz = -(hl - itemD / 2 - wallGap);
      break;
    }

    case 'side': {
      const side = index % 2 === 0 ? -1 : 1;
      cx = side * (hw - itemW / 2 - wallGap);
      cz = (index < 2 ? -1 : 1) * hl * 0.3;
      break;
    }

    case 'corner': {
      const corners = [
        { x: -(hw - itemW / 2 - wallGap), z: -(hl - itemD / 2 - wallGap) },
        { x:  (hw - itemW / 2 - wallGap), z: -(hl - itemD / 2 - wallGap) },
        { x: -(hw - itemW / 2 - wallGap), z:  (hl - itemD / 2 - wallGap) },
        { x:  (hw - itemW / 2 - wallGap), z:  (hl - itemD / 2 - wallGap) },
      ];
      const c = corners[index % 4];
      cx = c.x; cz = c.z;
      break;
    }

    case 'beside':
      cx = -(hw - itemW / 2 - wallGap) + index * (itemW + 0.2);
      cz = -(hl - itemD / 2 - wallGap) + 0.9;
      break;

    case 'around': {
      const radius = Math.max(itemW, itemD) * 1.2 + 0.4;
      const angle = (index / total) * 2 * Math.PI;
      cx = Math.cos(angle) * radius;
      cz = Math.sin(angle) * radius;
      break;
    }

    case 'island':
      cx = (index - (total - 1) / 2) * (itemW + 0.2);
      cz = hl * 0.35;
      break;

    case 'window':
      cx = (index - (total - 1) / 2) * (itemW + 0.3);
      cz = -(hl - itemD / 2 - wallGap);
      break;

    case 'desk':
      cx = (index - (total - 1) / 2) * (itemW + 0.1);
      cz = -(hl - itemD / 2 - wallGap) + itemD + 0.6;
      break;

    default:
      cx = index * (itemW + 0.2) - ((total - 1) * (itemW + 0.2)) / 2;
      cz = 0;
  }

  // ✅ Offset from room-center coords → room-origin coords (matching Three.js scene)
  return {
    x: +(cx + hw).toFixed(3),
    y,
    z: +(cz + hl).toFixed(3),
  };
};

/**
 * Get rotation so furniture faces center of room
 */
const getFacingRotation = (position, anchor, width) => {
  switch (anchor) {
    case 'back':
    case 'wall':
    case 'window':
      return { x: 0, y: Math.PI, z: 0 };
    case 'side':
      // position.x is now in room-origin space, compare against room center
      return { x: 0, y: position.x > (width / 2) ? -Math.PI / 2 : Math.PI / 2, z: 0 };
    case 'around': {
      // atan2 from room center, not origin
      const angle = Math.atan2(position.x - width / 2, position.z) + Math.PI;
      return { x: 0, y: +angle.toFixed(3), z: 0 };
    }
    default:
      return { x: 0, y: 0, z: 0 };
  }
};

/**
 * Main layout suggestion function
 */
exports.suggestLayout = ({ width = 5, length = 5, style = 'living', availableFurniture = [] }) => {
  const config = STYLE_CONFIGS[style] || STYLE_CONFIGS.living;
  const area = width * length;
  const suggestions = [];

  // Max items based on room size
  const maxItems = area < 9 ? 5 : area < 16 ? 8 : area < 25 ? 12 : area < 40 ? 16 : 20;
  for (const zone of config.zones) {
    if (suggestions.length >= maxItems) break;

    // Find best matching furniture for this zone
    const matches = availableFurniture.filter(f => zone.types.includes(f.type));
    if (matches.length === 0) continue;

    // How many of this type to place (chairs get more, lamps get 1-2)
    const count = zone.name === 'chairs'  ? Math.min(6, Math.max(2, Math.floor(area / 5))) :
              zone.name === 'lamp'    ? Math.min(3, Math.max(1, Math.floor(area / 10))) :
              zone.name === 'plant'   ? Math.min(3, Math.max(1, Math.floor(area / 12))) :
              zone.name === 'storage' ? Math.min(3, Math.max(1, Math.floor(area / 10))) :
              zone.name === 'seating' ? Math.min(2, Math.max(1, Math.floor(area / 12))) : 1;

    for (let i = 0; i < count; i++) {
      if (suggestions.length >= maxItems) break;

      let item = matches[i % matches.length];
      if (suggestions.some(s => s.modelUrl === item.modelUrl)) {
        const alt = matches.find(m => !suggestions.some(s => s.modelUrl === m.modelUrl));
        if (alt) item = alt;
        else continue;
      }

      const position = getPosition(zone.anchor, i, count, width, length, item.dimensions);
      const rotation = getFacingRotation(position, zone.anchor, width);
      suggestions.push({
        furnitureId: item._id,
        name: item.name,
        modelUrl: item.modelUrl,
        position,
        rotation,
        scale: { x: 1, y: 1, z: 1 },
        color: '#cccccc',
      });
    }
  }

  // Size-based tip
  const sizeTip = area < 12
    ? '🏠 Small room: use multi-functional furniture and light colors to open up the space.'
    : area < 25
    ? '🏠 Medium room: define zones with a rug. Keep pathways at least 0.9m wide.'
    : '🏠 Large room: anchor each zone with a statement piece to avoid it feeling empty.';

  return {
    style,
    area: +area.toFixed(1),
    suggestions,
    tip: config.tip,
    sizeTip,
  };
};

/**
 * Estimate total cost
 */
exports.estimateCost = (selectedFurniture) => {
  const subtotal = selectedFurniture.reduce((sum, f) => sum + (f.price || 0), 0);
  return {
    subtotal,
    designFee: +(subtotal * 0.1).toFixed(2),
    total: +(subtotal * 1.1).toFixed(2),
    currency: 'USD',
  };
};
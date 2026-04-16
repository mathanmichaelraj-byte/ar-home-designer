import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';

/* ─────────────────────────────────────────────────────────────────────
   FloorPlan — smooth-dragging 2D canvas for ALL floors overview
   Fix: drag/resize use refs + requestAnimationFrame so React never
   re-renders during pointer move. onUpdateRoom fires only on mouseup.
───────────────────────────────────────────────────────────────────── */

const GRID   = 40;    // px per metre
const MIN_DIM = 2;    // minimum room size in metres

const PAL = {
  living:   { bg:'#1e3a5f', border:'#4f6ef7', label:'#93bbff' },
  bedroom:  { bg:'#2d1b3d', border:'#9b59b6', label:'#d4a0f0' },
  office:   { bg:'#1a3a2a', border:'#27ae60', label:'#82d9a0' },
  dining:   { bg:'#3d2a1a', border:'#e67e22', label:'#f4b97a' },
  kitchen:  { bg:'#3d1a1a', border:'#e74c3c', label:'#f4928a' },
  bathroom: { bg:'#1a2d3d', border:'#1abc9c', label:'#7de8d4' },
  other:    { bg:'#252a3d', border:'#7f8c8d', label:'#b0b8c1' },
};
const EMOJIS = { living:'🛋️', bedroom:'🛏️', office:'💼', dining:'🍽️', kitchen:'🍳', bathroom:'🚿', other:'🏠' };
const BADGE_COLORS = ['','#4f6ef7','#27ae60','#e67e22','#9b59b6','#e74c3c'];

const snap = v => Math.round(v / GRID) * GRID;
const roomPos = (r, i) => r.position2D || { x: 40 + i * 22, y: 40 + i * 22 };
const roomDim = (r)     => r.dimensions  || { width: 5, length: 5 };

export default function FloorPlan({ house, onSelectRoom, onUpdateRoom, selectedRoomIdx }) {
  const canvasRef    = useRef(null);
  const containerRef = useRef(null);
  const rafRef       = useRef(null);

  /* Live state refs — never trigger re-renders during drag */
  const hoveredRef     = useRef(null);
  const dragRef        = useRef(null);   // { ri, offX, offY, liveX, liveY }
  const resizeRef      = useRef(null);   // { ri, startX, startY, startW, startH, liveW, liveH }

  const [size,        setSize]        = useState({ width: 800, height: 600 });
  const [floorFilter, setFloorFilter] = useState(0);

  /* Stable references to avoid stale closures in RAF */
  const roomsRef       = useRef([]);
  const selectedRef    = useRef(null);
  const floorFilterRef = useRef(0);

  const rooms = useMemo(() => house?.rooms || [], [house?.rooms]);

  const floors = useMemo(() => {
    const s = new Set(rooms.map(r => r.floor || 1));
    return Array.from(s).sort((a, b) => a - b);
  }, [rooms]);

  const visible = useMemo(() =>
    floorFilter === 0 ? rooms : rooms.filter(r => (r.floor || 1) === floorFilter),
  [rooms, floorFilter]);

  // Keep refs in sync
  useEffect(() => { roomsRef.current = rooms; },       [rooms]);
  useEffect(() => { selectedRef.current = selectedRoomIdx; }, [selectedRoomIdx]);
  useEffect(() => { floorFilterRef.current = floorFilter; }, [floorFilter]);

  /* ── Canvas size ─────────────────────────────────────── */
  useEffect(() => {
    const update = () => {
      if (containerRef.current) setSize({
        width:  containerRef.current.offsetWidth,
        height: containerRef.current.offsetHeight,
      });
    };
    update();
    const ro = new ResizeObserver(update);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  /* ── Draw ────────────────────────────────────────────── */
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx    = canvas.getContext('2d');
    const { width: W, height: H } = size;
    const allRooms  = roomsRef.current;
    const selIdx    = selectedRef.current;
    const ff        = floorFilterRef.current;
    const vis       = ff === 0 ? allRooms : allRooms.filter(r => (r.floor || 1) === ff);

    ctx.clearRect(0, 0, W, H);

    /* Background */
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, W, H);

    /* Grid */
    ctx.strokeStyle = '#161616';
    ctx.lineWidth   = 1;
    for (let x = 0; x < W; x += GRID) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += GRID) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    /* Rooms */
    vis.forEach(room => {
      const ri   = allRooms.indexOf(room);
      const isSel = selIdx === ri;
      const isHov = hoveredRef.current === ri;
      const fl    = room.floor || 1;
      const pal   = PAL[room.type] || PAL.other;

      /* Live position/size during drag or resize */
      let pos = roomPos(room, ri);
      let dim = roomDim(room);
      if (dragRef.current?.ri === ri) {
        pos = { x: dragRef.current.liveX, y: dragRef.current.liveY };
      }
      if (resizeRef.current?.ri === ri) {
        dim = { ...dim, width: resizeRef.current.liveW, length: resizeRef.current.liveH };
      }

      const rx = pos.x, ry = pos.y;
      const rw = dim.width  * GRID;
      const rh = dim.length * GRID;

      /* Shadow on selection */
      ctx.shadowColor = isSel ? pal.border : 'transparent';
      ctx.shadowBlur  = isSel ? 14 : 0;

      /* Fill */
      ctx.fillStyle = pal.bg;
      if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(rx, ry, rw, rh, 4); ctx.fill(); }
      else { ctx.fillRect(rx, ry, rw, rh); }

      ctx.shadowBlur  = 0;

      /* Border */
      ctx.strokeStyle = isSel ? '#ffffff' : isHov ? pal.label : pal.border;
      ctx.lineWidth   = isSel ? 2.5 : isHov ? 2 : 1.5;
      if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(rx, ry, rw, rh, 4); ctx.stroke(); }
      else { ctx.strokeRect(rx, ry, rw, rh); }

      /* Labels */
      const emoji = EMOJIS[room.type] || '🏠';
      const label = room.name || 'Room';
      const dimL  = `${dim.width}×${dim.length}m`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      if (rw > 60 && rh > 50) {
        ctx.font = `${Math.min(18, rh / 4)}px serif`;
        ctx.fillStyle = pal.label;
        ctx.fillText(emoji, rx + rw / 2, ry + rh / 2 - 18);
        ctx.font = `bold ${Math.min(13, rw / 6)}px sans-serif`;
        ctx.fillStyle = pal.label;
        ctx.fillText(label, rx + rw / 2, ry + rh / 2 + 4);
        ctx.font = `${Math.min(10, rw / 8)}px sans-serif`;
        ctx.fillStyle = '#55606e';
        ctx.fillText(dimL, rx + rw / 2, ry + rh / 2 + 20);
      } else {
        ctx.font = `${Math.min(14, rw / 2)}px serif`;
        ctx.fillStyle = pal.label;
        ctx.fillText(emoji, rx + rw / 2, ry + rh / 2);
      }

      /* Floor badge */
      const bc = BADGE_COLORS[fl] || '#4f6ef7';
      ctx.fillStyle = bc + 'cc';
      if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(rx + 4, ry + 4, 22, 16, 4); ctx.fill(); }
      else { ctx.fillRect(rx + 4, ry + 4, 22, 16); }
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(`F${fl}`, rx + 15, ry + 12);

      /* Resize handle */
      if (isSel) {
        ctx.fillStyle = '#4f6ef7';
        ctx.fillRect(rx + rw - 9, ry + rh - 9, 9, 9);
        ctx.fillStyle = '#fff';
        ctx.font = '8px sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('⤡', rx + rw - 4.5, ry + rh - 4.5);
      }
    });

    /* Compass */
    ctx.fillStyle = '#2e3640';
    ctx.font = '11px monospace';
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillText('N ↑', 12, 12);
  }, [size]);

  /* Schedule redraw via RAF — never blocks the main thread */
  const schedDraw = useCallback(() => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      draw();
    });
  }, [draw]);

  /* Redraw whenever data changes */
  useEffect(() => { schedDraw(); }, [visible, selectedRoomIdx, size, schedDraw]);

  /* ── Hit test ────────────────────────────────────────── */
  const roomAt = useCallback((x, y) => {
    const all = roomsRef.current;
    for (let i = all.length - 1; i >= 0; i--) {
      const r   = all[i];
      const pos = roomPos(r, i);
      const dim = roomDim(r);
      if (x >= pos.x && x <= pos.x + dim.width * GRID &&
          y >= pos.y && y <= pos.y + dim.length * GRID) return i;
    }
    return -1;
  }, []);

  const isOnHandle = useCallback((x, y, ri) => {
    const r   = roomsRef.current[ri];
    if (!r) return false;
    const pos = roomPos(r, ri);
    const dim = roomDim(r);
    return x >= pos.x + dim.width  * GRID - 12 && x <= pos.x + dim.width  * GRID &&
           y >= pos.y + dim.length * GRID - 12 && y <= pos.y + dim.length * GRID;
  }, []);

  /* ── Pointer events ──────────────────────────────────── */
  const getXY = e => {
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handleDown = useCallback(e => {
    e.preventDefault();
    const { x, y } = getXY(e);
    const ri = roomAt(x, y);
    if (ri === -1) { onSelectRoom(null); return; }
    onSelectRoom(ri);
    const room = roomsRef.current[ri];
    const pos  = roomPos(room, ri);
    const dim  = roomDim(room);
    if (isOnHandle(x, y, ri)) {
      resizeRef.current = { ri, startX: x, startY: y, startW: dim.width, startH: dim.length, liveW: dim.width, liveH: dim.length };
    } else {
      dragRef.current = { ri, offX: x - pos.x, offY: y - pos.y, liveX: pos.x, liveY: pos.y };
    }
  }, [roomAt, isOnHandle, onSelectRoom]);

  const handleMove = useCallback(e => {
    const { x, y } = getXY(e);

    if (dragRef.current) {
      const nx = snap(x - dragRef.current.offX);
      const ny = snap(y - dragRef.current.offY);
      dragRef.current.liveX = Math.max(0, nx);
      dragRef.current.liveY = Math.max(0, ny);
      canvasRef.current.style.cursor = 'grabbing';
      schedDraw();
      return;
    }

    if (resizeRef.current) {
      const dx = x - resizeRef.current.startX;
      const dy = y - resizeRef.current.startY;
      resizeRef.current.liveW = Math.max(MIN_DIM, Math.round((resizeRef.current.startW + dx / GRID) * 2) / 2);
      resizeRef.current.liveH = Math.max(MIN_DIM, Math.round((resizeRef.current.startH + dy / GRID) * 2) / 2);
      canvasRef.current.style.cursor = 'se-resize';
      schedDraw();
      return;
    }

    /* Hover highlight */
    const ri = roomAt(x, y);
    const prev = hoveredRef.current;
    hoveredRef.current = ri === -1 ? null : ri;
    if (prev !== hoveredRef.current) schedDraw();
    canvasRef.current.style.cursor =
      ri !== -1 && isOnHandle(x, y, ri) ? 'se-resize' : ri !== -1 ? 'grab' : 'default';
  }, [roomAt, isOnHandle, schedDraw]);

  /* Commit on mouseup — single API call per drag */
  const commitDrag = useCallback(() => {
    if (dragRef.current) {
      const { ri, liveX, liveY } = dragRef.current;
      const room = roomsRef.current[ri];
      if (room) onUpdateRoom(room._id, { position2D: { x: liveX, y: liveY } });
      dragRef.current = null;
    }
    if (resizeRef.current) {
      const { ri, liveW, liveH } = resizeRef.current;
      const room = roomsRef.current[ri];
      if (room) onUpdateRoom(room._id, { dimensions: { ...roomDim(room), width: liveW, length: liveH } });
      resizeRef.current = null;
    }
    if (canvasRef.current) canvasRef.current.style.cursor = 'default';
    schedDraw();
  }, [onUpdateRoom, schedDraw]);

  /* Attach global mouseup so releasing outside canvas still commits */
  useEffect(() => {
    window.addEventListener('mouseup', commitDrag);
    return () => window.removeEventListener('mouseup', commitDrag);
  }, [commitDrag]);

  const handleDbl = useCallback(e => {
    const { x, y } = getXY(e);
    const ri = roomAt(x, y);
    if (ri !== -1) onSelectRoom(ri, true);
  }, [roomAt, onSelectRoom]);

  return (
    <div ref={containerRef} className="w-full h-full relative select-none">
      {/* Floor filter */}
      {floors.length > 1 && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10
                        flex items-center gap-1 bg-black/75 backdrop-blur-sm
                        border border-gray-800 rounded-xl px-2 py-1.5 pointer-events-auto">
          <button onClick={() => setFloorFilter(0)}
            className={`px-3 py-1 rounded-lg text-xs font-mono transition-all
              ${floorFilter === 0 ? 'bg-white text-black' : 'text-gray-500 hover:text-white'}`}>
            All
          </button>
          {floors.map(f => (
            <button key={f} onClick={() => setFloorFilter(f)}
              className={`px-3 py-1 rounded-lg text-xs font-mono transition-all
                ${floorFilter === f ? 'bg-white text-black' : 'text-gray-500 hover:text-white'}`}>
              F{f}
            </button>
          ))}
        </div>
      )}

      <canvas
        ref={canvasRef}
        width={size.width}
        height={size.height}
        style={{ display: 'block', width: '100%', height: '100%' }}
        onMouseDown={handleDown}
        onMouseMove={handleMove}
        onDoubleClick={handleDbl}
      />

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-black/65 backdrop-blur rounded-xl
                      p-3 text-xs text-gray-500 space-y-1 pointer-events-none">
        <p className="text-white font-semibold mb-2 text-xs">2D Overview</p>
        <p>Click — select room</p>
        <p>Drag — move room</p>
        <p>⤡ corner — resize</p>
        <p>Double-click — edit in 3D</p>
      </div>
    </div>
  );
}

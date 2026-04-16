import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';

/* ─────────────────────────────────────────────────────────────────────
   FloorDesign2D — dedicated per-floor design canvas
   • Shows only rooms on the selected floor
   • Smooth drag via refs + RAF (no React re-render during move)
   • Wall snap lines between adjacent rooms
   • Toolbar: Add Room shortcut, floor-level info
   • onUpdateRoom fires ONCE on mouseup (not on every move)
───────────────────────────────────────────────────────────────────── */

const GRID    = 40;
const MIN_DIM = 2;
const PADDING = 60;   // canvas margin in px

const PAL = {
  living:   { bg:'#243c6a', border:'#5578e0', label:'#aac4ff', text:'#c8daff' },
  bedroom:  { bg:'#35205a', border:'#a060d8', label:'#d8aaff', text:'#e8d0ff' },
  office:   { bg:'#1f422c', border:'#32b860', label:'#90dba8', text:'#b8f0c8' },
  dining:   { bg:'#4a3018', border:'#d87020', label:'#f8b870', text:'#ffd090' },
  kitchen:  { bg:'#441a1a', border:'#d84040', label:'#f89090', text:'#ffb0b0' },
  bathroom: { bg:'#183040', border:'#20a8a0', label:'#80e0d8', text:'#a8f0e8' },
  other:    { bg:'#282d38', border:'#6878a0', label:'#a8b8d8', text:'#c0d0e8' },
};
const EMOJIS = { living:'🛋️', bedroom:'🛏️', office:'💼', dining:'🍽️', kitchen:'🍳', bathroom:'🚿', other:'🏠' };

const snap     = v   => Math.round(v / GRID) * GRID;
const roomPos  = (r, i) => r.position2D   || { x: 40 + i * 22, y: 40 + i * 22 };
const roomDim  = r   => r.dimensions       || { width: 5, length: 5 };
const floorLabel = n => n===1?'Ground Floor':n===2?'1st Floor':n===3?'2nd Floor':`${n-1}th Floor`;

export default function FloorDesign2D({
  house, floor, selectedRoomIdx,
  onSelectRoom, onUpdateRoom, onAddRoom,
}) {
  const canvasRef    = useRef(null);
  const containerRef = useRef(null);
  const rafRef       = useRef(null);
  const hoveredRef   = useRef(null);
  const dragRef      = useRef(null);
  const resizeRef    = useRef(null);
  const roomsRef     = useRef([]);
  const selectedRef  = useRef(null);

  const [size, setSize] = useState({ width: 800, height: 600 });
  const [showGrid, setShowGrid] = useState(true);

  const rooms = useMemo(() => house?.rooms || [], [house?.rooms]);
  const floorRooms = useMemo(() =>
    rooms.filter(r => (r.floor || 1) === floor), [rooms, floor]);

  useEffect(() => { roomsRef.current = rooms; },           [rooms]);
  useEffect(() => { selectedRef.current = selectedRoomIdx; }, [selectedRoomIdx]);

  /* ── Resize observer ───────────────────────────────── */
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

  /* ── Draw ──────────────────────────────────────────── */
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx    = canvas.getContext('2d');
    const { width: W, height: H } = size;
    const allRooms = roomsRef.current;
    const selIdx   = selectedRef.current;
    const fr       = allRooms.filter(r => (r.floor || 1) === floor);

    ctx.clearRect(0, 0, W, H);

    /* Background */
    ctx.fillStyle = '#080808';
    ctx.fillRect(0, 0, W, H);

    /* Grid */
    if (showGrid) {
      ctx.strokeStyle = '#141414';
      ctx.lineWidth   = 1;
      for (let x = PADDING; x < W - PADDING; x += GRID) {
        ctx.beginPath(); ctx.moveTo(x, PADDING); ctx.lineTo(x, H - PADDING); ctx.stroke();
      }
      for (let y = PADDING; y < H - PADDING; y += GRID) {
        ctx.beginPath(); ctx.moveTo(PADDING, y); ctx.lineTo(W - PADDING, y); ctx.stroke();
      }
      /* Grid border */
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 1;
      ctx.strokeRect(PADDING, PADDING, W - PADDING * 2, H - PADDING * 2);
    }

    /* Floor label */
    ctx.fillStyle = '#222';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillText(floorLabel(floor).toUpperCase(), PADDING, PADDING - 22);

    /* Snap lines between rooms (visual connectors) */
    fr.forEach((roomA, ai) => {
      const riA  = allRooms.indexOf(roomA);
      const posA = dragRef.current?.ri === riA
        ? { x: dragRef.current.liveX, y: dragRef.current.liveY }
        : roomPos(roomA, riA);
      const dimA = roomDim(roomA);
      const axC  = posA.x + (dimA.width  * GRID) / 2;
      const ayC  = posA.y + (dimA.length * GRID) / 2;

      fr.forEach((roomB, bi) => {
        if (bi <= ai) return;
        const riB  = allRooms.indexOf(roomB);
        const posB = dragRef.current?.ri === riB
          ? { x: dragRef.current.liveX, y: dragRef.current.liveY }
          : roomPos(roomB, riB);
        const dimB = roomDim(roomB);
        const bxC  = posB.x + (dimB.width  * GRID) / 2;
        const byC  = posB.y + (dimB.length * GRID) / 2;
        const dist = Math.hypot(bxC - axC, byC - ayC);
        if (dist < GRID * 6) {
          ctx.save();
          ctx.strokeStyle = `rgba(255,255,255,${Math.max(0, 0.06 - dist / (GRID * 6 * 20))})`;
          ctx.setLineDash([4, 8]);
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(axC, ayC); ctx.lineTo(bxC, byC); ctx.stroke();
          ctx.restore();
        }
      });
    });

    /* Rooms */
    fr.forEach(room => {
      const ri   = allRooms.indexOf(room);
      const isSel = selIdx === ri;
      const isHov = hoveredRef.current === ri;
      const pal   = PAL[room.type] || PAL.other;

      let pos = roomPos(room, ri);
      let dim = roomDim(room);
      if (dragRef.current?.ri === ri)   pos = { x: dragRef.current.liveX,   y: dragRef.current.liveY };
      if (resizeRef.current?.ri === ri) dim = { ...dim, width: resizeRef.current.liveW, length: resizeRef.current.liveH };

      const rx = pos.x, ry = pos.y;
      const rw = dim.width  * GRID;
      const rh = dim.length * GRID;

      /* Glow */
      if (isSel) {
        ctx.shadowColor = pal.border;
        ctx.shadowBlur  = 20;
      }

      /* Fill */
      ctx.fillStyle = pal.bg;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(rx, ry, rw, rh, 6);
      else ctx.rect(rx, ry, rw, rh);
      ctx.fill();
      ctx.shadowBlur = 0;

      /* Border */
      ctx.strokeStyle = isSel ? '#ffffff' : isHov ? pal.label : pal.border;
      ctx.lineWidth   = isSel ? 2.5 : isHov ? 2 : 1.5;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(rx, ry, rw, rh, 6);
      else ctx.rect(rx, ry, rw, rh);
      ctx.stroke();

      /* Wall thickness indicator (thin inner rect) */
      const wallW = 4;
      ctx.strokeStyle = pal.border + '55';
      ctx.lineWidth   = 1;
      ctx.strokeRect(rx + wallW, ry + wallW, rw - wallW * 2, rh - wallW * 2);

      /* Door indicator (arc on bottom edge centre) */
      if (rw > 60 && rh > 50) {
        ctx.beginPath();
        ctx.arc(rx + rw / 2, ry + rh, GRID * 0.35, Math.PI, 0, true);
        ctx.strokeStyle = pal.label + '88';
        ctx.lineWidth   = 1.5;
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(rx + rw / 2, ry + rh);
        ctx.lineTo(rx + rw / 2 + GRID * 0.35, ry + rh);
        ctx.stroke();
      }

      /* Emoji + name */
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      if (rw > 60 && rh > 50) {
        ctx.font = `${Math.min(22, rh / 3.5)}px serif`;
        ctx.fillStyle = pal.label;
        ctx.fillText(EMOJIS[room.type] || '🏠', rx + rw / 2, ry + rh / 2 - 16);
        ctx.font = `600 ${Math.min(13, rw / 5.5)}px sans-serif`;
        ctx.fillStyle = pal.text;
        ctx.fillText(room.name || 'Room', rx + rw / 2, ry + rh / 2 + 4);
        ctx.font = `${Math.min(10, rw / 8)}px monospace`;
        ctx.fillStyle = '#4a5568';
        ctx.fillText(`${dim.width}×${dim.length}m`, rx + rw / 2, ry + rh / 2 + 20);
      } else {
        ctx.font = `${Math.min(16, rw / 2.5)}px serif`;
        ctx.fillStyle = pal.label;
        ctx.fillText(EMOJIS[room.type] || '🏠', rx + rw / 2, ry + rh / 2);
      }

      /* Resize handle */
      if (isSel) {
        ctx.fillStyle = '#fff';
        ctx.fillRect(rx + rw - 10, ry + rh - 10, 10, 10);
        ctx.fillStyle = '#4f6ef7';
        ctx.font = '8px sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('⤡', rx + rw - 5, ry + rh - 5);
      }
    });

    /* Empty state */
    if (fr.length === 0) {
      ctx.fillStyle = '#222';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(`No rooms on ${floorLabel(floor)}`, W / 2, H / 2 - 14);
      ctx.font = '12px sans-serif';
      ctx.fillStyle = '#333';
      ctx.fillText('Click "+ Add Room" to add one', W / 2, H / 2 + 14);
    }

    /* Compass */
    ctx.fillStyle = '#2e3640';
    ctx.font = '11px monospace';
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillText('N ↑', PADDING + 8, PADDING + 8);
  }, [size, floor, showGrid]);

  const schedDraw = useCallback(() => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => { rafRef.current = null; draw(); });
  }, [draw]);

  useEffect(() => { schedDraw(); }, [floorRooms, selectedRoomIdx, size, showGrid, schedDraw]);

  /* ── Hit test ───────────────────────────────────────── */
  const roomAt = useCallback((x, y) => {
    const fr = roomsRef.current.filter(r => (r.floor || 1) === floor);
    for (let i = fr.length - 1; i >= 0; i--) {
      const room = fr[i];
      const ri   = roomsRef.current.indexOf(room);
      const pos  = roomPos(room, ri);
      const dim  = roomDim(room);
      if (x >= pos.x && x <= pos.x + dim.width * GRID &&
          y >= pos.y && y <= pos.y + dim.length * GRID) return ri;
    }
    return -1;
  }, [floor]);

  const isOnHandle = useCallback((x, y, ri) => {
    const r   = roomsRef.current[ri];
    if (!r) return false;
    const pos = roomPos(r, ri);
    const dim = roomDim(r);
    return x >= pos.x + dim.width  * GRID - 12 && x <= pos.x + dim.width  * GRID &&
           y >= pos.y + dim.length * GRID - 12 && y <= pos.y + dim.length * GRID;
  }, []);

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
      dragRef.current.liveX = Math.max(PADDING, nx);
      dragRef.current.liveY = Math.max(PADDING, ny);
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
    const ri = roomAt(x, y);
    const prev = hoveredRef.current;
    hoveredRef.current = ri === -1 ? null : ri;
    if (prev !== hoveredRef.current) schedDraw();
    canvasRef.current.style.cursor =
      ri !== -1 && isOnHandle(x, y, ri) ? 'se-resize' : ri !== -1 ? 'grab' : 'default';
  }, [roomAt, isOnHandle, schedDraw]);

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
      {/* Toolbar */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10
                      flex items-center gap-2 bg-black/80 backdrop-blur-sm
                      border border-gray-800 rounded-xl px-3 py-2">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-blue-500"/>
          <span className="text-xs font-mono text-gray-400">{floorLabel(floor)}</span>
        </div>
        <div className="w-px h-4 bg-gray-700"/>
        <span className="text-xs text-gray-600">
          {floorRooms.length} room{floorRooms.length !== 1 ? 's' : ''}
        </span>
        <div className="w-px h-4 bg-gray-700"/>
        <button
          onClick={() => { setShowGrid(g => !g); }}
          className={`text-xs px-2 py-0.5 rounded-lg transition-colors
            ${showGrid ? 'text-white bg-white/10' : 'text-gray-600 hover:text-white'}`}
        >
          Grid
        </button>
        {onAddRoom && (
          <>
            <div className="w-px h-4 bg-gray-700"/>
            <button onClick={onAddRoom}
              className="text-xs text-white bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-lg transition-colors">
              + Room
            </button>
          </>
        )}
      </div>

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
        <p className="text-white font-semibold mb-2">Floor Design</p>
        <p>Click — select room</p>
        <p>Drag — move room</p>
        <p>⤡ corner — resize</p>
        <p>Double-click — open 3D view</p>
      </div>

      {/* Total area */}
      {floorRooms.length > 0 && (
        <div className="absolute bottom-4 right-4 bg-black/65 backdrop-blur rounded-xl
                        px-4 py-3 pointer-events-none">
          <p className="text-[10px] text-gray-600 font-mono mb-1">FLOOR AREA</p>
          <p className="text-white text-sm font-semibold">
            {floorRooms.reduce((s, r) => s + (r.dimensions?.width || 0) * (r.dimensions?.length || 0), 0).toFixed(0)} m²
          </p>
        </div>
      )}
    </div>
  );
}

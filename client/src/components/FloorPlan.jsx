import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';

const GRID  = 40;
const MIN_S = 2;

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
const snap = v => Math.round(v / GRID) * GRID;

// floor badge colours
const FLOOR_BADGE = ['','#4f6ef7','#27ae60','#e67e22','#e74c3c','#9b59b6'];

export default function FloorPlan({ house, onSelectRoom, onUpdateRoom, selectedRoomIdx }) {
  const canvasRef   = useRef(null);
  const containerRef= useRef(null);
  const [dragging,  setDragging]  = useState(null);
  const [resizing,  setResizing]  = useState(null);
  const [hovered,   setHovered]   = useState(null);
  const [size,      setSize]      = useState({ width:800, height:600 });
  const [floorFilter, setFloorFilter] = useState(0); // 0 = all

  const rooms = useMemo(() => house?.rooms||[], [house?.rooms]);

  // unique floors
  const floors = useMemo(() => {
    const s = new Set(rooms.map(r => r.floor||1));
    return Array.from(s).sort((a,b)=>a-b);
  }, [rooms]);

  const visible = useMemo(() =>
    floorFilter===0 ? rooms : rooms.filter(r=>(r.floor||1)===floorFilter),
  [rooms, floorFilter]);

  // resize observer
  useEffect(() => {
    const update = () => {
      if (containerRef.current)
        setSize({ width:containerRef.current.offsetWidth, height:containerRef.current.offsetHeight });
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // draw
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { width:W, height:H } = size;
    ctx.clearRect(0,0,W,H);

    // background
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0,0,W,H);

    // grid
    ctx.strokeStyle = '#161616';
    ctx.lineWidth = 1;
    for (let x=0; x<W; x+=GRID) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
    for (let y=0; y<H; y+=GRID) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

    // rooms
    visible.forEach((room, vi) => {
      const ri  = rooms.indexOf(room);
      const pos = room.position2D||{ x:40+ri*22, y:40+ri*22 };
      const dim = room.dimensions||{ width:5, length:5 };
      const rx=pos.x, ry=pos.y;
      const rw=dim.width*GRID, rh=dim.length*GRID;
      const pal     = PAL[room.type]||PAL.other;
      const isSel   = selectedRoomIdx===ri;
      const isHov   = hovered===ri;
      const fl      = room.floor||1;

      // drop shadow
      ctx.shadowColor   = isSel ? pal.border : 'transparent';
      ctx.shadowBlur    = isSel ? 16 : 0;

      // fill
      ctx.fillStyle = pal.bg;
      ctx.beginPath();
      ctx.roundRect?.(rx,ry,rw,rh,4) || ctx.rect(rx,ry,rw,rh);
      ctx.fill();

      // border
      ctx.shadowBlur = 0;
      ctx.strokeStyle = isSel ? '#ffffff' : isHov ? pal.label : pal.border;
      ctx.lineWidth   = isSel ? 2.5 : isHov ? 2 : 1.5;
      ctx.beginPath();
      ctx.roundRect?.(rx,ry,rw,rh,4) || ctx.rect(rx,ry,rw,rh);
      ctx.stroke();

      // labels
      const emoji = EMOJIS[room.type]||'🏠';
      const label = room.name||'Room';
      const dimL  = `${dim.width}×${dim.length}m`;

      if (rw>60 && rh>50) {
        ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.font=`${Math.min(18,rh/4)}px serif`;
        ctx.fillStyle=pal.label;
        ctx.fillText(emoji, rx+rw/2, ry+rh/2-18);
        ctx.font=`bold ${Math.min(13,rw/6)}px DM Sans,sans-serif`;
        ctx.fillText(label, rx+rw/2, ry+rh/2+4);
        ctx.font=`${Math.min(10,rw/8)}px DM Sans,sans-serif`;
        ctx.fillStyle='#55606e';
        ctx.fillText(dimL, rx+rw/2, ry+rh/2+20);
      } else {
        ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.font=`${Math.min(14,rw/2)}px serif`;
        ctx.fillStyle=pal.label;
        ctx.fillText(emoji, rx+rw/2, ry+rh/2);
      }

      // floor badge (top-left)
      const bc = FLOOR_BADGE[fl]||'#4f6ef7';
      ctx.fillStyle = bc + 'cc';
      ctx.beginPath();
      ctx.roundRect?.(rx+4,ry+4,22,16,4) || ctx.rect(rx+4,ry+4,22,16);
      ctx.fill();
      ctx.fillStyle='#fff';
      ctx.font='bold 9px monospace';
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(`F${fl}`, rx+15, ry+12);

      // resize handle
      if (isSel) {
        ctx.fillStyle='#4f6ef7';
        ctx.fillRect(rx+rw-9,ry+rh-9,9,9);
        ctx.fillStyle='#fff';
        ctx.font='8px sans-serif';
        ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText('⤡', rx+rw-4.5, ry+rh-4.5);
      }
    });

    // compass
    ctx.fillStyle='#2e3640';
    ctx.font='11px monospace';
    ctx.textAlign='left'; ctx.textBaseline='top';
    ctx.fillText('N ↑', 12, 12);

  }, [visible, rooms, selectedRoomIdx, hovered, size]);

  // hit-test (against all rooms, not just visible)
  const roomAt = useCallback((x,y) => {
    for (let i=rooms.length-1; i>=0; i--) {
      const r = rooms[i];
      const pos = r.position2D||{ x:40+i*22, y:40+i*22 };
      const dim = r.dimensions||{ width:5, length:5 };
      if (x>=pos.x && x<=pos.x+dim.width*GRID && y>=pos.y && y<=pos.y+dim.length*GRID) return i;
    }
    return -1;
  }, [rooms]);

  const onResize = useCallback((x,y,ri) => {
    const r = rooms[ri];
    if (!r) return false;
    const pos = r.position2D||{ x:40+ri*22, y:40+ri*22 };
    const dim = r.dimensions||{ width:5, length:5 };
    return x>=pos.x+dim.width*GRID-12 && x<=pos.x+dim.width*GRID
        && y>=pos.y+dim.length*GRID-12 && y<=pos.y+dim.length*GRID;
  }, [rooms]);

  const mousePos = e => {
    const r = canvasRef.current.getBoundingClientRect();
    return { x: e.clientX-r.left, y: e.clientY-r.top };
  };

  const handleDown = useCallback(e => {
    const { x,y } = mousePos(e);
    const ri = roomAt(x,y);
    if (ri===-1) { onSelectRoom(null); return; }
    onSelectRoom(ri);
    const room = rooms[ri];
    const pos  = room.position2D||{ x:40+ri*22, y:40+ri*22 };
    const dim  = room.dimensions||{ width:5, length:5 };
    if (onResize(x,y,ri)) {
      setResizing({ ri, startX:x, startY:y, startW:dim.width, startH:dim.length });
    } else {
      setDragging({ ri, offX:x-pos.x, offY:y-pos.y });
    }
  }, [roomAt, onResize, rooms, onSelectRoom]);

  const handleMove = useCallback(e => {
    const { x,y } = mousePos(e);
    const ri = roomAt(x,y);
    setHovered(ri===-1?null:ri);
    canvasRef.current.style.cursor =
      ri!==-1 && onResize(x,y,ri) ? 'se-resize' : ri!==-1 ? 'grab' : 'default';

    if (dragging) {
      canvasRef.current.style.cursor='grabbing';
      const nx=snap(x-dragging.offX), ny=snap(y-dragging.offY);
      const room=rooms[dragging.ri];
      onUpdateRoom(room._id,{ position2D:{ x:Math.max(0,nx), y:Math.max(0,ny) } });
    }
    if (resizing) {
      canvasRef.current.style.cursor='se-resize';
      const dx=x-resizing.startX, dy=y-resizing.startY;
      const nW=Math.max(MIN_S, Math.round((resizing.startW+dx/GRID)*2)/2);
      const nH=Math.max(MIN_S, Math.round((resizing.startH+dy/GRID)*2)/2);
      const room=rooms[resizing.ri];
      onUpdateRoom(room._id,{ dimensions:{ ...room.dimensions, width:nW, length:nH } });
    }
  }, [dragging, resizing, roomAt, onResize, rooms, onUpdateRoom]);

  const handleUp   = useCallback(() => { setDragging(null); setResizing(null); }, []);
  const handleDbl  = useCallback(e => {
    const { x,y } = mousePos(e);
    const ri = roomAt(x,y);
    if (ri!==-1) onSelectRoom(ri, true);
  }, [roomAt, onSelectRoom]);

  return (
    <div ref={containerRef} className="w-full h-full relative">
      {/* Floor filter tabs */}
      {floors.length>1 && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10
                        flex items-center gap-1 bg-black/75 backdrop-blur-sm
                        border border-gray-800 rounded-xl px-2 py-1.5">
          <button onClick={()=>setFloorFilter(0)}
            className={`px-3 py-1 rounded-lg text-xs font-mono transition-all
              ${floorFilter===0?'bg-white text-black':'text-gray-500 hover:text-white'}`}>
            All
          </button>
          {floors.map(f=>(
            <button key={f} onClick={()=>setFloorFilter(f)}
              className={`px-3 py-1 rounded-lg text-xs font-mono transition-all
                ${floorFilter===f?'bg-white text-black':'text-gray-500 hover:text-white'}`}>
              F{f}
            </button>
          ))}
        </div>
      )}

      <canvas ref={canvasRef} width={size.width} height={size.height}
        onMouseDown={handleDown} onMouseMove={handleMove}
        onMouseUp={handleUp} onMouseLeave={handleUp}
        onDoubleClick={handleDbl} className="block"/>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-black/65 backdrop-blur rounded-xl
                      p-3 text-xs text-gray-500 space-y-1 pointer-events-none">
        <p className="text-white font-semibold mb-2 text-xs">2D Floor Plan</p>
        <p>Click — select room</p>
        <p>Drag — move room</p>
        <p>⤡ corner — resize</p>
        <p>Double-click — edit in 3D</p>
      </div>
    </div>
  );
}

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useProject } from '../context/ProjectContext';
import { PX_PER_METER, COLORS } from '../utils/constants';

export default function RoomCanvas2D() {
  const canvasRef = useRef(null);
  const { project, updateObject, removeObject } = useProject();
  const [selected, setSelected] = useState(null);
  const [dragging, setDragging] = useState(null);
  const [offset,   setOffset]   = useState({ x: 0, y: 0 });

  const { roomDimensions, objects } = project;
  const W = roomDimensions.width  * PX_PER_METER;
  const H = roomDimensions.length * PX_PER_METER;

  // ── Draw ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width  = (W + 80) * dpr;
    canvas.height = (H + 80) * dpr;
    ctx.scale(dpr, dpr);

    const ox = 40, oy = 40;  // canvas offset

    // Background
    ctx.fillStyle = '#0F0E17';
    ctx.fillRect(0, 0, W + 80, H + 80);

    // Grid
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= W; x += PX_PER_METER) {
      ctx.beginPath(); ctx.moveTo(ox + x, oy); ctx.lineTo(ox + x, oy + H); ctx.stroke();
    }
    for (let y = 0; y <= H; y += PX_PER_METER) {
      ctx.beginPath(); ctx.moveTo(ox, oy + y); ctx.lineTo(ox + W, oy + y); ctx.stroke();
    }

    // Room floor
    ctx.fillStyle = COLORS.floor;
    ctx.fillRect(ox, oy, W, H);

    // Walls
    ctx.strokeStyle = COLORS.wall;
    ctx.lineWidth = 8;
    ctx.strokeRect(ox, oy, W, H);

    // Dimension labels
    ctx.fillStyle = '#8892A4';
    ctx.font = '12px DM Sans, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${roomDimensions.width}m`, ox + W / 2, oy - 14);
    ctx.save(); ctx.translate(ox - 14, oy + H / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(`${roomDimensions.length}m`, 0, 0);
    ctx.restore();

    // Furniture objects
    objects.forEach(obj => {
      const fw = (obj.dimensions?.width  || 1) * PX_PER_METER * obj.scale;
      const fd = (obj.dimensions?.depth  || 1) * PX_PER_METER * obj.scale;
      const px = ox + obj.position.x * PX_PER_METER - fw / 2;
      const py = oy + obj.position.z * PX_PER_METER - fd / 2;

      ctx.save();
      ctx.translate(px + fw / 2, py + fd / 2);
      ctx.rotate((obj.rotation || 0) * Math.PI / 180);

      // Shadow
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 8;

      // Body
      ctx.fillStyle = obj.id === selected ? '#E94560' : '#263447';
      ctx.strokeStyle = obj.id === selected ? '#E94560' : 'rgba(255,255,255,0.2)';
      ctx.lineWidth = obj.id === selected ? 2 : 1;
      roundRect(ctx, -fw / 2, -fd / 2, fw, fd, 4);
      ctx.fill();
      ctx.stroke();

      ctx.shadowBlur = 0;

      // Label
      ctx.fillStyle = obj.id === selected ? '#fff' : '#8892A4';
      ctx.font = `10px DM Sans, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const label = obj.name.length > 10 ? obj.name.slice(0, 10) + '…' : obj.name;
      ctx.fillText(label, 0, 0);

      ctx.restore();
    });
  }, [project, selected, W, H, roomDimensions]);

  // ── Interaction helpers ───────────────────────────────────────────────
  const getHit = useCallback((cx, cy) => {
    const ox = 40, oy = 40;
    return objects.find(obj => {
      const fw = (obj.dimensions?.width || 1) * PX_PER_METER * obj.scale;
      const fd = (obj.dimensions?.depth || 1) * PX_PER_METER * obj.scale;
      const px = ox + obj.position.x * PX_PER_METER - fw / 2;
      const py = oy + obj.position.z * PX_PER_METER - fd / 2;
      return cx >= px && cx <= px + fw && cy >= py && cy <= py + fd;
    });
  }, [objects]);

  const handleMouseDown = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    const hit = getHit(cx, cy);
    setSelected(hit?.id || null);
    if (hit) {
      setDragging(hit.id);
      setOffset({ x: cx - (40 + hit.position.x * PX_PER_METER), y: cy - (40 + hit.position.z * PX_PER_METER) });
    }
  };

  const handleMouseMove = (e) => {
    if (!dragging) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    const newX = Math.max(0, Math.min(roomDimensions.width,  (cx - 40 - offset.x) / PX_PER_METER));
    const newZ = Math.max(0, Math.min(roomDimensions.length, (cy - 40 - offset.y) / PX_PER_METER));
    updateObject(dragging, { position: { x: newX, y: 0, z: newZ } });
  };

  const handleMouseUp = () => setDragging(null);

  const handleKeyDown = useCallback((e) => {
    if (!selected) return;
    if (e.key === 'Delete' || e.key === 'Backspace') {
      removeObject(selected);
      setSelected(null);
    }
    if (e.key === 'r' || e.key === 'R') {
      const obj = objects.find(o => o.id === selected);
      if (obj) updateObject(selected, { rotation: ((obj.rotation || 0) + 15) % 360 });
    }
  }, [selected, objects, removeObject, updateObject]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-primary/50 overflow-auto p-8">
      {/* Toolbar hint */}
      <div className="flex gap-4 mb-4 text-xs text-muted font-mono">
        <span>Click: Select</span>
        <span>Drag: Move</span>
        <span>R: Rotate</span>
        <span>Del: Remove</span>
      </div>
      <canvas
        ref={canvasRef}
        className="rounded-xl cursor-crosshair"
        style={{ maxWidth: '100%', height: 'auto' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
    </div>
  );
}

// Helper: rounded rectangle
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

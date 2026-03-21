import React, { useRef, useState, useCallback, useEffect } from 'react';

const GRID_SIZE = 40; // pixels per meter
const MIN_ROOM_SIZE = 2; // meters

const ROOM_COLORS = {
  living:   { bg: '#1e3a5f', border: '#4f6ef7', label: '#93bbff' },
  bedroom:  { bg: '#2d1b3d', border: '#9b59b6', label: '#d4a0f0' },
  office:   { bg: '#1a3a2a', border: '#27ae60', label: '#82d9a0' },
  dining:   { bg: '#3d2a1a', border: '#e67e22', label: '#f4b97a' },
  kitchen:  { bg: '#3d1a1a', border: '#e74c3c', label: '#f4928a' },
  bathroom: { bg: '#1a2d3d', border: '#1abc9c', label: '#7de8d4' },
  other:    { bg: '#252a3d', border: '#7f8c8d', label: '#b0b8c1' },
};

const ROOM_EMOJIS = {
  living: '🛋️', bedroom: '🛏️', office: '💼',
  dining: '🍽️', kitchen: '🍳', bathroom: '🚿', other: '🏠',
};

const snapToGrid = (val) => Math.round(val / GRID_SIZE) * GRID_SIZE;

const FloorPlan = ({ house, onSelectRoom, onUpdateRoom, selectedRoomIdx }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [dragging, setDragging] = useState(null); // { roomId, offsetX, offsetY }
  const [resizing, setResizing] = useState(null); // { roomId, handle, startX, startY, startW, startH }
  const [hoveredRoom, setHoveredRoom] = useState(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

  const rooms = house?.rooms || [];

  // Resize canvas to container
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setCanvasSize({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Draw floor plan on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { width, height } = canvasSize;

    ctx.clearRect(0, 0, width, height);

    // Background
    ctx.fillStyle = '#0f1117';
    ctx.fillRect(0, 0, width, height);

    // Grid
    ctx.strokeStyle = '#1a1f2e';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += GRID_SIZE) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
    }
    for (let y = 0; y < height; y += GRID_SIZE) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }

    // Rooms
    rooms.forEach((room, i) => {
      const pos = room.position2D || { x: 40 + i * 20, y: 40 + i * 20 };
      const dim = room.dimensions || { width: 5, length: 5 };
      const rx = pos.x;
      const ry = pos.y;
      const rw = dim.width * GRID_SIZE;
      const rh = dim.length * GRID_SIZE;
      const colors = ROOM_COLORS[room.type] || ROOM_COLORS.other;
      const isSelected = selectedRoomIdx === i;
      const isHovered = hoveredRoom === i;

      // Room fill
      ctx.fillStyle = colors.bg;
      ctx.fillRect(rx, ry, rw, rh);

      // Room border
      ctx.strokeStyle = isSelected ? '#ffffff' : isHovered ? colors.label : colors.border;
      ctx.lineWidth = isSelected ? 2.5 : isHovered ? 2 : 1.5;
      ctx.strokeRect(rx, ry, rw, rh);

      // Selection glow
      if (isSelected) {
        ctx.shadowColor = colors.border;
        ctx.shadowBlur = 12;
        ctx.strokeRect(rx, ry, rw, rh);
        ctx.shadowBlur = 0;
      }

      // Room label
      const emoji = ROOM_EMOJIS[room.type] || '🏠';
      const label = room.name || 'Room';
      const dimLabel = `${dim.width}×${dim.length}m`;

      ctx.fillStyle = colors.label;
      ctx.font = `bold ${Math.min(14, rw / 5)}px DM Sans, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      if (rw > 60 && rh > 50) {
        ctx.font = `${Math.min(18, rh / 4)}px serif`;
        ctx.fillText(emoji, rx + rw / 2, ry + rh / 2 - 18);
        ctx.font = `bold ${Math.min(13, rw / 6)}px DM Sans, sans-serif`;
        ctx.fillStyle = colors.label;
        ctx.fillText(label, rx + rw / 2, ry + rh / 2 + 4);
        ctx.font = `${Math.min(10, rw / 8)}px DM Sans, sans-serif`;
        ctx.fillStyle = '#6b7280';
        ctx.fillText(dimLabel, rx + rw / 2, ry + rh / 2 + 20);
      } else {
        ctx.fillText(emoji, rx + rw / 2, ry + rh / 2);
      }

      // Resize handle (bottom-right corner)
      if (isSelected) {
        ctx.fillStyle = '#4f6ef7';
        ctx.fillRect(rx + rw - 8, ry + rh - 8, 8, 8);
        ctx.fillStyle = '#ffffff';
        ctx.font = '8px sans-serif';
        ctx.fillText('⤡', rx + rw - 4, ry + rh - 4);
      }
    });

    // Compass
    ctx.fillStyle = '#374151';
    ctx.font = '11px DM Sans, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('N ↑', 12, 20);

  }, [rooms, selectedRoomIdx, hoveredRoom, canvasSize]);

  // Get room index at mouse position
  const getRoomAtPos = useCallback((x, y) => {
    for (let i = rooms.length - 1; i >= 0; i--) {
      const room = rooms[i];
      const pos = room.position2D || { x: 40 + i * 20, y: 40 + i * 20 };
      const dim = room.dimensions || { width: 5, length: 5 };
      const rw = dim.width * GRID_SIZE;
      const rh = dim.length * GRID_SIZE;
      if (x >= pos.x && x <= pos.x + rw && y >= pos.y && y <= pos.y + rh) {
        return i;
      }
    }
    return -1;
  }, [rooms]);

  // Check if mouse is on resize handle
  const isOnResizeHandle = useCallback((x, y, roomIdx) => {
    const room = rooms[roomIdx];
    if (!room) return false;
    const pos = room.position2D || { x: 40 + roomIdx * 20, y: 40 + roomIdx * 20 };
    const dim = room.dimensions || { width: 5, length: 5 };
    const rw = dim.width * GRID_SIZE;
    const rh = dim.length * GRID_SIZE;
    return x >= pos.x + rw - 12 && x <= pos.x + rw && y >= pos.y + rh - 12 && y <= pos.y + rh;
  }, [rooms]);

  const handleMouseDown = useCallback((e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const idx = getRoomAtPos(x, y);

    if (idx === -1) { onSelectRoom(null); return; }

    onSelectRoom(idx);
    const room = rooms[idx];
    const pos = room.position2D || { x: 40 + idx * 20, y: 40 + idx * 20 };
    const dim = room.dimensions || { width: 5, length: 5 };

    if (isOnResizeHandle(x, y, idx)) {
      setResizing({
        roomIdx: idx,
        startX: x, startY: y,
        startW: dim.width, startH: dim.length,
      });
    } else {
      setDragging({
        roomIdx: idx,
        offsetX: x - pos.x,
        offsetY: y - pos.y,
      });
    }
  }, [getRoomAtPos, isOnResizeHandle, rooms, onSelectRoom]);

  const handleMouseMove = useCallback((e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Update hover
    const idx = getRoomAtPos(x, y);
    setHoveredRoom(idx === -1 ? null : idx);

    // Update cursor
    if (idx !== -1 && isOnResizeHandle(x, y, idx)) {
      canvasRef.current.style.cursor = 'se-resize';
    } else if (idx !== -1) {
      canvasRef.current.style.cursor = 'grab';
    } else {
      canvasRef.current.style.cursor = 'default';
    }

    if (dragging !== null) {
      canvasRef.current.style.cursor = 'grabbing';
      const newX = snapToGrid(x - dragging.offsetX);
      const newY = snapToGrid(y - dragging.offsetY);
      const room = rooms[dragging.roomIdx];
      onUpdateRoom(room._id, {
        position2D: { x: Math.max(0, newX), y: Math.max(0, newY) },
      });
    }

    if (resizing !== null) {
      canvasRef.current.style.cursor = 'se-resize';
      const dx = x - resizing.startX;
      const dy = y - resizing.startY;
      const newW = Math.max(MIN_ROOM_SIZE, Math.round((resizing.startW + dx / GRID_SIZE) * 2) / 2);
      const newH = Math.max(MIN_ROOM_SIZE, Math.round((resizing.startH + dy / GRID_SIZE) * 2) / 2);
      const room = rooms[resizing.roomIdx];
      onUpdateRoom(room._id, {
        dimensions: { ...room.dimensions, width: newW, length: newH },
      });
    }
  }, [dragging, resizing, getRoomAtPos, isOnResizeHandle, rooms, onUpdateRoom]);

  const handleMouseUp = useCallback(() => {
    setDragging(null);
    setResizing(null);
  }, []);

  const handleDoubleClick = useCallback((e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const idx = getRoomAtPos(x, y);
    if (idx !== -1) onSelectRoom(idx, true); // true = open 3D designer
  }, [getRoomAtPos, onSelectRoom]);

  return (
    <div ref={containerRef} className="w-full h-full relative">
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        className="block"
      />
      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur rounded-xl p-3 text-xs text-gray-400 space-y-1">
        <p className="text-white font-medium mb-2">Floor Plan</p>
        <p>Click — select room</p>
        <p>Drag — move room</p>
        <p>⤡ corner — resize</p>
        <p>Double click — edit in 3D</p>
      </div>
    </div>
  );
};

export default FloorPlan;
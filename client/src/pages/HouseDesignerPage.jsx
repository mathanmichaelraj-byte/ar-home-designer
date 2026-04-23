import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useHouse } from '../context/HouseContext';
import SceneViewer from '../three/SceneViewer';
import FloorPlan from '../components/FloorPlan';
import FloorPlan3D from '../components/FloorPlan3D';
import FloorDesign2D from '../components/FloorDesign2D';
import { furnitureAPI } from '../utils/api';

/* ── Constants ─────────────────────────────────────────────────────── */
const ROOM_TYPES = [
  { value:'living',   label:'Living Room' },
  { value:'bedroom',  label:'Bedroom'     },
  { value:'office',   label:'Office'      },
  { value:'dining',   label:'Dining'      },
  { value:'kitchen',  label:'Kitchen'     },
  { value:'bathroom', label:'Bathroom'    },
  { value:'other',    label:'Other'       },
];

const FLOOR_OPTIONS = [
  { v:1, l:'Ground Floor' },
  { v:2, l:'1st Floor'    },
  { v:3, l:'2nd Floor'    },
  { v:4, l:'3rd Floor'    },
];

const FCATS = ['all','sofa','chair','table','bed','shelf','desk','lamp','cabinet','plant'];

const VIEWS = [
  { id:'overview',  label:'Overview',   tip:'All floors overview',
    icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg> },
  { id:'floor',     label:'Floor Plan', tip:'Design per floor',
    icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z"/></svg> },
  { id:'3d-house',  label:'3D House',   tip:'3D multi-floor view',
    icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg> },
  { id:'3d-room',   label:'Edit Room',  tip:'Place furniture in 3D',
    icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg> },
];

const Ic = {
  save:  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>,
  back:  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>,
  plus:  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  trash: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>,
  edit:  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  close: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  ar:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 3H3v2M19 3h2v2M5 21H3v-2M19 21h2v-2"/><rect x="7" y="7" width="10" height="10" rx="1"/></svg>,
};

/* ── Furniture panel ────────────────────────────────────────────────── */
function FurniturePanel({ onAdd }) {
  const [items, setItems] = useState([]);
  const [cat, setCat]     = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const p = {};
    if (cat !== 'all') p.type = cat;
    if (search) p.search = search;
    const t = setTimeout(() => {
      furnitureAPI.list(p)
        .then(({ data }) => setItems(Array.isArray(data.furniture) ? data.furniture : []))
        .catch(console.error)
        .finally(() => setLoading(false));
    }, 280);
    return () => clearTimeout(t);
  }, [cat, search]);

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="p-3 border-b border-gray-800 shrink-0">
        <input className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2
                          text-white text-xs placeholder-gray-700 focus:outline-none
                          focus:border-gray-600 transition-colors"
          placeholder="Search furniture…" value={search}
          onChange={e => setSearch(e.target.value)} />
      </div>
      <div className="flex gap-1.5 px-3 py-2 overflow-x-auto border-b border-gray-800 shrink-0 [&::-webkit-scrollbar]:hidden">
        {FCATS.map(c => (
          <button key={c} onClick={() => setCat(c)}
            className={`px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap shrink-0 transition-all
              ${c === cat ? 'bg-white text-black' : 'bg-gray-900 border border-gray-800 text-gray-500 hover:text-white'}`}>
            {c.charAt(0).toUpperCase() + c.slice(1)}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        {loading ? (
          <div className="grid grid-cols-2 gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-xl bg-gray-900 animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="text-gray-700 text-xs text-center pt-8">No items found</p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {items.map(item => (
              <button key={item._id} onClick={() => onAdd(item)}
                className="group bg-gray-900 border border-gray-800 rounded-xl p-2.5
                           hover:border-gray-600 transition-all text-left active:scale-[0.97]">
                <div className="aspect-square bg-gray-800 rounded-lg mb-2 flex items-center
                                justify-center overflow-hidden border border-gray-800">
                  {item.thumbnailUrl
                    ? <img src={item.thumbnailUrl} alt={item.name} className="w-full h-full object-cover" />
                    : <div className="w-6 h-6 rounded bg-gray-700" />}
                </div>
                <p className="text-white text-[11px] font-medium truncate">{item.name}</p>
                {item.price != null && <p className="text-gray-600 text-[10px] font-mono">${item.price}</p>}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Properties panel ───────────────────────────────────────────────── */
function PropertiesPanel({ objects, selectedIndex, onSelect, onUpdate, onRemove, onDeselect }) {
  const selected = selectedIndex !== null ? objects[selectedIndex] : null;
  const [ls, setLs] = useState({ x: 1, y: 1, z: 1 });

  useEffect(() => {
    if (selectedIndex !== null && objects[selectedIndex])
      setLs(objects[selectedIndex].scale || { x: 1, y: 1, z: 1 });
  }, [selectedIndex, objects]);

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="border-b border-gray-800 shrink-0">
        <p className="text-[10px] text-gray-700 font-mono uppercase px-4 pt-3 pb-2 tracking-wider">
          Objects ({objects.length})
        </p>
        <div className="max-h-36 overflow-y-auto">
          {objects.length === 0
            ? <p className="text-xs text-gray-700 px-4 pb-3">No objects added.</p>
            : objects.map((obj, i) => (
              <div key={i} onClick={() => onSelect(i)}
                className={`flex items-center justify-between px-4 py-2 cursor-pointer
                            transition-colors border-l-2
                            ${selectedIndex === i
                              ? 'bg-white/5 border-l-white/30 text-white'
                              : 'border-l-transparent text-gray-600 hover:text-gray-300 hover:bg-white/[0.02]'}`}>
                <span className="text-xs truncate">{obj.name}</span>
                <button onClick={e => { e.stopPropagation(); onRemove(i); }}
                  className="text-gray-700 hover:text-red-400 transition-colors ml-2 shrink-0">
                  {Ic.close}
                </button>
              </div>
            ))}
        </div>
      </div>

      {selected ? (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-white font-medium text-xs truncate">{selected.name}</span>
            <button onClick={onDeselect} className="text-gray-700 hover:text-white transition-colors">{Ic.close}</button>
          </div>

          {[{ l:'Position', k:'position' }, { l:'Rotation (rad)', k:'rotation' }].map(({ l, k }) => (
            <div key={k}>
              <p className="text-[10px] text-gray-600 font-mono uppercase tracking-wider mb-2">{l}</p>
              <div className="grid grid-cols-3 gap-1.5">
                {['x','y','z'].map(ax => (
                  <div key={ax}>
                    <label className="text-[10px] text-gray-700 font-mono uppercase block mb-1">{ax}</label>
                    <input type="number" step={0.1}
                      className="w-full bg-gray-950 border border-gray-800 rounded-lg px-2 py-1.5
                                 text-white text-[11px] font-mono focus:outline-none focus:border-gray-600"
                      value={selected[k]?.[ax] ?? 0}
                      onChange={e => onUpdate(selectedIndex, { [k]: { ...selected[k], [ax]: parseFloat(e.target.value) || 0 } })} />
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] text-gray-600 font-mono uppercase tracking-wider">Scale</p>
              <span className="text-[10px] font-mono text-gray-600">{(ls.x || 1).toFixed(2)}x</span>
            </div>
            <input type="range" min={0.1} max={5} step={0.05} value={ls.x || 1}
              onChange={e => {
                const v = parseFloat(e.target.value);
                const u = { x:v, y:v, z:v };
                setLs(u);
                onUpdate(selectedIndex, { scale: u });
              }}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-gray-800
                         [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5
                         [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full
                         [&::-webkit-slider-thumb]:bg-white" />
          </div>

          <button onClick={() => onRemove(selectedIndex)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl
                       border border-red-500/20 text-red-500/70 text-xs
                       hover:bg-red-500/10 hover:border-red-500/40 hover:text-red-400 transition-all">
            {Ic.trash} Remove from room
          </button>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center p-6 text-center">
          <p className="text-gray-700 text-xs leading-relaxed">
            Click an object in the 3D view to edit its properties.
          </p>
        </div>
      )}
    </div>
  );
}

/* ── Add Room Modal ─────────────────────────────────────────────────── */
function AddRoomModal({ defaultFloor = 1, onClose, onAdd }) {
  const [form, setForm] = useState({
    name: '', type: 'living', floor: defaultFloor,
    dimensions: { width: 4, length: 4, height: 2.8 },
  });

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-gray-900 border border-gray-700 rounded-2xl shadow-card animate-scale-in">
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <div>
            <h3 className="text-white font-semibold text-sm">Add Room</h3>
            <p className="text-gray-600 text-xs mt-0.5">Configure the new room</p>
          </div>
          <button onClick={onClose}
            className="w-7 h-7 rounded-lg bg-gray-800 flex items-center justify-center text-gray-500 hover:text-white">
            {Ic.close}
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="label">Room name</label>
            <input className="input" placeholder="e.g. Master Bedroom"
              value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>

          <div>
            <label className="label">Room type</label>
            <div className="grid grid-cols-4 gap-1.5">
              {ROOM_TYPES.map(({ value, label }) => (
                <button key={value} onClick={() => setForm({ ...form, type: value })}
                  className={`py-2.5 px-2 rounded-xl border text-xs transition-all text-center
                    ${form.type === value ? 'border-white bg-white/10 text-white' : 'border-gray-800 text-gray-600 hover:border-gray-600 hover:text-gray-300'}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Floor level</label>
            <div className="grid grid-cols-4 gap-1.5">
              {FLOOR_OPTIONS.map(({ v, l }) => (
                <button key={v} onClick={() => setForm({ ...form, floor: v })}
                  className={`py-2 rounded-xl border text-xs font-mono transition-all
                    ${form.floor === v ? 'border-white bg-white/10 text-white' : 'border-gray-800 text-gray-600 hover:border-gray-600'}`}>
                  F{v}
                </button>
              ))}
            </div>
            <p className="text-gray-700 text-[10px] mt-1">
              {FLOOR_OPTIONS.find(f => f.v === form.floor)?.l}
            </p>
          </div>

          <div>
            <label className="label">Dimensions (metres)</label>
            <div className="grid grid-cols-3 gap-2">
              {[['W','width'],['L','length'],['H','height']].map(([l,k]) => (
                <div key={k}>
                  <label className="text-[10px] text-gray-700 font-mono uppercase block mb-1">{l}</label>
                  <input type="number" step="0.5" min="1" max="30"
                    className="w-full bg-gray-950 border border-gray-800 rounded-lg px-2 py-1.5
                               text-white text-xs font-mono focus:outline-none focus:border-gray-600"
                    value={form.dimensions[k]}
                    onChange={e => setForm({ ...form, dimensions: { ...form.dimensions, [k]: parseFloat(e.target.value) || 1 } })} />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-2 p-5 pt-0">
          <button onClick={onClose} className="btn-ghost flex-1 text-sm">Cancel</button>
          <button onClick={() => { if (!form.name.trim()) return; onAdd(form); }}
            disabled={!form.name.trim()} className="btn-primary flex-1 text-sm">
            Add Room
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Room Settings overlay ──────────────────────────────────────────── */
function RoomSettingsOverlay({ room, onSave }) {
  const [open, setOpen] = useState(false);
  const [dim, setDim]   = useState(room?.dimensions || { width:5, length:5, height:2.8 });
  const [wc, setWc]     = useState(room?.wallColor   || '#f0ebe3');

  useEffect(() => {
    if (room) { setDim(room.dimensions || { width:5, length:5, height:2.8 }); setWc(room.wallColor || '#f0ebe3'); }
  }, [room]);

  if (!room) return null;

  return (
    <div className="absolute bottom-16 right-4 z-20">
      <button onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border transition-all
          ${open ? 'bg-white text-black border-white' : 'bg-black/50 backdrop-blur-sm border-gray-700 text-gray-400 hover:text-white hover:border-gray-600'}`}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
        </svg>
        Room
      </button>
      {open && (
        <div className="absolute bottom-10 right-0 w-56 bg-gray-900 border border-gray-700
                        rounded-2xl shadow-card p-4 animate-slide-down space-y-3 z-50">
          <p className="text-white text-xs font-semibold">Room Settings</p>
          {[['Width (m)','width'],['Length (m)','length'],['Height (m)','height']].map(([l,k]) => (
            <div key={k} className="flex items-center justify-between gap-2">
              <label className="text-xs text-gray-500">{l}</label>
              <input type="number" step="0.5" min="1" max="30"
                className="w-20 bg-gray-950 border border-gray-800 rounded-lg px-2 py-1.5
                           text-white text-xs font-mono focus:outline-none focus:border-gray-600"
                value={dim[k] ?? 5}
                onChange={e => setDim(prev => ({ ...prev, [k]: e.target.value }))}
                onBlur={e => { const v={...dim,[k]:parseFloat(e.target.value)||1}; setDim(v); onSave({dimensions:v}); }} />
            </div>
          ))}
          <div>
            <label className="text-xs text-gray-500 block mb-1.5">Wall Color</label>
            <div className="flex items-center gap-2">
              <input type="color" value={wc}
                onChange={e => { setWc(e.target.value); onSave({ wallColor: e.target.value }); }}
                className="w-9 h-9 rounded-lg cursor-pointer border border-gray-700 bg-gray-950 p-0.5" />
              <span className="text-xs font-mono text-gray-600">{wc}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── House Stats ────────────────────────────────────────────────────── */
function HouseStats({ house, selectedRoom, onEnter3D }) {
  const rooms      = house?.rooms || [];
  const totalArea  = rooms.reduce((s,r) => s + (r.dimensions?.width||0)*(r.dimensions?.length||0), 0);
  const totalItems = rooms.reduce((s,r) => s + (r.objects?.length||0), 0);
  const floors     = [...new Set(rooms.map(r => r.floor||1))].sort((a,b)=>a-b);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      <p className="text-[10px] text-gray-600 font-mono uppercase tracking-wider">House overview</p>
      <div className="grid grid-cols-2 gap-2">
        {[['Rooms',rooms.length],['Area',`${totalArea.toFixed(0)} m²`],['Furniture',totalItems],['Floors',floors.length]].map(([l,v]) => (
          <div key={l} className="bg-gray-900 border border-gray-800 rounded-xl px-3 py-3">
            <p className="text-gray-600 text-[10px] mb-1">{l}</p>
            <p className="text-white font-semibold text-sm">{v}</p>
          </div>
        ))}
      </div>
      {selectedRoom && (
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 space-y-3">
          <p className="text-[10px] text-gray-600 font-mono uppercase tracking-wider">Selected room</p>
          <p className="text-white font-semibold text-sm">{selectedRoom.name}</p>
          <p className="text-gray-500 text-xs">
            {selectedRoom.dimensions?.width}x{selectedRoom.dimensions?.length} m &middot;{' '}
            {selectedRoom.objects?.length||0} items &middot;{' '}
            {FLOOR_OPTIONS.find(f=>f.v===(selectedRoom.floor||1))?.l}
          </p>
          <button onClick={onEnter3D} className="btn-primary w-full text-xs py-2">Edit in 3D</button>
        </div>
      )}
      <p className="text-gray-800 text-[10px] leading-relaxed">Drag rooms to reposition. Double-click to edit in 3D.</p>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   Main HouseDesignerPage
══════════════════════════════════════════════════════════════════════ */
export default function HouseDesignerPage() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const { currentHouse, loadHouse, saveHouse, addRoom, updateRoom, deleteRoom } = useHouse();

  const [loading,     setLoading]     = useState(true);
  const [selRoomIdx,  setSelRoomIdx]  = useState(null);
  const [selObjIdx,   setSelObjIdx]   = useState(null);
  const [sidebarTab,  setSidebarTab]  = useState('overview');
  const [viewMode,    setViewMode]    = useState('overview');
  const [activeFloor, setActiveFloor] = useState(1);
  const [houseName,   setHouseName]   = useState('');
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [saveStatus,  setSaveStatus]  = useState('idle'); // idle | saving | saved

  useEffect(() => {
    if (id) loadHouse(id).finally(() => setLoading(false));
    else setLoading(false);
  }, [id, loadHouse]);

  useEffect(() => {
    if (currentHouse?.name) setHouseName(currentHouse.name);
  }, [currentHouse?._id, currentHouse?.name]);

  const currentRoom    = selRoomIdx !== null ? currentHouse?.rooms?.[selRoomIdx] : null;
  const roomAsProject  = useMemo(() => currentRoom ? {
    _id:            currentRoom._id,
    roomDimensions: currentRoom.dimensions,
    wallColor:      currentRoom.wallColor,
    objects:        currentRoom.objects || [],
  } : null, [currentRoom]);

  /* ── Save ───────────────────────────────────────────────────────── */
  const handleSave = useCallback(async () => {
    setSaveStatus('saving');
    await saveHouse({ name: houseName });
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
  }, [saveHouse, houseName]);

  const handleBack = async () => {
    await saveHouse({ name: houseName });
    navigate('/houses');
  };

  /* ── Selection ──────────────────────────────────────────────────── */
  const handleSelectRoom = useCallback((idx, enterDesigner = false) => {
    setSelRoomIdx(idx);
    setSelObjIdx(null);
    if (enterDesigner && idx !== null) setViewMode('3d-room');
  }, []);

  const handleUpdateRoomById = useCallback(async (roomId, updates) => {
    await updateRoom(roomId, updates);
  }, [updateRoom]);

  /* ── Object operations ──────────────────────────────────────────── */
  const handleUpdateObject = useCallback(async (index, updates) => {
    if (!currentRoom) return;
    const objects = [...(currentRoom.objects || [])];
    objects[index] = { ...objects[index], ...updates };
    await updateRoom(currentRoom._id, { objects });
  }, [currentRoom, updateRoom]);

  const handleDeleteObject = useCallback(async (index) => {
    if (!currentRoom) return;
    const objects = currentRoom.objects.filter((_, i) => i !== index);
    await updateRoom(currentRoom._id, { objects });
    setSelObjIdx(null);
  }, [currentRoom, updateRoom]);

  const handleAddObject = useCallback(async (item) => {
    if (!currentRoom) return;
    const isCeil = ['ceiling','fan','chandelier'].some(k => item.name?.toLowerCase().includes(k));
    await updateRoom(currentRoom._id, {
      objects: [...(currentRoom.objects||[]), {
        furnitureId: item._id,
        name:        item.name,
        modelUrl:    item.modelUrl,
        position:    { x:0, y: isCeil ? 2.4 : 0, z:0 },
        rotation:    { x:0, y:0, z:0 },
        scale:       { x:1, y:1, z:1 },
      }],
    });
  }, [currentRoom, updateRoom]);

  /* ── Add room ───────────────────────────────────────────────────── */
  const handleAddRoom = async (data) => {
    const updated = await addRoom(data);
    setSelRoomIdx((updated.rooms?.length || 1) - 1);
    setShowAddRoom(false);
  };

  /* ── Guards ─────────────────────────────────────────────────────── */
  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="spinner-lg" />
    </div>
  );
  if (!currentHouse) return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-4">
      <p className="text-gray-500">House not found.</p>
      <button onClick={() => navigate('/houses')} className="btn-ghost text-sm">Back</button>
    </div>
  );

  const is3DRoom   = viewMode === '3d-room';
  const isFloorPlan = viewMode === 'floor';

  return (
    <div className="h-screen flex flex-col bg-gray-950 pt-16 overflow-hidden">

      {showAddRoom && (
        <AddRoomModal
          defaultFloor={isFloorPlan ? activeFloor : 1}
          onClose={() => setShowAddRoom(false)}
          onAdd={handleAddRoom}
        />
      )}

      {/* ── Toolbar ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 h-11 border-b border-gray-800 bg-gray-950 shrink-0">

        {/* Left */}
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={handleBack} className="text-gray-600 hover:text-white transition-colors p-1 shrink-0">
            {Ic.back}
          </button>
          <div className="w-px h-4 bg-gray-800 shrink-0" />
          <input
            className="bg-transparent text-white text-sm font-medium focus:outline-none
                       border-b border-transparent focus:border-gray-600 transition-colors
                       placeholder-gray-700 min-w-0 w-32"
            value={houseName} onChange={e => setHouseName(e.target.value)} placeholder="My House" />
          <button onClick={handleSave} disabled={saveStatus === 'saving'}
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border transition-all shrink-0
              ${saveStatus === 'saved'
                ? 'border-green-700 text-green-500'
                : 'border-gray-800 text-gray-500 hover:border-gray-600 hover:text-white disabled:opacity-40'}`}>
            {Ic.save} {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved' : 'Save'}
          </button>
        </div>

        {/* Centre — view switcher */}
        <div className="flex items-center gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1 shrink-0">
          {VIEWS.map(v => (
            <button key={v.id}
              onClick={() => { if (v.id === '3d-room' && !currentRoom) return; setViewMode(v.id); }}
              disabled={v.id === '3d-room' && !currentRoom}
              title={v.tip}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all
                ${viewMode === v.id ? 'bg-white text-black'
                  : v.id === '3d-room' && !currentRoom ? 'text-gray-800 cursor-not-allowed'
                  : 'text-gray-500 hover:text-white'}`}>
              {v.icon}
              <span className="hidden sm:inline">{v.label}</span>
            </button>
          ))}
        </div>

        {/* Right */}
        <div className="flex items-center gap-2 shrink-0">
          {isFloorPlan && (
            <div className="flex items-center gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1">
              {FLOOR_OPTIONS.map(({ v, l }) => (
                <button key={v} onClick={() => setActiveFloor(v)} title={l}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all
                    ${activeFloor === v ? 'bg-white text-black' : 'text-gray-500 hover:text-white'}`}>
                  F{v}
                </button>
              ))}
            </div>
          )}
          {/* AR button — passes ?source=room so ARViewerPage loads from housesAPI.getRoom */}
          {is3DRoom && currentRoom && (
            <button onClick={() => navigate(`/ar/${currentRoom._id}?source=room`)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg
                         bg-white text-black font-medium hover:bg-gray-100 transition-all">
              {Ic.ar} View in AR
            </button>
          )}
          <button onClick={() => setShowAddRoom(true)}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border
                       border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white transition-all">
            {Ic.plus}<span className="hidden sm:inline">Add Room</span>
          </button>
        </div>
      </div>

      {/* ── Body ──────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Sidebar ───────────────────────────────────────────── */}
        <div className="w-60 border-r border-gray-800 flex flex-col bg-gray-950 shrink-0 overflow-hidden">

          <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-800 shrink-0">
            <span className="text-[10px] text-gray-600 font-mono uppercase tracking-wider">
              Rooms ({currentHouse.rooms?.length || 0})
            </span>
          </div>

          <div className="max-h-56 overflow-y-auto border-b border-gray-800 shrink-0">
            {(currentHouse.rooms || []).length === 0 ? (
              <div className="px-4 py-6 text-center">
                <p className="text-gray-700 text-xs mb-3">No rooms yet.</p>
                <button onClick={() => setShowAddRoom(true)} className="btn-primary text-xs px-4 py-2">
                  {Ic.plus} Add first room
                </button>
              </div>
            ) : (
              (currentHouse.rooms || []).map((room, i) => (
                <div key={room._id || i}
                  onClick={() => handleSelectRoom(i)}
                  onDoubleClick={() => handleSelectRoom(i, true)}
                  className={`flex items-center justify-between px-4 py-2.5 cursor-pointer
                              transition-colors border-l-2 group
                              ${selRoomIdx === i
                                ? 'bg-white/[0.04] border-l-white/40'
                                : 'border-l-transparent hover:bg-white/[0.02]'}`}>
                  <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
                    <div className="w-5 h-5 rounded-md bg-gray-800 flex items-center justify-center
                                    text-[9px] font-mono text-gray-500 shrink-0">
                      {(room.type||'ot').slice(0,2).toUpperCase()}
                    </div>
                    <div className="overflow-hidden min-w-0">
                      <p className={`text-xs truncate ${selRoomIdx===i?'text-white':'text-gray-400'}`}>
                        {room.name}
                      </p>
                      <p className="text-[10px] text-gray-700 font-mono">
                        {room.dimensions?.width}x{room.dimensions?.length}m &middot; F{room.floor||1}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1">
                    <button onClick={e => { e.stopPropagation(); handleSelectRoom(i, true); }}
                      className="w-6 h-6 rounded-md bg-gray-800 flex items-center justify-center
                                 text-gray-500 hover:text-white" title="Edit in 3D">
                      {Ic.edit}
                    </button>
                    <button onClick={e => { e.stopPropagation(); if (window.confirm(`Delete "${room.name}"?`)) deleteRoom(room._id); }}
                      className="w-6 h-6 rounded-md bg-gray-800 flex items-center justify-center
                                 text-gray-500 hover:text-red-400" title="Delete room">
                      {Ic.trash}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Lower sidebar — context-aware */}
          {is3DRoom && currentRoom ? (
            <>
              <div className="flex border-b border-gray-800 shrink-0">
                {['furniture','properties'].map(tab => (
                  <button key={tab} onClick={() => setSidebarTab(tab)}
                    className={`flex-1 py-2.5 text-xs font-medium capitalize transition-colors
                                ${sidebarTab===tab?'text-white border-b border-white':'text-gray-700 hover:text-gray-400'}`}>
                    {tab}
                    {tab==='properties'&&selObjIdx!==null&&(
                      <span className="ml-1.5 w-1.5 h-1.5 rounded-full bg-white inline-block" />
                    )}
                  </button>
                ))}
              </div>
              {sidebarTab === 'furniture'
                ? <FurniturePanel onAdd={handleAddObject} />
                : <PropertiesPanel
                    objects={currentRoom?.objects||[]}
                    selectedIndex={selObjIdx}
                    onSelect={idx => { setSelObjIdx(idx); setSidebarTab('properties'); }}
                    onUpdate={handleUpdateObject}
                    onRemove={handleDeleteObject}
                    onDeselect={() => setSelObjIdx(null)} />
              }
            </>
          ) : (
            <HouseStats house={currentHouse} selectedRoom={currentRoom}
              onEnter3D={() => { if (currentRoom) setViewMode('3d-room'); }} />
          )}
        </div>

        {/* ── Viewport ────────────────────────────────────────────── */}
        <div className="flex-1 relative overflow-hidden">

          {viewMode === 'overview' && (
            <FloorPlan house={currentHouse} selectedRoomIdx={selRoomIdx}
              onSelectRoom={handleSelectRoom} onUpdateRoom={handleUpdateRoomById} />
          )}

          {viewMode === 'floor' && (
            <FloorDesign2D house={currentHouse} floor={activeFloor} selectedRoomIdx={selRoomIdx}
              onSelectRoom={handleSelectRoom} onUpdateRoom={handleUpdateRoomById}
              onAddRoom={() => setShowAddRoom(true)} />
          )}

          {viewMode === '3d-house' && (
            <FloorPlan3D house={currentHouse} selectedRoomIdx={selRoomIdx}
              onSelectRoom={handleSelectRoom} />
          )}

          {viewMode === '3d-room' && roomAsProject && (
            <>
              <SceneViewer project={roomAsProject} selectedIdx={selObjIdx}
                onSelect={idx => { setSelObjIdx(idx); if (idx!==null) setSidebarTab('properties'); }}
                onUpdateObject={handleUpdateObject} onDeleteObject={handleDeleteObject} />

              <button onClick={() => setViewMode('overview')}
                className="absolute top-4 left-4 flex items-center gap-2 px-3 py-2 rounded-full
                           bg-black/60 backdrop-blur-sm border border-white/10 text-white text-xs
                           hover:bg-black/80 transition-all z-20">
                {Ic.back} Floor Plan
              </button>

              <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/60 backdrop-blur-sm
                              border border-white/10 rounded-full px-3 py-2 text-xs text-white pointer-events-none z-20">
                {ROOM_TYPES.find(r => r.value === currentRoom?.type)?.label || 'Room'} &mdash; {currentRoom?.name}
                <span className="text-gray-500 font-mono">F{currentRoom?.floor||1}</span>
              </div>

              <RoomSettingsOverlay room={currentRoom}
                onSave={updates => updateRoom(currentRoom._id, updates)} />
            </>
          )}

          {viewMode === '3d-room' && !roomAsProject && (
            <div className="w-full h-full flex flex-col items-center justify-center gap-4">
              <p className="text-gray-600 text-sm">Select a room to edit in 3D</p>
              <button onClick={() => setViewMode('overview')} className="btn-ghost text-sm">
                Go to Floor Plan
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

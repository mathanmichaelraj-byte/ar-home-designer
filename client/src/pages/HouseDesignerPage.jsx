import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useHouse } from '../context/HouseContext';
import SceneViewer from '../three/SceneViewer';
import { furnitureAPI } from '../utils/api';
import { useProject } from '../context/ProjectContext';

const ROOM_TYPES = [
  { value: 'living',   label: 'Living Room', emoji: '🛋️' },
  { value: 'bedroom',  label: 'Bedroom',     emoji: '🛏️' },
  { value: 'office',   label: 'Office',      emoji: '💼' },
  { value: 'dining',   label: 'Dining Room', emoji: '🍽️' },
  { value: 'kitchen',  label: 'Kitchen',     emoji: '🍳' },
  { value: 'bathroom', label: 'Bathroom',    emoji: '🚿' },
  { value: 'other',    label: 'Other',       emoji: '🏠' },
];

const HouseDesignerPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentHouse, loadHouse, saveHouse, saving, addRoom, updateRoom, deleteRoom } = useHouse();
  const [loading, setLoading] = useState(true);
  const [selectedRoomIdx, setSelectedRoomIdx] = useState(0);
  const [selectedObjIdx, setSelectedObjIdx] = useState(null);
  const [sidebarTab, setSidebarTab] = useState('furniture');
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [houseName, setHouseName] = useState('');
  const [showImportRoom, setShowImportRoom] = useState(false);

  useEffect(() => {
    if (id) loadHouse(id).finally(() => setLoading(false));
    else setLoading(false);
  }, [id, loadHouse]);

  useEffect(() => {
    if (currentHouse?.name) setHouseName(currentHouse.name);
  }, [currentHouse?._id, currentHouse?.name]);


  const currentRoom = currentHouse?.rooms?.[selectedRoomIdx] || null;

  // Wrap room as a project-like object for SceneViewer
  const roomAsProject = currentRoom ? {
    _id: currentRoom._id,
    roomDimensions: currentRoom.dimensions,
    wallColor: currentRoom.wallColor,
    objects: currentRoom.objects || [],
  } : null;

  const handleSave = useCallback(async () => {
    await saveHouse({ name: houseName });
  }, [saveHouse, houseName]);

  const handleSaveAndBack = async () => {
    await saveHouse({ name: houseName });
    navigate('/houses');
  };

  const handleUpdateObject = useCallback(async (index, updates) => {
    if (!currentRoom) return;
    const objects = [...(currentRoom.objects || [])];
    objects[index] = { ...objects[index], ...updates };
    await updateRoom(currentRoom._id, { objects });
  }, [currentRoom, updateRoom]);

  const handleAddObject = useCallback(async (furnitureItem) => {
    if (!currentRoom) return;
    const CEILING_KEYWORDS = ['ceiling', 'fan', 'chandelier'];
    const isCeiling = CEILING_KEYWORDS.some(k => furnitureItem.name.toLowerCase().includes(k));
    const newObj = {
      furnitureId: furnitureItem._id,
      name: furnitureItem.name,
      modelUrl: furnitureItem.modelUrl,
      position: { x: 0, y: isCeiling ? 2.6 : 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      color: '#cccccc',
    };
    const objects = [...(currentRoom.objects || []), newObj];
    await updateRoom(currentRoom._id, { objects });
  }, [currentRoom, updateRoom]);

  const handleRemoveObject = useCallback(async (index) => {
    if (!currentRoom) return;
    const objects = currentRoom.objects.filter((_, i) => i !== index);
    await updateRoom(currentRoom._id, { objects });
    setSelectedObjIdx(null);
  }, [currentRoom, updateRoom]);

  const handleImportRoom = async (project) => {
    const roomData = {
      name: project.name,
      type: 'living',
      dimensions: project.roomDimensions || { width: 5, length: 5, height: 2.8 },
      wallColor: project.wallColor || '#f5f5f0',
      objects: project.objects || [],
    };

    const ImportRoomModal = ({ onClose, onImport }) => {
      const { projects, loadProjects } = useProject();
      const [loading, setLoading] = useState(true);

      useEffect(() => {
        loadProjects().finally(() => setLoading(false));
      }, [loadProjects]);

      return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center px-4">
          <div className="card w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Import Room</h3>
              <button onClick={onClose} className="text-gray-500 hover:text-white text-lg">✕</button>
            </div>
            <p className="text-gray-400 text-xs mb-4">Import an existing room project into this house.</p>
            {loading ? (
              <div className="flex justify-center py-6">
                <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : projects.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-6">No room projects found.</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {projects.filter(Boolean).map((project) => (
                  <button key={project._id} onClick={() => onImport(project)}
                    className="w-full card hover:border-brand-500 text-left flex items-center justify-between group">
                    <div>
                      <p className="text-white text-sm font-medium">{project.name}</p>
                      <p className="text-gray-500 text-xs">
                        {project.roomDimensions?.width || 5}m × {project.roomDimensions?.length || 5}m
                        · {project.objects?.length || 0} items
                      </p>
                    </div>
                    <span className="text-brand-500 text-xs opacity-0 group-hover:opacity-100">Import →</span>
                  </button>
                ))}
              </div>
            )}
            <button onClick={onClose} className="btn-ghost w-full mt-4 text-sm">Cancel</button>
          </div>
        </div>
      );
    };
    const updated = await addRoom(roomData);
    setSelectedRoomIdx((updated.rooms?.length || 1) - 1);
    setShowImportRoom(false);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!currentHouse) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-400">House not found.</p>
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-surface pt-16">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 h-12 border-b border-border bg-panel shrink-0">
        <div className="flex items-center gap-3">
          <input
            className="bg-transparent text-white font-medium text-sm focus:outline-none border-b border-transparent focus:border-brand-500 transition-colors w-40"
            value={houseName}
            onChange={(e) => setHouseName(e.target.value)}
            placeholder="My House"
          />
          <button onClick={handleSave} disabled={saving}
            className={`text-xs px-3 py-1 rounded-lg transition-all ${saving ? 'bg-yellow-500/10 text-yellow-400' : 'bg-brand-500/10 hover:bg-brand-500/20 text-brand-500 border border-brand-500/30'}`}>
            {saving ? 'Saving…' : '💾 Save'}
          </button>
        </div>
        <button onClick={handleSaveAndBack} className="btn-ghost text-xs px-3 py-1.5">
          ← Back
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar — rooms list + furniture */}
        <div className="w-64 border-r border-border flex flex-col bg-panel shrink-0">

          {/* Rooms list */}
          <div className="border-b border-border">
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-xs font-medium text-gray-400">Rooms ({currentHouse.rooms?.length || 0})</span>
              <div className="flex gap-2">
                <button onClick={() => setShowImportRoom(true)}
                  className="text-xs text-gray-400 hover:text-white">↑ Import</button>
                <button onClick={() => setShowAddRoom(true)}
                  className="text-xs text-brand-500 hover:text-brand-600 font-medium">+ Add</button>
              </div>
            </div>
            <div className="max-h-40 overflow-y-auto">
              {(currentHouse.rooms || []).map((room, i) => (
                <div key={room._id || i}
                  onClick={() => { setSelectedRoomIdx(i); setSelectedObjIdx(null); }}
                  className={`flex items-center justify-between px-3 py-2 cursor-pointer transition-colors ${
                    selectedRoomIdx === i ? 'bg-brand-500/10 border-l-2 border-brand-500' : 'hover:bg-surface border-l-2 border-transparent'
                  }`}>
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="text-sm">{ROOM_TYPES.find(r => r.value === room.type)?.emoji || '🏠'}</span>
                    <span className="text-xs text-white truncate">{room.name}</span>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); if (window.confirm(`Delete "${room.name}"?`)) deleteRoom(room._id); }}
                    className="text-gray-600 hover:text-red-400 text-xs ml-1 shrink-0">✕</button>
                </div>
              ))}
            </div>
          </div>

          {/* Furniture/Properties tabs */}
          <div className="flex border-b border-border">
            {['furniture', 'properties'].map((tab) => (
              <button key={tab} onClick={() => setSidebarTab(tab)}
                className={`flex-1 py-2 text-xs font-medium capitalize transition-colors ${
                  sidebarTab === tab ? 'text-brand-500 border-b-2 border-brand-500' : 'text-gray-400 hover:text-white'
                }`}>{tab}</button>
            ))}
          </div>

          {sidebarTab === 'furniture' ? (
            <HouseFurniturePanel onAdd={handleAddObject} />
          ) : (
            <HousePropertiesPanel
              room={currentRoom}
              objects={currentRoom?.objects || []}
              selectedIndex={selectedObjIdx}
              onSelect={(idx) => { setSelectedObjIdx(idx); setSidebarTab('properties'); }}
              onUpdate={handleUpdateObject}
              onRemove={handleRemoveObject}
              onDeselect={() => setSelectedObjIdx(null)}
              onUpdateRoom={(updates) => updateRoom(currentRoom._id, updates)}
            />
          )}
        </div>

        {/* 3D viewport */}
        <div className="flex-1 relative overflow-hidden">
          {roomAsProject ? (
            <SceneViewer
              project={roomAsProject}
              selectedIdx={selectedObjIdx}
              onSelect={(idx) => { setSelectedObjIdx(idx); if (idx !== null) setSidebarTab('properties'); }}
              onUpdateObject={handleUpdateObject}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <p className="text-gray-500">Select or add a room to start designing</p>
            </div>
          )}

          {/* Room settings */}
          {currentRoom && (
            <RoomSettingsOverlay room={currentRoom} onSave={(updates) => updateRoom(currentRoom._id, updates)} />
          )}

          {/* Room indicator */}
          {currentRoom && (
            <div className="absolute top-3 right-4 bg-black/50 backdrop-blur text-white text-xs px-3 py-1 rounded-full">
              {ROOM_TYPES.find(r => r.value === currentRoom.type)?.emoji} {currentRoom.name}
            </div>
          )}
        </div>
      </div>

      {/* Add Room Modal */}
      {showAddRoom && (
        <AddRoomModal
          onClose={() => setShowAddRoom(false)}
          onAdd={async (roomData) => {
            const updated = await addRoom(roomData);
            setSelectedRoomIdx((updated.rooms?.length || 1) - 1);
            setShowAddRoom(false);
          }}
        />
      )}

      {/* Import Room Modal */}
      {showImportRoom && (
        <ImportRoomModal
          onClose={() => setShowImportRoom(false)}
          onImport={handleImportRoom}
        />
      )}
      
    </div>
  );
};

// ---- House Furniture Panel (uses addObject callback instead of context) ----
const HouseFurniturePanel = ({ onAdd }) => {
  const [furniture, setFurniture] = useState([]);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (category !== 'all') params.type = category;
    if (search) params.search = search;
    const t = setTimeout(() => {
      furnitureAPI.list(params)
        .then(({ data }) => setFurniture(Array.isArray(data.furniture) ? data.furniture : []))
        .catch(console.error)
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(t);
  }, [category, search]);

  const CATEGORIES = ['all','sofa','chair','table','bed','shelf','desk','lamp','cabinet','plant'];

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="p-3 border-b border-border">
        <input className="input text-sm" placeholder="Search furniture…"
          value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <div className="flex gap-1 p-3 overflow-x-auto border-b border-border">
        {CATEGORIES.map((cat) => (
          <button key={cat} onClick={() => setCategory(cat)}
            className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${category === cat ? 'bg-brand-500 text-white' : 'bg-surface text-gray-400 hover:text-white'}`}>
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        {loading ? (
          <div className="flex justify-center pt-8">
            <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {furniture.map((item) => (
              <button key={item._id} onClick={() => onAdd(item)}
                className="card hover:border-brand-500 cursor-pointer text-left group">
                <div className="aspect-square bg-surface rounded-lg mb-2 flex items-center justify-center">
                  {item.thumbnailUrl
                    ? <img src={item.thumbnailUrl} alt={item.name} className="w-full h-full object-cover rounded-lg" />
                    : <span className="text-3xl">🪑</span>}
                </div>
                <p className="text-xs font-medium text-white truncate">{item.name}</p>
                <p className="text-xs text-gray-500">${item.price}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ---- Properties Panel for House rooms ----
const HousePropertiesPanel = ({ objects, selectedIndex, onSelect, onUpdate, onRemove, onDeselect, onUpdateRoom, room }) => {
  const selected = selectedIndex !== null ? objects[selectedIndex] : null;
  const [localScale, setLocalScale] = useState({ x: 1, y: 1, z: 1 });
  const [localColor, setLocalColor] = useState('#cccccc');

  useEffect(() => {
    const obj = selectedIndex !== null ? objects[selectedIndex] : null;
    if (obj) {
        setLocalScale(obj.scale || { x: 1, y: 1, z: 1 });
        setLocalColor(obj.color || '#cccccc');
    }
  }, [selectedIndex, objects]);

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="border-b border-border">
        <p className="text-xs text-gray-500 font-medium px-3 pt-3 pb-2">Objects ({objects.length})</p>
        <div className="max-h-36 overflow-y-auto">
          {objects.length === 0 ? (
            <p className="text-xs text-gray-600 px-3 pb-3">No objects added yet.</p>
          ) : objects.map((obj, i) => (
            <div key={i} onClick={() => onSelect(i)}
              className={`flex items-center justify-between px-3 py-2 cursor-pointer transition-colors ${selectedIndex === i ? 'bg-brand-500/10 border-l-2 border-brand-500' : 'hover:bg-surface border-l-2 border-transparent'}`}>
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="w-2 h-2 rounded-full bg-brand-500/60 shrink-0" />
                <span className="text-xs text-white truncate">{obj.name}</span>
              </div>
              <button onClick={(e) => { e.stopPropagation(); onRemove(i); }}
                className="text-gray-600 hover:text-red-400 text-xs ml-2 shrink-0">✕</button>
            </div>
          ))}
        </div>
      </div>

      {selected ? (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-medium text-sm truncate">{selected.name}</h3>
            <button onClick={onDeselect} className="text-gray-500 hover:text-white text-xs">✕</button>
          </div>

          {[
            { label: 'Position', key: 'position', axes: ['x','y','z'], step: 0.1 },
            { label: 'Rotation', key: 'rotation', axes: ['x','y','z'], step: 0.1 },
          ].map(({ label, key, axes, step }) => (
            <div key={key}>
              <p className="text-xs text-gray-400 font-medium mb-2">{label}</p>
              <div className="grid grid-cols-3 gap-1">
                {axes.map((axis) => (
                  <div key={axis}>
                    <label className="text-xs text-gray-600 uppercase">{axis}</label>
                    <input type="number" step={step} className="input text-xs py-1"
                      value={selected[key]?.[axis] ?? 0}
                      onChange={(e) => onUpdate(selectedIndex, { [key]: { ...selected[key], [axis]: parseFloat(e.target.value) || 0 } })} />
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div>
            <p className="text-xs text-gray-400 font-medium mb-2">Scale</p>
            <input type="range" min={0.1} max={5} step={0.05}
              value={localScale.x}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                const updated = { x: v, y: v, z: v };
                setLocalScale(updated);
                onUpdate(selectedIndex, { scale: updated });
              }}
              className="w-full accent-brand-500" />
            <span className="text-xs text-gray-500">{localScale.x.toFixed(2)}x</span>
          </div>

          <div>
            <p className="text-xs text-gray-400 font-medium mb-2">Color</p>
            <input type="color" value={localColor}
              onChange={(e) => { setLocalColor(e.target.value); onUpdate(selectedIndex, { color: e.target.value }); }}
              className="w-full h-9 rounded-lg cursor-pointer border border-border bg-surface" />
          </div>

          <button onClick={() => onRemove(selectedIndex)}
            className="w-full py-2 text-xs text-red-400 border border-red-500/30 hover:bg-red-500/10 rounded-lg transition-colors">
            Remove from room
          </button>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center p-6 text-center">
          <p className="text-gray-500 text-sm">Select an object to edit its properties.</p>
        </div>
      )}
    </div>
  );
};

// ---- Room Settings Overlay ----
const RoomSettingsOverlay = ({ room, onSave }) => {
  const [open, setOpen] = useState(false);
  const [dim, setDim] = useState(room?.dimensions || { width: 5, length: 5, height: 2.8 });
  const [wallColor, setWallColor] = useState(room?.wallColor || '#f5f5f0');

  useEffect(() => {
    if (room) {
        setDim(room.dimensions || { width: 5, length: 5, height: 2.8 });
        setWallColor(room.wallColor || '#f5f5f0');
    }
    }, [room]);

  return (
    <div className="absolute bottom-4 right-4">
      <button onClick={() => setOpen(!open)} className="btn-ghost text-xs flex items-center gap-1">
        ⚙️ Room Settings
      </button>
      {open && (
        <div className="absolute bottom-10 right-0 w-64 card shadow-2xl z-50">
          <h4 className="text-white font-medium text-sm mb-3">Room Dimensions</h4>
          <div className="space-y-2">
            {[['Width (m)', 'width'], ['Length (m)', 'length'], ['Height (m)', 'height']].map(([label, key]) => (
              <div key={key} className="flex items-center justify-between gap-2">
                <label className="text-xs text-gray-400">{label}</label>
                <input type="number" step="0.5" min="1" max="30"
                  className="input text-xs py-1 w-20"
                  value={dim[key] ?? 5}
                  onChange={(e) => setDim(prev => ({ ...prev, [key]: e.target.value }))}
                  onBlur={(e) => {
                    const updated = { ...dim, [key]: parseFloat(e.target.value) || 1 };
                    setDim(updated);
                    onSave({ dimensions: updated });
                  }} />
              </div>
            ))}
          </div>
          <div className="mt-3">
            <label className="text-xs text-gray-400 block mb-1">Wall Color</label>
            <input type="color" value={wallColor}
              onChange={(e) => { setWallColor(e.target.value); onSave({ wallColor: e.target.value }); }}
              className="w-full h-8 rounded cursor-pointer border border-border" />
          </div>
        </div>
      )}
    </div>
  );
};

// ---- Add Room Modal ----
const AddRoomModal = ({ onClose, onAdd }) => {
  const [form, setForm] = useState({ name: '', type: 'living', dimensions: { width: 4, length: 4, height: 2.8 } });

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center px-4">
      <div className="card w-full max-w-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold">Add Room</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-lg">✕</button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Room Name</label>
            <input className="input" placeholder="e.g. Master Bedroom"
              value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-2">Room Type</label>
            <div className="grid grid-cols-3 gap-2">
              {ROOM_TYPES.map(({ value, label, emoji }) => (
                <button key={value} onClick={() => setForm({ ...form, type: value })}
                  className={`card py-3 flex flex-col items-center gap-1 transition-all ${form.type === value ? 'border-brand-500 bg-brand-500/10' : 'hover:border-brand-500/50'}`}>
                  <span className="text-xl">{emoji}</span>
                  <span className="text-xs text-white">{label.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-2">Dimensions (m)</label>
            <div className="grid grid-cols-3 gap-2">
              {[['W', 'width'], ['L', 'length'], ['H', 'height']].map(([label, key]) => (
                <div key={key}>
                  <label className="text-xs text-gray-600">{label}</label>
                  <input type="number" step="0.5" min="1" max="30" className="input text-xs py-1"
                    value={form.dimensions[key]}
                    onChange={(e) => setForm({ ...form, dimensions: { ...form.dimensions, [key]: parseFloat(e.target.value) || 1 } })} />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="btn-ghost flex-1">Cancel</button>
          <button
            onClick={() => { if (!form.name.trim()) return; onAdd(form); }}
            disabled={!form.name.trim()}
            className="btn-primary flex-1">
            Add Room
          </button>
        </div>
      </div>
    </div>
  );
};

export default HouseDesignerPage;
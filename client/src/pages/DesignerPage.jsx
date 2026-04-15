import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProject } from '../context/ProjectContext';
import FurniturePanel from '../components/FurniturePanel';
import SceneViewer from '../three/SceneViewer';
import { projectsAPI } from '../utils/api';

// ─────────────────────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────────────────────
const Icon = {
  save:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>,
  ar:      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 3H3v2M19 3h2v2M5 21H3v-2M19 21h2v-2"/><rect x="7" y="7" width="10" height="10" rx="1"/></svg>,
  back:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>,
  ai:      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>,
  trash:   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>,
  settings:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
  close:   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  dot:     <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor"><circle cx="4" cy="4" r="3"/></svg>,
};

// ─────────────────────────────────────────────────────────────────────────────
// AI Style picker modal
// ─────────────────────────────────────────────────────────────────────────────
const STYLES = [
  { style: 'living',   emoji: '🛋️', label: 'Living Room' },
  { style: 'bedroom',  emoji: '🛏️', label: 'Bedroom' },
  { style: 'office',   emoji: '💼', label: 'Office' },
  { style: 'dining',   emoji: '🍽️', label: 'Dining Room' },
  { style: 'kitchen',  emoji: '🍳', label: 'Kitchen' },
  { style: 'bathroom', emoji: '🚿', label: 'Bathroom' },
];

const StyleModal = ({ onSelect, onClose }) => (
  <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center px-4">
    <div className="w-full max-w-sm bg-gray-900 border border-gray-700 rounded-2xl shadow-card animate-scale-in">
      <div className="flex items-center justify-between p-5 border-b border-gray-800">
        <div>
          <h3 className="text-white font-semibold text-sm">AI Room Suggestions</h3>
          <p className="text-gray-600 text-xs mt-0.5">Choose a room type to generate a layout</p>
        </div>
        <button onClick={onClose}
          className="w-7 h-7 rounded-lg bg-gray-800 flex items-center justify-center text-gray-500
                     hover:text-white hover:bg-gray-700 transition-colors">
          {Icon.close}
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2 p-4">
        {STYLES.map(({ style, emoji, label }) => (
          <button
            key={style}
            onClick={() => onSelect(style)}
            className="flex items-center gap-3 px-4 py-3 rounded-xl
                       bg-gray-800 border border-gray-700 hover:border-gray-500
                       hover:bg-gray-750 transition-all duration-150 text-left group"
          >
            <span className="text-xl">{emoji}</span>
            <span className="text-white text-xs font-medium group-hover:text-white">{label}</span>
          </button>
        ))}
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Properties Panel
// ─────────────────────────────────────────────────────────────────────────────
const PropertiesPanel = ({ objects = [], selectedIndex, onSelect, updateObject, removeObject, onDeselect }) => {
  const selected = selectedIndex !== null ? objects[selectedIndex] : null;
  const [localScale, setLocalScale] = useState({ x: 1, y: 1, z: 1 });
  const [localColor, setLocalColor] = useState('#cccccc');

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (selected) {
      setLocalScale(selected.scale || { x: 1, y: 1, z: 1 });
      setLocalColor(selected.color || '#cccccc');
    }
  }, [selected, selectedIndex]);

  const update = (key, subKey, val) => {
    if (!selected) return;
    updateObject(selectedIndex, { [key]: { ...selected[key], [subKey]: parseFloat(val) || 0 } });
  };

  const handleScaleChange = (axis, val) => {
    const updated = { ...localScale, [axis]: parseFloat(val) || 0.1 };
    setLocalScale(updated);
    updateObject(selectedIndex, { scale: updated });
  };

  const handleColorChange = (val) => {
    setLocalColor(val);
    updateObject(selectedIndex, { color: val });
  };

  const Field = ({ label, value, onChange, step = 0.1, min }) => (
    <div>
      <label className="block text-[10px] text-gray-700 uppercase mb-1 font-mono">{label}</label>
      <input
        type="number" step={step} min={min}
        className="w-full bg-gray-950 border border-gray-800 rounded-lg px-2 py-1.5
                   text-white text-xs font-mono focus:outline-none focus:border-gray-600
                   transition-colors"
        value={value}
        onChange={onChange}
      />
    </div>
  );

  return (
    <div className="flex flex-col h-full overflow-hidden text-sm">

      {/* Object list */}
      <div className="border-b border-gray-800 shrink-0">
        <p className="text-[10px] text-gray-700 font-mono uppercase px-4 pt-3 pb-2 tracking-wider">
          Scene objects ({objects.length})
        </p>
        <div className="max-h-44 overflow-y-auto">
          {objects.length === 0 ? (
            <p className="text-xs text-gray-700 px-4 pb-4">No objects added yet.</p>
          ) : (
            objects.map((obj, i) => (
              <div
                key={i}
                onClick={() => onSelect(i)}
                className={`flex items-center justify-between px-4 py-2.5 cursor-pointer
                            transition-colors border-l-2
                            ${selectedIndex === i
                              ? 'bg-white/5 border-l-white/40 text-white'
                              : 'border-l-transparent text-gray-500 hover:text-gray-300 hover:bg-white/[0.03]'
                            }`}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                <span className={selectedIndex === i ? 'text-white' : 'text-gray-700'}>
                    {Icon.dot}
                  </span>
                  <span className="text-xs truncate">{obj.name}</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeObject(i);
                    if (selectedIndex === i) onDeselect();
                  }}
                  className="text-gray-700 hover:text-red-500 transition-colors ml-2 shrink-0"
                >
                  {Icon.close}
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Edit panel */}
      {selected ? (
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <span className="text-white font-medium text-xs truncate">{selected.name}</span>
            <button onClick={onDeselect} className="text-gray-700 hover:text-white transition-colors shrink-0 ml-2">
              {Icon.close}
            </button>
          </div>

          {/* Tip */}
          <div className="bg-gray-950 border border-gray-800 rounded-xl px-3 py-2.5 text-[11px] text-gray-600 leading-relaxed">
            💡 Use <span className="text-gray-400 font-mono">W/E/R</span> keys or the toolbar
            above the 3D view to switch between Move / Rotate / Scale modes.
          </div>

          {/* Position */}
          <div>
            <p className="text-[10px] text-gray-600 font-mono uppercase tracking-wider mb-2">Position</p>
            <div className="grid grid-cols-3 gap-2">
              {['x', 'y', 'z'].map((axis) => (
                <Field key={axis} label={axis}
                  value={selected.position?.[axis] ?? 0}
                  onChange={(e) => update('position', axis, e.target.value)} />
              ))}
            </div>
          </div>

          {/* Rotation */}
          <div>
            <p className="text-[10px] text-gray-600 font-mono uppercase tracking-wider mb-2">Rotation (rad)</p>
            <div className="grid grid-cols-3 gap-2">
              {['x', 'y', 'z'].map((axis) => (
                <Field key={axis} label={axis}
                  value={selected.rotation?.[axis] ?? 0}
                  onChange={(e) => update('rotation', axis, e.target.value)} />
              ))}
            </div>
          </div>

          {/* Scale */}
          <div>
            <p className="text-[10px] text-gray-600 font-mono uppercase tracking-wider mb-2">Scale</p>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {['x', 'y', 'z'].map((axis) => (
                <Field key={axis} label={axis} step={0.05} min={0.01}
                  value={localScale[axis] ?? 1}
                  onChange={(e) => handleScaleChange(axis, e.target.value)} />
              ))}
            </div>
            {/* Uniform scale slider */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] text-gray-700 font-mono uppercase">Uniform</label>
                <span className="text-xs font-mono text-gray-500">{(localScale.x || 1).toFixed(2)}×</span>
              </div>
              <input
                type="range" min={0.1} max={5} step={0.05}
                value={localScale.x || 1}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  const updated = { x: v, y: v, z: v };
                  setLocalScale(updated);
                  updateObject(selectedIndex, { scale: updated });
                }}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer
                           bg-gray-800 [&::-webkit-slider-thumb]:appearance-none
                           [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5
                           [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
              />
            </div>
          </div>

          {/* Tint */}
          <div>
            <p className="text-[10px] text-gray-600 font-mono uppercase tracking-wider mb-2">Tint Color</p>
            <div className="flex items-center gap-3">
              <input
                type="color" value={localColor}
                onChange={(e) => handleColorChange(e.target.value)}
                className="w-9 h-9 rounded-lg cursor-pointer border border-gray-700 bg-gray-900 p-0.5"
              />
              <span className="text-xs font-mono text-gray-600">{localColor}</span>
              <button
                onClick={() => handleColorChange('#cccccc')}
                className="ml-auto text-xs text-gray-700 hover:text-gray-400 transition-colors"
              >
                Reset
              </button>
            </div>
          </div>

          <div className="divider" />

          {/* Remove */}
          <button
            onClick={() => { removeObject(selectedIndex); onDeselect(); }}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl
                       border border-red-500/20 text-red-500/70 text-xs
                       hover:bg-red-500/10 hover:border-red-500/40 hover:text-red-400
                       transition-all duration-150"
          >
            {Icon.trash}
            Remove from room
          </button>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center p-8 text-center">
          <p className="text-gray-700 text-xs leading-relaxed">
            Click any object in the 3D view or select one above to edit its properties.
          </p>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Room Settings popover
// ─────────────────────────────────────────────────────────────────────────────
const RoomSettings = ({ project, onSave }) => {
  const [open, setOpen]           = useState(false);
  const [dim, setDim]             = useState(project?.roomDimensions || { width: 5, length: 5, height: 2.8 });
  const [wallColor, setWallColor] = useState(project?.wallColor || '#1c1c1c');
  const initialized               = useRef(false);

  useEffect(() => {
    if (project?._id && !initialized.current) {
      initialized.current = true;
      setDim(project.roomDimensions || { width: 5, length: 5, height: 2.8 });
      setWallColor(project.wallColor || '#1c1c1c');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?._id, project?.roomDimensions, project?.wallColor]);

  const handleDimChange = (key, val) => setDim((prev) => ({ ...prev, [key]: val }));

  const handleDimBlur = (key, val) => {
    const parsed = parseFloat(val);
    const final = isNaN(parsed) || parsed < 1 ? 1 : parsed > 30 ? 30 : parsed;
    const updated = { ...dim, [key]: final };
    setDim(updated);
    onSave({ roomDimensions: updated });
  };

  const handleColorChange = (val) => {
    setWallColor(val);
    onSave({ wallColor: val });
  };

  return (
    <div className="absolute bottom-16 right-4 z-20">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium
                    transition-all duration-150 border
                    ${open
                      ? 'bg-white text-black border-white'
                      : 'bg-gray-900/80 backdrop-blur-sm border-gray-700 text-gray-400 hover:text-white hover:border-gray-600'
                    }`}
      >
        {Icon.settings}
        Room
      </button>

      {open && (
        <div className="absolute bottom-10 right-0 w-60 bg-gray-900 border border-gray-700
                        rounded-2xl shadow-card p-4 animate-slide-down space-y-4">
          <p className="text-xs font-semibold text-white">Room Settings</p>

          <div className="space-y-3">
            {[['Width (m)', 'width'], ['Length (m)', 'length'], ['Height (m)', 'height']].map(([label, key]) => (
              <div key={key} className="flex items-center justify-between gap-3">
                <label className="text-xs text-gray-500">{label}</label>
                <input
                  type="number" step="0.5" min="1" max="30"
                  className="w-20 bg-gray-950 border border-gray-800 rounded-lg px-2 py-1.5
                             text-white text-xs font-mono focus:outline-none focus:border-gray-600 transition-colors"
                  value={dim[key] ?? ''}
                  onChange={(e) => handleDimChange(key, e.target.value)}
                  onBlur={(e) => handleDimBlur(key, e.target.value)}
                />
              </div>
            ))}
          </div>

          <div>
            <label className="text-xs text-gray-500 block mb-2">Wall Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color" value={wallColor}
                onChange={(e) => handleColorChange(e.target.value)}
                className="w-9 h-9 rounded-lg cursor-pointer border border-gray-700 bg-gray-950 p-0.5"
              />
              <span className="text-xs font-mono text-gray-600">{wallColor}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main DesignerPage
// ─────────────────────────────────────────────────────────────────────────────
const DesignerPage = () => {
  const { id }         = useParams();
  const navigate       = useNavigate();
  const { currentProject, loadProject, saveProject, saving, updateObject, removeObject } = useProject();

  const [loading, setLoading]           = useState(true);
  const [selectedIdx, setSelectedIdx]   = useState(null);
  const [sidebarTab, setSidebarTab]     = useState('furniture');
  const [suggesting, setSuggesting]     = useState(false);
  const [showStyleModal, setShowStyleModal] = useState(false);
  const [projectName, setProjectName]   = useState('');

  useEffect(() => {
    if (id) loadProject(id).finally(() => setLoading(false));
    else setLoading(false);
  }, [id, loadProject]);

  useEffect(() => {
    if (currentProject?.name) setProjectName(currentProject.name);
  }, [currentProject?._id, currentProject?.name]);

  const handleObjectSelect = (idx) => {
    setSelectedIdx(idx);
    if (idx !== null) setSidebarTab('properties');
  };

  const handleSave = useCallback(async () => {
    await saveProject({ name: projectName || 'Untitled Room' });
  }, [saveProject, projectName]);

  const handleSaveAndNavigate = useCallback(async (path) => {
    await saveProject({ name: projectName || 'Untitled Room' });
    navigate(path);
  }, [saveProject, navigate, projectName]);

  const handleAISuggest = async (style) => {
    setShowStyleModal(false);
    setSuggesting(true);
    try {
      const { data } = await projectsAPI.suggest(id, style);
      if (window.confirm(
        `AI suggests ${data.suggestions.length} items for your ${style} room.\n\n` +
        `${data.tip}\n${data.sizeTip}\n\n` +
        `Estimated cost: $${data.cost.total}\n\nApply this layout?`
      )) {
        await saveProject({ objects: data.suggestions });
      }
    } catch (err) {
      console.error(err);
      alert('AI suggestion failed. Try again.');
    } finally { setSuggesting(false); }
  };

  // Loading state
  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="spinner-lg" />
    </div>
  );

  if (!currentProject) return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-4">
      <p className="text-gray-500">Project not found.</p>
      <button onClick={() => navigate('/dashboard')} className="btn-ghost text-sm">
        ← Back to dashboard
      </button>
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-gray-950 pt-16">

      {/* ── AI Style Modal ───────────────────────────────── */}
      {showStyleModal && (
        <StyleModal onSelect={handleAISuggest} onClose={() => setShowStyleModal(false)} />
      )}

      {/* ── Toolbar ──────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 h-11 border-b border-gray-800 bg-gray-950 shrink-0">

        {/* Left: name + save */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleSaveAndNavigate('/dashboard')}
            className="text-gray-600 hover:text-white transition-colors p-1"
            title="Back to dashboard"
          >
            {Icon.back}
          </button>
          <div className="w-px h-4 bg-gray-800" />
          <input
            className="bg-transparent text-white text-sm font-medium focus:outline-none
                       border-b border-transparent focus:border-gray-600 transition-colors
                       placeholder-gray-700 w-44"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="Untitled Room"
          />
          <button
            onClick={handleSave}
            disabled={saving}
            title="Save"
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg
                        border transition-all duration-150
                        ${saving
                          ? 'border-gray-800 text-gray-700 cursor-not-allowed'
                          : 'border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white'
                        }`}
          >
            {Icon.save}
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowStyleModal(true)}
            disabled={suggesting}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg
                       border border-gray-800 text-gray-500 hover:border-gray-600
                       hover:text-white transition-all duration-150"
          >
            {Icon.ai}
            {suggesting ? 'Thinking…' : 'AI Suggest'}
          </button>

          <button
            onClick={() => handleSaveAndNavigate(`/ar/${id}`)}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg
                       bg-white text-black font-medium hover:bg-gray-100
                       transition-all duration-150"
          >
            {Icon.ar}
            View in AR
          </button>
        </div>
      </div>

      {/* ── Main layout ─────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Left sidebar ──────────────────────────────── */}
        <div className="w-60 border-r border-gray-800 flex flex-col bg-gray-950 shrink-0">

          {/* Tab bar */}
          <div className="flex border-b border-gray-800 shrink-0">
            {['furniture', 'properties'].map((tab) => (
              <button
                key={tab}
                onClick={() => setSidebarTab(tab)}
                className={`flex-1 py-2.5 text-xs font-medium capitalize transition-colors
                            ${sidebarTab === tab
                              ? 'text-white border-b border-white'
                              : 'text-gray-700 hover:text-gray-400'
                            }`}
              >
                {tab}
                {tab === 'properties' && selectedIdx !== null && (
                  <span className="ml-1.5 w-1.5 h-1.5 rounded-full bg-white inline-block" />
                )}
              </button>
            ))}
          </div>

          {/* Panel content */}
          <div className="flex-1 overflow-hidden">
            {sidebarTab === 'furniture' ? (
              <FurniturePanel />
            ) : (
              <PropertiesPanel
                objects={currentProject.objects || []}
                selectedIndex={selectedIdx}
                onSelect={handleObjectSelect}
                updateObject={updateObject}
                removeObject={removeObject}
                onDeselect={() => { setSelectedIdx(null); setSidebarTab('furniture'); }}
              />
            )}
          </div>
        </div>

        {/* ── 3D Viewport ──────────────────────────────── */}
        <div className="flex-1 relative overflow-hidden">
          <SceneViewer
            project={currentProject}
            selectedIdx={selectedIdx}
            onSelect={handleObjectSelect}
            onUpdateObject={updateObject}
          />
          <RoomSettings project={currentProject} onSave={saveProject} />
        </div>
      </div>
    </div>
  );
};

export default DesignerPage;

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProject } from '../context/ProjectContext';
import FurniturePanel from '../components/FurniturePanel';
import SceneViewer from '../three/SceneViewer';
import { projectsAPI } from '../utils/api';

const DesignerPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentProject, loadProject, saveProject, saving, updateObject, removeObject } = useProject();
  const [loading, setLoading] = useState(true);
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [sidebarTab, setSidebarTab] = useState('furniture');
  const [suggesting, setSuggesting] = useState(false);
  const [showStyleModal, setShowStyleModal] = useState(false);
  const [projectName, setProjectName] = useState('');

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

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!currentProject) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-400">Project not found.</p>
    </div>
  );

  const selectedObject = selectedIdx !== null ? currentProject.objects?.[selectedIdx] : null;

  return (
    <div className="h-screen flex flex-col bg-surface pt-16">
      {/* Style Modal */}
      {showStyleModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center px-4">
          <div className="card w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Select Room Style</h3>
              <button onClick={() => setShowStyleModal(false)} className="text-gray-500 hover:text-white text-lg">✕</button>
            </div>
            <p className="text-gray-400 text-xs mb-4">AI will suggest furniture placement based on your room type.</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { style: 'living',   emoji: '🛋️', label: 'Living Room' },
                { style: 'bedroom',  emoji: '🛏️', label: 'Bedroom' },
                { style: 'office',   emoji: '💼', label: 'Office' },
                { style: 'dining',   emoji: '🍽️', label: 'Dining Room' },
                { style: 'kitchen',  emoji: '🍳', label: 'Kitchen' },
                { style: 'bathroom', emoji: '🚿', label: 'Bathroom' },
              ].map(({ style, emoji, label }) => (
                <button
                  key={style}
                  onClick={() => handleAISuggest(style)}
                  className="card hover:border-brand-500 flex flex-col items-center gap-2 py-4 cursor-pointer transition-all"
                >
                  <span className="text-2xl">{emoji}</span>
                  <span className="text-white text-xs font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 h-12 border-b border-border bg-panel shrink-0">
        <div className="flex items-center gap-3">
          <input
            className="bg-transparent text-white font-medium text-sm focus:outline-none border-b border-transparent focus:border-brand-500 transition-colors w-40"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="Untitled Room"
          />
          <button
            onClick={handleSave}
            disabled={saving}
            className={`text-xs px-3 py-1 rounded-lg transition-all ${
              saving
                ? 'bg-yellow-500/10 text-yellow-400 cursor-not-allowed'
                : 'bg-brand-500/10 hover:bg-brand-500/20 text-brand-500 border border-brand-500/30'
            }`}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowStyleModal(true)}
            disabled={suggesting}
            className="btn-ghost text-xs px-3 py-1.5 flex items-center gap-1"
          >
            👾 {suggesting ? 'Thinking…' : 'AI Suggest'}
          </button>
          <button onClick={() => handleSaveAndNavigate(`/ar/${id}`)}
            className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1">
            📱 AR View
          </button>
          <button onClick={() => handleSaveAndNavigate('/dashboard')}
            className="btn-ghost text-xs px-3 py-1.5">
            ← Back
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar */}
        <div className="w-64 border-r border-border flex flex-col bg-panel shrink-0">
          <div className="flex border-b border-border">
            {['furniture', 'properties'].map((tab) => (
              <button key={tab} onClick={() => setSidebarTab(tab)}
                className={`flex-1 py-2 text-xs font-medium capitalize transition-colors ${
                  sidebarTab === tab ? 'text-brand-500 border-b-2 border-brand-500' : 'text-gray-400 hover:text-white'
                }`}>
                {tab}
              </button>
            ))}
          </div>
          {sidebarTab === 'furniture'
            ? <FurniturePanel />
            : <PropertiesPanel
                object={selectedObject}
                index={selectedIdx}
                updateObject={updateObject}
                removeObject={removeObject}
                onDeselect={() => { setSelectedIdx(null); setSidebarTab('furniture'); }}
              />
          }
        </div>

        {/* 3D Viewport */}
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

// --- Properties Panel ---
const PropertiesPanel = ({ object, index, updateObject, removeObject, onDeselect }) => {
  if (!object) return (
    <div className="flex-1 flex items-center justify-center p-6 text-center">
      <p className="text-gray-500 text-sm">Select a furniture item in the 3D view to edit its properties.</p>
    </div>
  );

  const update = (key, subKey, val) =>
    updateObject(index, { [key]: { ...object[key], [subKey]: parseFloat(val) || 0 } });

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-medium text-sm">{object.name}</h3>
        <button onClick={onDeselect} className="text-gray-500 hover:text-white text-xs">✕</button>
      </div>

      {[
        { label: 'Position', key: 'position', axes: ['x','y','z'], step: 0.1 },
        { label: 'Rotation (rad)', key: 'rotation', axes: ['x','y','z'], step: 0.1 },
        { label: 'Scale', key: 'scale', axes: ['x','y','z'], step: 0.05, min: 0.1 },
      ].map(({ label, key, axes, step, min }) => (
        <div key={key}>
          <p className="text-xs text-gray-400 font-medium mb-2">{label}</p>
          <div className="grid grid-cols-3 gap-1">
            {axes.map((axis) => (
              <div key={axis}>
                <label className="text-xs text-gray-600 uppercase">{axis}</label>
                <input type="number" step={step} min={min} className="input text-xs py-1"
                  value={object[key]?.[axis] ?? 0}
                  onChange={(e) => update(key, axis, e.target.value)} />
              </div>
            ))}
          </div>
        </div>
      ))}

      <div>
        <p className="text-xs text-gray-400 font-medium mb-2">Color</p>
        <input type="color" value={object.color || '#cccccc'}
          onChange={(e) => updateObject(index, { color: e.target.value })}
          className="w-full h-9 rounded-lg cursor-pointer bg-surface border border-border" />
      </div>

      <button onClick={() => { removeObject(index); onDeselect(); }}
        className="w-full py-2 text-xs text-red-400 border border-red-500/30 hover:bg-red-500/10 rounded-lg transition-colors">
        🗑 Remove from room
      </button>
    </div>
  );
};

// --- Room Settings ---
const RoomSettings = ({ project, onSave }) => {
  const [open, setOpen] = useState(false);
  const [dim, setDim] = useState(project?.roomDimensions || { width: 5, length: 5, height: 2.8 });
  const [wallColor, setWallColor] = useState(project?.wallColor || '#f5f5f0');
  const initialized = useRef(false);

  useEffect(() => {
    if (project?._id && !initialized.current) {
      initialized.current = true;
      setDim(project.roomDimensions || { width: 5, length: 5, height: 2.8 });
      setWallColor(project.wallColor || '#f5f5f0');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?._id, project?.roomDimensions, project?.wallColor]);

  const handleDimChange = (key, val) => {
    // Allow empty string while typing — don't save yet
    setDim((prev) => ({ ...prev, [key]: val }));
  };

  const handleDimBlur = (key, val) => {
    // On blur, parse and save — fallback to 1 if empty/invalid
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
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  max="30"
                  className="input text-xs py-1 w-20"
                  value={dim[key] ?? ''}
                  onChange={(e) => handleDimChange(key, e.target.value)}
                  onBlur={(e) => handleDimBlur(key, e.target.value)}
                />
              </div>
            ))}
          </div>
          <div className="mt-3">
            <label className="text-xs text-gray-400 block mb-1">Wall Color</label>
            <input type="color" value={wallColor}
              onChange={(e) => handleColorChange(e.target.value)}
              className="w-full h-8 rounded cursor-pointer border border-border" />
          </div>
        </div>
      )}
    </div>
  );
};

export default DesignerPage;
import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProject } from '../context/ProjectContext';

const ARViewerPage = () => {
  const { id } = useParams();
  const { currentProject, loadProject } = useProject();
  const navigate = useNavigate();
  const [arSupported, setArSupported] = useState(null);
  const [loading, setLoading] = useState(true);
  const [arActive, setArActive] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (id && !currentProject) loadProject(id).finally(() => setLoading(false));
    else setLoading(false);

    if (navigator.xr) {
      navigator.xr.isSessionSupported('immersive-ar').then(setArSupported).catch(() => setArSupported(false));
    } else {
      setArSupported(false);
    }
  }, [id, currentProject, loadProject]);

  const startAR = async () => {
    if (!navigator.xr || !arSupported) return;
    try {
      const session = await navigator.xr.requestSession('immersive-ar', {
        requiredFeatures: ['hit-test', 'dom-overlay'],
        domOverlay: { root: containerRef.current },
      });
      setArActive(true);
      // AR session handling — integrate with Three.js WebXRManager here
      session.addEventListener('end', () => setArActive(false));
    } catch (err) {
      console.error('AR session failed:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-700 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="min-h-screen flex flex-col items-center justify-center px-4 pt-20">
      <div className="max-w-md w-full text-center">
        <div className="text-6xl mb-6">📱</div>
        <h1 className="font-display text-3xl font-bold text-white mb-3">AR Preview</h1>
        <p className="text-gray-400 text-sm mb-8">
          Use your device camera to place furniture from{' '}
          <span className="text-white font-medium">{currentProject?.name}</span> into your real environment.
        </p>

        {arSupported === false && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl mb-6">
            ⚠️ AR is not supported on this device or browser. Use Chrome on an ARCore-compatible Android, or Safari on iOS 15+ with a WebXR polyfill.
          </div>
        )}

        {arSupported === null && (
          <div className="text-gray-500 text-sm mb-6">Checking AR support…</div>
        )}

        <div className="space-y-3">
          {arSupported && (
            <button onClick={startAR} disabled={arActive} className="btn-primary w-full py-3 text-base">
              {arActive ? '📸 AR Session Active' : '🚀 Launch AR'}
            </button>
          )}
          <button onClick={() => navigate(`/designer/${id}`)} className="btn-ghost w-full py-3">
            ← Back to Designer
          </button>
        </div>

        {/* Object list */}
        {currentProject?.objects?.length > 0 && (
          <div className="mt-8 card text-left">
            <h3 className="text-white font-medium text-sm mb-3">Objects in this room ({currentProject.objects.length})</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {currentProject.objects.map((obj, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-gray-400">
                  <div className="w-2 h-2 rounded-full bg-white/40 shrink-0" />
                  {obj.name}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default ARViewerPage;

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { projectsAPI, housesAPI } from '../utils/api';

/* ─────────────────────────────────────────────────────────────────────
   ARViewerPage

   Supports two sources:
     /ar/:id                      → standalone project (room designer)
     /ar/:id?source=room          → house room sub-document

   Features:
     - Loads all designed furniture from the room/project
     - "Place all" — places entire designed layout at the reticle as a group
     - Per-item placement from the object list
     - Tap any placed model to move it
     - Remove last / clear all
     - Exit AR
     - No emojis anywhere
───────────────────────────────────────────────────────────────────── */

/* SVG icon components — keeps the file self-contained */
const Icon = {
  Place: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
      <circle cx="12" cy="9" r="2.5"/>
    </svg>
  ),
  Undo: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 14L4 9l5-5"/>
      <path d="M4 9h10.5a5.5 5.5 0 010 11H11"/>
    </svg>
  ),
  Clear: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14H6L5 6"/>
      <path d="M10 11v6M14 11v6M9 6V4h6v2"/>
    </svg>
  ),
  Exit: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  PlaceAll: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <path d="M3 9h18M9 21V9"/>
    </svg>
  ),
  Back: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M19 12H5M12 5l-7 7 7 7"/>
    </svg>
  ),
  Check: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
};

/* ── Load a GLB model, auto-scale to targetSize metres ───────────── */
function loadModel(url, targetSize = 0.5) {
  return new Promise((resolve) => {
    const loader = new GLTFLoader();
    const resolvedUrl = url?.replace('/assets/models/', '/models/') || '';
    loader.load(
      resolvedUrl,
      (gltf) => {
        const model = gltf.scene;
        const box   = new THREE.Box3().setFromObject(model);
        const size  = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        if (maxDim > 0) model.scale.setScalar(targetSize / maxDim);
        resolve(model);
      },
      undefined,
      () => {
        /* Fallback box */
        const mesh = new THREE.Mesh(
          new THREE.BoxGeometry(0.3, 0.3, 0.3),
          new THREE.MeshStandardMaterial({ color: 0x888888 })
        );
        resolve(mesh);
      }
    );
  });
}

/* ═══════════════════════════════════════════════════════════════════ */

const ARViewerPage = () => {
  const { id }               = useParams();
  const [searchParams]       = useSearchParams();
  const navigate             = useNavigate();
  const isRoomSource         = searchParams.get('source') === 'room';

  /* State */
  const [loading,       setLoading]       = useState(true);
  const [loadError,     setLoadError]     = useState('');
  const [arSupported,   setArSupported]   = useState(null);
  const [arActive,      setArActive]      = useState(false);
  const [surfaceFound,  setSurfaceFound]  = useState(false);
  const [objects,       setObjects]       = useState([]);   // from project/room
  const [selectedIdx,   setSelectedIdx]   = useState(0);
  const [placedCount,   setPlacedCount]   = useState(0);
  const [statusMsg,     setStatusMsg]     = useState('Move your camera slowly to detect a surface');

  /* Refs */
  const canvasRef         = useRef(null);
  const overlayRef        = useRef(null);
  const rendererRef       = useRef(null);
  const sceneRef          = useRef(null);
  const reticleRef        = useRef(null);
  const hitTestSourceRef  = useRef(null);
  const localSpaceRef     = useRef(null);
  const placedRef         = useRef([]);         // { mesh, name }[]
  const selectedUrlRef    = useRef('');
  const surfaceRef        = useRef(false);

  /* ── Check WebXR support ──────────────────────────────────────── */
  useEffect(() => {
    navigator.xr
      ?.isSessionSupported('immersive-ar')
      .then(setArSupported)
      .catch(() => setArSupported(false))
      ?? setArSupported(false);
  }, []);

  /* ── Load room / project data ─────────────────────────────────── */
  useEffect(() => {
    const load = async () => {
      try {
        let objs = [];
        if (isRoomSource) {
          const { data } = await housesAPI.getRoom(id);
          objs = data.room?.objects ?? [];
        } else {
          const { data } = await projectsAPI.get(id);
          objs = data.project?.objects ?? [];
        }
        setObjects(objs);
        if (objs.length > 0) selectedUrlRef.current = objs[0].modelUrl;
      } catch (err) {
        setLoadError(err.response?.data?.message || 'Failed to load room data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, isRoomSource]);

  /* ── Build Three.js scene (called once, before AR session) ───── */
  const buildScene = useCallback(() => {
    if (rendererRef.current) return rendererRef.current;

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      alpha:    true,
      antialias: true,
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    scene.add(new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1.2));
    const dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(1, 2, 1);
    scene.add(dir);

    /* Reticle ring */
    const reticle = new THREE.Mesh(
      new THREE.RingGeometry(0.08, 0.11, 32).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0xe8d5b7, side: THREE.DoubleSide })
    );
    reticle.matrixAutoUpdate = false;
    reticle.visible = false;
    scene.add(reticle);
    reticleRef.current = reticle;

    return renderer;
  }, []);

  /* ── Place a single object at the current reticle ─────────────── */
  const placeObject = useCallback(async (url, name = '') => {
    const reticle = reticleRef.current;
    if (!reticle?.visible) {
      setStatusMsg('No surface detected — move camera to find a flat surface');
      return;
    }

    const pos  = new THREE.Vector3();
    const quat = new THREE.Quaternion();
    const sc   = new THREE.Vector3();
    reticle.matrix.decompose(pos, quat, sc);

    const model = await loadModel(url);
    model.position.copy(pos);
    model.quaternion.copy(quat);
    sceneRef.current.add(model);

    placedRef.current.push({ mesh: model, name: name || 'Object' });
    setPlacedCount(placedRef.current.length);
    setStatusMsg(`Placed: ${name || 'Object'}`);
  }, []);

  /* ── Place the entire designed layout as a group ──────────────── */
  const placeAll = useCallback(async () => {
    const reticle = reticleRef.current;
    if (!reticle?.visible || objects.length === 0) return;

    const origin  = new THREE.Vector3();
    const quat    = new THREE.Quaternion();
    const sc      = new THREE.Vector3();
    reticle.matrix.decompose(origin, quat, sc);

    setStatusMsg('Placing room layout...');

    /* Load all models in parallel */
    const models = await Promise.all(
      objects.map(obj => loadModel(obj.modelUrl, 0.4))
    );

    models.forEach((model, i) => {
      const obj = objects[i];
      /* Scale the stored position (which is in metres) to AR world units */
      const offset = new THREE.Vector3(
        (obj.position?.x ?? 0) * 0.1,
        (obj.position?.y ?? 0) * 0.1,
        (obj.position?.z ?? 0) * 0.1
      );
      model.position.copy(origin).add(offset);
      model.quaternion.copy(quat);
      sceneRef.current.add(model);
      placedRef.current.push({ mesh: model, name: obj.name });
    });

    setPlacedCount(placedRef.current.length);
    setStatusMsg(`Placed ${models.length} items from your room design`);
  }, [objects]);

  /* ── Remove last placed object ─────────────────────────────────── */
  const removeLast = useCallback(() => {
    const last = placedRef.current.pop();
    if (last) {
      sceneRef.current.remove(last.mesh);
      setPlacedCount(placedRef.current.length);
      setStatusMsg('Removed last placed item');
    }
  }, []);

  /* ── Clear all placed objects ─────────────────────────────────── */
  const clearAll = useCallback(() => {
    placedRef.current.forEach(p => sceneRef.current.remove(p.mesh));
    placedRef.current = [];
    setPlacedCount(0);
    setStatusMsg('Cleared all items');
  }, []);

  /* ── Start the WebXR AR session ───────────────────────────────── */
  const startAR = useCallback(async () => {
    const renderer = buildScene();
    try {
      const session = await navigator.xr.requestSession('immersive-ar', {
        requiredFeatures: ['hit-test'],
        optionalFeatures: ['dom-overlay', 'local-floor'],
        domOverlay: { root: overlayRef.current },
      });

      renderer.xr.setSession(session);
      setArActive(true);

      const viewerSpace = await session.requestReferenceSpace('viewer');
      hitTestSourceRef.current = await session.requestHitTestSource({ space: viewerSpace });

      /* Prefer local-floor, fall back to local */
      try {
        localSpaceRef.current = await session.requestReferenceSpace('local-floor');
      } catch {
        localSpaceRef.current = await session.requestReferenceSpace('local');
      }

      renderer.setAnimationLoop((_t, frame) => {
        if (!frame) return;

        const hits = frame.getHitTestResults(hitTestSourceRef.current);
        if (hits.length > 0) {
          const pose = hits[0].getPose(localSpaceRef.current);
          if (pose) {
            reticleRef.current.visible = true;
            reticleRef.current.matrix.fromArray(pose.transform.matrix);
            if (!surfaceRef.current) {
              surfaceRef.current = true;
              setSurfaceFound(true);
              setStatusMsg('Surface detected — tap Place to add furniture');
            }
          }
        } else {
          reticleRef.current.visible = false;
          surfaceRef.current = false;
          setSurfaceFound(false);
        }

        renderer.render(sceneRef.current, renderer.xr.getCamera());
      });

      session.addEventListener('end', () => {
        renderer.setAnimationLoop(null);
        hitTestSourceRef.current = null;
        localSpaceRef.current    = null;
        placedRef.current        = [];
        surfaceRef.current       = false;
        setArActive(false);
        setSurfaceFound(false);
        setPlacedCount(0);
      });
    } catch (err) {
      console.error('AR session error:', err);
      setStatusMsg(`AR failed: ${err.message}`);
    }
  }, [buildScene]);

  const exitAR = useCallback(() => {
    rendererRef.current?.xr?.getSession()?.end();
  }, []);

  /* ── Render ───────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="spinner-lg" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4 px-6">
        <p className="text-red-400 text-sm text-center">{loadError}</p>
        <button onClick={() => navigate(-1)} className="btn-ghost text-sm">Go back</button>
      </div>
    );
  }

  return (
    <>
      {/* Three.js canvas — full screen, behind overlay */}
      <canvas ref={canvasRef} className="fixed inset-0 w-full h-full z-0" />

      {/* DOM overlay — all interactive UI */}
      <div
        ref={overlayRef}
        className="fixed inset-0 z-10 overflow-y-auto touch-pan-y"
      >

        {/* ── Pre-AR screen ────────────────────────────────────── */}
        {!arActive && (
          <div className="min-h-screen flex flex-col bg-black">

            {/* Header */}
            <div className="flex items-center gap-3 px-5 pt-16 pb-4">
              <button onClick={() => navigate(-1)}
                className="w-9 h-9 flex items-center justify-center rounded-xl
                           bg-gray-900 border border-gray-800 text-gray-400 hover:text-white transition-colors">
                <Icon.Back />
              </button>
              <div>
                <h1 className="text-white font-semibold text-base">AR Viewer</h1>
                <p className="text-gray-500 text-xs">
                  {objects.length} item{objects.length !== 1 ? 's' : ''} in this room
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 pb-6">

              {/* Object list preview */}
              {objects.length > 0 ? (
                <div className="space-y-2 mb-6">
                  <p className="text-gray-600 text-xs font-mono uppercase tracking-wider mb-3">
                    Room furniture
                  </p>
                  {objects.map((obj, i) => (
                    <div key={i}
                      className="flex items-center gap-3 bg-gray-900 border border-gray-800
                                 rounded-xl px-4 py-3">
                      <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center shrink-0">
                        {obj.thumbnailUrl
                          ? <img src={obj.thumbnailUrl} alt={obj.name} className="w-full h-full object-cover rounded-lg"/>
                          : <div className="w-3 h-3 rounded-sm bg-gray-600"/>
                        }
                      </div>
                      <span className="text-white text-sm truncate">{obj.name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-center mb-6">
                  <p className="text-gray-600 text-sm">No furniture in this room yet.</p>
                  <p className="text-gray-700 text-xs mt-1">Add furniture in the designer first.</p>
                </div>
              )}

              {/* Instructions */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-6 space-y-3">
                <p className="text-white text-sm font-medium">How to use AR</p>
                {[
                  ['Point your camera at a flat floor or table surface'],
                  ['Wait for the gold ring to appear'],
                  ['Tap "Place all" to place your entire room layout, or choose items one by one'],
                  ['Tap "Undo" to remove the last item, "Clear" to start over'],
                ].map(([t], i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="text-gray-600 font-mono text-xs mt-0.5 shrink-0">0{i + 1}</span>
                    <p className="text-gray-400 text-xs leading-relaxed">{t}</p>
                  </div>
                ))}
              </div>

              {/* AR support warning */}
              {arSupported === false && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl px-5 py-4 mb-6">
                  <p className="text-red-400 text-sm font-medium">AR not supported</p>
                  <p className="text-red-400/70 text-xs mt-1">
                    This device does not support WebXR Augmented Reality.
                    Use Chrome on Android or the WebXR viewer on iOS.
                  </p>
                </div>
              )}

              {/* Start button */}
              {arSupported !== false && (
                <button onClick={startAR}
                  className="w-full bg-white text-black font-semibold text-sm py-3.5 rounded-2xl
                             hover:bg-gray-100 active:scale-[0.98] transition-all">
                  Start AR Experience
                </button>
              )}
              {arSupported === null && (
                <p className="text-center text-gray-600 text-xs mt-3">Checking AR support...</p>
              )}
            </div>
          </div>
        )}

        {/* ── Active AR overlay ─────────────────────────────────── */}
        {arActive && (
          <>
            {/* Status bar */}
            <div className="absolute top-10 left-1/2 -translate-x-1/2 w-max max-w-[80vw]">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm backdrop-blur-md
                               border transition-colors duration-300
                               ${surfaceFound
                                 ? 'bg-black/50 border-white/15 text-white'
                                 : 'bg-black/50 border-white/10 text-gray-400'
                               }`}>
                <span className={`w-2 h-2 rounded-full shrink-0 transition-colors
                  ${surfaceFound ? 'bg-green-400 animate-pulse' : 'bg-gray-600'}`}/>
                <span className="text-xs leading-tight text-center">{statusMsg}</span>
              </div>
            </div>

            {/* Placed count badge */}
            {placedCount > 0 && (
              <div className="absolute top-10 right-5 bg-black/60 backdrop-blur-sm
                              border border-white/10 rounded-xl px-3 py-2">
                <span className="text-white text-xs font-mono">{placedCount} placed</span>
              </div>
            )}

            {/* Centre crosshair */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative w-10 h-10">
                <div className="absolute inset-0 rounded-full border border-white/30"/>
                <div className="absolute top-1/2 left-1/2 w-1.5 h-1.5 -translate-x-1/2 -translate-y-1/2
                                rounded-full bg-white/70"/>
              </div>
            </div>

            {/* Object selector */}
            {objects.length > 0 && (
              <div className="absolute bottom-36 left-0 right-0 px-4">
                <div className="flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden">
                  {/* Place all button */}
                  <button
                    onClick={placeAll}
                    disabled={!surfaceFound}
                    className="shrink-0 flex flex-col items-center gap-1.5 px-4 py-3 rounded-2xl
                               bg-white text-black text-xs font-semibold border border-white
                               disabled:opacity-40 disabled:cursor-not-allowed min-w-[80px]">
                    <Icon.PlaceAll />
                    All
                  </button>

                  {/* Individual items */}
                  {objects.map((obj, i) => (
                    <button key={i}
                      onClick={() => {
                        setSelectedIdx(i);
                        selectedUrlRef.current = obj.modelUrl;
                      }}
                      className={`shrink-0 flex flex-col items-center gap-1.5 px-4 py-3 rounded-2xl
                                  text-xs font-medium border transition-all min-w-[80px]
                                  ${selectedIdx === i
                                    ? 'bg-white/20 border-white/60 text-white'
                                    : 'bg-black/40 border-white/15 text-gray-300 backdrop-blur-md'
                                  }`}>
                      {selectedIdx === i && <Icon.Check />}
                      <span className="truncate max-w-[64px] text-center">{obj.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Control bar */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
              <div className="flex items-center gap-3 bg-black/60 backdrop-blur-xl
                              border border-white/15 rounded-2xl px-5 py-3 shadow-2xl">

                {/* Place selected */}
                <button
                  onClick={() => placeObject(selectedUrlRef.current, objects[selectedIdx]?.name)}
                  disabled={!surfaceFound}
                  title="Place selected item"
                  className="flex flex-col items-center gap-1 px-4 py-2.5 rounded-xl
                             bg-white text-black text-xs font-semibold
                             disabled:opacity-40 disabled:cursor-not-allowed
                             hover:bg-gray-100 active:scale-[0.96] transition-all">
                  <Icon.Place />
                  Place
                </button>

                <div className="w-px h-8 bg-white/10"/>

                {/* Undo */}
                <button
                  onClick={removeLast}
                  disabled={placedCount === 0}
                  title="Remove last placed item"
                  className="flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl
                             bg-white/10 border border-white/10 text-white text-xs
                             disabled:opacity-30 hover:bg-white/20 active:scale-[0.96] transition-all">
                  <Icon.Undo />
                  Undo
                </button>

                {/* Clear */}
                <button
                  onClick={clearAll}
                  disabled={placedCount === 0}
                  title="Clear all placed items"
                  className="flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl
                             bg-white/10 border border-white/10 text-white text-xs
                             disabled:opacity-30 hover:bg-white/20 active:scale-[0.96] transition-all">
                  <Icon.Clear />
                  Clear
                </button>

                <div className="w-px h-8 bg-white/10"/>

                {/* Exit */}
                <button
                  onClick={exitAR}
                  title="Exit AR"
                  className="flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl
                             bg-white/10 border border-white/10 text-gray-300 text-xs
                             hover:bg-red-500/20 hover:border-red-500/30 hover:text-red-300
                             active:scale-[0.96] transition-all">
                  <Icon.Exit />
                  Exit
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default ARViewerPage;

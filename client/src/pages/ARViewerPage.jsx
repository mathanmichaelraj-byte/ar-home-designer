import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProject } from '../context/ProjectContext';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

const ARViewerPage = () => {
  const { id } = useParams();
  const { currentProject, loadProject } = useProject();
  const navigate = useNavigate();

  const [arSupported, setArSupported] = useState(null);
  const [loading, setLoading] = useState(true);
  const [arActive, setArActive] = useState(false);
  const [status, setStatus] = useState('');
  const [selectedObjIdx, setSelectedObjIdx] = useState(0);

  // DOM refs
  const overlayRef = useRef(null);   // dom-overlay root (the HUD)
  const canvasRef = useRef(null);    // Three.js renders here

  // Three.js / XR refs (never trigger re-renders)
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const reticleRef = useRef(null);
  const hitSourceRef = useRef(null);
  const hitSourceRequestedRef = useRef(false);
  const placedRef = useRef([]);
  const selectedUrlRef = useRef(null);

  /* ── bootstrap ─────────────────────────────────────── */
  useEffect(() => {
    const init = async () => {
      if (id && !currentProject) await loadProject(id).catch(() => {});
      setLoading(false);
    };
    init();

    if (navigator.xr) {
      navigator.xr
        .isSessionSupported('immersive-ar')
        .then(setArSupported)
        .catch(() => setArSupported(false));
    } else {
      setArSupported(false);
    }
  }, [id]); // eslint-disable-line

  /* ── build Three.js scene ───────────────────────────── */
  const buildScene = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || rendererRef.current) return rendererRef.current;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Lights
    scene.add(new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1.2));
    const dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(1, 2, 1);
    scene.add(dir);

    // Reticle — gold ring shown when a surface is detected
    const geo = new THREE.RingGeometry(0.08, 0.1, 32).rotateX(-Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({ color: 0xe8d5b7, side: THREE.DoubleSide });
    const reticle = new THREE.Mesh(geo, mat);
    reticle.visible = false;
    reticle.matrixAutoUpdate = false;
    scene.add(reticle);
    reticleRef.current = reticle;

    return renderer;
  }, []);

  /* ── place a model at the reticle position ──────────── */
  const placeModel = useCallback((url) => {
    const scene = sceneRef.current;
    const reticle = reticleRef.current;
    if (!scene || !reticle || !reticle.visible) return;

    const position = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();
    const scale = new THREE.Vector3();
    reticle.matrix.decompose(position, quaternion, scale);

    const loader = new GLTFLoader();
    loader.load(
      url,
      (gltf) => {
        const model = gltf.scene;
        model.position.copy(position);
        model.quaternion.copy(quaternion);

        // Auto-scale: normalise to ~0.5 m tall
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        if (maxDim > 0) model.scale.setScalar(0.5 / maxDim);

        scene.add(model);
        placedRef.current.push(model);
        setStatus('Placed! Tap again to add another.');
      },
      undefined,
      () => {
        // Fallback box if model fails to load
        const mesh = new THREE.Mesh(
          new THREE.BoxGeometry(0.3, 0.4, 0.3),
          new THREE.MeshStandardMaterial({ color: 0xe8d5b7, roughness: 0.6 })
        );
        mesh.position.copy(position);
        mesh.position.y += 0.2;
        scene.add(mesh);
        placedRef.current.push(mesh);
        setStatus('Placed (fallback box — check model URL).');
      }
    );
  }, []);

  /* ── launch WebXR session ───────────────────────────── */
  const startAR = async () => {
    if (!navigator.xr || !arSupported) return;

    const renderer = buildScene();
    if (!renderer) return;

    try {
      const sessionInit = {
        requiredFeatures: ['hit-test'],
        optionalFeatures: ['dom-overlay'],
      };
      if (overlayRef.current) {
        sessionInit.optionalFeatures.push('dom-overlay');
        sessionInit.domOverlay = { root: overlayRef.current };
      }

      const session = await navigator.xr.requestSession('immersive-ar', sessionInit);

      // 🔑 Critical: hand the session to Three.js
      await renderer.xr.setSession(session);
      setArActive(true);
      setStatus('Slowly pan your camera to detect surfaces…');

      // Set the model URL from the first selected object
      const objs = currentProject?.objects ?? [];
      if (objs.length > 0) {
        const obj = objs[selectedObjIdx] ?? objs[0];
        selectedUrlRef.current = obj.modelUrl
          ?? `/models/${(obj.name ?? 'box').toLowerCase().replace(/\s+/g, '_')}.glb`;
      }

      // Tap → place
      session.addEventListener('select', () => {
        if (selectedUrlRef.current) placeModel(selectedUrlRef.current);
      });

      // 🔑 Critical: the render + hit-test loop
      renderer.setAnimationLoop((_, frame) => {
        if (!frame) return;

        const refSpace = renderer.xr.getReferenceSpace();
        const xrSession = renderer.xr.getSession();

        // Request hit-test source once per session
        if (!hitSourceRequestedRef.current) {
          hitSourceRequestedRef.current = true;
          xrSession
            .requestReferenceSpace('viewer')
            .then((viewerSpace) =>
              xrSession.requestHitTestSource({ space: viewerSpace })
            )
            .then((source) => {
              hitSourceRef.current = source;
              setStatus('Surface detected! Tap to place furniture.');
            })
            .catch(() => setStatus('Hit-test unavailable on this device.'));
        }

        // Update reticle from hit results
        if (hitSourceRef.current) {
          const hits = frame.getHitTestResults(hitSourceRef.current);
          if (hits.length > 0) {
            const pose = hits[0].getPose(refSpace);
            reticleRef.current.visible = true;
            reticleRef.current.matrix.fromArray(pose.transform.matrix);
          } else {
            reticleRef.current.visible = false;
          }
        }

        renderer.render(sceneRef.current, renderer.xr.getCamera());
      });

      session.addEventListener('end', () => {
        renderer.setAnimationLoop(null);
        hitSourceRef.current = null;
        hitSourceRequestedRef.current = false;
        placedRef.current = [];
        setArActive(false);
        setStatus('');
      });
    } catch (err) {
      console.error('AR session error:', err);
      setStatus(`Could not start AR: ${err.message}`);
    }
  };

  const clearPlaced = () => {
    placedRef.current.forEach((m) => sceneRef.current?.remove(m));
    placedRef.current = [];
    setStatus('Cleared. Tap to place again.');
  };

  /* ── render ─────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="w-8 h-8 border-2 border-gray-700 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  const objects = currentProject?.objects ?? [];

  return (
    <>
      {/* Three.js draws here — covers full screen when AR is active */}
      <canvas
        ref={canvasRef}
        className={arActive ? 'fixed inset-0 w-full h-full z-0' : 'hidden'}
      />

      {/* HUD overlay — dom-overlay root */}
      <div
        ref={overlayRef}
        className={`${arActive ? 'fixed inset-0 z-10 pointer-events-none' : 'min-h-screen flex flex-col items-center justify-center px-4 pt-20'}`}
      >
        {!arActive ? (
          /* ── Pre-AR landing ── */
          <div className="max-w-md w-full text-center">
            <div className="text-6xl mb-6">📱</div>
            <h1 className="font-display text-3xl font-bold text-white mb-3">AR Preview</h1>
            <p className="text-gray-400 text-sm mb-6">
              Place furniture from{' '}
              <span className="text-white font-medium">{currentProject?.name ?? 'your room'}</span>{' '}
              into your real environment.
            </p>

            {arSupported === false && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl mb-6">
                ⚠️ AR not supported. Use Chrome on an ARCore Android device, or Safari on iOS 15+ with a WebXR viewer.
              </div>
            )}
            {arSupported === null && (
              <p className="text-gray-500 text-sm mb-6">Checking AR support…</p>
            )}

            {/* Object picker */}
            {objects.length > 0 && (
              <div className="card mb-6 text-left">
                <h3 className="text-white text-sm font-medium mb-3">Select object to place</h3>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {objects.map((obj, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedObjIdx(i)}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition pointer-events-auto
                        ${selectedObjIdx === i ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                      <div className={`w-2 h-2 rounded-full shrink-0 ${selectedObjIdx === i ? 'bg-amber-300' : 'bg-white/30'}`} />
                      {obj.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-3">
              {arSupported && (
                <button onClick={startAR} className="btn-primary w-full py-3 text-base pointer-events-auto">
                  🚀 Launch AR
                </button>
              )}
              <button onClick={() => navigate(`/designer/${id}`)} className="btn-ghost w-full py-3 pointer-events-auto">
                ← Back to Designer
              </button>
            </div>
          </div>
        ) : (
          /* ── In-AR HUD ── */
          <>
            {/* Status bar */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-4 py-2 rounded-full pointer-events-none">
              {status}
            </div>

            {/* Object switcher (bottom) */}
            {objects.length > 1 && (
              <div className="absolute bottom-24 left-0 right-0 flex justify-center gap-2 px-4 pointer-events-auto">
                {objects.map((obj, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setSelectedObjIdx(i);
                      const url = obj.modelUrl
                        ?? `/models/${(obj.name ?? 'box').toLowerCase().replace(/\s+/g, '_')}.glb`;
                      selectedUrlRef.current = url;
                      setStatus(`Selected: ${obj.name}`);
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition
                      ${selectedObjIdx === i ? 'bg-amber-300 text-black' : 'bg-black/60 text-white'}`}
                  >
                    {obj.name}
                  </button>
                ))}
              </div>
            )}

            {/* Action buttons */}
            <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-3 px-4 pointer-events-auto">
              <button
                onClick={clearPlaced}
                className="bg-black/60 text-white text-sm px-5 py-2.5 rounded-full"
              >
                🗑 Clear
              </button>
              <button
                onClick={() => rendererRef.current?.xr?.getSession()?.end()}
                className="bg-white text-black text-sm font-medium px-5 py-2.5 rounded-full"
              >
                ✕ Exit AR
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default ARViewerPage;
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

  const overlayRef = useRef(null);
  const canvasRef = useRef(null);

  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const reticleRef = useRef(null);
  const hitSourceRef = useRef(null);
  const hitSourceRequestedRef = useRef(false);
  const placedRef = useRef([]);
  const selectedUrlRef = useRef(null);

  /* ───────── Bootstrap ───────── */

  useEffect(() => {
    const init = async () => {
      if (id && !currentProject) {
        await loadProject(id).catch(() => {});
      }
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
  }, [id]);

  /* ───────── Scene Builder ───────── */

  const buildScene = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || rendererRef.current) return rendererRef.current;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true
    });

    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;

    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    scene.background = null;
    sceneRef.current = scene;

    /* Lights */

    scene.add(new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1.2));

    const dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(1, 2, 1);
    scene.add(dir);

    /* Reticle */

    const geo = new THREE.RingGeometry(0.08, 0.1, 32)
      .rotateX(-Math.PI / 2);

    const mat = new THREE.MeshBasicMaterial({
      color: 0xe8d5b7,
      side: THREE.DoubleSide
    });

    const reticle = new THREE.Mesh(geo, mat);
    reticle.visible = false;
    reticle.matrixAutoUpdate = false;

    scene.add(reticle);
    reticleRef.current = reticle;

    return renderer;
  }, []);

  /* ───────── Place Model ───────── */

  const placeModel = useCallback((url) => {

    const scene = sceneRef.current;
    const reticle = reticleRef.current;

    if (!scene || !reticle || !reticle.visible) {
      setStatus("Move camera to detect surface");
      return;
    }

    const position = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();
    const scale = new THREE.Vector3();

    reticle.matrix.decompose(
      position,
      quaternion,
      scale
    );

    const loader = new GLTFLoader();

    loader.load(
      url,

      (gltf) => {

        const model = gltf.scene;

        model.position.copy(position);
        model.quaternion.copy(quaternion);

        /* Auto Scale */

        const box = new THREE.Box3()
          .setFromObject(model);

        const size = box.getSize(
          new THREE.Vector3()
        );

        const maxDim =
          Math.max(size.x, size.y, size.z);

        if (maxDim > 0) {
          model.scale.setScalar(0.5 / maxDim);
        }

        scene.add(model);
        placedRef.current.push(model);

        setStatus("Object placed ✅");
      },

      undefined,

      () => {

        /* Fallback cube */

        const mesh =
          new THREE.Mesh(

            new THREE.BoxGeometry(
              0.3, 0.4, 0.3
            ),

            new THREE.MeshStandardMaterial({
              color: 0xe8d5b7
            })
          );

        mesh.position.copy(position);
        mesh.position.y += 0.2;

        scene.add(mesh);
        placedRef.current.push(mesh);

        setStatus("Fallback cube placed");
      }
    );

  }, []);

  /* ───────── Start AR ───────── */

  const startAR = async () => {

    if (!navigator.xr || !arSupported)
      return;

    const renderer = buildScene();
    if (!renderer) return;

    try {

      const sessionInit = {

        requiredFeatures: [
          'hit-test',
          'local-floor'
        ],

        optionalFeatures: [
          'dom-overlay'
        ]

      };

      if (overlayRef.current) {

        sessionInit.domOverlay = {
          root: overlayRef.current
        };

      }

      const session =
        await navigator.xr.requestSession(
          'immersive-ar',
          sessionInit
        );

      renderer.xr.setSession(session);

      setArActive(true);

      setStatus(
        "Move phone to detect surface"
      );

      /* Default Model */

      const objs =
        currentProject?.objects ?? [];

      if (objs.length > 0) {

        const obj =
          objs[selectedObjIdx] ?? objs[0];

        selectedUrlRef.current =
          obj.modelUrl ??
          `/models/${obj.name
            .toLowerCase()
            .replace(/\s+/g, '_')}.glb`;

      }

      /* Animation Loop */

      renderer.setAnimationLoop((_, frame) => {

        if (!frame) return;

        const refSpace =
          renderer.xr.getReferenceSpace();

        const xrSession =
          renderer.xr.getSession();

        /* Request Hit Test */

        if (!hitSourceRequestedRef.current) {

          hitSourceRequestedRef.current = true;

          xrSession
            .requestReferenceSpace('viewer')

            .then((viewerSpace) =>
              xrSession.requestHitTestSource({
                space: viewerSpace
              })
            )

            .then((source) => {

              hitSourceRef.current = source;

              setStatus(
                "Surface detected ✔"
              );

            });

        }

        /* Update Reticle */

        if (hitSourceRef.current) {

          const hits =
            frame.getHitTestResults(
              hitSourceRef.current
            );

          if (hits.length > 0) {

            const pose =
              hits[0].getPose(refSpace);

            reticleRef.current.visible = true;

            reticleRef.current.matrix
              .fromArray(
                pose.transform.matrix
              );

          }
          else {

            reticleRef.current.visible = false;

          }

        }

        renderer.render(
          sceneRef.current,
          renderer.xr.getCamera()
        );

      });

      session.addEventListener('end', () => {

        renderer.setAnimationLoop(null);

        hitSourceRef.current = null;
        hitSourceRequestedRef.current = false;

        placedRef.current = [];

        setArActive(false);
        setStatus('');

      });

    }

    catch (err) {

      console.error(err);

      setStatus(
        "AR failed to start"
      );

    }

  };

  /* ───────── Remove Last ───────── */

  const removeLast = () => {

    const last =
      placedRef.current.pop();

    if (last) {

      sceneRef.current.remove(last);

      setStatus("Removed last object");

    }

  };

  /* ───────── Clear All ───────── */

  const clearPlaced = () => {

    placedRef.current.forEach(
      m => sceneRef.current.remove(m)
    );

    placedRef.current = [];

    setStatus("All cleared");

  };

  if (loading) return null;

  const objects =
    currentProject?.objects ?? [];

  return (

    <>

      <canvas
        ref={canvasRef}
        className="fixed inset-0 w-full h-full z-0"
      />

      <div
        ref={overlayRef}
        className="fixed inset-0 z-10 pointer-events-auto"
      >

        {!arActive ? (

          /* PRE AR SCREEN */

          <div className="min-h-screen flex flex-col items-center justify-center">

            <h1 className="text-white text-3xl mb-6">
              AR Preview
            </h1>

            {arSupported && (

              <button
                onClick={startAR}
                className="bg-white text-black px-6 py-3 rounded-xl"
              >
                🚀 Launch AR
              </button>

            )}

          </div>

        ) : (

          /* AR UI */

          <>

            {/* Status */}

            <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-black/60 text-white px-4 py-2 rounded-full text-xs pointer-events-none">
              {status}
            </div>

            {/* Scrollable Models */}

            {objects.length > 0 && (

              <div className="absolute bottom-28 left-0 right-0 flex justify-center gap-2 px-4 overflow-x-auto pointer-events-auto">

                {objects.map((obj, i) => (

                  <button
                    key={i}

                    onClick={() => {

                      setSelectedObjIdx(i);

                      selectedUrlRef.current =
                        obj.modelUrl;

                      setStatus(
                        `Selected ${obj.name}`
                      );

                    }}

                    className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap
                      ${selectedObjIdx === i
                        ? 'bg-amber-300 text-black'
                        : 'bg-black/60 text-white'}`}

                  >

                    {obj.name}

                  </button>

                ))}

              </div>

            )}

            {/* ACTION BUTTONS */}

            <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-3 pointer-events-auto">

              <button
                onClick={() =>
                  placeModel(
                    selectedUrlRef.current
                  )
                }
                className="bg-amber-300 text-black px-5 py-2.5 rounded-full"
              >
                ➕ Place
              </button>

              <button
                onClick={removeLast}
                className="bg-red-500 text-white px-5 py-2.5 rounded-full"
              >
                🗑 Remove
              </button>

              <button
                onClick={clearPlaced}
                className="bg-black/60 text-white px-5 py-2.5 rounded-full"
              >
                Clear
              </button>

              <button
                onClick={() =>
                  rendererRef.current?.xr
                    ?.getSession()
                    ?.end()
                }
                className="bg-white text-black px-5 py-2.5 rounded-full"
              >
                Exit
              </button>

            </div>

          </>

        )}

      </div>

    </>

  );

};

export default ARViewerPage;
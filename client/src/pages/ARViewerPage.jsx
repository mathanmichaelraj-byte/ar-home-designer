import React, {
  useEffect,
  useRef,
  useState,
  useCallback
} from "react";

import { useParams } from "react-router-dom";
import { useProject } from "../context/ProjectContext";

import * as THREE from "three";
import { GLTFLoader }
from "three/examples/jsm/loaders/GLTFLoader";

const ARViewerPage = () => {

  const { id } = useParams();
  const { currentProject, loadProject } = useProject();

  /* STATE */

  const [arSupported, setArSupported] = useState(null);
  const [loading, setLoading] = useState(true);
  const [arActive, setArActive] = useState(false);
  const [selectedObjIdx, setSelectedObjIdx] = useState(0);

  /* REFS */

  const overlayRef = useRef(null);
  const canvasRef = useRef(null);

  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);

  const reticleRef = useRef(null);

  const hitTestSourceRef = useRef(null);
  const localSpaceRef = useRef(null);

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
        .isSessionSupported("immersive-ar")
        .then(setArSupported)
        .catch(() => setArSupported(false));

    }
    else {

      setArSupported(false);

    }

  }, [id, currentProject, loadProject]);

  /* ───────── Scene Builder ───────── */

  const buildScene = useCallback(() => {

    if (rendererRef.current)
      return rendererRef.current;

    const canvas = canvasRef.current;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true
    });

    renderer.setPixelRatio(
      window.devicePixelRatio
    );

    renderer.setSize(
      window.innerWidth,
      window.innerHeight
    );

    renderer.xr.enabled = true;

    rendererRef.current = renderer;

    /* Scene */

    const scene = new THREE.Scene();
    scene.background = null;
    sceneRef.current = scene;

    /* Camera */

    const camera =
      new THREE.PerspectiveCamera();

    cameraRef.current = camera;

    /* Lighting */

    const hemi =
      new THREE.HemisphereLight(
        0xffffff,
        0xbbbbff,
        1.2
      );

    scene.add(hemi);

    const dir =
      new THREE.DirectionalLight(
        0xffffff,
        0.8
      );

    dir.position.set(1, 2, 1);
    scene.add(dir);

    /* Reticle */

    const geo =
      new THREE.RingGeometry(
        0.08,
        0.1,
        32
      ).rotateX(-Math.PI / 2);

    const mat =
      new THREE.MeshBasicMaterial({
        color: 0xe8d5b7,
        side: THREE.DoubleSide
      });

    const reticle =
      new THREE.Mesh(geo, mat);

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

    if (!reticle.visible) {

      return;

    }

    const position =
      new THREE.Vector3();

    const quaternion =
      new THREE.Quaternion();

    const scale =
      new THREE.Vector3();

    reticle.matrix.decompose(
      position,
      quaternion,
      scale
    );

    const loader =
      new GLTFLoader();

    loader.load(

      url,

      (gltf) => {

        const model =
          gltf.scene;

        model.position.copy(position);
        model.quaternion.copy(quaternion);

        /* Auto scale */

        const box =
          new THREE.Box3()
            .setFromObject(model);

        const size =
          box.getSize(
            new THREE.Vector3()
          );

        const maxDim =
          Math.max(
            size.x,
            size.y,
            size.z
          );

        if (maxDim > 0) {

          model.scale.setScalar(
            0.5 / maxDim
          );

        }

        scene.add(model);
        placedRef.current.push(model);

      },

      undefined,

      () => {

        /* Fallback cube */

        const mesh =
          new THREE.Mesh(

            new THREE.BoxGeometry(
              0.3,
              0.4,
              0.3
            ),

            new THREE.MeshStandardMaterial({
              color: 0xe8d5b7
            })

          );

        mesh.position.copy(position);
        mesh.position.y += 0.2;

        scene.add(mesh);

        placedRef.current.push(mesh);


      }

    );

  }, []);

  /* ───────── Start AR ───────── */

  const startAR = async () => {

    if (!arSupported) return;

    const renderer =
      buildScene();

    try {

      const session =
        await navigator.xr.requestSession(
          "immersive-ar",
          {
            requiredFeatures: [
              "hit-test"
            ],

            optionalFeatures: [
              "dom-overlay",
              "local-floor"
            ],

            domOverlay: {
              root: overlayRef.current
            }

          }
        );

      renderer.xr.setSession(session);

      setArActive(true);

      /* Hit Test Setup */

      const viewerSpace =
        await session.requestReferenceSpace(
          "viewer"
        );

      hitTestSourceRef.current =
        await session.requestHitTestSource({
          space: viewerSpace
        });

      localSpaceRef.current =
        await session.requestReferenceSpace(
          "local-floor"
        );

      /* Default model */

      const objs =
        currentProject?.objects ?? [];

      if (objs.length > 0) {

        const obj =
          objs[selectedObjIdx] ??
          objs[0];

        selectedUrlRef.current =
          obj.modelUrl;

      }

      /* Animation Loop */

      renderer.setAnimationLoop(
        (timestamp, frame) => {

          if (frame) {

            const hitResults =
              frame.getHitTestResults(
                hitTestSourceRef.current
              );

            if (hitResults.length > 0) {

              const hit =
                hitResults[0];

              const pose =
                hit.getPose(
                  localSpaceRef.current
                );

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

        }
      );

      session.addEventListener(
        "end",
        () => {

          renderer.setAnimationLoop(null);

          hitTestSourceRef.current = null;
          localSpaceRef.current = null;

          placedRef.current = [];

          setArActive(false);
          setStatus("");

        }
      );

    }
    catch (err) {

      console.error(err);

    }

  };

  /* ───────── Remove Last ───────── */

  const removeLast = () => {

    const last =
      placedRef.current.pop();

    if (last) {

      sceneRef.current.remove(last);


    }

  };

  /* ───────── Clear All ───────── */

  const clearPlaced = () => {

    placedRef.current.forEach(
      m => sceneRef.current.remove(m)
    );

    placedRef.current = [];

  };

  if (loading) return null;

  const objects =
    currentProject?.objects ?? [];

  return (

    <>
      {/* CANVAS */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 w-full h-full z-0"
      />

      {/* OVERLAY */}
      <div
        ref={overlayRef}
        className="fixed inset-0 z-10 text-white"
      >

        {!arActive ? (

          /* PRE AR SCREEN */

          <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-black to-gray-900">

            <h1 className="text-4xl font-semibold mb-4 tracking-wide">
              AR Preview
            </h1>

            <p className="text-gray-400 mb-8 text-center max-w-sm">
              Place furniture in your real space using your camera
            </p>

            {arSupported ? (
              <button
                onClick={startAR}
                className="bg-white text-black px-8 py-3 rounded-2xl font-medium shadow-lg hover:scale-105 transition"
              >
                Start AR
              </button>
            ) : (
              <p className="text-red-400">
                AR not supported on this device
              </p>
            )}
          </div>

        ) : (

          <>
            {/* 🎯 CENTER RETICLE */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-14 h-14 border-2 border-white/60 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full" />
              </div>
            </div>

            {/* 📡 STATUS */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 
              bg-black/40 backdrop-blur-md px-5 py-2 rounded-full text-sm shadow-lg">

              <span className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full animate-pulse ${
                  reticleRef.current?.visible ? "bg-green-400" : "bg-red-400"
                }`} />
                {reticleRef.current?.visible
                  ? "Surface detected"
                  : "Move camera to scan"}
              </span>
            </div>

            {/* 🧊 MODEL SELECTOR (GLASS CARDS) */}
            {objects.length > 0 && (
              <div className="absolute bottom-28 left-0 right-0 flex gap-3 px-4 overflow-x-auto">

                {objects.map((obj, i) => (

                  <button
                    key={i}
                    onClick={() => {
                      setSelectedObjIdx(i);
                      selectedUrlRef.current = obj.modelUrl;
                      setStatus(`Selected ${obj.name}`);
                    }}

                    className={`min-w-[110px] px-3 py-3 rounded-2xl backdrop-blur-lg border 
                    transition text-sm shadow-lg

                    ${selectedObjIdx === i
                        ? "bg-white text-black border-white"
                        : "bg-white/10 border-white/20 text-white"
                      }`}
                  >
                    {obj.name}
                  </button>

                ))}

              </div>
            )}

            {/* 🎮 CONTROL PANEL */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2">

              <div className="flex gap-3 bg-white/10 backdrop-blur-xl 
                border border-white/20 rounded-2xl px-4 py-3 shadow-2xl">

                {/* PLACE */}
                <button
                  onClick={() => placeModel(selectedUrlRef.current)}
                  className="p-3 bg-white text-black rounded-xl hover:scale-110 transition"
                  title="Place object"
                >
                  📍
                </button>

                {/* REMOVE */}
                <button
                  onClick={removeLast}
                  className="p-3 bg-red-500 rounded-xl hover:scale-110 transition"
                  title="Undo"
                >
                  ↩️
                </button>

                {/* CLEAR */}
                <button
                  onClick={clearPlaced}
                  className="p-3 bg-gray-300 text-black rounded-xl hover:scale-110 transition"
                  title="Clear all"
                >
                  🧹
                </button>

                {/* EXIT */}
                <button
                  onClick={() =>
                    rendererRef.current?.xr
                      ?.getSession()
                      ?.end()
                  }
                  className="p-3 bg-black rounded-xl hover:scale-110 transition"
                  title="Exit AR"
                >
                  ✖
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
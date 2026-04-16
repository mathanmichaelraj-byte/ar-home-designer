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
  const [status, setStatus] = useState("");
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

      setStatus(
        "Move camera to detect surface"
      );

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

        setStatus("Object placed");

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

        setStatus("Fallback cube placed");

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

      setStatus(
        "Move phone slowly to detect surface"
      );

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

      setStatus(
        "Failed to start AR"
      );

    }

  };

  /* ───────── Remove Last ───────── */

  const removeLast = () => {

    const last =
      placedRef.current.pop();

    if (last) {

      sceneRef.current.remove(last);

      setStatus(
        "Removed last object"
      );

    }

  };

  /* ───────── Clear All ───────── */

  const clearPlaced = () => {

    placedRef.current.forEach(
      m => sceneRef.current.remove(m)
    );

    placedRef.current = [];

    setStatus("All objects cleared");

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
        className="fixed inset-0 z-10"
      >

        {!arActive ? (

          /* PRE AR */

          <div className="min-h-screen flex flex-col items-center justify-center bg-black">

            <h1 className="text-white text-3xl mb-8 font-semibold">
              AR Preview
            </h1>

            {arSupported && (

              <button
                onClick={startAR}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl shadow-md transition"
              >
                Launch AR
              </button>

            )}

          </div>

        ) : (

          <>

            {/* STATUS */}

            <div className="absolute top-5 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur px-4 py-2 rounded-xl text-sm text-gray-800 pointer-events-none shadow">

              {status}

            </div>

            {/* MODEL SELECTOR */}

            {objects.length > 0 && (

              <div className="absolute bottom-28 left-0 right-0 flex justify-center gap-2 px-4 overflow-x-auto">

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

                    className={`px-4 py-2 text-sm rounded-xl whitespace-nowrap transition shadow

                    ${selectedObjIdx === i
                        ? "bg-blue-600 text-white"
                        : "bg-white/90 text-gray-800"
                      }

                    `}
                  >

                    {obj.name}

                  </button>

                ))}

              </div>

            )}

            {/* ACTION BUTTONS */}

            <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-3">

              <button
                onClick={() =>
                  placeModel(
                    selectedUrlRef.current
                  )
                }

                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl shadow transition"
              >
                Place
              </button>

              <button
                onClick={removeLast}

                className="bg-red-500 hover:bg-red-600 text-white px-5 py-2.5 rounded-xl shadow transition"
              >
                Remove
              </button>

              <button
                onClick={clearPlaced}

                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-5 py-2.5 rounded-xl shadow transition"
              >
                Clear
              </button>

              <button
                onClick={() =>
                  rendererRef.current?.xr
                    ?.getSession()
                    ?.end()
                }

                className="bg-white hover:bg-gray-100 text-gray-900 px-5 py-2.5 rounded-xl shadow transition"
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
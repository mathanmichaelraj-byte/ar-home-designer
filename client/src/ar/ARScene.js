import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { ARButton } from 'three/examples/jsm/webxr/ARButton';

/**
 * ARScene — manages a WebXR hit-test AR session.
 * Usage:
 *   const ar = new ARScene(renderer, document.getElementById('ar-container'));
 *   await ar.start();
 *   ar.placeObject(furnitureObj);
 */
export class ARScene {
  constructor(container) {
    this.container = container;
    this.placedObjects = [];
    this.loader = new GLTFLoader();
    this._hitTestSource = null;
    this._reticle = null;
    this._init();
  }

  _init() {
    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.xr.enabled = true;
    this.container.appendChild(this.renderer.domElement);

    // Scene
    this.scene = new THREE.Scene();

    // Camera (managed by WebXR)
    this.camera = new THREE.PerspectiveCamera(70, this.container.clientWidth / this.container.clientHeight, 0.01, 20);

    // Lights
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const dir = new THREE.DirectionalLight(0xffffff, 0.6);
    dir.position.set(0, 5, 5);
    this.scene.add(dir);

    // Reticle (targeting circle)
    this._reticle = new THREE.Mesh(
      new THREE.RingGeometry(0.05, 0.08, 32).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0xE94560 })
    );
    this._reticle.matrixAutoUpdate = false;
    this._reticle.visible = false;
    this.scene.add(this._reticle);

    // AR Button
    this._arButton = ARButton.createButton(this.renderer, {
      requiredFeatures: ['hit-test'],
      optionalFeatures: ['dom-overlay'],
    });
    document.body.appendChild(this._arButton);

    // Session start → request hit-test source
    this.renderer.xr.addEventListener('sessionstart', () => this._onSessionStart());
    this.renderer.xr.addEventListener('sessionend',   () => this._onSessionEnd());

    this.renderer.setAnimationLoop((time, frame) => this._render(time, frame));
  }

  async _onSessionStart() {
    const session = this.renderer.xr.getSession();
    const space   = await session.requestReferenceSpace('viewer');
    this._hitTestSource = await session.requestHitTestSource({ space });
  }

  _onSessionEnd() {
    this._hitTestSource = null;
    this._reticle.visible = false;
  }

  _render(time, frame) {
    if (frame && this._hitTestSource) {
      const refSpace = this.renderer.xr.getReferenceSpace();
      const hits = frame.getHitTestResults(this._hitTestSource);
      if (hits.length > 0) {
        const pose = hits[0].getPose(refSpace);
        this._reticle.visible = true;
        this._reticle.matrix.fromArray(pose.transform.matrix);
      } else {
        this._reticle.visible = false;
      }
    }
    this.renderer.render(this.scene, this.camera);
  }

  /** Place a furniture object at the current reticle position */
  placeObject(furnitureObj) {
    if (!this._reticle.visible) return;
    const pos = new THREE.Vector3();
    pos.setFromMatrixPosition(this._reticle.matrix);

    if (furnitureObj.modelUrl) {
      this.loader.load(furnitureObj.modelUrl, (gltf) => {
        const mesh = gltf.scene;
        mesh.position.copy(pos);
        mesh.scale.setScalar(furnitureObj.scale || 1);
        this.scene.add(mesh);
        this.placedObjects.push(mesh);
      });
    } else {
      const geo  = new THREE.BoxGeometry(
        furnitureObj.dimensions?.width  || 1,
        furnitureObj.dimensions?.height || 0.8,
        furnitureObj.dimensions?.depth  || 1
      );
      const mat  = new THREE.MeshStandardMaterial({ color: 0x263447, roughness: 0.6 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(pos);
      mesh.position.y += (furnitureObj.dimensions?.height || 0.8) / 2;
      this.scene.add(mesh);
      this.placedObjects.push(mesh);
    }
  }

  clearAll() {
    this.placedObjects.forEach(m => this.scene.remove(m));
    this.placedObjects = [];
  }

  dispose() {
    this.renderer.setAnimationLoop(null);
    this.renderer.dispose();
    if (this._arButton?.parentNode) this._arButton.parentNode.removeChild(this._arButton);
  }

  /** Static: check if WebXR AR is supported in this browser */
  static async isSupported() {
    if (!navigator.xr) return false;
    return navigator.xr.isSessionSupported('immersive-ar').catch(() => false);
  }
}

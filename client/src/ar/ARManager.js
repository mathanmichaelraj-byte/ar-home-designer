/**
 * ARManager — Wraps WebXR immersive-ar session with hit-test for furniture placement.
 * Usage: const ar = new ARManager(renderer, scene, camera); ar.start();
 */
import * as THREE from 'three';

class ARManager {
  constructor(renderer, scene, camera) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.session = null;
    this.hitTestSource = null;
    this.reticle = this._createReticle();
    this.onPlaceCallback = null;
  }

  _createReticle() {
    const geo = new THREE.RingGeometry(0.05, 0.07, 32).rotateX(-Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({ color: 0x4f6ef7, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.matrixAutoUpdate = false;
    mesh.visible = false;
    this.scene?.add(mesh);
    return mesh;
  }

  async start() {
    if (!navigator.xr) throw new Error('WebXR not supported');
    const supported = await navigator.xr.isSessionSupported('immersive-ar');
    if (!supported) throw new Error('Immersive AR not supported on this device');

    this.session = await navigator.xr.requestSession('immersive-ar', {
      requiredFeatures: ['hit-test'],
      optionalFeatures: ['dom-overlay', 'light-estimation'],
    });

    this.renderer.xr.enabled = true;
    await this.renderer.xr.setSession(this.session);

    const viewerSpace = await this.session.requestReferenceSpace('viewer');
    this.hitTestSource = await this.session.requestHitTestSource({ space: viewerSpace });

    this.session.addEventListener('end', () => this._onSessionEnd());
    return this.session;
  }

  onFrame(frame, referenceSpace) {
    if (!this.hitTestSource || !frame) return;
    const results = frame.getHitTestResults(this.hitTestSource);
    if (results.length > 0) {
      const hit = results[0];
      const pose = hit.getPose(referenceSpace);
      if (pose) {
        this.reticle.visible = true;
        this.reticle.matrix.fromArray(pose.transform.matrix);
      }
    } else {
      this.reticle.visible = false;
    }
  }

  place(object) {
    if (!this.reticle.visible) return;
    const pos = new THREE.Vector3();
    const quat = new THREE.Quaternion();
    const scale = new THREE.Vector3();
    this.reticle.matrix.decompose(pos, quat, scale);
    object.position.copy(pos);
    object.quaternion.copy(quat);
    this.scene.add(object);
    if (this.onPlaceCallback) this.onPlaceCallback(object, pos);
  }

  onPlace(callback) {
    this.onPlaceCallback = callback;
  }

  async stop() {
    if (this.session) await this.session.end();
  }

  _onSessionEnd() {
    this.hitTestSource = null;
    this.session = null;
    this.reticle.visible = false;
    this.renderer.xr.enabled = false;
  }
}

export default ARManager;

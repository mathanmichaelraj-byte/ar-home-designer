import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { SCENE_DEFAULTS, COLORS } from '../utils/constants';

export class ThreeScene {
  constructor(canvas, { width, length, height } = {}) {
    this.canvas  = canvas;
    this.width   = width  || 5;
    this.length  = length || 6;
    this.height  = height || 2.8;
    this.objects = new Map(); // id → { mesh, disposables[] }
    this.loader  = new GLTFLoader();
    this._handleVisibility = this._onVisibilityChange.bind(this);
    document.addEventListener('visibilitychange', this._handleVisibility);
    this._init();
  }

  // ── Init ──────────────────────────────────────────────────────────────

  _init() {
    // FIX 1: Use offsetWidth/Height (reflects actual rendered size),
    // fall back to 300×150 so the renderer never gets 0×0.
    const w = this.canvas.offsetWidth  || 300;
    const h = this.canvas.offsetHeight || 150;

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
    });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(w, h, false); // false = don't set canvas CSS size
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type    = THREE.PCFSoftShadowMap;

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(SCENE_DEFAULTS.backgroundColor);
    this.scene.fog = new THREE.Fog(SCENE_DEFAULTS.backgroundColor, 15, 40);

    // Camera
    this.camera = new THREE.PerspectiveCamera(55, w / h, 0.1, 100);
    this.camera.position.set(this.width / 2, this.height * 1.5, this.length + 3);
    this.camera.lookAt(this.width / 2, 0, this.length / 2);

    // Controls
    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.target.set(this.width / 2, 0, this.length / 2);

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, SCENE_DEFAULTS.ambientIntensity);
    this.scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xffffff, SCENE_DEFAULTS.directionalIntensity);
    dirLight.position.set(5, 10, 5);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width  = 2048;
    dirLight.shadow.mapSize.height = 2048;
    this.scene.add(dirLight);

    const accentLight = new THREE.PointLight(0xe94560, 0.4, 10);
    accentLight.position.set(this.width / 2, this.height - 0.2, this.length / 2);
    this.scene.add(accentLight);

    this._buildRoom();
    this._buildGrid();
    this._animate();
  }

  _buildRoom() {
    const wallMat  = new THREE.MeshStandardMaterial({ color: COLORS.wall,  roughness: 0.8, metalness: 0.1 });
    const floorMat = new THREE.MeshStandardMaterial({ color: COLORS.floor, roughness: 0.9 });

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(this.width, this.length), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(this.width / 2, 0, this.length / 2);
    floor.receiveShadow = true;
    this.scene.add(floor);

    const backWall = new THREE.Mesh(new THREE.PlaneGeometry(this.width, this.height), wallMat);
    backWall.position.set(this.width / 2, this.height / 2, 0);
    backWall.receiveShadow = true;
    this.scene.add(backWall);

    const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(this.length, this.height), wallMat);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.set(0, this.height / 2, this.length / 2);
    leftWall.receiveShadow = true;
    this.scene.add(leftWall);
  }

  _buildGrid() {
    const size = Math.max(this.width, this.length) * 2;
    const grid = new THREE.GridHelper(size, size, 0x1f2b3e, 0x1f2b3e);
    grid.position.set(this.width / 2, 0.001, this.length / 2);
    this.scene.add(grid);
  }

  // FIX 7: Pause the loop when the browser tab is hidden.
  _onVisibilityChange() {
    if (document.hidden) {
      cancelAnimationFrame(this._animId);
      this._animId = null;
    } else if (!this._animId) {
      this._animate();
    }
  }

  _animate() {
    this._animId = requestAnimationFrame(() => this._animate());
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  // ── Helpers ───────────────────────────────────────────────────────────

  // FIX 2 + 3: Compute real bounding box to place model flush on floor
  // and auto-scale it so it's never a postage stamp or a skyscraper.
  _fitToFloor(mesh, targetHeight) {
    // Normalise origin to bounding-box centre first
    const box = new THREE.Box3().setFromObject(mesh);
    const center = box.getCenter(new THREE.Vector3());
    const size   = box.getSize(new THREE.Vector3());

    // Shift mesh so its local origin is at bottom-centre
    mesh.position.sub(center);
    mesh.position.y += size.y / 2;

    // Auto-scale: clamp real-world height to a sensible target
    // (caller can pass targetHeight = obj.dimensions?.height ?? 1)
    if (targetHeight && size.y > 0) {
      const scaleFactor = targetHeight / size.y;
      mesh.scale.multiplyScalar(scaleFactor);
    }
  }

  _placeMesh(mesh, obj, isGLTF = false) {
    const targetH = obj.dimensions?.height ?? 1;

    if (isGLTF) {
      // Apply scale BEFORE fitting so the bounding-box measurement is correct
      mesh.scale.setScalar(obj.scale || 1);
      this._fitToFloor(mesh, targetH);
    } else {
      mesh.position.y = targetH / 2;
      mesh.scale.setScalar(obj.scale || 1);
    }

    // XZ placement (applied on top of the fitted position)
    mesh.position.x = obj.position?.x ?? this.width  / 2;
    mesh.position.z = obj.position?.z ?? this.length / 2;
    mesh.rotation.y = ((obj.rotation || 0) * Math.PI) / 180;
  }

  // FIX 4: Collect and dispose GPU resources when removing a mesh.
  _disposeMesh(mesh) {
    mesh.traverse((child) => {
      if (!child.isMesh) return;
      child.geometry?.dispose();
      const mats = Array.isArray(child.material) ? child.material : [child.material];
      mats.forEach((m) => {
        if (!m) return;
        // Dispose every texture slot
        Object.values(m).forEach((v) => {
          if (v instanceof THREE.Texture) v.dispose();
        });
        m.dispose();
      });
    });
  }

  // ── Public API ────────────────────────────────────────────────────────

  addFurniture(obj) {
    return new Promise((resolve, reject) => {
      if (obj.modelUrl) {
        this.loader.load(
          obj.modelUrl,
          (gltf) => {
            const mesh = gltf.scene;
            mesh.traverse((child) => {
              if (child.isMesh) {
                child.castShadow    = true;
                child.receiveShadow = true;
              }
            });
            this._placeMesh(mesh, obj, true); // isGLTF = true
            this.objects.set(obj.id, mesh);
            this.scene.add(mesh);
            resolve(mesh);
          },
          undefined,
          reject
        );
      } else {
        // Placeholder box
        const w   = obj.dimensions?.width  || 1;
        const h   = obj.dimensions?.height || 0.8;
        const d   = obj.dimensions?.depth  || 1;
        const geo = new THREE.BoxGeometry(w, h, d);
        const mat = new THREE.MeshStandardMaterial({ color: 0x263447, roughness: 0.7, metalness: 0.2 });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.castShadow    = true;
        mesh.receiveShadow = true;
        this._placeMesh(mesh, obj, false);
        this.objects.set(obj.id, mesh);
        this.scene.add(mesh);
        resolve(mesh);
      }
    });
  }

  updateFurniture(id, changes) {
    const mesh = this.objects.get(id);
    if (!mesh) return;
    if (changes.position) {
      mesh.position.x = changes.position.x;
      mesh.position.z = changes.position.z;
      // y stays as fitted — don't override unless explicitly passed
      if (changes.position.y !== undefined) mesh.position.y = changes.position.y;
    }
    if (changes.rotation !== undefined) {
      mesh.rotation.y = (changes.rotation * Math.PI) / 180;
    }
    if (changes.scale !== undefined) {
      mesh.scale.setScalar(changes.scale);
    }
  }

  // FIX 4: Dispose GPU memory on removal.
  removeFurniture(id) {
    const mesh = this.objects.get(id);
    if (!mesh) return;
    this.scene.remove(mesh);
    this._disposeMesh(mesh);
    this.objects.delete(id);
  }

  // FIX 6: Update pixel ratio on resize (important for retina after window move).
  resize(w, h) {
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(window.devicePixelRatio); // added
    this.renderer.setSize(w, h, false);
  }

  // FIX 5: Dispose ALL objects, not just the renderer.
  dispose() {
    document.removeEventListener('visibilitychange', this._handleVisibility);
    cancelAnimationFrame(this._animId);

    // Dispose all furniture
    this.objects.forEach((mesh) => {
      this.scene.remove(mesh);
      this._disposeMesh(mesh);
    });
    this.objects.clear();

    // Dispose room geometry/materials
    this.scene.traverse((child) => {
      if (!child.isMesh) return;
      child.geometry?.dispose();
      const mats = Array.isArray(child.material) ? child.material : [child.material];
      mats.forEach((m) => m?.dispose());
    });

    this.controls.dispose();
    this.renderer.dispose();
  }
}
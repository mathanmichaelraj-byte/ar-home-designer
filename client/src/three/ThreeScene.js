import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { SCENE_DEFAULTS, COLORS } from '../utils/constants';

export class ThreeScene {
  constructor(canvas, { width, length, height } = {}) {
    this.canvas   = canvas;
    this.width    = width  || 5;
    this.length   = length || 6;
    this.height   = height || 2.8;
    this.objects  = new Map();   // id → mesh
    this.loader   = new GLTFLoader();
    this._init();
  }

  _init() {
    // Renderer
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type    = THREE.PCFSoftShadowMap;

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(SCENE_DEFAULTS.backgroundColor);
    this.scene.fog = new THREE.Fog(SCENE_DEFAULTS.backgroundColor, 15, 40);

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      55, this.canvas.clientWidth / this.canvas.clientHeight, 0.1, 100
    );
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

    const accentLight = new THREE.PointLight(0xE94560, 0.4, 10);
    accentLight.position.set(this.width / 2, this.height - 0.2, this.length / 2);
    this.scene.add(accentLight);

    this._buildRoom();
    this._buildGrid();
    this._animate();
  }

  _buildRoom() {
    const wallMat  = new THREE.MeshStandardMaterial({ color: COLORS.wall, roughness: 0.8, metalness: 0.1 });
    const floorMat = new THREE.MeshStandardMaterial({ color: COLORS.floor, roughness: 0.9 });

    // Floor
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(this.width, this.length), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(this.width / 2, 0, this.length / 2);
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Back wall
    const backWall = new THREE.Mesh(new THREE.PlaneGeometry(this.width, this.height), wallMat);
    backWall.position.set(this.width / 2, this.height / 2, 0);
    backWall.receiveShadow = true;
    this.scene.add(backWall);

    // Left wall
    const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(this.length, this.height), wallMat);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.set(0, this.height / 2, this.length / 2);
    leftWall.receiveShadow = true;
    this.scene.add(leftWall);
  }

  _buildGrid() {
    const grid = new THREE.GridHelper(
      Math.max(this.width, this.length) * 2,
      Math.max(this.width, this.length) * 2,
      0x1F2B3E, 0x1F2B3E
    );
    grid.position.set(this.width / 2, 0.001, this.length / 2);
    this.scene.add(grid);
  }

  _animate() {
    this._animId = requestAnimationFrame(() => this._animate());
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  // ── Public API ────────────────────────────────────────────────────────
  addFurniture(obj) {
    return new Promise((resolve, reject) => {
      if (obj.modelUrl) {
        this.loader.load(
          obj.modelUrl,
          (gltf) => {
            const mesh = gltf.scene;
            mesh.traverse(child => {
              if (child.isMesh) {
                child.castShadow    = true;
                child.receiveShadow = true;
              }
            });
            this._placeMesh(mesh, obj);
            this.objects.set(obj.id, mesh);
            this.scene.add(mesh);
            resolve(mesh);
          },
          undefined,
          reject
        );
      } else {
        // Placeholder box
        const w  = obj.dimensions?.width  || 1;
        const h  = obj.dimensions?.height || 0.8;
        const d  = obj.dimensions?.depth  || 1;
        const geo = new THREE.BoxGeometry(w, h, d);
        const mat = new THREE.MeshStandardMaterial({ color: 0x263447, roughness: 0.7, metalness: 0.2 });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.castShadow    = true;
        mesh.receiveShadow = true;
        this._placeMesh(mesh, obj);
        this.objects.set(obj.id, mesh);
        this.scene.add(mesh);
        resolve(mesh);
      }
    });
  }

  _placeMesh(mesh, obj) {
    const h = obj.dimensions?.height || 0.8;
    mesh.position.set(
      obj.position?.x ?? this.width / 2,
      h / 2,
      obj.position?.z ?? this.length / 2
    );
    mesh.rotation.y = ((obj.rotation || 0) * Math.PI) / 180;
    mesh.scale.setScalar(obj.scale || 1);
  }

  updateFurniture(id, changes) {
    const mesh = this.objects.get(id);
    if (!mesh) return;
    if (changes.position) {
      mesh.position.set(changes.position.x, mesh.position.y, changes.position.z);
    }
    if (changes.rotation !== undefined) {
      mesh.rotation.y = (changes.rotation * Math.PI) / 180;
    }
    if (changes.scale !== undefined) {
      mesh.scale.setScalar(changes.scale);
    }
  }

  removeFurniture(id) {
    const mesh = this.objects.get(id);
    if (mesh) { this.scene.remove(mesh); this.objects.delete(id); }
  }

  resize(w, h) {
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  dispose() {
    cancelAnimationFrame(this._animId);
    this.renderer.dispose();
    this.controls.dispose();
  }
}

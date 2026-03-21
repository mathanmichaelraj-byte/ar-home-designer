import React, { Suspense, useRef, useCallback, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Environment, TransformControls } from '@react-three/drei';
import { useGLTF } from '@react-three/drei';

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) return null; // silently skip broken models
    return this.props.children;
  }
}

// ---- Furniture GLB Model ----
const FurnitureModel = ({ object, index, isSelected, onSelect, orbitRef, onUpdate }) => {
  const groupRef = useRef();
  const modelUrl = object.modelUrl?.replace('/assets/models/', '/models/');
  const { scene } = useGLTF(modelUrl);
  const clone = React.useMemo(() => scene.clone(), [scene]);

  useEffect(() => {
    if (!clone || !object.color || object.color === '#cccccc') return;
    clone.traverse((child) => {
      if (child.isMesh && child.material) {
        const mat = child.material.clone();
        mat.color.set(object.color);
        child.material = mat;
      }
    });
  }, [clone, object.color]);

    const handleTransform = useCallback(() => {
      if (!groupRef.current) return;
      const p = groupRef.current.position;
      const r = groupRef.current.rotation;
      const s = groupRef.current.scale;
      onUpdate(index, {
        // Divide back to meters for storage
        position: { x: +(p.x / SCENE_SCALE).toFixed(3), y: +(p.y / SCENE_SCALE).toFixed(3), z: +(p.z / SCENE_SCALE).toFixed(3) },
        rotation: { x: +r.x.toFixed(3), y: +r.y.toFixed(3), z: +r.z.toFixed(3) },
      });
    }, [index, onUpdate]);

    return (
      <>
        <group
          ref={groupRef}
          // Multiply stored meter positions by SCENE_SCALE for rendering
          position={[
            (object.position?.x || 0) * SCENE_SCALE,
            (object.position?.y || 0) * SCENE_SCALE,
            (object.position?.z || 0) * SCENE_SCALE,
          ]}
          rotation={[object.rotation?.x||0, object.rotation?.y||0, object.rotation?.z||0]}
          scale={[object.scale?.x||1, object.scale?.y||1, object.scale?.z||1]}
          onClick={(e) => { e.stopPropagation(); onSelect(index); }}
        >
          {/* No inner 0.01 scale — models render at natural cm size */}
          <primitive object={clone} castShadow receiveShadow />
          {isSelected && (
            <mesh>
              <boxGeometry args={[110, 110, 110]} />
              <meshBasicMaterial color="#4f6ef7" wireframe />
            </mesh>
          )}
        </group>
        {isSelected && groupRef.current && (
          <TransformControls
            object={groupRef.current}
            mode="translate"
            onMouseDown={() => { if (orbitRef.current) orbitRef.current.enabled = false; }}
            onMouseUp={() => {
              if (orbitRef.current) orbitRef.current.enabled = true;
              handleTransform();
            }}
          />
        )}
      </>
    );
};

// ---- Fallback Box ----
const FurnitureItem = ({ object, index, isSelected, onSelect, onUpdate, orbitRef }) => {
  const groupRef = useRef();

  const handleTransform = useCallback(() => {
    if (!groupRef.current) return;
    const p = groupRef.current.position;
    const r = groupRef.current.rotation;
    const s = groupRef.current.scale;
    onUpdate(index, {
      position: { x: +p.x.toFixed(3), y: +p.y.toFixed(3), z: +p.z.toFixed(3) },
      rotation: { x: +r.x.toFixed(3), y: +r.y.toFixed(3), z: +r.z.toFixed(3) },
      scale:    { x: +s.x.toFixed(3), y: +s.y.toFixed(3), z: +s.z.toFixed(3) },
    });
  }, [index, onUpdate]);

  return (
    <>
      <group
        ref={groupRef}
        position={[object.position?.x||0, object.position?.y||0, object.position?.z||0]}
        rotation={[object.rotation?.x||0, object.rotation?.y||0, object.rotation?.z||0]}
        scale={[object.scale?.x||1, object.scale?.y||1, object.scale?.z||1]}
        onClick={(e) => { e.stopPropagation(); onSelect(index); }}
      >
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.8, 0.8, 0.8]} />
          <meshStandardMaterial
            color={object.color || '#cccccc'}
            emissive={isSelected ? '#4f6ef7' : '#000'}
            emissiveIntensity={isSelected ? 0.25 : 0}
          />
        </mesh>
      </group>
      {isSelected && groupRef.current && (
        <TransformControls
          object={groupRef.current}
          mode="translate"
          onMouseDown={() => { if (orbitRef.current) orbitRef.current.enabled = false; }}
          onMouseUp={() => { if (orbitRef.current) orbitRef.current.enabled = true; }}
          onChange={handleTransform}
        />
      )}
    </>
  );
};

const SCENE_SCALE = 100;
// ---- Room ----
const Room = ({ dimensions, wallColor }) => {
  const { width = 5, length = 5, height = 2.8 } = dimensions || {};
  const w = width * SCENE_SCALE;
  const l = length * SCENE_SCALE;
  const h = height * SCENE_SCALE;
  const color = wallColor || '#f5f5f0';

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[w, l]} />
        <meshStandardMaterial color="#c8b89a" roughness={0.9} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, h, 0]} receiveShadow>
        <planeGeometry args={[w, l]} />
        <meshStandardMaterial color="#ece8e0" roughness={0.9} side={2} />
      </mesh>
      <mesh position={[0, h / 2, -l / 2]} receiveShadow>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      <mesh position={[-w / 2, h / 2, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[l, h]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      <mesh position={[w / 2, h / 2, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[l, h]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      <mesh position={[0, h / 2, l / 2]} rotation={[0, Math.PI, 0]} receiveShadow>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial color={color} roughness={0.8} transparent opacity={0.15} />
      </mesh>
    </group>
  );
};

// ---- Main Scene ----
const SceneViewer = ({ project, selectedIdx, onSelect, onUpdateObject }) => {
  const { roomDimensions, wallColor, objects = [] } = project || {};
  const orbitRef = useRef();

  return (
    <div className="w-full h-full">
      <Canvas
        shadows
        camera={{ position: [600, 500, 600], fov: 50 }}
        style={{ background: '#0f1117' }}
      >
      <ambientLight intensity={0.8} />
      <directionalLight position={[500, 800, 500]} intensity={1.2} castShadow
        shadow-mapSize-width={2048} shadow-mapSize-height={2048}
        shadow-camera-far={3000} shadow-camera-near={1}
        shadow-camera-left={-1000} shadow-camera-right={1000}
        shadow-camera-top={1000} shadow-camera-bottom={-1000} />
      <pointLight position={[-300, 300, -300]} intensity={0.4} color="#ffe0b2" />

        <Suspense fallback={null}>
          <Environment preset="apartment" />
          <Room dimensions={roomDimensions} wallColor={wallColor} />

          {/* Invisible floor click to deselect */}
          <mesh
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, -1, 0]}
            onClick={() => onSelect(null)}
            visible={false}
          >
            <planeGeometry args={[10000, 10000]} />
            <meshBasicMaterial />
          </mesh>

          {objects.map((obj, i) => (
            <ErrorBoundary key={i}>
              {obj.modelUrl
                ? <FurnitureModel
                    object={obj}
                    index={i}
                    isSelected={selectedIdx === i}
                    onSelect={onSelect}
                    onUpdate={onUpdateObject}
                    orbitRef={orbitRef}
                  />
                : <FurnitureItem
                    object={obj}
                    index={i}
                    isSelected={selectedIdx === i}
                    onSelect={onSelect}
                    onUpdate={onUpdateObject}
                    orbitRef={orbitRef}
                  />
              }
            </ErrorBoundary>
          ))}
        </Suspense>

        <Grid
          args={[2000, 2000]}
          position={[0, 0, 0]}
          cellSize={100}
          cellColor="#252a3d"
          sectionColor="#3a3f55"
          fadeDistance={2000}
          infiniteGrid
        />
        <OrbitControls
          ref={orbitRef}
          makeDefault
          minPolarAngle={0}
          maxPolarAngle={Math.PI / 1.8}  // allow slight top-down to see ceiling
        />
      </Canvas>

      <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur text-gray-400 text-xs px-3 py-1 rounded-full pointer-events-none">
        Click to select · Drag arrows to move · Scroll to zoom
      </div>
    </div>
  );
};

export default SceneViewer;
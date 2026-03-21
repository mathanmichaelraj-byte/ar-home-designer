import React ,{ Suspense, useRef, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Environment, TransformControls } from '@react-three/drei';
import { useGLTF } from '@react-three/drei';

const FurnitureModel = ({ object, index, isSelected, onSelect, orbitRef, onUpdate }) => {
  const groupRef = useRef();

  const modelUrl = object.modelUrl?.replace('/assets/models/', '/models/');

  const { scene } = useGLTF(modelUrl);
  const clone = React.useMemo(() => scene.clone(), [scene]);

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
        <primitive object={clone} castShadow receiveShadow />
        {isSelected && (
          <mesh>
            <boxGeometry args={[1.1, 1.1, 1.1]} />
            <meshBasicMaterial color="#4f6ef7" wireframe />
          </mesh>
        )}
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

const Room = ({ dimensions, wallColor }) => {
  const { width = 5, length = 5, height = 2.8 } = dimensions || {};
  const color = wallColor || '#f5f5f0';
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[width, length]} />
        <meshStandardMaterial color="#c8b89a" roughness={0.9} />
      </mesh>
      <mesh position={[0, height / 2, -length / 2]}>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      <mesh position={[-width / 2, height / 2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[length, height]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      <mesh position={[width / 2, height / 2, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[length, height]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
    </group>
  );
};

const FurnitureItem = ({ object, index, isSelected, onSelect, onUpdate, orbitRef }) => {
  const groupRef = useRef();

  const handleClick = useCallback((e) => {
    e.stopPropagation();
    onSelect(index);
  }, [index, onSelect]);

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
        position={[object.position?.x || 0, object.position?.y || 0, object.position?.z || 0]}
        rotation={[object.rotation?.x || 0, object.rotation?.y || 0, object.rotation?.z || 0]}
        scale={[object.scale?.x || 1, object.scale?.y || 1, object.scale?.z || 1]}
        onClick={handleClick}
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

const SceneViewer = ({ project, selectedIdx, onSelect, onUpdateObject }) => {
  const { roomDimensions, wallColor, objects = [] } = project || {};
  const orbitRef = useRef();

  return (
    <div className="w-full h-full">
      <Canvas
        shadows
        camera={{ position: [6, 5, 6], fov: 50 }}
        style={{ background: '#0f1117' }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 8, 5]} intensity={1.2} castShadow />
        <pointLight position={[-3, 3, -3]} intensity={0.4} color="#ffe0b2" />

        <Suspense fallback={null}>
          <Environment preset="apartment" />
          <Room dimensions={roomDimensions} wallColor={wallColor} />

          {/* Deselect on floor click */}
          <mesh
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, -0.01, 0]}
            onClick={() => onSelect(null)}
            visible={false}
          >
            <planeGeometry args={[100, 100]} />
            <meshBasicMaterial />
          </mesh>

          {objects.map((obj, i) => (
            obj.modelUrl 
            ? <FurnitureModel key={i} object={obj} index={i} isSelected={selectedIdx === i} onSelect={onSelect} onUpdate={onUpdateObject} orbitRef={orbitRef} />
            : <FurnitureItem
              key={i}
              object={obj}
              index={i}
              isSelected={selectedIdx === i}
              onSelect={onSelect}
              onUpdate={onUpdateObject}
              orbitRef={orbitRef}
            />
          ))}
        </Suspense>

        <Grid args={[20, 20]} position={[0, 0, 0]} cellColor="#252a3d" sectionColor="#3a3f55" fadeDistance={20} infiniteGrid />
        <OrbitControls ref={orbitRef} makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 2.1} />
      </Canvas>

      <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur text-gray-400 text-xs px-3 py-1 rounded-full pointer-events-none">
        Click to select · Drag arrows to move · Scroll to zoom
      </div>
    </div>
  );
};

export default SceneViewer;
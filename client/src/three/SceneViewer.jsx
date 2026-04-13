import React, { Suspense, useRef, useCallback, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Environment, TransformControls } from '@react-three/drei';
import { useGLTF } from '@react-three/drei';

// ─────────────────────────────────────────────────────────────────────────────
// Dark theme palette (mirrors constants.js)
// ─────────────────────────────────────────────────────────────────────────────
const DARK = {
  bg:          '#0d0d0d',
  floor:       '#181818',
  floorRough:  '#111111',
  wall:        '#1c1c1c',
  ceiling:     '#141414',
  gridCell:    '#2a2a2a',
  gridSection: '#333333',
  selection:   '#e8d5b7',
};

// ─────────────────────────────────────────────────────────────────────────────
// Room geometry
// ─────────────────────────────────────────────────────────────────────────────
const Room = ({ dimensions, wallColor }) => {
  const { width = 5, length = 5, height = 2.8 } = dimensions || {};
  const wc = wallColor || DARK.wall;

  return (
    <group>
      {/* Floor — dark parquet-style */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[width, length]} />
        <meshStandardMaterial color={DARK.floor} roughness={0.95} metalness={0.02} />
      </mesh>

      {/* Ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, height, 0]}>
        <planeGeometry args={[width, length]} />
        <meshStandardMaterial color={DARK.ceiling} roughness={1} side={2} />
      </mesh>

      {/* Back wall */}
      <mesh position={[0, height / 2, -length / 2]} receiveShadow>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial color={wc} roughness={0.9} />
      </mesh>

      {/* Left wall */}
      <mesh position={[-width / 2, height / 2, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[length, height]} />
        <meshStandardMaterial color={wc} roughness={0.9} />
      </mesh>

      {/* Right wall */}
      <mesh position={[width / 2, height / 2, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[length, height]} />
        <meshStandardMaterial color={wc} roughness={0.9} />
      </mesh>

      {/* Front wall — semi-transparent so we can see inside */}
      <mesh position={[0, height / 2, length / 2]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial color={wc} roughness={0.9} transparent opacity={0.12} />
      </mesh>
    </group>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Furniture with real GLB model
// ─────────────────────────────────────────────────────────────────────────────
const FurnitureModel = ({ object, index, isSelected, onSelect, orbitRef, onUpdate, transformMode }) => {
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
        position={[object.position?.x || 0, object.position?.y || 0, object.position?.z || 0]}
        rotation={[object.rotation?.x || 0, object.rotation?.y || 0, object.rotation?.z || 0]}
        scale={[object.scale?.x || 1, object.scale?.y || 1, object.scale?.z || 1]}
        onClick={(e) => { e.stopPropagation(); onSelect(index); }}
      >
        <primitive object={clone} castShadow receiveShadow />

        {/* Selection wireframe highlight */}
        {isSelected && (
          <mesh>
            <boxGeometry args={[1.1, 1.1, 1.1]} />
            <meshBasicMaterial color={DARK.selection} wireframe transparent opacity={0.5} />
          </mesh>
        )}
      </group>

      {/* TransformControls — only rendered when selected */}
      {isSelected && groupRef.current && (
        <TransformControls
          object={groupRef.current}
          mode={transformMode}
          size={0.8}
          onMouseDown={() => { if (orbitRef.current) orbitRef.current.enabled = false; }}
          onMouseUp={() => { if (orbitRef.current) orbitRef.current.enabled = true; }}
          onChange={handleTransform}
        />
      )}
    </>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Placeholder furniture (no GLB)
// ─────────────────────────────────────────────────────────────────────────────
const FurnitureItem = ({ object, index, isSelected, onSelect, orbitRef, onUpdate, transformMode }) => {
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
        position={[object.position?.x || 0, object.position?.y || 0, object.position?.z || 0]}
        rotation={[object.rotation?.x || 0, object.rotation?.y || 0, object.rotation?.z || 0]}
        scale={[object.scale?.x || 1, object.scale?.y || 1, object.scale?.z || 1]}
        onClick={(e) => { e.stopPropagation(); onSelect(index); }}
      >
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.8, 0.8, 0.8]} />
          <meshStandardMaterial
            color={isSelected ? '#3a3a3a' : '#222222'}
            emissive={isSelected ? DARK.selection : '#000000'}
            emissiveIntensity={isSelected ? 0.15 : 0}
            roughness={0.8}
            metalness={0.1}
          />
        </mesh>
      </group>

      {isSelected && groupRef.current && (
        <TransformControls
          object={groupRef.current}
          mode={transformMode}
          size={0.8}
          onMouseDown={() => { if (orbitRef.current) orbitRef.current.enabled = false; }}
          onMouseUp={() => { if (orbitRef.current) orbitRef.current.enabled = true; }}
          onChange={handleTransform}
        />
      )}
    </>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Mode toolbar button
// ─────────────────────────────────────────────────────────────────────────────
const ModeBtn = ({ active, onClick, title, shortcut, icon }) => (
  <button
    onClick={onClick}
    title={`${title} (${shortcut})`}
    className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg text-xs font-medium
                transition-all duration-150 select-none
                ${active
                  ? 'bg-white text-black shadow-sm'
                  : 'text-gray-500 hover:text-white hover:bg-white/5'
                }`}
  >
    <span className="text-base leading-none">{icon}</span>
    <span className="text-[10px] leading-none">{shortcut}</span>
  </button>
);

// ─────────────────────────────────────────────────────────────────────────────
// SceneViewer — main component
// ─────────────────────────────────────────────────────────────────────────────
const SceneViewer = ({ project, selectedIdx, onSelect, onUpdateObject }) => {
  const { roomDimensions, wallColor, objects = [] } = project || {};
  const orbitRef = useRef();

  // Transform mode: 'translate' | 'rotate' | 'scale'
  const [transformMode, setTransformMode] = useState('translate');

  // Keyboard shortcuts: W=move, E=rotate, R=scale, Escape=deselect
  useEffect(() => {
    const onKey = (e) => {
      // Ignore if typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'w' || e.key === 'W') setTransformMode('translate');
      if (e.key === 'e' || e.key === 'E') setTransformMode('rotate');
      if (e.key === 'r' || e.key === 'R') setTransformMode('scale');
      if (e.key === 'Escape') onSelect(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onSelect]);

  // Auto-switch to translate when a new object is selected
  useEffect(() => {
    if (selectedIdx !== null) setTransformMode('translate');
  }, [selectedIdx]);

  const modeHint = {
    translate: 'Drag the colored arrows to move',
    rotate:    'Drag the colored arcs to rotate',
    scale:     'Drag the colored handles to scale',
  }[transformMode];

  return (
    <div className="w-full h-full relative" style={{ background: DARK.bg }}>

      {/* ── Canvas ────────────────────────────────────────── */}
      <Canvas
        shadows
        camera={{ position: [6, 5, 6], fov: 50 }}
        style={{ background: DARK.bg }}
        onPointerMissed={() => onSelect(null)}
      >
        {/* Lighting — dark scene: subtle fill, strong key */}
        <ambientLight intensity={0.35} color="#ffffff" />
        <directionalLight
          position={[6, 10, 6]}
          intensity={1.4}
          castShadow
          shadow-mapSize={[2048, 2048]}
          color="#ffffff"
        />
        <directionalLight position={[-4, 6, -4]} intensity={0.3} color="#aaaacc" />
        <pointLight position={[0, 2, 0]} intensity={0.5} color="#e8d5b7" distance={10} />

        <Suspense fallback={null}>
          <Environment preset="night" />

          <Room dimensions={roomDimensions} wallColor={wallColor} />

          {objects.map((obj, i) =>
            obj.modelUrl ? (
              <FurnitureModel
                key={i}
                object={obj}
                index={i}
                isSelected={selectedIdx === i}
                onSelect={onSelect}
                onUpdate={onUpdateObject}
                orbitRef={orbitRef}
                transformMode={transformMode}
              />
            ) : (
              <FurnitureItem
                key={i}
                object={obj}
                index={i}
                isSelected={selectedIdx === i}
                onSelect={onSelect}
                onUpdate={onUpdateObject}
                orbitRef={orbitRef}
                transformMode={transformMode}
              />
            )
          )}
        </Suspense>

        {/* Dark grid */}
        <Grid
          args={[30, 30]}
          position={[0, 0, 0]}
          cellColor={DARK.gridCell}
          sectionColor={DARK.gridSection}
          cellThickness={0.5}
          sectionThickness={1}
          fadeDistance={25}
          infiniteGrid
        />

        <OrbitControls
          ref={orbitRef}
          makeDefault
          minPolarAngle={0}
          maxPolarAngle={Math.PI / 2.05}
          enableDamping
          dampingFactor={0.06}
        />
      </Canvas>

      {/* ── Transform Mode Toolbar ────────────────────────── */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10
                      flex items-center gap-1 px-2 py-1.5 rounded-xl
                      bg-gray-900/90 backdrop-blur-md border border-gray-800
                      shadow-[0_4px_20px_rgba(0,0,0,0.6)]">

        <ModeBtn
          active={transformMode === 'translate'}
          onClick={() => setTransformMode('translate')}
          title="Move"
          shortcut="W"
          icon="✥"
        />
        <div className="w-px h-6 bg-gray-800" />
        <ModeBtn
          active={transformMode === 'rotate'}
          onClick={() => setTransformMode('rotate')}
          title="Rotate"
          shortcut="E"
          icon="↻"
        />
        <div className="w-px h-6 bg-gray-800" />
        <ModeBtn
          active={transformMode === 'scale'}
          onClick={() => setTransformMode('scale')}
          title="Scale"
          shortcut="R"
          icon="⤢"
        />

        {/* Divider */}
        {selectedIdx !== null && (
          <>
            <div className="w-px h-6 bg-gray-800 mx-1" />
            <span className="text-[10px] text-gray-600 pr-1 font-mono">{modeHint}</span>
          </>
        )}
      </div>

      {/* ── Bottom hint bar ───────────────────────────────── */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none
                      flex items-center gap-3 px-4 py-2 rounded-full
                      bg-black/60 backdrop-blur-sm border border-gray-800/60">
        <span className="text-[11px] text-gray-600">
          <kbd className="font-mono text-gray-500 bg-gray-800 px-1.5 py-0.5 rounded text-[10px]">LMB</kbd>
          {' '}orbit
        </span>
        <span className="text-gray-800">·</span>
        <span className="text-[11px] text-gray-600">
          <kbd className="font-mono text-gray-500 bg-gray-800 px-1.5 py-0.5 rounded text-[10px]">Scroll</kbd>
          {' '}zoom
        </span>
        <span className="text-gray-800">·</span>
        <span className="text-[11px] text-gray-600">
          Click object to select
        </span>
        {selectedIdx !== null && (
          <>
            <span className="text-gray-800">·</span>
            <span className="text-[11px] text-amber-600/80">
              <kbd className="font-mono bg-gray-800 text-gray-500 px-1.5 py-0.5 rounded text-[10px]">W</kbd>
              {' '}Move{' '}
              <kbd className="font-mono bg-gray-800 text-gray-500 px-1.5 py-0.5 rounded text-[10px]">E</kbd>
              {' '}Rotate{' '}
              <kbd className="font-mono bg-gray-800 text-gray-500 px-1.5 py-0.5 rounded text-[10px]">R</kbd>
              {' '}Scale
            </span>
          </>
        )}
      </div>

      {/* ── No selection hint ─────────────────────────────── */}
      {selectedIdx === null && objects.length > 0 && (
        <div className="absolute top-4 right-4 pointer-events-none
                        bg-gray-900/80 backdrop-blur-sm border border-gray-800
                        rounded-xl px-3 py-2 text-[11px] text-gray-500">
          Click a furniture item to select it
        </div>
      )}
    </div>
  );
};

export default SceneViewer;

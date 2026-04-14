import React, { Suspense, useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, TransformControls, Html } from '@react-three/drei';
import { useGLTF } from '@react-three/drei';

/* ── Real room colours ──────────────────────────────────────────────── */
const ROOM = {
  floorColor:   '#c19a6b',   // warm oak wood
  wallColor:    '#f0ebe3',   // cream white
  ceilingColor: '#ece8e2',   // off-white
  gridCell:     '#d4cbbf',
  gridSection:  '#b0a898',
  selectionCol: '#e8d5b7',   // warm gold
  bg:           '#2d2d2d',   // warm grey ambient
};

/* ── Room geometry ──────────────────────────────────────────────────── */
function Room({ dimensions, wallColor }) {
  const { width:W=5, length:L=5, height:H=2.8 } = dimensions||{};
  const wc = wallColor || ROOM.wallColor;
  return (
    <group>
      {/* Floor — wood */}
      <mesh rotation={[-Math.PI/2,0,0]} receiveShadow>
        <planeGeometry args={[W, L]}/>
        <meshStandardMaterial color={ROOM.floorColor} roughness={0.72} metalness={0.04}/>
      </mesh>
      {/* Ceiling */}
      <mesh rotation={[Math.PI/2,0,0]} position={[0,H,0]}>
        <planeGeometry args={[W, L]}/>
        <meshStandardMaterial color={ROOM.ceilingColor} roughness={0.95} side={2}/>
      </mesh>
      {/* Back wall */}
      <mesh position={[0,H/2,-L/2]} receiveShadow>
        <planeGeometry args={[W,H]}/>
        <meshStandardMaterial color={wc} roughness={0.85}/>
      </mesh>
      {/* Left */}
      <mesh position={[-W/2,H/2,0]} rotation={[0,Math.PI/2,0]} receiveShadow>
        <planeGeometry args={[L,H]}/>
        <meshStandardMaterial color={wc} roughness={0.85}/>
      </mesh>
      {/* Right */}
      <mesh position={[W/2,H/2,0]} rotation={[0,-Math.PI/2,0]} receiveShadow>
        <planeGeometry args={[L,H]}/>
        <meshStandardMaterial color={wc} roughness={0.85}/>
      </mesh>
      {/* Front — semi-transparent */}
      <mesh position={[0,H/2,L/2]} rotation={[0,Math.PI,0]}>
        <planeGeometry args={[W,H]}/>
        <meshStandardMaterial color={wc} roughness={0.85} transparent opacity={0.10}/>
      </mesh>
    </group>
  );
}

/* ── Selection overlay + Delete button ─────────────────────────────── */
function SelectionOverlay({ height, onDelete }) {
  return (
    <Html center position={[0, (height||2.8)/2 + 0.55, 0]} distanceFactor={6}>
      <button
        onClick={e => { e.stopPropagation(); onDelete(); }}
        style={{
          display:'flex', alignItems:'center', gap:6,
          background:'#ef4444', color:'#fff',
          border:'none', borderRadius:9,
          padding:'6px 14px', fontSize:12, fontWeight:700,
          cursor:'pointer', whiteSpace:'nowrap',
          boxShadow:'0 4px 20px rgba(0,0,0,0.45)',
          userSelect:'none',
        }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" strokeWidth="2.5">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6l-1 14H6L5 6"/>
          <path d="M10 11v6M14 11v6M9 6V4h6v2"/>
        </svg>
        Delete
      </button>
    </Html>
  );
}

/* ── GLB furniture model ────────────────────────────────────────────── */
function FurnitureModel({ object, index, isSelected, onSelect, onDelete, orbitRef, transformMode }) {
  const groupRef = useRef();
  const url = object.modelUrl?.replace('/assets/models/', '/models/');
  const { scene } = useGLTF(url);
  const clone = useMemo(() => scene.clone(), [scene]);

  const onTransform = useCallback(() => {
    if (!groupRef.current) return;
    const { position:p, rotation:r, scale:s } = groupRef.current;
    object._onUpdate?.(index, {
      position:{ x:+p.x.toFixed(3), y:+p.y.toFixed(3), z:+p.z.toFixed(3) },
      rotation:{ x:+r.x.toFixed(3), y:+r.y.toFixed(3), z:+r.z.toFixed(3) },
      scale:   { x:+s.x.toFixed(3), y:+s.y.toFixed(3), z:+s.z.toFixed(3) },
    });
  }, [index, object]);

  return (
    <>
      <group ref={groupRef}
        position={[object.position?.x||0, object.position?.y||0, object.position?.z||0]}
        rotation={[object.rotation?.x||0, object.rotation?.y||0, object.rotation?.z||0]}
        scale={[object.scale?.x||1, object.scale?.y||1, object.scale?.z||1]}
        onClick={e => { e.stopPropagation(); onSelect(index); }}>
        <primitive object={clone} castShadow receiveShadow/>
        {isSelected && (
          <mesh>
            <boxGeometry args={[1.08,1.08,1.08]}/>
            <meshBasicMaterial color={ROOM.selectionCol} wireframe transparent opacity={0.45}/>
          </mesh>
        )}
      </group>

      {isSelected && groupRef.current && (
        <>
          <TransformControls object={groupRef.current} mode={transformMode} size={0.75}
            onMouseDown={() => { if(orbitRef.current) orbitRef.current.enabled=false; }}
            onMouseUp={()   => { if(orbitRef.current) orbitRef.current.enabled=true;  }}
            onChange={onTransform}/>
          <group position={[object.position?.x||0, object.position?.y||0, object.position?.z||0]}>
            <SelectionOverlay height={(object.scale?.y||1)*1.2}
              onDelete={() => onDelete(index)}/>
          </group>
        </>
      )}
    </>
  );
}

/* ── Placeholder box (no GLB) ───────────────────────────────────────── */
function FurnitureBox({ object, index, isSelected, onSelect, onDelete, orbitRef, transformMode }) {
  const groupRef = useRef();

  const onTransform = useCallback(() => {
    if (!groupRef.current) return;
    const { position:p, rotation:r, scale:s } = groupRef.current;
    object._onUpdate?.(index, {
      position:{ x:+p.x.toFixed(3), y:+p.y.toFixed(3), z:+p.z.toFixed(3) },
      rotation:{ x:+r.x.toFixed(3), y:+r.y.toFixed(3), z:+r.z.toFixed(3) },
      scale:   { x:+s.x.toFixed(3), y:+s.y.toFixed(3), z:+s.z.toFixed(3) },
    });
  }, [index, object]);

  return (
    <>
      <group ref={groupRef}
        position={[object.position?.x||0, object.position?.y||0, object.position?.z||0]}
        rotation={[object.rotation?.x||0, object.rotation?.y||0, object.rotation?.z||0]}
        scale={[object.scale?.x||1, object.scale?.y||1, object.scale?.z||1]}
        onClick={e => { e.stopPropagation(); onSelect(index); }}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.8, 0.8, 0.8]}/>
          <meshStandardMaterial
            color={isSelected ? '#c8b89a' : '#b0a080'}
            emissive={isSelected ? ROOM.selectionCol : '#000'}
            emissiveIntensity={isSelected ? 0.12 : 0}
            roughness={0.75} metalness={0.08}/>
        </mesh>
      </group>

      {isSelected && groupRef.current && (
        <>
          <TransformControls object={groupRef.current} mode={transformMode} size={0.75}
            onMouseDown={() => { if(orbitRef.current) orbitRef.current.enabled=false; }}
            onMouseUp={()   => { if(orbitRef.current) orbitRef.current.enabled=true;  }}
            onChange={onTransform}/>
          <group position={[object.position?.x||0, object.position?.y||0, object.position?.z||0]}>
            <SelectionOverlay height={0.9} onDelete={() => onDelete(index)}/>
          </group>
        </>
      )}
    </>
  );
}

/* ── Mode toolbar button ─────────────────────────────────────────────── */
const MBtn = ({ active, onClick, title, key2, icon }) => (
  <button onClick={onClick} title={`${title} (${key2})`}
    style={{all:'unset'}}
    className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg text-xs
                font-medium transition-all duration-150 select-none cursor-pointer
                ${active ? 'bg-white text-black' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>
    <span className="text-base leading-none">{icon}</span>
    <span className="text-[10px] leading-none font-mono">{key2}</span>
  </button>
);

/* ── SceneViewer ────────────────────────────────────────────────────── */
export default function SceneViewer({ project, selectedIdx, onSelect, onUpdateObject, onDeleteObject }) {
  const { roomDimensions, wallColor, objects=[] } = project||{};
  const orbitRef = useRef();
  const [mode, setMode] = useState('translate');

  // Keyboard shortcuts W/E/R/Esc
  useEffect(() => {
    const fn = e => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key==='w'||e.key==='W') setMode('translate');
      if (e.key==='e'||e.key==='E') setMode('rotate');
      if (e.key==='r'||e.key==='R') setMode('scale');
      if (e.key==='Escape') onSelect(null);
      if ((e.key==='Delete'||e.key==='Backspace') && selectedIdx!==null) {
        onDeleteObject?.(selectedIdx);
      }
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [onSelect, onDeleteObject, selectedIdx]);

  useEffect(() => { if (selectedIdx!==null) setMode('translate'); }, [selectedIdx]);

  // Inject update callback into objects (avoids prop drilling into TransformControls)
  const enrichedObjects = useMemo(() => objects.map(o => ({ ...o, _onUpdate: onUpdateObject })), [objects, onUpdateObject]);

  const { width:W=5, length:L=5, height:H=2.8 } = roomDimensions||{};
  const camPos = [W/2+W*0.8, H*1.4, L+L*0.5];

  return (
    <div className="w-full h-full relative" style={{background: ROOM.bg}}>

      <Canvas shadows camera={{position:camPos, fov:50}}
        style={{background: ROOM.bg}} onPointerMissed={() => onSelect(null)}>

        {/* Warm daylight */}
        <ambientLight intensity={0.9} color="#fff8f0"/>
        <directionalLight position={[W/2+4, H*2, L/2+4]} intensity={1.8}
          castShadow shadow-mapSize={[2048,2048]} color="#fff5e8"/>
        <directionalLight position={[-4, H+2, -3]} intensity={0.4} color="#c8d4e8"/>
        <pointLight position={[W/2, H-0.3, L/2]} intensity={0.6} color="#ffe8c8" distance={12}/>

        <Suspense fallback={null}>
          <Environment preset="apartment"/>
          <Room dimensions={roomDimensions} wallColor={wallColor}/>

          {enrichedObjects.map((obj, i) =>
            obj.modelUrl
              ? <FurnitureModel key={i} object={obj} index={i}
                  isSelected={selectedIdx===i} onSelect={onSelect}
                  onDelete={onDeleteObject} orbitRef={orbitRef} transformMode={mode}/>
              : <FurnitureBox key={i} object={obj} index={i}
                  isSelected={selectedIdx===i} onSelect={onSelect}
                  onDelete={onDeleteObject} orbitRef={orbitRef} transformMode={mode}/>
          )}
        </Suspense>

        {/* Subtle floor grid */}
        <gridHelper args={[Math.max(W,L)*2, Math.max(W,L)*4, ROOM.gridSection, ROOM.gridCell]}
          position={[0, 0.001, 0]}/>

        <OrbitControls ref={orbitRef} makeDefault enableDamping dampingFactor={0.06}
          minPolarAngle={0} maxPolarAngle={Math.PI/2.05}/>
      </Canvas>

      {/* ── Transform toolbar ─────────────────────────────────── */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10
                      flex items-center gap-1 px-2 py-1.5 rounded-xl
                      bg-white/90 backdrop-blur-md border border-gray-200
                      shadow-[0_4px_20px_rgba(0,0,0,0.18)]">
        <MBtn active={mode==='translate'} onClick={()=>setMode('translate')} title="Move"   key2="W" icon="✥"/>
        <div className="w-px h-5 bg-black-400"/>
        <MBtn active={mode==='rotate'}    onClick={()=>setMode('rotate')}    title="Rotate" key2="E" icon="↻"/>
        <div className="w-px h-5 bg-black-400"/>
        <MBtn active={mode==='scale'}     onClick={()=>setMode('scale')}     title="Scale"  key2="R" icon="⤢"/>
        {selectedIdx!==null && (
          <>
            <div className="w-px h-5 bg-black-400 mx-0.5"/>
            <button
              onClick={() => onDeleteObject?.(selectedIdx)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium
                         text-red-500 hover:bg-red-50 transition-colors">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" strokeWidth="2.5">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14H6L5 6"/>
              </svg>
              Delete
            </button>
          </>
        )}
      </div>

      {/* ── Bottom hints ──────────────────────────────────────── */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none
                      flex items-center gap-3 px-4 py-2 rounded-full
                      bg-black/40 backdrop-blur-sm border border-black/10">
        <span className="text-[11px] text-white/60">
          <kbd className="font-mono bg-black/20 px-1.5 py-0.5 rounded text-[10px]">LMB</kbd> orbit
        </span>
        <span className="text-white/25">·</span>
        <span className="text-[11px] text-white/60">
          <kbd className="font-mono bg-black/20 px-1.5 py-0.5 rounded text-[10px]">Scroll</kbd> zoom
        </span>
        {selectedIdx!==null && (
          <>
            <span className="text-white/25">·</span>
            <span className="text-[11px] text-amber-700/80">
              <kbd className="font-mono bg-black/15 px-1 py-0.5 rounded text-[10px]">W</kbd> Move &nbsp;
              <kbd className="font-mono bg-black/15 px-1 py-0.5 rounded text-[10px]">E</kbd> Rotate &nbsp;
              <kbd className="font-mono bg-black/15 px-1 py-0.5 rounded text-[10px]">R</kbd> Scale &nbsp;
              <kbd className="font-mono bg-black/15 px-1 py-0.5 rounded text-[10px]">Del</kbd> Delete
            </span>
          </>
        )}
      </div>
    </div>
  );
}

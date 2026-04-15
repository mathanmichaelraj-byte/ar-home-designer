import React, { Suspense, useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, TransformControls, Html, ContactShadows } from '@react-three/drei';
import { useGLTF } from '@react-three/drei';
import { SCENE } from '../utils/constants';
import { round } from '../utils/helpers';

/* ── Room geometry ──────────────────────────────────────────────────── */
function Room({ dimensions, wallColor }) {
  const { width:W=5, length:L=5, height:H=2.8 } = dimensions||{};
  const wc  = wallColor || SCENE.wallColor;
  const sk  = '#d4b896';
  const skH = 0.12;
  const skD = 0.04;

  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI/2,0,0]} receiveShadow position={[W/2,0,L/2]}>
        <planeGeometry args={[W,L]}/>
        <meshStandardMaterial color={SCENE.floorColor} roughness={SCENE.floorRough||0.65} metalness={0.02}/>
      </mesh>
      {/* Ceiling */}
      <mesh rotation={[Math.PI/2,0,0]} position={[W/2,H,L/2]}>
        <planeGeometry args={[W,L]}/>
        <meshStandardMaterial color={SCENE.ceilingColor} roughness={0.9} side={2}/>
      </mesh>
      {/* Back wall */}
      <mesh position={[W/2,H/2,0]} receiveShadow>
        <planeGeometry args={[W,H]}/>
        <meshStandardMaterial color={wc} roughness={0.82}/>
      </mesh>
      {/* Left wall */}
      <mesh position={[0,H/2,L/2]} rotation={[0,Math.PI/2,0]} receiveShadow>
        <planeGeometry args={[L,H]}/>
        <meshStandardMaterial color={wc} roughness={0.82}/>
      </mesh>
      {/* Right wall */}
      <mesh position={[W,H/2,L/2]} rotation={[0,-Math.PI/2,0]} receiveShadow>
        <planeGeometry args={[L,H]}/>
        <meshStandardMaterial color={wc} roughness={0.82}/>
      </mesh>
      {/* Front wall — semi-transparent */}
      <mesh position={[W/2,H/2,L]} rotation={[0,Math.PI,0]}>
        <planeGeometry args={[W,H]}/>
        <meshStandardMaterial color={wc} roughness={0.82} transparent opacity={0.08}/>
      </mesh>

      {/* Skirting boards */}
      <mesh position={[W/2,skH/2,skD/2]} castShadow>
        <boxGeometry args={[W,skH,skD]}/>
        <meshStandardMaterial color={sk} roughness={0.5}/>
      </mesh>
      <mesh position={[skD/2,skH/2,L/2]} castShadow>
        <boxGeometry args={[skD,skH,L]}/>
        <meshStandardMaterial color={sk} roughness={0.5}/>
      </mesh>
      <mesh position={[W-skD/2,skH/2,L/2]} castShadow>
        <boxGeometry args={[skD,skH,L]}/>
        <meshStandardMaterial color={sk} roughness={0.5}/>
      </mesh>

      {/* Ceiling cornice */}
      <mesh position={[W/2,H-0.04,skD/2]}>
        <boxGeometry args={[W,0.08,skD]}/>
        <meshStandardMaterial color="#ede8e0" roughness={0.6}/>
      </mesh>
      <mesh position={[skD/2,H-0.04,L/2]}>
        <boxGeometry args={[skD,0.08,L]}/>
        <meshStandardMaterial color="#ede8e0" roughness={0.6}/>
      </mesh>
      <mesh position={[W-skD/2,H-0.04,L/2]}>
        <boxGeometry args={[skD,0.08,L]}/>
        <meshStandardMaterial color="#ede8e0" roughness={0.6}/>
      </mesh>
    </group>
  );
}

/* ── Selection overlay ──────────────────────────────────────────────── */
function SelectionOverlay({ height, name, onDelete }) {
  return (
    <Html center position={[0,(height||1.4)/2+0.65,0]} distanceFactor={7}>
      <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:6,pointerEvents:'none'}}>
        <div style={{
          background:'rgba(255,255,255,0.96)',color:'#111',borderRadius:8,
          padding:'3px 10px',fontSize:11,fontWeight:600,whiteSpace:'nowrap',
          boxShadow:'0 2px 12px rgba(0,0,0,0.15)',border:'1px solid rgba(0,0,0,0.08)',
        }}>
          {name}
        </div>
        <button
          onClick={e=>{e.stopPropagation();onDelete();}}
          style={{
            pointerEvents:'all',display:'flex',alignItems:'center',gap:5,
            background:'#ef4444',color:'#fff',border:'none',borderRadius:8,
            padding:'5px 13px',fontSize:11,fontWeight:700,cursor:'pointer',
            whiteSpace:'nowrap',boxShadow:'0 3px 14px rgba(239,68,68,0.4)',userSelect:'none',
          }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14H6L5 6"/>
            <path d="M10 11v6M14 11v6M9 6V4h6v2"/>
          </svg>
          Remove
        </button>
      </div>
    </Html>
  );
}

/* ── GLB furniture model ────────────────────────────────────────────── */
function FurnitureModel({ object, index, isSelected, onSelect, orbitRef, transformMode }) {
  const groupRef = useRef();
  const url = object.modelUrl?.replace('/assets/models/', '/models/');
  const { scene } = useGLTF(url);
  const clone = useMemo(() => scene.clone(), [scene]);

  const onTransform = useCallback(() => {
    if (!groupRef.current) return;
    const { position:p, rotation:r, scale:s } = groupRef.current;
    object._onUpdate?.(index, {
      position:{ x:round(p.x), y:round(p.y), z:round(p.z) },
      rotation:{ x:round(r.x), y:round(r.y), z:round(r.z) },
      scale:   { x:round(s.x), y:round(s.y), z:round(s.z) },
    });
  }, [index, object]);

  return (
    <>
      <group ref={groupRef}
        position={[object.position?.x||0, object.position?.y||0, object.position?.z||0]}
        rotation={[object.rotation?.x||0, object.rotation?.y||0, object.rotation?.z||0]}
        scale={[object.scale?.x||1, object.scale?.y||1, object.scale?.z||1]}
        onClick={e=>{e.stopPropagation();onSelect(index);}}>
        <primitive object={clone} castShadow receiveShadow/>
        {isSelected && (
          <mesh>
            <boxGeometry args={[1.08,1.08,1.08]}/>
            <meshBasicMaterial color={SCENE.selectionCol} wireframe transparent opacity={0.5}/>
          </mesh>
        )}
      </group>
      {isSelected && groupRef.current && (
        <>
          <TransformControls object={groupRef.current} mode={transformMode} size={0.8}
            onMouseDown={()=>{if(orbitRef.current) orbitRef.current.enabled=false;}}
            onMouseUp={()  =>{if(orbitRef.current) orbitRef.current.enabled=true; }}
            onChange={onTransform}/>
          <group position={[object.position?.x||0, object.position?.y||0, object.position?.z||0]}>
            <SelectionOverlay height={(object.scale?.y||1)*1.2}
              name={object.name} onDelete={()=>object._onDelete?.(index)}/>
          </group>
        </>
      )}
    </>
  );
}

/* ── Placeholder box (no GLB) ───────────────────────────────────────── */
function FurnitureBox({ object, index, isSelected, onSelect, orbitRef, transformMode }) {
  const groupRef = useRef();

  const onTransform = useCallback(() => {
    if (!groupRef.current) return;
    const { position:p, rotation:r, scale:s } = groupRef.current;
    object._onUpdate?.(index, {
      position:{ x:round(p.x), y:round(p.y), z:round(p.z) },
      rotation:{ x:round(r.x), y:round(r.y), z:round(r.z) },
      scale:   { x:round(s.x), y:round(s.y), z:round(s.z) },
    });
  }, [index, object]);

  return (
    <>
      <group ref={groupRef}
        position={[object.position?.x||0, object.position?.y||0, object.position?.z||0]}
        rotation={[object.rotation?.x||0, object.rotation?.y||0, object.rotation?.z||0]}
        scale={[object.scale?.x||1, object.scale?.y||1, object.scale?.z||1]}
        onClick={e=>{e.stopPropagation();onSelect(index);}}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.8,0.8,0.8]}/>
          <meshStandardMaterial
            color={isSelected ? '#7c9cbf' : '#a0b4c8'}
            emissive={isSelected ? SCENE.selectionCol : '#000'}
            emissiveIntensity={isSelected ? 0.06 : 0}
            roughness={0.6} metalness={0.1}/>
        </mesh>
      </group>
      {isSelected && groupRef.current && (
        <>
          <TransformControls object={groupRef.current} mode={transformMode} size={0.8}
            onMouseDown={()=>{if(orbitRef.current) orbitRef.current.enabled=false;}}
            onMouseUp={()  =>{if(orbitRef.current) orbitRef.current.enabled=true; }}
            onChange={onTransform}/>
          <group position={[object.position?.x||0, object.position?.y||0, object.position?.z||0]}>
            <SelectionOverlay height={0.9}
              name={object.name} onDelete={()=>object._onDelete?.(index)}/>
          </group>
        </>
      )}
    </>
  );
}

/* ── Empty room hint ─────────────────────────────────────────────────── */
function EmptyHint({ W, L }) {
  return (
    <Html center position={[W/2, 1.2, L/2]} distanceFactor={8}>
      <div style={{
        textAlign:'center', pointerEvents:'none',
        background:'rgba(255,255,255,0.9)', backdropFilter:'blur(8px)',
        border:'1px solid rgba(0,0,0,0.08)', borderRadius:14,
        padding:'18px 28px', boxShadow:'0 4px 24px rgba(0,0,0,0.10)',
      }}>
        <div style={{fontSize:30,marginBottom:8}}>🛋️</div>
        <div style={{fontSize:13,fontWeight:700,color:'#111',marginBottom:4}}>Room is empty</div>
        <div style={{fontSize:11,color:'#888',lineHeight:1.5}}>Add furniture from the panel on the left</div>
      </div>
    </Html>
  );
}

/* ── Mode toolbar button ─────────────────────────────────────────────── */
const MBtn = ({ active, onClick, title, key2, icon, label }) => (
  <button onClick={onClick} title={`${title} (${key2})`}
    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold
                transition-all duration-150 select-none cursor-pointer border-0
                ${active
                  ? 'bg-gray-900 text-white shadow-sm'
                  : 'bg-transparent text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}>
    <span className="text-sm leading-none">{icon}</span>
    <span>{label}</span>
    <span className={`text-[9px] font-mono px-1 py-0.5 rounded
                      ${active ? 'bg-white/20 text-white/70' : 'bg-gray-200 text-gray-400'}`}>
      {key2}
    </span>
  </button>
);

/* ── SceneViewer ────────────────────────────────────────────────────── */
export default function SceneViewer({ project, selectedIdx, onSelect, onUpdateObject, onDeleteObject }) {
  const { roomDimensions, wallColor, objects=[] } = project||{};
  const orbitRef = useRef();
  const [mode, setMode] = useState('translate');

  useEffect(() => {
    const fn = e => {
      if (e.target.tagName==='INPUT' || e.target.tagName==='TEXTAREA') return;
      if (e.key==='w'||e.key==='W') setMode('translate');
      if (e.key==='e'||e.key==='E') setMode('rotate');
      if (e.key==='r'||e.key==='R') setMode('scale');
      if (e.key==='Escape') onSelect(null);
      if ((e.key==='Delete'||e.key==='Backspace') && selectedIdx!==null)
        onDeleteObject?.(selectedIdx);
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [onSelect, onDeleteObject, selectedIdx]);

  useEffect(() => { if (selectedIdx!==null) setMode('translate'); }, [selectedIdx]);

  const enrichedObjects = useMemo(
    () => objects.map(o => ({ ...o, _onUpdate: onUpdateObject, _onDelete: onDeleteObject })),
    [objects, onUpdateObject, onDeleteObject]
  );

  const { width:W=5, length:L=5, height:H=2.8 } = roomDimensions||{};
  const camPos    = [W + W*0.7, H*1.2, L + L*0.6];
  const camTarget = [W/2, H*0.35, L/2];
  const selectedObj = selectedIdx !== null ? objects[selectedIdx] : null;

  return (
    <div className="w-full h-full relative" style={{background: SCENE.bg}}>

      <Canvas shadows dpr={[1,2]} camera={{position:camPos, fov:48}}
        style={{background: SCENE.bg}} onPointerMissed={()=>onSelect(null)}>

        {/* Natural daylight — main sun from right side */}
        <ambientLight intensity={0.7} color="#fff8f0"/>
        <directionalLight
          position={[W+6, H*2.2, L/2]} intensity={2.2} color="#fff5e0"
          castShadow
          shadow-mapSize={[2048,2048]}
          shadow-camera-near={0.5} shadow-camera-far={50}
          shadow-camera-left={-12} shadow-camera-right={12}
          shadow-camera-top={12}  shadow-camera-bottom={-12}
          shadow-bias={-0.001}/>
        {/* Soft fill from left */}
        <directionalLight position={[-4,H+1,L/2]} intensity={0.5} color="#ddeeff"/>
        {/* Warm ceiling bounce */}
        <pointLight position={[W/2,H*0.9,L/2]} intensity={0.8} color="#ffe8c8" distance={W*3}/>
        {/* Floor bounce */}
        <pointLight position={[W/2,0.3,L/2]} intensity={0.3} color="#f0d8b0" distance={W*2}/>

        <Suspense fallback={null}>
          <Environment preset="apartment" background={false}/>
          <Room dimensions={roomDimensions} wallColor={wallColor}/>

          <ContactShadows
            position={[W/2,0.01,L/2]}
            width={W*1.5} height={L*1.5}
            far={1.5} blur={2.5} opacity={0.3} color="#8b6a40"/>

          {objects.length===0 && <EmptyHint W={W} L={L}/>}

          {enrichedObjects.map((obj,i) =>
            obj.modelUrl
              ? <FurnitureModel key={obj.furnitureId ? `${obj.furnitureId}-${i}` : i}
                  object={obj} index={i}
                  isSelected={selectedIdx===i} onSelect={onSelect}
                  orbitRef={orbitRef} transformMode={mode}/>
              : <FurnitureBox key={i} object={obj} index={i}
                  isSelected={selectedIdx===i} onSelect={onSelect}
                  orbitRef={orbitRef} transformMode={mode}/>
          )}
        </Suspense>

        <gridHelper
          args={[Math.max(W,L)*2.5, Math.max(W,L)*5, SCENE.gridSection, SCENE.gridCell]}
          position={[W/2,0.002,L/2]}/>

        <OrbitControls ref={orbitRef} makeDefault enableDamping dampingFactor={0.07}
          target={camTarget}
          minPolarAngle={0.1} maxPolarAngle={Math.PI/2.1}
          minDistance={1.5} maxDistance={Math.max(W,L)*3}/>
      </Canvas>

      {/* ── Transform toolbar — only when a model is selected ── */}
      {selectedIdx !== null && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10
                        flex items-center gap-0.5 px-2 py-1.5 rounded-2xl
                        bg-white border border-gray-200
                        shadow-[0_4px_24px_rgba(0,0,0,0.13)]">
          {selectedObj && (
            <>
              <span className="text-[11px] font-semibold text-gray-700 px-2 max-w-[120px] truncate">
                {selectedObj.name}
              </span>
              <div className="w-px h-5 bg-gray-200 mx-1"/>
            </>
          )}
          <MBtn active={mode==='translate'} onClick={()=>setMode('translate')}
            title="Move"   key2="W" icon="✥" label="Move"/>
          <div className="w-px h-5 bg-gray-200"/>
          <MBtn active={mode==='rotate'}    onClick={()=>setMode('rotate')}
            title="Rotate" key2="E" icon="↻" label="Rotate"/>
          <div className="w-px h-5 bg-gray-200"/>
          <MBtn active={mode==='scale'}     onClick={()=>setMode('scale')}
            title="Scale"  key2="R" icon="⤢" label="Scale"/>
          <div className="w-px h-5 bg-gray-200 mx-1"/>
          <button
            onClick={()=>onDeleteObject?.(selectedIdx)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold
                       text-red-500 hover:bg-red-50 transition-colors">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="2.5">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14H6L5 6"/>
            </svg>
            Delete
          </button>
          <button
            onClick={()=>onSelect(null)}
            title="Deselect (Esc)"
            className="ml-1 w-7 h-7 flex items-center justify-center rounded-lg
                       text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      )}

      {/* ── Object count badge ── */}
      {objects.length > 0 && selectedIdx === null && (
        <div className="absolute top-4 right-4 z-10 pointer-events-none
                        flex items-center gap-1.5 px-3 py-1.5 rounded-full
                        bg-white/90 border border-gray-200 shadow-sm
                        text-xs font-medium text-gray-600">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="2">
            <path d="M20 7H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/>
            <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/>
          </svg>
          {objects.length} item{objects.length!==1?'s':''}
        </div>
      )}

      {/* ── Bottom hints ── */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none
                      flex items-center gap-2.5 px-4 py-2 rounded-full
                      bg-black/50 backdrop-blur-sm border border-white/10">
        <span className="text-[11px] text-white/80">
          <kbd className="font-mono bg-white/15 px-1.5 py-0.5 rounded text-[10px]">Drag</kbd> orbit
        </span>
        <span className="text-white/30">·</span>
        <span className="text-[11px] text-white/80">
          <kbd className="font-mono bg-white/15 px-1.5 py-0.5 rounded text-[10px]">Scroll</kbd> zoom
        </span>
        <span className="text-white/30">·</span>
        <span className="text-[11px] text-white/80">
          <kbd className="font-mono bg-white/15 px-1.5 py-0.5 rounded text-[10px]">Click</kbd> select
        </span>
        {selectedIdx!==null && (
          <>
            <span className="text-white/30">·</span>
            <span className="text-[11px] text-white/80">
              <kbd className="font-mono bg-white/15 px-1 py-0.5 rounded text-[10px]">W</kbd>{' '}
              <kbd className="font-mono bg-white/15 px-1 py-0.5 rounded text-[10px]">E</kbd>{' '}
              <kbd className="font-mono bg-white/15 px-1 py-0.5 rounded text-[10px]">R</kbd> transform
              {' · '}
              <kbd className="font-mono bg-white/15 px-1 py-0.5 rounded text-[10px]">Esc</kbd> deselect
            </span>
          </>
        )}
      </div>
    </div>
  );
}

import React, { useMemo, useEffect, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { ROOM_PAL_3D, ROOM_EMOJI, SCENE, G2M } from '../utils/constants';
import { floorLabel } from '../utils/helpers';

const FLOOR_H = SCENE.floorH;
const PAL     = ROOM_PAL_3D;
const EMOJI   = ROOM_EMOJI;
const FLR     = floorLabel;

/* ── Floor slab ─────────────────────────────────────────────────────── */
function Slab({ n, W, D }) {
  const y = (n-1)*FLOOR_H - 0.07;
  return (
    <group>
      <mesh position={[W/2, y, D/2]} receiveShadow>
        <boxGeometry args={[W+6, 0.14, D+6]} />
        <meshStandardMaterial color="#131313" roughness={0.95} />
      </mesh>
      <gridHelper args={[Math.max(W,D)+4, 18, '#252525', '#1c1c1c']}
        position={[W/2, y+0.08, D/2]} />
      <Html position={[-1.5, y+0.45, D/2]} center distanceFactor={14}>
        <div style={{background:'rgba(8,8,8,0.88)',border:'1px solid #2a2a2a',
          borderRadius:7,padding:'3px 10px',fontSize:10,fontFamily:'monospace',
          color:'#555',whiteSpace:'nowrap',pointerEvents:'none'}}>
          {FLR(n)}
        </div>
      </Html>
    </group>
  );
}

/* ── Stair column ───────────────────────────────────────────────────── */
function Stair({ fromFloor }) {
  const y0 = (fromFloor-1)*FLOOR_H - 0.07;
  const y1 = fromFloor*FLOOR_H - 0.07;
  return (
    <mesh position={[1.2, (y0+y1)/2, 1.2]}>
      <cylinderGeometry args={[0.18, 0.18, y1-y0, 6]} />
      <meshStandardMaterial color="#333" roughness={0.9} />
    </mesh>
  );
}

/* ── Room box ───────────────────────────────────────────────────────── */
function RoomBox({ room, idx, sel, onSel, onEdit }) {
  const { width:W=5, length:L=5, height:H=2.8 } = room.dimensions||{};
  const fl  = room.floor||1;
  const p2  = room.position2D||{ x:40+idx*22, y:40+idx*22 };
  const x   = p2.x*G2M + W/2;
  const z   = p2.y*G2M + L/2;
  const y   = (fl-1)*FLOOR_H + H/2;
  const pal = PAL[room.type]||PAL.other;

  const edges = useMemo(
    () => new THREE.EdgesGeometry(new THREE.BoxGeometry(W+0.06, H+0.06, L+0.06)),
    [W, H, L]
  );

  return (
    <group position={[x, y, z]}>
      {/* Volume */}
      <mesh castShadow receiveShadow
        onClick={e => { e.stopPropagation(); onSel(idx); }}
        onDoubleClick={e => { e.stopPropagation(); onEdit(idx); }}>
        <boxGeometry args={[W, H*0.98, L]} />
        <meshStandardMaterial color={pal.fill}
          emissive={sel ? pal.fill : '#000'} emissiveIntensity={sel?0.28:0}
          transparent opacity={sel?0.9:0.62} roughness={0.72} metalness={0.06}/>
      </mesh>

      {/* Floor tint */}
      <mesh position={[0, -H*0.49+0.01, 0]}>
        <planeGeometry args={[W, L]} />
        <meshStandardMaterial color={pal.line} transparent opacity={0.28}/>
      </mesh>

      {/* Selection edges */}
      {sel && (
        <lineSegments geometry={edges}>
          <lineBasicMaterial color="#ffffff" transparent opacity={0.65}/>
        </lineSegments>
      )}

      {/* Name badge */}
      <Html center position={[0, H/2+0.5, 0]} distanceFactor={10}>
        <div style={{background:sel?'#fff':'rgba(0,0,0,0.75)',color:sel?'#000':'#ddd',
          border:sel?'none':'1px solid rgba(255,255,255,0.1)',
          padding:'3px 10px',borderRadius:7,fontSize:11,fontWeight:600,
          whiteSpace:'nowrap',pointerEvents:'none',backdropFilter:'blur(4px)'}}>
          {EMOJI[room.type]||'🏠'} {room.name}
        </div>
      </Html>

      {/* Dim + Edit button on selection */}
      {sel && (
        <>
          <Html center position={[0, -H/2-0.5, 0]} distanceFactor={10}>
            <div style={{background:'rgba(0,0,0,0.6)',color:'#666',padding:'2px 8px',
              borderRadius:5,fontSize:10,fontFamily:'monospace',pointerEvents:'none',whiteSpace:'nowrap'}}>
              {W}×{L}×{H} m
            </div>
          </Html>
          <Html center position={[0, H/2+1.1, 0]} distanceFactor={10}>
            <button onClick={() => onEdit(idx)}
              style={{background:'#fff',color:'#000',border:'none',borderRadius:8,
                padding:'5px 14px',fontSize:11,fontWeight:700,cursor:'pointer',
                whiteSpace:'nowrap',boxShadow:'0 4px 18px rgba(0,0,0,0.55)'}}>
              Edit in 3D →
            </button>
          </Html>
        </>
      )}
    </group>
  );
}

/* ── Camera setup ───────────────────────────────────────────────────── */
function CameraSetup({ cam, tgt }) {
  const { camera, invalidate } = useThree();
  const initialized = useRef(false);
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    camera.position.set(...cam);
    camera.lookAt(...tgt);
    invalidate();
  }, [cam, tgt, camera, invalidate]);
  return null;
}

/* ── Main component ─────────────────────────────────────────────────── */
export default function FloorPlan3D({ house, selectedRoomIdx, onSelectRoom }) {
  const rooms  = useMemo(() => house?.rooms||[], [house?.rooms]);
  const floors = useMemo(() => {
    const s = new Set(rooms.map(r => r.floor||1));
    return Array.from(s).sort((a,b)=>a-b);
  }, [rooms]);

  const maxF = floors.length ? Math.max(...floors) : 1;

  const bounds = useMemo(() => {
    let mX=12, mZ=12;
    rooms.forEach(r => {
      const p = r.position2D||{x:40,y:40};
      const d = r.dimensions||{width:5,length:5};
      mX = Math.max(mX, p.x*G2M + (d.width||5));
      mZ = Math.max(mZ, p.y*G2M + (d.length||5));
    });
    return { W: mX, D: mZ };
  }, [rooms]);

  const totalH = maxF * FLOOR_H;
  const dist   = Math.max(bounds.W, bounds.D) * 1.7;
  const cam    = [bounds.W/2 + dist*0.85, totalH + dist*0.5, bounds.D/2 + dist*0.95];
  const tgt    = [bounds.W/2, totalH/2, bounds.D/2];

  const byFloor = useMemo(() => {
    const m = {};
    rooms.forEach(r => { const f=r.floor||1; if(!m[f]) m[f]=[]; m[f].push(r); });
    return m;
  }, [rooms]);

  return (
    <div className="w-full h-full relative" style={{background:'#080808'}}>
      <Canvas shadows dpr={[1,2]} camera={{position:cam, fov:42, near:0.1, far:500}}
        style={{background:'#080808'}} onPointerMissed={() => onSelectRoom(null)}>

        <CameraSetup cam={cam} tgt={tgt}/>
        <ambientLight intensity={0.4}/>
        <directionalLight position={[22,38,18]} intensity={1.35} castShadow
          shadow-mapSize={[2048,2048]}/>
        <directionalLight position={[-12,18,-8]} intensity={0.22} color="#99aacc"/>
        <pointLight position={[bounds.W/2, totalH+3, bounds.D/2]}
          intensity={0.55} color="#ffe8c8" distance={50}/>

        {/* Slabs */}
        {floors.map(f => <Slab key={f} n={f} W={bounds.W} D={bounds.D}/>)}

        {/* Stairs between floors */}
        {floors.slice(1).map(f => <Stair key={`s${f}`} fromFloor={f-1}/>)}

        {/* Rooms */}
        {rooms.map((r,i) => (
          <RoomBox key={r._id||i} room={r} idx={i}
            sel={selectedRoomIdx===i}
            onSel={onSelectRoom}
            onEdit={idx => onSelectRoom(idx, true)}/>
        ))}

        <OrbitControls makeDefault enableDamping dampingFactor={0.06} enablePan
          target={tgt}
          minPolarAngle={0.12} maxPolarAngle={Math.PI/2.05}
          minDistance={3} maxDistance={90}/>
      </Canvas>

      {/* Floor legend */}
      <div className="absolute bottom-4 left-4 flex flex-col gap-1.5 pointer-events-none">
        {floors.map(f => (
          <div key={f} className="flex items-center gap-2 bg-black/75 backdrop-blur-sm
                                   border border-gray-800 rounded-lg px-3 py-1.5">
            <div className="w-2 h-2 rounded-full bg-gray-600"/>
            <span className="text-xs text-gray-500 font-mono">{FLR(f)}</span>
            <span className="text-[11px] text-gray-700 ml-1">
              {(byFloor[f]||[]).length} room{(byFloor[f]||[]).length!==1?'s':''}
            </span>
          </div>
        ))}
      </div>

      {/* Hint */}
      <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-sm
                      border border-gray-800 rounded-lg px-3 py-2 pointer-events-none
                      text-[11px] text-gray-600 font-mono leading-relaxed">
        <div>Click — select &nbsp;·&nbsp; Double-click — edit 3D</div>
        <div>Drag — orbit &nbsp;·&nbsp; Scroll — zoom</div>
      </div>
    </div>
  );
}

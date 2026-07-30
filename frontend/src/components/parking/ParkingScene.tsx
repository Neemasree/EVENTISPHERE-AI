import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

// ── Single detailed car ───────────────────────────────────────────────────────
function Car({ x, z, color }: { x: number; z: number; color: string }) {
  const c = new THREE.Color(color);
  return (
    <group position={[x, 0.18, z]}>
      {/* Body */}
      <mesh castShadow>
        <boxGeometry args={[0.7, 0.22, 1.4]} />
        <meshStandardMaterial color={c} metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Cabin */}
      <mesh position={[0, 0.2, -0.05]} castShadow>
        <boxGeometry args={[0.54, 0.18, 0.7]} />
        <meshStandardMaterial color={c} metalness={0.5} roughness={0.25} />
      </mesh>
      {/* Windshield front */}
      <mesh position={[0, 0.2, 0.32]} rotation={[0.35, 0, 0]}>
        <planeGeometry args={[0.5, 0.18]} />
        <meshStandardMaterial color="#88ccff" transparent opacity={0.7} metalness={0.1} roughness={0} />
      </mesh>
      {/* Windshield rear */}
      <mesh position={[0, 0.2, -0.42]} rotation={[-0.35, 0, 0]}>
        <planeGeometry args={[0.5, 0.18]} />
        <meshStandardMaterial color="#88ccff" transparent opacity={0.55} metalness={0.1} roughness={0} />
      </mesh>
      {/* Headlights */}
      {[-0.22, 0.22].map((lx, i) => (
        <mesh key={i} position={[lx, 0, 0.71]}>
          <boxGeometry args={[0.13, 0.07, 0.04]} />
          <meshStandardMaterial color="#ffffcc" emissive="#ffff88" emissiveIntensity={1.2} />
        </mesh>
      ))}
      {/* Tail lights */}
      {[-0.22, 0.22].map((lx, i) => (
        <mesh key={i} position={[lx, 0, -0.71]}>
          <boxGeometry args={[0.13, 0.07, 0.04]} />
          <meshStandardMaterial color="#ff2222" emissive="#ff0000" emissiveIntensity={0.9} />
        </mesh>
      ))}
      {/* Bumpers */}
      <mesh position={[0, -0.04, 0.72]}>
        <boxGeometry args={[0.65, 0.1, 0.06]} />
        <meshStandardMaterial color="#222" metalness={0.8} roughness={0.4} />
      </mesh>
      <mesh position={[0, -0.04, -0.72]}>
        <boxGeometry args={[0.65, 0.1, 0.06]} />
        <meshStandardMaterial color="#222" metalness={0.8} roughness={0.4} />
      </mesh>
      {/* 4 Wheels */}
      {[[-0.36, -0.09, 0.42], [0.36, -0.09, 0.42], [-0.36, -0.09, -0.42], [0.36, -0.09, -0.42]].map(([wx, wy, wz], i) => (
        <group key={i} position={[wx, wy, wz]} rotation={[0, 0, Math.PI / 2]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.12, 0.12, 0.1, 12]} />
            <meshStandardMaterial color="#111" roughness={0.9} />
          </mesh>
          {/* Rim */}
          <mesh>
            <cylinderGeometry args={[0.07, 0.07, 0.11, 8]} />
            <meshStandardMaterial color="#888" metalness={0.9} roughness={0.2} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ── Slot bay marking ──────────────────────────────────────────────────────────
function SlotMarking({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0.001, z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.82, 1.55]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.06} />
      </mesh>
      {/* Left line */}
      <mesh position={[-0.41, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.025, 1.55]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.18} />
      </mesh>
      {/* Right line */}
      <mesh position={[0.41, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.025, 1.55]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.18} />
      </mesh>
    </group>
  );
}

// ── Parking lot for one zone ──────────────────────────────────────────────────
function ParkingLot({
  occupied, capacity, offsetX, color, accentColor, label,
}: {
  occupied: number; capacity: number; offsetX: number;
  color: string; accentColor: string; label: string;
}) {
  const COLS = 10, ROWS = 10;
  const filledCount = Math.round((Math.min(occupied, capacity) / capacity) * (COLS * ROWS));

  // Tarmac color shifts with occupancy
  const pct = occupied / capacity;
  const tarmacColor = useMemo(() => {
    if (pct >= 0.95) return '#2a0a0a';
    if (pct >= 0.80) return '#1a1008';
    if (pct >= 0.60) return '#0a1208';
    return '#080c10';
  }, [pct]);

  const carColors = ['#1a6fff', '#ff4444', '#ffaa00', '#44ff88', '#cc44ff', '#ff8800', '#00ccff', '#ff44cc'];

  return (
    <group position={[offsetX, 0, 0]}>
      {/* Tarmac base */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.001, 0]}>
        <planeGeometry args={[10.5, 17]} />
        <meshStandardMaterial color={tarmacColor} roughness={0.95} metalness={0} />
      </mesh>

      {/* Lot border lines */}
      {[[-5.25, 0, 0], [5.25, 0, 0]].map(([bx, by, bz], i) => (
        <mesh key={i} position={[bx, 0.002, bz]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.06, 17]} />
          <meshStandardMaterial color={accentColor} transparent opacity={0.4} />
        </mesh>
      ))}

      {/* Accent point lights */}
      <pointLight position={[-4.5, 3, -7]} intensity={0.6} color={accentColor} distance={12} />
      <pointLight position={[4.5, 3, 7]} intensity={0.4} color={accentColor} distance={10} />

      {/* Slots + cars */}
      {Array.from({ length: COLS * ROWS }, (_, idx) => {
        const col = idx % COLS;
        const row = Math.floor(idx / COLS);
        const x = (col - (COLS - 1) / 2) * 1.0;
        const z = (row - (ROWS - 1) / 2) * 1.65;
        const isFilled = idx < filledCount;
        const carColor = carColors[idx % carColors.length];
        return (
          <group key={idx}>
            <SlotMarking x={x} z={z} />
            {isFilled && <Car x={x} z={z} color={carColor} />}
          </group>
        );
      })}

      {/* Zone label (floor text via plane) */}
      <mesh position={[0, 0.003, -9]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[4, 0.6]} />
        <meshStandardMaterial color={accentColor} transparent opacity={0.15} />
      </mesh>
    </group>
  );
}

// ── Scene root ────────────────────────────────────────────────────────────────
interface Props {
  occupiedA: number; capacityA: number;
  occupiedB: number; capacityB: number;
}

export default function ParkingScene({ occupiedA, capacityA, occupiedB, capacityB }: Props) {
  return (
    <div className="w-full rounded-2xl overflow-hidden" style={{ height: 420, background: '#030812' }}>
      <Canvas
        shadows
        camera={{ position: [0, 18, 22], fov: 45 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.35} />
        <directionalLight position={[10, 20, 10]} intensity={1.2} castShadow
          shadow-mapSize-width={2048} shadow-mapSize-height={2048} />
        <directionalLight position={[-8, 12, -8]} intensity={0.4} color="#4488ff" />
        <hemisphereLight args={['#0a1428', '#000', 0.5]} />

        {/* Ground */}
        <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
          <planeGeometry args={[40, 40]} />
          <meshStandardMaterial color="#020409" roughness={1} />
        </mesh>

        {/* Lot A (left) */}
        <ParkingLot
          occupied={occupiedA} capacity={capacityA}
          offsetX={-6.5} color="#1a6fff" accentColor="#6366f1"
          label="A"
        />

        {/* Separator */}
        <mesh position={[0, 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.5, 17]} />
          <meshStandardMaterial color="#ffffff" transparent opacity={0.04} />
        </mesh>

        {/* Lot B (right) */}
        <ParkingLot
          occupied={occupiedB} capacity={capacityB}
          offsetX={6.5} color="#22c55e" accentColor="#10b981"
          label="B"
        />

        {/* Controls — drag only, no zoom */}
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 2.2}
          rotateSpeed={0.6}
        />
      </Canvas>
    </div>
  );
}

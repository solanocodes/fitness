import { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { motion } from 'framer-motion';
import * as THREE from 'three';

function MorphingMesh() {
  const meshRef = useRef<THREE.Mesh>(null);
  const geo = useMemo(() => new THREE.IcosahedronGeometry(2.2, 4), []);

  const originalPositions = useMemo(() => {
    return new Float32Array(geo.attributes.position.array);
  }, [geo]);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const time = clock.getElapsedTime() * 0.3;
    const positions = geo.attributes.position.array as Float32Array;

    for (let i = 0; i < positions.length; i += 3) {
      const ox = originalPositions[i];
      const oy = originalPositions[i + 1];
      const oz = originalPositions[i + 2];
      const noise =
        Math.sin(ox * 1.5 + time) * 0.15 +
        Math.cos(oy * 1.5 + time * 0.8) * 0.15 +
        Math.sin(oz * 1.5 + time * 0.6) * 0.1;
      positions[i] = ox + ox * noise;
      positions[i + 1] = oy + oy * noise;
      positions[i + 2] = oz + oz * noise;
    }

    geo.attributes.position.needsUpdate = true;
    geo.computeVertexNormals();
    meshRef.current.rotation.y = time * 0.15;
    meshRef.current.rotation.x = Math.sin(time * 0.1) * 0.1;
  });

  return (
    <mesh ref={meshRef} geometry={geo}>
      <meshBasicMaterial color="#c8f135" wireframe opacity={0.12} transparent />
    </mesh>
  );
}

interface Props {
  score: number;
  bfScore: number;
  weightScore: number;
  smmScore: number;
  consistencyScore: number;
}

function ScoreArc({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 90;
  const offset = circumference - (score / 100) * circumference;

  return (
    <svg width="220" height="220" viewBox="0 0 200 200" className="absolute">
      {/* Background arc */}
      <circle
        cx="100"
        cy="100"
        r="90"
        fill="none"
        stroke="#2a2a2a"
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* Score arc */}
      <motion.circle
        cx="100"
        cy="100"
        r="90"
        fill="none"
        stroke="#c8f135"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ type: 'spring', stiffness: 40, damping: 15, delay: 0.3 }}
        transform="rotate(-90 100 100)"
        style={{
          filter: 'drop-shadow(0 0 8px rgba(200, 241, 53, 0.5)) drop-shadow(0 0 20px rgba(200, 241, 53, 0.2))',
        }}
      />
    </svg>
  );
}

function BreakdownBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="label-caps w-24 text-right">{label}</span>
      <div className="flex-1 h-1 bg-border rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ type: 'spring', stiffness: 50, damping: 15, delay: 0.5 }}
        />
      </div>
      <span className="font-bebas text-sm text-text-muted w-8">{value}</span>
    </div>
  );
}

function AnimatedNumber({ value, delay = 0 }: { value: number; delay?: number }) {
  return (
    <motion.span
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay, ease: 'easeOut' }}
    >
      <CountUp target={value} />
    </motion.span>
  );
}

function CountUp({ target }: { target: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const counted = useRef(false);

  useFrame(() => {
    // This won't work outside Canvas, handled in parent
  });

  // Use simple animation for the count
  return <span ref={ref}>{target}</span>;
}

function Safe3DBackground() {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  try {
    return (
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }} onError={() => setFailed(true)}>
        <ambientLight intensity={0.5} />
        <MorphingMesh />
      </Canvas>
    );
  } catch {
    return null;
  }
}

export default function ForgeScoreHero({ score, bfScore, weightScore, smmScore, consistencyScore }: Props) {
  const s = Number(score) || 0;
  const bf = Number(bfScore) || 0;
  const w = Number(weightScore) || 0;
  const sm = Number(smmScore) || 0;
  const c = Number(consistencyScore) || 0;

  return (
    <div className="relative w-full">
      {/* 3D Background — covers only the score area */}
      <div className="absolute inset-0 h-[280px]">
        <Safe3DBackground />
      </div>

      {/* Spotlight gradient overlay */}
      <div className="absolute inset-0 h-[280px] bg-gradient-to-b from-bg/40 via-bg/60 to-bg pointer-events-none" />

      {/* Radial spotlight */}
      <div
        className="absolute inset-0 h-[280px] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 40%, rgba(200,241,53,0.06) 0%, transparent 60%)',
        }}
      />

      {/* Score Content */}
      <div className="relative z-10 flex flex-col items-center pt-6 pb-4">
        <motion.span
          className="label-caps-lg mb-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          style={{ letterSpacing: '5px' }}
        >
          FORGE SCORE
        </motion.span>

        <div className="relative flex items-center justify-center" style={{ width: 220, height: 220 }}>
          <ScoreArc score={s} />
          <motion.span
            className="font-bebas text-accent text-glow-lime"
            style={{ fontSize: '100px', lineHeight: 1 }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 100, damping: 15, delay: 0.2 }}
          >
            {s}
          </motion.span>
        </div>

        {/* Breakdown bars */}
        <motion.div
          className="w-full max-w-xs mt-4 space-y-1.5 px-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <BreakdownBar label="BODY FAT" value={bf} color="#c8f135" />
          <BreakdownBar label="WEIGHT" value={w} color="#c8f135" />
          <BreakdownBar label="MUSCLE" value={sm} color="#c8f135" />
          <BreakdownBar label="CONSISTENCY" value={c} color="#c8f135" />
        </motion.div>
      </div>
    </div>
  );
}

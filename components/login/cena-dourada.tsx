"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import type { Mesh } from "three";

function Aro() {
  const ref = useRef<Mesh>(null);
  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.rotation.x += delta * 0.05;
    ref.current.rotation.y += delta * 0.08;
  });

  return (
    <mesh ref={ref}>
      <torusGeometry args={[1.2, 0.01, 16, 140]} />
      <meshStandardMaterial color="#E7C87A" metalness={0.9} roughness={0.32} />
    </mesh>
  );
}

export default function CenaDourada() {
  return (
    <Canvas
      dpr={[1, 1.25]}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      camera={{ position: [0, 0, 4.6], fov: 36 }}
    >
      <ambientLight intensity={0.18} />
      <pointLight position={[2.4, 1.2, 2.8]} intensity={14} color="#F3D48A" />
      <pointLight position={[-2.2, -1.4, 1.2]} intensity={2.4} color="#FFF4D2" />
      <Aro />
    </Canvas>
  );
}

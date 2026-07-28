import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';

export default function Hero3DRollWrapper({ children }) {
  const containerRef = useRef(null);

  // Track scroll position of the Hero section as it exits the top of the viewport
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  // Ultra-fluid spring physics for smooth 60fps/120fps motion
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 90,
    damping: 24,
    restDelta: 0.001
  });

  // As the user scrolls down, the top of the Hero curves BACKWARDS into 3D depth:
  // 0.0 -> Top of page (Hero is completely flat, pristine & full scale)
  // 1.0 -> Hero exits top (rotateX -18deg, origin at top, translateZ -110px)
  const rotateX = useTransform(smoothProgress, [0, 1], [0, -18]);
  const translateZ = useTransform(smoothProgress, [0, 1], [0, -110]);
  const scale = useTransform(smoothProgress, [0, 1], [1, 0.95]);
  const opacity = useTransform(smoothProgress, [0, 0.85, 1], [1, 0.85, 0.35]);
  const shadowOpacity = useTransform(smoothProgress, [0, 1], [0, 0.5]);

  return (
    <div ref={containerRef} className="relative w-full [perspective:1400px] [transform-style:preserve-3d] overflow-hidden">
      <motion.div
        style={{
          rotateX,
          z: translateZ,
          scale,
          opacity,
          transformOrigin: "50% 0%",
          transformStyle: "preserve-3d",
          willChange: "transform, opacity"
        }}
        className="relative w-full"
      >
        {/* Parchment 3D Roll Depth Shadow Overlay */}
        <motion.div 
          style={{ opacity: shadowOpacity }}
          className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/10 to-transparent pointer-events-none z-30"
        />

        {children}
      </motion.div>
    </div>
  );
}

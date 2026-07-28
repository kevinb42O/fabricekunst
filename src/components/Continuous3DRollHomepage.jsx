import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';

// Individual section segment that rolls dynamically like an authentic 3D manuscript roll
export function RollSegment({ children, id = '', className = '' }) {
  const segmentRef = useRef(null);

  // Track scroll position of this section relative to the viewport
  const { scrollYProgress } = useScroll({
    target: segmentRef,
    offset: ["start end", "end start"]
  });

  // Fluid spring physics for ultra-smooth 60fps/120fps motion
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 85,
    damping: 24,
    restDelta: 0.001
  });

  // Authentic 3D Roll Curve Mathematics:
  // 1. Entering at bottom: unrolls from bottom cylinder (rotateX +15deg, origin at bottom)
  // 2. In center focal plane: perfectly flat (rotateX 0deg, translateZ 0px)
  // 3. Exiting at top: top edge curves BACKWARDS away into 3D depth (rotateX -20deg, origin at top, translateZ -120px)

  const rotateX = useTransform(smoothProgress, [0, 0.45, 0.75, 1], [14, 0, -10, -22]);
  const translateZ = useTransform(smoothProgress, [0, 0.45, 0.75, 1], [-40, 0, -40, -120]);
  const scale = useTransform(smoothProgress, [0, 0.45, 0.75, 1], [0.97, 1, 0.98, 0.94]);
  const transformOrigin = useTransform(
    smoothProgress, 
    [0, 0.45, 0.75, 1], 
    ["50% 100%", "50% 50%", "50% 20%", "50% 0%"]
  );

  // Roll depth shadow overlay: darkens the top edge as it rolls away into the 3D scroll background
  const topRollShadow = useTransform(smoothProgress, [0.65, 1], [0, 0.45]);

  return (
    <div ref={segmentRef} id={id} className="relative [transform-style:preserve-3d]">
      <motion.div
        style={{
          rotateX,
          z: translateZ,
          scale,
          transformOrigin,
          transformStyle: "preserve-3d",
          willChange: "transform"
        }}
        className={`relative w-full ${className}`}
      >
        {/* Top Roll Cylinder Depth Shadow (Darkens as section curves backward over the top roll) */}
        <motion.div 
          style={{ opacity: topRollShadow }}
          className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/10 to-transparent pointer-events-none z-30"
        />

        {children}
      </motion.div>
    </div>
  );
}

export default function Continuous3DRollHomepage({ children }) {
  return (
    <div className="relative w-full [perspective:1400px] [transform-style:preserve-3d] bg-[#FAF7F2] overflow-x-hidden">
      
      {/* Top 3D Roll Cylinder Shadow & Highlight Accent (Fixed at top of viewport) */}
      <div className="fixed top-0 left-0 right-0 h-20 bg-gradient-to-b from-[#1C1A17]/25 via-[#B8860B]/8 to-transparent pointer-events-none z-40 border-t border-[#B8860B]/20" />

      {/* Bottom 3D Roll Cylinder Shadow Accent (Fixed at bottom of viewport) */}
      <div className="fixed bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/15 via-transparent to-transparent pointer-events-none z-40" />

      {/* Continuous 3D Roll Stream */}
      <div className="relative w-full [transform-style:preserve-3d]">
        {children}
      </div>

    </div>
  );
}

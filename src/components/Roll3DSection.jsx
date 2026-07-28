import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';

export default function Roll3DSection({ children, className = '', id = '' }) {
  const containerRef = useRef(null);

  // Track scroll position of this section relative to the viewport
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  // Smooth spring physics for ultra-fluid 60fps/120fps motion
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 90,
    damping: 24,
    restDelta: 0.001
  });

  // 3D Roll Transformations:
  // Enters: tilted forward (+8 deg), scale 0.96, translateZ -50px
  // In Focus: 0 deg tilt, scale 1.0, translateZ 0px
  // Exits: rolls backward (-12 deg), scale 0.94, translateZ -90px (receding roll depth)
  const rotateX = useTransform(smoothProgress, [0, 0.3, 0.7, 1], [8, 0, 0, -12]);
  const scale = useTransform(smoothProgress, [0, 0.3, 0.7, 1], [0.96, 1, 1, 0.94]);
  const translateZ = useTransform(smoothProgress, [0, 0.3, 0.7, 1], [-50, 0, 0, -90]);
  const opacity = useTransform(smoothProgress, [0, 0.2, 0.8, 1], [0.4, 1, 1, 0.4]);

  // Roll depth shadow overlay as section rolls over the top edge
  const shadowOpacity = useTransform(smoothProgress, [0.65, 1], [0, 0.35]);

  return (
    <div 
      ref={containerRef} 
      id={id}
      className="relative [perspective:1200px] [transform-style:preserve-3d] py-3 sm:py-6"
    >
      <motion.div
        style={{
          rotateX,
          scale,
          z: translateZ,
          opacity,
          transformStyle: "preserve-3d",
          willChange: "transform, opacity"
        }}
        className={`relative transition-all duration-300 rounded-3xl ${className}`}
      >
        {/* Parchment Roll Gold Foil Top Glow Accent */}
        <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-[#B8860B]/12 via-[#B8860B]/3 to-transparent pointer-events-none rounded-t-3xl z-20 opacity-70" />

        {/* Dynamic 3D Roll Depth Shadow Overlay */}
        <motion.div 
          style={{ opacity: shadowOpacity }}
          className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/10 to-black/35 pointer-events-none rounded-3xl z-30"
        />

        {children}

        {/* Parchment Roll Bottom Edge Shadow */}
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/10 via-transparent to-transparent pointer-events-none rounded-b-3xl z-20" />
      </motion.div>
    </div>
  );
}

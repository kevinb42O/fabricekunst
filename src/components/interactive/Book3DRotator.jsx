import React, { useState, useRef } from 'react';

export default function Book3DRotator({ children, className = '', spineTitle = '' }) {
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Calculate normalized coordinates (-0.5 to 0.5)
    const xPct = (mouseX / width) - 0.5;
    const yPct = (mouseY / height) - 0.5;

    // Max rotation angles (degrees)
    const maxRotateY = 22; // Tilt left/right
    const maxRotateX = 18; // Tilt up/down

    setRotateY(xPct * maxRotateY * 2);
    setRotateX(-yPct * maxRotateX * 2);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotateX(0);
    setRotateY(0);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative perspective-1000 cursor-pointer select-none group ${className}`}
      style={{ perspective: '1200px' }}
    >
      <div
        className="w-full h-full transition-transform duration-300 ease-out transform-style-3d relative"
        style={{
          transform: isHovered
            ? `rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(25px) scale(1.02)`
            : 'rotateX(0deg) rotateY(0deg) translateZ(0px) scale(1)',
          transformStyle: 'preserve-3d',
          boxShadow: isHovered
            ? `${-rotateY * 1.2}px ${rotateX * 1.5 + 25}px 45px rgba(0, 0, 0, 0.65), 0 0 25px rgba(197, 160, 89, 0.2)`
            : '0 15px 35px rgba(0,0,0,0.5)',
        }}
      >
        {/* Main Content (Front Cover / Spine) */}
        {children}

        {/* 3D Spine Thickness Edge Effect */}
        <div
          className="absolute top-0 bottom-0 left-0 w-4 bg-gradient-to-r from-shagreen-dark via-gold-dark to-charcoal border-l border-gold/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{
            transform: 'translateX(-100%) rotateY(-90deg)',
            transformOrigin: 'right center',
          }}
        >
          {spineTitle && (
            <span className="text-[9px] font-serif font-bold text-parchment uppercase tracking-widest block whitespace-nowrap rotate-90 translate-y-12 opacity-80">
              {spineTitle}
            </span>
          )}
        </div>

        {/* Subtle Light Reflection Sheen Overlay */}
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none transition-opacity duration-500"
          style={{
            background: isHovered
              ? `radial-gradient(circle at ${50 + rotateY * 2}% ${50 - rotateX * 2}%, rgba(255,255,255,0.18) 0%, transparent 60%)`
              : 'none',
            opacity: isHovered ? 1 : 0,
          }}
        />
      </div>
    </div>
  );
}

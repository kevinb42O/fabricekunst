import React, { useState, useRef } from 'react';
import { Search } from 'lucide-react';

export default function MagnifierLens({ imageUrl, alt = "Detailopname", zoomLevel = 2.4, className = "" }) {
  const [showMagnifier, setShowMagnifier] = useState(false);
  const [lensPosition, setLensPosition] = useState({ x: 0, y: 0 });
  const [bgPosition, setBgPosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Constrain lens within image bounds
    const lensSize = 160;
    const clampedX = Math.max(lensSize / 2, Math.min(x, rect.width - lensSize / 2));
    const clampedY = Math.max(lensSize / 2, Math.min(y, rect.height - lensSize / 2));

    setLensPosition({ x: clampedX, y: clampedY });

    // Calculate background position percentages
    const bgX = (x / rect.width) * 100;
    const bgY = (y / rect.height) * 100;
    setBgPosition({ x: bgX, y: bgY });
  };

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setShowMagnifier(true)}
      onMouseLeave={() => setShowMagnifier(false)}
      onMouseMove={handleMouseMove}
      className={`relative overflow-hidden cursor-crosshair group ${className}`}
    >
      {/* Base Image */}
      <img
        src={imageUrl}
        alt={alt}
        className="w-full h-full object-cover transition-opacity duration-300"
      />

      {/* Floating Loupe Magnifier Lens */}
      {showMagnifier && (
        <div
          className="absolute pointer-events-none rounded-full border-2 border-gold shadow-luxury overflow-hidden transition-transform duration-75 z-30"
          style={{
            width: '160px',
            height: '160px',
            top: `${lensPosition.y - 80}px`,
            left: `${lensPosition.x - 80}px`,
            backgroundImage: `url("${imageUrl}")`,
            backgroundRepeat: 'no-repeat',
            backgroundSize: `${zoomLevel * 100}% ${zoomLevel * 100}%`,
            backgroundPosition: `${bgPosition.x}% ${bgPosition.y}%`,
            boxShadow: '0 0 0 3px rgba(11, 13, 18, 0.8), 0 0 25px rgba(197, 160, 89, 0.4), inset 0 0 20px rgba(0, 0, 0, 0.5)',
          }}
        >
          {/* Glass Lens Rim Shine */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/10 to-gold/20" />
          <div className="absolute bottom-2 inset-x-0 text-center">
            <span className="px-2 py-0.5 rounded-full bg-charcoal/90 text-[9px] font-mono text-gold border border-gold/40">
              Loupe {zoomLevel}x
            </span>
          </div>
        </div>
      )}

      {/* Static Indicator */}
      <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-charcoal/80 backdrop-blur-md border border-gold/30 text-[10px] font-mono text-gold-light uppercase tracking-wider opacity-80 flex items-center space-x-1">
        <Search className="w-3 h-3" />
        <span>Beweeg voor Loupe Inspectie</span>
      </div>
    </div>
  );
}

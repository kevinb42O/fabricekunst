import React, { useState } from 'react';

export default function FluidMarbledPaper({ imageUrl, alt = "Marmeren schutblad", className = "" }) {
  const [isHovered, setIsHovered] = useState(false);
  const filterId = React.useId().replace(/:/g, '');

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative overflow-hidden group cursor-pointer ${className}`}
    >
      {/* SVG Displacement Filter Definition */}
      <svg className="absolute w-0 h-0 pointer-events-none">
        <filter id={`fluid-filter-${filterId}`}>
          <feTurbulence
            type="fractalNoise"
            baseFrequency={isHovered ? "0.015 0.035" : "0.005 0.01"}
            numOctaves="3"
            result="noise"
          >
            {isHovered && (
              <animate
                attributeName="baseFrequency"
                dur="8s"
                values="0.015 0.035; 0.025 0.015; 0.015 0.035"
                repeatCount="indefinite"
              />
            )}
          </feTurbulence>
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale={isHovered ? "28" : "0"}
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </svg>

      {/* Marbled Image with SVG Filter applied on hover */}
      <img
        src={imageUrl}
        alt={alt}
        className="w-full h-full object-cover transition-all duration-700 ease-out"
        style={{
          filter: isHovered ? `url(#fluid-filter-${filterId}) contrast(1.1) brightness(1.05)` : 'none',
          transform: isHovered ? 'scale(1.04)' : 'scale(1)',
        }}
      />

      {/* Shimmer / Liquid Ripple Glow Overlay */}
      <div
        className={`absolute inset-0 bg-gradient-to-tr from-shagreen/20 via-gold/15 to-transparent transition-opacity duration-700 pointer-events-none ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Indicator Badge */}
      <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full bg-charcoal/90 backdrop-blur-md border border-gold/30 text-[10px] font-mono text-gold-light uppercase tracking-wider opacity-90 transition-all group-hover:border-gold">
        {isHovered ? '✦ Marmering Vloeit (Hovering)' : '✦ Handgemaakt Marmerpapier'}
      </div>
    </div>
  );
}

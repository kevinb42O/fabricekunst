import React from 'react';

/**
 * GallerySeal Component
 * Renders an official gold/bronze embossed seal emblem for Atelier Rembrandt / Fabrice Kunst & Boeken.
 */
export default function GallerySeal({ className = "w-28 h-28" }) {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      <svg 
        viewBox="0 0 200 200" 
        className="w-full h-full drop-shadow-md"
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Atelier Rembrandt Official Seal"
      >
        <defs>
          {/* Metallic Gold Gradient */}
          <linearGradient id="goldSealGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#DFBA6E" />
            <stop offset="25%" stopColor="#C5A059" />
            <stop offset="50%" stopColor="#E5C77E" />
            <stop offset="75%" stopColor="#A8813B" />
            <stop offset="100%" stopColor="#96702D" />
          </linearGradient>

          {/* Inner Shadow Filter */}
          <radialGradient id="innerGlow" cx="50%" cy="50%" r="50%">
            <stop offset="70%" stopColor="#FFF" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#000" stopOpacity="0.25" />
          </radialGradient>

          {/* Curved Text Path */}
          <path
            id="textPathTop"
            d="M 28,100 A 72,72 0 1,1 172,100"
          />
          <path
            id="textPathBottom"
            d="M 172,100 A 72,72 0 0,1 28,100"
          />
        </defs>

        {/* Outer Serrated Starburst / Crest Rim */}
        <g stroke="url(#goldSealGrad)" strokeWidth="1.5" fill="none">
          <circle cx="100" cy="100" r="95" strokeDasharray="3 3" opacity="0.8" />
          <circle cx="100" cy="100" r="92" strokeWidth="2" />
          <circle cx="100" cy="100" r="86" strokeWidth="1" strokeDasharray="6 2" />
        </g>

        {/* Outer Solid Ring */}
        <circle cx="100" cy="100" r="82" fill="url(#goldSealGrad)" />
        <circle cx="100" cy="100" r="82" fill="url(#innerGlow)" />

        {/* Inner Dark Bronze Core */}
        <circle cx="100" cy="100" r="66" fill="#1C1A18" stroke="url(#goldSealGrad)" strokeWidth="1.5" />
        <circle cx="100" cy="100" r="62" stroke="url(#goldSealGrad)" strokeWidth="0.8" strokeDasharray="2 2" opacity="0.7" />

        {/* Circular Engraved Text */}
        <text fill="url(#goldSealGrad)" fontSize="8.5" fontWeight="700" letterSpacing="2.2" className="font-serif uppercase">
          <textPath href="#textPathTop" startOffset="50%" textAnchor="middle">
            ATELIER REMBRANDT
          </textPath>
        </text>

        <text fill="url(#goldSealGrad)" fontSize="7.5" fontWeight="600" letterSpacing="1.8" className="font-serif uppercase">
          <textPath href="#textPathBottom" startOffset="50%" textAnchor="middle">
            ★ VERIFIED AUTHENTIC ★
          </textPath>
        </text>

        {/* Center Emblem Icon (Lion / Crown / Coat of Arms Graphic) */}
        <g transform="translate(68, 68) scale(0.32)" stroke="url(#goldSealGrad)" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          {/* Crown / Crest */}
          <path d="M 20 60 L 40 100 L 100 20 L 160 100 L 180 60 L 170 120 L 30 120 Z" fill="url(#goldSealGrad)" fillOpacity="0.2" />
          <circle cx="20" cy="50" r="6" fill="url(#goldSealGrad)" />
          <circle cx="100" cy="10" r="8" fill="url(#goldSealGrad)" />
          <circle cx="180" cy="50" r="6" fill="url(#goldSealGrad)" />
          <path d="M 50 140 L 150 140 L 140 165 L 100 180 L 60 165 Z" fill="url(#goldSealGrad)" fillOpacity="0.3" />
          {/* Star in Center */}
          <path d="M 100 135 L 105 150 L 120 150 L 108 160 L 112 175 L 100 165 L 88 175 L 92 160 L 80 150 L 95 150 Z" fill="url(#goldSealGrad)" />
        </g>

        {/* Fine Star Ornaments Left & Right */}
        <circle cx="34" cy="100" r="2.5" fill="url(#goldSealGrad)" />
        <circle cx="166" cy="100" r="2.5" fill="url(#goldSealGrad)" />
      </svg>
    </div>
  );
}

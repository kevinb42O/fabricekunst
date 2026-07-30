import React from 'react';

/**
 * GallerySeal Component
 * Renders an official gold/bronze embossed seal emblem for Atelier Rembrandt / Fabrice Kunst & Boeken.
 */
export default function GallerySeal({ className = "w-28 h-28", logoUrl = "/rblogo.png" }) {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      <svg 
        viewBox="0 0 200 200" 
        className="w-full h-full drop-shadow-md"
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Official Gallery Seal"
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
          <circle cx="100" cy="100" r="86" strokeWidth="1" strokeDasharray="6 2" opacity="0.7" />
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

        {/* Center Emblem: Official Company Logo */}
        <foreignObject x="54" y="54" width="92" height="92">
          <div className="w-full h-full flex items-center justify-center p-1">
            <img 
              src={logoUrl} 
              alt="Bedrijfslogo" 
              className="max-w-full max-h-full object-contain filter drop-shadow-md brightness-110"
              onError={(e) => {
                e.currentTarget.src = "/images/Atelier Rembrandt.png";
              }}
            />
          </div>
        </foreignObject>

        {/* SVG Image Fallback for Raw Canvas export */}
        <image 
          href={logoUrl} 
          x="54" 
          y="54" 
          width="92" 
          height="92" 
          preserveAspectRatio="xMidYMid meet"
          className="opacity-0 print:opacity-100"
        />

        {/* Fine Star Ornaments Left & Right */}
        <circle cx="34" cy="100" r="2.5" fill="url(#goldSealGrad)" />
        <circle cx="166" cy="100" r="2.5" fill="url(#goldSealGrad)" />
      </svg>
    </div>
  );
}

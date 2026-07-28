import React from 'react';

/**
 * FabriceSignature Component
 * Renders an authentic handwritten digital signature of Fabrice in SVG copperplate calligraphy format.
 */
export default function FabriceSignature({ className = "h-16 w-auto", color = "#1C1A18" }) {
  return (
    <svg 
      viewBox="0 0 420 160" 
      className={className} 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Fabrice Signature"
    >
      {/* Signature Path - Elegant Flowing Calligraphy for 'Fabrice' */}
      <g stroke={color} strokeLinecap="round" strokeLinejoin="round">
        {/* Capital 'F' stem and loop */}
        <path 
          d="M 45 42 C 45 42, 75 35, 110 38 C 120 39, 90 55, 60 70 C 50 75, 48 95, 52 115 C 55 130, 58 135, 54 138 C 50 141, 44 130, 48 110" 
          strokeWidth="3.2" 
        />
        {/* Capital 'F' crossbar flourish */}
        <path 
          d="M 30 72 C 55 68, 95 62, 115 65 C 130 67, 105 76, 85 82" 
          strokeWidth="2.8" 
        />
        {/* Upper flourish loop of F */}
        <path 
          d="M 70 36 C 85 22, 125 18, 140 28 C 148 34, 132 44, 110 45" 
          strokeWidth="2.0" 
        />

        {/* Lowercase 'a' */}
        <path 
          d="M 115 85 C 110 78, 122 75, 128 82 C 134 89, 130 98, 124 99 C 118 100, 114 92, 120 85 M 128 82 L 132 102" 
          strokeWidth="2.4" 
        />

        {/* Lowercase 'b' with tall ascending loop */}
        <path 
          d="M 132 102 C 138 98, 142 60, 150 48 C 156 38, 162 42, 158 58 L 150 102 C 150 102, 158 92, 168 94 C 174 95, 172 102, 166 102" 
          strokeWidth="2.5" 
        />

        {/* Lowercase 'r' */}
        <path 
          d="M 166 102 C 172 96, 178 92, 185 92 C 190 92, 188 102, 192 102" 
          strokeWidth="2.3" 
        />

        {/* Lowercase 'i' */}
        <path 
          d="M 192 102 C 196 95, 202 92, 206 102" 
          strokeWidth="2.4" 
        />
        {/* Dot on 'i' */}
        <circle cx="204" cy="80" r="1.8" fill={color} />

        {/* Lowercase 'c' */}
        <path 
          d="M 216 94 C 212 92, 208 96, 208 100 C 208 104, 214 105, 220 101" 
          strokeWidth="2.3" 
        />

        {/* Lowercase 'e' */}
        <path 
          d="M 220 101 C 228 92, 234 94, 230 102 C 226 108, 220 106, 235 102" 
          strokeWidth="2.4" 
        />

        {/* Grand Sweeping Underline Flourish */}
        <path 
          d="M 55 125 C 90 135, 170 148, 260 132 C 320 120, 365 95, 385 80 C 395 72, 380 68, 360 82 C 340 96, 290 128, 220 142 C 180 150, 130 150, 95 142" 
          strokeWidth="2.2" 
        />

        {/* Small authentic ink splatter accents */}
        <circle cx="370" cy="115" r="1.2" fill={color} opacity="0.7" />
        <circle cx="376" cy="119" r="0.8" fill={color} opacity="0.6" />
      </g>
    </svg>
  );
}
